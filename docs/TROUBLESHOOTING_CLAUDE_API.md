# Claude API Troubleshooting Guide

Tämä dokumentti kuvaa Claude API -virheiden ratkaisemisen.

---

## 🔴 ONGELMA: "404 model not found error"

### Virhe Vercel logeissa:
```
Error: 404 {"type":"error","error":{"type":"not_found_error","message":"model: claude-3-5-sonnet-20241022"}}
```

### SYY:
API-avain ei tue pyydettyä Claude-mallia.

### RATKAISU:

#### 1. Testaa API-avain paikallisesti

```bash
# Testaa eri malleja suoraan curl:lla
API_KEY="sk-ant-api03-WeCkPQ..." # Korvaa omalla avaimella

# Testaa Claude 3.5 Sonnet (uusin)
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Test"}]
  }'

# Testaa Claude 3.5 Sonnet (vanhempi)
# ... käytä mallia "claude-3-5-sonnet-20240620"

# Testaa Claude 3 Haiku (halvin, useimmiten saatavilla)
# ... käytä mallia "claude-3-haiku-20240307"
```

#### 2. Tunnista käytettävissä oleva malli

**Onnistunut vastaus:**
```json
{
  "model": "claude-3-haiku-20240307",
  "content": [{"type": "text", "text": "..."}]
}
```

**Epäonnistunut vastaus (malli ei tuettu):**
```json
{
  "type": "error",
  "error": {
    "type": "not_found_error",
    "message": "model: claude-3-5-sonnet-20241022"
  }
}
```

#### 3. Päivitä kaikki endpointit käyttämään toimivaa mallia

Muokkaa seuraavia tiedostoja:

**`app/api/meta-analysis/route.ts` (noin rivi 210):**
```typescript
const message = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307', // ← Vaihda tähän toimiva malli
  max_tokens: 2048,
  ...
})
```

**`app/api/analyze/route.ts` (noin rivi 663):**
```typescript
const message = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307', // ← Vaihda tähän toimiva malli
  max_tokens: 4096,
  ...
})
```

**`app/api/reports/hallitus/route.ts` (noin rivi 343):**
```typescript
const message = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307', // ← Vaihda tähän toimiva malli
  max_tokens: 8192,
  ...
})
```

#### 4. Commit ja push

```bash
git add app/api/meta-analysis/route.ts app/api/analyze/route.ts app/api/reports/hallitus/route.ts
git commit -m "fix: Update Claude model to supported version"
git push origin main
```

---

## 🔴 ONGELMA: "401 authentication error"

### Virhe:
```
Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}
```

### SYY:
`ANTHROPIC_API_KEY` puuttuu tai on virheellinen Vercel environment variablesissa.

### RATKAISU:

#### 1. Tarkista Vercel Environment Variables

1. Avaa: https://vercel.com/dashboard
2. Valitse projekti: "Ami-s-ti-n-testi"
3. Settings → Environment Variables
4. Tarkista että `ANTHROPIC_API_KEY` on asetettu

#### 2. Lisää/päivitä API-avain

```
Key: ANTHROPIC_API_KEY
Value: sk-ant-api03-YOUR_API_KEY_HERE
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 3. Redeploy Vercel

- Deployments → Viimeisin → ... → **Redeploy**
- Odota 2-5 min

---

## 📋 CLAUDE MALLIT JA NIIDEN KÄYTTÖ

### Mallivertailu:

| Malli | Malli-ID | Laatu | Nopeus | Hinta | Yleinen saatavuus |
|-------|----------|-------|--------|-------|-------------------|
| **Claude 3.5 Sonnet** (uusin) | `claude-3-5-sonnet-20241022` | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | 💰💰 | ❌ Rajoitettu |
| **Claude 3.5 Sonnet** (kesä) | `claude-3-5-sonnet-20240620` | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | 💰💰 | ⚠️ Osittain |
| **Claude 3 Opus** | `claude-3-opus-20240229` | ⭐⭐⭐⭐⭐ | ⚡⚡ | 💰💰💰 | ⚠️ Osittain |
| **Claude 3 Sonnet** | `claude-3-sonnet-20240229` | ⭐⭐⭐⭐ | ⚡⚡⚡ | 💰💰 | ⚠️ Osittain |
| **Claude 3 Haiku** | `claude-3-haiku-20240307` | ⭐⭐⭐ | ⚡⚡⚡⚡⚡ | 💰 | ✅ Laajasti |

### Suositus käyttöön:

#### 1. Jos API-avain tukee: **Claude 3.5 Sonnet** (lokakuu 2024)
```typescript
model: 'claude-3-5-sonnet-20241022'
```
- Paras laatu
- Nopea
- Kohtuullinen hinta

#### 2. Jos ei toimi, kokeile: **Claude 3.5 Sonnet** (kesä 2024)
```typescript
model: 'claude-3-5-sonnet-20240620'
```
- Lähes yhtä hyvä laatu
- Laajempi saatavuus

#### 3. Jos ei toimi, käytä: **Claude 3 Haiku**
```typescript
model: 'claude-3-haiku-20240307'
```
- Hyvä laatu
- Nopein malli
- Halvin
- Toimii lähes kaikilla API-avaimilla

---

## 🧪 TESTAUSSKRIPTI

Käytä tätä skriptiä testaamaan mitä malleja API-avaimesi tukee:

```bash
#!/bin/bash
# test_claude_models.sh

