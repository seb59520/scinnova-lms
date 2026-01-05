# Test : Vérifier le rendu des slides

## ✅ Vérifications effectuées

1. **Type en base** : ✅ `"slide"` (correct)
2. **Contenu** : ✅ Format TipTap valide avec `type: "doc"` et `content` array
3. **Structure** : ✅ Tous les éléments sont bien formatés

## 🔍 Diagnostic du problème

Le problème "Type d'élément non supporté" apparaît probablement parce que :

1. **Le type n'est pas correctement lu depuis Supabase**
2. **Il y a un problème de typage TypeScript**
3. **L'item n'est pas chargé au moment du rendu**

## 🛠️ Solutions à tester

### Solution 1 : Vérifier dans la console du navigateur

1. Ouvrez la console (F12)
2. Allez sur la page de l'item slide
3. Ajoutez ce code dans la console :

```javascript
// Vérifier l'item chargé
console.log('Item type:', item?.type);
console.log('Item type === "slide":', item?.type === 'slide');
console.log('Item:', JSON.stringify(item, null, 2));
```

### Solution 2 : Ajouter des logs dans ItemRenderer

Temporairement, modifiez `src/components/ItemRenderer.tsx` ligne 1171 :

```typescript
switch (item.type) {
  case 'resource':
    return renderResource()
  case 'slide':
    console.log('🔍 Rendering slide:', item.type, typeof item.type, item);
    return renderSlide()
  // ...
}
```

### Solution 3 : Vérifier le typage TypeScript

Vérifiez que `src/types/database.ts` définit bien :

```typescript
export type ItemType = 'resource' | 'slide' | 'exercise' | 'activity' | 'tp' | 'game';

export interface Item {
  id: string;
  module_id: string;
  type: ItemType;  // ← Doit être ItemType, pas string
  // ...
}
```

### Solution 4 : Vérifier la requête Supabase

Dans `ItemView.tsx`, vérifiez que la requête retourne bien le type :

```typescript
const { data: itemData, error: itemError } = await supabase
  .from('items')
  .select('*')  // ← Vérifier que type est bien inclus
  .eq('id', itemId)
  .single()

console.log('ItemData from Supabase:', itemData);
console.log('ItemData type:', itemData?.type, typeof itemData?.type);
```

### Solution 5 : Forcer le type

Si le problème persiste, forcez le type dans `ItemView.tsx` :

```typescript
setItem({
  ...itemData,
  type: itemData.type as ItemType  // Force le typage
})
```

## 🎯 Test rapide

Créez un item de test directement en SQL et vérifiez qu'il s'affiche :

```sql
-- Créer un item slide de test
INSERT INTO items (module_id, type, title, position, published, content)
VALUES (
  (SELECT id FROM modules WHERE title LIKE '%M1%' LIMIT 1),
  'slide',
  'Test Slide Direct',
  999,
  true,
  '{"body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test direct"}]}]}}'::jsonb
)
RETURNING id, type, title;
```

Puis accédez à cet item via `/app/items/{id}` et vérifiez s'il s'affiche correctement.

## 📋 Checklist

- [ ] Le type en base est `'slide'` (vérifié ✅)
- [ ] Le contenu est valide (vérifié ✅)
- [ ] Le type est bien lu depuis Supabase (à vérifier)
- [ ] Le type est bien passé à ItemRenderer (à vérifier)
- [ ] Le switch case reçoit bien `'slide'` (à vérifier)

## 🐛 Si le problème persiste

1. Vérifiez les logs de la console pour voir si `item.type` est bien `'slide'`
2. Vérifiez s'il y a des erreurs JavaScript
3. Videz le cache du navigateur (Ctrl+Shift+Delete)
4. Rechargez la page en forçant le rafraîchissement (Ctrl+F5)


