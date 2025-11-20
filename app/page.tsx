import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hakemusarviointisovellus
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Hankehaakemusten automaattinen arviointi Claude AI:n avulla
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start text-left bg-indigo-50 rounded-lg p-4">
              <div className="flex-shrink-0 mr-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Chatbot-käyttöliittymä</h3>
                <p className="text-gray-600 text-sm">Lähetä hakemus helposti keskustelun kautta</p>
              </div>
            </div>

            <div className="flex items-start text-left bg-indigo-50 rounded-lg p-4">
              <div className="flex-shrink-0 mr-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI-pohjainen analyysi</h3>
                <p className="text-gray-600 text-sm">Claude analysoi hakemuksen työllisyystilastojen perusteella</p>
              </div>
            </div>

            <div className="flex items-start text-left bg-indigo-50 rounded-lg p-4">
              <div className="flex-shrink-0 mr-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Hakemushistoria</h3>
                <p className="text-gray-600 text-sm">Tarkastele aiempia hakemuksia ja arvioita</p>
              </div>
            </div>
          </div>

          {user ? (
            <Link
              href="/dashboard"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Siirry Dashboard-sivulle
            </Link>
          ) : (
            <div className="space-x-4">
              <Link
                href="/login"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Kirjaudu sisään
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
