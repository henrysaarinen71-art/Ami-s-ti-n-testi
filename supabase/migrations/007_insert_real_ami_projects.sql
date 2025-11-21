-- Insert Real AMI Projects (6 projects)
--
-- Created: 2025-11-21
-- Purpose: Import 6 actual AMI-funded projects from 2024
--
-- INSTRUCTIONS FOR RUNNING THIS SCRIPT:
-- ======================================
-- 1. First run migration 005 to delete test projects (if not done already)
-- 2. Open Supabase Dashboard: https://supabase.com/dashboard/project/bgrjaihmctqkayyochwd
-- 3. Go to SQL Editor (left sidebar)
-- 4. Copy this entire file content
-- 5. Paste into SQL Editor
-- 6. Click "Run" (or press Ctrl+Enter)
-- 7. Check verification queries at the bottom
--
-- INSTRUCTIONS FOR ADDING MORE PROJECTS LATER:
-- ============================================
-- 1. Copy one of the project blocks below (lines 45-58 for example)
-- 2. Add a comma after the previous project's closing parenthesis
-- 3. Paste the copied block
-- 4. Update all fields with new project data
-- 5. Make sure the URL is unique (change the slug)
-- 6. Run the updated script in Supabase Dashboard
--
-- NOTES:
-- - This uses UPSERT (ON CONFLICT DO UPDATE) so it's safe to run multiple times
-- - URLs must be unique (they're used as the primary conflict key)
-- - All amounts are in euros (without decimals)
-- - Year should be 4-digit (e.g., 2024)
-- - on_ami_hanke MUST be true for AMI projects

-- Insert real AMI projects (UPSERT to avoid duplicates)
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
  -- Project 1: Labore - Vastuuasiantuntijaresurssi
  (
    'Vastuuasiantuntijaresurssin käyttö Helsingissä ja TE2024-uudistuksen vaikutukset',
    'Hanke tukee Helsingin työllisyyden kuntakokeilun vastuuasiantuntijatoimintaa ja selvittää TE2024-uudistuksen vaikutuksia helsinkiläisten työllistymiseen. Vastuuasiantuntijat tarjoavat syvällistä asiantuntemusta ja tukea erityisesti vaikeassa työmarkkina-asemassa oleville asiakkaille.',
    'Labore',
    'AMI',
    true,
    62951,
    2024,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#vastuuasiantuntijaresurssi-te2024-2024',
    'ami.fi',
    NOW(),
    NOW()
  ),

  -- Project 2: Into ry - NEETHelsinki
  (
    'NEETHelsinki',
    'Hanke tukee NEET-nuoria (nuoret, jotka eivät ole työssä, opiskelemassa tai koulutuksessa) Helsingissä. Tavoitteena on aktivoida nuoria ja tukea heidän polkujaan kohti koulutusta ja työelämää etsivän nuorisotyön ja työpajatoiminnan keinoin.',
    'Into – etsivä nuorisotyö ja työpajatoiminta ry',
    'AMI',
    true,
    65631,
    2024,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#neethelsinki-2024',
    'ami.fi',
    NOW(),
    NOW()
  ),

  -- Project 3: Spring House Oy - IPS-työhönvalmennus
  (
    'IPS-työhönvalmennus pääkaupunkiseudun NEET-nuorten työllistymisen ja opintopolkujen tukena',
    'IPS (Individual Placement and Support) -menetelmä tukee NEET-nuorten työllistymistä ja koulutukseen hakeutumista pääkaupunkiseudulla. Hanke toteutetaan yhteistyössä Helsingin työllisyyspalveluiden kanssa tarjoten yksilöllistä tukea ja valmennusta.',
    'Spring House Oy yhteistyössä Helsingin työllisyyspalveluiden kanssa',
    'AMI',
    true,
    57288,
    2024,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#ips-tyohonvalmennus-neet-2024',
    'ami.fi',
    NOW(),
    NOW()
  ),

  -- Project 4: Maahanmuuttajataustaisten vanhempien työelämäsiirtymät
  (
    'Pidempään kotona lapsiaan hoitaneiden maahanmuuttajataustaisten vanhempien työelämäsiirtymien nopeuttaminen',
    'Hanke tukee maahanmuuttajataustaisia vanhempia, jotka ovat olleet pidempään kotona lasten kanssa, nopeampaan siirtymiseen työelämään. Tarjotaan tukea kielitaidon kehittämiseen, ammatillisen osaamisen tunnistamiseen ja työnhakuun.',
    'Ei tiedossa',
    'AMI',
    true,
    60000,
    2024,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#maahanmuuttajavanhemmat-tyoelamaan-2024',
    'ami.fi',
    NOW(),
    NOW()
  ),

  -- Project 5: Motiva/HEUNI - Työperäisen hyväksikäytön torjunta
  (
    'Työperäisen hyväksikäytön torjunta siivousalalla osana sopimusaikaista valvontaa – vertaisoppiminen ja valvontamallin kehittäminen',
    'Hanke kehittää työperäisen hyväksikäytön ja ihmiskaupan torjuntaa siivousalalla. Motiva Services Oy ja Euroopan kriminaalipolitiikan Instituutti HEUNI tekevät yhteistyötä kuuden hankintaorganisaation kanssa vertaisoppimisen ja valvontamallin kehittämiseksi.',
    'Hankkeen toteuttavat Motiva Services Oy ja Euroopan kriminaalipolitiikan Instituutti HEUNI yhteistyössä kuuden hankintaorganisaation kanssa',
    'AMI',
    true,
    26072,
    2024,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#tyoperaisen-hyvaksikayton-torjunta-siivous-2024',
    'ami.fi',
    NOW(),
    NOW()
  ),

  -- Project 6: Vates-säätiö - Konkarit töihin!
  (
    'Konkarit töihin! Yli 55-vuotiaat suomenkieliset miehet työnhakijoina -Työllistymisen mahdollistajat',
    'Hanke tukee yli 55-vuotiaiden suomenkielisten miesten työllistymistä. Vates-säätiö ja Miina Sillanpään Säätiö tarjoavat yksilöllistä ohjausta, vertaistukea ja työllistymisen mahdollistavia palveluita. Tavoitteena on murtaa ikäsyrjintää ja tukea konkareita takaisin työelämään.',
    'Hankkeen toteuttaa Vates-säätiö yhteistyössä Miina Sillanpään Säätiön kanssa',
    'AMI',
    true,
    62271,
    2024,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#konkarit-toihin-yli-55-2024',
    'ami.fi',
    NOW(),
    NOW()
  )

-- UPSERT logic: if URL already exists, update all fields
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

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to confirm the import succeeded:

-- 1. Count total AMI projects
SELECT COUNT(*) as total_ami_projects
FROM hankkeet
WHERE on_ami_hanke = true;
-- Expected: 6 (or more if you added additional projects)

-- 2. View all imported projects with details
SELECT
  otsikko,
  toteuttaja,
  rahoitus_summa,
  vuosi,
  created_at
FROM hankkeet
WHERE on_ami_hanke = true
ORDER BY vuosi DESC, otsikko;

-- 3. Calculate total funding
SELECT
  SUM(rahoitus_summa) as total_funding,
  COUNT(*) as project_count,
  AVG(rahoitus_summa) as average_funding
FROM hankkeet
WHERE on_ami_hanke = true;
-- Expected total: 334,213 € (for the 6 projects)

-- 4. Check for any duplicates (should return 0 rows)
SELECT url, COUNT(*) as count
FROM hankkeet
WHERE on_ami_hanke = true
GROUP BY url
HAVING COUNT(*) > 1;

-- ============================================
-- SUCCESS!
-- ============================================
-- If all queries above return expected results:
-- ✅ Migration completed successfully
-- ✅ 6 real AMI projects imported
-- ✅ Ready for MCP integration testing
--
-- Next steps:
-- 1. Test MCP with ENABLE_MCP=true
-- 2. Make a test application to verify real projects appear in analysis
-- 3. Add more projects using the instructions at the top of this file
