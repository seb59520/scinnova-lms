# QUERY BUILDER » GraphQL (Drag & Drop de champs) ⭐

## 📋 Description

Le GraphQL Query Builder est un exercice interactif qui permet aux apprenants de construire des requêtes GraphQL en glissant-déposant des champs depuis un schéma. C'est un outil pédagogique pour apprendre GraphQL de manière visuelle et pratique.

## 🎯 Objectifs pédagogiques

- **Comprendre GraphQL** : Apprendre la structure des requêtes GraphQL
- **Schéma GraphQL** : Visualiser et comprendre les relations entre types
- **Optimisation** : Apprendre à ne sélectionner que les champs nécessaires
- **Relations** : Comprendre les relations entre objets (User → Order → Product)
- **Validation** : Identifier les erreurs de requête (champs impossibles, types incorrects)

## 🎨 Interface

L'exercice propose 3 zones principales :

1. **📊 Schéma GraphQL (Gauche)** : Affiche le schéma avec tous les types et champs disponibles
2. **🔨 Zone de construction (Centre)** : Zone où l'apprenant construit sa requête en drag & drop
3. **👁️ Preview (Droite)** : Affiche la requête GraphQL générée et le résultat JSON simulé

## 🧩 Fonctionnalités

- ✅ **Drag & Drop intuitif** : Glissez les champs depuis le schéma vers la requête
- ✅ **Validation en temps réel** : Les champs impossibles sont rejetés
- ✅ **Preview GraphQL** : Visualisez la requête générée
- ✅ **Résultat JSON simulé** : Voyez le résultat de votre requête
- ✅ **Scénarios multiples** : Plusieurs scénarios d'entraînement
- ✅ **Optimisation** : Score basé sur le nombre de champs sélectionnés
- ✅ **Relations imbriquées** : Construisez des requêtes complexes avec plusieurs niveaux

## 📥 Import dans le système

### Option 1 : Import via l'interface d'administration

1. Allez dans **Admin** → **Cours** → Sélectionnez ou créez un cours
2. Cliquez sur **"+ Élément"** dans un module
3. Sélectionnez le type **"Jeu"**
4. Copiez le contenu du fichier `exercice-graphql-query-builder.json`
5. Collez-le dans l'éditeur JSON
6. Sauvegardez

### Option 2 : Import direct dans un module

```json
{
  "modules": [
    {
      "items": [
        {
          "type": "game",
          "title": "QUERY BUILDER » GraphQL",
          "content": {
            "gameType": "graphql-query-builder",
            // ... configuration
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
  "title": "QUERY BUILDER » GraphQL",
  "content": {
    "gameType": "graphql-query-builder",
    "description": "Description de l'exercice",
    "instructions": "Instructions détaillées",
    "scenarios": [...],
    "schema": {
      "queryType": "Query",
      "types": [...]
    }
  }
}
```

### Schéma GraphQL

Le schéma doit définir :
- **Query** : Les champs racine de la requête
- **Types** : Tous les types d'objets (User, Order, Product, etc.)
- **Relations** : Les champs qui pointent vers d'autres types

Exemple :

```json
{
  "schema": {
    "queryType": "Query",
    "types": [
      {
        "name": "Query",
        "kind": "OBJECT",
        "fields": [
          {
            "id": "user",
            "name": "user",
            "type": "User",
            "isRequired": false,
            "isList": false,
            "args": [
              { "name": "id", "type": "ID!", "defaultValue": null }
            ],
            "fields": [
              { "id": "id", "name": "id", "type": "ID", "isRequired": true, "isList": false },
              { "id": "name", "name": "name", "type": "String", "isRequired": true, "isList": false }
            ]
          }
        ]
      },
      {
        "name": "User",
        "kind": "OBJECT",
        "fields": [
          { "id": "id", "name": "id", "type": "ID", "isRequired": true, "isList": false },
          { "id": "name", "name": "name", "type": "String", "isRequired": true, "isList": false },
          {
            "id": "orders",
            "name": "orders",
            "type": "Order",
            "isRequired": false,
            "isList": true
          }
        ]
      }
    ]
  }
}
```

### Scénarios

Chaque scénario définit un objectif d'apprentissage :

```json
{
  "scenarios": [
    {
      "id": "scenario-1",
      "title": "Scénario 1 : Informations utilisateur",
      "description": "Récupérez les informations de base d'un utilisateur",
      "objective": "Construire une requête pour récupérer le nom et l'email d'un utilisateur",
      "expectedFields": ["user", "name", "email"],
      "maxCost": 3
    }
  ]
}
```

