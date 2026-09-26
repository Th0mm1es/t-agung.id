-- ============================================================================
-- BandingHidup — Migration 00004: Deep Personalization & Advanced Modules
-- ============================================================================

-- 1. Tax & Deduction Rules Table
CREATE TABLE IF NOT EXISTS tax_deduction_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) REFERENCES countries(code) NOT NULL,
    pathway_code VARCHAR(50) REFERENCES income_pathways(code) NOT NULL,
    effective_year INT NOT NULL,
    social_security_pct NUMERIC(5, 2) NOT NULL, -- e.g. 19.60
    tax_free_allowance_minor_units BIGINT NOT NULL, -- Grundfreibetrag in minor units (€11,784 in cents)
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Childcare & Family Benchmarks Table
CREATE TABLE IF NOT EXISTS childcare_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    age_group VARCHAR(20) NOT NULL CHECK (age_group IN ('infant', 'toddler', 'school_age')),
    avg_monthly_fee_minor_units BIGINT NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    subsidy_context_key VARCHAR(100), -- e.g., 'kindergeld_de', 'hoiku_subsidy_jp'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Commuter Profile Benchmarks Table
CREATE TABLE IF NOT EXISTS commuter_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    zone_name VARCHAR(50) NOT NULL, -- e.g. 'City Core', 'Suburban Zone 3-4'
    rent_multiplier NUMERIC(4, 2) NOT NULL, -- e.g. 0.75 for 25% cheaper rent
    transit_pass_cost_minor_units BIGINT NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code) NOT NULL
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE tax_deduction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE childcare_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE commuter_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Tax Rules" ON tax_deduction_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Childcare" ON childcare_benchmarks FOR SELECT USING (true);
CREATE POLICY "Public Read Commuter Profiles" ON commuter_profiles FOR SELECT USING (true);

-- ─── SEED DATA ────────────────────────────────────────────────────────────────
INSERT INTO tax_deduction_rules (country_code, pathway_code, effective_year, social_security_pct, tax_free_allowance_minor_units) VALUES
('DE', 'ausbildung', 2026, 19.60, 1178400), -- €11,784/yr Grundfreibetrag
('JP', 'technical_intern', 2026, 15.00, 1030000) -- ¥1,030,000/yr tax free threshold
ON CONFLICT DO NOTHING;
