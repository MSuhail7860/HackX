import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define interfaces if Prisma types are not yet generated
interface Transaction {
    id: string;
    sourceAccountId: string;
    targetAccountId: string;
    amount: number;
    timestamp: Date;
}

interface SmurfingPattern {
    targetAccountId: string;
    totalIncoming: number;
    distinctSources: number;
    consolidationTransfer?: Transaction;
    suspicionScore: number;
    timeWindowStart: Date;
    timeWindowEnd: Date;
}

/**
 * Detects 'Smurfing' (Structuring) patterns in financial transactions.
 *
 * ## Graph Theory Logic:
 * This algorithm identifies a specific temporal motif in the transaction graph:
 *
 * 1. **Fan-in (Indegree Centrality)**:
 *    - The target account acts as a 'hub' with high indegree from *distinct* source nodes.
 *    - In Smurfing, these edges have low weights (small amounts, e.g., < $10,000 or specific thresholds like $500).
 *
 * 2. **Flow Conservation (approximate)**:
 *    - The total weighted inflow ($\sum W_{in}$) allows for a subsequent high-weighted outflow ($W_{out}$).
 *    - $W_{out} \approx \sum W_{in}$ (minus fees or small remainder).
 *
 * 3. **Temporal Constraint ($\Delta t$)**:
 *    - The consolidation (outflow) happens within a short window after the fan-in (inflows).
 *    - Edges $(u_i, v)$ at time $t_i$ and edge $(v, w)$ at time $t_{out}$ where $t_{out} - \min(t_i) \le 24h$.
 *
 * @param windowHours - The time window to analyze (default: 24 hours).
 * @param smallTransferThreshold - Maximum amount for a "small" incoming transfer (default: 500).
 * @param minSources - Minimum number of distinct sources to constitute a "fan-in" (default: 3).
 * @param consolidationThreshold - Minimum % of total incoming funds that must be transferred out (default: 0.90).
 */
export async function detectSmurfing(
    windowHours: number = 24,
    smallTransferThreshold: number = 500,
    minSources: number = 3,
    consolidationThreshold: number = 0.90
): Promise<SmurfingPattern[]> {
    // 1. Define the time window
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - windowHours * 60 * 60 * 1000);

    // 2. Query potential "Fan-in" accounts (High Indegree of small transactions)
    // Find accounts receiving multiple small transfers from distinct sources
    const potentialSmurfs = await prisma.transaction.groupBy({
        by: ['targetAccountId'],
        where: {
            timestamp: {
                gte: startDate,
                lte: endDate,
            },
            amount: {
                lt: smallTransferThreshold,
            },
        },
        having: {
            sourceAccountId: {
                _count: {
                    gte: minSources,
                },
            },
            amount: {
                _sum: {
                    gt: 0,
                }
            }
        },
        _count: {
            sourceAccountId: true,
        },
        _sum: {
            amount: true,
        },
    });

    const patterns: SmurfingPattern[] = [];

    // 3. Analyze each candidate for "Consolidation" (High Outdegree or Large Outflow)
    for (const candidate of potentialSmurfs) {
        const totalIncoming = candidate._sum.amount || 0;
        const accountId = candidate.targetAccountId;

        // Check for a large outgoing transfer (Consolidation)
        // We look for a SINGLE large transfer or aggregate outflow close to the incoming sum
        // For "Structuring", it's often one large exit.
        const outgoingTransactions = await prisma.transaction.findMany({
            where: {
                sourceAccountId: accountId,
                timestamp: {
                    gte: startDate, // Could be refined to be strictly AFTER the incoming ones
                },
                amount: {
                    gte: totalIncoming * consolidationThreshold, // Must move most of the money
                },
            },
            orderBy: {
                amount: 'desc',
            },
            take: 1, // Look for the single largest consolidation
        });

        const consolidationTransfer = outgoingTransactions[0];

        if (consolidationTransfer) {
            patterns.push({
                targetAccountId: accountId,
                totalIncoming,
                distinctSources: candidate._count.sourceAccountId,
                consolidationTransfer,
                suspicionScore: calculateSuspicionScore(candidate._count.sourceAccountId, totalIncoming),
                timeWindowStart: startDate,
                timeWindowEnd: endDate,
            });
        }
    }

    return patterns;
}

/**
 * Calculates a suspicion score based on graph metrics.
 * Higher fan-in (indegree) increases the score.
 */
function calculateSuspicionScore(fanInCount: number, totalAmount: number): number {
    // Simple heuristic: Base score + (fan-in * multiplier)
    // In a real graph system, we might use PageRank or HITS authority/hub scores.
    return (fanInCount * 10) + (totalAmount / 1000);
}
