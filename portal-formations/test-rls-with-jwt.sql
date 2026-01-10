-- Script pour tester RLS avec le JWT de l'utilisateur
-- Ce script vérifie si les politiques RLS fonctionnent correctement

-- ============================================================================
-- ÉTAPE 1 : Vérifier l'état actuel de RLS
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 2 : Lister toutes les politiques RLS sur profiles
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================================================
-- ÉTAPE 3 : Tester si auth.uid() fonctionne (sera NULL dans SQL Editor)
-- ============================================================================
-- Note: auth.uid() ne fonctionne que dans le contexte d'une requête API avec JWT
SELECT 
  auth.uid() as current_auth_uid,
  '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID as expected_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '⚠️ auth.uid() est NULL (normal dans SQL Editor - testez via l''API avec JWT)'
    WHEN auth.uid() = '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID THEN '✅ auth.uid() fonctionne'
    ELSE '❌ auth.uid() retourne un ID différent'
  END as auth_status;

-- ============================================================================
-- ÉTAPE 4 : Simuler une requête SELECT avec les politiques RLS
-- ============================================================================
-- Cette requête simule ce que RLS ferait pour SELECT
SELECT 
  p.id,
  p.role,
  p.full_name,
  p.is_active,
  -- Simuler la condition de la politique SELECT
  CASE 
    WHEN p.id = '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID THEN '✅ Politique "profile_select_own" devrait permettre'
    WHEN EXISTS (
      SELECT 1 FROM profiles p2 
      WHERE p2.id = '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID 
      AND p2.role = 'admin'
    ) THEN '✅ Politique "profile_select_admin" devrait permettre'
    ELSE '❌ Aucune politique ne devrait permettre'
  END as rls_prediction
FROM public.profiles p
WHERE p.id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 5 : Vérifier les index sur profiles (pour performance)
-- ============================================================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY indexname;

-- ============================================================================
-- ÉTAPE 6 : Résumé des politiques RLS actives
-- ============================================================================
SELECT 
  'Politiques RLS actives' as summary,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles';
