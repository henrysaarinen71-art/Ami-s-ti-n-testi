import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, these might not be available
  // Return a stub client that will fail gracefully
  if (!url || !key) {
    console.warn('[Supabase Client] Missing credentials during build')
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  return createBrowserClient(url, key)
}
