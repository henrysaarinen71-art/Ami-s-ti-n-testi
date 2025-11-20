import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // 2. Hae kaikki käyttäjän hakemukset
    const { data: hakemukset, error } = await supabase
      .from('hakemukset')
      .select('haettava_summa, arviointi')
      .eq('user_id', user.id)

    if (error) {
      throw new Error('Virhe hakemusten haussa: ' + error.message)
    }

    // 3. Laske tilastot
    const count = hakemukset?.length || 0

    let total_summa = 0
    let total_arvosana = 0
    let arvosana_count = 0

    if (hakemukset && hakemukset.length > 0) {
      hakemukset.forEach((hakemus) => {
        // Summat
        if (hakemus.haettava_summa) {
          total_summa += hakemus.haettava_summa
        }

        // Arvosanat
        if (hakemus.arviointi?.arvosana) {
          total_arvosana += hakemus.arviointi.arvosana
          arvosana_count++
        }
      })
    }

    const avg_arvosana = arvosana_count > 0 ? total_arvosana / arvosana_count : 0

    // 4. Palauta tilastot
    return NextResponse.json({
      success: true,
      stats: {
        count,
        total_summa,
        avg_arvosana: Math.round(avg_arvosana * 10) / 10, // Yhden desimaalin tarkkuus
      },
    })
  } catch (error: any) {
    console.error('Virhe tilastojen haussa:', error)
    return NextResponse.json(
      {
        error: 'Virhe tilastojen haussa',
        message: error.message || 'Tuntematon virhe',
      },
      { status: 500 }
    )
  }
}
