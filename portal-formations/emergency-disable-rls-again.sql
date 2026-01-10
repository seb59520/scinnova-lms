-- Script d'URGENCE pour désactiver RLS à nouveau si vous n'avez plus accès
-- ⚠️ À utiliser uniquement si vous ne pouvez plus vous connecter

-- ============================================================================
-- ÉTAPE 1 : Désactiver RLS temporairement
-- ============================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 2 : Vérifier que RLS est désactivé
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  '✅ RLS désactivé - vous pouvez maintenant vous connecter' as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 3 : Tester l'accès
-- ============================================================================
SELECT 
  id,
  role,
  full_name,
  is_active,
  '✅ Profil accessible' as status
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ⚠️ IMPORTANT : Après avoir testé, exécutez fix-rls-access-issue.sql
-- pour réactiver RLS avec des politiques optimisées
-- ============================================================================
