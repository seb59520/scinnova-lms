export type UserRole = 'admin' | 'student' | 'instructor';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  student_id?: string | null;
  is_active?: boolean;
  created_at: string;
}

export type CourseStatus = 'draft' | 'published';
export type AccessType = 'free' | 'paid' | 'invite';

// Types for pedagogical metadata
export interface PedagogicalObjective {
  id: string;
  text: string;
  category?: string;
  order: number;
}

export interface Prerequisite {
  id: string;
  text: string;
  level?: 'required' | 'recommended' | 'optional';
  order: number;
}

export interface FinalSynthesis {
  body?: Record<string, any>;
  summary?: string;
  keyPoints?: string[];
}

export interface EvaluationItem {
  itemId: string;
  title: string;
  weight: number;
  threshold?: number;
}

export interface EvaluationsConfig {
  items: EvaluationItem[];
  passingScore?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  status: CourseStatus;
  access_type: AccessType;
  price_cents: number | null;
  currency: string | null;
  is_paid: boolean;
  allow_pdf_download?: boolean;
  is_public?: boolean;
  publication_date?: string | null;
  thumbnail_image_path: string | null;
  pedagogical_objectives: PedagogicalObjective[] | null;
  prerequisites: Prerequisite[] | null;
  recommended_path: string | null;
  final_synthesis: FinalSynthesis | null;
  evaluations_config: EvaluationsConfig | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  position: number;
  created_at: string;
}

export type ItemType = 'resource' | 'slide' | 'exercise' | 'activity' | 'tp' | 'game';
export type ItemCategory = 'cours' | 'exemple' | 'exercice' | 'tp' | 'ressource' | 'evaluation';

export interface Item {
  id: string;
  module_id: string;
  type: ItemType;
  title: string;
  content: Record<string, any> | null;
  asset_path: string | null;
  external_url: string | null;
  position: number;
  published: boolean;
  category: ItemCategory | null;
  created_at: string;
  updated_at: string;
}

export type EnrollmentStatus = 'active' | 'pending' | 'revoked';
export type EnrollmentSource = 'manual' | 'payment_future';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  session_id: string | null;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  enrolled_at: string;
}

export type SubmissionStatus = 'draft' | 'submitted' | 'graded';

export interface Submission {
  id: string;
  user_id: string;
  item_id: string;
  session_id: string | null;
  answer_text: string | null;
  answer_json: Record<string, any> | null;
  file_path: string | null;
  status: SubmissionStatus;
  grade: number | null;
  submitted_at: string;
  graded_at: string | null;
}

