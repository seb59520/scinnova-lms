-- Script de diagnostic pour identifier pourquoi le profil n'est pas accessible
-- Le profil existe mais l'application ne peut pas le récupérer

-- ============================================================================
-- ÉTAPE 1 : Vérifier que le profil existe
-- ============================================================================
SELECT 
  id,
  role,
  full_name,
  is_active,
  created_at,
  updated_at
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 2 : Vérifier les politiques RLS et tester l'accès
-- ============================================================================

-- Lister toutes les politiques pour profiles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- ÉTAPE 3 : Tester si auth.uid() fonctionne correctement
-- ============================================================================

-- Cette requête devrait retourner votre user ID si vous êtes connecté
SELECT auth.uid() as current_user_id;

-- ============================================================================
-- ÉTAPE 4 : Tester l'accès au profil avec les politiques RLS
-- ============================================================================

-- Cette requête simule ce que fait l'application
-- Elle devrait retourner le profil si les politiques RLS le permettent
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 5 : Vérifier si is_active bloque l'accès
-- ============================================================================

-- Tester avec différentes valeurs de is_active
SELECT 
  id,
  role,
  is_active,
  CASE 
    WHEN is_active IS NULL THEN 'NULL (devrait être accessible)'
    WHEN is_active = true THEN 'true (accessible)'
    WHEN is_active = false THEN 'false (peut être bloqué)'
  END as access_status
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 6 : Vérifier la fonction is_admin() qui pourrait causer des problèmes
-- ============================================================================

-- Tester la fonction is_admin
SELECT 
  '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID as user_id,
  public.is_admin('25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID) as is_admin_result;

-- Vérifier la définition de la fonction
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'is_admin';

-- ============================================================================
-- ÉTAPE 7 : Corriger les problèmes potentiels
-- ============================================================================

-- Option A : S'assurer que is_active est NULL ou true
UPDATE public.profiles
SET is_active = NULL
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070' AND is_active = false;

-- Option B : Mettre is_active à true
UPDATE public.profiles
SET is_active = true
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- Option C : Optimiser la fonction is_admin pour éviter les problèmes de performance
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérification directe avec index (plus rapide)
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = user_id 
      AND role = 'admin'
      AND (is_active IS NULL OR is_active = true)
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ÉTAPE 8 : Vérifier les index pour améliorer les performances
-- ============================================================================

-- Vérifier les index existants sur profiles
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- Créer un index sur (id, role) si nécessaire pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_id_role_active 
ON public.profiles(id, role) 
WHERE (is_active IS NULL OR is_active = true);

-- ============================================================================
-- ÉTAPE 9 : Vérifier que RLS est bien configuré
-- ============================================================================

-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 10 : Recréer la politique de lecture si nécessaire
-- ============================================================================

-- S'assurer que la politique permet bien la lecture de son propre profil
-- même si is_active est false ou NULL
DROP POLICY IF EXISTS "Users can always view their own profile" ON profiles;

CREATE POLICY "Users can always view their own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Cette politique garantit que l'utilisateur peut TOUJOURS voir son propre profil
-- indépendamment de is_active

-- ============================================================================
-- ÉTAPE 11 : Test final
-- ============================================================================

-- Vérifier que le profil est maintenant accessible
SELECT 
  'Test final' as test,
  id,
  role,
  full_name,
  is_active,
  CASE 
    WHEN auth.uid() = id THEN '✅ Accès autorisé (propriétaire)'
    WHEN public.is_admin(auth.uid()) THEN '✅ Accès autorisé (admin)'
    ELSE '❌ Accès refusé'
  END as access_status
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 12 : Résumé des vérifications
-- ============================================================================
SELECT 
  'Résumé' as section,
  (SELECT COUNT(*) FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as profile_exists,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as profile_role,
  (SELECT is_active FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as profile_is_active,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'SELECT') as select_policies_count,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled;
