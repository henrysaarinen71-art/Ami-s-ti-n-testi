'use client'

import { useState } from 'react'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [understood, setUnderstood] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    if (understood) {
      localStorage.setItem('welcome_modal_seen', 'true')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <h2 className="text-3xl font-bold mb-2">👋 Tervetuloa tulevaisuuden hankearviointiin</h2>
          <p className="text-indigo-100">Tämä ei ole tavallinen lomakejärjestelmä</p>
        </div>

        <div className="p-6 space-y-8">
          {/* OSIO 1: Mitä tämä on? */}
          <section>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              💡 Mitä tämä on?
            </h3>
            <div className="prose prose-sm max-w-none space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Olet testaamassa <strong>kolmannen tason tekoälyjärjestelmää</strong>, joka:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="font-bold text-green-900 mb-1">⚡ Analysoi hakemukset sekunteissa</div>
                  <div className="text-sm text-green-800">
                    Mitä apurahatoimikunnalta kestää tunteja, AI tekee hetkessä
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <div className="font-bold text-blue-900 mb-1">🧠 Yhdistää tietoa älykkäästi</div>
                  <div className="text-sm text-blue-800">
                    Työmarkkinadata + aiemmat hankkeet + Ami-säätiön kriteerit = perusteltu suositus
                  </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                  <div className="font-bold text-purple-900 mb-1">🎯 Oppii jatkuvasti</div>
                  <div className="text-sm text-purple-800">
                    Mitä enemmän hakemuksia, sitä tarkempi analyysi
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <div className="font-bold text-yellow-900 mb-1">📊 Tuottaa strategista tietoa</div>
                  <div className="text-sm text-yellow-800">
                    Ei vain arvioi yksittäisiä hakemuksia, vaan näyttää miten koko portfolio kehittyy
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 my-4">
                <h4 className="font-bold text-indigo-900 mb-2">
                  Miksi tämä on 'tason 3' tekoälyä?
                </h4>
                <div className="space-y-2 text-sm text-indigo-800">
                  <div>📌 <strong>Taso 1:</strong> AI tehostaa rutiineja (chatbotit, laskujen käsittely)</div>
                  <div>📌 <strong>Taso 2:</strong> AI tukee päätöksiä (data-analyysi, ennusteet)</div>
                  <div className="text-base">
                    ➡️ <strong>Taso 3: AI muokkaa prosesseja ja luo uutta arvoa</strong>
                  </div>
                </div>
              </div>

              <p className="text-gray-700">
                Tämä järjestelmä ei vain nopeuta arviointia - se <strong>muuttaa koko tavan</strong>,
                jolla hankkeita arvioidaan, verrataan ja kehitetään.
              </p>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">Miten tämä toimii teknisesti?</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Claude 4</strong> analysoi hakemukset</li>
                  <li>• <strong>MCP</strong> yhdistää AI:n dataan (Tilastokeskus, Ami.fi, tietokanta)</li>
                  <li>• <strong>Kaikki tapahtuu automaattisesti</strong></li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  = Tämä ei ole pelkkä chatbot. Tämä on järjestelmä joka yhdistää dataa älykkäästi.
                </p>
              </div>
            </div>
          </section>

          {/* OSIO 2: MCP */}
          <section className="border-t border-gray-200 pt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🔌 MCP: Miten AI saa tietonsa?
            </h3>
            <div className="prose prose-sm max-w-none space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Olet ehkä miettinyt: Mistä AI tietää Tilastokeskuksen luvut? Ami-säätiön aiemmat hankkeet?
                Muiden rahoittajien hankkeet?
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="font-bold text-blue-900 mb-2">Vastaus: MCP (Model Context Protocol)</p>
                <p className="text-sm text-blue-800">
                  Se on kuin USB-portti tietokoneessa - yksi standardi joka yhdistää kaiken.
                </p>
              </div>

              <h4 className="font-bold text-gray-900 mt-4">Tässä sovelluksessa MCP tarkoittaa:</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
                <div className="bg-white border border-gray-200 rounded p-3">
                  <div className="text-sm">
                    <strong>📊 Tilastokeskus</strong> → MCP → AI saa työmarkkinadatan reaaliajassa
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded p-3">
                  <div className="text-sm">
                    <strong>🌐 Ami.fi</strong> → MCP → AI lukee myönnetyt hankkeet automaattisesti
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded p-3">
                  <div className="text-sm">
                    <strong>📰 Google News</strong> → MCP → AI etsii uutisia aiheesta
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded p-3">
                  <div className="text-sm">
                    <strong>💾 Supabase</strong> → MCP → AI muistaa aiemmat analyysit
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-gray-900">Käytännössä:</h4>

                <div className="text-sm space-y-2">
                  <div className="bg-red-50 border-l-2 border-red-400 p-2 rounded">
                    <strong className="text-red-900">Ilman MCP:tä (perinteinen tapa):</strong>
                    <ul className="mt-1 ml-4 text-red-800 space-y-1">
                      <li>• Kehittäjä rakentaa erikseen yhteyden jokaiseen tietolähteeseen</li>
                      <li>• 3-6 kuukautta per integraatio</li>
                      <li>• Jos API muuttuu → kaikki hajoaa</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border-l-2 border-green-400 p-2 rounded">
                    <strong className="text-green-900">MCP:n kanssa:</strong>
                    <ul className="mt-1 ml-4 text-green-800 space-y-1">
                      <li>• Yksi standardi, kaikki lähteet</li>
                      <li>• Uusi tietolähde käyttöön minuuteissa</li>
                      <li>• AI osaa käyttää automaattisesti</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-sm italic">
                *MCP on Anthropicin avoin standardi, kuten HTTP on webin standardi.*
              </p>
            </div>
          </section>

          {/* OSIO 3: Mitä se voisi tehdä? */}
          <section className="border-t border-gray-200 pt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🚀 Mitä seuraavaksi? Kun prototyyppi kasvaa täysimittaiseksi
            </h3>
            <div className="prose prose-sm max-w-none space-y-4">
              <p className="text-gray-700">Kuvittele jos järjestelmä:</p>

              <div className="space-y-3">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 p-4 rounded">
                  <h4 className="font-bold text-purple-900 mb-2">🤖 Toimisi autonomisena assistenttina</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Keskustelet AI:n kanssa hankkeista aamupalaverissa</li>
                    <li>• Illalla saat sähköpostiisi tiivistelmän päätöksistä ja seuraavat askeleet</li>
                    <li>• AI on jo varmistanut että päätökset ovat linjassa strategian kanssa</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-500 p-4 rounded">
                  <h4 className="font-bold text-blue-900 mb-2">📈 Osaisi ennakoida</h4>
                  <p className="text-sm text-blue-800">
                    "Seuraavassa haussa kannattaa panostaa kohderyhmään X, koska työttömyys kasvaa 12%
                    ja kilpailijoilla ei ole vastaavia hankkeita"
                  </p>
                  <p className="text-sm text-blue-800 mt-1">→ AI näkee mitä et vielä näe</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-yellow-50 border-l-4 border-green-500 p-4 rounded">
                  <h4 className="font-bold text-green-900 mb-2">🔗 Yhdistäisi tekijöitä</h4>
                  <p className="text-sm text-green-800">
                    "Nämä kolme hanketta käsittelevät samaa ongelmaa - kannattaisiko niiden tehdä yhteistyötä?"
                  </p>
                  <p className="text-sm text-green-800 mt-1">→ Luo verkostoja automaattisesti</p>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 rounded">
                  <h4 className="font-bold text-yellow-900 mb-2">🎯 Varmistaisi laadun</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Seuraa hankkeita reaaliajassa</li>
                    <li>• "Hanke X:n aikataulu on myöhässä - ehdotan välitapaamista"</li>
                    <li>• Early warning ennen kuin ongelmat kasvavat</li>
                  </ul>
                </div>
              </div>

              <div className="bg-indigo-100 border border-indigo-300 rounded-lg p-4 mt-4">
                <p className="text-sm text-indigo-900">
                  ➡️ Katso <strong>"Tulossa pian"</strong> -osio Dashboard-sivulla nähdäksesi 11 tulevaisuuden ominaisuutta
                </p>
              </div>
            </div>
          </section>

          {/* OSIO 4: Tietosuoja-disclaimer */}
          <section className="border-t border-gray-200 pt-8">
            <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                ⚠️ PROTOTYYPPI - Tietosuoja
              </h3>

              <h4 className="font-bold text-orange-900 mb-3">
                🔒 Miksi tämä on vasta prototyyppi?
              </h4>

              <div className="space-y-4">
                <p className="text-orange-800">
                  <strong>Tämä demonstroi potentiaalia - mutta ei ole vielä tuotantovalmis.</strong>
                </p>

                <div className="bg-white rounded p-4">
                  <h5 className="font-bold text-gray-900 mb-2">Nykyinen tekninen toteutus:</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Käyttää <strong>Anthropic Claude API:a</strong> (USA-pohjainen pilvipalvelu)</li>
                    <li>• Hakemusten data kulkee Atlantin yli analysoitavaksi</li>
                    <li className="text-red-600 font-semibold">• ❌ Ei täytä julkisen sektorin GDPR-vaatimuksia</li>
                  </ul>
                </div>

                <div className="bg-white rounded p-4">
                  <h5 className="font-bold text-gray-900 mb-2">Mitä tuotantoversiossa tarvittaisiin:</h5>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">✅</span>
                      <div>
                        <strong>EU-pohjainen tai paikallinen AI-malli</strong>
                        <br />
                        <span className="text-xs text-gray-600">
                          Esim. Mistral (ranskalainen), paikallisesti asennettu LLM tai suomalainen malli
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-green-600">✅</span>
                      <div>
                        <strong>Data pysyy Suomessa/EU:ssa</strong>
                        <br />
                        <span className="text-xs text-gray-600">
                          Kaikki tiedot säilytetään ja käsitellään EU:n alueella
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-green-600">✅</span>
                      <div>
                        <strong>Auditoitu tietosuoja</strong>
                        <br />
                        <span className="text-xs text-gray-600">
                          Tietosuojavastaavan hyväksyntä, riskiarviot, tietosuojaseloste
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-green-600">✅</span>
                      <div>
                        <strong>Anonymisointi tai pseudonymisointi</strong>
                        <br />
                        <span className="text-xs text-gray-600">
                          Henkilötiedot suojataan jo ennen AI-käsittelyä
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="font-bold text-red-900 mb-2">Siksi tämä on prototyyppi:</p>
                  <p className="text-sm text-red-800">
                    Demonstroi <strong>mitä on mahdollista</strong>, ei sitä mitä tänään saa tehdä julkisella rahalla.
                  </p>
                </div>

                <div className="bg-orange-100 border border-orange-300 rounded p-4">
                  <p className="font-bold text-orange-900 text-center text-lg">
                    ⚠️ Älä syötä henkilökohtaisia tai arkaluontoisia tietoja tähän järjestelmään.
                  </p>
                  <p className="text-sm text-orange-800 text-center mt-2">
                    Testaa vapaasti, mutta muista: tämä ei ole turvallinen ympäristö sensitiiviselle datalle.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-gray-700 font-medium">
                Ymmärrän että tämä on prototyyppi
              </span>
            </label>

            <button
              onClick={handleClose}
              disabled={!understood}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition text-lg"
            >
              🚀 Selvä - Aloitetaan!
            </button>

            <div className="text-center">
              <a
                href="#"
                className="text-sm text-indigo-600 hover:text-indigo-800"
                onClick={(e) => {
                  e.preventDefault()
                  alert('Tietosuojadokumentaatio tulisi tähän tuotantoversiossa')
                }}
              >
                📄 Lue lisää tietosuojasta
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
