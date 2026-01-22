-- ============================================================================
-- MIGRATION : TABLE ORG_PROGRAMS - Liaison Organisation ↔ Programme
-- Portal Formations - Dashboard Formateur
-- Version: 1.0.0
-- Date: 2026-01-22
-- ============================================================================

-- Table de liaison many-to-many entre organisations et programmes
-- Permet d'associer des programmes à des organisations
CREATE TABLE IF NOT EXISTS org_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Contrainte d'unicité : une organisation ne peut avoir qu'une seule liaison active vers un programme
  UNIQUE(org_id, program_id)
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_org_programs_org_id ON org_programs(org_id);
CREATE INDEX IF NOT EXISTS idx_org_programs_program_id ON org_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_org_programs_active ON org_programs(is_active) WHERE is_active = true;

-- ============================================================================
-- POLITIQUES RLS
-- ============================================================================

ALTER TABLE org_programs ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout faire
DROP POLICY IF EXISTS "org_programs_admin_all" ON org_programs;
CREATE POLICY "org_programs_admin_all" ON org_programs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les membres de l'organisation peuvent voir les programmes actifs
DROP POLICY IF EXISTS "org_programs_select_members" ON org_programs;
CREATE POLICY "org_programs_select_members" ON org_programs
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = org_programs.org_id
        AND org_members.user_id = auth.uid()
    )
  );

-- Les trainers de l'organisation peuvent voir et gérer les liaisons
DROP POLICY IF EXISTS "org_programs_trainer_manage" ON org_programs;
CREATE POLICY "org_programs_trainer_manage" ON org_programs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = org_programs.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('admin', 'trainer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = org_programs.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('admin', 'trainer')
    )
  );

-- ============================================================================
-- FONCTION HELPER
-- ============================================================================

-- Fonction pour récupérer les programmes d'une organisation
CREATE OR REPLACE FUNCTION get_org_programs(p_org_id UUID)
RETURNS TABLE (
  program_id UUID,
  program_title TEXT,
  program_description TEXT,
  program_status TEXT,
  granted_at TIMESTAMPTZ,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.status::TEXT,
    op.granted_at,
    op.is_active
  FROM org_programs op
  JOIN programs p ON p.id = op.program_id
  WHERE op.org_id = p_org_id
    AND op.is_active = true
  ORDER BY op.granted_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fonction pour récupérer les organisations d'un programme
CREATE OR REPLACE FUNCTION get_program_orgs(p_program_id UUID)
RETURNS TABLE (
  org_id UUID,
  org_name TEXT,
  org_slug TEXT,
  granted_at TIMESTAMPTZ,
  learner_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.slug,
    op.granted_at,
    (SELECT COUNT(*) FROM org_members om WHERE om.org_id = o.id AND om.role = 'student')
  FROM org_programs op
  JOIN orgs o ON o.id = op.org_id
  WHERE op.program_id = p_program_id
    AND op.is_active = true
  ORDER BY o.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
