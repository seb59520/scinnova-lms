-- ============================================================================
-- FIX : Problème de détection du rôle admin
-- ============================================================================
-- Ce script corrige les policies RLS pour permettre la détection correcte du rôle
-- ============================================================================

-- 1. Vérifier et corriger le champ is_active pour tous les admins
UPDATE profiles
SET is_active = TRUE
WHERE role = 'admin' AND (is_active IS NULL OR is_active = FALSE);

-- 2. Corriger les policies RLS pour permettre aux utilisateurs de voir leur propre profil
-- même si is_active est NULL (rétrocompatibilité)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id AND (is_active IS NULL OR is_active = TRUE)
  );

-- 3. Policy pour permettre aux utilisateurs de voir leur propre profil pour getUserRole
-- Cette policy est nécessaire car getUserRole() doit pouvoir lire le rôle même si is_active est NULL
DROP POLICY IF EXISTS "Users can read their own role" ON profiles;
CREATE POLICY "Users can read their own role" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 4. S'assurer que les admins peuvent toujours voir tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
      AND (p.is_active IS NULL OR p.is_active = TRUE)
    )
  );

-- 5. Policy pour permettre la lecture du rôle (utilisée par getUserRole)
-- Cette policy permet à n'importe quel utilisateur authentifié de lire le rôle de son propre profil
-- même si is_active est NULL, pour permettre la détection du rôle admin
DROP POLICY IF EXISTS "Authenticated users can read their own role" ON profiles;
CREATE POLICY "Authenticated users can read their own role" ON profiles
  FOR SELECT 
  USING (
    auth.uid() = id
  )
  WITH CHECK (
    auth.uid() = id
  );

-- 6. Vérifier les profils admin
SELECT 
  id,
  role,
  full_name,
  is_active,
  created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 7. Test : Vérifier qu'un utilisateur peut voir son propre profil
-- Remplacez 'VOTRE_USER_ID' par votre ID utilisateur
-- SELECT * FROM profiles WHERE id = 'VOTRE_USER_ID';


