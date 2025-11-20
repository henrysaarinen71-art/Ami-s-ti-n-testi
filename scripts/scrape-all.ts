#!/usr/bin/env tsx

import { writeFile } from 'fs/promises'
import { join } from 'path'
import { scrapeAmiSaatio } from '../lib/scrapers/ami-scraper'

interface HankeData {
  paivitetty: string
  ami: {
    myonnetyt: any[]
    painopisteet: string
    blogit: any[]
  }
  muut_rahoittajat: {
    [key: string]: any[]
  }
  eura: any[]
}

async function main() {
  console.log('=== SCRAPING START ===')
  console.log('Starting data collection from various sources...\n')

  const data: HankeData = {
    paivitetty: new Date().toISOString().split('T')[0],
    ami: {
      myonnetyt: [],
      painopisteet: '',
      blogit: [],
    },
    muut_rahoittajat: {},
    eura: [],
  }

  // 1. Scrape Ami-säätiö
  try {
    console.log('📡 Scraping Ami-säätiö...')
    const amiData = await scrapeAmiSaatio()

    data.ami.myonnetyt = amiData.myonnetytHankkeet
    data.ami.painopisteet = amiData.painopisteet
    data.ami.blogit = amiData.blogit

    console.log(
      `✅ Ami-säätiö: ${amiData.myonnetytHankkeet.length} projects, ${amiData.blogit.length} blogs\n`
    )
  } catch (error: any) {
    console.error('❌ Error scraping Ami-säätiö:', error.message)
    console.error('   Continuing with partial data...\n')
  }

  // 2. TODO: Scrape other funders (TSR, Diak, Laurea)
  console.log('⏭️  Skipping other funders (not implemented yet)\n')

  // 3. TODO: Scrape EURA2021
  console.log('⏭️  Skipping EURA2021 (not implemented yet)\n')

  // 4. Save to JSON file
  try {
    const outputPath = join(process.cwd(), 'data', 'hankkeet.json')
    await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8')

    console.log('💾 Data saved to:', outputPath)
    console.log('\nSummary:')
    console.log(`- Ami projects: ${data.ami.myonnetyt.length}`)
    console.log(`- Ami blogs: ${data.ami.blogit.length}`)
    console.log(`- Focus areas: ${data.ami.painopisteet.length} chars`)
    console.log(`- Last updated: ${data.paivitetty}`)
  } catch (error: any) {
    console.error('❌ Error saving data:', error.message)
    throw error
  }

  console.log('\n=== SCRAPING COMPLETE ===')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
