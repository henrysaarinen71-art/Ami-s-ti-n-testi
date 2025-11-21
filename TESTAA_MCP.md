# MCP-toiminnan testaus

Päivitetty: 2025-11-21

---

## ✅ Valmistelut TEHTY

1. ✅ `.env.local` luotu ja konfiguroitu:
   - `ENABLE_MCP=true` (MCP aktivoitu)
   - Supabase URL ja avain lisätty
   - Anthropic API-avain lisätty

2. ✅ Dev-palvelin käynnissä: http://localhost:3000

3. ✅ 6 AMI-hanketta Supabasessa (migration 007)

---

## 🧪 Testausvaiheet

### 1. Avaa sovellus selaimessa

Avaa: **http://localhost:3000**

### 2. Kirjaudu sisään

Käytä testikäyttäjää:
- Email: `ami1@test.com`
- Salasana: `Ami1234!_1`

(Jos testikäyttäjää ei ole, luo se Supabase Dashboardissa: Authentication → Users → Add user)

### 3. Mene analysointisivulle

Klikkaa: **"Analysoi hakemus"** tai navigoi `/dashboard/analysoi`

### 4. Täytä testihakemus

**Esimerkki 1: NEET-nuorten työllistyminen**
```
Hakemuksen nimi: NEET-nuorten työllistymisohjelma 2025

Haettava summa: 65000

Hakemuksen kuvaus:
Hanke tarjoaa yksilöllistä työvalmennusta NEET-nuorille (nuoret jotka eivät
ole työssä, opiskelemassa tai koulutuksessa). Toteutamme IPS-työhönvalmennus
-menetelmää Helsingin alueella. Tavoitteena on saada 50 nuorta työllistymään
tai koulutukseen vuoden aikana.

Hanke sisältää:
- Henkilökohtainen työvalmennnus (1-2 kertaa viikossa)
- Työnhakukoulutus ja CV-työpajat
- Työpaikkaverkostojen rakentaminen
- Seurantajakso (6 kk työllistymisen jälkeen)
```

**Esimerkki 2: Työperäinen hyväksikäyttö**
```
Hakemuksen nimi: Työperäisen hyväksikäytön torjunta

Haettava summa: 26000

Hakemuksen kuvaus:
Selvityshanke joka tutkii työperäisen hyväksikäytön ilmiötä
pääkaupunkiseudulla. Tuotetaan tietoa ilmiön laajuudesta, uhriryhmistä
ja torjuntakeinoista. Yhteistyössä HEUNIn ja Motivan kanssa.
```

### 5. Lähetä analyysi

Klikkaa: **"Analysoi hakemus"**

### 6. 🔍 TARKISTA PALVELIMEN LOGIT

**Avaa terminaali jossa `npm run dev` pyörii** ja etsi seuraavat logit:

#### A) Käynnistyslogit (kun analyze-route latautuu ensimmäistä kertaa)

```
[MODULE LOAD] Initializing analyze route
[MODULE LOAD] process.env.ENABLE_MCP: true
[MODULE LOAD] typeof: string
[MODULE LOAD] USE_MCP constant set to: true
```

✅ **Jos näet nämä:** MCP on aktivoitu!

#### B) Analyysin aikana (kun lähetät hakemuksen)

```
=== FEATURE FLAG DEBUG ===
[DEBUG] process.env.ENABLE_MCP: true
[DEBUG] typeof ENABLE_MCP: string
[DEBUG] ENABLE_MCP === "true": true
[DEBUG] USE_MCP constant: true
[DEBUG] Will use: MCP (new)
==========================

[ANALYZE] Step: Authentication
[ANALYZE] Authenticated user: ami1@test.com
[ANALYZE] Step: Parsing request body
[ANALYZE] Step: Fetching labor market data

[ANALYZE] Step: Fetching project data
[ANALYZE] Using MCP (new version)
[ANALYZE] MCP: Connecting to hanke-server...
[ANALYZE] MCP: Connected successfully
[ANALYZE] MCP: Calling list_tools...
[ANALYZE] MCP: Available tools: ["search_hankkeet"]
[ANALYZE] MCP: Calling search_hankkeet...
[ANALYZE] MCP: Found X AMI projects from Supabase
```

✅ **Jos näet nämä:** MCP toimii ja hakee dataa Supabasesta!

#### C) Odotettavat tulokset

MCP:n pitäisi löytää **6 AMI-hanketta** Supabasesta:
1. Vastuuasiantuntijaresurssin käyttö (Labore, 62,951 €)
2. NEETHelsinki (Into ry, 65,631 €)
3. IPS-työhönvalmennus (Spring House Oy, 57,288 €)
4. Pidempään kotona lapsiaan hoitaneiden... (60,000 €)
5. Työperäisen hyväksikäytön torjunta (Motiva/HEUNI, 26,072 €)
6. Konkarit töihin! (Vates-säätiö, 62,271 €)

### 7. 📊 TARKISTA ANALYYSIN TULOS

**Odotettavat maininnat:**

Kun testaat **NEET-hanketta**, Claude:n pitäisi mainita:
- ✅ "NEETHelsinki"-hanke (Into ry, 65,631 €)
- ✅ "IPS-työhönvalmennus"-hanke (Spring House Oy, 57,288 €)
- ✅ Vertailu näihin hankkeisiin
- ✅ Mahdollinen päällekkäisyys tai täydentävyys

