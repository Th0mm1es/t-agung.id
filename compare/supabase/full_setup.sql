-- ============================================================================
-- BandingHidup — Complete Database Setup & Seed
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/thtyqctxddvolvdbgczv/sql/new
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. Currencies ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS currencies (
    code        VARCHAR(3)  PRIMARY KEY,
    symbol      VARCHAR(8)  NOT NULL,
    decimals    INT         NOT NULL DEFAULT 2,
    name_key    VARCHAR(64) NOT NULL
);

-- ─── 2. Countries ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS countries (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                    VARCHAR(2)  UNIQUE NOT NULL,
    name_en                 VARCHAR(100) NOT NULL,
    name_id                 VARCHAR(100) NOT NULL,
    name_ja                 VARCHAR(100) NOT NULL,
    default_currency_code   VARCHAR(3)  NOT NULL REFERENCES currencies(code),
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Administrative Regions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS administrative_regions (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id  UUID        NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    region_type VARCHAR(32) NOT NULL,
    CONSTRAINT uq_admin_region UNIQUE (country_id, name)
);

-- ─── 4. Cities ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id  UUID        NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    region_id   UUID        REFERENCES administrative_regions(id) ON DELETE SET NULL,
    name        VARCHAR(100) NOT NULL,
    is_major_hub BOOLEAN    DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_city_country UNIQUE (country_id, name)
);

-- ─── 5. Income Pathways ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS income_pathways (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(50) UNIQUE NOT NULL,
    country_id      UUID        NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name_key        VARCHAR(100) NOT NULL,
    description_key VARCHAR(255)
);

-- ─── 6. Expense Categories ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_categories (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    code          VARCHAR(50) UNIQUE NOT NULL,
    name_key      VARCHAR(100) NOT NULL,
    is_recurring  BOOLEAN     DEFAULT true,
    display_order INT         DEFAULT 0
);

-- ─── 7. Audit Logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    action      VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   UUID,
    payload     JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. Data Sources Registry ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    source_tier INT NOT NULL CHECK (source_tier BETWEEN 1 AND 5),
    base_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. Data Change Proposals ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_change_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES data_sources(id) ON DELETE RESTRICT NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    category_code VARCHAR(50) REFERENCES expense_categories(code) ON DELETE RESTRICT NOT NULL,
    proposed_value_minor_units BIGINT NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    percentage_delta_vs_current NUMERIC(6, 2),
    confidence_score NUMERIC(3, 2) CHECK (confidence_score BETWEEN 0.00 AND 1.00),
    source_url TEXT NOT NULL,
    rationale TEXT NOT NULL,
    raw_payload JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID
);

-- ─── 10. Production Benchmarks ────────────────────────────────────────────────
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

-- ─── 11. Exchange Rates ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    quote_currency VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    rate NUMERIC(14, 6) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_exchange_rate UNIQUE (base_currency, quote_currency, provider)
);

-- ─── 12. Community Observations ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    category_code VARCHAR(50) REFERENCES expense_categories(code) ON DELETE RESTRICT NOT NULL,
    amount_minor_units BIGINT NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    housing_type VARCHAR(50),
    note TEXT,
    status VARCHAR(20) DEFAULT 'pending_moderation' CHECK (status IN ('pending_moderation', 'approved', 'rejected')),
    deletion_token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID
);

-- ─── 13. Shared Scenarios ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_scenarios (
    id VARCHAR(32) PRIMARY KEY,
    revocation_key_hash TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE RESTRICT NOT NULL,
    pathway_code VARCHAR(50) NOT NULL,
    scenario_snapshot JSONB NOT NULL,
    views_count INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 14. Moderation Decisions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id UUID REFERENCES community_observations(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 15. Tax & Deduction Rules ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_deduction_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) REFERENCES countries(code) NOT NULL,
    pathway_code VARCHAR(50) REFERENCES income_pathways(code) NOT NULL,
    effective_year INT NOT NULL,
    social_security_pct NUMERIC(5, 2) NOT NULL,
    tax_free_allowance_minor_units BIGINT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tax_rule UNIQUE (country_code, pathway_code, effective_year)
);

-- ─── 16. Childcare Benchmarks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS childcare_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    age_group VARCHAR(20) NOT NULL CHECK (age_group IN ('infant', 'toddler', 'school_age')),
    avg_monthly_fee_minor_units BIGINT NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code) NOT NULL,
    subsidy_context_key VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 17. Commuter Profiles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commuter_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    zone_name VARCHAR(50) NOT NULL,
    rent_multiplier NUMERIC(4, 2) NOT NULL,
    transit_pass_cost_minor_units BIGINT NOT NULL,
    currency_code VARCHAR(3) REFERENCES currencies(code) NOT NULL
);

