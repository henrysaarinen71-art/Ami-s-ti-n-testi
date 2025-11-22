import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function GET(request: NextRequest) {
  try {
    console.log('[REPORT] Starting board report generation')

    // 1. Autentikointi
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[REPORT] Authentication failed: No user')
      return NextResponse.json(
        { error: 'Unauthorized - Kirjautuminen vaaditaan' },
        { status: 401 }
      )
    }

    console.log('[REPORT] Authenticated user:', user.email)

    // 2. Hae kaikki käyttäjän hakemukset
    const { data: hakemukset, error: hakemuksetError } = await supabase
      .from('hakemukset')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (hakemuksetError) {
      console.error('[REPORT] Error fetching applications:', hakemuksetError)
      throw new Error('Virhe hakemusten haussa')
    }

    console.log('[REPORT] Found applications:', hakemukset?.length || 0)

    if (!hakemukset || hakemukset.length === 0) {
      return NextResponse.json(
        { error: 'Ei hakemuksia raportoitavaksi' },
        { status: 400 }
      )
    }

    // 3. Hae työmarkkinadata
    let tyomarkkinadata
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

      const dataUrl = `${baseUrl}/api/data/tyomarkkinadata`
      console.log('[REPORT] Fetching labor data from:', dataUrl)

      const dataResponse = await fetch(dataUrl, {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      })

      if (dataResponse.ok) {
        const dataJson = await dataResponse.json()
        tyomarkkinadata = dataJson.data
        console.log('[REPORT] Labor data fetched successfully')
      } else {
        console.warn('[REPORT] Labor data fetch failed:', dataResponse.status)
        tyomarkkinadata = null
      }
    } catch (error: any) {
      console.error('[REPORT] Error fetching labor data:', error.message)
      tyomarkkinadata = null
    }

    // 4. Laske tilastot
    const totalSumma = hakemukset.reduce((sum, h) => sum + (h.haettava_summa || 0), 0)
    const avgSumma = totalSumma / hakemukset.length
    const avgArvosana = hakemukset.reduce((sum, h) => sum + (h.arviointi?.arvosana || 0), 0) / hakemukset.length

    const erinomaiset = hakemukset.filter(h => (h.arviointi?.arvosana || 0) >= 8).length
    const hyvat = hakemukset.filter(h => (h.arviointi?.arvosana || 0) >= 6 && (h.arviointi?.arvosana || 0) < 8).length
    const heikot = hakemukset.filter(h => (h.arviointi?.arvosana || 0) < 6).length

    // 5. Muotoile hakemukset Claude-promptia varten
    const hakemusListaus = hakemukset.map((h, idx) => `
HAKEMUS ${idx + 1}:
- Kuvaus: ${h.kuvaus || h.hakemus_teksti.substring(0, 200)}
- Haettava summa: ${h.haettava_summa} €
- Arvosana: ${h.arviointi?.arvosana || 0}/10
- Suositus: ${h.arviointi?.suositus || 'N/A'}
- Vahvuudet: ${h.arviointi?.vahvuudet?.join(', ') || 'N/A'}
- Heikkoudet: ${h.arviointi?.heikkoudet?.join(', ') || 'N/A'}
- Kriittiset kysymykset: ${h.arviointi?.toimikunnan_huomiot?.kriittiset_kysymykset?.length || 0} kpl
`).join('\n')

    const raportointijakso = `${new Date(hakemukset[hakemukset.length - 1].created_at).toLocaleDateString('fi-FI')} - ${new Date(hakemukset[0].created_at).toLocaleDateString('fi-FI')}`

    // 6. Luo Claude-prompt
    const prompt = `Luo HALLITUSRAPORTTI Ami-säätiön hankehakemuksista.

HAKEMUSTEN PERUSTIEDOT:
- Määrä: ${hakemukset.length} kpl
- Haettu summa yhteensä: ${totalSumma.toLocaleString('fi-FI')} €
- Keskimääräinen hakemussumma: ${Math.round(avgSumma).toLocaleString('fi-FI')} €
- Keskiarvoarvosana: ${avgArvosana.toFixed(1)}/10
- Erinomaisia (8-10/10): ${erinomaiset} kpl
- Hyviä (6-7/10): ${hyvat} kpl
- Heikkoja (<6/10): ${heikot} kpl

HAKEMUKSET:
${hakemusListaus}

TYÖMARKKINADATA (Pääkaupunkiseutu, syyskuu 2025):
${tyomarkkinadata && tyomarkkinadata.tyonhakijat_kaupungeittain?.cities ? `
- Espoo: ${tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Espoo?.['Työnhakijoita laskentapäivänä (lkm.)']?.['2025M09'] || 'N/A'} työnhakijaa
- Helsinki: ${tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Helsinki?.['Työnhakijoita laskentapäivänä (lkm.)']?.['2025M09'] || 'N/A'} työnhakijaa
- Vantaa: ${tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Vantaa?.['Työnhakijoita laskentapäivänä (lkm.)']?.['2025M09'] || 'N/A'} työnhakijaa
` : 'Ei saatavilla'}

LUO AMMATTIMAINEN HALLITUSRAPORTTI MARKDOWN-MUODOSSA SEURAAVALLA RAKENTEELLA:

# AMI-SÄÄTIÖ - HANKEHAKEMUSTEN YHTEENVETO
Raportointijakso: ${raportointijakso}
Luotu: ${new Date().toLocaleDateString('fi-FI')} (automaattinen AI-raportti)

---

## 1. TIIVISTELMÄ

**Hakemusten määrä:** ${hakemukset.length} kpl
**Haettu summa yhteensä:** ${totalSumma.toLocaleString('fi-FI')} €
**Keskimääräinen hakemussumma:** ${Math.round(avgSumma).toLocaleString('fi-FI')} €
**Hakemusten keskiarvoarvosana:** ${avgArvosana.toFixed(1)}/10

**Suositus hallitukselle:**
[1-2 kappaletta: Kannattaako rahoittaa? Mitkä ovat vahvimmat? Mihin suuntaan portfolio kehittyy?]

---

## 2. HAKEMUSTEN TASO

**Laadullinen arvio:**
- Erinomaisia hakemuksia (8-10/10): ${erinomaiset} kpl
- Hyviä hakemuksia (6-7/10): ${hyvat} kpl
- Heikkoja hakemuksia (<6/10): ${heikot} kpl

**Keskeiset vahvuudet:**
[3-5 kohtaa mitä hakemukset tekivät hyvin - analysoi vahvuuksia hakemuslistasta]

**Keskeiset kehityskohteet:**
[3-5 kohtaa mitä voisi parantaa - analysoi heikkouksia hakemuslistasta]

---

## 3. HAKIJAPROFIILI

**Hakijatyypit:**
[Analysoi hakemusten kuvauksia ja arvioi:]
- Yliopistot/tutkimuslaitokset: X kpl (XX%)
- Ammattikorkeakoulut: X kpl (XX%)
- Järjestöt/säätiöt: X kpl (XX%)
- Yritykset/konsultit: X kpl (XX%)
- Yksittäiset toimijat: X kpl (XX%)
- Epäselvät/testihakemukset: X kpl (XX%)

**Analyysi:**
[Onko hakijapooli monipuolinen? Puuttuuko jokin tärkeä toimijaryhmä?]

---

## 4. VIESTINNÄN TEHOKKUUS

**Ovatko hakijat ymmärtäneet Ami-säätiön:**

**Painopisteet** (Osaaminen, Monimuotoisuus, Työhyvinvointi):
[Analysoi montako hakemusta liittyy kuhunkin teemaan]
✅/⚠️/❌ + Selitys

**Alueellinen rajaus** (Pääkaupunkiseutu):
[Montako hakemusta keskittyi oikeaan alueeseen?]
✅/⚠️/❌ + Selitys

**Kohderyhmät:**
[Analyysoi kohderyhmävalintojen relevanssia]
✅/⚠️/❌ + Selitys

**Viestinnän arvosana:** X/10

**Suositukset viestinnän parantamiseen:**
1. [Konkreettinen suositus]
2. [Konkreettinen suositus]
3. [Konkreettinen suositus]

---

## 5. RELEVANSSI TYÖMARKKINATILANTEESEEN

**Työttömyyden rakenne pääkaupunkiseudulla:**

[Laske yhteensä työttömät: Espoo + Helsinki + Vantaa]
${tyomarkkinadata && tyomarkkinadata.tyonhakijat_kaupungeittain?.cities ? `
Työmarkkinadata saatavilla:
- Espoo: ${tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Espoo?.['Työnhakijoita laskentapäivänä (lkm.)']?.['2025M09'] || 'N/A'} työnhakijaa
- Helsinki: ${tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Helsinki?.['Työnhakijoita laskentapäivänä (lkm.)']?.['2025M09'] || 'N/A'} työnhakijaa
- Vantaa: ${tyomarkkinadata.tyonhakijat_kaupungeittain.cities.Vantaa?.['Työnhakijoita laskentapäivänä (lkm.)']?.['2025M09'] || 'N/A'} työnhakijaa

