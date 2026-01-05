# 🔍 Diagnostic : Configuration invalide pour les jeux

## Problème

Le jeu affiche l'erreur :
```
⚠️ Configuration invalide
Champs manquants ou invalides :
- leftColumn (array)
- rightColumn (array)
- correctMatches (array)
```

## Causes possibles

1. **Les données sont stockées comme des chaînes JSON au lieu d'objets JSONB**
2. **Structure imbriquée incorrecte dans la base de données**
3. **Les arrays sont vides ou mal formatés**

## Diagnostic SQL

Exécutez ces requêtes dans Supabase SQL Editor pour diagnostiquer le problème :

### 1. Trouver votre jeu

```sql
SELECT 
  id,
  title,
  type,
  content,
  pg_typeof(content) as content_type
FROM items
WHERE type = 'game'
  AND title ILIKE '%endpoints API%'  -- ou le titre de votre jeu
ORDER BY created_at DESC
LIMIT 1;
```

### 2. Vérifier la structure du content

```sql
SELECT 
  id,
  title,
  -- Vérifier si content est un objet JSONB
  content->>'gameType' as game_type,
  -- Vérifier les arrays
  jsonb_typeof(content->'leftColumn') as left_column_type,
  jsonb_typeof(content->'rightColumn') as right_column_type,
  jsonb_typeof(content->'correctMatches') as matches_type,
  -- Vérifier les longueurs
  jsonb_array_length(content->'leftColumn') as left_count,
  jsonb_array_length(content->'rightColumn') as right_count,
  jsonb_array_length(content->'correctMatches') as matches_count,
  -- Voir un échantillon
  content->'leftColumn'->0 as first_left_item,
  content->'rightColumn'->0 as first_right_item
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

### 3. Vérifier si content est une chaîne JSON

```sql
SELECT 
  id,
  title,
  content,
  CASE 
    WHEN pg_typeof(content) = 'text' THEN 'STRING - PROBLÈME !'
    WHEN pg_typeof(content) = 'jsonb' THEN 'JSONB - OK'
    ELSE pg_typeof(content)::text
  END as status
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

## Solutions

### Solution 1 : Si content est une chaîne JSON (text)

Si `pg_typeof(content) = 'text'`, vous devez convertir en JSONB :

```sql
-- Convertir le content de text à jsonb
UPDATE items
SET content = content::jsonb
WHERE id = 'VOTRE_ITEM_ID'
  AND pg_typeof(content) = 'text';
```

### Solution 2 : Si la structure est imbriquée incorrectement

Si le content contient une structure imbriquée comme `{ "content": { "gameType": ... } }` :

```sql
-- Extraire le content imbriqué
UPDATE items
SET content = content->'content'
WHERE id = 'VOTRE_ITEM_ID'
  AND content->>'type' = 'game'  -- Si content.type existe
  AND content->'content' IS NOT NULL;
```

### Solution 3 : Si les arrays sont vides ou manquants

Vérifiez d'abord ce qui manque :

```sql
SELECT 
  id,
  title,
  CASE 
    WHEN content->'leftColumn' IS NULL THEN 'leftColumn MANQUANT'
    WHEN jsonb_array_length(content->'leftColumn') = 0 THEN 'leftColumn VIDE'
    ELSE 'leftColumn OK'
  END as left_status,
  CASE 
    WHEN content->'rightColumn' IS NULL THEN 'rightColumn MANQUANT'
    WHEN jsonb_array_length(content->'rightColumn') = 0 THEN 'rightColumn VIDE'
    ELSE 'rightColumn OK'
  END as right_status,
  CASE 
    WHEN content->'correctMatches' IS NULL THEN 'correctMatches MANQUANT'
    WHEN jsonb_array_length(content->'correctMatches') = 0 THEN 'correctMatches VIDE'
    ELSE 'correctMatches OK'
  END as matches_status
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

Si les champs manquent, vous devez recréer l'item avec le bon format.

### Solution 4 : Recréer l'item avec le bon format

1. **Exporter le JSON actuel :**
```sql
SELECT 
  jsonb_pretty(
    jsonb_build_object(
      'type', type,
      'title', title,
      'position', position,
      'published', published,
      'content', content
    )
  ) as json_export
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

2. **Corriger le JSON** en utilisant un des fichiers `*-IMPORT.json`

3. **Réimporter via l'interface** `/admin/items/new/json?module_id=XXX`

## Vérification après correction

Après avoir appliqué une solution, vérifiez que tout est correct :

```sql
SELECT 
  id,
  title,
  content->>'gameType' as game_type,
  jsonb_typeof(content->'leftColumn') as left_type,
  jsonb_typeof(content->'rightColumn') as right_type,
  jsonb_typeof(content->'correctMatches') as matches_type,
  jsonb_array_length(content->'leftColumn') as left_count,
  jsonb_array_length(content->'rightColumn') as right_count,
  jsonb_array_length(content->'correctMatches') as matches_count
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

**Résultat attendu :**
- `game_type` = `'connection'`
- `left_type` = `'array'`
- `right_type` = `'array'`
- `matches_type` = `'array'`
- `left_count` > 0
- `right_count` > 0
- `matches_count` > 0

## Prévention

Pour éviter ce problème à l'avenir :

1. **Utilisez toujours les fichiers `*-IMPORT.json`** pour l'import via l'interface JSON
2. **Vérifiez que le type de colonne `content` est `jsonb`** dans Supabase (pas `text`)
3. **Testez le jeu immédiatement après l'import** pour détecter les problèmes rapidement

## Logs de débogage dans le navigateur

Ouvrez la console du navigateur (F12) et regardez les logs. Vous devriez voir :
- `[GameRenderer] Configuration invalide:` avec les détails
- `[extractGameContent]` si le gameType est manquant

Ces logs vous indiqueront exactement ce qui ne va pas.


