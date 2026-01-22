# 📚 Format de Glossaire Générique

Ce format permet de créer des glossaires réutilisables avec la structure **Mot, Explication, Exemple**.

## 📋 Structure du Format

Un glossaire est un fichier JSON avec la structure suivante :

```json
{
  "metadata": {
    "title": "Titre du glossaire",
    "description": "Description du glossaire",
    "category": "Catégorie (ex: Python, JavaScript, HACCP)",
    "version": "1.0.0",
    "author": "Auteur",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  },
  "categories": [
    {
      "id": "variables",
      "name": "Variables & Types",
      "description": "Description de la catégorie"
    }
  ],
  "terms": [
    {
      "id": "none",
      "word": "None",
      "explanation": "Explication détaillée du terme",
      "example": "x = None\nif x is None:\n    print('exemple')",
      "category_id": "variables",
      "tags": ["type", "valeur"],
      "related_terms": [],
      "language": "python",
      "difficulty": "beginner"
    }
  ]
}
```

## 🔑 Champs Requis

### Metadata
- **title** (requis) : Titre du glossaire

### Termes
- **id** (requis) : Identifiant unique du terme
- **word** (requis) : Le mot ou concept à définir
- **explanation** (requis) : Explication détaillée
- **example** (requis) : Exemple d'utilisation

### Champs Optionnels
- **category_id** : ID de la catégorie
- **tags** : Tableau de tags pour la recherche
- **related_terms** : IDs des termes liés
- **language** : Langue du terme (python, javascript, etc.)
- **difficulty** : Niveau (beginner, intermediate, advanced)

## 📁 Fichiers

- **`glossaire-format.json`** : Définition du schéma et exemple
- **`glossaire-python-exemple.json`** : Exemple complet avec termes Python
- **`glossaire-converter.ts`** : Script de conversion vers format TipTap

## 🔄 Conversion vers Format Cours

Le script `glossaire-converter.ts` convertit un glossaire au format générique vers le format TipTap JSON utilisé par le système de cours.

### Utilisation

```bash
# Avec Node.js/TypeScript
npx ts-node glossaire-converter.ts glossaire-python-exemple.json

# Ou avec tsx
npx tsx glossaire-converter.ts glossaire-python-exemple.json
```

Le script génère un fichier `*-course.json` compatible avec le système portal-formations.

## 📝 Exemple d'Utilisation

### Créer un nouveau glossaire

1. Copiez `glossaire-format.json` comme modèle
2. Remplissez les métadonnées
3. Ajoutez vos catégories (optionnel)
4. Ajoutez vos termes avec mot, explication et exemple

### Ajouter un terme

```json
{
  "id": "nouveau-terme",
  "word": "MonTerme",
  "explanation": "Explication détaillée de ce que fait ce terme et pourquoi il est important.",
  "example": "code = 'exemple de code'\nresultat = fonction(code)",
  "category_id": "ma-categorie",
  "tags": ["tag1", "tag2"],
  "language": "python",
  "difficulty": "beginner"
}
```

## 🎯 Cas d'Usage

1. **Glossaire Python** : Termes et concepts Python
2. **Glossaire JavaScript** : Concepts JavaScript/TypeScript
3. **Glossaire HACCP** : Terminologie HACCP et sécurité alimentaire
4. **Glossaire technique** : Termes techniques spécifiques à un domaine

## 🔧 Intégration dans le Système

Le format est conçu pour être :
- **Réutilisable** : Même structure pour tous les glossaires
- **Extensible** : Champs optionnels pour besoins spécifiques
- **Convertible** : Script de conversion vers format cours
- **Interopérable** : JSON standard, facile à manipuler

## 📚 Format de Sortie (TipTap)

Le convertisseur génère un format compatible avec le système de cours :

```json
{
  "type": "resource",
  "title": "Titre du glossaire",
  "position": 0,
  "published": true,
  "content": {
    "description": "Description",
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 3 },
          "content": [{ "type": "text", "text": "Terme" }]
        },
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Explication" }]
        },
        {
          "type": "codeBlock",
          "attrs": { "language": "python" },
          "content": [{ "type": "text", "text": "exemple" }]
        }
      ]
    }
  }
}
```

## 🚀 Prochaines Étapes

- [ ] Créer un glossaire HACCP
- [ ] Créer un glossaire JavaScript/TypeScript
- [ ] Ajouter une interface web pour éditer les glossaires
- [ ] Ajouter la recherche par tags
- [ ] Ajouter les liens entre termes liés
