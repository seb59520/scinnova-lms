-- Migration: Fix RLS policies for program documents storage access (Version 2 - Plus permissive)
-- Date: 2026-01-24
-- Description: Politique RLS plus permissive pour permettre l'accès aux templates des documents du programme

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Students can read program document templates" ON storage.objects;

-- Créer une politique plus permissive qui permet aux étudiants inscrits au programme
-- de lire tous les fichiers dans templates/programs/{program_id}/ pour leur programme
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
    -- Les étudiants inscrits au programme peuvent lire les templates
    -- Extraire le program_id du chemin et vérifier l'inscription
    EXISTS (
      SELECT 1
      FROM program_enrollments pe
      WHERE pe.user_id = auth.uid()
        AND pe.status = 'active'
        -- Extraire le program_id du chemin: templates/programs/{program_id}/...
        AND storage.objects.name LIKE 'templates/programs/' || pe.program_id::text || '/%'
        -- Vérifier qu'il existe au moins un document publié pour ce programme
        AND EXISTS (
          SELECT 1
          FROM program_documents pd
          WHERE pd.program_id = pe.program_id
            AND pd.is_published = true
            AND (
              pd.template_file_path = storage.objects.name
              OR storage.objects.name LIKE 'templates/programs/' || pd.program_id::text || '/%'
            )
        )
    )
  )
);

-- Vérifier que la politique a été créée
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Students can read program document templates'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    RAISE NOTICE '✅ Politique RLS créée avec succès';
  ELSE
    RAISE WARNING '⚠️ La politique RLS n''a pas été créée';
  END IF;
END $$;
