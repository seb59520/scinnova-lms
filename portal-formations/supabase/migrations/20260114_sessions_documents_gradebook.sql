-- ============================================================================
-- MIGRATION COMPLÈTE : SESSIONS SYNCHRONISÉES + DOCUMENTS + GRADEBOOK
-- Portal Formations - LMS Professionnel
-- Version: 2.0.0
-- Date: 2026-01-14
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : EXTENSIONS ET FONCTIONS UTILITAIRES
-- ============================================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fonction de mise à jour automatique de updated_at (si n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction helper pour vérifier l'appartenance à une organisation
CREATE OR REPLACE FUNCTION is_org_member(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = p_user_id AND org_id = p_org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction helper pour vérifier le rôle dans une session
CREATE OR REPLACE FUNCTION get_session_role(p_user_id UUID, p_session_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM session_members
  WHERE user_id = p_user_id AND session_id = p_session_id;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTIE 2 : TABLES SESSIONS SYNCHRONISÉES
-- ============================================================================

-- 2.1 Extension de la table sessions existante (si les colonnes n'existent pas)
DO $$ 
BEGIN
  -- Ajouter program_id si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'program_id') THEN
    ALTER TABLE sessions ADD COLUMN program_id UUID REFERENCES programs(id) ON DELETE SET NULL;
  END IF;
  
  -- Ajouter mode si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'mode') THEN
    ALTER TABLE sessions ADD COLUMN mode TEXT DEFAULT 'synchronous' 
      CHECK (mode IN ('synchronous', 'semi_guided', 'free'));
  END IF;
  
  -- Ajouter max_learners si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'max_learners') THEN
    ALTER TABLE sessions ADD COLUMN max_learners INTEGER;
  END IF;
  
  -- Ajouter timezone si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'timezone') THEN
    ALTER TABLE sessions ADD COLUMN timezone TEXT DEFAULT 'Europe/Paris';
  END IF;
  
  -- Ajouter pedagogy_settings si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'pedagogy_settings') THEN
    ALTER TABLE sessions ADD COLUMN pedagogy_settings JSONB DEFAULT '{
      "allow_ahead": false,
      "auto_unlock_on_complete": false,
      "require_attendance": true,
      "show_peer_progress": true,
      "enable_chat": true,
      "enable_reactions": true
    }'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_program ON sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mode ON sessions(mode);

-- 2.2 État temps réel de la session
CREATE TABLE IF NOT EXISTS session_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Position actuelle du groupe
  current_module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  current_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  
  -- État de la session
  session_status TEXT DEFAULT 'waiting' CHECK (session_status IN (
    'waiting',      -- En attente de démarrage
    'live',         -- En cours (formateur actif)
    'break',        -- Pause
    'exercise',     -- Temps d'exercice individuel
    'quiz_live',    -- Quiz en direct
    'discussion',   -- Discussion de groupe
    'completed'     -- Terminée
  )),
  
  -- Modules/items déverrouillés
  unlocked_modules UUID[] DEFAULT '{}',
  unlocked_items UUID[] DEFAULT '{}',
  
  -- Chronomètre de session
  started_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  total_pause_duration INTERVAL DEFAULT '0 seconds',
  
  -- Message du formateur
  trainer_message TEXT,
  trainer_message_type TEXT CHECK (trainer_message_type IN ('info', 'warning', 'success', 'action')),
  trainer_message_at TIMESTAMP WITH TIME ZONE,
  
  -- Quiz live en cours
  active_quiz_id UUID,
  active_quiz_state JSONB,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_session_state_session ON session_state(session_id);
CREATE INDEX IF NOT EXISTS idx_session_state_status ON session_state(session_status);

DROP TRIGGER IF EXISTS update_session_state_updated_at ON session_state;
CREATE TRIGGER update_session_state_updated_at
  BEFORE UPDATE ON session_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.3 Membres de la session
CREATE TABLE IF NOT EXISTS session_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  role TEXT NOT NULL CHECK (role IN ('lead_trainer', 'co_trainer', 'learner', 'observer')),
  
  -- État de présence
  status TEXT DEFAULT 'enrolled' CHECK (status IN (
    'enrolled',     -- Inscrit
    'active',       -- Présent et actif
    'idle',         -- Présent mais inactif (>5min sans activité)
    'away',         -- Absent temporairement
    'completed',    -- A terminé le parcours
    'dropped'       -- Abandon
  )),
  
  -- Métadonnées
  display_name TEXT,
  avatar_url TEXT,
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_session_members_session ON session_members(session_id);
CREATE INDEX IF NOT EXISTS idx_session_members_user ON session_members(user_id);
CREATE INDEX IF NOT EXISTS idx_session_members_role ON session_members(role);
CREATE INDEX IF NOT EXISTS idx_session_members_status ON session_members(status);

-- 2.4 Progression individuelle dans la session
CREATE TABLE IF NOT EXISTS learner_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Position actuelle
  current_module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  current_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  
  -- Métriques de progression
  modules_completed INTEGER DEFAULT 0,
  items_completed INTEGER DEFAULT 0,
  items_viewed INTEGER DEFAULT 0,
  exercises_passed INTEGER DEFAULT 0,
  exercises_failed INTEGER DEFAULT 0,
  quizzes_passed INTEGER DEFAULT 0,
  
  -- Items complétés (liste)
  completed_items UUID[] DEFAULT '{}',
  viewed_items UUID[] DEFAULT '{}',
  
  -- Temps passé
  total_time_spent INTERVAL DEFAULT '0 seconds',
  time_on_current_item INTERVAL DEFAULT '0 seconds',
  
  -- Statut par rapport au groupe
  relative_status TEXT DEFAULT 'on_track' CHECK (relative_status IN (
    'ahead',        -- En avance sur le groupe
    'on_track',     -- Synchronisé avec le groupe
    'behind',       -- En retard
    'stuck'         -- Bloqué (besoin d'aide)
  )),
  
  -- Score global
  overall_score DECIMAL(5,2),
  
  -- Heartbeat
  last_heartbeat_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_learner_progress_session ON learner_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_learner_progress_user ON learner_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_progress_status ON learner_progress(relative_status);

DROP TRIGGER IF EXISTS update_learner_progress_updated_at ON learner_progress;
CREATE TRIGGER update_learner_progress_updated_at
  BEFORE UPDATE ON learner_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.5 Événements de session (pour temps réel et historique)
CREATE TABLE IF NOT EXISTS session_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    -- Événements session
    'session_started', 'session_paused', 'session_resumed', 'session_ended',
    'break_started', 'break_ended',
    
    -- Navigation formateur
    'module_activated', 'item_activated',
    'module_unlocked', 'item_unlocked',
    'trainer_message',
    
    -- Modes spéciaux
    'exercise_mode_started', 'exercise_mode_ended',
    'quiz_live_started', 'quiz_live_ended',
    'discussion_started', 'discussion_ended',
    
    -- Événements apprenant
    'learner_joined', 'learner_left', 
    'learner_active', 'learner_idle', 'learner_away',
    'item_started', 'item_completed',
    'exercise_submitted', 'quiz_submitted',
    'help_requested', 'help_resolved',
    
    -- Alertes
    'stuck_detected', 'behind_detected'
  )),
  
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_events_session ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_type ON session_events(event_type);
CREATE INDEX IF NOT EXISTS idx_session_events_user ON session_events(user_id);
CREATE INDEX IF NOT EXISTS idx_session_events_created ON session_events(created_at DESC);