-- ─── ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────────
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrative_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_deduction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE childcare_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE commuter_profiles ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public Read Currencies" ON currencies;
CREATE POLICY "Public Read Currencies" ON currencies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Countries" ON countries;
CREATE POLICY "Public Read Countries" ON countries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Regions" ON administrative_regions;
CREATE POLICY "Public Read Regions" ON administrative_regions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Cities" ON cities;
CREATE POLICY "Public Read Cities" ON cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Pathways" ON income_pathways;
CREATE POLICY "Public Read Pathways" ON income_pathways FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Expense Categories" ON expense_categories;
CREATE POLICY "Public Read Expense Categories" ON expense_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service Role Insert Audit Logs" ON audit_logs;
CREATE POLICY "Service Role Insert Audit Logs" ON audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Data Sources" ON data_sources;
CREATE POLICY "Public Read Data Sources" ON data_sources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Benchmarks" ON expense_benchmarks;
CREATE POLICY "Public Read Benchmarks" ON expense_benchmarks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service Role Benchmarks Write" ON expense_benchmarks;
CREATE POLICY "Service Role Benchmarks Write" ON expense_benchmarks FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read Approved Rates" ON exchange_rates;
CREATE POLICY "Public Read Approved Rates" ON exchange_rates FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Service Role Proposals Write" ON data_change_proposals;
CREATE POLICY "Service Role Proposals Write" ON data_change_proposals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role Proposals Read" ON data_change_proposals;
CREATE POLICY "Service Role Proposals Read" ON data_change_proposals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service Role Proposals Update" ON data_change_proposals;
CREATE POLICY "Service Role Proposals Update" ON data_change_proposals FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Read Shared Scenarios" ON shared_scenarios;
CREATE POLICY "Public Read Shared Scenarios" ON shared_scenarios FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

DROP POLICY IF EXISTS "Public Insert Shared Scenarios" ON shared_scenarios;
CREATE POLICY "Public Insert Shared Scenarios" ON shared_scenarios FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Delete Shared Scenarios" ON shared_scenarios;
CREATE POLICY "Public Delete Shared Scenarios" ON shared_scenarios FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public Anonymous Insert Observations" ON community_observations;
CREATE POLICY "Public Anonymous Insert Observations" ON community_observations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anonymous Delete Observations" ON community_observations;
CREATE POLICY "Public Anonymous Delete Observations" ON community_observations FOR DELETE USING (true);

DROP POLICY IF EXISTS "Admin Full Access Observations" ON community_observations;
CREATE POLICY "Admin Full Access Observations" ON community_observations FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin Full Access Moderation" ON moderation_decisions;
CREATE POLICY "Admin Full Access Moderation" ON moderation_decisions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read Tax Rules" ON tax_deduction_rules;
CREATE POLICY "Public Read Tax Rules" ON tax_deduction_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Childcare" ON childcare_benchmarks;
CREATE POLICY "Public Read Childcare" ON childcare_benchmarks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Commuter Profiles" ON commuter_profiles;
CREATE POLICY "Public Read Commuter Profiles" ON commuter_profiles FOR SELECT USING (true);

-- ─── SEED DATA ────────────────────────────────────────────────────────────────

-- 1. Currencies
INSERT INTO currencies (code, symbol, decimals, name_key) VALUES
    ('EUR', '€',  2, 'currency.eur'),
    ('JPY', '¥',  0, 'currency.jpy'),
    ('IDR', 'Rp', 0, 'currency.idr'),
    ('USD', '$',  2, 'currency.usd')
ON CONFLICT (code) DO NOTHING;

-- 2. Countries
INSERT INTO countries (code, name_en, name_id, name_ja, default_currency_code) VALUES
    ('DE', 'Germany',   'Jerman',    'ドイツ',       'EUR'),
    ('JP', 'Japan',     'Jepang',    '日本',         'JPY'),
    ('ID', 'Indonesia', 'Indonesia', 'インドネシア', 'IDR')
ON CONFLICT (code) DO NOTHING;

-- 3. Administrative Regions
-- Germany Federal States
INSERT INTO administrative_regions (country_id, name, region_type)
SELECT c.id, region.name, 'state'
FROM countries c,
     (VALUES
         ('Berlin'),
         ('Baden-Württemberg'),
         ('Bavaria'),
         ('Hesse'),
         ('North Rhine-Westphalia'),
         ('Hamburg'),
         ('Saxony'),
         ('Lower Saxony')
     ) AS region(name)
WHERE c.code = 'DE'
ON CONFLICT (country_id, name) DO NOTHING;

