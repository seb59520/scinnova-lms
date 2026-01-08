# Configuration de la table Data Science Exercises

## 🚨 Erreur 404 : Table `data_science_exercises` n'existe pas

Si vous voyez l'erreur :
```
Failed to load resource: the server responded with a status of 404 (data_science_exercises)
```

Cela signifie que la table `data_science_exercises` n'a pas encore été créée dans votre base de données Supabase.

## ✅ Solution

### Étape 1 : Exécuter le script SQL

1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `creer-table-data-science-exercises.sql`
5. Cliquez sur **Run** pour exécuter le script

### Étape 2 : Vérifier la création

Après l'exécution, vous devriez voir :
- ✅ `Table data_science_exercises créée avec succès` (si la table n'existait pas)
- ✅ `Table data_science_exercises existe déjà` (si elle existait déjà)

### Étape 3 : Vérifier les politiques RLS

Le script crée automatiquement :
- ✅ Politique pour les utilisateurs (voir/insérer/mettre à jour leurs propres soumissions)
- ✅ Politique pour les formateurs/admin (voir toutes les soumissions)

### Étape 4 : Recharger l'application

Rechargez la page `/trainer/data-science-exercises` dans votre application.

## 📋 Structure de la table

La table `data_science_exercises` contient :
- `id` : UUID (clé primaire)
- `user_id` : UUID (référence vers `profiles.id`)
- `exercise_id` : TEXT (ID de l'exercice, ex: "ex1-data-exploration")
- `exercise_title` : TEXT (Titre de l'exercice)
- `answers` : JSONB (Réponses aux questions)
- `score` : INTEGER (Score obtenu, 0-100)
- `feedback` : TEXT (Feedback automatique ou manuel)
- `submitted_at` : TIMESTAMPTZ (Date de soumission)
- `updated_at` : TIMESTAMPTZ (Date de mise à jour)

## 🔒 Sécurité (RLS)

Les politiques Row Level Security (RLS) sont activées :
- Les étudiants peuvent voir/modifier uniquement leurs propres soumissions
- Les formateurs/admin peuvent voir toutes les soumissions
- Les soumissions avec `user_id` temporaire (format `temp-*`) sont visibles par les formateurs

## 🐛 Dépannage

### Erreur : "relation does not exist"
- **Cause** : La table n'a pas été créée
- **Solution** : Exécutez le script SQL `creer-table-data-science-exercises.sql`

### Erreur : "permission denied"
- **Cause** : Les politiques RLS bloquent l'accès
- **Solution** : Vérifiez que vous êtes connecté avec un compte formateur/admin

### Erreur : "duplicate key value"
- **Cause** : Tentative de créer une politique qui existe déjà
- **Solution** : Le script utilise `DROP POLICY IF EXISTS`, donc cela ne devrait pas arriver. Si c'est le cas, exécutez le script complet à nouveau.

## 📝 Notes

- La table est créée avec `IF NOT EXISTS`, donc vous pouvez exécuter le script plusieurs fois sans problème
- Les politiques sont supprimées et recréées pour éviter les conflits
- Les index sont créés pour optimiser les performances des requêtes


