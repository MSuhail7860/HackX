
import { Transaction, AccountNode, FraudRing, AnalysisResult, FraudPatternType } from '../types';

export class AnalysisEngine {
    private adjacencyList: Map<string, string[]>;
    private nodes: Map<string, AccountNode>;
    private transactions: Transaction[];

    constructor() {
        this.adjacencyList = new Map();
        this.nodes = new Map();
        this.transactions = [];
    }

    public runAnalysis(transactions: Transaction[]): AnalysisResult {
        const startTime = performance.now();
        this.reset();
        // Sort by timestamp for temporal analysis
        this.transactions = [...transactions].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // 1. Build Graph
        this.buildGraph();

        // 2. Identify High-Volume Merchants (False Positive Control)
        // If > 1000 txs (simple heuristic) OR labeled whitelist (none for now)
        // We'll mark them to skip risk scoring later, or filter them out of rings.
        const highVolumeAccounts = new Set<string>();
        for (const [id, node] of this.nodes) {
            if (node.in_degree + node.out_degree > 1000) { // Threshold per specs? Specs say "High-Volume", typically > 1000 or similar.
                highVolumeAccounts.add(id);
            }
        }

        // 3. Pattern Detection
        const cycles = this.detectCycles(3, 5);
        const smurfingRings = this.detectSmurfing();
        const shells = this.detectLayeredShells();

        const allRings = [...cycles, ...smurfingRings, ...shells];

        // 4. Score Accounts
        this.calculateRiskScores(allRings, highVolumeAccounts);

        // 5. Compile Results
        const suspiciousAccounts = Array.from(this.nodes.values())
            .filter(node => node.risk_score > 0)
            .sort((a, b) => b.risk_score - a.risk_score);

        const endTime = performance.now();

        return {
            transactions: this.transactions,
            suspicious_accounts: suspiciousAccounts,
            fraud_rings: allRings,
            summary: {
                total_transactions: this.transactions.length,
                total_accounts: this.nodes.size,
                flagged_accounts: suspiciousAccounts.length,
                total_volume: this.transactions.reduce((acc, t) => acc + t.amount, 0),
                processing_time_ms: endTime - startTime
            }
        };
    }

    private reset() {
        this.adjacencyList.clear();
        this.nodes.clear();
        this.transactions = [];
    }

    private buildGraph() {
        this.transactions.forEach(tx => {
            this.ensureNode(tx.sender_id);
            this.ensureNode(tx.receiver_id);

            // Add Edge
            if (!this.adjacencyList.has(tx.sender_id)) {
                this.adjacencyList.set(tx.sender_id, []);
            }
            this.adjacencyList.get(tx.sender_id)?.push(tx.receiver_id);

            // Metrics
            const sender = this.nodes.get(tx.sender_id)!;
            sender.out_degree++;
            sender.total_out_volume += tx.amount;
            sender.transactions.push(tx); // Store for temporal access

            const receiver = this.nodes.get(tx.receiver_id)!;
            receiver.in_degree++;
            receiver.total_in_volume += tx.amount;
            receiver.transactions.push(tx);
        });
    }

