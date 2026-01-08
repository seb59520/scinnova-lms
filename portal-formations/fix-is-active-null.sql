-- ============================================================================
-- FIX : Problème de connexion après ajout du champ is_active
-- ============================================================================
-- Ce script corrige les problèmes de connexion causés par l'ajout du champ is_active
-- Il met à jour tous les profils existants pour avoir is_active = TRUE par défaut
-- ============================================================================

-- 1. Mettre à jour tous les profils existants pour avoir is_active = TRUE
-- (si le champ existe déjà mais est NULL)
UPDATE profiles
SET is_active = TRUE
WHERE is_active IS NULL;

-- 2. Si le champ n'existe pas encore, l'ajouter avec DEFAULT TRUE
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- 3. Mettre à jour les policies RLS pour gérer les valeurs NULL
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id AND (is_active IS NULL OR is_active = TRUE));

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id AND (is_active IS NULL OR is_active = TRUE));

-- 4. Vérifier que les admins peuvent toujours voir tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Vérifier que les admins peuvent modifier tous les profils
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Afficher un résumé
SELECT 
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_profiles,
  COUNT(*) FILTER (WHERE is_active = FALSE) as inactive_profiles,
  COUNT(*) FILTER (WHERE is_active IS NULL) as null_profiles
FROM profiles;


