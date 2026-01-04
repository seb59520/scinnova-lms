-- ============================================================================
-- Script SQL pour configurer les RLS du bucket 'submissions'
-- À exécuter dans Supabase SQL Editor
-- ============================================================================
-- Ce script configure les politiques de sécurité (RLS) pour permettre aux
-- étudiants de déposer leurs documents dans le bucket 'submissions'
-- ============================================================================

-- 1. Supprimer les anciennes policies si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Users can upload their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins and trainers can read all submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Submissions accessible by owner" ON storage.objects;
DROP POLICY IF EXISTS "Admins and trainers can manage all submissions" ON storage.objects;

-- 2. Créer le bucket 'submissions' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  false, -- Privé par défaut (les fichiers ne sont pas accessibles publiquement)
  10485760, -- 10MB max (10 * 1024 * 1024)
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif'
  ];

-- ============================================================================
-- POLICIES RLS POUR LE BUCKET SUBMISSIONS
-- ============================================================================

-- Policy 1: Les utilisateurs peuvent uploader leurs propres fichiers
-- Structure attendue: {user_id}/{item_id}/submission.{ext}
CREATE POLICY "Users can upload their own submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Les utilisateurs peuvent lire leurs propres fichiers
CREATE POLICY "Users can read their own submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Les admins, formateurs et instructeurs peuvent lire tous les fichiers
-- Cela permet aux formateurs de corriger les soumissions
CREATE POLICY "Admins and trainers can read all submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'instructor', 'trainer')
  )
);

-- Policy 4: Les utilisateurs peuvent mettre à jour leurs propres fichiers
-- (utile pour remplacer un fichier déjà soumis)
CREATE POLICY "Users can update their own submissions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own submissions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 6: Les admins et formateurs peuvent gérer tous les fichiers
-- (pour supprimer ou modifier si nécessaire)
CREATE POLICY "Admins and trainers can manage all submissions"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'submissions' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'instructor', 'trainer')
  )
)
WITH CHECK (
  bucket_id = 'submissions' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'instructor', 'trainer')
  )
);

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Vérifier que le bucket a été créé
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'submissions';

-- Vérifier que les policies ont été créées
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%submission%'
ORDER BY policyname;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 1. Structure des fichiers dans le bucket:
--    {user_id}/{item_id}/submission.{extension}
--    Exemple: "a1b2c3d4-e5f6-7890-abcd-ef1234567890/item-uuid/submission.pdf"
--
-- 2. Les étudiants peuvent uniquement:
--    - Uploader dans leur propre dossier (premier niveau = leur user_id)
--    - Lire/modifier/supprimer leurs propres fichiers
--
-- 3. Les admins/formateurs peuvent:
--    - Lire tous les fichiers (pour corriger)
--    - Gérer tous les fichiers (si nécessaire)
--
-- 4. Si vous avez des erreurs "Bucket not found":
--    - Vérifiez que le bucket existe dans Supabase Dashboard > Storage
--    - Si nécessaire, créez-le manuellement dans l'interface
-- ============================================================================

