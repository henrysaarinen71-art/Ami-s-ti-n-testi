import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Yläpalkki */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo ja navigaatio */}
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">
                  Hakemusarviointi
                </h1>
              </Link>

              <div className="hidden md:flex space-x-6">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 font-medium transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/analyze"
                  className="text-gray-700 hover:text-indigo-600 font-medium transition"
                >
                  Analysoi hakemus
                </Link>
                <Link
                  href="/dashboard/chatbot"
                  className="text-gray-700 hover:text-indigo-600 font-medium transition"
                >
                  Chatbot
                </Link>
              </div>
            </div>

            {/* Käyttäjätiedot ja logout */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm text-gray-600">
                {user.email}
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Pääsisältö */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
