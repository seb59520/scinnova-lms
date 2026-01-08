# Guide : Slides avec Contexte Pédagogique

## 📋 Vue d'ensemble

Cette fonctionnalité permet de dissocier clairement le **support projeté** (slides) du **savoir transmis** (contexte pédagogique), comme dans une vraie salle de formation.

### Objectif pédagogique

- **Le slide** = support visuel projeté
- **Le contenu associé** = discours / explication du formateur

---

## 🎯 Structure des composants

### 1. SlideBlock (Support projeté)

Le composant `SlideBlock` affiche :
- La slide si elle existe (image, PDF, ou contenu rich text)
- Un message d'avertissement clair si aucun slide n'est présent

**Message d'avertissement affiché :**
```
⚠️ Aucun slide projeté pour cette section
Le contenu pédagogique sera disponible ci-dessous une fois le slide ajouté.
```

### 2. ContextBlock (Contexte pédagogique)

Le composant `ContextBlock` affiche sous chaque slide :
- Les explications du formateur
- Des exemples concrets
- Des annotations pédagogiques
- Des points clés à retenir

**Caractéristiques visuelles :**
- Légèrement indenté vers la droite (`ml-8 md:ml-12`)
- Fond clair avec bordure gauche colorée
- Icône "MessageSquare" pour identifier le contexte
- Aspect "annotation / commentaire formateur"

---

## 📝 Structure JSON

### Structure de base pour une slide

```json
{
  "type": "slide",
  "title": "Titre de la slide",
  "position": 1,
  "published": true,
  "asset_path": "module1/slide1.png",  // Optionnel : image ou PDF
  "content": {
    "summary": "Résumé optionnel de la slide",
    "body": { /* Format TipTap JSON */ },  // Optionnel : contenu rich text
    "pedagogical_context": {
      "text": "Texte simple du contexte pédagogique",
      // OU
      "body": { /* Format TipTap JSON pour contenu riche */ },
      // OU
      "description": "Description simple"
    }
  }
}
```

### Exemples de structures

#### Exemple 1 : Slide avec image + contexte texte simple

```json
{
  "type": "slide",
  "title": "Slide 1.1 : Qu'est-ce qu'une API ?",
  "position": 1,
  "published": true,
  "asset_path": "module1/slide-api-intro.png",
  "content": {
    "summary": "Cette slide présente les concepts de base des APIs",
    "pedagogical_context": {
      "text": "Bonjour, nous allons commencer par comprendre ce qu'est une API. Sur cette slide, vous voyez une représentation visuelle du principe client-serveur.\n\nPoints clés à retenir :\n- L'API définit ce qui est disponible\n- Elle sécurise l'accès aux données"
    }
  }
}
```

#### Exemple 2 : Slide avec contenu rich text + contexte rich text

```json
{
  "type": "slide",
  "title": "Slide 1.2 : Types d'APIs",
  "position": 2,
  "published": true,
  "content": {
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            { "type": "text", "text": "Types d'APIs" }
          ]
        }
      ]
    },
    "pedagogical_context": {
      "body": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Ici, nous voyons les deux principaux types d'APIs modernes. "
              },
              {
                "type": "text",
                "marks": [{ "type": "bold" }],
                "text": "REST"
              },
              {
                "type": "text",
                "text": " est le standard le plus répandu."
              }
            ]
          }
        ]
      }
    }
  }
}
```

#### Exemple 3 : Slide sans contenu (avertissement affiché)

```json
{
  "type": "slide",
  "title": "Slide 1.3 : Exemple sans slide",
  "position": 3,
  "published": true,
  "content": {
    "pedagogical_context": {
      "text": "Cette section n'a pas encore de slide projeté. Le message d'avertissement sera affiché automatiquement."
    }
  }
}
```

---

## 🎨 Styles et UX

### Hiérarchie visuelle

1. **Slide principale** (SlideBlock)
   - Zone principale, bien visible
   - Fond blanc avec ombre légère
   - Centré et lisible

2. **Contexte pédagogique** (ContextBlock)
   - Indenté vers la droite
   - Fond gris clair (`#F9FAFB`)
   - Bordure gauche colorée (couleur du thème)
   - Icône + titre "Contexte pédagogique"

3. **Message d'avertissement** (si slide absente)
   - Fond jaune clair (`#FEF3C7`)
   - Bordure jaune/ambre
   - Icône d'alerte
   - Message clair et pédagogique

### Responsive

- **Desktop** : Indentation `ml-12` (48px)
- **Mobile/Tablette** : Indentation `ml-8` (32px)
- Les slides s'adaptent automatiquement à la taille de l'écran

---

## 🔧 Utilisation dans le code

### Import des composants

```typescript
import { SlideBlock } from '../components/SlideBlock'
import { ContextBlock } from '../components/ContextBlock'
```

### Utilisation dans renderSlide

La fonction `renderSlide` dans `ReactRenderer.tsx` utilise automatiquement ces composants :

```typescript
function renderSlide(item: CourseJson['modules'][0]['items'][0], theme: any) {
  return (
    <div className="slide-container space-y-0">
      {/* Slide principale */}
      <SlideBlock item={item} theme={theme} />
      
      {/* Contexte pédagogique */}
      {item.content?.pedagogical_context && (
        <ContextBlock 
          context={item.content.pedagogical_context} 
          theme={theme} 
        />
      )}
      
      {/* Chapitres si disponibles */}
      {item.chapters && item.chapters.length > 0 && (
        <div className="mt-6">
          <ChapterList chapters={item.chapters} theme={theme} />
        </div>
      )}
    </div>
  )
}
```

---

## ✅ Checklist pour créer une slide

- [ ] Définir le type : `"type": "slide"`
- [ ] Ajouter un titre descriptif
- [ ] Optionnel : Ajouter `asset_path` (image ou PDF)
- [ ] Optionnel : Ajouter `content.body` (contenu rich text)
- [ ] **Recommandé** : Ajouter `content.pedagogical_context` avec :
  - Explications du formateur
  - Points clés à retenir
  - Exemples concrets
  - Contextualisation

---

## 📚 Exemple complet

Voir le fichier `exemple-slide-avec-contexte.json` pour un exemple complet de cours avec plusieurs slides et contextes pédagogiques.

---

## 🎓 Bonnes pratiques

1. **Toujours ajouter un contexte pédagogique** même si la slide est claire
2. **Utiliser des exemples concrets** dans le contexte
3. **Séparer visuellement** le slide du contexte (indentation)
4. **Message d'avertissement** : utile pour identifier les slides manquantes
5. **Format du contexte** :
   - Texte simple pour des explications courtes
   - Format TipTap JSON pour du contenu riche (listes, gras, etc.)

---

## 🔄 Évolution future

- Possibilité d'ajouter des timestamps pour synchroniser le contexte avec une vidéo
- Support pour des annotations interactives
- Export du contexte pédagogique séparément


