-- ============================================================================
-- Table pour tracker l'état de connexion des utilisateurs
-- ============================================================================
-- Cette table permet de savoir quels utilisateurs sont en ligne
-- ============================================================================

-- Table de présence utilisateur
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_user_presence_updated_at ON user_presence;
CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_updated_at();

-- Fonction pour marquer un utilisateur comme en ligne
CREATE OR REPLACE FUNCTION set_user_online(user_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, is_online, last_seen)
  VALUES (user_uuid, true, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    is_online = true,
    last_seen = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer un utilisateur comme hors ligne
CREATE OR REPLACE FUNCTION set_user_offline(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET is_online = false,
      last_seen = NOW(),
      updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leur propre statut
CREATE POLICY "Users can view their own presence"
  ON user_presence FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les admins/formateurs peuvent voir tous les statuts
CREATE POLICY "Admins can view all presence"
  ON user_presence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Politique : Les utilisateurs peuvent mettre à jour leur propre statut
CREATE POLICY "Users can update their own presence"
  ON user_presence FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leur propre statut
CREATE POLICY "Users can insert their own presence"
  ON user_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_presence IS 'État de connexion des utilisateurs (en ligne/hors ligne)';
COMMENT ON COLUMN user_presence.is_online IS 'true si l''utilisateur est actuellement en ligne';
COMMENT ON COLUMN user_presence.last_seen IS 'Dernière fois que l''utilisateur a été vu en ligne';

