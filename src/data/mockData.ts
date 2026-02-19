
import { AnalysisResult, Transaction } from '../types/index';
import { AnalysisEngine } from '../engine/AnalysisEngine';

export const generateMockTransactions = (count: number = 1000): Transaction[] => {
    const transactions: Transaction[] = [];
    const accounts = Array.from({ length: Math.floor(count / 5) }, (_, i) => `ACC-${1000 + i}`);

    // Create Normal Traffic
    for (let i = 0; i < count; i++) {
        const sender = accounts[Math.floor(Math.random() * accounts.length)];
        let receiver = accounts[Math.floor(Math.random() * accounts.length)];
        while (receiver === sender) receiver = accounts[Math.floor(Math.random() * accounts.length)];

        transactions.push({
            transaction_id: `TX-${Date.now()}-${i}`,
            sender_id: sender,
            receiver_id: receiver,
            amount: parseFloat((Math.random() * 1000).toFixed(2)),
            timestamp: new Date().toISOString()
        });
    }

    // Inject FRAUD: Cycle (A -> B -> C -> A)
    const cycleNodes = ['FRAUD-A', 'FRAUD-B', 'FRAUD-C', 'FRAUD-D'];
    transactions.push(
        { transaction_id: 'CYC-1', sender_id: cycleNodes[0], receiver_id: cycleNodes[1], amount: 5000, timestamp: new Date().toISOString() },
        { transaction_id: 'CYC-2', sender_id: cycleNodes[1], receiver_id: cycleNodes[2], amount: 4800, timestamp: new Date().toISOString() },
        { transaction_id: 'CYC-3', sender_id: cycleNodes[2], receiver_id: cycleNodes[3], amount: 4600, timestamp: new Date().toISOString() },
        { transaction_id: 'CYC-4', sender_id: cycleNodes[3], receiver_id: cycleNodes[0], amount: 4500, timestamp: new Date().toISOString() }
    );

    // Inject FRAUD: Fan-In (Smurfing)
    const mule = 'MULE-MAIN';
    for (let i = 0; i < 12; i++) {
        transactions.push({
            transaction_id: `SMURF-IN-${i}`,
            sender_id: `SMURF-SRC-${i}`,
            receiver_id: mule,
            amount: 400, // Small amount
            timestamp: new Date().toISOString()
        });
    }
    // Fan-Out
    transactions.push({
        transaction_id: `SMURF-EXIT`,
        sender_id: mule,
        receiver_id: 'OFFSHORE-ACC',
        amount: 4500,
        timestamp: new Date().toISOString()
    });

    return transactions;
};

// Pre-calculated result for instant loading
const engine = new AnalysisEngine();
export const mockAnalysisData: AnalysisResult = engine.runAnalysis(generateMockTransactions(500));
