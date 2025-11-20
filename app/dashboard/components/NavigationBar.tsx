'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import WelcomeModal from './WelcomeModal'
import LogoutButton from '../LogoutButton'

interface NavigationBarProps {
  userEmail: string
}

export default function NavigationBar({ userEmail }: NavigationBarProps) {
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Tarkista onko käyttäjä nähnyt tervetuloa-viestin
    const hasSeenWelcome = localStorage.getItem('welcome_modal_seen')
    if (!hasSeenWelcome) {
      setShowWelcome(true)
    }
  }, [])

  return (
    <>
      {/* WelcomeModal */}
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />

      {/* Navigaatiopalkki */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo ja navigaatio */}
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-indigo-600">
                  Hakemusarviointi
                </h1>
                <span
                  className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                  title="Prototyyppi - ei tuotantokäytössä"
                >
                  PROTO
                </span>
              </Link>

              <div className="hidden md:flex space-x-6">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 font-medium transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/hakemukset"
                  className="text-gray-700 hover:text-indigo-600 font-medium transition"
                >
                  Hakemukset
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

            {/* Käyttäjätiedot ja toiminnot */}
            <div className="flex items-center space-x-3">
              {/* Tietoja-nappi */}
              <button
                onClick={() => setShowWelcome(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition text-sm"
                title="Näytä järjestelmän tiedot"
              >
                <span className="text-base">ℹ️</span>
                <span className="hidden sm:inline">Tietoja</span>
              </button>

              {/* Email */}
              <div className="hidden sm:block text-sm text-gray-600">
                {userEmail}
              </div>

              {/* Logout */}
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
