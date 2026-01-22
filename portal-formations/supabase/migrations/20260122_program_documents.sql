-- =====================================================
-- Program Documents - Questionnaires Debut/Fin de Parcours
-- =====================================================

-- Table des documents de programme (questionnaires téléchargeables)
CREATE TABLE IF NOT EXISTS program_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  template_url TEXT, -- URL du fichier à télécharger
  template_file_path TEXT, -- Chemin dans le storage
  timing TEXT CHECK (timing IN ('start', 'end', 'anytime')) DEFAULT 'anytime', -- Quand le document doit être rempli
  is_required BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  allow_resubmission BOOLEAN DEFAULT true,
  due_date TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_program_documents_program_id ON program_documents(program_id);
CREATE INDEX IF NOT EXISTS idx_program_documents_timing ON program_documents(timing);

-- Table des soumissions de documents
CREATE TABLE IF NOT EXISTS program_document_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES program_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
  feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, user_id) -- Un seul upload par document par utilisateur (sauf si allow_resubmission)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_program_doc_submissions_document_id ON program_document_submissions(document_id);
CREATE INDEX IF NOT EXISTS idx_program_doc_submissions_user_id ON program_document_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_program_doc_submissions_program_id ON program_document_submissions(program_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_program_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_program_documents_updated_at ON program_documents;
CREATE TRIGGER trigger_program_documents_updated_at
  BEFORE UPDATE ON program_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_program_documents_updated_at();

-- RLS Policies
ALTER TABLE program_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_document_submissions ENABLE ROW LEVEL SECURITY;

-- Admins et trainers peuvent tout faire sur program_documents
CREATE POLICY "admin_trainer_full_access_program_documents" ON program_documents
  FOR ALL
  TO authenticated
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

-- Tous les utilisateurs peuvent lire les documents publiés
CREATE POLICY "users_read_published_program_documents" ON program_documents
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Les utilisateurs peuvent soumettre leurs documents
CREATE POLICY "users_submit_own_documents" ON program_document_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent voir leurs propres soumissions
CREATE POLICY "users_read_own_submissions" ON program_document_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins et trainers peuvent voir toutes les soumissions
CREATE POLICY "admin_trainer_read_all_submissions" ON program_document_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Admins et trainers peuvent modifier les soumissions (feedback, status)
CREATE POLICY "admin_trainer_update_submissions" ON program_document_submissions
  FOR UPDATE
  TO authenticated
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
