-- ============================================================================
-- BandingHidup — Migration 00002: Data Governance, Proposals & Benchmarks
-- ============================================================================

-- 1. Data Sources Registry
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'destatis', 'estat', 'apify_housing_de', 'hermes_agent'
    name VARCHAR(100) NOT NULL,
    source_tier INT NOT NULL CHECK (source_tier BETWEEN 1 AND 5), -- 1: Official Stat, 2: Official Tariff, 3: Editorial, 4: Community, 5: Unverified
    base_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staging Table: Data Change Proposals (Hermes / Apify write destination)
CREATE TABLE IF NOT EXISTS data_change_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES data_sources(id) ON DELETE RESTRICT NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    category_code VARCHAR(50) REFERENCES expense_categories(code) ON DELETE RESTRICT NOT NULL,
    proposed_value_minor_units BIGINT NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    percentage_delta_vs_current NUMERIC(6, 2), -- Computed percentage change vs live benchmark
    confidence_score NUMERIC(3, 2) CHECK (confidence_score BETWEEN 0.00 AND 1.00),
    source_url TEXT NOT NULL,
    rationale TEXT NOT NULL,
    raw_payload JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID
);

-- 3. Production Benchmarks Table (Read by calculation engine)
CREATE TABLE IF NOT EXISTS expense_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    category_code VARCHAR(50) REFERENCES expense_categories(code) ON DELETE RESTRICT NOT NULL,
    value_minor_units BIGINT NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    confidence_level VARCHAR(20) DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),
    source_id UUID REFERENCES data_sources(id),
    source_url TEXT,
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city_id, category_code, currency_code)
);

-- 4. Exchange Rates Staging & Production
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    quote_currency VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    rate NUMERIC(14, 6) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public Read Data Sources" ON data_sources FOR SELECT USING (true);
CREATE POLICY "Public Read Benchmarks" ON expense_benchmarks FOR SELECT USING (true);
CREATE POLICY "Public Read Approved Rates" ON exchange_rates FOR SELECT USING (is_approved = true);
CREATE POLICY "Service Role Proposals Write" ON data_change_proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Service Role Proposals Read" ON data_change_proposals FOR SELECT USING (true);
CREATE POLICY "Service Role Proposals Update" ON data_change_proposals FOR UPDATE USING (true);
CREATE POLICY "Service Role Benchmarks Write" ON expense_benchmarks FOR ALL USING (true);

-- ─── SEED DATA ────────────────────────────────────────────────────────────────
-- Initial Data Sources
INSERT INTO data_sources (code, name, source_tier, base_url) VALUES
('destatis', 'Statistisches Bundesamt (Destatis GENESIS-Online)', 1, 'https://www-genesis.destatis.de'),
('estat', 'Japan e-Stat (Government Statistics of Japan)', 1, 'https://www.e-stat.go.jp'),
('apify_housing_de', 'Apify German Housing Listing Scraper', 3, 'https://apify.com'),
('apify_housing_jp', 'Apify Japan Rental Listing Scraper', 3, 'https://apify.com'),
('hermes_agent', 'Hermes Data Normalization Agent', 2, 'https://compare.t-agung.id')
ON CONFLICT (code) DO NOTHING;

-- Initial Approved Exchange Rates
INSERT INTO exchange_rates (base_currency, quote_currency, rate, provider, is_approved) VALUES
('EUR', 'JPY', 163.500000, 'ECB Initial Benchmark', true),
('EUR', 'IDR', 17200.000000, 'BI Initial Benchmark', true),
('EUR', 'USD', 1.090000, 'Federal Reserve Benchmark', true),
('JPY', 'IDR', 105.200000, 'BI Initial Benchmark', true)
ON CONFLICT DO NOTHING;
