import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { createClient as createSupabaseDirectClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * FEATURE FLAG: Vaihda tru MCP-pohjaisen hankehaun ja vanhan staattisen JSON-tiedoston välillä
 *
 * false (oletus) = Käytä vanhaa toimivaa versiota (data/hankkeet.json)
 * true = Käytä uutta MCP-versiota (Supabase + MCP server)
 *
 * Aseta ympäristömuuttuja: ENABLE_MCP=true
 */

// DEBUG: Log at module load time
console.log('=== MODULE LOAD TIME DEBUG ===')
console.log('[MODULE LOAD] Initializing analyze route')
console.log('[MODULE LOAD] process.env.ENABLE_MCP:', process.env.ENABLE_MCP)
console.log('[MODULE LOAD] typeof:', typeof process.env.ENABLE_MCP)
console.log('[MODULE LOAD] Comparison result (ENABLE_MCP === "true"):', process.env.ENABLE_MCP === 'true')

const USE_MCP = process.env.ENABLE_MCP === 'true'

console.log('[MODULE LOAD] USE_MCP constant set to:', USE_MCP)
console.log('[MODULE LOAD] If USE_MCP is false, check Vercel Environment Variables!')
console.log('===============================')

/**
 * VANHA TOIMIVA VERSIO - Hakee hanketiedot JSON-tiedostosta
 * ⭐ SÄILYTETÄÄN AINA - tämä on turvallinen fallback
 */
async function fetchProjectDataFromJSON() {
  console.log('[ANALYZE] Using STATIC JSON data (old version)')

  try {
    const hankkeetPath = join(process.cwd(), 'data', 'hankkeet.json')
    const hankkeetContent = await readFile(hankkeetPath, 'utf-8')
    const hankkedata = JSON.parse(hankkeetContent)

    console.log('[ANALYZE] Project data loaded from JSON:', {
      ami_projects: hankkedata.ami?.myonnetyt?.length || 0,
      other_funders: Object.keys(hankkedata.muut_rahoittajat || {}).length,
      eura_projects: hankkedata.eura?.length || 0,
    })

    return hankkedata
  } catch (error: any) {
    console.warn('[ANALYZE] Could not load project data from JSON:', error.message)
    return null
  }
}

/**
 * SUORA SUPABASE-HAKU - Hakee hanketiedot suoraan Supabasesta
 * ✅ YKSINKERTAINEN - ei MCP-monimutkaisuutta
 */
async function fetchProjectDataFromSupabase() {
  console.log('=== SUPABASE FUNCTION CALLED ===')
  console.log('[SUPABASE] Fetching AMI projects directly from Supabase')

  try {
    const supabase = await createSupabaseClient()

    // 1. Hae AMI-hankkeet suoraan
    console.log('[SUPABASE] Step 1: Fetching AMI projects...')
    const { data: amiProjects, error: amiError } = await supabase
      .from('hankkeet')
      .select('*')
      .eq('rahoittaja', 'AMI')
      .order('created_at', { ascending: false })

    if (amiError) {
      console.error('[SUPABASE ERROR] AMI projects fetch failed:', amiError)
      throw amiError
    }

    console.log(`[SUPABASE] ✅ Found ${amiProjects?.length || 0} AMI projects`)

    // 2. Hae muut rahoittajat
    console.log('[SUPABASE] Step 2: Fetching other funders projects...')
    const { data: muutProjects, error: muutError } = await supabase
      .from('hankkeet')
      .select('*')
      .neq('rahoittaja', 'AMI')
      .order('created_at', { ascending: false })

    if (muutError) {
      console.error('[SUPABASE ERROR] Other projects fetch failed:', muutError)
      throw muutError
    }

    console.log(`[SUPABASE] ✅ Found ${muutProjects?.length || 0} other funder projects`)

    // 3. Muunna Supabase-data samaan formaattiin kuin vanha JSON
    const muutRahoittajat: Record<string, any[]> = {}
    muutProjects?.forEach((hanke: any) => {
      const rahoittaja = hanke.rahoittaja || 'Muu'
      if (!muutRahoittajat[rahoittaja]) {
        muutRahoittajat[rahoittaja] = []
      }
      muutRahoittajat[rahoittaja].push({
        nimi: hanke.otsikko,
        kuvaus: hanke.kuvaus,
        summa: hanke.rahoitus_summa?.toString(),
        vuosi: hanke.vuosi?.toString(),
        toteutaja: hanke.toteutaja,
      })
    })

    const hankkedata = {
      paivitetty: new Date().toISOString().split('T')[0],
      ami: {
        myonnetyt: amiProjects?.map((h: any) => ({
          nimi: h.otsikko,
          kuvaus: h.kuvaus,
          summa: h.rahoitus_summa?.toString(),
          vuosi: h.vuosi?.toString(),
          toteutaja: h.toteutaja,
        })) || [],
      },
      muut_rahoittajat: muutRahoittajat,
      eura: muutProjects?.filter((h: any) => h.rahoittaja === 'EURA2021') || [],
    }

    console.log('[SUPABASE] ✅ Data transformed successfully:', {
      ami_projects: hankkedata.ami.myonnetyt.length,
      other_funders: Object.keys(hankkedata.muut_rahoittajat).length,
      eura_projects: hankkedata.eura.length,
    })

    return hankkedata
  } catch (error: any) {
    console.error('=== SUPABASE ERROR OCCURRED ===')
    console.error('[SUPABASE ERROR] Error type:', error.constructor.name)
    console.error('[SUPABASE ERROR] Error message:', error.message)
    console.error('[SUPABASE ERROR] Full error:', error)
    console.error('[SUPABASE ERROR] Stack trace:', error.stack)
    console.error('[ANALYZE] Falling back to static JSON data')
    console.error('=================================')

    // FALLBACK: Jos Supabase epäonnistuu, käytä vanhaa JSON-dataa
    return fetchProjectDataFromJSON()
  }
}

/**
 * PÄÄFUNKTIO - Hankeanalyysi
 * ⭐ Käyttää feature flagia valitakseen datalähteen
 */
export async function POST(request: NextRequest) {
  let currentStep = 'initialization'
  let requestBody: any = null

  // DEBUG: Yksityiskohtainen feature flag -logitus
  console.log('=== FEATURE FLAG DEBUG ===')
  console.log('[DEBUG] process.env.ENABLE_MCP:', process.env.ENABLE_MCP)
  console.log('[DEBUG] typeof ENABLE_MCP:', typeof process.env.ENABLE_MCP)
  console.log('[DEBUG] ENABLE_MCP === "true":', process.env.ENABLE_MCP === 'true')
  console.log('[DEBUG] USE_MCP constant:', USE_MCP)
  console.log('[DEBUG] Will use:', USE_MCP ? 'MCP (new)' : 'JSON (old)')
  console.log('==========================')

  try {
    // 1. Autentikointi
    currentStep = 'authentication'
    console.log('[ANALYZE] Step: Authentication')

    const supabase = await createSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[ANALYZE] Authentication failed: No user')
      return NextResponse.json(
        { error: 'Unauthorized - Kirjautuminen vaaditaan' },
        { status: 401 }
      )
    }

    console.log('[ANALYZE] Authenticated user:', user.email)

    // 2. Hae request body
    currentStep = 'parsing_request'
    console.log('[ANALYZE] Step: Parsing request body')

    requestBody = await request.json()
    const { hakemus_teksti, haettava_summa, kuvaus } = requestBody

    console.log('[ANALYZE] Request data:', {
      hakemus_length: hakemus_teksti?.length,
      haettava_summa,
      kuvaus_length: kuvaus?.length,
    })

    if (!hakemus_teksti || !haettava_summa) {
      console.error('[ANALYZE] Validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Hakemus ja summa ovat pakollisia' },
        { status: 400 }
      )
    }

    // 3. Hae työmarkkinadata (EI MUUTOKSIA)
    currentStep = 'fetching_labor_data'
    console.log('[ANALYZE] Step: Fetching labor market data')

    let tyomarkkinadata
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

      const dataUrl = `${baseUrl}/api/data/tyomarkkinadata`
      console.log('[ANALYZE] Fetching from:', dataUrl)

      const dataResponse = await fetch(dataUrl, {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      })

      console.log('[ANALYZE] Labor data response status:', dataResponse.status)

      if (dataResponse.ok) {
        const dataJson = await dataResponse.json()
        tyomarkkinadata = dataJson.data
        console.log('[ANALYZE] Labor data fetched successfully')
      } else {
        const errorText = await dataResponse.text()
        console.warn('[ANALYZE] Labor data fetch failed:', dataResponse.status, errorText)
        tyomarkkinadata = null
      }
    } catch (error: any) {
      console.error('[ANALYZE] Error fetching labor data:', error.message)
      tyomarkkinadata = null
    }

    // 4. Hae hankkedata vertailua varten
    // ⭐ FEATURE FLAG: Valitaan datalähde
    currentStep = 'fetching_project_data'
    console.log('=== DATA SOURCE SELECTION ===')
    console.log('[ANALYZE] Step: Fetching project comparison data')
    console.log('[DEBUG] USE_MCP constant value:', USE_MCP)
    console.log('[DEBUG] process.env.ENABLE_MCP at request time:', process.env.ENABLE_MCP)
    console.log('[DEBUG] About to choose data source...')

    let hankkedata: any = null

    if (USE_MCP) {
      // UUSI: Suora Supabase-haku
      console.log('[DEBUG] ✅ USE_MCP is TRUE → Calling fetchProjectDataFromSupabase()')
      hankkedata = await fetchProjectDataFromSupabase()
      console.log('[DEBUG] Supabase data received, AMI projects:', hankkedata?.ami?.myonnetyt?.length || 0)
    } else {
      // VANHA: Staattinen JSON-tiedosto
      console.log('[DEBUG] ⚠️ USE_MCP is FALSE → Calling fetchProjectDataFromJSON()')
      console.log('[DEBUG] ⚠️ This means ENABLE_MCP is NOT set to "true" in environment')
      hankkedata = await fetchProjectDataFromJSON()
      console.log('[DEBUG] JSON data received, AMI projects:', hankkedata?.ami?.myonnetyt?.length || 0)
    }
    console.log('=============================')

    // Tästä eteenpäin kaikki on TÄYSIN SAMAA KUIN VANHASSA VERSIOSSA
    // Prompt, Claude API, JSON-parsinta, Supabase-tallennus - KAIKKI SAMA

    // 5. Luo prompt Claudelle
    const prompt = `🚨 KRIITTINEN OHJE - AMI-SÄÄTIÖN HANKKEET:

Sinulle on annettu lista AMI-säätiön TODELLISISTA hankkeista Supabase-tietokannasta.

EHDOTTOMASTI KIELLETTYÄ:
❌ ÄLÄ KOSKAAN keksi tai mainitse hankkeita joita ei ole annetussa listassa
❌ ÄLÄ viittaa hankkeisiin kuten "Pitkäaikaistyöttömien mentorointiohjelma"
❌ ÄLÄ viittaa hankkeisiin kuten "Maahanmuuttajanaisten ammatillinen koulutus"
❌ ÄLÄ viittaa mihinkään hankkeisiin vuodelta 2023 tai aiemmilta
❌ ÄLÄ keksi budjetteja tai summia

NÄMÄ OVAT AINOAT OIKEAT AMI-HANKKEET (${hankkedata?.ami?.myonnetyt?.length || 0} kpl):

${hankkedata?.ami?.myonnetyt?.map((p: any, i: number) =>
  `${i + 1}. ${p.nimi} ${p.toteutaja ? `(${p.toteutaja})` : ''} ${p.summa ? `- ${p.summa} €` : ''}`
).join('\n') || 'Ei hankkeita tietokannassa'}

SÄÄNNÖT:
✅ Viittaa VAIN yllä oleviin hankkeisiin
✅ Käytä TARKKOJA hankkeiden nimiä
✅ Jos et löydä relevanttia hanketta, sano: "Ei vastaavia AMI-hankkeita tietokannassa"
✅ Tämä on AMI-säätiön AINOA virallinen hankelista

Jos mainitset hankkeen jota EI ole yllä olevassa listassa, teet VAKAVAN virheen.

---

Analysoi seuraava hankehakemus työmarkkinadatan, Ami-säätiön painopisteiden JA olemassa olevien hankkeiden valossa.

AMI-SÄÄTIÖN VIRALLISET HANKEHAKEMUSTEN ARVIOINTIKRITEERIT:

**PÄÄKRITEERIT:**

1. **Hankkeen tuottaman tiedon relevanttius ja muutoskyky** ohjelmatyön painopisteiden kannalta sekä sopivuus ohjelmatyön kokonaisuuteen.

2. **Hankkeen kyky integroitua pääkaupunkiseudulle** tai tuottaa pääkaupunkiseudulle uutta kyvykkyyttä.

3. **Hankesuunnitelman laatu ja toteutuskelpoisuus.**

**ARVIOINTIKRITEERIIN 1 LIITTYVÄT KYSYMYKSET:**
- Mitä teet ja miksi?
- Mitkä tahot ovat hankkeessa mukana?
- Mitä tietoa hanke tuottaa ja miksi sitä tarvitaan?
- Miten olet selvittänyt tiedon tai toiminnan tarpeellisuutta erityisesti pääkaupunkiseudulla?
- Miten tuotettava tieto liittyy säätiön ohjelmatyön painopistealueisiin?

**ARVIOINTIKRITEERIIN 2 LIITTYVÄT KYSYMYKSET:**
- Miten hankkeesi tuottamat tiedot tai uudet toimintatavat voivat integroitua pääkaupunkiseudulle ja mikä on hankkeesi rooli siinä?
- Miten olet varmistanut tiedon integroitumista tai uusien toimintatapojen käyttöönottoa jo hankesuunnitelmaa valmistellessa ja miten varmistat sitä hankeaikana?

**ARVIOINTIKRITEERIIN 3 LIITTYVÄT KYSYMYKSET:**
- Millaiset resurssit hankkeella on ja mikä osa hankkeen kuluista on tarkoitus kattaa säätiön rahoituksella?

---

AMI-SÄÄTIÖN OHJELMALLISET TEEMAT (2025-):

**TEEMA 1: OSAAMINEN JA KOHTAANNOSSA ONNISTUMINEN**
- Miten työntekijöiden osaaminen ja työnantajien tarpeet kohtaavat?
- Koulutus, osaamisen kehittäminen, uudelleenkoulutus
- Työllistymisen edistäminen osaamisen kautta
- Työmarkkinoiden muutos ja osaamisvaje

**TEEMA 2: MONIMUOTOISUUS TYÖMARKKINOILLA**
- Eri taustaisten ihmisten työllistyminen ja osallisuus
- Maahanmuuttajat, ulkomaalaistaustaiset
- Vammaiset ja pitkäaikaissairaat
- Ikääntyneet työntekijät
- Yhdenvertaisuus ja syrjinnän ehkäisy

**TEEMA 3: TYÖHYVINVOINTI JA TYÖSSÄ JAKSAMINEN**
- Työntekijöiden hyvinvointi ja terveys
- Työuupumus, stressi, henkinen kuormitus
- Työelämän laatu ja tasapaino
- Kestävä työura ja työssä jatkaminen

---

AMI-SÄÄTIÖN KONKREETTISET MUUTOSKOHTEET:

Hakemus voi liittyä yhteen tai useampaan näistä muutoskohteista:

1. **Osaamistarpeiden ennakointi ja tulevaisuusajattelu** on systemaattinen osa koulutus- ja työllisyystoimijoiden sekä organisaatioiden toimintaa

2. **Pääsemme eroon sitkeistä ja piilossakin olevista haasteista**, jotka vaikuttavat osaamisen hyödyntämiseen

3. **Heikommassa työmarkkina-asemassa olevien oppiminen** vahvistuu

4. **Työllisyyttä tukevat palvelut** ovat toimivia

5. **Osaaminen työmarkkinoiden katveesta keskiöön**

6. **Työ- ja opiskeluperäinen maahanmuutto** rakentuu kestävälle pohjalle

7. **Rekrytointikäytänteet ja rekrytoituminen** uudistuvat ja mahdollistavat laajemman osaajapoolin hyödyntämisen

8. **Kun työ itsessään tukee hyvinvointia**, kyvyt tulevat paremmin käyttöön

**HUOM:** Hakemus EI tarvitse liittyä kaikkiin muutoskohteisiin, mutta JOS se liittyy johonkin, mainitse se analyysissä vahvuutena. Arvioi kriittisesti, mihin muutoskohteisiin hakemus KONKREETTISESTI vaikuttaa.

---

**MAANTIETEELLINEN RAJAUS:**
- Pääkaupunkiseutu: Helsinki, Espoo, Vantaa, Kauniainen

TYÖMARKKINADATA (Espoo, Helsinki, Vantaa):
${tyomarkkinadata ? JSON.stringify(tyomarkkinadata.metadata, null, 2) : 'Ei saatavilla'}

Työttömyystilanne pääkaupunkiseudulla (syyskuu 2025):
${
  tyomarkkinadata && tyomarkkinadata.tyonhakijat_kaupungeittain?.cities
    ? `
