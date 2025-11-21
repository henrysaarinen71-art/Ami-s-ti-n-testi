-- Insert Real AMI Projects (Template)
--
-- Created: 2025-11-21
-- Purpose: Template for importing actual AMI projects
--
-- INSTRUCTIONS:
-- 1. First run: 005_delete_test_projects.sql to remove test data
-- 2. Replace the VALUES below with your real project data
-- 3. Run this script in Supabase Dashboard

-- Insert real AMI projects
INSERT INTO hankkeet (
  otsikko,
  kuvaus,
  toteuttaja,
  rahoittaja,
  on_ami_hanke,
  rahoitus_summa,
  vuosi,
  url,
  lahde_sivusto,
  created_at,
  updated_at
) VALUES
  -- Example project (replace with real data):
  (
    'Oikea hanke 1',
    'Oikea hankkeen kuvaus tälle hankkeelle',
    'Toteuttajan nimi',
    'AMI',
    true,
    50000, -- amount in euros
    2024,  -- year
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#oikea-hanke-1',
    'ami.fi',
    NOW(),
    NOW()
  ),
  -- Add more projects here with commas between each entry
  (
    'Oikea hanke 2',
    'Toinen oikea hanke',
    'Toinen toteuttaja',
    'AMI',
    true,
    75000,
    2024,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#oikea-hanke-2',
    'ami.fi',
    NOW(),
    NOW()
  )
  -- Continue adding projects...
ON CONFLICT (url) DO UPDATE
SET
  otsikko = EXCLUDED.otsikko,
  kuvaus = EXCLUDED.kuvaus,
  toteuttaja = EXCLUDED.toteuttaja,
  rahoittaja = EXCLUDED.rahoittaja,
  on_ami_hanke = EXCLUDED.on_ami_hanke,
  rahoitus_summa = EXCLUDED.rahoitus_summa,
  vuosi = EXCLUDED.vuosi,
  lahde_sivusto = EXCLUDED.lahde_sivusto,
  updated_at = NOW();

-- Verification query
SELECT COUNT(*) as total_ami_projects
FROM hankkeet
WHERE on_ami_hanke = true;

-- View imported projects
SELECT otsikko, rahoitus_summa, vuosi, toteuttaja
FROM hankkeet
WHERE on_ami_hanke = true
ORDER BY vuosi DESC, otsikko;
