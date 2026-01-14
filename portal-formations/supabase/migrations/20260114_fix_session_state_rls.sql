-- ============================================================================
-- FIX: Corriger les politiques RLS de session_state
-- ============================================================================

-- 1. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Session state viewable by participants" ON session_state;
DROP POLICY IF EXISTS "Session state manageable by trainers" ON session_state;

-- 2. Créer des politiques plus permissives qui incluent les admins

-- Les participants de la session peuvent voir l'état
CREATE POLICY "session_state_select_members" ON session_state
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_state.session_id
      AND sm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Les formateurs et admins peuvent tout faire sur session_state
CREATE POLICY "session_state_all_trainers" ON session_state
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_state.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_state.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- 3. Peupler session_state pour les sessions existantes qui n'ont pas d'entrée
INSERT INTO session_state (session_id)
SELECT s.id FROM sessions s
WHERE NOT EXISTS (
  SELECT 1 FROM session_state ss WHERE ss.session_id = s.id
)
ON CONFLICT (session_id) DO NOTHING;

-- 4. Corriger aussi les politiques pour les autres tables de session

-- Policies session_members (ajouter admin/trainer)
DROP POLICY IF EXISTS "Session members viewable by participants" ON session_members;
CREATE POLICY "session_members_select" ON session_members
  FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT sm.session_id FROM session_members sm WHERE sm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Policies learner_progress (ajouter admin/trainer)
DROP POLICY IF EXISTS "Learner progress viewable by trainers" ON learner_progress;
DROP POLICY IF EXISTS "Learner progress editable by owner" ON learner_progress;

CREATE POLICY "learner_progress_select" ON learner_progress
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = learner_progress.session_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('lead_trainer', 'co_trainer')
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

CREATE POLICY "learner_progress_update_own" ON learner_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "learner_progress_insert" ON learner_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Policies session_events (ajouter admin/trainer)
DROP POLICY IF EXISTS "Session events viewable by participants" ON session_events;

CREATE POLICY "session_events_select" ON session_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_events.session_id
      AND sm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

CREATE POLICY "session_events_insert" ON session_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = session_events.session_id
      AND sm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

SELECT 'RLS policies fixed for session_state and related tables' as status;
