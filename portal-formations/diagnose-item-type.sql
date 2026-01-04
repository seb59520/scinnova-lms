-- ============================================================================
-- Script de diagnostic : Vérifier les types d'items
-- ============================================================================
-- Ce script permet de diagnostiquer les problèmes de type d'items
-- ============================================================================

-- 1. Vérifier tous les types d'items existants
SELECT 
  type,
  COUNT(*) as count,
  COALESCE(
    (
      SELECT STRING_AGG(title, ', ')
      FROM (
        SELECT DISTINCT title
        FROM items i2
        WHERE i2.type = i1.type
        ORDER BY title
        LIMIT 5
      ) sub
    ),
    'Aucun exemple'
  ) as exemples
FROM items i1
GROUP BY type
ORDER BY type;

-- 2. Vérifier les items avec des types suspects (espaces, majuscules, etc.)
SELECT 
  id,
  type,
  LENGTH(type) as type_length,
  title,
  CASE 
    WHEN type != LOWER(TRIM(type)) THEN '⚠️ Type avec majuscules ou espaces'
    WHEN type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game') THEN '❌ Type invalide'
    ELSE '✅ OK'
  END as status
FROM items
WHERE type != LOWER(TRIM(type))
   OR type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game')
ORDER BY type;

-- 3. Vérifier spécifiquement les slides
SELECT 
  id,
  type,
  title,
  position,
  published,
  module_id,
  CASE 
    WHEN type = 'slide' THEN '✅ Type correct'
    ELSE '❌ Type incorrect: ' || type
  END as status
FROM items
WHERE title LIKE '%Architecture%' 
   OR title LIKE '%client%serveur%'
   OR type = 'slide'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Vérifier la contrainte CHECK de la table
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conname LIKE '%type%';

-- 5. Corriger les types avec espaces ou majuscules (si nécessaire)
-- DÉCOMMENTEZ CES LIGNES SEULEMENT SI VOUS VOULEZ CORRIGER LES TYPES
/*
UPDATE items
SET type = LOWER(TRIM(type))
WHERE type != LOWER(TRIM(type));

-- Vérifier après correction
SELECT type, COUNT(*) 
FROM items 
GROUP BY type;
*/

