-- Migration: Add pedagogical metadata to courses and category to items
-- Date: 2026-01-21

-- =============================================================================
-- Phase 1: Add pedagogical fields to courses table
-- =============================================================================

-- Pedagogical objectives (array of objectives with order)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS pedagogical_objectives JSONB DEFAULT '[]';

-- Prerequisites (array with required/recommended/optional levels)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]';

-- Recommended learning path (free text)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS recommended_path TEXT DEFAULT NULL;

-- Final synthesis (TipTap content + key points)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_synthesis JSONB DEFAULT NULL;

-- Evaluations configuration (items selection with weights)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS evaluations_config JSONB DEFAULT NULL;

-- =============================================================================
-- Phase 2: Add category field to items table
-- =============================================================================

-- Category for items (cours, exemple, exercice, tp, ressource, evaluation)
ALTER TABLE items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- Add constraint to ensure valid categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'items_category_check'
    ) THEN
        ALTER TABLE items ADD CONSTRAINT items_category_check
        CHECK (category IS NULL OR category IN ('cours', 'exemple', 'exercice', 'tp', 'ressource', 'evaluation'));
    END IF;
END $$;

-- Add index for category lookups
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- =============================================================================
-- Phase 3: Add comments for documentation
-- =============================================================================

COMMENT ON COLUMN courses.pedagogical_objectives IS 'Array of pedagogical objectives: [{id, text, category?, order}]';
COMMENT ON COLUMN courses.prerequisites IS 'Array of prerequisites: [{id, text, level, order}] where level is required|recommended|optional';
COMMENT ON COLUMN courses.recommended_path IS 'Free text describing the recommended learning path';
COMMENT ON COLUMN courses.final_synthesis IS 'Final synthesis: {body?, summary?, keyPoints[]}';
COMMENT ON COLUMN courses.evaluations_config IS 'Evaluations configuration: {items: [{itemId, title, weight, threshold?}], passingScore?}';
COMMENT ON COLUMN items.category IS 'Item category: cours, exemple, exercice, tp, ressource, evaluation';
