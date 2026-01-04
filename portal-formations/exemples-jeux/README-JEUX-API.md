# 🎮 Exemples de jeux pour l'apprentissage des APIs

Ce dossier contient des exemples de jeux JSON prêts à l'emploi pour enseigner les concepts d'API REST et OpenAPI.

> 📋 **Guide d'import complet :** Consultez `IMPORT-GUIDE.md` pour les instructions détaillées avec tous les titres et descriptions à utiliser.

## 📁 Fichiers disponibles

### 1. Endpoints API et leurs fonctions

**Fichiers :**
- `api-endpoints-connection-game.json` : Format complet (documentation)
- `api-endpoints-connection-game-IMPORT.json` : **Format pour import JSON** ✅ (recommandé)
- `api-endpoints-connection-game-content-only.json` : Format content-only (pour import manuel)

**Jeu : Associez les endpoints API à leurs fonctions**

**📝 Informations pour l'import :**
- **Titre :** `Associez les endpoints API à leurs fonctions`
- **Description :** `Connectez chaque endpoint HTTP à sa fonction correspondante pour maîtriser les opérations REST`

Associe les endpoints HTTP (GET, POST, PUT, PATCH, DELETE) à leurs fonctions correspondantes.

**Endpoints inclus :**
- `GET /health` → Vérification de l'état de santé
- `GET /tasks` → Liste des tâches
- `GET /tasks/{id}` → Récupération par ID
- `POST /tasks` → Création
- `PUT /tasks/{id}` → Mise à jour complète
- `PATCH /tasks/{id}` → Mise à jour partielle
- `DELETE /tasks/{id}` → Suppression

**Utilisation :** Parfait pour le TP OpenAPI/Swagger, module sur les méthodes HTTP REST.

