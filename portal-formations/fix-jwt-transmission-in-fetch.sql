-- Script pour vérifier si le JWT est correctement transmis
-- Ce script ne peut pas tester directement le JWT depuis SQL Editor
-- Mais il peut vérifier si les politiques RLS fonctionnent correctement

-- ============================================================================
-- ÉTAPE 1 : Vérifier les politiques RLS actuelles
-- ============================================================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================================================
-- ÉTAPE 2 : Vérifier si RLS est activé
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 3 : Tester une requête directe (sans RLS, pour comparaison)
-- ============================================================================
-- Cette requête devrait fonctionner même avec RLS activé si auth.uid() fonctionne
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 4 : Vérifier les logs de Supabase (nécessite accès aux logs)
-- ============================================================================
-- Note: Les logs Supabase peuvent montrer si les requêtes arrivent avec ou sans JWT
-- Vérifiez dans le dashboard Supabase > Logs > API Logs
