# Nykyinen arkkitehtuuri - Hankeanalysointi

Päivitetty: 2025-11-21

## Järjestelmän kuvaus

Ami-säätiön hankeanalyysijärjestelmä on web-sovellus, joka käyttää Claude AI:ta analysoimaan hankerahakemuksia AMI-säätiön kriteerien mukaisesti. Järjestelmä integroi työmarkkina-dataa, aiempia hankkeita ja Claude AI:n analyysikyvyt.

---

## Komponentit

### 1. Frontend (Next.js 15)

**Pää-UI-komponentit:**
- `app/dashboard/analysoi/page.tsx` - Hakemuslomake ja analyysinäkymä
- `app/dashboard/components/WelcomeModal.tsx` - MCP-konseptin dokumentaatio (ei toteutusta)

**Toiminta:**
1. Käyttäjä syöttää hakemuksen, summan ja kuvauksen
2. Frontend lähettää `POST /api/analyze` pyyntö
3. Näyttää analyysin tulokset

---

### 2. Backend API Endpoints

#### 2.1 Analyysi-endpoint (KRIITTISIN)

**Tiedosto:** `app/api/analyze/route.ts` (535 riviä)
**Endpoint:** `POST /api/analyze`
**Autentikointi:** Supabase Auth (pakollinen)

**Prosessi (8 vaihetta):**

```
1. AUTHENTICATION
   └─> Supabase: Hae käyttäjän tiedot
   └─> Jos ei kirjautunut → 401 Unauthorized

2. PARSING_REQUEST
   └─> Parsii request body
   └─> Validoi: hakemus_teksti, haettava_summa (pakollisia)
   └─> Validoi: kuvaus (vapaaehtoinen)

3. FETCHING_LABOR_DATA
   └─> Fetch: GET /api/data/tyomarkkinadata
   └─> Jos epäonnistuu → jatka ilman dataa (null)
   └─> Jos onnistuu → käytä analyysissä

4. FETCHING_PROJECT_DATA
   └─> readFile: data/hankkeet.json
   └─> Jos puuttuu → jatka ilman dataa (null)
   └─> Sisältää: ami.myonnetyt, muut_rahoittajat, eura

5. BUILDING_PROMPT
   └─> Yhdistä: kriteerit + data + hakemus
   └─> Prompt on ~400 riviä pitkä (katso kohta 3)

6. CALLING_CLAUDE_API
   └─> anthropic.messages.create({
         model: 'claude-sonnet-4-5-20250929',
         max_tokens: 4096,
         messages: [{ role: 'user', content: prompt }]
       })

7. PARSING_CLAUDE_RESPONSE
   └─> Etsi JSON regex: /\{[\s\S]*\}/
   └─> Parsii JSON
   └─> Lisää haettava_summa arviointiin

8. SAVING_TO_SUPABASE
   └─> supabase.from('hakemukset').insert({...})
   └─> Palauta: { success: true, arviointi, hakemus_id }
```

**Virheenkäsittely:**
- Jokainen vaihe on try-catch-suojattu
- Vaihe tallennetaan `currentStep`-muuttujaan
- Virheviesti kertoo missä vaiheessa virhe tapahtui
- Työmarkkina- ja hankedata ovat VALINNAISIA (jatkuu jos puuttuvat)

---

#### 2.2 Työmarkkina-data endpoint

**Tiedosto:** `app/api/data/tyomarkkinadata/route.ts` (73 riviä)
**Endpoint:** `GET /api/data/tyomarkkinadata`
**Autentikointi:** Supabase Auth (pakollinen)

**Toiminta:**
```typescript
1. Autentikoi käyttäjä
2. readFile('data/tyomarkkinadata.json')
3. Palauta: { success: true, data: {...} }
```

**Käyttö:**
- Kutsutaan analysoinnin aikana (vaihe 3)
- Jos tiedosto puuttuu → 404
- Sisältää: metadata, tyonhakijat_kaupungeittain, koulutusasteet, ammattiryhmat

---

#### 2.3 Hallitusraportti endpoint

**Tiedosto:** `app/api/reports/hallitus/route.ts` (150+ riviä)
**Endpoint:** `GET /api/reports/hallitus`

**Toiminta:**
1. Hae kaikki käyttäjän hakemukset Supabasesta
2. Hae työmarkkina-data
3. Generoi markdown-raportti Claude:lla
4. Palauta markdown

