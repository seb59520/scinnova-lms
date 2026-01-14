-- ============================================================================
-- CORRECTIF : Triggers SECURITY DEFINER + Politiques RLS pour session_members
-- SANS RÉCURSION - Utilise des fonctions SECURITY DEFINER pour les checks
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : Fonctions triggers avec SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION create_session_state()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO session_state (session_id)
  VALUES (NEW.id)
  ON CONFLICT (session_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_learner_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'learner' THEN
    INSERT INTO learner_progress (session_id, user_id)
    VALUES (NEW.session_id, NEW.user_id)
    ON CONFLICT (session_id, user_id) DO NOTHING;
    
    INSERT INTO session_gradebook_summary (session_id, user_id)
    VALUES (NEW.session_id, NEW.user_id)
    ON CONFLICT (session_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 2 : Fonctions HELPER pour éviter la récursion RLS
-- Ces fonctions utilisent SECURITY DEFINER pour contourner RLS
-- ============================================================================

-- Vérifie si l'utilisateur est trainer dans une session (sans déclencher RLS)
CREATE OR REPLACE FUNCTION is_session_trainer(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM session_members
    WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND role IN ('lead_trainer', 'co_trainer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est membre d'une session (sans déclencher RLS)
CREATE OR REPLACE FUNCTION is_session_member(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM session_members
    WHERE session_id = p_session_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est créateur de la session
CREATE OR REPLACE FUNCTION is_session_creator(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM sessions
    WHERE id = p_session_id
    AND created_by = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est admin ou instructor
CREATE OR REPLACE FUNCTION is_admin_or_instructor(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
    AND role IN ('admin', 'instructor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTIE 3 : Politiques RLS pour session_members (SANS RÉCURSION)
-- ============================================================================

-- Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS "Session members manageable by trainers" ON session_members;
DROP POLICY IF EXISTS "Session members viewable by participants" ON session_members;
DROP POLICY IF EXISTS "Session members insertable by authorized users" ON session_members;
DROP POLICY IF EXISTS "Session members updatable by trainers" ON session_members;
DROP POLICY IF EXISTS "Session members deletable by trainers" ON session_members;

-- Politique SELECT : voir les membres
CREATE POLICY "Session members viewable" ON session_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_session_member(session_id, auth.uid())
    OR is_admin_or_instructor(auth.uid())
  );

-- Politique INSERT : ajouter des membres
CREATE POLICY "Session members insertable" ON session_members
  FOR INSERT WITH CHECK (
    is_session_creator(session_id, auth.uid())
    OR is_session_trainer(session_id, auth.uid())
    OR is_admin_or_instructor(auth.uid())
  );

-- Politique UPDATE : modifier des membres
CREATE POLICY "Session members updatable" ON session_members
  FOR UPDATE USING (
    is_session_creator(session_id, auth.uid())
    OR is_session_trainer(session_id, auth.uid())
    OR is_admin_or_instructor(auth.uid())
  );

-- Politique DELETE : supprimer des membres
CREATE POLICY "Session members deletable" ON session_members
  FOR DELETE USING (
    is_session_creator(session_id, auth.uid())
    OR is_session_trainer(session_id, auth.uid())
    OR is_admin_or_instructor(auth.uid())
  );

-- ============================================================================
-- NOTE: Ce script peut être exécuté en toute sécurité plusieurs fois
-- ============================================================================
