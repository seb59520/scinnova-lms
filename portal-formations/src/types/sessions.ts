// Types pour le système de sessions synchronisées, gradebook et notifications

// ============================================================================
// SESSIONS
// ============================================================================

export type SessionStatus = 'waiting' | 'live' | 'break' | 'exercise' | 'quiz_live' | 'discussion' | 'completed';
export type SessionMode = 'synchronous' | 'semi_guided' | 'free';
export type MemberRole = 'lead_trainer' | 'co_trainer' | 'learner' | 'observer';
export type MemberStatus = 'enrolled' | 'active' | 'idle' | 'away' | 'completed' | 'dropped';
export type LearnerRelativeStatus = 'ahead' | 'on_track' | 'behind' | 'stuck';

export interface SessionState {
  id: string;
  session_id: string;
  current_module_id: string | null;
  current_item_id: string | null;
  session_status: SessionStatus;
  unlocked_modules: string[];
  unlocked_items: string[];
  started_at: string | null;
  paused_at: string | null;
  total_pause_duration: string | null;
  trainer_message: string | null;
  trainer_message_type: 'info' | 'warning' | 'success' | 'action' | null;
  trainer_message_at: string | null;
  active_quiz_id: string | null;
  active_quiz_state: Record<string, unknown> | null;
  updated_at: string;
  updated_by: string | null;
}

