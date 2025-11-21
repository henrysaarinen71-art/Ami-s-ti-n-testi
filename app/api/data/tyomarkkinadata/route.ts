import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/data/tyomarkkinadata
 *
 * Palauttaa työmarkkinadatan Supabasesta.
 * Vaatii kirjautumisen.
 *
 * NOTE: This endpoint now uses Supabase instead of data/tyomarkkinadata.json
 * The old JSON file had WRONG data (76,485 was "all job seekers", not "unemployed")
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

    // Hae data Supabasesta
    console.log('[LABOR_DATA] Fetching from Supabase: tyomarkkinadata_kuukausittain')

    const { data: rows, error } = await supabase
      .from('tyomarkkinadata_kuukausittain')
      .select('*')
      .order('vuosi', { ascending: false })
      .order('kuukausi', { ascending: false })

    if (error) {
      console.error('[LABOR_DATA] Supabase error:', error)
      return NextResponse.json(
        {
          error: 'Database error',
          message: error.message,
          hint: 'Taulua ei ehkä ole luotu. Aja migraatio: supabase/migrations/003_tyomarkkinadata_table.sql'
        },
        { status: 500 }
      )
    }

    if (!rows || rows.length === 0) {
      console.warn('[LABOR_DATA] No data found in Supabase')
      return NextResponse.json(
        {
          error: 'No data',
          message: 'Työmarkkinadataa ei löytynyt. Taulua ei ehkä ole luotu tai data ei ole importoitu.',
        },
        { status: 404 }
      )
    }

    console.log('[LABOR_DATA] Fetched', rows.length, 'rows from Supabase')

    // Muunna data takaisin samankaltaiseen muotoon kuin vanha JSON
    // jotta olemassa olevat komponentit toimivat
    const formattedData = formatLaborData(rows)

    return NextResponse.json({
      success: true,
      source: 'supabase',
      rowCount: rows.length,
      data: formattedData,
    })
  } catch (error: any) {
    console.error('[LABOR_DATA] General error:', error)
    console.error('[LABOR_DATA] Error stack:', error.stack)

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Format Supabase rows into the structure expected by the frontend
 */
function formatLaborData(rows: any[]) {
  // Group by city
  const cities: Record<string, any> = {}

  rows.forEach((row) => {
    const city = row.alue
    const monthCode = row.kuukausi_koodi

    if (!cities[city]) {
      cities[city] = {
        'Työttömät työnhakijat (lkm.)': {},
        'Alle 20-v. työttömät työnhakijat (lkm.)': {},
        'Alle 25-v. työttömät työnhakijat (lkm.)': {},
        'Yli 50-v. työttömät työnhakijat (lkm.)': {},
        'Vamm./pitkäaik.sair. työttömät työnhakijat (lkm.)': {},
        'Ulkomaalaisia työttömiä työnhakijoita laskentapäivänä (lkm.)': {},
        'Pitkäaikaistyöttömät (lkm.)': {},
      }
    }

    // Add data for this month
    cities[city]['Työttömät työnhakijat (lkm.)'][monthCode] = row.tyottomat_tyonhakijat
    cities[city]['Alle 20-v. työttömät työnhakijat (lkm.)'][monthCode] = row.alle_20v_tyottomat
    cities[city]['Alle 25-v. työttömät työnhakijat (lkm.)'][monthCode] = row.alle_25v_tyottomat
    cities[city]['Yli 50-v. työttömät työnhakijat (lkm.)'][monthCode] = row.yli_50v_tyottomat
    cities[city]['Vamm./pitkäaik.sair. työttömät työnhakijat (lkm.)'][monthCode] = row.vammaiset_pitkasairaat
    cities[city]['Ulkomaalaisia työttömiä työnhakijoita laskentapäivänä (lkm.)'][monthCode] = row.ulkomaalaiset_tyottomat
    cities[city]['Pitkäaikaistyöttömät (lkm.)'][monthCode] = row.pitkaaikaistyottomat
  })

  // Find latest month for metadata
  const latestRow = rows[0] // Already sorted by date desc
  const latestMonthCode = latestRow?.kuukausi_koodi || 'Unknown'

  return {
    metadata: {
      paivitetty: new Date().toISOString().split('T')[0],
      alueet: Object.keys(cities).sort(),
      aikajakso: `${rows[rows.length - 1]?.kuukausi_koodi} - ${latestMonthCode}`,
      source: 'supabase',
      table: 'tyomarkkinadata_kuukausittain',
      note: 'HUOM: Tämä data sisältää TYÖTTÖMÄT työnhakijat, ei kaikkia työnhakijoita'
    },
    tyonhakijat_kaupungeittain: {
      type: 'tyottomat_tyonhakijat',
      description: 'Työttömät työnhakijat laskentapäivänä (ei kaikkia työnhakijoita!)',
      cities: cities,
    },
  }
}
