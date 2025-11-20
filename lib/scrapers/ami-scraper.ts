import axios from 'axios'
import * as cheerio from 'cheerio'

interface MyonnettyHanke {
  nimi: string
  kuvaus: string
  summa?: string
  vuosi?: string
}

interface BlogiArtikkeli {
  otsikko: string
  url: string
  paiva?: string
  tiivistelma?: string
}

interface AmiData {
  myonnetytHankkeet: MyonnettyHanke[]
  painopisteet: string
  blogit: BlogiArtikkeli[]
}

/**
 * Scrape Ami-säätiön verkkosivut
 */
export async function scrapeAmiSaatio(): Promise<AmiData> {
  console.log('[AMI_SCRAPER] Starting scrape...')

  const result: AmiData = {
    myonnetytHankkeet: [],
    painopisteet: '',
    blogit: [],
  }

  try {
    // 1. Hae myönnetyt hankkeet
    try {
      console.log('[AMI_SCRAPER] Fetching granted projects...')
      const myonnetytUrl = 'https://ami.fi/avustukset/hankerahoitus/myonnetyt/'
      const myonnetytResponse = await axios.get(myonnetytUrl, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })

      const $ = cheerio.load(myonnetytResponse.data)

      // Etsi hanke-elementit (tarkka rakenne riippuu sivusta)
      $('article, .entry-content p, .wp-block-group').each((_, element) => {
        const text = $(element).text().trim()

        // Yksinkertainen parsinta: etsi tekstiä jossa mainitaan hankkeen nimi ja mahdollisesti summa
        if (
          text.length > 20 &&
          text.length < 500 &&
          (text.includes('€') || text.includes('eur') || text.match(/\d{4}/))
        ) {
          const hanke: MyonnettyHanke = {
            nimi: text.substring(0, 100),
            kuvaus: text,
          }

          // Yritä tunnistaa summa
          const summaMatch = text.match(/(\d[\d\s.]*)\s*€/)
          if (summaMatch) {
            hanke.summa = summaMatch[1].replace(/\s/g, '')
          }

          // Yritä tunnistaa vuosi
          const vuosiMatch = text.match(/(20\d{2})/)
          if (vuosiMatch) {
            hanke.vuosi = vuosiMatch[1]
          }

          result.myonnetytHankkeet.push(hanke)
        }
      })

      console.log(
        `[AMI_SCRAPER] Found ${result.myonnetytHankkeet.length} granted projects`
      )
    } catch (error: any) {
      console.error('[AMI_SCRAPER] Error fetching granted projects:', error.message)
    }

    // 2. Hae toiminnan painopisteet
    try {
      console.log('[AMI_SCRAPER] Fetching focus areas...')
      const toimintaUrl = 'https://ami.fi/toiminta/'
      const toimintaResponse = await axios.get(toimintaUrl, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })

      const $ = cheerio.load(toimintaResponse.data)

      // Hae pääsisältö
      const content = $('.entry-content, .content, main')
        .text()
        .trim()
        .substring(0, 2000)

      result.painopisteet = content || 'Ei saatavilla'

      console.log(
        `[AMI_SCRAPER] Extracted focus areas (${result.painopisteet.length} chars)`
      )
    } catch (error: any) {
      console.error('[AMI_SCRAPER] Error fetching focus areas:', error.message)
      result.painopisteet = 'Työllisyyden edistäminen, ammatillisten taitojen kehittäminen'
    }

    // 3. Hae blogi-artikkelit
    try {
      console.log('[AMI_SCRAPER] Fetching blog articles...')
      const blogiUrl = 'https://ami.fi/category/suunnanetsija-blogi/'
      const blogiResponse = await axios.get(blogiUrl, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })

      const $ = cheerio.load(blogiResponse.data)

      // Hae blogi-artikkelit
      $('article, .entry, .post').each((_, element) => {
        const otsikko = $(element).find('h2, h3, .entry-title').first().text().trim()
        const linkElement = $(element).find('a').first()
        const url = linkElement.attr('href') || ''
        const paiva = $(element)
          .find('.published, .entry-date, time')
          .first()
          .text()
          .trim()
        const tiivistelma = $(element)
          .find('.entry-summary, .excerpt, p')
          .first()
          .text()
          .trim()
          .substring(0, 200)

        if (otsikko && otsikko.length > 5) {
          result.blogit.push({
            otsikko,
            url,
            paiva: paiva || undefined,
            tiivistelma: tiivistelma || undefined,
          })
        }
      })

      console.log(`[AMI_SCRAPER] Found ${result.blogit.length} blog articles`)
    } catch (error: any) {
      console.error('[AMI_SCRAPER] Error fetching blog articles:', error.message)
    }

    console.log('[AMI_SCRAPER] Scrape completed successfully')
    return result
  } catch (error: any) {
    console.error('[AMI_SCRAPER] Fatal error:', error.message)
    throw error
  }
}
