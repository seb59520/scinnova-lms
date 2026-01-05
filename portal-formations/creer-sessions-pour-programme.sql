-- ============================================================================
-- Script pour créer les sessions manquantes pour les cours du programme "Les API"
-- et lier les enrollments aux sessions
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1 : Vérifier quelles sessions existent pour les cours du programme "Les API"
SELECT 
  c.id as course_id,
  c.title as cours,
  s.id as session_id,
  s.title as session_title,
  s.status,
  o.name as organisation,
  COUNT(DISTINCT e.user_id) as nb_apprenants_lies
FROM program_courses pc
JOIN programs pr ON pr.id = pc.program_id
JOIN courses c ON c.id = pc.course_id
LEFT JOIN sessions s ON s.course_id = c.id AND s.status = 'active'
LEFT JOIN orgs o ON o.id = s.org_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
WHERE pr.title = 'Les API'
GROUP BY c.id, c.title, s.id, s.title, s.status, o.name
ORDER BY c.title;

-- ÉTAPE 2 : Vérifier les organisations disponibles
SELECT 
  o.id as org_id,
  o.name as organisation,
  COUNT(DISTINCT om.user_id) as nb_membres,
  COUNT(DISTINCT om.user_id) FILTER (WHERE om.role = 'student') as nb_etudiants
FROM orgs o
LEFT JOIN org_members om ON om.org_id = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at DESC;

-- ÉTAPE 3 : Vérifier que les apprenants sont membres d'une organisation
SELECT 
  p.full_name as nom_apprenant,
  o.name as organisation,
  om.role as role_org,
  CASE 
    WHEN om.id IS NULL THEN '❌ Pas membre - À AJOUTER'
    ELSE '✅ Membre'
  END as statut
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.user_id
JOIN programs pr ON pr.id = pe.program_id
LEFT JOIN org_members om ON om.user_id = pe.user_id
LEFT JOIN orgs o ON o.id = om.org_id
WHERE pe.status = 'active'
AND pr.title = 'Les API'
ORDER BY o.name, p.full_name;

-- ÉTAPE 4 : Créer les sessions manquantes pour chaque cours du programme
INSERT INTO sessions (org_id, course_id, title, status, created_by)
SELECT DISTINCT
  '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid as org_id,
  c.id as course_id,
  'Session ' || c.title || ' - ' || TO_CHAR(NOW(), 'DD/MM/YYYY') as title,
  'active' as status,
  auth.uid() as created_by
FROM program_courses pc
JOIN programs pr ON pr.id = pc.program_id
JOIN courses c ON c.id = pc.course_id
LEFT JOIN sessions s ON s.course_id = c.id 
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  AND s.status = 'active'
WHERE pr.title = 'Les API'
AND s.id IS NULL
ON CONFLICT DO NOTHING
RETURNING 
  id,
  title,
  course_id,
  (SELECT title FROM courses WHERE id = course_id) as cours,
  org_id,
  (SELECT name FROM orgs WHERE id = org_id) as organisation;

-- ÉTAPE 5 : Lier tous les enrollments aux sessions (après création des sessions)
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

-- ÉTAPE 6 : Vérification finale - Voir tous les enrollments avec leurs sessions
SELECT 
  p.full_name as nom_apprenant,
  c.title as cours,
  e.status as statut_enrollment,
  s.title as session_title,
  o.name as organisation,
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
LEFT JOIN orgs o ON o.id = s.org_id
WHERE pe.status = 'active'
AND pr.title = 'Les API'
ORDER BY c.title, p.full_name;

-- ÉTAPE 7 : Résumé par session
SELECT 
  s.id as session_id,
  s.title as session_title,
  c.title as cours,
  o.name as organisation,
  COUNT(DISTINCT e.user_id) as nb_apprenants,
  STRING_AGG(DISTINCT p.full_name, ', ' ORDER BY p.full_name) as liste_apprenants
FROM sessions s
JOIN courses c ON c.id = s.course_id
JOIN orgs o ON o.id = s.org_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
LEFT JOIN profiles p ON p.id = e.user_id
WHERE s.status = 'active'
AND s.course_id IN (
  SELECT pc.course_id 
  FROM program_courses pc
  JOIN programs pr ON pr.id = pc.program_id
  WHERE pr.title = 'Les API'
)
GROUP BY s.id, s.title, c.title, o.name
ORDER BY s.created_at DESC;

