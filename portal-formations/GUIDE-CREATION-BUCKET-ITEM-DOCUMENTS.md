# Guide : Création du bucket item-documents

## Problème
Si l'upload de documents ne fonctionne pas, c'est probablement parce que le bucket `item-documents` n'existe pas encore dans Supabase Storage.

## Solution : Créer le bucket

### Option 1 : Via l'interface Supabase (Recommandé)

1. **Aller dans Supabase Dashboard**
   - Ouvrez votre projet Supabase
   - Allez dans **Storage** dans le menu de gauche

2. **Créer le bucket**
   - Cliquez sur **"New bucket"** ou **"Create bucket"**
   - Nom du bucket : `item-documents`
   - **Public bucket** : ✅ Oui (pour permettre le téléchargement par les apprenants)
   - **File size limit** : 52428800 (50 MB)
   - Cliquez sur **"Create bucket"**

3. **Configurer les politiques RLS**
   - Allez dans **SQL Editor** dans Supabase
   - Exécutez le script `setup-item-documents-storage.sql` (les politiques RLS)

### Option 2 : Via SQL (Création automatique)

1. **Aller dans SQL Editor** dans Supabase
2. **Exécuter le script** `setup-item-documents-storage.sql`
   - Ce script crée le bucket ET configure les politiques RLS automatiquement

## Vérification

Après avoir créé le bucket, vérifiez :

1. **Dans Storage** : Le bucket `item-documents` doit apparaître dans la liste
2. **Dans SQL Editor** : Exécutez cette requête pour vérifier les politiques :
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'objects' 
   AND policyname LIKE '%item-documents%';
   ```

## Erreurs courantes

### "Bucket not found" ou "does not exist"
→ Le bucket n'existe pas. Créez-le via l'interface ou le script SQL.

### "new row violates row-level security"
→ Les politiques RLS ne sont pas configurées. Exécutez `setup-item-documents-storage.sql`.

### "File size exceeds"
→ Le fichier est trop volumineux (max 50MB).

### "Permission denied"
→ Vérifiez que votre rôle dans `profiles` est `admin`, `trainer` ou `instructor`.

## Test

1. Ouvrez la console du navigateur (F12)
2. Essayez d'uploader un document
3. Vérifiez les logs :
   - `📤 Début de l'upload du document:` - L'upload commence
   - `✅ Fichier uploadé avec succès:` - L'upload a réussi
   - `❌ Erreur upload:` - Il y a une erreur (détails affichés)

## Structure attendue

Le bucket `item-documents` doit contenir :
```
item-documents/
  └── {item_id}/
      └── {timestamp}.{extension}
```

Exemple :
```
item-documents/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 1704123456789.pdf
```