-- Japan Prefectures
INSERT INTO administrative_regions (country_id, name, region_type)
SELECT c.id, region.name, 'prefecture'
FROM countries c,
     (VALUES
         ('Tokyo'),
         ('Osaka'),
         ('Aichi'),
         ('Kyoto'),
         ('Kanagawa'),
         ('Hyogo'),
         ('Fukuoka'),
         ('Hokkaido')
     ) AS region(name)
WHERE c.code = 'JP'
ON CONFLICT (country_id, name) DO NOTHING;

-- Indonesia Provinces
INSERT INTO administrative_regions (country_id, name, region_type)
SELECT c.id, region.name, 'province'
FROM countries c,
     (VALUES
         ('DKI Jakarta'),
         ('Jawa Barat'),
         ('Jawa Tengah'),
         ('Jawa Timur'),
         ('Bali')
     ) AS region(name)
WHERE c.code = 'ID'
ON CONFLICT (country_id, name) DO NOTHING;

-- 4. Cities
-- Germany Cities
INSERT INTO cities (country_id, region_id, name, is_major_hub)
SELECT
    c.id AS country_id,
    ar.id AS region_id,
    city.name,
    city.is_major_hub
FROM countries c
JOIN administrative_regions ar ON ar.country_id = c.id
JOIN (VALUES
    ('Berlin',            'Berlin',                 true),
    ('Stuttgart',         'Baden-Württemberg',      true),
    ('Munich',            'Bavaria',                true),
    ('Frankfurt am Main', 'Hesse',                  true),
    ('Nuremberg',         'Bavaria',                false),
    ('Cologne',           'North Rhine-Westphalia', true),
    ('Hamburg',           'Hamburg',                true),
    ('Leipzig',           'Saxony',                 false)
) AS city(name, region_name, is_major_hub) ON ar.name = city.region_name
WHERE c.code = 'DE'
ON CONFLICT (country_id, name) DO NOTHING;

-- Japan Cities
INSERT INTO cities (country_id, region_id, name, is_major_hub)
SELECT
    c.id AS country_id,
    ar.id AS region_id,
    city.name,
    city.is_major_hub
FROM countries c
JOIN administrative_regions ar ON ar.country_id = c.id
JOIN (VALUES
    ('Tokyo',     'Tokyo',      true),
    ('Osaka',     'Osaka',      true),
    ('Nagoya',    'Aichi',      true),
    ('Kyoto',     'Kyoto',      true),
    ('Yokohama',  'Kanagawa',   true),
    ('Kobe',      'Hyogo',      false),
    ('Fukuoka',   'Fukuoka',    true),
    ('Sapporo',   'Hokkaido',   false)
) AS city(name, region_name, is_major_hub) ON ar.name = city.region_name
WHERE c.code = 'JP'
ON CONFLICT (country_id, name) DO NOTHING;

-- Indonesia Cities
INSERT INTO cities (country_id, region_id, name, is_major_hub)
SELECT
    c.id AS country_id,
    ar.id AS region_id,
    city.name,
    city.is_major_hub
FROM countries c
JOIN administrative_regions ar ON ar.country_id = c.id
JOIN (VALUES
    ('Jakarta',   'DKI Jakarta', true),
    ('Bandung',   'Jawa Barat',  false),
    ('Semarang',  'Jawa Tengah', false),
    ('Surabaya',  'Jawa Timur',  false),
    ('Denpasar',  'Bali',        false)
) AS city(name, region_name, is_major_hub) ON ar.name = city.region_name
WHERE c.code = 'ID'
ON CONFLICT (country_id, name) DO NOTHING;

-- 5. Income Pathways
-- Germany
INSERT INTO income_pathways (code, country_id, name_key, description_key)
SELECT pathway.code, c.id, pathway.name_key, pathway.description_key
FROM countries c,
     (VALUES
         ('ausbildung',  'pathway.ausbildung',  'pathway.desc.ausbildung'),
         ('student',     'pathway.student',     'pathway.desc.student'),
         ('fresh_grad',  'pathway.fresh_grad',  'pathway.desc.fresh_grad'),
         ('custom',      'pathway.custom',      NULL)
     ) AS pathway(code, name_key, description_key)
WHERE c.code = 'DE'
ON CONFLICT (code) DO NOTHING;

-- Japan
INSERT INTO income_pathways (code, country_id, name_key, description_key)
SELECT jp_pathway.code, c.id, jp_pathway.name_key, jp_pathway.description_key
FROM countries c,
     (VALUES
         ('technical_intern', 'pathway.technical_intern', 'pathway.desc.technical_intern'),
         ('student',          'pathway.student',          'pathway.desc.student'),
         ('fresh_grad',       'pathway.fresh_grad',       'pathway.desc.fresh_grad'),
         ('custom',           'pathway.custom',           NULL)
     ) AS jp_pathway(code, name_key, description_key)