-- 2.6 Présence temps réel
CREATE TABLE IF NOT EXISTS session_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  is_online BOOLEAN DEFAULT TRUE,
  current_page TEXT,
  last_activity TEXT,
  
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Données de présence Supabase
  presence_ref TEXT,
  
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_session_presence_session ON session_presence(session_id);
CREATE INDEX IF NOT EXISTS idx_session_presence_online ON session_presence(session_id, is_online);

-- ============================================================================
-- PARTIE 3 : TABLES DOCUMENTS ET QUESTIONNAIRES
-- ============================================================================

-- 3.1 Documents de session
CREATE TABLE IF NOT EXISTS session_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  
  document_type TEXT NOT NULL CHECK (document_type IN (
    'convention',           -- Convention de formation
    'program',              -- Programme / Syllabus détaillé
    'convocation',          -- Convocation des stagiaires
    'attendance_sheet',     -- Feuille d'émargement
    'certificate',          -- Attestation de fin de formation
    'certificate_template', -- Modèle d'attestation
    'quote',                -- Devis
    'invoice',              -- Facture
    'resource',             -- Ressource pédagogique
    'other'                 -- Autre document
  )),
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Stockage
  storage_path TEXT,
  storage_bucket TEXT DEFAULT 'session-documents',
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Ou contenu structuré
  content_json JSONB,
  content_html TEXT,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES session_documents(id),
  
  -- Signature
  is_signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by UUID REFERENCES profiles(id),
  signature_data JSONB,
  
  -- Visibilité
  visible_to_learners BOOLEAN DEFAULT FALSE,
  visible_to_client BOOLEAN DEFAULT TRUE,
  
  -- Pour les attestations individuelles
  for_user_id UUID REFERENCES profiles(id),
  
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_documents_session ON session_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_session_documents_type ON session_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_session_documents_user ON session_documents(for_user_id);

DROP TRIGGER IF EXISTS update_session_documents_updated_at ON session_documents;
CREATE TRIGGER update_session_documents_updated_at
  BEFORE UPDATE ON session_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.2 Modèles de questionnaires
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT,
  
  survey_type TEXT NOT NULL CHECK (survey_type IN (
    'pre_positioning',      -- Positionnement initial
    'pre_expectations',     -- Recueil des attentes
    'pre_needs',            -- Analyse des besoins
    'during_feedback',      -- Feedback pendant formation
    'post_satisfaction',    -- Évaluation à chaud
    'post_knowledge',       -- Évaluation des acquis
    'post_cold_30',         -- Évaluation à froid J+30
    'post_cold_90',         -- Évaluation à froid J+90
    'nps',                  -- Net Promoter Score
    'custom'                -- Personnalisé
  )),
  
  timing TEXT CHECK (timing IN ('pre', 'during', 'post_immediate', 'post_delayed')),
  delay_days INTEGER,
  
  questions JSONB NOT NULL DEFAULT '[]',
  
  settings JSONB DEFAULT '{
    "anonymous": false,
    "show_progress": true,
    "allow_save_draft": true,
    "randomize_questions": false,
    "one_question_per_page": false,
    "show_required_indicator": true
  }'::jsonb,
  
  -- Scoring (pour les évaluations)
  scoring_config JSONB DEFAULT '{
    "enabled": false,
    "passing_score": 50,
    "show_score_immediately": true
  }'::jsonb,
  
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(org_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_survey_templates_org ON survey_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_survey_templates_type ON survey_templates(survey_type);

DROP TRIGGER IF EXISTS update_survey_templates_updated_at ON survey_templates;
CREATE TRIGGER update_survey_templates_updated_at
  BEFORE UPDATE ON survey_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.3 Questionnaires assignés à une session
CREATE TABLE IF NOT EXISTS session_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  survey_template_id UUID REFERENCES survey_templates(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  survey_type TEXT NOT NULL,
  questions JSONB NOT NULL,
  settings JSONB DEFAULT '{}',
  scoring_config JSONB DEFAULT '{}',
  
  -- Planification
  opens_at TIMESTAMP WITH TIME ZONE,
  closes_at TIMESTAMP WITH TIME ZONE,
  reminder_days INTEGER[] DEFAULT '{}',
  
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'open', 'closed', 'archived'
  )),
  
  -- Statistiques dénormalisées
  total_recipients INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  average_score DECIMAL(5,2),
  nps_score INTEGER,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_surveys_session ON session_surveys(session_id);
CREATE INDEX IF NOT EXISTS idx_session_surveys_status ON session_surveys(status);
CREATE INDEX IF NOT EXISTS idx_session_surveys_type ON session_surveys(survey_type);

