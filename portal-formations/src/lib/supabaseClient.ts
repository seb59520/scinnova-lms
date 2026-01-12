import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

if (supabaseAnonKey === 'your-anon-key-here' || supabaseAnonKey.includes('your-')) {
  throw new Error('VITE_SUPABASE_ANON_KEY appears to be a placeholder')
}

/**
 * Client Supabase configuré selon les recommandations officielles
 * @see https://supabase.com/docs/guides/auth/quickstarts/react
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

export type SupabaseClient = typeof supabase