**Propriétés des scénarios :**
- `id` : Identifiant unique du scénario
- `title` : Titre affiché dans l'interface
- `description` : Description du scénario
- `objective` : Objectif pédagogique
- `expectedFields` : Liste des champs attendus (pour validation)
- `maxCost` : Nombre maximum de champs recommandé (pour optimisation)

## 🎓 Utilisation pédagogique

### Avant l'exercice

- Réviser les concepts GraphQL (requêtes, schéma, types)
- Expliquer la différence avec REST
- Présenter la structure d'une requête GraphQL
- Montrer des exemples de requêtes simples

### Pendant l'exercice

- Laisser les apprenants explorer librement
- Encourager la construction de requêtes complexes
- Rappeler l'importance de l'optimisation (ne sélectionner que les champs nécessaires)
- Guider vers l'exécution pour voir le résultat

### Après l'exercice

- Discuter des requêtes construites
- Expliquer pourquoi certaines requêtes sont valides/invalides
- Montrer comment optimiser les requêtes
- Comparer avec les requêtes REST équivalentes

## ✅ Règles de validation

Le système valide automatiquement les requêtes :

### Règles de base

1. **Champs de Query** : Doivent commencer par un champ de Query (user, users, etc.)
2. **Types objets** : Les champs de type objet doivent avoir au moins un sous-champ
3. **Relations** : Les champs ne peuvent être ajoutés que s'ils existent dans le type parent
4. **Arguments** : Les arguments requis doivent être fournis

### Validation visuelle

- **Champs valides** : S'affichent normalement
- **Champs impossibles** : Sont rejetés lors du drag & drop
- **Requête incomplète** : Affiche des erreurs lors de l'exécution

## 💡 Exemples de scénarios

### Scénario 1 : Informations utilisateur

**Objectif** : Récupérer le nom et l'email d'un utilisateur

**Requête attendue** :
```graphql
query {
  user(id: "42") {
    name
    email
  }
}
```

### Scénario 2 : Commandes utilisateur

**Objectif** : Récupérer les commandes d'un utilisateur avec leur total

**Requête attendue** :
```graphql
query {
  user(id: "42") {
    name
    orders {
      id
      total
    }
  }
}
```

### Scénario 3 : Dernières commandes

**Objectif** : Récupérer les 3 dernières commandes avec détails

**Requête attendue** :
```graphql
query {
  user(id: "42") {
    name
    orders(limit: 3) {
      id
      total
      date
    }
  }
}
```

### Scénario 4 : Détails produits

**Objectif** : Récupérer les produits dans les commandes

**Requête attendue** :
```graphql
query {
  user(id: "42") {
    orders {
      items {
        product {
          name
          price
        }
      }
    }
  }
}
```

## 🔄 Extensions possibles

Vous pouvez étendre l'exercice en ajoutant :

1. **Mutations** : Ajouter des mutations GraphQL (createUser, updateOrder, etc.)
2. **Fragments** : Support des fragments GraphQL
3. **Variables** : Gestion des variables de requête
4. **Directives** : Support des directives (@include, @skip, etc.)
5. **Subscriptions** : Ajouter des subscriptions GraphQL

## 🐛 Dépannage

### Le jeu ne s'affiche pas

1. Vérifiez que `gameType: "graphql-query-builder"` est présent
2. Vérifiez que le JSON est valide
3. Vérifiez que le schéma est correctement formaté

### Les champs ne se déplacent pas

1. Vérifiez que JavaScript est activé
2. Vérifiez que les événements de drag & drop ne sont pas bloqués
3. Testez dans un autre navigateur

### La requête ne s'exécute pas

1. Vérifiez que tous les champs de type objet ont des sous-champs
2. Vérifiez que les arguments requis sont fournis
3. Consultez les messages d'erreur affichés

## 📚 Ressources complémentaires

- [GraphQL Documentation](https://graphql.org/learn/)
- [GraphQL Queries](https://graphql.org/learn/queries/)
- [GraphQL Schema](https://graphql.org/learn/schema/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

## 🎯 Fichiers disponibles

- `exercice-graphql-query-builder.json` : Exercice avec 5 scénarios de base
- `exercice-graphql-advanced.json` : Exercice avec 3 scénarios avancés

## 💡 Conseils pour créer vos propres scénarios

1. **Commencez simple** : Créez des scénarios avec 2-3 champs au début
2. **Progressez** : Ajoutez des relations imbriquées progressivement
3. **Optimisation** : Encouragez l'optimisation avec `maxCost`
4. **Contexte métier** : Utilisez des exemples concrets (e-commerce, blog, etc.)

