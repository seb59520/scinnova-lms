# Guide d'utilisation - TP Pas à Pas

## Vue d'ensemble

Le système de TP pas à pas permet de créer des travaux pratiques structurés avec des cases à cocher que les étudiants peuvent utiliser pour suivre leur progression. Les formateurs peuvent visualiser l'avancement de tous leurs étudiants en temps réel.

## Pour les formateurs

### Créer un TP pas à pas

1. **Accédez à l'éditeur de cours** : `/admin/courses/[courseId]/edit`
2. **Créez un nouvel item** de type `tp`
3. **Dans le champ `content`**, ajoutez le JSON au format suivant :

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
            "text": "Bienvenue dans ce TP !"
          }
        ]
      }
    ]
  },
  "steps": [
    {
      "id": "step-1",
      "title": "Première étape",
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
            "text": "Félicitations !"
          }
        ]
      }
    ]
  }
}
```

### Utiliser le modèle

1. **Téléchargez le modèle** :
   - Via le navigateur : `/tp-step-by-step-template.json`
   - Via le script : `node scripts/download-tp-step-by-step-template.js`

2. **Modifiez le modèle** selon vos besoins

3. **Importez-le** dans votre cours via l'interface d'administration

### Suivre l'avancement des étudiants

Pour visualiser la progression de tous les étudiants sur un TP pas à pas, utilisez le composant `StepByStepTpProgressViewer` :

```tsx
import { StepByStepTpProgressViewer } from '../components/trainer/StepByStepTpProgressViewer';

<StepByStepTpProgressViewer
  itemId={itemId}
  courseId={courseId}
  sessionId={sessionId} // optionnel
/>
```

**Fonctionnalités disponibles** :
- Vue d'ensemble avec statistiques globales
- Liste des étudiants avec leur progression
- Détail étape par étape pour chaque étudiant
- Tri par nom, progression ou dernière activité
- Filtrage (tous, terminés, en cours)
- Export CSV des progressions

## Pour les étudiants

### Utiliser un TP pas à pas

1. **Ouvrez le TP** dans votre cours
2. **Lisez l'introduction** pour comprendre les objectifs
3. **Suivez les étapes** dans l'ordre indiqué
4. **Cochez chaque étape** au fur et à mesure de votre progression
5. **La progression est sauvegardée automatiquement**

### Fonctionnalités visibles

- **Barre de progression** : Affiche le pourcentage d'avancement
- **Statistiques** : Nombre d'étapes complétées / total
- **Cases à cocher** : Cliquez pour marquer une étape comme complétée
- **Message de conclusion** : Affiché automatiquement quand toutes les étapes sont complétées

## Structure des données

### Format du contenu

Le champ `content` d'un item de type `tp` doit contenir :

```typescript
interface StepByStepTpContent {
  type: 'step-by-step';
  introduction?: TipTapJSON | string;
  steps: Step[];
  conclusion?: TipTapJSON | string;
}

