# Guide : Générateur de Cours IA

## 📋 Description

Le générateur de cours IA permet de créer automatiquement un cours complet au format JSON compatible avec votre LMS à partir d'une description détaillée. L'IA génère la structure complète du cours avec modules, items, chapitres, quiz, exercices et jeux.

## 🚀 Accès

1. Allez dans **Administration** → **Formations**
2. Cliquez sur le bouton **"Générer avec IA"** (icône Sparkles)
3. Ou accédez directement à `/admin/courses/ai-generator`

## 📝 Utilisation

### Mode 1 : Import depuis un texte structuré (Recommandé)

Si vous avez un programme de formation, un référentiel ou un document structuré :

1. **Sélectionnez l'onglet "Importer depuis un texte"**
2. **Collez le contenu** dans la zone de texte
3. **Cliquez sur "Extraire les informations"**
4. Le système extrait automatiquement :
   - ✅ Titre du cours
   - ✅ Référence (si présente)
   - ✅ Objectif général
   - ✅ Compétences visées
   - ✅ Niveau de difficulté
   - ✅ Durée
   - ✅ Profils des stagiaires
   - ✅ Prérequis
   - ✅ Objectifs pédagogiques
   - ✅ Modules avec leur contenu et durées
   - ✅ Travaux pratiques
5. **Vérifiez et modifiez** les informations extraites si nécessaire
6. **Générez le cours** avec l'IA

**Format supporté :**
Le parser reconnaît les formats suivants :
- Titres avec puces (•, -, *)
- Numérotation (1., 2., a), b), etc.)
- Sections structurées (Objectifs, Compétences, Modules, etc.)
- Durées entre parenthèses (ex: 2 heures, 0,5 heure)

**Exemple de texte importable :**
```
Exchange Server – Administration
Référence 2-004
Objectif général : À l'issue de la formation, les participants seront capables de...
Compétences visées :
• Configurer et administrer un serveur Exchange
• Déployer les différents types de clients
Niveau : Maîtrise
Durée : 30.00 heures (5.00 jours)
...
```

### Mode 2 : Saisie manuelle

### 1. Remplir le formulaire

#### Champs obligatoires
- **Titre du cours** : Le titre principal du cours
- **Description détaillée** : Une description complète du contenu, des concepts à couvrir, l'approche pédagogique

#### Champs optionnels (mais recommandés)
- **Thème / Domaine** : Le domaine du cours (ex: Intelligence Artificielle, Développement Web)
- **Public cible** : Le public visé (ex: Débutants, Développeurs confirmés)
- **Durée estimée** : La durée du cours (ex: 20 heures, 5 jours)
- **Niveau de difficulté** : Débutant, Intermédiaire ou Avancé

#### Objectifs pédagogiques
- Ajoutez autant d'objectifs que nécessaire
- Chaque objectif sera pris en compte par l'IA pour structurer le cours

#### Modules suggérés
- Vous pouvez suggérer les modules à créer
- Si laissé vide, l'IA créera une structure adaptée au sujet

#### Options de contenu
- ✅ **Quiz interactifs** : Génère des quiz avec questions à choix multiples
- ✅ **Exercices pratiques** : Génère des exercices avec questions et corrections
- ✅ **Jeux pédagogiques** : Génère des jeux interactifs (matching, etc.)

### 2. Générer le cours

1. Cliquez sur **"Générer le cours"**
2. La progression s'affiche en temps réel :
   - Préparation du prompt
   - Génération du cours via IA
   - Traitement de la réponse
   - Validation du JSON
3. Le cours généré apparaît dans le panneau de droite

### 3. Examiner le résultat

Le panneau de droite affiche :
- **Vue structure** : Vue d'ensemble avec modules et items
- **Vue JSON** : Le JSON complet (bouton Code/Eye)

### 4. Actions disponibles

#### Télécharger le JSON
- Cliquez sur l'icône **Download**
- Le fichier JSON est téléchargé avec le nom `{titre-du-cours}-course.json`

#### Importer dans l'éditeur
- Cliquez sur **"Importer dans l'éditeur"**
- Le cours est chargé dans l'éditeur JSON
- Vous pouvez modifier, sauvegarder et publier

## ⚙️ Configuration requise

### Clé API OpenRouter

Le générateur utilise OpenRouter pour accéder à différents modèles d'IA (Gemini, GPT, Claude).

