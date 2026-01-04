# Structure complète des jeux

Ce document décrit l'ossature complète requise pour chaque type de jeu dans l'application.

## 📋 Structure de base commune

Tous les jeux doivent respecter cette structure de base :

### Pour un Item de type "game"

```json
{
  "type": "game",
  "title": "Titre du jeu",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "matching",  // Type de jeu (requis)
    "description": "Description du jeu",  // Optionnel mais recommandé
    "instructions": "Instructions pour jouer"  // Optionnel mais recommandé
    // ... champs spécifiques selon le gameType
  }
}
```

### Pour un Chapitre de type "game"

```json
{
  "title": "Titre du jeu",
  "position": 0,
  "type": "game",
  "published": true,
  "game_content": {
    "gameType": "matching",  // Type de jeu (requis)
    "description": "Description du jeu",  // Optionnel mais recommandé
    "instructions": "Instructions pour jouer"  // Optionnel mais recommandé
    // ... champs spécifiques selon le gameType
  }
}
```

⚠️ **IMPORTANT** : Pour les chapitres, le contenu du jeu va dans `game_content`, PAS dans `content`.

---

## 🎮 Types de jeux disponibles

### 1. Matching (Association de cartes)

**gameType** : `"matching"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Associer les termes",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "matching",
    "description": "Associez chaque terme à sa définition",
    "instructions": "Cliquez sur une carte pour la retourner, puis trouvez sa paire",
    "pairs": [
      {
        "term": "REST",
        "definition": "Architecture stateless avec ressources HTTP"
      },
      {
        "term": "GraphQL",
        "definition": "Requêtes flexibles avec un seul endpoint"
      },
      {
        "term": "WebSocket",
        "definition": "Communication bidirectionnelle en temps réel"
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"matching"`
- ✅ `pairs`: Array d'objets avec `term` et `definition`

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 2. Column Matching (Association de colonnes)

**gameType** : `"column-matching"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Associer les colonnes",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "column-matching",
    "description": "Associez les éléments de la colonne gauche à ceux de la colonne droite",
    "instructions": "Glissez les éléments de la colonne gauche vers la colonne droite",
    "leftColumn": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "rightColumn": [
      "Récupérer une ressource",
      "Créer une ressource",
      "Mettre à jour une ressource",
      "Supprimer une ressource"
    ],
    "correctMatches": [
      { "left": 0, "right": 0 },
      { "left": 1, "right": 1 },
      { "left": 2, "right": 2 },
      { "left": 3, "right": 3 }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"column-matching"`
- ✅ `leftColumn`: Array de strings (éléments de gauche)
- ✅ `rightColumn`: Array de strings (éléments de droite)
- ✅ `correctMatches`: Array d'objets avec `left` (index) et `right` (index)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

**Note** : Les indices dans `correctMatches` commencent à 0.

---

### 3. Connection (Connexion avec lignes animées)

**gameType** : `"connection"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Connectez les éléments",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "connection",
    "description": "Connectez les éléments de deux colonnes avec des lignes animées",
    "instructions": "Cliquez sur un élément de gauche, puis sur son correspondant à droite",
    "leftColumn": [
      "GET /tasks",
      "POST /tasks",
      "PUT /tasks/{id}",
      "DELETE /tasks/{id}"
    ],
    "rightColumn": [
      "Récupère une liste",
      "Crée une ressource",
      "Met à jour complètement",
      "Supprime une ressource"
    ],
    "correctMatches": [
      { "left": 0, "right": 0 },
      { "left": 1, "right": 1 },
      { "left": 2, "right": 2 },
      { "left": 3, "right": 3 }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"connection"`
- ✅ `leftColumn`: Array de strings (éléments de gauche)
- ✅ `rightColumn`: Array de strings (éléments de droite)
- ✅ `correctMatches`: Array d'objets avec `left` (index) et `right` (index)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

**Note** : Même format que `column-matching`, mais avec des lignes animées et des effets visuels améliorés.

---

### 4. Timeline (Timeline chronologique)

**gameType** : `"timeline"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Timeline chronologique",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "timeline",
    "description": "Placez les événements dans l'ordre chronologique",
    "instructions": "Cliquez sur un événement, puis sur un emplacement de la timeline",
    "events": [
      "Événement 1",
      "Événement 2",
      "Événement 3",
      "Événement 4"
    ],
    "correctOrder": [0, 1, 2, 3]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"timeline"`
