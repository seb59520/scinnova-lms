import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables Supabase non configurées. La sauvegarde des analyses sera désactivée.');
  console.warn('Pour activer la sauvegarde, ajoutez dans .env :');
  console.warn('  VITE_SUPABASE_URL=https://votre-projet.supabase.co');
  console.warn('  VITE_SUPABASE_ANON_KEY=votre_anon_key');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;


