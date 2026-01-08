# Debug : Erreur "Type d'élément non supporté" pour les slides

## 🔍 Diagnostic

L'erreur "Type d'élément non supporté" apparaît dans les composants suivants :
- `ItemRenderer.tsx` (ligne 1184)
- `ReactItemRenderer.tsx` (ligne 185)
- `ReactRenderer.tsx` (ligne 407)

## ✅ Types valides

D'après le code, les types valides sont :
- `'resource'`
- `'slide'`
- `'exercise'`
- `'activity'` (ajouté via `add-activity-type-to-items.sql`)
- `'tp'`
- `'game'`

## 🐛 Causes possibles

### 1. Type non reconnu dans le switch case

Le switch case vérifie :
```typescript
switch (item.type) {
  case 'resource': ...
  case 'slide': ...
  case 'exercise':
  case 'activity': ...
  case 'tp': ...
  case 'game': ...
  default:
    return <p>Type d'élément non supporté.</p>
}
```

**Solution** : Vérifier que `item.type` est exactement `'slide'` (minuscules, pas d'espaces).

### 2. Type stocké incorrectement en base

Vérifier dans la base de données :
```sql
SELECT id, type, title 
FROM items 
WHERE type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game');
```

### 3. Type avec espaces ou majuscules

Le type peut être stocké avec des espaces ou en majuscules. Vérifier :
```sql
SELECT id, type, title, LENGTH(type) as type_length
FROM items 
WHERE id = 'VOTRE_ITEM_ID';
```

## 🔧 Solutions

### Solution 1 : Vérifier le type en base de données

```sql
-- Vérifier tous les types d'items
SELECT DISTINCT type, COUNT(*) 
FROM items 
GROUP BY type;

-- Vérifier un item spécifique
SELECT id, type, title, content
FROM items
WHERE title LIKE '%Architecture client%';
```

### Solution 2 : Corriger le type en base

Si le type est incorrect :
```sql
UPDATE items
SET type = 'slide'
WHERE type = 'Slide' OR type = ' SLIDE ' OR type = 'slide ';
```

### Solution 3 : Vérifier la contrainte CHECK

S'assurer que la contrainte inclut bien 'slide' :
```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conname LIKE '%type%';
```

### Solution 4 : Vérifier dans le code frontend

Dans la console du navigateur, vérifier :
```javascript
// Dans ItemRenderer ou ReactItemRenderer
console.log('Item type:', item.type, 'Type of:', typeof item.type);
console.log('Item:', item);
```

## 📝 Checklist de vérification

- [ ] Le JSON utilise bien `"type": "slide"` (minuscules)
- [ ] Le type est bien sauvegardé en base de données
- [ ] La contrainte CHECK de la base inclut 'slide'
- [ ] Le type n'a pas d'espaces avant/après
- [ ] Le type n'est pas en majuscules
- [ ] L'item est bien chargé depuis la base

## 🎯 Test rapide

Créer un item de test directement en SQL :
```sql
INSERT INTO items (module_id, type, title, position, published, content)
VALUES (
  'VOTRE_MODULE_ID',
  'slide',
  'Test slide',
  1,
  true,
  '{"body": {"type": "doc", "content": []}}'::jsonb
)
RETURNING id, type;
```

Puis vérifier qu'il s'affiche correctement dans l'interface.