**🔗 Lien d'accès :**
- Si le jeu est un **item** : `/items/{itemId}` (remplacez `{itemId}` par l'ID de l'item dans la base de données)
- Si le jeu est dans un **chapitre** : `/courses/{courseId}` ou `/programs/{programId}` (naviguez jusqu'au chapitre contenant le jeu)

**Pour trouver l'ID de l'item :**
```sql
SELECT id, title FROM items 
WHERE type = 'game' 
  AND title ILIKE '%endpoints API%';
```

---

### 2. Méthodes HTTP et leurs codes de réponse

**Fichiers :**
- `api-methods-connection-game.json` : Format complet (documentation)
- `api-methods-connection-game-IMPORT.json` : **Format pour import JSON** ✅ (recommandé)
- `api-methods-connection-game-content-only.json` : Format content-only (pour import manuel)

**Jeu : Méthodes HTTP et leurs codes de réponse**

**📝 Informations pour l'import :**
- **Titre :** `Méthodes HTTP et leurs codes de réponse`
- **Description :** `Associez les méthodes HTTP aux codes de statut qu'elles retournent typiquement`

Associe les méthodes HTTP aux codes de statut qu'elles retournent typiquement.

**Concepts couverts :**
- Codes de succès (200, 201, 204)
- Codes d'erreur (400, 404)
- Différence entre PUT et PATCH
- Gestion des erreurs de validation

**Utilisation :** Pour comprendre les conventions REST et les codes HTTP.

**🔗 Lien d'accès :**
- Si le jeu est un **item** : `/items/{itemId}` (remplacez `{itemId}` par l'ID de l'item dans la base de données)
- Si le jeu est dans un **chapitre** : `/courses/{courseId}` ou `/programs/{programId}` (naviguez jusqu'au chapitre contenant le jeu)

**Pour trouver l'ID de l'item :**
```sql
SELECT id, title FROM items 
WHERE type = 'game' 
  AND title ILIKE '%Méthodes HTTP%';
```

---

### 3. Concepts OpenAPI et leurs définitions

**Fichiers :**
- `api-concepts-connection-game.json` : Format complet (documentation)
- `api-concepts-connection-game-IMPORT.json` : **Format pour import JSON** ✅ (recommandé)
- `api-concepts-connection-game-content-only.json` : Format content-only (pour import manuel)

**Jeu : Concepts OpenAPI et leurs définitions**

**📝 Informations pour l'import :**
- **Titre :** `Concepts OpenAPI et leurs définitions`
- **Description :** `Associez les concepts clés d'OpenAPI 3 à leurs définitions`

Associe les concepts clés d'OpenAPI 3 à leurs définitions.

**Concepts inclus :**
- OpenAPI Specification
- Swagger UI
- operationId, schema, components
- path parameters, query parameters
- requestBody, responses
- Zod (validation)

**Utilisation :** Pour maîtriser le vocabulaire et les concepts OpenAPI.

**🔗 Lien d'accès :**
- Si le jeu est un **item** : `/items/{itemId}` (remplacez `{itemId}` par l'ID de l'item dans la base de données)
- Si le jeu est dans un **chapitre** : `/courses/{courseId}` ou `/programs/{programId}` (naviguez jusqu'au chapitre contenant le jeu)

**Pour trouver l'ID de l'item :**
```sql
SELECT id, title FROM items 
WHERE type = 'game' 
  AND title ILIKE '%Concepts OpenAPI%';
```

---

## 🚀 Comment utiliser ces jeux

### ⚠️ Important : Format des fichiers

Il existe **trois formats** de fichiers JSON :

1. **Format complet** (`*-game.json`) : Contient `type`, `title`, `description` et `content`
   - Utilisé pour la documentation et la référence

2. **Format IMPORT** (`*-IMPORT.json`) : Format complet prêt pour l'import JSON ✅ **RECOMMANDÉ**
   - Contient tous les champs nécessaires (`type`, `title`, `position`, `published`, `content`)
   - **Utilisez ce format** pour l'import via `/admin/items/new/json`

3. **Format content-only** (`*-content-only.json`) : Contient uniquement le contenu du jeu
   - Pour l'import manuel via l'interface normale
   - Le `title` et la `description` doivent être remplis dans les champs séparés

### Option 1 : Import via l'interface JSON (Recommandé) ✅

1. Allez dans `/admin/items/new/json?module_id=XXX` (remplacez XXX par l'ID de votre module)
2. Cliquez sur "Importer un fichier JSON"
3. Sélectionnez le fichier **`*-IMPORT.json`** correspondant
4. Le JSON sera chargé automatiquement avec tous les champs (type, title, content, etc.)
5. Ajustez la `position` si nécessaire
6. Cliquez sur "Sauvegarder"
7. **Notez l'ID de l'item créé** pour construire le lien d'accès : `/items/{itemId}`

**Avantages :**
- ✅ Import en un clic
- ✅ Tous les champs sont pré-remplis (titre, description, type, etc.)
- ✅ Moins d'erreurs

### Option 2 : Import manuel via l'interface normale

Si vous préférez utiliser l'interface normale (pas JSON) :

1. Allez dans `/admin/items/new?module_id=XXX`
2. Sélectionnez le type `game`
3. Remplissez le titre et la description (voir les informations ci-dessous)
4. Dans le champ Content, collez le contenu du fichier **`*-content-only.json`**
5. Sauvegardez
6. **Notez l'ID de l'item créé** pour construire le lien d'accès : `/items/{itemId}`

### Option 3 : Modification personnalisée

1. Ouvrez le fichier **`*-content-only.json`**
2. Modifiez les colonnes `leftColumn` et `rightColumn` selon vos besoins
3. Ajustez les `correctMatches` en conséquence
4. Sauvegardez et importez
5. **Notez l'ID** pour construire le lien d'accès

### 🔧 Si vous avez une erreur "Configuration invalide"

Si vous voyez l'erreur "Configuration invalide", c'est probablement que vous avez utilisé le format complet au lieu du format content-only. Consultez le guide : `FIX-CONFIGURATION-CONNECTION-GAME.md`

---

## 📝 Format des correspondances

Les correspondances utilisent des indices (0-based) :

```json
"correctMatches": [
  { "left": 0, "right": 0 },  // Premier élément gauche → Premier élément droit
  { "left": 1, "right": 6 }, // Deuxième élément gauche → Septième élément droit
  ...
]
```

**Important :** Les indices correspondent à la position dans les tableaux `leftColumn` et `rightColumn`.

---

## 🎯 Suggestions d'utilisation pédagogique

### Pour le TP OpenAPI/Swagger

1. **Avant le TP** : Utilisez `api-concepts-connection-game.json` pour introduire le vocabulaire
2. **Pendant le TP** : Utilisez `api-endpoints-connection-game.json` pour renforcer la compréhension des méthodes HTTP
3. **Après le TP** : Utilisez `api-methods-connection-game.json` pour valider la compréhension des codes HTTP

### Variantes possibles

- **Niveau débutant** : Réduisez le nombre de correspondances (5-6 au lieu de 7-10)
- **Niveau avancé** : Ajoutez des endpoints plus complexes (nested resources, query params complexes)
- **Évaluation** : Utilisez ces jeux comme quiz de validation des connaissances

---

## 🔧 Personnalisation

### Ajouter des endpoints

Pour ajouter un nouvel endpoint :

1. Ajoutez l'endpoint dans `leftColumn`
2. Ajoutez sa fonction dans `rightColumn`
3. Ajoutez la correspondance dans `correctMatches` :

```json
{
  "left": 7,  // Index du nouvel endpoint dans leftColumn
  "right": 7 // Index de sa fonction dans rightColumn
}
```

### Modifier les descriptions

Les champs `description` et `instructions` peuvent être personnalisés selon votre contexte pédagogique.

---

## ✅ Checklist avant utilisation

- [ ] Vérifier que tous les indices dans `correctMatches` sont valides
- [ ] S'assurer que `leftColumn` et `rightColumn` ont le même nombre d'éléments (ou au moins que toutes les correspondances sont valides)
- [ ] Tester le jeu dans l'interface pour vérifier le rendu
- [ ] Vérifier que les descriptions sont claires et adaptées au niveau des étudiants

---

**Bon apprentissage ! 🚀**

