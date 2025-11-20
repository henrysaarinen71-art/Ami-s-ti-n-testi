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

    // 2. Hae limit parametri URL:sta
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : undefined

    // 3. Hae hakemukset
    let query = supabase
      .from('hakemukset')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: hakemukset, error } = await query

    if (error) {
      throw new Error('Virhe hakemusten haussa: ' + error.message)
    }

    // 4. Palauta hakemukset
    return NextResponse.json({
      success: true,
      hakemukset: hakemukset || [],
      count: hakemukset?.length || 0,
    })
  } catch (error: any) {
    console.error('Virhe hakemusten haussa:', error)
    return NextResponse.json(
      {
        error: 'Virhe hakemusten haussa',
        message: error.message || 'Tuntematon virhe',
      },
      { status: 500 }
    )
  }
}
