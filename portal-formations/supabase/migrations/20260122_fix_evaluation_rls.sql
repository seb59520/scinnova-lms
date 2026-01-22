-- =====================================================
-- FIX: Simplifier les RLS pour les évaluations
-- Permettre à tous les utilisateurs authentifiés de voir les évaluations publiées
-- =====================================================

-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "evaluations_student_view" ON program_evaluations;

-- Nouvelle politique: tous les utilisateurs authentifiés peuvent voir les évaluations publiées
CREATE POLICY "evaluations_public_view" ON program_evaluations
  FOR SELECT TO authenticated
  USING (is_published = true);

-- Aussi permettre aux formateurs de créer des évaluations sans org_programs
DROP POLICY IF EXISTS "evaluations_trainer_manage" ON program_evaluations;
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

-- Pareil pour les tentatives - permettre lecture à tous les trainers/admins
DROP POLICY IF EXISTS "attempts_trainer_view" ON program_evaluation_attempts;
CREATE POLICY "attempts_trainer_view" ON program_evaluation_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );
