# Debug-logien tulkinta - MCP-ongelma

Päivitetty: 2025-11-21

---

## ✅ Tehty: Debug-logitus lisätty

Lisäsin kattavat debug-logit `app/api/analyze/route.ts` tiedostoon selvittääksemme miksi MCP ei aktivoidu tuotannossa.

---

## 🔍 Mitä seuraavaksi?

### Vaihe 1: Päivitä Vercel

1. **Varmista että Vercel on päivitetty:**
   - Production Branch: `claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk`
   - Environment Variable: `ENABLE_MCP=true`

2. **Käynnistä uusi deployment:**
   - Vercel Dashboard → Deployments → Redeploy
   - Odota että deployment valmistuu (status: Ready)

### Vaihe 2: Tee testihakemus

1. Avaa sovellus Vercelissä
2. Kirjaudu sisään (`ami1@test.com`)
3. Mene "Analysoi hakemus"
4. Täytä testihakemus (esim. NEET-nuoret)
5. Lähetä analyysi

### Vaihe 3: Tarkista Vercel Runtime Logs

Mene: **Vercel Dashboard → Deployments → [viimeisin] → Runtime Logs**

---

## 📊 Mitä logeja etsiä?

Logit kertovat TARKALLEEN mikä on väärin. Tässä kolme skenaariota:

---

### Skenaario A: ENABLE_MCP ei ole asetettu

**Logeissa näkyy:**

```
=== MODULE LOAD TIME DEBUG ===
[MODULE LOAD] Initializing analyze route
[MODULE LOAD] process.env.ENABLE_MCP: undefined
[MODULE LOAD] typeof: undefined
[MODULE LOAD] Comparison result (ENABLE_MCP === "true"): false
[MODULE LOAD] USE_MCP constant set to: false
[MODULE LOAD] If USE_MCP is false, check Vercel Environment Variables!
===============================

=== DATA SOURCE SELECTION ===
[ANALYZE] Step: Fetching project comparison data
[DEBUG] USE_MCP constant value: false
[DEBUG] process.env.ENABLE_MCP at request time: undefined
[DEBUG] ⚠️ USE_MCP is FALSE → Calling fetchProjectDataFromJSON()
[DEBUG] ⚠️ This means ENABLE_MCP is NOT set to "true" in environment
```

**Diagnoosi:** ❌ `ENABLE_MCP` ympäristömuuttuja puuttuu tai ei ole `"true"`

**Ratkaisu:**
1. Mene Vercel → Settings → Environment Variables
2. Tarkista että `ENABLE_MCP=true` on lisätty
3. Varmista että se on valittu **Production** ympäristöön
4. Tee uusi deployment (Redeploy)

---

### Skenaario B: ENABLE_MCP on asetettu, MCP toimii

**Logeissa näkyy:**

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
[DEBUG] ✅ USE_MCP is TRUE → Calling fetchProjectDataFromMCP()

=== MCP FUNCTION CALLED ===
[ANALYZE] Using MCP data (new version)
[MCP] Starting MCP connection process...
[MCP] Step 1: Creating MCP client...
[MCP] Step 2: Setting up MCP server connection...
[MCP] Server path: /var/task/mcp-server/hanke-server.ts
[MCP] Current working directory: /var/task
[MCP] Step 3: Connecting to MCP server...
[MCP] ✅ MCP client connected successfully
[ANALYZE] Calling MCP: get_ami_hankkeet
[ANALYZE] MCP returned 6 AMI projects
```

**Diagnoosi:** ✅ MCP toimii täydellisesti!

**Tulos:**
- Analyysi mainitsee AMI-hankkeet (NEETHelsinki, IPS, jne.)
- Data tulee Supabasesta
- Kaikki toimii kuten pitääkin 🎉

---

### Skenaario C: ENABLE_MCP on asetettu MUTTA MCP epäonnistuu

**Logeissa näkyy:**

```
=== MODULE LOAD TIME DEBUG ===
[MODULE LOAD] USE_MCP constant set to: true
===============================

