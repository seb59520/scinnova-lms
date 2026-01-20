-- Table générique pour les ressources (cours, modules, items)
-- Permet d'associer des ressources à différents niveaux de la hiérarchie
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Association flexible : une seule de ces colonnes sera remplie
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  
  -- Vérification qu'une seule association est définie
  CONSTRAINT resources_single_parent CHECK (
    (course_id IS NOT NULL)::int + 
    (module_id IS NOT NULL)::int + 
    (item_id IS NOT NULL)::int = 1
  ),
  
  -- Métadonnées de la ressource
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'url', 'video', 'document', 'code', 'data')),
  
  -- Fichier uploadé (si resource_type = 'file' ou 'document')
  file_path TEXT, -- Chemin dans Supabase Storage
  file_name TEXT, -- Nom original du fichier
  file_size INTEGER, -- Taille en octets
  mime_type TEXT, -- MIME type
  
  -- URL externe (si resource_type = 'url' ou 'video')
  external_url TEXT,
  
  -- Configuration
  is_required BOOLEAN DEFAULT FALSE, -- Ressource obligatoire
  is_visible BOOLEAN DEFAULT TRUE, -- Visible pour les étudiants
  order_index INTEGER DEFAULT 0, -- Ordre d'affichage
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_resources_course ON resources(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_module ON resources(module_id) WHERE module_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_item ON resources(item_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_order ON resources(course_id, order_index) WHERE course_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_module_order ON resources(module_id, order_index) WHERE module_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_item_order ON resources(item_id, order_index) WHERE item_id IS NOT NULL;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_resources_updated_at();

-- RLS (Row Level Security)
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir les ressources visibles des cours/modules/items auxquels ils ont accès
CREATE POLICY "Users can view visible resources" ON resources
  FOR SELECT
  TO authenticated
  USING (
    is_visible = true AND (
      -- Admin peut tout voir
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR
      -- Ressource associée à un cours
      (course_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.course_id = resources.course_id
        AND e.user_id = auth.uid()
        AND e.status = 'active'
      ))
      OR
      -- Ressource associée à un cours via un programme
      (course_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM program_courses pc
        JOIN program_enrollments pe ON pe.program_id = pc.program_id
        WHERE pc.course_id = resources.course_id
        AND pe.user_id = auth.uid()
        AND pe.status = 'active'
      ))
      OR
      -- Ressource associée à un module (via le cours)
      (module_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM modules m
        JOIN enrollments e ON e.course_id = m.course_id
        WHERE m.id = resources.module_id
        AND e.user_id = auth.uid()
        AND e.status = 'active'
      ))
      OR
      -- Ressource associée à un item (via le module et le cours)
      (item_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM items i
        JOIN modules m ON m.id = i.module_id
        JOIN enrollments e ON e.course_id = m.course_id
        WHERE i.id = resources.item_id
        AND e.user_id = auth.uid()
        AND e.status = 'active'
      ))
      OR
      -- Créateur du cours/module/item
      (course_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM courses c WHERE c.id = resources.course_id AND c.created_by = auth.uid()
      ))
      OR
      (module_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM modules m
        JOIN courses c ON c.id = m.course_id
        WHERE m.id = resources.module_id AND c.created_by = auth.uid()
      ))
      OR
      (item_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM items i
        JOIN modules m ON m.id = i.module_id
        JOIN courses c ON c.id = m.course_id
        WHERE i.id = resources.item_id AND c.created_by = auth.uid()
      ))
    )
  );

-- Politique : Seuls les admins et formateurs peuvent créer/modifier/supprimer des ressources
CREATE POLICY "Admins and trainers can manage resources" ON resources
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
