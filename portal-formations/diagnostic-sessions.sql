-- ============================================================================
-- Script de diagnostic : Pourquoi "0 sessions" s'affiche
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- 1. Vérifier toutes les sessions existantes
SELECT 
  s.id,
  s.title,
  s.status,
  s.org_id,
  o.name as org_name,
  s.course_id,
  c.title as course_title,
  s.created_at
FROM sessions s
LEFT JOIN orgs o ON o.id = s.org_id
LEFT JOIN courses c ON c.id = s.course_id
ORDER BY s.created_at DESC;

-- 2. Vérifier les organisations et leurs membres
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.slug as org_slug,
  COUNT(DISTINCT om.user_id) as nb_membres,
  COUNT(DISTINCT om.user_id) FILTER (WHERE om.role = 'trainer') as nb_trainers,
  COUNT(DISTINCT om.user_id) FILTER (WHERE om.role = 'admin') as nb_admins
FROM orgs o
LEFT JOIN org_members om ON om.org_id = o.id
GROUP BY o.id, o.name, o.slug
ORDER BY o.created_at DESC;

-- 3. Vérifier les sessions par organisation
SELECT 
  o.name as org_name,
  COUNT(s.id) as nb_sessions,
  COUNT(s.id) FILTER (WHERE s.status = 'active') as nb_sessions_actives,
  STRING_AGG(s.title, ', ') as titres_sessions
FROM orgs o
LEFT JOIN sessions s ON s.org_id = o.id
GROUP BY o.id, o.name
ORDER BY nb_sessions DESC;

-- 4. Vérifier les sessions pour le cours "M1 FULL-STACK 2025/2026"
SELECT 
  s.id,
  s.title,
  s.status,
  s.org_id,
  o.name as org_name,
  s.course_id,
  c.title as course_title
FROM sessions s
JOIN courses c ON c.id = s.course_id
LEFT JOIN orgs o ON o.id = s.org_id
WHERE c.title ILIKE '%M1 FULL-STACK%'
   OR c.title ILIKE '%2025%'
ORDER BY s.created_at DESC;

-- 5. Vérifier les membres de l'organisation pour l'utilisateur connecté
-- (Remplacer 'VOTRE_USER_ID' par votre ID utilisateur)
SELECT 
  om.*,
  o.name as org_name,
  p.full_name as user_name,
  p.role as user_role_in_profiles
FROM org_members om
JOIN orgs o ON o.id = om.org_id
JOIN profiles p ON p.id = om.user_id
WHERE om.user_id = auth.uid()  -- Utilisateur actuellement connecté
ORDER BY o.created_at DESC;

-- 6. Vérifier si l'utilisateur est admin (peut voir toutes les sessions)
SELECT 
  id,
  full_name,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Peut voir toutes les sessions'
    ELSE '❌ Ne peut voir que les sessions de ses organisations'
  END as permissions
FROM profiles
WHERE id = auth.uid();

-- 7. Créer une session de test si aucune n'existe
-- (Décommenter et adapter si nécessaire)
/*
INSERT INTO sessions (org_id, course_id, title, status, created_by)
SELECT 
  o.id,
  c.id,
  'Session de test - ' || c.title,
  'active',
  auth.uid()
FROM orgs o
CROSS JOIN courses c
WHERE o.id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  AND c.title ILIKE '%M1 FULL-STACK%'
LIMIT 1
RETURNING *;
*/



