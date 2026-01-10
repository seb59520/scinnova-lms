-- ============================================================================
-- Script pour ajouter des index de performance sur les tables principales
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================================================

-- Index sur enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON public.enrollments(user_id, status);

-- Index sur program_enrollments
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_id ON public.program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program_id ON public.program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status ON public.program_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_status ON public.program_enrollments(user_id, status);

-- Index sur courses
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);

-- Index sur programs
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON public.programs(created_at DESC);

-- Index sur profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Index sur modules
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_position ON public.modules(course_id, position);

-- Index sur items
CREATE INDEX IF NOT EXISTS idx_items_module_id ON public.items(module_id);
CREATE INDEX IF NOT EXISTS idx_items_position ON public.items(module_id, position);

-- Index sur chapters
CREATE INDEX IF NOT EXISTS idx_chapters_item_id ON public.chapters(item_id);
CREATE INDEX IF NOT EXISTS idx_chapters_position ON public.chapters(item_id, position);

-- Index sur user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_item_id ON public.user_progress(item_id);

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE public.enrollments;
ANALYZE public.program_enrollments;
ANALYZE public.courses;
ANALYZE public.programs;
ANALYZE public.profiles;
ANALYZE public.modules;
ANALYZE public.items;
ANALYZE public.chapters;

-- Vérifier les index créés
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('enrollments', 'program_enrollments', 'courses', 'programs', 'profiles')
ORDER BY tablename, indexname;
