-- ============================================================================
-- Script FINAL V2 : Créer les sessions et lier les enrollments
-- Organisation ID: 6f772ff6-1d15-4f29-9d0f-be03b2cc974d
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 0 : Trouver un formateur/admin de l'organisation pour created_by
-- Exécutez cette requête d'abord pour trouver un ID utilisateur valide
SELECT 
  om.user_id,
  p.full_name,
  om.role,
  'Utilisez cet ID pour created_by' as instruction
FROM org_members om
JOIN profiles p ON p.id = om.user_id
WHERE om.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
AND om.role IN ('trainer', 'admin')
LIMIT 1;

-- ÉTAPE 1 : Créer les sessions pour chaque cours du programme "Les API"
-- ⚠️ Si auth.uid() ne fonctionne pas, remplacez par l'ID d'un formateur/admin (voir ÉTAPE 0)
INSERT INTO sessions (org_id, course_id, title, status, created_by)
SELECT DISTINCT
  '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid as org_id,
  c.id as course_id,
  'Session ' || c.title || ' - ' || TO_CHAR(NOW(), 'DD/MM/YYYY') as title,
  'active' as status,
  COALESCE(
    auth.uid(),
    (SELECT user_id FROM org_members 
     WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid 
     AND role IN ('trainer', 'admin') 
     LIMIT 1),
    '25e68bd5-be89-4c93-ab84-b657a89f1070'::uuid  -- ID de Sébastien (fallback)
  ) as created_by
FROM program_courses pc
JOIN programs pr ON pr.id = pc.program_id
JOIN courses c ON c.id = pc.course_id
LEFT JOIN sessions s ON s.course_id = c.id 
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  AND s.status = 'active'
WHERE pr.title = 'Les API'
AND s.id IS NULL
RETURNING 
  id,
  title,
  course_id,
  (SELECT title FROM courses WHERE id = course_id) as cours,
  org_id,
  (SELECT name FROM orgs WHERE id = org_id) as organisation;

-- ÉTAPE 2 : Lier tous les enrollments aux sessions créées
UPDATE enrollments e
SET session_id = (
  SELECT s.id 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  ORDER BY s.created_at DESC
  LIMIT 1
)
WHERE e.status = 'active'
AND e.session_id IS NULL
AND EXISTS (
  SELECT 1 FROM org_members om 
  WHERE om.user_id = e.user_id 
  AND om.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
)
AND EXISTS (
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
  AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
)
RETURNING 
  id,
  (SELECT full_name FROM profiles WHERE id = e.user_id) as nom_apprenant,
  (SELECT title FROM courses WHERE id = e.course_id) as cours,
  (SELECT title FROM sessions WHERE id = e.session_id) as session_title;

-- ÉTAPE 3 : Vérification finale
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
AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
AND s.course_id IN (
  SELECT pc.course_id 
  FROM program_courses pc
  JOIN programs pr ON pr.id = pc.program_id
  WHERE pr.title = 'Les API'
)
GROUP BY s.id, s.title, c.title
ORDER BY s.created_at DESC;


