-- Fix RLS policies for module_progress (Version 2 - Plus robuste)
-- This script fixes the RLS policies to allow users to insert and update their own progress

-- Étape 1: Supprimer TOUTES les politiques existantes pour module_progress
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'module_progress'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON module_progress', r.policyname);
    END LOOP;
END $$;

-- Étape 2: Recréer les politiques nécessaires

-- SELECT: Les utilisateurs peuvent voir leur propre progression
CREATE POLICY "Users can view their own progress" ON module_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- SELECT: Les formateurs et admins peuvent voir la progression dans leurs orgs
CREATE POLICY "Trainers and admins can view progress in their orgs" ON module_progress
  FOR SELECT TO authenticated
  USING (
    session_id IS NULL OR EXISTS (
      SELECT 1 FROM sessions s
      JOIN org_members om ON om.org_id = s.org_id
      WHERE s.id = module_progress.session_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'trainer')
    )
  );

-- INSERT: Les utilisateurs peuvent créer leur propre progression
CREATE POLICY "Users can insert their own progress" ON module_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Les utilisateurs peuvent mettre à jour leur propre progression
CREATE POLICY "Users can update their own progress" ON module_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Les utilisateurs peuvent supprimer leur propre progression
CREATE POLICY "Users can delete their own progress" ON module_progress
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Étape 3: Créer ou remplacer la fonction SECURITY DEFINER
CREATE OR REPLACE FUNCTION upsert_module_progress(
  p_module_id UUID,
  p_session_id UUID DEFAULT NULL,
  p_percent INTEGER DEFAULT 0,
  p_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_progress_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if progress already exists
  SELECT id INTO v_progress_id
  FROM module_progress
  WHERE user_id = v_user_id
    AND module_id = p_module_id;

  IF v_progress_id IS NOT NULL THEN
    -- Update existing progress
    UPDATE module_progress
    SET 
      percent = p_percent,
      completed_at = p_completed_at,
      updated_at = NOW()
    WHERE id = v_progress_id;
    
    RETURN v_progress_id;
  ELSE
    -- Insert new progress
    INSERT INTO module_progress (
      user_id,
      module_id,
      session_id,
      percent,
      completed_at,
      started_at
    )
    VALUES (
      v_user_id,
      p_module_id,
      p_session_id,
      p_percent,
      p_completed_at,
      NOW()
    )
    RETURNING id INTO v_progress_id;
    
    RETURN v_progress_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_module_progress(UUID, UUID, INTEGER, TIMESTAMP WITH TIME ZONE) TO authenticated;

COMMENT ON FUNCTION upsert_module_progress IS 'Upsert module progress for the current authenticated user';

-- Vérification finale
SELECT 
  'Policies created successfully' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'module_progress';

SELECT 
  'Function created successfully' as status,
  proname as function_name
FROM pg_proc
WHERE proname = 'upsert_module_progress';
