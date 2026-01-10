-- Script pour corriger le problème d'accès après réactivation de RLS
-- Le problème vient probablement des politiques admin qui nécessitent une sous-requête

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
-- ÉTAPE 2 : Vérifier les politiques actuelles
-- ============================================================================
SELECT 
  policyname,
  cmd as operation,
  qual as condition
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================================================
-- ÉTAPE 3 : Supprimer toutes les politiques existantes
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
-- ÉTAPE 4 : Créer des politiques ULTRA SIMPLES (sans sous-requêtes)
-- ============================================================================

-- Politique 1 : Les utilisateurs peuvent voir leur propre profil
-- C'est la plus importante et la plus simple
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
-- ÉTAPE 5 : Pour les admins, créer une fonction helper plus performante
-- ============================================================================
-- Au lieu d'une sous-requête dans la politique, on crée une fonction
-- Supprimer l'ancienne fonction si elle existe avec une signature différente
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Créer la fonction avec une signature explicite
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'admin'
    LIMIT 1
  );
$$;

-- Politique 4 : Les admins peuvent voir tous les profils (utilise la fonction)
CREATE POLICY "profile_select_admin" ON profiles
  FOR SELECT 
  USING (public.is_admin());

-- Politique 5 : Les admins peuvent modifier tous les profils (utilise la fonction)
CREATE POLICY "profile_update_admin" ON profiles
  FOR UPDATE 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- ÉTAPE 6 : Créer des index pour améliorer les performances
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_admin ON public.profiles(id) WHERE role = 'admin';

-- ============================================================================
-- ÉTAPE 7 : Analyser la table pour optimiser les statistiques
-- ============================================================================
ANALYZE public.profiles;

-- ============================================================================
-- ÉTAPE 8 : Vérifier le résultat
-- ============================================================================
SELECT 
  'RLS corrigé avec politiques optimisées' as status,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as policies_count,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;

-- ============================================================================
-- ÉTAPE 9 : Tester l'accès (doit fonctionner maintenant)
-- ============================================================================
-- Cette requête simule ce que fait l'application
-- Elle devrait retourner votre profil si vous êtes connecté
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';
