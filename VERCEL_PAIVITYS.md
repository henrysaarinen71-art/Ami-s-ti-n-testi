# Vercelin päivitys MCP:n käyttöönottoon

Päivitetty: 2025-11-21

---

## ✅ Tilanne nyt

**Ongelma:** Vercel käyttää vanhaa branchia jossa MCP ei ole käytössä
- Vercel-logit näyttävät: `[ANALYZE] Falling back to static JSON data`
- MCP ei aktivoidu tuotannossa

**Ratkaisu:** Päivitä Vercel käyttämään oikeaa branchia ja lisää ympäristömuuttuja

---

## 📋 MCP-koodi on valmis!

✅ **Branch:** `claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk`

**Sisältää:**
- ✅ MCP-palvelin: `mcp-server/hanke-server.ts`
- ✅ MCP-integraatio: `app/api/analyze/route.ts`
- ✅ Feature flag: `ENABLE_MCP` ympäristömuuttuja
- ✅ Supabase-migraatiot: 6 AMI-hanketta tietokannassa
- ✅ Työmarkkinadata korjattu (48,958 työtöntä)
- ✅ Fallback: Jos MCP epäonnistuu, käyttää vanhaa JSON-dataa

---

## 🚀 Vaihe 1: Päivitä Vercelin branch

### 1.1 Avaa Vercel Dashboard

Mene: https://vercel.com/dashboard

### 1.2 Valitse projekti

Klikkaa: **"Ami-s-ti-n-testi"** projektia

### 1.3 Mene Git-asetuksiin

- Vasemmalta valikosta: **Settings**
- Ylhäältä: **Git**-välilehti

### 1.4 Vaihda Production Branch

Etsi kohta: **Production Branch**

**Nykyinen (vanha):**
```
claude/build-review-chatbot-app-01SYuumEKiK8JZbU8DXe9NJg
```

**Uusi (sisältää MCP):**
```
claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk
```

**👉 Korvaa vanha branchin nimi uudella ja tallenna (Save)**

---

## 🔧 Vaihe 2: Lisää ympäristömuuttuja

### 2.1 Mene Environment Variables

- Vasemmalta valikosta: **Settings**
- Ylhäältä: **Environment Variables**

### 2.2 Tarkista olemassa olevat muuttujat

Varmista että nämä ovat olemassa (jos puuttuu, lisää ne):

| Muuttuja | Arvo |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bgrjaihmctqkayyochwd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_GWdBpwDjOVRfR_w2BJN-jA_DxiwflhH` |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-7FesWWqQq1xsM_uzULMk8-7us5-sBrTvPw8TPgbSIj9u30oi2JgQDAK-hMpa8AW1h7uRpu0M` |

### 2.3 Lisää MCP-feature flag

Klikkaa: **Add New**

**Täytä:**
- **Key:** `ENABLE_MCP`
- **Value:** `true`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development (valitse kaikki)

Klikkaa: **Save**

---

## 🔄 Vaihe 3: Käynnistä uusi deployment

### Vaihtoehto A: Automaattinen (suositeltu)

Kun vaihdat Production Branch -asetusta, Vercel käynnistää automaattisesti uuden deploymentin.

1. Mene: **Deployments**-välilehdelle
2. Odota ~2-5 minuuttia
3. Päivitä sivu, katso että uusi deployment alkaa
4. Odota kunnes status on: **Ready**

### Vaihtoehto B: Manuaalinen

Jos automaattista deploymenttia ei alkanut:

1. Mene: **Deployments**-välilehdelle
2. Klikkaa viimeisintä deploymenttia
3. Klikkaa oikeasta yläkulmasta: **...** (kolme pistettä)
4. Valitse: **Redeploy**
5. Vahvista: **Redeploy**
6. Odota kunnes status on: **Ready** (2-5 min)

---

## 🧪 Vaihe 4: Testaa että MCP toimii

### 4.1 Avaa sovellus

Klikkaa: **Visit** kun deployment on valmis

TAI käytä URL:ia: `https://your-app.vercel.app`

### 4.2 Kirjaudu sisään

- Email: `ami1@test.com`
- Salasana: `Ami1234!_1`

### 4.3 Tee testihakemus

Mene: **Analysoi hakemus**

**Kopioi tämä testihakemus:**

```
Hakemuksen nimi: NEET-nuorten työllistymisohjelma 2025

Haettava summa: 65000

Hakemuksen kuvaus:
Hanke tarjoaa yksilöllistä työvalmennusta NEET-nuorille (nuoret jotka eivät ole
työssä, opiskelemassa tai koulutuksessa). Toteutamme IPS-työhönvalmennus-menetelmää
Helsingin alueella. Tavoitteena on saada 50 nuorta työllistymään tai koulutukseen
vuoden aikana.

Hanke sisältää:
- Henkilökohtainen työvalmennus (1-2 kertaa viikossa)
- Työnhakukoulutus ja CV-työpajat
- Työpaikkaverkostojen rakentaminen
- Seurantajakso (6 kk työllistymisen jälkeen)
```

Klikkaa: **Analysoi hakemus**

### 4.4 🔍 Tarkista tulos

**Jos MCP toimii, analyysissä pitäisi mainita:**

✅ **"NEETHelsinki"** (Into ry, 65,631 €)
✅ **"IPS-työhönvalmennus"** (Spring House Oy, 57,288 €)

