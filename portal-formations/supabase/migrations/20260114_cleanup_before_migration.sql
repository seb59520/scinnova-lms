-- ============================================================================
-- CLEANUP: Suppression des tables existantes avant migration complète
-- Exécutez CE SCRIPT EN PREMIER, puis le script principal
-- ============================================================================

-- Supprimer les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS live_quiz_scores CASCADE;
DROP TABLE IF EXISTS live_quiz_answers CASCADE;
DROP TABLE IF EXISTS live_quiz_sessions CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS notification_queue CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS session_gradebook_summary CASCADE;
DROP TABLE IF EXISTS realtime_grade_events CASCADE;
DROP TABLE IF EXISTS grade_history CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS learner_submissions CASCADE;
DROP TABLE IF EXISTS gradebook_activities CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS convention_templates CASCADE;
DROP TABLE IF EXISTS syllabus CASCADE;
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS session_surveys CASCADE;
DROP TABLE IF EXISTS survey_templates CASCADE;
DROP TABLE IF EXISTS session_documents CASCADE;
DROP TABLE IF EXISTS session_presence CASCADE;
DROP TABLE IF EXISTS session_events CASCADE;
DROP TABLE IF EXISTS learner_progress CASCADE;
DROP TABLE IF EXISTS session_members CASCADE;
DROP TABLE IF EXISTS session_state CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS cleanup_expired_events() CASCADE;
DROP FUNCTION IF EXISTS get_live_quiz_leaderboard(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_session_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_survey_stats() CASCADE;
DROP FUNCTION IF EXISTS log_grade_change() CASCADE;
DROP FUNCTION IF EXISTS update_gradebook_summary() CASCADE;
DROP FUNCTION IF EXISTS notify_grade_event() CASCADE;
DROP FUNCTION IF EXISTS notify_submission_event() CASCADE;
DROP FUNCTION IF EXISTS create_learner_progress() CASCADE;
DROP FUNCTION IF EXISTS create_session_state() CASCADE;
DROP FUNCTION IF EXISTS get_session_role(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_org_member(UUID, UUID) CASCADE;

SELECT 'Cleanup terminé. Exécutez maintenant le script principal 20260114_sessions_documents_gradebook.sql' as status;
