'use client'

import { useState } from 'react'
import Link from 'next/link'

interface KriittinenKysymys {
  kysymys: string
  perustelu: string
  vakavuus: 'vakava' | 'harkittava'
}

interface AnalysisResult {
  arvosana: number
  vahvuudet: string[]
  heikkoudet: string[]
  suositus: 'Myönnettävä' | 'Harkittava' | 'Hylättävä'
  haettava_summa: number
  toimikunnan_huomiot: {
    keskeiset_kysymykset: string[]
    kriittiset_kysymykset: KriittinenKysymys[]
  }
}

export default function AnalyzePage() {
  const [hakemus, setHakemus] = useState('')
  const [summa, setSumma] = useState('')
  const [kuvaus, setKuvaus] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hakemus_teksti: hakemus,
          haettava_summa: parseFloat(summa),
          kuvaus: kuvaus || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Virhe analysoinnissa')
      }

      setResult(data.arviointi)
    } catch (err: any) {
      setError(err.message || 'Tapahtui virhe. Yritä uudelleen.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewAnalysis = () => {
    setHakemus('')
    setSumma('')
    setKuvaus('')
    setResult(null)
    setError('')
  }

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getRecommendationColor = (suositus: string) => {
    if (suositus === 'Myönnettävä') return 'bg-green-100 border-green-300 text-green-800'
    if (suositus === 'Harkittava') return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    return 'bg-red-100 border-red-300 text-red-800'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
        >
          ← Takaisin dashboardiin
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Analysoi hakemus</h1>

      {/* Lomake */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="mb-6">
          <label htmlFor="hakemus" className="block text-sm font-medium text-gray-700 mb-2">
            Liitä hakemus tähän *
          </label>
          <textarea
            id="hakemus"
            value={hakemus}
            onChange={(e) => setHakemus(e.target.value)}
            required
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Liitä hakemuksen teksti tähän..."
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="summa" className="block text-sm font-medium text-gray-700 mb-2">
            Haettava summa (€) *
          </label>
          <input
            type="number"
            id="summa"
            value={summa}
            onChange={(e) => setSumma(e.target.value)}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="esim. 50000"
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="kuvaus" className="block text-sm font-medium text-gray-700 mb-2">
            Lyhyt kuvaus (vapaaehtoinen)
          </label>
          <textarea
            id="kuvaus"
            value={kuvaus}
            onChange={(e) => setKuvaus(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Hakemuksen lyhyt tiivistelmä tai huomioita..."
            disabled={loading}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analysoidaan...
            </>
          ) : (
            'Analysoi hakemus'
          )}
        </button>
      </form>

      {/* Tuloksen näyttö */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Arvioinnin tulos</h2>

          {/* Arvosana */}
          <div className={`mb-6 p-6 rounded-lg border-2 ${getScoreColor(result.arvosana)}`}>
            <div className="text-center">
              <div className="text-sm font-medium mb-2">Arvosana</div>
              <div className="text-6xl font-bold">{result.arvosana}/10</div>
            </div>
          </div>

          {/* Haettava summa */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Haettava summa</div>
            <div className="text-2xl font-bold">{result.haettava_summa.toLocaleString('fi-FI')} €</div>
          </div>

          {/* Vahvuudet */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold mb-3 text-green-700">✓ Vahvuudet</h3>
            <ul className="space-y-2">
              {result.vahvuudet.map((vahvuus, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">✓</span>
                  <span>{vahvuus}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Heikkoudet */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold mb-3 text-yellow-700">⚠ Kehityskohteet</h3>
            <ul className="space-y-2">
              {result.heikkoudet.map((heikkous, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1 font-bold">⚠</span>
                  <span>{heikkous}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Toimikunnan huomiot - TÄRKEIN OSA */}
          <div className="mb-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
            <h3 className="text-xl font-bold mb-4 text-blue-900">
              📋 Apurahatoimikunnan huomioitavaa
            </h3>

            {/* Keskeiset kysymykset */}
            <div className="mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">Keskeiset kysymykset:</h4>
              <ul className="space-y-1 ml-4">
                {result.toimikunnan_huomiot.keskeiset_kysymykset.map((kysymys, index) => (
                  <li key={index} className="text-blue-900">
                    • {kysymys}
                  </li>
                ))}
              </ul>
            </div>

            {/* Kriittiset kysymykset ja perustelut */}
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">Kriittiset kysymykset ja perustelut:</h4>
              <div className="space-y-3">
                {result.toimikunnan_huomiot.kriittiset_kysymykset.map((item, index) => {
                  const bgColor = item.vakavuus === 'vakava' ? 'bg-red-100 border-red-300' : 'bg-orange-100 border-orange-300'
                  const textColor = item.vakavuus === 'vakava' ? 'text-red-900' : 'text-orange-900'
                  const iconColor = item.vakavuus === 'vakava' ? 'text-red-600' : 'text-orange-600'

                  return (
                    <div key={index} className={`p-3 rounded border ${bgColor}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 font-bold ${iconColor}`}>
                          {item.vakavuus === 'vakava' ? '🔴' : '🟠'}
                        </span>
                        <div className="flex-1">
                          <div className={`font-semibold ${textColor}`}>{item.kysymys}</div>
                          <div className="text-sm mt-1 text-gray-700">{item.perustelu}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Suositus */}
          <div className={`p-6 rounded-lg border-2 ${getRecommendationColor(result.suositus)}`}>
            <div className="text-center">
              <div className="text-sm font-medium mb-2">Suositus</div>
              <div className="text-3xl font-bold">{result.suositus}</div>
            </div>
          </div>

          {/* Toiminnot */}
          <div className="mt-6">
            <button
              onClick={handleNewAnalysis}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700"
            >
              Analysoi uusi hakemus
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
