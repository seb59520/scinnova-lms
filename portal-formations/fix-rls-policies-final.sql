-- ============================================================================
-- FIX FINAL : Problème de policies RLS qui bloquent l'accès au profil
-- ============================================================================
-- Ce script corrige définitivement le problème de détection du rôle admin
-- en recréant toutes les policies RLS dans le bon ordre
-- ============================================================================

-- ÉTAPE 1 : Désactiver temporairement RLS pour pouvoir corriger
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 2 : Supprimer TOUTES les policies existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- ÉTAPE 3 : Vérifier que is_active est bien TRUE pour tous les admins
UPDATE profiles
SET is_active = TRUE
WHERE role = 'admin' AND (is_active IS NULL OR is_active = FALSE);

-- ÉTAPE 4 : Réactiver RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 5 : Créer les policies dans le bon ordre (du plus spécifique au plus général)

-- Policy 1 : Les utilisateurs peuvent TOUJOURS voir leur propre profil
-- Cette policy doit être la première et la plus permissive
-- Elle permet à getUserRole() et fetchProfile() de fonctionner
CREATE POLICY "Users can always view their own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2 : Les utilisateurs peuvent mettre à jour leur propre profil (seulement si actif)
CREATE POLICY "Users can update their own active profile" ON profiles
  FOR UPDATE 
  USING (
    auth.uid() = id AND (is_active IS NULL OR is_active = TRUE)
  )
  WITH CHECK (
    auth.uid() = id AND (is_active IS NULL OR is_active = TRUE)
  );

-- Policy 3 : Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy 4 : Les admins peuvent voir TOUS les profils
-- Cette policy utilise une sous-requête qui ne filtre PAS par is_active
-- pour permettre la détection du rôle admin même si is_active est NULL
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
      -- IMPORTANT : Ne pas filtrer par is_active ici
      -- pour permettre la détection du rôle admin
    )
  );

-- Policy 5 : Les admins peuvent modifier tous les profils
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
      AND (p.is_active IS NULL OR p.is_active = TRUE)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
      AND (p.is_active IS NULL OR p.is_active = TRUE)
    )
  );

-- ÉTAPE 6 : Vérifier les policies créées
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ÉTAPE 7 : Test de diagnostic
-- Remplacez '96252bfe-5f74-412e-8461-63362d096f62' par votre ID utilisateur
-- Cette requête devrait retourner votre profil avec rls_check = '✅ Vous pouvez voir votre propre profil'
SELECT 
  id,
  role,
  full_name,
  is_active,
  CASE 
    WHEN id = auth.uid() THEN '✅ Vous pouvez voir votre propre profil'
    ELSE '❌ Problème de policy RLS'
  END as rls_check,
  auth.uid() as current_user_id,
  id = auth.uid() as is_own_profile
FROM profiles
WHERE id = '96252bfe-5f74-412e-8461-63362d096f62';

-- ÉTAPE 8 : Vérifier que auth.uid() fonctionne
SELECT 
  auth.uid() as current_authenticated_user_id,
  'Si cette valeur est NULL, vous n''êtes pas authentifié dans le contexte SQL' as note;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Vérifiez que l'ÉTAPE 7 retourne rls_check = '✅ Vous pouvez voir votre propre profil'
-- 3. Si auth.uid() est NULL dans l'ÉTAPE 8, vous devez vous authentifier dans Supabase
-- 4. Déconnectez-vous et reconnectez-vous dans l'application
-- 5. Vérifiez la console du navigateur pour voir les logs de getUserRole()
-- ============================================================================


