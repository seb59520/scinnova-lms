-- Table pour stocker les documents associés aux items (TP et exercices)
CREATE TABLE IF NOT EXISTS item_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL, -- Chemin dans Supabase Storage
  file_name TEXT NOT NULL, -- Nom original du fichier
  file_size INTEGER, -- Taille en octets
  file_type TEXT, -- MIME type
  order_index INTEGER DEFAULT 0, -- Ordre d'affichage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_item_documents_item_id ON item_documents(item_id);
CREATE INDEX IF NOT EXISTS idx_item_documents_order ON item_documents(item_id, order_index);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_item_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER item_documents_updated_at
  BEFORE UPDATE ON item_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_item_documents_updated_at();

-- RLS (Row Level Security)
ALTER TABLE item_documents ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir les documents des items auxquels ils ont accès
CREATE POLICY "Users can view item documents for accessible items" ON item_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM items i
      WHERE i.id = item_documents.item_id
      AND i.published = true
      AND (
        -- Admin peut tout voir
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR
        -- Utilisateur inscrit au cours
        EXISTS (
          SELECT 1 FROM items i2
          JOIN modules m ON m.id = i2.module_id
          JOIN courses c ON c.id = m.course_id
          JOIN enrollments e ON e.course_id = c.id
          WHERE i2.id = item_documents.item_id
          AND e.user_id = auth.uid()
          AND e.status = 'active'
        )
        OR
        -- Utilisateur inscrit via un programme
        EXISTS (
          SELECT 1 FROM items i2
          JOIN modules m ON m.id = i2.module_id
          JOIN courses c ON c.id = m.course_id
          JOIN program_courses pc ON pc.course_id = c.id
          JOIN program_enrollments pe ON pe.program_id = pc.program_id
          WHERE i2.id = item_documents.item_id
          AND pe.user_id = auth.uid()
          AND pe.status = 'active'
        )
        OR
        -- Créateur du cours
        EXISTS (
          SELECT 1 FROM items i2
          JOIN modules m ON m.id = i2.module_id
          JOIN courses c ON c.id = m.course_id
          WHERE i2.id = item_documents.item_id
          AND c.created_by = auth.uid()
        )
      )
    )
  );

-- Politique : Seuls les admins et formateurs peuvent créer/modifier/supprimer des documents
CREATE POLICY "Admins and trainers can manage item documents" ON item_documents
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

-- Créer le bucket 'item-documents' dans Supabase Storage si nécessaire
-- Note: Cette partie doit être exécutée manuellement dans l'interface Supabase Storage
-- ou via l'API Supabase, car on ne peut pas créer des buckets via SQL directement

