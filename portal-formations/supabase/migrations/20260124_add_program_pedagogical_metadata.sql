-- Migration: Add pedagogical metadata to programs table
-- Date: 2026-01-24
-- Description: Ajoute les champs pédagogiques (objectifs, prérequis, parcours conseillé, synthèse finale, config évaluations) à la table programs

-- =============================================================================
-- Add pedagogical fields to programs table
-- =============================================================================

-- Pedagogical objectives (array of objectives with order)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS pedagogical_objectives JSONB DEFAULT '[]';

-- Prerequisites (array with required/recommended/optional levels)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]';

-- Recommended learning path (free text)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS recommended_path TEXT DEFAULT NULL;

-- Final synthesis (TipTap content + key points)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS final_synthesis JSONB DEFAULT NULL;

-- Evaluations configuration (items selection with weights)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS evaluations_config JSONB DEFAULT NULL;

-- =============================================================================
-- Add comments for documentation
-- =============================================================================

COMMENT ON COLUMN programs.pedagogical_objectives IS 'Array of pedagogical objectives: [{id, text, category?, order}]';
COMMENT ON COLUMN programs.prerequisites IS 'Array of prerequisites: [{id, text, level, order}] where level is required|recommended|optional';
COMMENT ON COLUMN programs.recommended_path IS 'Free text describing the recommended learning path';
COMMENT ON COLUMN programs.final_synthesis IS 'Final synthesis: {body?, summary?, keyPoints[]}';
COMMENT ON COLUMN programs.evaluations_config IS 'Evaluations configuration: {items: [{itemId, title, weight, threshold?}], passingScore?}';
