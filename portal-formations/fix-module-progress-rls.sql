-- Fix RLS policies for module_progress
-- This script fixes the RLS policies to allow users to insert and update their own progress

-- Drop ALL existing policies for module_progress to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own progress" ON module_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON module_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON module_progress;
DROP POLICY IF EXISTS "Users can delete their own progress" ON module_progress;

-- Create separate policies for INSERT, UPDATE, and DELETE
CREATE POLICY "Users can insert their own progress" ON module_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" ON module_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own progress" ON module_progress
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Keep the SELECT policy
-- (The existing "Users can view their own progress" policy should remain)

-- Alternative: Create a SECURITY DEFINER function to handle module progress
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
