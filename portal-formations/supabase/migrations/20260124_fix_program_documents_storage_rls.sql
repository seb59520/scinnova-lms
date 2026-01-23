-- Migration: Fix RLS policies for program documents storage access
-- Date: 2026-01-24
-- Description: Ajoute une politique RLS pour permettre aux étudiants inscrits au programme de lire les templates des documents du programme

-- Politique RLS pour permettre aux étudiants inscrits au programme de lire les templates des documents du programme
-- Les fichiers sont stockés dans templates/programs/{program_id}/{filename}
DROP POLICY IF EXISTS "Students can read program document templates" ON storage.objects;
CREATE POLICY "Students can read program document templates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'fillable-documents' AND
  name LIKE 'templates/programs/%' AND
  (
    -- Les admins peuvent tout voir
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Les formateurs peuvent tout voir
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('trainer', 'instructor'))
    OR
    -- Les étudiants inscrits au programme peuvent lire les templates publiés
    -- Extraire le program_id du chemin (templates/programs/{program_id}/...)
    -- et vérifier que l'utilisateur est inscrit à ce programme
    EXISTS (
      SELECT 1
      FROM program_documents pd
      JOIN program_enrollments pe ON pe.program_id = pd.program_id
      WHERE pe.user_id = auth.uid()
        AND pe.status = 'active'
        AND pd.is_published = true
        -- Vérifier que le chemin du fichier correspond au document
        AND (
          pd.template_file_path = storage.objects.name
          OR
          -- Fallback: vérifier que le program_id dans le chemin correspond
          storage.objects.name LIKE 'templates/programs/' || pd.program_id::text || '/%'
        )
    )
  )
);

-- Améliorer la politique existante pour les templates de cours
-- Elle doit permettre la lecture pour tous les utilisateurs authentifiés inscrits au cours
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
    -- Les templates de cours sont dans templates/{course_id}/...
    -- Permettre la lecture si l'utilisateur est inscrit au cours
    (
      name LIKE 'templates/%' 
      AND name NOT LIKE 'templates/programs/%'
      AND EXISTS (
        SELECT 1
        FROM fillable_documents fd
        JOIN enrollments e ON e.course_id = fd.course_id
        WHERE e.user_id = auth.uid()
          AND e.status = 'active'
          AND fd.template_file_path = storage.objects.name
          AND fd.published = true
      )
    )
    OR
    -- Les formateurs peuvent voir tous les templates de cours
    (
      name LIKE 'templates/%' 
      AND name NOT LIKE 'templates/programs/%'
      AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('trainer', 'instructor'))
    )
  )
);
