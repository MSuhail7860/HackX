export interface Transaction {
    transaction_id: string;
    sender_id: string;
    receiver_id: string;
    amount: number;
    timestamp: string; // ISO string
}

export type FraudPatternType = 'CYCLE' | 'FAN_IN' | 'FAN_OUT' | 'LAYERED_SHELL';

export interface FraudRing {
    ring_id: string;
    pattern_type: FraudPatternType;
    risk_score: number;
    member_ids: string[]; // List of Account IDs involved
    details: string;
}

export interface AccountNode {
    id: string;
    risk_score: number;
    flagged: boolean;
    patterns: FraudPatternType[];
    ring_ids: string[];

    // Metrics
    in_degree: number;
    out_degree: number;
    total_in_volume: number;
    total_out_volume: number;

    // For Temporal/Shell Analysis
    transactions: Transaction[]; // References to relevant txs
}

export interface AnalysisSummary {
    total_transactions: number;
    total_accounts: number;
    flagged_accounts: number;
    total_volume: number;
    processing_time_ms: number;
}

export interface AnalysisResult {
    transactions: Transaction[];
    suspicious_accounts: AccountNode[];
    fraud_rings: FraudRing[];
    summary: AnalysisSummary;
}

export interface SuspiciousAccountOutput {
    account_id: string;
    suspicion_score: number;
    detected_patterns: FraudPatternType[];
    ring_id: string[];
}
