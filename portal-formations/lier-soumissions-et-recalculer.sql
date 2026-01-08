-- ============================================================================
-- Script complet : Lier les soumissions aux sessions et recalculer les progressions
-- Organisation ID: 6f772ff6-1d15-4f29-9d0f-be03b2cc974d
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1 : Lier les soumissions aux sessions (si elles n'ont pas de session_id)
UPDATE submissions sub
SET session_id = (
  SELECT e.session_id
  FROM enrollments e
  JOIN sessions s ON s.id = e.session_id
  JOIN items i ON i.id = sub.item_id
  JOIN modules m ON m.id = i.module_id
  WHERE e.user_id = sub.user_id
  AND s.course_id = m.course_id
  AND e.status = 'active'
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  LIMIT 1
)
WHERE sub.session_id IS NULL
AND sub.status IN ('submitted', 'graded')
AND EXISTS (
  SELECT 1
  FROM enrollments e
  JOIN sessions s ON s.id = e.session_id
  JOIN items i ON i.id = sub.item_id
  JOIN modules m ON m.id = i.module_id
  WHERE e.user_id = sub.user_id
  AND s.course_id = m.course_id
  AND e.status = 'active'
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
)
RETURNING 
  id,
  (SELECT full_name FROM profiles WHERE id = user_id) as nom_apprenant,
  (SELECT title FROM items WHERE id = item_id) as item_title,
  (SELECT title FROM sessions WHERE id = session_id) as session_title;

-- ÉTAPE 2 : Recalculer les progressions avec la nouvelle logique
WITH module_items AS (
  SELECT 
    m.id as module_id,
    COUNT(DISTINCT i.id) as total_items
  FROM modules m
  LEFT JOIN items i ON i.module_id = m.id
  WHERE m.course_id IN (
    SELECT course_id FROM sessions 
    WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
    AND status = 'active'
  )
  GROUP BY m.id
),
user_completions AS (
  SELECT 
    e.user_id,
    e.session_id,
    m.id as module_id,
    COALESCE(mi.total_items, 0) as total_items,
    COUNT(DISTINCT sub.item_id) FILTER (
      WHERE sub.status IN ('submitted', 'graded')
    ) as items_completes
  FROM enrollments e
  JOIN sessions s ON s.id = e.session_id
  JOIN modules m ON m.course_id = s.course_id
  LEFT JOIN module_items mi ON mi.module_id = m.id
  LEFT JOIN items i ON i.module_id = m.id
  LEFT JOIN submissions sub ON sub.user_id = e.user_id 
    AND sub.item_id = i.id
    AND sub.status IN ('submitted', 'graded')
    AND (
      sub.session_id = e.session_id 
      OR sub.session_id IS NULL
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
      LEAST(100, ROUND((uc.items_completes::numeric / NULLIF(uc.total_items, 0)) * 100))
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
  uc.total_items,
  uc.items_completes;

-- ÉTAPE 3 : Vérification finale
SELECT 
  s.title as session_title,
  c.title as cours,
  COUNT(DISTINCT e.user_id) as nb_apprenants,
  COUNT(DISTINCT sub.id) as nb_soumissions,
  COUNT(DISTINCT mp.id) as nb_progressions,
  ROUND(AVG(mp.percent)::numeric, 2) as moyenne_completion,
  COUNT(DISTINCT mp.id) FILTER (WHERE mp.percent > 0) as progressions_non_zero
FROM sessions s
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
LEFT JOIN submissions sub ON sub.session_id = s.id AND sub.status IN ('submitted', 'graded')
LEFT JOIN module_progress mp ON mp.session_id = s.id
WHERE s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
AND s.status = 'active'
GROUP BY s.id, s.title, c.title
ORDER BY s.created_at DESC;



