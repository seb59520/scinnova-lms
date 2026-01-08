-- ============================================================================
-- Script pour vérifier et compléter les données pour les analytics
-- Organisation ID: 6f772ff6-1d15-4f29-9d0f-be03b2cc974d
-- ============================================================================

-- ÉTAPE 1 : Vérifier les progressions avec started_at
SELECT 
  'Progressions avec started_at' as type,
  COUNT(*) FILTER (WHERE started_at IS NOT NULL) as avec_started_at,
  COUNT(*) FILTER (WHERE started_at IS NULL) as sans_started_at,
  COUNT(*) as total
FROM module_progress
WHERE session_id IN (
  SELECT id FROM sessions 
  WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  AND status = 'active'
);

-- ÉTAPE 2 : Remplir started_at si manquant
UPDATE module_progress
SET started_at = COALESCE(started_at, created_at, NOW())
WHERE started_at IS NULL
AND session_id IN (
  SELECT id FROM sessions 
  WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  AND status = 'active'
)
RETURNING 
  id,
  (SELECT full_name FROM profiles WHERE id = user_id) as nom_apprenant,
  (SELECT title FROM modules WHERE id = module_id) as module_title,
  started_at;

-- ÉTAPE 3 : Vérifier les soumissions notées par module
SELECT 
  m.title as module_title,
  COUNT(DISTINCT sub.id) FILTER (WHERE sub.grade IS NOT NULL) as soumissions_notees,
  COUNT(DISTINCT sub.id) as total_soumissions,
  AVG(sub.grade) FILTER (WHERE sub.grade IS NOT NULL) as score_moyen
FROM modules m
LEFT JOIN items i ON i.module_id = m.id
LEFT JOIN submissions sub ON sub.item_id = i.id
WHERE m.course_id IN (
  SELECT course_id FROM sessions 
  WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  AND status = 'active'
)
GROUP BY m.id, m.title
ORDER BY m.title;

-- ÉTAPE 4 : Vérifier les scores de jeux par module
SELECT 
  m.title as module_title,
  COUNT(DISTINCT gs.id) as nb_scores_jeux,
  AVG(gs.score / 20.0) as score_moyen_normalise
FROM modules m
LEFT JOIN items i ON i.module_id = m.id
LEFT JOIN game_scores gs ON gs.item_id = i.id
WHERE m.course_id IN (
  SELECT course_id FROM sessions 
  WHERE org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
  AND status = 'active'
)
GROUP BY m.id, m.title
ORDER BY m.title;

-- ÉTAPE 5 : Résumé par session et module
SELECT 
  s.title as session_title,
  m.title as module_title,
  COUNT(DISTINCT mp.user_id) as nb_apprenants_avec_progression,
  COUNT(DISTINCT mp.user_id) FILTER (WHERE mp.percent > 0) as nb_apprenants_commences,
  COUNT(DISTINCT mp.user_id) FILTER (WHERE mp.percent >= 100) as nb_apprenants_completes,
  ROUND(AVG(mp.percent)::numeric, 2) as moyenne_completion,
  COUNT(DISTINCT sub.id) FILTER (WHERE sub.grade IS NOT NULL) as nb_soumissions_notees,
  ROUND(AVG(sub.grade) FILTER (WHERE sub.grade IS NOT NULL)::numeric, 2) as score_moyen_submissions,
  COUNT(DISTINCT gs.id) as nb_scores_jeux,
  ROUND(AVG(gs.score / 20.0) FILTER (WHERE gs.id IS NOT NULL)::numeric, 2) as score_moyen_jeux
FROM sessions s
JOIN courses c ON c.id = s.course_id
JOIN modules m ON m.course_id = s.course_id
LEFT JOIN module_progress mp ON mp.module_id = m.id 
  AND (mp.session_id = s.id OR mp.session_id IS NULL)
LEFT JOIN items i ON i.module_id = m.id
LEFT JOIN submissions sub ON sub.item_id = i.id 
  AND (sub.session_id = s.id OR sub.session_id IS NULL)
LEFT JOIN game_scores gs ON gs.item_id = i.id 
  AND gs.course_id = s.course_id
WHERE s.org_id = '6f772ff6-1d15-4f29-9d0f-be03b2cc974d'::uuid
AND s.status = 'active'
GROUP BY s.id, s.title, m.id, m.title
ORDER BY s.created_at DESC, m.title;



