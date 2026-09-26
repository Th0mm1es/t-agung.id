-- ─────────────────────────────────────────────────────────────────────────────
-- BandingHidup — Migration 00001: Initial Schema
-- Stage 0: Technical Foundations & Meta Shell
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. Currencies ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS currencies (
    code        VARCHAR(3)  PRIMARY KEY,
    symbol      VARCHAR(8)  NOT NULL,
    decimals    INT         NOT NULL DEFAULT 2,
    name_key    VARCHAR(64) NOT NULL
);

COMMENT ON TABLE currencies IS 'Supported currencies with minor-unit precision metadata';
COMMENT ON COLUMN currencies.decimals IS 'Number of decimal places (minor unit exponent). EUR=2, JPY=0, IDR=0';

-- ─── 2. Countries ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS countries (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                    VARCHAR(2)  UNIQUE NOT NULL,          -- ISO 3166-1 alpha-2
    name_en                 VARCHAR(100) NOT NULL,
    name_id                 VARCHAR(100) NOT NULL,
    name_ja                 VARCHAR(100) NOT NULL,
    default_currency_code   VARCHAR(3)  NOT NULL REFERENCES currencies(code),
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE countries IS 'Supported countries for comparison';
COMMENT ON COLUMN countries.code IS 'ISO 3166-1 alpha-2 country code (DE, JP, ID)';

-- ─── 3. Administrative Regions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS administrative_regions (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id  UUID        NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    region_type VARCHAR(32) NOT NULL  -- 'state', 'prefecture', 'province'
);

COMMENT ON TABLE administrative_regions IS 'German Bundesländer, Japanese Prefectures, Indonesian Provinces';

-- ─── 4. Cities ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cities (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id  UUID        NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    region_id   UUID        REFERENCES administrative_regions(id) ON DELETE SET NULL,
    name        VARCHAR(100) NOT NULL,
    is_major_hub BOOLEAN    DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cities IS 'Cities available for cost-of-living comparison';
COMMENT ON COLUMN cities.is_major_hub IS 'True = major metropolitan hub (affects housing cost tier)';

-- ─── 5. Income Pathways ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS income_pathways (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(50) UNIQUE NOT NULL,
    country_id      UUID        NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name_key        VARCHAR(100) NOT NULL,     -- i18n key
    description_key VARCHAR(255)               -- i18n key (optional)
);

COMMENT ON TABLE income_pathways IS 'Income pathway types: Ausbildung, Kenshusei/TI, student, fresh grad, custom';

-- ─── 6. Expense Categories ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_categories (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    code          VARCHAR(50) UNIQUE NOT NULL,
    name_key      VARCHAR(100) NOT NULL,   -- i18n key
    is_recurring  BOOLEAN     DEFAULT true,
    display_order INT         DEFAULT 0
);

COMMENT ON TABLE expense_categories IS 'Expense categories used in the calculation wizard';

-- ─── 7. Audit Logs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    action      VARCHAR(50) NOT NULL,          -- 'create', 'update', 'delete', 'proposal'
    entity_type VARCHAR(50) NOT NULL,          -- table name
    entity_id   UUID,
    payload     JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Audit trail for Hermes agent proposals and admin actions (Stage 2+)';

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON cities(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_region_id ON cities(region_id);
CREATE INDEX IF NOT EXISTS idx_income_pathways_country_id ON income_pathways(country_id);
CREATE INDEX IF NOT EXISTS idx_income_pathways_code ON income_pathways(code);
CREATE INDEX IF NOT EXISTS idx_expense_categories_code ON expense_categories(code);
CREATE INDEX IF NOT EXISTS idx_expense_categories_display ON expense_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────

-- Enable RLS on ALL tables (mandatory security requirement)
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrative_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public anonymous read-only access for reference data tables
CREATE POLICY "Public Read Currencies"
    ON currencies FOR SELECT USING (true);

CREATE POLICY "Public Read Countries"
    ON countries FOR SELECT USING (true);

CREATE POLICY "Public Read Regions"
    ON administrative_regions FOR SELECT USING (true);

CREATE POLICY "Public Read Cities"
    ON cities FOR SELECT USING (true);

CREATE POLICY "Public Read Pathways"
    ON income_pathways FOR SELECT USING (true);

CREATE POLICY "Public Read Expense Categories"
    ON expense_categories FOR SELECT USING (true);

-- Audit logs: no public read (admin/service role only)
-- No public SELECT policy created for audit_logs intentionally.
-- Write policy for service role only (future Stage 2 Hermes agent)
CREATE POLICY "Service Role Insert Audit Logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
