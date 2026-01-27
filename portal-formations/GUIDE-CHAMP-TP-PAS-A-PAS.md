# Guide : Dans quel champ créer un TP pas à pas ?

## Méthode recommandée : Éditeur JSON

Pour créer un TP pas à pas avec cases à cocher, vous devez utiliser **l'éditeur JSON** car le format est complexe et nécessite une structure JSON précise.

## Étapes pour créer un TP pas à pas

### 1. Créer l'item de base

1. Allez dans **Administration** → **Cours** → Sélectionnez votre cours
2. Cliquez sur **"Ajouter un élément"** ou **"Modifier"** un élément existant
3. Sélectionnez le type **"TP"**
4. Remplissez au minimum le **Titre** et sauvegardez

### 2. Accéder à l'éditeur JSON

Une fois l'item créé, vous avez deux options :

#### Option A : Via l'URL directe
Remplacez `[ITEM_ID]` par l'ID de votre item :
```
/admin/items/[ITEM_ID]/json
```

#### Option B : Via le menu (si disponible)
Cherchez un bouton **"Éditer en JSON"** ou **"JSON"** dans l'interface d'édition

### 3. Modifier le champ `content`

Dans l'éditeur JSON, vous verrez une structure comme ceci :

```json
{
  "type": "tp",
  "title": "Mon TP pas à pas",
  "content": {
    // ← C'EST ICI qu'il faut mettre le contenu du TP pas à pas
  }
}
```

**Remplacez le champ `content`** par la structure suivante :

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
            "text": "Bienvenue dans ce TP pas à pas !"
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
    },
    {
      "id": "step-2",
      "title": "Deuxième étape",
      "order": 2,
      "estimatedTime": "20 min",
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
            "text": "Félicitations ! Vous avez terminé ce TP."
          }
        ]
      }
    ]
  }
}
```

### 4. Utiliser le modèle

Pour gagner du temps, vous pouvez :

1. **Télécharger le modèle** : `/public/tp-step-by-step-template.json`
2. **Copier le contenu** du champ `content` du modèle
3. **Coller** dans le champ `content` de votre item dans l'éditeur JSON
4. **Adapter** selon vos besoins

## Structure simplifiée (texte simple)

Si vous préférez utiliser du texte simple au lieu du format TipTap JSON, vous pouvez aussi utiliser :

```json
{
  "type": "step-by-step",
  "introduction": "Bienvenue dans ce TP pas à pas !",
  "steps": [
    {
      "id": "step-1",
      "title": "Première étape",
      "order": 1,
      "estimatedTime": "15 min",
      "description": "Description de l'étape en texte simple..."
    }
  ],
  "conclusion": "Félicitations !"
}
```

## Champs importants

### Dans `content` :
- **`type`** : Doit être `"step-by-step"` (obligatoire)
- **`steps`** : Tableau d'étapes (obligatoire)
  - Chaque étape doit avoir :
    - `id` : Identifiant unique (ex: "step-1")
    - `title` : Titre de l'étape
    - `order` : Numéro d'ordre (1, 2, 3...)
    - `description` : Description (format TipTap JSON ou texte simple)
    - `estimatedTime` : Temps estimé (optionnel, ex: "15 min")

### Optionnels :
- **`introduction`** : Texte d'introduction
- **`conclusion`** : Texte affiché quand toutes les étapes sont complétées

## Exemple complet dans l'éditeur JSON

```json
{
  "type": "tp",
  "title": "TP Installation et Configuration",
  "position": 0,
  "published": true,
  "content": {
    "type": "step-by-step",
    "introduction": "Dans ce TP, vous allez installer et configurer votre environnement de développement.",
    "steps": [
      {
        "id": "install",
        "title": "Installation de Node.js",
        "order": 1,
        "estimatedTime": "15 min",
        "description": "Téléchargez et installez Node.js depuis le site officiel."
      },
      {
        "id": "config",
        "title": "Configuration du projet",
        "order": 2,
        "estimatedTime": "20 min",
        "description": "Créez un nouveau projet et configurez les dépendances."
      }
    ],
    "conclusion": "Bravo ! Votre environnement est maintenant configuré."
  }
}
```

## Vérification

Après avoir sauvegardé :

1. **Ouvrez le TP** en tant qu'étudiant
2. **Vérifiez** que les cases à cocher apparaissent
3. **Testez** en cochant une étape
4. **Vérifiez** que la progression se sauvegarde

## Pour les formateurs

Une fois le TP créé, les formateurs verront automatiquement une section **"Suivi de progression des étudiants"** en bas de la page du TP, avec :
- Statistiques globales
- Liste des étudiants et leur progression
- Export CSV

## Aide supplémentaire

- Consultez `GUIDE-TP-PAS-A-PAS.md` pour plus de détails
- Consultez `README-TP-PAS-A-PAS.md` pour la documentation technique
- Téléchargez le modèle : `/public/tp-step-by-step-template.json`
