# Module Administratif - Documents à Compléter

Ce module permet de gérer des documents à compléter pour les étudiants dans plusieurs cours. Les administrateurs et formateurs peuvent créer des documents templates (PDF, DOCX, etc.) que les étudiants doivent télécharger, compléter et soumettre.

## 📋 Fonctionnalités

- **Gestion administrative** : Créer, modifier, supprimer et réorganiser les documents à compléter
- **Templates téléchargeables** : Les étudiants peuvent télécharger les templates de documents
- **Soumission de documents** : Les étudiants peuvent soumettre leurs documents complétés
- **Suivi des soumissions** : Suivi du statut des soumissions (soumis, en cours de correction, approuvé, rejeté)
- **Dates limites** : Possibilité de définir des dates limites pour la soumission
- **Soumissions multiples** : Option pour autoriser plusieurs soumissions par document
- **Documents obligatoires** : Marquer certains documents comme obligatoires

## 🚀 Installation

### 1. Créer les tables dans Supabase

Exécutez le script SQL suivant dans l'interface SQL de Supabase :

```sql
-- Exécuter create-fillable-documents-table.sql
```

Ce script crée :
- La table `fillable_documents` pour stocker les documents templates
- La table `fillable_document_submissions` pour stocker les soumissions des étudiants
- Les politiques RLS (Row Level Security) appropriées

### 2. Configurer le bucket de stockage

Exécutez le script SQL suivant pour créer et configurer le bucket de stockage :

```sql
-- Exécuter setup-fillable-documents-storage.sql
```

Ce script :
- Crée le bucket `fillable-documents` dans Supabase Storage
- Configure les politiques RLS pour l'accès aux fichiers
- Organise les fichiers en dossiers (`templates/` et `submissions/`)

### 3. Utiliser les composants React

#### Composant d'administration

Utilisez `FillableDocumentsManager` dans votre interface d'administration de cours :

```tsx
import { FillableDocumentsManager } from './components/FillableDocumentsManager'

function CourseAdminPage({ courseId }: { courseId: string }) {
  return (
    <div>
      <h1>Gestion du cours</h1>
      <FillableDocumentsManager courseId={courseId} />
    </div>
  )
}
```

#### Composant pour les étudiants

Utilisez `FillableDocumentsViewer` dans la page du cours pour les étudiants :

```tsx
import { FillableDocumentsViewer } from './components/FillableDocumentsViewer'

function CoursePage({ courseId }: { courseId: string }) {
  return (
    <div>
      <h1>Mon cours</h1>
      <FillableDocumentsViewer courseId={courseId} />
    </div>
  )
}
```

## 📁 Structure des fichiers

```
portal-formations/
├── create-fillable-documents-table.sql          # Schéma de base de données
├── setup-fillable-documents-storage.sql        # Configuration du bucket
├── src/
│   ├── types/
│   │   └── fillableDocuments.ts                # Types TypeScript
│   └── components/
│       ├── FillableDocumentsManager.tsx       # Composant admin
│       └── FillableDocumentsViewer.tsx        # Composant étudiant
└── FILLABLE-DOCUMENTS-README.md               # Ce fichier
```

## 🔐 Permissions

### Administrateurs et Formateurs
- ✅ Créer, modifier, supprimer des documents
- ✅ Uploader des templates
- ✅ Voir toutes les soumissions
- ✅ Évaluer les soumissions (statut, score, commentaires)

### Étudiants
- ✅ Voir les documents publiés des cours auxquels ils sont inscrits
- ✅ Télécharger les templates
- ✅ Soumettre leurs documents complétés
- ✅ Voir leurs propres soumissions
- ✅ Télécharger leurs soumissions

## 📝 Utilisation

### Pour les administrateurs/formateurs

1. **Créer un document à compléter** :
   - Cliquez sur "Ajouter un document"
   - Remplissez le titre et la description
   - Uploadez le fichier template (PDF, DOCX, etc.)
   - Configurez les options (obligatoire, date limite, soumissions multiples)
   - Publiez le document pour le rendre visible aux étudiants

2. **Gérer les documents** :
   - Réorganisez l'ordre avec les flèches haut/bas
   - Publiez/masquez les documents
   - Supprimez les documents si nécessaire

3. **Évaluer les soumissions** :
   - Les soumissions apparaissent dans la table `fillable_document_submissions`
   - Vous pouvez mettre à jour le statut, ajouter un score et des commentaires

### Pour les étudiants

1. **Télécharger le template** :
   - Cliquez sur "Télécharger le template" pour obtenir le document à compléter

2. **Soumettre le document complété** :
   - Complétez le document téléchargé
   - Uploadez le fichier complété via le formulaire
   - Cliquez sur "Soumettre le document"

3. **Suivre le statut** :
   - Le statut de votre soumission s'affiche (en attente, approuvé, rejeté)
   - Vous pouvez télécharger votre soumission à tout moment
   - Si les soumissions multiples sont autorisées, vous pouvez soumettre une nouvelle version

## 🐛 Résolution de problèmes

### Erreur "Bucket not found"
- Vérifiez que vous avez exécuté `setup-fillable-documents-storage.sql`
- Vérifiez que le bucket `fillable-documents` existe dans Supabase Storage

### Erreur "Permission denied"
- Vérifiez que votre rôle utilisateur est correct (admin, trainer, instructor pour l'administration)
- Vérifiez que les politiques RLS sont correctement configurées

### Erreur de chargement PDF
- Vérifiez que le fichier template est un PDF valide
- Vérifiez que le bucket est correctement configuré avec les permissions de lecture

## 🔄 Améliorations futures

- [ ] Interface d'évaluation des soumissions pour les formateurs
- [ ] Notifications par email lors de nouvelles soumissions
- [ ] Statistiques de soumission par document
- [ ] Export des soumissions en masse
- [ ] Intégration avec le système de notation

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.
