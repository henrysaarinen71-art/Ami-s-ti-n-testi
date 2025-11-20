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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[DELETE] Starting delete request')
  try {
    // 1. Await params (Next.js 15+ requirement)
    const { id } = await params
    console.log('[DELETE] Application ID:', id)

    // 2. Autentikointi
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('[DELETE] User authenticated:', user?.email)

    if (!user) {
      console.error('[DELETE] No user found - unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized - Kirjautuminen vaaditaan' },
        { status: 401 }
      )
    }

    // 3. Varmista että hakemus on olemassa ja käyttäjä omistaa sen
    console.log('[DELETE] Checking if application exists and user owns it')
    const { data: existing, error: existError } = await supabase
      .from('hakemukset')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    console.log('[DELETE] Existing application:', existing)
    console.log('[DELETE] Exist check error:', existError)

    if (!existing) {
      console.error('[DELETE] Application not found or user does not own it')
      return NextResponse.json(
        { error: 'Hakemusta ei löytynyt tai sinulla ei ole oikeutta poistaa sitä' },
        { status: 404 }
      )
    }

    // 4. Poista hakemus
    console.log('[DELETE] Attempting to delete application')
    const { error: deleteError } = await supabase
      .from('hakemukset')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[DELETE] Delete error:', deleteError)
      throw new Error('Virhe hakemuksen poistamisessa: ' + deleteError.message)
    }

    console.log('[DELETE] Application deleted successfully')

    // 5. Palauta onnistuminen
    return NextResponse.json({
      success: true,
      message: 'Hakemus poistettu onnistuneesti',
    })
  } catch (error: any) {
    console.error('[DELETE] Exception caught:', error)
    console.error('[DELETE] Error stack:', error.stack)
    return NextResponse.json(
      {
        error: 'Virhe hakemuksen poistamisessa',
        message: error.message || 'Tuntematon virhe',
      },
      { status: 500 }
    )
  }
}
