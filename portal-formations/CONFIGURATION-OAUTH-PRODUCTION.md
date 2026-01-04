# Configuration OAuth pour la production

## Problème
Après connexion avec Google, vous êtes redirigé vers `http://localhost:3000` au lieu de votre domaine de production `https://lms.scinnova.fr`.

## Solution

### 1. Configuration Supabase Dashboard

1. **Allez sur [Supabase Dashboard](https://app.supabase.com)**
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **URL Configuration**
4. Dans la section **Redirect URLs**, ajoutez les URLs suivantes (une par ligne, SANS wildcards) :
   ```
   https://lms.scinnova.fr/app
   http://localhost:5173/app
   ```
   
   **Important :** 
   - Supabase n'accepte PAS les wildcards (`**`)
   - Ne mettez pas à la fois `https://lms.scinnova.fr` et `https://lms.scinnova.fr/` (Supabase les considère comme identiques)
   - Ajoutez uniquement les URLs spécifiques dont vous avez besoin (généralement juste `/app` pour la redirection après connexion)

5. Dans **Site URL**, définissez :
   ```
   https://lms.scinnova.fr
   ```

### 2. Configuration Google Cloud Console

1. **Allez sur [Google Cloud Console](https://console.cloud.google.com/)**
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** → **Credentials**
4. Cliquez sur votre **OAuth 2.0 Client ID** (celui utilisé par Supabase)
5. Dans **Authorized redirect URIs**, ajoutez :
   ```
   https://[VOTRE-PROJECT-ID].supabase.co/auth/v1/callback
   ```
   (Remplacez `[VOTRE-PROJECT-ID]` par votre ID de projet Supabase)

   Vous pouvez trouver cette URL dans Supabase Dashboard → **Authentication** → **Providers** → **Google** → **Redirect URL**

### 3. Vérification du code

Le code utilise déjà `window.location.origin` de manière dynamique, donc il devrait fonctionner automatiquement. Vérifiez dans `src/hooks/useAuth.tsx` ligne 423 :

```typescript
redirectTo: `${window.location.origin}/app`,
```

### 4. Test

1. Après avoir configuré Supabase et Google :
   - Videz le cache du navigateur
   - Déconnectez-vous si vous êtes connecté
   - Essayez de vous connecter avec Google
   - Vous devriez être redirigé vers `https://lms.scinnova.fr/app` au lieu de `localhost:3000`

### 5. URLs à configurer dans Supabase

**Site URL :**
```
https://lms.scinnova.fr
```

**Redirect URLs (une par ligne, SANS wildcards) :**
```
https://lms.scinnova.fr/app
http://localhost:5173/app
```

**Note :** 
- Ne mettez pas à la fois l'URL avec et sans slash final (Supabase les considère comme identiques)
- Ajoutez uniquement les routes spécifiques dont vous avez besoin
- La route `/app` est celle utilisée par défaut après connexion OAuth dans le code

### 6. Si le problème persiste

1. Vérifiez que les variables d'environnement dans Netlify sont correctes :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Redéployez l'application sur Netlify après avoir modifié la configuration Supabase

3. Vérifiez la console du navigateur pour d'éventuelles erreurs

4. Assurez-vous que le domaine `lms.scinnova.fr` est bien configuré dans Netlify et pointe vers votre site

