# AMI Hanke Aggregator MCP Server

MCP (Model Context Protocol) -server joka tarjoaa hanketietoa Claude AI:lle Supabase-tietokannasta.

## Ominaisuudet

### Työkalut

1. **get_ami_hankkeet**
   - Hae AMI-säätiön myöntämät hankkeet
   - Parametrit: `limit` (valinnainen), `vuosi` (valinnainen)
   - Käyttö: Kun haluat vertailla hakemusta AMI:n aiempiin hankkeisiin

2. **get_muut_hankkeet**
   - Hae muiden rahoittajien hankkeet (TSR, Diak, Laurea, EURA2021)
   - Parametrit: `rahoittaja` (valinnainen), `limit` (valinnainen)
   - Käyttö: Konteksti muista vastaavista hankkeista

3. **search_hankkeet**
   - Hae hankkeita hakusanalla
   - Parametrit: `query` (pakollinen), `rahoittaja` (valinnainen), `limit` (valinnainen)
   - Käyttö: Etsi vastaavia hankkeita aiheesta

4. **get_hanke_stats**
   - Hae tilastot rahoittajittain
   - Parametrit: ei parametreja
   - Käyttö: Yhteenveto hankeportfoliosta

## Asennus

### 1. Varmista että tietokanta on luotu

```bash
# Supabase-migraatio pitää olla ajettu
# Tarkista Supabase-konsolista että hankkeet-taulu on olemassa
```

### 2. Tuo AMI-hankkeet tietokantaan

```bash
npm run import-ami-hankkeet
```

### 3. Testaa serveriä

```bash
node mcp-server/hanke-server.ts
```

Server odottaa syötettä stdiossa (MCP-protokolla).

## Käyttö Claude Desktopin kanssa

Lisää `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ami-hanke-aggregator": {
      "command": "node",
      "args": ["/POLKU/PROJEKTIIN/mcp-server/hanke-server.ts"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJxxx..."
      }
    }
  }
}
```

Korvaa `/POLKU/PROJEKTIIN/` oikealla polulla ja lisää oikeat ympäristömuuttujat.

## Käyttö ohjelmallisesti

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({
  name: 'ami-analyzer',
  version: '1.0.0',
});

const transport = new StdioClientTransport({
  command: 'node',
  args: ['mcp-server/hanke-server.ts'],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
});

await client.connect(transport);

// Hae AMI-hankkeet
const result = await client.callTool('get_ami_hankkeet', { limit: 50 });
console.log(result.content[0].text);
```

## Esimerkkejä

### Hae AMI-hankkeet vuodelta 2024

```typescript
const result = await client.callTool('get_ami_hankkeet', {
  vuosi: 2024,
  limit: 100
});

const data = JSON.parse(result.content[0].text);
console.log(`Löytyi ${data.count} hanketta vuodelta 2024`);
```

### Hae TSR:n hankkeet

```typescript
const result = await client.callTool('get_muut_hankkeet', {
  rahoittaja: 'TSR'
});

const data = JSON.parse(result.content[0].text);
console.log(`TSR:llä on ${data.count} hanketta`);
```

### Etsi nuorten työllistymiseen liittyviä hankkeita

```typescript
const result = await client.callTool('search_hankkeet', {
  query: 'nuorten työllistyminen',
  limit: 10
});

const data = JSON.parse(result.content[0].text);
data.hankkeet.forEach(h => {
  console.log(`${h.otsikko} (${h.rahoittaja}, ${h.vuosi})`);
});
```

## Vastausformaatti

Kaikki työkalut palauttavat JSON-muotoisen vastauksen:

```json
{
  "success": true,
  "count": 25,
  "hankkeet": [
    {
      "id": "uuid",
      "otsikko": "Hankkeen nimi",
      "kuvaus": "Kuvaus...",
      "toteuttaja": "Organisaatio",
      "rahoittaja": "AMI",
      "on_ami_hanke": true,
      "rahoitus_summa": 50000,
      "vuosi": 2024,
      "url": "https://...",
      "crawled_at": "2025-11-21T..."
    }
  ]
}
```

Virhetilanteissa:

```json
{
  "success": false,
  "error": "Virheviesti"
}
```

## Tietoturva

- Server käyttää `SUPABASE_SERVICE_ROLE_KEY`:tä → ohittaa RLS:n
- ÄLÄ jaa service role -avainta
- Käytä vain luotetuissa ympäristöissä
- Hankkeet ovat julkista dataa, joten ei arkaluontoista tietoa

## Vianetsintä

### Server ei käynnisty

```bash
# Tarkista ympäristömuuttujat
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Tarkista että .env.local on olemassa
cat .env.local
```

### "Tietokantavirhe"

- Varmista että `hankkeet`-taulu on luotu (migraatio 002)
- Tarkista Supabase-konsolista että taulu on olemassa
- Tarkista että service role -avain on oikein

### Ei tuloksia

- Aja `npm run import-ami-hankkeet` ensin
- Tarkista Supabase-konsolista että tietokannassa on dataa:
  ```sql
  SELECT COUNT(*) FROM hankkeet WHERE on_ami_hanke = true;
  ```

## Kehitys

### Lisää uusi työkalu

1. Lisää työkalu `ListToolsRequestSchema`-handleriin
2. Lisää logiikka `CallToolRequestSchema`-handleriin
3. Testaa:
   ```bash
   node mcp-server/hanke-server.ts
   ```

### Testaa lokaalisti

```bash
# Käynnistä server
node mcp-server/hanke-server.ts

# Toisessa terminaalissa, lähetä MCP-pyyntö
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-server/hanke-server.ts
```

## Lisätietoja

- [MCP Documentation](https://modelcontextprotocol.io)
- [Supabase Documentation](https://supabase.com/docs)
- [AMI-säätiö](https://ami.fi)

---

**Ylläpito:** Päivitä hankkeet säännöllisesti komennolla `npm run import-ami-hankkeet`
