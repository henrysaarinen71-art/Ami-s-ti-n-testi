# MCP-arkkitehtuurisuunnitelma

Päivitetty: 2025-11-21

## Tavoitteet

### Mitä MCP tuo lisää:

1. ✅ **Automaattinen hanketiedon keruu** - Ei enää manuaalista `npm run scrape-data`
2. ✅ **Monilähteiset hanketiedot** - TSR, Diak, Laurea, EURA2021 (ei vain AMI)
3. ✅ **AMI-hankkeiden erottelu** - Selkeä `on_ami_hanke` flag tietokannassa
4. ✅ **Reaaliaikainen data** - MCP-server voi päivittää dataa taustalla
5. ✅ **Claude-native integraatio** - MCP on Anthropic:in standardi

### Mitä EI muuteta:

❌ **Nykyistä analysointilogiikkaa** - Toimii hyvin, säilytetään
❌ **Claude API-integrointia** - app/api/analyze/route.ts säilyy
❌ **Analyysin rakennetta** - JSON-formaatti pysyy samana
❌ **Pisteytysjärjestelmää** - 1-10 arvosanat
❌ **UI-komponentteja** - Dashboard ja lomakkeet

---

## Arkkitehtuurikuvaus

### Komponentit

```
┌─────────────────────────────────────────────────────────────┐
│                    TIETOKANTA (Supabase)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  hakemukset (olemassa oleva)                                │
│  ├─ id, user_id, hakemus_teksti, arviointi, ...            │
│                                                              │
│  hankkeet (UUSI)                                            │
│  ├─ id, otsikko, kuvaus, toteuttaja                        │
│  ├─ rahoittaja, on_ami_hanke (BOOLEAN)                     │
│  ├─ rahoitus_summa, aloitus_pvm, lopetus_pvm              │
│  ├─ url (UNIQUE), crawled_at, updated_at                  │
│                                                              │
│  tyomarkkinadata (UUSI - valinnainen tulevaisuudessa)      │
│  ├─ id, aikajakso, alue, data (JSONB)                     │
│  ├─ created_at, updated_at                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MCP SERVER                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  mcp-server/hanke-server.ts                                 │
│                                                              │
│  TOOLS:                                                      │
│  ├─ get_ami_hankkeet()                                      │
│  │  └─> Supabase: SELECT * FROM hankkeet                   │
│  │      WHERE on_ami_hanke = true                           │
│  │                                                           │
│  ├─ get_muut_hankkeet(rahoittaja?)                         │
│  │  └─> Supabase: SELECT * FROM hankkeet                   │
│  │      WHERE on_ami_hanke = false                          │
│  │      [AND rahoittaja = ?]                               │
│  │                                                           │
│  ├─ search_hankkeet(query, rahoittaja?)                    │
│  │  └─> Supabase: Full-text search                         │
│  │                                                           │
│  └─ get_hanke_stats()                                       │
│     └─> Supabase: Aggregaatit per rahoittaja               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (parannettu)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  app/api/analyze/route.ts                                   │
│                                                              │
│  VANHA VERSIO (oletusarvo):                                 │
│  ├─ readFile('data/hankkeet.json')                         │
│  ├─ Staattinen data                                         │
│  ├─ Toimii aina                                             │
│                                                              │
│  UUSI VERSIO (feature flag):                                │
│  ├─ MCP client → get_ami_hankkeet()                        │
│  ├─ MCP client → get_muut_hankkeet()                       │
│  ├─ Dynaaminen data tietokannasta                          │
│  ├─ Parempi AMI-vertailu                                    │
│                                                              │
│  FEATURE FLAG:                                               │
│  └─ process.env.ENABLE_MCP === 'true'                      │
│     ├─ true → MCP-versio                                    │
│     └─ false → vanha versio (turvasäilö)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DATA IMPORT SCRIPTS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  scripts/import-ami-hankkeet.ts (UUSI)                      │
│  ├─ Käyttää olemassa olevaa lib/scrapers/ami-scraper.ts    │
│  ├─ Scrape ami.fi                                           │
│  ├─ Tallenna Supabaseen (hankkeet table)                   │
│  ├─ Merkitse: on_ami_hanke = true                          │
│  ├─ Komento: npm run import-ami-hankkeet                   │
│                                                              │
│  scripts/import-muut-rahoittajat.ts (TULEVAISUUDESSA)      │
│  ├─ TSR scraper                                             │
│  ├─ Diak scraper                                            │
│  ├─ Laurea scraper                                          │
│  ├─ EURA2021 API                                            │
│  ├─ Merkitse: on_ami_hanke = false                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    CRAWLER (TULEVAISUUDESSA)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  workers/hanke-crawler.ts                                   │
│  ├─ Cron: Kerran viikossa                                   │
│  ├─ Scrape kaikki lähteet                                   │
│  ├─ Update Supabase                                         │
│  ├─ Vercel Cron tai GitHub Actions                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tietokantarakenne

### Uusi taulu: `hankkeet`

```sql
CREATE TABLE hankkeet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Perus hanketiedot
  otsikko TEXT NOT NULL,
  kuvaus TEXT,
  toteuttaja TEXT NOT NULL,

  -- Rahoittaja (KRIITTINEN!)
  rahoittaja TEXT NOT NULL,
  on_ami_hanke BOOLEAN DEFAULT false, -- ⭐ EROTTELU AMI vs MUUT

  -- Rahoitus
  rahoitus_summa DECIMAL,

  -- Aikajana
  aloitus_pvm DATE,
  lopetus_pvm DATE,
  vuosi INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM aloitus_pvm)) STORED,

  -- Lähde
  url TEXT UNIQUE NOT NULL, -- Estää duplikaatit

  -- Metadata
  crawled_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indeksit
  CREATE INDEX idx_rahoittaja ON hankkeet(rahoittaja);
  CREATE INDEX idx_on_ami_hanke ON hankkeet(on_ami_hanke);
  CREATE INDEX idx_vuosi ON hankkeet(vuosi);
  CREATE INDEX idx_url ON hankkeet(url); -- UNIQUE constraint jo kattaa
);

