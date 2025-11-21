# Session Log - AMI Hankeanalyysi

Päivitetty: 2025-11-21

---

## ✅ Tehty tässä sessiossa (2025-11-21)

### Session 2: MCP-toiminnan valmistelu (2025-11-21 13:00-13:10)

**Toteutus:**
- ✅ Asennettu npm-riippuvuudet (573 pakettia)
- ✅ Luotu `.env.local` tiedosto:
  - `ENABLE_MCP=true` (MCP aktivoitu)
  - Supabase URL ja publishable key
  - Anthropic API-avain
- ✅ Käynnistetty dev-palvelin (http://localhost:3000)
- ✅ Luotu `TESTAA_MCP.md` - Kattavat testausohjeet käyttäjälle

**Tila:**
- ⏳ Palvelin käynnissä ja odottaa testausta
- ⏳ MCP-logit näkyvät kun käyttäjä tekee ensimmäisen analyysin
- ⏳ Käyttäjä voi nyt testata MCP-toimintaa selaimessa

**Seuraava askel:**
1. Käyttäjä testaa sovellusta selaimessa (seuraa `TESTAA_MCP.md` ohjeita)
2. Varmistetaan että MCP-logit näkyvät palvelimen konsolissa
3. Tarkistetaan että AMI-hankkeet mainitaan analyysissä

---

### Session 1: AMI-hankkeiden tuonti Supabaseen

**Ongelma:** Web scraping epäonnistui (403 Forbidden) → Päätettiin syöttää hankkeet manuaalisesti

**Toteutus:**
- ✅ Luotu `supabase/migrations/002_hankkeet_table.sql` (taulu)
- ✅ Luotu `supabase/migrations/005_delete_test_projects.sql` (testidata pois)
- ✅ Luotu `supabase/migrations/007_insert_real_ami_projects.sql` (6 oikeaa hanketta)
- ✅ Luotu `MIGRATION_OHJEET.md` (kattavat ohjeet suomeksi)
- ✅ Ajettu migraatiot Supabase Dashboardissa:
  - `002_hankkeet_table.sql` → Taulu luotu ✅
  - `007_insert_real_ami_projects.sql` → 6 hanketta lisätty ✅

**Tuodut hankkeet (yhteensä 334,213 €):**
1. Vastuuasiantuntijaresurssin käyttö (Labore, 62,951 €)
2. NEETHelsinki (Into ry, 65,631 €)
3. IPS-työhönvalmennus (Spring House Oy, 57,288 €)
4. Pidempään kotona lapsiaan hoitaneiden... (60,000 €)
5. Työperäisen hyväksikäytön torjunta (Motiva/HEUNI, 26,072 €)
6. Konkarit töihin! (Vates-säätiö, 62,271 €)

### 2. MCP-integraation aktivointi

**Toteutus:**
- ✅ Päivitetty `.env.local`: `ENABLE_MCP=true`
- ✅ MCP-palvelin valmis (`mcp-server/hanke-server.ts`)
- ✅ Analyysitoiminto tukee MCP:tä (`app/api/analyze/route.ts`)

**Seuraava askel:**
- ⏳ **Käynnistä dev-palvelin uudelleen** (`npm run dev`)
- ⏳ **Testaa toiminta** (tee hakemus ja katso mainittaanko AMI-hankkeita)

### 3. Git-toiminnot

```bash
git commit -m "feat: Add SQL migration for 6 real AMI projects (2024)"
git push -u origin claude/web-scraping-mcp-migration-01B9w9qzdkVadqKTRbB8Zcs6
```

---

## 📋 Tulevat tehtävät

### Prioriteetti 1: MCP-toiminnan varmistus (SEURAAVA KERTA)

- [ ] Käynnistä dev-palvelin uudelleen (`npm run dev`)
- [ ] Tarkista lokista: `[ANALYZE] Using MCP (new version)`
- [ ] Testaa hakemusanalyysiä:
  - Tee testihakemus
  - Katso mainittaanko joku 6 AMI-hankkeesta analyysissä
  - Varmista että AI käyttää Supabase-dataa

**Odotettu tulos:**
- AI mainitsee relevantteja AMI-hankkeita (esim. NEETHelsinki, Konkarit töihin!)
- Data tulee Supabasesta, ei JSON-tiedostosta

---

### Prioriteetti 2: Työmarkkinadata

**Ongelma:** Työmarkkinadata ei ole vielä täysin kunnossa

**Tehtävät:**
- [ ] Tarkista `supabase/migrations/003_tyomarkkinadata_table.sql`
- [ ] Varmista että data on ajan tasalla
- [ ] Testaa että API palauttaa oikean datan (`/api/tyomarkkinadata`)
- [ ] Varmista että MCP voi hakea työmarkkinadataa

**Huomio:** Migration 003 on jo luotu aikaisemmin (työttömyys 48,958)

---

### Prioriteetti 3: Chatbot-kehitys (Olemassa olevien hankkeiden arviointi)

**Idea:** Sivustolla oleva chatbot voisi arvioida olemassa olevia hankkeita

**Datalähteet:**
1. **Työmarkkinadata** (Supabase)
2. **Google News** - uutiset työmarkkinoista
3. **Google Scholar** - tieteelliset julkaisut aiheesta

**Toteutus:**
- [ ] Suunnittele API-integraatiot (Google News API, Google Scholar API)
- [ ] Luo MCP-toolit näille tietolähteille
- [ ] Päivitä chatbot-promptia analysoimaan hankkeita monipuolisesti
- [ ] Testaa chatbotilla olemassa olevia hankkeita

**Käyttötapaus:**
```
Käyttäjä: "Arvioi NEETHelsinki-hanke"
Chatbot: [Hakee työmarkkinadatan, uutiset ja tutkimukset]
         → Antaa arvion hankkeen relevanttiudesta ja vaikuttavuudesta
```

---

### Prioriteetti 4: Hakemusanalyysin viestintäehdotukset

**Tavoite:** AI ehdottaa miten säätiö voisi viestiä hankkeesta

**Vaatimus:**
- Viestintäehdotukset vain **hyville hankkeille** (täyttää muut kriteerit)
- AI tuottaa konkreettisia viestintäideoita

**Toteutus:**
- [ ] Päivitä `app/api/analyze/route.ts` promptia
- [ ] Lisää viestintäehdotukset analyysiin:
  - Blogi-ideat
  - Sosiaalisen median postaukset
  - Lehdistötiedotteen kulmat
  - Tiedontuotannon mahdollisuudet

**Esimerkki:**
```
Viestintäehdotukset:
- Blogi: "Miten IPS-menetelmä auttaa NEET-nuoria työelämään?"
- LinkedIn: "Tuemme Helsingin NEET-nuorten työllistymistä - 57,288 € rahoitus"
- Lehdistötiedote: "Uusi hanke tuo individuaalista tukea nuorille työnhakijoille"
```

---

### Prioriteetti 5: Strategia 2026 - Muistio

**Tavoite:** Varmistetaan että promptia voidaan päivittää kun strategia päivittyy

**Toteutus:**
- [ ] Luo `docs/STRATEGIA_2026_PAIVITYS.md`
- [ ] Dokumentoi miten päivittää AI-promptia
- [ ] Listaa tiedostot jotka vaativat päivitystä:
  - `app/api/analyze/route.ts` (analyysiprompt)
  - `app/chat/route.ts` (chatbot-prompt, jos olemassa)
  - `docs/PROMPT_TEMPLATE.md` (template)

**Sisältö muistioon:**
```markdown
# Strategian päivitys 2026

## Mitä tehdä kun strategia päivittyy?

1. Avaa: app/api/analyze/route.ts
2. Etsi: "STRATEGIA" tai "prioriteetit"
3. Päivitä AI-prompti uuden strategian mukaiseksi
4. Testaa analyysitoimintoa
5. Dokumentoi muutokset
```

---

### Prioriteetti 6: AI-promptin taustamateriaali

**Lisättävä teksti AI-promptiin:**

```
Hankkeet voivat olla esimerkiksi:
- Tieteellistä tutkimusta
- Selvityksiä tai muuta yleishyödyllistä tiedontuotantoa
- Kokeiluita
- Skaalaushankkeita
- Ratkaisuita tai kyvykkyyksien synnyttämistä

TÄRKEÄÄ: Hankkeiden tuottama tieto tai muu lisäarvo pitää:
1. Integroitua pääkaupunkiseudulle, TAI
2. Hyödyttää pääkaupunkiseudulla toimivia hakijatahoja laajemmin

Tiedon integroitumiseen on hyvä kiinnittää huomiota jo hankkeen
suunnitteluvaiheessa.
```

**Toteutus:**
- [ ] Avaa `app/api/analyze/route.ts`
- [ ] Lisää teksti AI-promptin "Taustatieto"-osioon
- [ ] Testaa että AI huomioi nämä kriteerit analyysissä

---

## 🔧 Tekninen tila

### Tietokanta (Supabase)
- ✅ `hankkeet` taulu luotu
- ✅ 6 AMI-hanketta tietokannassa
- ⏳ `tyomarkkinadata` taulu (tarkistettava)

### MCP-integraatio
- ✅ MCP-palvelin rakennettu (`mcp-server/hanke-server.ts`)
- ✅ Feature flag aktivoitu (`ENABLE_MCP=true`)
- ⏳ Toiminta testaamatta (vaatii palvelimen uudelleenkäynnistyksen)

### Git
- Branch: `claude/web-scraping-mcp-migration-01B9w9qzdkVadqKTRbB8Zcs6`
- Viimeisin commit: "feat: Add SQL migration for 6 real AMI projects (2024)"
- Status: ✅ Pushattu

---

## 📝 Muistiinpanot

### MCP-testaus (seuraava kerta)

**Odotetut logit palvelimen käynnistyksessä:**
```
[MODULE LOAD] Initializing analyze route
[MODULE LOAD] process.env.ENABLE_MCP: true
[MODULE LOAD] USE_MCP constant set to: true
```

**Odotetut logit hakemuksen analysoinnissa:**
```
[ANALYZE] Using MCP (new version)
[ANALYZE] Found X AMI projects
```

### Tiedostot joita päivitettiin

1. `.env.local` - MCP aktivoitu
2. `supabase/migrations/007_insert_real_ami_projects.sql` - 6 hanketta
3. `supabase/migrations/README.md` - dokumentointi
4. `MIGRATION_OHJEET.md` - suomenkieliset ohjeet

---

## ⏭️ Seuraava sessio - Quick Start

1. **Käynnistä palvelin:**
   ```bash
   npm run dev
   ```

2. **Tarkista logit:**
   - Katso että `USE_MCP constant set to: true`

3. **Testaa analyysiä:**
   - Tee testihakemus (esim. nuorten työllistyminen)
   - Katso mainittaanko NEETHelsinki tai vastaava hanke

4. **Jos toimii:** Jatka prioriteetti 2 (työmarkkinadata)

5. **Jos ei toimi:** Debuggaa MCP-integraatiota

---

**Sessio päättyi:** 2025-11-21
**Seuraava tehtävä:** MCP-toiminnan varmistus
