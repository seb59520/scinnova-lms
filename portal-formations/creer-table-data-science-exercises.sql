-- Table pour stocker les soumissions d'exercices Data Science
CREATE TABLE IF NOT EXISTS data_science_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL,
  exercise_title TEXT NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_data_science_exercises_user_id ON data_science_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_data_science_exercises_exercise_id ON data_science_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_data_science_exercises_submitted_at ON data_science_exercises(submitted_at DESC);

-- RLS (Row Level Security)
ALTER TABLE data_science_exercises ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir leurs propres soumissions
CREATE POLICY "Users can view their own exercise submissions"
  ON data_science_exercises FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent insérer leurs propres soumissions
CREATE POLICY "Users can insert their own exercise submissions"
  ON data_science_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent mettre à jour leurs propres soumissions
CREATE POLICY "Users can update their own exercise submissions"
  ON data_science_exercises FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : les formateurs/admin peuvent voir toutes les soumissions
CREATE POLICY "Trainers can view all exercise submissions"
  ON data_science_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('trainer', 'admin')
    )
    OR
    -- Permettre aussi de voir les soumissions avec userId temporaires
    -- (pour les cas où l'app est utilisée sans authentification)
    user_id::text LIKE 'temp-%'
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_data_science_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_data_science_exercises_updated_at
  BEFORE UPDATE ON data_science_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_data_science_exercises_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE data_science_exercises IS 'Stocke les soumissions d''exercices Data Science des étudiants';
COMMENT ON COLUMN data_science_exercises.exercise_id IS 'ID de l''exercice (ex: ex1-data-exploration)';
COMMENT ON COLUMN data_science_exercises.answers IS 'JSONB contenant les réponses aux questions de l''exercice';
COMMENT ON COLUMN data_science_exercises.score IS 'Score obtenu (0-100)';
COMMENT ON COLUMN data_science_exercises.feedback IS 'Feedback automatique ou manuel sur la soumission';

