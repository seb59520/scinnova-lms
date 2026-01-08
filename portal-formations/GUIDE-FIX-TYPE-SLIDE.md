# Guide de résolution : Erreur "Type d'élément non supporté" pour les slides

## 🔍 Diagnostic étape par étape

### Étape 1 : Vérifier le type en base de données

Exécutez le script `diagnose-item-type.sql` pour vérifier :

```sql
-- Vérifier tous les types d'items
SELECT type, COUNT(*) 
FROM items 
GROUP BY type;

-- Vérifier un item spécifique (remplacez l'ID)
SELECT id, type, title, LENGTH(type) as type_length
FROM items
WHERE title LIKE '%Architecture%';
```

**Si le type n'est pas exactement `'slide'`** (avec des espaces, majuscules, etc.), corrigez-le :

```sql
UPDATE items
SET type = 'slide'
WHERE type != 'slide' 
  AND (LOWER(TRIM(type)) = 'slide' OR title LIKE '%Architecture%');
```

### Étape 2 : Vérifier la contrainte CHECK

Vérifiez que la contrainte inclut bien 'slide' :

```sql
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conname LIKE '%type%';
```

Si 'slide' n'est pas dans la liste, exécutez :

```sql
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game'));
```

### Étape 3 : Tester avec un JSON minimal

Utilisez le fichier `slide-m1-minimal-test.json` pour tester :

1. Allez dans `/admin/courses/{courseId}/edit`
2. Cliquez sur "Mode JSON"
3. Collez le contenu de `slide-m1-minimal-test.json`
4. Cliquez sur "Sauvegarder"

Si ça fonctionne, le problème vient du JSON original. Si ça ne fonctionne pas, le problème vient de la base de données ou du code.

### Étape 4 : Vérifier dans la console du navigateur

1. Ouvrez la console (F12)
2. Allez sur la page de l'item qui pose problème
3. Dans la console, tapez :

```javascript
// Si vous êtes sur la page ItemView
console.log('Item type:', window.item?.type);
console.log('Item:', window.item);
```

Ou ajoutez temporairement dans `ItemRenderer.tsx` (ligne 18) :

```typescript
console.log('🔍 ItemRenderer - item.type:', item.type, 'typeof:', typeof item.type);
console.log('🔍 ItemRenderer - item:', item);
```

### Étape 5 : Vérifier l'import JSON

Si vous importez via JSON, vérifiez que :

1. Le JSON est valide (utilisez un validateur JSON)
2. Le type est exactement `"slide"` (minuscules, pas d'espaces)
3. Le JSON est bien parsé (pas d'erreur dans la console)

### Étape 6 : Vérifier le rendu

Si l'item est créé mais ne s'affiche pas correctement :

1. Vérifiez que `item.type === 'slide'` dans le switch case
2. Vérifiez que la fonction `renderSlide()` existe et fonctionne
3. Vérifiez qu'il n'y a pas d'erreur JavaScript dans la console

## 🛠️ Solutions rapides

### Solution 1 : Recréer l'item

Si l'item existe déjà avec un type incorrect :

```sql
-- Supprimer l'item problématique
DELETE FROM items WHERE id = 'VOTRE_ITEM_ID';

-- Puis recréer via l'interface ou le JSON
```

### Solution 2 : Corriger le type directement

```sql
UPDATE items
SET type = 'slide'
WHERE id = 'VOTRE_ITEM_ID';
```

### Solution 3 : Vérifier le module_id

Assurez-vous que l'item a un `module_id` valide :

```sql
SELECT i.id, i.type, i.title, i.module_id, m.title as module_title
FROM items i
LEFT JOIN modules m ON m.id = i.module_id
WHERE i.id = 'VOTRE_ITEM_ID';
```

## 📋 Checklist de vérification

- [ ] Le type en base est exactement `'slide'` (minuscules, pas d'espaces)
- [ ] La contrainte CHECK inclut `'slide'`
- [ ] Le JSON utilise `"type": "slide"` (minuscules, guillemets doubles)
- [ ] L'item a un `module_id` valide
- [ ] L'item est `published: true`
- [ ] Pas d'erreur JavaScript dans la console
- [ ] Le JSON est valide (pas d'erreur de parsing)

## 🎯 Test final

Créez un item de test directement en SQL :

```sql
INSERT INTO items (module_id, type, title, position, published, content)
VALUES (
  'VOTRE_MODULE_ID',
  'slide',
  'Test Slide',
  1,
  true,
  '{"body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test"}]}]}}'::jsonb
)
RETURNING id, type;
```

Puis vérifiez qu'il s'affiche correctement dans l'interface.

## 🐛 Si le problème persiste

1. Vérifiez les logs du serveur (Supabase)
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que le code est à jour (pas de cache)
4. Testez avec un autre type (ex: `"type": "resource"`) pour voir si le problème est spécifique aux slides



