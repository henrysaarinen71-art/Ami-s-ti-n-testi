import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // 1. Autentikointi
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Kirjautuminen vaaditaan' },
        { status: 401 }
      )
    }

    // 2. Hae request body
    const body = await request.json()
    const { hakemus_teksti, haettava_summa, kuvaus } = body

    if (!hakemus_teksti || !haettava_summa) {
      return NextResponse.json(
        { error: 'Hakemus ja summa ovat pakollisia' },
        { status: 400 }
      )
    }

    // 3. Hae työmarkkinadata
    let tyomarkkinadata
    try {
      const dataResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'http://localhost:3000') || 'http://localhost:3000'}/api/data/tyomarkkinadata`,
        {
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        }
      )

      if (dataResponse.ok) {
        const dataJson = await dataResponse.json()
        tyomarkkinadata = dataJson.data
      } else {
        console.warn('Työmarkkinadatan haku epäonnistui, jatketaan ilman sitä')
        tyomarkkinadata = null
      }
    } catch (error) {
      console.error('Virhe työmarkkinadatan haussa:', error)
      tyomarkkinadata = null
    }

    // 4. Luo prompt Claudelle
    const prompt = `Analysoi seuraava hankehakemus työmarkkinadatan ja Ami-säätiön painopisteiden valossa.

AMI-SÄÄTIÖN PAINOPISTEET:
- Työllisyyden edistäminen
- Ammatillisten taitojen kehittäminen
- Nuorten ja pitkäaikaistyöttömien tukeminen
- Ulkomaalaisten työllistymisen tukeminen
- Vammaisten ja pitkäaikaissairaiden työllistymisen tukeminen

TYÖMARKKINADATA (Espoo, Helsinki, Vantaa):
${tyomarkkinadata ? JSON.stringify(tyomarkkinadata.metadata, null, 2) : 'Ei saatavilla'}

Työttömyystilanne pääkaupunkiseudulla (syyskuu 2025):
${tyomarkkinadata && tyomarkkinadata.tyonhakijat_kaupungeittain?.cities ? `
- Espoo: ${tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Espoo?.['Työnhakijoita laskentapäivänä (lkm.)']?.['2025M09'] || 'N/A'} työnhakijaa
- Helsinki: ${tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Helsinki?.['Työnhakijoita laskentapäivänä (lkm.)']?.['2025M09'] || 'N/A'} työnhakijaa
- Vantaa: ${tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Vantaa?.['Työnhakijoita laskentapäivänä (lkm.)']?.['2025M09'] || 'N/A'} työnhakijaa
` : 'Ei saatavilla'}

HAKEMUS:
Haettava summa: ${haettava_summa} €
${kuvaus ? `Kuvaus: ${kuvaus}\n` : ''}
Hakemusteksti:
${hakemus_teksti}

TEHTÄVÄ:
Analysoi hakemus ja anna arvio JSON-muodossa seuraavasti:

{
  "arvosana": <numero 1-10>,
  "vahvuudet": [
    "<3-5 konkreettista vahvuutta>"
  ],
  "heikkoudet": [
    "<3-5 konkreettista heikkoutta tai kehityskohtaa>"
  ],
  "suositus": "<Myönnettävä|Harkittava|Hylättävä>",
  "toimikunnan_huomiot": {
    "keskeiset_kysymykset": [
      "<3-5 keskeistä kysymystä joihin toimikunnan tulee kiinnittää huomiota>"
    ],
    "kriittiset_kysymykset": [
      {
        "kysymys": "<Kriittinen kysymys, esim. 'Onko aikataulu realistinen?'>",
        "perustelu": "<Konkreettinen perustelu, esim. '12 kk on lyhyt aika 500 hengen haastatteluun ja analyysiin'>",
        "vakavuus": "<vakava|harkittava>"
      }
    ]
  }
}

KRIITTISET KYSYMYKSET (vastaa kaikkiin):
1. Onko vastaava hanke jo toteutettu? (vertaa aikaisempiin hankkeisiin jos mahdollista)
2. Onko hakemus teknisesti heikkolaatuinen? (puutteet, epäselvyydet)
3. Onko aikataulu realistinen?
4. Soveltuuko Ami-säätiön painopisteisiin? (työllisyys, ammatilliset taidot)
5. Onko budjetti realistinen suhteessa tavoitteisiin?
6. Onko vaikuttavuus mitattavissa?

TÄRKEÄÄ:
- Jokaiseen kriittiseen kysymykseen PAKKO olla konkreettinen perustelu
- Käytä työmarkkinadataa arvioinnissa kun mahdollista
- Ole rehellinen ja kriittinen mutta rakentava
- Suositus perustuu kokonaisarvioon, ei vain arvosanaan

Vastaa VAIN JSON-muodossa, ei muuta tekstiä.`

    // 5. Lähetä Claudelle
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // 6. Parsii Claude-vastaus
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Etsi JSON-osuus vastauksesta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Claude ei palauttanut validia JSON-vastausta')
    }

    const arviointi = JSON.parse(jsonMatch[0])

    // Lisää haettava summa arviointiin
    arviointi.haettava_summa = haettava_summa

    // 7. Tallenna Supabaseen
    const { data: savedData, error: saveError } = await supabase
      .from('hakemukset')
      .insert({
        hakemus_teksti,
        haettava_summa,
        user_id: user.id,
        user_email: user.email,
        arviointi: arviointi,
        status: 'arvioitu',
        kuvaus: kuvaus || null,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Virhe tallennuksessa:', saveError)
      throw new Error('Tallennus epäonnistui: ' + saveError.message)
    }

    // 8. Palauta arviointi
    return NextResponse.json({
      success: true,
      arviointi,
      hakemus_id: savedData.id,
    })
  } catch (error: any) {
    console.error('Virhe analysoinnissa:', error)
    return NextResponse.json(
      {
        error: 'Virhe analysoinnissa',
        message: error.message || 'Tuntematon virhe',
      },
      { status: 500 }
    )
  }
}
