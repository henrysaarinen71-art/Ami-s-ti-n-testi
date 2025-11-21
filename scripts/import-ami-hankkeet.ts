/**
 * AMI-hankkeiden import-skripti
 *
 * Tämä skripti:
 * 1. Käyttää olemassa olevaa ami-scraper.ts-tiedostoa
 * 2. Scrapee Ami-säätiön sivulta hanketiedot
 * 3. Tallentaa hankkeet Supabase-tietokantaan
 * 4. Merkitsee on_ami_hanke = true
 *
 * Käyttö:
 *   npm run import-ami-hankkeet
 *
 * HUOM: Vaatii ympäristömuuttujat:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { scrapeAmiSaatio } from '../lib/scrapers/ami-scraper'
import { join } from 'path'

// Lataa ympäristömuuttujat (.env.local on Next.js:n standardi)
config({ path: join(process.cwd(), '.env.local') })

// Tarkista ympäristömuuttujat
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VIRHE: Puuttuvat ympäristömuuttujat')
  console.error('Varmista että .env.local sisältää:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Luo Supabase-client (käyttää service_role_key:tä, ohittaa RLS:n)
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

async function importAmiHankkeet() {
  console.log('='.repeat(60))
  console.log('AMI-HANKKEIDEN IMPORT')
  console.log('='.repeat(60))
  console.log()

  try {
    // 1. Scrape Ami-säätiön sivulta
    console.log('📥 Vaihe 1: Scrapee Ami-säätiön sivulta...')
    const amiData = await scrapeAmiSaatio()

    console.log(`✅ Löydettiin ${amiData.myonnetytHankkeet.length} hanketta`)
    console.log()

    if (amiData.myonnetytHankkeet.length === 0) {
      console.warn('⚠️  VAROITUS: Ei löytynyt hankkeita. Tarkista ami-scraper.ts')
      console.warn('   Mahdollisia syitä:')
      console.warn('   - Ami.fi:n sivurakenne on muuttunut')
      console.warn('   - Verkko-ongelma')
      console.warn('   - Scraper ei tunnista uutta HTML-rakennetta')
      return
    }

    // 2. Muunna hankkeet tietokantatauluun sopivaksi
    console.log('🔄 Vaihe 2: Muunnetaan hankkeet tietokantaformaattiin...')

    const hankkeetTallennettavaksi: HankeTallennus[] = amiData.myonnetytHankkeet.map(
      (hanke, index) => {
        // Parsii summa (poista välilyönnit ja muunna numeroksi)
        let rahoitus_summa: number | null = null
        if (hanke.summa) {
          const cleanedSumma = hanke.summa.replace(/[\s.]/g, '')
          const parsed = parseFloat(cleanedSumma)
          if (!isNaN(parsed)) {
            rahoitus_summa = parsed
          }
        }

        // Parsii vuosi
        let vuosi: number | null = null
        if (hanke.vuosi) {
          const parsed = parseInt(hanke.vuosi, 10)
          if (!isNaN(parsed)) {
            vuosi = parsed
          }
        }

        // Luo uniikki URL (koska url on UNIQUE constraint)
        // Käytä hakemuksen nimeä + indeksiä jos ei ole oikeaa URL:ia
        const baseUrl = 'https://ami.fi/avustukset/hankerahoitus/myonnetyt/'
        const slug = hanke.nimi
          .toLowerCase()
          .replace(/[äåá]/g, 'a')
          .replace(/ö/g, 'o')
          .replace(/[^a-z0-9]/g, '-')
          .substring(0, 50)
        const url = `${baseUrl}#${slug}-${index}`

        return {
          otsikko: hanke.nimi.substring(0, 100), // Rajoita pituus
          kuvaus: hanke.kuvaus,
          toteuttaja: 'Ei tiedossa', // Scraper ei kerää toteuttajaa (voisi parantaa)
          rahoittaja: 'AMI',
          on_ami_hanke: true, // ⭐ KRIITTINEN FLAG
          rahoitus_summa,
          vuosi,
          url,
          lahde_sivusto: 'ami.fi',
        }
      }
    )

    console.log(`✅ Muunnettiin ${hankkeetTallennettavaksi.length} hanketta`)
    console.log()

    // 3. Tallenna Supabaseen
    console.log('💾 Vaihe 3: Tallennetaan Supabaseen...')
    console.log()

    let onnistunut = 0
    let paivitetty = 0
    let epaonnistunut = 0

    for (const hanke of hankkeetTallennettavaksi) {
      try {
        // Käytä UPSERT (INSERT ON CONFLICT DO UPDATE)
        // Jos url löytyy jo → päivitä
        // Jos ei löydy → lisää uusi
        const { data, error } = await supabase
          .from('hankkeet')
          .upsert(
            {
              ...hanke,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'url', // URL on UNIQUE, käytetään päivityksen tunnistukseen
            }
          )
          .select()

        if (error) {
          console.error(`  ❌ Virhe tallentaessa: ${hanke.otsikko}`)
          console.error(`     ${error.message}`)
          epaonnistunut++
        } else {
          // Tarkista oliko INSERT vai UPDATE
          // (Supabase ei palauta eroa, mutta voidaan olettaa että jos data palautuu, onnistui)
          console.log(`  ✅ ${hanke.otsikko.substring(0, 60)}...`)
          onnistunut++
        }
      } catch (error: any) {
        console.error(`  ❌ Poikkeus tallentaessa: ${hanke.otsikko}`)
        console.error(`     ${error.message}`)
        epaonnistunut++
      }
    }

    console.log()
    console.log('='.repeat(60))
    console.log('YHTEENVETO')
    console.log('='.repeat(60))
    console.log(`✅ Onnistunut: ${onnistunut}`)
    console.log(`♻️  Päivitetty: ${paivitetty}`)
    console.log(`❌ Epäonnistunut: ${epaonnistunut}`)
    console.log()

    // 4. Hae tilastot tietokannasta
    console.log('📊 Vaihe 4: Tietokannan tilastot...')

    const { data: stats, error: statsError } = await supabase
      .from('hankkeet')
      .select('rahoittaja, on_ami_hanke', { count: 'exact' })
      .eq('on_ami_hanke', true)

    if (!statsError && stats) {
      console.log(`   AMI-hankkeita tietokannassa: ${stats.length}`)
    }

    const { data: allStats, error: allStatsError } = await supabase
      .from('hankkeet')
      .select('rahoittaja', { count: 'exact' })

    if (!allStatsError && allStats) {
      console.log(`   Kaikkia hankkeita yhteensä: ${allStats.length}`)
    }

    console.log()
    console.log('✅ Import valmis!')
    console.log()
    console.log('Seuraavat vaiheet:')
    console.log('1. Tarkista Supabase-konsolista että data näyttää oikealta')
    console.log('2. Testaa MCP-server: node mcp-server/hanke-server.ts')
    console.log('3. Jatka MCP-integraatioon')
    console.log()

  } catch (error: any) {
    console.error()
    console.error('='.repeat(60))
    console.error('❌ VIRHE IMPORTISSA')
    console.error('='.repeat(60))
    console.error(error.message)
    console.error()
    console.error('Stack trace:')
    console.error(error.stack)
    console.error()
    process.exit(1)
  }
}

// Aja import
importAmiHankkeet()
  .then(() => {
    console.log('✅ Ohjelma päättyi onnistuneesti')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Ohjelman virhe:', error)
    process.exit(1)
  })
