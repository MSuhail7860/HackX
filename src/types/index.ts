
export interface Transaction {
    transaction_id: string;
    sender_id: string;
    receiver_id: string;
    amount: number;
    timestamp: string; // ISO String
}

export type FraudPatternType = 'CYCLE' | 'FAN_IN' | 'FAN_OUT' | 'LAYERED_SHELL' | 'HIGH_RISK_MERCHANT';

export interface FraudRing {
    ring_id: string;
    pattern_type: FraudPatternType;
    risk_score: number;
    member_ids: string[];
    details?: string; // e.g., "Cycle of length 4"
}

export interface AccountNode {
    id: string; // account_id
    risk_score: number; // 0-100
    flagged: boolean;
    patterns: FraudPatternType[];
    ring_ids: string[];

    // Graph MEtrics
    in_degree: number;
    out_degree: number;
    total_in_volume: number;
    total_out_volume: number;
}

export interface AnalysisResult {
    transactions: Transaction[];
    suspicious_accounts: AccountNode[];
    fraud_rings: FraudRing[];
    summary: {
        total_transactions: number;
        total_accounts: number;
        flagged_accounts: number;
        total_volume: number;
        processing_time_ms: number;
    };
}
