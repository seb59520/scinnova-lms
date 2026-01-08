# Solutions - GraphQL Query Builder

## 📋 Solutions pour les scénarios

Ce document contient les solutions attendues pour chaque scénario de l'exercice GraphQL Query Builder.

---

## Scénario 1 : Informations utilisateur

**Objectif** : Construire une requête pour récupérer le nom et l'email d'un utilisateur avec l'ID '42'

### Solution attendue

```graphql
query {
  user(id: "42") {
    name
    email
  }
}
```

### Explication

- Commencez par le champ `user` de Query (avec l'argument `id: "42"`)
- Ajoutez les champs scalaires `name` et `email` du type `User`
- Ne sélectionnez que les champs nécessaires (optimisation)

### Résultat JSON simulé

```json
{
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Champs attendus
- `user` (champ racine)
- `name` (champ du type User)
- `email` (champ du type User)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Champs manquants : -20 points par champ
- ⚠️ Champs supplémentaires : -5 points par champ (si maxCost défini)

---

## Scénario 2 : Commandes utilisateur

**Objectif** : Construire une requête pour récupérer le nom d'un utilisateur et ses commandes (ID et total)

### Solution attendue

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

### Explication

- Commencez par `user(id: "42")`
- Ajoutez `name` (champ scalaire)
- Ajoutez `orders` (relation vers Order)
- Dans `orders`, ajoutez `id` et `total` (champs scalaires)

### Résultat JSON simulé

```json
{
  "user": {
    "name": "John Doe",
    "orders": [
      {
        "id": "1",
        "total": 99.99
      },
      {
        "id": "2",
        "total": 149.50
      }
    ]
  }
}
```

### Champs attendus
- `user`
- `name`
- `orders`
- `id` (dans orders)
- `total` (dans orders)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Champs manquants : -20 points par champ

---

## Scénario 3 : Dernières commandes

**Objectif** : Construire une requête pour récupérer le nom d'un utilisateur et ses 3 dernières commandes (ID, total, date)

### Solution attendue

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

### Explication

- Commencez par `user(id: "42")`
- Ajoutez `name`
- Ajoutez `orders(limit: 3)` avec l'argument `limit: 3`
- Dans `orders`, ajoutez `id`, `total`, et `date`

### Résultat JSON simulé

```json
{
  "user": {
    "name": "John Doe",
    "orders": [
      {
        "id": "1",
        "total": 99.99,
        "date": "2024-01-15"
      },
      {
        "id": "2",
        "total": 149.50,
        "date": "2024-01-10"
      },
      {
        "id": "3",
        "total": 79.99,
        "date": "2024-01-05"
      }
    ]
  }
}
```

### Champs attendus
- `user`
- `name`
- `orders`
- `id` (dans orders)
- `total` (dans orders)
- `date` (dans orders)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Argument `limit` manquant : -10 points
- ⚠️ Champs manquants : -20 points par champ

---

## Scénario 4 : Détails produits

**Objectif** : Construire une requête pour récupérer les commandes d'un utilisateur avec les items et les produits associés

### Solution attendue

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

### Explication

- Commencez par `user(id: "42")`
- Ajoutez `orders` (relation)
- Dans `orders`, ajoutez `items` (relation vers OrderItem)
- Dans `items`, ajoutez `product` (relation vers Product)
- Dans `product`, ajoutez `name` et `price` (champs scalaires)

### Résultat JSON simulé

```json
{
  "user": {
    "orders": [
      {
        "items": [
          {
            "product": {
              "name": "Laptop",
              "price": 999.99
            }
          },
          {
            "product": {
              "name": "Mouse",
              "price": 29.99
            }
          }
        ]
      }
    ]
  }
}
```

### Champs attendus
- `user`
- `orders`
- `items`
- `product`
- `name` (dans product)
- `price` (dans product)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Champs manquants : -20 points par champ
- ⚠️ Trop de champs : -5 points par champ supplémentaire (si maxCost défini)

---

## Scénario 5 : Liste utilisateurs

**Objectif** : Construire une requête pour récupérer une liste de 10 utilisateurs avec leur nom et email

### Solution attendue

```graphql
query {
  users(limit: 10) {
    name
    email
  }
}
```

### Explication

- Utilisez le champ `users` de Query (liste)
- Ajoutez l'argument `limit: 10` pour limiter à 10 utilisateurs
- Ajoutez les champs `name` et `email` du type `User`

### Résultat JSON simulé

```json
{
  "users": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    // ... 8 autres utilisateurs
  ]
}
```

### Champs attendus
- `users` (champ racine)
- `name` (dans users)
- `email` (dans users)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Argument `limit` manquant : -10 points
- ⚠️ Champs manquants : -20 points par champ

---

## Scénarios avancés

### Scénario avancé 1 : Optimisation - Champs minimaux

**Objectif** : Construire une requête optimisée pour récupérer uniquement le nom d'un utilisateur et l'ID de ses commandes

### Solution attendue

```graphql
query {
  user(id: "42") {
    name
    orders {
      id
    }
  }
}
```

### Explication

- Ne sélectionnez que les champs strictement nécessaires
- Évitez les champs inutiles comme `email`, `total`, `date`, etc.
- Optimisation : 4 champs au total (maxCost: 4)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Champs supplémentaires : -5 points par champ au-delà de maxCost

---

### Scénario avancé 2 : Requête complète - E-commerce

**Objectif** : Construire une requête complète pour récupérer un utilisateur avec ses commandes, les items de chaque commande, et les détails des produits

### Solution attendue

```graphql
query {
  user(id: "42") {
    name
    orders {
      id
      total
      date
      items {
        quantity
        product {
          name
          price
        }
      }
    }
  }
}
```

### Explication

- Requête complète avec tous les niveaux de relations
- User → Orders → Items → Product
- Tous les champs pertinents sélectionnés

### Champs attendus
- `user`, `name`, `orders`, `id`, `total`, `date`, `items`, `quantity`, `product`, `name`, `price`

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Champs manquants : -20 points par champ

---

### Scénario avancé 3 : Liste avec filtres

**Objectif** : Construire une requête pour récupérer une liste de 5 utilisateurs avec leur nom et email

### Solution attendue

```graphql
query {
  users(limit: 5) {
    name
    email
  }
}
```

### Explication

- Utilisez `users` avec l'argument `limit: 5`
- Sélectionnez uniquement `name` et `email`

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Argument `limit` manquant : -10 points

---

## 📊 Grille de correction

| Scénario | Champs requis | Arguments | Score max | Pénalités |
|----------|---------------|-----------|-----------|-----------|
| Scénario 1 | 3 | 1 (id) | 100 | -20/champ manquant |
| Scénario 2 | 5 | 1 (id) | 100 | -20/champ manquant |
| Scénario 3 | 6 | 2 (id, limit) | 100 | -20/champ, -10/arg |
| Scénario 4 | 6 | 1 (id) | 100 | -20/champ manquant |
| Scénario 5 | 3 | 1 (limit) | 100 | -20/champ, -10/arg |
| Avancé 1 | 4 | 1 (id) | 100 | -20/champ, -5/supplémentaire |
| Avancé 2 | 11 | 1 (id) | 100 | -20/champ manquant |
| Avancé 3 | 3 | 1 (limit) | 100 | -20/champ, -10/arg |

---

## 💡 Conseils pour la correction

1. **Vérifiez la structure** : La requête doit commencer par un champ de Query
2. **Vérifiez les relations** : Les champs de type objet doivent avoir des sous-champs
3. **Vérifiez les arguments** : Les arguments requis doivent être présents
4. **Vérifiez l'optimisation** : Si maxCost est défini, pénalisez les champs supplémentaires
5. **Vérifiez les types** : Les champs doivent correspondre aux types du schéma

---

## 🔍 Erreurs courantes

### ❌ Erreur 1 : Champ de type objet sans sous-champs

```graphql
query {
  user(id: "42") {
    orders  # ❌ Erreur : orders est un objet, il faut des sous-champs
  }
}
```

**Correction** :
```graphql
query {
  user(id: "42") {
    orders {
      id
    }
  }
}
```

### ❌ Erreur 2 : Argument manquant

```graphql
query {
  user {  # ❌ Erreur : l'argument id est requis
    name
  }
}
```

**Correction** :
```graphql
query {
  user(id: "42") {
    name
  }
}
```

### ❌ Erreur 3 : Champ impossible (mauvais type)

```graphql
query {
  user(id: "42") {
    name
    orders {
      name  # ❌ Erreur : Order n'a pas de champ name
    }
  }
}
```

**Correction** :
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

---

## 📚 Ressources

- [GraphQL Queries](https://graphql.org/learn/queries/)
- [GraphQL Schema](https://graphql.org/learn/schema/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)



