-- ============================================================================
-- Script pour recalculer les progressions de modules basées sur les soumissions
-- Organisation ID: 6f772ff6-1d15-4f29-9d0f-be03b2cc974d
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1 : Voir l'état actuel des progressions
SELECT 
  s.title as session_title,
  c.title as cours,
  COUNT(DISTINCT mp.user_id) as nb_apprenants_avec_progression,
  AVG(mp.percent) as moyenne_actuelle,
  MIN(mp.percent) as min_progression,
  MAX(mp.percent) as max_progression
FROM module_progress mp
JOIN sessions s ON s.id = mp.session_id
JOIN courses c ON c.id = (SELECT course_id FROM modules WHERE id = mp.module_id)
WHERE s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
AND s.status = 'active'
GROUP BY s.id, s.title, c.title
ORDER BY s.created_at DESC;

-- ÉTAPE 2 : Recalculer les progressions basées sur les soumissions
-- Pour chaque apprenant, module et session, calculer le % d'items complétés
WITH module_items AS (
  SELECT 
    m.id as module_id,
    m.course_id,
    COUNT(DISTINCT i.id) as total_items
  FROM modules m
  LEFT JOIN items i ON i.module_id = m.id
  WHERE m.course_id IN (
    SELECT course_id FROM sessions 
    WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
    AND status = 'active'
  )
  GROUP BY m.id, m.course_id
),
user_completions AS (
  SELECT 
    e.user_id,
    e.session_id,
    m.id as module_id,
    mi.total_items,
    COUNT(DISTINCT sub.item_id) FILTER (
      WHERE sub.status IN ('submitted', 'graded')
    ) as items_completes
  FROM enrollments e
  JOIN sessions s ON s.id = e.session_id
  JOIN modules m ON m.course_id = s.course_id
  JOIN module_items mi ON mi.module_id = m.id
  LEFT JOIN items i ON i.module_id = m.id
  LEFT JOIN submissions sub ON sub.user_id = e.user_id 
    AND sub.item_id = i.id
    AND sub.status IN ('submitted', 'graded')
    AND (
      sub.session_id = e.session_id 
      OR (sub.session_id IS NULL)
    )
  WHERE e.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  AND s.status = 'active'
  GROUP BY e.user_id, e.session_id, m.id, mi.total_items
)
UPDATE module_progress mp
SET 
  percent = CASE 
    WHEN uc.total_items > 0 THEN 
      LEAST(100, ROUND((uc.items_completes::numeric / uc.total_items) * 100))
    ELSE 0
  END,
  updated_at = NOW()
FROM user_completions uc
WHERE mp.user_id = uc.user_id
AND mp.module_id = uc.module_id
AND (
  (mp.session_id = uc.session_id)
  OR (mp.session_id IS NULL AND uc.session_id IS NOT NULL)
)
RETURNING 
  (SELECT full_name FROM profiles WHERE id = mp.user_id) as nom_apprenant,
  (SELECT title FROM modules WHERE id = mp.module_id) as module_title,
  (SELECT title FROM sessions WHERE id = mp.session_id) as session_title,
  mp.percent as nouveau_pourcentage,
  (SELECT total_items FROM user_completions WHERE user_id = mp.user_id AND module_id = mp.module_id) as total_items,
  (SELECT items_completes FROM user_completions WHERE user_id = mp.user_id AND module_id = mp.module_id) as items_completes;

-- ÉTAPE 3 : Vérification après recalcul
SELECT 
  s.title as session_title,
  c.title as cours,
  COUNT(DISTINCT mp.user_id) as nb_apprenants_avec_progression,
  AVG(mp.percent) as nouvelle_moyenne,
  MIN(mp.percent) as min_progression,
  MAX(mp.percent) as max_progression,
  COUNT(DISTINCT mp.id) FILTER (WHERE mp.percent > 0) as progressions_non_zero
FROM module_progress mp
JOIN sessions s ON s.id = mp.session_id
JOIN courses c ON c.id = (SELECT course_id FROM modules WHERE id = mp.module_id)
WHERE s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
AND s.status = 'active'
GROUP BY s.id, s.title, c.title
ORDER BY s.created_at DESC;

-- ÉTAPE 4 : Détail par apprenant pour une session (exemple)
-- Remplacez 'SESSION_ID' par l'ID d'une session pour voir le détail
SELECT 
  p.full_name as nom_apprenant,
  m.title as module_title,
  mp.percent as pourcentage,
  (
    SELECT COUNT(DISTINCT i.id) 
    FROM items i 
    WHERE i.module_id = m.id
  ) as total_items,
  (
    SELECT COUNT(DISTINCT sub.item_id)
    FROM submissions sub
    JOIN items i ON i.id = sub.item_id
    WHERE sub.user_id = mp.user_id
    AND i.module_id = m.id
    AND sub.status IN ('submitted', 'graded')
    AND (
      sub.session_id = mp.session_id 
      OR (sub.session_id IS NULL AND mp.session_id IS NOT NULL)
      OR (sub.session_id IS NOT NULL AND mp.session_id IS NULL)
    )
  ) as items_completes
FROM module_progress mp
JOIN profiles p ON p.id = mp.user_id
JOIN modules m ON m.id = mp.module_id
JOIN sessions s ON s.id = mp.session_id
WHERE s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
AND s.status = 'active'
ORDER BY s.created_at DESC, p.full_name, m.title
LIMIT 50;

