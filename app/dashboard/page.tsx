import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigaatio */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Hakemusarviointisovellus
              </h1>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Pääsisältö */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Tervetuloa Dashboard-sivulle!
            </h2>
            <p className="text-gray-600">
              Olet kirjautunut sisään onnistuneesti.
            </p>
          </div>

          {/* Käyttäjätiedot */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Käyttäjätiedot
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="font-medium text-gray-700 w-32">Sähköposti:</span>
                <span className="text-gray-900">{user.email}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-gray-700 w-32">Käyttäjä ID:</span>
                <span className="text-gray-600 font-mono text-sm">{user.id}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-gray-700 w-32">Luotu:</span>
                <span className="text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('fi-FI', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Toiminnot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <h4 className="font-semibold text-gray-900 mb-2">Chatbot</h4>
              <p className="text-gray-600 text-sm mb-4">
                Lähetä hankehakemus arvioitavaksi Claude AI:lle
              </p>
              <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                Tulossa pian →
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <h4 className="font-semibold text-gray-900 mb-2">Hakemushistoria</h4>
              <p className="text-gray-600 text-sm mb-4">
                Tarkastele aiempia hakemuksiasi ja arvioita
              </p>
              <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                Tulossa pian →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
