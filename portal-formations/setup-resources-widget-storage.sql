-- Script pour créer et configurer le bucket 'resources-widget' dans Supabase Storage
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer le bucket 'resources-widget' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resources-widget',
  'resources-widget',
  false, -- Privé pour protéger les ressources
  104857600, -- 100MB max
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
    'text/markdown',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
    'application/javascript',
    'text/javascript',
    'application/python',
    'text/x-python',
    'application/x-sql',
    'text/x-sql',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique RLS pour permettre aux utilisateurs authentifiés de lire les ressources
DROP POLICY IF EXISTS "Authenticated users can read resources" ON storage.objects;
CREATE POLICY "Authenticated users can read resources"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resources-widget' AND
  (
    -- Admin peut tout voir
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Les formateurs peuvent voir toutes les ressources
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'trainer', 'instructor')
    )
    OR
    -- Les étudiants peuvent voir les ressources des cours/modules/items auxquels ils ont accès
    -- (La vérification d'accès se fait au niveau de la table resources via RLS)
    TRUE
  )
);

-- 3. Politique RLS pour permettre aux admins et formateurs d'uploader des ressources
DROP POLICY IF EXISTS "Admins and trainers can upload resources" ON storage.objects;
CREATE POLICY "Admins and trainers can upload resources"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources-widget' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
);

-- 4. Politique RLS pour permettre aux admins et formateurs de mettre à jour les ressources
DROP POLICY IF EXISTS "Admins and trainers can update resources" ON storage.objects;
CREATE POLICY "Admins and trainers can update resources"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resources-widget' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
)
WITH CHECK (
  bucket_id = 'resources-widget' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
);

-- 5. Politique RLS pour permettre aux admins et formateurs de supprimer les ressources
DROP POLICY IF EXISTS "Admins and trainers can delete resources" ON storage.objects;
CREATE POLICY "Admins and trainers can delete resources"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resources-widget' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
);
