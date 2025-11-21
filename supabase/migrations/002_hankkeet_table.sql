-- Migration: Hankkeet-taulu MCP-aggregaattorille
-- Created: 2025-11-21
-- Purpose: Tallentaa hanketiedot eri rahoittajilta (AMI, TSR, Diak, Laurea, EURA)

-- Luo hankkeet-taulu
CREATE TABLE IF NOT EXISTS hankkeet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Perus hanketiedot
  otsikko TEXT NOT NULL,
  kuvaus TEXT,
  toteuttaja TEXT NOT NULL,

  -- Rahoittaja (KRIITTINEN!)
  rahoittaja TEXT NOT NULL CHECK (rahoittaja IN ('AMI', 'TSR', 'Diak', 'Laurea', 'EURA2021', 'Muu')),
  on_ami_hanke BOOLEAN DEFAULT false, -- ⭐ EROTTELU AMI vs MUUT

  -- Rahoitus
  rahoitus_summa DECIMAL,

  -- Aikajana
  aloitus_pvm DATE,
  lopetus_pvm DATE,
  vuosi INTEGER,

  -- Lähde
  url TEXT UNIQUE NOT NULL, -- Estää duplikaatit
  lahde_sivusto TEXT, -- Esim. "ami.fi", "tsr.fi"

  -- Metadata
  crawled_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_rahoitus_summa CHECK (rahoitus_summa >= 0),
  CONSTRAINT valid_dates CHECK (lopetus_pvm IS NULL OR aloitus_pvm IS NULL OR lopetus_pvm >= aloitus_pvm)
);

-- Indeksit (nopeuttaa hakuja)
CREATE INDEX IF NOT EXISTS idx_hankkeet_rahoittaja ON hankkeet(rahoittaja);
CREATE INDEX IF NOT EXISTS idx_hankkeet_on_ami_hanke ON hankkeet(on_ami_hanke);
CREATE INDEX IF NOT EXISTS idx_hankkeet_vuosi ON hankkeet(vuosi);
CREATE INDEX IF NOT EXISTS idx_hankkeet_url ON hankkeet(url);
CREATE INDEX IF NOT EXISTS idx_hankkeet_crawled_at ON hankkeet(crawled_at DESC);

-- Full-text search indeksi (hakuun)
CREATE INDEX IF NOT EXISTS idx_hankkeet_search ON hankkeet USING gin(
  to_tsvector('finnish', coalesce(otsikko, '') || ' ' || coalesce(kuvaus, '') || ' ' || coalesce(toteuttaja, ''))
);

-- RLS (Row Level Security) - Kaikki voivat lukea
ALTER TABLE hankkeet ENABLE ROW LEVEL SECURITY;

-- Policy: Kaikki autentikoidut käyttäjät voivat lukea hankkeet
CREATE POLICY "Hankkeet ovat julkisia"
  ON hankkeet
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Vain service role voi lisätä/päivittää hankkeet
-- (Tämä tapahtuu import-skriptien kautta, ei suoraan käyttäjien toimesta)
CREATE POLICY "Vain palvelin voi päivittää hankkeet"
  ON hankkeet
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function: Päivitä updated_at automaattisesti
CREATE OR REPLACE FUNCTION update_hankkeet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Päivitä updated_at joka kerta kun rivi päivitetään
DROP TRIGGER IF EXISTS trigger_update_hankkeet_updated_at ON hankkeet;
CREATE TRIGGER trigger_update_hankkeet_updated_at
  BEFORE UPDATE ON hankkeet
  FOR EACH ROW
  EXECUTE FUNCTION update_hankkeet_updated_at();

-- Stored procedure: Hae hanketilastot rahoittajittain
CREATE OR REPLACE FUNCTION get_hanke_stats()
RETURNS TABLE (
  rahoittaja TEXT,
  hankkeet_yhteensa BIGINT,
  rahoitus_yhteensa NUMERIC,
  keskiarvo_rahoitus NUMERIC,
  uusin_hanke TIMESTAMP,
  vanhin_hanke TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.rahoittaja,
    COUNT(*)::BIGINT AS hankkeet_yhteensa,
    SUM(h.rahoitus_summa)::NUMERIC AS rahoitus_yhteensa,
    AVG(h.rahoitus_summa)::NUMERIC AS keskiarvo_rahoitus,
    MAX(h.crawled_at) AS uusin_hanke,
    MIN(h.crawled_at) AS vanhin_hanke
  FROM hankkeet h
  GROUP BY h.rahoittaja
  ORDER BY hankkeet_yhteensa DESC;
END;
$$ LANGUAGE plpgsql;

-- Kommentit dokumentaatioksi
COMMENT ON TABLE hankkeet IS 'Hanketiedot eri rahoittajilta (AMI, TSR, Diak, Laurea, EURA2021). Käytetään MCP-serverissä kontekstin tarjoamiseen.';
COMMENT ON COLUMN hankkeet.on_ami_hanke IS 'TRUE = AMI-säätiön hanke, FALSE = muiden rahoittajien hanke. Käytetään priorisointiin analyseissä.';
COMMENT ON COLUMN hankkeet.url IS 'UNIQUE - estää duplikaatit. Hankkeen lähdesivun URL.';
COMMENT ON COLUMN hankkeet.rahoittaja IS 'Rahoittajan nimi: AMI, TSR, Diak, Laurea, EURA2021, Muu';

-- Lisää esimerkkidata (valinnainen - vain testausta varten)
-- HUOM: Tämä data poistetaan kun oikea import-skripti ajetaan
-- INSERT INTO hankkeet (
--   otsikko,
--   kuvaus,
--   toteuttaja,
--   rahoittaja,
--   on_ami_hanke,
--   rahoitus_summa,
--   vuosi,
--   url,
--   lahde_sivusto
-- ) VALUES (
--   'Testiprojekti',
--   'Tämä on testiprojekti',
--   'Testiorganisaatio',
--   'AMI',
--   true,
--   10000,
--   2024,
--   'https://ami.fi/test',
--   'ami.fi'
-- ) ON CONFLICT (url) DO NOTHING;
