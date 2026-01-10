-- ============================================================================
-- NETTOYAGE COMPLET DES POLITIQUES RLS PROBLÉMATIQUES
-- Ce script désactive RLS ET supprime les politiques sur les tables critiques
-- ============================================================================

-- 1. DÉSACTIVER RLS sur TOUTES les tables principales
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.program_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.session_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.org_members DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER les politiques problématiques sur enrollments
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;

-- 3. SUPPRIMER les politiques sur profiles (source des récursions)
DROP POLICY IF EXISTS "profile_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profile_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profile_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 4. SUPPRIMER les politiques sur courses
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Instructors can manage their own courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;

-- 5. SUPPRIMER les politiques sur programs
DROP POLICY IF EXISTS "Published programs are viewable by everyone" ON public.programs;
DROP POLICY IF EXISTS "Admins can manage all programs" ON public.programs;
DROP POLICY IF EXISTS "Instructors can manage their own programs" ON public.programs;

-- 6. SUPPRIMER les politiques sur program_enrollments
DROP POLICY IF EXISTS "Users can view their own program enrollments" ON public.program_enrollments;
DROP POLICY IF EXISTS "Admins can manage all program enrollments" ON public.program_enrollments;

-- 7. Vérifier que RLS est désactivé
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'profiles', 'enrollments', 'courses', 'programs', 
        'program_enrollments', 'modules', 'items', 'chapters'
    )
ORDER BY tablename;

-- 8. Vérifier qu'il n'y a plus de politiques sur ces tables
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'profiles', 'enrollments', 'courses', 'programs', 
        'program_enrollments', 'modules', 'items', 'chapters'
    )
ORDER BY tablename;