Kun testaat **Työperäinen hyväksikäyttö** -hanketta, Claude:n pitäisi mainita:
- ✅ "Työperäisen hyväksikäytön torjunta" (Motiva/HEUNI, 26,072 €)
- ✅ Vertailu olemassa olevaan hankkeeseen

**Esimerkki odotetusta vastauksesta:**
> "Huomionarvoista on, että AMI on jo rahoittanut samankaltaista hanketta:
> 'NEETHelsinki' (Into ry, 65,631 €), joka myös keskittyy NEET-nuorten
> työllistämiseen. Hakijan tulisi selkeästi erottaa oma hankkeensa tästä..."

---

## ❌ Jos MCP EI TOIMI

### Virhetilanteet

#### 1. Logit näyttävät: `[ANALYZE] Using STATIC JSON data (old version)`

**Ongelma:** MCP ei ole aktivoitunut

**Ratkaisu:**
```bash
# Tarkista .env.local
cat .env.local

# Pitäisi näkyä:
# ENABLE_MCP=true

# Jos ei näy, lisää se:
echo "ENABLE_MCP=true" >> .env.local

# Käynnistä palvelin uudelleen
# Ctrl+C (lopeta palvelin)
npm run dev
```

#### 2. Logit näyttävät: `[ANALYZE] MCP error: ...`

**Ongelma:** MCP-palvelin epäonnistui

**Mahdolliset syyt:**
- Supabase-yhteys epäonnistui
- MCP-server-koodi sisältää virheen
- Node.js-versio ei tue MCP:tä

**Ratkaisu:**
```bash
# Tarkista Supabase-yhteys
curl https://bgrjaihmctqkayyochwd.supabase.co/rest/v1/

# Tarkista MCP-server
cat mcp-server/hanke-server.ts
```

#### 3. Ei mainintoja AMI-hankkeista

**Ongelma:** AMI-hankkeet puuttuvat Supabasesta

**Ratkaisu:**
1. Avaa: https://supabase.com/dashboard/project/bgrjaihmctqkayyochwd
2. Mene: SQL Editor
3. Aja kysely:
   ```sql
   SELECT COUNT(*) FROM hankkeet WHERE on_ami_hanke = true;
   ```
4. Pitäisi palauttaa: **6**
5. Jos palauttaa **0**, aja migraatio `007_insert_real_ami_projects.sql`

---

## 🐛 Debug-tila

Jos haluat VIELÄ enemmän logeja, lisää `.env.local`:iin:

```bash
ENABLE_MCP=true
DEBUG=true
NODE_ENV=development
```

Tämä tulostaa:
- Kaikki MCP-viestit
- Kaikki Supabase-kyselyt
- Kaikki Claude API -kutsut

---

## ✅ Onnistunut testi - Tarkistuslista

- [ ] Palvelin käynnissä: `npm run dev`
- [ ] Logeissa näkyy: `USE_MCP constant set to: true`
- [ ] Kirjautuminen onnistuu
- [ ] Hakemuslomake avautuu
- [ ] Analyysi käynnistyy (loading-spinner)
- [ ] Logeissa näkyy: `[ANALYZE] Using MCP (new version)`
- [ ] Logeissa näkyy: `[ANALYZE] MCP: Found X AMI projects`
- [ ] Analyysin tuloksessa mainitaan relevantti AMI-hanke
- [ ] Vertailu olemassa oleviin hankkeisiin näkyy

**Jos KAIKKI nämä täyttyvät:** ✅ MCP TOIMII!

---

## 📝 Seuraavat askeleet (jos MCP toimii)

1. ✅ Testaa molemmat esimerkkihakemukset
2. ✅ Varmista että työmarkkinadata toimii (Helsinki 48,958 työtöntä)
3. 🔄 Commitoi ja pushaa muutokset
4. 📊 Päivitä SESSION_LOG.md onnistuneesta testistä
5. 🚀 Harkitse MCP:n ottamista pysyvästi käyttöön

---

## 🎯 Mitä odotetaan tuloksista?

### Hyvä analyysi sisältää:

1. **Viittaukset AMI-hankkeisiin:**
   - "AMI on aikaisemmin rahoittanut samankaltaisen hankkeen..."
   - "Vertailuna NEETHelsinki-hanke (Into ry, 65,631 €)..."

2. **Päällekkäisyyden arviointi:**
   - "Hanke on osittain päällekkäinen X-hankkeen kanssa"
   - "Hanke täydentää olemassa olevaa Y-hanketta"

3. **Työmarkkinadatan käyttö:**
   - "Helsingissä on 48,958 työtöntä työnhakijaa (syyskuu 2025)"
   - "Pääkaupunkiseudulla yhteensä 84,320 työtöntä"

4. **Strategian arviointi:**
   - AMI:n prioriteetit (NEET, maahanmuuttajat, pitkäaikaistyöttömät)
   - Hankkeen soveltuvuus pääkaupunkiseudulle

---

**Onnea testaukseen! 🚀**

Jos törmäät ongelmiin, tarkista ensin lokit ja `.env.local` tiedosto.
