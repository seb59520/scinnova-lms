# Guide : Suivi des soumissions de documents remplissables par session

## 📋 Vue d'ensemble

Cette fonctionnalité permet aux formateurs de suivre, pour chaque session, quels apprenants ont soumis ou non les documents remplissables (questionnaires, formulaires, etc.).

## 🚀 Installation

### Étape 1 : Exécuter la migration SQL

Exécutez le script SQL dans Supabase pour ajouter le support `session_id` :

```sql
-- Exécuter dans Supabase SQL Editor
\i portal-formations/add-session-id-to-fillable-submissions.sql
```

Ou copiez-collez le contenu du fichier `add-session-id-to-fillable-submissions.sql` dans l'éditeur SQL de Supabase.

### Étape 2 : Vérifier que la migration a réussi

```sql
-- Vérifier que la colonne session_id existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fillable_document_submissions' 
AND column_name = 'session_id';

-- Vérifier que le trigger existe
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'fillable_submission_session_trigger';
```

## 📊 Fonctionnement

### Pour les étudiants

Lorsqu'un étudiant soumet un document remplissable :
1. Le système récupère automatiquement son `session_id` depuis son enrollment
2. Si aucun enrollment n'a de `session_id`, le système utilise la fonction SQL `get_user_session_for_course`
3. Le `session_id` est enregistré avec la soumission

### Pour les formateurs

Le composant `FillableDocumentsSubmissionsTracker` permet de :
- Voir tous les documents remplissables d'un cours
- Pour chaque document, voir :
  - Le nombre total d'apprenants dans la session
  - Le nombre qui ont soumis
  - Le nombre qui n'ont pas encore soumis
  - La liste détaillée avec noms et statuts
  - Télécharger les soumissions

## 🎯 Utilisation

### Intégrer dans une page de session

```tsx
import { FillableDocumentsSubmissionsTracker } from '../components/FillableDocumentsSubmissionsTracker'

function SessionPage() {
  const sessionId = '...' // ID de la session
  const courseId = '...' // ID du cours

  return (
    <div>
      <h2>Suivi des soumissions</h2>
      <FillableDocumentsSubmissionsTracker 
        sessionId={sessionId}
        courseId={courseId}
      />
    </div>
  )
}
```

### Exemple d'intégration dans SessionHub

```tsx
// Dans portal-formations/src/pages/trainer/SessionHub.tsx

import { FillableDocumentsSubmissionsTracker } from '../../components/FillableDocumentsSubmissionsTracker'

// Ajouter un onglet ou une section
<Tabs>
  <Tabs.Tab label="Soumissions">
    <FillableDocumentsSubmissionsTracker 
      sessionId={selectedSession.id}
      courseId={selectedSession.course_id}
    />
  </Tabs.Tab>
</Tabs>
```

## 📈 Vue SQL pour le suivi

Une vue SQL `fillable_submissions_by_session` est créée automatiquement pour faciliter les requêtes :

```sql
-- Voir toutes les statistiques de soumissions par session
SELECT * FROM fillable_submissions_by_session
WHERE session_id = 'SESSION_ID'::uuid;

-- Voir les apprenants qui n'ont pas soumis un document spécifique
SELECT 
  s.title as session_title,
  fd.title as document_title,
  sm.user_id,
  p.full_name,
  p.student_id
FROM sessions s
JOIN fillable_documents fd ON fd.course_id = s.course_id
JOIN session_members sm ON sm.session_id = s.id AND sm.role = 'learner'
JOIN profiles p ON p.id = sm.user_id
LEFT JOIN fillable_document_submissions fds 
  ON fds.fillable_document_id = fd.id 
  AND fds.session_id = s.id 
  AND fds.user_id = sm.user_id
WHERE s.id = 'SESSION_ID'::uuid
  AND fd.id = 'DOCUMENT_ID'::uuid
  AND fds.id IS NULL;
```

## 🔍 Requêtes utiles

