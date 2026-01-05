-- ============================================================================
-- Script pour lier les apprenants à une session
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1 : Vérifier les enrollments sans session_id
-- Cette requête montre tous les enrollments actifs qui ne sont pas liés à une session
SELECT 
  e.id as enrollment_id,
  p.full_name as nom_apprenant,
  c.title as cours,
  e.status as statut_enrollment,
  e.session_id,
  CASE 
    WHEN e.session_id IS NULL THEN '⚠️ Pas de session'
    ELSE '✅ Déjà lié'
  END as etat
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN courses c ON c.id = e.course_id
WHERE e.status = 'active'
AND (
  e.session_id IS NULL 
  OR e.session_id NOT IN (SELECT id FROM sessions WHERE status = 'active')
)
ORDER BY c.title, p.full_name;

-- ÉTAPE 2 : Vérifier les sessions disponibles
-- Cette requête montre toutes les sessions actives avec leur organisation et cours
SELECT 
  s.id as session_id,
  s.title as session_title,
  s.status,
  o.name as organisation,
  c.title as cours,
  COUNT(DISTINCT e.user_id) as nb_apprenants_actuels
FROM sessions s
JOIN orgs o ON o.id = s.org_id
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
WHERE s.status = 'active'
GROUP BY s.id, s.title, s.status, o.name, c.title
ORDER BY s.created_at DESC;

-- ÉTAPE 3 : Lier automatiquement les enrollments aux sessions
-- Cette requête met à jour tous les enrollments actifs pour les lier à leur session correspondante
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
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
)
RETURNING 
  e.id as enrollment_id,
  e.user_id,
  (SELECT full_name FROM profiles WHERE id = e.user_id) as nom_apprenant,
  e.course_id,
  (SELECT title FROM courses WHERE id = e.course_id) as cours,
  e.session_id,
  (SELECT title FROM sessions WHERE id = e.session_id) as session_title;

-- ÉTAPE 4 : Vérifier le résultat
-- Cette requête montre tous les apprenants maintenant liés à des sessions
SELECT 
  s.id as session_id,
  s.title as session_title,
  o.name as organisation,
  c.title as cours,
  COUNT(DISTINCT e.user_id) as nb_apprenants,
  STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as liste_apprenants
FROM sessions s
JOIN orgs o ON o.id = s.org_id
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
LEFT JOIN profiles p ON p.id = e.user_id
WHERE s.status = 'active'
GROUP BY s.id, s.title, o.name, c.title
ORDER BY s.created_at DESC;

-- ÉTAPE 5 : Vérifier que les apprenants sont membres de l'organisation
-- Cette requête montre les apprenants qui ont un enrollment mais ne sont pas membres de l'org
SELECT 
  e.id as enrollment_id,
  p.full_name as nom_apprenant,
  c.title as cours,
  s.title as session_title,
  o.name as organisation,
  CASE 
    WHEN om.id IS NULL THEN '❌ Pas membre de l''organisation'
    ELSE '✅ Membre de l''organisation'
  END as statut_membre
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN courses c ON c.id = e.course_id
JOIN sessions s ON s.id = e.session_id
JOIN orgs o ON o.id = s.org_id
LEFT JOIN org_members om ON om.user_id = e.user_id AND om.org_id = o.id
WHERE e.status = 'active'
AND s.status = 'active'
ORDER BY o.name, p.full_name;

-- ÉTAPE 6 : Ajouter les apprenants manquants à l'organisation
-- ⚠️ ATTENTION : Cette requête ajoute automatiquement les apprenants à l'organisation
-- Décommentez seulement si vous voulez l'exécuter
/*
INSERT INTO org_members (org_id, user_id, role, display_name)
SELECT DISTINCT
  s.org_id,
  e.user_id,
  'student' as role,
  p.full_name as display_name
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN sessions s ON s.id = e.session_id
LEFT JOIN org_members om ON om.user_id = e.user_id AND om.org_id = s.org_id
WHERE e.status = 'active'
AND s.status = 'active'
AND om.id IS NULL
ON CONFLICT (org_id, user_id) DO NOTHING
RETURNING 
  org_id,
  user_id,
  (SELECT full_name FROM profiles WHERE id = user_id) as nom_apprenant,
  (SELECT name FROM orgs WHERE id = org_id) as organisation,
  role;
*/


