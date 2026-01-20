# Exemple d'intégration - Documents à Compléter

## Intégration dans la page d'administration de cours

Dans `src/pages/admin/AdminCourseEdit.tsx`, ajoutez le composant `FillableDocumentsManager` :

```tsx
import { FillableDocumentsManager } from '../../components/FillableDocumentsManager'

// Dans le composant AdminCourseEdit, ajoutez une section pour les documents à compléter
// Par exemple, après la section CourseResourcesManager :

{courseId && courseId !== 'new' && (
  <div className="mt-8">
    <FillableDocumentsManager courseId={courseId} />
  </div>
)}
```

## Intégration dans la page de visualisation du cours (étudiants)

Dans `src/pages/CourseView.tsx`, ajoutez le composant `FillableDocumentsViewer` :

```tsx
import { FillableDocumentsViewer } from '../components/FillableDocumentsViewer'

// Dans le composant CourseView, ajoutez une section pour afficher les documents à compléter
// Par exemple, après CourseResourcesViewer :

{courseId && (
  <div className="mt-8">
    <FillableDocumentsViewer courseId={courseId} />
  </div>
)}
```

## Exemple complet d'intégration dans AdminCourseEdit

```tsx
// ... imports existants ...
import { FillableDocumentsManager } from '../../components/FillableDocumentsManager'

export function AdminCourseEdit() {
  // ... code existant ...
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... contenu existant du formulaire de cours ... */}
      
      {/* Section Documents à compléter */}
      {courseId && courseId !== 'new' && (
        <div className="mt-8">
          <FillableDocumentsManager courseId={courseId} />
        </div>
      )}
      
      {/* ... reste du contenu ... */}
    </div>
  )
}
```

## Exemple complet d'intégration dans CourseView

```tsx
// ... imports existants ...
import { FillableDocumentsViewer } from '../components/FillableDocumentsViewer'

export function CourseView() {
  // ... code existant ...
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... contenu existant du cours ... */}
      
      {/* Section Documents à compléter */}
      {courseId && (
        <div className="mt-8">
          <FillableDocumentsViewer courseId={courseId} />
        </div>
      )}
      
      {/* ... reste du contenu ... */}
    </div>
  )
}
```

## Notes importantes

1. **Vérifiez les permissions** : Les composants gèrent automatiquement les permissions via RLS, mais assurez-vous que les utilisateurs ont les rôles appropriés.

2. **Bucket de stockage** : N'oubliez pas d'exécuter `setup-fillable-documents-storage.sql` pour créer le bucket.

3. **Tables de base de données** : Exécutez `create-fillable-documents-table.sql` avant d'utiliser les composants.

4. **Responsive** : Les composants sont déjà responsive et s'adaptent aux différentes tailles d'écran.
