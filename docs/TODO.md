# TODO-lista - AMI-sovellus

Päivitetty: 2025-11-21

---

## 🔴 KRIITTISET (tee ennen tuotantoa)

### 1. ⚠️ AMI.fi Web Scraper - KORJATTAVA

**Ongelma:** AMI.fi:n scraper sai 403 Forbidden -virheen
**Syy:** Sivusto esti scraperin (puuttuva/huono User-Agent tai anti-bot suojaus)
**Tiedosto:** `lib/scrapers/ami-scraper.ts`

**Korjausehdotukset:**
```typescript
// Lisää paremmat headerit:
headers: {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://ami.fi/'
}

// Lisää retry-logiikka:
let attempts = 0;
while (attempts < 3) {
  try {
    const response = await axios.get(url, { headers, timeout: 10000 });
    break;
  } catch (error) {
    attempts++;
    if (attempts < 3) await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Lisää viiveet requestien väliin:
await new Promise(resolve => setTimeout(resolve, 2000)); // 2s per request
```

**Vaihtoehtoiset ratkaisut:**
- Käytä Playwright/Puppeteer selainautomatiota (jos tarvitaan JavaScript)
- Käytä proxy-palvelua (jos IP on estetty)
- Harkitse AMI.fi:n kanssa yhteyttä (ehkä tarjoavat API:n?)

**Tila:** ⏸️ PYSÄYTETTY - Käytetään testidataa (3 hanketta) kunnes korjataan
**Prioriteetti:** 🔴 Korkea (tarvitaan automaattiseen päivitykseen)
**Deadline:** Ennen tuotantoon viemistä

---

### 2. ⚠️ Vanha XML-pohjainen työmarkkinadata

**Ongelma:** `data/tyomarkkinadata.json` saattaa olla vanhentunut tai puutteellinen
**Syy:** Data tulee manuaalisista XML-tiedostoista, ei automaattisesta päivityksestä

**Tehtävät:**
- [ ] Tarkista milloin `data/tyomarkkinadata.json` on viimeksi päivitetty
- [ ] Tarkista että data on ajantasalla (sisältää 2025M09 tai uudempi)
- [ ] Jos vanhentunut → lataa uusi XML Tilastokeskuksesta
- [ ] Aja: `npm run parse-data` päivittääksesi JSON:n
- [ ] Harkitse API-integraatiota automaattiseen päivitykseen

**Tiedostot:**
- `data/tyomarkkinadata.json` - JSON-tuotos
- `scripts/parse_tyomarkkinadata.py` - Parseri
- `data/raw/*.xml` - XML-lähteet (gitignored)

**Tila:** ⚠️ TARKISTA TILANNE
**Prioriteetti:** 🟡 Keskitaso (ei estä käyttöä, mutta data voi olla vanhaa)

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
2. ⚠️ **"Tarkista että data/tyomarkkinadata.json on ajantasalla"**
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
1. Korjaa AMI.fi scraper (403 Forbidden)
2. Tarkista työmarkkina-datan ajantasaisuus
3. Testaa MCP-integraatio (ENABLE_MCP=true)

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
