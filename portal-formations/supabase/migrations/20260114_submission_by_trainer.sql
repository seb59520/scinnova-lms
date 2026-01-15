-- ============================================================================
-- AJOUTER LA POSSIBILITÉ DE SOUMETTRE UN PROJET AU NOM D'UN APPRENANT
-- ============================================================================

-- Ajouter la colonne pour tracer qui a soumis le projet (si ce n'est pas l'apprenant)
ALTER TABLE project_submissions 
ADD COLUMN IF NOT EXISTS submitted_by_trainer UUID REFERENCES profiles(id);

-- Commentaire explicatif
COMMENT ON COLUMN project_submissions.submitted_by_trainer IS 
  'ID du formateur qui a soumis le projet au nom de l''apprenant (ex: réception par mail)';

-- Mettre à jour la politique RLS pour permettre aux formateurs d'insérer des soumissions pour les apprenants
DROP POLICY IF EXISTS "submissions_insert_trainer" ON project_submissions;
CREATE POLICY "submissions_insert_trainer" ON project_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    -- L'utilisateur peut soumettre pour lui-même
    user_id = auth.uid()
    OR
    -- Les formateurs/admins peuvent soumettre pour les apprenants
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
    OR
    EXISTS (
      SELECT 1 FROM session_members 
      WHERE session_id = project_submissions.session_id
      AND user_id = auth.uid()
      AND role IN ('lead_trainer', 'co_trainer')
    )
  );

SELECT 'Added submitted_by_trainer column and updated RLS policy' as status;