1. Créez un compte sur [https://openrouter.ai/](https://openrouter.ai/)
2. Générez une clé API dans la section "Keys"
3. Ajoutez-la dans votre fichier `.env` :
   ```env
   VITE_OPENROUTER_API_KEY=votre_cle_ici
   VITE_OPENROUTER_MODEL=google/gemini-3-flash-preview
   ```
4. Redémarrez votre serveur de développement

### Modèles supportés

Le générateur essaie automatiquement plusieurs modèles dans cet ordre :
1. Le modèle configuré dans `.env` (`VITE_OPENROUTER_MODEL`)
2. `google/gemini-3-flash-preview` (recommandé)
3. `google/gemini-3-pro-preview`
4. `google/gemini-1.5-pro`
5. `openai/gpt-4o-mini`
6. `anthropic/claude-3-haiku`

## 📊 Structure générée

Le cours généré respecte le format JSON strict du LMS :

```json
{
  "title": "Titre du cours",
  "description": "Description complète",
  "status": "draft",
  "access_type": "free",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Module 1",
      "position": 0,
      "items": [
        {
          "type": "resource",
          "title": "Titre de l'item",
          "position": 0,
          "published": true,
          "content": { /* Format TipTap JSON */ },
          "chapters": [ /* Chapitres optionnels */ ]
        }
      ]
    }
  ]
}
```

## 🎯 Types d'items générés

### Resource
Contenu de cours avec texte riche au format TipTap JSON.

### Slide
Support de présentation avec contenu structuré.

### Exercise
Exercice pratique avec question et correction.

### TP
Travaux pratiques avec instructions et checklist.

### Game/Quiz
Quiz interactif avec :
- Questions à choix multiples
- Niveaux de difficulté
- Explications détaillées
- Système de scoring

## ✅ Validation automatique

Le générateur valide automatiquement :
- ✅ Présence des champs requis (title, description, status, access_type)
- ✅ Structure des modules (title, position, items)
- ✅ Structure des items (type, title, position)
- ✅ Format TipTap JSON valide
- ✅ Positions cohérentes (0-indexed)

## 🔧 Personnalisation après génération

Une fois le cours généré, vous pouvez :
1. **Modifier le JSON** dans l'éditeur
2. **Ajouter des modules** manuellement
3. **Modifier le contenu** des items
4. **Ajouter des chapitres** aux items
5. **Ajuster les thèmes** (couleurs, polices)
6. **Ajouter des assets** (PDF, images, etc.)

## 🚨 Erreurs courantes

### "VITE_OPENROUTER_API_KEY n'est pas configurée"
- Vérifiez que la clé est bien dans le fichier `.env`
- Redémarrez le serveur après modification

### "Tous les modèles ont échoué"
- Vérifiez votre connexion internet
- Vérifiez que votre clé API est valide
- Vérifiez votre crédit OpenRouter

### "Le JSON généré est invalide"
- L'IA peut parfois générer du JSON mal formaté
- Essayez de régénérer avec une description plus détaillée
- Vérifiez manuellement le JSON dans l'éditeur

## 💡 Conseils pour de meilleurs résultats

1. **Description détaillée** : Plus la description est précise, meilleur sera le cours généré
2. **Objectifs clairs** : Définissez des objectifs pédagogiques précis
3. **Modules suggérés** : Suggérez une structure de modules si vous avez une idée précise
4. **Niveau adapté** : Indiquez le bon niveau de difficulté
5. **Contenu varié** : Cochez les options de contenu pour avoir une variété d'items

## 📚 Exemples de descriptions efficaces

### Exemple 1 : Cours technique
```
Titre : Introduction à React
Description : Cours complet sur React pour débutants. Couvre les hooks, les composants, le state management, et la création d'applications modernes. Approche pratique avec des exemples concrets.
Niveau : Débutant
Durée : 20 heures
```

### Exemple 2 : Cours métier
```
Titre : Gestion de projet Agile
Description : Formation sur les méthodologies Agile (Scrum, Kanban). Inclut les rituels, les rôles, la planification et la gestion des sprints. Cas pratiques et simulations.
Niveau : Intermédiaire
Durée : 15 heures
```

## 🔄 Workflow recommandé

1. **Générer** le cours avec l'IA
2. **Examiner** la structure générée
3. **Importer** dans l'éditeur
4. **Personnaliser** le contenu si nécessaire
5. **Sauvegarder** et **publier**

## 🆘 Support

En cas de problème :
1. Vérifiez les logs de la console (F12)
2. Vérifiez la configuration OpenRouter
3. Consultez la documentation des formats JSON : `FORMATS-JSON.md`
4. Contactez l'administrateur système

---

**Note** : Le générateur IA est un outil d'aide à la création. Il est recommandé de toujours réviser et personnaliser le contenu généré avant publication.

