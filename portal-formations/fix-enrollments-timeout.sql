-- ============================================================================
-- Script pour corriger le timeout sur les enrollments
-- Problème : Le fetch des enrollments timeout à cause de RLS trop lent
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Diagnostic - Vérifier l'état RLS de toutes les tables concernées
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS activé'
    ELSE '⚠️ RLS désactivé'
  END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'enrollments', 'program_enrollments', 'courses', 'programs')
ORDER BY tablename;

-- ============================================================================
-- ÉTAPE 2 : Lister les politiques RLS actuelles sur enrollments
-- ============================================================================
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NULL THEN 'Pas de condition'
    ELSE substring(qual::text, 1, 100) || '...'
  END as condition_preview
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('enrollments', 'program_enrollments')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- ÉTAPE 3 : DÉSACTIVER temporairement RLS sur les tables problématiques
-- ⚠️ Solution rapide pour débloquer l'accès
-- ============================================================================
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 4 : Supprimer les anciennes politiques sur enrollments
-- ============================================================================
DROP POLICY IF EXISTS "enrollments_select_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_select_admin" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_admin" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_admin" ON enrollments;
DROP POLICY IF EXISTS "enrollments_delete_admin" ON enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;
DROP POLICY IF EXISTS "enrollment_select" ON enrollments;
DROP POLICY IF EXISTS "enrollment_insert" ON enrollments;
DROP POLICY IF EXISTS "enrollment_update" ON enrollments;
DROP POLICY IF EXISTS "enrollment_delete" ON enrollments;

-- Supprimer les politiques sur program_enrollments
DROP POLICY IF EXISTS "program_enrollments_select_own" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollments_select_admin" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollments_insert_admin" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollments_update_admin" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollments_delete_admin" ON program_enrollments;
DROP POLICY IF EXISTS "Users can view own program enrollments" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollment_select" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollment_insert" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollment_update" ON program_enrollments;

-- Supprimer les politiques sur courses
DROP POLICY IF EXISTS "courses_select_all" ON courses;
DROP POLICY IF EXISTS "courses_select_published" ON courses;
DROP POLICY IF EXISTS "courses_select_admin" ON courses;
DROP POLICY IF EXISTS "courses_insert_admin" ON courses;
DROP POLICY IF EXISTS "courses_update_admin" ON courses;
DROP POLICY IF EXISTS "courses_delete_admin" ON courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "course_select" ON courses;
DROP POLICY IF EXISTS "course_insert" ON courses;
DROP POLICY IF EXISTS "course_update" ON courses;

-- Supprimer les politiques sur programs
DROP POLICY IF EXISTS "programs_select_all" ON programs;
DROP POLICY IF EXISTS "programs_select_published" ON programs;
DROP POLICY IF EXISTS "programs_select_admin" ON programs;
DROP POLICY IF EXISTS "programs_insert_admin" ON programs;
DROP POLICY IF EXISTS "programs_update_admin" ON programs;
DROP POLICY IF EXISTS "programs_delete_admin" ON programs;
DROP POLICY IF EXISTS "Anyone can view published programs" ON programs;
DROP POLICY IF EXISTS "program_select" ON programs;
DROP POLICY IF EXISTS "program_insert" ON programs;
DROP POLICY IF EXISTS "program_update" ON programs;

-- ============================================================================
-- ÉTAPE 5 : Créer des index pour améliorer les performances
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON public.enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_id ON public.program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_status ON public.program_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program_id ON public.program_enrollments(program_id);

CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);

-- ============================================================================
-- ÉTAPE 6 : Réactiver RLS avec des politiques SIMPLES et PERFORMANTES
-- ============================================================================

-- ----- ENROLLMENTS -----
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres inscriptions
CREATE POLICY "enrollments_select_own" ON enrollments
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Les admins peuvent tout voir (sans sous-requête complexe - utiliser service role)
CREATE POLICY "enrollments_select_admin" ON enrollments
  FOR SELECT 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- Les utilisateurs peuvent s'inscrire eux-mêmes
