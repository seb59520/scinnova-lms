-- ============================================================================
-- Script de correction : Mettre à jour la contrainte CHECK pour les types d'items
-- ============================================================================
-- Ce script garantit que la contrainte CHECK inclut tous les types valides :
-- 'resource', 'slide', 'exercise', 'activity', 'tp', 'game'
-- ============================================================================

-- 1. Vérifier la contrainte actuelle
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conname LIKE '%type%';

-- 2. Supprimer toutes les contraintes CHECK existantes sur le type
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check1;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check2;

-- 3. Recréer la contrainte avec tous les types valides
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game'));

-- 4. Vérifier que la contrainte a été appliquée correctement
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conname = 'items_type_check';

-- 5. Vérifier qu'il n'y a pas d'items avec des types invalides
SELECT 
  id,
  type,
  title,
  CASE 
    WHEN type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game') THEN '❌ Type invalide'
    WHEN type != LOWER(TRIM(type)) THEN '⚠️ Type avec majuscules ou espaces'
    ELSE '✅ OK'
  END as status
FROM items
WHERE type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game')
   OR type != LOWER(TRIM(type))
ORDER BY type;

-- 6. Statistiques des types d'items
SELECT 
  type,
  COUNT(*) as count
FROM items
GROUP BY type
ORDER BY type;
