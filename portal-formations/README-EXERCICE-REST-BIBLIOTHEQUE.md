# Exercice : Identifiez les ressources REST pour un système de gestion de bibliothèque

## 📋 Description

Cet exercice permet aux étudiants d'identifier les ressources REST et de proposer les URLs correspondantes pour un système de gestion de bibliothèque.

## 🎯 Objectifs pédagogiques

- Comprendre les conventions REST
- Identifier les ressources dans un contexte métier
- Construire des URLs REST appropriées
- Associer les méthodes HTTP aux opérations CRUD

## 📥 Import dans le système

### Option 1 : Import via l'interface d'administration

1. Allez dans **Admin** → **Cours** → Sélectionnez ou créez un cours
2. Cliquez sur **"Éditer le JSON"** ou **"Ajouter un item"**
3. Copiez le contenu du fichier `exercice-rest-bibliotheque.json`
4. Collez-le dans la section appropriée du JSON du cours
5. Sauvegardez

### Option 2 : Import direct dans un module

Ajoutez l'exercice dans le tableau `items` d'un module :

```json
{
  "modules": [
    {
      "items": [
        {
          "type": "exercise",
          "title": "Exercice : Identifiez les ressources REST pour un système de gestion de bibliothèque",
          "position": 0,
          "published": true,
          "content": {
            // ... contenu de l'exercice
          }
        }
      ]
    }
  ]
}
```

## ✅ Correction facilitée

L'exercice est structuré pour faciliter la correction :

### Format de réponse attendu

Les étudiants doivent remplir un template structuré :

```
1. Récupérer tous les livres
   Ressource : [réponse]
   URL : [réponse]
   Méthode HTTP : [réponse]
```

### Critères de correction

1. **Ressource** : Doit être au pluriel (livres, books)
2. **URL** : Doit suivre les conventions REST
   - Collection : `/api/ressource`
   - Ressource spécifique : `/api/ressource/:id`
3. **Méthode HTTP** : Doit correspondre à l'opération
   - GET pour la lecture
   - POST pour la création
   - PUT/PATCH pour la mise à jour

### Réponses attendues

#### 1. Récupérer tous les livres
- **Ressource** : `livres` ou `books`
- **URL** : `/api/livres` ou `/api/books`
- **Méthode HTTP** : `GET`

#### 2. Récupérer un livre spécifique (ID: 42)
- **Ressource** : `livres` ou `books`
- **URL** : `/api/livres/42` ou `/api/books/42`
- **Méthode HTTP** : `GET`

#### 3. Créer un nouveau livre
- **Ressource** : `livres` ou `books`
- **URL** : `/api/livres` ou `/api/books`
- **Méthode HTTP** : `POST`

#### 4. Mettre à jour un livre
- **Ressource** : `livres` ou `books`
- **URL** : `/api/livres/42` ou `/api/books/42` (avec l'ID du livre)
- **Méthode HTTP** : `PUT` ou `PATCH`

## 🔍 Points d'attention pour la correction

### Erreurs courantes à vérifier

1. ❌ Ressource au singulier (`livre` au lieu de `livres`)
2. ❌ URL incorrecte pour la récupération d'un livre spécifique (oubli de l'ID)
3. ❌ Mauvaise méthode HTTP (ex: GET pour créer, POST pour récupérer)
4. ❌ URL avec verbe d'action (`/api/getLivres` au lieu de `/api/livres`)
5. ❌ Oubli du préfixe `/api/`

### Variantes acceptables

- `livres` ou `books` (français/anglais)
- `PUT` ou `PATCH` pour la mise à jour (les deux sont acceptables)
- Format d'URL avec ou sans trailing slash (`/api/livres` ou `/api/livres/`)

## 📊 Grille de correction rapide

| Question | Ressource | URL | Méthode | Points |
|----------|-----------|-----|---------|--------|
| 1. Tous les livres | ✅ pluriel | ✅ /api/... | ✅ GET | /3 |
| 2. Livre ID 42 | ✅ pluriel | ✅ /api/.../42 | ✅ GET | /3 |
| 3. Créer livre | ✅ pluriel | ✅ /api/... | ✅ POST | /3 |
| 4. Mettre à jour | ✅ pluriel | ✅ /api/.../42 | ✅ PUT/PATCH | /3 |

**Total : 12 points**

## 🎓 Utilisation pédagogique

### Avant l'exercice

- Réviser les principes REST
- Expliquer les conventions de nommage
- Présenter les méthodes HTTP et leurs usages

### Pendant l'exercice

- Laisser les étudiants réfléchir individuellement
- Encourager l'utilisation du template fourni
- Rappeler les bonnes pratiques REST

### Après l'exercice

- Corriger en utilisant la correction fournie
- Discuter des erreurs communes
- Proposer des variantes (ex: gestion des emprunts, recherche de livres)

## 🔄 Extensions possibles

Vous pouvez étendre cet exercice en demandant :

1. **Supprimer un livre** : DELETE /api/livres/42
2. **Récupérer les emprunts d'un livre** : GET /api/livres/42/emprunts
3. **Rechercher des livres** : GET /api/livres?titre=...&auteur=...
4. **Gérer les auteurs** : CRUD complet sur /api/auteurs

## 📝 Notes

- L'exercice utilise le format TipTap JSON pour un affichage riche
- La correction est détaillée avec des explications pour chaque réponse
- Le template guide l'étudiant pour faciliter la correction
- Compatible avec le système de soumission et correction du portail

## 🐛 Dépannage

### L'exercice ne s'affiche pas correctement

1. Vérifiez que le JSON est valide (utilisez un validateur JSON)
2. Vérifiez que `type: "exercise"` est bien présent
3. Vérifiez que `content.question` et `content.correction` sont bien formatés

### La correction ne s'affiche pas

1. Vérifiez que `content.correction` est présent
2. Vérifiez le format TipTap JSON (doit commencer par `{"type": "doc", ...}`)

## 📚 Ressources complémentaires

- [REST API Tutorial](https://restfulapi.net/)
- [HTTP Methods](https://developer.mozilla.org/fr/docs/Web/HTTP/Methods)
- [RESTful API Design](https://restfulapi.net/rest-api-design-tutorial-with-example/)



