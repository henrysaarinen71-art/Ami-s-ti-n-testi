# Checkpoint: Toimiva versio ennen MCP-migraatiota

**Päivämäärä:** 2025-11-21
**Branch:** claude/web-scraping-mcp-migration-01B9w9qzdkVadqKTRbB8Zcs6
**Commit hash:** c42973cb55ccc9a82676f7fdca104bc98060bf01
**Backup tag:** backup-before-mcp-migration

## Toimivat ominaisuuset tällä hetkellä:

✅ Hankeanalyysi toimii erinomaisesti
✅ Dashboard-tilastot
✅ Hakemuslista
✅ Supabase-autentikointi
✅ Claude API-integraatio
✅ Työmarkkina-datan integrointi analyyseihin
✅ Hallitusraporttien generointi
✅ Meta-analyysi toiminnallisuus

## Tärkeät tiedostot (ÄLÄ MUUTA ilman varovaisuutta):

### Analyysitoiminnot (KRIITTISET)
- `app/api/analyze/route.ts` - Hankeanalyysin API (150+ riviä)
- `app/api/reports/hallitus/route.ts` - Hallitusraporttien API (150+ riviä)
- `app/api/meta-analysis/route.ts` - Meta-analyysi API (150+ riviä)
- `app/dashboard/analysoi/page.tsx` - Analysointisivu

### Data-lähteet (TOIMIVAT NYT)
- `lib/scrapers/ami-scraper.ts` - AMI-säätiön web scraper (171 riviä)
- `scripts/scrape-all.ts` - Pääskripti web scrapingille (80 riviä)
- `scripts/parse_tyomarkkinadata.py` - Työmarkkina-datan parseri (280 riviä)

### Data-tiedostot
- `data/hankkeet.json` - Scrapatut hanketiedot
- `data/tyomarkkinadata.json` - Työmarkkina-data

### API-endpointit (TOIMIVAT)
- `app/api/data/tyomarkkinadata/route.ts` - Työmarkkina-datan API (73 riviä)

## Nykyinen data-arkkitehtuuri:

### 1. AMI-säätiön data (Web Scraping)
**Lähde:** https://ami.fi
**Teknologia:** axios + cheerio
**Päivitys:** Manuaalinen (`npm run scrape-data`)
**Tuotos:** `data/hankkeet.json`

**Mitä kerätään:**
- Myönnetyt hankkeet (nimi, kuvaus, summa, vuosi)
- Toiminnan painopisteet
- Blogi-artikkelit

### 2. Työmarkkina-data (XML → JSON)
**Lähde:** Tilastokeskus (manuaaliset XML-tiedostot)
**Teknologia:** Python XML parser
**Päivitys:** Manuaalinen (`npm run parse-data`)
**Tuotos:** `data/tyomarkkinadata.json`

**Mitä kerätään:**
- Työnhakijat kaupungeittain (Espoo, Helsinki, Vantaa)
- Työttömät koulutusasteittain
- Avoimet työpaikat ammattryhmittäin

### 3. Analyysi-integraatio
**Prosessi:**
1. Käyttäjä lähettää hakemuksen → `POST /api/analyze`
2. API hakee työmarkkina-datan → `GET /api/data/tyomarkkinadata`
3. API lataa hanketiedot → `data/hankkeet.json`
4. Kaikki data yhdistetään ja lähetetään Claude API:lle
5. Claude generoi analyysin AMI-säätiön kriteerien mukaan

## Jos jokin menee rikki:

### Pika-palautus git tagilla
```bash
# Palaa turvalliseen tilaan
git checkout backup-before-mcp-migration
```

### Tai palauta vain tietyt tiedostot
```bash
# Palauta vain analyysitoiminto
git checkout backup-before-mcp-migration -- app/api/analyze/route.ts

# Palauta web scraper
git checkout backup-before-mcp-migration -- lib/scrapers/ami-scraper.ts
git checkout backup-before-mcp-migration -- scripts/scrape-all.ts
```

## Esimerkki toimivasta analyysistä:

Nykyinen analyysijärjestelmä tuottaa:

### Vahvuudet:
- ✅ Liittyy AMI:n muutoskohteisiin (erityisesti kohta 4: Työllisyyttä tukevat palvelut)
- ✅ Sisältää työmarkkina-analyysin (käyttää Tilastokeskuksen dataa)
- ✅ Vertailee aiemmin myönnettyihin hankkeisiin
- ✅ Antaa konkreettisia kehitysehdotuksia

### Rakenne:
1. Yhteenveto
2. Vahvuudet (✓)
3. Kehityskohteet (⚠)
4. Kriittiset puutteet (❌)
5. Konkreettiset kysymykset hakijalle
6. Pisteet (0-100)
7. Suositus (kyllä/ei/ehdollinen)

## Miksi tämä toimii hyvin:

1. **Kontekstuaalinen analyysi** - Claude saa:
   - Hakemustekstin
   - AMI:n kriteerit
   - Työmarkkina-datan (ajankohtainen)
   - Vertailuhankkeita (aiemmin myönnetyt)

2. **Johdonmukainen rakenne** - Prompt antaa selkeät ohjeet Claude:lle

3. **Työmarkkina-integraatio** - Käyttää aitoa Tilastokeskuksen dataa

4. **Konkreettisuus** - Antaa kysymyksiä ja kehitysehdotuksia, ei vain yleisiä kommentteja

## MCP-migraation tavoitteet (ÄLÄ RIKO TÄTÄ):

### Mitä MCP tuo lisää:
- ✅ Automaattinen datan päivitys (ei manuaalista scrapingia)
- ✅ Monilähteiset hanketiedot (TSR, Diak, Laurea, EURA2021)
- ✅ Parempi AMI-hankkeiden erottelu muista
- ✅ Real-time työmarkkina-data

### Mitä EI muuteta:
- ❌ Analyysitoiminnon logiikkaa
- ❌ Claude API-integrointia
- ❌ Analyysin rakennetta
- ❌ Pisteytysjärjestelmää
- ❌ UI-komponentteja

## Testausvaatimukset ennen julkaisua:

1. ✅ Vanha analyysitoiminto toimii ilman MCP:tä
2. ✅ Uusi MCP-versio antaa vähintään yhtä laadukkaan analyysin
3. ✅ Feature flag toimii (voidaan vaihtaa helposti)
4. ✅ Ei regressioita muissa toiminnoissa
5. ✅ Dokumentaatio ajan tasalla

---

**HUOM:** Tämä on viimeinen toimiva versio ennen MCP-migraatiota.
**AINA kun epävarma, palaa tähän versioon.**
