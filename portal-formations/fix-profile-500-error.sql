-- Script pour diagnostiquer et corriger l'erreur 500 sur la table profiles
-- L'erreur 500 indique généralement un problème avec les politiques RLS

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
-- ÉTAPE 2 : Vérifier les politiques RLS actuelles
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
-- ÉTAPE 3 : Vérifier que RLS est activé
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 4 : Tester la requête avec EXPLAIN pour voir l'erreur
-- ============================================================================
-- Cette requête simule ce que fait l'application
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT *
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 5 : S'assurer que RLS est activé avant de créer les politiques
-- ============================================================================
-- Si RLS a été désactivé temporairement, le réactiver
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 6 : Recréer des politiques ULTRA SIMPLES
-- ============================================================================

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "profile_select_own" ON profiles;
DROP POLICY IF EXISTS "profile_update_own" ON profiles;
DROP POLICY IF EXISTS "profile_insert_own" ON profiles;
DROP POLICY IF EXISTS "profile_select_admin" ON profiles;
DROP POLICY IF EXISTS "profile_update_admin" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Politique 1 : Lecture de son propre profil (ULTRA SIMPLE)
CREATE POLICY "profile_select_own" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Politique 2 : Modification de son propre profil
CREATE POLICY "profile_update_own" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique 3 : Insertion de son propre profil
CREATE POLICY "profile_insert_own" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Politique 4 : Les admins peuvent voir tous les profils
-- Version SIMPLE sans sous-requête complexe
CREATE POLICY "profile_select_admin" ON profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'admin'
      LIMIT 1
    )
  );

-- Politique 5 : Les admins peuvent modifier tous les profils
CREATE POLICY "profile_update_admin" ON profiles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'admin'
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'admin'
      LIMIT 1
    )
  );

-- ============================================================================
-- ÉTAPE 7 : Créer des index pour améliorer les performances
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_admin ON public.profiles(id) WHERE role = 'admin';

-- ============================================================================
-- ÉTAPE 8 : Analyser la table
-- ============================================================================
ANALYZE public.profiles;

-- ============================================================================
-- ÉTAPE 9 : Vérifier les politiques créées
-- ============================================================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- ÉTAPE 10 : Test final
-- ============================================================================
SELECT 
  'Politiques RLS simplifiées' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policies_count,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;
