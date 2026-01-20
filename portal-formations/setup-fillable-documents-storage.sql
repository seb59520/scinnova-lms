-- Script pour créer et configurer le bucket 'fillable-documents' dans Supabase Storage
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer le bucket 'fillable-documents' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fillable-documents',
  'fillable-documents',
  false, -- Privé pour protéger les documents des étudiants
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

-- Fonction helper pour obtenir le nom d'utilisateur formaté (student_id ou full_name slugifié)
CREATE OR REPLACE FUNCTION get_user_storage_name(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_profile RECORD;
  user_name TEXT;
BEGIN
  SELECT student_id, full_name INTO user_profile
  FROM profiles
  WHERE id = user_uuid;
  
  IF user_profile.student_id IS NOT NULL AND user_profile.student_id != '' THEN
    user_name := user_profile.student_id;
  ELSIF user_profile.full_name IS NOT NULL AND user_profile.full_name != '' THEN
    -- Créer un slug à partir du nom complet
    user_name := LOWER(REGEXP_REPLACE(
      REGEXP_REPLACE(user_profile.full_name, '[^a-zA-Z0-9]', '-', 'g'),
      '-+', '-', 'g'
    ));
    -- Supprimer les tirets en début/fin et limiter la longueur
    user_name := TRIM(BOTH '-' FROM user_name);
    user_name := SUBSTRING(user_name FROM 1 FOR 50);
  ELSE
    -- Fallback sur l'UUID
    user_name := user_uuid::TEXT;
  END IF;
  
  RETURN user_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Politique RLS pour permettre aux utilisateurs authentifiés de lire les templates de documents
DROP POLICY IF EXISTS "Authenticated users can read fillable document templates" ON storage.objects;
CREATE POLICY "Authenticated users can read fillable document templates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'fillable-documents' AND
  (
    -- Admin peut tout voir
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Les templates sont dans le dossier 'templates/'
    (name LIKE 'templates/%')
  )
);

-- 3. Politique RLS pour permettre aux admins et formateurs d'uploader les templates
DROP POLICY IF EXISTS "Admins and trainers can upload fillable document templates" ON storage.objects;
CREATE POLICY "Admins and trainers can upload fillable document templates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fillable-documents' AND
  name LIKE 'templates/%' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
);

-- 4. Politique RLS pour permettre aux admins et formateurs de mettre à jour les templates
DROP POLICY IF EXISTS "Admins and trainers can update fillable document templates" ON storage.objects;
CREATE POLICY "Admins and trainers can update fillable document templates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'fillable-documents' AND
  name LIKE 'templates/%' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
)
WITH CHECK (
  bucket_id = 'fillable-documents' AND
  name LIKE 'templates/%' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
);

-- 5. Politique RLS pour permettre aux admins et formateurs de supprimer les templates
DROP POLICY IF EXISTS "Admins and trainers can delete fillable document templates" ON storage.objects;
CREATE POLICY "Admins and trainers can delete fillable document templates"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'fillable-documents' AND
  name LIKE 'templates/%' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'trainer', 'instructor')
  )
);

-- 6. Politique RLS pour permettre aux étudiants de lire leurs propres soumissions
-- Format: submissions/{program_name}/{user_name}/{document_id}/{timestamp}.{ext}
DROP POLICY IF EXISTS "Users can read their own submissions" ON storage.objects;
CREATE POLICY "Users can read their own submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'fillable-documents' AND
  (
    -- L'utilisateur peut lire ses propres soumissions
    -- Vérifier par user_name (student_id, full_name slugifié, ou UUID) dans le chemin
    name LIKE 'submissions/%/' || get_user_storage_name(auth.uid()) || '/%'
    OR
    name LIKE 'submissions/%/' || auth.uid()::text || '/%'
    OR
    -- Les formateurs peuvent lire toutes les soumissions
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'trainer', 'instructor')
    )
  )
);

-- 7. Politique RLS pour permettre aux étudiants d'uploader leurs soumissions
DROP POLICY IF EXISTS "Users can upload their own submissions" ON storage.objects;
CREATE POLICY "Users can upload their own submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fillable-documents' AND
  (
    -- Vérifier que le chemin contient le nom d'utilisateur formaté
    name LIKE 'submissions/%/' || get_user_storage_name(auth.uid()) || '/%'
    OR
    name LIKE 'submissions/%/' || auth.uid()::text || '/%'
  )
);

-- 8. Politique RLS pour permettre aux étudiants de mettre à jour leurs soumissions
DROP POLICY IF EXISTS "Users can update their own submissions" ON storage.objects;
CREATE POLICY "Users can update their own submissions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'fillable-documents' AND
  (
    name LIKE 'submissions/%/' || get_user_storage_name(auth.uid()) || '/%'
    OR
    name LIKE 'submissions/%/' || auth.uid()::text || '/%'
  )
)
WITH CHECK (
  bucket_id = 'fillable-documents' AND
  (
    name LIKE 'submissions/%/' || get_user_storage_name(auth.uid()) || '/%'
    OR
    name LIKE 'submissions/%/' || auth.uid()::text || '/%'
  )
);

-- 9. Politique RLS pour permettre aux étudiants de supprimer leurs soumissions
DROP POLICY IF EXISTS "Users can delete their own submissions" ON storage.objects;
CREATE POLICY "Users can delete their own submissions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'fillable-documents' AND
  (
    name LIKE 'submissions/%/' || get_user_storage_name(auth.uid()) || '/%'
    OR
    name LIKE 'submissions/%/' || auth.uid()::text || '/%'
  )
);