---

#### 2.4 Meta-analyysi endpoint

**Tiedosto:** `app/api/meta-analysis/route.ts` (150+ riviä)
**Endpoint:** `GET /api/meta-analysis`

**Toiminta:**
1. Hae hakemukset (min. 3 kpl)
2. Analysoi trendit Claude:lla
3. Anna strategisia suosituksia

---

### 3. Claude AI Integration

**Kirjasto:** `@anthropic-ai/sdk`
**Malli:** `claude-sonnet-4-5-20250929`
**Max tokens:** 4096

**Prompt-rakenne (app/api/analyze/route.ts:112-413):**

```
1. OHJEET (30 riviä)
   - Analysoi hakemus työmarkkinadatan, painopisteiden JA olemassa olevien hankkeiden valossa

2. AMI-SÄÄTIÖN ARVIOINTIKRITEERIT (50 riviä)
   - Pääkriteerit 1-3:
     * Relevanttius ja muutoskyky
     * Integroituminen pääkaupunkiseudulle
     * Toteutuskelpoisuus
   - Kysymykset jokaiseen kriteeriin

3. OHJELMALLISET TEEMAT (30 riviä)
   - Teema 1: Osaaminen ja kohtaannossa onnistuminen
   - Teema 2: Monimuotoisuus työmarkkinoilla
   - Teema 3: Työhyvinvointi ja työssä jaksaminen

4. KONKREETTISET MUUTOSKOHTEET (30 riviä)
   - 8 konkreettista muutoskohdetta
   - Hakemus voi liittyä yhteen tai useampaan

5. MAANTIETEELLINEN RAJAUS (5 riviä)
   - Pääkaupunkiseutu: Helsinki, Espoo, Vantaa, Kauniainen

6. TYÖMARKKINADATA (20 riviä)
   - Metadata
   - Työnhakijat kaupungeittain (syyskuu 2025)
   - Työttömät koulutusasteittain
   - ⚠️ KRIITTINEN: ÄLÄ HALLUSINOI HANKKEITA!

7. AMI-SÄÄTIÖN MYÖNNETYT HANKKEET (30 riviä)
   - Lista myönnetyistä hankkeista (nimi, vuosi, kuvaus, summa)
   - TÄRKEÄ: Käytä VAIN näitä, älä keksi muita
   - Jos ei löydy → sano "Ei löytynyt vastaavaa"

8. MUIDEN RAHOITTAJIEN HANKKEET (10 riviä)
   - TSR, Diak, Laurea, EURA (jos saatavilla)

9. PRIORISOINTIOHJE - HANKEVERTAILU (60 riviä)
   - AMI ENSIN (ensisijainen)
   - Muut rahoittajat toissijaisia
   - Kriittiset kysymykset: "Onko Ami rahoittanut vastaavaa?"
   - Esimerkit hyvistä ja huonoista vastauksista

10. HAKEMUS (10 riviä)
    - Haettava summa
    - Kuvaus
    - Hakemusteksti

11. TEHTÄVÄ (20 riviä)
    - Palauta JSON:
      {
        arvosana: 1-10,
        vahvuudet: [...],
        heikkoudet: [...],
        suositus: "Myönnettävä|Harkittava|Hylättävä",
        toimikunnan_huomiot: {
          keskeiset_kysymykset: [...],
          kriittiset_kysymykset: [
            { kysymys, perustelu, vakavuus }
          ]
        }
      }

12. KRIITTISET KYSYMYKSET (80 riviä)
    - 8 pakollista kysymystä:
      1. Mihin teemaan liittyy? (KRIITTISIN)
      2. Mihin muutoskohteisiin vaikuttaa?
      3. Onko Ami rahoittanut vastaavaa?
      4. Onko joku muu rahoittanut vastaavaa?
      5. Vastaako työmarkkinatilanteeseen?
      6. Onko teknisesti heikkolaatuinen?
      7. Onko aikataulu/budjetti realistinen?
      8. Onko vaikuttavuus mitattavissa?

13. LISÄARVIOINTI (40 riviä)
    - Ami-säätiön rooli (vapaaehtoinen)
    - Jatkuvuus hankkeen päätyttyä

14. PAKOLLISIA TARKISTUKSIA (15 riviä)
    - Teemasopivuus (KRIITTISIN)
    - Pääkaupunkiseutu
    - Integroituminen
    - Relevanttius
    - Toteutuskelpoisuus
    - Vertaa aina Ami-hankkeisiin
```

