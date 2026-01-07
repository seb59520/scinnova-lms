-- ============================================================================
-- SCRIPT POUR CORRIGER LES WARNINGS DE PERFORMANCE RLS
-- Portail Formations - Correction des politiques RLS pour optimiser les performances
-- ============================================================================
-- Ce script corrige tous les warnings Supabase concernant :
-- 1. auth_rls_initplan : Remplace auth.uid() par (select auth.uid()) pour éviter la réévaluation
-- 2. multiple_permissive_policies : Les politiques multiples sont conservées mais optimisées
-- ============================================================================
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Créer/Mettre à jour les fonctions helper avec (select auth.uid())
-- ============================================================================

-- Fonction is_admin optimisée
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction helper pour org_members
CREATE OR REPLACE FUNCTION public.is_org_member_with_role(
  p_user_id UUID,
  p_org_id UUID,
  p_roles TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = p_user_id
    AND org_id = p_org_id
    AND role = ANY(p_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ÉTAPE 2 : Supprimer toutes les policies existantes
-- ============================================================================

-- Sessions
DROP POLICY IF EXISTS "Users can view sessions in their orgs" ON sessions;
DROP POLICY IF EXISTS "Users can view sessions in their org" ON sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON sessions;
DROP POLICY IF EXISTS "Trainers can manage sessions in their org" ON sessions;

-- Item documents
DROP POLICY IF EXISTS "Users can view item documents for accessible items" ON item_documents;
DROP POLICY IF EXISTS "Admins and trainers can manage item documents" ON item_documents;

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Courses
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
DROP POLICY IF EXISTS "Instructors can manage their own courses" ON courses;

-- Modules
DROP POLICY IF EXISTS "Modules viewable with course access" ON modules;
DROP POLICY IF EXISTS "Admins and instructors can manage modules" ON modules;

-- Items
DROP POLICY IF EXISTS "Items viewable with course access" ON items;
DROP POLICY IF EXISTS "Admins and instructors can manage items" ON items;

-- Chapters
DROP POLICY IF EXISTS "Chapters viewable with item access" ON chapters;
DROP POLICY IF EXISTS "Admins and instructors can manage chapters" ON chapters;

-- Enrollments
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;

-- Submissions
DROP POLICY IF EXISTS "Users can manage their own submissions" ON submissions;
DROP POLICY IF EXISTS "Admins and instructors can view submissions for their courses" ON submissions;
DROP POLICY IF EXISTS "Trainers can view submissions for their sessions" ON submissions;

-- Game scores
DROP POLICY IF EXISTS "Users can manage their own game scores" ON game_scores;
DROP POLICY IF EXISTS "Admins can view all game scores" ON game_scores;

-- Programs
DROP POLICY IF EXISTS "Admins can manage all programs" ON programs;
DROP POLICY IF EXISTS "Instructors can manage their own programs" ON programs;

-- Program courses
DROP POLICY IF EXISTS "Program courses viewable with program access" ON program_courses;
DROP POLICY IF EXISTS "Admins and instructors can manage program courses" ON program_courses;

-- Program enrollments
DROP POLICY IF EXISTS "Users can view their own program enrollments" ON program_enrollments;
DROP POLICY IF EXISTS "Admins can manage all program enrollments" ON program_enrollments;

-- Orgs
DROP POLICY IF EXISTS "Admins can view all orgs" ON orgs;
DROP POLICY IF EXISTS "Users can view orgs they belong to" ON orgs;

-- Org members
DROP POLICY IF EXISTS "Users can view their own org memberships" ON org_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON org_members;
DROP POLICY IF EXISTS "Trainers and admins can manage members in their orgs" ON org_members;

-- Exercises
DROP POLICY IF EXISTS "Exercises viewable with item access" ON exercises;
DROP POLICY IF EXISTS "Admins and instructors can manage exercises" ON exercises;

-- User settings
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Admins can view all settings" ON user_settings;
DROP POLICY IF EXISTS "Admins can manage all settings" ON user_settings;

-- Trainer scripts
DROP POLICY IF EXISTS "Users can view their own scripts" ON trainer_scripts;
DROP POLICY IF EXISTS "Users can insert their own scripts" ON trainer_scripts;
DROP POLICY IF EXISTS "Users can update their own scripts" ON trainer_scripts;
DROP POLICY IF EXISTS "Users can delete their own scripts" ON trainer_scripts;
DROP POLICY IF EXISTS "Admins can view all scripts" ON trainer_scripts;

-- Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can mark notifications as read" ON notifications;
DROP POLICY IF EXISTS "Trainers can create notifications" ON notifications;

-- Assigned resources
DROP POLICY IF EXISTS "Trainers can create assigned resources" ON assigned_resources;
DROP POLICY IF EXISTS "Trainers can view their assigned resources" ON assigned_resources;
DROP POLICY IF EXISTS "Learners can view their assigned resources" ON assigned_resources;
DROP POLICY IF EXISTS "Trainers can update their assigned resources" ON assigned_resources;
DROP POLICY IF EXISTS "Learners can mark resources as read" ON assigned_resources;

-- User time tracking
DROP POLICY IF EXISTS "Users can view their own time tracking" ON user_time_tracking;
DROP POLICY IF EXISTS "Users can insert their own time tracking" ON user_time_tracking;
DROP POLICY IF EXISTS "Users can update their own time tracking" ON user_time_tracking;
DROP POLICY IF EXISTS "Trainers can view learners time tracking" ON user_time_tracking;
DROP POLICY IF EXISTS "Admins can view all time tracking" ON user_time_tracking;

-- Chat messages
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins and instructors can view all messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON chat_messages;

-- User presence
DROP POLICY IF EXISTS "Users can view their own presence" ON user_presence;
DROP POLICY IF EXISTS "Admins can view all presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON user_presence;

-- User responses
DROP POLICY IF EXISTS "Users can view their own responses" ON user_responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON user_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON user_responses;
DROP POLICY IF EXISTS "Trainers can view all responses" ON user_responses;

-- ============================================================================
-- ÉTAPE 3 : Recréer toutes les policies avec (select auth.uid())
-- ============================================================================

-- ============================================================================
-- SESSIONS
-- ============================================================================
CREATE POLICY "Users can view sessions in their orgs" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = sessions.org_id
      AND om.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can view all sessions" ON sessions
  FOR SELECT USING (public.is_admin((select auth.uid())));

CREATE POLICY "Trainers can manage sessions in their org" ON sessions
  FOR ALL USING (
    public.is_admin((select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = sessions.org_id
      AND om.user_id = (select auth.uid())
      AND om.role IN ('admin', 'trainer')
    )
  );

-- ============================================================================
-- ITEM_DOCUMENTS
-- ============================================================================
CREATE POLICY "Users can view item documents for accessible items" ON item_documents
  FOR SELECT USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = (select auth.uid())
      WHERE i.id = item_documents.item_id
      AND (c.status = 'published' OR c.created_by = (select auth.uid()) OR e.status = 'active')
    )
  );

CREATE POLICY "Admins and trainers can manage item documents" ON item_documents
  FOR ALL USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM org_members om
      JOIN profiles p ON p.id = (select auth.uid())
      WHERE om.user_id = (select auth.uid())
      AND om.role IN ('admin', 'trainer')
    )
  );

