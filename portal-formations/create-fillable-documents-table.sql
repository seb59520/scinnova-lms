-- Table pour stocker les documents à compléter associés aux cours
-- Ces documents peuvent être réutilisés dans plusieurs cours
CREATE TABLE IF NOT EXISTS fillable_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Document template (PDF, DOCX, etc.)
  template_file_path TEXT NOT NULL, -- Chemin dans Supabase Storage
  template_file_name TEXT NOT NULL, -- Nom original du fichier
  template_file_size INTEGER, -- Taille en octets
  template_file_type TEXT, -- MIME type
  
  -- Configuration du document
  is_required BOOLEAN DEFAULT FALSE, -- Document obligatoire ou optionnel
  due_date TIMESTAMP WITH TIME ZONE, -- Date limite de complétion
  allow_multiple_submissions BOOLEAN DEFAULT FALSE, -- Permettre plusieurs soumissions
  
  -- Métadonnées
  order_index INTEGER DEFAULT 0, -- Ordre d'affichage dans le cours
  published BOOLEAN DEFAULT TRUE, -- Visible pour les étudiants
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Table pour stocker les soumissions des étudiants
CREATE TABLE IF NOT EXISTS fillable_document_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fillable_document_id UUID REFERENCES fillable_documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Fichier complété par l'étudiant
  submitted_file_path TEXT NOT NULL, -- Chemin dans Supabase Storage
  submitted_file_name TEXT NOT NULL, -- Nom original du fichier
  submitted_file_size INTEGER, -- Taille en octets
  submitted_file_type TEXT, -- MIME type
  
  -- Statut et évaluation
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
  feedback TEXT, -- Commentaires du formateur
  score INTEGER, -- Note sur 100 (optionnel)
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Empêcher les doublons (une soumission par document par utilisateur, sauf si allow_multiple_submissions = true)
  UNIQUE(fillable_document_id, user_id, submitted_at)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_fillable_documents_course ON fillable_documents(course_id);
CREATE INDEX IF NOT EXISTS idx_fillable_documents_order ON fillable_documents(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_fillable_documents_published ON fillable_documents(course_id, published);

CREATE INDEX IF NOT EXISTS idx_submissions_document ON fillable_document_submissions(fillable_document_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON fillable_document_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON fillable_document_submissions(status);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_fillable_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_fillable_document_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER fillable_documents_updated_at
  BEFORE UPDATE ON fillable_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_fillable_documents_updated_at();

CREATE TRIGGER fillable_document_submissions_updated_at
  BEFORE UPDATE ON fillable_document_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_fillable_document_submissions_updated_at();

-- RLS (Row Level Security)
ALTER TABLE fillable_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fillable_document_submissions ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir les documents publiés des cours auxquels ils sont inscrits
CREATE POLICY "Users can view fillable documents for enrolled courses" ON fillable_documents
  FOR SELECT
  TO authenticated
  USING (
    published = true AND (
      -- Admin peut tout voir
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR
      -- Utilisateur inscrit au cours
      EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.course_id = fillable_documents.course_id
        AND e.user_id = auth.uid()
        AND e.status = 'active'
      )
      OR
      -- Utilisateur inscrit via un programme
      EXISTS (
        SELECT 1 FROM program_courses pc
        JOIN program_enrollments pe ON pe.program_id = pc.program_id
        WHERE pc.course_id = fillable_documents.course_id
        AND pe.user_id = auth.uid()
        AND pe.status = 'active'
      )
      OR
      -- Créateur du cours
      EXISTS (
        SELECT 1 FROM courses c
        WHERE c.id = fillable_documents.course_id
        AND c.created_by = auth.uid()
      )
    )
  );

-- Politique : Seuls les admins et formateurs peuvent créer/modifier/supprimer des documents
CREATE POLICY "Admins and trainers can manage fillable documents" ON fillable_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'trainer', 'instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'trainer', 'instructor')
    )
  );

-- Politique : Les utilisateurs peuvent voir leurs propres soumissions
CREATE POLICY "Users can view their own submissions" ON fillable_document_submissions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    -- Les formateurs peuvent voir toutes les soumissions des documents de leurs cours
    EXISTS (
      SELECT 1 FROM fillable_documents fd
      JOIN courses c ON c.id = fd.course_id
      WHERE fd.id = fillable_document_submissions.fillable_document_id
      AND (
        c.created_by = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'trainer', 'instructor')
        )
      )
    )
  );

-- Politique : Les utilisateurs peuvent créer leurs propres soumissions
CREATE POLICY "Users can create their own submissions" ON fillable_document_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND
    -- Vérifier que le document existe et est publié
    EXISTS (
      SELECT 1 FROM fillable_documents fd
      WHERE fd.id = fillable_document_submissions.fillable_document_id
      AND fd.published = true
      AND (
        -- Utilisateur inscrit au cours
        EXISTS (
          SELECT 1 FROM enrollments e
          WHERE e.course_id = fd.course_id
          AND e.user_id = auth.uid()
          AND e.status = 'active'
        )
        OR
        -- Utilisateur inscrit via un programme
        EXISTS (
          SELECT 1 FROM program_courses pc
          JOIN program_enrollments pe ON pe.program_id = pc.program_id
          WHERE pc.course_id = fd.course_id
          AND pe.user_id = auth.uid()
          AND pe.status = 'active'
        )
      )
    )
  );

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres soumissions (si pas encore revues)
CREATE POLICY "Users can update their own submissions" ON fillable_document_submissions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'submitted' -- Seulement si pas encore revue
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Politique : Les formateurs peuvent mettre à jour les soumissions (pour les évaluer)
CREATE POLICY "Trainers can review submissions" ON fillable_document_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fillable_documents fd
      JOIN courses c ON c.id = fd.course_id
      WHERE fd.id = fillable_document_submissions.fillable_document_id
      AND (
        c.created_by = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'trainer', 'instructor')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fillable_documents fd
      JOIN courses c ON c.id = fd.course_id
      WHERE fd.id = fillable_document_submissions.fillable_document_id
      AND (
        c.created_by = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'trainer', 'instructor')
        )
      )
    )
  );

-- Politique : Les utilisateurs peuvent supprimer leurs propres soumissions (si pas encore revues)
CREATE POLICY "Users can delete their own submissions" ON fillable_document_submissions
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'submitted' -- Seulement si pas encore revue
  );
