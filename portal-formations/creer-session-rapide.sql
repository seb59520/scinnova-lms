-- ============================================================================
-- Script pour créer rapidement une session
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1 : Vérifier votre organisation et votre cours
-- Exécutez cette requête pour voir vos organisations et cours disponibles

SELECT 
  'Organisations' as type,
  o.id::text as id,
  o.name as nom,
  o.slug as slug,
  NULL::text as course_id
FROM orgs o
WHERE o.id IN (
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
)
UNION ALL
SELECT 
  'Cours' as type,
  c.id::text as id,
  c.title as nom,
  NULL::text as slug,
  c.id::text as course_id
FROM courses c
WHERE c.title ILIKE '%M1 FULL-STACK%'
   OR c.title ILIKE '%2025%'
ORDER BY type, nom;

-- ÉTAPE 2 : Créer une session
-- Remplacez 'ORG_ID' et 'COURSE_ID' par les valeurs de l'étape 1
-- Ou utilisez la version automatique ci-dessous

-- Version automatique (trouve automatiquement l'org et le cours)
INSERT INTO sessions (org_id, course_id, title, status, created_by)
SELECT 
  o.id as org_id,
  c.id as course_id,
  'Session ' || c.title || ' - ' || TO_CHAR(NOW(), 'DD/MM/YYYY') as title,
  'active' as status,
  auth.uid() as created_by
FROM orgs o
CROSS JOIN courses c
WHERE o.id IN (
  SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1
)
AND (c.title ILIKE '%M1 FULL-STACK%' OR c.title ILIKE '%2025%')
LIMIT 1
RETURNING 
  id,
  title,
  status,
  org_id,
  course_id,
  created_at;

-- ÉTAPE 3 : Vérifier que la session a été créée
SELECT 
  s.id,
  s.title,
  s.status,
  o.name as organisation,
  c.title as cours,
  s.created_at
FROM sessions s
JOIN orgs o ON o.id = s.org_id
JOIN courses c ON c.id = s.course_id
WHERE s.created_by = auth.uid()
ORDER BY s.created_at DESC
LIMIT 5;


