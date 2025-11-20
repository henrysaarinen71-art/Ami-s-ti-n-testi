'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  count: number
  total_summa: number
  avg_arvosana: number
}

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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ count: 0, total_summa: 0, avg_arvosana: 0 })
  const [recentApplications, setRecentApplications] = useState<Hakemus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Hae tilastot
      const statsRes = await fetch('/api/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      // Hae viimeisimmät hakemukset
      const appsRes = await fetch('/api/hakemukset?limit=5')
      if (appsRes.ok) {
        const appsData = await appsRes.json()
        setRecentApplications(appsData.hakemukset || [])
      }
    } catch (error) {
      console.error('Virhe datan haussa:', error)
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
    })
  }

  const getSuositusColor = (suositus: string) => {
    if (suositus === 'Myönnettävä') return 'text-green-600 bg-green-100'
    if (suositus === 'Harkittava') return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="space-y-8">
      {/* Otsikko */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Tervetuloa hakemusarviointisovellukseen</p>
      </div>

      {/* Tilastoboksit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Haettu summa */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Haettu summa yhteensä
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : `${stats.total_summa.toLocaleString('fi-FI')} €`}
              </p>
            </div>
            <div className="bg-indigo-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Hakemusten määrä */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Hakemusten määrä
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : `${stats.count} kpl`}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-green-600"
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
          </div>
        </div>

        {/* Keskiarvoarvosana */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Keskiarvoarvosana
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : `${stats.avg_arvosana.toFixed(1)}/10`}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Viimeisimmät hakemukset */}
      {!loading && recentApplications.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Viimeisimmät hakemukset</h3>
            <Link
              href="/dashboard/hakemukset"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Näytä kaikki →
            </Link>
          </div>

          <div className="space-y-3">
            {recentApplications.map((app) => (
              <Link
                key={app.id}
                href={`/dashboard/hakemukset/${app.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">
                      {formatDate(app.created_at)}
                    </div>
                    <div className="font-medium text-gray-900 mb-2">
                      {app.kuvaus ||
                        app.hakemus_teksti.substring(0, 100) + '...'}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Summa: <span className="font-semibold">{app.haettava_summa.toLocaleString('fi-FI')} €</span>
                      </span>
                      <span className="text-gray-600">
                        Arvosana: <span className="font-semibold">{app.arviointi.arvosana}/10</span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getSuositusColor(
                        app.arviointi.suositus
                      )}`}
                    >
                      {app.arviointi.suositus}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Call-to-action boksi */}
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {stats.count === 0
                ? 'Aloita analysoimalla ensimmäinen hakemus'
                : 'Analysoi uusi hakemus'}
            </h3>
            <p className="text-gray-600 mb-6">
              Käytä Claude AI:ta arvioimaan hankehakemus automaattisesti
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/dashboard/analyze"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Analysoi hakemus
            </Link>
            <Link
              href="/dashboard/chatbot"
              className="block w-full bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-3 px-6 rounded-lg border-2 border-indigo-600 transition"
            >
              Avaa Chatbot
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
