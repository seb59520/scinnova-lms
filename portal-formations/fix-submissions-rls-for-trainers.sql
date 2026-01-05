-- ============================================================================
-- Script SQL pour permettre aux formateurs de voir les soumissions
-- de leurs apprenants dans leurs sessions
-- À exécuter dans l'interface SQL de Supabase
-- ============================================================================

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Admins and instructors can view submissions for their courses" ON submissions;
DROP POLICY IF EXISTS "Trainers can view submissions for their sessions" ON submissions;

-- Créer une politique pour les admins et instructeurs (créateurs du cours)
CREATE POLICY "Admins and instructors can view submissions for their courses" ON submissions
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = submissions.item_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

-- Créer une politique pour les formateurs (trainers) membres d'une organisation
-- qui peuvent voir les soumissions des apprenants de leurs sessions
CREATE POLICY "Trainers can view submissions for their sessions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      JOIN sessions s ON s.org_id = om.org_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('trainer', 'admin')
      AND s.id = submissions.session_id
      AND submissions.user_id IN (
        SELECT e.user_id 
        FROM enrollments e 
        WHERE e.session_id = s.id 
        AND e.status = 'active'
      )
    )
  );

-- Vérifier que les politiques sont bien créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'submissions'
ORDER BY policyname;


