-- Ajout des colonnes manquantes à la table chapters
-- À exécuter dans l'interface SQL de Supabase
-- Ce script ajoute : type, game_content, et published

DO $$ 
BEGIN
  -- Ajouter la colonne type à la table chapters (si elle n'existe pas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'type'
  ) THEN
    ALTER TABLE chapters 
    ADD COLUMN type TEXT DEFAULT 'content' CHECK (type IN ('content', 'game'));
    RAISE NOTICE 'Colonne type ajoutée à la table chapters';
  ELSE
    RAISE NOTICE 'Colonne type existe déjà';
  END IF;

  -- Ajouter la colonne game_content à la table chapters (si elle n'existe pas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'game_content'
  ) THEN
    ALTER TABLE chapters 
    ADD COLUMN game_content JSONB;
    RAISE NOTICE 'Colonne game_content ajoutée à la table chapters';
  ELSE
    RAISE NOTICE 'Colonne game_content existe déjà';
  END IF;

  -- Ajouter la colonne published si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'published'
  ) THEN
    ALTER TABLE chapters 
    ADD COLUMN published BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Colonne published ajoutée à la table chapters';
    
    -- Mettre à jour les chapitres existants pour les marquer comme publiés
    UPDATE chapters 
    SET published = TRUE 
    WHERE published IS NULL;
  ELSE
    RAISE NOTICE 'Colonne published existe déjà';
  END IF;

  -- Mettre à jour les chapitres existants pour avoir le type 'content' par défaut
  UPDATE chapters 
  SET type = 'content' 
  WHERE type IS NULL;

END $$;

-- Index pour optimiser les requêtes par type
CREATE INDEX IF NOT EXISTS idx_chapters_type ON chapters(item_id, type);

-- Commentaires pour la documentation
COMMENT ON COLUMN chapters.type IS 'Type de chapitre : content (contenu normal) ou game (jeu interactif)';
COMMENT ON COLUMN chapters.game_content IS 'Contenu du jeu si type = game. Structure dépend du gameType (matching, column-matching, api-types, format-files)';
COMMENT ON COLUMN chapters.published IS 'Indique si le chapitre est publié et visible dans le mode cours';

