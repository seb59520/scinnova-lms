-- ============================================================================
-- FIX: Corriger les politiques RLS pour session_members
-- Permettre aux formateurs et admins de voir tous les membres des sessions
-- ============================================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "session_members_select" ON session_members;
DROP POLICY IF EXISTS "Session members viewable by participants" ON session_members;

-- Les utilisateurs peuvent voir les membres de leurs sessions
-- Les formateurs et admins peuvent voir tous les membres
CREATE POLICY "session_members_select_all" ON session_members
  FOR SELECT TO authenticated
  USING (
    -- L'utilisateur fait partie de la session
    user_id = auth.uid()
    OR
    -- L'utilisateur est admin ou trainer
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
    OR
    -- L'utilisateur est formateur de cette session
    EXISTS (
      SELECT 1 FROM session_members sm2
      WHERE sm2.session_id = session_members.session_id
      AND sm2.user_id = auth.uid()
      AND sm2.role IN ('lead_trainer', 'co_trainer')
    )
  );

-- Les formateurs et admins peuvent ajouter/modifier/supprimer des membres
DROP POLICY IF EXISTS "session_members_insert" ON session_members;
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

-- ============================================================================
-- CRÉER LE BUCKET project-files s'il n'existe pas
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  104857600, -- 100MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp',
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv', 'text/markdown', 'application/json',
        'video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Politiques pour le bucket project-files
-- Les formateurs et admins peuvent upload
DROP POLICY IF EXISTS "project_files_upload" ON storage.objects;
CREATE POLICY "project_files_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Les apprenants peuvent aussi upload leurs propres fichiers
DROP POLICY IF EXISTS "project_files_upload_learner" ON storage.objects;
CREATE POLICY "project_files_upload_learner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[3] = auth.uid()::text
  );

-- Tout le monde peut lire les fichiers de projet
DROP POLICY IF EXISTS "project_files_select" ON storage.objects;
CREATE POLICY "project_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-files');

-- Les formateurs peuvent supprimer
DROP POLICY IF EXISTS "project_files_delete" ON storage.objects;
CREATE POLICY "project_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Les apprenants peuvent supprimer leurs propres fichiers
DROP POLICY IF EXISTS "project_files_delete_own" ON storage.objects;
CREATE POLICY "project_files_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[3] = auth.uid()::text
  );

SELECT 'Fixed session_members RLS and created project-files bucket' as status;
