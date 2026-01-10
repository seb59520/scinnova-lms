-- Script pour corriger la récursion infinie dans les politiques RLS
-- Le problème : les politiques admin font une sous-requête sur profiles, ce qui déclenche à nouveau RLS

-- ============================================================================
-- ÉTAPE 1 : Supprimer toutes les politiques existantes
-- ============================================================================
DROP POLICY IF EXISTS "profile_select_own" ON profiles;
DROP POLICY IF EXISTS "profile_update_own" ON profiles;
DROP POLICY IF EXISTS "profile_insert_own" ON profiles;
DROP POLICY IF EXISTS "profile_select_admin" ON profiles;
DROP POLICY IF EXISTS "profile_update_admin" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- ============================================================================
-- ÉTAPE 2 : Créer des politiques SIMPLES sans récursion
-- ============================================================================
-- IMPORTANT : Les politiques admin ne doivent PAS faire de sous-requête sur profiles
-- car cela crée une récursion infinie

-- Politique 1 : Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "profile_select_own" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Politique 2 : Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "profile_update_own" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique 3 : Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "profile_insert_own" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ÉTAPE 3 : Pour les admins, utiliser la fonction is_admin() existante
-- ============================================================================
-- La fonction is_admin() existe déjà et utilise SECURITY DEFINER pour bypasser RLS
-- Elle ne crée donc pas de récursion

-- Politique 4 : Les admins peuvent voir tous les profils
CREATE POLICY "profile_select_admin" ON profiles
  FOR SELECT 
  USING (public.is_admin());

-- Politique 5 : Les admins peuvent modifier tous les profils
CREATE POLICY "profile_update_admin" ON profiles
  FOR UPDATE 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- ÉTAPE 4 : Créer des index pour améliorer les performances
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_admin ON public.profiles(id) WHERE role = 'admin';

-- ============================================================================
-- ÉTAPE 5 : Analyser la table pour optimiser les statistiques
-- ============================================================================
ANALYZE public.profiles;

-- ============================================================================
-- ÉTAPE 6 : Vérifier le résultat
-- ============================================================================
SELECT 
  'RLS corrigé - récursion infinie résolue' as status,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as policies_count,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;

-- ============================================================================
-- ÉTAPE 7 : Lister les politiques créées
-- ============================================================================
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NULL THEN 'Pas de condition'
    ELSE substring(qual, 1, 80) || '...'
  END as condition_preview
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY cmd, policyname;
