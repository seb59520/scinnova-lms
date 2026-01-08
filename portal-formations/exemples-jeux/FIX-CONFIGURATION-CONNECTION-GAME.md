# 🔧 Fix : Configuration invalide pour les jeux de type "connection"

## Problème

Le jeu affiche l'erreur :
```
⚠️ Configuration invalide
La configuration du jeu "Jeu de connexion avec lignes animées" est invalide.
```

## Cause

Le fichier JSON d'exemple contient la structure complète avec `type`, `title`, `description` au niveau racine, mais dans la base de données, ces champs sont déjà dans les colonnes de la table `items`. Le champ `content` de l'item doit contenir **uniquement** le contenu du jeu.

## Solution

### Option 1 : Vérifier et corriger dans la base de données

1. **Trouver l'item avec le jeu :**
```sql
SELECT id, title, type, content 
FROM items 
WHERE type = 'game' 
  AND title ILIKE '%endpoints API%';
```

2. **Vérifier la structure du content :**
Le `content` doit être un objet JSONB avec cette structure :
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

**❌ Structure INCORRECTE (ne pas utiliser) :**
```json
{
  "type": "game",
  "title": "...",
  "description": "...",
  "content": {
    "gameType": "connection",
    ...
  }
}
```

3. **Corriger si nécessaire :**
```sql
-- Si le content contient une structure imbriquée incorrecte
UPDATE items
SET content = content->'content'  -- Extrait le content imbriqué
WHERE id = 'VOTRE_ITEM_ID'
  AND content->>'type' = 'game';  -- Seulement si content.type existe
```

### Option 2 : Utiliser le bon format lors de l'import

Lors de la création d'un item de type `game`, utilisez **uniquement** la partie `content` du JSON d'exemple :

**Format correct pour l'import :**
```json
{
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
    "Vérification de l'état de santé de l'API",
    "Récupération d'une tâche par son identifiant unique",
    "Création d'une nouvelle tâche",
    "Mise à jour complète d'une tâche (tous les champs)",
    "Mise à jour partielle d'une tâche (champs sélectionnés)",
    "Suppression d'une tâche",
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
}
```

### Option 3 : Via l'interface d'administration

1. Allez dans `/admin/items/{itemId}` (ou créez un nouvel item)
2. Sélectionnez le type `game`
3. Dans le champ `content`, collez **uniquement** la partie `content` du JSON d'exemple (sans `type`, `title`, `description` au niveau racine)
4. Le `title` et la `description` doivent être remplis dans les champs séparés de l'interface, pas dans le JSON

## Vérification

Après correction, vérifiez que :
- ✅ `content->>'gameType'` = `'connection'`
- ✅ `content->'leftColumn'` est un array avec au moins 1 élément
- ✅ `content->'rightColumn'` est un array avec au moins 1 élément
- ✅ `content->'correctMatches'` est un array

```sql
SELECT 
  id,
  title,
  content->>'gameType' as game_type,
  jsonb_array_length(content->'leftColumn') as left_count,
  jsonb_array_length(content->'rightColumn') as right_count,
  jsonb_array_length(content->'correctMatches') as matches_count
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

## Exemple de correction SQL complète

```sql
-- 1. Trouver l'item
SELECT id, title, content 
FROM items 
WHERE type = 'game' 
  AND title ILIKE '%endpoints API%';

-- 2. Voir la structure actuelle
SELECT 
  id,
  title,
  content,
  content->>'gameType' as game_type,
  content->'content' as nested_content
FROM items
WHERE id = 'VOTRE_ITEM_ID';

-- 3. Corriger si content est imbriqué
UPDATE items
SET content = content->'content'
WHERE id = 'VOTRE_ITEM_ID'
  AND content->>'type' = 'game'  -- Si content.type existe
  AND content->'content' IS NOT NULL;

-- 4. Vérifier après correction
SELECT 
  id,
  title,
  content->>'gameType' as game_type,
  jsonb_array_length(content->'leftColumn') as left_count,
  jsonb_array_length(content->'rightColumn') as right_count
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

## Notes importantes

- Le champ `content` d'un item de type `game` doit contenir **directement** la configuration du jeu
- Les champs `type`, `title`, `description` sont dans les colonnes de la table `items`, pas dans `content`
- Pour les chapitres de type `game`, utilisez `game_content` au lieu de `content`