interface Step {
  id: string;              // Identifiant unique
  title: string;           // Titre de l'étape
  order: number;          // Ordre d'affichage
  estimatedTime?: string; // Ex: "15 min"
  description?: TipTapJSON | string;
}
```

### Stockage de la progression

La progression est stockée dans la table `submissions` :

```typescript
{
  user_id: string;
  item_id: string;
  answer_json: {
    stepProgress: [
      {
        stepId: string;
        checked: boolean;
        checkedAt?: string; // ISO date
      }
    ];
    lastUpdated: string; // ISO date
  };
  status: 'draft'; // Reste en draft tant que non soumis
}
```

## Exemples

### Exemple simple

```json
{
  "type": "step-by-step",
  "introduction": "Installez et configurez votre environnement de développement.",
  "steps": [
    {
      "id": "install",
      "title": "Installation",
      "order": 1,
      "description": "Installez Node.js et npm"
    },
    {
      "id": "config",
      "title": "Configuration",
      "order": 2,
      "description": "Configurez votre projet"
    }
  ]
}
```

### Exemple avec format TipTap

```json
{
  "type": "step-by-step",
  "introduction": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [
          { "type": "text", "text": "Objectif" }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Créer une API REST complète." }
        ]
      }
    ]
  },
  "steps": [
    {
      "id": "step-1",
      "title": "Initialiser le projet",
      "order": 1,
      "estimatedTime": "15 min",
      "description": {
        "type": "doc",
        "content": [
          {
            "type": "bulletList",
            "content": [
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Créer le dossier" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## Ajouter des captures d'écran

Les captures d'écran sont très utiles pour guider les étudiants dans les TP. Vous pouvez les ajouter directement dans les descriptions des étapes au format TipTap.

### Méthode 1 : Via l'éditeur TipTap (recommandé)

1. **Dans l'éditeur de cours**, ouvrez l'item TP
2. **Cliquez sur l'icône d'image** dans la barre d'outils de l'éditeur TipTap
3. **Choisissez une option** :
   - **Uploader un fichier** : Sélectionnez une image depuis votre ordinateur (elle sera uploadée dans Supabase Storage)
   - **Utiliser une URL** : Collez l'URL d'une image existante
4. **Ajoutez un texte alternatif** (alt) pour l'accessibilité
5. **Ajustez la taille** si nécessaire (petite, moyenne, grande)
6. L'image sera automatiquement intégrée dans le JSON TipTap

### Méthode 2 : Ajouter manuellement dans le JSON

Si vous préférez modifier directement le JSON, ajoutez un nœud `image` dans le tableau `content` de la description :

```json
{
  "type": "image",
  "attrs": {
    "src": "https://votre-domaine.com/capture-ecran.png",
    "alt": "Description de l'image",
    "title": "Titre optionnel"
  }
}
```

**Exemple complet avec image** :

```json
{
  "id": "step-1",
  "title": "Configuration de l'environnement",
  "order": 1,
  "description": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Ouvrez votre terminal et exécutez la commande suivante :"
          }
        ]
      },
      {
        "type": "image",
        "attrs": {
          "src": "https://exemple.com/capture-terminal.png",
          "alt": "Capture d'écran du terminal",
          "title": "Commande à exécuter"
        }
      },
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Vous devriez voir le résultat suivant :"
          }
        ]
      }
    ]
  }
}
```

### Stockage des images

- Les images uploadées via l'éditeur sont stockées dans le bucket Supabase `course-assets`
- Le chemin est automatiquement généré : `images/[timestamp].[extension]`
- Les images sont accessibles publiquement via l'URL Supabase Storage

### Bonnes pratiques pour les captures d'écran

1. **Utilisez des images de bonne qualité** mais optimisées (format PNG ou JPG compressé)
2. **Ajoutez toujours un texte alternatif** (alt) pour l'accessibilité
3. **Placez les images après le texte explicatif** pour un meilleur contexte
4. **Utilisez des titres descriptifs** pour aider les étudiants à comprendre l'image
5. **Testez l'affichage** sur différents écrans (mobile, tablette, desktop)

## Bonnes pratiques

1. **Utilisez des IDs uniques** pour chaque étape
2. **Ordonnez les étapes** avec le champ `order`
3. **Ajoutez des temps estimés** pour aider les étudiants à planifier
4. **Rédigez des descriptions claires** et actionnables
5. **Ajoutez des captures d'écran** pour guider visuellement les étudiants
6. **Testez le TP** avant de le publier

## Dépannage

### Le TP ne s'affiche pas correctement

- Vérifiez que `content.type === 'step-by-step'`
- Vérifiez que `content.steps` est un tableau
- Vérifiez la structure JSON dans la console du navigateur

### La progression ne se sauvegarde pas

- Vérifiez que l'utilisateur est connecté
- Vérifiez les permissions RLS dans Supabase
- Vérifiez la console pour les erreurs

### Les formateurs ne voient pas les progressions

- Vérifiez que le composant `StepByStepTpProgressViewer` est utilisé
- Vérifiez que les étudiants ont bien créé des soumissions
- Vérifiez les filtres appliqués (courseId, sessionId)

## Support

Pour toute question ou problème :
1. Consultez le README : `README-TP-PAS-A-PAS.md`
2. Vérifiez les logs dans la console du navigateur
3. Contactez l'équipe de développement
