-- ============================================================================
-- Script pour lier les soumissions et activités existantes aux sessions
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1 : Vérifier les soumissions sans session_id
SELECT 
  COUNT(*) as total_soumissions,
  COUNT(*) FILTER (WHERE session_id IS NULL) as sans_session,
  COUNT(*) FILTER (WHERE session_id IS NOT NULL) as avec_session
FROM submissions
WHERE status IN ('submitted', 'graded');

-- ÉTAPE 2 : Lier les soumissions aux sessions
UPDATE submissions sub
SET session_id = (
  SELECT s.id 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  JOIN items i ON i.id = sub.item_id
  JOIN modules m ON m.id = i.module_id
  WHERE s.course_id = m.course_id
  AND om.user_id = sub.user_id
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  ORDER BY s.created_at DESC
  LIMIT 1
)
WHERE sub.session_id IS NULL
AND sub.status IN ('submitted', 'graded')
AND EXISTS (
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  JOIN items i ON i.id = sub.item_id
  JOIN modules m ON m.id = i.module_id
  WHERE s.course_id = m.course_id
  AND om.user_id = sub.user_id
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
)
RETURNING 
  id,
  (SELECT full_name FROM profiles WHERE id = sub.user_id) as nom_apprenant,
  (SELECT title FROM items WHERE id = sub.item_id) as item_title,
  (SELECT title FROM sessions WHERE id = sub.session_id) as session_title;

-- ÉTAPE 3 : Vérifier les événements d'activité
SELECT 
  COUNT(*) as total_activites,
  COUNT(*) FILTER (WHERE session_id IS NULL) as sans_session,
  COUNT(*) FILTER (WHERE session_id IS NOT NULL) as avec_session
FROM activity_events;

-- ÉTAPE 4 : Lier les événements d'activité aux sessions
UPDATE activity_events ae
SET session_id = (
  SELECT s.id 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = ae.course_id
  AND om.user_id = ae.user_id
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  ORDER BY s.created_at DESC
  LIMIT 1
)
WHERE ae.session_id IS NULL
AND EXISTS (
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = ae.course_id
  AND om.user_id = ae.user_id
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
)
RETURNING 
  id,
  (SELECT full_name FROM profiles WHERE id = ae.user_id) as nom_apprenant,
  (SELECT title FROM courses WHERE id = ae.course_id) as cours,
  (SELECT title FROM sessions WHERE id = ae.session_id) as session_title;

-- ÉTAPE 5 : Vérifier les progressions de modules
SELECT 
  COUNT(*) as total_progressions,
  COUNT(*) FILTER (WHERE session_id IS NULL) as sans_session,
  COUNT(*) FILTER (WHERE session_id IS NOT NULL) as avec_session
FROM module_progress;

-- ÉTAPE 6 : Lier les progressions de modules aux sessions
UPDATE module_progress mp
SET session_id = (
  SELECT s.id 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  JOIN modules m ON m.id = mp.module_id
  WHERE s.course_id = m.course_id
  AND om.user_id = mp.user_id
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  ORDER BY s.created_at DESC
  LIMIT 1
)
WHERE mp.session_id IS NULL
AND EXISTS (
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  JOIN modules m ON m.id = mp.module_id
  WHERE s.course_id = m.course_id
  AND om.user_id = mp.user_id
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
)
RETURNING 
  id,
  (SELECT full_name FROM profiles WHERE id = mp.user_id) as nom_apprenant,
  (SELECT title FROM modules WHERE id = mp.module_id) as module_title,
  (SELECT title FROM sessions WHERE id = mp.session_id) as session_title;

-- ÉTAPE 7 : Vérification finale - Voir les données liées par session
SELECT 
  s.title as session_title,
  c.title as cours,
  COUNT(DISTINCT e.user_id) as nb_apprenants,
  COUNT(DISTINCT sub.id) as nb_soumissions,
  COUNT(DISTINCT ae.id) as nb_activites,
  COUNT(DISTINCT mp.id) as nb_progressions
FROM sessions s
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
LEFT JOIN submissions sub ON sub.session_id = s.id
LEFT JOIN activity_events ae ON ae.session_id = s.id
LEFT JOIN module_progress mp ON mp.session_id = s.id
WHERE s.status = 'active'
AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
GROUP BY s.id, s.title, c.title
ORDER BY s.created_at DESC;



