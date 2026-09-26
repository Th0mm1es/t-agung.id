-- ─────────────────────────────────────────────────────────────────────────────
-- BandingHidup — Seed Data
-- Run after migration 00001_initial_schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Currencies ───────────────────────────────────────────────────────────────

INSERT INTO currencies (code, symbol, decimals, name_key) VALUES
    ('EUR', '€',  2, 'currency.eur'),
    ('JPY', '¥',  0, 'currency.jpy'),
    ('IDR', 'Rp', 0, 'currency.idr'),
    ('USD', '$',  2, 'currency.usd')
ON CONFLICT (code) DO NOTHING;

-- ─── Countries ────────────────────────────────────────────────────────────────

INSERT INTO countries (code, name_en, name_id, name_ja, default_currency_code) VALUES
    ('DE', 'Germany',   'Jerman',    'ドイツ',       'EUR'),
    ('JP', 'Japan',     'Jepang',    '日本',         'JPY'),
    ('ID', 'Indonesia', 'Indonesia', 'インドネシア', 'IDR')
ON CONFLICT (code) DO NOTHING;

-- ─── Administrative Regions ───────────────────────────────────────────────────

-- Germany — Federal States (Bundesländer)
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
ON CONFLICT DO NOTHING;

-- Japan — Prefectures
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
ON CONFLICT DO NOTHING;

-- Indonesia — Provinces
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
ON CONFLICT DO NOTHING;

-- ─── Cities ───────────────────────────────────────────────────────────────────

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
    ('Berlin',          'Berlin',              true),
    ('Stuttgart',       'Baden-Württemberg',   true),
    ('Munich',          'Bavaria',             true),
    ('Frankfurt am Main','Hesse',              true),
    ('Nuremberg',       'Bavaria',             false),
    ('Cologne',         'North Rhine-Westphalia', true),
    ('Hamburg',         'Hamburg',             true),
    ('Leipzig',         'Saxony',              false)
) AS city(name, region_name, is_major_hub) ON ar.name = city.region_name
WHERE c.code = 'DE'
ON CONFLICT DO NOTHING;

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
ON CONFLICT DO NOTHING;

-- Indonesia Cities (baseline / origin reference)
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
ON CONFLICT DO NOTHING;

-- ─── Income Pathways ──────────────────────────────────────────────────────────

-- Germany Pathways
INSERT INTO income_pathways (code, country_id, name_key, description_key)
SELECT
    pathway.code,
    c.id,
    pathway.name_key,
    pathway.description_key
FROM countries c,
     (VALUES
         ('ausbildung',  'pathway.ausbildung',  'pathway.desc.ausbildung'),
         ('student',     'pathway.student',     'pathway.desc.student'),
         ('fresh_grad',  'pathway.fresh_grad',  'pathway.desc.fresh_grad'),
         ('custom',      'pathway.custom',      NULL)
     ) AS pathway(code, name_key, description_key)
WHERE c.code = 'DE'
ON CONFLICT (code) DO NOTHING;

-- Japan Pathways
INSERT INTO income_pathways (code, country_id, name_key, description_key)
SELECT
    jp_pathway.code,
    c.id,
    jp_pathway.name_key,
    jp_pathway.description_key
FROM countries c,
     (VALUES
         ('technical_intern', 'pathway.technical_intern', 'pathway.desc.technical_intern'),
         ('student',          'pathway.student',          'pathway.desc.student'),
         ('fresh_grad',       'pathway.fresh_grad',       'pathway.desc.fresh_grad'),
         ('custom',           'pathway.custom',           NULL)
     ) AS jp_pathway(code, name_key, description_key)
WHERE c.code = 'JP'
ON CONFLICT (code) DO NOTHING;

-- ─── Expense Categories ───────────────────────────────────────────────────────

INSERT INTO expense_categories (code, name_key, is_recurring, display_order) VALUES
    ('housing',    'category.housing',    true,  1),
    ('utilities',  'category.utilities',  true,  2),
    ('food',       'category.food',       true,  3),
    ('transport',  'category.transport',  true,  4),
    ('lifestyle',  'category.lifestyle',  true,  5),
    ('relocation', 'category.relocation', false, 6)
ON CONFLICT (code) DO NOTHING;
