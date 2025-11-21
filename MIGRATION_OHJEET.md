# Ohje: AMI-hankkeiden tuonti Supabaseen

## Nopeat ohjeet (TL;DR)

1. Avaa Supabase Dashboard: https://supabase.com/dashboard/project/bgrjaihmctqkayyochwd
2. Mene: **SQL Editor** (vasen sivupalkki)
3. Aja migraatiot järjestyksessä:
   - `005_delete_test_projects.sql` (poistaa testihankkeet)
   - `007_insert_real_ami_projects.sql` (lisää 6 oikeaa hanketta)

## Yksityiskohtaiset ohjeet

### Vaihe 1: Poista testihankkeet

1. Avaa tiedosto: `supabase/migrations/005_delete_test_projects.sql`
2. Kopioi koko tiedoston sisältö (Ctrl+A, Ctrl+C)
3. Mene Supabase Dashboard → SQL Editor
4. Liitä koodi SQL Editoriin (Ctrl+V)
5. Paina **Run** (tai Ctrl+Enter)
6. Tarkista että näet: `SUCCESS: 5 rows deleted` (tai vastaava)

### Vaihe 2: Lisää oikeat AMI-hankkeet

1. Avaa tiedosto: `supabase/migrations/007_insert_real_ami_projects.sql`
2. Kopioi koko tiedoston sisältö (Ctrl+A, Ctrl+C)
3. Mene Supabase Dashboard → SQL Editor
4. Liitä koodi SQL Editoriin (Ctrl+V)
5. Paina **Run** (tai Ctrl+Enter)
6. Tarkista tulokset verification-queryillä (ne ovat tiedoston lopussa)

### Vaihe 3: Tarkista tulos

SQL Editorissa aja seuraava kysely:

```sql
SELECT otsikko, toteuttaja, rahoitus_summa, vuosi
FROM hankkeet
WHERE on_ami_hanke = true
ORDER BY vuosi DESC, otsikko;
```

**Odotettu tulos: 6 riviä**

1. IPS-työhönvalmennus... (Spring House Oy, 57,288 €, 2024)
2. Konkarit töihin!... (Vates-säätiö, 62,271 €, 2024)
3. NEETHelsinki (Into ry, 65,631 €, 2024)
4. Pidempään kotona... (60,000 €, 2024)
5. Työperäisen hyväksikäytön torjunta... (Motiva/HEUNI, 26,072 €, 2024)
6. Vastuuasiantuntijaresurssin käyttö... (Labore, 62,951 €, 2024)

**Yhteensä rahoitus: 334,213 €**

## Miten lisätä hankkeita myöhemmin?

### Vaihtoehto A: Kopioi olemassa oleva projekti

1. Avaa `supabase/migrations/007_insert_real_ami_projects.sql`
2. Kopioi yksi projektiblokki (rivit 45-58 esimerkiksi):
   ```sql
   (
     'Hankkeen nimi',
     'Hankkeen kuvaus',
     'Toteuttajan nimi',
     'AMI',
     true,
     50000,  -- summa euroissa
     2024,   -- vuosi
     'https://ami.fi/avustukset/hankerahoitus/myonnetyt/#uusi-hanke-2024',
     'ami.fi',
     NOW(),
     NOW()
   )
   ```
3. Lisää pilkku edellisen projektin jälkeen
4. Liitä kopioimasi blokki
5. Muokkaa tiedot uuden hankkeen mukaisiksi
6. **TÄRKEÄ:** Muuta URL uniikiksi (esim. muuta slug-osa)
7. Aja päivitetty SQL Supabase Dashboardissa

### Vaihtoehto B: Käytä templatea

1. Avaa `supabase/migrations/006_insert_real_ami_projects_TEMPLATE.sql`
2. Korvaa esimerkkidata oikeilla tiedoilla
3. Aja SQL Supabase Dashboardissa

## Yleisiä ongelmia

### "duplicate key value violates unique constraint"
- **Syy:** URL on jo käytössä
- **Ratkaisu:** Muuta URL-kenttä uniikiksi

### "relation does not exist"
- **Syy:** Hankkeet-taulu ei ole luotu
- **Ratkaisu:** Aja ensin migraatiot 001 ja 002

### "permission denied"
- **Syy:** Et ole kirjautuneena oikeaan projektiin
- **Ratkaisu:** Varmista että olet projektissa: bgrjaihmctqkayyochwd

## Seuraavat askeleet

Kun migraatiot on ajettu:

1. ✅ Testaa MCP-integraatio asettamalla `ENABLE_MCP=true` `.env.local` tiedostossa
2. ✅ Tee testihakemus ja katso näkyvätkö oikeat AMI-hankkeet analyysissä
3. ✅ Jos haluat lisätä hankkeita, seuraa yllä olevia ohjeita

## Tuki

Jos kohtaat ongelmia:
1. Tarkista Supabase Console → Database → Tables → hankkeet
2. Katso onko data näkyvissä
3. Tarkista `on_ami_hanke` sarake (pitää olla `true`)