DROP TRIGGER IF EXISTS update_session_surveys_updated_at ON session_surveys;
CREATE TRIGGER update_session_surveys_updated_at
  BEFORE UPDATE ON session_surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.4 Réponses aux questionnaires
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_survey_id UUID REFERENCES session_surveys(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  answers JSONB NOT NULL DEFAULT '{}',
  
  status TEXT DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'submitted', 'validated'
  )),
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_spent INTERVAL,
  
  -- Score (pour évaluations)
  score DECIMAL(8,2),
  max_score DECIMAL(8,2),
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  
  -- Détails scoring
  scoring_details JSONB,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(session_survey_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(session_survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_status ON survey_responses(status);

-- 3.5 Syllabus / Programme détaillé
CREATE TABLE IF NOT EXISTS syllabus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  
  CONSTRAINT syllabus_single_parent CHECK (
    (program_id IS NOT NULL)::int + 
    (course_id IS NOT NULL)::int + 
    (session_id IS NOT NULL)::int = 1
  ),
  
  title TEXT NOT NULL,
  subtitle TEXT,
  version TEXT DEFAULT '1.0',
  
  -- Durée
  duration_hours DECIMAL(5,1),
  duration_days DECIMAL(4,1),
  
  -- Modalité
  modality TEXT CHECK (modality IN ('presential', 'remote', 'hybrid', 'elearning')),
  
  -- Public
  target_audience TEXT,
  prerequisites TEXT,
  max_participants INTEGER,
  
  -- Objectifs
  objectives JSONB DEFAULT '[]',
  skills_acquired JSONB DEFAULT '[]',
  
  -- Programme détaillé
  program_content JSONB DEFAULT '[]',
  
  -- Méthodes
  teaching_methods TEXT,
  resources_provided TEXT,
  evaluation_methods TEXT,
  
  -- Certification
  certification_info TEXT,
  cpf_code TEXT,
  rncp_code TEXT,
  
  -- Accessibilité
  accessibility_info TEXT,
  
  -- Formateur
  trainer_info JSONB DEFAULT '{}',
  
  -- Logistique
  location_info TEXT,
  equipment_required TEXT,
  
  -- Tarification
  price_info JSONB DEFAULT '{}',
  
  -- État
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syllabus_program ON syllabus(program_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_course ON syllabus(course_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_session ON syllabus(session_id);

DROP TRIGGER IF EXISTS update_syllabus_updated_at ON syllabus;
CREATE TRIGGER update_syllabus_updated_at
  BEFORE UPDATE ON syllabus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.6 Modèles de convention
CREATE TABLE IF NOT EXISTS convention_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  convention_type TEXT CHECK (convention_type IN ('inter', 'intra', 'individual')),
  
  content_html TEXT,
  content_json JSONB,
  
  -- Placeholders disponibles
  available_placeholders TEXT[] DEFAULT ARRAY[
    '{{client_name}}', '{{client_address}}', '{{client_siret}}',
    '{{training_title}}', '{{training_dates}}', '{{training_duration}}',
    '{{training_location}}', '{{training_price}}', '{{training_objectives}}',
    '{{learner_names}}', '{{learner_count}}',
    '{{trainer_name}}', '{{org_name}}', '{{org_address}}', '{{org_siret}}'
  ],
  
  clauses JSONB DEFAULT '{}',
  
  signatures_required JSONB DEFAULT '[
    {"role": "client", "label": "Le client"},
    {"role": "org", "label": "L''organisme de formation"}
  ]'::jsonb,
  
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_convention_templates_org ON convention_templates(org_id);

DROP TRIGGER IF EXISTS update_convention_templates_updated_at ON convention_templates;
CREATE TRIGGER update_convention_templates_updated_at
  BEFORE UPDATE ON convention_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.7 Feuilles d'émargement
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  attendance_date DATE NOT NULL,
  
  -- Demi-journées
  morning_present BOOLEAN,
  morning_signed_at TIMESTAMP WITH TIME ZONE,
  morning_signature TEXT, -- Base64 de la signature manuscrite
  
  afternoon_present BOOLEAN,
  afternoon_signed_at TIMESTAMP WITH TIME ZONE,
  afternoon_signature TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Validation formateur
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(session_id, user_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(attendance_date);

-- ============================================================================
-- PARTIE 4 : TABLES GRADEBOOK (CARNET DE NOTES)
-- ============================================================================

-- 4.1 Activités évaluables
CREATE TABLE IF NOT EXISTS gradebook_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  
  -- Liens optionnels avec le contenu
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  survey_id UUID REFERENCES session_surveys(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'quiz', 'quiz_live', 'tp', 'exercise', 'project',
    'oral', 'participation', 'assignment', 'peer_review',
    'self_assessment', 'attendance', 'custom'
  )),
  
  -- Configuration notation
  grading_type TEXT DEFAULT 'points' CHECK (grading_type IN (
    'points', 'percentage', 'letter', 'pass_fail', 'rubric', 'competency'
  )),
  
  max_points DECIMAL(8,2) DEFAULT 100,
  passing_score DECIMAL(8,2) DEFAULT 50,
  weight DECIMAL(5,2) DEFAULT 1.0,
  
  -- Grille de critères
  rubric JSONB,
  
  -- Compétences évaluées
  competencies JSONB DEFAULT '[]',
  
  -- Paramètres soumission
  submission_settings JSONB DEFAULT '{
    "allow_late": true,
    "late_penalty_percent": 10,
    "late_penalty_per_day": 5,
    "max_late_days": 7,
    "max_attempts": 1,
    "allow_resubmit": false,
    "file_types": [],
    "max_file_size_mb": 10,
    "require_comment": false
  }'::jsonb,
  
  -- Quiz settings
  quiz_settings JSONB DEFAULT '{
    "time_limit_minutes": null,
    "shuffle_questions": false,
    "shuffle_answers": false,
    "show_correct_after": "submit",
    "allow_review": true,
    "one_question_per_page": false
  }'::jsonb,
  
  -- Questions (pour quiz intégrés)
  questions JSONB,
  
  -- Correction
  auto_grade BOOLEAN DEFAULT FALSE,
  show_grade_immediately BOOLEAN DEFAULT TRUE,
  
  -- Planification
  available_from TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  late_deadline TIMESTAMP WITH TIME ZONE,
  
  -- État
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'published', 'open', 'closed', 'grading', 'graded', 'archived'
  )),
  
  position INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gradebook_activities_session ON gradebook_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_gradebook_activities_item ON gradebook_activities(item_id);
CREATE INDEX IF NOT EXISTS idx_gradebook_activities_type ON gradebook_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_gradebook_activities_status ON gradebook_activities(status);
CREATE INDEX IF NOT EXISTS idx_gradebook_activities_due ON gradebook_activities(due_date);

DROP TRIGGER IF EXISTS update_gradebook_activities_updated_at ON gradebook_activities;
CREATE TRIGGER update_gradebook_activities_updated_at
  BEFORE UPDATE ON gradebook_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.2 Soumissions des apprenants
