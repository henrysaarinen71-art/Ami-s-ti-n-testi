-- Työmarkkinadata kuukausittain
-- Stores monthly labor market data for Helsinki metropolitan area
--
-- Created: 2025-11-21
-- Purpose: Replace data/tyomarkkinadata.json with Supabase data
--
-- NOTE: This table uses the CORRECT metric "Työttömät työnhakijat" (unemployed job seekers)
-- NOT "Työnhakijoita" (all job seekers including employed people)

CREATE TABLE IF NOT EXISTS tyomarkkinadata_kuukausittain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time period
  kuukausi_koodi VARCHAR(7) NOT NULL, -- Format: '2025M09'
  vuosi INTEGER NOT NULL,              -- Year: 2025
  kuukausi INTEGER NOT NULL,           -- Month: 1-12

  -- Region
  alue VARCHAR(50) NOT NULL,           -- 'Helsinki', 'Espoo', 'Vantaa', 'Koko pk-seutu'

  -- Main metrics (unemployed job seekers)
  tyottomat_tyonhakijat INTEGER,       -- Total unemployed job seekers

  -- Demographic breakdowns
  alle_20v_tyottomat INTEGER,          -- Under 20 years unemployed
  alle_25v_tyottomat INTEGER,          -- Under 25 years unemployed
  yli_50v_tyottomat INTEGER,           -- Over 50 years unemployed
  vammaiset_pitkasairaat INTEGER,      -- Disabled/long-term ill unemployed
  ulkomaalaiset_tyottomat INTEGER,     -- Foreign unemployed
  pitkaaikaistyottomat INTEGER,        -- Long-term unemployed (>1 year)

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one row per month per region
  UNIQUE(kuukausi_koodi, alue)
);

-- Index for fast queries by time period
CREATE INDEX IF NOT EXISTS idx_tyomarkkinadata_kuukausi ON tyomarkkinadata_kuukausittain(kuukausi_koodi);

-- Index for fast queries by region
CREATE INDEX IF NOT EXISTS idx_tyomarkkinadata_alue ON tyomarkkinadata_kuukausittain(alue);

-- Index for fast queries by year and month
CREATE INDEX IF NOT EXISTS idx_tyomarkkinadata_vuosi_kuukausi ON tyomarkkinadata_kuukausittain(vuosi, kuukausi);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_tyomarkkinadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tyomarkkinadata_updated_at
  BEFORE UPDATE ON tyomarkkinadata_kuukausittain
  FOR EACH ROW
  EXECUTE FUNCTION update_tyomarkkinadata_updated_at();

-- RLS (Row Level Security)
ALTER TABLE tyomarkkinadata_kuukausittain ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read
CREATE POLICY "Autentikoidut käyttäjät voivat lukea työmarkkinadataa"
  ON tyomarkkinadata_kuukausittain
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service_role can insert/update
CREATE POLICY "Vain service_role voi lisätä työmarkkinadataa"
  ON tyomarkkinadata_kuukausittain
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Vain service_role voi päivittää työmarkkinadataa"
  ON tyomarkkinadata_kuukausittain
  FOR UPDATE
  TO service_role
  USING (true);

-- Insert test data for September 2025
-- Source: TODO.md specifies these as the correct numbers
-- NOTE: These are "Työttömät työnhakijat" (unemployed), NOT "Työnhakijoita" (all job seekers)
INSERT INTO tyomarkkinadata_kuukausittain (
  kuukausi_koodi, vuosi, kuukausi, alue, tyottomat_tyonhakijat,
  alle_20v_tyottomat, alle_25v_tyottomat, yli_50v_tyottomat,
  vammaiset_pitkasairaat, ulkomaalaiset_tyottomat, pitkaaikaistyottomat
) VALUES
  -- Espoo (September 2025)
  ('2025M09', 2025, 9, 'Espoo', 17623, 380, 1595, 5606, 1256, 4981, 7723),

  -- Helsinki (September 2025)
  -- NOTE: 48,958 is the CORRECT number for unemployed job seekers
  -- The old JSON had 76,485 which was ALL job seekers (including employed)
  ('2025M09', 2025, 9, 'Helsinki', 48958, 805, 4076, 15789, 3935, 10614, 23719),

  -- Vantaa (September 2025)
  ('2025M09', 2025, 9, 'Vantaa', 17739, 403, 1874, 5394, 1409, 5584, 7729),

  -- Koko pk-seutu (September 2025) - calculated as sum of Espoo + Helsinki + Vantaa
  ('2025M09', 2025, 9, 'Koko pk-seutu', 84320, 1588, 7545, 26789, 6600, 21179, 39171)
ON CONFLICT (kuukausi_koodi, alue) DO UPDATE
SET
  tyottomat_tyonhakijat = EXCLUDED.tyottomat_tyonhakijat,
  alle_20v_tyottomat = EXCLUDED.alle_20v_tyottomat,
  alle_25v_tyottomat = EXCLUDED.alle_25v_tyottomat,
  yli_50v_tyottomat = EXCLUDED.yli_50v_tyottomat,
  vammaiset_pitkasairaat = EXCLUDED.vammaiset_pitkasairaat,
  ulkomaalaiset_tyottomat = EXCLUDED.ulkomaalaiset_tyottomat,
  pitkaaikaistyottomat = EXCLUDED.pitkaaikaistyottomat,
  updated_at = NOW();

-- Verification query
-- Run this to confirm data is correct:
-- SELECT kuukausi_koodi, alue, tyottomat_tyonhakijat
-- FROM tyomarkkinadata_kuukausittain
-- WHERE kuukausi_koodi = '2025M09'
-- ORDER BY alue;
--
-- Expected result:
-- Espoo:          17,623
-- Helsinki:       48,958 (NOT 76,485!)
-- Koko pk-seutu:  84,320
-- Vantaa:         17,739
