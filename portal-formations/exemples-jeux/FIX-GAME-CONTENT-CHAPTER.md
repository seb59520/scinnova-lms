# 🔧 Fix : Configuration invalide pour les jeux dans les chapitres

## Problème

Le jeu dans un chapitre affiche l'erreur :
```
⚠️ Configuration invalide
Champs manquants ou invalides :
- leftColumn (array)
- rightColumn (array)
- correctMatches (array)
```

## Diagnostic SQL

Exécutez ces requêtes dans Supabase SQL Editor pour trouver et diagnostiquer le problème :

### 1. Trouver le chapitre avec le jeu

```sql
SELECT 
  id,
  title,
  type,
  game_content,
  pg_typeof(game_content) as game_content_type
FROM chapters
WHERE type = 'game'
  AND title ILIKE '%endpoints API%'  -- ou le titre de votre jeu
ORDER BY created_at DESC
LIMIT 1;
```

### 2. Vérifier la structure du game_content

```sql
SELECT 
  id,
  title,
  -- Vérifier si game_content est un objet JSONB
  game_content->>'gameType' as game_type,
  -- Vérifier les arrays
  jsonb_typeof(game_content->'leftColumn') as left_column_type,
  jsonb_typeof(game_content->'rightColumn') as right_column_type,
  jsonb_typeof(game_content->'correctMatches') as matches_type,
  -- Vérifier les longueurs
  jsonb_array_length(game_content->'leftColumn') as left_count,
  jsonb_array_length(game_content->'rightColumn') as right_count,
  jsonb_array_length(game_content->'correctMatches') as matches_count,
  -- Voir un échantillon
  game_content->'leftColumn'->0 as first_left_item,
  game_content->'rightColumn'->0 as first_right_item
FROM chapters
WHERE id = 'VOTRE_CHAPTER_ID';
```

### 3. Vérifier si game_content est une chaîne JSON

```sql
SELECT 
  id,
  title,
  game_content,
  CASE 
    WHEN pg_typeof(game_content) = 'text' THEN 'STRING - PROBLÈME !'
    WHEN pg_typeof(game_content) = 'jsonb' THEN 'JSONB - OK'
    ELSE pg_typeof(game_content)::text
  END as status
FROM chapters
WHERE id = 'VOTRE_CHAPTER_ID';
```

### 4. Voir la structure complète

```sql
SELECT 
  id,
  title,
  jsonb_pretty(game_content) as game_content_formatted
FROM chapters
WHERE id = 'VOTRE_CHAPTER_ID';
```

## Solutions

### Solution 1 : Si game_content est une chaîne JSON (text)

Si `pg_typeof(game_content) = 'text'`, vous devez convertir en JSONB :

```sql
-- Convertir le game_content de text à jsonb
UPDATE chapters
SET game_content = game_content::jsonb
WHERE id = 'VOTRE_CHAPTER_ID'
  AND pg_typeof(game_content) = 'text';
```

### Solution 2 : Si la structure est imbriquée incorrectement

Si le `game_content` contient une structure imbriquée comme `{ "content": { "gameType": ... } }` ou `{ "game_content": { "gameType": ... } }` :

```sql
-- Extraire le game_content imbriqué
UPDATE chapters
SET game_content = game_content->'content'  -- ou game_content->'game_content'
WHERE id = 'VOTRE_CHAPTER_ID'
  AND game_content->'content' IS NOT NULL;  -- ou game_content->'game_content'
```

### Solution 3 : Si les arrays sont stockés comme des chaînes

Si `jsonb_typeof(game_content->'leftColumn') = 'string'` :

```sql
-- Reconstruire le game_content avec les arrays correctement formatés
UPDATE chapters
SET game_content = jsonb_set(
  jsonb_set(
    jsonb_set(
      game_content,
      '{leftColumn}',
      (game_content->>'leftColumn')::jsonb
    ),
    '{rightColumn}',
    (game_content->>'rightColumn')::jsonb
  ),
  '{correctMatches}',
  (game_content->>'correctMatches')::jsonb
)
WHERE id = 'VOTRE_CHAPTER_ID'
  AND jsonb_typeof(game_content->'leftColumn') = 'string';
```