### Voir toutes les soumissions d'une session

```sql
SELECT 
  fd.title as document_title,
  p.full_name,
  p.student_id,
  fds.submitted_at,
  fds.status,
  fds.submitted_file_name
FROM fillable_document_submissions fds
JOIN fillable_documents fd ON fd.id = fds.fillable_document_id
JOIN profiles p ON p.id = fds.user_id
WHERE fds.session_id = 'SESSION_ID'::uuid
ORDER BY fd.order_index, fds.submitted_at DESC;
```

### Statistiques par document

```sql
SELECT 
  fd.title,
  COUNT(DISTINCT sm.user_id) as total_learners,
  COUNT(DISTINCT fds.user_id) as submitted_count,
  ROUND(COUNT(DISTINCT fds.user_id)::numeric / NULLIF(COUNT(DISTINCT sm.user_id), 0) * 100, 1) as completion_rate
FROM fillable_documents fd
JOIN sessions s ON s.course_id = fd.course_id
LEFT JOIN session_members sm ON sm.session_id = s.id AND sm.role = 'learner'
LEFT JOIN fillable_document_submissions fds 
  ON fds.fillable_document_id = fd.id 
  AND fds.session_id = s.id
WHERE s.id = 'SESSION_ID'::uuid
GROUP BY fd.id, fd.title, fd.order_index
ORDER BY fd.order_index;
```

## ⚠️ Notes importantes

1. **Session obligatoire** : Pour que le suivi fonctionne, les apprenants doivent être membres d'une session (`session_members`)

2. **Enrollment avec session_id** : Il est recommandé que les enrollments aient un `session_id` pour un fonctionnement optimal

3. **Permissions** : Seuls les rôles `admin`, `trainer` et `instructor` peuvent voir le suivi des soumissions

4. **Soumissions multiples** : Si `allow_multiple_submissions` est activé, seule la soumission la plus récente est prise en compte dans le suivi

5. **Documents non publiés** : Les documents non publiés (`published = false`) ne sont pas visibles dans le suivi

## 🐛 Dépannage

### Les soumissions n'ont pas de session_id

```sql
-- Mettre à jour manuellement les soumissions existantes
UPDATE fillable_document_submissions fds
SET session_id = (
  SELECT e.session_id 
  FROM enrollments e
  WHERE e.user_id = fds.user_id
    AND e.course_id = (
      SELECT course_id FROM fillable_documents WHERE id = fds.fillable_document_id
    )
  LIMIT 1
)
WHERE fds.session_id IS NULL;
```

### Les apprenants n'apparaissent pas dans le suivi

Vérifiez qu'ils sont bien membres de la session :

```sql
SELECT * FROM session_members
WHERE session_id = 'SESSION_ID'::uuid
AND role = 'learner';
```

### Le trigger ne fonctionne pas

```sql
-- Vérifier que le trigger existe
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'fillable_submission_session_trigger';

-- Réactiver le trigger si nécessaire
DROP TRIGGER IF EXISTS fillable_submission_session_trigger ON fillable_document_submissions;
CREATE TRIGGER fillable_submission_session_trigger
  BEFORE INSERT OR UPDATE ON fillable_document_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_fillable_submission_session();
```

## 📝 Exemple complet

```tsx
// Page de suivi des soumissions pour une session
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FillableDocumentsSubmissionsTracker } from '../components/FillableDocumentsSubmissionsTracker'
import { supabase } from '../lib/supabaseClient'

export function SessionSubmissionsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  const fetchSession = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, courses(id, title)')
      .eq('id', sessionId)
      .single()

    if (!error && data) {
      setSession(data)
    }
    setLoading(false)
  }

  if (loading) return <div>Chargement...</div>
  if (!session) return <div>Session non trouvée</div>

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Suivi des soumissions - {session.title}
      </h1>
      <FillableDocumentsSubmissionsTracker 
        sessionId={sessionId!}
        courseId={session.course_id}
      />
    </div>
  )
}
```
