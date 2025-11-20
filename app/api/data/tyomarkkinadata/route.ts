import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * GET /api/data/tyomarkkinadata
 *
 * Palauttaa työmarkkinadatan JSON-muodossa.
 * Vaatii kirjautumisen.
 */
export async function GET(request: NextRequest) {
  try {
    // Tarkista autentikointi
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

    // Lue JSON-tiedosto
    const dataPath = join(process.cwd(), 'data', 'tyomarkkinadata.json')

    try {
      const fileContent = await readFile(dataPath, 'utf-8')
      const data = JSON.parse(fileContent)

      return NextResponse.json({
        success: true,
        data,
      })
    } catch (fileError) {
      // Jos tiedostoa ei löydy, palauta virheilmoitus
      return NextResponse.json(
        {
          error: 'Data not found',
          message: 'Työmarkkinadataa ei löytynyt. Aja ensin: npm run parse-data',
        },
        { status: 404 }
      )
    }
  } catch (error: any) {
    console.error('Virhe työmarkkinadatan lataamisessa:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
