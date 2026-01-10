-- Script pour nettoyer les politiques RLS en double et simplifier
-- À exécuter dans Supabase SQL Editor

-- ============================================================================
-- ÉTAPE 1 : Supprimer TOUTES les politiques existantes (doublons)
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can always view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "profile_insert_own" ON profiles;
DROP POLICY IF EXISTS "profile_update_own" ON profiles;
DROP POLICY IF EXISTS "profile_select_own" ON profiles;
DROP POLICY IF EXISTS "profile_select_admin" ON profiles;
DROP POLICY IF EXISTS "profile_update_admin" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all" ON profiles;
DROP POLICY IF EXISTS "Admins can update all" ON profiles;

-- ============================================================================
-- ÉTAPE 2 : Recréer des politiques SIMPLES et SANS DOUBLONS
-- ============================================================================

-- Politique 1 : Lecture de son propre profil (SIMPLE - juste auth.uid() = id)
-- C'est la politique la plus importante pour que l'utilisateur puisse voir son profil
CREATE POLICY "profile_select_own" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Politique 2 : Modification de son propre profil (SANS condition is_active)
-- Permet de modifier même si is_active = false (pour réactivation)
CREATE POLICY "profile_update_own" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique 3 : Insertion de son propre profil
CREATE POLICY "profile_insert_own" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Politique 4 : Les admins peuvent voir tous les profils
-- Version SIMPLE avec sous-requête directe (pas de fonction récursive)
-- IMPORTANT: Cette politique utilise SECURITY DEFINER pour éviter la récursion
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
-- ÉTAPE 3 : Vérifier les politiques créées
-- ============================================================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- ÉTAPE 4 : Vérifier que RLS est activé
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 5 : Analyser la table pour mettre à jour les statistiques
-- ============================================================================
ANALYZE public.profiles;

-- ============================================================================
-- ÉTAPE 6 : Résumé
-- ============================================================================
SELECT 
  'Politiques RLS nettoyées et simplifiées' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policies_count,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;
