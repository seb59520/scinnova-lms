-- Table pour stocker les ressources associées à un cours
CREATE TABLE IF NOT EXISTS course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL DEFAULT 'file' CHECK (resource_type IN ('file', 'url', 'video', 'document')),
  file_path TEXT,
  external_url TEXT,
  file_size BIGINT,
  mime_type VARCHAR(255),
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_course_resources_course_id ON course_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_visible ON course_resources(course_id, is_visible);

-- RLS (Row Level Security)
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;

-- Politique : Les admins peuvent tout faire
CREATE POLICY "Admins can do everything on course_resources"
  ON course_resources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique : Les utilisateurs inscrits peuvent voir les ressources visibles
CREATE POLICY "Enrolled users can view visible resources"
  ON course_resources
  FOR SELECT
  USING (
    is_visible = true
    AND (
      -- Vérifier si l'utilisateur est inscrit au cours
      EXISTS (
        SELECT 1 FROM enrollments
        WHERE enrollments.course_id = course_resources.course_id
        AND enrollments.user_id = auth.uid()
        AND enrollments.status = 'active'
      )
      OR
      -- Ou si c'est un admin
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_course_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_resources_updated_at
  BEFORE UPDATE ON course_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_course_resources_updated_at();

-- Créer le bucket storage pour les ressources de cours (si pas déjà existant)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-resources', 'course-resources', false)
ON CONFLICT (id) DO NOTHING;

-- Politique storage : Les admins peuvent uploader
CREATE POLICY "Admins can upload course resources"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'course-resources'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique storage : Les admins peuvent supprimer
CREATE POLICY "Admins can delete course resources"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'course-resources'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique storage : Accès en lecture pour les utilisateurs inscrits
CREATE POLICY "Enrolled users can download course resources"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'course-resources'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      -- Les utilisateurs inscrits peuvent télécharger (on vérifie via le chemin du fichier)
      EXISTS (
        SELECT 1 FROM course_resources cr
        JOIN enrollments e ON e.course_id = cr.course_id
        WHERE cr.file_path = name
        AND e.user_id = auth.uid()
        AND e.status = 'active'
        AND cr.is_visible = true
      )
    )
  );

COMMENT ON TABLE course_resources IS 'Ressources (fichiers, liens, vidéos) associées aux formations';
COMMENT ON COLUMN course_resources.resource_type IS 'Type de ressource: file, url, video, document';
COMMENT ON COLUMN course_resources.is_visible IS 'Si true, la ressource est visible pour les étudiants inscrits';
