# KRIITTINEN: Vercel ei käytä uutta main-branchia

Päivitetty: 2025-11-21 15:45

---

## 🔴 ONGELMA

**Vercel-logit näyttävät että käytössä on VANHA build:**
- ❌ `[ANALYZE] Falling back to static JSON data`
- ❌ Debug-logit puuttuvat (ei `=== MODULE LOAD TIME DEBUG ===`)
- ❌ Claude hallusinoi hankkeita: "Pitkäaikaistyöttömien mentorointiohjelma"

**Syy:**
- Vercel ei ole vielä deployannut main-branchia
- Käytössä on vanha build jossa ei ole:
  - Debug-logitusta
  - Anti-hallusinaatio-sääntöjä
  - MCP-koodia

---

## ✅ KORJAUS - TEE NÄMÄ VAIHEET

### Vaihe 1: Tarkista Vercel Git-asetukset

1. **Avaa:** https://vercel.com/dashboard
2. **Valitse projekti:** Ami-s-ti-n-testi
3. **Mene:** Settings → Git

**Tarkista:**
- **Production Branch:** Pitää olla `main` (EI `claude/build-review-chatbot-app-...`)
- Jos ei ole `main` → Vaihda nyt!

### Vaihe 2: Varmista Environment Variables

Settings → Environment Variables

**PAKOLLINEN:**
```
Key: ENABLE_MCP
Value: true
Environments: ✅ Production ✅ Preview ✅ Development
```

**Jos puuttuu:**
1. Klikkaa: Add New
2. Täytä yllä olevat tiedot
3. Save

### Vaihe 3: Poista vanha build-cache

**Tämä on KRIITTINEN askel!**

1. **Mene:** Deployments-välilehti
2. **Klikkaa:** Viimeisintä deploymenttia (ylimpänä listassa)
3. **Klikkaa:** ... (kolme pistettä) oikeassa yläkulmassa
4. **Valitse:** Redeploy
5. **TÄRKEÄÄ:** ✅ Valitse "Clear Cache and Redeploy" (jos näkyy)
6. **Vahvista:** Redeploy

**Miksi tämä on tärkeää?**
- Vercel saattaa käyttää vanhaa cache:a
- "Clear Cache" pakottaa täysin uuden buildin
- Varmistaa että main-branchin koodi käytetään

### Vaihe 4: Odota deploymenttia

- Status: **Queued** → **Building** → **Ready**
- Kesto: ~3-7 minuuttia (pidempi kuin normaali koska cache tyhjennetään)
- **ÄLÄ TESTAA ENNEN KUIN STATUS ON "READY"!**

### Vaihe 5: Varmista että build on uusi

**Tarkista Deployments-välilehdeltä:**
- **Source:** Pitää näyttää `main` (ei claude/...)
- **Commit:** Pitää olla viimeisin commit (esim. `52d7f1d` tai uudempi)
- **Age:** Muutama minuutti sitten

---

## 🧪 Vaihe 6: Testaa UUSI build

### 6.1 Avaa sovellus

- Klikkaa: **Visit**
- TAI avaa URL: https://ami-s-ti-n-testi.vercel.app

### 6.2 Kirjaudu ja tee testihakemus

1. Kirjaudu: `ami1@test.com` / `Ami1234!_1`
2. Mene: **Analysoi hakemus**
3. Täytä sama testi uudelleen:

```
Hakemuksen nimi: NEET-nuorten työllistymisohjelma 2025

Haettava summa: 65000

Hakemuksen kuvaus:
Hanke tarjoaa yksilöllistä työvalmennusta NEET-nuorille. Toteutamme
IPS-työhönvalmennus-menetelmää Helsingin alueella. Tavoitteena on saada
50 nuorta työllistymään tai koulutukseen vuoden aikana.
```

4. Lähetä analyysi

### 6.3 Tarkista Runtime Logs HETI

**Vercel Dashboard → Deployments → [viimeisin] → Runtime Logs**

---

## 🔍 ODOTETUT LOGIT (uusi build):

### ✅ MODUULIN LATAUS (näkyy heti kun deployment käynnistyy):

```
=== MODULE LOAD TIME DEBUG ===
[MODULE LOAD] Initializing analyze route
[MODULE LOAD] process.env.ENABLE_MCP: true
[MODULE LOAD] typeof: string
[MODULE LOAD] Comparison result (ENABLE_MCP === "true"): true
[MODULE LOAD] USE_MCP constant set to: true
[MODULE LOAD] If USE_MCP is false, check Vercel Environment Variables!
===============================
```

**JOS NÄET NÄMÄ LOGIT → Uusi build on käytössä! ✅**

### ✅ ANALYYSIN AIKANA:

```
=== DATA SOURCE SELECTION ===
[ANALYZE] Step: Fetching project comparison data
[DEBUG] USE_MCP constant value: true
[DEBUG] process.env.ENABLE_MCP at request time: true
[DEBUG] ✅ USE_MCP is TRUE → Calling fetchProjectDataFromMCP()
=============================

=== MCP FUNCTION CALLED ===
[ANALYZE] Using MCP data (new version)
[MCP] Starting MCP connection process...
[MCP] Step 1: Creating MCP client...
[MCP] Step 2: Setting up MCP server connection...
```

**Sitten JOKO:**

**A) MCP ONNISTUU:**
```
[MCP] ✅ MCP client connected successfully
[ANALYZE] MCP returned 6 AMI projects
```
→ 🎉 **MCP TOIMII!**

**B) MCP EPÄONNISTUU:**
```
=== MCP ERROR OCCURRED ===
[MCP ERROR] Error type: Error
[MCP ERROR] Error message: [virheviesti]
[MCP ERROR] Stack trace: [...]
[ANALYZE] Falling back to static JSON data
```
→ ⚠️ **MCP yrittää mutta epäonnistuu** (kerro virheviesti!)

---

## 📊 ODOTETUT MUUTOKSET ANALYYSISSÄ:

### ✅ EI ENÄÄ HALLUSINAATIOITA:

**ENNEN (vanha build):**
❌ "Pitkäaikaistyöttömien mentorointiohjelma (2023)" - KEKSITTY!

**JÄLKEEN (uusi build):**
✅ **Vain oikeat hankkeet:**
- "NEETHelsinki" (Into ry, 65,631 €) - OIKEA
- "IPS-työhönvalmennus" (Spring House Oy, 57,288 €) - OIKEA
- "Työperäisen hyväksikäytön torjunta" (Motiva/HEUNI, 26,072 €) - OIKEA

✅ **TAI jos ei löydy vastaavaa:**
- "Tietokannassa ei ole tällä hetkellä AMI-rahoitteisia hankkeita jotka olisivat suoraan verrattavissa tähän hakemukseen."

**EI KEKSITTYJÄ HANKKEITA!**

---

## ❌ Jos logit EIVÄT MUUTU:

### Ongelma: Vercel käyttää edelleen vanhaa buildia

**Tarkista:**

1. **Deployments → Viimeisin deployment:**
   - Source: Onko `main`?
   - Commit: Onko viimeisin? (52d7f1d tai uudempi)

2. **Settings → Git → Production Branch:**
   - Onko `main`?
   - Jos ei, vaihda ja redeploy

3. **Yritä uudelleen "Clear Cache and Redeploy":**
   - Joskus yksi redeploy ei riitä
   - Yritä 2-3 kertaa jos tarpeen

4. **Tarkista että main-branch on ajantasalla GitHubissa:**
   - Avaa: https://github.com/henrysaarinen71-art/Ami-s-ti-n-testi
   - Vaihda branchiin: `main`
   - Tarkista että näet viimeisimmät tiedostot:
     - `PAIVITA_VERCEL.md`
     - `VERCEL_DEPLOYMENT_KORJAUS.md`
     - `LUO_MAIN_BRANCH.md`

---

## 🎯 ONNISTUMISEN TARKISTUS

### ✅ Uusi build on käytössä JOS:

1. ✅ Logeissa näkyy: `=== MODULE LOAD TIME DEBUG ===`
2. ✅ Logeissa näkyy: `USE_MCP constant set to: true`
3. ✅ Logeissa näkyy: `[DEBUG] ✅ USE_MCP is TRUE`
4. ✅ Analyysissä EI mainita keksittyjä hankkeita
5. ✅ Analyysissä mainitaan VAIN oikeita hankkeita TAI "ei löytynyt vastaavaa"

---

## 💬 Raportoi tulokset

**Kun olet tehnyt Clear Cache and Redeploy:**

**Kerro:**
1. ✅ Näkyvätkö debug-logit? (`=== MODULE LOAD TIME DEBUG ===`)
2. 🔍 Mikä on `USE_MCP` arvo? (`true` vai `false`)
3. 📊 Mainitaanko analyysissä keksittyjä hankkeita?
4. 🎯 Jos MCP epäonnistuu, mikä on virheviesti?

---

**HUOM:** Vanha build käytti staattista JSON-dataa jossa on 5 testihankkeet.
Uusi build käyttää joko MCP:tä (Supabase, 6 hanketta) TAI samaa JSON-dataa fallbackina.

**KRIITTINEN:** Hallusinaatiot kertovat että vanha build on käytössä!

---

**TL;DR:**
1. Vercel Settings → Git → Production Branch = `main`
2. Vercel Settings → Environment Variables → `ENABLE_MCP=true`
3. Deployments → ... → **Clear Cache and Redeploy**
4. Odota Ready
5. Testaa ja tarkista logit
6. Raportoi tulokset
