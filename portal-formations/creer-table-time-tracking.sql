-- ============================================================================
-- Table pour le tracking du temps passé sur l'application
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- Table pour stocker le temps passé par utilisateur par jour
CREATE TABLE IF NOT EXISTS user_time_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  active_seconds INTEGER NOT NULL DEFAULT 0, -- Temps où la page était active
  page_views INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, session_id, course_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_time_tracking_user_id ON user_time_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_time_tracking_date ON user_time_tracking(date);
CREATE INDEX IF NOT EXISTS idx_user_time_tracking_session_id ON user_time_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_user_time_tracking_course_id ON user_time_tracking(course_id);

-- RLS Policies
ALTER TABLE user_time_tracking ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres données de temps
CREATE POLICY "Users can view their own time tracking" ON user_time_tracking
  FOR SELECT
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent insérer leurs propres données de temps
CREATE POLICY "Users can insert their own time tracking" ON user_time_tracking
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent mettre à jour leurs propres données de temps
CREATE POLICY "Users can update their own time tracking" ON user_time_tracking
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Les formateurs peuvent voir les données de temps de leurs apprenants
CREATE POLICY "Trainers can view learners time tracking" ON user_time_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om1
      JOIN org_members om2 ON om1.org_id = om2.org_id
      WHERE om1.user_id = auth.uid()
      AND om1.role IN ('trainer', 'admin')
      AND om2.user_id = user_time_tracking.user_id
      AND om2.role = 'student'
    )
  );

-- Les admins peuvent voir toutes les données de temps
CREATE POLICY "Admins can view all time tracking" ON user_time_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_user_time_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_update_user_time_tracking_updated_at ON user_time_tracking;
CREATE TRIGGER trigger_update_user_time_tracking_updated_at
  BEFORE UPDATE ON user_time_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_user_time_tracking_updated_at();

-- Vue pour les statistiques de temps par utilisateur et par jour
CREATE OR REPLACE VIEW user_time_stats AS
SELECT 
  utt.user_id,
  p.full_name,
  utt.date,
  utt.session_id,
  s.title as session_title,
  utt.course_id,
  c.title as course_title,
  utt.total_seconds,
  utt.active_seconds,
  utt.page_views,
  ROUND(utt.total_seconds / 60.0, 2) as total_minutes,
  ROUND(utt.active_seconds / 60.0, 2) as active_minutes,
  ROUND(utt.active_seconds / 3600.0, 2) as active_hours,
  utt.last_activity_at
FROM user_time_tracking utt
LEFT JOIN profiles p ON p.id = utt.user_id
LEFT JOIN sessions s ON s.id = utt.session_id
LEFT JOIN courses c ON c.id = utt.course_id;


