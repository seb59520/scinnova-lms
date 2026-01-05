-- Script unifié pour ajouter toutes les colonnes manquantes à la table chapters
-- À exécuter dans l'interface SQL de Supabase
-- Ce script ajoute : type, game_content, et published si elles n'existent pas

DO $$ 
BEGIN
  -- Ajouter la colonne type à la table chapters (si elle n'existe pas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'type'
  ) THEN
    ALTER TABLE chapters 
    ADD COLUMN type TEXT DEFAULT 'content' CHECK (type IN ('content', 'game'));
    RAISE NOTICE '✅ Colonne type ajoutée à la table chapters';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne type existe déjà';
  END IF;

  -- Ajouter la colonne game_content à la table chapters (si elle n'existe pas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'game_content'
  ) THEN
    ALTER TABLE chapters 
    ADD COLUMN game_content JSONB;
    RAISE NOTICE '✅ Colonne game_content ajoutée à la table chapters';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne game_content existe déjà';
  END IF;

  -- Ajouter la colonne published si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'published'
  ) THEN
    ALTER TABLE chapters 
    ADD COLUMN published BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '✅ Colonne published ajoutée à la table chapters';
    
    -- Mettre à jour les chapitres existants pour les marquer comme publiés
    UPDATE chapters 
    SET published = TRUE 
    WHERE published IS NULL;
    RAISE NOTICE '✅ Chapitres existants mis à jour avec published = TRUE';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne published existe déjà';
  END IF;

  -- Mettre à jour les chapitres existants pour avoir le type 'content' par défaut
  UPDATE chapters 
  SET type = 'content' 
  WHERE type IS NULL;
  
  IF FOUND THEN
    RAISE NOTICE '✅ Chapitres existants mis à jour avec type = content';
  END IF;

END $$;

-- Index pour optimiser les requêtes par type
CREATE INDEX IF NOT EXISTS idx_chapters_type ON chapters(item_id, type);

-- Index pour optimiser les requêtes filtrées par published
CREATE INDEX IF NOT EXISTS idx_chapters_item_id_published ON chapters(item_id, published) 
  WHERE published = true;

-- Commentaires pour la documentation
COMMENT ON COLUMN chapters.type IS 'Type de chapitre : content (contenu normal) ou game (jeu interactif)';
COMMENT ON COLUMN chapters.game_content IS 'Contenu du jeu si type = game. Structure dépend du gameType (matching, column-matching, api-types, format-files)';
COMMENT ON COLUMN chapters.published IS 'Indique si le chapitre est publié et visible dans le mode cours. Les chapitres non publiés restent visibles en mode admin.';

-- Afficher un résumé
SELECT 
  'Résumé des colonnes de la table chapters' as info,
  COUNT(*) FILTER (WHERE column_name = 'id') as has_id,
  COUNT(*) FILTER (WHERE column_name = 'item_id') as has_item_id,
  COUNT(*) FILTER (WHERE column_name = 'title') as has_title,
  COUNT(*) FILTER (WHERE column_name = 'content') as has_content,
  COUNT(*) FILTER (WHERE column_name = 'position') as has_position,
  COUNT(*) FILTER (WHERE column_name = 'type') as has_type,
  COUNT(*) FILTER (WHERE column_name = 'game_content') as has_game_content,
  COUNT(*) FILTER (WHERE column_name = 'published') as has_published,
  COUNT(*) FILTER (WHERE column_name = 'created_at') as has_created_at,
  COUNT(*) FILTER (WHERE column_name = 'updated_at') as has_updated_at
FROM information_schema.columns
WHERE table_name = 'chapters';


