-- Script d'urgence pour résoudre les timeouts RLS
-- Simplifie drastiquement les politiques pour améliorer les performances

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
DROP POLICY IF EXISTS "Users can always view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own active profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- ============================================================================
-- ÉTAPE 3 : Recréer des politiques SIMPLES et PERFORMANTES
-- ============================================================================

-- Politique 1 : Lecture de son propre profil (SANS vérification is_active)
-- C'est la plus importante et doit être la plus simple possible
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Politique 2 : Modification de son propre profil (si actif)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id AND (is_active IS NULL OR is_active = true))
  WITH CHECK (auth.uid() = id AND (is_active IS NULL OR is_active = true));

-- Politique 3 : Insertion de son propre profil
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Politique 4 : Les admins peuvent voir tous les profils
-- Version SIMPLIFIÉE sans fonction is_admin() pour éviter les problèmes
-- On vérifie directement dans la sous-requête
CREATE POLICY "Admins can view all" ON profiles
  FOR SELECT 
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- Politique 5 : Les admins peuvent modifier tous les profils
CREATE POLICY "Admins can update all" ON profiles
  FOR UPDATE 
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- ============================================================================
-- ÉTAPE 4 : Créer des index CRITIQUES pour les performances
-- ============================================================================

-- Index sur id (clé primaire, devrait déjà exister mais on s'assure)
CREATE INDEX IF NOT EXISTS idx_profiles_id_primary ON public.profiles(id);

-- Index composite sur (id, role) pour les vérifications admin
CREATE INDEX IF NOT EXISTS idx_profiles_id_role_composite 
ON public.profiles(id, role);

-- Index partiel sur role = 'admin' pour les vérifications admin rapides
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role 
ON public.profiles(id) 
WHERE role = 'admin';

-- ============================================================================
-- ÉTAPE 5 : Analyser la table pour mettre à jour les statistiques
-- ============================================================================
ANALYZE public.profiles;

-- ============================================================================
-- ÉTAPE 6 : Vérifier le plan d'exécution de la requête
-- ============================================================================

-- Voir le plan d'exécution pour identifier les problèmes de performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 7 : Test de performance
-- ============================================================================

-- Test simple de lecture (devrait être instantané avec les index)
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 8 : Vérifier les politiques créées
-- ============================================================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- ÉTAPE 9 : Résumé
-- ============================================================================
SELECT 
  'Optimisation RLS terminée' as status,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'profiles' AND schemaname = 'public') as indexes_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policies_count,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;
