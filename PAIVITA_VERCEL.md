# VIIMEINEN VAIHE: Päivitä Vercel käyttämään "main"-branchia

Päivitetty: 2025-11-21

---

## 🎉 GitHub VALMIS!

✅ **main-branch luotu ja default branch asetettu**
✅ **61 commits sisältää kaikki MCP-muutokset**
✅ **2/2 checks passed**

---

## 🚀 SEURAAVA: Päivitä Vercel (5 min)

### Vaihe 1: Avaa Vercel Dashboard

```
https://vercel.com/dashboard
```

### Vaihe 2: Valitse projekti

- Etsi ja klikkaa: **"Ami-s-ti-n-testi"** (tai projektisi nimi)

### Vaihe 3: Mene Git-asetuksiin

1. Vasemmalta valikosta: **Settings**
2. Ylhäältä välilehdistä: **Git**

### Vaihe 4: Päivitä Production Branch

**Etsi kohta:** "Production Branch"

**Nykyinen arvo:** Todennäköisesti `claude/build-review-chatbot-app-01SYuumEKiK8JZbU8DXe9NJg`

**Vaihda:**
1. Klikkaa edit-ikonia (kynä)
2. Tyhjennä kenttä
3. Kirjoita: `main`
4. Tallenna/Save

**TAI jos on dropdown:**
1. Valitse: `main`
2. Tallenna

✅ **Vercel käyttää nyt main-branchia!**

### Vaihe 5: Varmista Environment Variables

Klikkaa ylhäältä: **Environment Variables**

**Tarkista että nämä ovat asetettu Production-ympäristöön:**

| Muuttuja | Arvo | Status |
|----------|------|--------|
| `ENABLE_MCP` | `true` | ✅ PAKOLLINEN |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bgrjaihmctqkayyochwd.supabase.co` | ✅ PAKOLLINEN |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_GWdBpwDjOVRfR_w2BJN-jA_DxiwflhH` | ✅ PAKOLLINEN |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | ✅ PAKOLLINEN |

**Jos `ENABLE_MCP` puuttuu:**
1. Klikkaa: **Add New**
2. Key: `ENABLE_MCP`
3. Value: `true`
4. Environments: ✅ Production, ✅ Preview, ✅ Development
5. Save

### Vaihe 6: Käynnistä uusi deployment

**Vaihtoehto A: Automaattinen**
- Kun vaihdat Production Branchia, Vercel deployaa automaattisesti
- Odota ~30 sekuntia
- Päivitä sivu

**Vaihtoehto B: Manuaalinen**
1. Ylhäältä: **Deployments**
2. Klikkaa viimeisintä deploymenttia
3. Oikeasta yläkulmasta: **...** (kolme pistettä)
4. Valitse: **Redeploy**
5. Vahvista: **Redeploy**

**Odota deploymenttia:**
- Status: Building → Ready
- Kesto: ~2-5 minuuttia
- ✅ Kun näet "Ready" → valmis!

---

## 🧪 Vaihe 7: TESTAA että MCP toimii!

### 7.1 Avaa sovellus

- Klikkaa: **Visit** (kun deployment on Ready)
- TAI avaa Vercel-URL: `https://your-app.vercel.app`

### 7.2 Kirjaudu sisään

- Email: `ami1@test.com`
- Salasana: `Ami1234!_1`

### 7.3 Mene analysointisivulle

- Klikkaa: **"Analysoi hakemus"**

### 7.4 Täytä testihakemus

**Kopioi tämä:**

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

### 7.5 Lähetä analyysi

- Klikkaa: **"Analysoi hakemus"**
- Odota ~10-30 sekuntia

---

## 🔍 Vaihe 8: TARKISTA RUNTIME LOGS (KRIITTINEN!)

### 8.1 Avaa Runtime Logs

1. Vercel Dashboard → **Deployments**
2. Klikkaa viimeisintä deploymenttia
3. Ylhäältä: **Runtime Logs**
4. Odota että logeja alkaa tulla (kun teet analyysin)

### 8.2 Etsi näitä logeja

**ODOTETTU TULOS (MCP TOIMII):**

