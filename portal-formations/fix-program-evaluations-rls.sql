-- =====================================================
-- FIX: Simplifier les RLS pour les évaluations de programme
-- Permettre aux admins et trainers de voir toutes les évaluations
-- =====================================================

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "evaluations_trainer_manage" ON program_evaluations;

-- Nouvelle politique: les trainers peuvent gérer toutes les évaluations
CREATE POLICY "evaluations_trainer_manage" ON program_evaluations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- S'assurer que la politique admin existe toujours
DROP POLICY IF EXISTS "evaluations_admin_all" ON program_evaluations;
CREATE POLICY "evaluations_admin_all" ON program_evaluations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les étudiants peuvent toujours voir les évaluations publiées
DROP POLICY IF EXISTS "evaluations_student_view" ON program_evaluations;
CREATE POLICY "evaluations_student_view" ON program_evaluations
  FOR SELECT TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.program_id = program_evaluations.program_id
        AND pe.user_id = auth.uid()
        AND pe.status = 'active'
    )
  );