CREATE TABLE IF NOT EXISTS learner_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  activity_id UUID REFERENCES gradebook_activities(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  attempt_number INTEGER DEFAULT 1,
  
  -- Type de contenu
  content_type TEXT CHECK (content_type IN (
    'text', 'rich_text', 'code', 'file', 'url', 'json', 'mixed'
  )),
  
  -- Contenu
  text_content TEXT,
  rich_text_content JSONB,
  code_content TEXT,
  code_language TEXT,
  file_paths TEXT[],
  file_names TEXT[],
  external_url TEXT,
  json_content JSONB,
  
  -- Pour les quiz
  quiz_answers JSONB,
  quiz_time_spent INTEGER, -- secondes
  
  -- État
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'late', 'grading', 'graded', 'returned', 'resubmitted'
  )),
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Temps passé
  time_spent INTERVAL,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Commentaire apprenant
  learner_comment TEXT,
  
  UNIQUE(activity_id, user_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_learner_submissions_activity ON learner_submissions(activity_id);
CREATE INDEX IF NOT EXISTS idx_learner_submissions_session ON learner_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_learner_submissions_user ON learner_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_submissions_status ON learner_submissions(status);
CREATE INDEX IF NOT EXISTS idx_learner_submissions_submitted ON learner_submissions(submitted_at DESC);

-- 4.3 Notes
CREATE TABLE IF NOT EXISTS grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  submission_id UUID REFERENCES learner_submissions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  activity_id UUID REFERENCES gradebook_activities(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Note
  score DECIMAL(8,2),
  max_score DECIMAL(8,2),
  percentage DECIMAL(5,2),
  
  -- Conversions
  letter_grade TEXT,
  passed BOOLEAN,
  
  -- Détails rubrique
  rubric_scores JSONB,
  
  -- Détails compétences
  competency_scores JSONB,
  
  -- Auto-correction
  auto_graded BOOLEAN DEFAULT FALSE,
  auto_grade_details JSONB,
  
  -- Pénalités
  late_penalty DECIMAL(5,2) DEFAULT 0,
  other_adjustments DECIMAL(5,2) DEFAULT 0,
  adjustment_reason TEXT,
  final_score DECIMAL(8,2),
  
  -- Feedback
  feedback_text TEXT,
  feedback_html TEXT,
  feedback_audio_path TEXT,
  feedback_video_path TEXT,
  private_notes TEXT,
  
  -- Annotations sur fichiers
  annotations JSONB,
  
  -- Correcteur
  graded_by UUID REFERENCES profiles(id),
  grading_method TEXT CHECK (grading_method IN (
    'auto', 'manual', 'peer', 'self', 'ai_assisted'
  )),
  
  -- Publication
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Contestation
  is_contested BOOLEAN DEFAULT FALSE,
  contest_reason TEXT,
  contest_resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grades_submission ON grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_grades_activity ON grades(activity_id);
CREATE INDEX IF NOT EXISTS idx_grades_session ON grades(session_id);
CREATE INDEX IF NOT EXISTS idx_grades_user ON grades(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_published ON grades(is_published);

DROP TRIGGER IF EXISTS update_grades_updated_at ON grades;
CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.4 Historique des notes
CREATE TABLE IF NOT EXISTS grade_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE NOT NULL,
  
  previous_score DECIMAL(8,2),
  new_score DECIMAL(8,2),
  previous_feedback TEXT,
  new_feedback TEXT,
  
  change_reason TEXT,
  change_type TEXT CHECK (change_type IN (
    'initial', 'revision', 'appeal', 'error_correction', 'late_penalty'
  )),
  
  changed_by UUID REFERENCES profiles(id) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grade_history_grade ON grade_history(grade_id);
CREATE INDEX IF NOT EXISTS idx_grade_history_date ON grade_history(changed_at DESC);

-- 4.5 Événements temps réel gradebook
CREATE TABLE IF NOT EXISTS realtime_grade_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    -- Soumissions
    'submission_started', 'submission_draft_saved', 'submission_submitted',
    'submission_late', 'submission_returned',
    
    -- Quiz live
    'quiz_answer_submitted', 'quiz_completed',
    
    -- Correction
    'grading_started', 'grade_assigned', 'grade_published', 'feedback_added',
    
    -- Alertes
    'help_requested', 'help_resolved',
    'time_warning', 'deadline_approaching', 'deadline_passed'
  )),
  
  activity_id UUID REFERENCES gradebook_activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES learner_submissions(id) ON DELETE CASCADE,
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  
  payload JSONB DEFAULT '{}',
  
  -- TTL pour nettoyage automatique
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_realtime_grade_events_session ON realtime_grade_events(session_id);
CREATE INDEX IF NOT EXISTS idx_realtime_grade_events_type ON realtime_grade_events(event_type);
CREATE INDEX IF NOT EXISTS idx_realtime_grade_events_created ON realtime_grade_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_grade_events_expires ON realtime_grade_events(expires_at);

-- 4.6 Résumé gradebook par apprenant
CREATE TABLE IF NOT EXISTS session_gradebook_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Statistiques
  total_activities INTEGER DEFAULT 0,
  completed_activities INTEGER DEFAULT 0,
  graded_activities INTEGER DEFAULT 0,
  pending_activities INTEGER DEFAULT 0,
  
  -- Scores
  total_points_earned DECIMAL(10,2) DEFAULT 0,
  total_points_possible DECIMAL(10,2) DEFAULT 0,
  weighted_average DECIMAL(5,2),
  
  -- Par type
  quiz_count INTEGER DEFAULT 0,
  quiz_average DECIMAL(5,2),
  tp_count INTEGER DEFAULT 0,
  tp_average DECIMAL(5,2),
  exercise_count INTEGER DEFAULT 0,
  exercise_average DECIMAL(5,2),
  participation_score DECIMAL(5,2),
  
  -- Compétences
  competency_summary JSONB DEFAULT '{}',
  
  -- Validation
  is_passing BOOLEAN DEFAULT FALSE,
  overall_status TEXT CHECK (overall_status IN (
    'not_started', 'in_progress', 'completed', 'passed', 'failed', 'incomplete'
  )) DEFAULT 'not_started',
  
  -- Dates
  first_activity_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gradebook_summary_session ON session_gradebook_summary(session_id);
CREATE INDEX IF NOT EXISTS idx_gradebook_summary_user ON session_gradebook_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_gradebook_summary_status ON session_gradebook_summary(overall_status);

-- ============================================================================
-- PARTIE 5 : TABLES NOTIFICATIONS
-- ============================================================================

-- 5.1 Préférences de notification
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Canaux
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  
  -- Types de notifications
  preferences JSONB DEFAULT '{
    "session_reminder": {"email": true, "push": true, "in_app": true},
    "session_started": {"email": false, "push": true, "in_app": true},
    "new_activity": {"email": true, "push": true, "in_app": true},
    "deadline_reminder": {"email": true, "push": true, "in_app": true},
    "grade_published": {"email": true, "push": true, "in_app": true},
    "feedback_received": {"email": true, "push": true, "in_app": true},
    "survey_available": {"email": true, "push": false, "in_app": true},
    "certificate_ready": {"email": true, "push": true, "in_app": true},
    "trainer_message": {"email": false, "push": true, "in_app": true}
  }'::jsonb,
  
  -- Timing
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'Europe/Paris',
  
  -- Digest
  email_digest_frequency TEXT CHECK (email_digest_frequency IN (
    'immediate', 'hourly', 'daily', 'weekly', 'none'
  )) DEFAULT 'immediate',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5.2 Notifications in-app
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Type et catégorie
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'session_reminder', 'session_started', 'session_ended',
    'new_activity', 'deadline_reminder', 'deadline_passed',
    'submission_received', 'grade_published', 'feedback_received',
    'survey_available', 'survey_reminder',
    'certificate_ready', 'document_ready',
    'trainer_message', 'help_response',
    'system', 'custom'
  )),
  
  category TEXT CHECK (category IN (
    'session', 'activity', 'grade', 'document', 'message', 'system'
  )),
  
  -- Contenu
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Action
  action_url TEXT,
  action_label TEXT,
  
  -- Contexte
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES gradebook_activities(id) ON DELETE SET NULL,
  
  -- Données additionnelles
  data JSONB DEFAULT '{}',
  
  -- État
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Priorité
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  
  -- TTL
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_session ON notifications(session_id);

