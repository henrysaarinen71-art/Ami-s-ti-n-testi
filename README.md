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

## Seuraavat vaiheet

1. ✅ Projektin perusrakenne
2. ✅ Kirjautuminen ja dashboard
3. 🔲 Hakemusten analysointi Claude API:lla
4. 🔲 Chatbot-käyttöliittymä
5. 🔲 Tietokantaskeema ja tietojen tallennus
6. 🔲 Sähköpostilähetys

## Lisenssi

MIT
