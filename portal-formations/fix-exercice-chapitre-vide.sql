-- Script pour diagnostiquer et corriger le problème de chapitre vide

-- 1. Trouver l'exercice et ses chapitres
SELECT 
    i.id as item_id,
    i.title as item_title,
    i.type as item_type,
    c.id as chapter_id,
    c.title as chapter_title,
    c.content as chapter_content,
    CASE 
        WHEN c.content IS NULL THEN 'NULL'
        WHEN c.content::text = 'null' THEN 'null string'
        WHEN c.content::text = '{}' THEN 'empty object'
        WHEN jsonb_typeof(c.content) = 'object' AND c.content::text = '{}' THEN 'empty jsonb'
        ELSE 'has content'
    END as content_status
FROM items i
LEFT JOIN chapters c ON c.item_id = i.id
WHERE i.title ILIKE '%bibliothèque%' 
   OR i.title ILIKE '%REST%'
ORDER BY i.title, c.position;

-- 2. Vérifier le contenu de l'exercice
SELECT 
    id,
    title,
    type,
    content->'question' as question_exists,
    content->'correction' as correction_exists,
    jsonb_typeof(content->'question') as question_type,
    CASE 
        WHEN content->'question' IS NULL THEN 'question is NULL'
        WHEN content->'question'::text = 'null' THEN 'question is null string'
        ELSE 'question exists'
    END as question_status
FROM items
WHERE title ILIKE '%bibliothèque%' 
   OR title ILIKE '%REST%';

-- 3. Supprimer les chapitres vides pour cet exercice (à exécuter seulement si nécessaire)
-- REMPLACEZ 'ITEM_ID' par l'ID réel de l'exercice
/*
DELETE FROM chapters 
WHERE item_id = 'ITEM_ID' 
  AND (content IS NULL OR content::text = 'null' OR content::text = '{}');
*/

-- 4. Alternative : Ajouter le contenu de l'exercice au chapitre (si vous voulez garder le chapitre)
-- REMPLACEZ 'ITEM_ID' et 'CHAPTER_ID' par les IDs réels
/*
UPDATE chapters 
SET content = (
    SELECT content->'question' 
    FROM items 
    WHERE id = 'ITEM_ID'
)
WHERE id = 'CHAPTER_ID';
*/


