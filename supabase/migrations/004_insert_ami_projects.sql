-- Insert Real AMI Projects from data/hankkeet.json
--
-- Created: 2025-11-21
-- Purpose: Import existing 5 AMI projects to Supabase
-- Source: data/hankkeet.json
--
-- NOTE: This replaces web scraping (which fails with 403 Forbidden)
-- with manually curated project data.

-- Insert AMI projects (UPSERT to avoid duplicates)
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
  (
    'Nuorten yrittäjyyspolku 2024',
    'Hanke tukee 18-29-vuotiaiden nuorten yrittäjyysvalmiuksia ja verkostoitumista pääkaupunkiseudulla',
    'Ei tiedossa',
    'AMI',
    true,
    45000,
    2024,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#nuorten-yrittajyyspolku-2024',
    'ami.fi',
    NOW(),
    NOW()
  ),
  (
    'Maahanmuuttajanaisten ammatillinen koulutus',
    'Koulutusohjelma ulkomaalaistaustaisten naisten työllistämisen tukemiseksi hoiva-alalle Helsingissä',
    'Ei tiedossa',
    'AMI',
    true,
    62000,
    2024,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#maahanmuuttajanaisten-ammatillinen-koulutus-2024',
    'ami.fi',
    NOW(),
    NOW()
  ),
  (
    'Pitkäaikaistyöttömien mentorointiohjelma',
    'Yksilöllinen mentorointi ja työkokeilut yli 50-vuotiaille pitkäaikaistyöttömille Espoossa ja Vantaalla',
    'Ei tiedossa',
    'AMI',
    true,
    38000,
    2023,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#pitkaaikaistyottomien-mentorointiohjelma-2023',
    'ami.fi',
    NOW(),
    NOW()
  ),
  (
    'Digitaidot työelämään -verkkokurssi',
    'Ilmainen verkkokoulutus perustason digitaidoista työnhakijoille, fokuksena vammaiset ja pitkäaikaissairaat',
    'Ei tiedossa',
    'AMI',
    true,
    28000,
    2023,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#digitaidot-tyoelamaan-verkkokurssi-2023',
    'ami.fi',
    NOW(),
    NOW()
  ),
  (
    'Työpajatoiminta nuorille syrjäytymisvaarassa oleville',
    'Matalan kynnyksen työpajaverkosto nuorille Helsingin itäisessä osassa, ammatillisen suuntautumisen tuki',
    'Ei tiedossa',
    'AMI',
    true,
    55000,
    2024,
    'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#tyopajatoiminta-nuorille-2024',
    'ami.fi',
    NOW(),
    NOW()
  )
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
-- Run this to confirm data imported correctly:
-- SELECT otsikko, rahoitus_summa, vuosi
-- FROM hankkeet
-- WHERE on_ami_hanke = true
-- ORDER BY vuosi DESC, otsikko;
--
-- Expected result: 5 rows
-- 1. Nuorten yrittäjyyspolku 2024 (45,000 €)
-- 2. Maahanmuuttajanaisten ammatillinen koulutus (62,000 €)
-- 3. Pitkäaikaistyöttömien mentorointiohjelma (38,000 €)
-- 4. Digitaidot työelämään -verkkokurssi (28,000 €)
-- 5. Työpajatoiminta nuorille syrjäytymisvaarassa oleville (55,000 €)
