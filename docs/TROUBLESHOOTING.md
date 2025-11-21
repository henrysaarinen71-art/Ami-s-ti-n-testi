# Troubleshooting - Virheet ja ratkaisut

Dokumentoitu: 2025-11-21
Päivitetty: 2025-11-21

---

## 📋 Sisällysluettelo

1. [MCP-integraation virheet](#mcp-integraation-virheet)
2. [Tietokantavirheet](#tietokantavirheet)
3. [Build-virheet](#build-virheet)
4. [Import-skriptien virheet](#import-skriptien-virheet)
5. [Web scraping -virheet](#web-scraping-virheet)

---

## MCP-integraation virheet

### ❌ Virhe 1: TypeScript - callTool signature wrong

**Virheviesti:**
```
Type error: Argument of type 'string' is not assignable to parameter of type
'{ name: string; _meta?: ...; arguments?: ...; }'
```

**Sijainti:** `app/api/analyze/route.ts:88`

**Syy:** MCP SDK:n `callTool()` metodi ottaa vastaan objektin, ei pelkkää stringiä

**Väärä koodi:**
```typescript
const amiResult = await mcpClient.callTool('get_ami_hankkeet', { limit: 200 })
```

**Oikea koodi:**
```typescript
const amiResult = await mcpClient.callTool({
  name: 'get_ami_hankkeet',
  arguments: { limit: 200 }
})
```

**Korjaus:**
- Muuta kaikki `callTool()` kutsut käyttämään objektiparametria
- Käytetty sekä `get_ami_hankkeet` että `get_muut_hankkeet` kutsuissa

**Commit:** `6a070cc`

---

### ❌ Virhe 2: TypeScript - content is unknown type

**Virheviesti:**
```
Type error: 'amiResult.content' is of type 'unknown'
```

**Sijainti:** `app/api/analyze/route.ts:92`

**Syy:** MCP SDK palauttaa `content` unknown-tyyppisenä, TypeScript vaatii type assertionin

**Väärä koodi:**
```typescript
const amiContent = amiResult.content.find((c: any) => c.type === 'text')
```

**Oikea koodi:**
```typescript
const amiContent = (amiResult.content as any[]).find((c: any) => c.type === 'text')
```

**Korjaus:**
- Lisää type assertion `(amiResult.content as any[])`
- Käytetty sekä AMI- että muut-hankkeiden käsittelyssä

**Commit:** `6a070cc`

---

## Tietokantavirheet

### ❌ Virhe 3: Tietokannan tallennus epäonnistui

**Virheviesti:**
```
Tietokannan tallennus epäonnistui. Tarkista tietokantayhteys.
```

**Sijainti:** `app/api/analyze/route.ts:712` (error handler)

**Syy:** `hakemukset` taulua ei ole luotu Supabasessa

**Ratkaisu:**
1. Luotu migraatio: `supabase/migrations/001_hakemukset_table.sql`
2. Migraatio luo taulun seuraavilla kentillä:
   - `id` (UUID, primary key)
   - `hakemus_teksti` (TEXT)
   - `haettava_summa` (DECIMAL)
   - `user_id` (UUID)
   - `user_email` (TEXT)
   - `arviointi` (JSONB)
   - `status` (TEXT)
   - `kuvaus` (TEXT, nullable)
   - `created_at`, `updated_at` (TIMESTAMP)
3. RLS policies käyttäjille (näkevät vain omat)
4. Indeksit ja full-text search

**Kuinka ajaa migraatio:**
```sql
-- Kopioi supabase/migrations/001_hakemukset_table.sql sisältö
-- Aja Supabase Dashboard → SQL Editor
```

**Tiedostot:**
- `supabase/migrations/001_hakemukset_table.sql`
- `supabase/migrations/README.md` (ohjeet)

**Commit:** (odottaa migraation ajoa)

---

### ❌ Virhe 4: Puuttuva NEXT_PUBLIC_SUPABASE_ANON_KEY

**Virheviesti:**
```
@supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

**Syy:** `.env.local` tiedostosta puuttuu julkinen anon key

**Ratkaisu:**
1. Hae anon key Supabasesta:
   - Avaa: https://supabase.com/dashboard/project/bgrjaihmctqkayyochwd
   - Mene: Settings → API
   - Kopioi: "anon public" key
2. Lisää `.env.local` tiedostoon:
   ```bash
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

**Huom:** Tämä on JULKINEN avain, ei salainen

**Tiedostot:**
- `.env.local` (päivitetty placeholder)
- `.env.example` (malli)

---

## Build-virheet

### ❌ Virhe 5: Build prerender error - Supabase credentials

**Virheviesti:**
```
Error occurred prerendering page "/login"
@supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

**Syy:** Next.js yrittää prerenderöidä sivuja build-aikana, mutta Supabase-client ei voi alustua ilman credentialseja

**Ratkaisu:**

**1. Lisätty dynamic export auth-sivuille:**
```typescript
// app/login/page.tsx
export const dynamic = 'force-dynamic'

// app/page.tsx
export const dynamic = 'force-dynamic'

// app/dashboard/layout.tsx
export const dynamic = 'force-dynamic'
```

**2. Lisätty fallback Supabase clientteihin:**

`lib/supabase/client.ts`:
```typescript
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, these might not be available
  if (!url || !key) {
    console.warn('[Supabase Client] Missing credentials during build')
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  return createBrowserClient(url, key)
}
```

`lib/supabase/server.ts`: Sama logiikka

**3. Lisätty lazy initialization login-sivulle:**
```typescript
// app/login/page.tsx
const supabase = useMemo(() => createClient(), [])
```

**Tulos:** Build menee läpi, placeholder-client käytetään vain build-aikana

**Commit:** `6a070cc`

---

## Import-skriptien virheet

### ❌ Virhe 6: Puuttuvat ympäristömuuttujat import-skriptissä

**Virheviesti:**
```
❌ VIRHE: Puuttuvat ympäristömuuttujat
NEXT_PUBLIC_SUPABASE_URL ja SUPABASE_SERVICE_ROLE_KEY vaaditaan
```

**Syy:** `dotenv.config()` lataa vain `.env` tiedoston, ei `.env.local`

**Väärä koodi:**
```typescript
import { config } from 'dotenv'
config()  // Lataa vain .env
```

**Oikea koodi:**
```typescript
import { config } from 'dotenv'
import { join } from 'path'

// Lataa .env.local eksplisiittisesti
config({ path: join(process.cwd(), '.env.local') })
```

**Korjaus:**
- Päivitetty `scripts/import-ami-hankkeet.ts`
- Lisätty eksplisiittinen `.env.local` polku

**Commit:** `d0a232c`

---

## Web scraping -virheet

### ❌ Virhe 7: AMI.fi web scraper - 403 Forbidden

**Virheviesti:**
```
Request failed with status code 403
```

**Sijainti:** `lib/scrapers/ami-scraper.ts`

**Syy:** AMI.fi sivusto estää scraperin (anti-bot suojaus, puuttuva/huono User-Agent)

**Väliaikainen ratkaisu:**
- Käytetään testidata (3 hanketta lisätty manuaalisesti Supabaseen)
- Dokumentoitu `docs/TODO.md` kriittisenä tehtävänä

**Pysyvät ratkaisuvaihtoehdot:**

**1. Paremmat headerit:**
```typescript
headers: {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://ami.fi/'
}
```

**2. Retry-logiikka:**
```typescript
let attempts = 0
while (attempts < 3) {
  try {
    const response = await axios.get(url, { headers, timeout: 10000 })
    break
  } catch (error) {
    attempts++
    if (attempts < 3) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
}
```

**3. Viiveet requestien väliin:**
```typescript
await new Promise(resolve => setTimeout(resolve, 2000)) // 2s per request
```

**4. Vaihtoehtoiset ratkaisut:**
- Playwright/Puppeteer selainautomatiota (jos tarvitaan JavaScript)
- Proxy-palvelu (jos IP on estetty)
- Yhteys AMI.fi:hin (ehkä tarjoavat API:n?)

**Status:** ⏸️ PYSÄYTETTY - Odottaa korjausta
**Prioriteetti:** 🔴 Korkea (tarvitaan automaattiseen päivitykseen)

**Tiedostot:**
- `lib/scrapers/ami-scraper.ts`
- `docs/TODO.md` (dokumentoitu)

---

## Tarkistuslista uuden virheen dokumentointiin

Kun kohtaat uuden virheen:

1. ✅ **Kopioi virheviesti** (koko stack trace jos mahdollista)
2. ✅ **Tunnista sijainti** (tiedosto, rivinumero)
3. ✅ **Selvitä syy** (miksi virhe tapahtuu?)
4. ✅ **Dokumentoi väärä koodi** (ennen korjausta)
5. ✅ **Dokumentoi oikea koodi** (korjauksen jälkeen)
6. ✅ **Listaa muut muutetut tiedostot**
7. ✅ **Merkitse commit hash**
8. ✅ **Lisää tähän dokumenttiin**

---

## Hyödyllisiä debug-komentoja

### Tietokanta
```sql
-- Tarkista taulut
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Tarkista RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Tarkista hankkeiden määrä
SELECT COUNT(*) FROM hankkeet WHERE on_ami_hanke = true;

-- Tarkista hakemukset
SELECT id, user_email, status, created_at FROM hakemukset
ORDER BY created_at DESC LIMIT 10;
```

### Build & Dev
```bash
# Puhdas build
rm -rf .next && npm run build

# Tarkista TypeScript-virheet
npx tsc --noEmit

# Tarkista ympäristömuuttujat
printenv | grep SUPABASE
printenv | grep ANTHROPIC

# Import-skripti
npm run import-ami-hankkeet
```

### MCP
```bash
# Testaa MCP server standalone
node mcp-server/hanke-server.ts

# Tarkista MCP SDK versio
npm list @modelcontextprotocol/sdk
```

---

## Lisätiedot

**Pääohjeet:**
- `docs/MCP_IMPLEMENTATION.md` - MCP-integraation täydelliset ohjeet
- `docs/TODO.md` - Kriittiset tehtävät
- `supabase/migrations/README.md` - Migraatio-ohjeet

**Git:**
- Backup tag: `backup-before-mcp-migration` (commit: c42973cb)
- Backup file: `app/api/analyze/route.old.ts`

**Yhteystiedot:**
- Supabase Dashboard: https://supabase.com/dashboard/project/bgrjaihmctqkayyochwd
- Anthropic Console: https://console.anthropic.com

---

**Muista:** Päivitä tämä dokumentti aina kun kohtaat ja korjaat uuden virheen!