- Espoo: ${
        tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Espoo?.[
          'Työnhakijoita laskentapäivänä (lkm.)'
        ]?.['2025M09'] || 'N/A'
      } työnhakijaa
- Helsinki: ${
        tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Helsinki?.[
          'Työnhakijoita laskentapäivänä (lkm.)'
        ]?.['2025M09'] || 'N/A'
      } työnhakijaa
- Vantaa: ${
        tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Vantaa?.[
          'Työnhakijoita laskentapäivänä (lkm.)'
        ]?.['2025M09'] || 'N/A'
      } työnhakijaa
`
    : 'Ei saatavilla'
}

${
  tyomarkkinadata && tyomarkkinadata.koulutusasteet
    ? `
TYÖTTÖMÄT KOULUTUSASTEITTAIN (pääkaupunkiseutu):
Käytä tätä dataa arvioidessasi onko hakemuksen kohderyhmä relevantti:
- Jos hakemus kohdistuu matalan koulutuksen ryhmiin, tarkista onko heitä paljon työttömänä
- Jos hakemus kohdistuu korkeakoutettuihin, tarkista tilanne
- Jos hakemus mainitsee tietyn koulutustaustan, vertaa työmarkkinatilanteeseen

Data saatavilla: Alempi perusaste, Ylempi perusaste, Keskiaste, Alin korkea-aste, Alempi korkeakouluaste, Ylempi korkeakouluaste, Tutkijakoulutusaste

