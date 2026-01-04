# Debug : Erreur "Type d'élément non supporté" pour les slides

## ✅ Vérifications effectuées

1. **Contrainte CHECK** : ✅ Correcte - inclut bien `'slide'`
2. **Code frontend** : ✅ Correct - le switch case inclut bien `case 'slide':`

## 🔍 Prochaines étapes de diagnostic

### Étape 1 : Vérifier les items en base

Exécutez le script `check-items-type.sql` pour voir :
- Si les items ont bien le type `'slide'`
- S'il y a des espaces ou caractères invisibles
- Les statistiques sur les types

### Étape 2 : Vérifier dans la console du navigateur

1. Ouvrez la console (F12)
2. Allez sur la page de l'item qui pose problème
3. Ajoutez temporairement ce code dans la console :

```javascript
// Si vous êtes sur ItemView
// Vérifier l'item chargé
console.log('Item type:', item?.type);
console.log('Item type length:', item?.type?.length);
console.log('Item type charCode:', item?.type?.charCodeAt(0));
console.log('Item:', JSON.stringify(item, null, 2));
```

### Étape 3 : Vérifier le type exact en base

Pour un item spécifique (remplacez l'ID) :

```sql
SELECT 
  id,
  type,
  title,
  -- Vérifier le type caractère par caractère
  LENGTH(type) as type_length,
  -- Vérifier les codes ASCII
  ASCII(SUBSTRING(type, 1, 1)) as first_char,
  ASCII(SUBSTRING(type, 2, 1)) as second_char,
  ASCII(SUBSTRING(type, 3, 1)) as third_char,
  ASCII(SUBSTRING(type, 4, 1)) as fourth_char,
  ASCII(SUBSTRING(type, 5, 1)) as fifth_char,
  -- Vérifier en hexadécimal
  encode(type::bytea, 'hex') as type_hex
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

Le type `'slide'` devrait avoir :
- `type_length = 5`
- `first_char = 115` (s)
- `second_char = 108` (l)
- `third_char = 105` (i)
- `fourth_char = 100` (d)
- `fifth_char = 101` (e)
- `type_hex = 736c696465`

### Étape 4 : Corriger si nécessaire

Si le type n'est pas exactement `'slide'` :

```sql
-- Corriger le type
UPDATE items
SET type = 'slide'
WHERE id = 'VOTRE_ITEM_ID'
  AND LOWER(TRIM(type)) = 'slide';
```

### Étape 5 : Vérifier le typage TypeScript

Vérifiez que l'interface `Item` dans `src/types/database.ts` inclut bien `'slide'` :

```typescript
export type ItemType = 'resource' | 'slide' | 'exercise' | 'activity' | 'tp' | 'game';
```

## 🐛 Causes possibles

1. **Type avec espaces** : `' slide '` au lieu de `'slide'`
2. **Type en majuscules** : `'Slide'` au lieu de `'slide'`
3. **Caractères invisibles** : caractères Unicode invisibles
4. **Problème de cache** : le navigateur cache une ancienne version
5. **Problème de typage** : TypeScript ne reconnaît pas le type

## 🛠️ Solutions rapides

### Solution 1 : Forcer la correction du type

```sql
-- Corriger tous les slides
UPDATE items
SET type = 'slide'
WHERE LOWER(TRIM(type)) = 'slide'
  AND type != 'slide';
```

### Solution 2 : Recréer l'item

Si l'item est corrompu, supprimez-le et recréez-le via l'interface ou le JSON.

### Solution 3 : Vider le cache

1. Videz le cache du navigateur (Ctrl+Shift+Delete)
2. Rechargez la page en forçant le rafraîchissement (Ctrl+F5)

## 📋 Checklist finale

- [ ] Le type en base est exactement `'slide'` (5 caractères, minuscules)
- [ ] Pas d'espaces avant/après le type
- [ ] Pas de caractères invisibles
- [ ] Le cache du navigateur est vidé
- [ ] Le code TypeScript inclut `'slide'` dans `ItemType`
- [ ] L'item est bien chargé depuis la base (vérifier dans la console)

## 🎯 Test final

Créez un item de test directement en SQL :

```sql
INSERT INTO items (module_id, type, title, position, published, content)
VALUES (
  (SELECT id FROM modules LIMIT 1),
  'slide',
  'Test Slide Debug',
  999,
  true,
  '{"body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test"}]}]}}'::jsonb
)
RETURNING id, type, title;
```

Puis vérifiez qu'il s'affiche correctement. Si ce test fonctionne, le problème vient de l'item spécifique, pas du système.

