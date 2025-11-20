import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface MetaAnalysis {
  hakijaprofiili: {
    [key: string]: number
  }
  viestinnan_selkeys: {
    arvosana: number
    selitys: string
  }
  suositukset: string[]
}

export async function GET(request: NextRequest) {
  let currentStep = 'initialization'

  try {
    // 1. Autentikointi
    currentStep = 'authentication'
    console.log('[META_ANALYSIS] Step: Authentication')

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[META_ANALYSIS] Authentication failed: No user')
      return NextResponse.json(
        { error: 'Unauthorized - Kirjautuminen vaaditaan' },
        { status: 401 }
      )
    }

    console.log('[META_ANALYSIS] Authenticated user:', user.email)

    // 2. Hae kaikki hakemukset
    currentStep = 'fetching_applications'
    console.log('[META_ANALYSIS] Step: Fetching all applications')

    const { data: hakemukset, error: fetchError } = await supabase
      .from('hakemukset')
      .select('hakemus_teksti, haettava_summa, arviointi, kuvaus')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[META_ANALYSIS] Fetch error:', fetchError)
      throw new Error('Hakemusten haku epäonnistui: ' + fetchError.message)
    }

    console.log('[META_ANALYSIS] Found applications:', hakemukset?.length || 0)

    // Tarkista että on vähintään 3 hakemusta
    if (!hakemukset || hakemukset.length < 3) {
      return NextResponse.json(
        {
          error: 'Liian vähän hakemuksia',
          message: 'Meta-analyysi vaatii vähintään 3 hakemusta',
          count: hakemukset?.length || 0,
        },
        { status: 400 }
      )
    }

    // 3. Muodosta yhteenveto hakemuksista Claudelle
    currentStep = 'preparing_summary'
    console.log('[META_ANALYSIS] Step: Preparing summary for Claude')

    const hakemusYhteenveto = hakemukset
      .map((h, idx) => {
        return `
HAKEMUS ${idx + 1}:
Haettava summa: ${h.haettava_summa} €
${h.kuvaus ? `Kuvaus: ${h.kuvaus}\n` : ''}Hakemusteksti:
${h.hakemus_teksti.substring(0, 1000)}${h.hakemus_teksti.length > 1000 ? '...' : ''}
Arvosana: ${h.arviointi?.arvosana || 'N/A'}/10
---`
      })
      .join('\n\n')

    // 4. Luo meta-analyysi prompt
    currentStep = 'calling_claude_api'
    console.log('[META_ANALYSIS] Step: Calling Claude API for meta-analysis')

    const prompt = `Analysoi seuraavat ${hakemukset.length} Ami-säätiöön tullutta hakemusta META-TASOLLA.

AMI-SÄÄTIÖN TOIMINTAKENTTÄ:
- Fokus: Työllisyyden edistäminen, ammatillisten taitojen kehittäminen
- Kohdealueet: Nuoret, pitkäaikaistyöttömät, ulkomaalaiset, vammaiset/pitkäaikaissairaat
- Maantieteellinen alue: Pääkaupunkiseutu (Espoo, Helsinki, Vantaa)

HAKEMUKSET:
${hakemusYhteenveto}

TEHTÄVÄ - Analysoi meta-tasolla:

1. HAKIJAPROFIILI - Luokittele hakijat hakemustekstin perusteella:
   - Yritykset (yksityinen sektori, startup, IT-yritys jne.)
   - Säätiöt (voittoa tavoittelemattomat säätiöt)
   - Yhdistykset (rekisteröidyt yhdistykset, järjestöt)
   - Yksilöt (yksityishenkilöt)
   - Oppilaitokset (koulut, AMK, yliopistot)
   - Kunnat/Julkinen sektori
   - Muut

2. VIESTINNÄN SELKEYS - Arvioi 1-10:
   Kuinka hyvin hakijat ovat ymmärtäneet Ami-säätiön:
   - Painopistealueet (työllisyys, ammatilliset taidot)?
   - Kohderyhmät (nuoret, pitkäaikaistyöttömät, ulkomaalaiset, vammaiset)?
   - Maantieteellisen fokuksen (pääkaupunkiseutu)?

   Jos monet hakijat eivät ymmärrä toimintakenttää → matala arvosana
   Jos hakijat kohdentavat hyvin → korkea arvosana

3. SUOSITUKSET VIESTINTÄÄN:
   Anna 3-5 KONKREETTISTA suositusta miten Ami-säätiön verkkosivuja/viestintää voisi parantaa,
   jotta oikeat hakijat löytäisivät ja väärät ymmärtäisivät ettei heidän hankkeensa sovi.

   Ole rakentava ja ehdota konkreettisia toimenpiteitä.

Vastaa VAIN JSON-muodossa:
{
  "hakijaprofiili": {
    "Yritykset": <määrä>,
    "Säätiöt": <määrä>,
    "Yhdistykset": <määrä>,
    "Yksilöt": <määrä>,
    "Oppilaitokset": <määrä>,
    "Kunnat/Julkinen sektori": <määrä>,
    "Muut": <määrä>
  },
  "viestinnan_selkeys": {
    "arvosana": <1-10>,
    "selitys": "<2-3 lauseen selitys>"
  },
  "suositukset": [
    "<Suositus 1>",
    "<Suositus 2>",
    "<Suositus 3>",
    "<Suositus 4>",
    "<Suositus 5>"
  ]
}

Älä lisää mitään muuta tekstiä. Pelkkä JSON.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    console.log('[META_ANALYSIS] Claude API response received')

    // 5. Parsii vastaus
    currentStep = 'parsing_response'
    console.log('[META_ANALYSIS] Step: Parsing Claude response')

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('[META_ANALYSIS] Response length:', responseText.length)

    // Etsi JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[META_ANALYSIS] No JSON found in response')
      console.error('[META_ANALYSIS] Full response:', responseText)
      throw new Error('Claude ei palauttanut validia JSON-vastausta')
    }

    let metaAnalysis: MetaAnalysis
    try {
      metaAnalysis = JSON.parse(jsonMatch[0])
      console.log('[META_ANALYSIS] JSON parsed successfully')
      console.log('[META_ANALYSIS] Categories found:', Object.keys(metaAnalysis.hakijaprofiili || {}))
    } catch (parseError: any) {
      console.error('[META_ANALYSIS] JSON parse error:', parseError.message)
      console.error('[META_ANALYSIS] JSON string:', jsonMatch[0])
      throw new Error('Virheellinen JSON-muoto: ' + parseError.message)
    }

    // 6. Palauta meta-analyysi
    return NextResponse.json({
      success: true,
      meta_analysis: metaAnalysis,
      analyzed_count: hakemukset.length,
    })
  } catch (error: any) {
    console.error('=== META_ANALYSIS ERROR ===')
    console.error('Current step:', currentStep)
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('===========================')

    // Palauta tarkempi virheviesti
    let userMessage = 'Virhe meta-analyysissä'

    if (currentStep === 'authentication') {
      userMessage = 'Autentikointi epäonnistui'
    } else if (currentStep === 'fetching_applications') {
      userMessage = 'Hakemusten haku epäonnistui'
    } else if (currentStep === 'calling_claude_api') {
      userMessage = 'Claude AI -kutsu epäonnistui'
    } else if (currentStep === 'parsing_response') {
      userMessage = 'Vastauksen parsiminen epäonnistui'
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
