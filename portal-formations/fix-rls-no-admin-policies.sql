-- Script pour corriger la récursion infinie en désactivant temporairement les politiques admin
-- Solution de contournement : seuls les utilisateurs peuvent accéder à leur propre profil
-- Les admins devront utiliser leur propre profil pour l'instant

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
-- ÉTAPE 2 : Créer UNIQUEMENT des politiques pour les utilisateurs (pas d'admin)
-- ============================================================================
-- Cela évite la récursion infinie car on ne fait pas de sous-requête sur profiles

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
-- NOTE : Pas de politiques admin pour éviter la récursion infinie
-- Les admins peuvent toujours accéder à leur propre profil via les politiques ci-dessus
-- Pour gérer d'autres profils, utilisez le service_role ou désactivez RLS temporairement
-- ============================================================================

-- ============================================================================
-- ÉTAPE 3 : Créer des index pour améliorer les performances
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_admin ON public.profiles(id) WHERE role = 'admin';

-- ============================================================================
-- ÉTAPE 4 : Analyser la table pour optimiser les statistiques
-- ============================================================================
ANALYZE public.profiles;

-- ============================================================================
-- ÉTAPE 5 : Vérifier le résultat
-- ============================================================================
SELECT 
  'RLS corrigé - politiques utilisateurs uniquement (pas de récursion)' as status,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as policies_count,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;
