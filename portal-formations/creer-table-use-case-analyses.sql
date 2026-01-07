-- ============================================================================
-- Table pour stocker les analyses IA des cas d'usage Big Data
-- ============================================================================
-- Cette table permet de stocker les analyses IA générées pour les cas d'usage
-- créés dans l'application big-data-impacts-app
-- ============================================================================

CREATE TABLE IF NOT EXISTS use_case_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  use_case_id TEXT NOT NULL, -- ID du cas d'usage dans l'application externe
  use_case_title TEXT NOT NULL,
  use_case_data JSONB NOT NULL, -- Données complètes du cas d'usage
  analysis JSONB NOT NULL, -- Analyse IA complète
  applied_suggestions JSONB, -- Suggestions appliquées par l'utilisateur
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, use_case_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_use_case_analyses_user_id ON use_case_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_use_case_analyses_created_at ON use_case_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_use_case_analyses_use_case_id ON use_case_analyses(use_case_id);

-- RLS (Row Level Security)
ALTER TABLE use_case_analyses ENABLE ROW LEVEL SECURITY;

-- Politique : permettre la lecture pour tous (géré par la politique des formateurs)
-- Les utilisateurs avec userId temporaires n'ont pas d'auth.uid()
CREATE POLICY "Allow select for all"
  ON use_case_analyses FOR SELECT
  USING (true);

-- Politique : permettre l'insertion pour tous (y compris userId temporaires)
CREATE POLICY "Allow insert for all"
  ON use_case_analyses FOR INSERT
  WITH CHECK (true);

-- Politique : permettre la mise à jour pour tous (y compris userId temporaires)
CREATE POLICY "Allow update for all"
  ON use_case_analyses FOR UPDATE
  USING (true);

-- Politique : les formateurs/admin peuvent voir toutes les analyses
CREATE POLICY "Trainers can view all analyses"
  ON use_case_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('trainer', 'admin')
    )
    OR
    -- Permettre aussi de voir les analyses avec userId temporaires
    -- (pour les cas où l'app est utilisée sans authentification)
    user_id::text LIKE 'temp-%'
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_use_case_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_use_case_analyses_updated_at
  BEFORE UPDATE ON use_case_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_use_case_analyses_updated_at();

