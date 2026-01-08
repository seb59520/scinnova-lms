-- Migration : Ajout des champs de publication pour les formations
-- Permet de rendre une formation publique et de suivre sa date de publication
-- pour afficher les nouvelles formations sur la landing page

-- Ajouter le champ is_public (par défaut false)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Ajouter le champ publication_date (nullable, rempli automatiquement quand is_public passe à true)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS publication_date TIMESTAMP WITH TIME ZONE;

-- Créer un index pour optimiser les requêtes de formations publiques
CREATE INDEX IF NOT EXISTS idx_courses_is_public ON courses(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_courses_publication_date ON courses(publication_date DESC) WHERE is_public = TRUE;

-- Commentaires pour documentation
COMMENT ON COLUMN courses.is_public IS 'Indique si la formation est publique et visible sur la landing page';
COMMENT ON COLUMN courses.publication_date IS 'Date de publication de la formation (rempli automatiquement quand is_public passe à true)';

-- Fonction trigger pour mettre à jour automatiquement publication_date
CREATE OR REPLACE FUNCTION update_publication_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Si is_public passe de false à true et que publication_date est null, la définir à maintenant
  IF NEW.is_public = TRUE AND OLD.is_public = FALSE AND NEW.publication_date IS NULL THEN
    NEW.publication_date = NOW();
  END IF;
  
  -- Si is_public passe à false, ne pas modifier publication_date (garder l'historique)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_publication_date ON courses;
CREATE TRIGGER trigger_update_publication_date
  BEFORE UPDATE ON courses
  FOR EACH ROW
  WHEN (NEW.is_public IS DISTINCT FROM OLD.is_public)
  EXECUTE FUNCTION update_publication_date();
