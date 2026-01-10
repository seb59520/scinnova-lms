-- ============================================================================
-- SCRIPT D'URGENCE : Désactiver RLS sur TOUTES les tables
-- ⚠️ À utiliser uniquement si vous ne pouvez plus accéder à l'application
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Désactiver RLS sur toutes les tables principales
-- ============================================================================
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.program_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.session_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.program_courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quiz_answers DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 2 : Vérifier que RLS est désactivé
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '❌ RLS toujours activé'
    ELSE '✅ RLS désactivé'
  END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'enrollments', 'program_enrollments', 
    'courses', 'programs', 'modules', 'items', 
    'chapters', 'user_progress', 'user_settings',
    'orgs', 'org_members', 'sessions', 'session_enrollments',
    'slides', 'program_courses', 'submissions', 'quiz_attempts', 'quiz_answers'
  )
ORDER BY tablename;

-- ============================================================================
-- ÉTAPE 3 : Tester l'accès
-- ============================================================================
SELECT 
  '✅ Test réussi - Vous pouvez maintenant accéder à l''application' as status,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM enrollments) as total_enrollments,
  (SELECT COUNT(*) FROM courses) as total_courses,
  (SELECT COUNT(*) FROM submissions) as total_submissions;

-- ============================================================================
-- ⚠️ IMPORTANT : Après avoir testé, exécutez fix-enrollments-timeout.sql
-- pour réactiver RLS avec des politiques optimisées
-- ============================================================================
