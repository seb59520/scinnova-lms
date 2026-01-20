-- Migration : Ajouter session_id à fillable_document_submissions
-- Permet de suivre les soumissions par session pour savoir qui a rendu ou pas

-- ============================================================================
-- PARTIE 1 : Ajouter la colonne session_id
-- ============================================================================

DO $$
BEGIN
  -- Ajouter session_id à la table fillable_document_submissions (si elle n'existe pas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fillable_document_submissions' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE fillable_document_submissions 
    ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_fillable_submissions_session 
    ON fillable_document_submissions(session_id);
    
    RAISE NOTICE 'Colonne session_id ajoutée à fillable_document_submissions.';
  ELSE
    RAISE NOTICE 'Colonne session_id existe déjà dans fillable_document_submissions.';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 2 : Fonction pour déterminer automatiquement la session
-- ============================================================================

-- Fonction pour obtenir la session d'un utilisateur pour un cours
-- (utilise la fonction existante si elle existe, sinon la crée)
CREATE OR REPLACE FUNCTION get_user_session_for_course(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_org_id UUID;
BEGIN
  -- Trouver l'org_id de l'utilisateur
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Si pas d'org, retourner NULL
  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Trouver une session active pour ce cours et cette org
  SELECT id INTO v_session_id
  FROM sessions
  WHERE course_id = p_course_id
    AND org_id = v_org_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PARTIE 3 : Trigger pour remplir automatiquement session_id
-- ============================================================================

-- Fonction trigger pour mettre à jour automatiquement session_id
CREATE OR REPLACE FUNCTION update_fillable_submission_session()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_session_id UUID;
BEGIN
  -- Si session_id n'est pas déjà défini, le déterminer automatiquement
  IF NEW.session_id IS NULL THEN
    -- Trouver le course_id via le fillable_document_id
    SELECT fd.course_id INTO v_course_id
    FROM fillable_documents fd
    WHERE fd.id = NEW.fillable_document_id;

    IF v_course_id IS NOT NULL THEN
      v_session_id := get_user_session_for_course(NEW.user_id, v_course_id);
      IF v_session_id IS NOT NULL THEN
        NEW.session_id := v_session_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS fillable_submission_session_trigger ON fillable_document_submissions;
CREATE TRIGGER fillable_submission_session_trigger
  BEFORE INSERT OR UPDATE ON fillable_document_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_fillable_submission_session();

-- ============================================================================
-- PARTIE 4 : Mettre à jour les soumissions existantes
-- ============================================================================

-- Mettre à jour les soumissions existantes qui n'ont pas de session_id
UPDATE fillable_document_submissions fds
SET session_id = get_user_session_for_course(fds.user_id, fd.course_id)
FROM fillable_documents fd
WHERE fds.fillable_document_id = fd.id
  AND fds.session_id IS NULL;

-- ============================================================================
-- PARTIE 5 : Mettre à jour les politiques RLS si nécessaire
-- ============================================================================

-- Les politiques RLS existantes devraient déjà fonctionner car elles utilisent
-- user_id et fillable_document_id. La session_id est juste une métadonnée supplémentaire.

-- ============================================================================
-- PARTIE 6 : Vue pour faciliter le suivi des soumissions par session
-- ============================================================================

CREATE OR REPLACE VIEW fillable_submissions_by_session AS
SELECT 
  s.id as session_id,
  s.title as session_title,
  s.course_id,
  c.title as course_title,
  fd.id as document_id,
  fd.title as document_title,
  fd.is_required,
  fd.due_date,
  COUNT(DISTINCT sm.user_id) as total_learners,
  COUNT(DISTINCT fds.user_id) as submitted_count,
  COUNT(DISTINCT sm.user_id) - COUNT(DISTINCT fds.user_id) as not_submitted_count,
  ARRAY_AGG(DISTINCT 
    CASE 
      WHEN fds.user_id IS NOT NULL THEN 
        jsonb_build_object(
          'user_id', fds.user_id,
          'submitted_at', fds.submitted_at,
          'status', fds.status,
          'submitted_file_name', fds.submitted_file_name
        )
    END
  ) FILTER (WHERE fds.user_id IS NOT NULL) as submissions_data
FROM sessions s
JOIN courses c ON c.id = s.course_id
JOIN fillable_documents fd ON fd.course_id = s.course_id
LEFT JOIN session_members sm ON sm.session_id = s.id AND sm.role = 'learner'
LEFT JOIN fillable_document_submissions fds 
  ON fds.fillable_document_id = fd.id 
  AND fds.session_id = s.id
WHERE s.status = 'active'
GROUP BY s.id, s.title, s.course_id, c.title, fd.id, fd.title, fd.is_required, fd.due_date;

-- Commentaire sur la vue
COMMENT ON VIEW fillable_submissions_by_session IS 
'Vue pour suivre les soumissions de documents remplissables par session. 
Montre pour chaque session et chaque document : le nombre total d''apprenants, 
le nombre qui ont soumis, et le nombre qui n''ont pas encore soumis.';