### Solution 4 : Recréer le game_content avec le bon format

Si rien ne fonctionne, recréez le `game_content` avec le format correct :

```sql
-- Exemple pour un jeu de type "connection"
UPDATE chapters
SET game_content = '{
  "gameType": "connection",
  "leftColumn": [
    "GET /health",
    "GET /tasks",
    "GET /tasks/{id}",
    "POST /tasks",
    "PUT /tasks/{id}",
    "PATCH /tasks/{id}",
    "DELETE /tasks/{id}"
  ],
  "rightColumn": [
    "Vérification de l\'état de santé de l\'API",
    "Récupération d\'une tâche par son identifiant unique",
    "Création d\'une nouvelle tâche",
    "Mise à jour complète d\'une tâche (tous les champs)",
    "Mise à jour partielle d\'une tâche (champs sélectionnés)",
    "Suppression d\'une tâche",
    "Liste des tâches avec pagination et filtres"
  ],
  "correctMatches": [
    { "left": 0, "right": 0 },
    { "left": 1, "right": 6 },
    { "left": 2, "right": 1 },
    { "left": 3, "right": 2 },
    { "left": 4, "right": 3 },
    { "left": 5, "right": 4 },
    { "left": 6, "right": 5 }
  ],
  "description": "Dans une API REST, chaque endpoint a une fonction spécifique.",
  "instructions": "Cliquez sur un endpoint de la colonne de gauche, puis sur sa fonction correspondante dans la colonne de droite."
}'::jsonb
WHERE id = 'VOTRE_CHAPTER_ID';
```

**Ou utilisez un fichier JSON :**

1. Ouvrez le fichier `api-endpoints-connection-game-content-only.json`
2. Copiez le contenu
3. Dans Supabase SQL Editor :

```sql
UPDATE chapters
SET game_content = 'COLLER_LE_CONTENU_ICI'::jsonb
WHERE id = 'VOTRE_CHAPTER_ID';
```

## Vérification après correction

Après avoir appliqué une solution, vérifiez que tout est correct :

```sql
SELECT 
  id,
  title,
  game_content->>'gameType' as game_type,
  jsonb_typeof(game_content->'leftColumn') as left_type,
  jsonb_typeof(game_content->'rightColumn') as right_type,
  jsonb_typeof(game_content->'correctMatches') as matches_type,
  jsonb_array_length(game_content->'leftColumn') as left_count,
  jsonb_array_length(game_content->'rightColumn') as right_count,
  jsonb_array_length(game_content->'correctMatches') as matches_count
FROM chapters
WHERE id = 'VOTRE_CHAPTER_ID';
```

**Résultat attendu :**
- `game_type` = `'connection'`
- `left_type` = `'array'`
- `right_type` = `'array'`
- `matches_type` = `'array'`
- `left_count` > 0
- `right_count` > 0
- `matches_count` > 0

## Format correct pour game_content dans un chapitre

Le `game_content` d'un chapitre doit contenir **directement** la configuration du jeu, **SANS** structure imbriquée :

```json
{
  "gameType": "connection",
  "leftColumn": [...],
  "rightColumn": [...],
  "correctMatches": [...],
  "description": "...",
  "instructions": "..."
}
```

**❌ Format INCORRECT :**
```json
{
  "content": {
    "gameType": "connection",
    ...
  }
}
```

ou

```json
{
  "game_content": {
    "gameType": "connection",
    ...
  }
}
```

## Prévention

Pour éviter ce problème à l'avenir :

1. **Utilisez l'interface admin** `/admin/chapters/{chapterId}/json` pour créer/modifier les chapitres de type game
2. **Vérifiez que le type de colonne `game_content` est `jsonb`** dans Supabase (pas `text`)
3. **Utilisez les fichiers `*-content-only.json`** comme référence pour le format
4. **Testez le jeu immédiatement après création** pour détecter les problèmes rapidement