Yhteensä työttömiä: [Laske summa] henkilöä
` : 'Ei saatavilla'}

**Suurimmat työttömyysryhmät:**

[Analysoi ja tunnista 3-5 suurinta ryhmää työmarkkinadatasta. Jos data ei riitä, arvioi yleisten tilastojen perusteella:]

Esimerkki (täytä OIKEILLA LUVUILLA jos data saatavilla):
1. Nuoret (alle 25v): XX XXX henkilöä (XX% kaikista) - Trendi: **KASVAA/LASKEE ±X%/v** ⚠️/✅
2. Ulkomaalaistaustaiset: XX XXX henkilöä (XX%) - Trendi: **KASVAA/LASKEE ±X%/v** ⚠️/✅
3. Pitkäaikaistyöttömät: XX XXX henkilöä (XX%) - **KRIITTINEN TASO / NORMAALI** ⚠️/✅
4. [Lisää muita merkittäviä ryhmiä]

${tyomarkkinadata && tyomarkkinadata.koulutusasteet ? `
**Koulutustaso:**

[Analysoi koulutusasteet-datasta. Tunnista:]
- Matalasti koulutetut (perusaste): XX% työttömistä - **MERKITTÄVÄ HAASTE** ⚠️ / **NORMAALI** ✅
- Korkeakoulutetut: XX% työttömistä - **KASVAA/LASKEE**
- [Lisää muita havaintoja]
` : ''}

**Hakemusten kohdentuminen:**

[Analysoi KONKREETTISESTI montako hakemusta kohdistuu mihinkäkin ryhmään:]

- XX% hakemuksista kohdistuu KASVAVIIN työttömyysryhmiin (esim. nuoret, ulkomaalaiset) ✅ OIKEA FOKUS
- XX% käsittelee KRIITTISIÄ ryhmiä (esim. pitkäaikaistyöttömät, matalasti koulutetut) ✅ TÄRKEÄÄ
- XX% keskittyy VÄHENEVIIN tai PIENIIN ryhmiin ⚠️ VÄHEMMÄN AJANKOHTAISTA

**ANALYYSI JA SUOSITUKSET:**

[Kirjoita 2-3 kappaletta:]

1. **Vastaako portfolio työmarkkinatilanteeseen?**
   - Ovatko hakemukset kohdistuneet suurimpiin / kasvaviin ryhmiin?
   - Onko painopiste oikeissa teemoissa?

2. **Mitä puuttuu?**
   - Mitkä SUURET työttömyysryhmät eivät saa huomiota?
   - Esim: "28% työttömistä on pitkäaikaistyöttömiä, mutta vain 1 hakemus (10%) kohdistuu heihindelleen"

3. **Strateginen suositus:**
   - Mihin Ami-säätiön kannattaa panostaa seuraavassa haussa työmarkkinatilanteen perusteella?

Esimerkki hyvästä analyysistä:
"Portfolio vastaa hyvin työmarkkinatilanteeseen. Painopiste nuorissa (3 hakemusta, 43%) ja maahanmuuttajissa (2 hakemusta, 29%) on oikea, koska nämä ovat nopeimmin kasvavia ryhmiä (+8% ja +12% vuodessa).

Huomio: Pitkäaikaistyöttömyys on kriittisellä tasolla (28% kaikista työttömistä), mutta vain 1 hakemus (14%) kohdistuu tähän ryhmään. Suositus: Seuraavassa haussa korostaa pitkäaikaistyöttömyyden ehkäisyä.

Koulutustaso: 45% työttömistä on matalasti koulutettuja. Hakemuksista 4 kpl (57%) keskittyy osaamisen kehittämiseen → hyvä kohdentuminen."

---

## 6. PORTFOLIOANALYYSI

**Jakaumat:**

**Teemat:**
[Analysoi hakemusten teemoja]
- Osaaminen ja kohtaanto: X kpl (XX%)
- Monimuotoisuus: X kpl (XX%)
- Työhyvinvointi: X kpl (XX%)
- Ei sovi selkeästi: X kpl (XX%)

**Kohderyhmät:**
[Analysoi pääkohderyhmät]
- Nuoret: X kpl
- Maahanmuuttajat: X kpl
- Pitkäaikaistyöttömät: X kpl
- Ikääntyneet: X kpl
- Muut: X kpl

**Alueet:**
[Analysoi alueelliset painotukset]
- Helsinki: X kpl (XX%)
- Espoo: X kpl (XX%)
- Vantaa: X kpl (XX%)
- Koko pääkaupunkiseutu: X kpl (XX%)

**Havainnot:**
[Onko portfolio tasapainossa? Puuttuuko jotain? Onko keskittymistä?]

---

## 7. SUOSITUKSET HALLITUKSELLE

**Rahoitettavat hakemukset (arvosana ≥7/10):**
[Listaa hakemukset joiden arvosana on ≥7, lyhyet perustelut]

**Harkittavat hakemukset (arvosana 5-7/10):**
[Listaa hakemukset joiden arvosana on 5-7, lyhyet perustelut]

**Hylättävät hakemukset (arvosana <5/10):**
[Listaa hakemukset joiden arvosana on <5, lyhyet perustelut]

**Kokonaisbudjetti myönnettäville (≥7/10):**
[Laske yhteissumma hakemuksista joiden arvosana ≥7] € / haettu ${totalSumma.toLocaleString('fi-FI')} €

---

## 8. STRATEGISET SUOSITUKSET

**Seuraavaa hakua varten:**
1. [Suositus perustuen aukkoon portfoliossa]
2. [Suositus perustuen työmarkkinatrendiin]
3. [Suositus perustuen viestintähaasteisiin]

**Pitkän aikavälin kehitys:**
[1-2 kappaletta strategisesta suunnasta - mihin Ami-säätiön kannattaa panostaa]

---

⚠️ **HUOM: Tämä on prototyyppi.** Tuotantoversiossa käytettäisiin EU-pohjaista AI-mallia (esim. Mistral) ja auditoitua tietosuojaa.

*Tämä raportti on luotu automaattisesti Claude AI:lla. Perustuu ${hakemukset.length} hakemukseen, työmarkkinadataan ja Ami-säätiön arviointikriteereihin.*

---

TÄRKEÄÄ:
- Käytä TODELLISIA LUKUJA hakemusten perusteella, ei paikkamerkkejä "XX"
- Ole KONKREETTINEN ja AMMATTIMAISELLA kielellä
- Anna SELKEITÄ SUOSITUKSIA hallitukselle
- ANALYSOI oikeasti hakemuksia, älä vain listaa niitä
- Jos hakemusten määrä on pieni (1-3), mainitse että analyysi on suuntaa-antava
- Pidä raportti tiiviinä mutta informatiivisena`

    // 7. Lähetä Claudelle
    console.log('[REPORT] Calling Claude API')
    console.log('[REPORT] Prompt length:', prompt.length)

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    console.log('[REPORT] Claude API response received')

    const markdown =
      message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('[REPORT] Report generated, length:', markdown.length)

    // 8. Palauta raportti
    return NextResponse.json({
      success: true,
      markdown,
      summary: {
        hakemusten_maara: hakemukset.length,
        haettu_summa: totalSumma,
        keskiarvo_arvosana: parseFloat(avgArvosana.toFixed(1)),
        erinomaiset,
        hyvat,
        heikot,
        raportointijakso,
      },
    })
  } catch (error: any) {
    console.error('[REPORT] Error generating report:', error)
    return NextResponse.json(
      { error: error.message || 'Virhe raportin luomisessa' },
      { status: 500 }
    )
  }
}
