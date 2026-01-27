# TP Pas à Pas avec Cases à Cocher

Ce module permet de créer des TPs (Travaux Pratiques) pas à pas avec des cases à cocher que les étudiants peuvent cocher au fur et à mesure de leur progression. Les formateurs peuvent suivre l'avancement de tous leurs étudiants en temps réel.

## Fonctionnalités

- ✅ **Cases à cocher interactives** : Les étudiants peuvent cocher chaque étape au fur et à mesure
- 📊 **Suivi de progression** : Barre de progression et statistiques en temps réel
- 👥 **Vue formateur** : Suivi de l'avancement de tous les étudiants
- 💾 **Sauvegarde automatique** : La progression est sauvegardée automatiquement dans Supabase
- 📥 **Export CSV** : Les formateurs peuvent exporter les progressions au format CSV
- 📄 **Modèle téléchargeable** : Un modèle JSON est disponible pour créer rapidement de nouveaux TPs

## Format JSON

Un TP pas à pas doit avoir un `content` avec la structure suivante :

```json
{
  "type": "step-by-step",
  "introduction": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Texte d'introduction..."
          }
        ]
      }
    ]
  },
  "steps": [
    {
      "id": "step-1",
      "title": "Titre de l'étape",
      "order": 1,
      "estimatedTime": "15 min",
      "description": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Description de l'étape..."
              }
            ]
          }
        ]
      }
    }
  ],
  "conclusion": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Message de conclusion..."
          }
        ]
      }
    ]
  }
}
```

### Champs requis

- `type`: Doit être `"step-by-step"`
- `steps`: Tableau d'étapes, chaque étape doit avoir :
  - `id`: Identifiant unique de l'étape
  - `title`: Titre de l'étape
  - `order`: Numéro d'ordre (pour le tri)
  - `description`: Description de l'étape (format TipTap JSON ou string)

### Champs optionnels

- `introduction`: Texte d'introduction (format TipTap JSON ou string)
- `conclusion`: Texte de conclusion affiché quand toutes les étapes sont complétées
- `estimatedTime`: Temps estimé pour chaque étape (ex: "15 min")

## Utilisation

### Pour les étudiants

1. Ouvrez le TP dans le portail
2. Lisez l'introduction
3. Suivez les étapes dans l'ordre
4. Cochez chaque étape au fur et à mesure de votre progression
5. La progression est sauvegardée automatiquement

### Pour les formateurs

1. Créez un item de type `tp` dans votre cours
2. Ajoutez le contenu au format JSON décrit ci-dessus dans le champ `content`
3. Les étudiants verront automatiquement le TP pas à pas avec les cases à cocher
4. Pour suivre l'avancement, utilisez le composant `StepByStepTpProgressViewer`

## Télécharger le modèle

Un modèle JSON est disponible à l'adresse suivante :

```
/public/tp-step-by-step-template.json
```

Vous pouvez :
1. Télécharger ce fichier depuis le navigateur
2. Le modifier selon vos besoins
3. L'importer dans votre cours via l'interface d'administration

## Exemple d'intégration dans un cours

```typescript
// Dans l'éditeur de cours, créez un item avec :
{
  "type": "tp",
  "title": "TP Installation et Configuration",
  "content": {
    "type": "step-by-step",
    "introduction": "...",
    "steps": [
      {
        "id": "step-1",
        "title": "Installation",
        "order": 1,
        "description": "..."
      }
    ]
  }
}
```

## Composants React

### StepByStepTpRenderer

Composant principal qui affiche le TP pas à pas pour les étudiants.

```tsx
<StepByStepTpRenderer
  item={item}
  submission={submission}
  onSubmissionUpdate={onSubmissionUpdate}
  viewingUserId={viewingUserId}
/>
```

### StepByStepTpProgressViewer

Composant pour les formateurs pour suivre l'avancement de tous les étudiants.

```tsx
<StepByStepTpProgressViewer
  itemId={itemId}
  courseId={courseId}
  sessionId={sessionId}
/>
```

## Structure de données

La progression est stockée dans la table `submissions` avec la structure suivante dans `answer_json` :

```json
{
  "stepProgress": [
    {
      "stepId": "step-1",
      "checked": true,
      "checkedAt": "2026-01-25T10:30:00Z"
    }
  ],
  "lastUpdated": "2026-01-25T10:30:00Z"
}
```

## Notes techniques

- La progression est sauvegardée automatiquement à chaque coche/décoche
- Le statut de la soumission reste en `draft` tant que toutes les étapes ne sont pas complétées
- Les formateurs peuvent voir la progression de tous les étudiants inscrits au cours
- L'export CSV inclut toutes les informations de progression

## Support

Pour toute question ou problème, contactez l'équipe de développement.
