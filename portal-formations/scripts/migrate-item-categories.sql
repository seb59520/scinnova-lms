-- Migration script: Auto-categorize existing items based on type and title keywords
-- Run this script AFTER the main migration (20260121_add_course_pedagogical_metadata.sql)
--
-- This script performs a one-time migration to set initial categories for existing items.
-- Future items should have their category set manually in the admin UI.

-- =============================================================================
-- Step 1: Auto-categorize based on item type
-- =============================================================================

-- Slides -> cours
UPDATE items
SET category = 'cours'
WHERE category IS NULL
  AND type = 'slide';

-- Resources -> ressource
UPDATE items
SET category = 'ressource'
WHERE category IS NULL
  AND type = 'resource';

-- Exercises and activities -> exercice
UPDATE items
SET category = 'exercice'
WHERE category IS NULL
  AND type IN ('exercise', 'activity', 'game');

-- TPs -> tp
UPDATE items
SET category = 'tp'
WHERE category IS NULL
  AND type = 'tp';

-- =============================================================================
-- Step 2: Detect examples by title keywords (override previous categorization)
-- =============================================================================

UPDATE items
SET category = 'exemple'
WHERE (
  LOWER(title) LIKE '%exemple%'
  OR LOWER(title) LIKE '%demo%'
  OR LOWER(title) LIKE '%demonstration%'
  OR LOWER(title) LIKE '%cas pratique%'
  OR LOWER(title) LIKE '%illustration%'
);

-- =============================================================================
-- Step 3: Detect evaluations by title keywords (override previous categorization)
-- =============================================================================

UPDATE items
SET category = 'evaluation'
WHERE (
  LOWER(title) LIKE '%evaluation%'
  OR LOWER(title) LIKE '%évaluation%'
  OR LOWER(title) LIKE '%examen%'
  OR LOWER(title) LIKE '%quiz final%'
  OR LOWER(title) LIKE '%test final%'
  OR LOWER(title) LIKE '%controle%'
  OR LOWER(title) LIKE '%contrôle%'
  OR LOWER(title) LIKE '%certification%'
);

-- =============================================================================
-- Summary: Report categorization results
-- =============================================================================

SELECT
  category,
  COUNT(*) as count
FROM items
WHERE category IS NOT NULL
GROUP BY category
ORDER BY count DESC;

-- Show items that remain uncategorized
SELECT
  id,
  title,
  type,
  category
FROM items
WHERE category IS NULL
LIMIT 20;
