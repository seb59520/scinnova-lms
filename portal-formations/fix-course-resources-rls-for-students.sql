-- Fix RLS policies for course_resources to allow students enrolled via programs
-- Les étudiants inscrits via des programmes doivent aussi pouvoir voir les ressources

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Enrolled users can view visible resources" ON course_resources;

-- Créer une nouvelle politique qui inclut les inscriptions via programmes
CREATE POLICY "Enrolled users can view visible resources" 
  ON course_resources
  FOR SELECT
  USING (
    is_visible = true
    AND (
      -- Admin peut tout voir
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      -- Utilisateur inscrit directement au cours
      EXISTS (
        SELECT 1 FROM enrollments
        WHERE enrollments.course_id = course_resources.course_id
        AND enrollments.user_id = auth.uid()
        AND enrollments.status = 'active'
      )
      OR
      -- Utilisateur inscrit via un programme
      EXISTS (
        SELECT 1 FROM program_courses pc
        JOIN program_enrollments pe ON pe.program_id = pc.program_id
        WHERE pc.course_id = course_resources.course_id
        AND pe.user_id = auth.uid()
        AND pe.status = 'active'
      )
      OR
      -- Créateur du cours
      EXISTS (
        SELECT 1 FROM courses c
        WHERE c.id = course_resources.course_id
        AND c.created_by = auth.uid()
      )
    )
  );

-- Mettre à jour aussi la politique storage pour inclure les inscriptions via programmes
DROP POLICY IF EXISTS "Enrolled users can download course resources" ON storage.objects;

CREATE POLICY "Enrolled users can download course resources"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'course-resources'
    AND (
      -- Admin peut tout télécharger
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      -- Utilisateur inscrit directement au cours
      EXISTS (
        SELECT 1 FROM course_resources cr
        JOIN enrollments e ON e.course_id = cr.course_id
        WHERE cr.file_path = name
        AND e.user_id = auth.uid()
        AND e.status = 'active'
        AND cr.is_visible = true
      )
      OR
      -- Utilisateur inscrit via un programme
      EXISTS (
        SELECT 1 FROM course_resources cr
        JOIN program_courses pc ON pc.course_id = cr.course_id
        JOIN program_enrollments pe ON pe.program_id = pc.program_id
        WHERE cr.file_path = name
        AND pe.user_id = auth.uid()
        AND pe.status = 'active'
        AND cr.is_visible = true
      )
      OR
      -- Créateur du cours
      EXISTS (
        SELECT 1 FROM course_resources cr
        JOIN courses c ON c.id = cr.course_id
        WHERE cr.file_path = name
        AND c.created_by = auth.uid()
        AND cr.is_visible = true
      )
    )
  );

COMMENT ON POLICY "Enrolled users can view visible resources" ON course_resources IS 
'Permet aux étudiants inscrits (directement ou via un programme) de voir les ressources visibles du cours';
