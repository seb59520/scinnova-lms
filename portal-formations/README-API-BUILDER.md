# API BUILDER – Constructeur de routes REST avec Drag & Drop

## 📋 Description

L'API Builder est un exercice interactif qui permet aux apprenants de construire des routes REST en glissant-déposant des blocs visuels. C'est un outil pédagogique pour apprendre les conventions REST de manière visuelle et ludique.

## 🎯 Objectifs pédagogiques

- **Modélisation REST** : Comprendre comment structurer des routes REST
- **Uniformité** : Apprendre les conventions de nommage et de structure
- **Lecture visuelle d'une API** : Visualiser une API complète d'un coup d'œil
- **Validation REST** : Identifier les bonnes pratiques et anti-patterns

## 🧱 Éléments graphiques

L'exercice propose 4 types de blocs :

1. **🧱 Blocs Ressource** (Bleu) : User, Order, Product, Book, Author, etc.
2. **🔧 Blocs Verbe HTTP** (Vert) : GET, POST, PUT, PATCH, DELETE
3. **🎯 Blocs Endpoint** (Violet) : `/users`, `/users/{id}`, `/orders`, etc.
4. **🏷️ Blocs Status Code** (Orange) : 200, 201, 204, 400, 404, 500

## 🎨 Feedback visuel

Le système de validation REST fournit un feedback en temps réel :

- **🟢 Vert** → Route REST valide (conforme aux bonnes pratiques)
- **🟠 Orange** → Route REST acceptable (fonctionne mais peut être améliorée)
- **🔴 Rouge** → Anti-pattern REST détecté (violation des conventions)

## 📥 Import dans le système

### Option 1 : Import via l'interface d'administration

1. Allez dans **Admin** → **Cours** → Sélectionnez ou créez un cours
2. Cliquez sur **"+ Élément"** dans un module
3. Sélectionnez le type **"Jeu"**
4. Copiez le contenu du fichier `exercice-api-builder.json`
5. Collez-le dans l'éditeur JSON
6. Sauvegardez

### Option 2 : Import direct dans un module

Ajoutez l'exercice dans le tableau `items` d'un module :

```json
{
  "modules": [
    {
      "items": [
        {
          "type": "game",
          "title": "API BUILDER – Drag & Drop ⭐",
          "position": 0,
          "published": true,
          "content": {
            "gameType": "api-builder",
            "description": "Construisez des routes REST...",
            "instructions": "1. Glissez-déposez les blocs...",
            // ... configuration complète
          }
        }
      ]
    }
  ]
}
```

## ⚙️ Configuration

### Structure de base

```json
{
  "type": "game",
  "title": "API BUILDER – Drag & Drop ⭐",
  "content": {
    "gameType": "api-builder",
    "description": "Description de l'exercice",
    "instructions": "Instructions détaillées",
    "resources": [...],
    "verbs": [...],
    "endpoints": [...],
    "statusCodes": [...],
    "correctRoutes": [...] // Optionnel
  }
}
```

### Exemple de configuration complète

```json
{
  "gameType": "api-builder",
  "description": "Construisez des routes REST pour un système de bibliothèque",
  "instructions": "Créez les routes CRUD pour les livres et les auteurs",
  "resources": [
    { "id": "book", "label": "Book", "value": "books" },
    { "id": "author", "label": "Author", "value": "authors" }
  ],
  "verbs": [
    { "id": "get", "label": "GET", "value": "GET" },
    { "id": "post", "label": "POST", "value": "POST" },
    { "id": "put", "label": "PUT", "value": "PUT" },
    { "id": "delete", "label": "DELETE", "value": "DELETE" }
  ],
  "endpoints": [
    { "id": "books-collection", "label": "/books", "value": "/books" },
    { "id": "books-item", "label": "/books/{id}", "value": "/books/{id}" },
    { "id": "authors-collection", "label": "/authors", "value": "/authors" },
    { "id": "authors-item", "label": "/authors/{id}", "value": "/authors/{id}" }
  ],
  "statusCodes": [
    { "id": "200", "label": "200 OK", "value": "200" },
    { "id": "201", "label": "201 Created", "value": "201" },
    { "id": "204", "label": "204 No Content", "value": "204" },
    { "id": "404", "label": "404 Not Found", "value": "404" }
  ],
  "correctRoutes": [
    {
      "resource": "books",
      "verb": "GET",
      "endpoint": "/books",
      "status": "200"
    },
    {
      "resource": "books",
      "verb": "POST",
      "endpoint": "/books",
      "status": "201"
    }
  ]
}
```

## ✅ Règles de validation REST

Le système valide automatiquement les routes selon les conventions REST :

