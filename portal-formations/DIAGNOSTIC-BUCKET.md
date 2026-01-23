# Diagnostic du bucket fillable-documents

## Problème
Erreur 404 "Bucket not found" même après avoir appliqué les migrations.

## Solutions à essayer

### 1. Vérifier que le bucket existe dans Supabase Dashboard

1. Allez dans **Supabase Dashboard** → **Storage**
2. Vérifiez si le bucket `fillable-documents` apparaît dans la liste
3. Si le bucket n'existe pas, créez-le manuellement :
   - Cliquez sur **"New bucket"**
   - Nom : `fillable-documents`
   - Public : ❌ **Non** (privé)
   - File size limit : `52428800` (50 MB)
   - Cliquez sur **"Create bucket"**

### 2. Exécuter le script de diagnostic

Exécutez la migration `20260124_verify_and_create_fillable_documents_bucket.sql` dans Supabase SQL Editor.

Ce script va :
- Vérifier si le bucket existe
- Le créer s'il n'existe pas
- Afficher des messages de diagnostic

### 3. Créer le bucket manuellement via SQL

Si le script ne fonctionne pas, exécutez ce SQL directement :

```sql
-- Vérifier si le bucket existe
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'fillable-documents';

-- Si le résultat est vide, créer le bucket :
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fillable-documents',
  'fillable-documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/zip',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;
```

### 4. Vérifier les permissions

Assurez-vous que les politiques RLS sont bien configurées :

```sql
-- Vérifier les politiques RLS
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%fillable%';
```

### 5. Vérifier via l'API Supabase

Dans la console du navigateur (F12), testez :

```javascript
const { data, error } = await supabase.storage.listBuckets();
console.log('Buckets:', data);
console.log('Error:', error);
```

### 6. Problèmes courants

#### Le bucket existe mais l'erreur persiste
- Vérifiez que le nom est exactement `fillable-documents` (avec un tiret, pas un underscore)
- Vérifiez que vous êtes bien authentifié
- Vérifiez les politiques RLS

#### Erreur de permissions
- Assurez-vous d'avoir exécuté `setup-fillable-documents-storage.sql`
- Vérifiez que votre rôle utilisateur est correct dans la table `profiles`

#### Le bucket est créé mais vide
- C'est normal, le bucket sera rempli quand vous uploaderez des documents
- Les documents existants doivent être re-uploadés si le bucket a été recréé

## Commandes de diagnostic rapide

```sql
-- 1. Vérifier l'existence du bucket
SELECT * FROM storage.buckets WHERE id = 'fillable-documents';

-- 2. Vérifier les politiques RLS
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%fillable%';

-- 3. Lister tous les buckets
SELECT id, name, public FROM storage.buckets ORDER BY id;

-- 4. Vérifier les fichiers dans le bucket (si accessible)
SELECT name, bucket_id, created_at 
FROM storage.objects 
WHERE bucket_id = 'fillable-documents' 
LIMIT 10;
```