**Esimerkki odotetusta tekstistä:**
> "Huomionarvoista on, että AMI on jo rahoittanut samankaltaisen hankkeen:
> **NEETHelsinki** (Into ry, 65,631 €), joka myös keskittyy NEET-nuorten
> työllistämiseen. Hakijan tulisi selkeästi erottaa oma hankkeensa tästä..."

---

## 📊 Vaihe 5: Tarkista Vercel-logit

### 5.1 Avaa Runtime Logs

1. Mene Vercel Dashboard → **Deployments**
2. Klikkaa viimeisintä deploymenttia
3. Klikkaa ylhäältä: **Runtime Logs**

### 5.2 Tee uusi analyysi ja katso logeja

Kun teet analyysin sovelluksessa, logeissa pitäisi näkyä:

**✅ ONNISTUNUT (MCP toimii):**
```
[MODULE LOAD] USE_MCP constant set to: true
[ANALYZE] Using MCP (new version)
[ANALYZE] MCP: Connecting to hanke-server...
[ANALYZE] MCP: Connected successfully
[ANALYZE] MCP: Found 6 AMI projects from Supabase
```

**❌ EPÄONNISTUNUT (MCP ei toimi):**
```
[ANALYZE] Falling back to static JSON data
```

Jos näet "Falling back", tarkista:
1. Onko `ENABLE_MCP=true` lisätty Environment Variables -osioon?
2. Onko deployment käyttänyt oikeaa branchia?
3. Onko deployment tehty ympäristömuuttujien lisäämisen JÄLKEEN?

---

## ⚠️ Vianmääritys

### Ongelma 1: "Falling back to static JSON data"

**Syy:** `ENABLE_MCP` ei ole `true` tuotannossa

**Ratkaisu:**
1. Tarkista Environment Variables: `ENABLE_MCP=true`
2. Varmista että se on valittu **Production**-ympäristöön
3. Tee uusi deployment (Redeploy)

---

### Ongelma 2: "MCP error: Connection failed"

**Syy:** Supabase-yhteys ei toimi

**Ratkaisu:**
1. Tarkista Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Varmista että arvot ovat oikein
3. Testaa Supabase-yhteys: https://bgrjaihmctqkayyochwd.supabase.co/rest/v1/

---

### Ongelma 3: Ei mainintoja AMI-hankkeista

**Syy:** Hankkeet puuttuvat Supabasesta

**Ratkaisu:**
1. Avaa Supabase Dashboard: https://supabase.com/dashboard
2. Valitse projektisi → SQL Editor
3. Aja kysely:
   ```sql
   SELECT COUNT(*) FROM hankkeet WHERE on_ami_hanke = true;
   ```
4. Pitäisi palauttaa: **6**
5. Jos palauttaa **0**, aja migraatio: `supabase/migrations/007_insert_real_ami_projects.sql`

---

## ✅ Onnistumisen tarkistuslista

- [ ] Vercel Production Branch päivitetty: `claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk`
- [ ] `ENABLE_MCP=true` lisätty Environment Variables
- [ ] Uusi deployment tehty ja status: **Ready**
- [ ] Sovellus avattu ja kirjauduttu sisään
- [ ] Testihakemus täytetty (NEET-nuoret)
- [ ] Analyysi lähetetty
- [ ] Tuloksessa mainitaan **NEETHelsinki** tai **IPS-hanke**
- [ ] Vercel-logeissa näkyy: `[ANALYZE] Using MCP (new version)`

**Jos KAIKKI nämä täyttyvät:** 🎉 **MCP TOIMII TUOTANNOSSA!**

---

## 📝 Mitä tapahtuu taustalla?

Kun MCP on käytössä:

1. **Käyttäjä lähettää hakemuksen** → `/api/analyze` endpoint
2. **Feature flag tarkistetaan:** `ENABLE_MCP === 'true'`?
3. **Jos true:**
   - Käynnistetään MCP-palvelin (`mcp-server/hanke-server.ts`)
   - Yhdistetään Supabaseen
   - Haetaan 6 AMI-hanketta tietokannasta
   - Lähetetään data Claude API:lle
4. **Claude analysoi:**
   - Vertailee hakemusta olemassa oleviin hankkeisiin
   - Mainitsee relevantit hankkeet (NEETHelsinki, IPS, jne.)
   - Arvioi päällekkäisyyttä
5. **Jos MCP epäonnistuu:**
   - Fallback: Käyttää vanhaa `data/hankkeet.json` tiedostoa
   - Logit: `[ANALYZE] Falling back to static JSON data`

---

## 🎯 Seuraavat askeleet (kun MCP toimii)

1. ✅ Testaa molemmat esimerkkihakemukset (NEET + työperäinen hyväksikäyttö)
2. ✅ Varmista että työmarkkinadata toimii (48,958 työtöntä Helsingissä)
3. 🚀 Poista feature flag ja käytä vain MCP:tä (valinnainen)
4. 📊 Lisää lisää AMI-hankkeita Supabaseen (valinnainen)
5. 🔄 Automatisoi hankkeiden päivitys (valinnainen)

---

**Onnea Vercelin päivitykseen! 🚀**

Jos törmäät ongelmiin, tarkista ensin Vercel Runtime Logs ja Environment Variables.
