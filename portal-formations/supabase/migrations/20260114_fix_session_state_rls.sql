-- ============================================================================
-- FIX: Corriger les politiques RLS de session_state et tables liées
-- ============================================================================

-- Fonction helper pour vérifier si l'utilisateur est admin ou trainer (SECURITY DEFINER pour éviter la récursion)
CREATE OR REPLACE FUNCTION is_admin_or_trainer_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
      AND role IN ('admin', 'trainer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction helper pour vérifier si l'utilisateur est membre d'une session (SECURITY DEFINER pour éviter la récursion)
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

-- Fonction helper pour vérifier si l'utilisateur est formateur d'une session
CREATE OR REPLACE FUNCTION is_session_trainer_member(p_user_id UUID, p_session_id UUID)
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

-- ============================================================================
-- POLITIQUES SESSION_STATE
-- ============================================================================

DROP POLICY IF EXISTS "Session state viewable by participants" ON session_state;
DROP POLICY IF EXISTS "Session state manageable by trainers" ON session_state;
DROP POLICY IF EXISTS "session_state_select_members" ON session_state;
DROP POLICY IF EXISTS "session_state_all_trainers" ON session_state;

CREATE POLICY "session_state_select" ON session_state
  FOR SELECT TO authenticated
  USING (
    is_session_member(auth.uid(), session_id)
    OR is_admin_or_trainer_user(auth.uid())
  );

CREATE POLICY "session_state_all" ON session_state
  FOR ALL TO authenticated
  USING (
    is_session_trainer_member(auth.uid(), session_id)
    OR is_admin_or_trainer_user(auth.uid())
  )
  WITH CHECK (
    is_session_trainer_member(auth.uid(), session_id)
    OR is_admin_or_trainer_user(auth.uid())
  );

-- ============================================================================
-- POLITIQUES SESSION_MEMBERS
-- ============================================================================

DROP POLICY IF EXISTS "Session members viewable by participants" ON session_members;
DROP POLICY IF EXISTS "session_members_select" ON session_members;

-- Pour session_members, on utilise user_id = auth.uid() directement pour éviter la récursion
CREATE POLICY "session_members_select" ON session_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin_or_trainer_user(auth.uid())
  );

-- ============================================================================
-- POLITIQUES LEARNER_PROGRESS
-- ============================================================================

DROP POLICY IF EXISTS "Learner progress viewable by trainers" ON learner_progress;
DROP POLICY IF EXISTS "Learner progress editable by owner" ON learner_progress;
DROP POLICY IF EXISTS "learner_progress_select" ON learner_progress;
DROP POLICY IF EXISTS "learner_progress_update_own" ON learner_progress;
DROP POLICY IF EXISTS "learner_progress_insert" ON learner_progress;

CREATE POLICY "learner_progress_select" ON learner_progress
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_session_trainer_member(auth.uid(), session_id)
    OR is_admin_or_trainer_user(auth.uid())
  );

CREATE POLICY "learner_progress_update_own" ON learner_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "learner_progress_insert" ON learner_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR is_admin_or_trainer_user(auth.uid())
  );

-- ============================================================================
-- POLITIQUES SESSION_EVENTS
-- ============================================================================

DROP POLICY IF EXISTS "Session events viewable by participants" ON session_events;
DROP POLICY IF EXISTS "session_events_select" ON session_events;
DROP POLICY IF EXISTS "session_events_insert" ON session_events;

CREATE POLICY "session_events_select" ON session_events
  FOR SELECT TO authenticated
  USING (
    is_session_member(auth.uid(), session_id)
    OR is_admin_or_trainer_user(auth.uid())
  );

CREATE POLICY "session_events_insert" ON session_events
  FOR INSERT TO authenticated
  WITH CHECK (
    is_session_member(auth.uid(), session_id)
    OR is_admin_or_trainer_user(auth.uid())
  );

-- ============================================================================
-- PEUPLER SESSION_STATE POUR LES SESSIONS EXISTANTES
-- ============================================================================

INSERT INTO session_state (session_id)
SELECT s.id FROM sessions s
WHERE NOT EXISTS (
  SELECT 1 FROM session_state ss WHERE ss.session_id = s.id
)
ON CONFLICT (session_id) DO NOTHING;

SELECT 'RLS policies fixed with SECURITY DEFINER functions to avoid recursion' as status;
