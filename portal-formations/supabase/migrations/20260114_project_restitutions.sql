-- ============================================================================
-- MIGRATION : SYSTÈME DE RESTITUTION DE PROJET
-- Portal Formations - Module No-Code/Low-Code
-- Version: 1.0.0
-- Date: 2026-01-14
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : TABLE DES TEMPLATES DE RESTITUTION
-- ============================================================================

-- Template de critères d'évaluation pour un projet
CREATE TABLE IF NOT EXISTS project_restitution_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  
  -- Critères d'évaluation avec pondération
  -- Chaque critère a: id, name, description, weight (%), max_stars (1-5)
  criteria JSONB NOT NULL DEFAULT '[]',
  
  -- Configuration
  settings JSONB DEFAULT '{
    "max_stars": 5,
    "passing_percentage": 50,
    "allow_late_submission": true,
    "require_presentation_link": true,
    "require_app_link": true,
    "require_documentation": true,
    "file_types_allowed": ["pdf", "pptx", "ppt", "doc", "docx", "zip", "png", "jpg", "jpeg"],
    "max_file_size_mb": 50,
    "max_files": 10
  }'::jsonb,
  
  -- Instructions pour les élèves
  instructions TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_templates_org ON project_restitution_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_project_templates_slug ON project_restitution_templates(slug);

DROP TRIGGER IF EXISTS update_project_templates_updated_at ON project_restitution_templates;
CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON project_restitution_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTIE 2 : TABLE DES RESTITUTIONS DE SESSION (activité projet)
-- ============================================================================

-- Une restitution de projet liée à une session
CREATE TABLE IF NOT EXISTS session_project_restitutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES project_restitution_templates(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Critères copiés du template (pour permettre la modification)
  criteria JSONB NOT NULL DEFAULT '[]',
  
  -- Configuration
  settings JSONB DEFAULT '{
    "max_stars": 5,
    "passing_percentage": 50,
    "allow_late_submission": true,
    "require_presentation_link": true,
    "require_app_link": true,
    "require_documentation": true,
    "file_types_allowed": ["pdf", "pptx", "ppt", "doc", "docx", "zip", "png", "jpg", "jpeg"],
    "max_file_size_mb": 50,
    "max_files": 10
  }'::jsonb,
  
  -- Dates
  available_from TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  late_deadline TIMESTAMP WITH TIME ZONE,
  
  -- État
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',        -- Brouillon
    'published',    -- Publié (visible aux apprenants)
    'open',         -- Ouvert aux soumissions
    'closed',       -- Fermé aux soumissions
    'grading',      -- En cours de notation
    'completed',    -- Toutes les notes publiées
    'archived'      -- Archivé
  )),
  
  -- Statistiques
  total_learners INTEGER DEFAULT 0,
  submissions_count INTEGER DEFAULT 0,
  evaluated_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_projects_session ON session_project_restitutions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_projects_status ON session_project_restitutions(status);
CREATE INDEX IF NOT EXISTS idx_session_projects_due ON session_project_restitutions(due_date);

DROP TRIGGER IF EXISTS update_session_projects_updated_at ON session_project_restitutions;
CREATE TRIGGER update_session_projects_updated_at
  BEFORE UPDATE ON session_project_restitutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTIE 3 : TABLE DES SOUMISSIONS DES ÉLÈVES
-- ============================================================================

