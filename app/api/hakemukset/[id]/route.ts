import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params (Next.js 15+ requirement)
    const { id } = await params

    // 2. Autentikointi
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

    // 3. Hae hakemus ID:llä
    const { data: hakemus, error } = await supabase
      .from('hakemukset')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Varmista että käyttäjä omistaa hakemuksen
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Hakemusta ei löytynyt' },
          { status: 404 }
        )
      }
      throw new Error('Virhe hakemuksen haussa: ' + error.message)
    }

    // 3. Palauta hakemus
    return NextResponse.json({
      success: true,
      hakemus,
    })
  } catch (error: any) {
    console.error('Virhe hakemuksen haussa:', error)
    return NextResponse.json(
      {
        error: 'Virhe hakemuksen haussa',
        message: error.message || 'Tuntematon virhe',
      },
      { status: 500 }
    )
  }
}
