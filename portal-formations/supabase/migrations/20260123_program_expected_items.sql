-- =====================================================
-- Program Expected Items - Quiz, TP et Examens attendus
-- =====================================================

-- Table pour lier les items (quiz, TP, exercices) attendus à un programme
CREATE TABLE IF NOT EXISTS program_expected_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('quiz', 'tp', 'exercise', 'game')),
  is_required BOOLEAN DEFAULT true,
  due_date TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, item_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_program_expected_items_program_id ON program_expected_items(program_id);
CREATE INDEX IF NOT EXISTS idx_program_expected_items_item_id ON program_expected_items(item_id);
CREATE INDEX IF NOT EXISTS idx_program_expected_items_type ON program_expected_items(item_type);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_program_expected_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_program_expected_items_updated_at ON program_expected_items;
CREATE TRIGGER trigger_program_expected_items_updated_at
  BEFORE UPDATE ON program_expected_items
  FOR EACH ROW
  EXECUTE FUNCTION update_program_expected_items_updated_at();

-- RLS Policies
ALTER TABLE program_expected_items ENABLE ROW LEVEL SECURITY;

-- Admins et trainers peuvent tout faire
CREATE POLICY "admin_trainer_full_access_program_expected_items" ON program_expected_items
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

-- Tous les utilisateurs peuvent lire les items attendus des programmes publiés
CREATE POLICY "users_read_published_program_expected_items" ON program_expected_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = program_expected_items.program_id
      AND p.status = 'published'
    )
  );