export interface SessionMember {
  id: string;
  session_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  display_name: string | null;
  avatar_url: string | null;
  joined_at: string;
  last_seen_at: string;
  completed_at: string | null;
  // Joined data
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface LearnerProgress {
  id: string;
  session_id: string;
  user_id: string;
  current_module_id: string | null;
  current_item_id: string | null;
  modules_completed: number;
  items_completed: number;
  items_viewed: number;
  exercises_passed: number;
  exercises_failed: number;
  quizzes_passed: number;
  completed_items: string[];
  viewed_items: string[];
  total_time_spent: string | null;
  time_on_current_item: string | null;
  relative_status: LearnerRelativeStatus;
  overall_score: number | null;
  last_heartbeat_at: string;
  updated_at: string;
}

export interface SessionEvent {
  id: string;
  session_id: string;
  user_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface SessionPresence {
  id: string;
  session_id: string;
  user_id: string;
  is_online: boolean;
  current_page: string | null;
  last_activity: string | null;
  connected_at: string;
  last_ping_at: string;
}

export interface PedagogySettings {
  allow_ahead: boolean;
  auto_unlock_on_complete: boolean;
  require_attendance: boolean;
  show_peer_progress: boolean;
  enable_chat: boolean;
  enable_reactions: boolean;
}

// ============================================================================
// GRADEBOOK
// ============================================================================

export type ActivityType = 'quiz' | 'quiz_live' | 'tp' | 'exercise' | 'project' | 'oral' | 'participation' | 'assignment' | 'peer_review' | 'self_assessment' | 'attendance' | 'custom';
export type GradingType = 'points' | 'percentage' | 'letter' | 'pass_fail' | 'rubric' | 'competency';
export type ActivityStatus = 'draft' | 'published' | 'open' | 'closed' | 'grading' | 'graded' | 'archived';
export type SubmissionStatus = 'draft' | 'submitted' | 'late' | 'grading' | 'graded' | 'returned' | 'resubmitted';
export type GradingMethod = 'auto' | 'manual' | 'peer' | 'self' | 'ai_assisted';

export interface GradebookActivity {
  id: string;
  session_id: string;
  item_id: string | null;
  survey_id: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  activity_type: ActivityType;
  grading_type: GradingType;
  max_points: number;
  passing_score: number;
  weight: number;
  rubric: RubricCriteria[] | null;
  competencies: Competency[] | null;
  submission_settings: SubmissionSettings;
  quiz_settings: QuizSettings | null;
  questions: QuizQuestion[] | null;
  auto_grade: boolean;
  show_grade_immediately: boolean;
  available_from: string | null;
  due_date: string | null;
  late_deadline: string | null;
  status: ActivityStatus;
  position: number;
  is_required: boolean;
  is_visible: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  max_points: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  label: string;
  description: string;
}

export interface Competency {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface SubmissionSettings {
  allow_late: boolean;
  late_penalty_percent: number;
  late_penalty_per_day: number;
  max_late_days: number;
  max_attempts: number;
  allow_resubmit: boolean;
  file_types: string[];
  max_file_size_mb: number;
  require_comment: boolean;
}

export interface QuizSettings {
  time_limit_minutes: number | null;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  show_correct_after: 'submit' | 'close' | 'never';
  allow_review: boolean;
  one_question_per_page: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'single' | 'multiple' | 'true_false' | 'order' | 'fill_blank' | 'text';
  question: string;
  image_url?: string;
  options?: QuizOption[];
  correct_answer: string | string[];
  points: number;
  time_limit?: number;
  explanation?: string;
}

export interface QuizOption {
  id: string;
  text: string;
  image_url?: string;
}

export interface LearnerSubmission {
  id: string;
  activity_id: string;
  session_id: string;
  user_id: string;
  attempt_number: number;
  content_type: 'text' | 'rich_text' | 'code' | 'file' | 'url' | 'json' | 'mixed' | null;
  text_content: string | null;
  rich_text_content: Record<string, unknown> | null;
  code_content: string | null;
  code_language: string | null;
  file_paths: string[] | null;
  file_names: string[] | null;
  external_url: string | null;
  json_content: Record<string, unknown> | null;
  quiz_answers: Record<string, unknown> | null;
  quiz_time_spent: number | null;
  status: SubmissionStatus;
  started_at: string;
  last_saved_at: string;
  submitted_at: string | null;
  time_spent: string | null;
  metadata: Record<string, unknown>;
  learner_comment: string | null;
  // Joined data
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  grade?: Grade;
}

export interface Grade {
  id: string;
  submission_id: string;
  activity_id: string;
  session_id: string;
  user_id: string;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  letter_grade: string | null;
  passed: boolean | null;
  rubric_scores: Record<string, number> | null;
  competency_scores: Record<string, number> | null;
  auto_graded: boolean;
  auto_grade_details: Record<string, unknown> | null;
  late_penalty: number;
  other_adjustments: number;
  adjustment_reason: string | null;
  final_score: number | null;
  feedback_text: string | null;
  feedback_html: string | null;
  feedback_audio_path: string | null;
  feedback_video_path: string | null;
  private_notes: string | null;
  annotations: Record<string, unknown> | null;
  graded_by: string | null;
  grading_method: GradingMethod | null;
  is_published: boolean;
  published_at: string | null;
  is_contested: boolean;
  contest_reason: string | null;
  contest_resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GradebookSummary {
  id: string;
  session_id: string;
  user_id: string;
  total_activities: number;
  completed_activities: number;
  graded_activities: number;
  pending_activities: number;
  total_points_earned: number;
  total_points_possible: number;
  weighted_average: number | null;
  quiz_count: number;
  quiz_average: number | null;
  tp_count: number;
  tp_average: number | null;
  exercise_count: number;
  exercise_average: number | null;
  participation_score: number | null;
  competency_summary: Record<string, number>;
  is_passing: boolean;
  overall_status: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed' | 'incomplete';
  first_activity_at: string | null;
  last_activity_at: string | null;
  updated_at: string;
}

// ============================================================================
// LIVE QUIZ
// ============================================================================

export type LiveQuizStatus = 'waiting' | 'question_display' | 'answering' | 'answer_closed' | 'showing_results' | 'leaderboard' | 'completed';

export interface LiveQuizSession {
  id: string;
  session_id: string;
  activity_id: string;
  status: LiveQuizStatus;
  current_question_index: number;
  total_questions: number;
  question_started_at: string | null;
  question_time_limit: number | null;
  participant_count: number;
  answers_received: number;
  leaderboard: LeaderboardEntry[];
  started_at: string | null;
  ended_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveQuizAnswer {
  id: string;
  live_quiz_id: string;
  user_id: string;
  question_index: number;
  answer: string | string[];
  answer_time_ms: number | null;
  is_correct: boolean | null;
  points_earned: number;
  time_bonus: number;
  created_at: string;
}

export interface LiveQuizScore {
  id: string;
  live_quiz_id: string;
  user_id: string;
  total_score: number;
  correct_answers: number;
  total_answered: number;
  average_time_ms: number | null;
  fastest_answer_ms: number | null;
  streak_best: number;
  current_streak: number;
  final_rank: number | null;
  updated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  total_score: number;
  correct_answers: number;
  average_time_ms?: number;
  delta?: number;
}

export interface QuestionResult {
  question_index: number;
  correct_answer: string | string[];
  answer_distribution: Record<string, number>;
  correct_count: number;
  total_answers: number;
  average_time_ms: number;
  fastest_user?: { id: string; name: string; time_ms: number };
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export type NotificationType = 
  | 'session_reminder' | 'session_started' | 'session_ended'
  | 'new_activity' | 'deadline_reminder' | 'deadline_passed'
  | 'submission_received' | 'grade_published' | 'feedback_received'
  | 'survey_available' | 'survey_reminder'
  | 'certificate_ready' | 'document_ready'
  | 'trainer_message' | 'help_response'
  | 'system' | 'custom';

export type NotificationCategory = 'session' | 'activity' | 'grade' | 'document' | 'message' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  category: NotificationCategory | null;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  session_id: string | null;
  activity_id: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  priority: NotificationPriority;
  expires_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  preferences: Record<NotificationType, {
    email: boolean;
    push: boolean;
    in_app: boolean;
  }>;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  email_digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'none';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export type DocumentType = 'convention' | 'program' | 'convocation' | 'attendance_sheet' | 'certificate' | 'certificate_template' | 'quote' | 'invoice' | 'resource' | 'other';

export interface SessionDocument {
  id: string;
  session_id: string;
  document_type: DocumentType;
  title: string;
  description: string | null;
  storage_path: string | null;
  storage_bucket: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  content_json: Record<string, unknown> | null;
  content_html: string | null;
  version: number;
  previous_version_id: string | null;
  is_signed: boolean;
  signed_at: string | null;
  signed_by: string | null;
  signature_data: Record<string, unknown> | null;
  visible_to_learners: boolean;
  visible_to_client: boolean;
  for_user_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SURVEYS
// ============================================================================

export type SurveyType = 'pre_positioning' | 'pre_expectations' | 'pre_needs' | 'during_feedback' | 'post_satisfaction' | 'post_knowledge' | 'post_cold_30' | 'post_cold_90' | 'nps' | 'custom';
export type SurveyStatus = 'draft' | 'scheduled' | 'open' | 'closed' | 'archived';

export interface SurveyTemplate {
  id: string;
  org_id: string | null;
  title: string;
  description: string | null;
  slug: string | null;
  survey_type: SurveyType;
  timing: 'pre' | 'during' | 'post_immediate' | 'post_delayed' | null;
  delay_days: number | null;
  questions: SurveyQuestion[];
  settings: SurveySettings;
  scoring_config: ScoringConfig;
  is_active: boolean;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestion {
  id: string;
  type: 'text' | 'textarea' | 'rating' | 'nps' | 'choice' | 'multiple' | 'scale';
  question: string;
  required: boolean;
  options?: string[];
  scale?: number;
  labels?: string[];
  category?: string;
}

export interface SurveySettings {
  anonymous: boolean;
  show_progress: boolean;
  allow_save_draft: boolean;
  randomize_questions: boolean;
  one_question_per_page: boolean;
  show_required_indicator: boolean;
}

export interface ScoringConfig {
  enabled: boolean;
  passing_score: number;
  show_score_immediately: boolean;
}

export interface SessionSurvey {
  id: string;
  session_id: string;
  survey_template_id: string | null;
  title: string;
  survey_type: SurveyType;
  questions: SurveyQuestion[];
  settings: SurveySettings;
  scoring_config: ScoringConfig;
  opens_at: string | null;
  closes_at: string | null;
  reminder_days: number[];
  status: SurveyStatus;
  total_recipients: number;
  total_responses: number;
  completion_rate: number;
  average_score: number | null;
  nps_score: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponse {
  id: string;
  session_survey_id: string;
  user_id: string;
  answers: Record<string, unknown>;
  status: 'in_progress' | 'submitted' | 'validated';
  started_at: string;
  submitted_at: string | null;
  time_spent: string | null;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  passed: boolean | null;
  scoring_details: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
}

// ============================================================================
// ATTENDANCE
// ============================================================================

export interface AttendanceRecord {
  id: string;
  session_id: string;
  user_id: string;
  attendance_date: string;
  morning_present: boolean | null;
  morning_signed_at: string | null;
  morning_signature: string | null;
  afternoon_present: boolean | null;
  afternoon_signed_at: string | null;
  afternoon_signature: string | null;
  notes: string | null;
  validated_by: string | null;
  validated_at: string | null;
}

// ============================================================================
// ANALYTICS / STATS
// ============================================================================

export interface SessionStats {
  total_learners: number;
  active_learners: number;
  average_progress: number;
  completion_rate: number;
  average_score: number;
  help_requests_count: number;
  attendance_rate: number;
  pass_rate: number;
}

export interface LearnerPerformance {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  progress: number;
  score: number;
  time_spent: number;
  status: LearnerRelativeStatus;
  last_activity: string;
  activities_completed: number;
  activities_total: number;
}

export interface ModuleCompletion {
  module_id: string;
  module_title: string;
  completion_rate: number;
  average_time: number;
  average_score: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

// ============================================================================
// PROJECT RESTITUTION (Restitution de projet)
// ============================================================================

export type RestitutionStatus = 'draft' | 'published' | 'open' | 'closed' | 'grading' | 'completed' | 'archived';
export type SubmissionProjectStatus = 'draft' | 'submitted' | 'late' | 'evaluated' | 'returned';

// Sous-critère d'évaluation
export interface SubCriterion {
  text: string;
  checked?: boolean;
}

// Critère d'évaluation avec pondération
export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // Pondération en %
  max_stars: number; // Nombre max d'étoiles (généralement 5)
  subcriteria?: string[]; // Liste des points à vérifier
}

// Score d'un critère donné par le formateur
export interface CriterionScore {
  stars: number; // Note en étoiles (1-5)
  comment?: string; // Commentaire optionnel
  subcriteria_checked?: boolean[]; // Points cochés
}

// Template de restitution de projet
export interface ProjectRestitutionTemplate {
  id: string;
  org_id: string | null;
  title: string;
  description: string | null;
  slug: string | null;
  criteria: EvaluationCriterion[];
  settings: ProjectRestitutionSettings;
  instructions: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Paramètres de restitution
export interface ProjectRestitutionSettings {
  max_stars: number;
  passing_percentage: number;
  allow_late_submission: boolean;
  require_presentation_link: boolean;
  require_app_link: boolean;
  require_documentation: boolean;
  file_types_allowed: string[];
  max_file_size_mb: number;
  max_files: number;
}

// Restitution de projet liée à une session
export interface SessionProjectRestitution {
  id: string;
  session_id: string;
  template_id: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  criteria: EvaluationCriterion[];
  settings: ProjectRestitutionSettings;
  available_from: string | null;
  due_date: string | null;
  late_deadline: string | null;
  status: RestitutionStatus;
  total_learners: number;
  submissions_count: number;
  evaluated_count: number;
  average_score: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Fichier uploadé pour un projet
export interface ProjectFile {
  name: string;
  path: string;
  size: number;
  type: string;
  uploaded_at: string;
}

// Outil utilisé dans un projet No-Code/Low-Code
export interface ToolUsed {
  name: string;
  role: string;
  plan: string;
  cost_monthly: number | null;
}

// Soumission d'un projet par un élève
export interface ProjectSubmission {
  id: string;
  restitution_id: string;
  session_id: string;
  user_id: string;
  project_title: string;
  project_description: string | null;
  presentation_link: string | null;
  app_link: string | null;
  documentation_link: string | null;
  repository_link: string | null;
  video_link: string | null;
  files: ProjectFile[];
  learner_notes: string | null;
  tools_used: ToolUsed[];
  status: SubmissionProjectStatus;
  started_at: string;
  last_saved_at: string;
  submitted_at: string | null;
  metadata: Record<string, unknown>;
  // Données jointes
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  evaluation?: ProjectEvaluation;
}

// Évaluation d'un projet par le formateur
export interface ProjectEvaluation {
  id: string;
  submission_id: string;
  restitution_id: string;
  session_id: string;
  user_id: string;
  criteria_scores: Record<string, CriterionScore>;
  total_stars: number;
  max_stars: number;
  star_percentage: number;
  score_20: number;
  final_score: number | null;
  passed: boolean | null;
  global_feedback: string | null;
  strengths: string | null;
  improvements: string | null;
  private_notes: string | null;
  evaluated_by: string | null;
  evaluated_at: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Résumé des évaluations pour affichage
export interface ProjectEvaluationSummary {
  total_submissions: number;
  evaluated_count: number;
  pending_count: number;
  average_score: number | null;
  score_distribution: {
    range: string;
    count: number;
  }[];
  criteria_averages: {
    criterion_id: string;
    criterion_name: string;
    average_stars: number;
  }[];
}
