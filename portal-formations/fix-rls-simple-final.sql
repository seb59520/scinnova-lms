-- Script FINAL pour résoudre définitivement les problèmes RLS
-- Solution ultra-simplifiée qui garantit l'accès au profil

-- ============================================================================
-- ÉTAPE 1 : Vérifier l'état actuel
-- ============================================================================
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 2 : Supprimer TOUTES les politiques existantes
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can always view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own active profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all" ON profiles;

-- ============================================================================
-- ÉTAPE 3 : Créer des politiques ULTRA SIMPLES (sans aucune complexité)
-- ============================================================================

-- Politique 1 : Lecture de son propre profil (SIMPLE - juste auth.uid() = id)
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
-- Version SIMPLE avec sous-requête directe (pas de fonction)
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
-- ÉTAPE 4 : S'assurer que les index existent
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_admin ON public.profiles(id) WHERE role = 'admin';

-- ============================================================================
-- ÉTAPE 5 : Analyser la table
-- ============================================================================
ANALYZE public.profiles;

-- ============================================================================
-- ÉTAPE 6 : Vérifier les politiques créées
-- ============================================================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- ÉTAPE 7 : Test de la requête (devrait être rapide maintenant)
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 8 : Résumé
-- ============================================================================
SELECT 
  'Politiques simplifiées créées' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policies_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'profiles' AND schemaname = 'public') as indexes_count,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;
