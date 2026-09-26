-- ============================================================================
-- BandingHidup — Migration 00006: Street Food Index & Income Percentiles
-- ============================================================================

-- 1. Register 'street_food' in expense_categories
INSERT INTO expense_categories (code, name_key, is_recurring, display_order)
VALUES ('street_food', 'category.street_food', true, 8)
ON CONFLICT (code) DO NOTHING;

-- 2. Create Table for National Income Percentiles (Updatable by Hermes Cronjob)
CREATE TABLE IF NOT EXISTS income_percentiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
    percentile INTEGER NOT NULL CHECK (percentile >= 1 AND percentile <= 99),
    gross_monthly_minor_units BIGINT NOT NULL CHECK (gross_monthly_minor_units >= 0),
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    source_name TEXT NOT NULL,
    effective_year INTEGER DEFAULT 2026,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_country_percentile UNIQUE (country_code, percentile)
);

-- Index for rapid percentile lookups
CREATE INDEX IF NOT EXISTS idx_income_percentiles_country ON income_percentiles(country_code, percentile);

-- Enable RLS and allow public read access
ALTER TABLE income_percentiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Income Percentiles"
    ON income_percentiles FOR SELECT USING (true);

-- 3. Seed Income Percentiles for Indonesia (Source: BPS Sakernas / Susenas 2024-2026)
INSERT INTO income_percentiles (country_code, percentile, gross_monthly_minor_units, currency_code, source_name) VALUES
    ('ID', 10, 1800000, 'IDR', 'BPS Sakernas / Susenas Distribusi Pendapatan Formal'),
    ('ID', 25, 3000000, 'IDR', 'BPS Sakernas / Susenas Distribusi Pendapatan Formal'),
    ('ID', 50, 4200000, 'IDR', 'BPS Sakernas / Susenas Distribusi Pendapatan Formal (Median)'),
    ('ID', 75, 7500000, 'IDR', 'BPS Sakernas / Susenas Distribusi Pendapatan Formal'),
    ('ID', 90, 15000000, 'IDR', 'BPS Sakernas / Susenas Distribusi Pendapatan Formal'),
    ('ID', 95, 25000000, 'IDR', 'BPS Sakernas / Susenas Distribusi Pendapatan Formal'),
    ('ID', 99, 50000000, 'IDR', 'BPS Sakernas / Susenas Distribusi Pendapatan Formal')
ON CONFLICT (country_code, percentile)
DO UPDATE SET gross_monthly_minor_units = EXCLUDED.gross_monthly_minor_units, updated_at = NOW();

-- 4. Seed Income Percentiles for Japan (Source: e-Stat / MHLW 国民生活基礎調査)
INSERT INTO income_percentiles (country_code, percentile, gross_monthly_minor_units, currency_code, source_name) VALUES
    ('JP', 10, 140000, 'JPY', 'MHLW Comprehensive Survey of Living Conditions (国民生活基礎調査)'),
    ('JP', 25, 200000, 'JPY', 'MHLW Comprehensive Survey of Living Conditions (国民生活基礎調査)'),
    ('JP', 50, 320000, 'JPY', 'MHLW Comprehensive Survey of Living Conditions (国民生活基礎調査 - Median)'),
    ('JP', 75, 480000, 'JPY', 'MHLW Comprehensive Survey of Living Conditions (国民生活基礎調査)'),
    ('JP', 90, 750000, 'JPY', 'MHLW Comprehensive Survey of Living Conditions (国民生活基礎調査)'),
    ('JP', 95, 950000, 'JPY', 'MHLW Comprehensive Survey of Living Conditions (国民生活基礎調査)'),
    ('JP', 99, 1500000, 'JPY', 'MHLW Comprehensive Survey of Living Conditions (国民生活基礎調査)')
ON CONFLICT (country_code, percentile)
DO UPDATE SET gross_monthly_minor_units = EXCLUDED.gross_monthly_minor_units, updated_at = NOW();

-- 5. Seed Income Percentiles for Germany (Source: Destatis / SOEP / IW Köln)
INSERT INTO income_percentiles (country_code, percentile, gross_monthly_minor_units, currency_code, source_name) VALUES
    ('DE', 10, 185000, 'EUR', 'Destatis / SOEP / IW Köln (Vollzeit Bruttoeinkommen)'),
    ('DE', 25, 260000, 'EUR', 'Destatis / SOEP / IW Köln (Vollzeit Bruttoeinkommen)'),
    ('DE', 50, 365000, 'EUR', 'Destatis / SOEP / IW Köln (Vollzeit Bruttoeinkommen - Median)'),
    ('DE', 75, 520000, 'EUR', 'Destatis / SOEP / IW Köln (Vollzeit Bruttoeinkommen)'),
    ('DE', 90, 740000, 'EUR', 'Destatis / SOEP / IW Köln (Vollzeit Bruttoeinkommen)'),
    ('DE', 95, 920000, 'EUR', 'Destatis / SOEP / IW Köln (Vollzeit Bruttoeinkommen)'),
    ('DE', 99, 1500000, 'EUR', 'Destatis / SOEP / IW Köln (Vollzeit Bruttoeinkommen)')
ON CONFLICT (country_code, percentile)
DO UPDATE SET gross_monthly_minor_units = EXCLUDED.gross_monthly_minor_units, updated_at = NOW();

-- 6. Seed Street Food Benchmarks (Döner Kebab 🇩🇪, Udon 🇯🇵, Mie Ayam 🇮🇩)
-- Germany: Döner Kebab (€7.50 = 750 cents)
INSERT INTO expense_benchmarks (city_id, category_code, value_minor_units, currency_code, confidence_level, source_url)
SELECT 
    c.id, 
    'street_food', 
    750, 
    'EUR', 
    'high', 
    'https://www.statista.com/statistics/doener-preis-deutschland'
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.code = 'DE'
ON CONFLICT (city_id, category_code, currency_code) 
DO UPDATE SET value_minor_units = EXCLUDED.value_minor_units;

-- Japan: Udon / Gyudon (¥620 = 620 yen)
INSERT INTO expense_benchmarks (city_id, category_code, value_minor_units, currency_code, confidence_level, source_url)
SELECT 
    c.id, 
    'street_food', 
    620, 
    'JPY', 
    'high', 
    'https://www.e-stat.go.jp'
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.code = 'JP'
ON CONFLICT (city_id, category_code, currency_code) 
DO UPDATE SET value_minor_units = EXCLUDED.value_minor_units;

-- Indonesia: Mie Ayam / Nasi Goreng (Rp 20,000 = 20000 rupiah)
INSERT INTO expense_benchmarks (city_id, category_code, value_minor_units, currency_code, confidence_level, source_url)
SELECT 
    c.id, 
    'street_food', 
    20000, 
    'IDR', 
    'high', 
    'https://webapi.bps.go.id'
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.code = 'ID'
ON CONFLICT (city_id, category_code, currency_code) 
DO UPDATE SET value_minor_units = EXCLUDED.value_minor_units;