-- ============================================================================
-- PROFILES
-- ============================================================================
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin((select auth.uid())));

-- ============================================================================
-- COURSES
-- ============================================================================
CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (public.is_admin((select auth.uid())));

CREATE POLICY "Instructors can manage their own courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) 
      AND (p.role = 'admin' OR (p.role = 'instructor' AND courses.created_by = p.id))
    )
  );

-- ============================================================================
-- MODULES
-- ============================================================================
CREATE POLICY "Modules viewable with course access" ON modules
  FOR SELECT USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = (select auth.uid())
      WHERE c.id = modules.course_id
      AND (c.status = 'published' OR c.created_by = (select auth.uid()) OR e.status = 'active')
    )
  );

CREATE POLICY "Admins and instructors can manage modules" ON modules
  FOR ALL USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON p.id = (select auth.uid())
      WHERE c.id = modules.course_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

-- ============================================================================
-- ITEMS
-- ============================================================================
CREATE POLICY "Items viewable with course access" ON items
  FOR SELECT USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = (select auth.uid())
      WHERE m.id = items.module_id
      AND (c.status = 'published' OR c.created_by = (select auth.uid()) OR e.status = 'active')
    )
  );

CREATE POLICY "Admins and instructors can manage items" ON items
  FOR ALL USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = (select auth.uid())
      WHERE m.id = items.module_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

-- ============================================================================
-- CHAPTERS
-- ============================================================================
CREATE POLICY "Chapters viewable with item access" ON chapters
  FOR SELECT USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = (select auth.uid())
      WHERE i.id = chapters.item_id
      AND (c.status = 'published' OR c.created_by = (select auth.uid()) OR e.status = 'active')
    )
  );

