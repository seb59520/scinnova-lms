-- ============================================================================
-- Script pour vérifier les apprenants d'une session
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1 : Lister toutes les sessions disponibles
-- Utilisez cette requête pour trouver l'ID de la session qui vous intéresse
SELECT 
  s.id as session_id,
  s.title as session_title,
  s.status,
  o.name as organisation,
  c.title as cours,
  COUNT(DISTINCT e.user_id) as nb_apprenants_inscrits
FROM sessions s
JOIN orgs o ON o.id = s.org_id
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
WHERE s.status = 'active'
GROUP BY s.id, s.title, s.status, o.name, c.title
ORDER BY s.created_at DESC;

-- ÉTAPE 2 : Voir les apprenants d'une session spécifique
-- Remplacez 'SESSION_ID_ICI' par l'ID de la session de l'étape 1
-- Ou utilisez la version ci-dessous qui utilise la première session active

-- Version automatique (première session active)
SELECT 
  p.id as user_id,
  p.full_name as nom_apprenant,
  e.id as enrollment_id,
  e.status as enrollment_status,
  e.session_id,
  s.title as session_title,
  COUNT(DISTINCT sub.id) as nb_soumissions,
  COUNT(DISTINCT sub.id) FILTER (WHERE sub.status = 'submitted') as nb_soumissions_soumises,
  COUNT(DISTINCT sub.id) FILTER (WHERE sub.status = 'graded') as nb_soumissions_notees
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN sessions s ON s.id = e.session_id
LEFT JOIN submissions sub ON sub.user_id = e.user_id AND sub.session_id = e.session_id
WHERE e.session_id = (
  SELECT id FROM sessions WHERE status = 'active' ORDER BY created_at DESC LIMIT 1
)
AND e.status = 'active'
GROUP BY p.id, p.full_name, e.id, e.status, e.session_id, s.title
ORDER BY p.full_name;

-- ÉTAPE 3 : Voir les soumissions d'un apprenant spécifique
-- Remplacez 'USER_ID_ICI' par l'ID de l'apprenant de l'étape 2
-- Ou utilisez la version ci-dessous qui liste tous les apprenants avec leurs soumissions

-- Version qui liste tous les apprenants avec leurs soumissions
SELECT 
  p.id as user_id,
  p.full_name as nom_apprenant,
  i.title as item_title,
  i.type as item_type,
  sub.status as statut_soumission,
  sub.grade as note,
  sub.submitted_at as date_soumission,
  sub.file_path as fichier_joint
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN sessions s ON s.id = e.session_id
LEFT JOIN submissions sub ON sub.user_id = e.user_id AND sub.session_id = e.session_id
LEFT JOIN items i ON i.id = sub.item_id
WHERE e.session_id = (
  SELECT id FROM sessions WHERE status = 'active' ORDER BY created_at DESC LIMIT 1
)
AND e.status = 'active'
ORDER BY p.full_name, sub.submitted_at DESC;

-- ÉTAPE 4 : Diagnostic complet pour une session
-- Remplacez 'SESSION_ID_ICI' par l'ID de la session
SELECT 
  'Session' as type_info,
  s.id::text as id,
  s.title as nom,
  s.status as statut,
  o.name as organisation,
  c.title as cours
FROM sessions s
JOIN orgs o ON o.id = s.org_id
JOIN courses c ON c.id = s.course_id
WHERE s.id = (
  SELECT id FROM sessions WHERE status = 'active' ORDER BY created_at DESC LIMIT 1
)

UNION ALL

SELECT 
  'Apprenants inscrits' as type_info,
  COUNT(DISTINCT e.user_id)::text as id,
  NULL as nom,
  NULL as statut,
  NULL as organisation,
  NULL as cours
FROM enrollments e
WHERE e.session_id = (
  SELECT id FROM sessions WHERE status = 'active' ORDER BY created_at DESC LIMIT 1
)
AND e.status = 'active'

UNION ALL

SELECT 
  'Soumissions totales' as type_info,
  COUNT(DISTINCT sub.id)::text as id,
  NULL as nom,
  NULL as statut,
  NULL as organisation,
  NULL as cours
FROM submissions sub
WHERE sub.session_id = (
  SELECT id FROM sessions WHERE status = 'active' ORDER BY created_at DESC LIMIT 1
);