WHERE c.code = 'JP'
ON CONFLICT (code) DO NOTHING;

-- 6. Expense Categories
INSERT INTO expense_categories (code, name_key, is_recurring, display_order) VALUES
    ('housing',    'category.housing',    true,  1),
    ('utilities',  'category.utilities',  true,  2),
    ('food',       'category.food',       true,  3),
    ('transport',  'category.transport',  true,  4),
    ('lifestyle',  'category.lifestyle',  true,  5),
    ('relocation', 'category.relocation', false, 6),
    ('big_mac',    'category.big_mac',    false, 7)
ON CONFLICT (code) DO NOTHING;

-- 7. Data Sources
INSERT INTO data_sources (code, name, source_tier, base_url) VALUES
    ('destatis', 'Statistisches Bundesamt (Destatis GENESIS-Online)', 1, 'https://www-genesis.destatis.de'),
    ('estat', 'Japan e-Stat (Government Statistics of Japan)', 1, 'https://www.e-stat.go.jp'),
    ('bps', 'Badan Pusat Statistik (BPS Indonesia)', 1, 'https://webapi.bps.go.id'),
    ('fred', 'Federal Reserve Economic Data (FRED)', 1, 'https://fred.stlouisfed.org'),
    ('bls', 'Bureau of Labor Statistics (BLS)', 1, 'https://www.bls.gov'),
    ('census', 'United States Census Bureau', 1, 'https://data.census.gov'),
    ('economist_bigmac', 'The Economist Big Mac Index', 2, 'https://www.economist.com/big-mac-index'),
    ('user_crowdsource', 'Direct User Community Price Correction', 4, 'https://compare.t-agung.id'),
    ('apify_housing_de', 'Apify German Housing Listing Scraper', 3, 'https://apify.com'),
    ('apify_housing_jp', 'Apify Japan Rental Listing Scraper', 3, 'https://apify.com'),
    ('hermes_agent', 'Hermes Data Normalization Agent', 2, 'https://compare.t-agung.id')
ON CONFLICT (code) DO NOTHING;

-- 8. Exchange Rates
INSERT INTO exchange_rates (base_currency, quote_currency, rate, provider, is_approved) VALUES
    ('EUR', 'JPY', 163.500000, 'ECB Initial Benchmark', true),
    ('EUR', 'IDR', 17200.000000, 'BI Initial Benchmark', true),
    ('EUR', 'USD', 1.090000, 'Federal Reserve Benchmark', true),
    ('JPY', 'IDR', 105.200000, 'BI Initial Benchmark', true)
ON CONFLICT (base_currency, quote_currency, provider) DO NOTHING;

-- 9. Tax Deduction Rules
INSERT INTO tax_deduction_rules (country_code, pathway_code, effective_year, social_security_pct, tax_free_allowance_minor_units) VALUES
    ('DE', 'ausbildung', 2026, 19.60, 1178400),
    ('JP', 'technical_intern', 2026, 15.00, 1030000)
ON CONFLICT (country_code, pathway_code, effective_year) DO NOTHING;

-- 10. Seed Big Mac Benchmarks (EUR 5.20 = 520, JPY 540 = 540, IDR 42,000 = 42000)
INSERT INTO expense_benchmarks (city_id, category_code, value_minor_units, currency_code, confidence_level, source_url)
SELECT c.id, 'big_mac', 520, 'EUR', 'high', 'https://www.economist.com/big-mac-index'
FROM cities c JOIN countries co ON c.country_id = co.id WHERE co.code = 'DE'
ON CONFLICT (city_id, category_code, currency_code) DO UPDATE SET value_minor_units = EXCLUDED.value_minor_units;

INSERT INTO expense_benchmarks (city_id, category_code, value_minor_units, currency_code, confidence_level, source_url)
SELECT c.id, 'big_mac', 540, 'JPY', 'high', 'https://www.economist.com/big-mac-index'
FROM cities c JOIN countries co ON c.country_id = co.id WHERE co.code = 'JP'
ON CONFLICT (city_id, category_code, currency_code) DO UPDATE SET value_minor_units = EXCLUDED.value_minor_units;

INSERT INTO expense_benchmarks (city_id, category_code, value_minor_units, currency_code, confidence_level, source_url)
SELECT c.id, 'big_mac', 42000, 'IDR', 'high', 'https://www.economist.com/big-mac-index'
FROM cities c JOIN countries co ON c.country_id = co.id WHERE co.code = 'ID'
ON CONFLICT (city_id, category_code, currency_code) DO UPDATE SET value_minor_units = EXCLUDED.value_minor_units;