```
=== MODULE LOAD TIME DEBUG ===
[MODULE LOAD] Initializing analyze route
[MODULE LOAD] process.env.ENABLE_MCP: true
[MODULE LOAD] typeof: string
[MODULE LOAD] Comparison result (ENABLE_MCP === "true"): true
[MODULE LOAD] USE_MCP constant set to: true
===============================

=== DATA SOURCE SELECTION ===
[DEBUG] USE_MCP constant value: true
[DEBUG] process.env.ENABLE_MCP at request time: true
[DEBUG] ✅ USE_MCP is TRUE → Calling fetchProjectDataFromMCP()

=== MCP FUNCTION CALLED ===
[ANALYZE] Using MCP data (new version)
[MCP] Starting MCP connection process...
[MCP] Step 1: Creating MCP client...
[MCP] Step 2: Setting up MCP server connection...
[MCP] Step 3: Connecting to MCP server...
[MCP] ✅ MCP client connected successfully
[ANALYZE] Calling MCP: get_ami_hankkeet
[ANALYZE] MCP returned 6 AMI projects
```

**Jos näet nämä → 🎉 MCP TOIMII!**

---

## 📊 Vaihe 9: Tarkista analyysin tulos

**ODOTETTU ANALYYSI sisältää:**

✅ **Maininta AMI-hankkeesta:**
- "NEETHelsinki" (Into ry, 65,631 €) TAI
- "IPS-työhönvalmennus" (Spring House Oy, 57,288 €)

✅ **Vertailu:**
> "Huomionarvoista on, että AMI on jo rahoittanut samankaltaisen hankkeen:
> **NEETHelsinki** (Into ry, 65,631 €), joka myös keskittyy NEET-nuorten
> työllistämiseen..."

✅ **Työmarkkinadata:**
- Mainitsee Helsingin työttömyysluvun: 48,958

✅ **Päällekkäisyyden arviointi:**
- Vertailee hakemusta olemassa oleviin hankkeisiin
- Arvioi eroavaisuuksia

---

## ❌ Jos MCP ei toimi - Seuraa DEBUG_OHJEET.md

**Skenaario A:** Logit näyttävät `USE_MCP constant set to: false`
→ `ENABLE_MCP` puuttuu tai ei ole "true" Vercelissä
→ **Ratkaisu:** Lisää/tarkista Environment Variable

**Skenaario B:** Logit näyttävät `✅ USE_MCP is TRUE`
→ MCP aktivoituu! 🎉
→ **Tarkista:** Näetkö AMI-hankkeen mainintoja analyysissä?

**Skenaario C:** Logit näyttävät `=== MCP ERROR OCCURRED ===`
→ MCP epäonnistui, lue virheloki
→ **Ratkaisu:** Kopioi virheloki ja raportoi

---

## ✅ Yhteenveto: Mitä teit

1. ✅ **Loit main-branchin** GitHubissa (pohjana claude/continue-work)
2. ✅ **Asetit main:n default branchiksi** GitHub Settingsissä
3. ✅ **Päivitit Vercelin** Production Branch = main
4. ✅ **Varmistit Environment Variables** (`ENABLE_MCP=true`)
5. ✅ **Deploysit ja testasit** MCP-toimintaa
6. ✅ **Tarkistit Runtime Logs** - MCP aktivoituu!

---

## 🎯 Odotettu lopputulos

**Kun kaikki toimii:**
- ✅ Vercel deployaa main-branchista
- ✅ MCP aktivoituu (`ENABLE_MCP=true`)
- ✅ Logit: `[ANALYZE] Using MCP (new version)`
- ✅ AMI-hankkeet mainitaan analyysissä
- ✅ Data tulee Supabasesta (ei JSON-tiedostosta)
- ✅ Anti-hallusinaatio-säännöt estävät keksityt hankkeet

**Hyödyt:**
- 📊 Parempi analyysi (Supabase-data)
- 🔍 Debug-logit (helppo selvittää ongelmia)
- 🛡️ Anti-hallusinaatio (ei keksittyjä hankkeita)
- 🚀 Skaalautuva (helppo lisätä uusia hankkeita)

---

## 📞 Kun olet testannut

**Kerro minulle:**
1. ✅ Päivititkö Vercel Production Branchin → main?
2. ✅ Deploysitko uudelleen?
3. ✅ Teitkö testihakemuksen?
4. 🔍 **Mitä Runtime Logeissa näkyy?**
5. 📊 **Mainitaanko analyysissä AMI-hankkeita?**

**Jos MCP ei toimi:**
- Kopioi Runtime Logs tähän
- Seuraa `DEBUG_OHJEET.md` ohjeita
- Raportoi mitä näet

**Jos MCP toimii:**
- 🎉 **ONNITTELUT!** MCP on nyt tuotannossa!
- Voit alkaa käyttää sovellusta
- Voit lisätä lisää AMI-hankkeita Supabaseen

---

**Onnea Vercelin päivitykseen! Olet melkein perillä! 🚀**
