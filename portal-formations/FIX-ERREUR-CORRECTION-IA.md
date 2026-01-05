# Fix : Erreur HTTP 401 lors de la correction IA

## Problème

L'erreur `HTTP 401: No cookie auth credentials found` apparaît lors de la génération de la correction IA.

## Cause

Cette erreur indique que la clé API OpenRouter n'est pas correctement configurée ou est invalide. L'API OpenRouter nécessite une clé API valide pour fonctionner.

## Solution

### Étape 1 : Vérifier la configuration

1. **Vérifiez que vous avez un fichier `.env`** à la racine du projet `portal-formations/`

2. **Vérifiez que la variable `VITE_OPENROUTER_API_KEY` est présente** dans votre fichier `.env` :

```env
VITE_OPENROUTER_API_KEY=votre_cle_api_ici
```

### Étape 2 : Obtenir une clé API OpenRouter

Si vous n'avez pas de clé API :

1. Allez sur [https://openrouter.ai/](https://openrouter.ai/)
2. Créez un compte ou connectez-vous
3. Allez dans la section **Keys** (ou **Settings** → **API Keys`)
4. Cliquez sur **Create Key** pour générer une nouvelle clé API
5. Copiez la clé API (elle commence généralement par `sk-or-v1-`)

### Étape 3 : Configurer la clé API

1. Ouvrez votre fichier `.env` à la racine du projet
2. Ajoutez ou modifiez la ligne :

```env
VITE_OPENROUTER_API_KEY=sk-or-v1-votre_cle_api_ici
```

3. Optionnellement, vous pouvez aussi spécifier le modèle à utiliser :

```env
VITE_OPENROUTER_MODEL=google/gemini-3-flash-preview
```

### Étape 4 : Redémarrer le serveur

**Important** : Après avoir modifié le fichier `.env`, vous devez **redémarrer votre serveur de développement** :

1. Arrêtez le serveur (Ctrl+C dans le terminal)
2. Redémarrez-le avec `npm run dev` ou `yarn dev`

Les variables d'environnement ne sont chargées qu'au démarrage du serveur.

### Étape 5 : Vérifier que ça fonctionne

1. Ouvrez la console du navigateur (F12)
2. Essayez de générer une correction IA
3. Vous devriez voir dans la console : `🤖 Correction IA - Tentative avec le modèle: ...`
4. Si tout fonctionne, vous verrez : `✅ Correction IA générée avec succès`

## Autres causes possibles

### Clé API invalide ou expirée

Si vous avez déjà une clé API mais que l'erreur persiste :

1. Vérifiez que la clé API est toujours active sur [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Vérifiez que votre compte OpenRouter a des crédits disponibles
3. Essayez de régénérer une nouvelle clé API

### Clé API mal formatée

La clé API OpenRouter doit commencer par `sk-or-v1-` ou `sk-or-`. Vérifiez qu'il n'y a pas d'espaces ou de caractères supplémentaires.

### Variables d'environnement non chargées

Si vous utilisez Vite, assurez-vous que :
- Le fichier `.env` est à la racine du projet (même niveau que `package.json`)
- Les variables commencent par `VITE_` (obligatoire pour Vite)
- Vous avez redémarré le serveur après modification

## Exemple de fichier `.env` complet

```env
# Configuration Supabase
VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_supabase_ici

# Configuration OpenRouter (pour la correction IA)
VITE_OPENROUTER_API_KEY=sk-or-v1-votre_cle_openrouter_ici
VITE_OPENROUTER_MODEL=google/gemini-3-flash-preview
```

## Messages d'erreur améliorés

Le code a été amélioré pour afficher des messages d'erreur plus clairs :

- **Si la clé API n'est pas configurée** : Un message détaillé avec les étapes à suivre
- **Si l'authentification échoue (401)** : Des suggestions sur les causes possibles
- **Si la limite de requêtes est atteinte (429)** : Un message pour attendre ou vérifier le plan
- **Si le modèle n'est pas trouvé (404)** : Le système essaiera automatiquement un autre modèle

## Support

Si le problème persiste après avoir suivi ces étapes :

1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez que votre connexion internet fonctionne
3. Consultez la documentation OpenRouter : [https://openrouter.ai/docs](https://openrouter.ai/docs)

