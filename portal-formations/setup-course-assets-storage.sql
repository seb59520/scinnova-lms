-- Script pour créer et configurer le bucket 'course-assets' dans Supabase Storage
-- À exécuter dans l'interface SQL de Supabase
-- Ce bucket est utilisé pour stocker les assets des cours (images, PDFs, slides générées, etc.)

-- 1. Créer le bucket 'course-assets' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-assets',
  'course-assets',
  true, -- Public pour permettre l'accès aux assets par les apprenants
  104857600, -- 100MB max (pour les PDFs et images de slides)
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/zip',
    'application/x-rar-compressed',
    'text/plain',
    'application/json'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique RLS pour permettre la lecture des assets aux utilisateurs inscrits aux cours
-- Cette politique permet aux utilisateurs de lire les assets des cours publiés ou auxquels ils sont inscrits
CREATE POLICY "Course assets readable by enrolled users"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-assets' AND
  EXISTS (
    SELECT 1 FROM items i
    WHERE i.asset_path = storage.objects.name
    AND EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
      WHERE m.id = i.module_id
      AND (
        c.status = 'published' 
        OR c.created_by = auth.uid() 
        OR e.status = 'active'
      )
    )
  )
);

-- 3. Politique RLS pour permettre aux admins et instructeurs d'uploader des assets
CREATE POLICY "Course assets writable by admins and instructors"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-assets' AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'instructor', 'trainer')
  )
);

-- 4. Politique RLS pour permettre aux admins et instructeurs de mettre à jour les assets
CREATE POLICY "Course assets updatable by admins and instructors"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-assets' AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'instructor', 'trainer')
  )
)
WITH CHECK (
  bucket_id = 'course-assets' AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'instructor', 'trainer')
  )
);

-- 5. Politique RLS pour permettre aux admins et instructeurs de supprimer les assets
CREATE POLICY "Course assets deletable by admins and instructors"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-assets' AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'instructor', 'trainer')
  )
);

-- Vérification : Afficher les buckets créés
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'course-assets';

-- Vérification : Afficher les politiques RLS créées
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%course-assets%';

