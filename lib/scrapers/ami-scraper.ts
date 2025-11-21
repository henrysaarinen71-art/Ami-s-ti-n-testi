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
 * Better headers to avoid bot detection
 */
const getHeaders = () => ({
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'fi-FI,fi;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://ami.fi/',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Cache-Control': 'max-age=0'
})

/**
 * Retry logic with exponential backoff
 */
async function fetchWithRetry(url: string, maxAttempts = 3): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[AMI_SCRAPER] Attempt ${attempt}/${maxAttempts} for ${url}`)

      const response = await axios.get(url, {
        timeout: 15000,
        headers: getHeaders(),
        validateStatus: (status) => status === 200
      })

      console.log(`[AMI_SCRAPER] Success on attempt ${attempt}`)
      return response.data
    } catch (error: any) {
      lastError = error
      console.error(`[AMI_SCRAPER] Attempt ${attempt} failed: ${error.message}`)

      if (error.response?.status === 403) {
        console.error('[AMI_SCRAPER] 403 Forbidden - Site may be blocking scraper')
      }

      // If not last attempt, wait before retry (exponential backoff)
      if (attempt < maxAttempts) {
        const delayMs = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`[AMI_SCRAPER] Waiting ${delayMs}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

/**
 * Delay between requests to avoid rate limiting
 */
async function delay(ms: number): Promise<void> {
  console.log(`[AMI_SCRAPER] Waiting ${ms}ms before next request...`)
  await new Promise(resolve => setTimeout(resolve, ms))
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
      const htmlData = await fetchWithRetry(myonnetytUrl)

      const $ = cheerio.load(htmlData)

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

    // Delay before next request
    await delay(2000)

    // 2. Hae toiminnan painopisteet
    try {
      console.log('[AMI_SCRAPER] Fetching focus areas...')
      const toimintaUrl = 'https://ami.fi/toiminta/'
      const htmlData = await fetchWithRetry(toimintaUrl)

      const $ = cheerio.load(htmlData)

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

    // Delay before next request
    await delay(2000)

    // 3. Hae blogi-artikkelit
    try {
      console.log('[AMI_SCRAPER] Fetching blog articles...')
      const blogiUrl = 'https://ami.fi/category/suunnanetsija-blogi/'
      const htmlData = await fetchWithRetry(blogiUrl)

      const $ = cheerio.load(htmlData)

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
