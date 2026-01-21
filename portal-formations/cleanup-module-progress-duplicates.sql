-- Script pour nettoyer les doublons dans module_progress
-- Garde seulement la progression la plus récente pour chaque combinaison (user_id, module_id)

-- Étape 1: Identifier les doublons
SELECT 
  user_id,
  module_id,
  COUNT(*) as duplicate_count
FROM module_progress
GROUP BY user_id, module_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Étape 2: Supprimer les anciennes progressions, garder seulement la plus récente
-- ATTENTION: Cette requête supprime des données. Faire une sauvegarde avant !
DELETE FROM module_progress
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, module_id 
        ORDER BY updated_at DESC, started_at DESC
      ) as rn
    FROM module_progress
  ) ranked
  WHERE rn > 1
);

-- Étape 3: Vérifier qu'il ne reste plus qu'une seule progression par (user_id, module_id)
SELECT 
  user_id,
  module_id,
  COUNT(*) as count
FROM module_progress
GROUP BY user_id, module_id
HAVING COUNT(*) > 1;

-- Si cette requête ne retourne rien, tous les doublons ont été supprimés
