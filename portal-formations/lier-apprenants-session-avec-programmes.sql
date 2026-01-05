-- ============================================================================
-- Script pour lier les apprenants à une session (avec support des programmes)
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1 : Diagnostic complet - Voir la situation actuelle
SELECT 
  'Programmes' as type,
  COUNT(DISTINCT pe.id) as total,
  COUNT(DISTINCT pe.id) FILTER (WHERE pe.status = 'active') as actifs
FROM program_enrollments pe

UNION ALL

SELECT 
  'Enrollments directs' as type,
  COUNT(DISTINCT e.id) as total,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as actifs
FROM enrollments e

UNION ALL

SELECT 
  'Enrollments avec session' as type,
  COUNT(DISTINCT e.id) as total,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active' AND e.session_id IS NOT NULL) as actifs
FROM enrollments e;

-- ÉTAPE 2 : Voir les apprenants par programme et leurs enrollments
SELECT 
  pr.title as programme,
  p.full_name as nom_apprenant,
  pe.status as statut_programme,
  c.title as cours,
  e.id as enrollment_id,
  e.status as statut_enrollment,
  e.session_id,
  s.title as session_title,
  CASE 
    WHEN e.id IS NULL THEN '❌ Pas d''enrollment créé'
    WHEN e.session_id IS NULL THEN '⚠️ Enrollment sans session'
    ELSE '✅ Bien lié'
  END as etat
FROM program_enrollments pe
JOIN programs pr ON pr.id = pe.program_id
JOIN profiles p ON p.id = pe.user_id
LEFT JOIN program_courses pc ON pc.program_id = pe.program_id
LEFT JOIN courses c ON c.id = pc.course_id
LEFT JOIN enrollments e ON e.user_id = pe.user_id AND e.course_id = pc.course_id
LEFT JOIN sessions s ON s.id = e.session_id
WHERE pe.status = 'active'
ORDER BY pr.title, p.full_name, c.title;

-- ÉTAPE 3 : Vérifier les organisations des apprenants
SELECT 
  p.full_name as nom_apprenant,
  pr.title as programme,
  o.name as organisation,
  om.role as role_org,
  CASE 
    WHEN om.id IS NULL THEN '❌ Pas membre'
    ELSE '✅ Membre'
  END as statut_membre
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.user_id
JOIN programs pr ON pr.id = pe.program_id
LEFT JOIN org_members om ON om.user_id = pe.user_id
LEFT JOIN orgs o ON o.id = om.org_id
WHERE pe.status = 'active'
ORDER BY pr.title, p.full_name;

-- ÉTAPE 4 : Lier les enrollments aux sessions (en tenant compte des programmes)
-- Cette requête met à jour tous les enrollments créés via les programmes
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
  -- Vérifier que l'utilisateur est membre d'une organisation
  SELECT 1 FROM org_members om WHERE om.user_id = e.user_id
)
AND EXISTS (
  -- Vérifier qu'une session existe pour ce cours et cette organisation
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
)
RETURNING 
  e.id as enrollment_id,
  (SELECT full_name FROM profiles WHERE id = e.user_id) as nom_apprenant,
  (SELECT title FROM courses WHERE id = e.course_id) as cours,
  (SELECT title FROM sessions WHERE id = e.session_id) as session_title,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM program_enrollments pe
      JOIN program_courses pc ON pc.program_id = pe.program_id
      WHERE pe.user_id = e.user_id
      AND pc.course_id = e.course_id
      AND pe.status = 'active'
    ) THEN 'Via programme'
    ELSE 'Direct'
  END as source_enrollment;

-- ÉTAPE 5 : Vérifier les enrollments manquants (créés via programme mais pas encore créés)
-- Si le trigger n'a pas fonctionné, il faut créer les enrollments manuellement
SELECT 
  pe.user_id,
  p.full_name as nom_apprenant,
  pr.title as programme,
  pc.course_id,
  c.title as cours,
  CASE 
    WHEN e.id IS NULL THEN '❌ Enrollment manquant'
    ELSE '✅ Enrollment existe'
  END as etat
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.user_id
JOIN programs pr ON pr.id = pe.program_id
JOIN program_courses pc ON pc.program_id = pe.program_id
JOIN courses c ON c.id = pc.course_id
LEFT JOIN enrollments e ON e.user_id = pe.user_id AND e.course_id = pc.course_id
WHERE pe.status = 'active'
AND e.id IS NULL
ORDER BY pr.title, p.full_name, c.title;

-- ÉTAPE 6 : Créer les enrollments manquants pour les programmes
-- ⚠️ ATTENTION : Décommentez seulement si des enrollments manquent
/*
INSERT INTO enrollments (user_id, course_id, status, source, enrolled_at)
SELECT DISTINCT
  pe.user_id,
  pc.course_id,
  'active' as status,
  'manual' as source,
  pe.enrolled_at
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
  (SELECT title FROM courses WHERE id = course_id) as cours;
*/

-- ÉTAPE 7 : Résumé final - Voir tous les apprenants par session
SELECT 
  s.id as session_id,
  s.title as session_title,
  o.name as organisation,
  c.title as cours,
  COUNT(DISTINCT e.user_id) as nb_apprenants,
  COUNT(DISTINCT e.user_id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM program_enrollments pe
      JOIN program_courses pc ON pc.program_id = pe.program_id
      WHERE pe.user_id = e.user_id
      AND pc.course_id = e.course_id
      AND pe.status = 'active'
    )
  ) as via_programme,
  COUNT(DISTINCT e.user_id) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM program_enrollments pe
      JOIN program_courses pc ON pc.program_id = pe.program_id
      WHERE pe.user_id = e.user_id
      AND pc.course_id = e.course_id
      AND pe.status = 'active'
    )
  ) as directs
FROM sessions s
JOIN orgs o ON o.id = s.org_id
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
WHERE s.status = 'active'
GROUP BY s.id, s.title, o.name, c.title
ORDER BY s.created_at DESC;


