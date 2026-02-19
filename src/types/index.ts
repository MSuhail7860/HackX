export interface Transaction {
    transaction_id: string;
    sender_id: string;
    receiver_id: string;
    amount: number;
    timestamp: string; // ISO string YYYY-MM-DD HH:MM:SS
}

export type FraudPatternType = 'CYCLE' | 'FAN_IN' | 'FAN_OUT' | 'LAYERED_SHELL';

export interface FraudRing {
    ring_id: string;
    pattern_type: FraudPatternType;
    risk_score: number;
    member_ids: string[]; // Internal usage
    member_accounts: string[]; // For export schema: member_accounts[]
    details: string;
    total_volume: number; // New metric for Explainability
}

export interface AccountNode {
    id: string;
    risk_score: number; // 0-100 suspcion_score
    flagged: boolean;
    patterns: FraudPatternType[]; // detected_patterns[]
    ring_ids: string[]; // ring_id (array to cover multiple)

    // Metrics
    in_degree: number;
    out_degree: number;
    total_in_volume: number;
    total_out_volume: number;
    centrality: number; // Betweenness Centrality (0-1)

    // For Temporal/Shell Analysis
    transactions: Transaction[];
}

export interface AnalysisSummary {
    total_accounts_analyzed: number;
    suspicious_accounts_flagged: number;
    fraud_rings_detected: number;
    processing_time_seconds: number;
    total_transactions: number; // Keep internal metric if needed, but export strict schema only
    total_volume: number;
    total_whitelisted_accounts: number; // New metric
}

export interface AnalysisResult {
    transactions: Transaction[];
    suspicious_accounts: AccountNode[];
    fraud_rings: FraudRing[];
    summary: AnalysisSummary;
}

// Strict Export Schema Types
export interface ExportSuspiciousAccount {
    account_id: string;
    suspicion_score: number;
    detected_patterns: FraudPatternType[];
    ring_id: string[]; // or string if singular required, array safer for M:N
}

export interface ExportFraudRing {
    ring_id: string;
    member_accounts: string[];
    pattern_type: FraudPatternType;
    risk_score: number;
}

export interface ExportSummary {
    total_accounts_analyzed: number;
    suspicious_accounts_flagged: number;
    fraud_rings_detected: number;
    processing_time_seconds: number;
    total_whitelisted_accounts: number; // New metric
}

export interface ExportData {
    suspicious_accounts: ExportSuspiciousAccount[];
    fraud_rings: ExportFraudRing[];
    summary: ExportSummary;
}
