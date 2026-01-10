-- Script pour vérifier l'état actuel de RLS et documenter la configuration qui fonctionne
-- À exécuter pour vérifier que tout est correct

-- ============================================================================
-- ÉTAPE 1 : Vérifier si RLS est activé
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS activé'
    ELSE '⚠️ RLS désactivé - À réactiver avec des politiques simples'
  END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 2 : Lister les politiques RLS actives
-- ============================================================================
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NULL THEN 'Pas de condition (toujours autorisé)'
    ELSE 'Condition: ' || substring(qual, 1, 100)
  END as condition_preview,
  permissive
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================================================
-- ÉTAPE 3 : Vérifier que le profil est accessible
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
-- ÉTAPE 4 : Résumé de la configuration
-- ============================================================================
SELECT 
  'Configuration actuelle' as summary,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as policies_count,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;
