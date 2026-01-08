# Guide d'intégration LMS - Titanic Learning App

Ce guide explique comment intégrer les 3 TP (Travaux Pratiques) de l'application Titanic Learning dans votre LMS.

## 📁 Fichiers JSON disponibles

Trois fichiers JSON sont disponibles pour l'intégration dans votre LMS :

1. **`lms-titanic-big-data.json`** - TP 1 : Big Data (Exploration des données brutes)
2. **`lms-titanic-data-science.json`** - TP 2 : Data Science (Analyse et visualisation)
3. **`lms-titanic-machine-learning.json`** - TP 3 : Machine Learning (Prédictions et biais)

## 🎯 Structure des fichiers

Chaque fichier JSON contient :

- **Métadonnées du cours** : titre, description, statut, accès
- **Thème personnalisé** : couleurs et police pour chaque module
- **Module unique** : contenant les items du TP
- **Ressource d'introduction** : présentation des objectifs pédagogiques
- **TP interactif** : instructions détaillées au format TipTap JSON

## 📋 Format TipTap JSON

Les instructions sont au format **TipTap** (doc JSON), ce qui permet :
- Un rendu riche avec titres, listes, citations
- Une structure hiérarchique claire
- Une compatibilité avec les éditeurs WYSIWYG

### Exemple de structure TipTap :

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [
        {
          "type": "text",
          "text": "Titre principal"
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Texte du paragraphe"
        }
      ]
    }
  ]
}
```

## 🚀 Intégration dans votre LMS

### Méthode 1 : Import direct

1. **Connectez-vous** à votre interface d'administration LMS
2. **Accédez** à la section d'import de cours
3. **Sélectionnez** le fichier JSON correspondant
4. **Validez** l'import
5. **Vérifiez** que le cours apparaît correctement

### Méthode 2 : Import via SQL (Supabase/PostgreSQL)

Si votre LMS utilise Supabase ou PostgreSQL, vous pouvez utiliser un script SQL similaire à celui-ci :

```sql
-- Exemple d'insertion (à adapter selon votre schéma)
INSERT INTO courses (title, description, status, access_type, theme)
VALUES (
  'TP 1 : Big Data',
  'Exploration des données brutes avec le dataset Titanic',
  'published',
  'free',
  '{"primaryColor": "#3B82F6", "secondaryColor": "#8B5CF6"}'::jsonb
);
```

### Méthode 3 : API REST

Si votre LMS expose une API REST, vous pouvez utiliser `curl` ou un script pour importer :

```bash
curl -X POST https://votre-lms.com/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @lms-titanic-big-data.json
```

## 📝 Personnalisation

### Modifier le titre ou la description

Éditez le fichier JSON et modifiez :

```json
{
  "title": "Votre titre personnalisé",
  "description": "Votre description personnalisée"
}
```

### Changer les couleurs du thème

Modifiez les couleurs dans `theme` :

```json
{
  "theme": {
    "primaryColor": "#VOTRE_COULEUR_PRIMAIRE",
    "secondaryColor": "#VOTRE_COULEUR_SECONDAIRE",
    "fontFamily": "VotrePolice"
  }
}
```

### Ajouter des items supplémentaires

Ajoutez des objets dans le tableau `items` :

```json
{
  "items": [
    {
      "type": "resource",
      "title": "Nouvelle ressource",
      "position": 2,
      "published": true,
      "content": {
        "body": { /* Format TipTap JSON */ }
      }
    }
  ]
}
```

## ✅ Checklist de vérification

Avant de publier le cours dans votre LMS, vérifiez :

- [ ] Le JSON est valide (pas d'erreurs de syntaxe)
- [ ] Tous les champs requis sont présents
- [ ] Les positions sont cohérentes (0-indexed)
- [ ] Le format TipTap JSON est correct
- [ ] Les liens vers l'application sont à jour (https://titaniclearning.netlify.app)
- [ ] Les checklists sont complètes
- [ ] Le thème est cohérent avec votre charte graphique

## 🔗 Liens importants

- **Application interactive :** https://titaniclearning.netlify.app
- **Dépôt GitHub :** https://github.com/seb59520/titanic-learning-app
- **TP en Markdown :** 
  - [TP-01-BIG-DATA.md](./TP-01-BIG-DATA.md)
  - [TP-02-DATA-SCIENCE.md](./TP-02-DATA-SCIENCE.md)
  - [TP-03-MACHINE-LEARNING.md](./TP-03-MACHINE-LEARNING.md)

## 📊 Structure détaillée

### Champs du cours

- **title** (string, requis) : Titre du cours
- **description** (string, requis) : Description complète (markdown supporté)
- **status** (string, requis) : `"draft"` ou `"published"`
- **access_type** (string, requis) : `"free"`, `"paid"`, ou `"invite"`
- **price_cents** (number, optionnel) : Prix en centimes
- **currency** (string, optionnel) : Devise (ex: `"EUR"`)
- **theme** (object, optionnel) : Thème du cours

### Champs d'un module

- **title** (string, requis) : Titre du module
- **position** (number, requis) : Position dans le cours (0-indexed)
- **theme** (object, optionnel) : Thème du module
- **items** (array, requis) : Liste des items du module

### Champs d'un item TP

- **type** (string, requis) : `"tp"` pour travaux pratiques
- **title** (string, requis) : Titre de l'item
- **position** (number, requis) : Position dans le module (0-indexed)
- **published** (boolean, optionnel) : `true` par défaut
- **content** (object, requis) :
  - **description** (string) : Description de l'item
  - **instructions** (object) : Instructions au format TipTap JSON
  - **checklist** (array) : Liste des tâches à valider

## 🎓 Utilisation pédagogique

### Ordre recommandé

Les TP sont conçus pour être suivis dans l'ordre :
1. **TP 1** (Big Data) - Fondations
2. **TP 2** (Data Science) - Analyse
3. **TP 3** (Machine Learning) - Prédictions

### Durées estimées

- **TP 1** : 1h30
- **TP 2** : 2h
- **TP 3** : 2h

**Total : 5h30**

### Niveaux

- **TP 1** : Débutant
- **TP 2** : Intermédiaire
- **TP 3** : Avancé

## ❓ Questions fréquentes

### Puis-je modifier les instructions ?

Oui, vous pouvez modifier les instructions dans le champ `content.instructions`. Assurez-vous de respecter le format TipTap JSON.

### Comment ajouter des questions supplémentaires ?

Ajoutez de nouveaux items de type `"exercise"` ou `"game"` dans le tableau `items`.

### Les réponses sont-elles sauvegardées ?

Oui, dans l'application interactive, toutes les réponses sont sauvegardées automatiquement dans le localStorage du navigateur et peuvent être exportées en JSON.

### Puis-je combiner les 3 TP en un seul cours ?

Oui, vous pouvez fusionner les 3 fichiers JSON en un seul cours avec 3 modules distincts.

## 🐛 Dépannage

### Erreur : "JSON invalide"

Vérifiez la syntaxe JSON avec un validateur en ligne (jsonlint.com).

### Erreur : "Format TipTap invalide"

Assurez-vous que les instructions commencent par `{"type": "doc", "content": [...]}`.

### Les couleurs ne s'affichent pas

Vérifiez que les couleurs sont au format hexadécimal (ex: `"#3B82F6"`).

## 📞 Support

Pour toute question ou problème :
- Consultez le [README principal](./README.md)
- Ouvrez une issue sur [GitHub](https://github.com/seb59520/titanic-learning-app/issues)

---

**Bon intégration ! 🚀**
