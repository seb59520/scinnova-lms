# Quiz d'introduction - Big Data, Machine Learning et Data Science

## 📋 Description

Ce quiz d'introduction permet de recueillir la compréhension actuelle des participants sur trois concepts clés :
- **Le Big Data**
- **Le Machine Learning**
- **La Data Science**

Il permet également de connaître les attentes et objectifs d'apprentissage de chaque participant.

## 🎯 Objectifs pédagogiques

1. **Évaluer le niveau de départ** : Comprendre où en sont les participants permet d'adapter le rythme et la profondeur du cours.
2. **Créer un engagement** : En demandant aux participants de partager leur vision, on les implique activement dès le début.
3. **Identifier les attentes** : Connaître les objectifs de chacun permet de mettre en avant les parties du cours les plus pertinentes.
4. **Créer un référentiel de départ** : À la fin du cours, on pourra revenir sur ces définitions pour montrer l'évolution de la compréhension.

## 📁 Fichiers disponibles

### 1. `quiz-introduction-big-data-interactif.json`
**Format recommandé** - Quiz interactif avec composant React dédié.

Ce fichier utilise le composant `IntroductionQuiz` qui permet :
- Des champs de texte libres pour chaque question
- Sauvegarde automatique dans le localStorage
- Sauvegarde optionnelle dans Supabase (si l'utilisateur est connecté)
- Interface utilisateur moderne et responsive

**Structure :**
```json
{
  "type": "game",
  "title": "Quiz d'introduction - Vos définitions et attentes",
  "content": {
    "gameType": "introduction-quiz",
    "description": "...",
    "instructions": "...",
    "questions": [
      {
        "id": "bigdata",
        "label": "D'après vous, qu'est-ce que le Big Data ?",
        "placeholder": "Exemple : Le Big Data représente pour moi..."
      },
      // ... autres questions
    ]
  }
}
```

### 2. `quiz-introduction-big-data.json`
Format QCM avec le composant QuizGame standard.

Ce format utilise le système de quiz existant avec des questions à choix multiples. Les réponses sont présentées comme des options, mais toutes sont considérées comme valides (pas de bonne/mauvaise réponse).

### 3. `quiz-introduction-big-data-formulaire.json`
Format slide avec texte libre.

Ce format utilise une slide standard avec des espaces pour les réponses. Les participants peuvent compléter leurs réponses directement dans le texte ou via un outil externe.

## 🚀 Utilisation

### Option 1 : Quiz interactif (recommandé)

1. Intégrez le fichier `quiz-introduction-big-data-interactif.json` dans votre cours JSON
2. Placez-le en première position dans le premier module
3. Les participants pourront répondre directement dans l'interface
4. Les réponses sont sauvegardées automatiquement

**Exemple d'intégration dans un cours :**
```json
{
  "modules": [
    {
      "title": "Module 1 : Introduction",
      "items": [
        {
          "type": "game",
          "title": "Quiz d'introduction",
          "position": 1,
          "published": true,
          "content": {
            "gameType": "introduction-quiz",
            "description": "Partagez votre compréhension...",
            "questions": [
              // ... questions
            ]
          }
        }
      ]
    }
  ]
}
```

### Option 2 : Animation en présentiel

Si vous préférez animer le quiz en présentiel :

1. Utilisez le fichier `quiz-introduction-big-data-formulaire.json` comme support visuel
2. Faites un tour de table où chacun partage sa définition
3. Utilisez un outil collaboratif (Mentimeter, Padlet, Google Forms) pour collecter les réponses
4. Créez un nuage de mots à partir des réponses
5. Revenez sur ces définitions en fin de cours pour mesurer l'apprentissage

## 💾 Stockage des réponses

### Sauvegarde locale (automatique)
Les réponses sont automatiquement sauvegardées dans le `localStorage` du navigateur avec la clé `introduction_quiz_answers`.

### Sauvegarde Supabase (optionnelle)
Si vous souhaitez stocker les réponses dans Supabase, créez la table suivante :

```sql
CREATE TABLE IF NOT EXISTS user_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL,
  responses JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quiz_type)
);

-- Index pour les requêtes
CREATE INDEX idx_user_responses_user_id ON user_responses(user_id);
CREATE INDEX idx_user_responses_quiz_type ON user_responses(quiz_type);

-- RLS (Row Level Security)
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir et modifier leurs propres réponses
CREATE POLICY "Users can view their own responses"
  ON user_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON user_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON user_responses FOR UPDATE
  USING (auth.uid() = user_id);
```

## 📊 Analyse des réponses

### Interface dédiée (Recommandé)

Les formateurs et administrateurs ont accès à une **interface dédiée** pour consulter toutes les réponses :

#### Pour les Formateurs
- **URL** : `/trainer/quiz-responses`
- **Avec contexte cours** : `/trainer/courses/:courseId/quiz-responses`
- **Avec contexte session** : `/trainer/sessions/:sessionId/quiz-responses`
- **Accès depuis** : Dashboard formateur (bouton "Voir les réponses du quiz d'introduction")

#### Pour les Administrateurs
- **URL** : `/admin/quiz-responses`
- **Avec contexte cours** : `/admin/courses/:courseId/quiz-responses`
- **Accès depuis** : Page des soumissions (bouton "Voir les réponses du quiz d'introduction")

**Fonctionnalités de l'interface :**
- ✅ Recherche par nom, email ou contenu
- ✅ Filtrage par type de quiz
- ✅ Statistiques (total, réponses complètes, dernière réponse)
- ✅ Export CSV
- ✅ Affichage détaillé de chaque réponse

### Via SQL (Avancé)

Pour analyser les réponses directement via SQL :

1. **Via Supabase** : Interrogez la table `user_responses` avec `quiz_type = 'introduction_big_data'`
2. **Via la vue** : Utilisez la vue `introduction_quiz_responses` pour un format plus lisible

**Exemple de requête Supabase :**
```sql
-- Via la vue (recommandé)
SELECT * FROM introduction_quiz_responses;

-- Ou directement
SELECT 
  user_id,
  responses->>'bigdata' as bigdata_definition,
  responses->>'machinelearning' as ml_definition,
  responses->>'datascience' as ds_definition,
  responses->>'expectations' as expectations,
  updated_at
FROM user_responses
WHERE quiz_type = 'introduction_big_data'
ORDER BY updated_at DESC;
```

### Via localStorage (Développement)

Les réponses sont également stockées localement dans le navigateur avec la clé `introduction_quiz_answers` (format JSON).

## 🎨 Personnalisation

### Modifier les questions

Éditez le fichier JSON et modifiez le tableau `questions` :

```json
{
  "id": "nouvelle-question",
  "label": "Votre nouvelle question ?",
  "placeholder": "Placeholder optionnel"
}
```

### Modifier le style

Le composant `IntroductionQuiz` utilise Tailwind CSS. Vous pouvez modifier les styles directement dans le composant ou via les classes CSS.

## 📝 Notes pour le formateur

- **Durée estimée** : 10-15 minutes
- **Format** : Individuel ou collectif (tour de table)
- **Retour** : Revenez sur ces définitions en fin de cours pour montrer l'évolution
- **Adaptation** : Utilisez les réponses pour adapter le contenu du cours

## 🔄 Retour en fin de cours

En fin de formation, vous pouvez :
1. Revenir sur les définitions initiales
2. Comparer avec les définitions actuelles
3. Mesurer l'évolution de la compréhension
4. Identifier les points à renforcer

## 📚 Ressources complémentaires

- [Documentation du composant IntroductionQuiz](../src/components/IntroductionQuiz.tsx)
- [Exemples de quiz existants](../exemples-jeux/)

