-- Script d'URGENCE pour désactiver temporairement RLS et permettre la connexion
-- ⚠️ ATTENTION : Ce script désactive RLS temporairement pour permettre le diagnostic
-- ⚠️ RÉACTIVEZ RLS après avoir testé avec fix-profile-500-error.sql

-- ============================================================================
-- ÉTAPE 1 : Désactiver RLS temporairement
-- ============================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 2 : Vérifier que RLS est désactivé
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 3 : Tester la requête (devrait fonctionner maintenant)
-- ============================================================================
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 4 : Résumé
-- ============================================================================
SELECT 
  'RLS désactivé temporairement' as status,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;

-- ============================================================================
-- ⚠️ IMPORTANT : Après avoir testé, exécutez fix-profile-500-error.sql
-- pour réactiver RLS avec des politiques simples
-- ============================================================================