(Huom: Täysi data on saatavilla tyomarkkinadata.koulutusasteet-objektissa. Käytä sitä tarpeen mukaan vertailuun.)
`
    : ''
}

⚠️ **KRIITTINEN: ÄLÄ HALLUSINOI HANKKEITA!** ⚠️

**EHDOTTOMASTI KIELLETTYÄ:**
- ❌ ÄLMAINITSE AMI-hankkeita jotka EIVÄT ole alla olevassa listassa
- ❌ ÄLÄ keksi hankkeiden nimiä, summia tai kuvauksia
- ❌ ÄLÄ arvaa tai päättele mitä AMI "voisi olla rahoittanut"
- ❌ ÄLÄ käytä epämääräisiä viittauksia kuten "AMI on rahoittanut vastaavaa aiemmin" ilman tarkkaa hanketta

**SALLITTUA:**
- ✅ Viittaa VAIN alla olevaan listaan: "AMI on rahoittanut [tarkka nimi]..."
- ✅ Jos ei löydy vastaavaa: "Ei löytynyt vastaavaa AMI-hanketta tietokannasta"
- ✅ Jos epävarma: "Tietokannassa ei ole tietoa vastaavista AMI-hankkeista"

AMI-SÄÄTIÖN MYÖNTÄMÄT HANKKEET (vertailua varten):
${
  hankkedata && hankkedata.ami?.myonnetyt
    ? `
