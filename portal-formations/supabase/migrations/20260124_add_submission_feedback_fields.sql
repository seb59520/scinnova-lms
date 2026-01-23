-- Migration: Add appreciation and improvement areas fields to submissions table
-- Date: 2026-01-24
-- Description: Ajoute les colonnes appreciation et improvement_areas pour stocker les commentaires de correction des TP

-- Ajouter les colonnes pour l'appréciation et les axes d'amélioration
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS appreciation TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS improvement_areas TEXT;

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN submissions.appreciation IS 'Appréciation générale du travail de l''étudiant (points forts, commentaires positifs)';
COMMENT ON COLUMN submissions.improvement_areas IS 'Axes d''amélioration et suggestions constructives pour aider l''étudiant à progresser';

-- Créer un index pour faciliter les recherches sur les soumissions avec feedback
CREATE INDEX IF NOT EXISTS idx_submissions_has_feedback ON submissions(user_id, item_id) 
WHERE appreciation IS NOT NULL OR improvement_areas IS NOT NULL;
