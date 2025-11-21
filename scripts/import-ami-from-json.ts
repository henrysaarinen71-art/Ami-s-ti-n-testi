/**
 * Import AMI-hankkeet from data/hankkeet.json
 *
 * This script:
 * 1. Reads existing projects from data/hankkeet.json
 * 2. Imports them to Supabase (hankkeet table)
 * 3. Marks on_ami_hanke = true
 *
 * Usage:
 *   npm run import-ami-from-json
 *
 * NOTE: This bypasses web scraping (which fails with 403 Forbidden)
 * and uses the already curated project data.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Load environment variables
config({ path: join(process.cwd(), '.env.local') })

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Missing environment variables')
  console.error('Make sure .env.local contains:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client (uses service_role_key, bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface HankeTallennus {
  otsikko: string
  kuvaus: string
  toteuttaja: string
  rahoittaja: string
  on_ami_hanke: boolean
  rahoitus_summa: number | null
  vuosi: number | null
  url: string
  lahde_sivusto: string
}

async function importAmiFromJson() {
  console.log('='.repeat(60))
  console.log('AMI-HANKKEIDEN IMPORT (JSON)')
  console.log('='.repeat(60))
  console.log()

  try {
    // 1. Read data/hankkeet.json
    console.log('📥 Step 1: Reading data/hankkeet.json...')
    const jsonPath = join(process.cwd(), 'data', 'hankkeet.json')
    const fileContent = await readFile(jsonPath, 'utf-8')
    const jsonData = JSON.parse(fileContent)

    const amiHankkeet = jsonData.ami?.myonnetyt || []
    console.log(`✅ Found ${amiHankkeet.length} AMI projects in JSON`)
    console.log()

    if (amiHankkeet.length === 0) {
      console.warn('⚠️  WARNING: No projects found in data/hankkeet.json')
      return
    }

    // 2. Convert to database format
    console.log('🔄 Step 2: Converting to database format...')

    const hankkeetTallennettavaksi: HankeTallennus[] = amiHankkeet.map(
      (hanke: any, index: number) => {
        // Parse summa (remove spaces and convert to number)
        let rahoitus_summa: number | null = null
        if (hanke.summa) {
          const cleanedSumma = hanke.summa.replace(/[\s.]/g, '')
          const parsed = parseFloat(cleanedSumma)
          if (!isNaN(parsed)) {
            rahoitus_summa = parsed
          }
        }

        // Parse vuosi
        let vuosi: number | null = null
        if (hanke.vuosi) {
          const parsed = parseInt(hanke.vuosi, 10)
          if (!isNaN(parsed)) {
            vuosi = parsed
          }
        }

        // Create unique URL (url has UNIQUE constraint)
        const baseUrl = 'https://ami.fi/avustukset/hankerahoitus/myonnetyt/'
        const slug = hanke.nimi
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/[äåá]/g, 'a')
          .replace(/ö/g, 'o')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 50)
        const url = `${baseUrl}#${slug}-${vuosi || index}`

        return {
          otsikko: hanke.nimi.substring(0, 200), // Limit length
          kuvaus: hanke.kuvaus,
          toteuttaja: 'Ei tiedossa', // Not specified in JSON
          rahoittaja: 'AMI',
          on_ami_hanke: true, // ⭐ CRITICAL FLAG
          rahoitus_summa,
          vuosi,
          url,
          lahde_sivusto: 'ami.fi',
        }
      }
    )

    console.log(`✅ Converted ${hankkeetTallennettavaksi.length} projects`)
    console.log()

    // Print projects to be imported
    console.log('Projects to import:')
    hankkeetTallennettavaksi.forEach((hanke, i) => {
      console.log(
        `  ${i + 1}. ${hanke.otsikko} (${hanke.rahoitus_summa ? hanke.rahoitus_summa.toLocaleString('fi-FI') + ' €' : 'no amount'}, ${hanke.vuosi || 'no year'})`
      )
    })
    console.log()

    // 3. Save to Supabase
    console.log('💾 Step 3: Saving to Supabase...')
    console.log()

    let onnistunut = 0
    let epaonnistunut = 0

    for (const hanke of hankkeetTallennettavaksi) {
      try {
        // Use UPSERT (INSERT ON CONFLICT DO UPDATE)
        const { data, error } = await supabase
          .from('hankkeet')
          .upsert(
            {
              ...hanke,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'url', // URL is UNIQUE
            }
          )
          .select()

        if (error) {
          console.error(`  ❌ Error saving: ${hanke.otsikko}`)
          console.error(`     ${error.message}`)
          console.error(`     Code: ${error.code}`)
          console.error(`     Details: ${JSON.stringify(error.details)}`)
          console.error(`     Hint: ${error.hint}`)
          epaonnistunut++
        } else {
          console.log(`  ✅ ${hanke.otsikko.substring(0, 70)}`)
          onnistunut++
        }
      } catch (error: any) {
        console.error(`  ❌ Exception saving: ${hanke.otsikko}`)
        console.error(`     ${error.message}`)
        epaonnistunut++
      }
    }

    console.log()
    console.log('='.repeat(60))
    console.log('SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Successful: ${onnistunut}`)
    console.log(`❌ Failed: ${epaonnistunut}`)
    console.log()

    // 4. Database statistics
    console.log('📊 Step 4: Database statistics...')

    const { data: stats, error: statsError } = await supabase
      .from('hankkeet')
      .select('*', { count: 'exact' })
      .eq('on_ami_hanke', true)

    if (!statsError && stats) {
      console.log(`   AMI projects in database: ${stats.length}`)
    }

    const { data: allStats, error: allStatsError } = await supabase
      .from('hankkeet')
      .select('*', { count: 'exact' })

    if (!allStatsError && allStats) {
      console.log(`   Total projects: ${allStats.length}`)
    }

    console.log()
    console.log('✅ Import complete!')
    console.log()
    console.log('Next steps:')
    console.log('1. Check Supabase console to verify data looks correct')
    console.log('2. Test MCP integration with ENABLE_MCP=true')
    console.log('3. Make a test application to see real AMI projects in analysis')
    console.log()

  } catch (error: any) {
    console.error()
    console.error('='.repeat(60))
    console.error('❌ IMPORT ERROR')
    console.error('='.repeat(60))
    console.error(error.message)
    console.error()
    console.error('Stack trace:')
    console.error(error.stack)
    console.error()
    process.exit(1)
  }
}

// Run import
importAmiFromJson()
  .then(() => {
    console.log('✅ Program completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Program error:', error)
    process.exit(1)
  })
