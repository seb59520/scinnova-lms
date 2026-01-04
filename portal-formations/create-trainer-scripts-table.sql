-- Table pour stocker les scripts formateurs de manière persistante
-- Permet d'associer les scripts aux slides/items spécifiques

CREATE TABLE IF NOT EXISTS trainer_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE, -- NULL pour les sections générales (introduction, etc.)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  section_title TEXT NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN ('introduction', 'content', 'exercise', 'transition', 'summary')),
  content TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  arguments JSONB DEFAULT '[]'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  questions JSONB DEFAULT '[]'::jsonb,
  examples JSONB DEFAULT '[]'::jsonb,
  estimated_time INTEGER DEFAULT 0,
  section_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, item_id, user_id, section_order) -- Un seul script par item/ordre pour un utilisateur
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_trainer_scripts_course_id ON trainer_scripts(course_id);
CREATE INDEX IF NOT EXISTS idx_trainer_scripts_item_id ON trainer_scripts(item_id);
CREATE INDEX IF NOT EXISTS idx_trainer_scripts_user_id ON trainer_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_scripts_course_item_user ON trainer_scripts(course_id, item_id, user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_trainer_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trainer_scripts_updated_at
  BEFORE UPDATE ON trainer_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_scripts_updated_at();

-- RLS (Row Level Security) - Les utilisateurs peuvent voir/modifier leurs propres scripts
ALTER TABLE trainer_scripts ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir leurs propres scripts
CREATE POLICY "Users can view their own scripts"
  ON trainer_scripts
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy : Les utilisateurs peuvent créer leurs propres scripts
CREATE POLICY "Users can insert their own scripts"
  ON trainer_scripts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy : Les utilisateurs peuvent modifier leurs propres scripts
CREATE POLICY "Users can update their own scripts"
  ON trainer_scripts
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy : Les utilisateurs peuvent supprimer leurs propres scripts
CREATE POLICY "Users can delete their own scripts"
  ON trainer_scripts
  FOR DELETE
  USING (user_id = auth.uid());

-- Policy : Les admins peuvent voir tous les scripts
CREATE POLICY "Admins can view all scripts"
  ON trainer_scripts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Commentaires pour la documentation
COMMENT ON TABLE trainer_scripts IS 'Scripts pédagogiques créés par les formateurs pour les cours';
COMMENT ON COLUMN trainer_scripts.item_id IS 'ID de l''item (slide, exercice, etc.) - NULL pour les sections générales (introduction de module, etc.)';
COMMENT ON COLUMN trainer_scripts.section_order IS 'Ordre d''affichage de la section dans le script';

