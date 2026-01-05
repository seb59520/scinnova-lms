-- Correction des politiques RLS pour user_settings
-- À exécuter dans l'interface SQL de Supabase

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Admins can view all settings" ON user_settings;
DROP POLICY IF EXISTS "Admins can manage all settings" ON user_settings;

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : Les utilisateurs peuvent voir leurs propres paramètres
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT 
  USING (user_id = auth.uid());

-- Politique UPDATE : Les utilisateurs peuvent modifier leurs propres paramètres
CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politique INSERT : Les utilisateurs peuvent créer leurs propres paramètres
CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Politique SELECT pour les admins : Les admins peuvent voir tous les paramètres
CREATE POLICY "Admins can view all settings" ON user_settings
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique UPDATE pour les admins : Les admins peuvent modifier tous les paramètres
CREATE POLICY "Admins can manage all settings" ON user_settings
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Vérifier que les politiques sont bien créées
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
WHERE tablename = 'user_settings'
ORDER BY policyname;


