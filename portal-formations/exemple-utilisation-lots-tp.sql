-- ============================================================================
-- EXEMPLE D'UTILISATION : LOTS DE TP ET ASSOCIATIONS
-- ============================================================================
-- Ce script contient des exemples pratiques pour utiliser les nouvelles
-- fonctionnalités de lots de TP et d'associations directes aux cours.
-- ============================================================================

-- ============================================================================
-- EXEMPLE 1 : Associer un TP directement à un cours
-- ============================================================================

-- Étape 1 : Trouver un cours et un TP
-- (Remplacez les titres par vos propres valeurs)

-- Trouver un cours
SELECT id, title FROM courses 
WHERE title LIKE '%Big Data%' OR title LIKE '%Data Science%'
LIMIT 5;

-- Trouver des TP
SELECT id, title, type FROM items 
WHERE type = 'tp' 
ORDER BY created_at DESC
LIMIT 10;

-- Étape 2 : Associer un TP à un cours
-- (Remplacez les UUID par les valeurs réelles)

/*
INSERT INTO course_tps (course_id, item_id, position, is_required, is_visible, metadata)
VALUES (
  'VOTRE-COURSE-UUID',  -- ID du cours
  'VOTRE-TP-UUID',      -- ID du TP
  1,                     -- Position dans le cours
  TRUE,                  -- TP obligatoire
  TRUE,                  -- TP visible
  '{"note": "TP intégré au cours"}'::jsonb  -- Métadonnées optionnelles
);
*/

-- ============================================================================
-- EXEMPLE 2 : Créer un lot de TP avec ordre séquentiel
-- ============================================================================

-- Étape 1 : Créer le lot
-- (Remplacez les valeurs par vos propres données)

/*
WITH new_batch AS (
  INSERT INTO tp_batches (
    title, 
    description, 
    course_id, 
    position, 
    sequential_order, 
    is_published, 
    created_by
  )
  VALUES (
    'Série TP Data Science - Apprentissage progressif',
    'Série de 3 TP pour maîtriser la data science étape par étape',
    'VOTRE-COURSE-UUID',  -- ID du cours (peut être NULL)
    1,                     -- Position dans le cours
    TRUE,                  -- Ordre séquentiel obligatoire
    TRUE,                  -- Lot publié
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)  -- Créateur
  )
  RETURNING id
)
SELECT id FROM new_batch;
*/

-- Étape 2 : Ajouter les TP au lot (avec prérequis)
-- (Remplacez les UUID par les valeurs réelles)

/*
-- TP 1 : Premier TP, pas de prérequis
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
VALUES (
  'VOTRE-BATCH-UUID',     -- ID du lot créé à l'étape 1
  'TP1-UUID',             -- ID du premier TP
  1,                       -- Position 1
  TRUE,                    -- TP obligatoire
  NULL                     -- Pas de prérequis
);

-- TP 2 : Deuxième TP, nécessite TP 1
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
VALUES (
  'VOTRE-BATCH-UUID',     -- ID du lot
  'TP2-UUID',             -- ID du deuxième TP
  2,                       -- Position 2
  TRUE,                    -- TP obligatoire
  'TP1-UUID'              -- Prérequis : TP 1
);

-- TP 3 : Troisième TP, nécessite TP 2
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
VALUES (
  'VOTRE-BATCH-UUID',     -- ID du lot
  'TP3-UUID',             -- ID du troisième TP
  3,                       -- Position 3
  TRUE,                    -- TP obligatoire
  'TP2-UUID'              -- Prérequis : TP 2
);
*/

-- ============================================================================
-- EXEMPLE 3 : Créer un lot automatiquement avec tous les TP d'un cours
-- ============================================================================

