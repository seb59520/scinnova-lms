# Quiz d'introduction Python - Module 0

## 📋 Description

Ce quiz permet au formateur de :
- **Comprendre le niveau** de chaque apprenant en Python
- **Connaître leurs attentes** pour la formation
- **Identifier les situations professionnelles** où ils pourront appliquer leurs apprentissages
- **Anticiper les difficultés** potentielles

Le formateur peut suivre en **temps réel** l'évolution du remplissage du formulaire par chaque apprenant via l'interface de session.

## 🚀 Intégration dans un cours

### Option 1 : Intégration directe dans le JSON du cours

Ajoutez le quiz comme premier item du premier module (Module 0) :

```json
{
  "title": "Python les fondamentaux",
  "description": "...",
  "status": "published",
  "access_type": "free",
  "modules": [
    {
      "title": "Module 0 : Introduction et positionnement",
      "position": 0,
      "items": [
        {
          "type": "game",
          "title": "Quiz d'introduction - Python les fondamentaux",
          "position": 0,
          "published": true,
          "content": {
            "gameType": "introduction-quiz",
            "quizType": "introduction_python",
            "description": "Ce quiz nous permet de mieux vous connaître...",
            "questions": [
              {
                "id": "niveau_python",
                "label": "Quel est votre niveau actuel en Python ?...",
                "placeholder": "Exemple : Je suis débutant..."
              },
              {
                "id": "attentes_formation",
                "label": "Quelles sont vos attentes pour cette formation ?...",
                "placeholder": "Exemple : Je souhaite être capable..."
              },
              {
                "id": "situations_professionnelles",
                "label": "Avez-vous des situations professionnelles concrètes ?...",
                "placeholder": "Exemple : Je travaille dans l'analyse..."
              },
              {
                "id": "difficultes_anticipees",
                "label": "Quelles sont les difficultés que vous anticipez ?...",
                "placeholder": "Exemple : J'ai souvent des problèmes..."
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### Option 2 : Utiliser le fichier JSON fourni

Le fichier `quiz-introduction-python-module-0.json` contient le quiz complet. Vous pouvez l'importer directement dans votre cours.

## 👨‍🏫 Suivi en temps réel pour le formateur

### Accès à l'interface de suivi

1. Connectez-vous en tant que formateur
2. Accédez à la session : `/trainer/session/{sessionId}`
3. Cliquez sur l'onglet **"Quiz"**

### Fonctionnalités disponibles

- **Statistiques en temps réel** :
  - Nombre total de réponses
  - Nombre de quiz complétés
  - Taux de complétion

- **Liste des apprenants** :
  - Nom de l'apprenant
  - Progression (X/4 questions)
  - Dernière mise à jour
  - Statut (complété ou en cours)

- **Détails des réponses** :
  - Cliquez sur un apprenant pour voir ses réponses détaillées
  - Les réponses sont mises à jour en temps réel

### Mises à jour automatiques

Les réponses sont sauvegardées automatiquement toutes les 2 secondes après la dernière modification. Le formateur voit les mises à jour en temps réel via Supabase Realtime.

## 📊 Structure des données

Les réponses sont stockées dans la table `user_responses` avec :
- `quiz_type`: `"introduction_python"`
- `responses`: JSON contenant les réponses par question ID
  ```json
  {
    "niveau_python": "Réponse de l'apprenant...",
    "attentes_formation": "Réponse de l'apprenant...",
    "situations_professionnelles": "Réponse de l'apprenant...",
    "difficultes_anticipees": "Réponse de l'apprenant..."
  }
  ```

## 🔍 Consultation des réponses

### Via l'interface de session (temps réel)
- Onglet "Quiz" dans SessionHub
- Mises à jour en temps réel

### Via la page dédiée
- `/trainer/sessions/{sessionId}/quiz-responses`
- Vue complète avec recherche et filtres

### Via SQL (Supabase)
```sql
SELECT 
  ur.id,
  p.full_name,
  ur.responses,
  ur.updated_at
FROM user_responses ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.quiz_type = 'introduction_python'
ORDER BY ur.updated_at DESC;
```

## 🎯 Questions du quiz

1. **Niveau Python** : Évaluation du niveau actuel et de l'expérience
2. **Attentes formation** : Objectifs d'apprentissage
3. **Situations professionnelles** : Contexte d'application
4. **Difficultés anticipées** : Points de vigilance

## 💡 Conseils d'utilisation

- **Avant la formation** : Demandez aux apprenants de compléter le quiz avant le premier jour
- **Pendant la session** : Utilisez les réponses pour adapter votre discours et vos exemples
- **Après la formation** : Consultez les réponses pour évaluer si les attentes ont été satisfaites

## 🔧 Personnalisation

Vous pouvez modifier les questions dans le JSON du cours. Assurez-vous de :
- Conserver les IDs des questions si vous voulez réutiliser les données existantes
- Utiliser `quizType: "introduction_python"` pour le suivi dans SessionHub
- Utiliser `gameType: "introduction-quiz"` pour le rendu correct

## 📝 Notes techniques

- Le quiz utilise `SessionIntroductionQuiz` dans les sessions et `IntroductionQuiz` en dehors
- Les réponses sont sauvegardées automatiquement (auto-save après 2s d'inactivité)
- Le suivi temps réel utilise Supabase Realtime (canal `quiz-responses:{sessionId}`)
- Les réponses sont liées à la session via les membres de la session
