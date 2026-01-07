-- ============================================================================
-- Ajouter les politiques RLS pour permettre aux apprenants d'uploader
-- des fichiers dans le bucket 'resources' pour la boîte aux lettres
-- ============================================================================
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- Policy pour permettre aux apprenants d'uploader leurs propres fichiers
-- Structure attendue: mailbox/{user_id}/{timestamp}.{ext}
CREATE POLICY "Learners can upload mailbox files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources' AND
  (storage.foldername(name))[1] = 'mailbox' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy pour permettre aux apprenants de lire leurs propres fichiers uploadés
CREATE POLICY "Learners can read their mailbox files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resources' AND
  (
    -- Les apprenants peuvent lire leurs propres fichiers
    ((storage.foldername(name))[1] = 'mailbox' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR
    -- Les apprenants peuvent lire les ressources qui leur sont assignées (politique existante)
    EXISTS (
      SELECT 1 FROM assigned_resources ar
      WHERE ar.file_path = storage.objects.name
      AND ar.learner_id = auth.uid()
    )
    OR
    -- Les formateurs peuvent lire tous les fichiers du bucket
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('trainer', 'admin')
    )
  )
);

-- Policy pour permettre aux apprenants de supprimer leurs propres fichiers uploadés
CREATE POLICY "Learners can delete their mailbox files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resources' AND
  (storage.foldername(name))[1] = 'mailbox' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Vérification : Afficher les politiques RLS créées pour le bucket resources
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (policyname LIKE '%resources%' OR policyname LIKE '%mailbox%')
ORDER BY policyname;