API_KEY="your-api-key-here"

MODELS=(
  "claude-3-5-sonnet-20241022"
  "claude-3-5-sonnet-20240620"
  "claude-3-opus-20240229"
  "claude-3-sonnet-20240229"
  "claude-3-haiku-20240307"
)

echo "🧪 Testing Claude API models..."
echo "================================"

for MODEL in "${MODELS[@]}"; do
  echo -n "Testing $MODEL... "

  RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "{\"model\": \"$MODEL\", \"max_tokens\": 10, \"messages\": [{\"role\": \"user\", \"content\": \"Hi\"}]}")

  if echo "$RESPONSE" | grep -q '"type":"error"'; then
    echo "❌ FAILED"
  else
    echo "✅ SUCCESS"
  fi
done

echo "================================"
```

**Käyttö:**
```bash
chmod +x test_claude_models.sh
./test_claude_models.sh
```

---

## 📝 HISTORY: TÄMÄN PROJEKTIN RATKAISUT

### 2025-11-22: Claude API Model Troubleshooting

**Ongelma:**
- Meta-analyysi endpoint failasi: `404 model not found`
- Kokeiltu mallit: claude-3-5-sonnet-20241022, claude-3-5-sonnet-20240620, jne.

**Testaus:**
```bash
# Testattu kaikki mallit curl:lla
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: sk-ant-api03-WeCkPQ..." \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-haiku-20240307", "max_tokens": 100, ...}'
```

**Tulokset:**
- ❌ claude-3-5-sonnet-20241022: 404 not_found_error
- ❌ claude-3-5-sonnet-20240620: 404 not_found_error
- ❌ claude-3-opus-20240229: 404 not_found_error
- ❌ claude-3-sonnet-20240229: 404 not_found_error
- ✅ **claude-3-haiku-20240307: SUCCESS**

**Ratkaisu:**
Päivitetty kaikki kolme endpointtia käyttämään `claude-3-haiku-20240307`:
- `/api/meta-analysis`
- `/api/analyze`
- `/api/reports/hallitus`

**Commit:** `8a65576` - "fix: Use claude-3-haiku-20240307"

**Tulos:** ✅ Meta-analyysi toimii Vercelissä

---

## 🔧 VERCEL ENVIRONMENT VARIABLES CHECKLIST

Varmista että nämä on asetettu Vercelissä:

### Pakolliset:

- [x] `ANTHROPIC_API_KEY` - Claude API avain
- [x] `NEXT_PUBLIC_SUPABASE_URL` - Supabase projektin URL
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [x] `ENABLE_MCP` - Feature flag (aseta `true` jos käytössä)

### Valinnaiset:

- [ ] `RESEND_API_KEY` - Sähköposti-ilmoitukset
- [ ] `RESEND_FROM_EMAIL` - Lähettäjän email

### Tarkistus:

1. Vercel Dashboard → Projekti → Settings → Environment Variables
2. Varmista että kaikki pakolliset on asetettu
3. Varmista että ne on asetettu **kaikille ympäristöille**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Jos teit muutoksia → **Redeploy**

---

## 💡 PIKA-APUA

### Virhe: "Claude AI -kutsu epäonnistui"
→ Tarkista ANTHROPIC_API_KEY Vercelissä

### Virhe: "404 model not found"
→ Vaihda malli `claude-3-haiku-20240307`:ksi

### Virhe: "401 authentication error"
→ Lisää/päivitä ANTHROPIC_API_KEY Vercelissä

### Meta-analyysi ei toimi
→ Tarkista että vähintään 3 hakemusta tietokannassa

### Supabase connection error
→ Tarkista NEXT_PUBLIC_SUPABASE_URL ja NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## 📞 YHTEENVETO

**Onnistunut Claude API -kutsu vaatii:**

1. ✅ Validi `ANTHROPIC_API_KEY` Vercelissä
2. ✅ Malli jota API-avain tukee (testaa ensin!)
3. ✅ Oikea malli-ID kaikissa endpointeissa
4. ✅ Environment variablet kaikissa ympäristöissä (Prod/Preview/Dev)
5. ✅ Redeploy Vercelin jälkeen muutoksia

**Testaus ennen deploymenttia:**

```bash
# 1. Testaa API-avain
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-haiku-20240307", "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}'

# 2. Päivitä kaikki endpointit
# 3. Commit ja push
# 4. Varmista Vercel env vars
# 5. Deploy ja testaa
```

---

**Dokumentin versio:** 1.0
**Viimeisin päivitys:** 2025-11-22
**Tekijä:** Claude Code troubleshooting session
