# Fix : Erreur CORS avec Supabase

## Problème

L'erreur `Fetch API cannot load https://fsbeyfjzrhkozhlmssil.supabase.co/auth/v1/user due to access control checks` indique que le navigateur bloque la requête à cause des politiques CORS (Cross-Origin Resource Sharing).

## Solution

### 1. Vérifier l'URL Supabase dans votre configuration

L'erreur montre l'URL `https://fsbeyfjzrhkozhlmssil.supabase.co`, mais vos fichiers de configuration mentionnent `https://cofoqneikwdocyihzuzg.supabase.co`. 

**Vérifiez quelle est la bonne URL :**

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez l'**Project URL** (elle devrait ressembler à `https://xxxxx.supabase.co`)

### 2. Configurer les origines autorisées dans Supabase

1. Dans Supabase Dashboard, allez dans **Settings** → **API**
2. Faites défiler jusqu'à la section **CORS Configuration** ou **Allowed Origins**
3. Ajoutez les origines suivantes (une par ligne) :
   ```
   http://localhost:5173
   http://localhost:5174
   http://localhost:3000
   http://localhost:3001
   https://lms.scinnova.fr
   ```
   (Remplacez par vos propres URLs de développement et production)

4. Cliquez sur **Save**

### 3. Vérifier la configuration Authentication

1. Allez dans **Authentication** → **URL Configuration**
2. Dans **Site URL**, définissez votre URL de production ou de développement :
   ```
   http://localhost:5173
   ```
   ou
   ```
   https://lms.scinnova.fr
   ```

3. Dans **Redirect URLs**, ajoutez :
   ```
   http://localhost:5173/app
   http://localhost:5174/app
   https://lms.scinnova.fr/app
   ```

### 4. Vérifier votre fichier .env

Assurez-vous que votre fichier `.env` (ou `.env.local`) contient la bonne URL :

```env
VITE_SUPABASE_URL=https://fsbeyfjzrhkozhlmssil.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici
```

**Important :** 
- Utilisez l'URL exacte de votre projet Supabase
- Ne mettez pas de slash à la fin de l'URL
- La clé doit être la clé `anon public` (pas la `service_role`)

### 5. Redémarrer le serveur de développement

Après avoir modifié le fichier `.env`, redémarrez complètement le serveur :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez
npm run dev
```

### 6. Vider le cache du navigateur

1. Ouvrez les outils de développement (F12)
2. Clic droit sur le bouton de rechargement
3. Sélectionnez **Vider le cache et effectuer une actualisation forcée**

## Vérification

Après avoir effectué ces étapes :

1. Ouvrez la console du navigateur (F12)
2. Vous devriez voir : `Supabase client initialized with URL: https://...`
3. L'erreur CORS ne devrait plus apparaître
4. L'authentification devrait fonctionner correctement

## Si le problème persiste

### Vérifier les policies RLS

Si vous voyez toujours des erreurs après avoir corrigé CORS, vérifiez que les policies RLS (Row Level Security) sont correctement configurées :

1. Allez dans **Authentication** → **Policies**
2. Vérifiez que les policies pour `profiles` permettent à l'utilisateur de lire son propre profil

### Vérifier la clé API

Assurez-vous d'utiliser la clé `anon public` et non la `service_role` :

1. Dans **Settings** → **API**
2. Copiez la clé **anon public** (pas service_role)
3. Utilisez-la dans `VITE_SUPABASE_ANON_KEY`

### Mode développement vs production

Si vous travaillez en local :
- Utilisez `http://localhost:5173` (ou le port que vous utilisez)
- Ajoutez cette URL dans les origines autorisées de Supabase

Si vous êtes en production :
- Utilisez votre domaine de production
- Ajoutez cette URL dans les origines autorisées de Supabase

## Note importante

Supabase autorise par défaut les requêtes depuis `localhost` en développement, mais si vous avez modifié les paramètres CORS ou si vous utilisez un domaine personnalisé, vous devez explicitement ajouter les origines.

