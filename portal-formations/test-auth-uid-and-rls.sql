-- Script de test pour diagnostiquer pourquoi auth.uid() ne fonctionne pas
-- ou pourquoi les politiques RLS bloquent toujours l'accès

-- ============================================================================
-- ÉTAPE 1 : Vérifier que le profil existe vraiment
-- ============================================================================
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 2 : Tester auth.uid() (doit être exécuté en tant qu'utilisateur connecté)
-- ============================================================================

-- Cette requête devrait retourner votre user ID si vous êtes connecté
SELECT 
  auth.uid() as current_user_id,
  '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID as expected_user_id,
  CASE 
    WHEN auth.uid() = '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID THEN '✅ IDs correspondent'
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() est NULL - pas connecté'
    ELSE '❌ IDs ne correspondent pas'
  END as status;

-- ============================================================================
-- ÉTAPE 3 : Tester la requête avec les politiques RLS
-- ============================================================================

-- Cette requête devrait fonctionner si les politiques RLS sont correctes
SELECT 
  id,
  role,
  full_name,
  is_active,
  CASE 
    WHEN auth.uid() = id THEN '✅ Accès autorisé (propriétaire)'
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
-- ÉTAPE 5 : Solution de contournement - Désactiver temporairement RLS pour tester
-- ============================================================================

-- ATTENTION : Ne faites cela QUE pour tester, puis réactivez RLS !
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Test sans RLS (devrait fonctionner)
-- SELECT * FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- Réactiver RLS après le test
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 6 : Recréer une politique ULTRA SIMPLE pour garantir l'accès
-- ============================================================================

-- Supprimer toutes les politiques de lecture
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can always view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Créer une politique ULTRA SIMPLE sans aucune condition complexe
CREATE POLICY "Simple: users see own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- ============================================================================
-- ÉTAPE 7 : Vérifier que RLS est activé
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 8 : Test final
-- ============================================================================
SELECT 
  'Test final' as test,
  auth.uid() as current_auth_uid,
  (SELECT id FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as profile_id,
  CASE 
    WHEN auth.uid() = '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID THEN '✅ auth.uid() correspond'
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() est NULL'
    ELSE '❌ auth.uid() ne correspond pas'
  END as auth_status;
