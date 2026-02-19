
export interface Node {
    id: string;
    type: 'high-risk' | 'mule' | 'clean';
    val: number; // Size
    centrality: number; // Mock Betweenness Centrality
    label?: string;
}

export interface Link {
    source: string;
    target: string;
    amount: number;
}

export interface GraphData {
    nodes: Node[];
    links: Link[];
}

export const generateFraudNetwork = (nodeCount: number = 50): GraphData => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    const nodeTypes = ['clean', 'mule', 'high-risk'] as const;

    // Create Nodes
    for (let i = 0; i < nodeCount; i++) {
        // Distribution: 70% Clean, 20% Mule, 10% High-Risk
        const rand = Math.random();
        let type: 'clean' | 'mule' | 'high-risk' = 'clean';
        if (rand > 0.7) type = 'mule';
        if (rand > 0.9) type = 'high-risk';

        nodes.push({
            id: `node-${i}`,
            type,
            val: type === 'high-risk' ? 20 : type === 'mule' ? 10 : 5,
            centrality: Math.random(), // Mock value between 0-1
            label: type.toUpperCase(),
        });
    }

    // Create Links (Smurfing / Fan-in Patterns)
    // Clean -> Mule -> High-Risk
    const cleanNodes = nodes.filter((n) => n.type === 'clean');
    const muleNodes = nodes.filter((n) => n.type === 'mule');
    const riskNodes = nodes.filter((n) => n.type === 'high-risk');

    // Connect Clean to Mules (Fan-in)
    cleanNodes.forEach((clean) => {
        // Connect to 1-2 random mules
        const targets = muleNodes.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 1);
        targets.forEach((mule) => {
            links.push({
                source: clean.id,
                target: mule.id,
                amount: Math.floor(Math.random() * 500) + 100,
            });
        });
    });

    // Connect Mules to High-Risk (Consolidation)
    muleNodes.forEach((mule) => {
        // Connect to 1 random high-risk
        if (riskNodes.length > 0) {
            const target = riskNodes[Math.floor(Math.random() * riskNodes.length)];
            links.push({
                source: mule.id,
                target: target.id,
                amount: Math.floor(Math.random() * 5000) + 2000,
            });
        }
    });

    return { nodes, links };
};
