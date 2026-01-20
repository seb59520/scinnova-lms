# Guide d'intégration - Widget de Ressources

## 📋 Vue d'ensemble

Le widget de ressources est un composant réutilisable qui permet d'ajouter des ressources (fichiers, liens, vidéos, code, données) à différents niveaux :
- **Cours** : Ressources générales du cours
- **Module** : Ressources spécifiques à un module
- **Exercice/TP** : Ressources pour un exercice ou TP spécifique

## 🚀 Installation

### Étape 1 : Exécuter les scripts SQL dans Supabase

1. **Créer la table** :
   - Ouvrez l'interface SQL de Supabase
   - Exécutez `create-resources-widget-table.sql`
   - Ce script crée la table `resources` avec support pour cours/module/item

2. **Configurer le bucket de stockage** :
   - Exécutez `setup-resources-widget-storage.sql`
   - Ce script crée le bucket `resources-widget` et configure les permissions

## 📦 Utilisation du widget

### Dans une page d'administration

#### Pour un cours (`AdminCourseEdit.tsx`)

```tsx
import { ResourceWidget } from '../../components/ResourceWidget'

// Dans le composant, ajoutez :
{!isNew && courseId && (
  <div className="bg-white shadow rounded-lg p-6 mt-6">
    <ResourceWidget 
      courseId={courseId} 
      title="Ressources du cours"
    />
  </div>
)}
```

#### Pour un module

```tsx
import { ResourceWidget } from '../../components/ResourceWidget'

// Dans le composant, ajoutez :
{moduleId && (
  <div className="bg-white shadow rounded-lg p-6 mt-6">
    <ResourceWidget 
      moduleId={moduleId} 
      title="Ressources du module"
    />
  </div>
)}
```

#### Pour un exercice/TP (`AdminItemEdit.tsx`)

```tsx
import { ResourceWidget } from '../../components/ResourceWidget'

// Dans le composant, ajoutez :
{itemId && itemId !== 'new' && (
  <div className="bg-white shadow rounded-lg p-6 mt-6">
    <ResourceWidget 
      itemId={itemId} 
      title="Ressources pour cet exercice"
    />
  </div>
)}
```

### Dans une page de visualisation (étudiants)

#### Pour un cours (`CourseView.tsx`)

```tsx
import { ResourceViewer } from '../components/ResourceViewer'

// Dans le composant, ajoutez :
{courseId && (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mt-6">
    <ResourceViewer 
      courseId={courseId} 
      title="Ressources du cours"
    />
  </div>
)}
```

#### Pour un module

```tsx
import { ResourceViewer } from '../components/ResourceViewer'

// Dans le composant, ajoutez :
{moduleId && (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mt-6">
    <ResourceViewer 
      moduleId={moduleId} 
      title="Ressources du module"
    />
  </div>
)}
```

#### Pour un exercice/TP

```tsx
import { ResourceViewer } from '../components/ResourceViewer'

// Dans le composant, ajoutez :
{itemId && (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mt-6">
    <ResourceViewer 
      itemId={itemId} 
      title="Ressources pour cet exercice"
    />
  </div>
)}
```

## 🎨 Types de ressources supportés

- **Fichier** : Fichiers génériques (images, archives, etc.)
- **Document** : Documents (PDF, DOCX, etc.)
- **Code** : Fichiers de code source
- **Données** : Fichiers de données (CSV, JSON, Excel)
- **Lien externe** : URLs vers des ressources externes
- **Vidéo** : Liens vers des vidéos (YouTube, Vimeo, etc.)

## ⚙️ Fonctionnalités

### Pour les administrateurs/formateurs

- ✅ Ajouter des ressources (fichiers ou liens)
- ✅ Réorganiser l'ordre des ressources
- ✅ Marquer comme obligatoire
- ✅ Masquer/afficher les ressources
- ✅ Supprimer des ressources

### Pour les étudiants

- ✅ Voir les ressources visibles
- ✅ Télécharger les fichiers
- ✅ Ouvrir les liens externes
- ✅ Identifier les ressources obligatoires

## 🔐 Permissions

- **Administrateurs/Formateurs** : Peuvent gérer toutes les ressources
- **Étudiants** : Peuvent voir uniquement les ressources visibles des cours/modules/items auxquels ils sont inscrits

## 📝 Exemples d'utilisation

### Exemple 1 : Ressources pour un TP Python

```tsx
<ResourceWidget 
  itemId={tpItemId} 
  title="Fichiers pour le TP"
/>
```

Ressources possibles :
- Fichier de données CSV
- Code source de départ
- Lien vers la documentation
- Fichier de correction

### Exemple 2 : Ressources générales d'un cours

```tsx
<ResourceWidget 
  courseId={courseId} 
  title="Ressources du cours"
/>
```

Ressources possibles :
- Syllabus du cours
- Liens vers des outils en ligne
- Vidéos de présentation
- Templates de projets

## 🐛 Dépannage

### Erreur "Bucket not found"
- Vérifiez que vous avez exécuté `setup-resources-widget-storage.sql`
- Vérifiez que le bucket `resources-widget` existe dans Supabase Storage

### Erreur "Table does not exist"
- Vérifiez que vous avez exécuté `create-resources-widget-table.sql`
- Vérifiez que la table `resources` existe

### Les ressources ne s'affichent pas
- Vérifiez que `is_visible = true` pour les ressources
- Vérifiez que l'étudiant est bien inscrit au cours/module
- Vérifiez les politiques RLS dans Supabase