-- RLS (Row Level Security)
ALTER TABLE hankkeet ENABLE ROW LEVEL SECURITY;

-- Kaikki voivat lukea
CREATE POLICY "Hankkeet ovat julkisia"
  ON hankkeet FOR SELECT
  TO authenticated
  USING (true);

-- Vain palvelin voi päivittää (service role)
-- (Ei tarvita policy, käytetään service_role_key:tä)

-- Trigger: Päivitä updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hankkeet_updated_at
  BEFORE UPDATE ON hankkeet
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Valinnainen tulevaisuudessa: `tyomarkkinadata`

```sql
CREATE TABLE tyomarkkinadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aikajakso TEXT NOT NULL, -- "2025M09"
  alue TEXT NOT NULL, -- "Espoo", "Helsinki", "Vantaa"
  kategoria TEXT NOT NULL, -- "tyonhakijat", "koulutusasteet", "ammattiryhmat"
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(aikajakso, alue, kategoria)
);
```

---

## MCP Server Implementation

### Tiedosto: `mcp-server/hanke-server.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const server = new Server(
  {
    name: 'ami-hanke-aggregator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// TOOL 1: Hae AMI-hankkeet
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'get_ami_hankkeet') {
    const { data, error } = await supabase
      .from('hankkeet')
      .select('*')
      .eq('on_ami_hanke', true)
      .order('vuosi', { ascending: false });

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  // TOOL 2: Hae muut hankkeet
  if (request.params.name === 'get_muut_hankkeet') {
    const rahoittaja = request.params.arguments?.rahoittaja;

    let query = supabase
      .from('hankkeet')
      .select('*')
      .eq('on_ami_hanke', false);

    if (rahoittaja) {
      query = query.eq('rahoittaja', rahoittaja);
    }

    const { data, error } = await query.order('vuosi', { ascending: false });

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  // TOOL 3: Hae tilastot
  if (request.params.name === 'get_hanke_stats') {
    const { data, error } = await supabase.rpc('get_hanke_stats');

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  throw new Error('Unknown tool: ' + request.params.name);
});

// List tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'get_ami_hankkeet',
        description: 'Hae AMI-säätiön myöntämät hankkeet tietokannasta',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_muut_hankkeet',
        description: 'Hae muiden rahoittajien hankkeet',
        inputSchema: {
          type: 'object',
          properties: {
            rahoittaja: {
              type: 'string',
              description: 'Rahoittaja (TSR, Diak, Laurea, EURA2021)',
            },
          },
        },
      },
      {
        name: 'get_hanke_stats',
        description: 'Hae hanketilastot rahoittajittain',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

const transport = new StdioServerTransport();
server.connect(transport);
```

**Käyttö:**
```bash
# MCP serveri pyörii taustalla
node mcp-server/hanke-server.ts

# Claude kutsuu työkaluja
get_ami_hankkeet() → AMI-hankkeet
get_muut_hankkeet("TSR") → TSR-hankkeet
get_hanke_stats() → Tilastot
```

---

## Backend API Integration

### Feature Flag Pattern

```typescript
// app/api/analyze/route.ts

// VANHA FUNKTIO (säilytetään)
async function analyzeWithStaticData(hakemus: string, summa: number) {
  // Nykyinen toteutus
  const hankkeetPath = join(process.cwd(), 'data', 'hankkeet.json');
  const hankkeetContent = await readFile(hankkeetPath, 'utf-8');
  const hankkedata = JSON.parse(hankkeetContent);
  // ... loput koodista
}

// UUSI FUNKTIO (MCP-pohjainen)
async function analyzeWithMCP(hakemus: string, summa: number) {
  // MCP client
  const mcpClient = new Client({
    name: 'ami-analyzer-client',
    version: '1.0.0',
  });

  await mcpClient.connect({
    command: 'node',
    args: ['mcp-server/hanke-server.ts'],
  });

  // Hae AMI-hankkeet MCP:n kautta
  const amiResult = await mcpClient.callTool('get_ami_hankkeet', {});
  const amiHankkeet = JSON.parse(amiResult.content[0].text);

  // Hae muut hankkeet
  const muutResult = await mcpClient.callTool('get_muut_hankkeet', {});
  const muutHankkeet = JSON.parse(muutResult.content[0].text);

  // Rakenna hankkedata vastaavaan formaattiin kuin vanha
  const hankkedata = {
    paivitetty: new Date().toISOString().split('T')[0],
    ami: {
      myonnetyt: amiHankkeet,
    },
    muut_rahoittajat: groupBy(muutHankkeet, 'rahoittaja'),
    eura: muutHankkeet.filter(h => h.rahoittaja === 'EURA2021'),
  };

  // ... loput koodista (SAMA KUIN VANHASSA)
}

// FEATURE FLAG
export async function POST(request: NextRequest) {
  const USE_MCP = process.env.ENABLE_MCP === 'true';

  // ... authentication, validation ...

  if (USE_MCP) {
    console.log('[ANALYZE] Using MCP version');
    return analyzeWithMCP(hakemus_teksti, haettava_summa);
  } else {
    console.log('[ANALYZE] Using static data version (default)');
    return analyzeWithStaticData(hakemus_teksti, haettava_summa);
  }
}
```

**Edut:**
- ✅ Helppo vaihtaa edestakaisin
- ✅ Ei riko vanhaa koodia
- ✅ Voidaan testata rinnakkain
- ✅ Nopea paluu turvaan jos MCP bugaa

---

## Vaiheistus

### Vaihe 1: Tietokanta + AMI-tuonti (EI KOSKE ANALYYSIIN)

**Tavoite:** Tallenna AMI-hankkeet tietokantaan, mutta ÄLÄ muuta analyysiä

**Tehtävät:**
1. ✅ Luo migraatio: `supabase/migrations/002_hankkeet_table.sql`
2. ✅ Luo import-skripti: `scripts/import-ami-hankkeet.ts`
3. ✅ Aja import: `npm run import-ami-hankkeet`
4. ✅ Testaa: Tarkista Supabase-konsolista että data on oikein

**Testaus:**
- Vanha analyysitoiminto toimii edelleen
- Data näkyy Supabasessa
- Ei regressioita

**Checkpoint:**
```bash
git add .
git commit -m "CHECKPOINT: Hankkeet-tietokanta ja AMI-tuonti toimii"
git push
```

---

### Vaihe 2: MCP Server (TÄYSIN ERILLINEN)

**Tavoite:** Luo MCP-server joka tarjoaa työkalut, mutta EI liity vielä analyysiin

**Tehtävät:**
1. ✅ Luo: `mcp-server/hanke-server.ts`
2. ✅ Toteuta työkalut: get_ami_hankkeet, get_muut_hankkeet, get_hanke_stats
3. ✅ Testaa erikseen: `node mcp-server/hanke-server.ts`
4. ✅ Varmista: Claude Inspector toimii

**Testaus:**
- MCP-server käynnistyy
- Työkalut palauttavat oikean datan
- Analyysi toimii edelleen (ei muutoksia)

**Checkpoint:**
```bash
git add .
git commit -m "CHECKPOINT: MCP server toimii erikseen"
git push
```

---

### Vaihe 3: Integrointi analyysiin (VAROVAINEN MUUTOS)

**ENNEN INTEGRAATIOTA:**
```bash
# Checkpoint
git add .
git commit -m "CHECKPOINT: Ennen MCP-integraatiota analyysiin"
git push

# Testaa vielä kerran että nykyinen toimii
ENABLE_MCP=false npm run dev
# → Testaa hakemusanalyysi manuaalisesti
```

**Tavoite:** Lisää MCP-versio feature flagin taakse

**Tehtävät:**
1. ✅ Refaktoroi `app/api/analyze/route.ts`:
   - `analyzeWithStaticData()` - vanha versio
   - `analyzeWithMCP()` - uusi versio
   - Feature flag: `process.env.ENABLE_MCP`
2. ✅ Varmista että MOLEMMAT versiot toimivat
3. ✅ Ympäristömuuttuja: `ENABLE_MCP=false` (oletusarvo)

**Testaus:**
```bash
# Testaa vanha
ENABLE_MCP=false npm run dev
# → Analysoi hakemus, varmista että toimii

# Testaa uusi
ENABLE_MCP=true npm run dev
# → Analysoi SAMA hakemus, vertaa tuloksia
```

**Vertailu:**
- Kumpikin antaa laadukkaan analyysin?
- MCP-versio antaa lisäarvoa (vertailutiedot)?
- Ei regressioita?
- JSON-rakenne sama?

**Checkpoint:**
```bash
git add .
git commit -m "CHECKPOINT: MCP-integraatio feature flagin takana"
git push
```

---

### Vaihe 4: Tuotantokäyttö (KUN MCP TODISTETTU TOIMIVAKSI)

**Tavoite:** Ota MCP käyttöön oletuksena

**Tehtävät:**
1. ✅ Vercel env: `ENABLE_MCP=true`
2. ✅ Testaa tuotannossa 1-2 viikkoa
3. ✅ Kerää palautetta
4. ✅ Jos ei ongelmia → poista feature flag

**Paluu turvaan:**
```bash
# Jos MCP aiheuttaa ongelmia tuotannossa
Vercel → Environment Variables → ENABLE_MCP=false

# Tai kooditasolla
git checkout backup-before-mcp-migration -- app/api/analyze/route.ts
git commit -m "Palauta vanha analyysiversio"
git push
```

---

### Vaihe 5: Muut rahoittajat (TULEVAISUUS)

**Tavoite:** Lisää TSR, Diak, Laurea, EURA2021

**Tehtävät:**
1. ✅ Luo scraperit: `lib/scrapers/tsr-scraper.ts`, `diak-scraper.ts`, jne.
2. ✅ Luo import: `scripts/import-muut-rahoittajat.ts`
3. ✅ Aja import
4. ✅ MCP palauttaa automaattisesti

**Ei vaadi muutoksia:**
- ❌ MCP server (työkalut jo valmiit)
- ❌ Analyysi-API (käyttää MCP:tä)

---

### Vaihe 6: Crawler (TULEVAISUUS)

**Tavoite:** Automaattinen päivitys

**Tehtävät:**
1. ✅ Luo: `workers/hanke-crawler.ts`
2. ✅ Vercel Cron: Kerran viikossa
3. ✅ Scrape + tallenna Supabaseen

**Hyödyt:**
- Data aina ajantasalla
- Ei manuaalista työtä
- MCP palauttaa automaattisesti uusinta dataa

---

## Testaussuunnitelma

### Jokaisen vaiheen jälkeen:

1. ✅ **Vanha analyysitoiminto toimii**
   ```bash
   ENABLE_MCP=false npm run dev
   # Testaa hakemusanalyysi
   # Vertaa aiempaan tulokseen
   ```

2. ✅ **Uusi MCP-toiminto toimii erikseen**
   ```bash
   # Testaa MCP-server
   node mcp-server/hanke-server.ts
   # Claude Inspector: Kutsu työkaluja
   ```

3. ✅ **Ei regressioita**
   ```bash
   # Build passes
   npm run build

   # TypeScript OK
   npm run type-check

   # Tests pass (jos on)
   npm test
   ```

### Integraation jälkeen:

4. ✅ **Vertaa tuloksia**
   - Ota SAMA hakemus
   - Analysoi vanhalla versiolla (ENABLE_MCP=false)
   - Analysoi uudella versiolla (ENABLE_MCP=true)
   - Vertaa: Onko MCP-versio vähintään yhtä hyvä?

5. ✅ **Laa duusvalidointi**
   - Vahvuudet ja heikkoudet järkeviä?
   - Kriittiset kysymykset relevantit?
   - AMI-vertailu toimii?
   - Muut rahoittajat mainittu?

---

## Riskit ja lieventäminen

### Riski 1: MCP-server kaatuu

**Lieventäminen:**
- Feature flag → paluu vanhaan
- Try-catch MCP-kutsuissa
- Fallback staattiseen dataan

### Riski 2: Tietokanta hidas

**Lieventäminen:**
- Indeksit tärkeille sarakkeille
- Caching MCP-vastauksissa
- Pagination isoille tuloksille

### Riski 3: Analyysitulos muuttuu

**Lieventäminen:**
- SAMA prompt molemmissa versioissa
- SAMA data-formaatti (hankkedata-objekti)
- Testaa vertailulla ennen tuotantoa

### Riski 4: Duplikaatit tietokannassa

**Lieventäminen:**
- UNIQUE constraint url-sarakkeessa
- ON CONFLICT DO UPDATE import-skriptissä
- Validointi ennen tallennusta

---

## KRIITTISET SÄÄNNÖT ⛔

1. **EI POISTETA vanhaa koodia**
   - Vain lisätään rinnalle
   - Feature flag mahdollistaa vaihdon

2. **Sama data-formaatti**
   - MCP palauttaa saman rakenteen kuin vanha
   - `hankkedata.ami.myonnetyt` = AMI-hankkeet
   - `hankkedata.muut_rahoittajat` = Muut

3. **Checkpoint jokaisen vaiheen jälkeen**
   - Git commit + push
   - Dokumentoi mitä tehty
   - Testaa että toimii

4. **Testaa aina että vanha toimii**
   - ENABLE_MCP=false
   - Analysoi hakemus
   - Varmista tulos

5. **Dokumentoi kaikki muutokset**
   - Päivitä docs/MCP_IMPLEMENTATION.md
   - Kerro mitä tehty, miksi, miten testata

---

## Seuraavat vaiheet

Kun tämä suunnitelma on hyväksytty:

1. ✅ Luo `supabase/migrations/002_hankkeet_table.sql`
2. ✅ Luo `scripts/import-ami-hankkeet.ts`
3. ✅ Testaa että AMI-data tulee tietokantaan
4. ✅ Luo `mcp-server/hanke-server.ts`
5. ✅ Testaa että MCP palauttaa oikean datan
6. ✅ Refaktoroi `app/api/analyze/route.ts` (feature flag)
7. ✅ Vertaa tuloksia (vanha vs. uusi)
8. ✅ Dokumentoi tulokset `docs/MCP_IMPLEMENTATION.md`
9. ✅ Ota käyttöön tuotannossa (`ENABLE_MCP=true`)

---

**MUISTA:**
- Älä riko nykyistä - tee rinnakkain
- Feature flag - helppo vaihtaa
- Testaa joka vaiheen jälkeen
- MCP on LISÄYS - ei korvaus (aluksi)
- Dokumentoi kaikki

**Jos MIKÄ TAHANSA menee rikki:**
```bash
git checkout backup-before-mcp-migration
# TAI
ENABLE_MCP=false # Vercelissä
```
