-- ============================================================================
-- Script de diagnostic : Pourquoi les soumissions ne sont pas comptées ?
-- Organisation ID: 6f772ff6-1d15-4f29-9d0f-be03b2cc974d
-- ============================================================================

-- ÉTAPE 1 : Voir toutes les soumissions avec leurs détails
SELECT 
  p.full_name as nom_apprenant,
  i.title as item_title,
  m.title as module_title,
  c.title as cours,
  sub.status as statut_soumission,
  sub.session_id as session_id_soumission,
  e.session_id as session_id_enrollment,
  s.title as session_title,
  CASE 
    WHEN sub.session_id IS NULL THEN '❌ Pas de session_id'
    WHEN sub.session_id != e.session_id THEN '⚠️ Session différente'
    WHEN sub.session_id = e.session_id THEN '✅ OK'
    ELSE '❓ Inconnu'
  END as etat_liaison
FROM submissions sub
JOIN profiles p ON p.id = sub.user_id
JOIN items i ON i.id = sub.item_id
JOIN modules m ON m.id = i.module_id
JOIN courses c ON c.id = m.course_id
LEFT JOIN enrollments e ON e.user_id = sub.user_id AND e.course_id = c.id AND e.status = 'active'
LEFT JOIN sessions s ON s.id = e.session_id
WHERE sub.user_id IN (
  SELECT user_id FROM enrollments 
  WHERE session_id IN (
    SELECT id FROM sessions 
    WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
    AND status = 'active'
  )
)
AND sub.status IN ('submitted', 'graded')
ORDER BY p.full_name, c.title, m.title, i.title
LIMIT 50;

-- ÉTAPE 2 : Vérifier les soumissions par session
SELECT 
  s.title as session_title,
  c.title as cours,
  COUNT(DISTINCT sub.id) as nb_soumissions_total,
  COUNT(DISTINCT sub.id) FILTER (WHERE sub.session_id = s.id) as soumissions_liees_session,
  COUNT(DISTINCT sub.id) FILTER (WHERE sub.session_id IS NULL) as soumissions_sans_session,
  COUNT(DISTINCT sub.id) FILTER (WHERE sub.session_id != s.id) as soumissions_session_differente
FROM sessions s
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
LEFT JOIN submissions sub ON sub.user_id = e.user_id
  AND sub.item_id IN (SELECT id FROM items WHERE module_id IN (SELECT id FROM modules WHERE course_id = s.course_id))
WHERE s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
AND s.status = 'active'
GROUP BY s.id, s.title, c.title
ORDER BY s.created_at DESC;

-- ÉTAPE 3 : Voir les items et modules pour comprendre la structure
SELECT 
  c.title as cours,
  m.title as module_title,
  COUNT(DISTINCT i.id) as nb_items,
  COUNT(DISTINCT i.id) FILTER (WHERE i.type IN ('exercise', 'tp')) as nb_exercices_tp,
  STRING_AGG(DISTINCT i.type, ', ') as types_items
FROM courses c
JOIN modules m ON m.course_id = c.id
LEFT JOIN items i ON i.module_id = m.id
WHERE c.id IN (
  SELECT course_id FROM sessions 
  WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  AND status = 'active'
)
GROUP BY c.id, c.title, m.id, m.title
ORDER BY c.title, m.title;

-- ÉTAPE 4 : Vérifier pourquoi les soumissions ne sont pas comptées dans le calcul
-- Pour un apprenant spécifique (exemple : Baptiste Canva)
SELECT 
  p.full_name as nom_apprenant,
  m.title as module_title,
  COUNT(DISTINCT i.id) as total_items_module,
  COUNT(DISTINCT sub.item_id) FILTER (WHERE sub.status IN ('submitted', 'graded')) as items_completes,
  STRING_AGG(DISTINCT sub.id::text, ', ') as submission_ids,
  STRING_AGG(DISTINCT sub.session_id::text, ', ') as session_ids_soumissions,
  e.session_id as session_id_enrollment
FROM profiles p
JOIN enrollments e ON e.user_id = p.id
JOIN sessions s ON s.id = e.session_id
JOIN modules m ON m.course_id = s.course_id
LEFT JOIN items i ON i.module_id = m.id
LEFT JOIN submissions sub ON sub.user_id = p.id 
  AND sub.item_id = i.id
  AND sub.status IN ('submitted', 'graded')
WHERE p.full_name = 'Baptiste Canva'
AND s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
AND s.status = 'active'
AND m.title = 'Module 5 : Exercices pratiques'
GROUP BY p.id, p.full_name, m.id, m.title, e.session_id;