-- 5.3 File d'attente d'envoi (email, push)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms', 'email_digest', 'scheduled')),
  
  -- Destinataire
  recipient TEXT NOT NULL, -- email, device token, phone
  
  -- Contenu
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  
  -- Template
  template_id TEXT,
  template_data JSONB,
  
  -- État
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'sent', 'failed', 'cancelled'
  )),
  
  -- Retry
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  
  -- Erreur
  error_message TEXT,
  error_code TEXT,
  
  -- Planification
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Résultat
  sent_at TIMESTAMP WITH TIME ZONE,
  external_id TEXT, -- ID du provider (SendGrid, etc.)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_channel ON notification_queue(channel);

-- 5.4 Push subscriptions (Web Push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  
  -- Device info
  device_type TEXT CHECK (device_type IN ('web', 'android', 'ios')),
  device_name TEXT,
  user_agent TEXT,
  
  -- État
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(user_id, is_active) 
  WHERE is_active = TRUE;

-- ============================================================================
-- PARTIE 6 : TABLES QUIZ LIVE
-- ============================================================================

-- 6.1 Sessions de quiz live
CREATE TABLE IF NOT EXISTS live_quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES gradebook_activities(id) ON DELETE CASCADE NOT NULL,
  
  -- État du quiz
  status TEXT DEFAULT 'waiting' CHECK (status IN (
    'waiting',          -- En attente de démarrage
    'question_display', -- Question affichée
    'answering',        -- Réponses acceptées
    'answer_closed',    -- Réponses fermées
    'showing_results',  -- Affichage résultats
    'leaderboard',      -- Affichage classement
    'completed'         -- Terminé
  )),
  
  -- Question actuelle
  current_question_index INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  
  -- Timing
  question_started_at TIMESTAMP WITH TIME ZONE,
  question_time_limit INTEGER, -- secondes
  
  -- Participants
  participant_count INTEGER DEFAULT 0,
  answers_received INTEGER DEFAULT 0,
  
  -- Classement en temps réel
  leaderboard JSONB DEFAULT '[]',
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_quiz_sessions_session ON live_quiz_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_sessions_activity ON live_quiz_sessions(activity_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_sessions_status ON live_quiz_sessions(status);

DROP TRIGGER IF EXISTS update_live_quiz_sessions_updated_at ON live_quiz_sessions;
CREATE TRIGGER update_live_quiz_sessions_updated_at
  BEFORE UPDATE ON live_quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6.2 Réponses quiz live
CREATE TABLE IF NOT EXISTS live_quiz_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_quiz_id UUID REFERENCES live_quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  question_index INTEGER NOT NULL,
  
  -- Réponse
  answer JSONB NOT NULL,
  
  -- Temps de réponse
  answer_time_ms INTEGER, -- millisecondes depuis affichage question
  
  -- Résultat
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  
  -- Bonus temps
  time_bonus INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(live_quiz_id, user_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_live_quiz_answers_quiz ON live_quiz_answers(live_quiz_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_answers_user ON live_quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_answers_question ON live_quiz_answers(live_quiz_id, question_index);

-- 6.3 Scores quiz live par participant
CREATE TABLE IF NOT EXISTS live_quiz_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_quiz_id UUID REFERENCES live_quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Score total
  total_score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answered INTEGER DEFAULT 0,
  
  -- Stats
  average_time_ms INTEGER,
  fastest_answer_ms INTEGER,
  streak_best INTEGER DEFAULT 0, -- Meilleure série de bonnes réponses
  current_streak INTEGER DEFAULT 0,
  
  -- Classement final
  final_rank INTEGER,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(live_quiz_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_quiz_scores_quiz ON live_quiz_scores(live_quiz_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_scores_user ON live_quiz_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_scores_rank ON live_quiz_scores(live_quiz_id, total_score DESC);

-- ============================================================================
-- PARTIE 7 : TRIGGERS ET FONCTIONS
-- ============================================================================

-- 7.1 Trigger : Créer session_state quand une session est créée
CREATE OR REPLACE FUNCTION create_session_state()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO session_state (session_id)
  VALUES (NEW.id)
  ON CONFLICT (session_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_session_state ON sessions;
CREATE TRIGGER trigger_create_session_state
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_session_state();

-- 7.2 Trigger : Créer learner_progress quand un membre rejoint
CREATE OR REPLACE FUNCTION create_learner_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'learner' THEN
    INSERT INTO learner_progress (session_id, user_id)
    VALUES (NEW.session_id, NEW.user_id)
    ON CONFLICT (session_id, user_id) DO NOTHING;
    
    INSERT INTO session_gradebook_summary (session_id, user_id)
    VALUES (NEW.session_id, NEW.user_id)
    ON CONFLICT (session_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_learner_progress ON session_members;
CREATE TRIGGER trigger_create_learner_progress
  AFTER INSERT ON session_members
  FOR EACH ROW
  EXECUTE FUNCTION create_learner_progress();

-- 7.3 Trigger : Événement temps réel sur soumission
CREATE OR REPLACE FUNCTION notify_submission_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO realtime_grade_events (
    session_id, event_type, activity_id, user_id, submission_id, payload
  ) VALUES (
    NEW.session_id,
    CASE 
      WHEN TG_OP = 'INSERT' AND NEW.status = 'draft' THEN 'submission_started'
      WHEN NEW.status = 'submitted' THEN 'submission_submitted'
      WHEN NEW.status = 'late' THEN 'submission_late'
      WHEN NEW.status = 'returned' THEN 'submission_returned'
      ELSE 'submission_draft_saved'
    END,
    NEW.activity_id,
    NEW.user_id,
    NEW.id,
    jsonb_build_object(
      'status', NEW.status,
      'attempt', NEW.attempt_number,
      'timestamp', NOW()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_submission_event ON learner_submissions;
CREATE TRIGGER trigger_submission_event
  AFTER INSERT OR UPDATE ON learner_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_submission_event();

-- 7.4 Trigger : Événement temps réel sur note publiée
CREATE OR REPLACE FUNCTION notify_grade_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = TRUE AND (OLD IS NULL OR OLD.is_published = FALSE) THEN
    -- Événement temps réel
    INSERT INTO realtime_grade_events (
      session_id, event_type, activity_id, user_id, submission_id, grade_id, payload
    ) VALUES (
      NEW.session_id,
      'grade_published',
      NEW.activity_id,
      NEW.user_id,
      NEW.submission_id,
      NEW.id,
      jsonb_build_object(
        'score', NEW.final_score,
        'max_score', NEW.max_score,
        'percentage', NEW.percentage,
        'passed', NEW.passed
      )
    );
    
    -- Notification in-app
    INSERT INTO notifications (
      user_id, notification_type, category, title, message,
      session_id, activity_id, data
    )
    SELECT
      NEW.user_id,
      'grade_published',
      'grade',
      'Nouvelle note disponible',
      format('Vous avez reçu %s/%s pour "%s"', 
        NEW.final_score::text, NEW.max_score::text, ga.title),
      NEW.session_id,
      NEW.activity_id,
      jsonb_build_object(
        'grade_id', NEW.id,
        'score', NEW.final_score,
        'max_score', NEW.max_score,
        'passed', NEW.passed
      )
    FROM gradebook_activities ga
    WHERE ga.id = NEW.activity_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grade_event ON grades;
CREATE TRIGGER trigger_grade_event
  AFTER INSERT OR UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION notify_grade_event();

-- 7.5 Trigger : Mettre à jour le résumé gradebook
CREATE OR REPLACE FUNCTION update_gradebook_summary()
RETURNS TRIGGER AS $$
BEGIN
  WITH stats AS (
    SELECT
      COUNT(DISTINCT ga.id) as total_activities,
      COUNT(DISTINCT CASE WHEN ls.status IN ('submitted', 'graded') THEN ls.id END) as completed,
      COUNT(DISTINCT CASE WHEN g.id IS NOT NULL AND g.is_published THEN g.id END) as graded,
      COALESCE(SUM(CASE WHEN g.is_published THEN g.final_score END), 0) as points_earned,
      COALESCE(SUM(CASE WHEN g.is_published THEN g.max_score END), 0) as points_possible,
      CASE 
        WHEN SUM(CASE WHEN g.is_published THEN ga.weight END) > 0 
        THEN SUM(CASE WHEN g.is_published THEN g.percentage * ga.weight END) / 
             SUM(CASE WHEN g.is_published THEN ga.weight END)
        ELSE NULL
      END as weighted_avg
    FROM gradebook_activities ga
    LEFT JOIN learner_submissions ls ON ls.activity_id = ga.id AND ls.user_id = NEW.user_id
    LEFT JOIN grades g ON g.submission_id = ls.id
    WHERE ga.session_id = NEW.session_id
  )
  INSERT INTO session_gradebook_summary (
    session_id, user_id,
    total_activities, completed_activities, graded_activities,
    total_points_earned, total_points_possible, weighted_average,
    last_activity_at, updated_at
  )
  SELECT
    NEW.session_id,
    NEW.user_id,
    stats.total_activities,
    stats.completed,
    stats.graded,
    stats.points_earned,
    stats.points_possible,
    stats.weighted_avg,
    NOW(),
    NOW()
  FROM stats
  ON CONFLICT (session_id, user_id) 
  DO UPDATE SET
    total_activities = EXCLUDED.total_activities,
    completed_activities = EXCLUDED.completed_activities,
    graded_activities = EXCLUDED.graded_activities,
    total_points_earned = EXCLUDED.total_points_earned,
    total_points_possible = EXCLUDED.total_points_possible,
    weighted_average = EXCLUDED.weighted_average,
    last_activity_at = EXCLUDED.last_activity_at,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gradebook_summary ON grades;
CREATE TRIGGER trigger_update_gradebook_summary
  AFTER INSERT OR UPDATE ON grades
  FOR EACH ROW
  WHEN (NEW.is_published = TRUE)
  EXECUTE FUNCTION update_gradebook_summary();

-- 7.6 Fonction : Historiser les changements de notes
CREATE OR REPLACE FUNCTION log_grade_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.score IS DISTINCT FROM NEW.score OR
    OLD.feedback_text IS DISTINCT FROM NEW.feedback_text
  ) THEN
    INSERT INTO grade_history (
      grade_id, previous_score, new_score, 
      previous_feedback, new_feedback,
      change_type, changed_by
    ) VALUES (
      NEW.id, OLD.score, NEW.score,
      OLD.feedback_text, NEW.feedback_text,
      'revision', NEW.graded_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_grade_change ON grades;
CREATE TRIGGER trigger_log_grade_change
  AFTER UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION log_grade_change();

-- 7.7 Fonction : Mettre à jour les statistiques survey
CREATE OR REPLACE FUNCTION update_survey_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE session_surveys
  SET 
    total_responses = (
      SELECT COUNT(*) FROM survey_responses 
      WHERE session_survey_id = NEW.session_survey_id AND status = 'submitted'
    ),
    completion_rate = (
      SELECT COUNT(*) * 100.0 / NULLIF(total_recipients, 0)
      FROM session_surveys ss
      WHERE ss.id = NEW.session_survey_id
    ),
    average_score = (
      SELECT AVG(percentage) FROM survey_responses
      WHERE session_survey_id = NEW.session_survey_id 
      AND status = 'submitted' AND percentage IS NOT NULL
    ),
    updated_at = NOW()
  WHERE id = NEW.session_survey_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_survey_stats ON survey_responses;
CREATE TRIGGER trigger_update_survey_stats
  AFTER INSERT OR UPDATE ON survey_responses
  FOR EACH ROW
  WHEN (NEW.status = 'submitted')
  EXECUTE FUNCTION update_survey_stats();

-- ============================================================================
-- PARTIE 8 : FONCTIONS UTILITAIRES
-- ============================================================================

-- 8.1 Obtenir les statistiques d'une session
CREATE OR REPLACE FUNCTION get_session_stats(p_session_id UUID)
RETURNS TABLE (
  total_learners INTEGER,
  active_learners INTEGER,
  average_progress DECIMAL,
  completion_rate DECIMAL,
  average_score DECIMAL,
  help_requests_count INTEGER,
  attendance_rate DECIMAL,
  pass_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT CASE WHEN sm.role = 'learner' THEN sm.user_id END)::INTEGER as total_learners,
    COUNT(DISTINCT CASE WHEN sm.status = 'active' AND sm.role = 'learner' THEN sm.user_id END)::INTEGER as active_learners,
    AVG(CASE WHEN lp.modules_completed > 0 
        THEN (lp.modules_completed * 100.0 / NULLIF(
          (SELECT COUNT(*) FROM modules m 
           JOIN courses c ON c.id = m.course_id
           JOIN sessions s ON s.course_id = c.id
           WHERE s.id = p_session_id), 0))
        ELSE 0 END)::DECIMAL as average_progress,
    (COUNT(DISTINCT CASE WHEN sm.status = 'completed' AND sm.role = 'learner' THEN sm.user_id END) * 100.0 / 
     NULLIF(COUNT(DISTINCT CASE WHEN sm.role = 'learner' THEN sm.user_id END), 0))::DECIMAL as completion_rate,
    AVG(sgs.weighted_average)::DECIMAL as average_score,
    (SELECT COUNT(*) FROM session_events 
     WHERE session_id = p_session_id AND event_type = 'help_requested')::INTEGER as help_requests_count,
    (COUNT(DISTINCT CASE WHEN sm.status IN ('active', 'completed') AND sm.role = 'learner' THEN sm.user_id END) * 100.0 / 
     NULLIF(COUNT(DISTINCT CASE WHEN sm.role = 'learner' THEN sm.user_id END), 0))::DECIMAL as attendance_rate,
    (COUNT(DISTINCT CASE WHEN sgs.is_passing = TRUE THEN sgs.user_id END) * 100.0 /
     NULLIF(COUNT(DISTINCT CASE WHEN sm.role = 'learner' THEN sm.user_id END), 0))::DECIMAL as pass_rate
  FROM session_members sm
  LEFT JOIN learner_progress lp ON lp.session_id = sm.session_id AND lp.user_id = sm.user_id
  LEFT JOIN session_gradebook_summary sgs ON sgs.session_id = sm.session_id AND sgs.user_id = sm.user_id
  WHERE sm.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.2 Obtenir le classement d'un quiz live
CREATE OR REPLACE FUNCTION get_live_quiz_leaderboard(p_live_quiz_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  display_name TEXT,
  total_score INTEGER,
  correct_answers INTEGER,
  average_time_ms INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY lqs.total_score DESC, lqs.average_time_ms ASC)::INTEGER as rank,
    lqs.user_id,
    COALESCE(sm.display_name, p.full_name) as display_name,
    lqs.total_score,
    lqs.correct_answers,
    lqs.average_time_ms
  FROM live_quiz_scores lqs
  JOIN profiles p ON p.id = lqs.user_id
  LEFT JOIN session_members sm ON sm.user_id = lqs.user_id 
    AND sm.session_id = (SELECT session_id FROM live_quiz_sessions WHERE id = p_live_quiz_id)
  WHERE lqs.live_quiz_id = p_live_quiz_id
  ORDER BY lqs.total_score DESC, lqs.average_time_ms ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.3 Nettoyer les anciens événements temps réel
CREATE OR REPLACE FUNCTION cleanup_expired_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM realtime_grade_events
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM session_events
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTIE 9 : ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE session_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE convention_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gradebook_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_grade_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_gradebook_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_quiz_scores ENABLE ROW LEVEL SECURITY;

-- Policies session_state
DROP POLICY IF EXISTS "Session state viewable by participants" ON session_state;
CREATE POLICY "Session state viewable by participants" ON session_state
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_state.session_id
      AND sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Session state manageable by trainers" ON session_state;
CREATE POLICY "Session state manageable by trainers" ON session_state
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_state.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );

-- Policies session_members
DROP POLICY IF EXISTS "Session members viewable by participants" ON session_members;
CREATE POLICY "Session members viewable by participants" ON session_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_members.session_id
      AND sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Session members manageable by trainers" ON session_members;
CREATE POLICY "Session members manageable by trainers" ON session_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_members.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );

-- Policies learner_progress
DROP POLICY IF EXISTS "Own progress viewable" ON learner_progress;
CREATE POLICY "Own progress viewable" ON learner_progress
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "All progress viewable by trainers" ON learner_progress;
CREATE POLICY "All progress viewable by trainers" ON learner_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = learner_progress.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );

DROP POLICY IF EXISTS "Own progress updatable" ON learner_progress;
CREATE POLICY "Own progress updatable" ON learner_progress
  FOR UPDATE USING (user_id = auth.uid());

-- Policies grades
DROP POLICY IF EXISTS "Own grades viewable" ON grades;
CREATE POLICY "Own grades viewable" ON grades
  FOR SELECT USING (
    user_id = auth.uid() AND is_published = TRUE
  );

DROP POLICY IF EXISTS "Trainers can view all grades" ON grades;
CREATE POLICY "Trainers can view all grades" ON grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = grades.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );

DROP POLICY IF EXISTS "Trainers can manage grades" ON grades;
CREATE POLICY "Trainers can manage grades" ON grades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = grades.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );

-- Policies notifications
DROP POLICY IF EXISTS "Own notifications" ON notifications;
CREATE POLICY "Own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Own notification preferences" ON notification_preferences;
CREATE POLICY "Own notification preferences" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Policies submissions
DROP POLICY IF EXISTS "Own submissions viewable" ON learner_submissions;
CREATE POLICY "Own submissions viewable" ON learner_submissions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can view all submissions" ON learner_submissions;
CREATE POLICY "Trainers can view all submissions" ON learner_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = learner_submissions.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );

DROP POLICY IF EXISTS "Learners can create own submissions" ON learner_submissions;
CREATE POLICY "Learners can create own submissions" ON learner_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Learners can update own submissions" ON learner_submissions;
CREATE POLICY "Learners can update own submissions" ON learner_submissions
  FOR UPDATE USING (user_id = auth.uid());

-- Policies session_documents
DROP POLICY IF EXISTS "Session documents viewable by participants" ON session_documents;
CREATE POLICY "Session documents viewable by participants" ON session_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_documents.session_id
      AND sm.user_id = auth.uid()
    )
    AND (visible_to_learners = TRUE OR 
      EXISTS (
        SELECT 1 FROM session_members sm
        WHERE sm.session_id = session_documents.session_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('lead_trainer', 'co_trainer')
      )
    )
  );

DROP POLICY IF EXISTS "Session documents manageable by trainers" ON session_documents;
CREATE POLICY "Session documents manageable by trainers" ON session_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_documents.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );

-- Policies survey_responses
DROP POLICY IF EXISTS "Own survey responses" ON survey_responses;
CREATE POLICY "Own survey responses" ON survey_responses
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can view survey responses" ON survey_responses;
CREATE POLICY "Trainers can view survey responses" ON survey_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_surveys ss
      JOIN session_members sm ON sm.session_id = ss.session_id
      WHERE ss.id = survey_responses.session_survey_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );

