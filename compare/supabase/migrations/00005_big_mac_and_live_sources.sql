-- ============================================================================
-- BandingHidup — Migration 00005: Big Mac Index, BPS/US Sources & Crowdsourcing
-- ============================================================================

-- 1. Register 'big_mac' in expense_categories
INSERT INTO expense_categories (code, name_key, is_recurring, display_order)
VALUES ('big_mac', 'category.big_mac', true, 7)
ON CONFLICT (code) DO NOTHING;

-- 2. Register External Data Sources & Crowdsourcing Provider
INSERT INTO data_sources (code, name, source_tier, base_url) VALUES
    ('bps', 'Badan Pusat Statistik (BPS Indonesia)', 1, 'https://webapi.bps.go.id'),
    ('fred', 'Federal Reserve Economic Data (FRED)', 1, 'https://fred.stlouisfed.org'),
    ('bls', 'Bureau of Labor Statistics (BLS)', 1, 'https://www.bls.gov'),
    ('census', 'United States Census Bureau', 1, 'https://data.census.gov'),
    ('economist_bigmac', 'The Economist Big Mac Index', 2, 'https://www.economist.com/big-mac-index'),
    ('user_crowdsource', 'Direct User Community Price Correction', 4, 'https://compare.t-agung.id')
ON CONFLICT (code) DO NOTHING;

-- 3. Seed Big Mac Benchmarks for German Cities (EUR 5.20 = 520 cents)
INSERT INTO expense_benchmarks (city_id, category_code, value_minor_units, currency_code, confidence_level, source_url)
SELECT 
    c.id, 
    'big_mac', 
    520, 
    'EUR', 
    'high', 
    'https://www.economist.com/big-mac-index'
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.code = 'DE'
ON CONFLICT (city_id, category_code, currency_code) 
DO UPDATE SET value_minor_units = EXCLUDED.value_minor_units;

-- 4. Seed Big Mac Benchmarks for Japanese Cities (JPY 540 = 540 yen)
INSERT INTO expense_benchmarks (city_id, category_code, value_minor_units, currency_code, confidence_level, source_url)
SELECT 
    c.id, 
    'big_mac', 
    540, 
    'JPY', 
    'high', 
    'https://www.economist.com/big-mac-index'
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.code = 'JP'
ON CONFLICT (city_id, category_code, currency_code) 
DO UPDATE SET value_minor_units = EXCLUDED.value_minor_units;

-- 5. Seed Big Mac Benchmarks for Indonesian Cities (IDR 42,000 = 42000 rupiah)
INSERT INTO expense_benchmarks (city_id, category_code, value_minor_units, currency_code, confidence_level, source_url)
SELECT 
    c.id, 
    'big_mac', 
    42000, 
    'IDR', 
    'high', 
    'https://www.economist.com/big-mac-index'
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.code = 'ID'
ON CONFLICT (city_id, category_code, currency_code) 
DO UPDATE SET value_minor_units = EXCLUDED.value_minor_units;