**Vastauksen käsittely:**
```typescript
// Etsi JSON regex:llä
const jsonMatch = responseText.match(/\{[\s\S]*\}/)

// Parsii JSON
const arviointi = JSON.parse(jsonMatch[0])

// Lisää summa
arviointi.haettava_summa = haettava_summa
```

---

### 4. Data-lähteet

#### 4.1 AMI-säätiön web scraper

**Tiedosto:** `lib/scrapers/ami-scraper.ts` (171 riviä)
**Teknologia:** axios + cheerio
**Komento:** `npm run scrape-data` (kutsuu `scripts/scrape-all.ts`)

**Mitä scrapeataan:**

1. **Myönnetyt hankkeet**
   - URL: https://ami.fi/avustukset/hankerahoitus/myonnetyt/
   - Rivit: 36-87
   - Data: nimi, kuvaus, summa, vuosi

2. **Painopisteet**
   - URL: https://ami.fi/toiminta/
   - Rivit: 89-117
   - Data: pääsisältö (max 2000 merkkiä)

3. **Blogi-artikkelit**
   - URL: https://ami.fi/category/suunnanetsija-blogi/
   - Rivit: 119-163
   - Data: otsikko, url, päivä, tiivistelmä

**Tuotos:** `data/hankkeet.json`

**Rakenne:**
```json
{
  "paivitetty": "2025-11-20",
  "ami": {
    "myonnetyt": [...],
    "painopisteet": "...",
    "blogit": [...]
  },
  "muut_rahoittajat": {},
  "eura": []
}
```

**TODOs (scripts/scrape-all.ts:52-56):**
- TSR (ei toteutettu)
- Diak (ei toteutettu)
- Laurea (ei toteutettu)
- EURA2021 (ei toteutettu)

---

#### 4.2 Työmarkkina-data parser

**Tiedosto:** `scripts/parse_tyomarkkinadata.py` (280 riviä)
**Teknologia:** Python XML parser
**Komento:** `npm run parse-data`

**Lähde:**
- Tilastokeskus (manuaaliset XML-tiedostot)
- Sijainti: `data/raw/` (gitignored)

**Tuetut datatyypit:**
- **12r5**: Työnhakijat kaupungeittain (Espoo, Helsinki, Vantaa)
- **12te**: Työttömät koulutusasteittain
- **12ti**: Työttömät ja avoimet paikat ammattryhmittäin

**Tuotos:** `data/tyomarkkinadata.json`

**Rakenne:**
```json
{
  "metadata": {
    "paivitetty": "2025-11-21",
    "alueet": ["Espoo", "Helsinki", "Vantaa"],
    "aikajakso": "2024M12 - 2025M09",
    "source_files": 3,
    "files": [...]
  },
  "tyonhakijat_kaupungeittain": {...},
  "koulutusasteet": {...},
  "ammattiryhmat": {...}
}
```

---

### 5. Tietokanta (Supabase)

**Taulu:** `hakemukset`

**Sarakkeet:**
```sql
id UUID PRIMARY KEY
user_id UUID (foreign key)
user_email TEXT
hakemus_teksti TEXT
haettava_summa DECIMAL
kuvaus TEXT (nullable)
arviointi JSONB
status TEXT ('arvioitu')
created_at TIMESTAMP
```

**RLS (Row Level Security):**
- Käyttäjä näkee vain omat hakemuksensa
- Autentikointi vaaditaan kaikissa operaatioissa

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    EXTERNAL SOURCES                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ami.fi                    Tilastokeskus                 │
│  (web pages)               (XML files)                   │
│      │                          │                         │
│      ▼                          ▼                         │
│  axios+cheerio            Python parser                  │
│      │                          │                         │
│      ▼                          ▼                         │
│  hankkeet.json           tyomarkkinadata.json            │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                       FRONTEND                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  User fills form → POST /api/analyze                     │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    BACKEND API                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. Authenticate (Supabase)                              │
│  2. Fetch labor data → GET /api/data/tyomarkkinadata    │
│  3. Load project data → readFile(hankkeet.json)         │
│  4. Build prompt (400 lines)                            │
│  5. Call Claude API                                      │
│  6. Parse JSON response                                  │
│  7. Save to Supabase                                     │
│  8. Return evaluation                                    │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    CLAUDE API                             │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Input: Prompt (criteria + data + application)          │
│  Output: JSON evaluation                                │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                      DATABASE                             │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Supabase PostgreSQL                                     │
│  └─ hakemukset table                                     │
│     └─ arviointi JSONB                                   │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Teknologiat

