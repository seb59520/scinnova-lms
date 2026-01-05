-- ============================================================================
-- Table pour les ressources assignées aux apprenants
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- Table des ressources assignées
CREATE TABLE IF NOT EXISTS assigned_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  learner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'url', 'text', 'correction')),
  file_path TEXT, -- Chemin dans le storage Supabase
  external_url TEXT, -- URL externe
  content TEXT, -- Contenu texte
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(trainer_id, learner_id, session_id, title, created_at)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('resource_assigned', 'submission_graded', 'message', 'reminder')),
  title TEXT NOT NULL,
  message TEXT,
  resource_id UUID REFERENCES assigned_resources(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_assigned_resources_learner_id ON assigned_resources(learner_id);
CREATE INDEX IF NOT EXISTS idx_assigned_resources_session_id ON assigned_resources(session_id);
CREATE INDEX IF NOT EXISTS idx_assigned_resources_is_read ON assigned_resources(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS Policies pour assigned_resources
ALTER TABLE assigned_resources ENABLE ROW LEVEL SECURITY;

-- Les formateurs peuvent créer des ressources assignées
CREATE POLICY "Trainers can create assigned resources" ON assigned_resources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('trainer', 'admin')
    )
  );

-- Les formateurs peuvent voir toutes les ressources qu'ils ont assignées
CREATE POLICY "Trainers can view their assigned resources" ON assigned_resources
  FOR SELECT
  USING (
    trainer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('trainer', 'admin')
      AND om.org_id IN (
        SELECT org_id FROM sessions WHERE id = assigned_resources.session_id
      )
    )
  );

-- Les apprenants peuvent voir les ressources qui leur sont assignées
CREATE POLICY "Learners can view their assigned resources" ON assigned_resources
  FOR SELECT
  USING (learner_id = auth.uid());

-- Les formateurs peuvent mettre à jour les ressources qu'ils ont assignées
CREATE POLICY "Trainers can update their assigned resources" ON assigned_resources
  FOR UPDATE
  USING (trainer_id = auth.uid());

-- Les apprenants peuvent marquer les ressources comme lues
CREATE POLICY "Learners can mark resources as read" ON assigned_resources
  FOR UPDATE
  USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

-- RLS Policies pour notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Les formateurs peuvent créer des notifications
CREATE POLICY "Trainers can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('trainer', 'admin')
    )
  );

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can mark notifications as read" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Fonction pour créer une notification automatiquement quand une ressource est assignée
CREATE OR REPLACE FUNCTION notify_resource_assigned()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, resource_id)
  VALUES (
    NEW.learner_id,
    'resource_assigned',
    'Nouvelle ressource assignée',
    COALESCE(NEW.description, NEW.title),
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer une notification automatiquement
DROP TRIGGER IF EXISTS trigger_notify_resource_assigned ON assigned_resources;
CREATE TRIGGER trigger_notify_resource_assigned
  AFTER INSERT ON assigned_resources
  FOR EACH ROW
  EXECUTE FUNCTION notify_resource_assigned();


