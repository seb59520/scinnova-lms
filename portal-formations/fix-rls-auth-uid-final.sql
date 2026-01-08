-- ============================================================================
-- FIX FINAL : Problème de policies RLS avec auth.uid()
-- ============================================================================
-- Ce script corrige le problème en utilisant (select auth.uid()) et en
-- recréant les policies dans le bon ordre
-- ============================================================================

-- ÉTAPE 1 : Supprimer TOUTES les policies existantes sur profiles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- ÉTAPE 2 : Vérifier et corriger is_active pour tous les admins
UPDATE profiles
SET is_active = TRUE
WHERE role = 'admin' AND (is_active IS NULL OR is_active = FALSE);

-- ÉTAPE 3 : Créer une fonction helper pour vérifier si un utilisateur est admin
-- Cette fonction évite la récursion dans les policies RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id 
    AND role = 'admin'
    -- Ne pas filtrer par is_active ici pour permettre la détection du rôle
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ÉTAPE 4 : Créer les policies dans le bon ordre
-- IMPORTANT : Utiliser (select auth.uid()) au lieu de auth.uid() pour optimiser

-- Policy 1 : Les utilisateurs peuvent TOUJOURS voir leur propre profil
-- Cette policy doit être la première et la plus permissive
CREATE POLICY "Users can always view their own profile" ON profiles
  FOR SELECT 
  USING ((select auth.uid()) = id);

-- Policy 2 : Les utilisateurs peuvent mettre à jour leur propre profil (seulement si actif)
CREATE POLICY "Users can update their own active profile" ON profiles
  FOR UPDATE 
  USING (
    (select auth.uid()) = id 
    AND (is_active IS NULL OR is_active = TRUE)
  )
  WITH CHECK (
    (select auth.uid()) = id 
    AND (is_active IS NULL OR is_active = TRUE)
  );

-- Policy 3 : Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT 
  WITH CHECK ((select auth.uid()) = id);

-- Policy 4 : Les admins peuvent voir TOUS les profils
-- Utilise la fonction is_admin() pour éviter la récursion
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT 
  USING (public.is_admin((select auth.uid())));

-- Policy 5 : Les admins peuvent modifier tous les profils
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE 
  USING (public.is_admin((select auth.uid())))
  WITH CHECK (public.is_admin((select auth.uid())));

-- ÉTAPE 5 : Vérifier les policies créées
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'HAS USING'
    ELSE 'NO USING'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'HAS WITH CHECK'
    ELSE 'NO WITH CHECK'
  END as has_with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ÉTAPE 6 : Vérifier les profils admin
SELECT 
  id,
  role,
  full_name,
  is_active,
  created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ÉTAPE 7 : Test de la fonction is_admin
-- Cette requête devrait retourner TRUE si vous êtes admin
-- (Remplacez par votre user_id)
SELECT 
  public.is_admin('96252bfe-5f74-412e-8461-63362d096f62') as is_user_admin;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Vérifiez que l'ÉTAPE 7 retourne TRUE pour votre user_id
-- 3. Dans l'application, déconnectez-vous complètement
-- 4. Reconnectez-vous
-- 5. Ouvrez la console du navigateur (F12) et vérifiez les logs :
--    - Vous devriez voir "✅ Rôle déterminé: admin (depuis profiles)"
--    - Si vous voyez "❌ Aucun profil trouvé", il y a encore un problème
-- 6. Vérifiez que votre rôle apparaît bien comme "Administrateur" dans l'interface
-- ============================================================================


