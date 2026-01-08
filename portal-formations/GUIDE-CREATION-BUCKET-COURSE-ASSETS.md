# Guide : Création du bucket course-assets

## Problème
Si la génération de slides ou l'upload d'assets ne fonctionne pas, c'est probablement parce que le bucket `course-assets` n'existe pas encore dans Supabase Storage.

## Solution : Créer le bucket

### Option 1 : Via l'interface Supabase (Recommandé)

1. **Aller dans Supabase Dashboard**
   - Ouvrez votre projet Supabase
   - Allez dans **Storage** dans le menu de gauche

2. **Créer le bucket**
   - Cliquez sur **"New bucket"** ou **"Create bucket"**
   - Nom du bucket : `course-assets`
   - **Public bucket** : ✅ Oui (pour permettre l'accès aux assets par les apprenants)
   - **File size limit** : 104857600 (100 MB) - pour les PDFs et images de slides
   - **Allowed MIME types** : Laissez vide ou ajoutez les types que vous souhaitez autoriser
   - Cliquez sur **"Create bucket"**

3. **Configurer les politiques RLS**
   - Allez dans **SQL Editor** dans Supabase
   - Exécutez le script `setup-course-assets-storage.sql` (les politiques RLS)

### Option 2 : Via SQL (Création automatique)

1. **Aller dans SQL Editor** dans Supabase
2. **Exécuter le script** `setup-course-assets-storage.sql`
   - Ce script crée le bucket ET configure les politiques RLS automatiquement

## Vérification

Après avoir créé le bucket, vérifiez :

1. **Dans Storage** : Le bucket `course-assets` doit apparaître dans la liste
2. **Dans SQL Editor** : Exécutez cette requête pour vérifier les politiques :
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'objects' 
   AND schemaname = 'storage'
   AND policyname LIKE '%course-assets%';
   ```

## Erreurs courantes

### "Bucket not found" ou "does not exist"
→ Le bucket n'existe pas. Créez-le via l'interface ou le script SQL.

### "new row violates row-level security"
→ Les politiques RLS ne sont pas configurées. Exécutez `setup-course-assets-storage.sql`.

### "File size exceeds"
→ Le fichier est trop volumineux (max 100MB pour course-assets).

### "Permission denied"
→ Vérifiez que votre rôle dans `profiles` est `admin`, `trainer` ou `instructor`.

## Test

1. Ouvrez la console du navigateur (F12)
2. Essayez de générer une slide avec le bouton "Générer slide IA"
3. Vérifiez les logs :
   - Si vous voyez une erreur "Bucket not found", le bucket n'existe pas
   - Si vous voyez "Permission denied", les politiques RLS ne sont pas correctes

## Structure des fichiers

Les slides générées sont stockées dans la structure suivante :
```
course-assets/
  └── {courseId}/
      └── {moduleId}/
          └── {itemId}/
              └── {timestamp}.jpg
```

Exemple : `course-assets/abc123/def456/ghi789/1704123456789.jpg`