-- Policies push_subscriptions
DROP POLICY IF EXISTS "Own push subscriptions" ON push_subscriptions;
CREATE POLICY "Own push subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Policies live_quiz
DROP POLICY IF EXISTS "Live quiz viewable by participants" ON live_quiz_sessions;
CREATE POLICY "Live quiz viewable by participants" ON live_quiz_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = live_quiz_sessions.session_id
      AND sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Live quiz manageable by trainers" ON live_quiz_sessions;
CREATE POLICY "Live quiz manageable by trainers" ON live_quiz_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = live_quiz_sessions.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );

DROP POLICY IF EXISTS "Own quiz answers" ON live_quiz_answers;
CREATE POLICY "Own quiz answers" ON live_quiz_answers
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can view quiz answers" ON live_quiz_answers;
CREATE POLICY "Trainers can view quiz answers" ON live_quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM live_quiz_sessions lqs
      JOIN session_members sm ON sm.session_id = lqs.session_id
      WHERE lqs.id = live_quiz_answers.live_quiz_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
  );

-- ============================================================================
-- PARTIE 10 : DONNÉES INITIALES (TEMPLATES)
-- ============================================================================

-- Templates de questionnaires système
INSERT INTO survey_templates (id, org_id, title, slug, survey_type, timing, questions, is_system)
VALUES 
  (
    gen_random_uuid(),
    NULL,
    'Évaluation de satisfaction (à chaud)',
    'default-satisfaction',
    'post_satisfaction',
    'post_immediate',
    '[
      {"id": "sat_1", "type": "rating", "question": "Satisfaction globale de la formation", "scale": 5, "required": true, "category": "global"},
      {"id": "sat_2", "type": "rating", "question": "Qualité du contenu pédagogique", "scale": 5, "required": true, "category": "content"},
      {"id": "sat_3", "type": "rating", "question": "Qualité de l''animation / du formateur", "scale": 5, "required": true, "category": "trainer"},
      {"id": "sat_4", "type": "rating", "question": "Organisation et logistique", "scale": 5, "required": true, "category": "logistics"},
      {"id": "sat_5", "type": "nps", "question": "Recommanderiez-vous cette formation ?", "scale": 10, "required": true},
      {"id": "sat_6", "type": "choice", "question": "Les objectifs ont-ils été atteints ?", "options": ["Totalement", "Partiellement", "Pas du tout"], "required": true},
      {"id": "sat_7", "type": "text", "question": "Points forts", "required": false},
      {"id": "sat_8", "type": "text", "question": "Points d''amélioration", "required": false}
    ]'::jsonb,
    TRUE
  ),
  (
    gen_random_uuid(),
    NULL,
    'Recueil des attentes',
    'default-expectations',
    'pre_expectations',
    'pre',
    '[
      {"id": "exp_1", "type": "text", "question": "Quelles sont vos principales attentes pour cette formation ?", "required": true},
      {"id": "exp_2", "type": "rating", "question": "Comment évaluez-vous votre niveau actuel sur le sujet ?", "scale": 5, "labels": ["Débutant", "Intermédiaire", "Avancé"], "required": true},
      {"id": "exp_3", "type": "text", "question": "Y a-t-il des points spécifiques que vous aimeriez approfondir ?", "required": false},
      {"id": "exp_4", "type": "text", "question": "Avez-vous des contraintes particulières à signaler ?", "required": false}
    ]'::jsonb,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