-- Soumission d'un élève pour une restitution de projet
CREATE TABLE IF NOT EXISTS project_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  restitution_id UUID REFERENCES session_project_restitutions(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Infos projet
  project_title TEXT NOT NULL,
  project_description TEXT,
  
  -- Liens
  presentation_link TEXT,          -- Lien vers la présentation (Notion, Google Slides, etc.)
  app_link TEXT,                   -- Lien vers l'application déployée
  documentation_link TEXT,         -- Lien vers la documentation
  repository_link TEXT,            -- Lien vers le repo (si applicable)
  video_link TEXT,                 -- Lien vers une vidéo de démo
  
  -- Fichiers uploadés
  files JSONB DEFAULT '[]',        -- [{name, path, size, type, uploaded_at}]
  
  -- Commentaire de l'élève
  learner_notes TEXT,
  
  -- Stack utilisée (pour No-Code/Low-Code)
  tools_used JSONB DEFAULT '[]',   -- [{name, role, plan, cost_monthly}]
  
  -- État
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',        -- Brouillon
    'submitted',    -- Soumis
    'late',         -- Soumis en retard
    'evaluated',    -- Évalué
    'returned'      -- Retourné pour corrections
  )),
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(restitution_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_submissions_restitution ON project_submissions(restitution_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_session ON project_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_user ON project_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_status ON project_submissions(status);

-- ============================================================================
-- PARTIE 4 : TABLE DES ÉVALUATIONS (notation par étoiles)
-- ============================================================================

-- Évaluation d'une soumission par le formateur
CREATE TABLE IF NOT EXISTS project_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  restitution_id UUID REFERENCES session_project_restitutions(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Notes par critère (étoiles 1-5)
  -- Format: {"criterion_id": {"stars": 4, "comment": "..."}}
  criteria_scores JSONB NOT NULL DEFAULT '{}',
  
  -- Score calculé
  total_stars INTEGER DEFAULT 0,
  max_stars INTEGER DEFAULT 0,
  star_percentage DECIMAL(5,2),
  
  -- Note sur 20 calculée
  score_20 DECIMAL(4,2),
  
  -- Note finale (peut être ajustée manuellement)
  final_score DECIMAL(4,2),
  
  -- Validé ou non
  passed BOOLEAN,
  
  -- Feedback global
  global_feedback TEXT,
  
  -- Points forts
  strengths TEXT,
  
  -- Axes d'amélioration
  improvements TEXT,
  
  -- Notes privées (non visibles par l'élève)
  private_notes TEXT,
  
  -- Évaluateur
  evaluated_by UUID REFERENCES profiles(id),
  evaluated_at TIMESTAMP WITH TIME ZONE,
  
  -- Publication
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_evaluations_submission ON project_evaluations(submission_id);
CREATE INDEX IF NOT EXISTS idx_project_evaluations_restitution ON project_evaluations(restitution_id);
CREATE INDEX IF NOT EXISTS idx_project_evaluations_session ON project_evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_project_evaluations_user ON project_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_project_evaluations_published ON project_evaluations(is_published);

DROP TRIGGER IF EXISTS update_project_evaluations_updated_at ON project_evaluations;
CREATE TRIGGER update_project_evaluations_updated_at
  BEFORE UPDATE ON project_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTIE 5 : FONCTIONS DE CALCUL DE NOTES
-- ============================================================================

-- Fonction pour calculer la note sur 20 à partir des étoiles
CREATE OR REPLACE FUNCTION calculate_project_score(p_criteria_scores JSONB, p_criteria JSONB)
RETURNS JSONB AS $$
DECLARE
  v_criterion JSONB;
  v_score_entry JSONB;
  v_total_weighted_score DECIMAL := 0;
  v_total_weight DECIMAL := 0;
  v_stars INTEGER;
  v_weight DECIMAL;
  v_max_stars INTEGER;
  v_percentage DECIMAL;
  v_score_20 DECIMAL;
  v_total_stars INTEGER := 0;
  v_max_total_stars INTEGER := 0;
BEGIN
  -- Parcourir chaque critère
  FOR v_criterion IN SELECT * FROM jsonb_array_elements(p_criteria)
  LOOP
    v_weight := COALESCE((v_criterion->>'weight')::DECIMAL, 0);
    v_max_stars := COALESCE((v_criterion->>'max_stars')::INTEGER, 5);
    
    -- Récupérer le score pour ce critère
    v_score_entry := p_criteria_scores->(v_criterion->>'id');
    v_stars := COALESCE((v_score_entry->>'stars')::INTEGER, 0);
    
    -- Calculer le score pondéré
    IF v_max_stars > 0 AND v_weight > 0 THEN
      v_total_weighted_score := v_total_weighted_score + (v_stars::DECIMAL / v_max_stars) * v_weight;
      v_total_weight := v_total_weight + v_weight;
    END IF;
    
    v_total_stars := v_total_stars + v_stars;
    v_max_total_stars := v_max_total_stars + v_max_stars;
  END LOOP;
  
  -- Calculer le pourcentage et la note sur 20
  IF v_total_weight > 0 THEN
    v_percentage := (v_total_weighted_score / v_total_weight) * 100;
    v_score_20 := (v_total_weighted_score / v_total_weight) * 20;
  ELSE
    v_percentage := 0;
    v_score_20 := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'total_stars', v_total_stars,
    'max_stars', v_max_total_stars,
    'star_percentage', ROUND(v_percentage, 2),
    'score_20', ROUND(v_score_20, 2)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction trigger pour recalculer automatiquement les scores
CREATE OR REPLACE FUNCTION update_evaluation_scores()
RETURNS TRIGGER AS $$
DECLARE
  v_criteria JSONB;
  v_scores JSONB;
  v_passing_percentage DECIMAL;
BEGIN
  -- Récupérer les critères de la restitution
  SELECT criteria, COALESCE((settings->>'passing_percentage')::DECIMAL, 50)
  INTO v_criteria, v_passing_percentage
  FROM session_project_restitutions
  WHERE id = NEW.restitution_id;
  
  -- Calculer les scores
  v_scores := calculate_project_score(NEW.criteria_scores, v_criteria);
  
  -- Mettre à jour les champs calculés
  NEW.total_stars := (v_scores->>'total_stars')::INTEGER;
  NEW.max_stars := (v_scores->>'max_stars')::INTEGER;
  NEW.star_percentage := (v_scores->>'star_percentage')::DECIMAL;
  NEW.score_20 := (v_scores->>'score_20')::DECIMAL;
  
  -- Si pas de note finale manuelle, utiliser le score calculé
  IF NEW.final_score IS NULL THEN
    NEW.final_score := NEW.score_20;
  END IF;
  
  -- Déterminer si validé
  NEW.passed := NEW.star_percentage >= v_passing_percentage;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_evaluation_scores ON project_evaluations;
CREATE TRIGGER trigger_update_evaluation_scores
  BEFORE INSERT OR UPDATE OF criteria_scores ON project_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_evaluation_scores();

-- ============================================================================
-- PARTIE 6 : TRIGGER POUR METTRE À JOUR LES STATS DE RESTITUTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_restitution_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_submissions_count INTEGER;
  v_evaluated_count INTEGER;
  v_average_score DECIMAL;
BEGIN
  -- Compter les soumissions
  SELECT COUNT(*) INTO v_submissions_count
  FROM project_submissions
  WHERE restitution_id = COALESCE(NEW.restitution_id, OLD.restitution_id)
    AND status IN ('submitted', 'late', 'evaluated');
  
  -- Compter les évaluations publiées
  SELECT COUNT(*), AVG(score_20)
  INTO v_evaluated_count, v_average_score
  FROM project_evaluations
  WHERE restitution_id = COALESCE(NEW.restitution_id, OLD.restitution_id)
    AND is_published = TRUE;
  
  -- Mettre à jour les stats
  UPDATE session_project_restitutions
  SET 
    submissions_count = v_submissions_count,
    evaluated_count = v_evaluated_count,
    average_score = v_average_score
  WHERE id = COALESCE(NEW.restitution_id, OLD.restitution_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_restitution_stats_on_submission ON project_submissions;
CREATE TRIGGER trigger_update_restitution_stats_on_submission
  AFTER INSERT OR UPDATE OR DELETE ON project_submissions
  FOR EACH ROW EXECUTE FUNCTION update_restitution_stats();

DROP TRIGGER IF EXISTS trigger_update_restitution_stats_on_evaluation ON project_evaluations;
CREATE TRIGGER trigger_update_restitution_stats_on_evaluation
  AFTER INSERT OR UPDATE OR DELETE ON project_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_restitution_stats();

-- ============================================================================
-- PARTIE 7 : TEMPLATE PAR DÉFAUT POUR PROJET NO-CODE/LOW-CODE
-- ============================================================================

-- Insérer le template de critères pour le projet No-Code/Low-Code
INSERT INTO project_restitution_templates (
  title,
  description,
  slug,
  criteria,
  settings,
  instructions,
  is_active
) VALUES (
  'Projet No-Code / Low-Code',
  'Évaluation d''un MVP/POC réalisé avec des outils No-Code/Low-Code',
  'nocode-lowcode-project',
  '[
    {
      "id": "coherence",
      "name": "Cohérence du projet (Difficulté)",
      "description": "Ambition du projet, complexité des fonctionnalités, pertinence du périmètre",
      "weight": 30,
      "max_stars": 5,
      "subcriteria": [
        "Ambition et originalité du projet",
        "Complexité des fonctionnalités implémentées",
        "Pertinence du périmètre choisi"
      ]
    },
    {
      "id": "constraints",
      "name": "Respect des contraintes techniques",
      "description": "Utilisation d''au moins 2 outils, MVP fonctionnel, authentification, CRUD",
      "weight": 20,
      "max_stars": 5,
      "subcriteria": [
        "Au moins 2 outils No-Code/Low-Code utilisés",
        "Authentification utilisateur fonctionnelle",
        "Au moins 3 fonctionnalités CRUD",
        "Base de données structurée avec relations",
        "Interface responsive",
        "Au moins 1 automatisation ou workflow"
      ]
    },
    {
      "id": "tool_choices",
      "name": "Pertinence des choix d''outils",
      "description": "Justification argumentée, analyse comparative, adéquation besoins/outils",
      "weight": 20,
      "max_stars": 5,
      "subcriteria": [
        "Justification des choix techniques",
        "Analyse des alternatives",
        "Adéquation entre les besoins et les outils choisis"
      ]
    },
    {
      "id": "presentation",
      "name": "Qualité de la présentation finale",
      "description": "Clarté de l''exposé, support visuel, démo live, gestion du temps",
      "weight": 10,
      "max_stars": 5,
      "subcriteria": [
        "Clarté de l''exposé oral",
        "Qualité du support visuel",
        "Démo live réussie",
        "Gestion du temps (20 min total)"
      ]
    },
    {
      "id": "documentation",
      "name": "Clarté de la documentation / fiche projet",
      "description": "Structure, exhaustivité, qualité rédactionnelle, schémas/visuels",
      "weight": 10,
      "max_stars": 5,
      "subcriteria": [
        "Structure claire et logique",
        "Exhaustivité (tous les éléments demandés)",
        "Qualité rédactionnelle",
        "Schémas et visuels pertinents",
        "Estimation des coûts complète"
      ]
    },
    {
      "id": "soft_skills",
      "name": "Autonomie et itération (Soft Skills)",
      "description": "Capacité à débloquer seul, progression régulière, pivots documentés",
      "weight": 10,
      "max_stars": 5,
      "subcriteria": [
        "Autonomie dans la résolution de problèmes",
        "Progression régulière visible",
        "Adaptation face aux difficultés",
        "Feedback constructif aux pairs"
      ]
    }
  ]'::jsonb,
  '{
    "max_stars": 5,
    "passing_percentage": 50,
    "allow_late_submission": true,
    "require_presentation_link": true,
    "require_app_link": true,
    "require_documentation": true,
    "file_types_allowed": ["pdf", "pptx", "ppt", "doc", "docx", "zip", "png", "jpg", "jpeg", "mp4"],
    "max_file_size_mb": 100,
    "max_files": 15
  }'::jsonb,
  E'## Livrables attendus\n\n### 1. MVP/POC fonctionnel (70%)\nVotre application doit inclure :\n- ✅ Authentification utilisateur (inscription/connexion)\n- ✅ Au moins 3 fonctionnalités CRUD\n- ✅ Une base de données structurée avec relations\n- ✅ Interface responsive (mobile et desktop)\n- ✅ Au moins 1 automatisation ou workflow\n\n### 2. Fiche descriptive du projet\n- Présentation du projet (problème résolu, cible, objectifs)\n- Choix techniques justifiés\n- Architecture et flux de données\n- Estimation des coûts sur 12 mois\n- Documentation technique\n- Guide utilisateur\n\n### 3. Présentation orale (20 min)\n- Présentation : 10 min\n- Démo live : 5 min\n- Questions/Réponses : 5 min',
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  criteria = EXCLUDED.criteria,
  settings = EXCLUDED.settings,
  instructions = EXCLUDED.instructions;

-- ============================================================================
-- PARTIE 8 : FONCTIONS HELPER ET POLITIQUES RLS
-- ============================================================================

-- Fonctions helper SECURITY DEFINER pour éviter la récursion RLS
CREATE OR REPLACE FUNCTION is_session_trainer(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM session_members
    WHERE user_id = p_user_id 
      AND session_id = p_session_id
      AND role IN ('lead_trainer', 'co_trainer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_session_member(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM session_members
    WHERE user_id = p_user_id 
      AND session_id = p_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction pour vérifier si l'utilisateur est admin ou trainer global
CREATE OR REPLACE FUNCTION is_admin_or_trainer(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id 
      AND role IN ('admin', 'trainer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Activer RLS
ALTER TABLE project_restitution_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_project_restitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_evaluations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLITIQUES POUR project_restitution_templates
-- ============================================================================

DROP POLICY IF EXISTS "templates_select_all" ON project_restitution_templates;
CREATE POLICY "templates_select_all" ON project_restitution_templates
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

-- ============================================================================
-- POLITIQUES POUR session_project_restitutions
-- ============================================================================

DROP POLICY IF EXISTS "restitutions_select_members" ON session_project_restitutions;
CREATE POLICY "restitutions_select_members" ON session_project_restitutions
  FOR SELECT TO authenticated
  USING (
    is_session_member(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

DROP POLICY IF EXISTS "restitutions_insert_trainers" ON session_project_restitutions;
CREATE POLICY "restitutions_insert_trainers" ON session_project_restitutions
  FOR INSERT TO authenticated
  WITH CHECK (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

DROP POLICY IF EXISTS "restitutions_update_trainers" ON session_project_restitutions;
CREATE POLICY "restitutions_update_trainers" ON session_project_restitutions
  FOR UPDATE TO authenticated
  USING (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  )
  WITH CHECK (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

DROP POLICY IF EXISTS "restitutions_delete_trainers" ON session_project_restitutions;
CREATE POLICY "restitutions_delete_trainers" ON session_project_restitutions
  FOR DELETE TO authenticated
  USING (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

-- ============================================================================
-- POLITIQUES POUR project_submissions
-- ============================================================================

DROP POLICY IF EXISTS "submissions_select_own" ON project_submissions;
CREATE POLICY "submissions_select_own" ON project_submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "submissions_select_trainers" ON project_submissions;
CREATE POLICY "submissions_select_trainers" ON project_submissions
  FOR SELECT TO authenticated
  USING (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

DROP POLICY IF EXISTS "submissions_insert_own" ON project_submissions;
CREATE POLICY "submissions_insert_own" ON project_submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "submissions_update_own" ON project_submissions;
CREATE POLICY "submissions_update_own" ON project_submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "submissions_delete_own" ON project_submissions;
CREATE POLICY "submissions_delete_own" ON project_submissions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');

-- Les formateurs peuvent supprimer n'importe quelle soumission
DROP POLICY IF EXISTS "submissions_delete_trainers" ON project_submissions;
CREATE POLICY "submissions_delete_trainers" ON project_submissions
  FOR DELETE TO authenticated
  USING (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

-- Les formateurs peuvent aussi modifier les soumissions (pour réinitialiser le statut)
DROP POLICY IF EXISTS "submissions_update_trainers" ON project_submissions;
CREATE POLICY "submissions_update_trainers" ON project_submissions
  FOR UPDATE TO authenticated
  USING (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  )
  WITH CHECK (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

-- ============================================================================
-- POLITIQUES POUR project_evaluations
-- ============================================================================

DROP POLICY IF EXISTS "evaluations_select_own" ON project_evaluations;
CREATE POLICY "evaluations_select_own" ON project_evaluations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND is_published = TRUE);

DROP POLICY IF EXISTS "evaluations_select_trainers" ON project_evaluations;
CREATE POLICY "evaluations_select_trainers" ON project_evaluations
  FOR SELECT TO authenticated
  USING (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

DROP POLICY IF EXISTS "evaluations_insert_trainers" ON project_evaluations;
CREATE POLICY "evaluations_insert_trainers" ON project_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

DROP POLICY IF EXISTS "evaluations_update_trainers" ON project_evaluations;
CREATE POLICY "evaluations_update_trainers" ON project_evaluations
  FOR UPDATE TO authenticated
  USING (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  )
  WITH CHECK (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

DROP POLICY IF EXISTS "evaluations_delete_trainers" ON project_evaluations;
CREATE POLICY "evaluations_delete_trainers" ON project_evaluations
  FOR DELETE TO authenticated
  USING (
    is_session_trainer(auth.uid(), session_id)
    OR is_admin_or_trainer(auth.uid())
  );

-- ============================================================================
-- PARTIE 9 : BUCKET STORAGE POUR LES FICHIERS
-- ============================================================================

-- Créer le bucket pour les fichiers de projet
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  FALSE,
  104857600, -- 100MB
  ARRAY[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'image/png',
    'image/jpeg',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Politique storage: les utilisateurs peuvent upload dans leur dossier
DROP POLICY IF EXISTS "Users can upload project files" ON storage.objects;
CREATE POLICY "Users can upload project files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Politique storage: les utilisateurs peuvent voir leurs fichiers
DROP POLICY IF EXISTS "Users can view own project files" ON storage.objects;
CREATE POLICY "Users can view own project files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Politique storage: les formateurs peuvent voir tous les fichiers de leur session
DROP POLICY IF EXISTS "Trainers can view session project files" ON storage.objects;
CREATE POLICY "Trainers can view session project files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM project_submissions ps
      JOIN session_members sm ON sm.session_id = ps.session_id
      WHERE (storage.foldername(name))[1] = ps.user_id::TEXT
        AND sm.user_id = auth.uid()
        AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );
