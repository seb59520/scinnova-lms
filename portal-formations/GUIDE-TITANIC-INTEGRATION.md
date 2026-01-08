# Guide d'intégration Titanic - Upload JSON et Analyse IA

Ce guide explique comment utiliser la fonctionnalité d'upload de JSON depuis l'application Titanic et l'analyse IA pour les formateurs.

## 🎯 Fonctionnalités

### Pour les étudiants
- **Upload de JSON** : Les étudiants peuvent importer leurs réponses exportées depuis l'application Titanic directement dans le LMS
- **Validation automatique** : Le système valide le format JSON et détecte le module (Big Data, Data Science, Machine Learning)
- **Sauvegarde automatique** : Les données sont sauvegardées dans `answer_json` de la soumission

### Pour les formateurs
- **Visualisation des données** : Accès aux réponses importées par les étudiants
- **Analyse IA automatique** : Analyse intelligente des réponses avec l'IA (OpenRouter)
- **Résumé et suggestions** : Points forts, points faibles, suggestions d'amélioration
- **Score estimé** : Note estimée par l'IA (sur 20)

## 📋 Prérequis

### Configuration OpenRouter
Pour que l'analyse IA fonctionne, vous devez configurer OpenRouter :

1. Créez un compte sur [OpenRouter.ai](https://openrouter.ai/)
2. Générez une clé API dans la section "Keys"
3. Ajoutez-la dans votre fichier `.env` :
   ```env
   VITE_OPENROUTER_API_KEY=votre_cle_ici
   VITE_OPENROUTER_MODEL=google/gemini-1.5-pro
   ```
4. Redémarrez votre serveur de développement

## 🚀 Utilisation

### Pour les étudiants

1. **Compléter le TP dans l'application Titanic**
   - Accédez à https://titaniclearning.netlify.app
   - Complétez les exercices du module (Big Data, Data Science ou Machine Learning)
   - Répondez aux questions

2. **Exporter les réponses**
   - Cliquez sur "Exporter mes réponses" dans le module
   - Un fichier JSON est téléchargé (ex: `big-data-reponses.json`)

3. **Importer dans le LMS**
   - Accédez au TP correspondant dans le LMS
   - Le composant d'upload apparaît automatiquement si c'est un TP Titanic
   - Cliquez sur "Sélectionner un fichier JSON"
   - Choisissez le fichier exporté
   - Cliquez sur "Importer les réponses"
   - Les données sont sauvegardées automatiquement

### Pour les formateurs

1. **Accéder aux soumissions**
   - Allez dans **Administration** → **Formations** → Sélectionnez le cours
   - Cliquez sur "Voir les soumissions" ou accédez à `/admin/courses/{courseId}/submissions`

2. **Voir les données importées**
   - Cliquez sur "Voir" pour une soumission
   - Si des données Titanic sont présentes, un panneau spécial s'affiche
   - Vous pouvez voir les données JSON importées

3. **Analyser avec l'IA**
   - Cliquez sur "Analyser avec l'IA" dans le panneau Titanic
   - L'IA analyse les réponses et génère :
     - Un résumé global
     - Les points forts
     - Les points à améliorer
     - Des suggestions
     - Une note estimée (sur 20)
     - Une analyse détaillée

4. **Noter la soumission**
   - Utilisez l'analyse IA comme guide
   - Attribuez une note manuelle (0-100)
   - Ajoutez un feedback si nécessaire

## 🔧 Détection automatique des TP Titanic

Le système détecte automatiquement si un TP est lié à Titanic en vérifiant :
- Le titre contient "Titanic", "Big Data", "Data Science" ou "Machine Learning"
- Le champ `content.titanicModule` est défini dans l'item

### Exemple de configuration dans le JSON du cours

```json
{
  "type": "tp",
  "title": "TP 1 : Big Data - Exploration des données brutes",
  "content": {
    "titanicModule": "big-data",
    "instructions": { ... },
    "checklist": [ ... ]
  }
}
```

## 📊 Structure des données JSON

### Format Big Data / Data Science

```json
{
  "big-data-answers": {
    "q1": {
      "questionId": "q1",
      "dropdownValue": "10-30",
      "inputValue": "25",
      "timestamp": 1234567890
    },
    ...
  },
  "big-data-filters": { ... }
}
```

### Format Machine Learning

```json
{
  "answers": {
    "q1": {
      "questionId": "q1",
      "dropdownValue": "Oui",
      "inputValue": "Justification...",
      "timestamp": 1234567890
    }
  },
  "predictions": [
    {
      "passenger": { ... },
      "userPrediction": "oui",
      "justification": "...",
      "revealed": true
    },
    ...
  ]
}
```

## 🎨 Interface

### Composant d'upload (étudiant)

- Zone de drag & drop pour le fichier JSON
- Instructions claires
- Validation en temps réel
- Messages d'erreur/succès

### Panneau d'analyse (formateur)

- En-tête avec informations du module
- Bouton d'analyse IA
- Affichage structuré des résultats :
  - Résumé
  - Score estimé
  - Points forts (vert)
  - Points faibles (orange)
  - Suggestions (bleu)
  - Analyse détaillée

## 🔍 Analyse IA

### Pour Big Data / Data Science

L'IA analyse :
- La justesse des réponses
- La compréhension des concepts
- La qualité des justifications
- La complétude des réponses

### Pour Machine Learning

L'IA analyse :
- La qualité des prédictions
- La justesse des justifications
- La détection des biais
- La réflexion éthique
- Le score de prédiction

## ⚙️ Configuration avancée

### Personnaliser les questions pour l'analyse

Dans `TitanicAnalysisPanel`, vous pouvez passer les questions :

```tsx
<TitanicAnalysisPanel
  submission={submission}
  itemTitle={item.title}
  questions={[
    { id: 'q1', label: 'Combien de lignes vois-tu ?' },
    { id: 'q2', label: 'Quelles colonnes sont numériques ?' },
    ...
  ]}
/>
```

### Modifier le prompt d'analyse

Éditez `src/lib/titanicAnalyzer.ts` pour personnaliser les prompts d'analyse IA.

## 🐛 Dépannage

### L'uploader n'apparaît pas

- Vérifiez que le titre du TP contient "Titanic", "Big Data", "Data Science" ou "Machine Learning"
- Vérifiez que `item.content.titanicModule` est défini

### L'analyse IA ne fonctionne pas

- Vérifiez que `VITE_OPENROUTER_API_KEY` est configurée
- Vérifiez les logs de la console pour les erreurs
- Vérifiez que le modèle OpenRouter est disponible

### Les données ne s'affichent pas

- Vérifiez que `submission.answer_json.titanicData` existe
- Vérifiez que le format JSON est correct
- Vérifiez les logs de la console

## 📝 Notes importantes

- Les données JSON sont stockées dans `submission.answer_json.titanicData`
- L'analyse IA est stockée dans `submission.answer_json.aiAnalysis`
- Les étudiants peuvent réimporter leurs réponses (écrase les précédentes)
- Les formateurs peuvent ré-analyser les réponses à tout moment

## 🔗 Liens utiles

- **Application Titanic** : https://titaniclearning.netlify.app
- **OpenRouter** : https://openrouter.ai/
- **Documentation OpenRouter** : https://openrouter.ai/docs

---

**Bon usage ! 🚀**