| Komponentti | Teknologia | Versio |
|-------------|-----------|--------|
| Framework | Next.js | 15 |
| Runtime | Node.js | 18+ |
| AI | Anthropic Claude | Sonnet 4.5 |
| Database | Supabase | Cloud |
| Auth | Supabase Auth | - |
| Web Scraping | axios + cheerio | - |
| Data Parsing | Python | 3.x |
| Hosting | Vercel | - |

---

## Ympäristömuuttujat

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Site
NEXT_PUBLIC_SITE_URL=https://...
VERCEL_URL=... (automaattinen Vercelissä)
```

---

## Komennot

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Data collection
npm run scrape-data        # Scrape ami.fi
npm run parse-data         # Parse XML → JSON
```

---

## Kriittiset riippuvuudet

**Jos nämä muuttuvat, analyysi rikkoutuu:**

1. **Claude API prompt** (app/api/analyze/route.ts:112-413)
   - Prompt määrittää analyysin laadun
   - Muutokset voivat vaikuttaa tulosten rakenteeseen

2. **JSON-parsinta** (app/api/analyze/route.ts:445-461)
   - Regex: `/\{[\s\S]*\}/`
   - Jos Claude muuttaa vastausformaattia → virhe

3. **Tiedostorakenteet**
   - `data/hankkeet.json` - Olemassa olevat hankkeet
   - `data/tyomarkkinadata.json` - Työmarkkina-analyysi

4. **Supabase-schema**
   - `hakemukset`-taulu
   - JSONB-arviointi

---

## Tunnetut rajoitteet

1. **Manuaalinen datapäivitys**
   - Web scraping: manuaalinen (`npm run scrape-data`)
   - Työmarkkina-data: manuaalinen XML-lataus + parse

2. **Vain AMI-säätiö**
   - Ei muita rahoittajia (TSR, Diak, Laurea, EURA)
   - TODO-merkkauksia koodissa

3. **Ei MCP-integraatiota**
   - MCP mainittu vain dokumentaatiossa (WelcomeModal.tsx)
   - Ei toteutettua MCP-palvelinta

4. **Staattinen data**
   - Hankkeet ja työmarkkina-data tallennettu JSON-tiedostoihin
   - Ei reaaliaikaista päivitystä

---

## Miksi tämä toimii hyvin

✅ **Kontekstuaalinen analyysi**
- Claude saa kaikki tarvittavat tiedot yhdessä pyynnössä
- Työmarkkina-data, hankevertailu, kriteerit

✅ **Johdonmukainen rakenne**
- Selkeä prompt-rakenne
- JSON-validointi
- Virheenkäsittely

✅ **Käyttäjäystävällinen**
- Yksinkertainen lomake
- Selkeä analyysi
- Tallentuu tietokantaan

✅ **Laajennettavissa**
- Modulaarinen rakenne
- Helppo lisätä uusia datalähteitä
- Feature flag -valmis

---

## MCP-migraation haasteet

### Mitä EI SAA MUUTTAA:

1. **Analyysi-endpoint** (`app/api/analyze/route.ts`)
   - Prompt-rakenne
   - JSON-parsinta
   - Vaiheittainen prosessi

2. **Claude API-integraatio**
   - Malli: claude-sonnet-4-5-20250929
   - Max tokens: 4096
   - Message format

3. **Supabase-integraatio**
   - Hakemukset-taulu
   - Arviointi-JSONB

### Mitä VOIDAAN muuttaa:

1. **Data-lähteet**
   - Web scraping → MCP-server
   - JSON-tiedostot → Supabase-tietokanta

2. **Data-päivitys**
   - Manuaalinen → Automaattinen
   - Staattiset tiedostot → Dynaaminen haku

3. **Rahoittajat**
   - Vain AMI → Monilähteiset (TSR, Diak, Laurea, EURA)

---

**MUISTA:** Tämä dokumentti kuvaa TOIMIVAA järjestelmää.
Kaikki muutokset pitää tehdä niin että tämä säilyy toimivana.
