-- ============================================================================
-- Ajout du champ thumbnail_image_path à la table courses
-- ============================================================================
-- Ce script ajoute la possibilité d'associer une image de vignette à une formation
-- ============================================================================

-- Ajouter la colonne thumbnail_image_path si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'thumbnail_image_path'
  ) THEN
    ALTER TABLE courses 
    ADD COLUMN thumbnail_image_path TEXT;
    
    COMMENT ON COLUMN courses.thumbnail_image_path IS 'Chemin vers l''image de vignette de la formation dans Supabase Storage';
  END IF;
END $$;

-- Index pour améliorer les performances si nécessaire
CREATE INDEX IF NOT EXISTS idx_courses_thumbnail_image_path ON courses(thumbnail_image_path) WHERE thumbnail_image_path IS NOT NULL;
