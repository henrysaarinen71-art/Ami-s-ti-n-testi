import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Lataa .env.local tiedosto
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  const email = 'ami1@test.com'
  const password = 'Ami1234!_1'

  console.log('Luodaan testikäyttäjä...')
  console.log('Sähköposti:', email)

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
      }
    })

    if (error) {
      console.error('Virhe käyttäjän luomisessa:', error.message)
      process.exit(1)
    }

    console.log('✓ Testikäyttäjä luotu onnistuneesti!')
    console.log('User ID:', data.user?.id)
    console.log('\nVoit nyt kirjautua sisään:')
    console.log('Sähköposti: ami1@test.com')
    console.log('Salasana: Ami1234!_1')
  } catch (error) {
    console.error('Odottamaton virhe:', error)
    process.exit(1)
  }
}

createTestUser()