export interface GameScore {
  id: string;
  user_id: string;
  course_id: string;
  item_id: string;
  score: number;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface Chapter {
  id: string;
  item_id: string;
  title: string;
  content: Record<string, any> | null; // Format TipTap JSON
  position: number;
  type?: 'content' | 'game'; // Type de chapitre : contenu normal ou jeu
  game_content?: Record<string, any>; // Contenu du jeu si type === 'game'
  published: boolean; // Indique si le chapitre est publié et visible dans le mode cours
  created_at: string;
  updated_at: string;
}

export type Theme = 'light' | 'dark';
export type FontSize = 'small' | 'normal' | 'large';

export interface UserSettings {
  id: string;
  user_id: string;
  pdf_zoom: number;
  theme: Theme;
  font_size: FontSize;
  layout_preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Types pour le dashboard Formateur
export interface Org {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export type OrgMemberRole = 'admin' | 'trainer' | 'student' | 'auditor';

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgMemberRole;
  display_name: string | null;
  created_at: string;
}

export type SessionStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface Session {
  id: string;
  org_id: string;
  course_id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  status: SessionStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ExerciseType = 'multiple_choice' | 'text' | 'code' | 'file' | 'game';

export interface Exercise {
  id: string;
  item_id: string;
  type: ExerciseType;
  correct_answer: Record<string, any> | null;
  max_attempts: number;
  passing_score: number;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseAttempt {
  id: string;
  user_id: string;
  exercise_id: string;
  session_id: string | null;
  answer_text: string | null;
  answer_json: Record<string, any> | null;
  score: number | null;
  is_correct: boolean | null;
  feedback: string | null;
  attempt_number: number;
  submitted_at: string;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  session_id: string | null;
  percent: number;
  completed_at: string | null;
  started_at: string;
  updated_at: string;
}

export type ActivityEventType = 'view' | 'start' | 'complete' | 'submit' | 'abandon';

export interface ActivityEvent {
  id: string;
  user_id: string;
  session_id: string | null;
  course_id: string | null;
  module_id: string | null;
  item_id: string | null;
  event_type: ActivityEventType;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface TrainerNote {
  id: string;
  trainer_id: string;
  org_id: string;
  course_id: string | null;
  module_id: string | null;
  session_id: string | null;
  user_id: string | null;
  title: string | null;
  content: string;
  tags: string[] | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

// Types pour les KPIs et analytics
export interface SessionKPIs {
  active_learners_7d: number;
  completion_rate: number;
  avg_score: number;
  red_modules: number;
}

export interface LearnerRow {
  user_id: string;
  display_name: string;
  completion_percent: number;
  last_activity_at: string | null;
  avg_score: number | null;
  main_blockage: string | null;
  unread_submissions_count?: number;
}

export interface ModuleAnalytics {
  module_id: string;
  module_title: string;
  abandon_rate: number;
  avg_time_minutes: number | null;
  avg_score: number | null;
}

export interface ExerciseAnalytics {
  exercise_id: string;
  exercise_title: string;
  failure_rate: number;
  avg_score: number | null;
  top_errors: Array<{ error: string; count: number }>;
}

// Types pour les Programmes (fusion de formations)
// Types pour les glossaires
export interface GlossaryMetadata {
  title: string;
  description?: string;
  category?: string;
  version?: string;
  author?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GlossaryCategory {
  id: string;
  name: string;
  description?: string;
}

export interface GlossaryTerm {
  id: string;
  word: string;
  explanation: string;
  example: string;
  category_id?: string;
  tags?: string[];
  related_terms?: string[];
  language?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Glossary {
  metadata: GlossaryMetadata;
  categories?: GlossaryCategory[];
  terms: GlossaryTerm[];
}

export interface Program {
  id: string;
  title: string;
  description: string | null;
  status: CourseStatus;
  access_type: AccessType;
  price_cents: number | null;
  currency: string | null;
  summary_pdf_path: string | null;
  thumbnail_image_path: string | null;
  glossary: Glossary | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramCourse {
  id: string;
  program_id: string;
  course_id: string;
  position: number;
  created_at: string;
}

export interface ProgramCourseWithCourse extends ProgramCourse {
  courses: Course;
}

export interface ProgramEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  enrolled_at: string;
}

export interface CourseLead {
  id: string;
  email: string;
  course_id: string;
  source: 'landing_page' | 'course_page' | 'other';
  metadata: Record<string, any> | null;
  subscribed: boolean;
  created_at: string;
}

export interface CourseLeadWithCourse extends CourseLead {
  courses: Course;
}

// Types pour les associations TP ↔ Cours
export interface CourseTp {
  id: string;
  course_id: string;
  item_id: string;
  position: number;
  is_required: boolean;
  is_visible: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CourseTpWithItem extends CourseTp {
  items: Item;
}

// Types pour les lots de TP
export interface TpBatch {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  position: number;
  is_published: boolean;
  sequential_order: boolean;
  metadata: Record<string, any> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TpBatchWithCourse extends TpBatch {
  courses: Course | null;
}

export interface TpBatchItem {
  id: string;
  tp_batch_id: string;
  item_id: string;
  position: number;
  is_required: boolean;
  prerequisite_item_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface TpBatchItemWithItem extends TpBatchItem {
  items: Item;
  prerequisite_items: Item | null;
}

export interface TpBatchWithItems extends TpBatch {
  tp_batch_items: TpBatchItemWithItem[];
}

// Ressources associées à un cours
export type CourseResourceType = 'file' | 'url' | 'video' | 'document';

export interface CourseResource {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  resource_type: CourseResourceType;
  file_path: string | null;
  external_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  position: number;
  is_visible: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Vue unifiée des TP d'un cours
export interface CourseAllTp {
  course_id: string;
  course_title: string;
  tp_id: string;
  tp_title: string;
  type: string;
  source_type: 'module' | 'direct' | 'batch';
  module_id: string | null;
  module_title: string | null;
  tp_batch_id: string | null;
  tp_batch_title: string | null;
  position_in_module: number | null;
  position_in_course: number | null;
  is_required: boolean | null;
  is_visible: boolean | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TYPES POUR LE DASHBOARD FORMATEUR - PROGRAMMES ET ORGANISATIONS
// ============================================================================

// Liaison Organisation-Programme
export interface OrgProgram {
  id: string;
  org_id: string;
  program_id: string;
  granted_at: string;
  granted_by: string | null;
  is_active: boolean;
  created_at: string;
}

export interface OrgProgramWithDetails extends OrgProgram {
  programs?: Program;
  orgs?: Org;
}

// Types pour les évaluations de programme
export type EvaluationQuestionType = 'multiple_choice' | 'text' | 'code' | 'true_false';

export interface EvaluationQuestion {
  id: string;
  question: string;
  type: EvaluationQuestionType;
  options?: string[];
  correct_answer?: string;
  points: number;
  course_id?: string;
  explanation?: string;
}

export interface ProgramEvaluation {
  id: string;
  program_id: string;
  title: string;
  description: string | null;
  questions: EvaluationQuestion[];
  passing_score: number;
  max_attempts: number;
  time_limit_minutes: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answers: boolean;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramEvaluationAttempt {
  id: string;
  evaluation_id: string;
  user_id: string;
  org_id: string | null;
  answers: Record<string, string>;
  score: number | null;
  total_points: number | null;
  percentage: number | null;
  is_passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  attempt_number: number;
  results_detail: Record<string, {
    is_correct: boolean | null;
    points_earned: number | null;
    correct_answer: string;
    user_answer: string;
    needs_manual_grading?: boolean;
  }>;
}

export interface ProgramEvaluationWithProgram extends ProgramEvaluation {
  programs?: Program;
}

// Progression d'un étudiant sur un programme
export interface StudentProgramProgress {
  user_id: string;
  user_name: string;
  user_email?: string;
  org_id: string;
  org_name: string;
  program_id: string;
  program_title: string;
  total_courses: number;
  completed_courses: number;
  current_course_id: string | null;
  current_course_title: string | null;
  current_module_id: string | null;
  current_module_title: string | null;
  last_activity_at: string | null;
  overall_progress_percent: number;
  evaluation_attempts: number;
  best_evaluation_score: number | null;
  evaluation_passed: boolean | null;
}

// Résumé des résultats d'évaluation
export interface EvaluationResultsSummary {
  evaluation_id: string;
  program_id: string;
  evaluation_title: string;
  program_title: string;
  total_participants: number;
  passed_count: number;
  failed_count: number;
  average_score: number | null;
  min_score: number | null;
  max_score: number | null;
}

// TP de session avec infos programme
export interface SessionTpWithProgram {
  id: string;
  session_id: string;
  program_id: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  enonce_content: Record<string, unknown> | null;
  source_files: Array<{
    name: string;
    path: string;
    size: number;
    type: string;
    description?: string;
    uploaded_at: string;
  }>;
  criteria: unknown[];
  settings: Record<string, unknown>;
  status: 'draft' | 'published' | 'open' | 'closed' | 'grading' | 'completed' | 'archived';
  due_date: string | null;
  submissions_count: number;
  evaluated_count: number;
  average_score: number | null;
  created_at: string;
}

// Stats de progression par organisation
export interface OrgProgressStats {
  org_id: string;
  org_name: string;
  total_students: number;
  active_students_7d: number;
  avg_progress_percent: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
}

// Stats de progression par programme
export interface ProgramProgressStats {
  program_id: string;
  program_title: string;
  total_enrolled: number;
  avg_progress_percent: number;
  completed_count: number;
  in_progress_count: number;
  evaluation_pass_rate: number | null;
  avg_evaluation_score: number | null;
}
