-- Script pour réactiver RLS avec des politiques simples
-- À exécuter si RLS a été désactivé temporairement et que tout fonctionne maintenant

-- ============================================================================
-- ÉTAPE 1 : Vérifier l'état actuel
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS déjà activé'
    ELSE '⚠️ RLS désactivé - va être réactivé'
  END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 2 : Réactiver RLS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 3 : Supprimer les anciennes politiques (nettoyage)
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
-- ÉTAPE 4 : Créer des politiques SIMPLES et PERFORMANTES
-- ============================================================================

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

-- Politique 4 : Les admins peuvent voir tous les profils
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
  'RLS réactivé avec succès' as status,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as policies_count,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;

-- ============================================================================
-- ÉTAPE 8 : Lister les politiques créées
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
