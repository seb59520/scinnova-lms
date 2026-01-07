-- ============================================================================
-- Table pour stocker les réponses aux quiz d'introduction
-- ============================================================================
-- Cette table permet de stocker les réponses des participants aux quiz
-- d'introduction (définitions, attentes, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_type TEXT NOT NULL,
  responses JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quiz_type)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_responses_user_id ON user_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_quiz_type ON user_responses(quiz_type);
CREATE INDEX IF NOT EXISTS idx_user_responses_updated_at ON user_responses(updated_at DESC);

-- RLS (Row Level Security)
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir leurs propres réponses
CREATE POLICY "Users can view their own responses"
  ON user_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent insérer leurs propres réponses
CREATE POLICY "Users can insert their own responses"
  ON user_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent mettre à jour leurs propres réponses
CREATE POLICY "Users can update their own responses"
  ON user_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : les formateurs/admin peuvent voir toutes les réponses
-- (nécessite que le rôle soit stocké dans profiles.role)
CREATE POLICY "Trainers can view all responses"
  ON user_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('trainer', 'instructor', 'admin')
    )
  );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_user_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS trigger_update_user_responses_updated_at ON user_responses;
CREATE TRIGGER trigger_update_user_responses_updated_at
  BEFORE UPDATE ON user_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_responses_updated_at();

-- ============================================================================
-- Vues utiles pour l'analyse
-- ============================================================================

-- Vue pour les réponses du quiz d'introduction Big Data
CREATE OR REPLACE VIEW introduction_quiz_responses AS
SELECT 
  ur.id,
  ur.user_id,
  p.full_name,
  au.email,
  ur.responses->>'bigdata' as bigdata_definition,
  ur.responses->>'machinelearning' as ml_definition,
  ur.responses->>'datascience' as ds_definition,
  ur.responses->>'expectations' as expectations,
  ur.created_at,
  ur.updated_at
FROM user_responses ur
LEFT JOIN profiles p ON p.id = ur.user_id
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE ur.quiz_type = 'introduction_big_data'
ORDER BY ur.updated_at DESC;

-- ============================================================================
-- Commentaires
-- ============================================================================

COMMENT ON TABLE user_responses IS 'Stocke les réponses des utilisateurs aux quiz d''introduction et autres questionnaires';
COMMENT ON COLUMN user_responses.quiz_type IS 'Type de quiz (ex: introduction_big_data, introduction_ml, etc.)';
COMMENT ON COLUMN user_responses.responses IS 'Réponses au format JSON (clés = question IDs, valeurs = réponses texte)';

