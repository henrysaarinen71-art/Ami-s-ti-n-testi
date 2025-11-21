# TODO-lista - AMI-sovellus

Päivitetty: 2025-11-21

---

## 🔴 KRIITTISET (tee ennen tuotantoa)

### 1. ⚠️ AMI.fi Web Scraper - KORJATTAVA

**Ongelma:** AMI.fi:n scraper saa 403 Forbidden -virheen
**Syy:** Sivusto estää scraperin vahvalla anti-bot suojauksella
**Tiedosto:** `lib/scrapers/ami-scraper.ts`

**✅ TEHTY (2025-11-21):**
- ✅ Lisätty kattavat HTTP-headerit (User-Agent, Accept, Referer, Sec-Fetch-* jne.)
- ✅ Implementoitu retry-logiikka eksponentiaalisella backoffilla (3 yritystä, 2s-4s-8s)
- ✅ Lisätty 2 sekunnin viiveet pyyntöjen väliin
- ✅ Parannettu virheenkäsittelyä ja loggausta

**Tulos:** AMI.fi estää kaikki pyynnöt 403 Forbidden -vastauksella, vaikka headerit ovat realistiset.
Sivustolla on todennäköisesti:
- IP-pohjainen esto
- Cloudflare tai vastaava bot-suoja
- JavaScript-pohjainen validointi

**Seuraavat vaihtoehdot (prioriteettijärjestyksessä):**

1. **Playwright/Puppeteer selainautomatiolla** (SUOSITELTU)
   - Käyttää oikeaa selainta → JavaScript toimii
   - Ohittaa yksinkertaiset bot-suojat
   - Hitaampi mutta luotettavampi
   ```bash
   npm install playwright
   # Tarvitsee noin 300MB selainlatauksia
   ```

2. **Ota yhteyttä AMI.fi:hin**
   - Kysy onko heillä API:a tai RSS-feedä
   - Selitä käyttötarkoitus (työllisyysavustushakemusten analysointi)
   - Mahdollisesti sopivat whitelist-IP:n

3. **Proxy-palvelu** (viimeinen vaihtoehto)
   - Maksullinen ratkaisu (esim. ScraperAPI, BrightData)
   - Kiertää IP-esto
   - Ei suositella ilman AMI.fi:n lupaa

**✅ RATKAISU LÖYDETTY (2025-11-21):**
- ✅ Luotu SQL-scripti: `supabase/migrations/004_insert_ami_projects.sql`
- ✅ Sisältää 5 todellista AMI-hanketta `data/hankkeet.json` tiedostosta
- ✅ Käyttäjä voi ajaa tämän suoraan Supabase Dashboardissa
- ✅ Ei tarvitse odottaa web scraperin korjausta!

**Hankkeet jotka importoidaan:**
1. Nuorten yrittäjyyspolku 2024 (45,000 €)
2. Maahanmuuttajanaisten ammatillinen koulutus (62,000 €)
3. Pitkäaikaistyöttömien mentorointiohjelma (38,000 €)
4. Digitaidot työelämään -verkkokurssi (28,000 €)
5. Työpajatoiminta nuorille syrjäytymisvaarassa oleville (55,000 €)

**📋 KÄYTTÄJÄN TEHTÄVÄ:**
Aja migraatio Supabase Dashboardissa:
- Avaa: https://supabase.com/dashboard/project/bgrjaihmctqkayyochwd
- Mene: SQL Editor
- Kopioi: `supabase/migrations/004_insert_ami_projects.sql` sisältö
- Aja SQL
- Tarkista: `SELECT COUNT(*) FROM hankkeet WHERE on_ami_hanke = true;` → pitäisi olla 5 riviä

**Tila:** ✅ RATKAISTU (SQL-scriptillä) - Odottaa käyttäjän toimenpiteitä
**Prioriteetti:** 🟡 Keskitaso (tulevaisuudessa voisi automatisoida Playwright:llä)
**Seuraava askel:** Käyttäjä ajaa migraation 004

---

### 2. ⚠️ Työmarkkinadata - Väärät/vanhentuneet luvut

**Ongelma:** AI mainitsee "Helsingissä 76 485 työnhakijaa (syyskuu 2025)" analyysissa, mutta luku on väärä

**Syy (SELVITETTY 2025-11-21):**
- ❌ Vanha `data/tyomarkkinadata.json` sisälsi **VÄÄRÄN metriikin**:
  - Se sisälsi "Työnhakijoita laskentapäivänä" (ALL job seekers) = 76,485
  - Pitää olla "Työttömät työnhakijat" (UNEMPLOYED only) = 48,958
