-- Script pour nettoyer les doublons dans module_progress (VERSION SÉCURISÉE)
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

-- Étape 1.5: Vérifier quelles données seront supprimées (AVANT de supprimer)
SELECT 
  mp.id,
  mp.user_id,
  mp.module_id,
  mp.percent,
  mp.completed_at,
  mp.updated_at,
  mp.started_at,
  ROW_NUMBER() OVER (
    PARTITION BY mp.user_id, mp.module_id 
    ORDER BY mp.updated_at DESC, mp.started_at DESC
  ) as rn
FROM module_progress mp
WHERE (mp.user_id, mp.module_id) IN (
  SELECT user_id, module_id
  FROM module_progress
  GROUP BY user_id, module_id
  HAVING COUNT(*) > 1
)
ORDER BY mp.user_id, mp.module_id, mp.updated_at DESC;

-- Cette requête montre tous les enregistrements, avec rn=1 pour ceux qui seront gardés
-- et rn>1 pour ceux qui seront supprimés

-- Étape 2: Supprimer les anciennes progressions, garder seulement la plus récente
-- ATTENTION: Cette requête supprime des données. Faire une sauvegarde avant !
-- Exécuter seulement après avoir vérifié l'étape 1.5
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

-- Étape 4: Vérifier les données finales
SELECT 
  user_id,
  module_id,
  percent,
  completed_at,
  updated_at,
  started_at
FROM module_progress
WHERE user_id = '1b313da5-90f4-479e-ba69-f22c03753d35'
ORDER BY module_id, updated_at DESC;
