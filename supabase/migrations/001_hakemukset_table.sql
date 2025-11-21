-- Migration: Hakemukset-taulu
-- Created: 2025-11-21
-- Purpose: Tallentaa käyttäjien lähettämät hakemukset ja niiden arvioinnit

-- Luo hakemukset-taulu
CREATE TABLE IF NOT EXISTS hakemukset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Hakemuksen tiedot
  hakemus_teksti TEXT NOT NULL,
  haettava_summa DECIMAL NOT NULL,
  kuvaus TEXT,

  -- Käyttäjätiedot
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,

  -- Arviointi (JSON-muodossa)
  arviointi JSONB NOT NULL,

  -- Tila
  status TEXT NOT NULL DEFAULT 'arvioitu',

  -- Aikaleimoja
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_haettava_summa CHECK (haettava_summa > 0),
  CONSTRAINT valid_status CHECK (status IN ('arvioitu', 'kasittelyssa', 'hyvaksytty', 'hylatty'))
);

-- Indeksit (nopeuttaa hakuja)
CREATE INDEX IF NOT EXISTS idx_hakemukset_user_id ON hakemukset(user_id);
CREATE INDEX IF NOT EXISTS idx_hakemukset_user_email ON hakemukset(user_email);
CREATE INDEX IF NOT EXISTS idx_hakemukset_status ON hakemukset(status);
CREATE INDEX IF NOT EXISTS idx_hakemukset_created_at ON hakemukset(created_at DESC);

-- Full-text search indeksi (hakuun)
CREATE INDEX IF NOT EXISTS idx_hakemukset_search ON hakemukset USING gin(
  to_tsvector('finnish', coalesce(hakemus_teksti, '') || ' ' || coalesce(kuvaus, ''))
);

-- RLS (Row Level Security) - Käyttäjät näkevät vain omat hakemuksensa
ALTER TABLE hakemukset ENABLE ROW LEVEL SECURITY;

-- Policy: Käyttäjä voi lukea omat hakemuksensa
CREATE POLICY "Käyttäjä voi lukea omat hakemuksensa"
  ON hakemukset
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Käyttäjä voi lisätä omia hakemuksiaan
CREATE POLICY "Käyttäjä voi lisätä omia hakemuksiaan"
  ON hakemukset
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Käyttäjä voi päivittää omia hakemuksiaan
CREATE POLICY "Käyttäjä voi päivittää omia hakemuksiaan"
  ON hakemukset
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Käyttäjä voi poistaa omia hakemuksiaan
CREATE POLICY "Käyttäjä voi poistaa omia hakemuksiaan"
  ON hakemukset
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role voi tehdä kaikkea (API-käyttö)
CREATE POLICY "Service role voi tehdä kaikkea"
  ON hakemukset
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function: Päivitä updated_at automaattisesti
CREATE OR REPLACE FUNCTION update_hakemukset_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Päivitä updated_at joka kerta kun rivi päivitetään
DROP TRIGGER IF EXISTS trigger_update_hakemukset_updated_at ON hakemukset;
CREATE TRIGGER trigger_update_hakemukset_updated_at
  BEFORE UPDATE ON hakemukset
  FOR EACH ROW
  EXECUTE FUNCTION update_hakemukset_updated_at();

-- Kommentit dokumentaatioksi
COMMENT ON TABLE hakemukset IS 'Käyttäjien lähettämät hanke-hakemukset ja niiden Claude AI -arvioinnit';
COMMENT ON COLUMN hakemukset.hakemus_teksti IS 'Hakemuksen vapaamuotoinen teksti';
COMMENT ON COLUMN hakemukset.haettava_summa IS 'Haettava rahoitussumma euroissa';
COMMENT ON COLUMN hakemukset.arviointi IS 'Claude AI:n generoima arviointi JSON-muodossa';
COMMENT ON COLUMN hakemukset.status IS 'Hakemuksen tila: arvioitu, kasittelyssa, hyvaksytty, hylatty';