    private ensureNode(id: string) {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, {
                id,
                risk_score: 0,
                flagged: false,
                patterns: [],
                ring_ids: [],
                in_degree: 0,
                out_degree: 0,
                total_in_volume: 0,
                total_out_volume: 0,
                transactions: []
            });
        }
    }

    // --- 1. CIRCULAR ROUTING (DFS) ---
    private detectCycles(minLength: number, maxLength: number): FraudRing[] {
        const rings: FraudRing[] = [];
        const path: string[] = [];
        const visitedInCurrentPath = new Set<string>();
        // To optimize and avoid checking same cycle multiple times, we can use a global set of visited *starts* 
        // or just rely on the fact that we clear `visitedInCurrentPath` for each DFS run.
        // For performance on 10k nodes, we can limit the search or use a global visited set if we only care about unique components.
        // However, standard DFS for all simple cycles is expensive. We'll use a limited depth approach.

        const dfs = (curr: string, start: string, depth: number) => {
            if (depth > maxLength) return;

            visitedInCurrentPath.add(curr);
            path.push(curr);

            const neighbors = this.adjacencyList.get(curr) || [];

            for (const neighbor of neighbors) {
                if (neighbor === start && depth >= minLength) {
                    // Cycle Found
                    const ringId = `CYCLE-${Math.random().toString(36).substr(2, 6)}`;
                    rings.push({
                        ring_id: ringId,
                        pattern_type: 'CYCLE',
                        risk_score: 80 + (depth * 2), // Longer cycles might be more sophisticated? Or shorter = tighter? Let's say high.
                        member_ids: [...path],
                        details: `Circular flow detected length ${depth}`
                    });
                } else if (!visitedInCurrentPath.has(neighbor)) {
                    dfs(neighbor, start, depth + 1);
                }
            }

            // Backtrack
            visitedInCurrentPath.delete(curr);
            path.pop();
        };

        // We run DFS from each node. 
        // Optimization: Only run for nodes with out_degree > 0 and in_degree > 0
        for (const [id, node] of this.nodes) {
            if (node.out_degree > 0 && node.in_degree > 0) {
                dfs(id, id, 1);
            }
        }

        return this.deduplicateRings(rings);
    }

    // --- 2. SMURFING (Fan-in/Fan-out within 72h) ---
    private detectSmurfing(): FraudRing[] {
        const rings: FraudRing[] = [];
        const THRESHOLD = 10;
        const WINDOW_MS = 72 * 60 * 60 * 1000;

        for (const [id, node] of this.nodes) {
            // Fan-Out: 1 Sender -> Many Receivers
            if (node.out_degree >= THRESHOLD) {
                const outTxs = node.transactions.filter(t => t.sender_id === id);
                // Sort by time is already done globally, but let's ensure these are sub-sorted if needed (they should be)
                // Sliding window
                for (let i = 0; i < outTxs.length; i++) {
                    let count = 1;
                    const receivers = new Set<string>();
                    receivers.add(outTxs[i].receiver_id);

                    const startTime = new Date(outTxs[i].timestamp).getTime();

                    for (let j = i + 1; j < outTxs.length; j++) {
                        const currTime = new Date(outTxs[j].timestamp).getTime();
                        if (currTime - startTime <= WINDOW_MS) {
                            receivers.add(outTxs[j].receiver_id);
                            count++;
                        } else {
                            break; // Sorted, so we can stop
                        }
                    }

                    if (receivers.size >= THRESHOLD) {
                        const ringId = `SMURF-OUT-${id.substring(0, 4)}-${Math.random().toString(36).substr(2, 4)}`;
                        rings.push({
                            ring_id: ringId,
                            pattern_type: 'FAN_OUT',
                            risk_score: 75,
                            member_ids: [id, ...Array.from(receivers)],
                            details: `Fan-Out: ${receivers.size} recipients in 72h`
                        });
                        // Skip ahead to avoid overlapping windows for same event? 
                        // Simplified: just break for this node to avoid duplicate bursts
                        break;
                    }
                }
            }

            // Fan-In: Many Senders -> 1 Receiver
            if (node.in_degree >= THRESHOLD) {
                const inTxs = node.transactions.filter(t => t.receiver_id === id);
                for (let i = 0; i < inTxs.length; i++) {
                    const senders = new Set<string>();
                    senders.add(inTxs[i].sender_id);
                    const startTime = new Date(inTxs[i].timestamp).getTime();

                    for (let j = i + 1; j < inTxs.length; j++) {
                        const currTime = new Date(inTxs[j].timestamp).getTime();
                        if (currTime - startTime <= WINDOW_MS) {
                            senders.add(inTxs[j].sender_id);
                        } else {
                            break;
                        }
                    }

                    if (senders.size >= THRESHOLD) {
                        const ringId = `SMURF-IN-${id.substring(0, 4)}-${Math.random().toString(36).substr(2, 4)}`;
                        rings.push({
                            ring_id: ringId,
                            pattern_type: 'FAN_IN',
                            risk_score: 75,
                            member_ids: [id, ...Array.from(senders)],
                            details: `Fan-In: ${senders.size} senders in 72h`
                        });
                        break;
                    }
                }
            }
        }
        return rings;
    }

    // --- 3. LAYERED SHELLS (Chain A->B->C with low volume intermediates) ---
    private detectLayeredShells(): FraudRing[] {
        const rings: FraudRing[] = [];
        // A (any) -> B (2-3 txs) -> C (2-3 txs) -> D (any)
        // DFS looking for such paths

        const isShell = (id: string) => {
            const n = this.nodes.get(id);
            if (!n) return false;
            const total = n.in_degree + n.out_degree;
            return total >= 2 && total <= 3;
        };

        const dfsShell = (curr: string, path: string[]) => {
            // If path length >= 4 (3 hops: A->B->C->D)
            // And intermediates are shells
            if (path.length >= 4) {
                // Check if intermediates are shells
                // Path: [A, B, C, D] -> B and C must be shells
                // We only check the LAST added segment to validate the chain so far?
                // Actually, we want specific structure: Shell -> Shell
                // Let's strictly look for A -> Shell -> Shell -> ...

                // Simpler: Just look for chains of length 3+ where middle nodes are shells

                // If we are deep enough, check structure
                const intermediates = path.slice(1, path.length - 1);
                const allShells = intermediates.every(mid => isShell(mid));

                if (intermediates.length >= 2 && allShells) {
                    // Found a layering chain
                    const ringId = `SHELL-${Math.random().toString(36).substr(2, 6)}`;
                    rings.push({
                        ring_id: ringId,
                        pattern_type: 'LAYERED_SHELL',
                        risk_score: 60 + (path.length * 5),
                        member_ids: [...path],
                        details: `Layering chain length ${path.length}`
                    });
                    return; // Don't extend this specific chain infinitely, just catch the segment
                }
            }

            // Limit depth to avoid explosion
            if (path.length > 6) return;

            const neighbors = this.adjacencyList.get(curr) || [];
            for (const neighbor of neighbors) {
                if (!path.includes(neighbor)) {
                    // Optimized pruning: only continue if NEXT node is a shell OR if we are at the end of a shell chain
                    // If current is a shell, next can be anything (end of chain) or shell
                    // If current is NOT a shell (start), next MUST be a shell to start a layering chain

                    const currIsShell = isShell(curr);
                    const neighborIsShell = isShell(neighbor);

                    if (path.length === 1) {
                        // A -> B. B must be shell to potentially start layer
                        if (neighborIsShell) dfsShell(neighbor, [...path, neighbor]);
                    } else {
                        // ... -> Current -> Neighbor
                        // If Current was Shell, Neighbor can be anything (to end chain) or Shell (to continue)
                        // But we want to enforce long chains.
                        dfsShell(neighbor, [...path, neighbor]);
                    }
                }
            }
        };

        for (const [id, node] of this.nodes) {
            // Start detection
            // We start from any node that has outgoing edges
            if (node.out_degree > 0) {
                dfsShell(id, [id]);
            }
        }

        return this.deduplicateRings(rings);
    }

    // --- UTILS ---

    private deduplicateRings(rings: FraudRing[]): FraudRing[] {
        const unique: FraudRing[] = [];
        const signatures = new Set<string>();

        rings.forEach(r => {
            const sig = r.member_ids.slice().sort().join('|') + r.pattern_type;
            if (!signatures.has(sig)) {
                signatures.add(sig);
                unique.push(r);
            }
        });
        return unique;
    }

    private calculateRiskScores(rings: FraudRing[], highVolumeAccounts: Set<string>) {
        // Map rings to nodes
        rings.forEach(ring => {
            ring.member_ids.forEach(id => {
                if (highVolumeAccounts.has(id)) return; // Skip Whitelisted

                const node = this.nodes.get(id);
                if (node) {
                    node.patterns.push(ring.pattern_type);
                    node.ring_ids.push(ring.ring_id);
                    node.risk_score += (ring.risk_score / 2); // Accumulate risk, but dampen
                    if (node.risk_score > 100) node.risk_score = 100;
                    node.flagged = true;
                }
            });
        });

        // Normalize or Cap patterns? 
        // Unique patterns increase score
        for (const node of this.nodes.values()) {
            const uniquePatterns = new Set(node.patterns).size;
            if (uniquePatterns > 1) {
                node.risk_score += 20; // Bonus for multi-modal fraud
            }
            if (node.risk_score > 100) node.risk_score = 100;
        }
    }
}
