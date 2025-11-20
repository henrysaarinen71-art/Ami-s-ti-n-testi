'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface KriittinenKysymys {
  kysymys: string
  perustelu: string
  vakavuus: 'vakava' | 'harkittava'
}

interface Hakemus {
  id: string
  hakemus_teksti: string
  haettava_summa: number
  kuvaus: string | null
  arviointi: {
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
  created_at: string
}

export default function HakemusDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [hakemus, setHakemus] = useState<Hakemus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHakemus()
  }, [id])

  const fetchHakemus = async () => {
    try {
      const response = await fetch(`/api/hakemukset/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Hakemusta ei löytynyt')
        }
        throw new Error('Virhe hakemuksen haussa')
      }
      const data = await response.json()
      setHakemus(data.hakemus)
    } catch (err: any) {
      setError(err.message || 'Virhe hakemuksen haussa')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Ladataan hakemusta...</div>
      </div>
    )
  }

  if (error || !hakemus) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/hakemukset"
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mb-4"
        >
          ← Takaisin hakemuksiin
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          {error || 'Hakemusta ei löytynyt'}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Navigaatio */}
      <div className="mb-6">
        <Link
          href="/dashboard/hakemukset"
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
        >
          ← Takaisin hakemuksiin
        </Link>
      </div>

      {/* Otsikko ja metadata */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {hakemus.kuvaus || 'Hakemus'}
            </h1>
            <div className="text-sm text-gray-600">
              Luotu: {formatDate(hakemus.created_at)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Haettava summa</div>
            <div className="text-2xl font-bold text-gray-900">
              {hakemus.haettava_summa.toLocaleString('fi-FI')} €
            </div>
          </div>
        </div>

        {/* Hakemuksen teksti */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Hakemuksen teksti</h3>
          <div className="bg-gray-50 rounded p-4 text-sm text-gray-800 whitespace-pre-wrap">
            {hakemus.hakemus_teksti}
          </div>
        </div>
      </div>

      {/* Arvioinnin tulokset */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Arvioinnin tulos</h2>

        {/* Arvosana ja Suositus rinnakkain */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Arvosana */}
          <div className={`p-6 rounded-lg border-2 ${getScoreColor(hakemus.arviointi.arvosana)}`}>
            <div className="text-center">
              <div className="text-sm font-medium mb-2">Arvosana</div>
              <div className="text-5xl font-bold">{hakemus.arviointi.arvosana}/10</div>
            </div>
          </div>

          {/* Suositus */}
          <div className={`p-6 rounded-lg border-2 ${getRecommendationColor(hakemus.arviointi.suositus)}`}>
            <div className="text-center">
              <div className="text-sm font-medium mb-2">Suositus</div>
              <div className="text-3xl font-bold">{hakemus.arviointi.suositus}</div>
            </div>
          </div>
        </div>

        {/* Vahvuudet */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-3 text-green-700">✓ Vahvuudet</h3>
          <ul className="space-y-2">
            {hakemus.arviointi.vahvuudet.map((vahvuus, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-1 font-bold">✓</span>
                <span className="text-gray-800">{vahvuus}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Heikkoudet */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold mb-3 text-yellow-700">⚠ Kehityskohteet</h3>
          <ul className="space-y-2">
            {hakemus.arviointi.heikkoudet.map((heikkous, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1 font-bold">⚠</span>
                <span className="text-gray-800">{heikkous}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Toimikunnan huomiot - TÄRKEIN OSA */}
        <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
          <h3 className="text-xl font-bold mb-4 text-blue-900">
            📋 Apurahatoimikunnan huomioitavaa
          </h3>

          {/* Keskeiset kysymykset */}
          <div className="mb-6">
            <h4 className="font-semibold text-blue-800 mb-2">Keskeiset kysymykset:</h4>
            <ul className="space-y-1 ml-4">
              {hakemus.arviointi.toimikunnan_huomiot.keskeiset_kysymykset.map((kysymys, index) => (
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
              {hakemus.arviointi.toimikunnan_huomiot.kriittiset_kysymykset.map((item, index) => {
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
      </div>

      {/* Toiminnot */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/hakemukset"
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-center py-3 px-4 rounded-lg font-medium transition"
        >
          ← Takaisin hakemuksiin
        </Link>
        <Link
          href="/dashboard/analyze"
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center py-3 px-4 rounded-lg font-medium transition"
        >
          Analysoi uusi hakemus
        </Link>
      </div>
    </div>
  )
}
