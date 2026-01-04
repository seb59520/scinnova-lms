# Guide d'import direct de cours JSON

Ce guide explique comment utiliser le script `import-course-direct.js` pour importer directement un cours JSON dans Supabase, sans passer par l'interface web.

## 📋 Prérequis

1. **Node.js 18+** (pour la fonction `fetch`)
2. **Variables d'environnement Supabase** configurées dans un fichier `.env`

## 🔧 Configuration

### 1. Créer un fichier `.env` (si ce n'est pas déjà fait)

Créez un fichier `.env` à la racine du projet avec :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key  # Optionnel mais recommandé
```

**Note :** Si vous utilisez `SUPABASE_SERVICE_ROLE_KEY`, le script pourra bypasser les règles RLS (Row Level Security), ce qui est utile pour l'import.

### 2. Installer les dépendances (si nécessaire)

```bash
npm install dotenv
```

## 🚀 Utilisation

### Import d'un nouveau cours

```bash
cd portal-formations
node import-course-direct.cjs architecture-client-serveur-web.json
```

### Mise à jour d'un cours existant

```bash
cd portal-formations
node import-course-direct.cjs architecture-client-serveur-web.json --update <course-id>
```

**Exemple :**
```bash
cd portal-formations
node import-course-direct.cjs architecture-client-serveur-web.json --update abc123-def456-ghi789
```

## 📝 Exemple de sortie

```
📖 Lecture du fichier JSON...
✅ JSON valide - Cours: "Architecture client–serveur et bases du Web"
   Modules: 5

📝 Création d'un nouveau cours...
✅ Cours créé avec l'ID: abc123-def456-ghi789

📚 Création des 5 module(s)...

   Module 1/5: "Module 1 : Introduction à l'architecture client-serveur"
      ✅ Module créé (ID: xyz789-abc123)
      📦 Création de 3 item(s)...
      ✅ 3 item(s) créé(s)
         ✅ 2 chapitre(s) créé(s) pour "1.1 - Qu'est-ce que l'architecture client-serveur ?"

   Module 2/5: "Module 2 : Protocoles et standards du Web"
      ✅ Module créé (ID: def456-xyz789)
      📦 Création de 3 item(s)...
      ✅ 3 item(s) créé(s)

...

✅ Import terminé avec succès!

📋 Résumé:
   - Cours ID: abc123-def456-ghi789
   - Titre: Architecture client–serveur et bases du Web
   - Modules: 5
   - Items: 15

🌐 Vous pouvez maintenant accéder au cours dans l'application:
   https://votre-projet.supabase.co/admin/courses/abc123-def456-ghi789/json
```

## ⚠️ Gestion des erreurs

### Erreur : "Variables d'environnement Supabase manquantes"

**Solution :** Vérifiez que votre fichier `.env` contient bien `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

### Erreur : "Type d'item invalide: undefined"

**Solution :** Vérifiez que tous les items dans votre JSON ont un champ `type` valide. Les types valides sont :
- `resource`
- `slide`
- `exercise`
- `activity`
- `tp`
- `game`

### Erreur : "Le cours a été créé mais aucun ID n'a été retourné"

**Solution :** Cela peut arriver si les règles RLS bloquent la lecture. Utilisez `SUPABASE_SERVICE_ROLE_KEY` dans votre `.env`.

### Erreur : "Ce script nécessite Node.js 18+"

**Solution :** Mettez à jour Node.js vers la version 18 ou supérieure :
```bash
# Avec nvm
nvm install 18
nvm use 18
```

## 🔍 Validation du JSON avant import

Vous pouvez valider votre JSON avant l'import avec :

```bash
node -e "const fs = require('fs'); const json = JSON.parse(fs.readFileSync('architecture-client-serveur-web.json', 'utf8')); console.log('✅ JSON valide'); console.log('Titre:', json.title); console.log('Modules:', json.modules?.length || 0);"
```

## 📌 Notes importantes

1. **Suppression des données existantes** : Si vous utilisez `--update`, tous les modules et items existants du cours seront supprimés avant l'import.

2. **Authentification** : Pour créer un nouveau cours, vous devez avoir un `created_by` valide. Par défaut, le script utilise `USER_ID` depuis `.env` ou un UUID par défaut. Vous pouvez définir `USER_ID` dans votre `.env` avec votre ID utilisateur Supabase.

3. **RLS (Row Level Security)** : Si vous rencontrez des erreurs de permissions, utilisez `SUPABASE_SERVICE_ROLE_KEY` qui bypass les règles RLS.

4. **Chapitres** : Les chapitres sont créés après les items. Si la création des chapitres échoue, l'import continue mais vous verrez un avertissement.

## 🆘 Dépannage

### Vérifier la connexion Supabase

```bash
node -e "require('dotenv').config(); console.log('URL:', process.env.VITE_SUPABASE_URL); console.log('Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'Définie' : 'Manquante');"
```

### Tester une requête simple

```bash
node -e "
require('dotenv').config();
const url = process.env.VITE_SUPABASE_URL + '/rest/v1/courses?select=id,title&limit=1';
const key = process.env.VITE_SUPABASE_ANON_KEY;
fetch(url, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } })
  .then(r => r.json())
  .then(d => console.log('✅ Connexion OK:', d))
  .catch(e => console.error('❌ Erreur:', e.message));
"
```

## 📚 Ressources

- [Documentation Supabase REST API](https://supabase.com/docs/reference/javascript/introduction)
- [Format JSON des cours](./FORMATS-JSON.md)

