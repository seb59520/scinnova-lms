-- ============================================================================
-- CRÉATION DE LA TABLE assigned_resources
-- Permet aux formateurs d'assigner des ressources personnalisées aux apprenants
-- ============================================================================

CREATE TABLE IF NOT EXISTS assigned_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Qui assigne et à qui
  trainer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  learner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  
  -- Détails de la ressource
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'url', 'text', 'correction')),
  
  -- Contenu selon le type
  file_path TEXT,           -- Pour les fichiers uploadés
  external_url TEXT,        -- Pour les liens externes
  content TEXT,             -- Pour le texte ou les corrections
  
  -- Métadonnées
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_assigned_resources_learner ON assigned_resources(learner_id);
CREATE INDEX IF NOT EXISTS idx_assigned_resources_session ON assigned_resources(session_id);
CREATE INDEX IF NOT EXISTS idx_assigned_resources_trainer ON assigned_resources(trainer_id);

-- Activer RLS
ALTER TABLE assigned_resources ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLITIQUES RLS
-- ============================================================================

-- Les apprenants peuvent voir leurs ressources assignées
CREATE POLICY "assigned_resources_select_learner" ON assigned_resources
  FOR SELECT TO authenticated
  USING (learner_id = auth.uid());

-- Les formateurs peuvent voir les ressources qu'ils ont assignées
CREATE POLICY "assigned_resources_select_trainer" ON assigned_resources
  FOR SELECT TO authenticated
  USING (
    trainer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Les formateurs et admins peuvent insérer des ressources
CREATE POLICY "assigned_resources_insert" ON assigned_resources
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
    OR EXISTS (
      SELECT 1 FROM session_members 
      WHERE session_id = assigned_resources.session_id
      AND user_id = auth.uid()
      AND role IN ('lead_trainer', 'co_trainer')
    )
  );

-- Les formateurs peuvent mettre à jour leurs ressources
CREATE POLICY "assigned_resources_update" ON assigned_resources
  FOR UPDATE TO authenticated
  USING (
    trainer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  )
  WITH CHECK (
    trainer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Les formateurs peuvent supprimer leurs ressources
CREATE POLICY "assigned_resources_delete" ON assigned_resources
  FOR DELETE TO authenticated
  USING (
    trainer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Les apprenants peuvent marquer comme lu
CREATE POLICY "assigned_resources_update_read" ON assigned_resources
  FOR UPDATE TO authenticated
  USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

-- ============================================================================
-- BUCKET STORAGE (si pas déjà créé)
-- ============================================================================

-- Créer le bucket pour les ressources si nécessaire
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resources',
  'resources',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'application/zip', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/markdown']
) ON CONFLICT (id) DO NOTHING;

-- Politiques pour le bucket resources
DROP POLICY IF EXISTS "resources_upload_trainers" ON storage.objects;
CREATE POLICY "resources_upload_trainers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resources'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

DROP POLICY IF EXISTS "resources_select_own" ON storage.objects;
CREATE POLICY "resources_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resources'
    AND (
      -- Formateurs peuvent voir tous les fichiers
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
      )
      OR
      -- Apprenants peuvent voir les fichiers qui leur sont assignés
      EXISTS (
        SELECT 1 FROM assigned_resources 
        WHERE file_path = name 
        AND learner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "resources_delete_trainers" ON storage.objects;
CREATE POLICY "resources_delete_trainers" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'resources'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_assigned_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assigned_resources_updated_at ON assigned_resources;
CREATE TRIGGER trigger_assigned_resources_updated_at
  BEFORE UPDATE ON assigned_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_assigned_resources_updated_at();

-- Trigger pour créer une notification quand une ressource est assignée
CREATE OR REPLACE FUNCTION notify_assigned_resource()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une notification pour l'apprenant
  INSERT INTO notifications (
    user_id,
    notification_type,
    category,
    title,
    message,
    session_id,
    data
  ) VALUES (
    NEW.learner_id,
    'trainer_message',
    'message',
    'Nouvelle ressource disponible',
    format('Une nouvelle ressource "%s" vous a été assignée', NEW.title),
    NEW.session_id,
    jsonb_build_object(
      'resource_id', NEW.id,
      'trainer_id', NEW.trainer_id,
      'resource_type', NEW.resource_type
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_assigned_resource ON assigned_resources;
CREATE TRIGGER trigger_notify_assigned_resource
  AFTER INSERT ON assigned_resources
  FOR EACH ROW
  EXECUTE FUNCTION notify_assigned_resource();

-- Supprimer tout ancien trigger qui utilise 'type' au lieu de 'notification_type'
DROP TRIGGER IF EXISTS on_assigned_resource_created ON assigned_resources;
DROP FUNCTION IF EXISTS notify_resource_assigned();

SELECT 'Table assigned_resources created with RLS policies and notification trigger' as status;
