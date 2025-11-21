# KRIITTINEN: Luo "main"-branch GitHubissa

Päivitetty: 2025-11-21

---

## ⚠️ ONGELMA HAVAITTU

**Repositoriossa EI OLE "main"-branchia!**

Tämä selittää miksi:
- ❌ Vercel deployaa väärästä branchista
- ❌ MCP ei toimi tuotannossa
- ❌ Logit näyttävät: "[ANALYZE] Falling back to static JSON data"

**Ratkaisu:** Luo "main"-branch GitHubissa (ei voi tehdä komentoriviltä turvallisuusrajoitusten takia)

---

## 🚀 VAIHE 1: Luo "main"-branch GitHubissa (5 min)

### 1.1 Avaa GitHub-repositorio

```
https://github.com/henrysaarinen71-art/Ami-s-ti-n-testi
```

### 1.2 Luo uusi branch

1. **Klikkaa branch-dropdownia** (ylhäällä vasemmalla, näyttää nykyisen branchin nimen)
   - Pitäisi näyttää: `claude/build-review-chatbot-app-01SYuumEKiK8JZbU8DXe9NJg` (tai vastaava)

2. **Vaihda näkymää oikeaan branchiin ENSIN:**
   - Kirjoita hakukenttään: `claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk`
   - Valitse se listasta
   - ✅ **VARMISTA että olet tässä branchissa ennen kuin luot main:n!**

3. **Luo "main" tästä branchista:**
   - Avaa branch-dropdown uudelleen
   - Kirjoita: `main`
   - Klikkaa: **"Create branch: main from 'claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk'"**
   - ✅ main-branch luotu!

---

## 🎯 VAIHE 2: Aseta "main" default branchiksi (2 min)

### 2.1 Mene Settings

1. **Klikkaa ylhäältä:** Settings (repositorion asetukset)

### 2.2 Vaihda Default branch

1. **Vasemmalta:** General (pitäisi olla jo valittuna)
2. **Etsi kohta:** Default branch
3. **Nykyinen:** `claude/build-review-chatbot-app-01SYuumEKiK8JZbU8DXe9NJg` (vanha)
4. **Klikkaa:** ⇄ (switch-ikoni) tai "Switch to another branch"
5. **Valitse:** `main`
6. **Vahvista:** "I understand, update the default branch"
7. ✅ main on nyt default branch!

---

## 🔧 VAIHE 3: Päivitä Vercel (3 min)

### 3.1 Avaa Vercel Dashboard

```
https://vercel.com/dashboard
```

### 3.2 Valitse projekti

- Klikkaa: **Ami-s-ti-n-testi**

### 3.3 Päivitä Production Branch

**Vaihtoehto A: Jos Vercel käyttää "default branchia"**
- Settings → Git → Production Branch → "Use default branch"
- ✅ Vercel käyttää nyt automaattisesti "main"

**Vaihtoehto B: Jos Vercel käyttää tiettyä branchia**
1. Settings → Git → Production Branch
2. Vaihda: `main`
3. Tallenna

### 3.4 Varmista Environment Variables

Settings → Environment Variables → Tarkista:
- ✅ `ENABLE_MCP=true` (Production)
- ✅ `NEXT_PUBLIC_SUPABASE_URL=https://bgrjaihmctqkayyochwd.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_GWdBpwDjOVRfR_w2BJN-jA_DxiwflhH`
- ✅ `ANTHROPIC_API_KEY=sk-ant-api03-...`

### 3.5 Käynnistä deployment

1. Deployments-välilehti
2. Klikkaa viimeisintä deploymenttia
3. Klikkaa: **...** → **Redeploy**
4. Vahvista

---

## ✅ VAIHE 4: Testaa että MCP toimii (5 min)

### 4.1 Odota deploymenttia

- Status: Building → Ready
- Kesto: ~2-5 minuuttia

### 4.2 Avaa sovellus

- Klikkaa: **Visit** kun deployment on valmis

### 4.3 Tee testihakemus

1. Kirjaudu sisään: `ami1@test.com` / `Ami1234!_1`
2. Mene: **Analysoi hakemus**
3. Täytä testihakemus:

```
Hakemuksen nimi: NEET-nuorten työllistymisohjelma 2025

Haettava summa: 65000

Hakemuksen kuvaus:
Hanke tarjoaa yksilöllistä työvalmennusta NEET-nuorille. Toteutamme
IPS-työhönvalmennus-menetelmää Helsingin alueella. Tavoitteena on saada
50 nuorta työllistymään tai koulutukseen vuoden aikana.
```

4. Lähetä analyysi

### 4.4 🔍 Tarkista Runtime Logs

Vercel Dashboard → Deployments → [viimeisin] → **Runtime Logs**

**ODOTETTU TULOS (jos MCP toimii):**
```
=== MODULE LOAD TIME DEBUG ===
[MODULE LOAD] USE_MCP constant set to: true
===============================

=== DATA SOURCE SELECTION ===
[DEBUG] ✅ USE_MCP is TRUE → Calling fetchProjectDataFromMCP()

=== MCP FUNCTION CALLED ===
[MCP] ✅ MCP client connected successfully
[ANALYZE] MCP returned 6 AMI projects
```

**ODOTETTU ANALYYSI:**
- Mainitsee: **"NEETHelsinki" (Into ry, 65,631 €)** TAI **"IPS-työhönvalmennus" (Spring House Oy, 57,288 €)**
- Vertailee hakemusta olemassa oleviin hankkeisiin
- Data tulee Supabasesta

---

## ❌ Jos MCP ei vieläkään toimi

### Tarkista logit ja tulkitse `DEBUG_OHJEET.md` mukaan:

**Skenaario A:** `USE_MCP constant set to: false`
→ `ENABLE_MCP` puuttuu tai ei ole "true" Vercelissä

**Skenaario B:** `✅ USE_MCP is TRUE`
→ MCP toimii! 🎉

**Skenaario C:** `=== MCP ERROR OCCURRED ===`
→ MCP epäonnistuu, lue virheloki ja raportoi

---

## 📊 Varmistus: Mitä "main" sisältää?

Kun olet luonut main-branchin oikein, se sisältää:

### Commitit (7 kpl):
1. `8be58e0` - GitHub main setup guide
2. `6f77b0a` - Session 2 summary
3. `b136eb4` - TODO: Historical AMI projects
4. `49cbc44` - Anti-hallucination safeguards
5. `10daa1b` - Debug logging
6. `6c9fe34` - Vercel deployment guide
7. `1f53dc6` - MCP testing setup

### Tiedostot:
- ✅ `mcp-server/hanke-server.ts` (MCP-palvelin)
- ✅ `app/api/analyze/route.ts` (MCP-integraatio + debug-logit + hallusinaation esto)
- ✅ `VERCEL_PAIVITYS.md`
- ✅ `DEBUG_OHJEET.md`
- ✅ `TESTAA_MCP.md`
- ✅ `GITHUB_MAIN_SETUP.md`

### Voit tarkistaa GitHubissa:
1. Mene main-branchiin
2. Katso että `app/api/analyze/route.ts` sisältää:
   - `const USE_MCP = process.env.ENABLE_MCP === 'true'`
   - `async function fetchProjectDataFromMCP()`
   - Anti-hallusinaatio-säännöt promptissa

---

## 🎯 Yhteenveto: Mitä teit

1. ✅ **Loit "main"-branchin** pohjana `claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk`
2. ✅ **Asetit "main" default branchiksi** GitHubissa
3. ✅ **Päivitit Vercelin** käyttämään "main"-branchia
4. ✅ **Deploysit ja testasit** MCP-toimintaa
5. ✅ **Tarkistit logit** - MCP aktivoituu nyt!

---

## 🚀 Lopputulos

**main-branch on nyt:**
- 📦 Repositorion default branch
- 🚀 Vercelin production branch
- ✅ Sisältää kaikki MCP-muutokset
- ✅ Sisältää debug-logit
- ✅ Sisältää anti-hallusinaatio-suojaukset

**Vercel deployaa nyt:**
- ✅ main-branchista automaattisesti
- ✅ MCP aktivoituu kun `ENABLE_MCP=true`
- ✅ Logit näyttävät: `[ANALYZE] Using MCP (new version)`
- ✅ AMI-hankkeet mainitaan analyysissä

---

**Kun olet luonut main-branchin ja deployannut Vercelissä, kerro mitä logeissa näkyy!** 🎉
