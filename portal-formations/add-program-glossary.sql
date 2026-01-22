-- Ajout du support des glossaires pour les programmes
-- À exécuter dans l'interface SQL de Supabase

-- Ajouter la colonne glossary à la table programs
-- Le glossaire est stocké au format JSON (structure: metadata, categories, terms)
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS glossary JSONB DEFAULT NULL;

-- Ajouter un index GIN pour les recherches dans le glossaire
CREATE INDEX IF NOT EXISTS idx_programs_glossary_gin ON programs USING GIN (glossary);

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN programs.glossary IS 'Glossaire associé au programme au format JSON (metadata, categories, terms)';

-- Fonction helper pour rechercher dans les glossaires
CREATE OR REPLACE FUNCTION search_program_glossary(program_uuid UUID, search_term TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT glossary INTO result
  FROM programs
  WHERE id = program_uuid;
  
  -- Si le glossaire existe, filtrer les termes qui correspondent
  IF result IS NOT NULL AND result ? 'terms' THEN
    SELECT jsonb_build_object(
      'metadata', result->'metadata',
      'categories', result->'categories',
      'terms', (
        SELECT jsonb_agg(term)
        FROM jsonb_array_elements(result->'terms') AS term
        WHERE 
          LOWER(term->>'word') LIKE '%' || LOWER(search_term) || '%'
          OR LOWER(term->>'explanation') LIKE '%' || LOWER(search_term) || '%'
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(term->'tags') AS tag
            WHERE LOWER(tag) LIKE '%' || LOWER(search_term) || '%'
          )
      )
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir un terme spécifique d'un glossaire
CREATE OR REPLACE FUNCTION get_program_glossary_term(program_uuid UUID, term_id TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT term INTO result
  FROM programs,
       jsonb_array_elements(glossary->'terms') AS term
  WHERE id = program_uuid
    AND term->>'id' = term_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