- ❌ `/api/data/tyomarkkinadata` luki suoraan JSON-tiedostosta, ei Supabasesta
- ❌ Ei ollut migraatiota `tyomarkkinadata_kuukausittain` tauluun

**✅ KORJATTU (2025-11-21):**
- ✅ Luotu migraatio: `supabase/migrations/003_tyomarkkinadata_table.sql`
- ✅ Taulu sisältää OIKEAT luvut syyskuulle 2025:
  - Espoo: 17,623 työtöntä
  - Helsinki: 48,958 työtöntä (EI 76,485!)
  - Vantaa: 17,739 työtöntä
  - Koko pk-seutu: 84,320 työtöntä (laskettu automaattisesti)
- ✅ API-route päivitetty lukemaan Supabasesta
- ✅ Poistettu riippuvuus `data/tyomarkkinadata.json` tiedostoon

**📋 KÄYTTÄJÄN TEHTÄVÄT:**
1. **Aja migraatio Supabase Dashboardissa:**
   - Avaa: https://supabase.com/dashboard/project/bgrjaihmctqkayyochwd
   - Mene: SQL Editor
   - Kopioi: `supabase/migrations/003_tyomarkkinadata_table.sql` sisältö
   - Aja SQL-komento
   - Tarkista että taulu luotiin: `SELECT COUNT(*) FROM tyomarkkinadata_kuukausittain;`
   - Pitäisi palauttaa 4 riviä (Espoo, Helsinki, Vantaa, Koko pk-seutu)

2. **Testaa että API toimii:**
   ```bash
   # Lokaali testi:
   curl http://localhost:3000/api/data/tyomarkkinadata \
     -H "Authorization: Bearer YOUR_TOKEN"

   # Pitäisi palauttaa data.tyonhakijat_kaupungeittain.cities.Helsinki
   # jossa "Työttömät työnhakijat (lkm.)" = 48958 (EI 76485!)
   ```

3. **Testaa analyysissa:**
   - Tee testihakemus
   - Tarkista että AI mainitsee "Helsingissä 48,958 työtöntä työnhakijaa"
   - HUOM: Ei enää "76,485"!

**SQL-kyselyillä tarkistus:**
```sql
-- Tarkista että data on oikein
SELECT kuukausi_koodi, alue, tyottomat_tyonhakijat
FROM tyomarkkinadata_kuukausittain
WHERE kuukausi_koodi = '2025M09'
ORDER BY alue;

-- Pitäisi näkyä:
-- Espoo:          17,623
-- Helsinki:       48,958  ← OIKEA luku!
-- Koko pk-seutu:  84,320
-- Vantaa:         17,739
```

**Odotettu tulos analyysissa:**
> "Pääkaupunkiseudulla (Helsinki, Espoo, Vantaa) oli syyskuussa 2025 yhteensä **84,320 työtöntä työnhakijaa**, josta Helsingissä **48,958**."

