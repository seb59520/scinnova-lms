# 📋 Guide d'import des jeux

## 🎯 Deux méthodes d'import

### Méthode 1 : Import via l'interface JSON (Recommandé) ✅

Utilisez les fichiers `*-IMPORT.json` qui contiennent la structure complète.

**Étapes :**
1. Allez dans `/admin/items/new/json?module_id=XXX` (remplacez XXX par l'ID de votre module)
2. Cliquez sur "Importer un fichier JSON"
3. Sélectionnez le fichier `*-IMPORT.json` correspondant
4. Le JSON sera chargé automatiquement avec tous les champs (type, title, content, etc.)
5. Ajustez la `position` si nécessaire
6. Cliquez sur "Sauvegarder"

**Fichiers disponibles :**
- `api-endpoints-connection-game-IMPORT.json`
- `api-methods-connection-game-IMPORT.json`
- `api-concepts-connection-game-IMPORT.json`

### Méthode 2 : Import via l'interface normale

Utilisez les fichiers `*-content-only.json` et remplissez manuellement les champs.

**Étapes :**
1. Allez dans `/admin/items/new?module_id=XXX`
2. Sélectionnez le type `game`
3. Remplissez le titre et la description (voir ci-dessous)
4. Dans le champ Content, collez le contenu du fichier `*-content-only.json`
5. Sauvegardez

---

## ⚠️ Important : Format des fichiers

Les fichiers `*-content-only.json` contiennent **uniquement le contenu du jeu**. Ils ne contiennent **PAS** le titre ni la description au niveau racine, car ces champs sont dans les colonnes de la table `items`, pas dans `content`.

## 📝 Informations à remplir dans l'interface admin

Lors de l'import d'un jeu, vous devez remplir ces informations dans l'interface admin (`/admin/items/new` ou `/admin/items/{itemId}`) :

### 1. `api-endpoints-connection-game-content-only.json`

**Titre :** `Associez les endpoints API à leurs fonctions`

**Description :** `Connectez chaque endpoint HTTP à sa fonction correspondante pour maîtriser les opérations REST`

**Type :** `game`

**Content :** Copiez-collez le contenu du fichier `api-endpoints-connection-game-content-only.json`

---

### 2. `api-methods-connection-game-content-only.json`

**Titre :** `Méthodes HTTP et leurs codes de réponse`

**Description :** `Associez les méthodes HTTP aux codes de statut qu'elles retournent typiquement`

**Type :** `game`

**Content :** Copiez-collez le contenu du fichier `api-methods-connection-game-content-only.json`

---

### 3. `api-concepts-connection-game-content-only.json`

**Titre :** `Concepts OpenAPI et leurs définitions`

**Description :** `Associez les concepts clés d'OpenAPI 3 à leurs définitions`

**Type :** `game`

**Content :** Copiez-collez le contenu du fichier `api-concepts-connection-game-content-only.json`

---

## 🚀 Étapes d'import

1. **Allez dans l'interface admin :** `/admin/items/new`
2. **Remplissez les champs :**
   - **Type :** Sélectionnez `game`
   - **Titre :** Utilisez le titre indiqué ci-dessus
   - **Description :** Utilisez la description indiquée ci-dessus
   - **Position :** Définissez la position dans le module
   - **Published :** Cochez si vous voulez publier immédiatement
3. **Dans le champ Content (JSON) :**
   - Ouvrez le fichier `*-content-only.json` correspondant
   - Copiez **tout le contenu** du fichier
   - Collez-le dans le champ Content
4. **Sauvegardez** l'item
5. **Notez l'ID** de l'item créé pour construire le lien d'accès : `/items/{itemId}`

## ✅ Vérification

Après création, vérifiez que :
- ✅ Le champ `type` de l'item = `'game'`
- ✅ Le champ `title` est rempli
- ✅ Le champ `content->>'gameType'` = `'connection'`
- ✅ Le champ `content->'leftColumn'` est un array non vide
- ✅ Le champ `content->'rightColumn'` est un array non vide

```sql
SELECT 
  id,
  title,
  type,
  content->>'gameType' as game_type,
  jsonb_array_length(content->'leftColumn') as left_count,
  jsonb_array_length(content->'rightColumn') as right_count
FROM items
WHERE type = 'game'
  AND title ILIKE '%OpenAPI%'  -- ou le titre de votre jeu
ORDER BY created_at DESC
LIMIT 1;
```

## 🔗 Accès au jeu

Une fois créé, accédez au jeu via :
```
/items/{itemId}
```

Remplacez `{itemId}` par l'ID de l'item créé.

