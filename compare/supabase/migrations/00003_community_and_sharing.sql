-- ============================================================================
-- BandingHidup — Migration 00003: Community Contributions & Private Sharing
-- ============================================================================

-- 1. Community Price Observations Table
CREATE TABLE IF NOT EXISTS community_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    category_code VARCHAR(50) REFERENCES expense_categories(code) ON DELETE RESTRICT NOT NULL,
    amount_minor_units BIGINT NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    housing_type VARCHAR(50), -- e.g., 'shared_room', 'dormitory', 'studio', 'one_bedroom'
    note TEXT, -- Optional, sanitized of PII
    status VARCHAR(20) DEFAULT 'pending_moderation' CHECK (status IN ('pending_moderation', 'approved', 'rejected')),
    deletion_token_hash TEXT NOT NULL, -- Hashed secret allowing contributor to request deletion
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID
);

-- 2. Shared Scenarios Snapshots Table
CREATE TABLE IF NOT EXISTS shared_scenarios (
    id VARCHAR(32) PRIMARY KEY, -- Opaque high-entropy token (e.g., 's_8f9a2b1c4e9f1234')
    revocation_key_hash TEXT NOT NULL, -- SHA-256 hash of client's secret revocation key
    country_code VARCHAR(2) NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE RESTRICT NOT NULL,
    pathway_code VARCHAR(50) NOT NULL,
    scenario_snapshot JSONB NOT NULL, -- Redacted calculation snapshot (no PII or custom text)
    views_count INT DEFAULT 0,
    expires_at TIMESTAMPTZ, -- Optional expiration timestamp (e.g., 30 days)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Moderation Decisions Audit Table
CREATE TABLE IF NOT EXISTS moderation_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id UUID REFERENCES community_observations(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE community_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public Read Shared Scenarios" ON shared_scenarios FOR SELECT USING (
    expires_at IS NULL OR expires_at > NOW()
);
CREATE POLICY "Public Insert Shared Scenarios" ON shared_scenarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Shared Scenarios" ON shared_scenarios FOR DELETE USING (true);
CREATE POLICY "Public Anonymous Insert Observations" ON community_observations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Anonymous Delete Observations" ON community_observations FOR DELETE USING (true);
CREATE POLICY "Admin Full Access Observations" ON community_observations FOR ALL USING (true);
CREATE POLICY "Admin Full Access Moderation" ON moderation_decisions FOR ALL USING (true);