COMMENT ON TABLE session_state IS 'État temps réel d''une session de formation';
COMMENT ON TABLE session_members IS 'Membres d''une session (formateurs, apprenants, observateurs)';
COMMENT ON TABLE learner_progress IS 'Progression individuelle des apprenants dans une session';
COMMENT ON TABLE gradebook_activities IS 'Activités évaluables (quiz, TP, exercices)';
COMMENT ON TABLE learner_submissions IS 'Soumissions des apprenants';
COMMENT ON TABLE grades IS 'Notes attribuées aux soumissions';
COMMENT ON TABLE live_quiz_sessions IS 'Sessions de quiz en direct';
COMMENT ON TABLE notifications IS 'Notifications in-app pour les utilisateurs';
COMMENT ON TABLE session_documents IS 'Documents administratifs et pédagogiques de session';
COMMENT ON TABLE survey_templates IS 'Modèles de questionnaires réutilisables';
COMMENT ON TABLE session_surveys IS 'Questionnaires assignés à une session';
COMMENT ON TABLE survey_responses IS 'Réponses des apprenants aux questionnaires';
COMMENT ON TABLE syllabus IS 'Programme détaillé de formation';
COMMENT ON TABLE convention_templates IS 'Modèles de conventions de formation';
COMMENT ON TABLE attendance_records IS 'Feuilles d''émargement';