- ✅ `events`: Array de strings (événements à placer)
- ✅ `correctOrder`: Array de numbers (ordre correct, indices 0-based)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

**Note** : `correctOrder` peut être un array d'indices `[0, 1, 2, 3]` ou un array d'objets `[{text: "...", order: 0}]`.

---

### 5. Category (Classification par catégories)

**gameType** : `"category"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Classification",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "category",
    "description": "Classez les items dans les bonnes catégories",
    "instructions": "Glissez-déposez les items dans les catégories appropriées",
    "categories": [
      {
        "name": "Catégorie A",
        "color": "#3B82F6",
        "icon": "📦"
      },
      {
        "name": "Catégorie B",
        "color": "#10B981",
        "icon": "📚"
      }
    ],
    "items": [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4"
    ],
    "correctCategories": [
      { "item": "Item 1", "category": "Catégorie A" },
      { "item": "Item 2", "category": "Catégorie B" },
      { "item": "Item 3", "category": "Catégorie A" },
      { "item": "Item 4", "category": "Catégorie B" }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"category"`
- ✅ `categories`: Array d'objets avec :
  - `name`: string (nom de la catégorie)
  - `color`: string (couleur hex, ex: "#3B82F6")
  - `icon`: string (optionnel, emoji ou icône)
- ✅ `items`: Array de strings (items à classer)
- ✅ `correctCategories`: Array d'objets avec :
  - `item`: string (nom de l'item) ou number (index)
  - `category`: string (nom de la catégorie) ou number (index)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 6. API Types (Choix de type d'API)

**gameType** : `"api-types"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Quel type d'API utiliser ?",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "api-types",
    "description": "Choisissez le bon type d'API pour chaque scénario",
    "instructions": "Glissez le type d'API approprié pour chaque scénario",
    "apiTypes": [
      {
        "id": "rest",
        "name": "REST API",
        "color": "bg-blue-500",
        "description": "Architecture stateless avec ressources HTTP"
      },
      {
        "id": "graphql",
        "name": "GraphQL",
        "color": "bg-pink-500",
        "description": "Requêtes flexibles avec un seul endpoint"
      },
      {
        "id": "websocket",
        "name": "WebSocket",
        "color": "bg-green-500",
        "description": "Communication bidirectionnelle en temps réel"
      },
      {
        "id": "grpc",
        "name": "gRPC",
        "color": "bg-purple-500",
        "description": "RPC haute performance avec Protocol Buffers"
      }
    ],
    "scenarios": [
      {
        "id": 1,
        "text": "Application de chat en temps réel",
        "correctType": "websocket",
        "explanation": "Les chats nécessitent une communication bidirectionnelle en temps réel."
      },
      {
        "id": 2,
        "text": "API publique pour un site e-commerce",
        "correctType": "rest",
        "explanation": "REST est idéal pour les APIs publiques avec des ressources bien définies."
      },
      {
        "id": 3,
        "text": "Application mobile avec besoins de données flexibles",
        "correctType": "graphql",
        "explanation": "GraphQL permet de récupérer exactement les données nécessaires."
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"api-types"`
- ✅ `apiTypes`: Array d'objets avec :
  - `id`: string (identifiant unique)
  - `name`: string (nom affiché)
  - `color`: string (classe Tailwind CSS, ex: "bg-blue-500")
  - `description`: string (description du type d'API)
- ✅ `scenarios`: Array d'objets avec :
  - `id`: number (identifiant unique)
  - `text`: string (texte du scénario)
  - `correctType`: string (id du type d'API correct)
  - `explanation`: string (explication de la réponse)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 7. Format Files (Formats JSON/XML/Protobuf)

**gameType** : `"format-files"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Formats de fichiers",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "format-files",
    "description": "Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf",
    "instructions": "Répondez aux questions pour progresser dans les niveaux",
    "levels": [
      {
        "level": 1,
        "name": "Découverte",
        "questions": [
          {
            "id": "q1-1",
            "type": "identify-format",
            "prompt": "Quel est ce format de données ?",
            "snippet": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
            "options": ["JSON", "XML", "Protobuf"],
            "answer": "JSON",
            "explanation": "C'est du JSON : les accolades {} et les guillemets doubles indiquent ce format.",
            "difficulty": 1
          },
          {
            "id": "q1-2",
            "type": "json-valid",
            "prompt": "Ce JSON est-il valide ?",
            "snippet": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
            "answer": true,
            "explanation": "Oui, c'est un JSON valide avec une syntaxe correcte.",
            "difficulty": 1
          }
        ]
      },
      {
        "level": 2,
        "name": "Intermédiaire",
        "questions": [
          {
            "id": "q2-1",
            "type": "fix-json-mcq",
            "prompt": "Quelle est la correction de ce JSON ?",
            "snippet": "{\n  name: \"John\",\n  age: 30\n}",
            "options": [
              "{\"name\": \"John\", \"age\": 30}",
              "{name: \"John\", age: 30}",
              "{\"name\": \"John\", \"age\": 30}"
            ],
            "answer": "{\"name\": \"John\", \"age\": 30}",
            "explanation": "En JSON, les clés doivent être entre guillemets doubles.",
            "difficulty": 2
          }
        ]
      },
      {
        "level": 3,
        "name": "Avancé",
        "questions": [
          {
            "id": "q3-1",
            "type": "fix-json-editor",
            "prompt": "Corrigez ce JSON dans l'éditeur :",
            "snippet": "{\n  \"users\": [\n    {\"name\": \"John\", \"age\": 30}\n    {\"name\": \"Jane\", \"age\": 25}\n  ]\n}",
            "answer": "{\n  \"users\": [\n    {\"name\": \"John\", \"age\": 30},\n    {\"name\": \"Jane\", \"age\": 25}\n  ]\n}",
            "explanation": "Il manque une virgule entre les deux objets du tableau.",
            "difficulty": 3
          }
        ]
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"format-files"`
- ✅ `levels`: Array d'objets avec :
  - `level`: number (numéro du niveau, 1, 2, 3...)
  - `name`: string (nom du niveau)
  - `questions`: Array d'objets question

**Structure d'une question** :

Chaque question doit avoir :
- ✅ `id`: string (identifiant unique)
- ✅ `type`: string - un des types suivants :
  - `"identify-format"` : Identifier le format (JSON/XML/Protobuf)
  - `"json-valid"` : Vérifier si le JSON est valide (réponse booléenne)
  - `"fix-json-mcq"` : Corriger le JSON (choix multiples)
  - `"fix-json-editor"` : Corriger le JSON dans un éditeur
  - `"choose-format"` : Choisir le format approprié
- ✅ `prompt`: string (question posée)
- ✅ `answer`: string | boolean (réponse correcte)
- ✅ `explanation`: string (explication de la réponse)
- ✅ `difficulty`: number (niveau de difficulté, 1-3)

**Champs optionnels selon le type de question** :
- `snippet`: string (code à analyser) - requis pour la plupart des types
- `options`: Array<string> (options de réponse) - requis pour `identify-format` et `fix-json-mcq`

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 8. JSON File Types (Nouveau type)

**gameType** : `"json-file-types"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Types de fichiers JSON",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "json-file-types",
    "description": "Identifiez le type de fichier JSON",
    "instructions": "Regardez le contenu et choisissez le type de fichier",
    "fileTypes": [
      {
        "id": "package.json",
        "name": "package.json",
        "description": "Fichier de configuration npm",
        "color": "bg-red-500"
      },
      {
        "id": "tsconfig.json",
        "name": "tsconfig.json",
        "description": "Configuration TypeScript",
        "color": "bg-blue-500"
      }
    ],
    "examples": [
      {
        "id": 1,
        "content": "{\n  \"name\": \"my-app\",\n  \"version\": \"1.0.0\"\n}",
        "correctType": "package.json",
        "explanation": "Ce contenu correspond à un package.json avec name et version."
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"json-file-types"`
- ✅ `fileTypes`: Array d'objets avec `id`, `name`, `description`, `color`
- ✅ `examples`: Array d'objets avec `id`, `content`, `correctType`, `explanation`

---

## ✅ Checklist de validation

Pour qu'un jeu soit complet et fonctionnel, vérifiez :

### Structure de base
- [ ] `type` = `"game"` (pour un item) ou `type` = `"game"` dans le chapitre
- [ ] `title` présent et non vide
- [ ] `position` défini (number)
- [ ] `published` = `true` (ou omis, par défaut `true`)

### Contenu du jeu
- [ ] `gameType` présent et valide (matching, column-matching, connection, timeline, category, api-types, format-files, json-file-types)
- [ ] Tous les champs requis pour le `gameType` sont présents
- [ ] Les arrays requis ne sont pas vides (pairs, levels, apiTypes, scenarios, etc.)
- [ ] Les indices dans `correctMatches` sont valides (0-indexed)
- [ ] Les `id` dans les questions/scénarios sont uniques

### Pour les chapitres
- [ ] `game_content` contient le jeu (PAS `content`)
- [ ] `game_content.gameType` est défini
- [ ] Structure du jeu directement dans `game_content` (pas imbriquée)

### Pour les items
- [ ] `content.gameType` est défini
- [ ] Structure du jeu directement dans `content` (pas imbriquée)

---

## 📝 Exemples complets par contexte

### Exemple : Jeu dans un Item

```json
{
  "type": "game",
  "title": "Jeu : Associer les termes API",
  "position": 1,
  "published": true,
  "content": {
    "gameType": "matching",
    "description": "Associez chaque terme à sa définition",
    "instructions": "Cliquez sur les cartes pour les retourner",
    "pairs": [
      { "term": "REST", "definition": "Architecture stateless" },
      { "term": "GraphQL", "definition": "Requêtes flexibles" }
    ]
  }
}
```

### Exemple : Jeu dans un Chapitre

```json
{
  "title": "Jeu : Associer les termes API",
  "position": 1,
  "type": "game",
  "published": true,
  "game_content": {
    "gameType": "matching",
    "description": "Associez chaque terme à sa définition",
    "instructions": "Cliquez sur les cartes pour les retourner",
    "pairs": [
      { "term": "REST", "definition": "Architecture stateless" },
      { "term": "GraphQL", "definition": "Requêtes flexibles" }
    ]
  }
}
```

---

## 🚨 Erreurs courantes à éviter

1. ❌ Mettre `game_content` dans un item (utiliser `content` à la place)
2. ❌ Mettre `content` dans un chapitre de type game (utiliser `game_content`)
3. ❌ Imbriquer la structure : `game_content.game_content.gameType` (structure plate requise)
4. ❌ Oublier `gameType` (champ requis)
5. ❌ Arrays vides dans les champs requis (pairs, levels, etc.)
6. ❌ Indices incorrects dans `correctMatches` (doivent être 0-indexed)
7. ❌ `id` dupliqués dans les questions/scénarios

---

## 🔗 Accéder aux jeux

Une fois un jeu créé, vous pouvez y accéder de plusieurs façons :

### Si le jeu est un **item** (table `items`)

**URL d'accès :**
```
/items/{itemId}
```

**Exemple :**
```
/items/123e4567-e89b-12d3-a456-426614174000
```

**Trouver l'ID :**
```sql
SELECT id, title, type FROM items 
WHERE type = 'game' 
  AND title ILIKE '%votre recherche%';
```

### Si le jeu est dans un **chapitre** (table `chapters`)

**URL d'accès :**
```
/courses/{courseId}
```
ou
```
/programs/{programId}
```

Naviguez ensuite jusqu'au chapitre contenant le jeu dans la liste des chapitres.

**Trouver l'ID :**
```sql
SELECT id, title, type FROM chapters 
WHERE type = 'game' 
  AND title ILIKE '%votre recherche%';
```

### Via l'interface d'administration

1. Allez dans `/admin/items` pour voir tous les items de type `game`
2. Ou allez dans `/admin/chapters` pour voir tous les chapitres de type `game`
3. Cliquez sur un jeu pour voir son ID dans l'URL : `/admin/items/{itemId}` ou `/admin/chapters/{chapterId}`
4. L'URL d'accès pour les étudiants sera : `/items/{itemId}` ou via le cours/programme

### Tableau récapitulatif

| Type | Table | URL d'accès | Comment trouver l'ID |
|------|-------|-------------|---------------------|
| Item game | `items` | `/items/{itemId}` | SQL : `SELECT id FROM items WHERE type = 'game'` |
| Chapitre game | `chapters` | `/courses/{courseId}` → naviguer au chapitre | SQL : `SELECT id FROM chapters WHERE type = 'game'` |

---

## 📚 Ressources supplémentaires

- `GUIDE-FORMAT-JEU-CHAPITRE.md` : Guide détaillé pour les chapitres
- `FORMATS-JSON.md` : Documentation complète des formats JSON
- `exemples-chapitres-jeux.json` : Exemples complets de tous les types
- `GUIDE-AJOUT-NOUVEAU-JEU.md` : Comment ajouter un nouveau type de jeu
- `exemples-jeux/README-JEUX-API.md` : Exemples de jeux pour l'apprentissage des APIs