**NÄMÄ OVAT AINOAT AMI-HANKKEET JOITA SAA MAINITA:**

${hankkedata.ami.myonnetyt
  .map(
    (h: any, index: number) =>
      `${index + 1}. "${h.nimi}" (${h.vuosi})
   ${h.kuvaus}${h.summa ? `
   Rahoitus: ${h.summa} €` : ''}`
  )
  .join('\n\n')}

**TÄRKEÄÄ:** Yllä on ${hankkedata.ami.myonnetyt.length} hanketta. Nämä ovat AINOAT hankkeet jotka saat mainita.
Jos mainitsit jonkin hankkeen jota EI ole yllä olevassa listassa → olet hallusinoinut!

Jos et löydä vastaavaa hanketta listasta, SANO:
"Tietokannassa ei ole tällä hetkellä AMI-rahoitteisia hankkeita jotka olisivat suoraan verrattavissa tähän hakemukseen."
`
    : 'Ei saatavilla - ei voida vertailla Ami-säätiön aiempiin hankkeisiin'
}

MUIDEN RAHOITTAJIEN HANKKEET (vertailua varten):
${
  hankkedata && hankkedata.muut_rahoittajat && Object.keys(hankkedata.muut_rahoittajat).length > 0
    ? `
Muut rahoittajat pääkaupunkiseudulla:
${Object.entries(hankkedata.muut_rahoittajat)
  .map(
    ([rahoittaja, hankkeet]: [string, any]) =>
      `${rahoittaja.toUpperCase()}: ${hankkeet.map((h: any) => h.nimi).join(', ')}`
  )
  .join('\n')}
