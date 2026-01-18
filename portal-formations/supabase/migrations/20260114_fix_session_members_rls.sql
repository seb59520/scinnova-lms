-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "session_members_select" ON session_members;
DROP POLICY IF EXISTS "session_members_select_all" ON session_members;
DROP POLICY IF EXISTS "Session members viewable by participants" ON session_members;

-- Nouvelle politique : tout le monde peut voir les membres des sessions
-- (les admins et trainers voient tout, les learners voient les membres de leurs sessions)
CREATE POLICY "session_members_select_all" ON session_members
  FOR SELECT TO authenticated
  USING (
    -- L'utilisateur est lui-même dans la session
    user_id = auth.uid()
    OR
    -- L'utilisateur est admin ou trainer (peut voir tous les membres)
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Politique pour gérer les membres (insert, update, delete)
DROP POLICY IF EXISTS "session_members_manage" ON session_members;
CREATE POLICY "session_members_manage" ON session_members
  FOR ALL TO authenticated
  USING (
    EXISTS (

      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

SELECT 'Politiques session_members corrigées' as status;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            