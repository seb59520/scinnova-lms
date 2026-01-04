-- ============================================================================
-- Vérifier le contenu des slides
-- ============================================================================
-- Ce script vérifie la structure du contenu des slides
-- ============================================================================

-- 1. Vérifier la structure du contenu des slides
SELECT 
  id,
  title,
  type,
  published,
  -- Vérifier si content existe
  CASE 
    WHEN content IS NULL THEN '❌ Content NULL'
    WHEN content = '{}'::jsonb THEN '⚠️ Content vide'
    WHEN content->'body' IS NULL THEN '⚠️ Pas de body'
    WHEN content->'body'->>'type' != 'doc' THEN '⚠️ Body.type != doc'
    ELSE '✅ Structure OK'
  END as content_status,
  -- Vérifier la structure
  jsonb_typeof(content) as content_type,
  jsonb_typeof(content->'body') as body_type,
  content->'body'->>'type' as body_type_value,
  -- Afficher un extrait du contenu
  jsonb_pretty(content->'body') as body_preview
FROM items
WHERE type = 'slide'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Vérifier un item spécifique (remplacez l'ID)
SELECT 
  id,
  title,
  type,
  content,
  jsonb_pretty(content) as content_formatted
FROM items
WHERE id = '64106177-a1cc-42b3-9c3f-5ad1082869c5'; -- M1

-- 3. Vérifier si le contenu body a bien la structure TipTap
SELECT 
  id,
  title,
  CASE 
    WHEN content->'body'->>'type' = 'doc' THEN '✅ Format TipTap correct'
    WHEN content->'body'->>'type' IS NULL THEN '❌ Pas de body.type'
    ELSE '⚠️ Format incorrect: ' || (content->'body'->>'type')
  END as tipTap_status,
  -- Vérifier si content.body.content existe
  CASE 
    WHEN content->'body'->'content' IS NULL THEN '❌ Pas de content.body.content'
    WHEN jsonb_typeof(content->'body'->'content') != 'array' THEN '⚠️ content.body.content n''est pas un array'
    ELSE '✅ content.body.content OK'
  END as content_array_status
FROM items
WHERE type = 'slide'
ORDER BY created_at DESC;

