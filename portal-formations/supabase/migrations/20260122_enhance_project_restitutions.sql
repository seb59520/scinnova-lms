-- ============================================================================
-- MIGRATION : AMÉLIORATION SESSION_PROJECT_RESTITUTIONS POUR TP PROGRAMME
-- Portal Formations - Dashboard Formateur
-- Version: 1.0.0
-- Date: 2026-01-22
-- ============================================================================

-- Ajouter les colonnes pour lier les restitutions aux programmes
-- et permettre de stocker des énoncés et fichiers sources

-- Colonne pour lier à un programme (optionnel)
ALTER TABLE session_project_restitutions
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- Contenu de l'énoncé au format JSON (TipTap ou autre)
ALTER TABLE session_project_restitutions
ADD COLUMN IF NOT EXISTS enonce_content JSONB;

-- Fichiers sources/ressources fournis pour le TP
-- Format: [{name, path, size, type, description, uploaded_at}]
ALTER TABLE session_project_restitutions
ADD COLUMN IF NOT EXISTS source_files JSONB DEFAULT '[]';

-- Index pour la recherche par programme
CREATE INDEX IF NOT EXISTS idx_session_project_restitutions_program
  ON session_project_restitutions(program_id)
  WHERE program_id IS NOT NULL;

-- ============================================================================
-- FONCTION POUR RÉCUPÉRER LES TP D'UN PROGRAMME
-- ============================================================================

CREATE OR REPLACE FUNCTION get_program_tps(p_program_id UUID)
RETURNS TABLE (
  restitution_id UUID,
  session_id UUID,
  session_title TEXT,
  org_id UUID,
  org_name TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  due_date TIMESTAMPTZ,
  submissions_count INTEGER,
  evaluated_count INTEGER,
  average_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    spr.id,
    spr.session_id,
    s.title,
    s.org_id,
    o.name,
    spr.title,
    spr.description,
    spr.status,
    spr.due_date,
    spr.submissions_count,
    spr.evaluated_count,
    spr.average_score
  FROM session_project_restitutions spr
  JOIN sessions s ON s.id = spr.session_id
  JOIN orgs o ON o.id = s.org_id
  WHERE spr.program_id = p_program_id
  ORDER BY spr.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- VUE POUR LES STATS TP PAR PROGRAMME
-- ============================================================================

CREATE OR REPLACE VIEW program_tp_stats AS
SELECT
  spr.program_id,
  p.title AS program_title,
  COUNT(DISTINCT spr.id) AS total_tps,
  COUNT(DISTINCT spr.session_id) AS sessions_with_tps,
  SUM(spr.submissions_count) AS total_submissions,
  SUM(spr.evaluated_count) AS total_evaluated,
  ROUND(AVG(spr.average_score), 2) AS overall_average_score
FROM session_project_restitutions spr
JOIN programs p ON p.id = spr.program_id
WHERE spr.program_id IS NOT NULL
GROUP BY spr.program_id, p.title;
