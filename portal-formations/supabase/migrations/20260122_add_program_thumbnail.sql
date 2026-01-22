-- Migration: Ajouter la colonne thumbnail_image_path pour les programmes
-- Cette colonne stocke le chemin vers l'image de vignette du programme

ALTER TABLE programs
ADD COLUMN IF NOT EXISTS thumbnail_image_path TEXT DEFAULT NULL;

-- Commentaire pour la documentation
COMMENT ON COLUMN programs.thumbnail_image_path IS 'Chemin vers l''image de vignette du programme dans le bucket course-assets';
