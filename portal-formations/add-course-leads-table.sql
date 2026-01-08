-- Migration : Table pour collecter les emails des visiteurs intéressés par les formations
-- Permet de collecter les leads sans nécessiter une inscription complète

-- Table des leads (emails collectés pour les formations)
CREATE TABLE IF NOT EXISTS course_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  source TEXT DEFAULT 'landing_page' CHECK (source IN ('landing_page', 'course_page', 'other')),
  metadata JSONB, -- Pour stocker des infos supplémentaires (nom, entreprise, etc.)
  subscribed BOOLEAN DEFAULT TRUE, -- L'utilisateur accepte de recevoir des communications
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, course_id) -- Un email ne peut s'inscrire qu'une fois par formation
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_course_leads_email ON course_leads(email);
CREATE INDEX IF NOT EXISTS idx_course_leads_course_id ON course_leads(course_id);
CREATE INDEX IF NOT EXISTS idx_course_leads_created_at ON course_leads(created_at DESC);

-- Commentaire pour documentation
COMMENT ON TABLE course_leads IS 'Emails collectés des visiteurs intéressés par les formations sans compte';
COMMENT ON COLUMN course_leads.email IS 'Adresse email du visiteur';
COMMENT ON COLUMN course_leads.course_id IS 'Formation qui a intéressé le visiteur';
COMMENT ON COLUMN course_leads.source IS 'Source de la collecte (landing_page, course_page, etc.)';
COMMENT ON COLUMN course_leads.subscribed IS 'L''utilisateur accepte de recevoir des communications';

-- RLS (Row Level Security) - Permettre la lecture aux admins uniquement
ALTER TABLE course_leads ENABLE ROW LEVEL SECURITY;

-- Policy : Les admins peuvent tout voir
CREATE POLICY "Admins can view all leads"
  ON course_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy : N'importe qui peut insérer (pour la collecte publique)
CREATE POLICY "Anyone can insert leads"
  ON course_leads
  FOR INSERT
  WITH CHECK (true);
