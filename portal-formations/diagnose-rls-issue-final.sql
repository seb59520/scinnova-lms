-- Script de diagnostic FINAL pour comprendre pourquoi le profil n'est pas récupéré
-- À exécuter dans Supabase SQL Editor en étant connecté

-- ============================================================================
-- ÉTAPE 1 : Vérifier que le profil existe
-- ============================================================================
SELECT 
  id,
  role,
  full_name,
  is_active,
  created_at
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 2 : Tester auth.uid() (doit être exécuté en tant qu'utilisateur connecté)
-- ============================================================================
SELECT 
  auth.uid() as current_auth_uid,
  '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID as expected_user_id,
  CASE 
    WHEN auth.uid() = '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID THEN '✅ IDs correspondent'
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() est NULL - pas connecté via Supabase'
    ELSE '❌ IDs ne correspondent pas'
  END as auth_status;

-- ============================================================================
-- ÉTAPE 3 : Tester la requête avec RLS (simule ce que fait l'application)
-- ============================================================================
SELECT 
  id,
  role,
  full_name,
  is_active,
  CASE 
    WHEN auth.uid() = id THEN '✅ Accès autorisé (propriétaire)'
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() est NULL'
    ELSE '❌ Accès refusé'
  END as access_status
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 4 : Vérifier les politiques RLS actuelles
-- ============================================================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- ÉTAPE 5 : Vérifier que RLS est activé
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 6 : Tester EXPLAIN pour voir le plan d'exécution
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 7 : Vérifier les index
-- ============================================================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles' 
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- ÉTAPE 8 : Solution de contournement TEMPORAIRE - Désactiver RLS pour tester
-- ============================================================================
-- ATTENTION : Ne faites cela QUE pour tester, puis réactivez RLS immédiatement !

-- Désactiver RLS temporairement
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Test sans RLS (devrait fonctionner)
-- SELECT * FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- RÉACTIVER RLS IMMÉDIATEMENT après le test
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 9 : Recréer une politique ULTRA SIMPLE si nécessaire
-- ============================================================================

-- Si auth.uid() est NULL dans le SQL Editor, c'est normal - le SQL Editor n'est pas authentifié
-- Les politiques RLS fonctionnent uniquement via l'API Supabase avec un JWT valide

-- Vérifier que la politique de lecture existe et est simple
SELECT 
  'Politique de lecture' as type,
  policyname,
  qual
FROM pg_policies
WHERE tablename = 'profiles' 
  AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================================================
-- ÉTAPE 10 : Résumé et diagnostic
-- ============================================================================
SELECT 
  'Diagnostic RLS' as test,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policies_count,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role_in_db,
  CASE 
    WHEN auth.uid() IS NULL THEN '⚠️ auth.uid() est NULL (normal dans SQL Editor, testez via l''API)'
    WHEN auth.uid() = '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID THEN '✅ auth.uid() correspond'
    ELSE '❌ auth.uid() ne correspond pas'
  END as auth_uid_status;
