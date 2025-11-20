import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  let currentStep = 'initialization'
  let requestBody: any = null

  try {
    // 1. Autentikointi
    currentStep = 'authentication'
    console.log('[ANALYZE] Step: Authentication')

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[ANALYZE] Authentication failed: No user')
      return NextResponse.json(
        { error: 'Unauthorized - Kirjautuminen vaaditaan' },
        { status: 401 }
      )
    }

    console.log('[ANALYZE] Authenticated user:', user.email)

    // 2. Hae request body
    currentStep = 'parsing_request'
    console.log('[ANALYZE] Step: Parsing request body')

    requestBody = await request.json()
    const { hakemus_teksti, haettava_summa, kuvaus } = requestBody

    console.log('[ANALYZE] Request data:', {
      hakemus_length: hakemus_teksti?.length,
      haettava_summa,
      kuvaus_length: kuvaus?.length
    })

    if (!hakemus_teksti || !haettava_summa) {
      console.error('[ANALYZE] Validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Hakemus ja summa ovat pakollisia' },
        { status: 400 }
      )
    }

    // 3. Hae työmarkkinadata
    currentStep = 'fetching_labor_data'
    console.log('[ANALYZE] Step: Fetching labor market data')

    let tyomarkkinadata
    try {
      // Käytä suhteellista URL:ia Vercelin sisäisiin kutsuihin
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

      const dataUrl = `${baseUrl}/api/data/tyomarkkinadata`
      console.log('[ANALYZE] Fetching from:', dataUrl)

      const dataResponse = await fetch(dataUrl, {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      })

      console.log('[ANALYZE] Labor data response status:', dataResponse.status)

      if (dataResponse.ok) {
        const dataJson = await dataResponse.json()
        tyomarkkinadata = dataJson.data
        console.log('[ANALYZE] Labor data fetched successfully')
      } else {
        const errorText = await dataResponse.text()
        console.warn('[ANALYZE] Labor data fetch failed:', dataResponse.status, errorText)
        tyomarkkinadata = null
      }
    } catch (error: any) {
      console.error('[ANALYZE] Error fetching labor data:', error.message)
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
    currentStep = 'calling_claude_api'
    console.log('[ANALYZE] Step: Calling Claude API')
    console.log('[ANALYZE] Prompt length:', prompt.length)

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

    console.log('[ANALYZE] Claude API response received')
    console.log('[ANALYZE] Response type:', message.content[0].type)

    // 6. Parsii Claude-vastaus
    currentStep = 'parsing_claude_response'
    console.log('[ANALYZE] Step: Parsing Claude response')

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('[ANALYZE] Response text length:', responseText.length)
    console.log('[ANALYZE] Response preview:', responseText.substring(0, 200))

    // Etsi JSON-osuus vastauksesta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[ANALYZE] No JSON found in Claude response')
      console.error('[ANALYZE] Full response:', responseText)
      throw new Error('Claude ei palauttanut validia JSON-vastausta')
    }

    let arviointi
    try {
      arviointi = JSON.parse(jsonMatch[0])
      console.log('[ANALYZE] JSON parsed successfully')
      console.log('[ANALYZE] Evaluation keys:', Object.keys(arviointi))
    } catch (parseError: any) {
      console.error('[ANALYZE] JSON parse error:', parseError.message)
      console.error('[ANALYZE] JSON string:', jsonMatch[0])
      throw new Error('Virheellinen JSON-muoto Claude-vastauksessa: ' + parseError.message)
    }

    // Lisää haettava summa arviointiin
    arviointi.haettava_summa = haettava_summa

    // 7. Tallenna Supabaseen
    currentStep = 'saving_to_supabase'
    console.log('[ANALYZE] Step: Saving to Supabase')

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
      console.error('[ANALYZE] Supabase save error:', saveError)
      console.error('[ANALYZE] Save error code:', saveError.code)
      console.error('[ANALYZE] Save error details:', saveError.details)
      throw new Error('Tallennus epäonnistui: ' + saveError.message)
    }

    console.log('[ANALYZE] Saved successfully with ID:', savedData.id)

    // 8. Palauta arviointi
    return NextResponse.json({
      success: true,
      arviointi,
      hakemus_id: savedData.id,
    })
  } catch (error: any) {
    console.error('=== ANALYZE ERROR ===')
    console.error('Current step:', currentStep)
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Request body:', requestBody)
    console.error('=====================')

    // Palauta tarkempi virheviesti käyttäjälle
    let userMessage = 'Virhe analysoinnissa'

    if (currentStep === 'authentication') {
      userMessage = 'Autentikointi epäonnistui. Yritä kirjautua uudelleen.'
    } else if (currentStep === 'parsing_request') {
      userMessage = 'Virheellinen pyyntö. Tarkista että hakemus ja summa on täytetty.'
    } else if (currentStep === 'fetching_labor_data') {
      userMessage = 'Työmarkkinadatan haku epäonnistui, mutta analyysi jatkuu.'
    } else if (currentStep === 'calling_claude_api') {
      userMessage = 'Claude AI -kutsu epäonnistui. Tarkista API-avain ja yritä uudelleen.'
    } else if (currentStep === 'parsing_claude_response') {
      userMessage = 'Claude AI -vastauksen parsiminen epäonnistui. Yritä uudelleen.'
    } else if (currentStep === 'saving_to_supabase') {
      userMessage = 'Tietokannan tallennus epäonnistui. Tarkista tietokantayhteys.'
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: error.message || 'Tuntematon virhe',
        step: currentStep,
      },
      { status: 500 }
    )
  }
}
