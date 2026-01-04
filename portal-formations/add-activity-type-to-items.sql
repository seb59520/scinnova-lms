-- Ajouter le type 'activity' à la contrainte CHECK de la table items
-- Ce script met à jour la contrainte pour permettre le type 'activity'

-- Supprimer l'ancienne contrainte CHECK
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;

-- Recréer la contrainte avec 'activity' inclus
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game'));

-- Vérifier que la contrainte a été appliquée
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conname = 'items_type_check';