### Routes valides (🟢)

- **GET** sur collection → **200 OK**
- **GET** sur item → **200 OK**
- **POST** sur collection → **201 Created**
- **PUT** sur item → **200 OK** ou **204 No Content**
- **DELETE** sur item → **204 No Content** ou **200 OK**

### Routes acceptables (🟠)

- **POST** avec **200 OK** au lieu de **201 Created** (fonctionne mais moins sémantique)
- **PUT** avec **201 Created** (peu commun mais possible)

### Anti-patterns (🔴)

- **GET** avec **201**, **204**, **400** (sauf **404** pour item non trouvé)
- **POST** sur item (devrait être sur collection)
- **DELETE** sur collection (devrait être sur item)
- **PUT** sur collection (devrait être sur item)
- Endpoint ne correspondant pas à la ressource

## 🎓 Utilisation pédagogique

### Avant l'exercice

- Réviser les principes REST
- Expliquer les conventions de nommage (ressources au pluriel)
- Présenter les méthodes HTTP et leurs usages
- Montrer des exemples de routes REST valides

### Pendant l'exercice

- Laisser les apprenants explorer librement
- Encourager la construction de plusieurs routes
- Rappeler les bonnes pratiques REST
- Guider vers la validation pour voir le feedback

### Après l'exercice

- Discuter des routes construites
- Expliquer pourquoi certaines routes sont valides/invalides
- Proposer des variantes (gestion des erreurs, pagination, etc.)
- Montrer comment ces routes s'intègrent dans une API complète

## 🔄 Extensions possibles

Vous pouvez étendre l'exercice en ajoutant :

1. **Gestion des erreurs** : Routes avec codes 400, 404, 500
2. **Relations** : Routes imbriquées (`/books/{id}/authors`)
3. **Actions personnalisées** : Routes comme `/books/{id}/publish`
4. **Filtres et pagination** : Routes avec query parameters
5. **Versioning** : Routes avec `/v1/`, `/v2/`

## 📊 Fonctionnalités

- ✅ Drag & drop intuitif
- ✅ Validation REST en temps réel
- ✅ Feedback visuel (vert/orange/rouge)
- ✅ **Support de plusieurs routes simultanées** - Créez autant de routes que nécessaire dans le même exercice
- ✅ Ajout/suppression de routes dynamiques
- ✅ **Compteur de progression** - Affiche le nombre de routes créées vs attendues
- ✅ Validation par règles REST ou par routes correctes prédéfinies
- ✅ Interface responsive (mobile/tablette/desktop)

## 🐛 Dépannage

### Le jeu ne s'affiche pas

1. Vérifiez que `gameType: "api-builder"` est présent
2. Vérifiez que le JSON est valide
3. Vérifiez la console du navigateur pour les erreurs

### Les blocs ne se déplacent pas

1. Vérifiez que JavaScript est activé
2. Vérifiez que les événements de drag & drop ne sont pas bloqués
3. Testez dans un autre navigateur

### La validation ne fonctionne pas

1. Vérifiez que tous les slots sont remplis (Ressource + Verbe + Endpoint + Status)
2. Vérifiez que les types de blocs correspondent aux slots
3. Cliquez sur "Valider les routes" pour voir le feedback

## 📚 Ressources complémentaires

- [REST API Tutorial](https://restfulapi.net/)
- [HTTP Methods](https://developer.mozilla.org/fr/docs/Web/HTTP/Methods)
- [RESTful API Design](https://restfulapi.net/rest-api-design-tutorial-with-example/)
- [HTTP Status Codes](https://developer.mozilla.org/fr/docs/Web/HTTP/Status)

## 💡 Exemples d'utilisation

### Exercice 1 : CRUD basique (5 routes)

Demandez aux apprenants de créer les routes CRUD pour une ressource "Product" :
- GET /products (liste)
- GET /products/{id} (détail)
- POST /products (création)
- PUT /products/{id} (mise à jour)
- DELETE /products/{id} (suppression)

**Fichier** : `exercice-api-builder-multi-routes.json`

### Exercice 2 : API E-commerce complète (12 routes)

Demandez aux apprenants de construire une API complète pour un système e-commerce avec plusieurs ressources :
- Products (5 routes CRUD)
- Orders (5 routes CRUD)
- Customers (2 routes GET)

**Fichier** : `exercice-api-builder-ecommerce.json`

### Exercice 3 : Identifier les anti-patterns

Pré-remplissez des routes avec des erreurs et demandez aux apprenants de les corriger.

### Exercice 4 : API complète multi-ressources

Demandez aux apprenants de construire une API complète pour un système de bibliothèque avec Books, Authors, et Loans.

