-- ============================================================================
-- FIX COMPLET : Problème de détection du rôle admin
-- ============================================================================
-- Ce script corrige définitivement le problème de détection du rôle admin
-- ============================================================================

-- ÉTAPE 1 : Vérifier et corriger is_active pour tous les admins
UPDATE profiles
SET is_active = TRUE
WHERE role = 'admin' AND (is_active IS NULL OR is_active = FALSE);

-- ÉTAPE 2 : Supprimer toutes les policies existantes pour repartir de zéro
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read their own role" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read their own role" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles including inactive" ON profiles;

-- ÉTAPE 3 : Créer les policies dans le bon ordre

-- Policy 1 : Les utilisateurs peuvent TOUJOURS voir leur propre profil
-- (nécessaire pour getUserRole() et fetchProfile())
-- Cette policy doit être la plus permissive pour permettre la détection du rôle
CREATE POLICY "Users can always view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2 : Les utilisateurs peuvent mettre à jour leur propre profil
-- (seulement si actif ou NULL pour rétrocompatibilité)
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id AND (is_active IS NULL OR is_active = TRUE)
  );

-- Policy 3 : Les admins peuvent voir TOUS les profils (même désactivés)
-- Cette policy utilise une sous-requête pour vérifier si l'utilisateur est admin
-- IMPORTANT : Elle doit permettre de lire le rôle même si is_active est NULL
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
      -- Ne pas filtrer par is_active ici pour permettre la détection du rôle admin
    )
  );

-- Policy 4 : Les admins peuvent modifier tous les profils
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
      AND (p.is_active IS NULL OR p.is_active = TRUE)
    )
  );

-- ÉTAPE 4 : Vérifier les profils admin
SELECT 
  id,
  role,
  full_name,
  is_active,
  created_at,
  CASE 
    WHEN is_active IS NULL THEN 'NULL (sera considéré comme actif)'
    WHEN is_active = TRUE THEN 'TRUE (actif)'
    ELSE 'FALSE (désactivé)'
  END as status_description
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ÉTAPE 5 : Vérifier que les policies sont bien créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ÉTAPE 6 : Test de diagnostic
-- Remplacez 'VOTRE_USER_ID' par votre ID utilisateur pour tester
-- SELECT 
--   id,
--   role,
--   full_name,
--   is_active,
--   -- Vérifier si vous pouvez voir votre propre profil
--   CASE 
--     WHEN id = auth.uid() THEN '✅ Vous pouvez voir votre propre profil'
--     ELSE '❌ Problème de policy RLS'
--   END as rls_check
-- FROM profiles
-- WHERE id = 'VOTRE_USER_ID';

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Vérifiez que tous les admins ont is_active = TRUE
-- 3. Déconnectez-vous et reconnectez-vous dans l'application
-- 4. Vérifiez la console du navigateur pour voir les logs de getUserRole()
-- 5. Si le problème persiste, exécutez la requête de diagnostic (ÉTAPE 6)
-- ============================================================================


