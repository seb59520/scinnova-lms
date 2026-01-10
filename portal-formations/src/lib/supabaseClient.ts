import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérification plus détaillée des variables d'environnement
if (!supabaseUrl) {
  const error = 'Missing VITE_SUPABASE_URL environment variable. Please set it in your .env file or deployment platform.'
  console.error(error)
  throw new Error(error)
}

if (!supabaseAnonKey) {
  const error = 'Missing VITE_SUPABASE_ANON_KEY environment variable. Please set it in your .env file or deployment platform.'
  console.error(error)
  throw new Error(error)
}

// Vérifier que les valeurs ne sont pas des placeholders
if (supabaseAnonKey === 'your-anon-key-here' || supabaseAnonKey.includes('your-')) {
  const error = 'VITE_SUPABASE_ANON_KEY appears to be a placeholder. Please set the actual Supabase anon key.'
  console.error(error)
  throw new Error(error)
}

console.log('✅ Supabase client initialized')
console.log('🔍 Supabase URL:', supabaseUrl)
console.log('🔍 Supabase URL valid:', supabaseUrl?.startsWith('http'))
console.log('🔍 Anon key present:', !!supabaseAnonKey && supabaseAnonKey.length > 0)
console.log('🔍 Anon key length:', supabaseAnonKey?.length || 0)

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
    // Désactiver les logs verbeux par défaut
    // Activer uniquement si VITE_SUPABASE_DEBUG=true dans .env
    debug: import.meta.env.VITE_SUPABASE_DEBUG === 'true',
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
    // NOTE: Pas de fetch override custom - laisser Supabase gérer les timeouts
    // Cela évite les plantages et conflits avec le mécanisme interne
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Écouter les erreurs de refresh token (logs uniquement si debug activé)
supabase.auth.onAuthStateChange((event, session) => {
  if (import.meta.env.VITE_SUPABASE_DEBUG === 'true') {
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed successfully')
    } else if (event === 'SIGNED_OUT') {
      console.log('User signed out')
    } else if (event === 'USER_UPDATED') {
      console.log('User updated')
    }
  }
})

// Types helper
export type SupabaseClient = typeof supabase
