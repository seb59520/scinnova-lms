-- Migration : Ajouter le champ allow_pdf_download à la table courses
-- Permet d'activer/désactiver le téléchargement PDF pour un cours

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS allow_pdf_download BOOLEAN DEFAULT FALSE;

-- Commentaire pour documenter le champ
COMMENT ON COLUMN courses.allow_pdf_download IS 'Active le téléchargement PDF du cours complet avec format paysage (slides à gauche, contexte pédagogique à droite)';