-- Créer un lot et y ajouter automatiquement tous les TP d'un cours
-- (Remplacez 'VOTRE-COURSE-UUID' par l'ID réel de votre cours)

/*
WITH new_batch AS (
  INSERT INTO tp_batches (
    title, 
    description, 
    course_id, 
    sequential_order, 
    is_published, 
    created_by
  )
  VALUES (
    'Tous les TP du cours',
    'Lot regroupant automatiquement tous les TP du cours',
    'VOTRE-COURSE-UUID',
    FALSE,  -- Pas d'ordre séquentiel obligatoire
    TRUE,
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
  )
  RETURNING id
)
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required)
SELECT 
  nb.id,
  i.id,
  ROW_NUMBER() OVER (ORDER BY m.position, i.position),
  TRUE
FROM new_batch nb
CROSS JOIN items i
INNER JOIN modules m ON m.id = i.module_id
WHERE i.type = 'tp'
  AND m.course_id = 'VOTRE-COURSE-UUID'
  AND i.published = TRUE;
*/

-- ============================================================================
-- EXEMPLE 4 : Requêtes de consultation
-- ============================================================================

-- Voir tous les TP d'un cours (toutes sources)
/*
SELECT 
  tp_id,
  tp_title,
  source_type,
  module_title,
  tp_batch_title,
  position_in_course,
  is_required,
  is_visible
FROM course_all_tps
WHERE course_id = 'VOTRE-COURSE-UUID'
ORDER BY position_in_course, position_in_module;
*/

-- Voir les détails d'un lot
/*
SELECT * FROM tp_batch_details
WHERE batch_id = 'VOTRE-BATCH-UUID';
*/

-- Voir les TP d'un lot avec leurs prérequis
/*
SELECT 
  tp_title,
  position,
  is_required,
  prerequisite_tp_title
FROM tp_batch_items_details
WHERE tp_batch_id = 'VOTRE-BATCH-UUID'
ORDER BY position;
*/

-- Lister tous les lots d'un cours
/*
SELECT 
  batch_id,
  batch_title,
  batch_description,
  tp_count,
  required_tp_count,
  sequential_order
FROM tp_batch_details
WHERE course_id = 'VOTRE-COURSE-UUID'
ORDER BY batch_position;
*/

-- ============================================================================
-- EXEMPLE 5 : Migration - Associer tous les TP existants d'un cours
-- ============================================================================

-- Associer tous les TP d'un cours (qui sont dans des modules) directement au cours
-- (Remplacez 'VOTRE-COURSE-UUID' par l'ID réel)

/*
INSERT INTO course_tps (course_id, item_id, position, is_required, is_visible)
SELECT DISTINCT
  m.course_id,
  i.id,
  i.position,
  TRUE,
  TRUE
FROM items i
INNER JOIN modules m ON m.id = i.module_id
WHERE i.type = 'tp'
  AND m.course_id = 'VOTRE-COURSE-UUID'
  AND i.published = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM course_tps ct
    WHERE ct.course_id = m.course_id AND ct.item_id = i.id
  )
ORDER BY m.position, i.position;
*/

-- ============================================================================
-- EXEMPLE 6 : Vérifications et dépannage
-- ============================================================================

-- Vérifier quels TP sont associés directement à des cours
/*
SELECT 
  c.title AS course_title,
  i.title AS tp_title,
  ct.position,
  ct.is_required,
  ct.is_visible
FROM course_tps ct
INNER JOIN courses c ON c.id = ct.course_id
INNER JOIN items i ON i.id = ct.item_id
ORDER BY c.title, ct.position;
*/

-- Vérifier quels TP sont dans des lots
/*
SELECT 
  tb.title AS batch_title,
  i.title AS tp_title,
  tbi.position AS position_in_batch,
  tbi.is_required,
  pi.title AS prerequisite_tp
FROM tp_batch_items tbi
INNER JOIN tp_batches tb ON tb.id = tbi.tp_batch_id
INNER JOIN items i ON i.id = tbi.item_id
LEFT JOIN items pi ON pi.id = tbi.prerequisite_item_id
WHERE tb.is_published = TRUE
ORDER BY tb.title, tbi.position;
*/

-- Trouver les TP qui ne sont ni associés directement ni dans un lot
/*
SELECT 
  i.id,
  i.title,
  m.title AS module_title,
  c.title AS course_title
FROM items i
INNER JOIN modules m ON m.id = i.module_id
INNER JOIN courses c ON c.id = m.course_id
WHERE i.type = 'tp'
  AND i.published = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM course_tps ct WHERE ct.item_id = i.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM tp_batch_items tbi WHERE tbi.item_id = i.id
  )
ORDER BY c.title, m.position, i.position;
*/

-- ============================================================================
-- EXEMPLE 7 : Nettoyage (suppression)
-- ============================================================================

-- Supprimer l'association directe d'un TP à un cours
/*
DELETE FROM course_tps
WHERE course_id = 'VOTRE-COURSE-UUID' 
  AND item_id = 'VOTRE-TP-UUID';
*/

-- Retirer un TP d'un lot (sans supprimer le lot)
/*
DELETE FROM tp_batch_items
WHERE tp_batch_id = 'VOTRE-BATCH-UUID' 
  AND item_id = 'VOTRE-TP-UUID';
*/

-- Supprimer un lot entier (supprime aussi les liaisons)
/*
DELETE FROM tp_batches
WHERE id = 'VOTRE-BATCH-UUID';
-- Note: Les tp_batch_items seront supprimés automatiquement (CASCADE)
*/

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

/*
1. Remplacez tous les 'VOTRE-XXX-UUID' par les valeurs réelles de votre base
2. Testez d'abord avec des requêtes SELECT avant d'exécuter les INSERT/DELETE
3. Faites des sauvegardes avant de modifier des données importantes
4. Utilisez les vues (course_all_tps, tp_batch_details, etc.) pour les requêtes
5. Les contraintes garantissent l'intégrité des données :
   - Un TP ne peut être associé qu'une fois à un cours via course_tps
   - Un TP ne peut apparaître qu'une fois dans un lot
   - Les prérequis doivent être dans le même lot
*/