CREATE POLICY "enrollments_insert_own" ON enrollments
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Les admins peuvent tout gérer
CREATE POLICY "enrollments_insert_admin" ON enrollments
  FOR INSERT 
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "enrollments_update_admin" ON enrollments
  FOR UPDATE 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "enrollments_delete_admin" ON enrollments
  FOR DELETE 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- ----- PROGRAM_ENROLLMENTS -----
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_enrollments_select_own" ON program_enrollments
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "program_enrollments_select_admin" ON program_enrollments
  FOR SELECT 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "program_enrollments_insert_admin" ON program_enrollments
  FOR INSERT 
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "program_enrollments_update_admin" ON program_enrollments
  FOR UPDATE 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- ----- COURSES -----
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les cours publiés
CREATE POLICY "courses_select_published" ON courses
  FOR SELECT 
  USING (status = 'published');

-- Les admins peuvent tout voir
CREATE POLICY "courses_select_admin" ON courses
  FOR SELECT 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- Les admins peuvent gérer
CREATE POLICY "courses_insert_admin" ON courses
  FOR INSERT 
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "courses_update_admin" ON courses
  FOR UPDATE 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "courses_delete_admin" ON courses
  FOR DELETE 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- ----- PROGRAMS -----
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les programmes publiés
CREATE POLICY "programs_select_published" ON programs
  FOR SELECT 
  USING (status = 'published');

-- Les admins peuvent tout voir
CREATE POLICY "programs_select_admin" ON programs
  FOR SELECT 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- Les admins peuvent gérer
CREATE POLICY "programs_insert_admin" ON programs
  FOR INSERT 
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "programs_update_admin" ON programs
  FOR UPDATE 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "programs_delete_admin" ON programs
  FOR DELETE 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- ----- SUBMISSIONS -----
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "submissions_select_own" ON submissions;
DROP POLICY IF EXISTS "submissions_select_admin" ON submissions;
DROP POLICY IF EXISTS "submissions_insert_own" ON submissions;
DROP POLICY IF EXISTS "submissions_update_own" ON submissions;
DROP POLICY IF EXISTS "submissions_update_admin" ON submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON submissions;
DROP POLICY IF EXISTS "Trainers can view submissions" ON submissions;
DROP POLICY IF EXISTS "submission_select" ON submissions;
DROP POLICY IF EXISTS "submission_insert" ON submissions;
DROP POLICY IF EXISTS "submission_update" ON submissions;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_item_id ON public.submissions(item_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_item ON public.submissions(user_id, item_id);

-- Réactiver RLS avec des politiques simples
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres soumissions
CREATE POLICY "submissions_select_own" ON submissions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Les admins/trainers peuvent tout voir
CREATE POLICY "submissions_select_admin" ON submissions
  FOR SELECT 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'trainer')
  );

-- Les utilisateurs peuvent créer leurs propres soumissions
CREATE POLICY "submissions_insert_own" ON submissions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres soumissions
CREATE POLICY "submissions_update_own" ON submissions
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Les admins/trainers peuvent modifier toutes les soumissions
CREATE POLICY "submissions_update_admin" ON submissions
  FOR UPDATE 
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'trainer')
  );

-- ============================================================================
-- ÉTAPE 7 : Analyser les tables pour optimiser les statistiques
-- ============================================================================
ANALYZE public.enrollments;
ANALYZE public.program_enrollments;
ANALYZE public.courses;
ANALYZE public.programs;
ANALYZE public.profiles;
ANALYZE public.submissions;

-- ============================================================================
-- ÉTAPE 8 : Vérifier le résultat final
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policies_count,
  CASE 
    WHEN rowsecurity THEN '✅ RLS activé avec politiques optimisées'
    ELSE '⚠️ RLS désactivé'
  END as status
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'enrollments', 'program_enrollments', 'courses', 'programs', 'submissions')
ORDER BY tablename;

-- ============================================================================
-- TEST : Vérifier que l'utilisateur peut accéder à ses enrollments
-- ============================================================================
SELECT 
  'Test enrollments pour user admin' as test,
  COUNT(*) as total_enrollments
FROM public.enrollments
WHERE user_id = '25e68bd5-be89-4c93-ab84-b657a89f1070';
