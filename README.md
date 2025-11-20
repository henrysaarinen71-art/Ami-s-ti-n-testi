# Hakemusarviointisovellus

Sovellus hankehaakemusten automaattiseen arviointiin Claude API:n avulla.

## Ominaisuudet

- Käyttäjien kirjautuminen (Supabase Auth)
- Dashboard yhteenvetotiedoilla
- Hakemusten analysointi Claude AI:lla
- Chatbot-käyttöliittymä
- Hakemushistoria

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (autentikointi + tietokanta)
- **Claude API** (chatbot + analyysi)
- **Tailwind CSS** (tyylittely)
- **Resend** (sähköpostilähetys)

## Asennus

1. Kloonaa repositorio:
```bash
git clone <repository-url>
cd Ami-s-ti-n-testi
```

2. Asenna riippuvuudet:
```bash
npm install
```

3. Konfiguroi ympäristömuuttujat:

Kopioi `.env.local` tiedosto ja täytä arvot:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Resend Email
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=your_verified_email@yourdomain.com
```

### Mistä saat API-avaimet?

#### Supabase
1. Luo projekti osoitteessa [supabase.com](https://supabase.com)
2. Mene projektisi asetuksiin → API
3. Kopioi `Project URL` ja `anon/public` avain

#### Anthropic Claude
1. Rekisteröidy osoitteessa [console.anthropic.com](https://console.anthropic.com)
2. Luo uusi API-avain kohdasta "API Keys"

#### Resend
1. Rekisteröidy osoitteessa [resend.com](https://resend.com)
2. Luo uusi API-avain
3. Vahvista lähettäjän sähköpostiosoite tai domain

## Testikäyttäjän luominen

Luo testikäyttäjä Supabase-konsolissa:

1. Mene osoitteeseen: https://supabase.com/dashboard
2. Valitse projektisi
3. Valitse vasemmalta **Authentication** → **Users**
4. Klikkaa **Add user** → **Create new user**
5. Täytä:
   - Email: `ami1@test.com`
   - Password: `Ami1234!_1`
   - Auto Confirm User: **Kyllä/Yes** (tärkeää!)
6. Klikkaa **Create user**

## Kehitys

Käynnistä kehityspalvelin:

```bash
npm run dev
```

Avaa selaimessa [http://localhost:3000](http://localhost:3000)

Kirjaudu sisään testikäyttäjällä:
- Email: `ami1@test.com`
- Salasana: `Ami1234!_1`

## Sovelluksen rakenne

```
├── app/
│   ├── login/              # Kirjautumissivu
│   ├── dashboard/          # Dashboard ja sisäsivut
│   │   ├── layout.tsx     # Dashboard layout navigaatiolla
│   │   ├── page.tsx       # Dashboard-etusivu tilastoineen
│   │   ├── analysoi/      # Hakemusten analysointi
│   │   └── chatbot/       # Chatbot-käyttöliittymä
│   └── page.tsx           # Etusivu
├── lib/
│   └── supabase/          # Supabase client utilityt
├── components/            # Jaetut komponentit
└── scripts/               # Apuskriptit (esim. testikäyttäjän luonti)
```

## Dashboard-ominaisuudet

Dashboard sisältää:
- **Yläpalkki**: Navigaatio (Dashboard, Analysoi hakemus, Chatbot) ja logout
- **Tilastoboksit**:
  - Haettu summa yhteensä
  - Hakemusten määrä
  - Keskiarvoarvosana
- **Call-to-action**: Linkit hakemusten analysointiin ja chatbotiin

## Työmarkkinadatan käsittely

Sovellus sisältää työkalut työmarkkinadatan (XML) käsittelyyn ja tarjoamiseen API:n kautta.

### XML-tiedostojen tallennus

Tallenna työmarkkinadata XML-tiedostot `data/raw/` hakemistoon. Tiedostot ovat .gitignoressa, joten ne eivät mene versionhallintaan.

### Datan parsiminen

Parsii XML-tiedostot JSON-muotoon:

```bash
npm run parse-data
```

Tämä komento:
1. Lukee kaikki XML-tiedostot `data/raw/` hakemistosta
2. Parsii ne (käsittelee sekä kaupunkikohtaisen datan, koulutusasteet että ammattiryhmät)
3. Korjaa merkistökoodauksen (XML-tiedostot väittävät olevansa iso-8859-15, mutta ovat UTF-8)
4. Poistaa virheelliset HTML-tagit
5. Tallentaa yhtenäisen JSON-tiedoston: `data/tyomarkkinadata.json`

### Parserin rakenne

Python-parseri (`scripts/parse_tyomarkkinadata.py`) tunnistaa automaattisesti seuraavat tiedostotyypit:
- `12r5` - Työnhakijat kaupungeittain (Espoo, Helsinki, Vantaa) kuukausittain
- `12te` - Työttömät työnhakijat koulutusasteittain
- `12ti` - Työttömät työnhakijat ammattiryhmittäin

### API-endpoint

Datan voi hakea autentikoidusti API-endpointin kautta:

```
GET /api/data/tyomarkkinadata
```

Endpointti:
- Vaatii kirjautumisen (Supabase Auth)
- Palauttaa koko JSON-datan
- Vastaa 404:llä jos dataa ei ole parsittu

Esimerkki käytöstä:
```javascript
const response = await fetch('/api/data/tyomarkkinadata');
const { data } = await response.json();
console.log(data.metadata);  // Metadata päivityksestä
console.log(data.tyonhakijat_kaupungeittain);  // Kaupunkidata
console.log(data.koulutusasteet);  // Koulutusastedata
console.log(data.ammattiryhmat);  // Ammattiryhmädata
```

### JSON-rakenne

```json
{
  "metadata": {
    "paivitetty": "2025-11-20",
    "alueet": ["Espoo", "Helsinki", "Vantaa"],
    "aikajakso": "2024M12 - 2025M09",
    "source_files": 2,
    "files": ["001_12r5_2025_...", "008_12te_2025_..."]
  },
  "tyonhakijat_kaupungeittain": {
    "type": "12r5_tyonhakijat",
    "description": "Työnhakijat laskentapäivänä",
    "cities": {
      "Espoo": { ... },
      "Helsinki": { ... },
      "Vantaa": { ... }
    }
  },
  "koulutusasteet": {
    "type": "12te_koulutusaste",
    "description": "Työttömät työnhakijat koulutusasteittain",
    "koulutusasteet": [...]
  },
  "ammattiryhmat": {
    "type": "12ti_ammattiryhmat",
    "description": "Työttömät työnhakijat ja avoimet työpaikat ammattiryhmittäin",
    "ammattiryhmat": [...]
  }
}
```

## Deployment Verceliin

Tämä sovellus on optimoitu ajettavaksi Vercel-alustalla. Seuraa näitä ohjeita deployataksesi sovellus tuotantoon.

### Esivalmistelut

Ennen deployausta varmista, että sinulla on:
- ✅ GitHub-tili ja tämä repositorio GitHubissa
- ✅ Vercel-tili (ilmainen, kirjaudu osoitteessa [vercel.com](https://vercel.com))
- ✅ Supabase-projekti ja sen API-avaimet
- ✅ Anthropic Claude API-avain

### Vaihe 1: Kirjaudu Verceliin

1. Mene osoitteeseen [vercel.com](https://vercel.com)
2. Klikkaa **Sign Up** tai **Log In**
3. Valitse **Continue with GitHub**
4. Valtuuta Vercel pääsemään GitHub-repositorioihisi

### Vaihe 2: Importtaa projekti

1. Vercel-dashboardissa klikkaa **Add New...** → **Project**
2. Etsi ja valitse tämä repositorio (`Ami-s-ti-n-testi`)
3. Klikkaa **Import**

### Vaihe 3: Konfiguroi projekti

Vercel tunnistaa automaattisesti Next.js-projektin. Varmista seuraavat asetukset:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (oletus)
- **Build Command**: `npm run build` (oletus)
- **Output Directory**: `.next` (oletus)

### Vaihe 4: Lisää Environment Variables

**TÄRKEÄÄ**: Lisää seuraavat ympäristömuuttujat ennen deployausta:

Klikkaa **Environment Variables** -osiota ja lisää:

| Muuttuja | Arvo | Kuvaus |
|----------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase-projektisi URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase anon/public avain |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Claude API-avaimesi |

**Mistä löydät arvot?**

#### Supabase
1. Mene osoitteeseen [supabase.com/dashboard](https://supabase.com/dashboard)
2. Valitse projektisi
3. Mene **Settings** → **API**
4. Kopioi:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Anthropic Claude
1. Mene osoitteeseen [console.anthropic.com](https://console.anthropic.com)
2. Valitse **API Keys**
3. Kopioi tai luo uusi API-avain → `ANTHROPIC_API_KEY`

**Huomio**: Varmista, että lisäät muuttujat kaikkiin ympäristöihin (Production, Preview, Development) valitsemalla kaikki kolme vaihtoehtoa.

### Vaihe 5: Deploy

1. Klikkaa **Deploy**
2. Odota 1-3 minuuttia kun Vercel:
   - Asentaa riippuvuudet (`npm install`)
   - Buildaa sovelluksen (`npm run build`)
   - Deployaa tuotantoon
3. Kun näet "Congratulations!" -ilmoituksen, sovelluksesi on valmis!

### Vaihe 6: Testaa sovellus

1. Klikkaa **Visit** tai avaa Vercelin antama URL (esim. `https://your-app.vercel.app`)
2. Kirjaudu testikäyttäjällä:
   - Email: `ami1@test.com`
   - Salasana: `Ami1234!_1`
