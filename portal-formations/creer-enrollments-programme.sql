-- ============================================================================
-- Script pour créer les enrollments manquants depuis les programmes
-- et les lier automatiquement aux sessions
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1 : Créer les enrollments manquants pour le programme "Les API"
INSERT INTO enrollments (user_id, course_id, status, source, enrolled_at, session_id)
SELECT DISTINCT
  pe.user_id,
  pc.course_id,
  'active' as status,
  'manual' as source,
  pe.enrolled_at,
  -- Trouver automatiquement la session pour ce cours et cette organisation
  (
    SELECT s.id 
    FROM sessions s
    JOIN org_members om ON om.org_id = s.org_id
    WHERE s.course_id = pc.course_id
    AND om.user_id = pe.user_id
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  ) as session_id
FROM program_enrollments pe
JOIN program_courses pc ON pc.program_id = pe.program_id
LEFT JOIN enrollments e ON e.user_id = pe.user_id AND e.course_id = pc.course_id
WHERE pe.status = 'active'
AND e.id IS NULL
ON CONFLICT (user_id, course_id) DO NOTHING
RETURNING 
  id,
  user_id,
  (SELECT full_name FROM profiles WHERE id = user_id) as nom_apprenant,
  course_id,
  (SELECT title FROM courses WHERE id = course_id) as cours,
  session_id,
  (SELECT title FROM sessions WHERE id = session_id) as session_title,
  CASE 
    WHEN session_id IS NULL THEN '⚠️ Pas de session trouvée'
    ELSE '✅ Créé avec session'
  END as etat;

-- ÉTAPE 2 : Lier les enrollments existants sans session_id aux sessions
UPDATE enrollments e
SET session_id = (
  SELECT s.id 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1
)
WHERE e.status = 'active'
AND e.session_id IS NULL
AND EXISTS (
  SELECT 1 FROM org_members om WHERE om.user_id = e.user_id
)
AND EXISTS (
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
)
RETURNING 
  id,
  (SELECT full_name FROM profiles WHERE id = e.user_id) as nom_apprenant,
  (SELECT title FROM courses WHERE id = e.course_id) as cours,
  (SELECT title FROM sessions WHERE id = e.session_id) as session_title;

-- ÉTAPE 3 : Vérification finale - Voir tous les enrollments créés
SELECT 
  p.full_name as nom_apprenant,
  pr.title as programme,
  c.title as cours,
  e.status as statut_enrollment,
  s.title as session_title,
  CASE 
    WHEN e.id IS NULL THEN '❌ Enrollment manquant'
    WHEN e.session_id IS NULL THEN '⚠️ Pas de session'
    ELSE '✅ OK'
  END as etat
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.user_id
JOIN programs pr ON pr.id = pe.program_id
JOIN program_courses pc ON pc.program_id = pe.program_id
JOIN courses c ON c.id = pc.course_id
LEFT JOIN enrollments e ON e.user_id = pe.user_id AND e.course_id = pc.course_id
LEFT JOIN sessions s ON s.id = e.session_id
WHERE pe.status = 'active'
ORDER BY pr.title, p.full_name, c.title;

-- ÉTAPE 4 : Résumé par session
SELECT 
  s.id as session_id,
  s.title as session_title,
  c.title as cours,
  COUNT(DISTINCT e.user_id) as nb_apprenants,
  STRING_AGG(DISTINCT p.full_name, ', ' ORDER BY p.full_name) as liste_apprenants
FROM sessions s
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
LEFT JOIN profiles p ON p.id = e.user_id
WHERE s.status = 'active'
GROUP BY s.id, s.title, c.title
ORDER BY s.created_at DESC;



