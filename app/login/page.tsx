'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isLogin) {
        // Kirjautuminen
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        setMessage({ type: 'success', text: 'Kirjautuminen onnistui!' })
        router.push('/dashboard')
        router.refresh()
      } else {
        // Rekisteröityminen
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        setMessage({
          type: 'success',
          text: 'Rekisteröityminen onnistui! Tarkista sähköpostisi vahvistuslinkin saamiseksi.'
        })
        setEmail('')
        setPassword('')
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Jokin meni pieleen. Yritä uudelleen.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Otsikko */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hakemusarviointisovellus
            </h1>
            <p className="text-gray-600">
              {isLogin ? 'Kirjaudu sisään jatkaaksesi' : 'Luo uusi tili'}
            </p>
          </div>

          {/* Lomake */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Sähköpostiosoite
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="nimi@esimerkki.fi"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Salasana
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Vähintään 6 merkkiä"
              />
            </div>

            {/* Virheilmoitus / Onnistumisviesti */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Submit-nappi */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ladataan...' : isLogin ? 'Kirjaudu sisään' : 'Rekisteröidy'}
            </button>
          </form>

          {/* Vaihda kirjautumisen ja rekisteröitymisen välillä */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setMessage(null)
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium transition"
            >
              {isLogin
                ? 'Eikö sinulla ole tiliä? Rekisteröidy tästä'
                : 'Onko sinulla jo tili? Kirjaudu sisään'}
            </button>
          </div>
        </div>

        {/* Info-teksti */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Hankehaakemusten automaattinen arviointi Claude AI:lla</p>
        </div>
      </div>
    </div>
  )
}
