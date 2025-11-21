# Supabase Migraatiot

## Yleiskatsaus

Tämä kansio sisältää kaikki Supabase-tietokantamigraatiot. Migraatiot on numeroitu järjestyksessä:

1. **001_hakemukset_table.sql** - Hakemukset-taulu (käyttäjien hakemukset ja arvioinnit)
2. **002_hankkeet_table.sql** - Hankkeet-taulu (AMI ja muut rahoittajat, MCP-käyttöön)

## Miten migraatiot ajetaan

### Vaihtoehto 1: Supabase Dashboard (suositeltu)

1. Avaa Supabase-projekti: https://supabase.com/dashboard/project/bgrjaihmctqkayyochwd
2. Mene: **SQL Editor** (vasen sivupalkki)
3. Avaa migraatiotiedosto (esim. `001_hakemukset_table.sql`)
4. Kopioi koko tiedoston sisältö
5. Liitä SQL Editoriin
6. Paina **Run** (tai Ctrl+Enter)
7. Tarkista että "Success. No rows returned" tai vastaava viesti näkyy

Toista kaikille migraatioille järjestyksessä (001, 002, jne.)

### Vaihtoehto 2: Supabase CLI (edistyneille)

```bash
# Asenna Supabase CLI (jos ei ole)
npm install -g supabase

# Linkitä projekti
supabase link --project-ref bgrjaihmctqkayyochwd

# Aja migraatiot
supabase db push
```

## Migraatioiden tarkistus

Voit tarkistaa että migraatiot on ajettu SQL Editorissä:

```sql
-- Tarkista että taulut on luotu
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('hakemukset', 'hankkeet');

-- Pitäisi palauttaa:
-- hakemukset
-- hankkeet
```

## Ongelmatilanteissa

Jos migraatio epäonnistuu:

1. **"relation already exists"** - Taulu on jo olemassa, ok
2. **"permission denied"** - Varmista että olet kirjautuneena oikeaan projektiin
3. **"syntax error"** - Tarkista että kopioit koko SQL-tiedoston

## RLS (Row Level Security)

Molemmat taulut käyttävät RLS:ää:

- **hakemukset**: Käyttäjät näkevät vain omat hakemuksensa
- **hankkeet**: Kaikki autentikoidut käyttäjät voivat lukea, vain service_role voi kirjoittaa

## Lisätiedot

Katso dokumentaatio:
- `docs/MCP_IMPLEMENTATION.md` - MCP-integraation ohjeet
- `docs/TODO.md` - Ylläpitotehtävät
