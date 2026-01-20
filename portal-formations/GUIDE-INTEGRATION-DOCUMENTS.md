# Guide d'intégration - Documents à Compléter

## 📋 Étape 1 : Exécuter les scripts SQL dans Supabase

### 1.1 Créer les tables
1. Ouvrez l'interface SQL de Supabase
2. Exécutez le fichier `create-fillable-documents-table.sql`
   - Ce script crée les tables `fillable_documents` et `fillable_document_submissions`
   - Configure les politiques RLS (Row Level Security)

### 1.2 Configurer le bucket de stockage
1. Dans l'interface SQL de Supabase
2. Exécutez le fichier `setup-fillable-documents-storage.sql`
   - Ce script crée le bucket `fillable-documents`
   - Configure les politiques de stockage
   - Crée la fonction helper `get_user_storage_name()`

**⚠️ Important** : Exécutez ces scripts dans l'ordre indiqué.

## 📋 Étape 2 : Intégrer les composants React

### 2.1 Dans la page d'administration (`AdminCourseEdit.tsx`)

Ajoutez l'import en haut du fichier :

```tsx
import { FillableDocumentsManager } from '../../components/FillableDocumentsManager'
```

Puis ajoutez le composant après `CourseResourcesManager` (vers la ligne 1714) :

```tsx
{/* Ressources de la formation */}
{!isNew && courseId && (
  <div className="bg-white shadow rounded-lg p-6">
    <CourseResourcesManager courseId={courseId} />
  </div>
)}

{/* Documents à compléter */}
{!isNew && courseId && (
  <div className="bg-white shadow rounded-lg p-6 mt-6">
    <FillableDocumentsManager courseId={courseId} />
  </div>
)}
```

### 2.2 Dans la page de visualisation du cours (`CourseView.tsx`)

Ajoutez l'import en haut du fichier :

```tsx
import { FillableDocumentsViewer } from '../components/FillableDocumentsViewer'
```

Puis ajoutez le composant après `CourseResourcesViewer` (vers la ligne 1003) :

```tsx
{showHeaderContent && courseId && (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <CourseResourcesViewer courseId={courseId} />
  </div>
)}

{/* Documents à compléter */}
{showHeaderContent && courseId && (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mt-6">
    <FillableDocumentsViewer courseId={courseId} />
  </div>
)}
```

## ✅ Vérification

1. **En tant qu'administrateur** :
   - Allez sur `/admin/courses/{courseId}`
   - Vous devriez voir la section "Documents à compléter"
   - Vous pouvez ajouter un document template

2. **En tant qu'étudiant** :
   - Allez sur un cours auquel vous êtes inscrit
   - Vous devriez voir la section "Documents à compléter"
   - Vous pouvez télécharger les templates et soumettre vos documents

## 🐛 Dépannage

### Erreur "Bucket not found"
- Vérifiez que vous avez exécuté `setup-fillable-documents-storage.sql`
- Vérifiez que le bucket `fillable-documents` existe dans Supabase Storage

### Erreur "Table does not exist"
- Vérifiez que vous avez exécuté `create-fillable-documents-table.sql`
- Vérifiez que les tables `fillable_documents` et `fillable_document_submissions` existent

### Erreur de permissions
- Vérifiez que votre rôle utilisateur est correct (admin, trainer, instructor pour l'administration)
- Vérifiez que les politiques RLS sont correctement configurées