CREATE POLICY "Admins and instructors can manage chapters" ON chapters
  FOR ALL USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = (select auth.uid())
      WHERE i.id = chapters.item_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

-- ============================================================================
-- ENROLLMENTS
-- ============================================================================
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage all enrollments" ON enrollments
  FOR ALL USING (public.is_admin((select auth.uid())));

-- ============================================================================
-- SUBMISSIONS
-- ============================================================================
CREATE POLICY "Users can manage their own submissions" ON submissions
  FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Admins and instructors can view submissions for their courses" ON submissions
  FOR SELECT USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = (select auth.uid())
      WHERE i.id = submissions.item_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

CREATE POLICY "Trainers can view submissions for their sessions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      JOIN sessions s ON s.org_id = om.org_id
      WHERE om.user_id = (select auth.uid())
      AND om.role IN ('trainer', 'admin')
      AND s.id = submissions.session_id
      AND submissions.user_id IN (
        SELECT e.user_id 
        FROM enrollments e 
        WHERE e.session_id = s.id 
        AND e.status = 'active'
      )
    )
  );

-- ============================================================================
-- GAME_SCORES
-- ============================================================================
CREATE POLICY "Users can manage their own game scores" ON game_scores
  FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all game scores" ON game_scores
  FOR SELECT USING (public.is_admin((select auth.uid())));

-- ============================================================================
-- PROGRAMS
-- ============================================================================
CREATE POLICY "Admins can manage all programs" ON programs
  FOR ALL USING (public.is_admin((select auth.uid())));

CREATE POLICY "Instructors can manage their own programs" ON programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid()) 
      AND (p.role = 'admin' OR (p.role = 'instructor' AND programs.created_by = p.id))
    )
  );

-- ============================================================================
-- PROGRAM_COURSES
-- ============================================================================
CREATE POLICY "Program courses viewable with program access" ON program_courses
  FOR SELECT USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = program_courses.program_id
      AND (p.status = 'published' OR p.created_by = (select auth.uid()))
      OR EXISTS (
        SELECT 1 FROM program_enrollments pe
        WHERE pe.program_id = p.id
        AND pe.user_id = (select auth.uid())
        AND pe.status = 'active'
      )
    )
  );

CREATE POLICY "Admins and instructors can manage program courses" ON program_courses
  FOR ALL USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM programs p
      JOIN profiles prof ON prof.id = (select auth.uid())
      WHERE p.id = program_courses.program_id
      AND prof.role = 'instructor' AND p.created_by = prof.id
    )
  );

-- ============================================================================
-- PROGRAM_ENROLLMENTS
-- ============================================================================
CREATE POLICY "Users can view their own program enrollments" ON program_enrollments
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage all program enrollments" ON program_enrollments
  FOR ALL USING (public.is_admin((select auth.uid())));

-- ============================================================================
-- ORGS
-- ============================================================================
CREATE POLICY "Admins can view all orgs" ON orgs
  FOR SELECT USING (public.is_admin((select auth.uid())));

CREATE POLICY "Users can view orgs they belong to" ON orgs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = orgs.id
      AND om.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- ORG_MEMBERS
-- ============================================================================
CREATE POLICY "Users can view their own org memberships" ON org_members
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage org members" ON org_members
  FOR ALL USING (public.is_admin((select auth.uid())));

CREATE POLICY "Trainers and admins can manage members in their orgs" ON org_members
  FOR ALL USING (
    user_id = (select auth.uid())
    OR public.is_admin((select auth.uid()))
    OR public.is_org_member_with_role(
      (select auth.uid()),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
  )
  WITH CHECK (
    public.is_admin((select auth.uid()))
    OR public.is_org_member_with_role(
      (select auth.uid()),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
  );

-- ============================================================================
-- EXERCISES
-- ============================================================================
CREATE POLICY "Exercises viewable with item access" ON exercises
  FOR SELECT USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = (select auth.uid())
      WHERE i.id = exercises.item_id
      AND (c.status = 'published' OR c.created_by = (select auth.uid()) OR e.status = 'active')
    )
  );

