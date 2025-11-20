'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

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
  const searchParams = useSearchParams()
  const [hakemukset, setHakemukset] = useState<Hakemus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchHakemukset()

    // Näytä onnistumisviesti jos tultiin poiston jälkeen
    if (searchParams.get('deleted') === 'true') {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
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

  const handleDelete = async (id: string) => {
    console.log('[FRONTEND] handleDelete called with id:', id)
    setIsDeleting(true)
    try {
      console.log('[FRONTEND] Sending DELETE request to:', `/api/hakemukset/${id}`)
      const response = await fetch(`/api/hakemukset/${id}`, {
        method: 'DELETE',
      })

      console.log('[FRONTEND] Response status:', response.status)
      console.log('[FRONTEND] Response ok:', response.ok)

      const data = await response.json()
      console.log('[FRONTEND] Response data:', data)

      if (!response.ok) {
        console.error('[FRONTEND] Delete failed:', data)
        throw new Error(data.error || 'Virhe hakemuksen poistamisessa')
      }

      console.log('[FRONTEND] Delete successful, updating list')
      // Päivitä lista poistamalla poistettu hakemus
      setHakemukset(hakemukset.filter((h) => h.id !== id))
      setDeleteId(null)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    } catch (err: any) {
      console.error('[FRONTEND] Delete error:', err)
      alert(err.message || 'Virhe hakemuksen poistamisessa')
    } finally {
      setIsDeleting(false)
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
      {/* Poiston vahvistus dialogi */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Vahvista poisto</h3>
            <p className="text-gray-700 mb-6">
              Haluatko varmasti poistaa tämän hakemuksen? Tätä toimintoa ei voi perua.
              <br />
              <span className="text-xs text-gray-500">ID: {deleteId}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log('[FRONTEND] Cancel button clicked')
                  setDeleteId(null)
                }}
                disabled={isDeleting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition disabled:opacity-50"
              >
                Peruuta
              </button>
              <button
                onClick={() => {
                  console.log('[FRONTEND] Confirm delete button clicked for id:', deleteId)
                  handleDelete(deleteId)
                }}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition disabled:opacity-50"
              >
                {isDeleting ? 'Poistetaan...' : 'Poista'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onnistumisviesti */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-center justify-between">
          <span>✓ Hakemus poistettu onnistuneesti</span>
          <button
            onClick={() => setShowSuccess(false)}
            className="text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      )}

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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toiminnot
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hakemukset.map((hakemus) => (
                  <tr key={hakemus.id} className="hover:bg-gray-50 transition">
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/dashboard/hakemukset/${hakemus.id}`)
                      }
                    >
                      {formatDate(hakemus.created_at)}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-900 cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/dashboard/hakemukset/${hakemus.id}`)
                      }
                    >
                      <div className="max-w-md">
                        {hakemus.kuvaus ||
                          hakemus.hakemus_teksti.substring(0, 80) + '...'}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/dashboard/hakemukset/${hakemus.id}`)
                      }
                    >
                      {hakemus.haettava_summa.toLocaleString('fi-FI')} €
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/dashboard/hakemukset/${hakemus.id}`)
                      }
                    >
                      <span className={getArvosanaColor(hakemus.arviointi.arvosana)}>
                        {hakemus.arviointi.arvosana}/10
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/dashboard/hakemukset/${hakemus.id}`)
                      }
                    >
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getSuositusColor(
                          hakemus.arviointi.suositus
                        )}`}
                      >
                        {hakemus.arviointi.suositus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          console.log('[FRONTEND] Delete button clicked for id:', hakemus.id)
                          e.stopPropagation()
                          setDeleteId(hakemus.id)
                          console.log('[FRONTEND] deleteId state set to:', hakemus.id)
                        }}
                        className="text-red-600 hover:text-red-800 text-lg transition"
                        title="Poista hakemus"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile-korttinäkymä */}
          <div className="md:hidden divide-y divide-gray-200">
            {hakemukset.map((hakemus) => (
              <div key={hakemus.id} className="relative p-4 hover:bg-gray-50 transition">
                <Link href={`/dashboard/hakemukset/${hakemus.id}`} className="block">
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
                <button
                  onClick={(e) => {
                    console.log('[FRONTEND MOBILE] Delete button clicked for id:', hakemus.id)
                    e.preventDefault()
                    setDeleteId(hakemus.id)
                    console.log('[FRONTEND MOBILE] deleteId state set to:', hakemus.id)
                  }}
                  className="absolute top-4 right-4 text-red-600 hover:text-red-800 text-lg"
                  title="Poista hakemus"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
