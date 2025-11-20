# Hakemusarviointisovellus

Sovellus hankehaakemusten automaattiseen arviointiin Claude API:n avulla.

## Ominaisuudet

- Käyttäjien kirjautuminen (Supabase Auth)
- Chatbot-käyttöliittymä hankehakemuksen lähettämiseen
- Claude API analysoi hakemuksen perustuen työllisyystilastoihin ja tutkimukseen
- Arvio lähetetään käyttäjän sähköpostiin
- Dashboard aiempien hakemusten tarkasteluun

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

## Kehitys

Käynnistä kehityspalvelin:

```bash
npm run dev
```

Avaa selaimessa [http://localhost:3000](http://localhost:3000)

## Tietokannan setup

Supabase-tietokannan schema luodaan myöhemmin. Tulemme tarvitsemaan taulut:
- `applications` - Hankehakemukset
- `evaluations` - Arvioinnit
- `users` - Käyttäjätiedot (Supabase Auth)

## Rakenne

```
├── app/                   # Next.js App Router
│   ├── api/              # API routes
│   ├── auth/             # Autentikointi sivut
│   ├── dashboard/        # Dashboard
│   └── page.tsx          # Etusivu
├── components/           # React komponentit
├── lib/                  # Apufunktiot ja konfiguraatiot
│   ├── supabase.ts      # Supabase client
│   ├── claude.ts        # Claude API wrapper
│   └── resend.ts        # Resend email wrapper
└── types/               # TypeScript tyyppimäärittelyt
```

## Seuraavat vaiheet

1. Luo Supabase tietokantaskeema
2. Toteuta autentikointi
3. Rakenna chatbot-käyttöliittymä
4. Integrointi Claude API:n kanssa
5. Sähköpostilähetys
6. Dashboard-näkymä

## Lisenssi

MIT