3. Testaa toiminnot:
   - Dashboard-tilastojen lataaminen
   - Uuden hakemuksen analysointi
   - Hakemuslistan tarkastelu

### Automatisoitu deployment

Jokainen push `main`-branchiin (tai Vercelin konfiguroimaan branchiin) käynnistää automaattisesti uuden deploymentin:

```bash
git add .
git commit -m "Päivitä sovellusta"
git push origin main
```

Vercel:
1. Havaitsee pushin automaattisesti
2. Buildaa ja deployaa uuden version
3. Lähettää ilmoituksen kun valmis

### Custom domain (valinnainen)

Voit lisätä oman domainin Vercel-projektiin:

1. Mene Vercel-dashboardiin → projektisi → **Settings** → **Domains**
2. Klikkaa **Add**
3. Syötä domainisi (esim. `hakemusarviointi.fi`)
4. Seuraa ohjeita DNS-asetusten päivittämiseksi

### Ympäristömuuttujien päivittäminen

Jos tarvitset päivittää API-avaimia tuotannossa:

1. Mene Vercel-dashboardiin → projektisi → **Settings** → **Environment Variables**
2. Etsi muuttuja ja klikkaa **Edit**
3. Päivitä arvo ja tallenna
4. **Redeploy** sovellus, jotta muutokset tulevat voimaan:
   - Mene **Deployments**-välilehdelle
   - Klikkaa viimeisintä deploymenttia → **...** → **Redeploy**

