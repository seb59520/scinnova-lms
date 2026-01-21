# 📝 Guide d'ajout de l'évaluation Python - Fondamentaux

## 📋 Fichier créé
- **Fichier** : `evaluation-python-fondamentaux.json`
- **Type** : Évaluation de 30 questions sur les fondamentaux Python
- **Format** : Compatible avec le système de quiz du portail

---

## 🎯 Méthode 1 : Intégrer dans un cours existant

### Étape 1 : Ouvrir le fichier JSON du cours
Ouvrez le fichier JSON du cours où vous voulez ajouter l'évaluation (ex: `course-python-environnements-virtuels.json`).

### Étape 2 : Ajouter l'évaluation dans un module
Dans le module souhaité, ajoutez un nouvel item de type `"game"` dans le tableau `items` :

```json
{
  "modules": [
    {
      "title": "Module X : ...",
      "position": 0,
      "items": [
        // ... autres items ...
        {
          "type": "game",
          "title": "Évaluation Python - Fondamentaux et Compréhension du Code",
          "position": 10,  // Ajustez selon la position souhaitée
          "published": true,
          "content": {
            "gameType": "quiz",
            "description": "Évaluation complète de 30 questions portant sur les fondamentaux de Python...",
            "instructions": "Répondez aux 30 questions...",
            "objectives": [
              "Maîtriser les types de données Python...",
              // ... autres objectifs
            ],
            "scoring": {
              "totalQuestions": 30,
              "pointsPerQuestion": 1,
              "passingScore": 20,
              "levels": {
                "0-14": "Bases à renforcer...",
                "15-24": "Bon niveau...",
                "25-30": "Excellent niveau..."
              }
            },
            "levels": [
              // ... copiez tout le contenu de "levels" depuis evaluation-python-fondamentaux.json
            ]
          },
          "chapters": []
        }
      ]
    }
  ]
}
```

### Étape 3 : Copier le contenu complet
Ouvrez `evaluation-python-fondamentaux.json` et copiez tout le contenu de la propriété `content` (lignes 6 à la fin) dans votre cours.

### Étape 4 : Importer le cours mis à jour
Utilisez le script d'import pour mettre à jour le cours :

```bash
cd portal-formations
node import-course-direct.js course-python-environnements-virtuels.json --update <ID-DU-COURS>
```

---

## 🚀 Méthode 2 : Importer comme cours standalone

### Option A : Via l'interface d'administration

1. **Connectez-vous** à l'interface d'administration du portail
2. **Accédez** à la section d'import de cours
3. **Sélectionnez** le fichier `evaluation-python-fondamentaux.json`
4. **Validez** l'import
5. **Vérifiez** que l'évaluation apparaît correctement

### Option B : Via le script d'import en ligne de commande

```bash
cd portal-formations
node import-course-direct.js evaluation-python-fondamentaux.json
```

**Note** : Pour cette méthode, vous devrez peut-être adapter le format du fichier pour qu'il corresponde à la structure d'un cours complet (avec `title`, `description`, `modules`, etc.).

---

## 🔧 Méthode 3 : Créer un cours dédié à l'évaluation

Si vous voulez créer un cours complet dédié uniquement à cette évaluation, voici la structure à utiliser :

```json
{
  "title": "Évaluation Python - Fondamentaux",
  "description": "Évaluation complète de 30 questions sur les fondamentaux de Python",
  "status": "published",
  "access_type": "free",
  "theme": {
    "primaryColor": "#4A90E2",
    "secondaryColor": "#7ED321",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Évaluation Python - Fondamentaux",
      "position": 0,
      "items": [
        {
          "type": "game",
          "title": "Évaluation Python - Fondamentaux et Compréhension du Code",
          "position": 0,
          "published": true,
          "content": {
            // ... copiez tout le contenu depuis evaluation-python-fondamentaux.json
            // (lignes 6 à la fin du fichier)
          },
          "chapters": []
        }
      ]
    }
  ]
}
```

Ensuite, importez ce cours :

```bash
node import-course-direct.js evaluation-python-fondamentaux-complet.json
```

---

## ✅ Vérification

Après l'import, vérifiez que :
- ✅ L'évaluation apparaît dans la liste des cours/items
- ✅ Les 30 questions sont bien présentes
- ✅ Les 3 niveaux sont correctement structurés
- ✅ Le système de notation fonctionne (20/30 pour valider)

---

## 📚 Structure de l'évaluation

L'évaluation contient :
- **30 questions** réparties en 3 niveaux (10 questions chacun)
- **Niveau 1** : Types, Variables et Opérations de Base
- **Niveau 2** : Structures de Contrôle et Collections
- **Niveau 3** : Fonctions et Compréhension du Code
- **Types de questions** : QCM (multiple choice) et Vrai/Faux
- **Système de notation** : 1 point par question, 20/30 pour valider

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez que le JSON est valide (utilisez un validateur JSON)
2. Vérifiez que la structure correspond au format attendu
3. Consultez les autres quiz existants comme référence (ex: `quiz-python-variables-types-logique.json`)
