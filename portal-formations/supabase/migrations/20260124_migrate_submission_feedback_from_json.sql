-- Migration: Migrate existing feedback data from answer_json to dedicated columns
-- Date: 2026-01-24
-- Description: Migre les données d'appréciation et d'axes d'amélioration depuis answer_json vers les colonnes dédiées

-- Migrer les données d'appréciation depuis answer_json vers la colonne appreciation
UPDATE submissions
SET appreciation = (answer_json->>'appreciation')::TEXT
WHERE answer_json IS NOT NULL
  AND answer_json->>'appreciation' IS NOT NULL
  AND answer_json->>'appreciation' != ''
  AND appreciation IS NULL;

-- Migrer les données d'axes d'amélioration depuis answer_json vers la colonne improvement_areas
UPDATE submissions
SET improvement_areas = (answer_json->>'improvementAreas')::TEXT
WHERE answer_json IS NOT NULL
  AND answer_json->>'improvementAreas' IS NOT NULL
  AND answer_json->>'improvementAreas' != ''
  AND improvement_areas IS NULL;

-- Afficher le nombre de soumissions migrées
DO $$
DECLARE
  appreciation_count INTEGER;
  improvement_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO appreciation_count
  FROM submissions
  WHERE appreciation IS NOT NULL;
  
  SELECT COUNT(*) INTO improvement_count
  FROM submissions
  WHERE improvement_areas IS NOT NULL;
  
  RAISE NOTICE '✅ Migration terminée';
  RAISE NOTICE '   - Soumissions avec appréciation: %', appreciation_count;
  RAISE NOTICE '   - Soumissions avec axes d''amélioration: %', improvement_count;
END $$;
