-- ============================================================================
-- Créer le bucket de storage pour les ressources assignées
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- Créer le bucket 'resources' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resources',
  'resources',
  false, -- Privé par défaut
  52428800, -- 50 MB max
  ARRAY['application/pdf', 'image/*', 'text/*', 'application/vnd.openxmlformats-officedocument.*', 'application/msword']
)
ON CONFLICT (id) DO NOTHING;

-- Policy pour permettre aux formateurs d'uploader des ressources
CREATE POLICY "Trainers can upload resources"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'resources'
  AND EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('trainer', 'admin')
  )
);

-- Policy pour permettre aux formateurs de voir leurs ressources uploadées
CREATE POLICY "Trainers can view uploaded resources"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resources'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('trainer', 'admin')
    )
  )
);

-- Policy pour permettre aux apprenants de télécharger les ressources qui leur sont assignées
CREATE POLICY "Learners can download assigned resources"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resources'
  AND EXISTS (
    SELECT 1 FROM assigned_resources ar
    WHERE ar.file_path = storage.objects.name
    AND ar.learner_id = auth.uid()
  )
);

-- Policy pour permettre aux formateurs de supprimer leurs ressources
CREATE POLICY "Trainers can delete their resources"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'resources'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('trainer', 'admin')
  )
);


