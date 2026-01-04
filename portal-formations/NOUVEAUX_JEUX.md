# 🎮 Nouveaux jeux interactifs - Guide

J'ai créé **3 nouveaux types de jeux** plus visuels et fun que le simple jeu de colonnes. Voici ce qui est disponible :

## 📋 Liste des nouveaux jeux

### 1. 🎯 ConnectionGame - Jeu de connexion avec lignes animées

**Type :** `connection`

**Description :** Un jeu où les étudiants connectent des éléments de deux colonnes avec des lignes animées qui s'affichent en temps réel. Les connexions correctes apparaissent en vert avec des effets visuels.

**Configuration :**
```json
{
  "gameType": "connection",
  "leftColumn": ["Élément 1", "Élément 2", "Élément 3"],
  "rightColumn": ["Correspondance 1", "Correspondance 2", "Correspondance 3"],
  "correctMatches": [
    { "left": 0, "right": 0 },
    { "left": 1, "right": 2 },
    { "left": 2, "right": 1 }
  ],
  "description": "Connectez les éléments correspondants",
  "instructions": "Cliquez sur un élément de gauche, puis sur son correspondant à droite"
}
```

**Caractéristiques :**
- ✨ Lignes animées avec courbes de Bézier
- 🎨 Effets visuels (ombres, animations)
- ✅ Feedback immédiat (vert = correct, rouge = incorrect)
- 📊 Statistiques en temps réel
- 🏆 Système de scoring

---

### 2. 🕐 TimelineGame - Jeu de timeline chronologique

**Type :** `timeline`

**Description :** Un jeu où les étudiants placent des événements dans l'ordre chronologique sur une timeline visuelle. Parfait pour apprendre les séquences, l'histoire, ou les processus.

**Configuration :**
```json
{
  "gameType": "timeline",
  "events": [
    "Événement 1",
    "Événement 2",
    "Événement 3",
    "Événement 4"
  ],
  "correctOrder": [0, 1, 2, 3],
  "description": "Placez les événements dans l'ordre chronologique",
  "instructions": "Cliquez sur un événement, puis sur un emplacement de la timeline"
}
```

**Caractéristiques :**
- 📅 Timeline visuelle avec ligne horizontale
- 🎯 Emplacements numérotés pour chaque étape
- ✅ Feedback visuel (vert = correct, rouge = incorrect)
- 🔄 Drag & drop ou clic pour placer
- 📊 Suivi du progrès

---

### 3. 📁 CategoryGame - Jeu de classification

**Type :** `category`

**Description :** Un jeu où les étudiants classent des items dans différentes catégories colorées. Idéal pour apprendre les classifications, les catégories, ou organiser des concepts.

**Configuration :**
```json
{
  "gameType": "category",
  "categories": [
    { "name": "Catégorie A", "color": "#3B82F6", "icon": "📦" },
    { "name": "Catégorie B", "color": "#10B981", "icon": "📚" },
    { "name": "Catégorie C", "color": "#F59E0B", "icon": "🎯" }
  ],
  "items": [
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5",
    "Item 6"
  ],
  "correctCategories": [
    { "item": "Item 1", "category": "Catégorie A" },
    { "item": "Item 2", "category": "Catégorie B" },
    { "item": "Item 3", "category": "Catégorie A" }
  ],
  "description": "Classifiez les items dans les bonnes catégories",
  "instructions": "Glissez-déposez les items dans les catégories appropriées"
}
```

**Caractéristiques :**
- 🎨 Catégories colorées avec icônes personnalisables
- 🖱️ Drag & drop fluide
- ✅ Feedback par item (vert = correct, rouge = incorrect)
- 📊 Compteur d'items par catégorie
- 🎯 Interface responsive et moderne

---

## 🚀 Comment utiliser ces jeux

### Dans l'éditeur de contenu

1. Créez un nouvel item de type `game`
2. Sélectionnez le `gameType` approprié (`connection`, `timeline`, ou `category`)
3. Configurez les données selon le format JSON ci-dessus
4. Enregistrez et testez !
5. **Notez l'ID de l'item** pour construire le lien d'accès

### 🔗 Accéder aux jeux

Une fois le jeu créé, vous pouvez y accéder de plusieurs façons :

#### Si le jeu est un **item** (type `game` dans la table `items`) :
```
/items/{itemId}
```
Remplacez `{itemId}` par l'ID de l'item dans la base de données.

**Exemple :** Si l'ID est `123e4567-e89b-12d3-a456-426614174000`, l'URL sera :
```
/items/123e4567-e89b-12d3-a456-426614174000
```

#### Si le jeu est dans un **chapitre** (type `game` dans la table `chapters`) :
```
/courses/{courseId}
```
ou
```
/programs/{programId}
```
Naviguez ensuite jusqu'au chapitre contenant le jeu dans la liste des chapitres.

#### Trouver l'ID d'un jeu dans la base de données :

**Pour un item :**
```sql
SELECT id, title, type FROM items 
WHERE type = 'game' 
  AND title ILIKE '%votre recherche%';
```

**Pour un chapitre :**
```sql
SELECT id, title, type FROM chapters 
WHERE type = 'game' 
  AND title ILIKE '%votre recherche%';
```

#### Via l'interface d'administration :

1. Allez dans `/admin/items` pour voir tous les items de type `game`
2. Cliquez sur un item pour voir son ID dans l'URL : `/admin/items/{itemId}`
3. L'URL d'accès pour les étudiants sera : `/items/{itemId}`

### Exemple complet pour ConnectionGame

```json
 
  "gameType": "column-matching",
  "leftColumn": [...],
  "rightColumn": [...],
  "correctMatches": [...]
}

// Après (connection) - même format !
{
  "gameType": "connection",
  "leftColumn": [...],
  "rightColumn": [...],
  "correctMatches": [...]
}
```

Le format des données est identique, seul le `gameType` change !

---

## 💡 Idées d'utilisation

### ConnectionGame
- Associer concepts théoriques
- Relier définitions et termes
- Connecter causes et effets
- Lier API endpoints et leurs fonctions

### TimelineGame
- Histoire chronologique
- Processus étape par étape
- Cycle de vie d'un projet
- Séquence d'opérations

### CategoryGame
- Classification de concepts
- Organisation par thèmes
- Tri par types
- Regroupement logique

---

---

## 📍 Résumé des liens d'accès

| Type de jeu | Format d'URL | Exemple |
|------------|-------------|---------|
| **Item de type game** | `/items/{itemId}` | `/items/123e4567-e89b-12d3-a456-426614174000` |
| **Chapitre de type game** | `/courses/{courseId}` puis naviguer au chapitre | `/courses/abc123` → Chapitre "Jeu de connexion" |
| **Jeu dans un programme** | `/programs/{programId}` puis naviguer au chapitre | `/programs/xyz789` → Chapitre "Jeu de timeline" |

### 🔍 Comment trouver l'ID d'un jeu

1. **Via l'interface admin** : `/admin/items` ou `/admin/chapters`
2. **Via SQL** : Utilisez les requêtes SQL ci-dessus
3. **Via l'URL** : L'ID apparaît dans l'URL après avoir cliqué sur un jeu dans l'admin

---

**Bon amusement avec ces nouveaux jeux ! 🎉**

