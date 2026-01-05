-- ============================================================================
-- Script de diagnostic et correction des données pour le portail formateur
-- Organisation ID: 6f772ff6-1d15-4f29-9d0f-be03b2cc974d
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1 : Diagnostic - Vérifier les soumissions
SELECT 
  'Soumissions' as type_donnee,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE session_id IS NOT NULL) as avec_session,
  COUNT(*) FILTER (WHERE session_id IS NULL) as sans_session,
  COUNT(*) FILTER (WHERE submitted_at IS NOT NULL) as avec_submitted_at,
  COUNT(*) FILTER (WHERE submitted_at IS NULL AND status IN ('submitted', 'graded')) as sans_submitted_at,
  COUNT(*) FILTER (WHERE status = 'submitted' AND graded_at IS NULL) as non_notees
FROM submissions
WHERE user_id IN (
  SELECT user_id FROM enrollments 
  WHERE session_id IN (
    SELECT id FROM sessions 
    WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
    AND status = 'active'
  )
);

-- ÉTAPE 2 : Corriger les soumissions sans submitted_at
UPDATE submissions
SET submitted_at = COALESCE(submitted_at, NOW())
WHERE status IN ('submitted', 'graded')
AND submitted_at IS NULL
AND user_id IN (
  SELECT user_id FROM enrollments 
  WHERE session_id IN (
    SELECT id FROM sessions 
    WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
    AND status = 'active'
  )
)
RETURNING 
  id,
  (SELECT full_name FROM profiles WHERE id = user_id) as nom_apprenant,
  submitted_at,
  status;

-- ÉTAPE 3 : Diagnostic - Vérifier les progressions de modules
SELECT 
  'Progressions modules' as type_donnee,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE session_id IS NOT NULL) as avec_session,
  COUNT(*) FILTER (WHERE session_id IS NULL) as sans_session,
  COUNT(DISTINCT user_id) as nb_apprenants,
  AVG(percent) as moyenne_completion
FROM module_progress
WHERE user_id IN (
  SELECT user_id FROM enrollments 
  WHERE session_id IN (
    SELECT id FROM sessions 
    WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
    AND status = 'active'
  )
);

-- ÉTAPE 4 : Créer des progressions de modules si elles n'existent pas
-- Pour chaque apprenant et chaque module du cours de sa session
INSERT INTO module_progress (user_id, module_id, session_id, percent, started_at)
SELECT DISTINCT
  e.user_id,
  m.id as module_id,
  e.session_id,
  0 as percent,
  NOW() as started_at
FROM enrollments e
JOIN sessions s ON s.id = e.session_id
JOIN modules m ON m.course_id = s.course_id
LEFT JOIN module_progress mp ON mp.user_id = e.user_id 
  AND mp.module_id = m.id 
  AND (mp.session_id = e.session_id OR mp.session_id IS NULL)
WHERE e.status = 'active'
AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
AND s.status = 'active'
AND mp.id IS NULL
ON CONFLICT (user_id, module_id, session_id) DO NOTHING
RETURNING 
  (SELECT full_name FROM profiles WHERE id = user_id) as nom_apprenant,
  (SELECT title FROM modules WHERE id = module_id) as module_title,
  (SELECT title FROM sessions WHERE id = session_id) as session_title,
  percent;

-- ÉTAPE 5 : Mettre à jour les progressions basées sur les soumissions
-- Calculer le pourcentage de complétion basé sur les items complétés
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
module_completion AS (
  SELECT 
    e.user_id,
    e.session_id,
    m.id as module_id,
    COALESCE(mi.total_items, 0) as total_items,
    COUNT(DISTINCT sub.item_id) FILTER (WHERE sub.status IN ('submitted', 'graded')) as items_completes
  FROM enrollments e
  JOIN sessions s ON s.id = e.session_id
  JOIN modules m ON m.course_id = s.course_id
  LEFT JOIN module_items mi ON mi.module_id = m.id
  LEFT JOIN items i ON i.module_id = m.id
  LEFT JOIN submissions sub ON sub.user_id = e.user_id 
    AND sub.item_id = i.id
    AND (
      sub.session_id = e.session_id 
      OR (sub.session_id IS NULL AND e.session_id IS NOT NULL)
    )
  WHERE e.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  AND s.status = 'active'
  GROUP BY e.user_id, e.session_id, m.id, mi.total_items
)
UPDATE module_progress mp
SET 
  percent = CASE 
    WHEN mc.total_items > 0 THEN LEAST(100, ROUND((mc.items_completes::numeric / NULLIF(mc.total_items, 0)) * 100))
    ELSE 0
  END,
  updated_at = NOW()
