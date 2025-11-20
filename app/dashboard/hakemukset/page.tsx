'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Hakemus {
  id: string
  hakemus_teksti: string
  haettava_summa: number
  kuvaus: string | null
  arviointi: {
    arvosana: number
    suositus: string
  }
  created_at: string
}

export default function HakemuksetPage() {
  const [hakemukset, setHakemukset] = useState<Hakemus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHakemukset()
  }, [])

  const fetchHakemukset = async () => {
    try {
      const response = await fetch('/api/hakemukset')
      if (!response.ok) {
        throw new Error('Virhe hakemusten haussa')
      }
      const data = await response.json()
      setHakemukset(data.hakemukset || [])
    } catch (err: any) {
      setError(err.message || 'Virhe hakemusten haussa')
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

  const getSuositusColor = (suositus: string) => {
    if (suositus === 'Myönnettävä') return 'bg-green-100 text-green-800'
    if (suositus === 'Harkittava') return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getArvosanaColor = (arvosana: number) => {
    if (arvosana >= 7) return 'text-green-600 font-bold'
    if (arvosana >= 5) return 'text-yellow-600 font-bold'
    return 'text-red-600 font-bold'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Ladataan hakemuksia...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Otsikko */}
      <div>
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mb-4"
        >
          ← Takaisin dashboardiin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hakemukset</h1>
        <p className="text-gray-600">Kaikki analysoidut hakemukset</p>
      </div>

      {/* Tilastot */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-600">Yhteensä: </span>
            <span className="font-bold text-lg">{hakemukset.length} hakemusta</span>
          </div>
          <Link
            href="/dashboard/analyze"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Analysoi uusi hakemus
          </Link>
        </div>
      </div>

      {/* Hakemuslista */}
      {hakemukset.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Ei vielä hakemuksia
          </h3>
          <p className="text-gray-500 mb-6">Aloita analysoimalla ensimmäinen hakemus</p>
          <Link
            href="/dashboard/analyze"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Analysoi ensimmäinen hakemus
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop-taulukko */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Päivämäärä
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kuvaus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arvosana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suositus
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hakemukset.map((hakemus) => (
                  <tr
                    key={hakemus.id}
                    className="hover:bg-gray-50 cursor-pointer transition"
                    onClick={() =>
                      (window.location.href = `/dashboard/hakemukset/${hakemus.id}`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(hakemus.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md">
                        {hakemus.kuvaus ||
                          hakemus.hakemus_teksti.substring(0, 80) + '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {hakemus.haettava_summa.toLocaleString('fi-FI')} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={getArvosanaColor(hakemus.arviointi.arvosana)}>
                        {hakemus.arviointi.arvosana}/10
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getSuositusColor(
                          hakemus.arviointi.suositus
                        )}`}
                      >
                        {hakemus.arviointi.suositus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile-korttinäkymä */}
          <div className="md:hidden divide-y divide-gray-200">
            {hakemukset.map((hakemus) => (
              <Link
                key={hakemus.id}
                href={`/dashboard/hakemukset/${hakemus.id}`}
                className="block p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-600">
                    {formatDate(hakemus.created_at)}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getSuositusColor(
                      hakemus.arviointi.suositus
                    )}`}
                  >
                    {hakemus.arviointi.suositus}
                  </span>
                </div>
                <div className="font-medium text-gray-900 mb-2">
                  {hakemus.kuvaus || hakemus.hakemus_teksti.substring(0, 80) + '...'}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    Summa: <span className="font-semibold">{hakemus.haettava_summa.toLocaleString('fi-FI')} €</span>
                  </span>
                  <span className="text-gray-600">
                    Arvosana:{' '}
                    <span className={getArvosanaColor(hakemus.arviointi.arvosana)}>
                      {hakemus.arviointi.arvosana}/10
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
