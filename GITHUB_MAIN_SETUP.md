# GitHub Main Branch Setup

Päivitetty: 2025-11-21

---

## 📋 Tilanne

Kaikki MCP-muutokset, debug-logit ja anti-hallusinaatio-suojaukset ovat branchissa:
- **`claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk`**

Tämä branch sisältää:
- ✅ MCP-integraatio ja feature flag
- ✅ Debug-logitus
- ✅ Anti-hallusinaatio-suojaukset
- ✅ Vercel deployment-ohjeet
- ✅ Kaikki dokumentaatio

---

## 🎯 Tavoite

Asettaa `claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk` pääbranchiksi (main) GitHubissa.

---

## 📝 Vaihtoehdot

### Vaihtoehto 1: Aseta nykyinen branch default branchiksi (SUOSITELTU)

Tämä on helpoin ja nopein tapa. GitHubissa voit asettaa minkä tahansa branchin oletusbranchiksi.

**Vaiheet:**

1. **Avaa GitHub-repositorio:**
   - Mene: https://github.com/henrysaarinen71-art/Ami-s-ti-n-testi

2. **Mene Settings:**
   - Klikkaa ylhäältä: **Settings**

3. **Vaihda Default Branch:**
   - Vasemmalta: **General** (pitäisi olla jo valittuna)
   - Etsi kohta: **Default branch**
   - Nykyinen: `claude/build-review-chatbot-app-01SYuumEKiK8JZbU8DXe9NJg` (vanha)
   - Klikkaa: **Switch to another branch** (kynä-ikoni)
   - Valitse: **`claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk`**
   - Vahvista: **I understand, update the default branch**

4. **Päivitä Vercel:**
   - Vercel käyttää nyt automaattisesti tätä branchia kun se on default
   - TAI päivitä Vercel manuaalisesti (katso `VERCEL_PAIVITYS.md`)

**Hyödyt:**
- ✅ Nopea (1 minuutti)
- ✅ Ei vaadi git-komentoja
- ✅ Vercel tunnistaa automaattisesti

**Haitat:**
- ⚠️ Branch-nimi on pitkä (claude/continue-work-...)
- ⚠️ Ei perinteinen "main" nimi

---

### Vaihtoehto 2: Luo main-branch GitHubissa

Jos haluat perinteisen "main"-nimisen branchin:

**Vaiheet:**

1. **Avaa GitHub-repositorio:**
   - Mene: https://github.com/henrysaarinen71-art/Ami-s-ti-n-testi

2. **Luo uusi branch GitHubissa:**
   - Klikkaa branch-dropdownia (ylhäällä vasemmalla)
   - Kirjoita: `main`
   - Klikkaa: **Create branch: main from 'claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk'**

3. **Aseta main default branchiksi:**
   - Settings → General → Default branch
   - Vaihda: `main`
   - Vahvista

4. **Poista vanhat branchit (valinnainen):**
   - Voit poistaa vanhat claude-branchit kun main on käytössä

**Hyödyt:**
- ✅ Perinteinen "main" nimi
- ✅ Selkeämpi rakenne

**Haitat:**
- ⏱️ Vie enemmän aikaa
- 🔧 Vaatii branchin luomisen GitHubissa

---

### Vaihtoehto 3: Luo Pull Request ja merge

Jos haluat säilyttää merge-historian:

**Vaiheet:**

1. **Luo Pull Request GitHubissa:**
   - Mene: https://github.com/henrysaarinen71-art/Ami-s-ti-n-testi/pulls
   - Klikkaa: **New pull request**
   - Base: `claude/build-review-chatbot-app-01SYuumEKiK8JZbU8DXe9NJg` (tai luo main)
   - Compare: `claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk`
   - Klikkaa: **Create pull request**

2. **Kirjoita PR-kuvaus:**
   ```markdown
   ## MCP Integration and Debug Features

   This PR includes:
   - MCP integration with feature flag (ENABLE_MCP)
   - Comprehensive debug logging
   - Anti-hallucination safeguards for Claude prompt
   - Vercel deployment documentation
   - Testing guides

   Commits: 6f77b0a...6c9fe34
   ```

3. **Merge PR:**
   - Tarkista muutokset
   - Klikkaa: **Merge pull request**
   - Vahvista: **Confirm merge**

**Hyödyt:**
- ✅ Säilyttää merge-historian
- ✅ Hyvä dokumentaatio
- ✅ Code review mahdollisuus

**Haitat:**
- ⏱️ Vie eniten aikaa
- 📝 Vaatii PR:n kirjoittamisen

---

## 🚀 Suositus: Vaihtoehto 1

**Tee tämä nyt:**

1. Mene: https://github.com/henrysaarinen71-art/Ami-s-ti-n-testi/settings
2. Vaihda Default branch: `claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk`
3. Päivitä Vercel käyttämään samaa branchia

**Myöhemmin (jos haluat):**
- Voit luoda main-branchin ja poistaa vanhat claude-branchit

---

## ✅ Varmistus: Mitä branchissa on?

Tarkista että kaikki on mukana:

```bash
# Tarkista viimeisimmät commitit
git log --oneline -10

# Pitäisi näkyä:
# 6f77b0a - Session 2 summary
# b136eb4 - TODO: Historical AMI projects
# 49cbc44 - Anti-hallucination safeguards
# 10daa1b - Debug logging
# 6c9fe34 - Vercel deployment guide
# 1f53dc6 - MCP testing setup
# d7292d1 - Merge PR #2
# ...
```

**Tarkista tiedostot:**
```bash
# MCP-koodi
ls -la app/api/analyze/route.ts
ls -la mcp-server/hanke-server.ts

# Dokumentaatio
ls -la VERCEL_PAIVITYS.md
ls -la DEBUG_OHJEET.md
ls -la TESTAA_MCP.md
```

---

## 📊 Kun olet vaihtanut default branchin

**Seuraavat askeleet:**

1. ✅ **Päivitä Vercel:**
   - Jos Vercel käyttää "default branchia" → Automaattinen
   - Jos Vercel käyttää tiettyä branchia → Päivitä manuaalisesti

2. ✅ **Testaa deployment:**
   - Tee uusi deployment Vercelissä
   - Tarkista Runtime Logs
   - Varmista että MCP aktivoituu

3. ✅ **Poista vanhat branchit (valinnainen):**
   - Kun main on käytössä ja toimii
   - Voit poistaa claude/...-branchit

---

## 🔍 Ongelmanratkaisu

### "I don't have permission to change default branch"

**Ratkaisu:**
- Tarvitset admin-oikeudet repositorioon
- Pyydä repositorion omistajaa tekemään muutos
- TAI pyydä admin-oikeuksia itsellesi

### "Branch not found"

**Ratkaisu:**
- Varmista että branch on pushattu GitHubiin:
  ```bash
  git branch -a | grep claude/continue-work
  ```
- Jos ei näy `remotes/origin/claude/continue-work...`:
  ```bash
  git push -u origin claude/continue-work-01AzW6TNkiV8QGbSwaQWYHbk
  ```

---

**Kun olet asettanut default branchin, kerro niin jatketaan Vercelin päivittämistä!** 🚀
