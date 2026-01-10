-- Script FINAL pour corriger RLS sans récursion infinie
-- Solution : Politiques ultra-simples sans aucune sous-requête sur profiles

-- ============================================================================
-- ÉTAPE 1 : Désactiver RLS temporairement pour pouvoir corriger
-- ============================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 2 : Supprimer TOUTES les politiques existantes
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
-- ÉTAPE 3 : Réactiver RLS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 4 : Créer UNIQUEMENT des politiques utilisateurs (SANS politiques admin)
-- ============================================================================
-- IMPORTANT : Pas de politiques admin pour éviter toute récursion
-- Les admins peuvent accéder à leur propre profil comme n'importe quel utilisateur

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
-- NOTE IMPORTANTE :
-- - Pas de politiques admin pour éviter la récursion infinie
-- - Chaque utilisateur (y compris les admins) peut accéder à son propre profil
-- - Pour gérer d'autres profils en tant qu'admin, utilisez le service_role
--   ou désactivez RLS temporairement via SQL Editor
-- ============================================================================

-- ============================================================================
-- ÉTAPE 5 : Créer des index pour améliorer les performances
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_admin ON public.profiles(id) WHERE role = 'admin';

-- ============================================================================
-- ÉTAPE 6 : Analyser la table pour optimiser les statistiques
-- ============================================================================
ANALYZE public.profiles;

-- ============================================================================
-- ÉTAPE 7 : Vérifier le résultat
-- ============================================================================
SELECT 
  'RLS activé avec politiques utilisateurs uniquement (pas de récursion)' as status,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as policies_count,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;

-- ============================================================================
-- ÉTAPE 8 : Tester l'accès
-- ============================================================================
-- Cette requête devrait fonctionner maintenant (si vous êtes connecté)
SELECT 
  id,
  role,
  full_name,
  is_active,
  '✅ Profil accessible' as status
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';