CREATE POLICY "Admins and instructors can manage exercises" ON exercises
  FOR ALL USING (
    public.is_admin((select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = (select auth.uid())
      WHERE i.id = exercises.item_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

-- ============================================================================
-- USER_SETTINGS
-- ============================================================================
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all settings" ON user_settings
  FOR SELECT USING (public.is_admin((select auth.uid())));

CREATE POLICY "Admins can manage all settings" ON user_settings
  FOR ALL USING (public.is_admin((select auth.uid())))
  WITH CHECK (public.is_admin((select auth.uid())));

-- ============================================================================
-- TRAINER_SCRIPTS
-- ============================================================================
CREATE POLICY "Users can view their own scripts" ON trainer_scripts
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own scripts" ON trainer_scripts
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own scripts" ON trainer_scripts
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own scripts" ON trainer_scripts
  FOR DELETE USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all scripts" ON trainer_scripts
  FOR SELECT USING (public.is_admin((select auth.uid())));

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can mark notifications as read" ON notifications
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Trainers can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = (select auth.uid())
      AND om.role IN ('trainer', 'admin')
    )
  );

-- ============================================================================
-- ASSIGNED_RESOURCES
-- ============================================================================
CREATE POLICY "Trainers can create assigned resources" ON assigned_resources
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = (select auth.uid())
      AND om.role IN ('trainer', 'admin')
    )
  );

CREATE POLICY "Trainers can view their assigned resources" ON assigned_resources
  FOR SELECT USING (
    trainer_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = (select auth.uid())
      AND om.role IN ('trainer', 'admin')
      AND om.org_id IN (
        SELECT org_id FROM sessions WHERE id = assigned_resources.session_id
      )
    )
  );

CREATE POLICY "Learners can view their assigned resources" ON assigned_resources
  FOR SELECT USING (learner_id = (select auth.uid()));

CREATE POLICY "Trainers can update their assigned resources" ON assigned_resources
  FOR UPDATE USING (trainer_id = (select auth.uid()))
  WITH CHECK (trainer_id = (select auth.uid()));

CREATE POLICY "Learners can mark resources as read" ON assigned_resources
  FOR UPDATE USING (learner_id = (select auth.uid()))
  WITH CHECK (learner_id = (select auth.uid()));

-- ============================================================================
-- USER_TIME_TRACKING
-- ============================================================================
CREATE POLICY "Users can view their own time tracking" ON user_time_tracking
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own time tracking" ON user_time_tracking
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own time tracking" ON user_time_tracking
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Trainers can view learners time tracking" ON user_time_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om1
      JOIN org_members om2 ON om1.org_id = om2.org_id
      WHERE om1.user_id = (select auth.uid())
      AND om1.role IN ('trainer', 'admin')
      AND om2.user_id = user_time_tracking.user_id
    )
  );

CREATE POLICY "Admins can view all time tracking" ON user_time_tracking
  FOR SELECT USING (public.is_admin((select auth.uid())));

-- ============================================================================
-- CHAT_MESSAGES
-- ============================================================================
CREATE POLICY "Users can view their own messages" ON chat_messages
  FOR SELECT USING (
    sender_id = (select auth.uid()) OR recipient_id = (select auth.uid())
  );

CREATE POLICY "Admins and instructors can view all messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Users can create messages" ON chat_messages
  FOR INSERT WITH CHECK (sender_id = (select auth.uid()));

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (sender_id = (select auth.uid()))
  WITH CHECK (sender_id = (select auth.uid()));

CREATE POLICY "Recipients can mark messages as read" ON chat_messages
  FOR UPDATE USING (recipient_id = (select auth.uid()))
  WITH CHECK (recipient_id = (select auth.uid()));

-- ============================================================================
-- USER_PRESENCE
-- ============================================================================
CREATE POLICY "Users can view their own presence" ON user_presence
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all presence" ON user_presence
  FOR SELECT USING (public.is_admin((select auth.uid())));

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own presence" ON user_presence
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- USER_RESPONSES
-- ============================================================================
CREATE POLICY "Users can view their own responses" ON user_responses
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own responses" ON user_responses
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own responses" ON user_responses
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Trainers can view all responses" ON user_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = (select auth.uid())
      AND om.role IN ('trainer', 'admin')
    )
  );

-- ============================================================================
-- ÉTAPE 4 : Vérification
-- ============================================================================
-- Vérifier que toutes les policies sont bien créées
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Note : Les warnings concernant les politiques multiples (multiple_permissive_policies)
-- sont normaux et peuvent être conservés si la logique métier le nécessite.
-- Pour optimiser davantage, vous pourriez fusionner certaines politiques,
-- mais cela nécessiterait une refonte de la logique d'accès.
-- ============================================================================

