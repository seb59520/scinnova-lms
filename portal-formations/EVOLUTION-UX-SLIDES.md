# Évolution UX : Slides avec Contexte Pédagogique

## 📋 Résumé de la solution

Cette évolution de l'UX permet de reproduire l'expérience d'un cours réel avec support projeté, commenté et enrichi en temps réel par le formateur.

---

## ✅ Fonctionnalités implémentées

### 1️⃣ Gestion et affichage des slides (support projeté)

✅ **Composant `SlideBlock`** créé
- Affiche la slide si elle existe (image, PDF, ou contenu rich text)
- Affiche un message d'avertissement clair si aucun slide n'est présent :
  ```
  ⚠️ Aucun slide projeté pour cette section
  Le contenu pédagogique sera disponible ci-dessous une fois le slide ajouté.
  ```

**Fichier :** `src/components/SlideBlock.tsx`

### 2️⃣ Contenu pédagogique sous chaque slide (contexte)

✅ **Composant `ContextBlock`** créé
- Visuellement distinct du slide
- Légèrement indenté vers la droite (`ml-8 md:ml-12`)
- Aspect "annotation / commentaire formateur"
- Fond clair avec bordure gauche colorée
- Icône "MessageSquare" pour identifier le contexte

**Fichier :** `src/components/ContextBlock.tsx`

**Utilisation :**
- Explications du formateur
- Contextualisation
- Exemples concrets
- Points clés à retenir

### 3️⃣ Bandeau Lexique & Définitions (aide permanente)

✅ **Système existant amélioré**
- Le lexique est déjà implémenté dans `src/pages/Lexique.tsx`
- Accessible via un drawer à droite dans `CourseView.tsx`
- Visible directement dans la fenêtre du cours
- Repliable sur mobile, fixe sur desktop

**Améliorations possibles (futures) :**
- Lier les termes du lexique aux slides concernées
- Recherche améliorée
- Export du lexique

---

## 📁 Structure des fichiers créés/modifiés

### Nouveaux fichiers

1. **`src/components/SlideBlock.tsx`**
   - Composant pour afficher les slides
   - Gère les messages d'avertissement

2. **`src/components/ContextBlock.tsx`**
   - Composant pour le contexte pédagogique
   - Style indenté et distinct

3. **`exemple-slide-avec-contexte.json`**
   - Exemple complet de structure JSON
   - Montre les différents cas d'usage

4. **`GUIDE-SLIDES-CONTEXTE.md`**
   - Documentation complète
   - Exemples et bonnes pratiques

### Fichiers modifiés

1. **`src/components/ReactRenderer.tsx`**
   - Import des nouveaux composants
   - Modification de `renderSlide()` pour utiliser `SlideBlock` et `ContextBlock`

2. **`src/types/courseJson.ts`**
   - Ajout du type `pedagogical_context` dans `content`
   - Support pour `text`, `body` (TipTap), ou `description`

---

## 🎨 Layout JSX proposé

### Structure d'affichage

```jsx
<div className="slide-container space-y-0">
  {/* 1. Slide principale (support projeté) */}
  <SlideBlock item={item} theme={theme} />
  
  {/* 2. Contexte pédagogique (indenté, sous la slide) */}
  {item.content?.pedagogical_context && (
    <ContextBlock 
      context={item.content.pedagogical_context} 
      theme={theme} 
    />
  )}
  
  {/* 3. Chapitres si disponibles */}
  {item.chapters && item.chapters.length > 0 && (
    <div className="mt-6">
      <ChapterList chapters={item.chapters} theme={theme} />
    </div>
  )}
</div>
```

### Hiérarchie visuelle

```
┌─────────────────────────────────────┐
│  SLIDE PRINCIPALE (SlideBlock)      │
│  - Image/PDF ou Rich Text           │
│  - Message d'avertissement si vide  │
└─────────────────────────────────────┘
    ┌─────────────────────────────────┐
    │  CONTEXTE PÉDAGOGIQUE            │
    │  (ContextBlock - indenté)        │
    │  - Explications                  │
    │  - Exemples                      │
    │  - Points clés                   │
    └─────────────────────────────────┘
```

---

## 📊 Structure de données (JSON/Supabase)

### Structure pour une slide avec contexte

```json
{
  "type": "slide",
  "title": "Titre de la slide",
  "position": 1,
  "published": true,
  "asset_path": "module1/slide1.png",  // Optionnel
  "content": {
    "summary": "Résumé optionnel",
    "body": { /* TipTap JSON */ },  // Optionnel
    "pedagogical_context": {
      "text": "Texte simple",
      // OU
      "body": { /* TipTap JSON */ },
      // OU
      "description": "Description simple"
    }
  }
}
```