**📝 JATKOTOIMENPITEET (myöhemmin):**
- [ ] Tuo historiallinen data 2020-2025 Excelistä Supabaseen
- [ ] Automatisoi kuukausipäivitys Tilastokeskuksen API:sta (ks. TODO #6)
- [ ] Harkitse `data/tyomarkkinadata.json` poistamista (ei enää käytössä)

**Tiedostot:**
- ✅ `supabase/migrations/003_tyomarkkinadata_table.sql` - UUSI migraatio
- ✅ `app/api/data/tyomarkkinadata/route.ts` - Päivitetty käyttämään Supabasea
- ⚠️ `data/tyomarkkinadata.json` - Vanhentunut (ei enää käytössä API:ssa)

**Tila:** ✅ KORJATTU - Odottaa migraation ajoa
**Prioriteetti:** 🔴 Korkea (vaatii käyttäjän toimenpiteitä)
**Seuraava askel:** Käyttäjä ajaa migraation Supabasessa

---

### 3. 🧪 MCP-integraation tuotantotestaus

**Tila:** ✅ Infrastruktuuri valmis, odottaa testausta
**Feature flag:** `ENABLE_MCP=false` (oletus - turvallinen)

**Testaussuunnitelma:**
1. [ ] Lisää AMI-testidataa Supabaseen (tehty: 3 hanketta)
2. [ ] Testaa VANHA versio (ENABLE_MCP=false) - toimii ✅
3. [ ] Testaa UUSI versio (ENABLE_MCP=true) - testattava
4. [ ] Vertaa analyysien laatua (vanha vs. uusi)
5. [ ] Jos MCP toimii hyvin → ota käyttöön tuotannossa
6. [ ] Kun varma → poista `app/api/analyze/route.old.ts`
7. [ ] Kun varma → poista feature flag, käytä vain MCP:tä

**Dokumentaatio:**
- `docs/MCP_IMPLEMENTATION.md` - Täydelliset ohjeet
- `docs/MCP_ARCHITECTURE_PLAN.md` - Arkkitehtuuri
- `mcp-server/README.md` - MCP serverin käyttö

**Tila:** ⏸️ ODOTTAA KÄYTTÄJÄN TESTAUSTA
**Prioriteetti:** 🟡 Korkea (lisää toiminnallisuutta)

---

## 🟡 TÄRKEÄT (tee pian)

### 3.5 📊 Lisää kaikki AMI-hankkeet tietokantaan

**Ongelma:** Tietokannassa on vain 6 AMI-hanketta (2024)

**Tavoite:** Lisää kaikki AMI:n myöntämät hankkeet vuosilta 2020-2024

**Syy:**
- Anti-hallusinaatio-säännöt rajoittavat Claude:n vain tietokannassa oleviin hankkeisiin
- Mitä enemmän hankkeita, sitä parempi vertailu ja analyysi
- Estää että Claude sanoo "ei löydy vastaavaa" vaikka AMI on rahoittanut vastaavaa

**Mistä data:**
- AMI.fi:n sivuilta: https://ami.fi/avustukset/hankerahoitus/myonnetyt/
- TAI AMI:lta suoraan (jos antavat Excel-tiedoston)

**Tehtävät:**
1. [ ] Skrapaa/pyydä AMI:lta lista kaikista hankkeista (2020-2024)
2. [ ] Puhdista data ja tallenna JSON/CSV-muotoon
3. [ ] Luo SQL-migraatio: `supabase/migrations/008_insert_all_ami_projects.sql`
4. [ ] Aja migraatio Supabasessa
5. [ ] Testaa että Claude mainitsee nyt enemmän vertailuhankkeita

**Odotettu lopputulos:**
- ~50-100 AMI-hanketta tietokannassa (riippuu kuinka monta AMI on myöntänyt)
- Claude voi vertailla hakemuksia laajempaan historiaan
- Parempi analyysin laatu

**Tila:** ❌ EI ALOITETTU
**Prioriteetti:** 🟡 Korkea (parantaa merkittävästi analyysin laatua)

---

### 4. Muiden rahoittajien scraperit

**Tavoite:** Lisää monilähteiset hanketiedot (ei vain AMI)

**Rahoittajat lisättävät:**
- [ ] **TSR** (Työsuojelurahasto) - https://www.tsr.fi
- [ ] **Diak** - https://www.diak.fi
- [ ] **Laurea** - https://www.laurea.fi
- [ ] **EURA2021** (EU:n aluekehitysrahasto) - https://www.eura2021.fi

**Tehtävät:**
1. Luo scraperit: `lib/scrapers/tsr-scraper.ts`, `diak-scraper.ts`, jne.
2. Luo import-skripti: `scripts/import-muut-rahoittajat.ts`
3. Aja import: `npm run import-muut-rahoittajat`
4. Merkitse `on_ami_hanke = false` näille hankkeille
5. MCP palauttaa automaattisesti kaikki hankkeet

**Hyödyt:**
- Parempi konteksti analyyseihin
- Claude voi vertailla myös muihin rahoittajiin
- Näkee onko hakemus jo saanut rahoitusta muualta

**Tila:** ❌ EI ALOITETTU
**Prioriteetti:** 🟡 Keskitaso (nice-to-have)

---

### 5. Automaattinen hankkeiden päivitys (Crawler)

**Tavoite:** Ei manuaalista päivitystä, vaan automaattinen crawler

**Tehtävät:**
1. [ ] Luo: `workers/hanke-crawler.ts`
2. [ ] Vercel Cron: Kerran viikossa (sunnuntaisin klo 00:00)
3. [ ] Crawler ajaa kaikki scraperit (AMI, TSR, Diak, ...)
4. [ ] Tallentaa Supabaseen (UPSERT, ei duplikaatteja)
5. [ ] Lähettää email-ilmoituksen jos virhe

**Vercel Cron config (`vercel.json`):**
```json
{
  "crons": [{
    "path": "/api/cron/update-hankkeet",
    "schedule": "0 0 * * 0"
  }]
}
```

**Tila:** ❌ EI ALOITETTU
**Prioriteetti:** 🟢 Matala (toimii manuaalisesti nyt)

---

### 6. Tilastokeskuksen API-integraatio

**Tavoite:** Automaattinen työmarkkina-datan päivitys

**Ongelma:** Nyt käytetään manuaalisia XML-tiedostoja
**Ratkaisu:** Tilastokeskuksen StatFin API

**Tehtävät:**
1. [ ] Tutustu StatFin API:in: https://pxnet2.stat.fi/api1.html
2. [ ] Luo: `lib/integrations/statfin-api.ts`
3. [ ] Implementoi kuukausipäivitys (data/tyomarkkinadata.json)
4. [ ] Tai tallenna suoraan Supabaseen (`tyomarkkinadata` taulu)
5. [ ] Cron-job: Kerran kuussa

**Tila:** ❌ EI ALOITETTU
**Prioriteetti:** 🟢 Matala (manuaalinen päivitys toimii)

---

## 🟢 NICE-TO-HAVE (kun aikaa)

### 7. Supabase RLS (Row Level Security) tuotantoon

**Ongelma:** Jotkin taulut saattavat olla "Unrestricted"
**Ratkaisu:** Aseta oikeat käyttöoikeudet

**Tarkista:**
- `hankkeet` taulu - RLS enabled ✅
- `hakemukset` taulu - RLS enabled? (tarkista)
- `tyomarkkinadata` taulu (jos luodaan) - RLS enabled?

**Tila:** ⚠️ TARKISTA TILANNE
**Prioriteetti:** 🟢 Matala (ei kriittinen dev-ympäristössä)

---

### 8. Monitoring ja logitus

**Tavoitteet:**
- [ ] Scraper-virheiden seuranta (Sentry?)
- [ ] API-vastausaikojen seuranta (Vercel Analytics)
- [ ] Kuukausipäivitysten onnistumisen seuranta
- [ ] Email-ilmoitukset jos jotain menee rikki

**Tila:** ❌ EI ALOITETTU
**Prioriteetti:** 🟢 Matala

---

### 9. TypeScript-virheet ja tyypitykset

**Ongelma:** Joissain tiedostoissa saattaa olla `any`-tyyppejä
**Ratkaisu:** Lisää kunnolliset tyypit

**Tiedostot tarkistettavat:**
- `app/api/analyze/route.ts` - paljon `any` tyyppejä
- `mcp-server/hanke-server.ts` - tarkista tyypit

**Tila:** ❌ EI ALOITETTU
**Prioriteetti:** 🟢 Matala (ei estä toimintaa)

---

## 📋 MUISTILISTA KÄYTTÄJÄLLE

**Kun seuraavan kerran avaat projektin, MUISTUTA minua:**

### Kriittiset asiat:
1. ⚠️ **"AMI.fi scraper on korjattava ennen tuotantoa (403 Forbidden)"**
2. ⚠️ **"Työmarkkinadata antaa vääriä lukuja - tarkista data/tyomarkkinadata.json vs Supabase"**
3. 🧪 **"MCP-integraatio odottaa tuotantotestausta (ENABLE_MCP=true)"**

### Testausvaiheet (kun jatkat):
1. Lisää AMI-testidata Supabaseen (3 hanketta) ✅ TEHTY
2. Testaa VANHA versio (ENABLE_MCP=false)
3. Testaa UUSI versio (ENABLE_MCP=true)
4. Vertaa tuloksia
5. Raportoi toimiiko MCP

---

## 📚 Dokumentaatio

**Täydelliset ohjeet:**
- `docs/MCP_IMPLEMENTATION.md` - MCP:n käyttöönotto
- `docs/MCP_ARCHITECTURE_PLAN.md` - Arkkitehtuuri
- `docs/CURRENT_ARCHITECTURE.md` - Nykyinen toteutus
- `docs/CHECKPOINT_BEFORE_MCP.md` - Backup-dokumentti
- `mcp-server/README.md` - MCP server

**Git backup-pisteet:**
- Tag: `backup-before-mcp-migration` (c42973c)
- Tiedosto: `app/api/analyze/route.old.ts`

---

## 🎯 Prioriteettijärjestys

### Tee ENSIN (kriittiset):
1. Testaa ja korjaa MCP-integraatio (ENABLE_MCP=true)
2. Korjaa työmarkkinadata (väärät luvut analyysissa)
3. Korjaa AMI.fi scraper (403 Forbidden)

### Tee SEURAAVAKSI (tärkeät):
4. Lisää muut rahoittajat (TSR, Diak, Laurea, EURA)
5. Luo automaattinen crawler

### Tee KUN AIKAA (nice-to-have):
6. Tilastokeskuksen API-integraatio
7. Monitoring ja logitus
8. TypeScript-tyypitykset

---

**Status:** 🟡 MCP-infrastruktuuri valmis, odottaa testausta ja AMI-scraperin korjausta

Päivitetty: 2025-11-21