`
    : 'Ei saatavilla'
}

---

⚠️ TÄRKEÄ PRIORISOINTIOHJE - HANKEVERTAILU:

**1. AMI-SÄÄTIÖN AIEMMAT HANKKEET OVAT ENSISIJAISIA**
   - Jos löydät vastaavan hankkeen Ami-säätiön listalta → MAINITSE SE ENSIMMÄISENÄ
   - Jos hakemus on hyvin samankaltainen kuin Ami-hanke → KRIITTINEN HUOMIO: "Ami on jo rahoittanut vastaavaa"
   - Vertaa tarkkaan: kohderyhmä, aihe, alue, menetelmät
   - Jos samankaltaisuus löytyy → PAKOLLINEN kysymys: "Mikä erottaa tämän hakemuksen Ami-säätiön aiemmista hankkeista?"

**2. MUIDEN RAHOITTAJIEN HANKKEET OVAT TOISSIJAISIA**
   - Käytä VAIN lisäkontekstina
   - Mainitse jos relevanttia, mutta älä anna yhtä suurta painoarvoa
   - Esim: "TSR on rahoittanut vastaavaa, mutta Ami-säätiöllä ei ole vastaavaa hanketta portfoliossaan"
   - ÄLÄ hylkää hakemusta pelkästään sen takia että joku MUU rahoittaja on rahoittanut vastaavaa

**3. KRIITTISISSÄ KYSYMYKSISSÄ:**
   - PAKOLLINEN kysymys: "Onko Ami-säätiö rahoittanut vastaavaa hanketta aiemmin?"
     * Jos KYLLÄ → Perustele MIKSI tämä eroaa tai miksi kannattaa rahoittaa uudelleen
     * Jos KYLLÄ ja ei eroa merkittävästi → VAKAVA puute
     * Jos EI → Onko tämä uusi aukko Ami-säätiön portfoliossa? → VAHVUUS

   - Vapaaehtoinen maininta: "Ovatko muut rahoittajat rahoittaneet vastaavaa?"
     * Mainitse vain jos se on MERKITTÄVÄÄ kontekstia
     * ÄLÄ anna tälle yhtä suurta painoa kuin Ami-vertailulle

**ESIMERKKEJÄ:**

❌ HUONO vastaus:
"TSR on rahoittanut työurien pidentämistä ja Ami on myös rahoittanut nuorten työllistymistä."
(Ei priorisoi, ei vertaa tarkasti)

✅ HYVÄ vastaus:
"Ami-säätiö rahoitti vuonna 2024 'Nuorten yrittäjyyspolku' -hanketta (45 000 €), joka tukee 18-29-vuotiaiden yrittäjyysvalmiuksia pääkaupunkiseudulla. Tämä hakemus eroaa siinä että se keskittyy erityisesti maahanmuuttajanuoriin ja digitaaliseen yrittäjyyteen, kun taas Ami-hanke oli yleisempi. TSR:llä on vastaava hanke työurien pidentämisestä, mutta se kohdistuu vanhempaan ikäryhmään."
(Ami ENSIN, selkeä ero, muut rahoittajat kontekstina)

**MUISTA: AMI ENSIN, MUUT VASTA SITTEN.**

---

HAKEMUS:
Haettava summa: ${haettava_summa} €
${kuvaus ? `Kuvaus: ${kuvaus}\n` : ''}
Hakemusteksti:
${hakemus_teksti}

TEHTÄVÄ:
Analysoi hakemus ja anna arvio JSON-muodossa seuraavasti:

{
  "arvosana": <numero 1-10>,
  "vahvuudet": [
    "<3-5 konkreettista vahvuutta>"
  ],
  "heikkoudet": [
    "<3-5 konkreettista heikkoutta tai kehityskohtaa>"
  ],
  "suositus": "<Myönnettävä|Harkittava|Hylättävä>",
  "toimikunnan_huomiot": {
    "keskeiset_kysymykset": [
      "<3-5 keskeistä kysymystä joihin toimikunnan tulee kiinnittää huomiota>"
    ],
    "kriittiset_kysymykset": [
      {
        "kysymys": "<Kriittinen kysymys, esim. 'Onko aikataulu realistinen?'>",
        "perustelu": "<Konkreettinen perustelu, esim. '12 kk on lyhyt aika 500 hengen haastatteluun ja analyysiin'>",
        "vakavuus": "<vakava|harkittava>"
      }
    ]
  }
}

KRIITTISET KYSYMYKSET (vastaa kaikkiin):

1. **KRIITTISINTÄ: Mihin Ami-säätiön teemaan hakemus liittyy?**
   - [ ] TEEMA 1: Osaaminen ja kohtaannossa onnistuminen
   - [ ] TEEMA 2: Monimuotoisuus työmarkkinoilla
   - [ ] TEEMA 3: Työhyvinvointi ja työssä jaksaminen
   - [ ] EI SOVI SELKEÄSTI MIHINKÄÄN → KRIITTINEN PUUTE

   **PAKOLLINEN PERUSTELU:** Miksi hakemus sopii (tai ei sovi) valittuun teemaan?
   Jos sopii useampaan, kumpi on vahvin? Jos ei sovi mihinkään, miksi?

2. **Mihin konkreettisiin muutoskohteisiin hakemus vaikuttaa?**
   - Arvioi KRIITTISESTI, mihin 8 muutoskohteesta (listattuna edellä) hakemus TODELLA vaikuttaa
   - Mainitse vain ne muutoskohteet, joihin on KONKREETTISTA vaikutusta
   - Jos ei vaikuta mihinkään → mainitse tämä kehityskohteena
   - Jos vaikuttaa johonkin → mainitse se vahvuutena numerolla, esim: "✅ Liittyy muutoskohteeseen 3: Heikommassa työmarkkina-asemassa olevien oppiminen vahvistuu"

3. **Onko Ami rahoittanut vastaavaa aiemmin?**
   - Vertaa Ami-säätiön myönnettyihin hankkeisiin
   - Onko päällekkäisyyttä kohderyhmän, aiheen tai alueen kanssa?
   - Jos on vastaavia, MIKÄ EROTTAA tämän hakemuksen niistä?

4. **Onko joku muu rahoittanut vastaavaa?**
   - Vertaa muiden rahoittajien hankkeisiin (TSR, Diak, EURA jne.)
   - Voisiko hakija hakea avustusta muualta?

5. **Vastaako hanke työmarkkinatilanteeseen?**
   - Tunnista hakemuksen pääkohderyhmä (esim. nuoret, maahanmuuttajat, pitkäaikaistyöttömät, koulutustaso)
   - Vertaa työmarkkinadataan:
     * Montako työttömää tässä kohderyhmässä on?
     * Mikä on osuus kaikista työttömistä?
     * Onko ryhmä kasvava vai vähenevä?
   - Anna SELKEÄ ARVIO:
     * ✅ Ajankohtainen ongelma (iso ryhmä tai kasvaa nopeasti)
     * ⚠️ Pieni ryhmä mutta merkittävä
     * ❌ Ei relevantti työmarkkinatilanteeseen
   - Esimerkki hyvästä vastauksesta:
     "Hakemus kohdistuu nuoriin (alle 25v). Työmarkkinadata: 23 719 nuorta työtöntä (31% kaikista), trendi kasvaa +8%/v. ✅ Ajankohtainen ja kasvava ongelma."

6. **Onko hakemus teknisesti heikkolaatuinen?**
   - Puutteet, epäselvyydet, ristiriitaisuudet

7. **Onko aikataulu ja budjetti realistinen?**
   - Suhteessa tavoitteisiin ja kohderyhmän kokoon

8. **Onko vaikuttavuus mitattavissa?**
   - Konkreettiset mittarit ja seurantamenetelmät

---

💡 LISÄARVIOINTI (VAPAAEHTOINEN - vain jos relevanttia):

**Ami-säätiön oma rooli hankkeen tukemisessa ja jatkuvuus**

Arvioi JOS merkittävää tietoa löytyy:

**1. Voiko Ami-säätiö tukea hanketta omalla toiminnallaan?**

Tiedontuotanto:
- Onko aiheesta jo tutkimusta/selvityksiä? (Kevyt Google Scholar / Google-haku: "[hankkeen aihe] + tutkimus + Finland")
- Voiko Ami tuottaa täydentävää tietoa?
- Voisiko hankkeen tulokset julkaista Ami-säätiön Suunnanetsijä-blogissa? (blogi käsittelee työmarkkinoita, osaamista, tulevaisuutta)
- Sopiiko aihe Ami-säätiön viestinnälliseen profiiliin?

Tapahtumat ja verkosto:
- Sopiiko aihe Ami-säätiön seminaareihin/tapahtumiin? (esim. vuosiseminaari, asiantuntijatilaisuudet)
- Voisiko hanketta esitellä Ami-säätiön verkostolle?
- Voiko Ami yhdistää hankkeen muihin toimijoihin?
- Onko synergiamahdollisuuksia Ami-säätiön muiden hankkeiden kanssa?

**2. Jatkuvuus hankkeen päätyttyä**

- Voiko Ami jatkaa aihetta seuraavassa haussa?
- Syntyykö hankkeesta jotain pysyvää (malli, työkalu, verkosto, julkaisu)?
- Onko aihe sellainen että Ami haluaa panostaa siihen pitkäjänteisesti?
- Täyttääkö hakemus aukon Ami-säätiön portfoliossa?

**TÄRKEÄÄ:**
- Tämä EI ole pakollinen arvio - mainitse VAIN jos löydät jotain merkittävää
- Pidä lyhyenä (2-4 lausetta maksimissaan)
- Jos teet tiedonhaun ja löydät relevanttia tutkimusta, mainitse se
- Lisää "Vahvuudet"-osioon jos positiivista TAI mainitse "Lisänäkökulmia"-kohdassa toimikunnan huomioissa
- Jos ei löydy mitään relevanttia → älä mainitse ollenkaan, ei tarvitse sanoa "ei sovellu"

**ESIMERKKI (hyvä maininta):**

"💡 Ami-säätiön rooli: Hankkeen aihe (nuorten työllistyminen ja huumori) sopii hyvin Suunnanetsijä-blogin teemaan ja voisi kiinnostaa Ami-säätiön verkostoa kokeellisena lähestymistapana. Aiheesta on vähän tutkimusta Suomessa (Kela 2023: työhyvinvointi), mutta huumorin yhdistäminen työllistymiseen on uusi näkökulma. Hanke voisi luoda mallin jota Ami voisi laajentaa seuraavassa haussa."

**ESIMERKKI (ei mainintaa):**

Jos et löydä mitään relevanttia Ami-säätiön roolin kannalta, älä kirjoita mitään tästä osiosta.

---

**KRIITTISEN TÄRKEÄÄ - ARVIOINNIN PERUSTA:**
- ⚠️ **KAIKKI arvioinnin osat** (vahvuudet, heikkoudet, kriittiset kysymykset) **PITÄÄ PERUSTUA** Ami-säätiön virallisiin arviointikriteereihin 1-3
- ⚠️ Jokainen vahvuus ja heikkous viittaa johonkin kolmesta pääkriteeristä (relevanttius, integroituminen, toteutuskelpoisuus)
- ⚠️ Kriittiset kysymykset vastaavat suoraan arviointikriteereissä esitettyihin kysymyksiin

**PAKOLLISIA TARKISTUKSIA:**
- **TEEMASOPIVUUS** (KRIITTISIN): Soveltuuko hakemus selkeästi johonkin kolmesta teemasta? JOS EI → hylättävä
- **PÄÄKAUPUNKISEUTU**: Onko hanke todella pääkaupunkiseudulla (Helsinki, Espoo, Vantaa, Kauniainen)? JOS EI → vakava puute
- **INTEGROITUMINEN**: Miten tieto/toimintatavat otetaan käyttöön pääkaupunkiseudulla? JOS epäselvä → kriittinen kysymys
- **RELEVANTTIUS**: Liittyykö selkeästi johonkin teemaan (1-3)? Käytä työmarkkinadataa vahvistukseksi!
- **TOTEUTUSKELPOISUUS**: Onko aikataulu ja budjetti realistinen?
- **VERTAA AINA** Ami-säätiön myönnettyihin hankkeisiin
- Jos päällekkäisyyttä aiempiin hankkeisiin → perustele MIKSI tämä on silti tarpeellinen (tai ei ole)

Vastaa VAIN JSON-muodossa, ei muuta tekstiä.`

    // 6. Lähetä Claudelle (TÄYSIN SAMA KUIN VANHASSA)
    currentStep = 'calling_claude_api'
    console.log('[ANALYZE] Step: Calling Claude API')
    console.log('[ANALYZE] Prompt length:', prompt.length)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    console.log('[ANALYZE] Claude API response received')
    console.log('[ANALYZE] Response type:', message.content[0].type)

    // 7. Parsii Claude-vastaus (TÄYSIN SAMA KUIN VANHASSA)
    currentStep = 'parsing_claude_response'
    console.log('[ANALYZE] Step: Parsing Claude response')

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('[ANALYZE] Response text length:', responseText.length)
    console.log('[ANALYZE] Response preview:', responseText.substring(0, 200))

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[ANALYZE] No JSON found in Claude response')
      console.error('[ANALYZE] Full response:', responseText)
      throw new Error('Claude ei palauttanut validia JSON-vastausta')
    }

    let arviointi
    try {
      arviointi = JSON.parse(jsonMatch[0])
      console.log('[ANALYZE] JSON parsed successfully')
      console.log('[ANALYZE] Evaluation keys:', Object.keys(arviointi))
    } catch (parseError: any) {
      console.error('[ANALYZE] JSON parse error:', parseError.message)
      console.error('[ANALYZE] JSON string:', jsonMatch[0])
      throw new Error('Virheellinen JSON-muoto Claude-vastauksessa: ' + parseError.message)
    }

    arviointi.haettava_summa = haettava_summa

    // 8. Tallenna Supabaseen (TÄYSIN SAMA KUIN VANHASSA)
    currentStep = 'saving_to_supabase'
    console.log('[ANALYZE] Step: Saving to Supabase')

    const { data: savedData, error: saveError } = await supabase
      .from('hakemukset')
      .insert({
        hakemus_teksti,
        haettava_summa,
        user_id: user.id,
        user_email: user.email,
        arviointi: arviointi,
        status: 'arvioitu',
        kuvaus: kuvaus || null,
      })
      .select()
      .single()

    if (saveError) {
      console.error('[ANALYZE] Supabase save error:', saveError)
      console.error('[ANALYZE] Save error code:', saveError.code)
      console.error('[ANALYZE] Save error details:', saveError.details)
      throw new Error('Tallennus epäonnistui: ' + saveError.message)
    }

    console.log('[ANALYZE] Saved successfully with ID:', savedData.id)

    // 9. Palauta arviointi (TÄYSIN SAMA KUIN VANHASSA)
    return NextResponse.json({
      success: true,
      arviointi,
      hakemus_id: savedData.id,
    })
  } catch (error: any) {
    console.error('=== ANALYZE ERROR ===')
    console.error('Current step:', currentStep)
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Request body:', requestBody)
    console.error('=====================')

    let userMessage = 'Virhe analysoinnissa'

    if (currentStep === 'authentication') {
      userMessage = 'Autentikointi epäonnistui. Yritä kirjautua uudelleen.'
    } else if (currentStep === 'parsing_request') {
      userMessage = 'Virheellinen pyyntö. Tarkista että hakemus ja summa on täytetty.'
    } else if (currentStep === 'fetching_labor_data') {
      userMessage = 'Työmarkkinadatan haku epäonnistui, mutta analyysi jatkuu.'
    } else if (currentStep === 'calling_claude_api') {
      userMessage = 'Claude AI -kutsu epäonnistui. Tarkista API-avain ja yritä uudelleen.'
    } else if (currentStep === 'parsing_claude_response') {
      userMessage = 'Claude AI -vastauksen parsiminen epäonnistui. Yritä uudelleen.'
    } else if (currentStep === 'saving_to_supabase') {
      userMessage = 'Tietokannan tallennus epäonnistui. Tarkista tietokantayhteys.'
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: error.message || 'Tuntematon virhe',
        step: currentStep,
      },
      { status: 500 }
    )
  }
}
