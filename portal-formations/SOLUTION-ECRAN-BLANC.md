# 🔧 Solution : Écran blanc pour l'exercice REST Bibliothèque

## 🔍 Diagnostic

Le problème vient probablement d'un **chapitre vide** dans la base de données qui masque le contenu de l'exercice.

### Symptômes observés :
- ✅ Le titre de l'exercice s'affiche
- ✅ Un chapitre "#1" avec le même titre est affiché
- ❌ Le contenu est blanc/vide

### Cause probable :
Un chapitre a été créé automatiquement (ou manuellement) pour cet exercice, mais il est vide. Le système affiche le chapitre au lieu du contenu de l'exercice.

## ✅ Solutions

### Solution 1 : Supprimer le chapitre vide (Recommandé)

Exécutez cette requête SQL après avoir trouvé l'ID de l'exercice :

```sql
-- 1. Trouver l'ID de l'exercice
SELECT id, title, type 
FROM items 
WHERE title ILIKE '%bibliothèque%' 
   OR title ILIKE '%REST%';

-- 2. Voir les chapitres de cet exercice
SELECT c.id, c.title, c.content, c.position
FROM chapters c
JOIN items i ON c.item_id = i.id
WHERE i.title ILIKE '%bibliothèque%' 
   OR i.title ILIKE '%REST%';

-- 3. Supprimer les chapitres vides
DELETE FROM chapters 
WHERE item_id = 'VOTRE_ITEM_ID' 
  AND (content IS NULL OR content::text = 'null' OR content::text = '{}');
```

### Solution 2 : Remplir le chapitre avec le contenu de l'exercice

Si vous voulez garder le chapitre, vous pouvez y copier le contenu de la question :

```sql
-- Remplacer VOTRE_ITEM_ID et VOTRE_CHAPTER_ID
UPDATE chapters 
SET content = (
    SELECT content->'question' 
    FROM items 
    WHERE id = 'VOTRE_ITEM_ID'
)
WHERE id = 'VOTRE_CHAPTER_ID';
```

### Solution 3 : Vérifier via l'interface d'administration

1. Allez dans **Admin** → **Items**
2. Trouvez l'exercice "Identifiez les ressources REST pour un système de gestion de bibliothèque"
3. Cliquez sur l'exercice
4. Allez dans l'onglet **Chapitres**
5. Supprimez les chapitres vides ou ajoutez du contenu

## 🔍 Vérifications

### Vérifier que l'exercice a bien un contenu

```sql
SELECT 
    id,
    title,
    type,
    content->'question' IS NOT NULL as has_question,
    content->'correction' IS NOT NULL as has_correction,
    jsonb_typeof(content->'question') as question_type
FROM items
WHERE title ILIKE '%bibliothèque%';
```

### Vérifier les chapitres

```sql
SELECT 
    c.id,
    c.title,
    c.position,
    CASE 
        WHEN c.content IS NULL THEN 'NULL'
        WHEN c.content::text = 'null' THEN 'null string'
        WHEN c.content::text = '{}' THEN 'empty object'
        ELSE 'has content'
    END as content_status
FROM chapters c
JOIN items i ON c.item_id = i.id
WHERE i.title ILIKE '%bibliothèque%';
```

## 🎯 Solution rapide (via Supabase Dashboard)

1. Ouvrez le **Supabase Dashboard**
2. Allez dans **Table Editor** → **chapters**
3. Filtrez par `item_id` = l'ID de votre exercice
4. Supprimez les chapitres vides (ceux avec `content` = NULL ou vide)
5. Rechargez la page de l'exercice

## 📝 Note importante

Les exercices n'ont **pas besoin de chapitres**. Le contenu de l'exercice (question et correction) est stocké directement dans `items.content.question` et `items.content.correction`.

Les chapitres sont utilisés pour :
- Les ressources (slides, documents)
- Les jeux avec plusieurs niveaux
- Les contenus structurés en plusieurs parties

Pour un exercice simple, **supprimez les chapitres vides** et le contenu s'affichera correctement via `ItemRenderer`.

## ✅ Après correction

Une fois le chapitre vide supprimé, vous devriez voir :
- ✅ La section "Énoncé" avec la question formatée
- ✅ La zone de saisie pour la réponse
- ✅ Le bouton "Soumettre"
- ✅ La correction (si disponible)