### Vianhaku

#### Build epäonnistuu
- Tarkista että kaikki ympäristömuuttujat on lisätty oikein
- Varmista että koodi buildautuu lokaalisti: `npm run build`
- Tarkista Vercelin build-loki virheviestejä varten

#### API-kutsut epäonnistuvat
- Tarkista että `ANTHROPIC_API_KEY` on asetettu oikein
- Varmista että Supabase-avaimet ovat oikeat
- Tarkista Vercel Functions -logit: Dashboard → **Logs**

#### Supabase Auth ei toimi
- Varmista että Vercelin domain on lisätty Supabase:n sallittuihin URL:eihin:
  1. Mene [supabase.com/dashboard](https://supabase.com/dashboard)
  2. Valitse projektisi → **Authentication** → **URL Configuration**
  3. Lisää Vercel-URL:si kohtaan **Site URL** ja **Redirect URLs**

### Lisätietoja

- [Vercel-dokumentaatio](https://vercel.com/docs)
- [Next.js deployment-ohjeet](https://nextjs.org/docs/deployment)
- [Supabase + Vercel -integraatio](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## Toteutetut ominaisuudet

1. ✅ Projektin perusrakenne (Next.js 14 App Router)
2. ✅ Käyttäjien kirjautuminen (Supabase Auth)
3. ✅ Dashboard reaaliaikaisilla tilastoilla
4. ✅ Hakemusten analysointi Claude API:lla
5. ✅ Hakemuslista ja yksittäisen hakemuksen näkymä
6. ✅ Työmarkkinadatan käsittely (XML → JSON)
7. ✅ API-endpointit (stats, hakemukset, analyze)
8. 🔲 Chatbot-käyttöliittymä
9. 🔲 Sähköpostilähetys

## Lisenssi

MIT
