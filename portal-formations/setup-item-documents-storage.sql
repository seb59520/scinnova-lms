-- Script pour créer et configurer le bucket 'item-documents' dans Supabase Storage
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer le bucket 'item-documents' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-documents',
  'item-documents',
  true, -- Public pour permettre le téléchargement par les apprenants
  52428800, -- 50MB max
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique RLS pour permettre à tous les utilisateurs authentifiés de lire les documents
CREATE POLICY "Authenticated users can read item documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'item-documents');

-- 3. Politique RLS pour permettre aux admins et formateurs d'uploader des documents
CREATE POLICY "Admins and trainers can upload item documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
);

-- 4. Politique RLS pour permettre aux admins et formateurs de mettre à jour les documents
CREATE POLICY "Admins and trainers can update item documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'item-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
)
WITH CHECK (
  bucket_id = 'item-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
);

-- 5. Politique RLS pour permettre aux admins et formateurs de supprimer les documents
CREATE POLICY "Admins and trainers can delete item documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'item-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
);



