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
    console.log('[LABOR_DATA] GET request received')

    // Tarkista autentikointi
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[LABOR_DATA] Unauthorized: No user')
      return NextResponse.json(
        { error: 'Unauthorized - Kirjautuminen vaaditaan' },
        { status: 401 }
      )
    }

    console.log('[LABOR_DATA] Authenticated user:', user.email)

    // Lue JSON-tiedosto
    const dataPath = join(process.cwd(), 'data', 'tyomarkkinadata.json')
    console.log('[LABOR_DATA] Data path:', dataPath)

    try {
      const fileContent = await readFile(dataPath, 'utf-8')
      console.log('[LABOR_DATA] File read successfully, size:', fileContent.length)

      const data = JSON.parse(fileContent)
      console.log('[LABOR_DATA] JSON parsed successfully')
      console.log('[LABOR_DATA] Data keys:', Object.keys(data))

      return NextResponse.json({
        success: true,
        data,
      })
    } catch (fileError: any) {
      // Jos tiedostoa ei löydy, palauta virheilmoitus
      console.error('[LABOR_DATA] File error:', fileError.message)
      console.error('[LABOR_DATA] Error code:', fileError.code)
      console.error('[LABOR_DATA] Current working directory:', process.cwd())

      return NextResponse.json(
        {
          error: 'Data not found',
          message: 'Työmarkkinadataa ei löytynyt. Aja ensin: npm run parse-data',
          path: dataPath,
          cwd: process.cwd(),
        },
        { status: 404 }
      )
    }
  } catch (error: any) {
    console.error('[LABOR_DATA] General error:', error)
    console.error('[LABOR_DATA] Error stack:', error.stack)

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
