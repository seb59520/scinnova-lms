-- Script pour corriger les problèmes de performance RLS qui causent des timeouts
-- Le profil existe mais les requêtes timeout à cause de politiques RLS lentes

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
-- ÉTAPE 2 : Optimiser la fonction is_admin() pour éviter les problèmes de performance
-- ============================================================================

-- Version ultra-optimisée de is_admin() sans récursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérification directe avec index, sans vérifier is_active
  -- pour permettre aux admins désactivés d'être toujours reconnus
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = user_id 
      AND role = 'admin'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ÉTAPE 3 : Simplifier les politiques RLS pour améliorer les performances
-- ============================================================================

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can always view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own active profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Recréer des politiques simples et performantes

-- 1. Les utilisateurs peuvent TOUJOURS voir leur propre profil
-- (indépendamment de is_active pour permettre la réactivation)
CREATE POLICY "Users can always view their own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- 2. Les utilisateurs peuvent modifier leur propre profil si actif
CREATE POLICY "Users can update their own active profile" ON profiles
  FOR UPDATE 
  USING (
    auth.uid() = id 
    AND (is_active IS NULL OR is_active = true)
  )
  WITH CHECK (
    auth.uid() = id 
    AND (is_active IS NULL OR is_active = true)
  );

-- 3. Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 4. Les admins peuvent voir tous les profils (version optimisée)
-- Utiliser une sous-requête directe au lieu de la fonction is_admin()
-- pour éviter les problèmes de performance
CREATE POLICY "Admins can view all profiles" ON profiles
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

-- 5. Les admins peuvent modifier tous les profils
CREATE POLICY "Admins can update all profiles" ON profiles
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
-- ÉTAPE 4 : Créer des index pour améliorer drastiquement les performances
-- ============================================================================

-- Index sur (id, role) pour les requêtes de profil et is_admin
CREATE INDEX IF NOT EXISTS idx_profiles_id_role 
ON public.profiles(id, role);

-- Index sur role seul pour les vérifications admin
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON public.profiles(role) 
WHERE role = 'admin';

-- Index sur id seul (déjà présent normalement, mais on s'assure)
CREATE INDEX IF NOT EXISTS idx_profiles_id 
ON public.profiles(id);

-- ============================================================================
-- ÉTAPE 5 : Vérifier que les index sont créés
-- ============================================================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- ÉTAPE 6 : Analyser les statistiques de la table
-- ============================================================================
ANALYZE public.profiles;

-- ============================================================================
-- ÉTAPE 7 : Test de performance de la requête
-- ============================================================================

-- Cette requête devrait être rapide maintenant avec les index
EXPLAIN ANALYZE
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 8 : Vérifier que les politiques fonctionnent
-- ============================================================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- ÉTAPE 9 : Résumé final
-- ============================================================================
SELECT 
  'Optimisation terminée' as status,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'profiles' AND schemaname = 'public') as indexes_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policies_count,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as profile_role;
