-- ============================================================================
-- Vérifier les items et leurs types
-- ============================================================================
-- Ce script vérifie les items pour identifier le problème de type
-- ============================================================================

-- 1. Vérifier tous les items avec leur type exact
SELECT 
  id,
  type,
  title,
  LENGTH(type) as type_length,
  ASCII(SUBSTRING(type, 1, 1)) as first_char_ascii,
  ASCII(SUBSTRING(type, LENGTH(type), 1)) as last_char_ascii,
  CASE 
    WHEN type = 'slide' THEN '✅ Type correct'
    WHEN LOWER(TRIM(type)) = 'slide' THEN '⚠️ Type avec espaces/majuscules'
    ELSE '❌ Type différent: ' || type
  END as status
FROM items
WHERE type = 'slide' 
   OR LOWER(TRIM(type)) = 'slide'
   OR title LIKE '%Architecture%'
   OR title LIKE '%client%serveur%'
ORDER BY created_at DESC;

-- 2. Vérifier tous les types d'items (statistiques)
SELECT 
  type,
  COUNT(*) as count,
  MIN(LENGTH(type)) as min_length,
  MAX(LENGTH(type)) as max_length
FROM items
GROUP BY type
ORDER BY type;

-- 3. Vérifier s'il y a des caractères invisibles ou des problèmes d'encodage
SELECT 
  id,
  type,
  title,
  encode(type::bytea, 'hex') as type_hex,
  encode(type::bytea, 'escape') as type_escaped
FROM items
WHERE type != LOWER(TRIM(type))
   OR type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game')
LIMIT 10;

-- 4. Vérifier les slides récemment créées
SELECT 
  id,
  type,
  title,
  position,
  published,
  module_id,
  created_at
FROM items
WHERE type = 'slide'
ORDER BY created_at DESC
LIMIT 10;



