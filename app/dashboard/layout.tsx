import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavigationBar from './components/NavigationBar'

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
      {/* Navigaatiopalkki */}
      <NavigationBar userEmail={user.email || ''} />

      {/* Pääsisältö */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
