# 🔧 Dépannage : Exercice REST Bibliothèque - Écran blanc

## ✅ Vérifications à faire

### 1. Vérifier le type de l'item

L'exercice doit être de type **`"exercise"`** et non **`"game"`**.

```json
{
  "type": "exercise",  // ✅ Correct
  // PAS "type": "game"  // ❌ Incorrect
}
```

### 2. Vérifier la structure du contenu

Le contenu doit avoir `question` et `correction` :

```json
{
  "content": {
    "question": { ... },  // ✅ Doit exister
    "correction": { ... } // ✅ Doit exister
  }
}
```

### 3. Vérifier le format TipTap

La question et la correction doivent être au format TipTap valide :

```json
{
  "question": {
    "type": "doc",
    "content": [ ... ]  // ✅ Array d'éléments
  }
}
```

### 4. Vérifier dans la console du navigateur

Ouvrez la console du navigateur (F12) et cherchez :
- ❌ Erreurs JavaScript (rouge)
- ⚠️ Avertissements (jaune)
- 🔍 Messages de debug

### 5. Vérifier comment l'exercice est importé

#### Option A : Import dans un cours JSON

```json
{
  "modules": [
    {
      "items": [
        {
          "type": "exercise",
          "title": "...",
          "content": { ... }
        }
      ]
    }
  ]
}
```

#### Option B : Création directe dans la base de données

Vérifiez que :
- `type = 'exercise'` (pas 'game')
- `content` est un JSON valide
- `content.question` existe
- `content.correction` existe

## 🐛 Problèmes courants et solutions

### Problème 1 : Écran blanc sans erreur

**Cause possible** : Le RichTextEditor ne peut pas rendre le contenu

**Solution** :
1. Vérifiez que le contenu TipTap est valide
2. Vérifiez qu'il n'y a pas de `codeBlock` (remplacé par des paragraphes avec `code`)
3. Vérifiez que tous les nœuds TipTap sont supportés

### Problème 2 : L'exercice s'affiche mais la question est vide

**Cause possible** : Format TipTap invalide

**Solution** :
1. Vérifiez que `content.question.type === 'doc'`
2. Vérifiez que `content.question.content` est un array
3. Vérifiez que chaque élément a un `type` valide

### Problème 3 : Erreur "Cannot read property 'content' of null"

**Cause possible** : Le contenu n'est pas chargé correctement

**Solution** :
1. Vérifiez que l'item existe dans la base de données
2. Vérifiez que `content` n'est pas `null`
3. Vérifiez que le JSON est valide

### Problème 4 : L'exercice est importé comme un jeu

**Cause possible** : Type incorrect lors de l'import

**Solution** :
1. Vérifiez que `type: "exercise"` dans le JSON
2. Si importé via l'interface, vérifiez le type sélectionné
3. Si importé via SQL, vérifiez la colonne `type`

## 🔍 Commandes de diagnostic

### Vérifier le JSON

```bash
cd portal-formations
node -e "try { const data = require('./exercice-rest-bibliotheque.json'); console.log('✅ JSON valide'); console.log('Type:', data.type); } catch(e) { console.error('❌ Erreur:', e.message); }"
```

### Vérifier dans la base de données

```sql
-- Trouver l'exercice
SELECT id, title, type, content->>'question' as question_exists
FROM items 
WHERE title ILIKE '%bibliothèque%' 
  OR title ILIKE '%REST%';

-- Vérifier le type
SELECT id, title, type 
FROM items 
WHERE type = 'exercise' 
  AND title ILIKE '%bibliothèque%';
```

### Vérifier le rendu dans React

Ouvrez la console du navigateur et cherchez :
```javascript
// Dans ReactRenderer.tsx, il y a des console.log pour debug
🔍 renderExercise - Item: ...
🔍 renderExercise - Content: ...
```

## 📝 Format minimal qui fonctionne

Si l'exercice ne fonctionne toujours pas, testez avec ce format minimal :

```json
{
  "type": "exercise",
  "title": "Test exercice",
  "position": 0,
  "published": true,
  "content": {
    "question": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Question de test"
            }
          ]
        }
      ]
    },
    "correction": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Correction de test"
            }
          ]
        }
      ]
    }
  }
}
```

## 🚀 Solution rapide

Si l'écran est blanc :

1. **Ouvrez la console du navigateur** (F12)
2. **Cherchez les erreurs** (onglet Console)
3. **Vérifiez le type** : doit être `"exercise"` pas `"game"`
4. **Vérifiez le format** : `content.question` doit être un objet TipTap valide
5. **Rechargez la page** (Ctrl+R ou Cmd+R)

## 📞 Informations à fournir pour le support

Si le problème persiste, fournissez :

1. **Console du navigateur** : Capture d'écran des erreurs
2. **Type de l'item** : `SELECT type FROM items WHERE id = '...'`
3. **Structure du contenu** : `SELECT content FROM items WHERE id = '...'`
4. **URL de la page** : Où l'exercice est affiché
5. **Navigateur utilisé** : Chrome, Firefox, Safari, etc.

## ✅ Checklist de vérification

- [ ] Le JSON est valide (pas d'erreur de syntaxe)
- [ ] Le type est `"exercise"` (pas `"game"`)
- [ ] `content.question` existe et est un objet TipTap valide
- [ ] `content.correction` existe et est un objet TipTap valide
- [ ] `content.question.type === 'doc'`
- [ ] `content.question.content` est un array
- [ ] Pas d'erreur dans la console du navigateur
- [ ] L'item est publié (`published: true`)
- [ ] L'item est dans un module/cours actif


