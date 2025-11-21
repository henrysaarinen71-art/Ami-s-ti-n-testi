-- Delete Test Projects Before Importing Real Ones
--
-- Created: 2025-11-21
-- Purpose: Remove the 5 test projects before importing actual AMI projects
--
-- IMPORTANT: Run this BEFORE importing real projects to avoid confusion

-- Delete test projects by URL pattern
DELETE FROM hankkeet
WHERE url IN (
  'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#nuorten-yrittajyyspolku-2024',
  'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#maahanmuuttajanaisten-ammatillinen-koulutus-2024',
  'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#pitkaaikaistyottomien-mentorointiohjelma-2023',
  'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#digitaidot-tyoelamaan-verkkokurssi-2023',
  'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#tyopajatoiminta-nuorille-2024'
);

-- Verification query
-- Check that test projects are gone:
-- SELECT otsikko, rahoitus_summa, vuosi
-- FROM hankkeet
-- WHERE on_ami_hanke = true;
--
-- Expected result: 0 rows (unless real projects already imported)

-- Show count after deletion
SELECT COUNT(*) as remaining_ami_projects
FROM hankkeet
WHERE on_ami_hanke = true;
