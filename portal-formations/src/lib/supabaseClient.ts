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

console.log('Supabase client initialized with URL:', supabaseUrl)

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
    // Timeout pour les requêtes (optimisé pour performance)
    fetch: (url, options = {}) => {
      // Si un signal existe déjà dans les options, l'utiliser
      // Sinon, créer un nouveau AbortController pour le timeout
      const existingSignal = options.signal
      const controller = existingSignal ? null : new AbortController()
      const signal = existingSignal || controller?.signal
      
      // Timeout réduit à 10 secondes pour une réponse plus rapide
      // Seulement si on a créé notre propre controller
      let timeoutId: NodeJS.Timeout | null = null
      if (controller) {
        timeoutId = setTimeout(() => {
          controller.abort('Request timeout after 10 seconds')
        }, 10000)
      }
      
      return fetch(url, {
        ...options,
        signal,
      }).finally(() => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      })
    },
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