FROM module_completion mc
WHERE mp.user_id = mc.user_id
AND mp.module_id = mc.module_id
AND (
  (mp.session_id = mc.session_id)
  OR (mp.session_id IS NULL AND mc.session_id IS NOT NULL)
)
RETURNING 
  (SELECT full_name FROM profiles WHERE id = mp.user_id) as nom_apprenant,
  (SELECT title FROM modules WHERE id = mp.module_id) as module_title,
  (SELECT title FROM sessions WHERE id = mp.session_id) as session_title,
  mp.percent as nouveau_pourcentage,
  mc.total_items,
  mc.items_completes;

-- ÉTAPE 6 : Diagnostic - Vérifier les événements d'activité
SELECT 
  'Événements activité' as type_donnee,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE session_id IS NOT NULL) as avec_session,
  COUNT(*) FILTER (WHERE session_id IS NULL) as sans_session,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as derniers_7_jours
FROM activity_events
WHERE user_id IN (
  SELECT user_id FROM enrollments 
  WHERE session_id IN (
    SELECT id FROM sessions 
    WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
    AND status = 'active'
  )
);

-- ÉTAPE 7 : Créer des événements d'activité basés sur les soumissions récentes
INSERT INTO activity_events (user_id, session_id, course_id, item_id, event_type, created_at)
SELECT DISTINCT
  sub.user_id,
  e.session_id,
  s.course_id,
  sub.item_id,
  'submit' as event_type,
  COALESCE(sub.submitted_at, NOW()) as created_at
FROM submissions sub
JOIN items i ON i.id = sub.item_id
JOIN modules m ON m.id = i.module_id
LEFT JOIN enrollments e ON e.user_id = sub.user_id 
  AND e.course_id = m.course_id
  AND e.status = 'active'
LEFT JOIN sessions s ON s.id = e.session_id
LEFT JOIN activity_events ae ON ae.user_id = sub.user_id
  AND ae.item_id = sub.item_id
  AND ae.event_type = 'submit'
WHERE sub.status IN ('submitted', 'graded')
AND sub.user_id IN (
  SELECT user_id FROM enrollments 
  WHERE session_id IN (
    SELECT id FROM sessions 
    WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
    AND status = 'active'
  )
)
AND ae.id IS NULL
ON CONFLICT DO NOTHING
RETURNING 
  (SELECT full_name FROM profiles WHERE id = user_id) as nom_apprenant,
  (SELECT title FROM items WHERE id = item_id) as item_title,
  created_at;

-- ÉTAPE 8 : Lier les événements d'activité aux sessions
UPDATE activity_events ae
SET session_id = (
  SELECT e.session_id
  FROM enrollments e
  JOIN sessions s ON s.id = e.session_id
  WHERE e.user_id = ae.user_id
  AND s.course_id = ae.course_id
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  LIMIT 1
)
WHERE ae.session_id IS NULL
AND ae.course_id IS NOT NULL
AND EXISTS (
  SELECT 1 FROM enrollments e
  JOIN sessions s ON s.id = e.session_id
  WHERE e.user_id = ae.user_id
  AND s.course_id = ae.course_id
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
)
RETURNING 
  (SELECT full_name FROM profiles WHERE id = user_id) as nom_apprenant,
  (SELECT title FROM courses WHERE id = course_id) as cours,
  (SELECT title FROM sessions WHERE id = session_id) as session_title;

-- ÉTAPE 9 : Vérification finale - Résumé des données par session
SELECT 
  s.title as session_title,
  c.title as cours,
  COUNT(DISTINCT e.user_id) as nb_apprenants,
  COUNT(DISTINCT sub.id) as nb_soumissions,
  COUNT(DISTINCT sub.id) FILTER (WHERE sub.submitted_at IS NOT NULL) as soumissions_avec_date,
  COUNT(DISTINCT mp.id) as nb_progressions,
  AVG(mp.percent) as moyenne_completion,
  COUNT(DISTINCT ae.id) as nb_activites,
  COUNT(DISTINCT ae.id) FILTER (WHERE ae.created_at > NOW() - INTERVAL '7 days') as activites_7j
FROM sessions s
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
LEFT JOIN submissions sub ON sub.user_id = e.user_id 
  AND (sub.session_id = s.id OR sub.item_id IN (
    SELECT id FROM items WHERE module_id IN (
      SELECT id FROM modules WHERE course_id = s.course_id
    )
  ))
LEFT JOIN module_progress mp ON mp.user_id = e.user_id 
  AND (mp.session_id = s.id OR mp.module_id IN (
    SELECT id FROM modules WHERE course_id = s.course_id
  ))
LEFT JOIN activity_events ae ON ae.user_id = e.user_id 
  AND (ae.session_id = s.id OR ae.course_id = s.course_id)
WHERE s.status = 'active'
AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
GROUP BY s.id, s.title, c.title
ORDER BY s.created_at DESC;

