-- ============================================================================
-- MIGRATION : ÉVALUATIONS DE PROGRAMME
-- Portal Formations - Dashboard Formateur
-- Version: 1.0.0
-- Date: 2026-01-22
-- ============================================================================

-- ============================================================================
-- TABLE DES ÉVALUATIONS DE PROGRAMME
-- ============================================================================

-- Évaluations liées aux programmes (jusqu'à 50 questions)
CREATE TABLE IF NOT EXISTS program_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,

  -- Questions au format JSON
  -- Structure: [{id, question, type, options[], correct_answer, points, course_id?, explanation?}]
  questions JSONB NOT NULL DEFAULT '[]',

  -- Configuration
  passing_score INTEGER DEFAULT 70, -- Pourcentage minimum pour réussir
  max_attempts INTEGER DEFAULT 3,   -- Nombre de tentatives autorisées
  time_limit_minutes INTEGER,        -- Temps limite (null = pas de limite)
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true, -- Montrer les réponses après soumission

  -- État
  is_published BOOLEAN DEFAULT false,

  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_program_evaluations_program ON program_evaluations(program_id);
CREATE INDEX IF NOT EXISTS idx_program_evaluations_published ON program_evaluations(is_published) WHERE is_published = true;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_program_evaluations_updated_at ON program_evaluations;
CREATE TRIGGER update_program_evaluations_updated_at
  BEFORE UPDATE ON program_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE DES TENTATIVES D'ÉVALUATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS program_evaluation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES program_evaluations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id),

  -- Réponses au format JSON: {question_id: answer_value}
  answers JSONB NOT NULL DEFAULT '{}',

  -- Scores calculés
  score INTEGER,          -- Points obtenus
  total_points INTEGER,   -- Points maximum
  percentage DECIMAL(5,2),
  is_passed BOOLEAN,

  -- État
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  attempt_number INTEGER DEFAULT 1,

  -- Détail des résultats par question
  results_detail JSONB DEFAULT '{}' -- {question_id: {is_correct, points_earned, correct_answer}}
);

-- Index
CREATE INDEX IF NOT EXISTS idx_eval_attempts_evaluation ON program_evaluation_attempts(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_eval_attempts_user ON program_evaluation_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_eval_attempts_org ON program_evaluation_attempts(org_id);
CREATE INDEX IF NOT EXISTS idx_eval_attempts_submitted ON program_evaluation_attempts(submitted_at);

-- Contrainte: un utilisateur ne peut pas dépasser le nombre max de tentatives
-- (vérifiée par trigger)

-- ============================================================================
-- FONCTION D'AUTO-CORRECTION MCQ
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_grade_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  v_evaluation RECORD;
  v_question JSONB;
  v_answer TEXT;
  v_correct_answer TEXT;
  v_score INTEGER := 0;
  v_total_points INTEGER := 0;
  v_points INTEGER;
  v_is_correct BOOLEAN;
  v_results_detail JSONB := '{}';
  v_percentage DECIMAL(5,2);
  v_is_passed BOOLEAN;
BEGIN
  -- Ne grader que si submitted_at vient d'être défini
  IF NEW.submitted_at IS NOT NULL AND (OLD.submitted_at IS NULL OR OLD.submitted_at != NEW.submitted_at) THEN
    -- Récupérer l'évaluation
    SELECT * INTO v_evaluation
    FROM program_evaluations
    WHERE id = NEW.evaluation_id;

    -- Parcourir chaque question
    FOR v_question IN SELECT * FROM jsonb_array_elements(v_evaluation.questions)
    LOOP
      v_points := COALESCE((v_question->>'points')::INTEGER, 1);
      v_total_points := v_total_points + v_points;

      -- Récupérer la réponse de l'utilisateur
      v_answer := NEW.answers->>(v_question->>'id');

      -- Récupérer la bonne réponse
      v_correct_answer := v_question->>'correct_answer';

      -- Vérifier si correct (pour MCQ et true/false uniquement)
      IF v_question->>'type' IN ('multiple_choice', 'true_false') THEN
        v_is_correct := LOWER(TRIM(v_answer)) = LOWER(TRIM(v_correct_answer));

        IF v_is_correct THEN
          v_score := v_score + v_points;
        END IF;

        -- Stocker le détail
        v_results_detail := v_results_detail || jsonb_build_object(
          v_question->>'id',
          jsonb_build_object(
            'is_correct', v_is_correct,
            'points_earned', CASE WHEN v_is_correct THEN v_points ELSE 0 END,
            'correct_answer', v_correct_answer,
            'user_answer', v_answer
          )
        );
      ELSE
        -- Pour les questions texte/code, marquer comme non gradé automatiquement
        v_results_detail := v_results_detail || jsonb_build_object(
          v_question->>'id',
          jsonb_build_object(
            'is_correct', NULL,
            'points_earned', NULL,
            'correct_answer', v_correct_answer,
            'user_answer', v_answer,
            'needs_manual_grading', true
          )
        );
      END IF;
    END LOOP;

    -- Calculer le pourcentage
    IF v_total_points > 0 THEN
      v_percentage := (v_score::DECIMAL / v_total_points) * 100;
    ELSE
      v_percentage := 0;
    END IF;

    -- Vérifier si réussi
    v_is_passed := v_percentage >= v_evaluation.passing_score;

    -- Mettre à jour les champs
    NEW.score := v_score;
    NEW.total_points := v_total_points;
    NEW.percentage := v_percentage;
    NEW.is_passed := v_is_passed;
    NEW.results_detail := v_results_detail;
    NEW.graded_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_grade_evaluation ON program_evaluation_attempts;
CREATE TRIGGER trigger_auto_grade_evaluation
  BEFORE INSERT OR UPDATE OF submitted_at ON program_evaluation_attempts
  FOR EACH ROW EXECUTE FUNCTION auto_grade_evaluation();

-- ============================================================================
-- FONCTION POUR VÉRIFIER LE NOMBRE DE TENTATIVES
-- ============================================================================

CREATE OR REPLACE FUNCTION check_max_attempts()
RETURNS TRIGGER AS $$
DECLARE
  v_max_attempts INTEGER;
  v_current_attempts INTEGER;
BEGIN
  -- Récupérer le nombre max de tentatives
  SELECT max_attempts INTO v_max_attempts
  FROM program_evaluations
  WHERE id = NEW.evaluation_id;

  -- Compter les tentatives existantes
  SELECT COUNT(*) INTO v_current_attempts
  FROM program_evaluation_attempts
  WHERE evaluation_id = NEW.evaluation_id
    AND user_id = NEW.user_id;

  -- Vérifier si on peut encore ajouter une tentative
  IF v_current_attempts >= v_max_attempts THEN
    RAISE EXCEPTION 'Nombre maximum de tentatives atteint (%)' , v_max_attempts;
  END IF;

  -- Définir le numéro de tentative
  NEW.attempt_number := v_current_attempts + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_max_attempts ON program_evaluation_attempts;
CREATE TRIGGER trigger_check_max_attempts
  BEFORE INSERT ON program_evaluation_attempts
  FOR EACH ROW EXECUTE FUNCTION check_max_attempts();

-- ============================================================================
-- POLITIQUES RLS
-- ============================================================================

ALTER TABLE program_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_evaluation_attempts ENABLE ROW LEVEL SECURITY;

-- ÉVALUATIONS: Les admins peuvent tout faire
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

-- ÉVALUATIONS: Les trainers peuvent gérer les évaluations des programmes de leurs orgs
DROP POLICY IF EXISTS "evaluations_trainer_manage" ON program_evaluations;
CREATE POLICY "evaluations_trainer_manage" ON program_evaluations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_programs op
      JOIN org_members om ON om.org_id = op.org_id
      WHERE op.program_id = program_evaluations.program_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'trainer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_programs op
      JOIN org_members om ON om.org_id = op.org_id
      WHERE op.program_id = program_evaluations.program_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'trainer')
    )
  );