### Champs disponibles

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `type` | string | `"slide"` | ✅ Oui |
| `title` | string | Titre de la slide | ✅ Oui |
| `asset_path` | string | Chemin vers image/PDF | ❌ Non |
| `content.body` | object | Contenu TipTap JSON | ❌ Non |
| `content.pedagogical_context` | object | Contexte pédagogique | ❌ Non (recommandé) |
| `content.pedagogical_context.text` | string | Texte simple | ❌ Non |
| `content.pedagogical_context.body` | object | TipTap JSON | ❌ Non |
| `content.pedagogical_context.description` | string | Description | ❌ Non |

---

## 🎯 Styles CSS/Tailwind

### SlideBlock

```css
.slide-block {
  /* Conteneur principal */
  margin-bottom: 1.5rem;
}

.slide-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}
```

### ContextBlock

```css
.context-block {
  margin-top: 1rem;
  margin-bottom: 1.5rem;
}

.context-block > div {
  margin-left: 2rem;  /* Desktop: ml-12 */
  margin-left: 1rem;  /* Mobile: ml-8 */
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid var(--theme-primary);
  background: #F9FAFB;
}
```

### Message d'avertissement

```css
/* Fond jaune clair avec bordure */
background-color: #FEF3C7;
border-color: #F59E0B;
border-width: 2px;
border-style: dashed;
```

---

## 🚀 Utilisation

### 1. Créer une slide avec contexte

Dans votre JSON de cours :

```json
{
  "type": "slide",
  "title": "Introduction aux APIs",
  "position": 1,
  "published": true,
  "asset_path": "module1/api-intro.png",
  "content": {
    "pedagogical_context": {
      "text": "Cette slide présente les concepts de base. L'API agit comme un intermédiaire entre votre application et les données."
    }
  }
}
```

### 2. Slide sans contenu (avertissement)

```json
{
  "type": "slide",
  "title": "Slide à venir",
  "position": 2,
  "published": true,
  "content": {
    "pedagogical_context": {
      "text": "Le slide sera ajouté prochainement."
    }
  }
}
```

### 3. Slide avec contexte riche (TipTap)

```json
{
  "type": "slide",
  "title": "Types d'APIs",
  "position": 3,
  "published": true,
  "content": {
    "body": { /* Contenu de la slide */ },
    "pedagogical_context": {
      "body": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "Explication avec " },
              { "type": "text", "marks": [{ "type": "bold" }], "text": "formatage" }
            ]
          }
        ]
      }
    }
  }
}
```

---

## 📱 Responsive

- **Desktop** : Indentation `ml-12` (48px)
- **Tablette** : Indentation `ml-8` (32px)
- **Mobile** : Indentation `ml-8` (32px)
- Les slides s'adaptent automatiquement

---

## ✅ Contraintes respectées

- ✅ Modification de l'UX existante (pas de nouvelle app)
- ✅ React avec composants clairs et réutilisables
- ✅ Responsive (desktop / tablette / mobile)
- ✅ Code lisible et maintenable
- ✅ Objectif pédagogique avant esthétique
- ✅ Reproduction de l'expérience d'un cours réel

---

## 🔄 Prochaines étapes possibles

1. **Amélioration du lexique**
   - Lier les termes aux slides concernées
   - Recherche améliorée avec filtres

2. **Annotations interactives**
   - Permettre aux formateurs d'ajouter des annotations en temps réel
   - Synchronisation avec vidéo (timestamps)

3. **Export et partage**
   - Export du contexte pédagogique séparément
   - Génération de PDF avec slides + contexte

4. **Analytics**
   - Suivi du temps passé sur chaque slide
   - Identification des slides les plus consultées

---

## 📚 Documentation complémentaire

- **`GUIDE-SLIDES-CONTEXTE.md`** : Guide détaillé avec exemples
- **`exemple-slide-avec-contexte.json`** : Exemple complet de structure JSON

---

## 🎓 Objectif pédagogique atteint

✅ **Dissociation claire** entre support projeté et savoir transmis
✅ **Expérience immersive** comme dans une vraie salle de formation
✅ **Flexibilité** pour les formateurs (texte simple ou rich text)
✅ **Avertissements clairs** pour les slides manquantes
✅ **Aide permanente** avec le lexique accessible