=== DATA SOURCE SELECTION ===
[DEBUG] ✅ USE_MCP is TRUE → Calling fetchProjectDataFromMCP()

=== MCP FUNCTION CALLED ===
[MCP] Starting MCP connection process...
[MCP] Step 1: Creating MCP client...
[MCP] Step 2: Setting up MCP server connection...
[MCP] Server path: /var/task/mcp-server/hanke-server.ts
[MCP] Step 3: Connecting to MCP server...

=== MCP ERROR OCCURRED ===
[MCP ERROR] Error type: Error
[MCP ERROR] Error message: Cannot find module 'tsx'
[MCP ERROR] Full error: Error: Cannot find module 'tsx'
[MCP ERROR] Stack trace: ...
[ANALYZE] Falling back to static JSON data
==========================
```

**Diagnoosi:** ⚠️ MCP yrittää toimia mutta epäonnistuu

**Mahdolliset virheet ja ratkaisut:**

#### Virhe 1: "Cannot find module 'tsx'"

**Syy:** `tsx` puuttuu tuotannon riippuvuuksista

**Ratkaisu:**
```bash
# Lisää tsx dependencies-osioon (EI devDependencies)
npm install tsx --save
git add package.json package-lock.json
git commit -m "fix: Add tsx to production dependencies for MCP server"
git push
```

#### Virhe 2: "ENOENT: no such file or directory 'mcp-server/hanke-server.ts'"

**Syy:** MCP-server-tiedosto ei ole deployattu

**Ratkaisu:**
- Tarkista että `mcp-server/` hakemisto on Gitissä
- Varmista että se ei ole `.gitignore`:ssa
- Pushaa uudelleen

#### Virhe 3: "Connection timeout" tai "ECONNREFUSED"

**Syy:** Supabase-yhteys ei toimi

**Ratkaisu:**
1. Tarkista Vercel Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Testaa Supabase-yhteys: `https://bgrjaihmctqkayyochwd.supabase.co/rest/v1/`

#### Virhe 4: "Permission denied" tai "Unauthorized"

**Syy:** Supabase RLS-käyttöoikeudet

**Ratkaisu:**
- Tarkista että `hankkeet` taulussa on oikeat RLS-säännöt
- Käyttäjällä pitää olla lukuoikeus

---

## 🎯 Quick Checklist

Käy läpi tämä lista:

- [ ] Vercel Production Branch on: `claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk`
- [ ] Vercel Environment Variable `ENABLE_MCP=true` lisätty
- [ ] Environment Variable valittu **Production** ympäristöön
- [ ] Uusi deployment tehty (viimeisin commit: `10daa1b`)
- [ ] Testihakemus tehty sovelluksessa
- [ ] Vercel Runtime Logs avattu
- [ ] Logit luettu ja tulkittu yllä olevien skenaarioiden mukaan

---

## 📝 Mitä tehdä kun näet logit?

### Jos Skenaario A (ENABLE_MCP puuttuu):
→ Lisää `ENABLE_MCP=true` Verceliin ja redeploy

### Jos Skenaario B (MCP toimii):
→ 🎉 **Onnittelut! Kaikki toimii!**

### Jos Skenaario C (MCP epäonnistuu):
→ Kopioi virheilmoitus ja kerro minulle, niin korjaan ongelman

---

## 🔧 Hyödyllisiä komentoja

**Tarkista että MCP-tiedostot ovat olemassa:**
```bash
ls -la mcp-server/hanke-server.ts
```

**Tarkista että tsx on asennettu:**
```bash
grep "tsx" package.json
```

**Tarkista git-tila:**
```bash
git log --oneline -5
git status
```

---

## 📞 Seuraavat askeleet

1. ✅ **Päivitä Vercel** (branch + env variable)
2. ✅ **Tee deployment**
3. ✅ **Testaa sovellusta**
4. 🔍 **Lue Runtime Logs**
5. 📊 **Tulkitse logit** (käytä tätä dokumenttia)
6. 💬 **Kerro tulokset** → Voin auttaa jos on ongelmia

---

**Kerro mitä logeissa näkyy, niin jatketaan siitä!** 🚀