-- ÉVALUATIONS: Les étudiants peuvent voir les évaluations publiées
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

-- TENTATIVES: Les utilisateurs peuvent voir leurs propres tentatives
DROP POLICY IF EXISTS "attempts_select_own" ON program_evaluation_attempts;
CREATE POLICY "attempts_select_own" ON program_evaluation_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- TENTATIVES: Les utilisateurs peuvent créer leurs propres tentatives
DROP POLICY IF EXISTS "attempts_insert_own" ON program_evaluation_attempts;
CREATE POLICY "attempts_insert_own" ON program_evaluation_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- TENTATIVES: Les utilisateurs peuvent mettre à jour leurs propres tentatives
DROP POLICY IF EXISTS "attempts_update_own" ON program_evaluation_attempts;
CREATE POLICY "attempts_update_own" ON program_evaluation_attempts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- TENTATIVES: Les trainers peuvent voir les tentatives de leurs étudiants
DROP POLICY IF EXISTS "attempts_trainer_view" ON program_evaluation_attempts;
CREATE POLICY "attempts_trainer_view" ON program_evaluation_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_evaluations pe
      JOIN org_programs op ON op.program_id = pe.program_id
      JOIN org_members om ON om.org_id = op.org_id
      WHERE pe.id = program_evaluation_attempts.evaluation_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'trainer')
    )
  );

-- TENTATIVES: Les admins peuvent tout voir
DROP POLICY IF EXISTS "attempts_admin_all" ON program_evaluation_attempts;
CREATE POLICY "attempts_admin_all" ON program_evaluation_attempts
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

-- ============================================================================
-- VUE POUR LES RÉSULTATS AGRÉGÉS
-- ============================================================================

CREATE OR REPLACE VIEW evaluation_results_summary AS
SELECT
  pe.id AS evaluation_id,
  pe.program_id,
  pe.title AS evaluation_title,
  p.title AS program_title,
  COUNT(DISTINCT pea.user_id) AS total_participants,
  COUNT(DISTINCT CASE WHEN pea.is_passed = true THEN pea.user_id END) AS passed_count,
  COUNT(DISTINCT CASE WHEN pea.is_passed = false THEN pea.user_id END) AS failed_count,
  ROUND(AVG(pea.percentage), 2) AS average_score,
  MIN(pea.percentage) AS min_score,
  MAX(pea.percentage) AS max_score
FROM program_evaluations pe
JOIN programs p ON p.id = pe.program_id
LEFT JOIN program_evaluation_attempts pea ON pea.evaluation_id = pe.id
  AND pea.submitted_at IS NOT NULL
GROUP BY pe.id, pe.program_id, pe.title, p.title;
