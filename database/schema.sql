-- =============================================================================
-- FRAUD DETECTION SCHEMA
-- Optimized for Graph Analysis & Device Fingerprinting
-- =============================================================================

-- Enable UUID extension for secure IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ACCOUNTS
-- Stores entity information and current risk profile
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    holder_name VARCHAR(255),
    
    -- Risk Scoring
    risk_score DECIMAL(5, 2) DEFAULT 0.00, -- 0.00 to 100.00
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'UNDER_REVIEW')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEVICE FINGERPRINTS
-- Stores unique device signatures to detect multi-account access from same device
CREATE TABLE device_fingerprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_hash VARCHAR(255) UNIQUE NOT NULL, -- Browser/Device fingerprint hash
    user_agent TEXT,
    ip_address INET,
    
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ACCOUNT_DEVICES (Many-to-Many)
-- Links accounts to devices. High degree (many accounts -> 1 device) = Fraud Signal
CREATE TABLE account_devices (
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    device_id UUID REFERENCES device_fingerprints(id) ON DELETE CASCADE,
    last_access TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id, device_id)
);

-- 4. TRANSACTIONS
-- The edges of our financial graph
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_account_id UUID REFERENCES accounts(id),
    target_account_id UUID REFERENCES accounts(id),
    
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Metadata
    transaction_type VARCHAR(50),
    device_id UUID REFERENCES device_fingerprints(id),
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Graph Traversal Performance
CREATE INDEX idx_transactions_source ON transactions(source_account_id);
CREATE INDEX idx_transactions_target ON transactions(target_account_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);

-- =============================================================================
-- COMPLICATED LOGIC: RECURSIVE CYCLE DETECTION
-- =============================================================================

/*
 * Detects "Layering" cycles: A -> B -> C -> A
 * Returns chains where funds return to the original sender within `depth_limit` hops.
 */
CREATE OR REPLACE FUNCTION detect_transaction_cycles(
    start_account_id UUID, 
    depth_limit INT DEFAULT 5,
    min_amount DECIMAL DEFAULT 100.00
)
RETURNS TABLE (
    cycle_path UUID[],
    total_amount DECIMAL,
    path_length INT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE transaction_path AS (
        -- Base Case: Outgoing transactions from the start account
        SELECT 
            t.source_account_id,
            t.target_account_id,
            t.amount,
            ARRAY[t.source_account_id, t.target_account_id] AS path,
            1 AS depth
        FROM transactions t
        WHERE t.source_account_id = start_account_id
          AND t.amount >= min_amount

        UNION ALL

        -- Recursive Step: Follow the money
        SELECT 
            tp.source_account_id, -- Keep original source
            t.target_account_id,  -- New target
            tp.amount,            -- Propagate amount (simplification)
            tp.path || t.target_account_id,
            tp.depth + 1
        FROM transactions t
        JOIN transaction_path tp ON t.source_account_id = tp.target_account_id
        WHERE tp.depth < depth_limit
          and t.amount >= min_amount
          -- Optimization: Stop if we hit a node already in the path (cycle detected)
          -- Note: We actually WANT to find the cycle back to start, 
          -- so we check if target == start specifically.
          AND t.target_account_id <> ALL(tp.path[2:]) -- Don't revisit intermediate nodes
    )
    SELECT 
        path,
        amount,
        depth
    FROM transaction_path
    WHERE target_account_id = start_account_id -- Cycle complete
      AND depth > 1; -- A -> A direct self-transfer is trivial
END;
$$ LANGUAGE plpgsql;
