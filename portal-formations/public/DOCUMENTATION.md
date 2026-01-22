# 📚 Documentation Complète du Projet

*Généré le 09/01/2026 à 20:06:50*

---

## 📖 Concepts clés

### Formation vs Programme

- **Formation** : Contenu pédagogique autonome (cours, TP, exercices)
- **Programme** : Parcours structuré regroupant plusieurs formations dans un ordre défini

---


## 1. Démarrage et Installation


---


### 📄 🚀 Démarrage rapide

*Source: `QUICK-START.md`*


---

# 🚀 Démarrage rapide

## Option 1 : Script automatique (Recommandé)

Lancez les deux serveurs en une seule commande :

```bash
./start-all-servers.sh
```

Ou avec npm :

```bash
npm run dev
```

## Option 2 : Deux terminaux séparés

### Terminal 1 - Backend
```bash
cd portal-formations/server
npm run dev
```
→ http://localhost:3001
→ Swagger: http://localhost:3001/docs

### Terminal 2 - Frontend  
```bash
cd big-data-impacts-app
npm run dev
```
→ http://localhost:5173

## 📋 Vérification

Une fois lancés, vous devriez avoir accès à :

- ✅ **Backend API** : http://localhost:3001
- ✅ **Swagger UI** : http://localhost:3001/docs  
- ✅ **Application React** : http://localhost:5173

## 🛑 Arrêt

Avec le script : Appuyez sur `Ctrl+C`

Manuellement : `Ctrl+C` dans chaque terminal





---


### 📄 🚀 Guide de démarrage des serveurs

*Source: `README-SERVERS.md`*


---

# 🚀 Guide de démarrage des serveurs

Ce projet nécessite deux serveurs pour fonctionner complètement :

## 📦 Serveurs nécessaires

### 1. Backend - Portal Formations (Express + Swagger)
- **Port** : 3001
- **URL** : http://localhost:3001
- **Swagger UI** : http://localhost:3001/docs
- **Répertoire** : `portal-formations/server`

### 2. Frontend - Big Data Impacts App (React + Vite)
- **Port** : 5173
- **URL** : http://localhost:5173
- **Répertoire** : `big-data-impacts-app`

## 🎯 Méthode 1 : Script automatique (Recommandé)

Un script est disponible pour lancer les deux serveurs en parallèle :

```bash
./start-all-servers.sh
```

Ce script :
- ✅ Lance les deux serveurs en parallèle
- ✅ Affiche les URLs d'accès
- ✅ Permet d'arrêter les deux serveurs avec Ctrl+C
- ✅ Affiche les logs dans des fichiers séparés

## 🎯 Méthode 2 : Lancer manuellement

### Terminal 1 - Backend
```bash
cd portal-formations/server
npm run dev:server
```

### Terminal 2 - Frontend
```bash
cd big-data-impacts-app
npm run dev
```

## 📋 Vérification

Une fois les serveurs lancés, vous devriez voir :

### Backend
- ✅ Serveur Express démarré sur le port 3001
- ✅ Swagger UI accessible sur http://localhost:3001/docs

### Frontend
- ✅ Serveur Vite démarré sur le port 5173
- ✅ Application React accessible sur http://localhost:5173

## 🔍 Logs

Si vous utilisez le script automatique, les logs sont disponibles dans :
- Backend : `/tmp/backend.log`
- Frontend : `/tmp/frontend.log`

Pour suivre les logs en temps réel :
```bash
# Backend
tail -f /tmp/backend.log

# Frontend
tail -f /tmp/frontend.log
```

## ⚠️ Dépannage

### Port déjà utilisé
Si un port est déjà utilisé, vous pouvez :
1. Arrêter le processus qui utilise le port
2. Modifier le port dans les fichiers de configuration

### Erreurs de dépendances
Si vous avez des erreurs, assurez-vous d'avoir installé les dépendances :
```bash
# Backend
cd portal-formations/server && npm install

# Frontend
cd big-data-impacts-app && npm install
```

## 🛑 Arrêt des serveurs

### Avec le script automatique
Appuyez sur `Ctrl+C` dans le terminal où le script tourne.

### Manuellement
Appuyez sur `Ctrl+C` dans chaque terminal où un serveur tourne.





---


### 📄 Démarrage rapide : Sessions

*Source: `portal-formations/QUICK-START-SESSIONS.md`*


---

# Démarrage rapide : Sessions

## Problème

Votre table `sessions` est vide alors qu'un étudiant a soumis un exercice. C'est normal car :
1. **Les sessions doivent être créées manuellement** par un formateur/admin
2. **Les étudiants ne sont pas automatiquement liés à une session** lors de leur inscription

## Solution rapide (3 étapes)

### Étape 1 : Exécuter le script SQL de support des sessions

Exécutez `add-session-support.sql` dans l'interface SQL de Supabase. Ce script :
- Ajoute `session_id` aux tables `enrollments` et `submissions`
- Crée des triggers pour lier automatiquement les inscriptions et soumissions aux sessions
- Met à jour les données existantes

### Étape 2 : Créer une session de test

Exécutez `create-test-session.sql` dans l'interface SQL de Supabase. Ce script :
- Crée une organisation de test
- Crée une session pour votre premier cours
- Affiche les instructions pour ajouter des étudiants

### Étape 3 : Ajouter votre étudiant test à l'organisation

```sql
-- Remplacer 'USER_ID' par l'ID de votre étudiant test
INSERT INTO org_members (org_id, user_id, role)
SELECT 
  o.id,
  'USER_ID'::uuid,
  'student'
FROM orgs o
WHERE o.slug = 'test-org'
ON CONFLICT (org_id, user_id) DO NOTHING;
```

## Vérification

Après ces étapes, vérifiez que tout fonctionne :

```sql
-- Voir les sessions
SELECT * FROM sessions;

-- Voir les enrollments avec leur session
SELECT 
  e.id,
  p.full_name as student_name,
  c.title as course_title,
  s.title as session_title
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN courses c ON c.id = e.course_id
LEFT JOIN sessions s ON s.id = e.session_id;

-- Voir les submissions avec leur session
SELECT 
  s.id,
  p.full_name as student_name,
  i.title as item_title,
  ses.title as session_title
FROM submissions s
JOIN profiles p ON p.id = s.user_id
JOIN items i ON i.id = s.item_id
LEFT JOIN sessions ses ON ses.id = s.session_id;
```

## Résultat attendu

Après ces étapes :
- ✅ Votre table `sessions` contiendra au moins une session
- ✅ Les enrollments existants seront liés à la session
- ✅ Les soumissions existantes seront liées à la session
- ✅ Les nouvelles soumissions seront automatiquement liées à la session
- ✅ Le dashboard formateur (`/trainer`) affichera les données

## Notes importantes

- **Les étudiants doivent être membres d'une organisation** pour être liés à une session
- **Une session doit être active** (`status = 'active'`) pour être utilisée automatiquement
- **Si plusieurs sessions existent pour un cours**, la plus récente est utilisée






---


## 2. Configuration et Setup


---


### 📄 Configuration OAuth pour la production

*Source: `portal-formations/CONFIGURATION-OAUTH-PRODUCTION.md`*


---

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




---


### 📄 Configuration des variables d'environnement en production

*Source: `portal-formations/CONFIGURATION-PRODUCTION.md`*


---

# Configuration des variables d'environnement en production

## Problème

L'erreur `{"message":"No API key found in request"}` indique que les variables d'environnement Supabase ne sont pas correctement configurées en production.

## Solution

### Pour Vercel

1. Allez dans votre projet Vercel
2. Cliquez sur **Settings** → **Environment Variables**
3. Ajoutez les variables suivantes :

```
VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici
```

4. **Important** : Sélectionnez tous les environnements (Production, Preview, Development)
5. Redéployez votre application

### Pour Netlify

1. Allez dans votre projet Netlify
2. Cliquez sur **Site settings** → **Environment variables**
3. Ajoutez les variables :

```
VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici
```

4. Redéployez votre site

### Pour GitHub Pages / Autres plateformes

1. Créez un fichier `.env.production` à la racine du projet (ne le commitez PAS)
2. Ajoutez les variables :

```
VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici
```

3. Configurez votre pipeline de build pour utiliser ce fichier

### Pour Docker

Dans votre `Dockerfile` ou `docker-compose.yml` :

```yaml
environment:
  - VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
  - VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici
```

## Où trouver vos clés Supabase

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## Vérification

Après avoir configuré les variables et redéployé :

1. Ouvrez la console du navigateur (F12)
2. Vérifiez qu'il n'y a pas d'erreur au chargement
3. Vous devriez voir : `Supabase client initialized with URL: ...`
4. Si vous voyez toujours l'erreur, vérifiez que :
   - Les variables sont bien définies (pas de typos)
   - Les variables commencent bien par `VITE_` (requis pour Vite)
   - Vous avez bien redéployé après avoir ajouté les variables

## Important : Variables VITE_

Avec Vite, seules les variables qui commencent par `VITE_` sont exposées au client. C'est pourquoi nous utilisons :
- `VITE_SUPABASE_URL` (pas `SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` (pas `SUPABASE_ANON_KEY`)

## Sécurité

⚠️ **Important** : La clé `anon` est publique et peut être vue dans le code source du navigateur. C'est normal et attendu pour Supabase. Les policies RLS (Row Level Security) protègent vos données.

Ne partagez JAMAIS :
- La clé `service_role` (celle-ci doit rester secrète)
- Les mots de passe de base de données
- Les tokens d'API secrets

## Dépannage

### L'erreur persiste après configuration

1. Vérifiez que les variables sont bien définies dans votre plateforme de déploiement
2. Vérifiez qu'elles commencent par `VITE_`
3. Redéployez complètement (pas juste un rebuild)
4. Videz le cache du navigateur
5. Vérifiez les logs de build pour voir si les variables sont bien injectées

### Les variables ne sont pas disponibles au runtime

Avec Vite, les variables d'environnement sont injectées au moment du **build**, pas au runtime. Si vous changez les variables, vous devez **rebuild** l'application.

### Test local

Pour tester en local avec les mêmes variables que la production :

```bash
# Créer un fichier .env.production.local
VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici

# Build et preview
npm run build
npm run preview
```

## Script de vérification

Ajoutez ce script dans votre `package.json` pour vérifier les variables :

```json
{
  "scripts": {
    "check-env": "node -e \"console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓' : '✗'); console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗')\""
  }
}
```

Puis exécutez : `npm run check-env`






---


### 📄 Guide : Configuration des modèles Gemini

*Source: `portal-formations/GUIDE-CONFIGURATION-GEMINI.md`*


---

# Guide : Configuration des modèles Gemini

## Problème résolu

Le code a été mis à jour pour essayer automatiquement plusieurs modèles Gemini jusqu'à trouver celui qui fonctionne avec votre clé API.

## Configuration dans `.env`

Modifiez votre fichier `.env` pour utiliser un modèle compatible :

```env
# Modèle par défaut (recommandé - le plus stable)
VITE_GEMINI_MODEL=gemini-pro

# Ou si gemini-pro ne fonctionne pas, essayez :
# VITE_GEMINI_MODEL=models/gemini-pro
# VITE_GEMINI_MODEL=gemini-1.5-pro
# VITE_GEMINI_MODEL=gemini-1.5-flash
```

## Modèles disponibles

Le système essaie automatiquement ces modèles dans l'ordre :

1. **`gemini-pro`** (par défaut) - Modèle stable et largement disponible
2. **`models/gemini-pro`** - Variante avec préfixe (certaines versions de l'API)
3. **`gemini-1.5-pro`** - Plus récent et puissant
4. **`gemini-1.5-flash`** - Rapide et économique

## Comment ça fonctionne

Le code essaie chaque modèle automatiquement jusqu'à trouver celui qui fonctionne. Vous verrez dans la console :

- `🔄 Tentative avec le modèle: gemini-pro`
- `⚠️ Modèle gemini-pro non disponible, essai suivant...`
- `✅ Modèle gemini-1.5-pro fonctionne (après 1 tentative(s))`

## Vérification de votre clé API

Si tous les modèles échouent, vérifiez :

1. **Votre clé API est valide** : Vérifiez dans [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **L'API est activée** : Assurez-vous que "Generative Language API" est activée dans Google Cloud Console
3. **La facturation est activée** : Certains modèles nécessitent une facturation activée

## Mise à jour du package

Le package `@google/generative-ai` a été mis à jour vers la version **0.24.1** (dernière version).

## Test

1. Modifiez votre `.env` pour utiliser `gemini-pro`
2. Redémarrez votre serveur de développement
3. Essayez de générer une slide
4. Vérifiez la console pour voir quel modèle fonctionne

## Dépannage : Erreur 404 "models not found"

Si vous voyez l'erreur `404 models/gemini-* is not found for API version v1beta`, cela signifie que votre clé API n'a pas accès aux modèles Gemini. Voici comment résoudre :

### 1. Vérifier que l'API est activée

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Library**
4. Recherchez "Generative Language API"
5. Cliquez sur **Enable** si ce n'est pas déjà fait

### 2. Vérifier la facturation

Certains modèles Gemini nécessitent que la facturation soit activée :

1. Dans Google Cloud Console, allez dans **Billing**
2. Assurez-vous qu'un compte de facturation est lié à votre projet
3. Note : Google offre un crédit gratuit de $300 pour les nouveaux comptes

### 3. Régénérer une nouvelle clé API

1. Allez sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Supprimez l'ancienne clé si nécessaire
3. Créez une nouvelle clé API
4. Mettez à jour `VITE_GEMINI_API_KEY` dans votre `.env`
5. Redémarrez votre serveur de développement

### 4. Vérifier les quotas

1. Dans Google Cloud Console, allez dans **APIs & Services** > **Quotas**
2. Recherchez "Generative Language API"
3. Vérifiez que vous n'avez pas dépassé les limites

### 5. Tester avec l'API REST directement

Vous pouvez tester votre clé API avec cette commande curl :

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=VOTRE_CLE_API"
```

Si cela fonctionne, vous devriez voir une liste de modèles disponibles.

## Support

Si aucun modèle ne fonctionne après ces vérifications :
- Vérifiez les logs dans la console du navigateur
- Le code liste automatiquement les modèles disponibles au démarrage
- Contactez le support Google Cloud si le problème persiste




---


### 📄 Guide : Configuration OpenRouter pour la génération de slides

*Source: `portal-formations/GUIDE-CONFIGURATION-OPENROUTER.md`*


---

# Guide : Configuration OpenRouter pour la génération de slides

## Qu'est-ce qu'OpenRouter ?

OpenRouter est une plateforme qui offre un accès unifié à une vaste gamme de modèles d'IA (Gemini, GPT-4, Claude, etc.) via une seule API. C'est une excellente alternative à l'API Gemini directe car :

- ✅ Accès à plusieurs modèles (Gemini, GPT-4, Claude, etc.)
- ✅ Pas besoin d'activer plusieurs APIs
- ✅ Facturation unifiée
- ✅ Haute disponibilité avec basculement automatique
- ✅ Tarification transparente

## Configuration rapide

### 1. Créer un compte OpenRouter

1. Allez sur [OpenRouter.ai](https://openrouter.ai/)
2. Créez un compte ou connectez-vous
3. Allez dans **Keys** pour créer une clé API
4. Copiez votre clé API

### 2. Configurer les variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# Clé API OpenRouter (obligatoire)
VITE_OPENROUTER_API_KEY=votre_cle_api_ici

# Modèle à utiliser (optionnel, défaut: google/gemini-pro)
VITE_OPENROUTER_MODEL=google/gemini-pro
```

### 3. Choisir un modèle

OpenRouter supporte de nombreux modèles. Voici quelques recommandations :

#### Modèles Gemini (recommandés pour le design)
- `google/gemini-3-flash-preview` - **Recommandé** - Modèle Gemini 3 rapide et performant ✅
- `google/gemini-3-pro-preview` - Gemini 3 Pro, plus puissant
- `google/gemini-1.5-pro` - Gemini 1.5 Pro, stable
- `google/gemini-1.5-flash` - Rapide et économique
- `google/gemini-pro` - Ancien modèle (peut ne plus être disponible)

#### Modèles GPT (alternatives)
- `openai/gpt-4o-mini` - Rapide et économique
- `openai/gpt-4o` - Plus puissant

#### Modèles Claude (alternatives)
- `anthropic/claude-3-haiku` - Rapide et économique
- `anthropic/claude-3-sonnet` - Équilibré

### 4. Voir tous les modèles disponibles

Vous pouvez voir tous les modèles disponibles sur [OpenRouter Models](https://openrouter.ai/models)

## Configuration dans `.env`

Exemple complet :

```env
# OpenRouter Configuration
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_OPENROUTER_MODEL=google/gemini-3-flash-preview
```

## Comment ça fonctionne

Le système essaie automatiquement plusieurs modèles dans l'ordre :

1. Le modèle configuré dans `VITE_OPENROUTER_MODEL`
2. `google/gemini-pro`
3. `google/gemini-1.5-pro`
4. `google/gemini-1.5-flash`
5. `openai/gpt-4o-mini` (fallback)
6. `anthropic/claude-3-haiku` (fallback)

Si un modèle échoue, le système bascule automatiquement vers le suivant.

## Tarification

OpenRouter propose :

- **Modèles gratuits** : Certains modèles sont disponibles gratuitement (avec limitations)
- **Pay-as-you-go** : Payez uniquement ce que vous utilisez
- **Crédits gratuits** : Nouveaux comptes reçoivent des crédits gratuits

Consultez [OpenRouter Pricing](https://openrouter.ai/docs/pricing) pour plus de détails.

## Dépannage

### Erreur 401 (Unauthorized)
- Vérifiez que `VITE_OPENROUTER_API_KEY` est correct dans votre `.env`
- Vérifiez que votre clé API est active sur OpenRouter

### Erreur 404 (Model not found)
- Vérifiez que le modèle spécifié dans `VITE_OPENROUTER_MODEL` existe
- Consultez [OpenRouter Models](https://openrouter.ai/models) pour la liste complète

### Erreur 429 (Rate limit)
- Vous avez atteint la limite de requêtes
- Attendez quelques minutes ou vérifiez votre plan

### Tous les modèles échouent
- Vérifiez votre connexion internet
- Vérifiez que votre compte OpenRouter a des crédits disponibles
- Consultez les logs dans la console du navigateur pour plus de détails

## Avantages par rapport à l'API Gemini directe

1. **Pas de configuration Google Cloud** : Pas besoin d'activer l'API dans Google Cloud Console
2. **Pas de facturation Google** : Utilisez votre compte OpenRouter
3. **Plus de modèles** : Accès à GPT-4, Claude, etc. en plus de Gemini
4. **Plus simple** : Une seule clé API pour tout

## Migration depuis Gemini direct

Si vous aviez configuré Gemini directement :

1. Remplacez `VITE_GEMINI_API_KEY` par `VITE_OPENROUTER_API_KEY`
2. Ajoutez `VITE_OPENROUTER_MODEL=google/gemini-pro`
3. Redémarrez votre serveur de développement

C'est tout ! Le code gère automatiquement le reste.




---


### 📄 Guide de configuration de la base Supabase

*Source: `portal-formations/GUIDE-SETUP-SUPABASE.md`*


---

# Guide de configuration de la base Supabase

Ce guide vous explique comment configurer votre base de données Supabase pour que l'application fonctionne correctement.

## 📋 Informations de connexion

- **URL Supabase** : https://fsbeyfjzrhkozhlmssil.supabase.co
- **Mot de passe de base** : magTuj-2qorgu-bymfyp
- **Anon key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYmV5Zmp6cmhrb3pobG1zc2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMDU0ODQsImV4cCI6MjA4Mjg4MTQ4NH0.NRobIt5qn7fj-QPXvWmop7c4cbzBBIOmvMlv0HkePY4`

## 🚀 Étapes de configuration

### Étape 1 : Diagnostic de l'état actuel

1. Connectez-vous à votre projet Supabase : https://fsbeyfjzrhkozhlmssil.supabase.co
2. Allez dans **SQL Editor** (menu de gauche)
3. Cliquez sur **New query**
4. Copiez-collez le contenu du fichier `diagnostic-schema-complet.sql`
5. Cliquez sur **Run** (ou `Ctrl/Cmd + Enter`)

**Résultat attendu** : Vous verrez plusieurs tableaux montrant :
- ✅ Les tables qui existent déjà
- ❌ Les tables qui manquent
- Les colonnes de chaque table
- Les indexes, RLS, politiques, fonctions, triggers

**📝 Note** : Copiez les résultats et partagez-les avec moi si vous avez besoin d'aide pour interpréter les résultats.

### Étape 2 : Créer les tables manquantes

1. Dans le **SQL Editor** de Supabase
2. Créez une nouvelle requête
3. Copiez-collez le contenu du fichier `creer-tables-manquantes.sql`
4. Cliquez sur **Run**

**Résultat attendu** : 
- Des messages `NOTICE` indiquant quelles tables ont été créées
- Un tableau récapitulatif montrant le statut de chaque table

**⚠️ Important** : Ce script ne supprime pas les tables existantes, il crée uniquement celles qui manquent.

### Étape 3 : Créer toutes les tables d'un coup (alternative)

Si vous préférez créer toutes les tables d'un coup (même si certaines existent déjà) :

1. Dans le **SQL Editor** de Supabase
2. Créez une nouvelle requête
3. Copiez-collez le contenu du fichier `SCHEMA-COMPLET-TOUTES-LES-TABLES.sql`
4. Cliquez sur **Run**

**⚠️ Note** : Ce script utilise `CREATE TABLE IF NOT EXISTS`, donc il ne créera pas de doublons.

### Étape 4 : Configurer les politiques RLS

Après avoir créé les tables, vous devez configurer les politiques RLS (Row Level Security) pour que les utilisateurs puissent accéder aux données.

Exécutez ces fichiers dans l'ordre :

1. **`supabase-schema.sql`** - Politiques pour les tables de base
2. **`add-programs-schema.sql`** - Politiques pour les programmes
3. **`add-chapters-schema.sql`** - Politiques pour les chapitres
4. **`trainer-schema.sql`** - Politiques pour orgs, sessions, etc.
5. **`game-format-files-schema.sql`** - Politiques pour les jeux
6. **`add-user-settings-schema.sql`** - Politiques pour les paramètres
7. **`fix-orgs-rls-policies.sql`** - Corrections des politiques orgs
8. **`fix-sessions-rls-for-admins.sql`** - Politiques sessions pour admins
9. **`add-session-support.sql`** - Triggers et fonctions pour les sessions

**📝 Note** : Certains de ces fichiers créent aussi des tables. Si vous avez déjà exécuté `SCHEMA-COMPLET-TOUTES-LES-TABLES.sql`, vous pouvez ignorer les parties `CREATE TABLE` et exécuter uniquement les parties `CREATE POLICY`.

### Étape 5 : Créer les indexes (optionnel)

Les indexes sont déjà inclus dans `SCHEMA-COMPLET-TOUTES-LES-TABLES.sql`. Si vous avez créé les tables manuellement, vérifiez que tous les indexes existent en exécutant la section "PARTIE 7 : INDEXES" du fichier consolidé.

### Étape 6 : Vérification finale

Exécutez à nouveau `diagnostic-schema-complet.sql` pour vérifier que tout est en place :

- ✅ Toutes les 22 tables doivent exister
- ✅ Toutes les colonnes doivent être présentes
- ✅ RLS doit être activé sur toutes les tables
- ✅ Les politiques RLS doivent être créées
- ✅ Les fonctions et triggers doivent exister

## 🔍 Vérification rapide

Exécutez cette requête pour voir rapidement l'état de vos tables :

```sql
SELECT 
  table_name AS "Table",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
    THEN '✅' 
    ELSE '❌' 
  END AS "Statut"
FROM (VALUES
  ('profiles'), ('courses'), ('modules'), ('items'), ('enrollments'), ('submissions'), ('game_scores'),
  ('programs'), ('program_courses'), ('program_enrollments'),
  ('chapters'),
  ('orgs'), ('org_members'), ('sessions'), ('exercises'), ('exercise_attempts'), ('module_progress'), 
  ('activity_events'), ('trainer_notes'),
  ('game_attempts'), ('game_progress'),
  ('user_settings')
) AS t(table_name)
ORDER BY t.table_name;
```

## 📊 Liste complète des 22 tables

Voir le fichier `LISTE-TOUTES-LES-TABLES.md` pour la liste détaillée avec descriptions.

## ⚠️ Problèmes courants

### Erreur : "relation already exists"
- **Cause** : La table existe déjà
- **Solution** : Utilisez `CREATE TABLE IF NOT EXISTS` ou supprimez d'abord la table si vous voulez la recréer

### Erreur : "permission denied"
- **Cause** : Vous n'avez pas les permissions nécessaires
- **Solution** : Vérifiez que vous êtes connecté en tant qu'administrateur du projet Supabase

### Erreur : "foreign key constraint"
- **Cause** : Vous essayez de créer une table qui référence une table qui n'existe pas encore
- **Solution** : Créez les tables dans l'ordre (profiles → courses → modules → items, etc.)

### Erreur : "function already exists"
- **Cause** : La fonction existe déjà
- **Solution** : Utilisez `CREATE OR REPLACE FUNCTION` au lieu de `CREATE FUNCTION`

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :

1. Exécutez `diagnostic-schema-complet.sql` et partagez les résultats
2. Copiez le message d'erreur exact
3. Indiquez quelle étape vous avez atteinte

Je pourrai alors vous aider à résoudre le problème spécifique.

## 📝 Notes de sécurité

⚠️ **Important** : Ne partagez jamais votre mot de passe de base ou votre service_role key publiquement. Les informations partagées ici sont pour votre usage personnel uniquement.

Pour la production, utilisez des variables d'environnement et ne commitez jamais les clés dans votre dépôt Git.






---


### 📄 Installation du Chat avec Recherche et État de Connexion

*Source: `portal-formations/INSTALLATION_CHAT_AVANCE.md`*


---

# Installation du Chat avec Recherche et État de Connexion

## 📋 Fonctionnalités ajoutées

✅ **Recherche d'étudiants** : Barre de recherche pour filtrer les conversations  
✅ **État de connexion** : Indicateur visuel (en ligne/hors ligne)  
✅ **Temps de dernière connexion** : Affichage du temps écoulé depuis la dernière connexion  
✅ **Mise à jour en temps réel** : Les statuts se mettent à jour automatiquement via WebSocket

## 🚀 Installation

### Étape 1 : Créer la table de présence

Exécutez le script SQL dans Supabase :

```sql
-- Fichier : creer-table-user-presence.sql
```

Ce script crée :
- Table `user_presence` pour tracker l'état de connexion
- Fonctions `set_user_online()` et `set_user_offline()`
- Politiques RLS pour la sécurité

### Étape 2 : Activer Realtime pour user_presence

Dans Supabase, allez dans **Database** > **Replication** et activez la réplication pour :
- ✅ `chat_messages` (déjà fait)
- ✅ `user_presence` (nouveau)

Ou via SQL :

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
```

### Étape 3 : Vérifier les fichiers

Les fichiers suivants ont été créés/modifiés :
- ✅ `creer-table-user-presence.sql` - Script SQL pour la table de présence
- ✅ `src/hooks/usePresence.ts` - Hook pour gérer la présence
- ✅ `src/hooks/useChat.ts` - Enrichi avec les statuts de présence
- ✅ `src/components/ChatWidget.tsx` - Ajout de la recherche et des indicateurs

## 🎯 Utilisation

### Pour les admins/formateurs

1. **Ouvrir le chat** : Cliquez sur le bouton de chat (en bas à droite)

2. **Voir les conversations** : Cliquez sur l'icône utilisateur dans l'en-tête

3. **Rechercher un étudiant** :
   - Utilisez la barre de recherche en haut de la liste
   - Recherche par nom ou par contenu de message
   - Les résultats se filtrent en temps réel

4. **Voir l'état de connexion** :
   - 🟢 **Point vert** = En ligne
   - **"Il y a X min/h/j"** = Hors ligne (dernière connexion)

5. **Sélectionner une conversation** : Cliquez sur un étudiant dans la liste

6. **Envoyer un message** : Tapez et envoyez votre réponse

## 🔧 Fonctionnement technique

### Tracking de présence

Le système met à jour automatiquement votre statut :
- **En ligne** : Quand vous êtes sur la page
- **Hors ligne** : Quand vous quittez la page ou fermez l'onglet
- **Mise à jour** : Toutes les 30 secondes pour maintenir le statut

### Recherche

La recherche filtre les conversations par :
- Nom de l'étudiant
- Contenu du dernier message

### Mise à jour en temps réel

Les statuts de connexion se mettent à jour automatiquement via Supabase Realtime (WebSocket) :
- Quand un étudiant se connecte → statut passe à "en ligne"
- Quand un étudiant se déconnecte → statut passe à "hors ligne" avec timestamp

## 📊 Indicateurs visuels

### En ligne
- Point vert à côté du nom
- Statut mis à jour instantanément

### Hors ligne
- Pas de point vert
- Affichage du temps écoulé :
  - "Il y a 5 min" (moins d'1h)
  - "Il y a 2h" (moins de 24h)
  - "Il y a 3j" (moins d'1 semaine)
  - Date (plus d'1 semaine)

## 🐛 Dépannage

### Les statuts ne s'affichent pas

1. Vérifiez que la table `user_presence` existe
2. Vérifiez que Realtime est activé pour `user_presence`
3. Vérifiez la console pour les erreurs

### La recherche ne fonctionne pas

1. Vérifiez que les conversations se chargent correctement
2. Vérifiez la console pour les erreurs
3. Assurez-vous que le champ de recherche est visible

### Les statuts ne se mettent pas à jour

1. Vérifiez que Realtime est activé
2. Vérifiez que le hook `usePresence` est appelé
3. Vérifiez la console pour les erreurs de WebSocket

## ✅ Checklist d'installation

- [ ] Table `user_presence` créée
- [ ] Fonctions `set_user_online` et `set_user_offline` créées
- [ ] Realtime activé pour `user_presence`
- [ ] Hook `usePresence` intégré dans `ChatWidget`
- [ ] Recherche fonctionnelle
- [ ] Indicateurs de présence visibles
- [ ] Mise à jour en temps réel fonctionnelle

## 🎨 Personnalisation

### Modifier les couleurs des indicateurs

Dans `ChatWidget.tsx`, modifiez :

```tsx
// Point vert pour en ligne
className="w-2 h-2 bg-green-500 rounded-full"

// Vous pouvez changer la couleur :
className="w-2 h-2 bg-blue-500 rounded-full" // Bleu
className="w-2 h-2 bg-emerald-500 rounded-full" // Vert émeraude
```

### Modifier l'intervalle de mise à jour

Dans `usePresence.ts`, modifiez :

```typescript
// Actuellement : 30 secondes
const interval = setInterval(() => {
  setOnline()
}, 30000) // Changez 30000 pour modifier l'intervalle (en ms)
```





---


### 📄 Instructions d'installation du Chat - Résolution du timeout

*Source: `portal-formations/INSTRUCTIONS_INSTALLATION_CHAT.md`*


---

# Instructions d'installation du Chat - Résolution du timeout

Si vous rencontrez une erreur de timeout lors de l'exécution du script SQL, suivez ces instructions :

## 🔧 Solution 1 : Exécution par parties (Recommandé)

Exécutez les scripts dans l'ordre suivant, **un par un**, en attendant que chacun se termine :

### Étape 1 : Créer la table
```sql
-- Exécutez : creer-table-chat-messages-part1.sql
```
Attendez que la requête se termine avant de passer à l'étape suivante.

### Étape 2 : Créer le trigger
```sql
-- Exécutez : creer-table-chat-messages-part2.sql
```

### Étape 3 : Configurer RLS
```sql
-- Exécutez : creer-table-chat-messages-part3.sql
```

### Étape 4 : Créer la fonction
```sql
-- Exécutez : creer-table-chat-messages-part4.sql
```

### Étape 5 : Créer la vue
```sql
-- Exécutez : creer-table-chat-messages-part5.sql
```

## 🔧 Solution 2 : Version simplifiée

Si les parties séparées ne fonctionnent toujours pas, utilisez la version simplifiée :

```sql
-- Exécutez : creer-table-chat-messages-simple.sql
```

Cette version simplifie la fonction `get_chat_conversations` pour éviter les timeouts.

## 🔧 Solution 3 : Création manuelle minimale

Si tout échoue, créez uniquement les éléments essentiels :

```sql
-- 1. Table de base
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index essentiels
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON chat_messages(recipient_id);

-- 3. RLS basique
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark as read"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = recipient_id);
```

Vous pourrez ajouter la fonction `get_chat_conversations` plus tard si nécessaire.

## ⚠️ Problèmes courants

### Timeout persistant
- Vérifiez votre connexion internet
- Essayez d'exécuter les scripts pendant les heures creuses
- Réduisez la taille des scripts (utilisez la version simplifiée)

### Erreurs de permissions
- Assurez-vous d'être connecté avec un compte admin dans Supabase
- Vérifiez que vous avez les droits nécessaires sur la base de données

### Erreurs de syntaxe
- Vérifiez que vous copiez bien tout le script
- Assurez-vous qu'il n'y a pas de caractères invisibles

## ✅ Vérification après installation

Après avoir exécuté les scripts, vérifiez que tout fonctionne :

```sql
-- Vérifier que la table existe
SELECT * FROM chat_messages LIMIT 1;

-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'chat_messages';

-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'chat_messages';
```

## 🚀 Après l'installation

Une fois la table créée, n'oubliez pas de :

1. **Activer Realtime dans Supabase** :
   - Allez dans **Database** > **Replication**
   - Activez la réplication pour `chat_messages`

2. **Tester le chat** :
   - Connectez-vous en tant qu'étudiant
   - Cliquez sur le bouton de chat
   - Envoyez un message de test





---


## 3. Guides d'utilisation


---


### 📄 🔌 Guide : Gérer le port de l'application

*Source: `GUIDE-PORT-APPLICATION.md`*


---

# 🔌 Guide : Gérer le port de l'application

## Problème

L'application React peut se lancer sur un port différent de 5173 si le port est occupé.

## ✅ Solution rapide

### Option 1 : Utiliser le script automatique

```bash
./update-tp-port.sh
```

Le script détecte le port utilisé et met à jour automatiquement le TP JSON.

### Option 2 : Mettre à jour manuellement

1. **Lancer l'application** et noter le port affiché :
   ```bash
   cd big-data-impacts-app
   npm run dev
   ```
   
   Vite affichera quelque chose comme :
   ```
   ➜  Local:   http://localhost:5174/
   ```

2. **Mettre à jour le TP JSON** :
   - Ouvrir `portal-formations/tp-big-data-data-science-impacts.json`
   - Chercher `"external_url": "http://localhost:5173"`
   - Remplacer par le port affiché (ex: `5174`)

### Option 3 : Forcer le port 5173

1. **Libérer le port 5173** :
   ```bash
   lsof -ti:5173 | xargs kill -9
   ```

2. **Relancer l'application** :
   ```bash
   cd big-data-impacts-app
   npm run dev
   ```

   Avec `strictPort: true` dans `vite.config.ts`, Vite affichera une erreur si le port est occupé.

## 🔍 Vérifier le port utilisé

```bash
# Voir tous les ports utilisés par Node/Vite
lsof -i -P | grep LISTEN | grep node

# Voir spécifiquement le port 5173
lsof -i:5173
```

## 📝 Configuration actuelle

- **Port configuré** : 5173 (dans `vite.config.ts`)
- **Strict port** : Activé (`strictPort: true`)
- **TP JSON** : Pointe vers `http://localhost:5173`

Si vous changez de port, n'oubliez pas de mettre à jour le TP JSON !





---


### 📄 Guide d'aide - Portail Formations

*Source: `portal-formations/GUIDE-AIDE.md`*


---

# Guide d'aide - Portail Formations

## 📚 Vue d'ensemble

Ce guide explique comment utiliser chaque fonctionnalité du portail de formations pour créer et gérer vos contenus pédagogiques.

---

## 🎯 Catégories de contenu

### 1. 📄 Ressource (`resource`)

**Qu'est-ce que c'est ?**
Une ressource est un document, un lien ou un fichier que les étudiants peuvent télécharger ou consulter.

**Quand l'utiliser ?**
- Documents de référence (PDF, Word, etc.)
- Liens vers des sites web externes
- Fichiers à télécharger
- Documentation complémentaire
- Articles, guides, tutoriels

**Comment créer une ressource ?**

1. **Créer un élément de type "Ressource"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "Ressource"

2. **Configurer la ressource**
   - **Titre** : Donnez un nom clair à la ressource
   - **Description** : Ajoutez une description courte (optionnel)
   - **URL externe** : Si c'est un lien web, entrez l'URL complète
   - **Fichier** : Ou uploadez un fichier (PDF, DOC, images, ZIP, etc.)

3. **Contenu principal** (optionnel)
   - Utilisez l'éditeur de texte riche pour ajouter du contenu
   - Vous pouvez ajouter des chapitres pour structurer le contenu

**Affichage pour les étudiants :**
- Si URL externe : Bouton "Accéder à la ressource"
- Si fichier PDF : Visualiseur PDF intégré
- Si autre fichier : Bouton "Télécharger le fichier"

---

### 2. 🎯 Support projeté (`slide`)

**Qu'est-ce que c'est ?**
Un support projeté est un document visuel (PDF, image) optimisé pour la projection ou la visualisation directe.

**Quand l'utiliser ?**
- Présentations PowerPoint converties en PDF
- Slides de cours
- Supports visuels pour présentation
- Images pédagogiques
- Documents à projeter en classe

**Comment créer un support ?**

1. **Créer un élément de type "Support projeté"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "Support projeté"

2. **Configurer le support**
   - **Titre** : Nom du support
   - **Description** : Description courte (optionnel)
   - **Fichier** : Uploadez un PDF ou une image

3. **Contenu principal** (optionnel)
   - Ajoutez du contenu texte si nécessaire
   - Créez des chapitres pour structurer

**Affichage pour les étudiants :**
- PDF : Visualiseur PDF avec navigation et zoom
- Image : Affichage direct de l'image

**Différence avec Ressource :**
- **Ressource** : Fichier à télécharger
- **Support** : Document à visualiser directement

---

### 3. ✏️ Exercice (`exercise`)

**Qu'est-ce que c'est ?**
Un exercice est une question ou un problème que les étudiants doivent résoudre et soumettre.

**Quand l'utiliser ?**
- Questions à réponse courte
- Problèmes à résoudre
- Quiz
- Questions de compréhension
- Exercices pratiques

**Comment créer un exercice ?**

1. **Créer un élément de type "Exercice"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "Exercice"

2. **Configurer l'exercice**
   - **Titre** : Nom de l'exercice
   - **Énoncé** : Utilisez l'éditeur de texte riche pour écrire la question
   - **Correction** : Ajoutez la correction (visible après notation)

3. **Contenu principal** (optionnel)
   - Ajoutez des informations complémentaires
   - Créez des chapitres pour structurer

**Fonctionnement pour les étudiants :**
1. L'étudiant voit l'énoncé
2. Il tape sa réponse dans le champ texte
3. Il soumet sa réponse
4. Une fois noté, il peut voir la correction

**Gestion des soumissions :**
- Les soumissions sont enregistrées automatiquement
- Vous pouvez noter les exercices (0-100)
- Les étudiants voient leur note et la correction après notation

---

### 4. 💻 Travaux pratiques (`tp`)

**Qu'est-ce que c'est ?**
Un TP est un travail pratique plus complexe qui peut inclure des fichiers à soumettre.

**Quand l'utiliser ?**
- Projets pratiques
- Travaux à rendre avec fichiers
- Devoirs complexes
- Projets de groupe
- Travaux avec livrables

**Comment créer un TP ?**

1. **Créer un élément de type "TP"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "TP"

2. **Configurer le TP**
   - **Titre** : Nom du TP
   - **Instructions** : Utilisez l'éditeur pour écrire les consignes
   - **Checklist** : Ajoutez une liste de points à vérifier (optionnel)

3. **Contenu principal** (optionnel)
   - Ajoutez des ressources complémentaires
   - Créez des chapitres pour structurer

**Fonctionnement pour les étudiants :**
1. L'étudiant voit les instructions et la checklist
2. Il décrit son travail dans le champ texte
3. Il peut uploader un fichier (PDF, DOC, ZIP, etc.)
4. Il soumet son travail
5. Une fois noté, il voit sa note

**Types de fichiers acceptés :**
- PDF, DOC, DOCX
- ZIP, RAR
- Images (JPG, PNG)

---

### 5. 🎮 Mini-jeu (`game`)

**Qu'est-ce que c'est ?**
Un mini-jeu est une activité ludique interactive pour renforcer l'apprentissage.

**Quand l'utiliser ?**
- Quiz interactifs
- Jeux éducatifs
- Activités ludiques
- Renforcement de l'apprentissage
- Évaluation gamifiée
- Mémorisation de vocabulaire
- Association de concepts

**Types de jeux disponibles :**

#### 1. Jeu d'association de cartes (Matching)

**Comment créer un jeu d'association ?**

1. **Créer un élément de type "Mini-jeu"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "Mini-jeu"

2. **Configurer le jeu**
   - **Type de jeu** : Sélectionnez "Association de cartes"
   - **Titre** : Nom du jeu
   - **Description** : Expliquez les règles et l'objectif
   - **Instructions** : Instructions supplémentaires pour les étudiants (optionnel)

3. **Créer les paires de cartes**
   - Cliquez sur "+ Ajouter une paire"
   - Pour chaque paire, remplissez :
     - **Terme / Question** : Le texte qui apparaîtra sur la première carte
     - **Définition / Réponse** : Le texte qui apparaîtra sur la carte correspondante
   - Ajoutez autant de paires que nécessaire (minimum 2 paires recommandé)

**Exemples d'utilisation :**
- **Vocabulaire** : Terme → Définition
- **Traduction** : Mot français → Mot anglais
- **Concepts** : Concept → Explication
- **Questions/Réponses** : Question → Réponse
- **Formules** : Formule → Description

**Fonctionnement pour les étudiants :**
1. L'étudiant clique sur "Commencer le jeu"
2. Les cartes sont mélangées et retournées (face cachée)
3. L'étudiant clique sur deux cartes pour les retourner
4. Si les cartes correspondent (même paire), elles restent visibles
5. Si elles ne correspondent pas, elles se retournent après 1 seconde
6. Le jeu se termine quand toutes les paires sont trouvées
7. Le score est calculé automatiquement et enregistré

**Calcul du score :**
- Le score est basé sur **2000 points maximum** :
  - **Points de temps (max 1000 pts)** : Vous perdez **10 points par seconde** écoulée
    - Exemple : 30 secondes = 1000 - (30 × 10) = 700 points
  - **Points de précision (max 1000 pts)** : Vous perdez **50 points par tentative**
    - Exemple : 5 tentatives = 1000 - (5 × 50) = 750 points
  - **Score total** = Points de temps + Points de précision
    - Exemple : 700 + 750 = 1450 points
- 💡 **Astuce** : Pour maximiser votre score, soyez rapide ET précis !

**Fonctionnalités :**
- Les scores sont enregistrés automatiquement dans la base de données
- Les étudiants peuvent rejouer pour améliorer leur score
- Le temps et le nombre de tentatives sont affichés en temps réel
- Interface responsive et intuitive
- Explication détaillée des règles de scoring avant de commencer
- Affichage du détail du score à la fin du jeu

---

#### 2. Jeu d'association de colonnes (Column Matching)

**Comment créer un jeu d'association de colonnes ?**

1. **Créer un élément de type "Mini-jeu"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "Mini-jeu"

2. **Configurer le jeu**
   - **Type de jeu** : Sélectionnez "Association de colonnes"
   - **Titre** : Nom du jeu
   - **Description** : Expliquez les règles et l'objectif
   - **Instructions** : Instructions supplémentaires (optionnel)

3. **Configurer les colonnes**
   - **Colonne 1** : Entrez les éléments, un par ligne
   - **Colonne 2** : Entrez les éléments correspondants, un par ligne

4. **Définir les correspondances**
   - Cliquez sur "+ Ajouter" pour chaque correspondance
   - Pour chaque correspondance, indiquez l'index de chaque colonne (0 = premier élément)

**Fonctionnement pour les étudiants :**
1. L'étudiant clique sur "Commencer le jeu"
2. Deux colonnes s'affichent avec les éléments
3. L'étudiant clique sur un élément de la colonne 1, puis sur l'élément correspondant de la colonne 2
4. Si l'association est correcte → les éléments sont marqués en vert
5. Si l'association est incorrecte → un feedback rouge apparaît
6. Le jeu se termine quand toutes les correspondances sont trouvées
7. Le score est calculé et enregistré automatiquement

**Calcul du score :**
- Le score est basé sur **2000 points maximum** :
  - **Points de temps (max 1000 pts)** : Vous perdez **5 points par seconde** écoulée
    - Exemple : 40 secondes = 1000 - (40 × 5) = 800 points
  - **Points de précision (max 1000 pts)** : Vous perdez **100 points par tentative en trop** (au-delà du nombre minimum de correspondances)
    - Exemple : 5 correspondances trouvées en 7 tentatives = 1000 - (2 × 100) = 800 points
  - **Score total** = Points de temps + Points de précision
    - Exemple : 800 + 800 = 1600 points
- 💡 **Astuce** : Le nombre minimum de tentatives est égal au nombre de correspondances. Pour maximiser votre score, soyez rapide ET précis !

**Fonctionnalités :**
- Les scores sont enregistrés automatiquement dans la base de données
- Les étudiants peuvent rejouer pour améliorer leur score
- Le temps et le nombre de tentatives sont affichés en temps réel
- Feedback visuel immédiat (vert = correct, rouge = incorrect)
- Interface responsive avec deux colonnes côte à côte
- Explication détaillée des règles de scoring avant de commencer
- Affichage du détail du score à la fin du jeu

---

## ✍️ Éditeur de texte riche

### Fonctionnalités disponibles

L'éditeur de texte riche permet de formater votre contenu avec :

#### Formatage de base
- **Gras** : Mettre en évidence des mots importants
- **Italique** : Mettre en emphase
- **Titres** : H1, H2, H3 pour structurer le contenu

#### Listes
- **Liste à puces** : Pour énumérer des éléments
- **Liste numérotée** : Pour des étapes ordonnées

#### Mise en page avancée
- **Alignement** : Gauche, centre, droite, justifié
- **Couleur du texte** : Personnaliser la couleur
- **Liens** : Ajouter des liens vers d'autres ressources
- **Vidéos YouTube** : Intégrer des vidéos YouTube directement dans le contenu

#### Navigation
- **Annuler** : Revenir en arrière
- **Refaire** : Avancer à nouveau

### Intégrer une vidéo YouTube

1. **Dans l'éditeur de texte riche**
   - Cliquez sur l'icône YouTube (rouge) dans la barre d'outils
   - Entrez l'URL de la vidéo ou juste l'ID de la vidéo

2. **Formats d'URL acceptés**
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://youtu.be/VIDEO_ID`
   - `https://www.youtube.com/embed/VIDEO_ID`
   - `VIDEO_ID` (juste l'ID de la vidéo)

3. **Exemple**
   - URL complète : `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Ou juste l'ID : `dQw4w9WgXcQ`

**Affichage :**
- La vidéo s'affiche dans un lecteur YouTube intégré
- Format responsive (s'adapte à la largeur de l'écran)
- Ratio 16:9 automatique

### Conseils d'utilisation

1. **Structurez votre contenu**
   - Utilisez les titres (H1, H2, H3) pour créer une hiérarchie
   - Séparez les paragraphes avec des sauts de ligne

2. **Mettez en évidence**
   - Utilisez le **gras** pour les mots-clés
   - Utilisez l'*italique* pour les termes techniques

3. **Organisez avec des listes**
   - Listes à puces pour des éléments non ordonnés
   - Listes numérotées pour des étapes

4. **Alignement**
   - Centrez les titres importants
   - Justifiez les paragraphes longs pour une meilleure lisibilité

---

## 📑 Système de chapitres

### Qu'est-ce qu'un chapitre ?

Un chapitre est une section structurée à l'intérieur d'un élément (leçon). Il permet de diviser le contenu en parties logiques.

### Comment créer des chapitres ?

1. **Dans l'édition d'un élément**
   - Allez dans la section "Chapitres"
   - Cliquez sur "Ajouter un chapitre"

2. **Configurer le chapitre**
   - **Titre** : Nom du chapitre
   - **Contenu** : Utilisez l'éditeur de texte riche
   - **Position** : Réorganisez avec les flèches haut/bas

3. **Gérer les chapitres**
   - **Modifier** : Cliquez sur le titre pour éditer
   - **Supprimer** : Cliquez sur la poubelle
   - **Réorganiser** : Utilisez les flèches pour changer l'ordre

### Affichage pour les étudiants

Les chapitres s'affichent sous forme d'accordéon :
- Cliquez sur un chapitre pour l'ouvrir
- Le contenu s'affiche avec le formatage
- Navigation facile entre les chapitres

---

## 🎨 Options de mise en page

### Dans l'éditeur de texte riche

#### Alignement
- **Gauche** : Alignement par défaut
- **Centre** : Pour les titres ou citations
- **Droite** : Pour des éléments spécifiques
- **Justifié** : Pour les paragraphes longs

#### Couleurs
- Cliquez sur l'icône palette
- Entrez une couleur (ex: #FF0000, red, rgb(255,0,0))
- Le texte prend la couleur choisie

### Formatage de la description des formations

Dans la description d'une formation, vous pouvez utiliser :

- **`**texte**`** : Pour créer un titre en gras
- **`- Item`** ou **`* Item`** : Pour créer une liste à puces
- **Sauts de ligne** : Pour créer des paragraphes

Exemple :
```
**Voici les thématiques abordées:**

**API Paradigms:**
- RESTful
- GraphQL
- RPC/gRPC
```

---

## ⚙️ Paramètres utilisateur

### Zoom PDF

Le niveau de zoom des PDFs est sauvegardé automatiquement :
- Choisissez votre niveau de zoom (50%, 75%, 100%, 125%, 150%, 200%)
- Votre préférence est enregistrée
- Le zoom est restauré à chaque ouverture de PDF

### Comment ça fonctionne ?

1. Ouvrez un PDF
2. Changez le zoom dans le menu déroulant
3. Votre choix est sauvegardé automatiquement
4. La prochaine fois, le même zoom sera utilisé

---

## 📊 Tuiles de fonctionnalités

Sur la page d'une formation, vous trouverez des tuiles pour :

### Vue d'ensemble
- Aperçu général de la formation
- Description et informations principales

### Ressources
- Nombre de ressources disponibles
- Cliquez pour filtrer et voir uniquement les ressources

### Supports
- Nombre de supports projetés
- Cliquez pour filtrer et voir uniquement les supports

### Exercices
- Nombre d'exercices
- Cliquez pour filtrer et voir uniquement les exercices

### Travaux pratiques
- Nombre de TPs
- Cliquez pour filtrer et voir uniquement les TPs

### Mini-jeux
- Nombre de jeux
- Cliquez pour filtrer et voir uniquement les jeux

### Progression
- Suivez votre avancement dans la formation
- Voir les éléments complétés

---

## 🔄 Workflow de création

### 1. Créer une formation

1. Allez dans **Admin** → **Formations**
2. Cliquez sur **"Nouvelle formation"**
3. Remplissez les informations :
   - Titre
   - Description (utilisez le formatage pour structurer)
   - Statut (Brouillon/Publié)
   - Type d'accès (Gratuit/Payant/Sur invitation)
4. Cliquez sur **"Sauvegarder"**

### 2. Ajouter des modules

1. Dans l'édition de la formation, cliquez sur **"Ajouter un module"**
2. Donnez un nom au module
3. Les modules sont automatiquement ordonnés

### 3. Ajouter des éléments

1. Dans un module, cliquez sur **"+ Élément"**
2. Donnez un titre à l'élément
3. Choisissez le type (Ressource, Support, Exercice, TP, Mini-jeu)
4. **Important** : Cliquez sur **"Sauvegarder"** la formation pour activer les éléments

### 4. Modifier un élément

1. Une fois la formation sauvegardée, cliquez sur l'icône **✏️ Modifier**
2. Vous pouvez maintenant :
   - Modifier le titre et le type
   - Écrire le contenu avec l'éditeur de texte riche
   - Ajouter des chapitres
   - Uploader des fichiers
   - Configurer les options spécifiques

### 5. Publier la formation

1. Changez le statut en **"Publié"**
2. Les étudiants inscrits pourront y accéder
3. Les formations gratuites sont accessibles à tous

---

## 💡 Conseils et bonnes pratiques

### Organisation du contenu

1. **Structurez avec des modules**
   - Un module = un thème ou une semaine
   - Nommez clairement vos modules

2. **Utilisez les chapitres**
   - Divisez les leçons longues en chapitres
   - Facilite la navigation pour les étudiants

3. **Mélangez les types de contenu**
   - Ressources pour la théorie
   - Supports pour les présentations
   - Exercices pour la pratique
   - TPs pour les projets

### Rédaction

1. **Soyez clair et concis**
   - Utilisez des titres pour structurer
   - Séparez les paragraphes
   - Utilisez des listes pour énumérer

2. **Mettez en évidence**
   - Utilisez le **gras** pour les mots-clés
   - Utilisez l'*italique* pour les termes techniques

3. **Ajoutez des liens**
   - Liez vers d'autres ressources
   - Liez vers des sites externes pertinents

### Gestion des fichiers

1. **Nommez vos fichiers clairement**
   - Ex: "Cours-API-REST.pdf" plutôt que "document.pdf"

2. **Optimisez la taille**
   - Compressez les images
   - Utilisez PDF pour les documents

3. **Vérifiez les formats**
   - PDF pour les documents
   - Images (JPG, PNG) pour les visuels
   - ZIP pour les archives

---

## ❓ Questions fréquentes

### Comment supprimer un élément ?
- Cliquez sur l'icône poubelle à côté de l'élément
- Confirmez la suppression

### Comment réorganiser les éléments ?
- Utilisez les flèches dans l'édition d'un élément
- Ou modifiez la position dans la base de données

### Les étudiants peuvent-ils modifier le contenu ?
- Non, seuls les admins et instructeurs peuvent modifier
- Les étudiants peuvent seulement consulter et soumettre leurs travaux

### Comment noter un exercice ou un TP ?
- Allez dans les soumissions (à implémenter dans l'interface admin)
- Attribuez une note de 0 à 100
- Ajoutez des commentaires si nécessaire

### Le zoom PDF est-il sauvegardé ?
- Oui, votre préférence de zoom est sauvegardée automatiquement
- Elle est restaurée à chaque ouverture de PDF

---

## 🆘 Support

Pour toute question ou problème :
1. Consultez cette documentation
2. Vérifiez les guides spécifiques (CHAPITRAGE.md, etc.)
3. Contactez l'administrateur du système

---

**Dernière mise à jour** : 2024




---


### 📄 Guide de création de cours et leçons

*Source: `portal-formations/GUIDE-CREATION.md`*


---

# Guide de création de cours et leçons

## 📚 Comment créer un cours

### Étape 1 : Accéder à l'administration
1. Connectez-vous avec un compte **admin**
2. Cliquez sur le bouton **"Administration"** dans le header (en haut à droite)
3. Vous arrivez sur la page `/admin` qui liste toutes les formations

### Étape 2 : Créer une nouvelle formation
1. Cliquez sur le bouton **"Nouvelle formation"** (en haut à droite)
2. Vous êtes redirigé vers `/admin/courses/new`

### Étape 3 : Remplir les informations de base
Dans la section **"Informations générales"** :
- **Titre** * (obligatoire) : Le nom de votre formation
- **Description** : Une description de la formation
- **Statut** : 
  - `Brouillon` : La formation n'est pas visible par les étudiants
  - `Publié` : La formation est visible et accessible
- **Type d'accès** :
  - `Gratuit` : Accès libre
  - `Payant` : Accès payant (nécessite un prix)
  - `Sur invitation` : Accès sur invitation uniquement
- **Prix** (si payant) : Le prix en centimes (ex: 5000 = 50€)

### Étape 4 : Sauvegarder la formation
1. Cliquez sur le bouton **"Sauvegarder"** (en haut à droite)
2. La formation est créée et vous êtes redirigé vers la page d'édition avec l'ID de la formation

---

## 📖 Comment créer des modules et leçons

### Étape 1 : Ajouter un module
Une fois la formation sauvegardée :
1. Dans la section **"Modules et éléments"**, cliquez sur **"Ajouter un module"**
2. Un nouveau module apparaît avec le titre "Nouveau module"
3. Cliquez sur le titre pour le modifier
4. Les modules sont automatiquement sauvegardés quand vous sauvegardez la formation

### Étape 2 : Ajouter une leçon (item) dans un module
1. Dans un module, cliquez sur le bouton **"+ Élément"** (à droite du titre du module)
2. Un nouvel élément apparaît avec le titre "Nouvel élément"
3. Cliquez sur le titre pour le modifier
4. **Important** : Les éléments temporaires ne peuvent pas être modifiés directement

### Étape 3 : Sauvegarder la formation pour activer les éléments
1. Cliquez sur **"Sauvegarder"** en haut de la page
2. Les modules et éléments temporaires sont sauvegardés dans la base de données
3. Les éléments obtiennent un ID réel (plus de "temp-")

### Étape 4 : Modifier une leçon
Une fois la formation sauvegardée :
1. Cliquez sur l'icône **✏️ Modifier** (icône crayon) à côté d'un élément
2. Vous êtes redirigé vers `/admin/items/{itemId}/edit`
3. Vous pouvez maintenant :
   - Modifier le titre et le type de l'élément
   - Écrire le contenu avec l'éditeur de texte riche
   - Ajouter des chapitres
   - Uploader des fichiers
   - Configurer les options spécifiques selon le type

---

## 🎯 Types de leçons disponibles

### 1. Ressource (`resource`)
- Pour partager des documents, liens, fichiers
- Peut contenir :
  - Une description
  - Un fichier (PDF, DOC, images, etc.)
  - Une URL externe

### 2. Support projeté (`slide`)
- Pour les présentations, slides
- Peut contenir :
  - Un fichier PDF ou image
  - Une description

### 3. Exercice (`exercise`)
- Pour les exercices à faire
- Peut contenir :
  - Un énoncé (éditeur de texte riche)
  - Une correction (éditeur de texte riche)
  - Les étudiants peuvent soumettre leurs réponses

### 4. TP (`tp`)
- Pour les travaux pratiques
- Peut contenir :
  - Des instructions (éditeur de texte riche)
  - Une checklist
  - Les étudiants peuvent soumettre leurs travaux

### 5. Mini-jeu (`game`)
- Pour les jeux éducatifs
- Peut contenir :
  - Une description
  - Un système de score

---

## ✍️ Écrire le contenu d'une leçon

### Contenu principal
1. Dans la page d'édition d'un élément, vous verrez la section **"Contenu principal"**
2. Utilisez l'éditeur de texte riche pour écrire directement votre contenu
3. Le contenu est sauvegardé automatiquement dans `item.content.body`

### Fonctionnalités de l'éditeur
- **Gras** : Mettre en gras
- **Italique** : Mettre en italique
- **Titres** : H1, H2, H3
- **Listes** : À puces ou numérotées
- **Liens** : Ajouter des liens hypertextes
- **Annuler/Refaire** : Gérer l'historique

### Chapitres
1. Dans la section **"Chapitres"**, cliquez sur **"Ajouter un chapitre"**
2. Donnez un titre au chapitre
3. Cliquez sur le chapitre pour le développer
4. Écrivez le contenu du chapitre dans l'éditeur
5. Les chapitres sont sauvegardés automatiquement après 2 secondes d'inactivité

### Réorganiser les chapitres
- Utilisez les flèches ⬆️ ⬇️ pour déplacer un chapitre
- Les positions sont mises à jour automatiquement

---

## 🔄 Workflow recommandé

### Pour créer une formation complète :

1. **Créer la formation**
   - Aller sur `/admin`
   - Cliquer sur "Nouvelle formation"
   - Remplir les informations
   - Sauvegarder

2. **Créer les modules**
   - Dans la page d'édition de la formation
   - Cliquer sur "Ajouter un module" pour chaque module
   - Modifier les titres des modules
   - Sauvegarder la formation

3. **Créer les leçons**
   - Dans chaque module, cliquer sur "+ Élément"
   - Modifier les titres des éléments
   - Sauvegarder la formation (important !)

4. **Écrire le contenu des leçons**
   - Cliquer sur ✏️ à côté d'un élément
   - Écrire le contenu principal
   - Ajouter des chapitres si nécessaire
   - Le contenu est sauvegardé automatiquement

5. **Publier la formation**
   - Revenir sur la page d'édition de la formation
   - Changer le statut de "Brouillon" à "Publié"
   - Sauvegarder

---

## ⚠️ Points importants

1. **Sauvegarder avant de modifier les éléments**
   - Les éléments avec un ID temporaire (`temp-XXX`) ne peuvent pas être modifiés
   - Il faut d'abord sauvegarder la formation pour obtenir des IDs réels

2. **Module ID obligatoire**
   - Pour créer un nouvel élément directement, vous devez passer le `module_id` dans l'URL
   - Format : `/admin/items/new?module_id={moduleId}`

3. **Ordre des éléments**
   - Les modules et éléments sont triés par position
   - Vous pouvez modifier la position dans les champs numériques

4. **Publication**
   - Seuls les éléments avec `published: true` sont visibles par les étudiants
   - Vous pouvez décocher "Publié" pour masquer temporairement un élément

---

## 🎨 Exemple de structure

```
Formation : "React Avancé"
├── Module 1 : "Introduction"
│   ├── Leçon 1 : "Qu'est-ce que React ?" (resource)
│   └── Leçon 2 : "Installation" (slide)
├── Module 2 : "Les Hooks"
│   ├── Leçon 3 : "useState" (resource)
│   ├── Leçon 4 : "useEffect" (exercise)
│   └── Leçon 5 : "TP : Créer un compteur" (tp)
└── Module 3 : "Pratique"
    └── Leçon 6 : "Quiz React" (game)
```

---

## 🔗 URLs importantes

- **Liste des formations** : `/admin`
- **Créer une formation** : `/admin/courses/new`
- **Modifier une formation** : `/admin/courses/{courseId}`
- **Créer une leçon** : `/admin/items/new?module_id={moduleId}`
- **Modifier une leçon** : `/admin/items/{itemId}/edit`

---

## 💡 Astuces

1. **Dupliquer une formation** : Utilisez l'icône 📋 dans la liste des formations
2. **Voir la formation** : Utilisez l'icône 👁️ pour voir comment les étudiants la voient
3. **Filtrage** : Les étudiants peuvent filtrer par type de contenu via les tuiles de fonctionnalités
4. **Chapitres** : Utilisez les chapitres pour organiser le contenu long en sections






---


### 📄 Guide de gestion des utilisateurs

*Source: `portal-formations/GUIDE-GESTION-UTILISATEURS.md`*


---

# Guide de gestion des utilisateurs

Ce guide explique comment utiliser la fonctionnalité de gestion des utilisateurs depuis l'interface d'administration.

## 📋 Prérequis

1. Avoir un compte avec le rôle **admin** dans l'application
2. Avoir exécuté le script SQL `create-user-function.sql` dans Supabase
3. (Optionnel) Désactiver la confirmation email dans Supabase pour créer des utilisateurs sans email de confirmation

## 🚀 Configuration initiale

### 1. Exécuter le script SQL

Exécutez le fichier `create-user-function.sql` dans l'éditeur SQL de Supabase. Ce script crée :

- La fonction `update_user_role` : permet aux admins de modifier les rôles des utilisateurs
- La fonction `create_profile_with_role` : permet aux admins de créer des profils avec un rôle spécifique
- Les policies RLS nécessaires pour permettre aux admins de gérer les profils

### 2. (Optionnel) Désactiver la confirmation email

Pour créer des utilisateurs sans qu'ils aient besoin de confirmer leur email :

1. Allez dans **Supabase Dashboard** → **Authentication** → **Settings**
2. Désactivez **"Enable email confirmations"** dans la section **Email Auth**
3. Sauvegardez les modifications

⚠️ **Note de sécurité** : Désactiver la confirmation email réduit la sécurité. Utilisez cette option uniquement dans un environnement de développement ou si vous avez d'autres mesures de sécurité en place.

### 3. Alternative : Utiliser une Edge Function

Pour une solution plus sécurisée en production, créez une Edge Function Supabase qui utilise l'API Admin pour créer des utilisateurs. Cette approche permet de :

- Créer des utilisateurs sans confirmation email
- Utiliser la clé service_role de manière sécurisée (côté serveur uniquement)
- Contrôler plus finement les permissions

## 📖 Utilisation

### Accéder à la page de gestion

1. Connectez-vous avec un compte admin
2. Accédez à `/admin/users` dans votre navigateur
3. Vous verrez la liste de tous les utilisateurs

### Créer un nouvel utilisateur

1. Cliquez sur le bouton **"Créer un utilisateur"**
2. Remplissez le formulaire :
   - **Email** : L'adresse email de l'utilisateur (requis)
   - **Mot de passe** : Le mot de passe initial (minimum 6 caractères, requis)
   - **Nom complet** : Le nom de l'utilisateur (optionnel)
   - **Rôle** : Sélectionnez le rôle (Étudiant, Formateur, ou Administrateur)
3. Cliquez sur **"Créer l'utilisateur"**

### Modifier le rôle d'un utilisateur

1. Dans la liste des utilisateurs, trouvez l'utilisateur concerné
2. Cliquez sur le menu déroulant dans la colonne **"Rôle"**
3. Sélectionnez le nouveau rôle
4. Confirmez la modification

### Supprimer un utilisateur

1. Dans la liste des utilisateurs, trouvez l'utilisateur à supprimer
2. Cliquez sur l'icône de poubelle dans la colonne **"Actions"**
3. Confirmez la suppression

⚠️ **Attention** : La suppression supprime uniquement le profil. Pour supprimer complètement l'utilisateur de Supabase Auth, vous devez utiliser l'API Admin ou l'interface Supabase.

### Rechercher un utilisateur

Utilisez la barre de recherche en haut de la page pour filtrer les utilisateurs par nom ou ID.

## 🔐 Rôles disponibles

- **Étudiant (student)** : Accès aux formations publiées
- **Formateur (instructor)** : Peut créer et gérer des formations
- **Administrateur (admin)** : Accès complet à toutes les fonctionnalités, y compris la gestion des utilisateurs

## 🛠️ Dépannage

### L'utilisateur est créé mais le rôle n'est pas correct

Si l'utilisateur est créé mais que le rôle n'est pas celui attendu :

1. Vérifiez que le script SQL a bien été exécuté
2. Vérifiez que vous avez bien le rôle admin
3. Essayez de modifier le rôle manuellement via le menu déroulant

### Erreur lors de la création d'un utilisateur

Si vous obtenez une erreur lors de la création :

1. Vérifiez que l'email n'est pas déjà utilisé
2. Vérifiez que le mot de passe respecte les critères (minimum 6 caractères)
3. Vérifiez les logs de la console pour plus de détails
4. Si la confirmation email est activée, l'utilisateur devra confirmer son email avant de pouvoir se connecter

### Les policies RLS bloquent les opérations

Si vous obtenez des erreurs de permissions :

1. Vérifiez que vous avez bien le rôle admin dans la table `profiles`
2. Vérifiez que les policies RLS ont bien été créées (voir `create-user-function.sql`)
3. Exécutez à nouveau le script SQL si nécessaire

## 📝 Notes importantes

- La création d'utilisateurs via `signUp` nécessite que l'email confirmation soit désactivée ou que l'utilisateur confirme son email
- Pour une solution de production, envisagez d'utiliser une Edge Function Supabase avec l'API Admin
- La suppression d'un utilisateur ne supprime que le profil, pas l'utilisateur dans `auth.users`
- Les utilisateurs créés manuellement par un admin peuvent se connecter immédiatement si l'email confirmation est désactivée

## 🔗 Liens utiles

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentation RLS (Row Level Security)](https://supabase.com/docs/guides/auth/row-level-security)






---


### 📄 Guide : Création et gestion des sessions

*Source: `portal-formations/GUIDE-SESSIONS.md`*


---

# Guide : Création et gestion des sessions

## Problème identifié

Les étudiants peuvent soumettre des exercices, mais la table `sessions` est vide car :
1. **Les sessions doivent être créées manuellement** par un formateur/admin
2. **Les étudiants ne sont pas automatiquement liés à une session** lors de leur inscription à une formation
3. **Les soumissions d'exercices ne sont pas liées à une session** par défaut

## Solution implémentée

### 1. Ajout de `session_id` aux tables existantes

- **`enrollments`** : Ajout de la colonne `session_id` pour lier les inscriptions aux sessions
- **`submissions`** : Ajout de la colonne `session_id` pour lier les soumissions aux sessions

### 2. Attribution automatique de session

Un système automatique a été mis en place :
- Quand un étudiant s'inscrit à une formation (`enrollments`), le système cherche automatiquement une session active pour ce cours et l'organisation de l'étudiant
- Quand un étudiant soumet un exercice (`submissions`), le système lie automatiquement la soumission à la session correspondante

### 3. Fonction `get_user_session_for_course()`

Cette fonction détermine automatiquement la session d'un utilisateur pour un cours donné :
- Cherche l'organisation de l'utilisateur via `org_members`
- Trouve une session active pour ce cours et cette organisation
- Retourne la session la plus récente si plusieurs existent

## Comment créer une session

### Option 1 : Via SQL (pour tester rapidement)

```sql
-- 1. Créer une organisation si elle n'existe pas
INSERT INTO orgs (name, slug)
VALUES ('Mon Organisation', 'mon-org')
ON CONFLICT (slug) DO NOTHING;

-- 2. Créer une session pour un cours
INSERT INTO sessions (org_id, course_id, title, status, created_by)
SELECT 
  o.id,
  'VOTRE_COURSE_ID'::uuid,
  'Session de test - ' || c.title,
  'active',
  'VOTRE_USER_ID'::uuid
FROM orgs o
CROSS JOIN courses c
WHERE o.slug = 'mon-org'
  AND c.id = 'VOTRE_COURSE_ID'::uuid
LIMIT 1;
```

### Option 2 : Via l'interface (à implémenter)

Une interface de création de sessions devrait être ajoutée dans le portail formateur (`/trainer`).

## Workflow recommandé

1. **Créer une organisation** (si pas déjà fait)
   - Via SQL ou interface admin

2. **Ajouter des membres à l'organisation**
   ```sql
   INSERT INTO org_members (org_id, user_id, role)
   VALUES ('ORG_ID', 'USER_ID', 'student');
   ```

3. **Créer une session pour un cours**
   ```sql
   INSERT INTO sessions (org_id, course_id, title, status, created_by)
   VALUES ('ORG_ID', 'COURSE_ID', 'Session Automne 2024', 'active', 'TRAINER_ID');
   ```

4. **Les étudiants peuvent maintenant :**
   - S'inscrire à la formation (via `enrollments`)
   - Leur inscription sera automatiquement liée à la session
   - Leurs soumissions seront automatiquement liées à la session

## Vérification

Pour vérifier que tout fonctionne :

```sql
-- Voir les sessions
SELECT * FROM sessions;

-- Voir les enrollments avec leur session
SELECT e.*, s.title as session_title
FROM enrollments e
LEFT JOIN sessions s ON s.id = e.session_id;

-- Voir les submissions avec leur session
SELECT s.*, ses.title as session_title
FROM submissions s
LEFT JOIN sessions ses ON ses.id = s.session_id;
```

## Notes importantes

- **Les sessions sont optionnelles** : Si un étudiant n'a pas de session, il peut quand même soumettre des exercices, mais ils ne seront pas visibles dans le dashboard formateur
- **Une session doit être liée à une organisation** : Les étudiants doivent être membres de l'organisation pour être liés à la session
- **Le statut de la session** : Seules les sessions avec `status = 'active'` sont utilisées pour l'attribution automatique






---


### 📄 Guide : Tracking du temps passé sur l'application

*Source: `portal-formations/GUIDE-TIME-TRACKING.md`*


---

# Guide : Tracking du temps passé sur l'application

## 🎯 Fonctionnalité

Système de tracking automatique du temps que les utilisateurs passent sur l'application, avec distinction entre :
- **Temps total** : Temps depuis l'ouverture de la page
- **Temps actif** : Temps où la page est active devant les yeux de l'utilisateur (page visible + activité détectée)

## 📋 Installation

### Étape 1 : Créer la table

Exécutez le script `creer-table-time-tracking.sql` dans Supabase SQL Editor.

Ce script crée :
- Table `user_time_tracking` : Stocke le temps passé par utilisateur par jour
- Vue `user_time_stats` : Vue agrégée pour les statistiques
- RLS Policies : Sécurité pour l'accès aux données
- Trigger : Mise à jour automatique de `updated_at`

## 🚀 Fonctionnement

### Tracking automatique

Le système track automatiquement :
1. **Temps total** : Depuis l'ouverture de la page
2. **Temps actif** : Uniquement quand :
   - La page est visible (pas en arrière-plan)
   - L'utilisateur est actif (souris, clavier, scroll, etc.)
   - Pas d'inactivité > 1 minute

### Détection d'activité

L'utilisateur est considéré comme actif si :
- La page est visible (pas en arrière-plan)
- Une activité a été détectée dans les 60 dernières secondes :
  - Mouvement de souris
  - Clic
  - Frappe au clavier
  - Scroll
  - Touch (mobile)

### Envoi des données

- **Fréquence** : Toutes les 30 secondes
- **Format** : Agrégation par jour, session et cours
- **Persistance** : Les données sont cumulées dans la base

## 📊 Visualisation pour les formateurs

### Accès

1. **Depuis le tableau de bord** : `/trainer`
   - Cliquer sur "Temps passé" dans les actions rapides d'une session
2. **Directement** : `/trainer/time-tracking`
3. **Pour une session spécifique** : `/trainer/sessions/:sessionId/time-tracking`

### Données affichées

#### Statistiques globales
- **Temps actif total** : Somme de tous les temps actifs
- **Jours actifs** : Nombre de jours avec activité
- **Moyenne par jour** : Temps actif moyen par jour
- **Vues de pages** : Nombre total de pages visitées
- **Utilisateurs actifs** : Nombre d'utilisateurs ayant une activité

#### Tableau par utilisateur
- Nom de l'utilisateur
- Temps actif total (heures et minutes)
- Nombre de jours actifs
- Moyenne par jour
- Nombre de vues de pages

#### Détail par jour
- Date
- Utilisateur
- Session
- Cours
- Temps actif (heures et minutes)
- Nombre de vues
- Dernière activité

### Filtres

- **Date de début** : Filtrer à partir d'une date
- **Date de fin** : Filtrer jusqu'à une date
- **Par défaut** : 30 derniers jours

## 🔧 Configuration

### Paramètres du tracking

Dans `useTimeTracking.ts` :
- `TRACKING_INTERVAL = 30000` : Envoi toutes les 30 secondes
- `ACTIVE_CHECK_INTERVAL = 1000` : Vérification chaque seconde
- `INACTIVE_THRESHOLD = 60000` : 1 minute d'inactivité = inactif

### Modification des paramètres

Pour changer la fréquence d'envoi ou le seuil d'inactivité, modifiez les constantes dans `src/hooks/useTimeTracking.ts`.

## 📈 Utilisation des données

Les données peuvent être utilisées pour :
- **Engagement** : Voir quels apprenants sont les plus actifs
- **Détection de problèmes** : Identifier les apprenants inactifs
- **Optimisation** : Comprendre comment les apprenants utilisent l'application
- **Reporting** : Générer des rapports d'activité

## 🔒 Confidentialité

- **RLS activé** : Les utilisateurs ne voient que leurs propres données
- **Formateurs** : Peuvent voir les données de leurs apprenants uniquement
- **Pas de données sensibles** : Seulement le temps passé, pas le contenu consulté

## ✅ Vérification

Pour vérifier que le tracking fonctionne :

1. **Exécuter le script SQL** dans Supabase
2. **Rafraîchir le navigateur** (Cmd+Shift+R)
3. **Utiliser l'application** pendant quelques minutes
4. **Aller sur `/trainer/time-tracking`** et vérifier que les données apparaissent

## 🐛 Dépannage

### Les données ne remontent pas

1. Vérifier que la table existe : `SELECT * FROM user_time_tracking LIMIT 1;`
2. Vérifier les RLS policies : Les utilisateurs doivent pouvoir insérer leurs données
3. Vérifier la console du navigateur : Y a-t-il des erreurs ?
4. Vérifier que `TimeTrackingProvider` est bien dans `App.tsx`

### Le temps actif est toujours 0

1. Vérifier que la page est visible (pas en arrière-plan)
2. Vérifier qu'il y a de l'activité (mouvement de souris, etc.)
3. Vérifier que le seuil d'inactivité n'est pas trop court

Tout est prêt ! 🎉






---


### 📄 Guide : Utiliser l'interface pour créer et gérer des programmes

*Source: `portal-formations/GUIDE-PROGRAMMES-INTERFACE.md`*


---

# Guide : Utiliser l'interface pour créer et gérer des programmes

Ce guide explique comment utiliser l'interface admin pour créer des programmes (fusion de formations) et gérer les accès.

## 📋 Prérequis

1. **Avoir exécuté le schéma SQL** : Assurez-vous d'avoir exécuté `add-programs-schema.sql` dans Supabase
2. **Avoir un compte admin** : Vous devez être connecté avec un compte ayant le rôle `admin`
3. **Avoir des formations existantes** : Vous devez avoir au moins une formation créée pour pouvoir l'ajouter à un programme

## 🚀 Créer un programme

### Étape 1 : Accéder à la page des programmes

1. Connectez-vous avec un compte **admin**
2. Cliquez sur **"Administration"** dans le header
3. Cliquez sur le bouton **"Programmes"** dans la barre d'outils
4. Vous arrivez sur la page `/admin/programs`

### Étape 2 : Créer un nouveau programme

1. Cliquez sur le bouton **"Nouveau programme"** (en haut à droite)
2. Vous êtes redirigé vers `/admin/programs/new`

### Étape 3 : Remplir les informations générales

Dans la section **"Informations générales"** :

- **Titre** * (obligatoire) : Le nom de votre programme
- **Description** : Une description du programme
- **Statut** :
  - `Brouillon` : Le programme n'est pas visible par les utilisateurs
  - `Publié` : Le programme est visible et accessible
- **Type d'accès** :
  - `Gratuit` : Accès libre
  - `Payant` : Accès payant (nécessite un prix)
  - `Sur invitation` : Accès sur invitation uniquement
- **Prix** (si payant) : Le prix en centimes (ex: 5000 = 50€)

### Étape 4 : Ajouter des formations au programme

1. Dans la section **"Formations du programme"**, cliquez sur **"Ajouter des formations"**
2. Une modal s'ouvre avec la liste des formations disponibles
3. Cochez les formations que vous souhaitez ajouter au programme
4. Cliquez sur **"Ajouter X formation(s)"**
5. Les formations apparaissent dans la liste, dans l'ordre d'ajout

### Étape 5 : Réorganiser l'ordre des formations

Une fois les formations ajoutées, vous pouvez réorganiser leur ordre :

- Utilisez les flèches **↑** et **↓** à gauche de chaque formation pour la déplacer
- L'ordre défini ici sera l'ordre dans lequel les formations apparaîtront dans le programme

### Étape 6 : Sauvegarder le programme

1. Cliquez sur le bouton **"Sauvegarder"** (en haut à droite)
2. Le programme est créé et vous êtes redirigé vers la page d'édition avec l'ID du programme

## 👥 Gérer les accès au programme

### Accéder à la gestion des accès

1. Depuis la liste des programmes (`/admin/programs`)
2. Cliquez sur le bouton **"Accès"** à côté du programme
3. Vous arrivez sur `/admin/programs/{programId}/enrollments`

### Ajouter des personnes

1. Cliquez sur **"Ajouter des personnes"**
2. Une modal s'ouvre avec la liste des utilisateurs disponibles
3. Utilisez la barre de recherche pour filtrer les utilisateurs
4. Cochez les personnes à qui vous souhaitez donner accès
5. Cliquez sur **"Ajouter X personne(s)"**

### Gérer les statuts d'accès

Pour chaque personne ayant accès, vous pouvez modifier son statut :

- **Actif** : La personne a accès au programme
- **En attente** : L'accès est en attente de validation
- **Révoqué** : L'accès a été révoqué

Utilisez le menu déroulant à droite de chaque personne pour changer le statut.

### Retirer l'accès

1. Cliquez sur l'icône **X** à droite de la personne
2. Confirmez la suppression
3. La personne perd l'accès au programme

## ✏️ Modifier un programme existant

1. Depuis la liste des programmes, cliquez sur **"Modifier"** à côté du programme
2. Vous pouvez :
   - Modifier les informations générales (titre, description, statut, etc.)
   - Ajouter ou retirer des formations
   - Réorganiser l'ordre des formations
3. Cliquez sur **"Sauvegarder"** pour enregistrer les modifications

## 🔍 Fonctionnalités avancées

### Rechercher des personnes

Dans la page de gestion des accès, utilisez la barre de recherche en haut pour filtrer les personnes ayant accès au programme.

### Dupliquer un programme

1. Depuis la liste des programmes, cliquez sur l'icône **📋** à côté du programme
2. Un nouveau programme est créé avec le même titre suivi de "(Copie)"
3. Vous pouvez ensuite le modifier comme vous le souhaitez

### Supprimer un programme

1. Depuis la liste des programmes, cliquez sur l'icône **🗑️** à côté du programme
2. Confirmez la suppression
3. ⚠️ **Attention** : Cette action supprime également toutes les associations avec les formations et toutes les inscriptions

## 📊 Structure des données

Un programme est composé de :

- **Informations du programme** : titre, description, statut, type d'accès, prix
- **Formations associées** : liste de formations avec un ordre défini (position)
- **Inscriptions** : liste des personnes ayant accès au programme avec leur statut

## 🐛 Dépannage

### Erreur : "Le titre est obligatoire"
- Assurez-vous d'avoir rempli le champ "Titre" avant de sauvegarder

### Erreur : "Veuillez sélectionner au moins une formation"
- Vous devez ajouter au moins une formation au programme avant de sauvegarder

### Les formations ne s'affichent pas dans la modal
- Vérifiez que vous avez bien créé des formations au préalable
- Les formations déjà ajoutées au programme n'apparaissent pas dans la liste disponible

### Impossible de réorganiser l'ordre
- Assurez-vous d'avoir sauvegardé le programme au moins une fois
- Les formations temporaires (non sauvegardées) peuvent avoir des problèmes d'ordre

## 📝 Notes importantes

- **Les formations restent indépendantes** : Modifier une formation n'affecte pas le programme, et vice versa
- **L'ordre est important** : L'ordre défini dans le programme détermine l'ordre d'affichage pour les utilisateurs
- **Les inscriptions sont indépendantes** : Donner accès à un programme ne donne pas automatiquement accès aux formations individuelles
- **Les programmes peuvent être réutilisés** : Une formation peut appartenir à plusieurs programmes

## 🎯 Prochaines étapes

Une fois les programmes créés, vous pouvez :

1. **Adapter le frontend** pour afficher les programmes aux utilisateurs
2. **Créer une vue programme** qui affiche les formations dans l'ordre défini
3. **Ajouter des métriques** de progression par programme
4. **Implémenter la navigation** entre formations dans un programme






---


### 📄 Guide : Gestion de plusieurs organisations

*Source: `portal-formations/GUIDE-MULTI-ORGS.md`*


---

# Guide : Gestion de plusieurs organisations

## Situation actuelle

### ✅ Ce qui fonctionne

1. **Interface Admin (`/admin/orgs`)** :
   - ✅ Affiche **toutes les organisations**
   - ✅ Permet de créer plusieurs organisations
   - ✅ Permet de gérer les membres de chaque organisation

2. **Base de données** :
   - ✅ Un utilisateur **peut être membre de plusieurs organisations**
   - ✅ Chaque organisation peut avoir plusieurs sessions
   - ✅ Les sessions sont liées à une organisation spécifique

### ⚠️ Limitations actuelles

1. **Dashboard Formateur (`/trainer`)** :
   - ⚠️ Affiche seulement **une seule organisation** (la plus récente)
   - ⚠️ Ne permet pas de **sélectionner** entre plusieurs organisations
   - ⚠️ Si vous êtes formateur dans plusieurs classes/orgs, vous ne voyez que la première

2. **Détermination du rôle** :
   - ⚠️ `getUserRole()` retourne seulement la première organisation trouvée
   - ⚠️ Utilise `.limit(1)` donc prend la plus récente

## Comment ça fonctionne actuellement

### Pour les Admins
- **Interface Admin** : Vous voyez **toutes les organisations** dans `/admin/orgs`
- **Dashboard Formateur** : Vous voyez la première organisation trouvée (ou toutes les sessions si admin)

### Pour les Formateurs
- Si vous êtes formateur dans **plusieurs organisations** :
  - Le système prend la **première organisation** (la plus récente)
  - Vous voyez seulement les sessions de cette organisation dans `/trainer`
  - Les autres organisations ne sont pas accessibles depuis le dashboard formateur

### Pour les Étudiants
- Si un étudiant est dans plusieurs organisations :
  - Le système détermine son rôle depuis la première organisation trouvée
  - Ses soumissions sont liées à la session correspondante (automatiquement)

## Solutions possibles

### Option 1 : Sélecteur d'organisation (Recommandé)

Ajouter un sélecteur dans le dashboard formateur pour choisir l'organisation active :

```
┌─────────────────────────────────────┐
│ Dashboard Formateur                │
│                                     │
│ Organisation: [Classe A ▼]         │
│   - Classe A                       │
│   - Classe B                       │
│   - Classe C                       │
│                                     │
│ Sessions de Classe A:              │
│   - Session 1                      │
│   - Session 2                      │
└─────────────────────────────────────┘
```

**Avantages** :
- Permet de gérer plusieurs classes facilement
- Interface claire et intuitive
- Pas de changement de structure de données

### Option 2 : Vue multi-organisations

Afficher toutes les organisations avec leurs sessions :

```
┌─────────────────────────────────────┐
│ Dashboard Formateur                │
│                                     │
│ 📁 Classe A                        │
│   - Session 1                      │
│   - Session 2                      │
│                                     │
│ 📁 Classe B                        │
│   - Session 3                      │
│                                     │
│ 📁 Classe C                        │
│   - Session 4                      │
└─────────────────────────────────────┘
```

**Avantages** :
- Vue d'ensemble de toutes les classes
- Pas besoin de changer d'organisation

### Option 3 : Garder l'état actuel

Si vous n'avez qu'une organisation à la fois, l'état actuel fonctionne.

## Recommandation

Pour gérer **plusieurs classes en même temps**, je recommande l'**Option 1 (Sélecteur d'organisation)** car :
1. C'est le plus flexible
2. Interface claire
3. Permet de se concentrer sur une classe à la fois
4. Facile à implémenter

## Implémentation

Si vous voulez que j'implémente le sélecteur d'organisation, je peux :
1. Modifier `getTrainerContext()` pour retourner toutes les organisations d'un formateur
2. Ajouter un sélecteur dans `TrainerDashboard`
3. Filtrer les sessions selon l'organisation sélectionnée
4. Sauvegarder la sélection dans le localStorage

Souhaitez-vous que j'implémente cette fonctionnalité ?






---


### 📄 Guide : Héritage automatique des droits aux formations via les programmes

*Source: `portal-formations/GUIDE-HERITAGE-DROITS.md`*


---

# Guide : Héritage automatique des droits aux formations via les programmes

Ce guide explique comment fonctionne l'héritage automatique des droits d'accès aux formations lorsqu'un utilisateur est inscrit à un programme.

## 🎯 Principe

Lorsqu'un utilisateur est inscrit à un **programme**, il hérite automatiquement de l'accès à **toutes les formations** contenues dans ce programme.

## 🔧 Installation

### Étape 1 : Exécuter le script SQL

Exécutez le fichier `add-program-inheritance-triggers.sql` dans l'interface SQL de Supabase :

```sql
-- Ce script crée :
-- - Des triggers pour créer automatiquement les enrollments aux formations
-- - Des triggers pour mettre à jour les enrollments quand le statut change
-- - Des triggers pour révoquer les enrollments quand on retire l'accès au programme
-- - Une fonction helper pour vérifier l'accès via un programme
```

## 📋 Fonctionnement

### 1. Inscription à un programme

**Quand** : Un utilisateur est inscrit à un programme avec le statut `active`

**Action automatique** :
- ✅ Création automatique d'un `enrollment` pour chaque formation du programme
- ✅ Les enrollments sont créés avec le même statut que l'inscription au programme
- ✅ Si un enrollment existe déjà, il n'est pas dupliqué

**Exemple** :
```
Utilisateur inscrit au "Programme Développement Web"
  → Accès automatique à "Formation HTML/CSS"
  → Accès automatique à "Formation JavaScript"
  → Accès automatique à "Formation React"
```

### 2. Modification du statut d'inscription

**Quand** : Le statut d'inscription au programme change

**Actions automatiques** :
- **Statut passe à `active`** : Création/mise à jour des enrollments à `active`
- **Statut passe à `revoked` ou `pending`** : Révoque les enrollments (statut → `revoked`)

### 3. Retrait d'accès au programme

**Quand** : L'inscription au programme est supprimée

**Action automatique** :
- ✅ Révoque tous les enrollments aux formations du programme
- ✅ Les enrollments passent au statut `revoked`

### 4. Ajout d'une formation à un programme

**Quand** : Une nouvelle formation est ajoutée à un programme existant

**Action automatique** :
- ✅ Création automatique d'enrollments pour tous les utilisateurs déjà inscrits au programme
- ✅ Seulement pour les utilisateurs avec un statut `active`

## 🔍 Vérification d'accès

### Dans le code frontend

Les pages `CourseView` et `ItemView` vérifient maintenant l'accès de deux manières :

1. **Enrollment direct** : L'utilisateur est directement inscrit à la formation
2. **Accès via programme** : L'utilisateur est inscrit à un programme contenant la formation

### Logique de vérification

```typescript
// 1. Vérifier l'enrollment direct
const enrollment = await checkDirectEnrollment(userId, courseId)

// 2. Si pas d'enrollment direct, vérifier via programme
if (!enrollment) {
  const programAccess = await checkProgramAccess(userId, courseId)
  if (!programAccess) {
    // Accès refusé
  }
}
```

## 📊 Cas d'usage

### Cas 1 : Inscription à un programme

1. Admin crée un programme "Formation Complète API"
2. Admin ajoute 3 formations au programme
3. Admin inscrit un utilisateur au programme
4. ✅ **Automatiquement** : L'utilisateur a accès aux 3 formations

### Cas 2 : Ajout d'une formation à un programme existant

1. Programme "Formation Complète API" existe avec 2 utilisateurs inscrits
2. Admin ajoute une 4ème formation au programme
3. ✅ **Automatiquement** : Les 2 utilisateurs ont accès à la nouvelle formation

### Cas 3 : Révoquer l'accès au programme

1. Utilisateur est inscrit au programme "Formation Complète API"
2. Admin révoque l'accès (statut → `revoked`)
3. ✅ **Automatiquement** : Tous les enrollments aux formations sont révoqués

### Cas 4 : Suppression de l'inscription

1. Utilisateur est inscrit au programme "Formation Complète API"
2. Admin supprime complètement l'inscription
3. ✅ **Automatiquement** : Tous les enrollments aux formations sont révoqués

## ⚠️ Notes importantes

### Enrollments existants

- Si un enrollment existe déjà (créé manuellement), il n'est **pas écrasé**
- Les enrollments créés automatiquement ont `source: 'manual'`
- Les enrollments créés automatiquement ont `enrolled_at` = date d'inscription au programme

### Révoquation intelligente

- Seuls les enrollments créés **après** l'inscription au programme sont révoqués
- Les enrollments créés manuellement avant l'inscription au programme ne sont **pas** révoqués
- Cela permet de préserver les accès directs même si l'accès au programme est révoqué

### Performance

- Les triggers sont optimisés pour éviter les doublons
- Utilisation de `ON CONFLICT DO NOTHING` pour éviter les erreurs
- Les vérifications d'accès dans le frontend sont optimisées (2 requêtes max)

## 🐛 Dépannage

### Les enrollments ne sont pas créés automatiquement

**Vérifications** :
1. Les triggers sont-ils installés ? (vérifier dans Supabase)
2. Le statut de l'inscription au programme est-il `active` ?
3. Y a-t-il des erreurs dans les logs Supabase ?

**Solution** :
```sql
-- Vérifier que les triggers existent
SELECT * FROM pg_trigger WHERE tgname LIKE '%program%';

-- Tester manuellement la fonction
SELECT inherit_course_access_from_program();
```

### Les enrollments ne sont pas révoqués

**Vérifications** :
1. Le trigger `on_program_enrollment_deleted` existe-t-il ?
2. Les enrollments ont-ils été créés après l'inscription au programme ?

**Solution** :
```sql
-- Vérifier les enrollments d'un utilisateur
SELECT e.*, pe.enrolled_at as program_enrolled_at
FROM enrollments e
JOIN program_courses pc ON e.course_id = pc.course_id
JOIN program_enrollments pe ON pc.program_id = pe.program_id
WHERE e.user_id = 'user-uuid-here';
```

### Accès refusé même avec inscription au programme

**Vérifications** :
1. Le statut de l'inscription au programme est-il `active` ?
2. La formation est-elle bien dans le programme ?
3. Les triggers ont-ils bien créé les enrollments ?

**Solution** :
```sql
-- Vérifier l'accès via programme
SELECT 
  pe.id as program_enrollment_id,
  pe.status as program_status,
  pc.course_id,
  e.id as course_enrollment_id,
  e.status as course_enrollment_status
FROM program_enrollments pe
JOIN program_courses pc ON pe.program_id = pc.program_id
LEFT JOIN enrollments e ON e.user_id = pe.user_id AND e.course_id = pc.course_id
WHERE pe.user_id = 'user-uuid-here'
  AND pc.course_id = 'course-uuid-here';
```

## 📝 Exemples SQL

### Créer manuellement un enrollment pour tester

```sql
-- Inscrire un utilisateur à un programme
INSERT INTO program_enrollments (user_id, program_id, status)
VALUES ('user-uuid', 'program-uuid', 'active');

-- Les enrollments aux formations seront créés automatiquement
```

### Vérifier les enrollments créés automatiquement

```sql
-- Voir tous les enrollments créés via un programme
SELECT 
  e.*,
  c.title as course_title,
  p.title as program_title
FROM enrollments e
JOIN courses c ON e.course_id = c.id
JOIN program_courses pc ON c.id = pc.course_id
JOIN programs p ON pc.program_id = p.id
JOIN program_enrollments pe ON p.id = pe.program_id
WHERE e.user_id = pe.user_id
  AND e.source = 'manual'
  AND e.enrolled_at >= pe.enrolled_at;
```

## ✅ Checklist de vérification

- [ ] Les triggers sont installés (`add-program-inheritance-triggers.sql`)
- [ ] Les triggers fonctionnent (tester avec une inscription)
- [ ] Les enrollments sont créés automatiquement
- [ ] Les enrollments sont révoqués quand on retire l'accès
- [ ] L'accès via programme fonctionne dans `CourseView`
- [ ] L'accès via programme fonctionne dans `ItemView`






---


### 📄 🚀 Guide d'accès à l'application Big Data Impacts

*Source: `portal-formations/GUIDE-ACCES-APPLICATION-BIG-DATA.md`*


---

# 🚀 Guide d'accès à l'application Big Data Impacts

## 📍 Où trouver l'application dans le TP

L'application est intégrée dans le **Module 2 : TP pratique - Application interactive** du cours "TP : Identifier les impacts du Big Data et de la Data Science dans un contexte métier".

### Structure du Module 2

1. **TP : Application d'analyse des impacts Big Data et Data Science** (instructions complètes)
2. **📋 Instructions : Comment accéder à l'application** (nouveau - guide détaillé)
3. **🚀 Application interactive - Big Data Impacts** (lien vers l'application)
4. **Exemples de cas d'usage à implémenter** (références)

## 🔧 Comment accéder à l'application

### Pour les étudiants

#### Étape 1 : Lancer l'application React

1. Ouvrir un terminal
2. Aller dans le dossier de l'application :
   ```bash
   cd big-data-impacts-app
   ```
3. Installer les dépendances (si pas déjà fait) :
   ```bash
   npm install
   ```
4. Lancer l'application :
   ```bash
   npm run dev
   ```

L'application sera accessible sur **http://localhost:5174**

#### Étape 2 : Accéder depuis le portail de formations

1. Se connecter au portail de formations
2. Aller dans le cours "TP : Identifier les impacts du Big Data et de la Data Science"
3. Ouvrir le **Module 2 : TP pratique - Application interactive**
4. Lire les instructions dans "📋 Instructions : Comment accéder à l'application"
5. Cliquer sur "🚀 Application interactive - Big Data Impacts"
6. L'application s'ouvrira dans un nouvel onglet

### Pour les formateurs

#### Vérifier que l'application est accessible

1. Lancer l'application en local (voir ci-dessus)
2. Vérifier que l'URL `http://localhost:5174` fonctionne dans le navigateur
3. Tester le lien depuis le portail

#### En cas de problème

- **Port occupé** : Vite utilisera automatiquement le port suivant (5175, 5176, etc.)
- **Erreur "Cannot GET /"** : L'application n'est pas lancée
- **Module non trouvé** : Exécuter `npm install` dans `big-data-impacts-app`

## 📊 Fonctionnalités de l'application

L'application permet de :

- ✅ Visualiser un dashboard avec statistiques et graphiques
- ✅ Créer, modifier et supprimer des cas d'usage
- ✅ Visualiser les impacts via des graphiques interactifs :
  - Graphique radar (spider chart)
  - Graphique en barres
  - Graphique circulaire
  - Scatter plot ROI vs Impact
- ✅ Comparer plusieurs cas d'usage côte à côte
- ✅ Rechercher et filtrer par secteur, titre, description
- ✅ Sauvegarder automatiquement dans le navigateur (localStorage)

## 🎯 Cas d'usage pré-chargés

L'application contient 5 cas d'usage exemples :

1. Détection de fraude bancaire en temps réel
2. Diagnostic médical assisté par IA
3. Système de recommandation de produits
4. Optimisation de la chaîne logistique
5. Maintenance prédictive industrielle

## 🔗 Intégration dans le TP

L'application est référencée dans le fichier JSON du TP via :

```json
{
  "type": "resource",
  "title": "🚀 Application interactive - Big Data Impacts",
  "position": 3,
  "published": true,
  "external_url": "http://localhost:5174",
  "content": {
    "description": "Accédez à l'application interactive..."
  }
}
```

Le système du portail détecte automatiquement `external_url` et affiche un bouton "Accéder à la ressource" qui ouvre l'application dans un nouvel onglet.

## 📝 Notes importantes

- **En développement** : Utilisez `http://localhost:5174`
- **En production** : Déployez l'application (Netlify, Vercel, etc.) et mettez à jour l'URL dans le JSON
- **CORS** : L'application est configurée pour permettre l'intégration en iframe si nécessaire
- **Responsive** : L'application fonctionne sur mobile, tablette et desktop

## 🚀 Déploiement en production (optionnel)

Pour déployer l'application en production :

1. Build de l'application :
   ```bash
   cd big-data-impacts-app
   npm run build
   ```

2. Déployer le dossier `dist/` sur Netlify ou Vercel

3. Mettre à jour l'URL dans le TP :
   ```json
   {
     "external_url": "https://votre-app.netlify.app"
   }
   ```

## ✅ Checklist pour les étudiants

- [ ] Avoir Node.js installé
- [ ] Avoir installé les dépendances (`npm install`)
- [ ] Avoir lancé l'application (`npm run dev`)
- [ ] Vérifier que l'application fonctionne sur http://localhost:5174
- [ ] Accéder au TP dans le portail
- [ ] Cliquer sur le lien "Application interactive - Big Data Impacts"
- [ ] Utiliser l'application pour créer et analyser des cas d'usage





---


### 📄 Guide : Activer/Désactiver des chapitres

*Source: `portal-formations/GUIDE-ACTIVER-DESACTIVER-CHAPTERS.md`*


---

# Guide : Activer/Désactiver des chapitres

## Fonctionnalité

Vous pouvez maintenant activer ou désactiver des chapitres dans un cours pour réduire le temps de formation. Les chapitres désactivés ne sont pas visibles pour les étudiants en mode cours, mais restent visibles et modifiables en mode admin.

## Installation

### 1. Exécuter le script SQL

Dans l'interface SQL de Supabase, exécutez le script :
```sql
add-chapters-published-field.sql
```

Ce script :
- Ajoute la colonne `published` (BOOLEAN) à la table `chapters`
- Définit la valeur par défaut à `true` pour tous les chapitres existants
- Crée un index pour optimiser les requêtes filtrées

## Utilisation

### En mode Admin

1. **Accéder à l'édition d'un item** : Allez dans `/admin/items/{itemId}`
2. **Voir tous les chapitres** : Tous les chapitres sont visibles, qu'ils soient publiés ou non
3. **Activer/Désactiver un chapitre** :
   - Cliquez sur l'icône 👁️ (Eye) pour activer un chapitre (vert = publié)
   - Cliquez sur l'icône 👁️‍🗨️ (EyeOff) pour désactiver un chapitre (gris = non publié)
   - Le changement est sauvegardé automatiquement

### Indicateurs visuels

- **Chapitre publié** : Icône 👁️ verte, chapitre avec opacité normale
- **Chapitre non publié** : Icône 👁️‍🗨️ grise, chapitre avec opacité réduite (60%) et fond gris clair

### En mode Cours

- **Étudiants** : Ne voient que les chapitres publiés (`published = true`)
- **Admins** : Voient tous les chapitres (publiés et non publiés)

## Comportement technique

### Requêtes SQL

Les requêtes sont automatiquement filtrées selon le rôle de l'utilisateur :

```typescript
// Pour les étudiants
.eq('published', true)

// Pour les admins
// Pas de filtre, tous les chapitres sont visibles
```

### Sauvegarde

- Les nouveaux chapitres sont créés avec `published: true` par défaut
- Le changement de statut est sauvegardé immédiatement en base de données
- Les chapitres temporaires (non sauvegardés) peuvent aussi être activés/désactivés

## Cas d'usage

### Réduire le temps de formation

1. Identifiez les chapitres optionnels ou avancés
2. Désactivez-les en cliquant sur l'icône 👁️
3. Les étudiants ne verront plus ces chapitres dans le cours
4. Vous pouvez les réactiver à tout moment

### Créer des versions de cours

- **Version complète** : Tous les chapitres activés
- **Version rapide** : Seulement les chapitres essentiels activés
- **Version débutant** : Chapitres de base uniquement

### Tests et développement

- Créez des chapitres de test et désactivez-les
- Les chapitres restent dans la base mais ne sont pas visibles pour les étudiants
- Parfait pour tester de nouveaux contenus sans affecter les étudiants

## Notes importantes

- ⚠️ Les chapitres désactivés ne sont **pas supprimés**, ils sont juste masqués
- ✅ Les chapitres désactivés restent **modifiables en mode admin**
- ✅ L'ordre des chapitres est **préservé** même si certains sont désactivés
- ✅ Les chapitres de type "game" peuvent aussi être activés/désactivés






---


### 📄 Guide : Quand les apprenants apparaissent dans le portail formateur

*Source: `portal-formations/GUIDE-APPRENANTS-VISIBILITE.md`*


---

# Guide : Quand les apprenants apparaissent dans le portail formateur

## 📋 Conditions pour qu'un apprenant apparaisse

Un apprenant apparaît dans la liste des apprenants d'une session **UNIQUEMENT** si toutes ces conditions sont remplies :

### ✅ Condition 1 : L'apprenant doit avoir un enrollment actif
- Il doit exister un enregistrement dans la table `enrollments`
- Avec `course_id` = le cours de la session
- Avec `status` = `'active'`
- Avec `session_id` = l'ID de la session (ou NULL si le trigger automatique doit le remplir)

### ✅ Condition 2 : L'apprenant doit être membre d'une organisation
- Il doit exister un enregistrement dans `org_members`
- Avec `org_id` = l'organisation de la session
- Avec `role` = `'student'` (ou autre rôle apprenant)

### ✅ Condition 3 : La session doit exister et être active
- Une session doit exister dans la table `sessions`
- Avec `status` = `'active'`
- Avec `org_id` = l'organisation de l'apprenant
- Avec `course_id` = le cours de l'enrollment

## 🔄 Attribution automatique de session

Si vous avez exécuté le script `add-session-support.sql`, un trigger automatique peut lier les enrollments aux sessions :

1. **Quand un enrollment est créé** :
   - Le trigger cherche une session active pour le cours et l'organisation de l'apprenant
   - Si trouvée, il met à jour automatiquement `session_id` dans l'enrollment

2. **Quand une soumission est créée** :
   - Le trigger cherche la session de l'apprenant pour ce cours
   - Si trouvée, il lie automatiquement la soumission à la session

## 📝 Processus complet pour ajouter un apprenant

### Option 1 : Via l'interface Admin (recommandé)

1. **Créer/Configurer l'organisation** :
   - Aller sur `/admin/orgs`
   - Créer une organisation si elle n'existe pas

2. **Ajouter l'apprenant à l'organisation** :
   - Aller sur `/admin/users`
   - Trouver l'utilisateur
   - L'ajouter à l'organisation avec le rôle `student`

3. **Créer une session** :
   - Aller sur `/trainer`
   - Créer une session pour le cours et l'organisation

4. **Inscrire l'apprenant au cours** :
   - Aller sur `/admin/courses/:courseId/enrollments`
   - Cliquer sur "Ajouter des inscriptions"
   - Sélectionner l'apprenant
   - L'enrollment sera automatiquement lié à la session si le trigger est actif

### Option 2 : Via SQL (pour tester rapidement)

```sql
-- 1. Vérifier que l'organisation existe
SELECT * FROM orgs WHERE slug = 'votre-org-slug';

-- 2. Ajouter l'apprenant à l'organisation
INSERT INTO org_members (org_id, user_id, role, display_name)
SELECT 
  o.id,
  'USER_ID_APPRENANT'::uuid,
  'student',
  'Nom Apprenant'
FROM orgs o
WHERE o.slug = 'votre-org-slug'
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 3. Vérifier que la session existe
SELECT * FROM sessions 
WHERE org_id = (SELECT id FROM orgs WHERE slug = 'votre-org-slug')
AND status = 'active';

-- 4. Créer l'enrollment avec session_id
INSERT INTO enrollments (user_id, course_id, session_id, status, source)
SELECT 
  'USER_ID_APPRENANT'::uuid,
  'COURSE_ID'::uuid,
  s.id,
  'active',
  'manual'
FROM sessions s
WHERE s.org_id = (SELECT id FROM orgs WHERE slug = 'votre-org-slug')
AND s.course_id = 'COURSE_ID'::uuid
AND s.status = 'active'
LIMIT 1
ON CONFLICT (user_id, course_id) DO UPDATE SET
  session_id = EXCLUDED.session_id,
  status = 'active';
```

## 🔍 Vérifier pourquoi un apprenant n'apparaît pas

### Étape 1 : Vérifier l'enrollment

```sql
-- Vérifier les enrollments pour un cours
-- Remplacez 'COURSE_ID' par l'ID du cours, ou utilisez la version automatique ci-dessous

-- Version automatique (trouve le cours M1 FULL-STACK)
SELECT 
  e.*,
  p.full_name as nom_apprenant,
  c.title as course_title,
  s.title as session_title,
  CASE 
    WHEN e.session_id IS NULL THEN '⚠️ session_id NULL'
    WHEN e.session_id = s.id THEN '✅ Bien lié'
    ELSE '❌ Problème'
  END as status
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN courses c ON c.id = e.course_id
LEFT JOIN sessions s ON s.id = e.session_id
WHERE c.title ILIKE '%M1 FULL-STACK%'
ORDER BY e.created_at DESC;
```

**Problèmes possibles :**
- ❌ Pas d'enrollment → Créer un enrollment
- ❌ `status` = `'pending'` ou `'revoked'` → Mettre à `'active'`
- ❌ `session_id` = NULL → Le trigger devrait le remplir automatiquement, sinon le faire manuellement

### Étape 2 : Vérifier l'organisation

```sql
-- Vérifier si l'apprenant est membre d'une organisation
SELECT 
  om.*,
  o.name as org_name,
  o.slug as org_slug
FROM org_members om
JOIN orgs o ON o.id = om.org_id
WHERE om.user_id = 'USER_ID_APPRENANT'::uuid;
```

**Problèmes possibles :**
- ❌ Pas de membre d'organisation → Ajouter à `org_members`
- ❌ Organisation différente de la session → Vérifier que c'est la même `org_id`

### Étape 3 : Vérifier la session

```sql
-- Vérifier les sessions actives pour ce cours et cette organisation
SELECT 
  s.*,
  c.title as course_title,
  o.name as org_name
FROM sessions s
JOIN courses c ON c.id = s.course_id
JOIN orgs o ON o.id = s.org_id
WHERE s.course_id = 'COURSE_ID'::uuid
AND s.org_id = (
  SELECT org_id FROM org_members 
  WHERE user_id = 'USER_ID_APPRENANT'::uuid 
  LIMIT 1
)
AND s.status = 'active';
```

**Problèmes possibles :**
- ❌ Pas de session → Créer une session
- ❌ `status` = `'draft'` ou `'archived'` → Mettre à `'active'`
- ❌ `org_id` différent → Vérifier la cohérence

### Étape 4 : Vérifier le lien enrollment-session

```sql
-- Vérifier si l'enrollment est bien lié à la session
SELECT 
  e.id as enrollment_id,
  e.user_id,
  e.course_id,
  e.session_id,
  s.id as session_id_check,
  s.title as session_title,
  CASE 
    WHEN e.session_id = s.id THEN '✅ Lié'
    WHEN e.session_id IS NULL THEN '⚠️ session_id NULL'
    ELSE '❌ session_id différent'
  END as status
FROM enrollments e
LEFT JOIN sessions s ON s.course_id = e.course_id 
  AND s.org_id = (SELECT org_id FROM org_members WHERE user_id = e.user_id LIMIT 1)
  AND s.status = 'active'
WHERE e.user_id = 'USER_ID_APPRENANT'::uuid
AND e.course_id = 'COURSE_ID'::uuid;
```

**Solution si `session_id` est NULL :**
```sql
-- Mettre à jour manuellement les enrollments avec leur session
-- Version automatique qui met à jour tous les enrollments sans session_id
UPDATE enrollments e
SET session_id = (
  SELECT s.id 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1
)
WHERE e.session_id IS NULL
AND EXISTS (
  SELECT 1 FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
)
RETURNING 
  e.id,
  e.user_id,
  e.course_id,
  e.session_id,
  (SELECT full_name FROM profiles WHERE id = e.user_id) as nom_apprenant;
```

## 🎯 Checklist rapide

Pour qu'un apprenant apparaisse dans `/trainer/session/:sessionId`, vérifier :

- [ ] L'apprenant existe dans `profiles`
- [ ] L'apprenant est membre d'une organisation (`org_members`)
- [ ] L'apprenant a un enrollment actif (`enrollments` avec `status = 'active'`)
- [ ] L'enrollment a un `course_id` correspondant au cours de la session
- [ ] L'enrollment a un `session_id` correspondant à la session (ou NULL si le trigger doit le remplir)
- [ ] Une session existe avec `status = 'active'` pour ce cours et cette organisation
- [ ] L'organisation de l'apprenant correspond à l'organisation de la session

## 🚀 Script de diagnostic complet

Exécutez ce script pour diagnostiquer pourquoi un apprenant n'apparaît pas :

```sql
-- Diagnostic complet pour tous les apprenants d'une session
-- Remplacez 'SESSION_ID' par l'ID de la session, ou utilisez la version automatique

-- Version automatique (utilise la première session active)
WITH session_info AS (
  SELECT id as session_id, course_id, org_id 
  FROM sessions 
  WHERE status = 'active' 
  ORDER BY created_at DESC 
  LIMIT 1
),
apprenants AS (
  SELECT DISTINCT e.user_id, si.course_id, si.session_id
  FROM enrollments e
  CROSS JOIN session_info si
  WHERE e.session_id = si.session_id
  AND e.status = 'active'
)
SELECT 
  '1. Profil' as etape,
  CASE WHEN p.id IS NOT NULL THEN '✅ Existe' ELSE '❌ N''existe pas' END as status,
  p.full_name as details
FROM apprenants a
LEFT JOIN profiles p ON p.id = a.user_id

UNION ALL

SELECT 
  '2. Membre organisation' as etape,
  CASE WHEN om.id IS NOT NULL THEN '✅ Membre' ELSE '❌ Pas membre' END as status,
  o.name as details
FROM apprenants a
LEFT JOIN org_members om ON om.user_id = a.user_id
LEFT JOIN orgs o ON o.id = om.org_id

UNION ALL

SELECT 
  '3. Enrollment' as etape,
  CASE 
    WHEN e.id IS NULL THEN '❌ Pas d''enrollment'
    WHEN e.status != 'active' THEN '⚠️ Status: ' || e.status
    ELSE '✅ Enrollment actif'
  END as status,
  c.title as details
FROM apprenant a
LEFT JOIN enrollments e ON e.user_id = a.user_id AND e.course_id = a.course_id
LEFT JOIN courses c ON c.id = e.course_id

UNION ALL

SELECT 
  '4. Session' as etape,
  CASE 
    WHEN s.id IS NULL THEN '❌ Pas de session'
    WHEN s.status != 'active' THEN '⚠️ Status: ' || s.status
    ELSE '✅ Session active'
  END as status,
  s.title as details
FROM apprenant a
LEFT JOIN org_members om ON om.user_id = a.user_id
LEFT JOIN sessions s ON s.org_id = om.org_id AND s.course_id = a.course_id

UNION ALL

SELECT 
  '5. Lien enrollment-session' as etape,
  CASE 
    WHEN e.session_id IS NULL THEN '⚠️ session_id NULL'
    WHEN e.session_id = s.id THEN '✅ Bien lié'
    ELSE '❌ session_id différent'
  END as status,
  s.title as details
FROM apprenant a
LEFT JOIN enrollments e ON e.user_id = a.user_id AND e.course_id = a.course_id
LEFT JOIN org_members om ON om.user_id = a.user_id
LEFT JOIN sessions s ON s.org_id = om.org_id AND s.course_id = a.course_id AND s.status = 'active';
```

## 💡 Résumé

**Les apprenants apparaissent dès que :**
1. ✅ Ils ont un enrollment actif (`status = 'active'`)
2. ✅ Cet enrollment est lié à une session (`session_id` non NULL)
3. ✅ La session est active (`status = 'active'`)
4. ✅ L'apprenant est membre de l'organisation de la session

**Ils n'apparaissent PAS si :**
- ❌ Pas d'enrollment pour ce cours
- ❌ Enrollment avec `status` != `'active'`
- ❌ `session_id` = NULL dans l'enrollment
- ❌ Pas de session active pour ce cours et cette organisation
- ❌ L'apprenant n'est pas membre de l'organisation de la session




---


### 📄 Guide : Comment charger les slides

*Source: `portal-formations/GUIDE-CHARGER-SLIDES.md`*


---

# Guide : Comment charger les slides

## 📋 Vue d'ensemble

Les slides sont stockées dans **Supabase Storage** dans le bucket `course-assets`. Une fois chargées, elles sont référencées dans le JSON du cours via le champ `asset_path`.

---

## 🎯 Méthode 1 : Via l'interface d'administration (Recommandé)

### Étape 1 : Accéder à l'édition d'un item

1. Allez dans **Admin** → **Cours** → Sélectionnez votre cours
2. Cliquez sur un **item de type "slide"**
3. Vous arrivez sur la page d'édition de l'item

### Étape 2 : Charger l'image/PDF

**Option A : Drag & Drop**
- Glissez-déposez votre fichier (image PNG/JPG ou PDF) directement dans la zone d'upload
- Le fichier sera automatiquement uploadé vers Supabase Storage

**Option B : Copier-Coller**
- Copiez une image depuis votre presse-papiers (Ctrl+C / Cmd+C)
- Collez-la dans la zone d'upload (Ctrl+V / Cmd+V)
- L'image sera automatiquement uploadée

**Option C : Sélectionner un fichier**
- Cliquez sur le bouton "Choisir un fichier" ou "Upload"
- Sélectionnez votre fichier depuis votre ordinateur

### Étape 3 : Vérifier le chemin

Une fois l'upload réussi, le champ `asset_path` sera automatiquement rempli avec le chemin, par exemple :
```
big-data/module1/slide-intro.png
```

Ce chemin sera automatiquement ajouté dans le JSON de l'item.

---

## 🎯 Méthode 2 : Via Supabase Storage directement

### Étape 1 : Accéder à Supabase Storage

1. Allez dans votre **Dashboard Supabase**
2. Cliquez sur **Storage** dans le menu de gauche
3. Sélectionnez le bucket **`course-assets`**

### Étape 2 : Créer la structure de dossiers (recommandé)

Organisez vos slides par cours et module :
```
course-assets/
  ├── big-data/              (nom du cours)
  │   ├── module1/           (nom du module)
  │   │   ├── slide-1.1.png
  │   │   ├── slide-1.2.png
  │   │   └── slide-1.3.pdf
  │   └── module2/
  │       ├── slide-2.1.png
  │       └── slide-2.2.png
```

### Étape 3 : Uploader les fichiers

1. Cliquez sur **"Upload file"** ou **"New file"**
2. Sélectionnez votre fichier (image ou PDF)
3. Le fichier sera uploadé dans le dossier sélectionné

### Étape 4 : Noter le chemin

Le chemin complet sera, par exemple :
```
big-data/module1/slide-1.1.png
```

### Étape 5 : Ajouter le chemin dans le JSON

Dans votre JSON de cours, ajoutez le chemin dans `asset_path` :

```json
{
  "type": "slide",
  "title": "Slide 1.1 : Introduction",
  "position": 1,
  "published": true,
  "asset_path": "big-data/module1/slide-1.1.png",
  "content": {
    "pedagogical_context": {
      "text": "Votre contexte pédagogique ici..."
    }
  }
}
```

---

## 🎯 Méthode 3 : Via l'édition JSON directe

Si vous éditez le JSON directement :

1. **Chargez d'abord le fichier** via Supabase Storage (Méthode 2)
2. **Notez le chemin** exact du fichier
3. **Ajoutez le chemin** dans le JSON :

```json
{
  "type": "slide",
  "title": "Slide 1.1 : Introduction",
  "asset_path": "big-data/module1/slide-1.1.png",
  "content": {
    "pedagogical_context": {
      "text": "Contexte pédagogique..."
    }
  }
}
```

---

## 📁 Structure recommandée des chemins

Pour faciliter la gestion, organisez vos slides ainsi :

```
{course-slug}/{module-slug}/{slide-name}.{ext}
```

Exemples :
- `big-data/module1/introduction.png`
- `big-data/module1/exemples-concrets.pdf`
- `big-data/module2/data-science-definition.png`

---

## ✅ Formats supportés

### Images
- ✅ PNG (`.png`)
- ✅ JPEG/JPG (`.jpg`, `.jpeg`)
- ✅ GIF (`.gif`)
- ✅ WebP (`.webp`)

### Documents
- ✅ PDF (`.pdf`)

**Taille maximale** : 100 MB par fichier

---

## 🔍 Vérifier qu'une slide est chargée

### Dans l'interface

1. Allez sur la page du cours : `/courses/[courseId]`
2. Dépliez le module contenant la slide
3. Si la slide est chargée, vous verrez :
   - L'image affichée (si c'est une image)
   - Le PDF avec un visualiseur (si c'est un PDF)
4. Si la slide n'est pas chargée, vous verrez :
   - Le message d'avertissement : "⚠️ Aucun slide projeté pour cette section"

### Dans le JSON

Vérifiez que le champ `asset_path` existe et contient un chemin valide :

```json
{
  "asset_path": "big-data/module1/slide-1.1.png"  // ✅ Chemin présent
}
```

vs

```json
{
  // Pas de asset_path → message d'avertissement affiché
}
```

---

## 🚨 Dépannage

### Erreur : "Bucket not found"

**Solution** : Le bucket `course-assets` n'existe pas encore.

1. Allez dans Supabase → Storage
2. Créez un nouveau bucket nommé `course-assets`
3. Cochez **"Public bucket"**
4. Limite de taille : 100 MB

Ou exécutez le script SQL : `setup-course-assets-storage.sql`

### Erreur : "File size exceeds"

**Solution** : Le fichier est trop volumineux (max 100 MB).

- Compressez l'image (utilisez un outil comme TinyPNG)
- Ou divisez le PDF en plusieurs pages

### Erreur : "Permission denied"

**Solution** : Les politiques RLS ne sont pas configurées.

Exécutez le script SQL : `setup-course-assets-storage.sql`

### La slide ne s'affiche pas

**Vérifications** :
1. ✅ Le chemin `asset_path` est correct dans le JSON
2. ✅ Le fichier existe bien dans Supabase Storage
3. ✅ Le bucket `course-assets` est public
4. ✅ Les politiques RLS sont configurées
5. ✅ Le format du fichier est supporté

**Test** : Essayez d'accéder directement à l'URL :
```
https://[votre-projet].supabase.co/storage/v1/object/public/course-assets/[chemin-du-fichier]
```

---

## 💡 Bonnes pratiques

1. **Nommez vos fichiers clairement** :
   - ✅ `slide-1.1-introduction.png`
   - ❌ `IMG_1234.png`

2. **Organisez par dossiers** :
   - Un dossier par cours
   - Un sous-dossier par module

3. **Optimisez les images** :
   - Résolution recommandée : 1920x1080 (Full HD)
   - Format : PNG pour les slides avec texte, JPG pour les photos
   - Poids : < 2 MB par image si possible

4. **Pour les PDFs** :
   - Préférez une page par slide
   - Poids : < 10 MB par PDF

---

## 📝 Exemple complet

### 1. Structure dans Supabase Storage

```
course-assets/
  └── big-data/
      └── module1/
          ├── slide-1.1-introduction.png
          ├── slide-1.2-exemples.png
          └── slide-1.3-definition.pdf
```

### 2. JSON correspondant

```json
{
  "title": "Le Big Data : Fondamentaux",
  "modules": [
    {
      "title": "Module 1 : Le Big Data commence avant l'IT",
      "position": 1,
      "items": [
        {
          "type": "slide",
          "title": "Slide 1.1 : Introduction",
          "position": 1,
          "published": true,
          "asset_path": "big-data/module1/slide-1.1-introduction.png",
          "content": {
            "pedagogical_context": {
              "text": "Dans notre quotidien professionnel..."
            }
          }
        },
        {
          "type": "slide",
          "title": "Slide 1.2 : Exemples concrets",
          "position": 2,
          "published": true,
          "asset_path": "big-data/module1/slide-1.2-exemples.png",
          "content": {
            "pedagogical_context": {
              "text": "Regardons cette slide ensemble..."
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🎓 Résumé rapide

1. **Chargez le fichier** → Via l'interface admin ou Supabase Storage
2. **Notez le chemin** → Ex: `big-data/module1/slide-1.1.png`
3. **Ajoutez dans le JSON** → `"asset_path": "big-data/module1/slide-1.1.png"`
4. **Vérifiez l'affichage** → La slide apparaît dans le cours

C'est tout ! 🎉





---


### 📄 Guide : Correction des données pour le portail formateur

*Source: `portal-formations/GUIDE-CORRECTION-DONNEES.md`*


---

# Guide : Correction des données pour le portail formateur

## 🔍 Problèmes identifiés

1. **Heure ne remonte pas** : Les soumissions n'ont pas de `submitted_at` rempli
2. **Score sur 2000** : Les scores de jeux sont sur 2000 au lieu de 100 (corrigé dans le code)
3. **Complétion ne remonte pas** : Pas de données dans `module_progress`

## ✅ Solution : Script de diagnostic et correction

Le script `diagnostic-et-correction-donnees.sql` va :

### Étape 1 : Diagnostic initial
- Vérifier l'état des soumissions (avec/sans session, avec/sans `submitted_at`)
- Compter les soumissions non notées

### Étape 2 : Corriger les soumissions
- Remplir `submitted_at` avec `created_at` ou `NOW()` si manquant
- Pour les soumissions avec status `submitted` ou `graded`

### Étape 3 : Diagnostic des progressions
- Vérifier les progressions de modules existantes
- Calculer la moyenne de complétion

### Étape 4 : Créer les progressions manquantes
- Créer une progression à 0% pour chaque apprenant × module
- Si aucune progression n'existe pour cette combinaison

### Étape 5 : Mettre à jour les progressions
- Calculer le pourcentage basé sur les items complétés
- Mettre à jour `module_progress.percent` automatiquement

### Étape 6 : Diagnostic des activités
- Vérifier les événements d'activité existants
- Compter les activités des 7 derniers jours

### Étape 7 : Créer des événements d'activité
- Créer des événements `submit` basés sur les soumissions existantes
- Utiliser `submitted_at` comme date de création

### Étape 8 : Lier les activités aux sessions
- Mettre à jour `session_id` dans `activity_events`
- Basé sur les enrollments et sessions actives

### Étape 9 : Résumé final
- Afficher un tableau récapitulatif par session
- Montrer toutes les métriques importantes

## 🚀 Utilisation

1. **Ouvrir Supabase SQL Editor**
2. **Copier-coller le contenu de `diagnostic-et-correction-donnees.sql`**
3. **Exécuter le script**

Le script est conçu pour être **idempotent** (peut être exécuté plusieurs fois sans problème).

## 📊 Résultats attendus

Après l'exécution, vous devriez voir :

- ✅ Toutes les soumissions ont un `submitted_at`
- ✅ Des progressions de modules créées pour tous les apprenants
- ✅ Des progressions mises à jour basées sur les soumissions
- ✅ Des événements d'activité créés pour chaque soumission
- ✅ Tous les événements liés aux sessions

## 🔄 Après l'exécution

1. **Rafraîchir le portail formateur** (Cmd+Shift+R ou Ctrl+Shift+R)
2. **Vérifier les KPIs** :
   - Apprenants actifs (7j) devrait être > 0
   - Taux de complétion devrait être > 0%
   - Score moyen devrait être affiché
3. **Vérifier le tableau des apprenants** :
   - Dates et heures de dernière activité affichées
   - Scores normalisés sur 100
   - Pourcentages de complétion affichés

## ⚠️ Notes importantes

- Le script utilise l'organisation ID : `6f772ff6-1d15-4f29-9d0f-be03b2cc974d`
- Les progressions sont calculées automatiquement basées sur les soumissions
- Les événements d'activité sont créés rétroactivement pour les soumissions existantes
- Les données sont liées automatiquement aux sessions

## 🐛 Si les données ne remontent toujours pas

Vérifiez que :
1. Les apprenants ont bien des soumissions dans la base
2. Les soumissions ont un `status` = `'submitted'` ou `'graded'`
3. Les items soumis appartiennent bien aux modules du cours de la session
4. Les sessions sont bien actives (`status = 'active'`)

Si nécessaire, exécutez à nouveau le script de diagnostic (Étape 9) pour voir l'état actuel.






---


### 📄 Guide : Comment renseigner la correction d'un exercice

*Source: `portal-formations/GUIDE-CORRECTION-EXERCICES.md`*


---

# Guide : Comment renseigner la correction d'un exercice

Ce document explique où et sous quel format renseigner la correction d'un exercice dans votre JSON de cours.

## 📍 Emplacement de la correction

La correction se trouve dans le champ `content.correction` d'un item de type `"exercise"` ou `"tp"`.

### Structure de base

```json
{
  "type": "exercise",
  "title": "Titre de l'exercice",
  "position": 0,
  "published": true,
  "content": {
    "question": "...",
    "correction": "..."  // ← ICI
  }
}
```

## 📝 Formats acceptés

La correction accepte **deux formats** :

### Format 1 : String simple (texte brut)

Le format le plus simple pour une correction en texte brut.

```json
{
  "type": "exercise",
  "title": "Exercice – Les bases de l'API REST",
  "position": 1,
  "published": true,
  "content": {
    "question": "Qu'est-ce qu'une API REST ?",
    "correction": "REST (Representational State Transfer) est un style architectural pour les services web basé sur HTTP. Il utilise les méthodes HTTP standard (GET, POST, PUT, DELETE) et des ressources identifiées par des URLs."
  }
}
```

**Avantages** :
- ✅ Simple à écrire
- ✅ Facile à lire dans le JSON
- ✅ Parfait pour les corrections courtes

**Limitations** :
- ❌ Pas de formatage (gras, italique, listes)
- ❌ Pas de structure complexe

---

### Format 2 : TipTap JSON (contenu riche)

Le format TipTap permet d'avoir du contenu riche avec formatage, listes, titres, etc.

```json
{
  "type": "exercise",
  "title": "Exercice – Analyser une API REST",
  "position": 2,
  "published": true,
  "content": {
    "question": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Analysez cette API et identifiez ses caractéristiques."
            }
          ]
        }
      ]
    },
    "correction": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            {
              "type": "text",
              "text": "Correction"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Cette API présente les caractéristiques suivantes :"
            }
          ]
        },
        {
          "type": "bulletList",
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "marks": [
                        {
                          "type": "bold"
                        }
                      ],
                      "text": "Style architectural : "
                    },
                    {
                      "type": "text",
                      "text": "REST"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "marks": [
                        {
                          "type": "bold"
                        }
                      ],
                      "text": "Méthodes HTTP : "
                    },
                    {
                      "type": "text",
                      "text": "GET, POST, PUT, DELETE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Cette API respecte les principes REST en utilisant les verbes HTTP appropriés pour chaque action."
            }
          ]
        }
      ]
    }
  }
}
```

**Avantages** :
- ✅ Formatage riche (gras, italique, listes, titres)
- ✅ Structure complexe possible
- ✅ Cohérent avec le format utilisé pour les slides et chapitres

**Limitations** :
- ❌ Plus verbeux
- ❌ Plus complexe à écrire manuellement

---

## 🎯 Exemples complets par type d'exercice

### Exercice simple (question/correction)

```json
{
  "type": "exercise",
  "title": "Exercice – Concepts fondamentaux",
  "position": 1,
  "published": true,
  "content": {
    "question": "Expliquez la différence entre REST et GraphQL.",
    "correction": "REST utilise plusieurs endpoints avec des méthodes HTTP standard, tandis que GraphQL utilise un seul endpoint avec des requêtes flexibles permettant de récupérer exactement les données nécessaires."
  }
}
```

### Exercice enrichi (avec objectif, critères, etc.)

```json
{
  "type": "exercise",
  "title": "Exercice – Identifier les usages IA dans son SI",
  "position": 2,
  "published": true,
  "content": {
    "objective": "Identifier où et comment les données et l'IA peuvent être exploitées dans un système d'information existant.",
    "duration_minutes": 30,
    "instruction": "À partir de ton contexte professionnel, liste les sources de données disponibles.",
    "criteria": [
      "Identification claire des sources de données",
      "Lien cohérent entre données et usages métiers"
    ],
    "deliverables": [
      "Carte simplifiée du SI",
      "Liste de 3 cas d'usage IA potentiels"
    ],
    "correction": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            {
              "type": "text",
              "text": "Correction attendue"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Voici les éléments attendus dans une bonne réponse :"
            }
          ]
        },
        {
          "type": "orderedList",
          "attrs": { "start": 1 },
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Identification des sources de données (bases de données, fichiers, APIs externes)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Analyse des usages métiers actuels et potentiels"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Proposition de cas d'usage IA réalistes et pertinents"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

### Exercice d'analyse d'API

```json
{
  "type": "exercise",
  "title": "Étude de cas – Analyse d'un business model data-driven",
  "position": 3,
  "published": true,
  "content": {
    "objective": "Analyser l'impact stratégique de la donnée sur un modèle économique.",
    "duration_minutes": 45,
    "instruction": "Analyse un cas d'entreprise utilisant massivement les données.",
    "input_api": {
      "endpoints": [
        "GET /api/users",
        "POST /api/users"
      ]
    },
    "instructions": [
      "Analysez les endpoints fournis",
      "Identifiez les méthodes HTTP utilisées"
    ],
    "criteria": [
      "Compréhension du modèle économique",
      "Lien clair entre données et création de valeur"
    ],
    "correction": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            {
              "type": "text",
              "text": "Analyse attendue"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "L'analyse doit couvrir les points suivants :"
            }
          ]
        },
        {
          "type": "bulletList",
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "marks": [
                        {
                          "type": "bold"
                        }
                      ],
                      "text": "Style architectural : "
                    },
                    {
                      "type": "text",
                      "text": "REST (utilisation des méthodes HTTP standard)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "marks": [
                        {
                          "type": "bold"
                        }
                      ],
                      "text": "Points forts : "
                    },
                    {
                      "type": "text",
                      "text": "Simplicité, stateless, cacheable"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

---

## ✅ Checklist de validation

Pour qu'une correction soit correctement renseignée :

- [ ] Le champ `correction` est dans `content.correction` (pas ailleurs)
- [ ] Le format est soit :
  - Une string simple (texte brut)
  - Un objet TipTap JSON valide
- [ ] Si format TipTap : la structure commence par `{ "type": "doc", "content": [...] }`
- [ ] La correction est optionnelle mais recommandée pour les exercices notés

---

## 🔍 Comment l'application détecte le format

L'application détecte automatiquement le format :

```typescript
// Si c'est un objet → Format TipTap
if (typeof content.correction === 'object') {
  // Affiche avec RichTextEditor (formatage riche)
  <RichTextEditor content={content.correction} />
} else {
  // Sinon → String simple
  // Affiche en texte brut
  <p>{content.correction}</p>
}
```

---

## 📚 Où renseigner la correction

### Option 1 : Dans le JSON de cours (import)

Lors de l'import d'un cours JSON, la correction doit être dans `content.correction` :

```json
{
  "modules": [
    {
      "items": [
        {
          "type": "exercise",
          "content": {
            "correction": "Votre correction ici"
          }
        }
      ]
    }
  ]
}
```

### Option 2 : Via l'interface d'administration

1. Aller dans **Admin** → **Cours** → Sélectionner un cours
2. Cliquer sur un **exercice**
3. Dans la section **Contenu**, trouver le champ **"Correction (optionnel)"**
4. Renseigner la correction (texte brut ou utiliser l'éditeur riche si disponible)

### Option 3 : Via l'éditeur JSON d'un item

1. Aller dans **Admin** → **Cours** → Sélectionner un cours
2. Cliquer sur un **exercice**
3. Cliquer sur **"Éditer le JSON"**
4. Modifier directement le champ `correction` dans le JSON

---

## 🚨 Erreurs courantes à éviter

1. ❌ Mettre `correction` au niveau de l'item (doit être dans `content`)
   ```json
   // ❌ MAUVAIS
   {
     "type": "exercise",
     "correction": "..."
   }
   
   // ✅ BON
   {
     "type": "exercise",
     "content": {
       "correction": "..."
     }
   }
   ```

2. ❌ Format TipTap invalide (structure incorrecte)
   ```json
   // ❌ MAUVAIS
   {
     "correction": {
       "content": [...]  // Manque "type": "doc"
     }
   }
   
   // ✅ BON
   {
     "correction": {
       "type": "doc",
       "content": [...]
     }
   }
   ```

3. ❌ Mélanger les formats
   ```json
   // ❌ MAUVAIS (mélange string et objet)
   {
     "correction": "Texte" + { "type": "doc" }
   }
   ```

---

## 💡 Recommandations

- **Pour des corrections courtes** : Utilisez une string simple
- **Pour des corrections longues avec formatage** : Utilisez le format TipTap
- **Pour des corrections avec listes, titres, gras** : Utilisez le format TipTap
- **Toujours tester** : Vérifiez que la correction s'affiche correctement après import

---

## 📖 Ressources supplémentaires

- `FORMATS-JSON.md` : Documentation complète des formats JSON
- `STRUCTURE-COMPLETE-EXERCICES.md` : Structure complète des exercices
- `course-ia-si-tiptap.json` : Exemples de cours avec corrections






---


### 📄 Guide : Création du bucket course-assets

*Source: `portal-formations/GUIDE-CREATION-BUCKET-COURSE-ASSETS.md`*


---

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






---


### 📄 Guide : Création du bucket item-documents

*Source: `portal-formations/GUIDE-CREATION-BUCKET-ITEM-DOCUMENTS.md`*


---

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






---


### 📄 Guide : Format pour intégrer un jeu dans un chapitre

*Source: `portal-formations/GUIDE-FORMAT-JEU-CHAPITRE.md`*


---

# Guide : Format pour intégrer un jeu dans un chapitre

## Format exact à mettre dans la colonne `game_content` de la table `chapters`

### ⚠️ IMPORTANT : Structure à respecter

Dans la colonne `game_content` de la table `chapters`, vous devez mettre **UNIQUEMENT** la partie jeu, **SANS** les champs `type`, `title`, `position` qui sont déjà dans les autres colonnes du chapitre.

### ✅ Format CORRECT pour `game_content` :

```json
{
  "gameType": "format-files",
  "description": "Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf",
  "instructions": "Répondez aux questions pour progresser dans les 3 niveaux de difficulté",
  "levels": [
    {
      "level": 1,
      "name": "Découverte",
      "questions": [
        {
          "id": "q1-1",
          "type": "identify-format",
          "prompt": "Quel est ce format de données ?",
          "snippet": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
          "options": ["JSON", "XML", "Protobuf"],
          "answer": "JSON",
          "explanation": "C'est du JSON : accolades {} et clés/valeurs entre guillemets doubles.",
          "difficulty": 1
        }
      ]
    }
  ]
}
```

### ❌ Format INCORRECT (ne pas utiliser) :

```json
{
  "type": "game",
  "title": "Jeu : Formats de fichiers",
  "position": 0,
  "game_content": {
    "gameType": "format-files",
    ...
  }
}
```

## Comment corriger vos données

### Option 1 : Via l'éditeur JSON du chapitre (recommandé)

1. Allez dans `/admin/chapters/{chapterId}/json`
2. Dans le JSON, vous devez avoir :
   ```json
   {
     "title": "Jeu : Formats de fichiers",
     "position": 0,
     "type": "game",
     "game_content": {
       "gameType": "format-files",
       "levels": [...]
     }
   }
   ```
3. Cliquez sur "Sauvegarder"

### Option 2 : Via SQL (pour corriger directement)

Si vous avez déjà mis le mauvais format dans `game_content`, exécutez ce SQL dans Supabase :

```sql
-- Trouver votre chapitre
SELECT id, title, game_content 
FROM chapters 
WHERE type = 'game' 
  AND title ILIKE '%format%';

-- Corriger le game_content (remplacez <CHAPTER_ID> par l'ID de votre chapitre)
UPDATE chapters
SET game_content = game_content->'game_content'  -- Extrait le game_content imbriqué
WHERE id = '<CHAPTER_ID>'
  AND game_content->>'game_content' IS NOT NULL;
```

## Exemples complets par type de jeu

### 1. Matching (cartes à associer)

```json
{
  "gameType": "matching",
  "description": "Associez chaque terme à sa définition",
  "instructions": "Cliquez sur une carte pour la retourner",
  "pairs": [
    {
      "term": "REST",
      "definition": "Architecture stateless avec ressources HTTP"
    },
    {
      "term": "GraphQL",
      "definition": "Requêtes flexibles avec un seul endpoint"
    }
  ]
}
```

### 2. Column Matching (colonnes à associer)

```json
{
  "gameType": "column-matching",
  "leftColumn": ["GET", "POST", "PUT", "DELETE"],
  "rightColumn": [
    "Récupérer une ressource",
    "Créer une ressource",
    "Mettre à jour une ressource",
    "Supprimer une ressource"
  ],
  "correctMatches": [
    { "left": 0, "right": 0 },
    { "left": 1, "right": 1 },
    { "left": 2, "right": 2 },
    { "left": 3, "right": 3 }
  ]
}
```

### 3. API Types

```json
{
  "gameType": "api-types",
  "apiTypes": [
    {
      "id": "rest",
      "name": "REST API",
      "color": "bg-blue-500",
      "description": "Architecture stateless avec ressources HTTP"
    }
  ],
  "scenarios": [
    {
      "id": 1,
      "text": "Application de chat en temps réel",
      "correctType": "websocket",
      "explanation": "Les chats nécessitent une communication bidirectionnelle."
    }
  ]
}
```

### 4. Format Files (votre cas)

```json
{
  "gameType": "format-files",
  "description": "Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf",
  "instructions": "Répondez aux questions pour progresser dans les 3 niveaux",
  "levels": [
    {
      "level": 1,
      "name": "Découverte",
      "questions": [
        {
          "id": "q1-1",
          "type": "identify-format",
          "prompt": "Quel est ce format ?",
          "snippet": "{\"name\": \"John\"}",
          "options": ["JSON", "XML", "Protobuf"],
          "answer": "JSON",
          "explanation": "C'est du JSON.",
          "difficulty": 1
        }
      ]
    }
  ]
}
```

## Vérification

Après avoir sauvegardé, vérifiez dans Supabase :

1. Table `chapters` → votre chapitre
2. Colonne `type` = `'game'`
3. Colonne `game_content` doit contenir **directement** :
   - `gameType`
   - `levels` (pour format-files)
   - `pairs` (pour matching)
   - etc.

**SANS** les champs `type`, `title`, `position` dans `game_content`.






---


### 📄 Guide : Fusionner plusieurs formations

*Source: `portal-formations/GUIDE-FUSION-FORMATIONS.md`*


---

# Guide : Fusionner plusieurs formations

Ce guide explique comment fusionner plusieurs formations entre elles avec un ordre défini.

## 📋 Deux approches possibles

### Solution 1 : Système de Programmes (Recommandée) ⭐

**Avantages :**
- ✅ Les formations restent indépendantes et réutilisables
- ✅ Une formation peut appartenir à plusieurs programmes
- ✅ Pas de duplication de données
- ✅ Facile de réorganiser l'ordre
- ✅ Suivi des inscriptions par programme

**Inconvénients :**
- ⚠️ Nécessite une nouvelle table dans la base de données
- ⚠️ L'interface frontend doit être adaptée pour afficher les programmes

### Solution 2 : Concaténation directe

**Avantages :**
- ✅ Simple et rapide
- ✅ Utilise la structure existante
- ✅ Pas de modification du frontend nécessaire

**Inconvénients :**
- ⚠️ Duplication des données (modules copiés)
- ⚠️ Les formations originales et la fusionnée sont indépendantes
- ⚠️ Modifications dans une formation originale ne se répercutent pas dans la fusionnée

## 🚀 Solution 1 : Créer un Programme

### Étape 1 : Ajouter le schéma

Exécutez le fichier `add-programs-schema.sql` dans l'interface SQL de Supabase :

```sql
-- Ce script crée :
-- - La table `programs` (programmes)
-- - La table `program_courses` (liaison programmes ↔ formations avec ordre)
-- - La table `program_enrollments` (inscriptions aux programmes)
-- - Les policies RLS
-- - Une fonction `get_program_modules()` pour récupérer tous les modules dans l'ordre
```

### Étape 2 : Créer un programme

#### Option A : Utiliser le script d'exemple

1. Ouvrez `create-program-example.sql`
2. Remplacez `'VOTRE_USER_ID'` par votre UUID utilisateur
3. Exécutez le script

#### Option B : Créer manuellement

```sql
-- 1. Créer le programme
INSERT INTO programs (title, description, status, access_type, created_by)
VALUES (
  'Mon Programme Complet',
  'Description du programme',
  'published',
  'free',
  'votre-uuid-utilisateur'::UUID
)
RETURNING id;

-- 2. Ajouter les formations dans l'ordre souhaité
-- Remplacez les UUIDs par les IDs réels de vos formations
INSERT INTO program_courses (program_id, course_id, position) VALUES
  ('uuid-programme'::UUID, 'uuid-formation-1'::UUID, 0),  -- Position 0 = première
  ('uuid-programme'::UUID, 'uuid-formation-2'::UUID, 1),  -- Position 1 = deuxième
  ('uuid-programme'::UUID, 'uuid-formation-3'::UUID, 2);   -- Position 2 = troisième
```

### Étape 3 : Récupérer les modules dans l'ordre

```sql
-- Utiliser la fonction helper
SELECT * FROM get_program_modules('uuid-programme'::UUID);

-- Ou manuellement
SELECT 
  m.id,
  m.title,
  m.position as module_position,
  c.title as course_title,
  pc.position as course_position_in_program,
  ROW_NUMBER() OVER (ORDER BY pc.position, m.position) as global_position
FROM programs p
JOIN program_courses pc ON p.id = pc.program_id
JOIN courses c ON pc.course_id = c.id
JOIN modules m ON m.course_id = c.id
WHERE p.id = 'uuid-programme'::UUID
ORDER BY pc.position, m.position;
```

### Étape 4 : Gérer les inscriptions

```sql
-- Inscrire un utilisateur au programme
INSERT INTO program_enrollments (user_id, program_id, status)
VALUES ('uuid-utilisateur'::UUID, 'uuid-programme'::UUID, 'active');

-- Vérifier les inscriptions
SELECT 
  p.title as program,
  pr.full_name as user,
  pe.status,
  pe.enrolled_at
FROM program_enrollments pe
JOIN programs p ON pe.program_id = p.id
JOIN profiles pr ON pe.user_id = pr.id;
```

## 🔧 Solution 2 : Concaténation directe

### Étape 1 : Exécuter le script

1. Ouvrez `merge-courses-direct.sql`
2. Remplacez `'VOTRE_USER_ID'` par votre UUID utilisateur
3. Modifiez les IDs des formations à fusionner (ou laissez le script utiliser les premières formations trouvées)
4. Exécutez le script

### Étape 2 : Vérifier le résultat

```sql
-- Vérifier la formation fusionnée
SELECT 
  c.title,
  COUNT(DISTINCT m.id) as modules_count,
  COUNT(DISTINCT i.id) as items_count
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN items i ON i.module_id = m.id
WHERE c.title LIKE '%Fusionnée%'
GROUP BY c.id, c.title;
```

## 📊 Comparaison des deux solutions

| Critère | Solution 1 (Programmes) | Solution 2 (Concaténation) |
|---------|------------------------|---------------------------|
| **Flexibilité** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Réutilisabilité** | ⭐⭐⭐⭐⭐ | ⭐ |
| **Simplicité** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Maintenance** | ⭐⭐⭐⭐⭐ | ⭐⭐ |

## 🎯 Recommandation

**Utilisez la Solution 1 (Programmes)** si :
- Vous voulez réutiliser les formations dans plusieurs parcours
- Vous voulez garder les formations originales intactes
- Vous avez besoin de flexibilité pour réorganiser l'ordre

**Utilisez la Solution 2 (Concaténation)** si :
- Vous voulez une solution rapide et simple
- Vous ne prévoyez pas de réutiliser les formations
- Vous êtes prêt à gérer la duplication des données

## 🔄 Réorganiser l'ordre dans un programme

```sql
-- Changer l'ordre des formations dans un programme
UPDATE program_courses 
SET position = 2 
WHERE program_id = 'uuid-programme'::UUID 
  AND course_id = 'uuid-formation-1'::UUID;

UPDATE program_courses 
SET position = 0 
WHERE program_id = 'uuid-programme'::UUID 
  AND course_id = 'uuid-formation-1'::UUID;

UPDATE program_courses 
SET position = 1 
WHERE program_id = 'uuid-programme'::UUID 
  AND course_id = 'uuid-formation-2'::UUID;
```

## 🐛 Dépannage

### Erreur : "invalid input syntax for type uuid"
- Vérifiez que tous les UUIDs sont au format correct : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Utilisez `::UUID` pour forcer le cast si nécessaire

### Erreur : "violates foreign key constraint"
- Vérifiez que les formations existent avant de les ajouter au programme
- Vérifiez que l'utilisateur créateur existe dans la table `profiles`

### Les modules ne s'affichent pas dans l'ordre
- Vérifiez que les `position` dans `program_courses` sont correctes
- Utilisez `ORDER BY pc.position, m.position` dans vos requêtes

## 📝 Prochaines étapes

1. **Adapter le frontend** pour afficher les programmes
2. **Créer une interface admin** pour gérer les programmes
3. **Ajouter des métriques** de progression par programme
4. **Implémenter la navigation** entre formations dans un programme






---


### 📄 Guide : Générateur de Cours IA

*Source: `portal-formations/GUIDE-GENERATEUR-COURS-IA.md`*


---

# Guide : Générateur de Cours IA

## 📋 Description

Le générateur de cours IA permet de créer automatiquement un cours complet au format JSON compatible avec votre LMS à partir d'une description détaillée. L'IA génère la structure complète du cours avec modules, items, chapitres, quiz, exercices et jeux.

## 🚀 Accès

1. Allez dans **Administration** → **Formations**
2. Cliquez sur le bouton **"Générer avec IA"** (icône Sparkles)
3. Ou accédez directement à `/admin/courses/ai-generator`

## 📝 Utilisation

### Mode 1 : Import depuis un texte structuré (Recommandé)

Si vous avez un programme de formation, un référentiel ou un document structuré :

1. **Sélectionnez l'onglet "Importer depuis un texte"**
2. **Collez le contenu** dans la zone de texte
3. **Cliquez sur "Extraire les informations"**
4. Le système extrait automatiquement :
   - ✅ Titre du cours
   - ✅ Référence (si présente)
   - ✅ Objectif général
   - ✅ Compétences visées
   - ✅ Niveau de difficulté
   - ✅ Durée
   - ✅ Profils des stagiaires
   - ✅ Prérequis
   - ✅ Objectifs pédagogiques
   - ✅ Modules avec leur contenu et durées
   - ✅ Travaux pratiques
5. **Vérifiez et modifiez** les informations extraites si nécessaire
6. **Générez le cours** avec l'IA

**Format supporté :**
Le parser reconnaît les formats suivants :
- Titres avec puces (•, -, *)
- Numérotation (1., 2., a), b), etc.)
- Sections structurées (Objectifs, Compétences, Modules, etc.)
- Durées entre parenthèses (ex: 2 heures, 0,5 heure)

**Exemple de texte importable :**
```
Exchange Server – Administration
Référence 2-004
Objectif général : À l'issue de la formation, les participants seront capables de...
Compétences visées :
• Configurer et administrer un serveur Exchange
• Déployer les différents types de clients
Niveau : Maîtrise
Durée : 30.00 heures (5.00 jours)
...
```

### Mode 2 : Saisie manuelle

### 1. Remplir le formulaire

#### Champs obligatoires
- **Titre du cours** : Le titre principal du cours
- **Description détaillée** : Une description complète du contenu, des concepts à couvrir, l'approche pédagogique

#### Champs optionnels (mais recommandés)
- **Thème / Domaine** : Le domaine du cours (ex: Intelligence Artificielle, Développement Web)
- **Public cible** : Le public visé (ex: Débutants, Développeurs confirmés)
- **Durée estimée** : La durée du cours (ex: 20 heures, 5 jours)
- **Niveau de difficulté** : Débutant, Intermédiaire ou Avancé

#### Objectifs pédagogiques
- Ajoutez autant d'objectifs que nécessaire
- Chaque objectif sera pris en compte par l'IA pour structurer le cours

#### Modules suggérés
- Vous pouvez suggérer les modules à créer
- Si laissé vide, l'IA créera une structure adaptée au sujet

#### Options de contenu
- ✅ **Quiz interactifs** : Génère des quiz avec questions à choix multiples
- ✅ **Exercices pratiques** : Génère des exercices avec questions et corrections
- ✅ **Jeux pédagogiques** : Génère des jeux interactifs (matching, etc.)

### 2. Générer le cours

1. Cliquez sur **"Générer le cours"**
2. La progression s'affiche en temps réel :
   - Préparation du prompt
   - Génération du cours via IA
   - Traitement de la réponse
   - Validation du JSON
3. Le cours généré apparaît dans le panneau de droite

### 3. Examiner le résultat

Le panneau de droite affiche :
- **Vue structure** : Vue d'ensemble avec modules et items
- **Vue JSON** : Le JSON complet (bouton Code/Eye)

### 4. Actions disponibles

#### Télécharger le JSON
- Cliquez sur l'icône **Download**
- Le fichier JSON est téléchargé avec le nom `{titre-du-cours}-course.json`

#### Importer dans l'éditeur
- Cliquez sur **"Importer dans l'éditeur"**
- Le cours est chargé dans l'éditeur JSON
- Vous pouvez modifier, sauvegarder et publier

## ⚙️ Configuration requise

### Clé API OpenRouter

Le générateur utilise OpenRouter pour accéder à différents modèles d'IA (Gemini, GPT, Claude).

1. Créez un compte sur [https://openrouter.ai/](https://openrouter.ai/)
2. Générez une clé API dans la section "Keys"
3. Ajoutez-la dans votre fichier `.env` :
   ```env
   VITE_OPENROUTER_API_KEY=votre_cle_ici
   VITE_OPENROUTER_MODEL=google/gemini-3-flash-preview
   ```
4. Redémarrez votre serveur de développement

### Modèles supportés

Le générateur essaie automatiquement plusieurs modèles dans cet ordre :
1. Le modèle configuré dans `.env` (`VITE_OPENROUTER_MODEL`)
2. `google/gemini-3-flash-preview` (recommandé)
3. `google/gemini-3-pro-preview`
4. `google/gemini-1.5-pro`
5. `openai/gpt-4o-mini`
6. `anthropic/claude-3-haiku`

## 📊 Structure générée

Le cours généré respecte le format JSON strict du LMS :

```json
{
  "title": "Titre du cours",
  "description": "Description complète",
  "status": "draft",
  "access_type": "free",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Module 1",
      "position": 0,
      "items": [
        {
          "type": "resource",
          "title": "Titre de l'item",
          "position": 0,
          "published": true,
          "content": { /* Format TipTap JSON */ },
          "chapters": [ /* Chapitres optionnels */ ]
        }
      ]
    }
  ]
}
```

## 🎯 Types d'items générés

### Resource
Contenu de cours avec texte riche au format TipTap JSON.

### Slide
Support de présentation avec contenu structuré.

### Exercise
Exercice pratique avec question et correction.

### TP
Travaux pratiques avec instructions et checklist.

### Game/Quiz
Quiz interactif avec :
- Questions à choix multiples
- Niveaux de difficulté
- Explications détaillées
- Système de scoring

## ✅ Validation automatique

Le générateur valide automatiquement :
- ✅ Présence des champs requis (title, description, status, access_type)
- ✅ Structure des modules (title, position, items)
- ✅ Structure des items (type, title, position)
- ✅ Format TipTap JSON valide
- ✅ Positions cohérentes (0-indexed)

## 🔧 Personnalisation après génération

Une fois le cours généré, vous pouvez :
1. **Modifier le JSON** dans l'éditeur
2. **Ajouter des modules** manuellement
3. **Modifier le contenu** des items
4. **Ajouter des chapitres** aux items
5. **Ajuster les thèmes** (couleurs, polices)
6. **Ajouter des assets** (PDF, images, etc.)

## 🚨 Erreurs courantes

### "VITE_OPENROUTER_API_KEY n'est pas configurée"
- Vérifiez que la clé est bien dans le fichier `.env`
- Redémarrez le serveur après modification

### "Tous les modèles ont échoué"
- Vérifiez votre connexion internet
- Vérifiez que votre clé API est valide
- Vérifiez votre crédit OpenRouter

### "Le JSON généré est invalide"
- L'IA peut parfois générer du JSON mal formaté
- Essayez de régénérer avec une description plus détaillée
- Vérifiez manuellement le JSON dans l'éditeur

## 💡 Conseils pour de meilleurs résultats

1. **Description détaillée** : Plus la description est précise, meilleur sera le cours généré
2. **Objectifs clairs** : Définissez des objectifs pédagogiques précis
3. **Modules suggérés** : Suggérez une structure de modules si vous avez une idée précise
4. **Niveau adapté** : Indiquez le bon niveau de difficulté
5. **Contenu varié** : Cochez les options de contenu pour avoir une variété d'items

## 📚 Exemples de descriptions efficaces

### Exemple 1 : Cours technique
```
Titre : Introduction à React
Description : Cours complet sur React pour débutants. Couvre les hooks, les composants, le state management, et la création d'applications modernes. Approche pratique avec des exemples concrets.
Niveau : Débutant
Durée : 20 heures
```

### Exemple 2 : Cours métier
```
Titre : Gestion de projet Agile
Description : Formation sur les méthodologies Agile (Scrum, Kanban). Inclut les rituels, les rôles, la planification et la gestion des sprints. Cas pratiques et simulations.
Niveau : Intermédiaire
Durée : 15 heures
```

## 🔄 Workflow recommandé

1. **Générer** le cours avec l'IA
2. **Examiner** la structure générée
3. **Importer** dans l'éditeur
4. **Personnaliser** le contenu si nécessaire
5. **Sauvegarder** et **publier**

## 🆘 Support

En cas de problème :
1. Vérifiez les logs de la console (F12)
2. Vérifiez la configuration OpenRouter
3. Consultez la documentation des formats JSON : `FORMATS-JSON.md`
4. Contactez l'administrateur système

---

**Note** : Le générateur IA est un outil d'aide à la création. Il est recommandé de toujours réviser et personnaliser le contenu généré avant publication.




---


### 📄 Guide : Génération de slides avancées avec Graphime/APIs

*Source: `portal-formations/GUIDE-GENERATION-SLIDES-AVANCEES.md`*


---

# Guide : Génération de slides avancées avec Graphime/APIs

## Vue d'ensemble

Le système de génération de slides propose deux modes :

1. **Mode standard** : Génération avec Canvas HTML5 côté client (rapide, gratuit)
2. **Mode avancé** : Génération avec HTML/CSS via API externe (designs plus professionnels)

## Option 1 : Utiliser htmlcsstoimage.com (Recommandé)

### Configuration

1. Créez un compte sur [htmlcsstoimage.com](https://htmlcsstoimage.com)
2. Obtenez votre API Key depuis le dashboard
3. Ajoutez-la dans votre fichier `.env` :

```env
VITE_HTML_CSS_TO_IMAGE_API_KEY=votre_cle_api_ici
```

### Avantages

- ✅ Designs HTML/CSS complets (gradients, ombres, animations CSS)
- ✅ Support de Google Fonts
- ✅ Qualité d'image élevée (1920x1080)
- ✅ Pas besoin de serveur

### Utilisation

1. Cochez la case "Design avancé" dans l'interface
2. Cliquez sur "Générer slide avancée"
3. La slide sera générée avec un design HTML/CSS professionnel

## Option 2 : Utiliser une Edge Function Supabase

### Déploiement de l'Edge Function

1. **Installer Supabase CLI** :
```bash
npm install -g supabase
```

2. **Initialiser Supabase** (si pas déjà fait) :
```bash
supabase init
```

3. **Déployer la fonction** :
```bash
supabase functions deploy generate-slide-with-html
```

4. **Configurer les variables d'environnement** :
```bash
supabase secrets set HTML_CSS_TO_IMAGE_API_KEY=votre_cle_api
```

### Avantages

- ✅ Traitement côté serveur (pas de limite de taille)
- ✅ Utilisation de Puppeteer possible
- ✅ Plus de contrôle sur le processus

## Option 3 : Utiliser Puppeteer (Côté serveur)

Pour des designs encore plus avancés, vous pouvez utiliser Puppeteer dans une Edge Function :

1. Créer une Edge Function avec Puppeteer
2. Générer le HTML de la slide
3. Utiliser Puppeteer pour prendre un screenshot
4. Uploader l'image vers Supabase Storage

### Exemple de code Edge Function avec Puppeteer

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts'

serve(async (req) => {
  const { html } = await req.json()
  
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const screenshot = await page.screenshot({ type: 'jpeg', quality: 90 })
  await browser.close()
  
  // Upload vers Supabase Storage...
})
```

## Comparaison des options

| Option | Qualité | Coût | Complexité | Recommandation |
|--------|---------|------|------------|----------------|
| Canvas HTML5 | ⭐⭐⭐ | Gratuit | Faible | Pour débuter |
| htmlcsstoimage.com | ⭐⭐⭐⭐ | Payant | Faible | **Recommandé** |
| Edge Function + API | ⭐⭐⭐⭐ | Payant | Moyenne | Pour production |
| Puppeteer | ⭐⭐⭐⭐⭐ | Gratuit | Élevée | Pour contrôle total |

## Améliorations possibles

### Design avancé avec Graphime

Si vous souhaitez utiliser Graphime (bibliothèque de génération graphique), vous pouvez :

1. **Créer une API Node.js** qui utilise Graphime
2. **Appeler cette API** depuis votre frontend
3. **Stocker les images** dans Supabase Storage

### Exemple d'intégration Graphime

```typescript
// Dans une API Node.js séparée
import { Graphime } from 'graphime'

const graphime = new Graphime({
  apiKey: process.env.GRAPHIME_API_KEY
})

async function generateSlide(slideData) {
  const image = await graphime.create({
    template: 'slide-template',
    data: slideData
  })
  return image
}
```

## Configuration recommandée

Pour la meilleure qualité avec le moins de complexité :

1. ✅ Utilisez **htmlcsstoimage.com** pour les designs avancés
2. ✅ Gardez Canvas HTML5 comme fallback
3. ✅ Configurez `VITE_HTML_CSS_TO_IMAGE_API_KEY` dans `.env`

## Test

1. Cochez "Design avancé"
2. Cliquez sur "Générer slide avancée"
3. Vérifiez que l'image est bien générée et uploadée
4. Si erreur, vérifiez la console pour les détails






---


### 📄 Guide : Jeu "Types de fichiers JSON"

*Source: `portal-formations/GUIDE-JEU-JSON-FILE-TYPES.md`*


---

# Guide : Jeu "Types de fichiers JSON"

## Description

Ce jeu permet d'apprendre à reconnaître les différents types de fichiers JSON couramment utilisés dans les projets web modernes (package.json, tsconfig.json, .eslintrc.json, etc.).

## Fonctionnement

Le jeu fonctionne sur le principe du drag & drop :
1. Des exemples de contenu JSON sont affichés
2. L'utilisateur doit glisser le type de fichier approprié sur chaque exemple
3. Le système vérifie les réponses et affiche un score basé sur la précision et le temps

## Format JSON pour game_content

```json
{
  "gameType": "json-file-types",
  "description": "Apprenez à reconnaître les différents types de fichiers JSON",
  "instructions": "Glissez le type de fichier approprié pour chaque exemple",
  "fileTypes": [
    {
      "id": "package.json",
      "name": "package.json",
      "description": "Gestion des dépendances et scripts npm",
      "color": "bg-red-500"
    },
    {
      "id": "tsconfig.json",
      "name": "tsconfig.json",
      "description": "Configuration TypeScript",
      "color": "bg-blue-500"
    }
  ],
  "examples": [
    {
      "id": 1,
      "content": "{\n  \"name\": \"mon-projet\",\n  \"version\": \"1.0.0\"\n}",
      "correctType": "package.json",
      "explanation": "Ce fichier contient les métadonnées du projet.",
      "context": "Fichier à la racine d'un projet Node.js"
    }
  ]
}
```

## Structure des données

### fileTypes (array)

Tableau des types de fichiers disponibles dans le jeu.

**Propriétés :**
- `id` (string, requis) : Identifiant unique du type de fichier
- `name` (string, requis) : Nom affiché du fichier
- `description` (string, requis) : Description du fichier
- `color` (string, requis) : Classe Tailwind CSS pour la couleur (ex: "bg-red-500")

### examples (array)

Tableau des exemples de contenu JSON à identifier.

**Propriétés :**
- `id` (number, requis) : Identifiant unique de l'exemple
- `content` (string, requis) : Contenu JSON à identifier (peut contenir `\n` pour les sauts de ligne)
- `correctType` (string, requis) : ID du type de fichier correct (doit correspondre à un `id` dans `fileTypes`)
- `explanation` (string, requis) : Explication affichée après la vérification
- `context` (string, optionnel) : Contexte supplémentaire affiché au-dessus du contenu

## Types de fichiers JSON courants

### package.json
Gestion des dépendances, scripts et métadonnées d'un projet Node.js.

**Indices :**
- Contient `name`, `version`, `scripts`, `dependencies`
- Fichier à la racine du projet

### tsconfig.json
Configuration du compilateur TypeScript.

**Indices :**
- Contient `compilerOptions`, `include`, `exclude`
- Options comme `target`, `module`, `strict`

### .eslintrc.json
Configuration du linter ESLint.

**Indices :**
- Contient `extends`, `rules`, `env`
- Configuration des règles de linting

### package-lock.json
Verrouillage des versions exactes des dépendances npm.

**Indices :**
- Contient `lockfileVersion`, `packages`
- Généré automatiquement par npm

### tsconfig.node.json
Configuration TypeScript spécifique pour les fichiers Node.js.

**Indices :**
- Contient `compilerOptions` avec `composite: true`
- Utilisé pour les fichiers de configuration (vite.config.ts, etc.)

### vite.config.json
Configuration du bundler Vite.

**Indices :**
- Contient `build`, `server`, `plugins`
- Options de build et serveur de développement

### tailwind.config.json
Configuration Tailwind CSS.

**Indices :**
- Contient `plugins`, `theme`, `content`
- Configuration des couleurs, plugins et thème

### netlify.toml (ou netlify.json)
Configuration de déploiement Netlify.

**Indices :**
- Contient `build`, `redirects`, `headers`
- Configuration de déploiement et redirections

## Exemple complet

Voir le fichier `chapitre-jeu-json-file-types.json` pour un exemple complet avec 8 types de fichiers et 8 exemples.

## Utilisation dans un chapitre

1. Créez un chapitre avec `type: "game"`
2. Dans `game_content`, utilisez le format ci-dessus
3. Le jeu sera automatiquement rendu par `GameRenderer`

## Scoring

Le score est calculé sur 2000 points maximum :
- **Points de précision (max 1000 pts)** : Basé sur le nombre de bonnes réponses
- **Points de temps (max 1000 pts)** : -5 points par seconde écoulée

## Personnalisation

Vous pouvez :
- Ajouter de nouveaux types de fichiers dans `fileTypes`
- Ajouter de nouveaux exemples dans `examples`
- Personnaliser les couleurs avec les classes Tailwind CSS
- Ajouter du contexte supplémentaire avec le champ `context`

## Conseils pour créer des exemples

1. **Utilisez des exemples réalistes** : Inspirez-vous de vrais fichiers de projets
2. **Variez la difficulté** : Mélangez des exemples faciles et difficiles
3. **Ajoutez du contexte** : Le champ `context` aide à identifier le fichier
4. **Testez la validité JSON** : Assurez-vous que le `content` est du JSON valide (utilisez `\n` pour les sauts de ligne)






---


### 📄 Guide : Lots de TP et Associations aux Cours

*Source: `portal-formations/GUIDE-LOTS-TP-ASSOCIATIONS.md`*


---

# Guide : Lots de TP et Associations aux Cours

Ce guide explique comment utiliser les nouvelles fonctionnalités pour associer les TP aux cours et créer des lots de TP liés entre eux.

## 📋 Vue d'ensemble

Le système permet maintenant :
1. **Association directe des TP aux cours** : Associer un TP à un cours même s'il n'est pas dans un module spécifique
2. **Lots de TP** : Regrouper plusieurs TP liés entre eux dans un lot, avec possibilité de définir des prérequis et un ordre séquentiel

## 🗄️ Structure de la base de données

### Tables créées

#### 1. `course_tps` - Association directe TP ↔ Cours
Permet d'associer un TP directement à un cours.

**Colonnes principales :**
- `course_id` : ID du cours
- `item_id` : ID de l'item TP
- `position` : Ordre d'affichage dans le cours
- `is_required` : TP obligatoire pour compléter le cours
- `is_visible` : TP visible dans la liste des TP du cours
- `metadata` : Métadonnées supplémentaires (JSONB)

#### 2. `tp_batches` - Lots de TP
Regroupe plusieurs TP liés entre eux.

**Colonnes principales :**
- `title` : Titre du lot
- `description` : Description du lot
- `course_id` : Cours auquel appartient le lot (optionnel)
- `position` : Ordre d'affichage dans le cours
- `sequential_order` : Les TP doivent être complétés dans l'ordre
- `is_published` : Lot actif/published
- `metadata` : Métadonnées supplémentaires (JSONB)

#### 3. `tp_batch_items` - Liaison TP ↔ Lot
Liaison entre un lot et les TP qu'il contient.

**Colonnes principales :**
- `tp_batch_id` : ID du lot
- `item_id` : ID de l'item TP
- `position` : Ordre du TP dans le lot
- `is_required` : TP obligatoire dans le lot
- `prerequisite_item_id` : ID du TP précédent requis (pour ordre séquentiel)
- `metadata` : Métadonnées spécifiques (JSONB)

### Vues utiles

#### `course_all_tps`
Vue unifiée de tous les TP d'un cours (via modules, association directe, ou lots).

#### `tp_batch_details`
Détails complets des lots de TP avec statistiques (nombre de TP, TP requis, etc.).

#### `tp_batch_items_details`
Détails des TP dans les lots avec leurs prérequis.

## 🚀 Installation

Exécutez le script SQL dans votre base de données Supabase :

```sql
-- Exécuter le fichier
\i add-tp-batches-and-course-associations.sql
```

Ou copiez-collez le contenu dans l'éditeur SQL de Supabase.

## 💡 Cas d'usage

### Cas 1 : Associer un TP directement à un cours

**Scénario :** Vous avez un TP qui fait partie intégrante d'un cours mais qui n'est pas dans un module spécifique.

```sql
-- Associer un TP à un cours
INSERT INTO course_tps (course_id, item_id, position, is_required, is_visible)
VALUES (
  'course-uuid-here',
  'tp-item-uuid-here',
  1,  -- Position dans le cours
  TRUE,  -- TP obligatoire
  TRUE   -- TP visible
);
```

**Exemple concret :**
```sql
-- Trouver un cours et un TP
SELECT id, title FROM courses WHERE title LIKE '%Big Data%';
SELECT id, title FROM items WHERE type = 'tp' AND title LIKE '%Titanic%';

-- Associer le TP au cours
INSERT INTO course_tps (course_id, item_id, position, is_required, is_visible)
VALUES (
  (SELECT id FROM courses WHERE title = 'Formation Big Data'),
  (SELECT id FROM items WHERE type = 'tp' AND title LIKE '%Titanic Big Data%'),
  1,
  TRUE,
  TRUE
);
```

### Cas 2 : Créer un lot de TP liés

**Scénario :** Vous avez plusieurs TP qui doivent être complétés ensemble, dans un ordre spécifique.

```sql
-- 1. Créer le lot
INSERT INTO tp_batches (title, description, course_id, position, sequential_order, is_published, created_by)
VALUES (
  'Lot TP Data Science - Série complète',
  'Série de TP pour maîtriser la data science de A à Z',
  'course-uuid-here',
  1,
  TRUE,  -- Les TP doivent être complétés dans l'ordre
  TRUE,
  'user-uuid-here'  -- ID de l'utilisateur créateur
)
RETURNING id;

-- 2. Ajouter les TP au lot (avec prérequis)
-- TP 1 : Pas de prérequis
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
VALUES (
  'batch-uuid-here',
  'tp1-uuid-here',
  1,
  TRUE,
  NULL  -- Pas de prérequis
);

-- TP 2 : Nécessite que TP 1 soit complété
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
VALUES (
  'batch-uuid-here',
  'tp2-uuid-here',
  2,
  TRUE,
  'tp1-uuid-here'  -- Prérequis : TP 1
);

-- TP 3 : Nécessite que TP 2 soit complété
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
VALUES (
  'batch-uuid-here',
  'tp3-uuid-here',
  3,
  TRUE,
  'tp2-uuid-here'  -- Prérequis : TP 2
);
```

**Exemple concret avec les TP Titanic :**
```sql
-- Créer un lot pour les TP Titanic
INSERT INTO tp_batches (title, description, course_id, sequential_order, is_published, created_by)
VALUES (
  'Série TP Titanic - Apprentissage complet',
  'TP Big Data, Data Science et Machine Learning avec le dataset Titanic',
  (SELECT id FROM courses WHERE title LIKE '%Big Data%' LIMIT 1),
  TRUE,
  TRUE,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
)
RETURNING id;

-- Récupérer les IDs des TP Titanic
WITH titanic_tps AS (
  SELECT id, title, ROW_NUMBER() OVER (ORDER BY title) as rn
  FROM items
  WHERE type = 'tp' AND title LIKE '%Titanic%'
)
SELECT id, title FROM titanic_tps;

-- Ajouter les TP au lot (exemple avec 3 TP)
-- TP 1
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required)
SELECT 
  (SELECT id FROM tp_batches WHERE title = 'Série TP Titanic - Apprentissage complet'),
  id,
  1,
  TRUE
FROM items
WHERE type = 'tp' AND title LIKE '%Titanic Big Data%'
LIMIT 1;

-- TP 2 (avec prérequis TP 1)
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
SELECT 
  (SELECT id FROM tp_batches WHERE title = 'Série TP Titanic - Apprentissage complet'),
  i2.id,
  2,
  TRUE,
  (SELECT id FROM items WHERE type = 'tp' AND title LIKE '%Titanic Big Data%' LIMIT 1)
FROM items i2
WHERE i2.type = 'tp' AND i2.title LIKE '%Titanic Data Science%'
LIMIT 1;
```

### Cas 3 : Lot de TP indépendant (sans cours)

**Scénario :** Vous voulez créer un lot de TP qui peut être utilisé dans plusieurs cours.

```sql
-- Créer un lot sans cours associé
INSERT INTO tp_batches (title, description, course_id, sequential_order, is_published, created_by)
VALUES (
  'TP Pratiques - Analyse de données',
  'Lot de TP réutilisable pour différents cours',
  NULL,  -- Pas de cours associé
  FALSE,  -- Pas d'ordre séquentiel obligatoire
  TRUE,
  'user-uuid-here'
);
```

## 📊 Requêtes utiles

### Obtenir tous les TP d'un cours (toutes sources confondues)

```sql
SELECT * FROM course_all_tps
WHERE course_id = 'course-uuid-here'
ORDER BY position_in_course, position_in_module;
```

### Obtenir les détails d'un lot de TP

```sql
SELECT * FROM tp_batch_details
WHERE batch_id = 'batch-uuid-here';
```

### Obtenir les TP d'un lot avec leurs prérequis

```sql
SELECT * FROM tp_batch_items_details
WHERE tp_batch_id = 'batch-uuid-here'
ORDER BY position;
```

### Lister tous les lots d'un cours

```sql
SELECT * FROM tp_batch_details
WHERE course_id = 'course-uuid-here'
ORDER BY batch_position;
```

### Vérifier quels TP sont dans des lots

```sql
SELECT 
  i.id,
  i.title,
  tb.title AS batch_title,
  tbi.position AS position_in_batch,
  tbi.is_required
FROM items i
INNER JOIN tp_batch_items tbi ON tbi.item_id = i.id
INNER JOIN tp_batches tb ON tb.id = tbi.tp_batch_id
WHERE i.type = 'tp'
ORDER BY tb.title, tbi.position;
```

## 🔄 Migration des TP existants

Si vous avez déjà des TP dans vos cours et que vous voulez les associer directement ou créer des lots :

### Option 1 : Associer tous les TP d'un cours directement

```sql
-- Associer tous les TP d'un cours (qui sont dans des modules) directement au cours
INSERT INTO course_tps (course_id, item_id, position, is_required, is_visible)
SELECT DISTINCT
  m.course_id,
  i.id,
  i.position,
  TRUE,
  TRUE
FROM items i
INNER JOIN modules m ON m.id = i.module_id
WHERE i.type = 'tp'
  AND m.course_id = 'course-uuid-here'
  AND NOT EXISTS (
    SELECT 1 FROM course_tps ct
    WHERE ct.course_id = m.course_id AND ct.item_id = i.id
  );
```

### Option 2 : Créer un lot avec tous les TP d'un cours

```sql
-- Créer un lot et y ajouter tous les TP d'un cours
WITH new_batch AS (
  INSERT INTO tp_batches (title, description, course_id, sequential_order, is_published, created_by)
  VALUES (
    'Tous les TP du cours',
    'Lot regroupant tous les TP du cours',
    'course-uuid-here',
    FALSE,
    TRUE,
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
  )
  RETURNING id
)
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required)
SELECT 
  nb.id,
  i.id,
  ROW_NUMBER() OVER (ORDER BY i.position),
  TRUE
FROM new_batch nb
CROSS JOIN items i
INNER JOIN modules m ON m.id = i.module_id
WHERE i.type = 'tp'
  AND m.course_id = 'course-uuid-here';
```

## ⚠️ Notes importantes

1. **Contraintes** :
   - Un TP ne peut être associé qu'une seule fois à un cours via `course_tps`
   - Un TP ne peut apparaître qu'une seule fois dans un lot
   - Les prérequis doivent être dans le même lot

2. **Ordre séquentiel** :
   - Si `sequential_order = TRUE` dans un lot, les TP doivent être complétés dans l'ordre
   - Utilisez `prerequisite_item_id` pour définir explicitement les prérequis

3. **Visibilité** :
   - Les TP associés directement avec `is_visible = FALSE` ne seront pas affichés dans la liste des TP du cours
   - Les lots avec `is_published = FALSE` ne seront pas visibles

4. **Performance** :
   - Utilisez la vue `course_all_tps` pour obtenir tous les TP d'un cours efficacement
   - Les index ont été créés pour optimiser les requêtes

## 🔍 Dépannage

### Vérifier si un TP est associé à un cours

```sql
SELECT * FROM course_tps
WHERE item_id = 'tp-uuid-here';
```

### Vérifier dans quels lots un TP apparaît

```sql
SELECT 
  tb.title AS batch_title,
  tbi.position,
  tbi.is_required
FROM tp_batch_items tbi
INNER JOIN tp_batches tb ON tb.id = tbi.tp_batch_id
WHERE tbi.item_id = 'tp-uuid-here';
```

### Supprimer une association

```sql
-- Supprimer l'association directe d'un TP à un cours
DELETE FROM course_tps
WHERE course_id = 'course-uuid-here' AND item_id = 'tp-uuid-here';

-- Retirer un TP d'un lot
DELETE FROM tp_batch_items
WHERE tp_batch_id = 'batch-uuid-here' AND item_id = 'tp-uuid-here';
```

## 📝 Prochaines étapes

Pour intégrer ces fonctionnalités dans l'interface utilisateur, vous devrez :

1. **Créer des composants React** pour :
   - Gérer les associations TP ↔ Cours
   - Créer et modifier les lots de TP
   - Afficher les lots dans l'interface du cours

2. **Mettre à jour les API** pour :
   - Exposer les endpoints pour les lots de TP
   - Gérer les associations directes
   - Vérifier les prérequis lors de l'accès aux TP

3. **Adapter l'affichage** pour :
   - Montrer les TP associés directement dans la liste du cours
   - Afficher les lots de TP avec leurs TP
   - Gérer l'ordre séquentiel et les prérequis



---


### 📄 Guide de migration vers un dépôt GitHub séparé

*Source: `portal-formations/GUIDE-MIGRATION-REPO-SEPARE.md`*


---

# Guide de migration vers un dépôt GitHub séparé

Ce guide explique comment migrer l'application Big Data Impacts vers un dépôt GitHub séparé pour simplifier l'hébergement.

## 🎯 Objectif

Déplacer l'application `big-data-impacts-app` vers un dépôt GitHub séparé pour :
- Simplifier l'hébergement
- Faciliter les déploiements indépendants
- Améliorer la maintenabilité

## 📋 Étapes de migration

### 1. Préparer le dépôt GitHub

1. Créez un nouveau dépôt sur GitHub nommé `big-data-impacts-app`
2. Ne cochez **pas** "Initialize this repository with a README"

### 2. Initialiser Git dans le dossier local

```bash
cd big-data-impacts-app
git init
git add .
git commit -m "Initial commit: Application Big Data Impacts"
```

### 3. Connecter au dépôt GitHub

```bash
git remote add origin https://github.com/VOTRE-USERNAME/big-data-impacts-app.git
git branch -M main
git push -u origin main
```

### 4. Déployer sur Netlify ou Vercel

#### Option A : Netlify (Recommandé)

1. Allez sur [Netlify](https://www.netlify.com/)
2. Cliquez sur "Add new site" > "Import an existing project"
3. Sélectionnez votre dépôt GitHub `big-data-impacts-app`
4. Netlify détectera automatiquement les paramètres depuis `netlify.toml`
5. Cliquez sur "Deploy site"
6. Notez l'URL de production (ex: `https://big-data-impacts.netlify.app`)

#### Option B : Vercel

1. Allez sur [Vercel](https://vercel.com/)
2. Cliquez sur "Add New..." > "Project"
3. Importez votre dépôt GitHub `big-data-impacts-app`
4. Vercel détectera automatiquement les paramètres depuis `vercel.json`
5. Cliquez sur "Deploy"
6. Notez l'URL de production (ex: `https://big-data-impacts.vercel.app`)

### 5. Mettre à jour les références dans le portail

Une fois déployé, mettez à jour toutes les références à `localhost:5174` :

#### Dans `tp-big-data-data-science-impacts.json`

Recherchez et remplacez toutes les occurrences de :
```json
"external_url": "http://localhost:5174"
```

Par :
```json
"external_url": "https://votre-url-de-production.netlify.app"
```

**Fichiers à mettre à jour :**
- `portal-formations/tp-big-data-data-science-impacts.json` (ligne ~3859)
- `portal-formations/GUIDE-ACCES-APPLICATION-BIG-DATA.md`
- Toute autre documentation qui référence `localhost:5174`

### 6. Tester l'intégration

1. Ouvrez le portail de formations
2. Accédez au TP Big Data
3. Vérifiez que l'application se charge correctement en iframe
4. Testez les fonctionnalités de l'application

## ✅ Checklist de migration

- [ ] Dépôt GitHub créé et code poussé
- [ ] Application déployée sur Netlify/Vercel
- [ ] URL de production notée
- [ ] Références dans `tp-big-data-data-science-impacts.json` mises à jour
- [ ] Documentation mise à jour
- [ ] Application testée en production
- [ ] Intégration iframe testée

## 🔄 Déploiement continu

Une fois configuré, chaque push sur `main` déclenchera automatiquement un nouveau déploiement.

## 📝 Notes importantes

- **Ne supprimez pas** le dossier `big-data-impacts-app` du projet principal tant que la migration n'est pas complète et testée
- **Testez** l'application en production avant de mettre à jour toutes les références
- **Gardez** une copie de sauvegarde du JSON du cours avant de le modifier

## 🆘 Dépannage

### L'application ne se charge pas en iframe

Vérifiez que les headers sont correctement configurés :
- `X-Frame-Options: SAMEORIGIN` (déjà configuré dans `netlify.toml` et `vercel.json`)

### Erreurs CORS

L'application n'utilise pas d'API externe, donc pas de problème CORS attendu.

### L'application ne se met pas à jour

- Vérifiez que le déploiement s'est bien terminé
- Videz le cache du navigateur
- Vérifiez les headers de cache dans `netlify.toml` / `vercel.json`

## 📞 Support

Pour toute question, consultez :
- `DEPLOYMENT.md` dans le dépôt de l'application
- `MIGRATION.md` dans le dépôt de l'application
- Ouvrez une issue sur GitHub





---


### 📄 Guide Rapide : Ajouter un Jeu dans un Chapitre

*Source: `portal-formations/GUIDE-RAPIDE-JEU-CHAPITRE.md`*


---

# Guide Rapide : Ajouter un Jeu dans un Chapitre

## ✅ Étapes à suivre

### 1. Ouvrir l'éditeur JSON du chapitre
- Allez dans `/admin/chapters/{chapterId}/json`
- Remplacez `{chapterId}` par l'ID de votre chapitre

### 2. Coller le JSON complet
Copiez **TOUT** le contenu du fichier `chapitre-complet-format-files.json` et collez-le dans l'éditeur.

**Le JSON doit contenir :**
```json
{
  "title": "Jeu : Formats de fichiers (JSON/XML/Protobuf)",
  "position": 0,
  "type": "game",  ← IMPORTANT : doit être "game"
  "game_content": {
    "gameType": "format-files",
    "description": "...",
    "instructions": "...",
    "levels": [...]
  }
}
```

### 3. Sauvegarder
- Cliquez sur "Sauvegarder"
- Attendez le message de confirmation

### 4. Vérifier dans la console
Ouvrez la console du navigateur (F12) et regardez les logs qui commencent par :
- `=== Chapters fetched ===`
- `=== RENDERING GAME ===`

**Vous devriez voir :**
- `Chapter type: "game"` (ou `null` si pas encore sauvegardé)
- `Chapter game_content: { gameType: "format-files", levels: [...] }`

## 🔍 Diagnostic

### Si vous voyez "Ce chapitre n'a pas encore de contenu"

**Causes possibles :**
1. Le champ `type` n'est pas `"game"` dans le JSON
2. Le champ `game_content` est vide ou invalide
3. Le JSON n'a pas été sauvegardé correctement

**Solutions :**
1. Vérifiez dans la console les logs `=== Chapters fetched ===`
2. Vérifiez que `type` est bien `"game"` dans le JSON
3. Vérifiez que `game_content` contient bien `gameType` et `levels`
4. Réessayez de sauvegarder

### Vérification dans Supabase

Exécutez cette requête SQL dans Supabase :

```sql
SELECT 
  id,
  title,
  type,
  CASE 
    WHEN game_content IS NULL THEN 'NULL'
    WHEN game_content::text = '{}' THEN 'EMPTY OBJECT'
    ELSE 'HAS CONTENT'
  END as game_content_status,
  jsonb_typeof(game_content) as game_content_type,
  game_content->>'gameType' as game_type
FROM chapters
WHERE id = 'VOTRE_CHAPITRE_ID'
ORDER BY updated_at DESC
LIMIT 1;
```

**Résultat attendu :**
- `type` doit être `"game"`
- `game_content_status` doit être `"HAS CONTENT"`
- `game_type` doit être `"format-files"`

## 📝 Format JSON correct

Le JSON dans l'éditeur doit être **exactement** comme ceci :

```json
{
  "title": "Jeu : Formats de fichiers (JSON/XML/Protobuf)",
  "position": 0,
  "type": "game",
  "game_content": {
    "gameType": "format-files",
    "description": "...",
    "instructions": "...",
    "levels": [
      {
        "level": 1,
        "name": "Découverte",
        "questions": [...]
      }
    ]
  }
}
```

**⚠️ Ne mettez PAS :**
- `"content"` (pour un jeu)
- Un `game_content` imbriqué dans un autre `game_content`
- Un `type` différent de `"game"`

## 🚀 Après la sauvegarde

1. Rechargez la page du cours/élément
2. Développez le chapitre (cliquez sur le titre)
3. Le jeu devrait apparaître

Si le jeu n'apparaît toujours pas :
1. Ouvrez la console (F12)
2. Regardez les logs `=== RENDERING GAME ===`
3. Partagez ces logs pour diagnostic






---


### 📄 Guide : Assignation de ressources aux apprenants

*Source: `portal-formations/GUIDE-RESSOURCES-ASSIGNEES.md`*


---

# Guide : Assignation de ressources aux apprenants

## 🎯 Fonctionnalité

Permet aux formateurs d'assigner des ressources (fichiers, liens, textes, corrections) aux apprenants avec un système de notifications en temps réel.

## 📋 Installation

### Étape 1 : Créer les tables

Exécutez le script `creer-table-ressources-assignees.sql` dans Supabase SQL Editor.

Ce script crée :
- Table `assigned_resources` : Stocke les ressources assignées
- Table `notifications` : Stocke les notifications pour les apprenants
- Trigger automatique : Crée une notification quand une ressource est assignée
- RLS Policies : Sécurité pour l'accès aux ressources

### Étape 2 : Créer le bucket de storage

Exécutez le script `creer-bucket-resources.sql` dans Supabase SQL Editor.

Ce script crée :
- Bucket `resources` dans Supabase Storage
- Policies RLS pour l'upload et le téléchargement

## 🚀 Utilisation

### Pour les formateurs

1. **Aller sur le portail formateur** : `/trainer`
2. **Sélectionner une session** : Cliquer sur une session
3. **Assigner une ressource** : Cliquer sur le bouton "Ressource" à côté d'un apprenant
4. **Remplir le formulaire** :
   - Titre (obligatoire)
   - Description (optionnelle)
   - Type de ressource :
     - **Fichier** : Upload d'un fichier (PDF, image, etc.)
     - **Lien** : URL externe
     - **Texte** : Contenu texte libre
     - **Correction** : Correction d'un exercice (texte)
5. **Assigner** : La ressource est assignée et une notification est créée automatiquement

### Pour les apprenants

1. **Voir les notifications** : 
   - Badge rouge sur l'icône de boîte aux lettres dans l'en-tête
   - Lien "Boîte aux lettres" dans le menu utilisateur
2. **Accéder à la boîte aux lettres** : `/mailbox`
3. **Voir les ressources** :
   - Ressources non lues en bleu avec un point bleu
   - Ressources lues en blanc
4. **Télécharger/Ouvrir** :
   - Fichiers : Bouton "Télécharger"
   - Liens : Bouton "Ouvrir le lien"
   - Textes/Corrections : Affichés directement
5. **Marquer comme lu** : Cliquer sur "Marquer comme lu" ou ouvrir/télécharger la ressource

## 🔔 Notifications

- **Création automatique** : Une notification est créée automatiquement quand une ressource est assignée
- **Temps réel** : Les notifications apparaissent en temps réel grâce à Supabase Realtime
- **Badge** : Le nombre de notifications non lues apparaît dans l'en-tête
- **Marquage comme lu** : Quand l'apprenant marque une ressource comme lue, la notification correspondante est aussi marquée comme lue

## 📁 Types de ressources

1. **Fichier** : 
   - Upload dans Supabase Storage
   - Formats acceptés : PDF, images, documents Office
   - Taille max : 50 MB

2. **Lien** :
   - URL externe
   - S'ouvre dans un nouvel onglet

3. **Texte** :
   - Contenu texte libre
   - Affiché dans la boîte aux lettres

4. **Correction** :
   - Même que texte mais avec un badge "Correction"
   - Utile pour partager les corrections d'exercices

## 🔒 Sécurité

- **RLS activé** : Les apprenants ne voient que leurs propres ressources
- **Formateurs** : Peuvent voir toutes les ressources qu'ils ont assignées
- **Storage** : Les fichiers sont privés, accessibles uniquement aux formateurs et aux apprenants concernés

## 🎨 Interface

### Portail formateur
- Bouton "Ressource" dans le tableau des apprenants
- Modal d'assignation avec formulaire

### Boîte aux lettres apprenant
- Liste des ressources assignées
- Badge de notification dans l'en-tête
- Indicateur visuel pour les ressources non lues
- Actions : Télécharger, Ouvrir, Marquer comme lu

## 📝 Exemple d'utilisation

1. Un apprenant soumet un exercice
2. Le formateur corrige et crée un fichier PDF avec la correction
3. Le formateur va sur `/trainer/session/:sessionId`
4. Clique sur "Ressource" à côté de l'apprenant
5. Sélectionne "Correction", upload le PDF
6. L'apprenant reçoit une notification
7. L'apprenant va sur `/mailbox` et télécharge la correction

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **Exécuter les scripts SQL** dans Supabase
2. **Rafraîchir le navigateur** (Cmd+Shift+R)
3. **Aller sur le portail formateur** : `/trainer`
4. **Assigner une ressource de test** à un apprenant
5. **Se connecter en tant qu'apprenant** et vérifier la notification
6. **Aller sur `/mailbox`** et voir la ressource

Tout est prêt ! 🎉






---


### 📄 Guide : Slides avec Contexte Pédagogique

*Source: `portal-formations/GUIDE-SLIDES-CONTEXTE.md`*


---

# Guide : Slides avec Contexte Pédagogique

## 📋 Vue d'ensemble

Cette fonctionnalité permet de dissocier clairement le **support projeté** (slides) du **savoir transmis** (contexte pédagogique), comme dans une vraie salle de formation.

### Objectif pédagogique

- **Le slide** = support visuel projeté
- **Le contenu associé** = discours / explication du formateur

---

## 🎯 Structure des composants

### 1. SlideBlock (Support projeté)

Le composant `SlideBlock` affiche :
- La slide si elle existe (image, PDF, ou contenu rich text)
- Un message d'avertissement clair si aucun slide n'est présent

**Message d'avertissement affiché :**
```
⚠️ Aucun slide projeté pour cette section
Le contenu pédagogique sera disponible ci-dessous une fois le slide ajouté.
```

### 2. ContextBlock (Contexte pédagogique)

Le composant `ContextBlock` affiche sous chaque slide :
- Les explications du formateur
- Des exemples concrets
- Des annotations pédagogiques
- Des points clés à retenir

**Caractéristiques visuelles :**
- Légèrement indenté vers la droite (`ml-8 md:ml-12`)
- Fond clair avec bordure gauche colorée
- Icône "MessageSquare" pour identifier le contexte
- Aspect "annotation / commentaire formateur"

---

## 📝 Structure JSON

### Structure de base pour une slide

```json
{
  "type": "slide",
  "title": "Titre de la slide",
  "position": 1,
  "published": true,
  "asset_path": "module1/slide1.png",  // Optionnel : image ou PDF
  "content": {
    "summary": "Résumé optionnel de la slide",
    "body": { /* Format TipTap JSON */ },  // Optionnel : contenu rich text
    "pedagogical_context": {
      "text": "Texte simple du contexte pédagogique",
      // OU
      "body": { /* Format TipTap JSON pour contenu riche */ },
      // OU
      "description": "Description simple"
    }
  }
}
```

### Exemples de structures

#### Exemple 1 : Slide avec image + contexte texte simple

```json
{
  "type": "slide",
  "title": "Slide 1.1 : Qu'est-ce qu'une API ?",
  "position": 1,
  "published": true,
  "asset_path": "module1/slide-api-intro.png",
  "content": {
    "summary": "Cette slide présente les concepts de base des APIs",
    "pedagogical_context": {
      "text": "Bonjour, nous allons commencer par comprendre ce qu'est une API. Sur cette slide, vous voyez une représentation visuelle du principe client-serveur.\n\nPoints clés à retenir :\n- L'API définit ce qui est disponible\n- Elle sécurise l'accès aux données"
    }
  }
}
```

#### Exemple 2 : Slide avec contenu rich text + contexte rich text

```json
{
  "type": "slide",
  "title": "Slide 1.2 : Types d'APIs",
  "position": 2,
  "published": true,
  "content": {
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            { "type": "text", "text": "Types d'APIs" }
          ]
        }
      ]
    },
    "pedagogical_context": {
      "body": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Ici, nous voyons les deux principaux types d'APIs modernes. "
              },
              {
                "type": "text",
                "marks": [{ "type": "bold" }],
                "text": "REST"
              },
              {
                "type": "text",
                "text": " est le standard le plus répandu."
              }
            ]
          }
        ]
      }
    }
  }
}
```

#### Exemple 3 : Slide sans contenu (avertissement affiché)

```json
{
  "type": "slide",
  "title": "Slide 1.3 : Exemple sans slide",
  "position": 3,
  "published": true,
  "content": {
    "pedagogical_context": {
      "text": "Cette section n'a pas encore de slide projeté. Le message d'avertissement sera affiché automatiquement."
    }
  }
}
```

---

## 🎨 Styles et UX

### Hiérarchie visuelle

1. **Slide principale** (SlideBlock)
   - Zone principale, bien visible
   - Fond blanc avec ombre légère
   - Centré et lisible

2. **Contexte pédagogique** (ContextBlock)
   - Indenté vers la droite
   - Fond gris clair (`#F9FAFB`)
   - Bordure gauche colorée (couleur du thème)
   - Icône + titre "Contexte pédagogique"

3. **Message d'avertissement** (si slide absente)
   - Fond jaune clair (`#FEF3C7`)
   - Bordure jaune/ambre
   - Icône d'alerte
   - Message clair et pédagogique

### Responsive

- **Desktop** : Indentation `ml-12` (48px)
- **Mobile/Tablette** : Indentation `ml-8` (32px)
- Les slides s'adaptent automatiquement à la taille de l'écran

---

## 🔧 Utilisation dans le code

### Import des composants

```typescript
import { SlideBlock } from '../components/SlideBlock'
import { ContextBlock } from '../components/ContextBlock'
```

### Utilisation dans renderSlide

La fonction `renderSlide` dans `ReactRenderer.tsx` utilise automatiquement ces composants :

```typescript
function renderSlide(item: CourseJson['modules'][0]['items'][0], theme: any) {
  return (
    <div className="slide-container space-y-0">
      {/* Slide principale */}
      <SlideBlock item={item} theme={theme} />
      
      {/* Contexte pédagogique */}
      {item.content?.pedagogical_context && (
        <ContextBlock 
          context={item.content.pedagogical_context} 
          theme={theme} 
        />
      )}
      
      {/* Chapitres si disponibles */}
      {item.chapters && item.chapters.length > 0 && (
        <div className="mt-6">
          <ChapterList chapters={item.chapters} theme={theme} />
        </div>
      )}
    </div>
  )
}
```

---

## ✅ Checklist pour créer une slide

- [ ] Définir le type : `"type": "slide"`
- [ ] Ajouter un titre descriptif
- [ ] Optionnel : Ajouter `asset_path` (image ou PDF)
- [ ] Optionnel : Ajouter `content.body` (contenu rich text)
- [ ] **Recommandé** : Ajouter `content.pedagogical_context` avec :
  - Explications du formateur
  - Points clés à retenir
  - Exemples concrets
  - Contextualisation

---

## 📚 Exemple complet

Voir le fichier `exemple-slide-avec-contexte.json` pour un exemple complet de cours avec plusieurs slides et contextes pédagogiques.

---

## 🎓 Bonnes pratiques

1. **Toujours ajouter un contexte pédagogique** même si la slide est claire
2. **Utiliser des exemples concrets** dans le contexte
3. **Séparer visuellement** le slide du contexte (indentation)
4. **Message d'avertissement** : utile pour identifier les slides manquantes
5. **Format du contexte** :
   - Texte simple pour des explications courtes
   - Format TipTap JSON pour du contenu riche (listes, gras, etc.)

---

## 🔄 Évolution future

- Possibilité d'ajouter des timestamps pour synchroniser le contexte avec une vidéo
- Support pour des annotations interactives
- Export du contexte pédagogique séparément





---


### 📄 Guide : Créer le jeu "Types de fichiers JSON" via SQL

*Source: `portal-formations/GUIDE-SQL-JEU-JSON.md`*


---

# Guide : Créer le jeu "Types de fichiers JSON" via SQL

## ⚠️ Important : Remplacer l'ID de l'item

Avant d'exécuter le script SQL, vous devez trouver l'ID de l'item dans lequel vous voulez créer le chapitre.

### Étape 1 : Trouver l'ID de votre item

```sql
-- Lister tous vos items
SELECT 
  id,
  title,
  type,
  position
FROM items
ORDER BY created_at DESC;

-- Ou chercher un item spécifique
SELECT 
  id,
  title,
  type
FROM items
WHERE title ILIKE '%votre recherche%';
```

### Étape 2 : Exécuter le script SQL

1. Ouvrez le fichier `insert-json-file-types-game.sql`
2. Remplacez `'YOUR_ITEM_ID'` par l'ID réel de votre item (ex: `'a1b2c3d4-e5f6-7890-abcd-ef1234567890'`)
3. Copiez-collez le script dans l'éditeur SQL de Supabase
4. Exécutez la requête

### Étape 3 : Vérifier la création

```sql
-- Vérifier que le chapitre a été créé
SELECT 
  id,
  title,
  type,
  game_content->>'gameType' as game_type,
  jsonb_array_length(game_content->'fileTypes') as file_types_count,
  jsonb_array_length(game_content->'examples') as examples_count
FROM chapters
WHERE title = 'Jeu : Types de fichiers JSON'
ORDER BY created_at DESC
LIMIT 1;
```

Vous devriez voir :
- `type` = `'game'`
- `game_type` = `'json-file-types'`
- `file_types_count` = `8`
- `examples_count` = `8`

## Alternative : Via l'interface admin (plus simple)

Si vous préférez utiliser l'interface graphique :

1. Allez sur votre item dans `/admin/items/{itemId}`
2. Dans la section "Chapitres", cliquez sur "Ajouter un chapitre"
3. Cliquez sur "Ajouter un jeu"
4. Ouvrez l'éditeur JSON : `/admin/chapters/{chapterId}/json`
5. Copiez tout le contenu de `chapitre-jeu-json-file-types.json`
6. Collez dans l'éditeur et sauvegardez

## Dépannage

### Erreur : "invalid input syntax for type json"

**Cause :** Le JSON contient des caractères non échappés ou des placeholders `[...]`

**Solution :** Utilisez le fichier `insert-json-file-types-game.sql` qui contient le JSON complet et valide.

### Erreur : "violates foreign key constraint"

**Cause :** L'ID de l'item n'existe pas ou est incorrect.

**Solution :** Vérifiez que l'ID de l'item est correct avec la requête de l'étape 1.

### Le jeu ne s'affiche pas

**Vérifications :**
1. Le champ `type` est bien `'game'` ?
2. Le champ `game_content` contient bien `gameType: 'json-file-types'` ?
3. Les tableaux `fileTypes` et `examples` ne sont pas vides ?

```sql
SELECT 
  id,
  title,
  type,
  game_content->>'gameType' as game_type,
  game_content->'fileTypes' as file_types,
  game_content->'examples' as examples
FROM chapters
WHERE id = 'VOTRE_CHAPITRE_ID';
```






---


### 📄 Guide : Téléchargement PDF des cours

*Source: `portal-formations/GUIDE-TELECHARGEMENT-PDF.md`*


---

# Guide : Téléchargement PDF des cours

## 📋 Vue d'ensemble

Cette fonctionnalité permet de télécharger un cours complet au format PDF avec un format paysage spécialisé :
- **Côté gauche** : Les slides (images, PDFs, ou contenu rich text)
- **Côté droit** : Le contexte pédagogique associé à chaque slide

## 🚀 Installation

### 1. Migration de la base de données

Exécutez la migration SQL pour ajouter le champ `allow_pdf_download` :

```bash
# Dans Supabase SQL Editor ou via psql
psql -h votre-host -U votre-user -d votre-db -f add-pdf-download-feature.sql
```

Ou copiez-collez le contenu de `add-pdf-download-feature.sql` dans l'éditeur SQL de Supabase.

### 2. Installation des dépendances backend

Dans le dossier `server/`, installez les dépendances nécessaires :

```bash
cd server
npm install puppeteer @supabase/supabase-js
```

### 3. Configuration des variables d'environnement

Assurez-vous que les variables d'environnement suivantes sont configurées dans le serveur backend :

```env
VITE_SUPABASE_URL=votre-url-supabase
VITE_SUPABASE_ANON_KEY=votre-clé-anon
# OU
SUPABASE_URL=votre-url-supabase
SUPABASE_ANON_KEY=votre-clé-anon
```

## 📝 Utilisation

### Activer le téléchargement PDF pour un cours

1. Allez dans l'interface d'administration : `/admin/courses/:courseId`
2. Dans la section "Informations générales", cochez la case **"Autoriser le téléchargement PDF du cours complet"**
3. Sauvegardez le cours

### Télécharger le PDF

1. Allez sur la page du cours : `/courses/:courseId`
2. Cliquez sur le bouton **"PDF"** dans le header (visible uniquement si le téléchargement est activé)
3. Le PDF sera généré et téléchargé automatiquement

## 🎨 Format du PDF

### Structure

- **Format** : A4 paysage
- **Marges** : 1cm de chaque côté
- **Mise en page** : Deux colonnes par page
  - **Gauche** : Slide (image, contenu rich text, ou placeholder si PDF)
  - **Droite** : Contexte pédagogique (explications, annotations formateur)

### Contenu inclus

- Toutes les slides **publiées** du cours
- Le contexte pédagogique associé à chaque slide
- Les modules sont organisés dans l'ordre défini

### Limitations

- Les PDFs uploadés comme slides ne peuvent pas être affichés dans le PDF généré (limitation Puppeteer)
- Seules les slides publiées sont incluses
- Les images doivent être accessibles publiquement via Supabase Storage

## 🔧 Architecture technique

### Backend (`server/src/routes/courses.ts`)

- **Route** : `GET /api/courses/:courseId/pdf`
- **Fonctionnalités** :
  - Vérifie que `allow_pdf_download` est activé
  - Récupère les modules et slides depuis Supabase
  - Génère le HTML avec format paysage
  - Utilise Puppeteer pour convertir HTML en PDF
  - Retourne le PDF en stream

### Frontend (`src/pages/CourseView.tsx`)

- **Bouton de téléchargement** : Visible uniquement si `allow_pdf_download === true`
- **Fonction** : `handleDownloadPdf()` qui appelle l'API backend

### Utilitaires

- **`server/src/utils/tipTapToHtml.ts`** : Convertit le contenu TipTap JSON en HTML
- **`pedagogicalContextToHtml()`** : Convertit le contexte pédagogique en HTML

## 🐛 Dépannage

### Erreur : "Configuration Supabase manquante"

Vérifiez que les variables d'environnement sont bien configurées dans le serveur backend.

### Erreur : "Le téléchargement PDF n'est pas activé"

Activez le téléchargement PDF dans les paramètres du cours (interface admin).

### Erreur : "Aucune slide trouvée"

Assurez-vous que le cours contient au moins une slide publiée.

### Le PDF ne se génère pas

1. Vérifiez que Puppeteer est bien installé : `npm list puppeteer` dans `server/`
2. Vérifiez les logs du serveur backend pour les erreurs détaillées
3. Assurez-vous que le serveur backend est accessible depuis le frontend

### Les images ne s'affichent pas dans le PDF

- Vérifiez que les images sont accessibles publiquement via Supabase Storage
- Vérifiez que les URLs générées sont correctes (logs dans la console)

## 📌 Notes importantes

- Le format paysage est optimisé pour l'impression et la lecture sur écran
- Le contexte pédagogique est formaté avec une bordure bleue pour le distinguer visuellement
- Les slides sans contexte pédagogique affichent un message "Aucun contexte pédagogique disponible"
- Les slides sans contenu affichent un placeholder avec un message d'avertissement

## 🔐 Sécurité

- L'API vérifie que le téléchargement est activé avant de générer le PDF
- L'authentification est requise pour accéder à l'API (via JWT Bearer token)
- Seules les slides publiées sont incluses dans le PDF





---


### 📄 Guide de test : Slides avec contexte pédagogique

*Source: `portal-formations/GUIDE-TEST-SLIDES.md`*


---

# Guide de test : Slides avec contexte pédagogique

## 🎯 Comment tester

### 1. Importer le JSON de test

1. Allez dans l'interface d'administration
2. Créez un nouveau cours ou éditez un cours existant
3. Importez le fichier `test-big-data-slide-contexte.json`
4. Sauvegardez le cours

### 2. Visualiser le cours

1. Allez sur la page du cours : `/courses/[courseId]`
2. **Cliquez sur le titre du module** pour le déplier (les modules sont repliés par défaut)
3. Vous devriez maintenant voir :

#### ✅ Ce que vous devez voir

**Pour la Slide 1.1 (sans slide) :**
```
┌─────────────────────────────────────────────┐
│ ⚠️ Aucun slide projeté pour cette section    │
│ Le contenu pédagogique sera disponible      │
│ ci-dessous une fois le slide ajouté.         │
└─────────────────────────────────────────────┘

    ┌─────────────────────────────────────────┐
    │ 💬 CONTEXTE PÉDAGOGIQUE                 │
    │                                         │
    │ Dans notre quotidien professionnel     │
    │ et personnel, chaque interaction...     │
    │                                         │
    │ La donnée est générée par les usages,  │
    │ pas par les outils...                   │
    └─────────────────────────────────────────┘
```

**Pour la Slide 1.3 (avec contenu rich text) :**
```
┌─────────────────────────────────────────────┐
│ La donnée est générée par les usages        │
│ Pas par les outils                         │
│ ─────────────────────────────────────────── │
│ • Les processus métiers génèrent...        │
│ • L'infrastructure IT vient ensuite...      │
│ • Comprendre les usages avant...           │
└─────────────────────────────────────────────┘

    ┌─────────────────────────────────────────┐
    │ 💬 CONTEXTE PÉDAGOGIQUE                 │
    │ Cette distinction est fondamentale...   │
    │                                         │
    │ Posez-vous ces questions :              │
    │ • Quels sont les moments clés...        │
    │ • Cette donnée est-elle capturée...     │
    │ • Quelle valeur métier...               │
    └─────────────────────────────────────────┘
```

### 3. Vérifications à faire

- [ ] Le message d'avertissement apparaît pour les slides sans contenu
- [ ] Le contexte pédagogique est indenté vers la droite
- [ ] Le contexte a un fond gris clair avec bordure gauche colorée
- [ ] L'icône "MessageSquare" est visible
- [ ] Le texte du contexte est bien formaté et lisible
- [ ] Sur mobile, l'indentation s'adapte (plus petite)

---

## 🔍 Dépannage

### Je ne vois rien de différent

1. **Vérifiez que le module est déplié** : Cliquez sur le titre du module
2. **Vérifiez que les items sont publiés** : `"published": true` dans le JSON
3. **Vérifiez la console du navigateur** : F12 → Console pour voir les erreurs
4. **Rechargez la page** : Ctrl+R ou Cmd+R

### Les slides ne s'affichent pas

1. Vérifiez que le type est bien `"type": "slide"`
2. Vérifiez que `content.pedagogical_context` existe dans le JSON
3. Vérifiez que le cours a bien été sauvegardé après l'import

### Le contexte pédagogique ne s'affiche pas

1. Vérifiez que `pedagogical_context` contient `text`, `body`, ou `description`
2. Vérifiez la structure JSON (pas d'erreur de syntaxe)
3. Vérifiez dans la console du navigateur s'il y a des erreurs

---

## 📝 Structure JSON attendue

```json
{
  "type": "slide",
  "title": "Titre de la slide",
  "position": 1,
  "published": true,
  "content": {
    "pedagogical_context": {
      "text": "Votre texte ici"
    }
  }
}
```

---

## 🎨 Styles visuels attendus

### Message d'avertissement
- Fond : Jaune clair (#FEF3C7)
- Bordure : Jaune/ambre (#F59E0B), pointillée
- Icône : AlertTriangle (triangle d'alerte)

### Contexte pédagogique
- Indentation : 32px (mobile) ou 48px (desktop)
- Fond : Gris clair (#F9FAFB)
- Bordure gauche : 4px, couleur du thème
- Icône : MessageSquare

---

## ✅ Checklist de test

- [ ] Import du JSON réussi
- [ ] Module déplié et visible
- [ ] Slide 1.1 : Message d'avertissement visible
- [ ] Slide 1.1 : Contexte pédagogique visible et indenté
- [ ] Slide 1.3 : Contenu rich text visible
- [ ] Slide 1.3 : Contexte pédagogique avec formatage (listes, gras)
- [ ] Responsive : Test sur mobile/tablette
- [ ] Pas d'erreurs dans la console

---

## 🚀 Prochaines étapes

Une fois que vous voyez les slides s'afficher correctement :

1. Testez avec vos propres contenus
2. Ajoutez des images dans `asset_path` pour voir les slides avec images
3. Testez différents formats de contexte (texte simple vs TipTap JSON)
4. Vérifiez l'affichage sur différents appareils





---


### 📄 Guide : Trouver l'ID de votre item

*Source: `portal-formations/GUIDE-TROUVER-ITEM-ID.md`*


---

# Guide : Trouver l'ID de votre item

## Problème

Vous avez l'erreur :
```
ERROR: 23503: insert or update on table "chapters" violates foreign key constraint
Key (item_id)=(9266adf5-539a-4b9e-9fe2-c238732713aa) is not present in table "items"
```

Cela signifie que l'ID que vous avez utilisé n'existe pas dans la table `items`.

## Solution : Trouver le bon ID

### Étape 1 : Exécuter la requête pour trouver vos items

Ouvrez le fichier `trouver-item-id.sql` et exécutez une des requêtes dans Supabase SQL Editor.

**Recommandation :** Utilisez la requête "Option 1" pour voir tous vos items avec leurs modules et cours :

```sql
SELECT 
  i.id as item_id,
  i.title as item_title,
  i.type as item_type,
  i.position as item_position,
  m.title as module_title,
  c.title as course_title
FROM items i
JOIN modules m ON i.module_id = m.id
JOIN courses c ON m.course_id = c.id
ORDER BY c.title, m.position, i.position;
```

### Étape 2 : Copier l'ID de l'item souhaité

Dans les résultats, trouvez l'item dans lequel vous voulez créer le chapitre et copiez son `item_id`.

**Exemple de résultat :**
```
item_id                                | item_title              | item_type  | module_title | course_title
--------------------------------------|-------------------------|------------|--------------|-------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | Introduction aux APIs   | resource   | Module 1     | Cours API
b2c3d4e5-f6a7-8901-bcde-f12345678901 | Exercice pratique       | exercise   | Module 1     | Cours API
```

### Étape 3 : Utiliser l'ID dans le script

1. Ouvrez `insert-json-file-types-game.sql`
2. Remplacez `'YOUR_ITEM_ID'` par l'ID que vous avez copié
3. **Important :** Gardez les guillemets simples autour de l'ID

**Exemple :**
```sql
-- ❌ Incorrect
INSERT INTO chapters (item_id, ...) VALUES (9266adf5-539a-4b9e-9fe2-c238732713aa, ...)

-- ✅ Correct
INSERT INTO chapters (item_id, ...) VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', ...)
```

## Alternative : Créer un item si vous n'en avez pas

Si vous n'avez pas d'item, créez-en un d'abord :

```sql
-- 1. Trouvez l'ID de votre module
SELECT id, title FROM modules ORDER BY created_at DESC LIMIT 5;

-- 2. Créez un item (remplacez YOUR_MODULE_ID)
INSERT INTO items (module_id, type, title, position, content)
VALUES (
  'YOUR_MODULE_ID',  -- Remplacez par l'ID de votre module
  'resource',        -- Type : resource, slide, exercise, tp, ou game
  'Mon Item',        -- Titre de l'item
  0,                 -- Position
  '{}'::jsonb        -- Contenu vide pour commencer
)
RETURNING id, title;  -- Retourne l'ID créé

-- 3. Utilisez l'ID retourné dans le script insert-json-file-types-game.sql
```

## Vérification

Après avoir créé le chapitre, vérifiez qu'il a été créé correctement :

```sql
SELECT 
  id,
  title,
  type,
  item_id,
  game_content->>'gameType' as game_type
FROM chapters
WHERE title = 'Jeu : Types de fichiers JSON'
ORDER BY created_at DESC
LIMIT 1;
```

Vous devriez voir :
- `type` = `'game'`
- `game_type` = `'json-file-types'`
- `item_id` correspond à l'ID que vous avez utilisé

## 🔗 Accéder au jeu après création

Une fois le jeu créé, vous pouvez y accéder via :

### Si le jeu est un item (table `items`)
```
/items/{itemId}
```

**Exemple :** Si l'ID est `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
```
/items/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Si le jeu est dans un chapitre (table `chapters`)
```
/courses/{courseId}
```
Naviguez ensuite jusqu'au chapitre contenant le jeu dans la liste des chapitres.

### Trouver tous les jeux disponibles

**Tous les items de type game :**
```sql
SELECT id, title, type FROM items 
WHERE type = 'game' 
ORDER BY created_at DESC;
```

**Tous les chapitres de type game :**
```sql
SELECT id, title, type FROM chapters 
WHERE type = 'game' 
ORDER BY created_at DESC;
```

Pour plus d'informations sur les jeux et leurs formats, consultez :
- `STRUCTURE-COMPLETE-JEUX.md` : Structure complète de tous les types de jeux
- `NOUVEAUX_JEUX.md` : Guide des nouveaux jeux interactifs
- `exemples-jeux/README-JEUX-API.md` : Exemples de jeux pour l'apprentissage des APIs




---


### 📄 Guide : Utilisateurs Ghost et Désactivation

*Source: `portal-formations/GUIDE-UTILISATEURS-GHOST.md`*


---

# Guide : Utilisateurs Ghost et Désactivation

Ce guide explique comment utiliser les fonctionnalités d'utilisateurs anonymes (ghost) et de désactivation d'utilisateurs dans l'application.

## 📋 Table des matières

1. [Utilisateurs Ghost](#utilisateurs-ghost)
2. [Désactivation d'utilisateurs](#désactivation-dutilisateurs)
3. [Configuration initiale](#configuration-initiale)

## 👻 Utilisateurs Ghost

### Qu'est-ce qu'un utilisateur ghost ?

Un utilisateur ghost est un utilisateur anonyme qui peut accéder à l'application sans fournir d'adresse email. Il reçoit :
- Un code d'accès unique généré par un administrateur
- Un nom aléatoire de type "cartoon" (ex: "Panda Curieux-ABC1")
- Une session temporaire qui peut être supprimée après utilisation

### Configuration

#### 1. Activer l'authentification anonyme dans Supabase

1. Allez dans **Supabase Dashboard** → **Authentication** → **Providers**
2. Activez le provider **"Anonymous"**
3. Sauvegardez les modifications

#### 2. Exécuter le script SQL

Exécutez le fichier `ghost-users-and-deactivation.sql` dans l'éditeur SQL de Supabase. Ce script crée :
- La table `ghost_codes` pour gérer les codes d'accès
- Les fonctions SQL pour générer et valider les codes
- Les policies RLS nécessaires

### Utilisation

#### Pour les administrateurs

1. **Générer des codes d'accès**
   - Allez dans `/admin/ghost-codes`
   - Cliquez sur "Générer des codes"
   - Choisissez le nombre de codes et la durée d'expiration
   - Optionnellement, ajoutez des notes pour identifier l'usage
   - Cliquez sur "Générer les codes"

2. **Distribuer les codes**
   - Les codes générés apparaissent dans la liste
   - Cliquez sur l'icône de copie pour copier un code
   - Distribuez les codes aux utilisateurs qui souhaitent rester anonymes

3. **Suivre l'utilisation**
   - La page affiche les statistiques :
     - Codes disponibles
     - Codes utilisés
     - Codes expirés
   - Vous pouvez voir quand chaque code a été utilisé

#### Pour les utilisateurs

1. **Se connecter avec un code**
   - Allez sur `/ghost-login`
   - Entrez le code d'accès fourni par l'administrateur
   - Cliquez sur "Se connecter anonymement"
   - Un nom aléatoire vous sera attribué (ex: "Renard Rusé-XYZ2")

2. **Utiliser l'application**
   - Vous pouvez utiliser toutes les fonctionnalités normalement
   - Votre identité reste confidentielle

3. **Déconnexion**
   - Lors de la déconnexion, votre compte ghost sera automatiquement supprimé
   - Les données associées seront également supprimées (selon les règles de cascade)

### Fonctionnalités techniques

- **Génération de noms cartoon** : Les noms sont générés aléatoirement avec un format `Animal Adjectif-Suffixe`
- **Validation des codes** : Les codes sont vérifiés pour s'assurer qu'ils sont valides, non utilisés et non expirés
- **Expiration automatique** : Les codes peuvent avoir une date d'expiration
- **Nettoyage automatique** : Les utilisateurs ghost peuvent être supprimés automatiquement après la session

## 🚫 Désactivation d'utilisateurs

### Fonctionnalité

Les administrateurs peuvent désactiver des utilisateurs sans les supprimer. Un utilisateur désactivé :
- Ne peut plus se connecter
- N'apparaît plus dans les listes d'utilisateurs actifs
- Peut être réactivé à tout moment

### Utilisation

1. **Accéder à la gestion des utilisateurs**
   - Allez dans `/admin/users`
   - Vous verrez la liste de tous les utilisateurs avec leur statut

2. **Désactiver un utilisateur**
   - Trouvez l'utilisateur dans la liste
   - Cliquez sur l'icône "UserX" (désactiver) dans la colonne "Statut"
   - Confirmez l'action
   - L'utilisateur sera marqué comme "Désactivé" et ne pourra plus se connecter

3. **Réactiver un utilisateur**
   - Trouvez l'utilisateur désactivé (il apparaît en grisé)
   - Cliquez sur l'icône "UserCheck" (réactiver) dans la colonne "Statut"
   - Confirmez l'action
   - L'utilisateur pourra à nouveau se connecter

### Comportement technique

- **Champ `is_active`** : Un champ `is_active` (par défaut `true`) est ajouté à la table `profiles`
- **Policies RLS** : Les policies RLS sont mises à jour pour exclure les utilisateurs désactivés
- **Affichage** : Les utilisateurs désactivés apparaissent en grisé dans l'interface admin
- **Vérification** : Lors de la connexion, le système vérifie que `is_active = true`

## 🔧 Configuration initiale

### Étapes à suivre

1. **Exécuter le script SQL**
   ```sql
   -- Exécutez ghost-users-and-deactivation.sql dans Supabase SQL Editor
   ```

2. **Activer l'authentification anonyme**
   - Supabase Dashboard → Authentication → Providers → Enable "Anonymous"

3. **Vérifier les routes**
   - `/ghost-login` : Page de connexion pour les utilisateurs ghost
   - `/admin/ghost-codes` : Gestion des codes (admin uniquement)
   - `/admin/users` : Gestion des utilisateurs avec désactivation (admin uniquement)

### Vérification

1. **Tester la génération de codes**
   ```sql
   -- Dans Supabase SQL Editor
   SELECT * FROM generate_ghost_codes(3, 24, NULL);
   ```

2. **Tester la connexion ghost**
   - Générer un code via l'interface admin
   - Aller sur `/ghost-login`
   - Entrer le code et se connecter
   - Vérifier que le nom cartoon est attribué

3. **Tester la désactivation**
   - Aller sur `/admin/users`
   - Désactiver un utilisateur de test
   - Essayer de se connecter avec cet utilisateur (devrait échouer)
   - Réactiver l'utilisateur
   - Vérifier que la connexion fonctionne à nouveau

## 📝 Notes importantes

### Sécurité

- Les codes ghost doivent être distribués de manière sécurisée
- Les codes expirés ne peuvent plus être utilisés
- Les codes utilisés ne peuvent pas être réutilisés
- Les utilisateurs ghost sont supprimés après déconnexion (optionnel)

### Limitations

- Les utilisateurs ghost ne peuvent pas récupérer leur compte (pas d'email)
- Les codes doivent être générés manuellement par un admin
- La suppression automatique des utilisateurs ghost nécessite une Edge Function ou un job programmé

### Bonnes pratiques

- Générer des codes avec une expiration raisonnable (24h par défaut)
- Ajouter des notes lors de la génération pour identifier l'usage
- Surveiller l'utilisation des codes via les statistiques
- Désactiver plutôt que supprimer les utilisateurs problématiques

## 🆘 Dépannage

### Problème : "Code invalide ou déjà utilisé"

- Vérifiez que le code n'a pas déjà été utilisé
- Vérifiez que le code n'a pas expiré
- Vérifiez que le code existe dans la table `ghost_codes`

### Problème : "Erreur lors de la connexion ghost"

- Vérifiez que l'authentification anonyme est activée dans Supabase
- Vérifiez que le script SQL a été exécuté correctement
- Vérifiez les logs de la console pour plus de détails

### Problème : Un utilisateur désactivé peut toujours se connecter

- Vérifiez que le champ `is_active` existe dans la table `profiles`
- Vérifiez que les policies RLS ont été mises à jour
- Vérifiez que `fetchProfile` dans `useAuth.tsx` filtre par `is_active = true`

## 📚 Références

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Authentification anonyme Supabase](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)





---


### 📄 Guide de vérification - Affichage des soumissions dans le portail formateur

*Source: `portal-formations/GUIDE-VERIFICATION-DETAILS.md`*


---

# Guide de vérification - Affichage des soumissions dans le portail formateur

## ✅ Modifications apportées

1. **Nouveau composant** : `src/components/trainer/LearnerDetails.tsx`
   - Affiche toutes les soumissions d'un apprenant
   - Permet de télécharger les fichiers joints
   - Affiche les réponses textuelles et les notes

2. **Fonction ajoutée** : `getLearnerSubmissions()` dans `src/lib/queries/trainerQueries.ts`
   - Récupère toutes les soumissions d'un apprenant pour une session

3. **Bouton "Détails"** ajouté dans la table des apprenants
   - Bouton vert visible dans la colonne "Actions"

4. **Script SQL** : `fix-submissions-rls-for-trainers.sql`
   - À exécuter dans Supabase pour permettre aux formateurs de voir les soumissions

## 🔍 Comment vérifier que ça fonctionne

### 1. Vérifier que le serveur de développement tourne

```bash
cd portal-formations
npm run dev
```

### 2. Accéder à la page des apprenants

1. Se connecter en tant que formateur
2. Aller sur `/trainer`
3. Cliquer sur une session pour voir les apprenants
4. URL attendue : `/trainer/session/:sessionId`

### 3. Vérifier la présence du bouton "Détails"

Dans la table des apprenants, vous devriez voir :
- Un bouton vert "Détails" (premier bouton dans la colonne Actions)
- Des boutons "Relancer", "Ressource", "Note"

### 4. Tester l'ouverture du modal

1. Cliquer sur le bouton "Détails" d'un apprenant
2. Ouvrir la console du navigateur (F12)
3. Vous devriez voir :
   - `🔍 Ouvrir détails pour: [userId] [displayName]`
   - `🔍 handleViewDetails appelé: {userId, displayName, sessionId}`
   - `📥 Chargement des soumissions pour: {sessionId, userId, displayName}`
   - `📥 Soumissions récupérées: {count: X, error: null}`

### 5. Vérifier l'affichage des soumissions

Le modal devrait afficher :
- Le nom de l'apprenant
- Le nombre de soumissions
- Pour chaque soumission :
  - Titre de l'item (exercice/TP)
  - Type (Exercice, TP, Activité)
  - Module
  - Statut (Soumis, Noté, Brouillon)
  - Date de soumission
  - Note (si disponible)
  - Réponse textuelle (si présente)
  - Fichier joint avec bouton de téléchargement (si présent)

## 🐛 Problèmes possibles et solutions

### Le bouton "Détails" n'apparaît pas

**Causes possibles :**
- Le serveur de développement n'a pas été redémarré
- Cache du navigateur
- Vous n'êtes pas sur la bonne page (`/trainer/session/:sessionId`)

**Solutions :**
1. Redémarrer le serveur : `Ctrl+C` puis `npm run dev`
2. Vider le cache : `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)
3. Vérifier l'URL dans la barre d'adresse

### Le modal s'ouvre mais aucune soumission n'apparaît

**Causes possibles :**
- L'apprenant n'a pas encore soumis de travaux
- Les politiques RLS ne sont pas configurées
- Erreur dans la requête

**Solutions :**
1. Vérifier la console du navigateur pour les erreurs
2. Exécuter le script SQL `fix-submissions-rls-for-trainers.sql` dans Supabase
3. Vérifier que l'apprenant a bien des soumissions dans la base de données

### Erreur lors du téléchargement de fichier

**Causes possibles :**
- Le bucket `submissions` n'existe pas
- Les politiques RLS du storage ne sont pas configurées
- Le fichier n'existe plus

**Solutions :**
1. Exécuter `fix-submissions-storage-rls.sql` dans Supabase
2. Vérifier que le bucket `submissions` existe
3. Vérifier les politiques RLS du storage

## 📋 Checklist de vérification

- [ ] Le serveur de développement tourne
- [ ] Je suis connecté en tant que formateur
- [ ] Je suis sur la page `/trainer/session/:sessionId`
- [ ] Le bouton "Détails" apparaît dans la table
- [ ] Le modal s'ouvre quand je clique sur "Détails"
- [ ] Les soumissions s'affichent correctement
- [ ] Les fichiers peuvent être téléchargés
- [ ] Les notes s'affichent correctement

## 🔧 Scripts SQL à exécuter

Si les soumissions ne s'affichent pas, exécuter dans Supabase SQL Editor :

1. `fix-submissions-rls-for-trainers.sql` - Permet aux formateurs de voir les soumissions
2. `fix-submissions-storage-rls.sql` - Permet de télécharger les fichiers

## 📞 Support

Si le problème persiste :
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs dans l'onglet Console
3. Vérifier les requêtes dans l'onglet Network
4. Vérifier les logs du serveur de développement






---


### 📄 Guide des Travaux Pratiques - Titanic Learning App

*Source: `titanic-learning-app/GUIDE-TP.md`*


---

# Guide des Travaux Pratiques - Titanic Learning App

**Application :** https://titaniclearning.netlify.app  
**Dépôt GitHub :** https://github.com/seb59520/titanic-learning-app

---

## 📚 Vue d'ensemble

Cette série de 3 Travaux Pratiques vous guide à travers l'apprentissage du Big Data, de la Data Science et du Machine Learning en utilisant le dataset Titanic.

### Structure des TP

| TP | Module | Durée | Niveau | Fichier |
|----|--------|-------|--------|---------|
| **TP 1** | Big Data | 1h30 | Débutant | [TP-01-BIG-DATA.md](./TP-01-BIG-DATA.md) |
| **TP 2** | Data Science | 2h | Intermédiaire | [TP-02-DATA-SCIENCE.md](./TP-02-DATA-SCIENCE.md) |
| **TP 3** | Machine Learning | 2h | Avancé | [TP-03-MACHINE-LEARNING.md](./TP-03-MACHINE-LEARNING.md) |

**Durée totale estimée :** 5h30

---

## 🎯 Objectifs pédagogiques globaux

À la fin de cette série de TP, vous serez capable de :

1. **Explorer des données brutes** (TP 1)
   - Identifier les types de données
   - Détecter les valeurs manquantes
   - Utiliser des filtres et tris

2. **Analyser et visualiser des données** (TP 2)
   - Interpréter des graphiques
   - Calculer des statistiques
   - Identifier des patterns

3. **Faire des prédictions et évaluer les biais** (TP 3)
   - Créer un modèle de prédiction
   - Évaluer sa performance
   - Identifier et comprendre les biais

---

## 📋 Prérequis

- Accès à l'application : https://titaniclearning.netlify.app
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Connaissances de base en mathématiques
- Curiosité et esprit critique

---

## 🚀 Comment utiliser ces TP

### Ordre recommandé

Les TP sont conçus pour être suivis dans l'ordre :
1. **Commencez par le TP 1** (Big Data) - Fondations
2. **Puis le TP 2** (Data Science) - Analyse
3. **Enfin le TP 3** (Machine Learning) - Prédictions

### Méthodologie

Pour chaque TP :
1. **Lisez** les objectifs et le contexte
2. **Ouvrez** l'application dans votre navigateur
3. **Suivez** les exercices étape par étape
4. **Répondez** aux questions dans l'application
5. **Validez** votre travail avec les critères d'évaluation
6. **Exportez** vos réponses avant de passer au suivant

### Conseils généraux

- **Prenez votre temps** : Ne vous précipitez pas
- **Notez vos observations** : Gardez un carnet de notes
- **Testez les limites** : Explorez au-delà des consignes
- **Questionnez** : Remettez en question ce que vous observez
- **Réfléchissez** : Pensez aux implications éthiques

---

## 📊 Évaluation

Chaque TP est noté sur **10 points** selon des critères spécifiques :

- **TP 1** : Réponses complètes, justesse des observations, utilisation des filtres, qualité de l'analyse
- **TP 2** : Interprétation des graphiques, justesse des conclusions, qualité de la justification, réflexion éthique
- **TP 3** : Qualité des prédictions, justification, analyse des erreurs, détection des biais, réflexion éthique

**Total possible : 30 points**

---

## 🔗 Liens utiles

### Application
- **URL principale :** https://titaniclearning.netlify.app
- **Module Big Data :** https://titaniclearning.netlify.app (onglet Big Data)
- **Module Data Science :** https://titaniclearning.netlify.app (onglet Data Science)
- **Module Machine Learning :** https://titaniclearning.netlify.app (onglet Machine Learning)

### Documentation
- **README du projet :** [README.md](./README.md)
- **Code source :** https://github.com/seb59520/titanic-learning-app

### Ressources d'apprentissage
- [Kaggle Learn](https://www.kaggle.com/learn)
- [DataCamp](https://www.datacamp.com)
- [Coursera Data Science](https://www.coursera.org/browse/data-science)

---

## ❓ Questions fréquentes

### Puis-je sauter un TP ?
Il est fortement recommandé de suivre les TP dans l'ordre, car chaque TP s'appuie sur les connaissances acquises dans les précédents.

### Que faire si je suis bloqué ?
- Relisez attentivement les consignes
- Utilisez les filtres de l'application pour explorer
- Consultez les ressources complémentaires
- Prenez des notes sur ce qui vous bloque

### Les réponses sont-elles sauvegardées ?
Oui, toutes vos réponses sont automatiquement sauvegardées dans le localStorage de votre navigateur. Vous pouvez aussi les exporter en JSON.

### Puis-je recommencer un TP ?
Oui, utilisez le bouton "Réinitialiser" dans chaque module pour remettre à zéro vos réponses et filtres.

---

## 🎓 Certification

Une fois les 3 TP terminés, vous aurez acquis :
- ✅ Des compétences en exploration de données
- ✅ Des compétences en analyse statistique
- ✅ Des compétences en évaluation de modèles
- ✅ Une compréhension des enjeux éthiques

**Félicitations pour votre parcours d'apprentissage ! 🎉**

---

## 📝 Notes pour les formateurs

Ces TP peuvent être utilisés dans un contexte pédagogique :
- **En présentiel** : Les étudiants suivent les TP en classe
- **En distanciel** : Les étudiants travaillent de manière autonome
- **En mode hybride** : Combinaison des deux approches

**Adaptation possible :**
- Ajuster la durée selon le niveau
- Ajouter des exercices bonus
- Organiser des séances de correction collective
- Créer des projets de groupe basés sur ces TP

---

**Bon apprentissage ! 🚀**



---


### 📄 📤 Guide pour les étudiants : Uploader votre JSON du TP Titanic

*Source: `titanic-learning-app/GUIDE-UPLOAD-ETUDIANTS.md`*


---

# 📤 Guide pour les étudiants : Uploader votre JSON du TP Titanic

## 🎯 Où uploader votre JSON ?

Les étudiants peuvent uploader leur JSON du TP Titanic directement dans le LMS, sur la page du TP correspondant.

### 📍 Chemin d'accès

1. **Connectez-vous au LMS** avec vos identifiants
2. **Accédez au cours** contenant le TP Titanic
3. **Cliquez sur le TP** correspondant (ex: "TP 1 : Big Data - Exploration des données brutes")
4. **Sur la page du TP**, vous verrez automatiquement une section **"Importer vos réponses depuis l'application Titanic"**

### 🔍 Détection automatique

Le système détecte automatiquement si un TP est lié à Titanic en vérifiant :
- Le titre contient "Titanic", "Big Data", "Data Science" ou "Machine Learning"
- OU le champ `content.titanicModule` est défini dans l'item

## 📋 Étapes détaillées

### Étape 1 : Exporter depuis l'application Titanic

1. Allez sur [https://titaniclearning.netlify.app](https://titaniclearning.netlify.app)
2. Accédez au module correspondant :
   - **Module 1 : Big Data** → pour le TP Big Data
   - **Module 2 : Data Science** → pour le TP Data Science
   - **Module 3 : Machine Learning** → pour le TP Machine Learning
3. Répondez aux questions dans l'application
4. Cliquez sur **"Exporter mes réponses"** en bas de la page
5. Un fichier JSON est téléchargé (ex: `big-data-reponses.json`)

### Étape 2 : Importer dans le LMS

1. **Dans le LMS**, accédez à la page du TP correspondant
2. **Trouvez la section** "Importer vos réponses depuis l'application Titanic"
3. **Cliquez sur** "Sélectionner un fichier JSON"
4. **Choisissez le fichier** que vous avez exporté depuis l'application
5. **Cliquez sur** "Importer les réponses"
6. Un message de succès confirme que vos réponses ont été importées

### Étape 3 : Vérification

Après l'importation réussie :
- ✅ Un message de confirmation s'affiche
- ✅ Vos données sont sauvegardées automatiquement
- ✅ Vous pouvez voir un résumé de vos réponses importées
- ✅ Votre formateur peut maintenant accéder à vos réponses

## 🎨 Interface utilisateur

### Avant l'importation

```
┌─────────────────────────────────────────────────┐
│ 📄 Importer vos réponses depuis l'application   │
│    Titanic                                       │
├─────────────────────────────────────────────────┤
│ Instructions :                                  │
│ 1. Exportez vos réponses depuis                 │
│    titaniclearning.netlify.app                  │
│ 2. Cliquez sur "Exporter mes réponses"          │
│ 3. Téléchargez le fichier JSON                  │
│ 4. Importez-le ici                               │
│                                                  │
│ [📎 Sélectionner un fichier JSON]               │
│                                                  │
│ [Importer les réponses]                         │
└─────────────────────────────────────────────────┘
```

### Après l'importation réussie

```
┌─────────────────────────────────────────────────┐
│ ✅ Fichier importé avec succès !                │
│    Vos réponses sont maintenant disponibles     │
│    pour votre formateur.                        │
└─────────────────────────────────────────────────┘
```

### Données importées affichées

```
┌─────────────────────────────────────────────────┐
│ 📄 Réponses importées depuis l'application      │
│    Titanic                                       │
├─────────────────────────────────────────────────┤
│ Module: big-data                                 │
│ Importé le: 15/01/2024                          │
│                                                  │
│ [▶ Voir les données importées]                  │
└─────────────────────────────────────────────────┘
```

## ⚠️ Points importants

### Conditions d'affichage

Le composant d'upload s'affiche uniquement si :
- ✅ Le TP est détecté comme étant un TP Titanic
- ✅ La soumission n'a pas encore été soumise (`status !== 'submitted'`)

### Après soumission

Une fois que vous avez soumis votre TP :
- ❌ Le composant d'upload disparaît
- ✅ Vos données importées restent visibles
- ✅ Vous pouvez toujours voir un résumé de vos réponses

### Format de fichier

- ✅ Le fichier doit être au format **JSON** (`.json`)
- ✅ Le fichier doit provenir de l'application Titanic
- ✅ Le système valide automatiquement le format

## 🔧 Dépannage

### Le composant d'upload n'apparaît pas

**Vérifiez :**
1. Le titre du TP contient "Titanic", "Big Data", "Data Science" ou "Machine Learning"
2. Vous n'avez pas déjà soumis le TP
3. Vous êtes bien connecté au LMS

**Solution :** Contactez votre formateur pour vérifier la configuration du TP.

### Erreur lors de l'importation

**Messages d'erreur possibles :**
- "Le fichier doit être au format JSON (.json)" → Vérifiez l'extension du fichier
- "Format JSON invalide" → Réexportez depuis l'application Titanic
- "Erreur lors de l'upload" → Vérifiez votre connexion internet

**Solution :** Réessayez en suivant les étapes ci-dessus.

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que vous suivez bien toutes les étapes
2. Contactez votre formateur
3. Vérifiez que vous utilisez la dernière version de l'application Titanic

## 🎓 Pour aller plus loin

- **Guide complet d'intégration** : Voir `GUIDE-TITANIC-INTEGRATION.md` dans le dossier `portal-formations`
- **Documentation technique** : Voir `TITANIC-FEATURES-SUMMARY.md`



---


## 4. Intégration


---


### 📄 🎮 Intégration de l'application Big Data Impacts dans le LMS

*Source: `INTEGRATION-LMS-BIG-DATA.md`*


---

# 🎮 Intégration de l'application Big Data Impacts dans le LMS

## 🚀 Démarrage rapide

### Étape 1 : Lancer l'application React

Dans un terminal, lancez l'application :

```bash
cd big-data-impacts-app
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

### Étape 2 : Accéder depuis le LMS

1. **Importer le TP** dans votre LMS (si ce n'est pas déjà fait)
2. **Aller dans la formation** "Big Data et Machine Learning"
3. **Ouvrir le TP** "Identifier les impacts du Big Data et de la Data Science"
4. **Dans le Module 2**, vous verrez une ressource **"🚀 Application interactive - Big Data Impacts"**
5. **Cliquer sur "Accéder à la ressource"** → L'application s'ouvre dans un nouvel onglet

## 📋 Structure dans le TP

Le TP a été modifié pour inclure directement l'application. Dans le **Module 2**, vous trouverez :

1. **TP : Application d'analyse des impacts** (instructions du TP)
2. **🚀 Application interactive - Big Data Impacts** (lien vers l'app)
3. **Exemples de cas d'usage à implémenter** (documentation)

## 🎯 Pour les étudiants

### Instructions à donner aux étudiants :

1. **Lancer l'application** (une seule fois) :
   ```bash
   cd big-data-impacts-app
   npm run dev
   ```

2. **Accéder au TP dans le LMS** :
   - Se connecter au LMS
   - Aller dans la formation
   - Ouvrir le TP
   - Cliquer sur "🚀 Application interactive - Big Data Impacts"

3. **Utiliser l'application** :
   - Créer des cas d'usage
   - Visualiser les impacts avec les graphiques
   - Comparer plusieurs cas d'usage
   - Explorer les 5 exemples pré-chargés

## 🔧 Configuration

### En développement (local)
- URL : `http://localhost:5173`
- Accessible uniquement si l'app est lancée

### En production (déploiement)
Pour déployer l'application :

1. **Build** :
   ```bash
   cd big-data-impacts-app
   npm run build
   ```

2. **Déployer** sur Netlify/Vercel :
   - Uploader le dossier `dist/`
   - Obtenir l'URL de production (ex: `https://big-data-impacts.netlify.app`)

3. **Modifier le TP** :
   - Remplacer `http://localhost:5173` par l'URL de production dans le JSON du TP

## 📝 Modifier l'URL dans le TP

Si vous voulez changer l'URL de l'application dans le TP :

1. Ouvrir `portal-formations/tp-big-data-data-science-impacts.json`
2. Chercher `"external_url": "http://localhost:5173"`
3. Remplacer par votre URL (production ou autre)

## ⚠️ Notes importantes

- **L'application doit être lancée** avant d'accéder au lien depuis le LMS
- **Les données sont sauvegardées** dans le localStorage du navigateur
- **L'application fonctionne hors ligne** après le premier chargement
- **5 cas d'usage exemples** sont pré-chargés automatiquement

## 🎓 Pour les formateurs

### Vérifier que tout fonctionne :

1. ✅ Lancer l'application React (`npm run dev` dans `big-data-impacts-app`)
2. ✅ Vérifier que l'application est accessible sur http://localhost:5173
3. ✅ Importer le TP dans le LMS
4. ✅ Tester le lien depuis le LMS

### Aider les étudiants :

- S'assurer qu'ils ont bien installé les dépendances (`npm install`)
- Vérifier qu'ils lancent l'application avant d'accéder au TP
- Leur rappeler que les données sont sauvegardées automatiquement





---


### 📄 🎮 Guide d'intégration de l'application Big Data Impacts dans le LMS

*Source: `portal-formations/GUIDE-INTEGRATION-BIG-DATA-APP.md`*


---

# 🎮 Guide d'intégration de l'application Big Data Impacts dans le LMS

## 📋 Méthode 1 : Via une ressource avec external_url (Simple)

### Étape 1 : Créer une ressource dans le TP

Dans votre TP `tp-big-data-data-science-impacts.json`, ajoutez un item de type `resource` avec un `external_url` :

```json
{
  "type": "resource",
  "title": "Application interactive - Big Data Impacts",
  "position": 3,
  "published": true,
  "external_url": "http://localhost:5173",
  "content": {
    "description": "Accédez à l'application interactive pour analyser les impacts du Big Data et de la Data Science. L'application permet de créer, visualiser et comparer des cas d'usage."
  }
}
```

### Étape 2 : Lancer l'application React

Avant d'accéder au TP dans le LMS, assurez-vous que l'application React est lancée :

```bash
cd big-data-impacts-app
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Étape 3 : Accéder depuis le LMS

1. Importez le TP dans votre LMS
2. Les étudiants verront un lien "Accéder à la ressource" qui ouvre l'application dans un nouvel onglet

## 📋 Méthode 2 : Intégration via iframe (Recommandée)

Pour une meilleure intégration, vous pouvez modifier le TP pour utiliser un iframe.

### Étape 1 : Modifier le JSON du TP

Ajoutez un item avec un contenu spécial qui sera rendu comme iframe :

```json
{
  "type": "resource",
  "title": "Application interactive - Big Data Impacts",
  "position": 3,
  "published": true,
  "content": {
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Utilisez l'application interactive ci-dessous pour analyser les impacts du Big Data et de la Data Science."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "hardBreak"
            }
          ]
        },
        {
          "type": "iframe",
          "attrs": {
            "src": "http://localhost:5173",
            "width": "100%",
            "height": "800px",
            "frameborder": "0"
          }
        }
      ]
    }
  }
}
```

## 📋 Méthode 3 : Déployer l'application (Production)

Pour un déploiement en production, vous devez :

### Option A : Déployer sur Netlify/Vercel

1. Build de l'application :
```bash
cd big-data-impacts-app
npm run build
```

2. Déployer le dossier `dist/` sur Netlify ou Vercel

3. Utiliser l'URL de production dans le TP :
```json
{
  "external_url": "https://votre-app.netlify.app"
}
```

### Option B : Servir depuis le même domaine

1. Copier le build dans le dossier public du LMS
2. Utiliser une route relative dans le TP

## 🚀 Démarrage rapide pour les étudiants

### Pour les étudiants

1. **Lancer l'application** (si en local) :
   - Ouvrir un terminal
   - Aller dans `big-data-impacts-app`
   - Lancer `npm run dev`

2. **Accéder au TP dans le LMS** :
   - Se connecter au LMS
   - Aller dans la formation "Big Data et Machine Learning"
   - Ouvrir le TP "Identifier les impacts du Big Data et de la Data Science"
   - Cliquer sur "Application interactive - Big Data Impacts"

3. **Utiliser l'application** :
   - Créer des cas d'usage
   - Visualiser les impacts
   - Comparer les cas d'usage
   - Générer des rapports

## 📝 Exemple complet d'intégration dans le TP

Voici comment ajouter l'application dans le Module 2 du TP :

```json
{
  "title": "Module 2 : TP pratique - Application interactive",
  "position": 2,
  "items": [
    {
      "type": "tp",
      "title": "TP : Application d'analyse des impacts Big Data et Data Science",
      "position": 1,
      "published": true,
      "content": {
        "instructions": { ... },
        "checklist": [ ... ]
      }
    },
    {
      "type": "resource",
      "title": "🚀 Application interactive - Big Data Impacts",
      "position": 2,
      "published": true,
      "external_url": "http://localhost:5173",
      "content": {
        "description": "Accédez à l'application interactive pour créer et analyser vos cas d'usage. L'application est pré-chargée avec 5 exemples que vous pouvez modifier ou utiliser comme référence."
      }
    },
    {
      "type": "resource",
      "title": "Exemples de cas d'usage à implémenter",
      "position": 3,
      "published": true,
      "content": { ... }
    }
  ]
}
```

## ⚠️ Notes importantes

1. **En développement** : Utilisez `http://localhost:5173`
2. **En production** : Utilisez l'URL de déploiement (Netlify, Vercel, etc.)
3. **CORS** : Si vous avez des problèmes CORS, configurez Vite pour autoriser les iframes
4. **Responsive** : L'application est responsive et fonctionne sur mobile/tablette

## 🔧 Configuration Vite pour iframe

Si vous voulez intégrer via iframe, ajoutez dans `vite.config.ts` :

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'X-Frame-Options': 'SAMEORIGIN'
    }
  }
})
```





---


### 📄 Guide d'intégration Titanic - Upload JSON et Analyse IA

*Source: `portal-formations/GUIDE-TITANIC-INTEGRATION.md`*


---

# Guide d'intégration Titanic - Upload JSON et Analyse IA

Ce guide explique comment utiliser la fonctionnalité d'upload de JSON depuis l'application Titanic et l'analyse IA pour les formateurs.

## 🎯 Fonctionnalités

### Pour les étudiants
- **Upload de JSON** : Les étudiants peuvent importer leurs réponses exportées depuis l'application Titanic directement dans le LMS
- **Validation automatique** : Le système valide le format JSON et détecte le module (Big Data, Data Science, Machine Learning)
- **Sauvegarde automatique** : Les données sont sauvegardées dans `answer_json` de la soumission

### Pour les formateurs
- **Visualisation des données** : Accès aux réponses importées par les étudiants
- **Analyse IA automatique** : Analyse intelligente des réponses avec l'IA (OpenRouter)
- **Résumé et suggestions** : Points forts, points faibles, suggestions d'amélioration
- **Score estimé** : Note estimée par l'IA (sur 20)

## 📋 Prérequis

### Configuration OpenRouter
Pour que l'analyse IA fonctionne, vous devez configurer OpenRouter :

1. Créez un compte sur [OpenRouter.ai](https://openrouter.ai/)
2. Générez une clé API dans la section "Keys"
3. Ajoutez-la dans votre fichier `.env` :
   ```env
   VITE_OPENROUTER_API_KEY=votre_cle_ici
   VITE_OPENROUTER_MODEL=google/gemini-1.5-pro
   ```
4. Redémarrez votre serveur de développement

## 🚀 Utilisation

### Pour les étudiants

1. **Compléter le TP dans l'application Titanic**
   - Accédez à https://titaniclearning.netlify.app
   - Complétez les exercices du module (Big Data, Data Science ou Machine Learning)
   - Répondez aux questions

2. **Exporter les réponses**
   - Cliquez sur "Exporter mes réponses" dans le module
   - Un fichier JSON est téléchargé (ex: `big-data-reponses.json`)

3. **Importer dans le LMS**
   - Accédez au TP correspondant dans le LMS
   - Le composant d'upload apparaît automatiquement si c'est un TP Titanic
   - Cliquez sur "Sélectionner un fichier JSON"
   - Choisissez le fichier exporté
   - Cliquez sur "Importer les réponses"
   - Les données sont sauvegardées automatiquement

### Pour les formateurs

1. **Accéder aux soumissions**
   - Allez dans **Administration** → **Formations** → Sélectionnez le cours
   - Cliquez sur "Voir les soumissions" ou accédez à `/admin/courses/{courseId}/submissions`

2. **Voir les données importées**
   - Cliquez sur "Voir" pour une soumission
   - Si des données Titanic sont présentes, un panneau spécial s'affiche
   - Vous pouvez voir les données JSON importées

3. **Analyser avec l'IA**
   - Cliquez sur "Analyser avec l'IA" dans le panneau Titanic
   - L'IA analyse les réponses et génère :
     - Un résumé global
     - Les points forts
     - Les points à améliorer
     - Des suggestions
     - Une note estimée (sur 20)
     - Une analyse détaillée

4. **Noter la soumission**
   - Utilisez l'analyse IA comme guide
   - Attribuez une note manuelle (0-100)
   - Ajoutez un feedback si nécessaire

## 🔧 Détection automatique des TP Titanic

Le système détecte automatiquement si un TP est lié à Titanic en vérifiant :
- Le titre contient "Titanic", "Big Data", "Data Science" ou "Machine Learning"
- Le champ `content.titanicModule` est défini dans l'item

### Exemple de configuration dans le JSON du cours

```json
{
  "type": "tp",
  "title": "TP 1 : Big Data - Exploration des données brutes",
  "content": {
    "titanicModule": "big-data",
    "instructions": { ... },
    "checklist": [ ... ]
  }
}
```

## 📊 Structure des données JSON

### Format Big Data / Data Science

```json
{
  "big-data-answers": {
    "q1": {
      "questionId": "q1",
      "dropdownValue": "10-30",
      "inputValue": "25",
      "timestamp": 1234567890
    },
    ...
  },
  "big-data-filters": { ... }
}
```

### Format Machine Learning

```json
{
  "answers": {
    "q1": {
      "questionId": "q1",
      "dropdownValue": "Oui",
      "inputValue": "Justification...",
      "timestamp": 1234567890
    }
  },
  "predictions": [
    {
      "passenger": { ... },
      "userPrediction": "oui",
      "justification": "...",
      "revealed": true
    },
    ...
  ]
}
```

## 🎨 Interface

### Composant d'upload (étudiant)

- Zone de drag & drop pour le fichier JSON
- Instructions claires
- Validation en temps réel
- Messages d'erreur/succès

### Panneau d'analyse (formateur)

- En-tête avec informations du module
- Bouton d'analyse IA
- Affichage structuré des résultats :
  - Résumé
  - Score estimé
  - Points forts (vert)
  - Points faibles (orange)
  - Suggestions (bleu)
  - Analyse détaillée

## 🔍 Analyse IA

### Pour Big Data / Data Science

L'IA analyse :
- La justesse des réponses
- La compréhension des concepts
- La qualité des justifications
- La complétude des réponses

### Pour Machine Learning

L'IA analyse :
- La qualité des prédictions
- La justesse des justifications
- La détection des biais
- La réflexion éthique
- Le score de prédiction

## ⚙️ Configuration avancée

### Personnaliser les questions pour l'analyse

Dans `TitanicAnalysisPanel`, vous pouvez passer les questions :

```tsx
<TitanicAnalysisPanel
  submission={submission}
  itemTitle={item.title}
  questions={[
    { id: 'q1', label: 'Combien de lignes vois-tu ?' },
    { id: 'q2', label: 'Quelles colonnes sont numériques ?' },
    ...
  ]}
/>
```

### Modifier le prompt d'analyse

Éditez `src/lib/titanicAnalyzer.ts` pour personnaliser les prompts d'analyse IA.

## 🐛 Dépannage

### L'uploader n'apparaît pas

- Vérifiez que le titre du TP contient "Titanic", "Big Data", "Data Science" ou "Machine Learning"
- Vérifiez que `item.content.titanicModule` est défini

### L'analyse IA ne fonctionne pas

- Vérifiez que `VITE_OPENROUTER_API_KEY` est configurée
- Vérifiez les logs de la console pour les erreurs
- Vérifiez que le modèle OpenRouter est disponible

### Les données ne s'affichent pas

- Vérifiez que `submission.answer_json.titanicData` existe
- Vérifiez que le format JSON est correct
- Vérifiez les logs de la console

## 📝 Notes importantes

- Les données JSON sont stockées dans `submission.answer_json.titanicData`
- L'analyse IA est stockée dans `submission.answer_json.aiAnalysis`
- Les étudiants peuvent réimporter leurs réponses (écrase les précédentes)
- Les formateurs peuvent ré-analyser les réponses à tout moment

## 🔗 Liens utiles

- **Application Titanic** : https://titaniclearning.netlify.app
- **OpenRouter** : https://openrouter.ai/
- **Documentation OpenRouter** : https://openrouter.ai/docs

---

**Bon usage ! 🚀**



---


### 📄 Guide d'intégration du Chat WebSocket dans le LMS

*Source: `portal-formations/GUIDE_INTEGRATION_CHAT.md`*


---

# Guide d'intégration du Chat WebSocket dans le LMS

Ce guide explique comment intégrer la fonctionnalité de chat en temps réel dans votre LMS pour permettre aux utilisateurs de communiquer avec les formateurs et administrateurs.

## 📋 Vue d'ensemble

Le système de chat utilise :
- **Supabase Realtime** pour les mises à jour en temps réel (WebSocket)
- **React** pour l'interface utilisateur
- **Row Level Security (RLS)** pour la sécurité des données

## 🚀 Installation

### Étape 1 : Créer la table dans Supabase

Exécutez le script SQL dans l'interface SQL de Supabase :

```bash
# Ouvrez le fichier creer-table-chat-messages.sql
# Copiez son contenu
# Exécutez-le dans l'interface SQL de Supabase
```

Ce script crée :
- La table `chat_messages` pour stocker les messages
- Les index pour améliorer les performances
- Les politiques RLS pour la sécurité
- Une fonction `get_chat_conversations` pour lister les conversations
- Une vue `chat_messages_with_profiles` pour faciliter les requêtes

### Étape 2 : Vérifier les fichiers créés

Les fichiers suivants ont été créés :
- ✅ `src/hooks/useChat.ts` - Hook React pour gérer les messages
- ✅ `src/components/ChatWidget.tsx` - Composant widget de chat
- ✅ `src/pages/Chat.tsx` - Page dédiée au chat
- ✅ `creer-table-chat-messages.sql` - Script SQL

### Étape 3 : Vérifier l'intégration dans App.tsx

Le `ChatWidget` a été ajouté dans `App.tsx` pour être disponible partout dans l'application. Vérifiez que les imports sont corrects :

```typescript
import { ChatWidget } from './components/ChatWidget'
import { Chat } from './pages/Chat'
```

Et que le widget est rendu :
```typescript
<ChatWidget />
```

## 🎯 Fonctionnalités

### Pour les étudiants

- **Bouton flottant** : Un bouton de chat apparaît en bas à droite de l'écran
- **Envoi de messages** : Les étudiants peuvent envoyer des messages aux formateurs/admins
- **Messages en temps réel** : Les nouveaux messages apparaissent instantanément
- **Notifications** : Badge avec le nombre de messages non lus
- **Page dédiée** : Accès via `/chat` pour une vue complète

### Pour les formateurs/admins

- **Liste des conversations** : Voir tous les étudiants qui ont envoyé des messages
- **Messages groupés** : Les messages sans destinataire spécifique sont visibles par tous les admins
- **Compteur de non lus** : Voir le nombre de messages non lus par conversation
- **Réponses** : Répondre directement aux étudiants

## 🔒 Sécurité (RLS)

Les politiques de sécurité Row Level Security (RLS) sont configurées pour :

1. **Lecture** :
   - Les utilisateurs voient leurs propres messages
   - Les admins/formateurs voient tous les messages
   - Les utilisateurs voient les messages qu'ils ont reçus

2. **Écriture** :
   - Les utilisateurs peuvent créer des messages
   - Les utilisateurs peuvent mettre à jour leurs propres messages
   - Les destinataires peuvent marquer les messages comme lus

## 📱 Utilisation

### Pour les étudiants

1. Cliquez sur le bouton de chat en bas à droite
2. Tapez votre message
3. Cliquez sur "Envoyer" ou appuyez sur Entrée
4. Vos messages et les réponses apparaissent en temps réel

### Pour les formateurs/admins

1. Cliquez sur le bouton de chat
2. Cliquez sur l'icône utilisateur pour voir la liste des conversations
3. Sélectionnez une conversation
4. Répondez aux messages des étudiants

## 🎨 Personnalisation

### Modifier les couleurs

Dans `ChatWidget.tsx`, modifiez les classes Tailwind :

```tsx
// En-tête
className="bg-gradient-to-r from-blue-600 to-purple-600"

// Messages envoyés
className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"

// Bouton flottant
className="bg-gradient-to-r from-blue-600 to-purple-600"
```

### Modifier la taille du widget

Dans `ChatWidget.tsx` :

```tsx
// Taille par défaut
className="h-[600px] w-96"  // Hauteur 600px, largeur 384px (w-96)

// Taille minimisée
className="h-16 w-80"  // Hauteur 64px, largeur 320px (w-80)
```

### Désactiver le widget sur certaines pages

Dans `App.tsx`, vous pouvez conditionner l'affichage :

```tsx
import { useLocation } from 'react-router-dom'

function App() {
  const location = useLocation()
  const showChat = !location.pathname.startsWith('/admin')
  
  return (
    // ...
    {showChat && <ChatWidget />}
  )
}
```

## 🔧 Configuration Supabase Realtime

Assurez-vous que Realtime est activé dans Supabase :

1. Allez dans **Project Settings** > **API**
2. Vérifiez que **Realtime** est activé
3. Dans **Database** > **Replication**, activez la réplication pour la table `chat_messages`

Ou via SQL :

```sql
-- Activer la réplication pour chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

## 📊 Requêtes utiles

### Voir toutes les conversations d'un utilisateur

```sql
SELECT * FROM get_chat_conversations('user-id-here');
```

### Compter les messages non lus

```sql
SELECT COUNT(*) 
FROM chat_messages 
WHERE recipient_id = 'user-id-here' 
  AND read_at IS NULL;
```

### Voir les messages récents

```sql
SELECT * 
FROM chat_messages_with_profiles 
ORDER BY created_at DESC 
LIMIT 50;
```

## 🐛 Dépannage

### Le widget n'apparaît pas

1. Vérifiez que `ChatWidget` est importé et rendu dans `App.tsx`
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que l'utilisateur est connecté

### Les messages ne s'affichent pas en temps réel

1. Vérifiez que Realtime est activé dans Supabase
2. Vérifiez que la réplication est activée pour `chat_messages`
3. Vérifiez la console pour les erreurs de connexion WebSocket

### Erreurs de permissions

1. Vérifiez que les politiques RLS sont correctement configurées
2. Vérifiez que l'utilisateur a bien un profil dans la table `profiles`
3. Vérifiez les logs Supabase pour les erreurs de sécurité

### Le compteur de non lus ne se met pas à jour

1. Vérifiez que la fonction `get_chat_conversations` est créée
2. Vérifiez que le hook `useChat` appelle `fetchConversations`
3. Vérifiez que `markAsRead` est appelé correctement

## 🚀 Améliorations futures

- [ ] Support des fichiers (images, documents)
- [ ] Notifications push
- [ ] Historique de conversation avec pagination
- [ ] Recherche dans les messages
- [ ] Messages épinglés
- [ ] Réactions aux messages (emoji)
- [ ] Statut de lecture (vu/lecture)
- [ ] Indicateur de frappe ("... est en train d'écrire")

## 📝 Notes importantes

- Les messages sont stockés indéfiniment dans Supabase
- Les messages avec `recipient_id = NULL` sont destinés à tous les admins/formateurs
- Le système utilise Supabase Realtime qui est basé sur WebSocket
- Les messages sont automatiquement marqués comme lus quand la conversation est ouverte

## 🔗 Ressources

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React Hooks](https://react.dev/reference/react)





---


### 📄 Guide d'intégration du TP WebSocket Chat dans le LMS

*Source: `portal-formations/INTEGRATION_LMS_WEBSOCKET.md`*


---

# Guide d'intégration du TP WebSocket Chat dans le LMS

Ce guide explique comment intégrer le TP "Application de chat avec WebSocket" dans votre application LMS.

## 📋 Fichiers fournis

1. **`tp-websocket-chat-lms.json`** : Fichier JSON au format CourseJson de votre LMS
2. **`insert-tp-websocket-chat.sql`** : Script SQL pour insérer le cours dans Supabase
3. **`solutions-websocket-chat.json`** : Solutions complètes du TP (ressource)
4. **`INTEGRATION_LMS_WEBSOCKET.md`** : Ce fichier (guide d'intégration)

## 🚀 Méthode 1 : Import via l'interface admin (recommandé)

### Étapes

1. **Accéder à l'interface d'administration**
   - Connectez-vous en tant qu'admin
   - Allez dans la section de gestion des cours

2. **Créer un nouveau cours**
   - Cliquez sur "Nouveau cours" ou "Créer un cours"
   - Sélectionnez "Éditer en JSON" ou "Import JSON"

3. **Importer le fichier JSON**
   - Ouvrez le fichier `tp-websocket-chat-lms.json`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur JSON de l'interface admin
   - Cliquez sur "Sauvegarder"

4. **Vérifier l'import**
   - Vérifiez que le cours apparaît dans la liste
   - Vérifiez que les modules et items sont créés
   - Testez l'affichage du TP pour un étudiant

5. **Ajouter les solutions (optionnel)**
   - Dans le Module 2, vous pouvez ajouter une ressource avec le contenu de `solutions-websocket-chat.json`
   - Ou créer un item de type `resource` et copier le contenu du fichier solutions

## 🗄️ Méthode 2 : Insertion directe en SQL

### Prérequis

- Accès à l'interface SQL de Supabase
- ID d'un utilisateur admin (pour `created_by`)

### Étapes

1. **Récupérer votre ID utilisateur**
   ```sql
   SELECT id, full_name, role 
   FROM profiles 
   WHERE role = 'admin' 
   LIMIT 1;
   ```
   Notez l'`id` retourné.

2. **Exécuter le script SQL**
   - Ouvrez le fichier `insert-tp-websocket-chat.sql`
   - Remplacez `'VOTRE_USER_ID_ICI'` par votre ID utilisateur
   - Exécutez le script dans l'interface SQL de Supabase

3. **Vérifier l'insertion**
   ```sql
   SELECT c.id, c.title, COUNT(m.id) as nb_modules, COUNT(i.id) as nb_items
   FROM courses c
   LEFT JOIN modules m ON m.course_id = c.id
   LEFT JOIN items i ON i.module_id = m.id
   WHERE c.title LIKE '%WebSocket%'
   GROUP BY c.id, c.title;
   ```

## 📁 Structure du cours importé

Le cours est organisé en **2 modules** :

### Module 1 : Contexte et préparation
- **Item 1** : Ressource - Introduction au TP
- **Item 2** : Ressource - Prérequis et ressources

### Module 2 : TP pratique
- **Item 1** : TP - Application de chat avec WebSocket (instructions complètes)
- **Item 2** : Ressource - Solutions complètes (optionnel, à ajouter manuellement)

## 🔧 Personnalisation

### Modifier le titre ou la description

Éditez le fichier JSON et modifiez :
```json
{
  "title": "Votre titre personnalisé",
  "description": "Votre description personnalisée"
}
```

### Ajouter des modules ou items

Ajoutez des objets dans le tableau `modules` :
```json
{
  "modules": [
    {
      "title": "Nouveau module",
      "position": 3,
      "items": [
        {
          "type": "resource",
          "title": "Nouvelle ressource",
          "position": 1,
          "content": { ... }
        }
      ]
    }
  ]
}
```

### Modifier le thème

Changez les couleurs dans `theme` :
```json
{
  "theme": {
    "primaryColor": "#VOTRE_COULEUR",
    "secondaryColor": "#VOTRE_COULEUR",
    "fontFamily": "VotrePolice"
  }
}
```

## 📝 Notes importantes

### Format des instructions du TP

Les instructions du TP sont au format **TipTap** (doc JSON). Si vous modifiez les instructions, respectez ce format :
```json
{
  "instructions": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Votre texte ici"
          }
        ]
      }
    ]
  }
}
```

### Checklist

La checklist est un simple tableau de strings :
```json
{
  "checklist": [
    "Tâche 1",
    "Tâche 2",
    "Tâche 3"
  ]
}
```

### Fichiers de solutions

Le fichier `solutions-websocket-chat.json` contient les solutions complètes avec :
- Code complet de la classe WebSocketClient
- Interface HTML/CSS/JS complète
- Explications détaillées pour chaque étape
- Guide de tests et validation

**Option 1** : Ajouter comme ressource dans le Module 2  
**Option 2** : Conserver comme fichier de référence pour les formateurs

## 🎓 Utilisation pédagogique

### Pour les étudiants

1. Les étudiants accèdent au cours via le LMS
2. Ils suivent les modules dans l'ordre
3. Ils consultent l'énoncé du TP (Item 1 du Module 2)
4. Ils réalisent le TP en suivant les instructions
5. Ils utilisent la checklist pour vérifier leur travail
6. Ils peuvent consulter les solutions après avoir terminé (si ajoutées)

### Pour les formateurs

1. Accédez aux solutions via l'interface admin (si ajoutées comme ressource)
2. Utilisez la checklist pour évaluer les travaux
3. Vérifiez que tous les points de la checklist sont implémentés
4. Testez la reconnexion et le heartbeat avec les étudiants

## 🔍 Dépannage

### Le cours n'apparaît pas après l'import

- Vérifiez que le statut est `"published"` ou changez-le en `"draft"` pour le modifier
- Vérifiez que vous êtes connecté avec un compte ayant les droits admin

### Les items ne s'affichent pas correctement

- Vérifiez que `"published": true` pour chaque item
- Vérifiez le format JSON (pas d'erreurs de syntaxe)
- Vérifiez que le type d'item est valide : `resource`, `slide`, `exercise`, `tp`, `game`

### Erreur SQL lors de l'insertion

- Vérifiez que toutes les tables existent (courses, modules, items)
- Vérifiez que l'ID utilisateur existe dans la table `profiles`
- Vérifiez que l'ID utilisateur est bien un UUID valide

### Les solutions ne s'affichent pas

- Vérifiez que le fichier `solutions-websocket-chat.json` a été ajouté comme ressource
- Vérifiez que le contenu est au format JSON valide
- Vérifiez que l'item est publié (`"published": true`)

## 📚 Ressources supplémentaires

- **Documentation MDN WebSocket** : https://developer.mozilla.org/fr/docs/Web/API/WebSocket
- **RFC 6455** : https://tools.ietf.org/html/rfc6455
- **WebSocket.org** : https://www.websocket.org/echo.html

## ✅ Checklist d'intégration

- [ ] Fichier JSON importé ou script SQL exécuté
- [ ] Cours visible dans la liste des cours
- [ ] Modules et items créés correctement
- [ ] TP accessible et fonctionnel pour les étudiants
- [ ] Solutions ajoutées (optionnel)
- [ ] Test de l'affichage du TP réussi
- [ ] Checklist visible et fonctionnelle





---


### 📄 Guide d'intégration LMS - Titanic Learning App

*Source: `titanic-learning-app/INTEGRATION-LMS.md`*


---

# Guide d'intégration LMS - Titanic Learning App

Ce guide explique comment intégrer les 3 TP (Travaux Pratiques) de l'application Titanic Learning dans votre LMS.

## 📁 Fichiers JSON disponibles

Trois fichiers JSON sont disponibles pour l'intégration dans votre LMS :

1. **`lms-titanic-big-data.json`** - TP 1 : Big Data (Exploration des données brutes)
2. **`lms-titanic-data-science.json`** - TP 2 : Data Science (Analyse et visualisation)
3. **`lms-titanic-machine-learning.json`** - TP 3 : Machine Learning (Prédictions et biais)

## 🎯 Structure des fichiers

Chaque fichier JSON contient :

- **Métadonnées du cours** : titre, description, statut, accès
- **Thème personnalisé** : couleurs et police pour chaque module
- **Module unique** : contenant les items du TP
- **Ressource d'introduction** : présentation des objectifs pédagogiques
- **TP interactif** : instructions détaillées au format TipTap JSON

## 📋 Format TipTap JSON

Les instructions sont au format **TipTap** (doc JSON), ce qui permet :
- Un rendu riche avec titres, listes, citations
- Une structure hiérarchique claire
- Une compatibilité avec les éditeurs WYSIWYG

### Exemple de structure TipTap :

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [
        {
          "type": "text",
          "text": "Titre principal"
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Texte du paragraphe"
        }
      ]
    }
  ]
}
```

## 🚀 Intégration dans votre LMS

### Méthode 1 : Import direct

1. **Connectez-vous** à votre interface d'administration LMS
2. **Accédez** à la section d'import de cours
3. **Sélectionnez** le fichier JSON correspondant
4. **Validez** l'import
5. **Vérifiez** que le cours apparaît correctement

### Méthode 2 : Import via SQL (Supabase/PostgreSQL)

Si votre LMS utilise Supabase ou PostgreSQL, vous pouvez utiliser un script SQL similaire à celui-ci :

```sql
-- Exemple d'insertion (à adapter selon votre schéma)
INSERT INTO courses (title, description, status, access_type, theme)
VALUES (
  'TP 1 : Big Data',
  'Exploration des données brutes avec le dataset Titanic',
  'published',
  'free',
  '{"primaryColor": "#3B82F6", "secondaryColor": "#8B5CF6"}'::jsonb
);
```

### Méthode 3 : API REST

Si votre LMS expose une API REST, vous pouvez utiliser `curl` ou un script pour importer :

```bash
curl -X POST https://votre-lms.com/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @lms-titanic-big-data.json
```

## 📝 Personnalisation

### Modifier le titre ou la description

Éditez le fichier JSON et modifiez :

```json
{
  "title": "Votre titre personnalisé",
  "description": "Votre description personnalisée"
}
```

### Changer les couleurs du thème

Modifiez les couleurs dans `theme` :

```json
{
  "theme": {
    "primaryColor": "#VOTRE_COULEUR_PRIMAIRE",
    "secondaryColor": "#VOTRE_COULEUR_SECONDAIRE",
    "fontFamily": "VotrePolice"
  }
}
```

### Ajouter des items supplémentaires

Ajoutez des objets dans le tableau `items` :

```json
{
  "items": [
    {
      "type": "resource",
      "title": "Nouvelle ressource",
      "position": 2,
      "published": true,
      "content": {
        "body": { /* Format TipTap JSON */ }
      }
    }
  ]
}
```

## ✅ Checklist de vérification

Avant de publier le cours dans votre LMS, vérifiez :

- [ ] Le JSON est valide (pas d'erreurs de syntaxe)
- [ ] Tous les champs requis sont présents
- [ ] Les positions sont cohérentes (0-indexed)
- [ ] Le format TipTap JSON est correct
- [ ] Les liens vers l'application sont à jour (https://titaniclearning.netlify.app)
- [ ] Les checklists sont complètes
- [ ] Le thème est cohérent avec votre charte graphique

## 🔗 Liens importants

- **Application interactive :** https://titaniclearning.netlify.app
- **Dépôt GitHub :** https://github.com/seb59520/titanic-learning-app
- **TP en Markdown :** 
  - [TP-01-BIG-DATA.md](./TP-01-BIG-DATA.md)
  - [TP-02-DATA-SCIENCE.md](./TP-02-DATA-SCIENCE.md)
  - [TP-03-MACHINE-LEARNING.md](./TP-03-MACHINE-LEARNING.md)

## 📊 Structure détaillée

### Champs du cours

- **title** (string, requis) : Titre du cours
- **description** (string, requis) : Description complète (markdown supporté)
- **status** (string, requis) : `"draft"` ou `"published"`
- **access_type** (string, requis) : `"free"`, `"paid"`, ou `"invite"`
- **price_cents** (number, optionnel) : Prix en centimes
- **currency** (string, optionnel) : Devise (ex: `"EUR"`)
- **theme** (object, optionnel) : Thème du cours

### Champs d'un module

- **title** (string, requis) : Titre du module
- **position** (number, requis) : Position dans le cours (0-indexed)
- **theme** (object, optionnel) : Thème du module
- **items** (array, requis) : Liste des items du module

### Champs d'un item TP

- **type** (string, requis) : `"tp"` pour travaux pratiques
- **title** (string, requis) : Titre de l'item
- **position** (number, requis) : Position dans le module (0-indexed)
- **published** (boolean, optionnel) : `true` par défaut
- **content** (object, requis) :
  - **description** (string) : Description de l'item
  - **instructions** (object) : Instructions au format TipTap JSON
  - **checklist** (array) : Liste des tâches à valider

## 🎓 Utilisation pédagogique

### Ordre recommandé

Les TP sont conçus pour être suivis dans l'ordre :
1. **TP 1** (Big Data) - Fondations
2. **TP 2** (Data Science) - Analyse
3. **TP 3** (Machine Learning) - Prédictions

### Durées estimées

- **TP 1** : 1h30
- **TP 2** : 2h
- **TP 3** : 2h

**Total : 5h30**

### Niveaux

- **TP 1** : Débutant
- **TP 2** : Intermédiaire
- **TP 3** : Avancé

## ❓ Questions fréquentes

### Puis-je modifier les instructions ?

Oui, vous pouvez modifier les instructions dans le champ `content.instructions`. Assurez-vous de respecter le format TipTap JSON.

### Comment ajouter des questions supplémentaires ?

Ajoutez de nouveaux items de type `"exercise"` ou `"game"` dans le tableau `items`.

### Les réponses sont-elles sauvegardées ?

Oui, dans l'application interactive, toutes les réponses sont sauvegardées automatiquement dans le localStorage du navigateur et peuvent être exportées en JSON.

### Puis-je combiner les 3 TP en un seul cours ?

Oui, vous pouvez fusionner les 3 fichiers JSON en un seul cours avec 3 modules distincts.

## 🐛 Dépannage

### Erreur : "JSON invalide"

Vérifiez la syntaxe JSON avec un validateur en ligne (jsonlint.com).

### Erreur : "Format TipTap invalide"

Assurez-vous que les instructions commencent par `{"type": "doc", "content": [...]}`.

### Les couleurs ne s'affichent pas

Vérifiez que les couleurs sont au format hexadécimal (ex: `"#3B82F6"`).

## 📞 Support

Pour toute question ou problème :
- Consultez le [README principal](./README.md)
- Ouvrez une issue sur [GitHub](https://github.com/seb59520/titanic-learning-app/issues)

---

**Bon intégration ! 🚀**



---


### 📄 Guide d'intégration du TP OpenAPI/Swagger dans le LMS

*Source: `tp-openapi-swagger/INTEGRATION_LMS.md`*


---

# Guide d'intégration du TP OpenAPI/Swagger dans le LMS

Ce guide explique comment intégrer le TP "Swagger UI / OpenAPI 3 – Création d'une API simple" dans votre application LMS.

## 📋 Fichiers fournis

1. **`tp-openapi-swagger-lms.json`** : Fichier JSON au format CourseJson de votre LMS
2. **`insert-tp-openapi-course.sql`** : Script SQL pour insérer le cours dans Supabase
3. **`INTEGRATION_LMS.md`** : Ce fichier (guide d'intégration)

## 🚀 Méthode 1 : Import via l'interface admin (recommandé)

### Étapes

1. **Accéder à l'interface d'administration**
   - Connectez-vous en tant qu'admin
   - Allez dans la section de gestion des cours

2. **Créer un nouveau cours**
   - Cliquez sur "Nouveau cours" ou "Créer un cours"
   - Sélectionnez "Éditer en JSON" ou "Import JSON"

3. **Importer le fichier JSON**
   - Ouvrez le fichier `tp-openapi-swagger-lms.json`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur JSON de l'interface admin
   - Cliquez sur "Sauvegarder"

4. **Vérifier l'import**
   - Vérifiez que le cours apparaît dans la liste
   - Vérifiez que les modules et items sont créés
   - Testez l'affichage du TP pour un étudiant

## 🗄️ Méthode 2 : Insertion directe en SQL

### Prérequis

- Accès à l'interface SQL de Supabase
- ID d'un utilisateur admin (pour `created_by`)

### Étapes

1. **Récupérer votre ID utilisateur**
   ```sql
   SELECT id, full_name, role 
   FROM profiles 
   WHERE role = 'admin' 
   LIMIT 1;
   ```
   Notez l'`id` retourné.

2. **Exécuter le script SQL**
   - Ouvrez le fichier `insert-tp-openapi-course.sql`
   - Remplacez `'VOTRE_USER_ID_ICI'` par votre ID utilisateur
   - Exécutez le script dans l'interface SQL de Supabase

3. **Vérifier l'insertion**
   ```sql
   SELECT c.id, c.title, COUNT(m.id) as nb_modules, COUNT(i.id) as nb_items
   FROM courses c
   LEFT JOIN modules m ON m.course_id = c.id
   LEFT JOIN items i ON i.module_id = m.id
   WHERE c.title LIKE '%OpenAPI%'
   GROUP BY c.id, c.title;
   ```

## 📁 Structure du cours importé

Le cours est organisé en **2 modules** :

### Module 1 : Contexte et objectifs
- **Item 1** : Ressource - Introduction au TP
- **Item 2** : Slide - Présentation des objectifs
- **Item 3** : Ressource - Prérequis et stack technique

### Module 2 : TP pratique
- **Item 1** : TP - Énoncé apprenant (instructions complètes)
- **Item 2** : Ressource - Exemples d'appels curl
- **Item 3** : Ressource - Checklist de conformité
- **Item 4** : Ressource - Documentation technique (README)

## 🔧 Personnalisation

### Modifier le titre ou la description

Éditez le fichier JSON et modifiez :
```json
{
  "title": "Votre titre personnalisé",
  "description": "Votre description personnalisée"
}
```

### Ajouter des modules ou items

Ajoutez des objets dans le tableau `modules` :
```json
{
  "modules": [
    {
      "title": "Nouveau module",
      "position": 3,
      "items": [
        {
          "type": "resource",
          "title": "Nouvelle ressource",
          "position": 1,
          "content": { ... }
        }
      ]
    }
  ]
}
```

### Modifier le thème

Changez les couleurs dans `theme` :
```json
{
  "theme": {
    "primaryColor": "#VOTRE_COULEUR",
    "secondaryColor": "#VOTRE_COULEUR",
    "fontFamily": "VotrePolice"
  }
}
```

## 📝 Notes importantes

### Format des instructions du TP

Les instructions du TP sont au format **TipTap** (doc JSON). Si vous modifiez les instructions, respectez ce format :

```json
{
  "instructions": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Votre texte ici"
          }
        ]
      }
    ]
  }
}
```

### Checklist

La checklist est un simple tableau de strings :
```json
{
  "checklist": [
    "Tâche 1",
    "Tâche 2",
    "Tâche 3"
  ]
}
```

### Fichiers externes

Le TP référence des fichiers dans le dossier `tp-openapi-swagger/` :
- `TP_ENONCE.md` : Énoncé complet
- `TP_CORRIGE.md` : Corrigé formateur
- `README.md` : Documentation technique
- `CHECKLIST.md` : Checklist de conformité

**Option 1** : Héberger ces fichiers sur un serveur et utiliser `external_url` dans les items  
**Option 2** : Copier le contenu dans le champ `content.body` des items de type `resource`

## 🎓 Utilisation pédagogique

### Pour les étudiants

1. Les étudiants accèdent au cours via le LMS
2. Ils suivent les modules dans l'ordre
3. Ils consultent l'énoncé du TP (Item 1 du Module 2)
4. Ils réalisent le TP en suivant les instructions
5. Ils utilisent la checklist pour vérifier leur travail

### Pour les formateurs

1. Accédez au corrigé via l'interface admin (si ajouté comme ressource)
2. Utilisez la grille de correction pour évaluer les travaux
3. Consultez la checklist de conformité pour vérifier la qualité

## 🔍 Dépannage

### Le cours n'apparaît pas après l'import

- Vérifiez que le statut est `"published"` ou changez-le en `"draft"` pour le modifier
- Vérifiez que vous êtes connecté avec un compte ayant les droits admin

### Les items ne s'affichent pas correctement

- Vérifiez que `"published": true` pour chaque item
- Vérifiez le format JSON (pas d'erreurs de syntaxe)
- Vérifiez que le type d'item est valide : `resource`, `slide`, `exercise`, `tp`, `game`

### Erreur SQL lors de l'insertion

- Vérifiez que toutes les tables existent (courses, modules, items)
- Vérifiez que l'ID utilisateur existe dans la table `profiles`
- Vérifiez que l'utilisateur a le rôle `admin` ou `instructor`

## 📞 Support

Pour toute question ou problème :
1. Vérifiez ce guide
2. Consultez la documentation de votre LMS
3. Vérifiez les logs Supabase pour les erreurs SQL

---

**Bon import ! 🚀**






---


### 📄 Guide de migration vers un dépôt GitHub séparé

*Source: `big-data-impacts-app/MIGRATION.md`*


---

# Guide de migration vers un dépôt GitHub séparé

Ce guide explique comment migrer l'application Big Data Impacts vers un dépôt GitHub séparé.

## 📋 Étapes de migration

### 1. Créer le dépôt GitHub

1. Allez sur [GitHub](https://github.com) et créez un nouveau dépôt
2. Nommez-le `big-data-impacts-app` (ou un autre nom de votre choix)
3. Ne cochez **pas** "Initialize this repository with a README" (on a déjà un README)

### 2. Initialiser Git dans le dossier local

```bash
cd big-data-impacts-app
git init
git add .
git commit -m "Initial commit: Application Big Data Impacts"
```

### 3. Connecter au dépôt GitHub

```bash
git remote add origin https://github.com/VOTRE-USERNAME/big-data-impacts-app.git
git branch -M main
git push -u origin main
```

### 4. Déployer sur Netlify ou Vercel

Suivez les instructions dans `DEPLOYMENT.md` pour déployer l'application.

### 5. Mettre à jour les références dans le portail

Une fois déployé, notez l'URL de production (ex: `https://big-data-impacts.netlify.app`) et mettez à jour :

#### Dans `tp-big-data-data-science-impacts.json`

Recherchez toutes les occurrences de :
```json
"external_url": "http://localhost:5174"
```

Et remplacez par :
```json
"external_url": "https://votre-url-de-production.netlify.app"
```

#### Fichiers à mettre à jour :
- `portal-formations/tp-big-data-data-science-impacts.json`
- `portal-formations/GUIDE-ACCES-APPLICATION-BIG-DATA.md`
- Toute autre documentation qui référence `localhost:5174`

### 6. Mettre à jour la documentation

Mettez à jour les guides pour refléter la nouvelle URL de production :

```markdown
# Ancien
http://localhost:5174

# Nouveau
https://votre-url-de-production.netlify.app
```

## ✅ Vérification

Après la migration :

1. ✅ L'application est accessible sur l'URL de production
2. ✅ L'application fonctionne en iframe
3. ✅ Les liens dans le JSON du cours pointent vers la production
4. ✅ La documentation est à jour

## 🔄 Déploiement continu

Une fois configuré, chaque push sur `main` déclenchera automatiquement un nouveau déploiement.

## 📝 Notes importantes

- **Ne supprimez pas** le dossier `big-data-impacts-app` du projet principal tant que la migration n'est pas complète
- **Testez** l'application en production avant de mettre à jour toutes les références
- **Gardez** une copie de sauvegarde du JSON du cours avant de le modifier

## 🆘 En cas de problème

Si quelque chose ne fonctionne pas :

1. Vérifiez que l'application est bien déployée et accessible
2. Vérifiez les headers CORS et iframe
3. Vérifiez la console du navigateur pour les erreurs
4. Ouvrez une issue sur GitHub





---


## 5. Solutions et Dépannage


---


### 📄 🔄 Solution : Le LMS affiche encore l'ancien port

*Source: `SOLUTION-CACHE-LMS.md`*


---

# 🔄 Solution : Le LMS affiche encore l'ancien port

## Problème

Le TP JSON a été mis à jour avec le port 5174, mais le LMS affiche encore le port 5173.

## ✅ Solutions

### Solution 1 : Réimporter le TP (Recommandé)

1. **Dans le LMS, allez dans l'administration**
2. **Trouvez le cours/TP** "Identifier les impacts du Big Data et de la Data Science"
3. **Supprimez l'ancien TP** (ou éditez-le)
4. **Réimportez le fichier** `tp-big-data-data-science-impacts.json`

### Solution 2 : Modifier directement dans le LMS

1. **Allez dans l'administration du LMS**
2. **Trouvez l'item** "🚀 Application interactive - Big Data Impacts"
3. **Éditez l'item**
4. **Modifiez le champ "External URL"** :
   - Ancien : `http://localhost:5173`
   - Nouveau : `http://localhost:5174`
5. **Sauvegardez**

### Solution 3 : Vider le cache du navigateur

1. **Ouvrez les outils de développement** (F12)
2. **Clic droit sur le bouton de rechargement**
3. **Sélectionnez "Vider le cache et actualiser"**

## 🔍 Vérification

Pour vérifier que le TP JSON est correct :

```bash
grep "external_url" portal-formations/tp-big-data-data-science-impacts.json
```

Doit afficher : `"external_url": "http://localhost:5174"`

## 📝 Note

Le fichier JSON est correct. Le problème vient du cache du LMS ou d'une ancienne version importée.





---


### 📄 Guide de dépannage

*Source: `big-data-impacts-app/TROUBLESHOOTING.md`*


---

# Guide de dépannage

## Erreurs de build sur Netlify

### Erreur : "Command failed with exit code 2"

#### Solution 1 : Vérifier la version de Node.js

Netlify utilise Node.js 20 par défaut. Vérifiez que votre `netlify.toml` contient :

```toml
[build.environment]
  NODE_VERSION = "20"
```

#### Solution 2 : Utiliser npm ci au lieu de npm install

Le fichier `netlify.toml` utilise maintenant `npm ci` qui est plus fiable pour les builds CI/CD :

```toml
command = "npm ci && npm run build"
```

#### Solution 3 : Vérifier les erreurs TypeScript

Si le build échoue à cause d'erreurs TypeScript, vous pouvez :

1. **Option A** : Corriger les erreurs TypeScript
   ```bash
   npm run build:check
   ```

2. **Option B** : Utiliser le build sans vérification TypeScript stricte
   Le script `build` utilise maintenant directement `vite build` sans `tsc -b`

#### Solution 4 : Vérifier les logs de build

Dans Netlify, allez dans :
- Site settings > Build & deploy > Build logs
- Vérifiez les erreurs spécifiques

### Erreurs courantes

#### "Cannot find module"

Vérifiez que toutes les dépendances sont dans `package.json` :
```bash
npm install
```

#### "Type errors"

Vérifiez les erreurs TypeScript :
```bash
npx tsc --noEmit
```

#### "Build timeout"

Si le build prend trop de temps, vérifiez :
- Les dépendances lourdes
- Les imports inutiles
- Les assets volumineux

### Commandes de débogage

```bash
# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Vérifier les erreurs ESLint
npm run lint

# Build local pour tester
npm run build

# Prévisualiser le build
npm run preview
```

### Vérifier la configuration Netlify

1. Allez dans Site settings > Build & deploy > Build settings
2. Vérifiez que :
   - Base directory : `.` (ou vide)
   - Build command : `npm ci && npm run build`
   - Publish directory : `dist`

### Logs de build détaillés

Pour obtenir plus de détails sur l'erreur :
1. Allez dans Deploys
2. Cliquez sur le déploiement qui a échoué
3. Cliquez sur "View build log"
4. Cherchez les erreurs spécifiques

### Contact

Si le problème persiste, ouvrez une issue sur GitHub avec :
- Les logs de build complets
- La version de Node.js utilisée
- Les erreurs spécifiques





---


### 📄 Guide de débogage : Erreur dans ReactItemRenderer

*Source: `portal-formations/DEBUG-ERREUR-JEU.md`*


---

# Guide de débogage : Erreur dans ReactItemRenderer

## Problème

Erreur React dans le composant `ReactItemRenderer` lors du rendu d'un jeu.

## Solutions appliquées

1. ✅ Ajout d'une vérification de sécurité dans `renderGameFromChapter`
2. ✅ Ajout d'un Error Boundary (`GameErrorBoundary`) pour capturer les erreurs React
3. ✅ Gestion des cas où `game_content` est `null` ou `undefined`

## Étapes de débogage

### 1. Vérifier la console du navigateur

Ouvrez la console (F12) et cherchez :
- Les erreurs détaillées
- Les logs commençant par `✅ Jeu "Types de fichiers JSON" enregistré`
- Les warnings sur les props manquantes

### 2. Vérifier que le jeu est bien enregistré

Dans la console, tapez :
```javascript
// Vérifier que le registre contient le jeu
import { gameRegistry } from './lib/gameRegistry'
gameRegistry.get('json-file-types')
```

Vous devriez voir un objet avec `gameType: 'json-file-types'`.

### 3. Vérifier les données du chapitre

Dans Supabase, exécutez :
```sql
SELECT 
  id,
  title,
  type,
  game_content->>'gameType' as game_type,
  game_content->'fileTypes' as file_types,
  game_content->'examples' as examples
FROM chapters
WHERE type = 'game'
ORDER BY created_at DESC
LIMIT 1;
```

Vérifiez que :
- `type` = `'game'`
- `game_type` = `'json-file-types'`
- `file_types` n'est pas `null` et contient un tableau
- `examples` n'est pas `null` et contient un tableau

### 4. Vérifier les props passées au jeu

Dans `GameRenderer.tsx`, le jeu reçoit ces props :
- `fileTypes` (depuis `game_content.fileTypes`)
- `examples` (depuis `game_content.examples`)
- `description` (depuis `game_content.description`)
- `instructions` (depuis `game_content.instructions`)
- `onScore` (callback)

### 5. Erreurs courantes

#### Erreur : "Cannot read property 'map' of undefined"

**Cause :** `fileTypes` ou `examples` est `undefined` au lieu d'un tableau vide.

**Solution :** Vérifiez que dans `game_content`, vous avez bien :
```json
{
  "fileTypes": [],
  "examples": []
}
```

#### Erreur : "Type de jeu non reconnu"

**Cause :** Le jeu n'est pas enregistré dans le registre.

**Solution :** Vérifiez que `gameRegistry.ts` importe bien `JsonFileTypesGame` et l'enregistre.

#### Erreur : "Configuration invalide"

**Cause :** La validation échoue (tableaux vides, types incorrects).

**Solution :** Vérifiez que `fileTypes` et `examples` contiennent au moins un élément.

## Test rapide

Pour tester si le jeu fonctionne, créez un chapitre avec ce JSON minimal :

```json
{
  "title": "Test JSON File Types",
  "type": "game",
  "game_content": {
    "gameType": "json-file-types",
    "description": "Test",
    "fileTypes": [
      {
        "id": "package.json",
        "name": "package.json",
        "description": "Test",
        "color": "bg-red-500"
      }
    ],
    "examples": [
      {
        "id": 1,
        "content": "{}",
        "correctType": "package.json",
        "explanation": "Test"
      }
    ]
  }
}
```

## Si l'erreur persiste

1. Vérifiez la console du navigateur pour l'erreur complète
2. Vérifiez que tous les fichiers sont bien sauvegardés
3. Redémarrez le serveur de développement (`npm run dev`)
4. Videz le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)






---


### 📄 Debug : Erreur "Type d'élément non supporté" pour les slides

*Source: `portal-formations/DEBUG-SLIDE-TYPE.md`*


---

# Debug : Erreur "Type d'élément non supporté" pour les slides

## ✅ Vérifications effectuées

1. **Contrainte CHECK** : ✅ Correcte - inclut bien `'slide'`
2. **Code frontend** : ✅ Correct - le switch case inclut bien `case 'slide':`

## 🔍 Prochaines étapes de diagnostic

### Étape 1 : Vérifier les items en base

Exécutez le script `check-items-type.sql` pour voir :
- Si les items ont bien le type `'slide'`
- S'il y a des espaces ou caractères invisibles
- Les statistiques sur les types

### Étape 2 : Vérifier dans la console du navigateur

1. Ouvrez la console (F12)
2. Allez sur la page de l'item qui pose problème
3. Ajoutez temporairement ce code dans la console :

```javascript
// Si vous êtes sur ItemView
// Vérifier l'item chargé
console.log('Item type:', item?.type);
console.log('Item type length:', item?.type?.length);
console.log('Item type charCode:', item?.type?.charCodeAt(0));
console.log('Item:', JSON.stringify(item, null, 2));
```

### Étape 3 : Vérifier le type exact en base

Pour un item spécifique (remplacez l'ID) :

```sql
SELECT 
  id,
  type,
  title,
  -- Vérifier le type caractère par caractère
  LENGTH(type) as type_length,
  -- Vérifier les codes ASCII
  ASCII(SUBSTRING(type, 1, 1)) as first_char,
  ASCII(SUBSTRING(type, 2, 1)) as second_char,
  ASCII(SUBSTRING(type, 3, 1)) as third_char,
  ASCII(SUBSTRING(type, 4, 1)) as fourth_char,
  ASCII(SUBSTRING(type, 5, 1)) as fifth_char,
  -- Vérifier en hexadécimal
  encode(type::bytea, 'hex') as type_hex
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

Le type `'slide'` devrait avoir :
- `type_length = 5`
- `first_char = 115` (s)
- `second_char = 108` (l)
- `third_char = 105` (i)
- `fourth_char = 100` (d)
- `fifth_char = 101` (e)
- `type_hex = 736c696465`

### Étape 4 : Corriger si nécessaire

Si le type n'est pas exactement `'slide'` :

```sql
-- Corriger le type
UPDATE items
SET type = 'slide'
WHERE id = 'VOTRE_ITEM_ID'
  AND LOWER(TRIM(type)) = 'slide';
```

### Étape 5 : Vérifier le typage TypeScript

Vérifiez que l'interface `Item` dans `src/types/database.ts` inclut bien `'slide'` :

```typescript
export type ItemType = 'resource' | 'slide' | 'exercise' | 'activity' | 'tp' | 'game';
```

## 🐛 Causes possibles

1. **Type avec espaces** : `' slide '` au lieu de `'slide'`
2. **Type en majuscules** : `'Slide'` au lieu de `'slide'`
3. **Caractères invisibles** : caractères Unicode invisibles
4. **Problème de cache** : le navigateur cache une ancienne version
5. **Problème de typage** : TypeScript ne reconnaît pas le type

## 🛠️ Solutions rapides

### Solution 1 : Forcer la correction du type

```sql
-- Corriger tous les slides
UPDATE items
SET type = 'slide'
WHERE LOWER(TRIM(type)) = 'slide'
  AND type != 'slide';
```

### Solution 2 : Recréer l'item

Si l'item est corrompu, supprimez-le et recréez-le via l'interface ou le JSON.

### Solution 3 : Vider le cache

1. Videz le cache du navigateur (Ctrl+Shift+Delete)
2. Rechargez la page en forçant le rafraîchissement (Ctrl+F5)

## 📋 Checklist finale

- [ ] Le type en base est exactement `'slide'` (5 caractères, minuscules)
- [ ] Pas d'espaces avant/après le type
- [ ] Pas de caractères invisibles
- [ ] Le cache du navigateur est vidé
- [ ] Le code TypeScript inclut `'slide'` dans `ItemType`
- [ ] L'item est bien chargé depuis la base (vérifier dans la console)

## 🎯 Test final

Créez un item de test directement en SQL :

```sql
INSERT INTO items (module_id, type, title, position, published, content)
VALUES (
  (SELECT id FROM modules LIMIT 1),
  'slide',
  'Test Slide Debug',
  999,
  true,
  '{"body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test"}]}]}}'::jsonb
)
RETURNING id, type, title;
```

Puis vérifiez qu'il s'affiche correctement. Si ce test fonctionne, le problème vient de l'item spécifique, pas du système.






---


### 📄 Debug : Erreur "Type d'élément non supporté" pour les slides

*Source: `portal-formations/DEBUG-TYPE-SLIDE.md`*


---

# Debug : Erreur "Type d'élément non supporté" pour les slides

## 🔍 Diagnostic

L'erreur "Type d'élément non supporté" apparaît dans les composants suivants :
- `ItemRenderer.tsx` (ligne 1184)
- `ReactItemRenderer.tsx` (ligne 185)
- `ReactRenderer.tsx` (ligne 407)

## ✅ Types valides

D'après le code, les types valides sont :
- `'resource'`
- `'slide'`
- `'exercise'`
- `'activity'` (ajouté via `add-activity-type-to-items.sql`)
- `'tp'`
- `'game'`

## 🐛 Causes possibles

### 1. Type non reconnu dans le switch case

Le switch case vérifie :
```typescript
switch (item.type) {
  case 'resource': ...
  case 'slide': ...
  case 'exercise':
  case 'activity': ...
  case 'tp': ...
  case 'game': ...
  default:
    return <p>Type d'élément non supporté.</p>
}
```

**Solution** : Vérifier que `item.type` est exactement `'slide'` (minuscules, pas d'espaces).

### 2. Type stocké incorrectement en base

Vérifier dans la base de données :
```sql
SELECT id, type, title 
FROM items 
WHERE type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game');
```

### 3. Type avec espaces ou majuscules

Le type peut être stocké avec des espaces ou en majuscules. Vérifier :
```sql
SELECT id, type, title, LENGTH(type) as type_length
FROM items 
WHERE id = 'VOTRE_ITEM_ID';
```

## 🔧 Solutions

### Solution 1 : Vérifier le type en base de données

```sql
-- Vérifier tous les types d'items
SELECT DISTINCT type, COUNT(*) 
FROM items 
GROUP BY type;

-- Vérifier un item spécifique
SELECT id, type, title, content
FROM items
WHERE title LIKE '%Architecture client%';
```

### Solution 2 : Corriger le type en base

Si le type est incorrect :
```sql
UPDATE items
SET type = 'slide'
WHERE type = 'Slide' OR type = ' SLIDE ' OR type = 'slide ';
```

### Solution 3 : Vérifier la contrainte CHECK

S'assurer que la contrainte inclut bien 'slide' :
```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conname LIKE '%type%';
```

### Solution 4 : Vérifier dans le code frontend

Dans la console du navigateur, vérifier :
```javascript
// Dans ItemRenderer ou ReactItemRenderer
console.log('Item type:', item.type, 'Type of:', typeof item.type);
console.log('Item:', item);
```

## 📝 Checklist de vérification

- [ ] Le JSON utilise bien `"type": "slide"` (minuscules)
- [ ] Le type est bien sauvegardé en base de données
- [ ] La contrainte CHECK de la base inclut 'slide'
- [ ] Le type n'a pas d'espaces avant/après
- [ ] Le type n'est pas en majuscules
- [ ] L'item est bien chargé depuis la base

## 🎯 Test rapide

Créer un item de test directement en SQL :
```sql
INSERT INTO items (module_id, type, title, position, published, content)
VALUES (
  'VOTRE_MODULE_ID',
  'slide',
  'Test slide',
  1,
  true,
  '{"body": {"type": "doc", "content": []}}'::jsonb
)
RETURNING id, type;
```

Puis vérifier qu'il s'affiche correctement dans l'interface.






---


### 📄 Dépannage : Erreur "Load failed" lors du téléchargement PDF

*Source: `portal-formations/DEPANNAGE-PDF.md`*


---

# Dépannage : Erreur "Load failed" lors du téléchargement PDF

## 🔍 Diagnostic

L'erreur "Load failed" peut avoir plusieurs causes. Suivez ces étapes pour identifier le problème :

### 1. Vérifier que le serveur backend est démarré

Le serveur backend doit être en cours d'exécution pour générer le PDF.

**Vérification :**
```bash
# Option 1 : Depuis la racine du projet
npm run dev:server

# Option 2 : Depuis le dossier server/
cd server
npm run dev
# ou
npm run dev:server
```

Le serveur doit démarrer sur `http://localhost:3001` (ou le port configuré).

**Vérifier que le serveur répond :**
```bash
curl http://localhost:3001/health
```

Vous devriez recevoir une réponse JSON avec `{"status":"ok"}`.

### 2. Vérifier les variables d'environnement

Le serveur backend a besoin des variables d'environnement Supabase.

**Créer un fichier `.env` dans le dossier `server/` :**
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

**Ou utiliser les variables système :**
```bash
export VITE_SUPABASE_URL=https://votre-projet.supabase.co
export VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

### 3. Vérifier l'URL de l'API dans le frontend

Par défaut, le frontend utilise `http://localhost:3001`. Si votre serveur backend est sur un autre port ou une autre URL, configurez la variable d'environnement :

**Créer un fichier `.env` à la racine du projet :**
```env
VITE_API_URL=http://localhost:3001
```

**Ou pour la production :**
```env
VITE_API_URL=https://votre-api.com
```

### 4. Vérifier que Puppeteer est installé

Puppeteer est nécessaire pour générer le PDF.

**Vérification :**
```bash
cd server
npm list puppeteer
```

**Installation si manquant :**
```bash
cd server
npm install puppeteer
```

### 5. Vérifier les logs

**Côté frontend (console du navigateur) :**
Ouvrez la console du navigateur (F12) et regardez les logs qui commencent par `📥` ou `❌`.

**Côté backend (terminal du serveur) :**
Regardez les logs qui commencent par `[PDF]`.

## 🐛 Solutions aux erreurs courantes

### Erreur : "Impossible de se connecter au serveur"

**Causes possibles :**
1. Le serveur backend n'est pas démarré
2. L'URL de l'API est incorrecte
3. Problème CORS

**Solutions :**
1. Démarrer le serveur backend : `cd server && npm run dev:server`
2. Vérifier l'URL dans `.env` : `VITE_API_URL=http://localhost:3001`
3. Vérifier la configuration CORS dans `server/src/server.ts`

### Erreur : "Configuration Supabase manquante"

**Cause :** Les variables d'environnement Supabase ne sont pas configurées dans le serveur backend.

**Solution :**
```bash
cd server
# Créer un fichier .env
echo "VITE_SUPABASE_URL=https://votre-projet.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=votre-clé-anon" >> .env
```

### Erreur : "Le téléchargement PDF n'est pas activé"

**Cause :** La case "Autoriser le téléchargement PDF" n'est pas cochée dans les paramètres du cours.

**Solution :**
1. Aller dans `/admin/courses/:courseId`
2. Cocher "Autoriser le téléchargement PDF du cours complet"
3. Sauvegarder le cours

### Erreur : "Aucune slide trouvée"

**Cause :** Le cours ne contient pas de slides publiées.

**Solution :**
1. Vérifier que le cours contient des modules avec des slides
2. Vérifier que les slides sont publiées (`published: true`)

### Erreur : "Erreur Puppeteer" ou "browser"

**Cause :** Puppeteer n'est pas installé ou ne peut pas lancer Chrome/Chromium.

**Solutions :**
1. Installer Puppeteer : `cd server && npm install puppeteer`
2. Sur Linux, installer les dépendances système :
   ```bash
   sudo apt-get update
   sudo apt-get install -y \
     ca-certificates \
     fonts-liberation \
     libappindicator3-1 \
     libasound2 \
     libatk-bridge2.0-0 \
     libatk1.0-0 \
     libc6 \
     libcairo2 \
     libcups2 \
     libdbus-1-3 \
     libexpat1 \
     libfontconfig1 \
     libgbm1 \
     libgcc1 \
     libglib2.0-0 \
     libgtk-3-0 \
     libnspr4 \
     libnss3 \
     libpango-1.0-0 \
     libpangocairo-1.0-0 \
     libstdc++6 \
     libx11-6 \
     libx11-xcb1 \
     libxcb1 \
     libxcomposite1 \
     libxcursor1 \
     libxdamage1 \
     libxext6 \
     libxfixes3 \
     libxi6 \
     libxrandr2 \
     libxrender1 \
     libxss1 \
     libxtst6 \
     lsb-release \
     wget \
     xdg-utils
   ```

### Erreur : "Timeout"

**Cause :** La génération du PDF prend trop de temps.

**Solutions :**
1. Vérifier les ressources du serveur (CPU, mémoire)
2. Réduire le nombre de slides dans le cours
3. Vérifier que les images sont accessibles rapidement

## 📋 Checklist de vérification

Avant de signaler un problème, vérifiez :

- [ ] Le serveur backend est démarré (`npm run dev:server` dans `server/`)
- [ ] Les variables d'environnement Supabase sont configurées dans `server/.env`
- [ ] Puppeteer est installé (`npm list puppeteer` dans `server/`)
- [ ] La case "Autoriser le téléchargement PDF" est cochée dans les paramètres du cours
- [ ] Le cours contient au moins une slide publiée
- [ ] L'URL de l'API est correcte dans `.env` (frontend) : `VITE_API_URL=http://localhost:3001`
- [ ] Les logs dans la console du navigateur et du serveur sont consultés

## 🔧 Test manuel de l'API

Vous pouvez tester l'API directement avec curl :

```bash
# Récupérer votre token d'authentification depuis la console du navigateur
# (dans Application > Local Storage > sb-auth-token)

TOKEN="votre-token-ici"
COURSE_ID="votre-course-id"

curl -X GET \
  "http://localhost:3001/api/courses/${COURSE_ID}/pdf" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o test.pdf
```

Si cela fonctionne avec curl mais pas depuis le frontend, le problème vient probablement de :
- La configuration CORS
- L'URL de l'API dans le frontend
- Le token d'authentification

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :

1. Vérifiez les logs complets (frontend et backend)
2. Vérifiez la version de Node.js : `node --version` (doit être >= 18)
3. Vérifiez que toutes les dépendances sont installées : `npm install` dans `server/`
4. Partagez les logs d'erreur complets pour un diagnostic plus approfondi




---


### 📄 Diagnostic : Pourquoi mon jeu n'apparaît pas dans un chapitre ?

*Source: `portal-formations/DIAGNOSTIC-JEU-CHAPITRE.md`*


---

# Diagnostic : Pourquoi mon jeu n'apparaît pas dans un chapitre ?

## ✅ Checklist de vérification

### 1. Vérifier dans Supabase (Table Editor → `chapters`)

Votre chapitre doit avoir :
- ✅ `type` = `'game'` (pas `'content'` ou `null`)
- ✅ `game_content` contient un JSON valide avec :
  - `gameType: "format-files"`
  - `levels: [...]` (tableau avec au moins 1 niveau)

**Requête SQL pour vérifier :**
```sql
SELECT 
  id,
  title,
  type,
  CASE 
    WHEN game_content IS NULL THEN 'NULL'
    WHEN game_content->>'gameType' IS NULL THEN 'Pas de gameType'
    ELSE game_content->>'gameType'
  END as game_type,
  CASE 
    WHEN game_content->'levels' IS NULL THEN 'Pas de levels'
    WHEN jsonb_array_length(game_content->'levels') = 0 THEN 'Levels vide'
    ELSE jsonb_array_length(game_content->'levels')::text || ' niveaux'
  END as levels_status
FROM chapters
WHERE type = 'game'
ORDER BY position;
```

### 2. Vérifier dans la console du navigateur

1. Ouvrez la console (F12)
2. Rechargez la page avec le chapitre
3. Développez le chapitre de jeu
4. Cherchez les logs qui commencent par :
   - `=== Chapters fetched ===`
   - `renderGame called with gameContent:`
   - `FormatFilesGame initialized`

**Ce que vous devriez voir :**
```
=== Chapters fetched ===
Chapter 4: {
  id: "...",
  title: "Jeu : Formats de fichiers",
  type: "game",
  hasGameContent: true,
  gameContentType: "object",
  gameContent: { gameType: "format-files", levels: [...] }
}
```

### 3. Vérifier que le chapitre est développé

- Le chapitre doit être cliqué pour se développer
- Vous devriez voir le contenu du jeu apparaître en dessous

### 4. Vérifier les erreurs dans la console

Cherchez les erreurs en rouge qui pourraient bloquer le rendu.

## 🔧 Solutions selon le problème

### Problème 1 : `type` n'est pas `'game'`

**Solution :**
```sql
UPDATE chapters
SET type = 'game'
WHERE id = '<CHAPTER_ID>';
```

### Problème 2 : `game_content` est NULL

**Solution :** Sauvegardez le JSON via l'éditeur JSON du chapitre.

### Problème 3 : `game_content` n'a pas `gameType`

**Solution :** Vérifiez que votre JSON contient bien `"gameType": "format-files"` à la racine.

### Problème 4 : `game_content` n'a pas `levels` ou `levels` est vide

**Solution :** Vérifiez que votre JSON contient bien `"levels": [...]` avec au moins un niveau.

### Problème 5 : Le chapitre n'est pas visible

**Solution :** Vérifiez que vous êtes sur la bonne page (vue item ou vue cours).

## 📋 Format exact à mettre dans `game_content`

Copiez ceci dans la colonne `game_content` :

```json
{
  "gameType": "format-files",
  "description": "Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf",
  "instructions": "Répondez aux questions pour progresser dans les 3 niveaux de difficulté",
  "levels": [
    {
      "level": 1,
      "name": "Découverte",
      "questions": [
        {
          "id": "q1-1",
          "type": "identify-format",
          "prompt": "Quel est ce format de données ?",
          "snippet": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
          "options": ["JSON", "XML", "Protobuf"],
          "answer": "JSON",
          "explanation": "C'est du JSON.",
          "difficulty": 1
        }
      ]
    }
  ]
}
```

## 🚀 Test rapide

Exécutez ce SQL pour créer un chapitre de test :

```sql
-- Trouver un item_id de test
SELECT id FROM items LIMIT 1;

-- Créer un chapitre de jeu de test (remplacez <ITEM_ID>)
INSERT INTO chapters (item_id, title, type, position, game_content)
VALUES (
  '<ITEM_ID>',
  'Test Jeu Format Files',
  'game',
  0,
  '{
    "gameType": "format-files",
    "description": "Test",
    "instructions": "Test",
    "levels": [
      {
        "level": 1,
        "name": "Test",
        "questions": [
          {
            "id": "test-1",
            "type": "identify-format",
            "prompt": "Quel format ?",
            "snippet": "{}",
            "options": ["JSON", "XML", "Protobuf"],
            "answer": "JSON",
            "explanation": "Test",
            "difficulty": 1
          }
        ]
      }
    ]
  }'::jsonb
);
```

Ensuite, allez sur la page de l'item et vérifiez si le jeu apparaît.






---


### 📄 Diagnostic et correction du timeout de profil

*Source: `portal-formations/DIAGNOSTIC-PROFILE-TIMEOUT.md`*


---

# Diagnostic et correction du timeout de profil

## Problème

L'erreur `Profile fetch timeout` indique que la requête vers la table `profiles` prend plus de 10 secondes ou est bloquée.

## Causes possibles

1. **Policies RLS récursives** : Les policies RLS peuvent créer une récursion infinie
2. **Profil manquant** : Le profil n'existe pas dans la base de données
3. **Problème réseau** : Connexion lente vers Supabase
4. **Session invalide** : La session Supabase est corrompue

## Solutions

### Solution 1 : Vérifier et corriger les policies RLS

Exécutez le script `fix-rls-recursion.sql` dans Supabase SQL Editor :

```sql
-- Vérifier si la fonction is_admin existe
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'is_admin'
);

-- Si elle n'existe pas, la créer
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifier les policies actuelles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Recréer les policies sans récursion
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin(auth.uid()));
```

### Solution 2 : Vérifier si le profil existe

Dans Supabase SQL Editor, exécutez :

```sql
-- Remplacer 'votre-user-id' par l'ID de l'utilisateur (visible dans la console)
SELECT * FROM profiles WHERE id = 'votre-user-id';

-- Si le profil n'existe pas, le créer
INSERT INTO profiles (id, role, full_name)
VALUES ('votre-user-id', 'student', 'Nom Utilisateur')
ON CONFLICT (id) DO NOTHING;
```

### Solution 3 : Vérifier la session

Dans la console du navigateur (F12), vérifiez :

```javascript
// Vérifier la session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// Vérifier l'ID utilisateur
console.log('User ID:', session?.user?.id)
```

### Solution 4 : Tester la requête directement

Dans Supabase SQL Editor, testez la requête avec votre ID utilisateur :

```sql
-- Remplacer 'votre-user-id' par votre ID
SELECT * FROM profiles WHERE id = 'votre-user-id';
```

Si cette requête prend du temps, c'est un problème de base de données ou de policies RLS.

### Solution 5 : Nettoyer et recréer le profil

Si le profil est corrompu :

```sql
-- Supprimer le profil (ATTENTION : cela supprimera toutes les données associées)
DELETE FROM profiles WHERE id = 'votre-user-id';

-- Recréer le profil
INSERT INTO profiles (id, role, full_name, created_at, updated_at)
VALUES (
  'votre-user-id',
  'student',
  'Nom Utilisateur',
  NOW(),
  NOW()
);
```

## Corrections apportées dans le code

1. **Timeout augmenté** : De 5 à 10 secondes
2. **Utilisation de `maybeSingle()`** : Au lieu de `single()` pour éviter les erreurs si le profil n'existe pas
3. **Meilleure gestion des erreurs** : Distinction entre timeout, profil manquant, et erreurs réseau
4. **Logs améliorés** : Pour faciliter le diagnostic

## Test après correction

1. Ouvrir la console du navigateur (F12)
2. Se connecter
3. Vérifier les logs :
   - `Fetching profile for user: ...`
   - `Profile fetched successfully: ...` ou `No profile found for user: ...`
4. Si le timeout persiste, vérifier les policies RLS avec la Solution 1

## Notes importantes

- Le timeout de 10 secondes est une mesure de sécurité
- Si le problème persiste, c'est probablement un problème de policies RLS
- Un profil manquant n'empêche plus l'utilisation de l'application
- Les logs dans la console aideront à identifier le problème exact






---


### 📄 Correction du problème d'accès aux formations

*Source: `portal-formations/FIX-ACCES-FORMATIONS.md`*


---

# Correction du problème d'accès aux formations

## Problème identifié

**Symptôme** : Message fréquent "Vous n'avez pas accès à cette formation" même pour les formations gratuites.

**Cause** : La vérification d'accès était trop stricte et exigeait toujours un enrollment actif, même pour :
- Les formations gratuites et publiées
- Les créateurs de formations
- Les formations que l'utilisateur a créées

## Corrections apportées

### 1. Logique d'accès améliorée

**Avant** :
```typescript
// Vérification stricte : enrollment obligatoire pour tous
if (!enrollment) {
  setError('Vous n\'avez pas accès à cette formation.')
  return
}
```

**Après** :
```typescript
// Vérification intelligente selon le type de formation
if (profile?.role !== 'admin' && user?.id) {
  // 1. Le créateur a toujours accès
  if (courseData.created_by === user.id) {
    // Accès autorisé
  }
  // 2. Les formations gratuites et publiées sont accessibles à tous
  else if (courseData.access_type === 'free' && courseData.status === 'published') {
    // Créer automatiquement un enrollment si nécessaire
    if (!existingEnrollment) {
      await supabase.from('enrollments').insert({...})
    }
  }
  // 3. Pour les autres formations, vérifier l'enrollment
  else {
    if (!enrollment) {
      setError('Vous n\'avez pas accès à cette formation.')
      return
    }
  }
}
```

### 2. Inscription automatique pour les formations gratuites

- Les formations gratuites et publiées créent automatiquement un enrollment
- Plus besoin d'inscription manuelle pour les formations gratuites
- L'enrollment est créé à la première visite

### 3. Accès pour les créateurs

- Les créateurs de formations ont toujours accès, même sans enrollment
- Fonctionne pour les admins et les instructeurs

### 4. Récupération des données complètes

- Récupération de `access_type`, `status`, et `created_by` dans les requêtes
- Permet de prendre les bonnes décisions d'accès

## Fichiers modifiés

1. **`src/pages/CourseView.tsx`**
   - Logique d'accès améliorée
   - Inscription automatique pour les formations gratuites
   - Accès pour les créateurs

2. **`src/pages/ItemView.tsx`**
   - Même logique d'accès améliorée
   - Récupération des données complètes de la formation

## Types d'accès gérés

### 1. Admins
- ✅ Accès à toutes les formations (pas de vérification)

### 2. Créateurs
- ✅ Accès à leurs propres formations (pas besoin d'enrollment)

### 3. Formations gratuites et publiées
- ✅ Accessibles à tous les utilisateurs connectés
- ✅ Enrollment créé automatiquement à la première visite

### 4. Formations payantes ou sur invitation
- ✅ Nécessitent un enrollment actif
- ✅ Vérification stricte de l'enrollment

## Test

1. **Test avec formation gratuite** :
   - Créer une formation avec `access_type: 'free'` et `status: 'published'`
   - Se connecter en tant qu'utilisateur normal
   - Accéder à la formation
   - ✅ Devrait fonctionner sans erreur
   - ✅ Un enrollment devrait être créé automatiquement

2. **Test avec créateur** :
   - Créer une formation
   - Se connecter avec le compte créateur
   - Accéder à la formation
   - ✅ Devrait fonctionner même sans enrollment

3. **Test avec admin** :
   - Se connecter en tant qu'admin
   - Accéder à n'importe quelle formation
   - ✅ Devrait fonctionner sans vérification

4. **Test avec formation payante** :
   - Créer une formation avec `access_type: 'paid'`
   - Se connecter sans enrollment
   - Accéder à la formation
   - ✅ Devrait afficher "Vous n'avez pas accès à cette formation"

## Notes importantes

- Les enrollments automatiques sont créés avec `source: 'manual'` et `status: 'active'`
- Les formations doivent être `published` pour être accessibles (sauf pour les créateurs)
- Les formations en `draft` ne sont accessibles qu'aux créateurs et admins
- La vérification se fait avant le chargement du contenu pour éviter les requêtes inutiles

## Migration

Si vous avez des utilisateurs qui ont été bloqués par l'ancienne logique :

1. **Pour les formations gratuites** : Les enrollments seront créés automatiquement à la prochaine visite
2. **Pour les créateurs** : Ils peuvent maintenant accéder à leurs formations sans enrollment
3. **Pour les admins** : Aucun changement, ils avaient déjà accès

## Prochaines améliorations possibles

- Page d'inscription pour les formations payantes
- Système de paiement intégré
- Gestion des invitations pour les formations sur invitation
- Notification lors de la création automatique d'enrollment






---


### 📄 Correction du rôle Admin

*Source: `portal-formations/FIX-ADMIN-ROLE.md`*


---

# Correction du rôle Admin

## Problème
Votre utilisateur est défini comme admin dans la base de données mais apparaît comme étudiant dans l'application.

## Solutions

### Solution 1 : Vérifier et corriger via SQL (Recommandé)

1. **Connectez-vous à Supabase** et allez dans l'éditeur SQL

2. **Trouvez votre User ID** :
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

3. **Vérifiez votre profil actuel** (remplacez `VOTRE_USER_ID` par votre ID) :
```sql
SELECT id, role, full_name, created_at 
FROM profiles 
WHERE id = 'VOTRE_USER_ID';
```

4. **Mettez à jour le rôle en admin** :
```sql
UPDATE profiles 
SET role = 'admin'
WHERE id = 'VOTRE_USER_ID';
```

5. **Vérifiez que ça a fonctionné** :
```sql
SELECT id, role, full_name, created_at 
FROM profiles 
WHERE id = 'VOTRE_USER_ID';
```

6. **Si le profil n'existe pas**, créez-le :
```sql
INSERT INTO profiles (id, role, full_name)
VALUES (
  'VOTRE_USER_ID',
  'admin',
  'Votre Nom'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
```

### Solution 2 : Utiliser la page de débogage

1. **Accédez à la page de débogage** : `/debug-profile`
   - Cette page affiche toutes les informations sur votre profil
   - Elle compare le profil dans le contexte React avec celui de la base de données
   - Elle permet de forcer la mise à jour du rôle

2. **Actions disponibles** :
   - **Rafraîchir depuis la DB** : Recharge le profil depuis la base de données
   - **Rafraîchir le contexte** : Met à jour le contexte React
   - **Forcer le rôle à 'admin'** : Met à jour directement le rôle dans la DB

3. **Après avoir mis à jour** :
   - Cliquez sur "Rafraîchir le contexte"
   - Rechargez la page (F5)
   - Déconnectez-vous et reconnectez-vous si nécessaire

### Solution 3 : Utiliser le script SQL fourni

Un fichier `fix-admin-role.sql` a été créé avec toutes les requêtes nécessaires. Ouvrez-le et suivez les instructions étape par étape.

## Vérification

Après avoir appliqué une solution :

1. **Déconnectez-vous** de l'application
2. **Reconnectez-vous**
3. **Vérifiez votre profil** : `/profile`
4. **Vérifiez que vous avez accès** à `/admin`

## Causes possibles

1. **Le trigger automatique** : Lors de la création d'un utilisateur, un trigger crée automatiquement un profil avec le rôle 'student'. Si vous avez créé votre compte normalement, le profil a été créé avec 'student'.

2. **Le profil n'existe pas** : Si le profil n'existe pas dans la table `profiles`, l'application ne peut pas déterminer votre rôle.

3. **Cache du navigateur** : Parfois, le navigateur peut mettre en cache l'ancien profil.

## Prévention

Pour éviter ce problème à l'avenir :

1. **Créez d'abord l'utilisateur dans auth.users**
2. **Créez ensuite le profil avec le bon rôle** :
```sql
INSERT INTO profiles (id, role, full_name)
VALUES ('user_id', 'admin', 'Nom Admin');
```

Ou utilisez le script `create-admin-profile.sql` fourni.

## Debug

Si le problème persiste :

1. Ouvrez la console du navigateur (F12)
2. Regardez les logs qui commencent par "Profile fetched successfully"
3. Vérifiez que le rôle affiché est bien 'admin'
4. Utilisez la page `/debug-profile` pour voir toutes les informations






---


### 📄 Correction du problème de rechargement de page

*Source: `portal-formations/FIX-AUTH-RELOAD.md`*


---

# Correction du problème de rechargement de page

## Problème identifié

L'application se bloquait au chargement lors du rafraîchissement d'une page alors que l'utilisateur était connecté.

## Causes identifiées

1. **État de chargement bloqué** : Le `loading` pouvait rester à `true` indéfiniment si une erreur survenait lors de la récupération du profil
2. **Pas de timeout** : Aucun mécanisme de sécurité pour forcer la fin du chargement
3. **Gestion d'erreur insuffisante** : Les erreurs réseau ou de profil manquant n'étaient pas bien gérées
4. **React.StrictMode** : Peut causer des double-renders et des problèmes avec les effets

## Corrections apportées

### 1. Timeout de sécurité dans `useAuth.tsx`
- Ajout d'un timeout de 10 secondes maximum pour le chargement initial
- Si le chargement prend trop de temps, il est forcé à `false`

### 2. Meilleure gestion des erreurs de profil
- Gestion spécifique du cas où le profil n'existe pas (code `PGRST116`)
- Mécanisme de retry pour les erreurs réseau (2 tentatives)
- L'application continue de fonctionner même si le profil ne peut pas être chargé

### 3. Timeout dans `ProtectedRoute`
- Ajout d'un timeout de 5 secondes pour éviter un blocage infini
- Force le rendu même si `loading` est toujours `true`

### 4. Configuration Supabase améliorée
- Configuration explicite du stockage (localStorage)
- Utilisation de PKCE pour la sécurité

### 5. Désactivation de React.StrictMode
- Désactivé temporairement pour éviter les double-renders
- Peut être réactivé une fois que tout fonctionne correctement

### 6. Configuration Vite améliorée
- Configuration HMR améliorée
- Meilleure gestion du watch

## Fichiers modifiés

1. `src/hooks/useAuth.tsx`
   - Ajout de timeout de sécurité
   - Meilleure gestion des erreurs
   - Mécanisme de retry
   - Gestion du cas "profil non trouvé"

2. `src/components/ProtectedRoute.tsx`
   - Timeout de sécurité pour éviter les blocages
   - Force le rendu après 5 secondes

3. `src/lib/supabaseClient.ts`
   - Configuration explicite du stockage
   - Utilisation de PKCE

4. `src/main.tsx`
   - Désactivation de React.StrictMode (temporaire)

5. `vite.config.ts`
   - Configuration HMR améliorée

## Tests à effectuer

1. **Test de base** :
   - Se connecter
   - Naviguer dans l'application
   - Rafraîchir la page (F5)
   - Vérifier que l'application se charge correctement

2. **Test avec profil manquant** :
   - Si un utilisateur n'a pas de profil, l'application doit quand même fonctionner

3. **Test avec erreur réseau** :
   - Simuler une erreur réseau (déconnecter internet)
   - L'application ne doit pas rester bloquée indéfiniment

4. **Test de timeout** :
   - Si le chargement prend plus de 10 secondes, l'application doit quand même se charger

## Solutions de débogage

Si le problème persiste :

1. **Vérifier la console du navigateur** :
   - Ouvrir les DevTools (F12)
   - Regarder les erreurs dans la console
   - Vérifier les requêtes réseau dans l'onglet Network

2. **Vérifier le localStorage** :
   ```javascript
   // Dans la console du navigateur
   localStorage.getItem('sb-auth-token')
   ```

3. **Nettoyer le cache** :
   - Vider le localStorage : `localStorage.clear()`
   - Vider le cache du navigateur (Ctrl+Shift+Delete)
   - Recharger la page

4. **Vérifier les variables d'environnement** :
   - S'assurer que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont bien définies
   - Vérifier dans `.env` ou `.env.local`

5. **Vérifier la connexion Supabase** :
   - Tester la connexion à Supabase depuis l'interface SQL
   - Vérifier que les policies RLS sont correctes

## Réactivation de StrictMode (optionnel)

Une fois que tout fonctionne correctement, vous pouvez réactiver StrictMode :

```tsx
// src/main.tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

## Notes importantes

- Les timeouts sont des mesures de sécurité, pas des solutions idéales
- Si le problème persiste, il peut venir d'un problème de configuration Supabase ou de réseau
- Les logs dans la console aideront à identifier le problème exact






---


### 📄 Correction des boucles de connexion

*Source: `portal-formations/FIX-BOUCLE-CONNEXION.md`*


---

# Correction des boucles de connexion

## Problème identifié

**Symptôme** : La connexion "tourne en rond" - l'application reste bloquée sur un écran de chargement ou redirige en boucle entre les pages.

## Causes possibles

1. **Session Supabase corrompue** : Le localStorage contient une session invalide
2. **Profil manquant** : L'utilisateur existe mais n'a pas de profil dans la table `profiles`
3. **Timeout trop long** : Le chargement prend trop de temps et bloque l'interface
4. **Boucles de redirection** : Les redirections entre pages créent une boucle infinie

## Corrections apportées

### 1. Timeouts réduits et plus agressifs

**Avant** :
- Timeout auth : 10 secondes
- Timeout ProtectedRoute : 5 secondes
- Timeout profile fetch : pas de timeout

**Après** :
- Timeout auth : 5 secondes
- Timeout ProtectedRoute : 3 secondes
- Timeout profile fetch : 5 secondes
- Timeout session fetch : 3 secondes

### 2. Protection contre les boucles de redirection

- Vérification si on est déjà sur la bonne page avant de rediriger
- Utilisation de `replace` au lieu de `push` pour éviter l'historique
- Flag pour éviter les redirections multiples

### 3. Gestion améliorée des erreurs

- En cas de timeout, on force `loading = false`
- En cas d'erreur de profil, on continue sans profil
- Nettoyage de l'état en cas d'erreur

### 4. Récupération de session avec timeout

- Utilisation de `Promise.race` pour limiter le temps de récupération
- Si la session prend trop de temps, on continue sans session

## Solutions de dépannage

### Solution 1 : Nettoyer le localStorage

Si vous êtes bloqué, ouvrez la console du navigateur (F12) et exécutez :

```javascript
// Nettoyer le localStorage Supabase
localStorage.removeItem('sb-auth-token')
localStorage.removeItem('supabase.auth.token')

// Recharger la page
window.location.reload()
```

### Solution 2 : Vérifier les variables d'environnement

Assurez-vous que `.env` ou `.env.local` contient :
```
VITE_SUPABASE_URL=votre_url
VITE_SUPABASE_ANON_KEY=votre_clé
```

### Solution 3 : Vérifier le profil dans Supabase

Si l'utilisateur existe mais n'a pas de profil :

1. Aller dans Supabase SQL Editor
2. Exécuter :
```sql
-- Vérifier si le profil existe
SELECT * FROM profiles WHERE id = 'votre-user-id';

-- Créer le profil si nécessaire
INSERT INTO profiles (id, role, full_name)
VALUES ('votre-user-id', 'student', 'Nom Utilisateur')
ON CONFLICT (id) DO NOTHING;
```

### Solution 4 : Réinitialiser complètement

Si rien ne fonctionne :

1. Ouvrir la console (F12)
2. Exécuter :
```javascript
// Tout nettoyer
localStorage.clear()
sessionStorage.clear()
window.location.href = '/login'
```

## Fichiers modifiés

1. **`src/hooks/useAuth.tsx`**
   - Timeouts réduits
   - Gestion améliorée des erreurs
   - Timeout sur la récupération de session

2. **`src/components/ProtectedRoute.tsx`**
   - Protection contre les boucles de redirection
   - Vérification de la page actuelle avant redirection
   - Timeout réduit

## Tests à effectuer

1. **Test de connexion normale** :
   - Se connecter avec un compte valide
   - Vérifier que la redirection fonctionne
   - Vérifier qu'il n'y a pas de boucle

2. **Test avec session invalide** :
   - Nettoyer le localStorage
   - Recharger la page
   - Vérifier qu'on est redirigé vers /login

3. **Test avec profil manquant** :
   - Se connecter avec un compte sans profil
   - Vérifier que l'application fonctionne quand même
   - Vérifier qu'on peut créer un profil

4. **Test de timeout** :
   - Simuler une connexion lente
   - Vérifier que le timeout fonctionne
   - Vérifier que l'application ne reste pas bloquée

## Notes importantes

- Les timeouts sont des mesures de sécurité, pas des solutions idéales
- Si le problème persiste, vérifier les logs Supabase
- Un profil manquant n'empêche plus l'utilisation de l'application
- Les redirections utilisent `replace` pour éviter l'historique






---


### 📄 Correction du problème de cache en production

*Source: `portal-formations/FIX-CACHE-PRODUCTION.md`*


---

# Correction du problème de cache en production

## Problème

En production, il faut vider le cache du navigateur pour que les nouvelles versions fonctionnent correctement.

## Solutions implémentées

### 1. Headers de cache pour index.html

**Fichiers modifiés** :
- `index.html` : Ajout de meta tags pour empêcher le cache
- `netlify.toml` : Headers pour empêcher le cache de index.html
- `vercel.json` : Headers pour empêcher le cache de index.html

**Résultat** : `index.html` n'est jamais mis en cache, garantissant que les utilisateurs obtiennent toujours la dernière version.

### 2. Cache busting avec hash dans les noms de fichiers

**Fichier modifié** : `vite.config.ts`

```typescript
build: {
  rollupOptions: {
    output: {
      entryFileNames: `assets/[name]-[hash].js`,
      chunkFileNames: `assets/[name]-[hash].js`,
      assetFileNames: `assets/[name]-[hash].[ext]`,
    },
  },
}
```

**Résultat** : Chaque build génère des noms de fichiers uniques avec un hash. Si le contenu change, le hash change, forçant le navigateur à télécharger la nouvelle version.

### 3. Détection automatique de nouvelle version

**Fichier modifié** : `src/main.tsx`

L'application vérifie automatiquement toutes les 5 minutes si une nouvelle version est disponible en comparant les headers `Last-Modified` et `ETag` de `index.html`.

**Résultat** : Les utilisateurs obtiennent automatiquement la nouvelle version sans avoir à vider le cache manuellement.

### 4. Configuration des headers de cache

**Assets statiques** (JS, CSS avec hash) :
- Cache : `public, max-age=31536000, immutable`
- Ces fichiers peuvent être mis en cache indéfiniment car leur nom change à chaque build

**index.html** :
- Cache : `no-cache, no-store, must-revalidate`
- Ce fichier ne doit jamais être mis en cache

## Comment ça fonctionne

1. **Au build** : Vite génère des fichiers avec des noms uniques (hash)
   - `main-abc123.js` → `main-xyz789.js` (si le contenu change)

2. **Au chargement** : Le navigateur charge `index.html` (jamais en cache)
   - `index.html` référence les nouveaux fichiers avec hash

3. **Détection automatique** : Toutes les 5 minutes, l'app vérifie si `index.html` a changé
   - Si oui → rechargement automatique

## Avantages

✅ **Plus besoin de vider le cache manuellement**
✅ **Mises à jour automatiques pour les utilisateurs**
✅ **Performance optimale** : les assets sont mis en cache, seul `index.html` est rechargé
✅ **Compatibilité** : Fonctionne avec Netlify, Vercel, et autres plateformes

## Configuration requise

### Pour Netlify

Le fichier `netlify.toml` est déjà configuré avec les bons headers.

### Pour Vercel

Le fichier `vercel.json` est déjà configuré avec les bons headers.

### Pour d'autres plateformes

Assurez-vous que :
1. `index.html` a les headers : `Cache-Control: no-cache, no-store, must-revalidate`
2. Les assets dans `/assets/*` ont les headers : `Cache-Control: public, max-age=31536000, immutable`

## Test

1. Déployez une nouvelle version
2. Attendez 5 minutes (ou rechargez manuellement)
3. L'application devrait automatiquement détecter et charger la nouvelle version

## Dépannage

### Le cache persiste encore

1. Vérifiez que `index.html` a bien les headers `no-cache`
2. Vérifiez que les fichiers assets ont bien un hash dans leur nom
3. Videz le cache du navigateur une dernière fois (Ctrl+Shift+R ou Cmd+Shift+R)

### La détection automatique ne fonctionne pas

1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que le serveur envoie bien les headers `Last-Modified` ou `ETag`
3. La vérification se fait toutes les 5 minutes, soyez patient

### Les assets ne se rechargent pas

1. Vérifiez que les noms de fichiers contiennent bien un hash
2. Vérifiez que `index.html` référence bien les nouveaux fichiers
3. Videz le cache du navigateur

## Notes importantes

- La détection automatique fonctionne seulement en production (`import.meta.env.PROD`)
- En développement, le HMR (Hot Module Replacement) gère déjà les mises à jour
- Les utilisateurs qui ont l'application ouverte recevront la mise à jour automatiquement dans les 5 minutes
- Pour forcer une mise à jour immédiate, les utilisateurs peuvent recharger la page (F5 ou Ctrl+R)






---


### 📄 Fix : Erreur CORS avec Supabase

*Source: `portal-formations/FIX-CORS-SUPABASE.md`*


---

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





---


### 📄 Correction de l'erreur 406 sur enrollments

*Source: `portal-formations/FIX-ENROLLMENTS-406.md`*


---

# Correction de l'erreur 406 sur enrollments

## Problème identifié

**Erreur** : `Failed to load resource: the server responded with a status of 406 () (enrollments, line 0)`

**Cause** : L'erreur 406 (Not Acceptable) se produit lorsque :
1. On utilise `.single()` sur une requête qui peut ne pas retourner de résultat
2. L'utilisateur n'est pas encore chargé (`user?.id` est undefined)
3. Les policies RLS rejettent la requête avec un format d'erreur spécifique

## Corrections apportées

### 1. Remplacement de `.single()` par `.maybeSingle()`

**Avant** :
```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select('id')
  .eq('user_id', user?.id)
  .eq('course_id', courseId)
  .eq('status', 'active')
  .single() // ❌ Erreur si aucun résultat
```

**Après** :
```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select('id')
  .eq('user_id', user.id)
  .eq('course_id', courseId)
  .eq('status', 'active')
  .maybeSingle() // ✅ Retourne null si aucun résultat
```

### 2. Vérification de l'utilisateur avant les requêtes

**Avant** :
```typescript
.eq('user_id', user?.id) // ❌ Peut être undefined
```

**Après** :
```typescript
if (!user?.id) {
  setLoading(false)
  return
}
// ...
.eq('user_id', user.id) // ✅ Garanti d'être défini
```

### 3. Gestion améliorée des erreurs

**Avant** :
```typescript
if (accessError && profile?.role !== 'admin') {
  setError('Vous n\'avez pas accès...')
  return
}
```

**Après** :
```typescript
if (accessError || !accessCheck) {
  setError('Vous n\'avez pas accès...')
  return
}
```

### 4. Vérification du rôle admin avant la requête

**Avant** :
```typescript
// Fait la requête même pour les admins
const { data, error } = await supabase
  .from('enrollments')
  .select('id')
  // ...
```

**Après** :
```typescript
// Skip la vérification pour les admins
if (profile?.role !== 'admin' && user?.id) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    // ...
}
```

## Fichiers modifiés

1. **`src/pages/CourseView.tsx`**
   - Remplacement de `.single()` par `.maybeSingle()`
   - Vérification du rôle admin avant la requête
   - Vérification de `user` dans le `useEffect`

2. **`src/pages/ItemView.tsx`**
   - Remplacement de `.single()` par `.maybeSingle()`
   - Vérification du rôle admin avant la requête
   - Amélioration de la gestion des erreurs

3. **`src/pages/Dashboard.tsx`**
   - Vérification de `user?.id` avant la requête
   - Gestion améliorée des erreurs (ne bloque pas si erreur mineure)

## Différence entre `.single()` et `.maybeSingle()`

- **`.single()`** : 
  - Attend exactement 1 résultat
  - Retourne une erreur si 0 ou 2+ résultats
  - Utilisé quand on est sûr qu'il y a un résultat

- **`.maybeSingle()`** :
  - Accepte 0 ou 1 résultat
  - Retourne `null` si aucun résultat (pas d'erreur)
  - Retourne une erreur seulement si 2+ résultats
  - Utilisé quand le résultat peut ne pas exister

## Tests à effectuer

1. **Test avec utilisateur non inscrit** :
   - Accéder à une formation sans être inscrit
   - Vérifier qu'un message d'erreur approprié s'affiche
   - Vérifier qu'il n'y a pas d'erreur 406 dans la console

2. **Test avec admin** :
   - Se connecter en tant qu'admin
   - Accéder à une formation
   - Vérifier qu'il n'y a pas de requête vers enrollments
   - Vérifier que l'accès fonctionne

3. **Test avec utilisateur inscrit** :
   - S'inscrire à une formation
   - Accéder à la formation
   - Vérifier que tout fonctionne normalement

4. **Test de chargement** :
   - Rafraîchir la page pendant le chargement
   - Vérifier qu'il n'y a pas d'erreur 406

## Notes importantes

- L'erreur 406 peut aussi être causée par des problèmes de configuration Supabase (RLS, CORS, etc.)
- Si le problème persiste, vérifier les logs Supabase pour plus de détails
- Les admins n'ont pas besoin d'être inscrits pour accéder aux formations






---


### 📄 Fix : Erreur HTTP 401 lors de la correction IA

*Source: `portal-formations/FIX-ERREUR-CORRECTION-IA.md`*


---

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





---


### 📄 Corrections des erreurs

*Source: `portal-formations/FIX-ERRORS.md`*


---

# Corrections des erreurs

## Problèmes identifiés et corrigés

### 1. Warning TipTap : Extensions dupliquées
**Erreur** : `[tiptap warn]: Duplicate extension names found: ['link']`

**Cause** : Le `StarterKit` inclut déjà l'extension `Link`, et on l'ajoutait aussi séparément, créant une duplication.

**Solution** : Désactivation de `Link` dans `StarterKit` puis ajout séparé avec configuration personnalisée.

```typescript
StarterKit.configure({
  heading: {
    levels: [1, 2, 3],
  },
  link: false, // Désactiver Link dans StarterKit
}),
Link.configure({
  // Configuration personnalisée
}),
```

### 2. Erreur 400 lors du chargement des items
**Erreur** : `Failed to load resource: the server responded with a status of 400 () (items, line 0)`

**Causes possibles** :
- L'itemId n'est pas valide (peut être "new" ou un ID temporaire)
- L'item n'existe pas dans la base de données
- Problème de permissions RLS (Row Level Security)

**Solutions appliquées** :
1. Vérification de la validité de `itemId` avant de faire la requête
2. Meilleure gestion des erreurs avec messages spécifiques :
   - `PGRST116` : Item non trouvé
   - `42501` : Problème de permissions
   - Autres erreurs : Message d'erreur détaillé
3. Gestion du cas où `itemId` est "new" ou commence par "temp-"

### 3. Amélioration de la gestion d'erreurs
- Messages d'erreur plus explicites
- Gestion spécifique des codes d'erreur Supabase
- Vérification de la validité des données avant de les utiliser

## Fichiers modifiés

1. **`src/components/RichTextEditor.tsx`**
   - Désactivation de `Link` dans `StarterKit` pour éviter la duplication

2. **`src/pages/admin/AdminItemEdit.tsx`**
   - Vérification de la validité de `itemId` avant la requête
   - Meilleure gestion des erreurs avec messages spécifiques
   - Gestion des cas d'erreur courants (item non trouvé, permissions, etc.)

## Tests à effectuer

1. **Test de création d'item** :
   - Créer un nouvel item depuis `/admin/courses/{courseId}`
   - Vérifier qu'il n'y a pas d'erreur 400

2. **Test d'édition d'item** :
   - Éditer un item existant
   - Vérifier que l'item se charge correctement
   - Vérifier qu'il n'y a pas de warning TipTap

3. **Test avec item invalide** :
   - Essayer d'accéder à un item qui n'existe pas
   - Vérifier qu'un message d'erreur approprié s'affiche

4. **Test de l'éditeur** :
   - Utiliser l'éditeur de contenu riche
   - Vérifier qu'il n'y a pas de warning dans la console
   - Tester toutes les fonctionnalités (gras, italique, liens, etc.)

## Notes importantes

- Les warnings TipTap ne bloquent pas l'application mais peuvent causer des comportements inattendus
- L'erreur 400 peut aussi venir d'un problème de configuration RLS dans Supabase
- Si le problème persiste, vérifier les logs Supabase pour plus de détails






---


### 📄 Guide de résolution : Erreur de type lors de l'importation de fichiers TP

*Source: `portal-formations/FIX-IMPORT-TP-TYPE.md`*


---

# Guide de résolution : Erreur de type lors de l'importation de fichiers TP

## 🔍 Problème

Lors de l'importation du fichier `lms-titanic-big-data.json` dans Portal Formation, vous obtenez une erreur sur le type.

## ✅ Solution

### Étape 1 : Vérifier que le fichier JSON est valide

Le fichier `lms-titanic-big-data.json` a été validé et est correct. Il contient des items de type `resource` et `tp`, qui sont tous deux valides.

### Étape 2 : Vérifier et corriger la contrainte CHECK en base de données

Le problème vient probablement de la contrainte CHECK de la table `items` qui n'inclut pas tous les types nécessaires.

**Exécutez le script SQL suivant dans Supabase :**

```sql
-- Vérifier la contrainte actuelle
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conname LIKE '%type%';

-- Supprimer l'ancienne contrainte
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;

-- Recréer la contrainte avec tous les types valides
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game'));
```

**Ou utilisez le script complet :**

Exécutez le fichier `fix-items-type-constraint-complete.sql` dans l'éditeur SQL de Supabase.

### Étape 3 : Vérifier qu'il n'y a pas d'items avec des types invalides

```sql
SELECT 
  id,
  type,
  title,
  CASE 
    WHEN type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game') THEN '❌ Type invalide'
    WHEN type != LOWER(TRIM(type)) THEN '⚠️ Type avec majuscules ou espaces'
    ELSE '✅ OK'
  END as status
FROM items
WHERE type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game')
   OR type != LOWER(TRIM(type));
```

Si vous trouvez des items avec des types invalides, corrigez-les :

```sql
-- Corriger les types avec espaces ou majuscules
UPDATE items
SET type = LOWER(TRIM(type))
WHERE type != LOWER(TRIM(type));
```

### Étape 4 : Réessayer l'importation

1. Allez dans l'interface d'administration de Portal Formation
2. Créez un nouveau cours ou éditez un cours existant
3. Utilisez l'option "Importer JSON" ou "Mode JSON"
4. Collez le contenu du fichier `lms-titanic-big-data.json`
5. Cliquez sur "Sauvegarder"

## 📋 Types valides

Les types d'items valides sont :
- `resource` : Ressource de cours
- `slide` : Support de présentation
- `exercise` : Exercice pratique
- `activity` : Activité interactive
- `tp` : Travaux pratiques
- `game` : Jeu/Quiz interactif

## 🔧 Scripts disponibles

- `fix-items-type-constraint-complete.sql` : Script complet pour corriger la contrainte
- `diagnose-item-type.sql` : Script de diagnostic pour identifier les problèmes de type
- `validate-tp-big-data.js` : Script de validation du fichier JSON

## ⚠️ Note importante

Assurez-vous d'être dans l'interface **COURS** (pas ITEM) lors de l'importation. Le fichier `lms-titanic-big-data.json` est un fichier de cours complet, pas un item individuel.



---


### 📄 Fix des problèmes de performance et timeouts

*Source: `portal-formations/FIX-PERFORMANCE-TIMEOUTS.md`*


---

# Fix des problèmes de performance et timeouts

## Problème

Des timeouts se produisent lors du chargement des cours, notamment :
- `Items fetch timeout` après 5 secondes
- Latences importantes sur les requêtes Supabase
- Les politiques RLS sont trop lentes à cause de jointures complexes

## Solution

### 1. Optimiser les politiques RLS

Les politiques RLS pour `modules`, `items`, et `chapters` font des jointures complexes qui ralentissent les requêtes. La solution est d'utiliser des fonctions SQL réutilisables.

**Script à exécuter dans Supabase :**
```sql
-- Exécuter le script complet
optimize-all-policies-performance.sql
```

Ce script :
- Crée/remplace les fonctions SQL optimisées :
  - `user_has_course_access(course_id)` : vérifie l'accès à un cours
  - `get_course_id_from_item(item_id)` : obtient le course_id d'un item
  - `get_course_id_from_module(module_id)` : obtient le course_id d'un module
- Optimise les politiques RLS pour `modules`, `items`, et `chapters` en utilisant ces fonctions
- Crée tous les index nécessaires pour améliorer les performances

### 2. Augmenter les timeouts dans le code

Les timeouts ont été augmentés dans `CourseView.tsx` :
- **Modules** : 10 secondes (au lieu de 5)
- **Items** : 15 secondes (au lieu de 5)
- **Retries** : 2 tentatives avec délai progressif

### 3. Améliorer la gestion des erreurs

Le code détecte maintenant spécifiquement :
- Les timeouts SQL (code 57014)
- Les erreurs de permissions RLS (code PGRST301)
- Affiche des messages d'erreur plus informatifs

## Étapes de résolution

1. **Exécuter le script SQL d'optimisation** :
   - Ouvrir l'interface SQL de Supabase
   - Exécuter `optimize-all-policies-performance.sql`
   - Vérifier que toutes les fonctions et policies sont créées

2. **Vérifier les performances** :
   - Recharger la page du cours
   - Vérifier dans la console que les requêtes sont plus rapides
   - Les timeouts ne devraient plus se produire

3. **Si les problèmes persistent** :
   - Vérifier que les index sont bien créés
   - Analyser les performances avec `EXPLAIN ANALYZE` dans Supabase
   - Vérifier que les fonctions SQL utilisent `SECURITY DEFINER` et `STABLE`

## Scripts disponibles

- `optimize-all-policies-performance.sql` : Script complet pour optimiser toutes les policies
- `optimize-items-policy.sql` : Script spécifique pour les items uniquement
- `diagnose-chapters-rls.sql` : Script de diagnostic pour les chapters

## Notes techniques

- Les fonctions SQL utilisent `SECURITY DEFINER` pour s'exécuter avec les privilèges du créateur
- Les fonctions sont marquées `STABLE` pour permettre l'optimisation par PostgreSQL
- Les index sont créés sur toutes les colonnes utilisées dans les jointures
- Les politiques RLS utilisent maintenant des fonctions au lieu de sous-requêtes complexes






---


### 📄 Fix : Rôle utilisateur qui change régulièrement

*Source: `portal-formations/FIX-ROLE-CONSISTENCY.md`*


---

# Fix : Rôle utilisateur qui change régulièrement

## Problème

L'utilisateur principal (Admin) voit son rôle changer régulièrement entre "Étudiant", "Admin", "Formateur" lors de la navigation, alors qu'il ne fait que naviguer dans l'application.

## Cause

Le problème venait de **deux sources de rôles différentes** qui n'étaient pas synchronisées :

1. **`profiles.role`** : Rôle global de l'utilisateur ('admin', 'student', 'instructor')
2. **`org_members.role`** : Rôle dans une organisation spécifique ('admin', 'trainer', 'student', 'auditor')

Le code utilisait parfois `profiles.role`, parfois `org_members.role`, créant des incohérences selon :
- Quelle requête était exécutée en premier
- Si l'utilisateur était dans plusieurs organisations
- Si les données étaient mises en cache différemment

## Solution

### 1. Fonction unifiée `getUserRole()`

Création d'une fonction centralisée dans `src/lib/queries/userRole.ts` qui détermine le rôle de manière cohérente :

**Priorité** :
1. Si `profiles.role === 'admin'` → retourne toujours `'admin'` (priorité absolue)
2. Sinon, si l'utilisateur est dans `org_members` → utilise `org_members.role`
3. Sinon → utilise `profiles.role` comme fallback

### 2. Hook `useUserRole()`

Création d'un hook React `src/hooks/useUserRole.tsx` qui :
- Utilise `getUserRole()` pour déterminer le rôle
- Fournit des helpers : `isAdmin`, `isTrainer`, `isStudent`, `roleLabel`
- Cache le résultat et le rafraîchit uniquement si l'utilisateur change

### 3. Mise à jour des composants

- **`AppHeader.tsx`** : Utilise maintenant `useUserRole()` au lieu de `profile?.role`
- **`getTrainerContext()`** : Utilise `getUserRole()` pour une détermination cohérente
- **`getSessions()`** : Accepte maintenant un paramètre `isAdmin` pour filtrer correctement

## Fichiers modifiés

1. **`src/lib/queries/userRole.ts`** (nouveau)
   - Fonction `getUserRole(userId)` : Détermine le rôle unifié
   - Fonction `getCurrentUserRole()` : Récupère le rôle de l'utilisateur actuel

2. **`src/hooks/useUserRole.tsx`** (nouveau)
   - Hook React pour utiliser le rôle unifié dans les composants

3. **`src/lib/queries/trainerQueries.ts`**
   - `getTrainerContext()` : Utilise maintenant `getUserRole()`
   - `getSessions()` : Accepte un paramètre `isAdmin`

4. **`src/components/AppHeader.tsx`**
   - Utilise `useUserRole()` au lieu de `profile?.role`

5. **`src/pages/trainer/TrainerDashboard.tsx`**
   - Passe le flag `isAdmin` à `getSessions()`

## Vérification

Pour vérifier que le problème est résolu :

1. **Ouvrir la console du navigateur** et chercher les logs :
   ```
   🔍 getUserRole - Début pour userId: ...
   ✅ Rôle déterminé: admin (depuis profiles)
   ```

2. **Vérifier que le rôle ne change plus** lors de la navigation

3. **Vérifier dans la base de données** :
   ```sql
   -- Vérifier le rôle dans profiles
   SELECT id, role FROM profiles WHERE id = 'VOTRE_USER_ID';
   
   -- Vérifier les membres d'organisation
   SELECT om.*, o.name as org_name 
   FROM org_members om
   JOIN orgs o ON o.id = om.org_id
   WHERE om.user_id = 'VOTRE_USER_ID';
   ```

## Script SQL de diagnostic

Exécuter `diagnose-user-role.sql` pour diagnostiquer les incohérences de rôles.

## Notes importantes

- **Les admins dans `profiles` ont toujours la priorité** : même s'ils sont aussi membres d'une organisation avec un rôle différent, ils restent `admin`
- **Les rôles `org_members` sont prioritaires** sur `profiles.role` sauf si `profiles.role === 'admin'`
- **Le mapping des rôles** :
  - `profiles.role: 'instructor'` → `UnifiedRole: 'trainer'`
  - `org_members.role: 'trainer'` → `UnifiedRole: 'trainer'`
  - `org_members.role: 'admin'` → `UnifiedRole: 'admin'` (mais moins prioritaire que `profiles.role === 'admin'`)






---


### 📄 Fix : Slides non visibles pour les étudiants via programmes

*Source: `portal-formations/FIX-SLIDES-PROGRAMMES.md`*


---

# Fix : Slides non visibles pour les étudiants via programmes

## Problème
Les profils étudiants ne voient pas les slides à partir d'un programme, même si les chapitres sont présents.

## Solution

### 1. Exécuter la policy optimisée pour les chapitres

Exécutez le script SQL suivant dans l'interface SQL de Supabase :

```sql
-- Fichier: optimize-chapters-policy.sql
```

Ce script :
- Supprime l'ancienne policy RLS pour `chapters`
- Crée une nouvelle policy optimisée qui inclut l'accès via programmes
- Crée des index pour améliorer les performances

### 2. Vérifier les logs dans la console

Après avoir exécuté le script, rechargez la page du cours et vérifiez la console du navigateur :

1. **Dans CourseView** :
   - `=== Fetching chapters ===` : Affiche le nombre d'items et leurs IDs
   - `Chapters query result` : Affiche les données récupérées et les erreurs éventuelles
   - Si erreur `PGRST301` ou message contenant "permission" → problème de RLS

2. **Dans ChapterViewer** :
   - `=== ChapterViewer: Fetching chapters ===` : Affiche l'item_id
   - `ChapterViewer query result` : Affiche les données récupérées

### 3. Vérifier que la policy est bien appliquée

Exécutez cette requête dans Supabase pour vérifier que la policy existe :

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'chapters' AND policyname = 'Chapters viewable with item access';
```

### 4. Tester l'accès

1. Connectez-vous avec un compte étudiant
2. Accédez à un programme
3. Cliquez sur une formation du programme
4. Cliquez sur une slide
5. Vérifiez que les chapitres s'affichent

### 5. Si le problème persiste

Vérifiez dans la console :
- Les logs `Chapters data:` et `Chapters error:`
- Si `chaptersData` est vide mais qu'il n'y a pas d'erreur → problème de RLS
- Si `chaptersError` contient un code d'erreur → notez le code et le message

## Structure de la policy

La policy vérifie l'accès aux chapitres dans cet ordre (du plus rapide au plus lent) :

1. **Admin** : Accès direct si l'utilisateur est admin
2. **Créateur** : Accès si l'utilisateur a créé la formation
3. **Formation gratuite** : Accès si la formation est publiée et gratuite
4. **Enrollment direct** : Accès si l'utilisateur est directement inscrit à la formation
5. **Accès via programme** : Accès si l'utilisateur est inscrit à un programme contenant la formation

## Index créés

Les index suivants sont créés pour optimiser les performances :

- `idx_chapters_item_id` : Pour les requêtes sur `chapters.item_id`
- `idx_items_module_id` : Pour les jointures `items → modules`
- `idx_modules_course_id` : Pour les jointures `modules → courses`
- `idx_enrollments_user_course_status` : Pour les vérifications d'enrollment
- `idx_program_enrollments_user_status` : Pour les vérifications d'enrollment programme
- `idx_program_courses_course_id` : Pour les jointures `program_courses → courses`
- `idx_courses_created_by` : Pour les vérifications de créateur
- `idx_courses_status_access` : Pour les vérifications de statut/accès






---


### 📄 Fix : Timeout SQL (57014) lors de la récupération des chapitres

*Source: `portal-formations/FIX-TIMEOUT-CHAPTERS.md`*


---

# Fix : Timeout SQL (57014) lors de la récupération des chapitres

## Problème
Lors de la récupération des chapitres pour les étudiants inscrits via un programme, une erreur de timeout SQL se produit :
- **Error code**: `57014`
- **Error message**: `"canceling statement due to statement timeout"`

## Cause
La policy RLS pour les chapitres fait trop de jointures imbriquées :
- `chapters` → `items` → `modules` → `courses` → `program_courses` → `program_enrollments`
- Chaque chapitre vérifie l'accès en faisant ces jointures, ce qui est très coûteux
- Avec 12 items et potentiellement plusieurs chapitres par item, cela multiplie les vérifications

## Solution

### 1. Exécuter le script SQL optimisé

Exécutez le script suivant dans l'interface SQL de Supabase :

**Fichier**: `fix-chapters-policy-performance.sql`

Ce script :
1. **Crée une fonction SQL réutilisable** `user_has_course_access()` qui vérifie l'accès à un cours une seule fois
2. **Crée une fonction SQL** `get_course_id_from_item()` pour obtenir le course_id d'un item
3. **Utilise ces fonctions dans la policy** pour éviter les jointures multiples
4. **Crée des index optimisés** pour améliorer les performances
5. **Crée des index composites** pour optimiser les jointures

### 2. Avantages de cette approche

- **Performance** : Les fonctions SQL sont optimisées et mises en cache par PostgreSQL
- **Réutilisabilité** : La fonction `user_has_course_access()` peut être utilisée ailleurs
- **Maintenabilité** : La logique d'accès est centralisée dans une fonction
- **Index optimisés** : Les index composites accélèrent les jointures

### 3. Vérification

Après avoir exécuté le script :

1. **Vérifiez que les fonctions sont créées** :
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('user_has_course_access', 'get_course_id_from_item');
```

2. **Vérifiez que la policy est créée** :
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'chapters' AND policyname = 'Chapters viewable with item access';
```

3. **Testez l'accès** :
   - Rechargez la page du cours
   - Vérifiez la console : les chapitres devraient être récupérés sans timeout
   - Les logs devraient afficher `✅ Chapters fetched successfully`

### 4. Si le problème persiste

Si vous avez encore des timeouts après avoir exécuté le script :

1. **Vérifiez les index** :
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('chapters', 'items', 'modules', 'courses', 'enrollments', 'program_courses', 'program_enrollments')
ORDER BY tablename, indexname;
```

2. **Analysez les statistiques** :
```sql
ANALYZE chapters;
ANALYZE items;
ANALYZE modules;
ANALYZE courses;
ANALYZE enrollments;
ANALYZE program_courses;
ANALYZE program_enrollments;
```

3. **Vérifiez le plan d'exécution** (optionnel) :
```sql
EXPLAIN ANALYZE
SELECT * FROM chapters
WHERE item_id IN (
  SELECT id FROM items LIMIT 12
);
```

## Structure de la solution

### Fonction `user_has_course_access(course_id_param UUID)`
Vérifie l'accès à un cours dans cet ordre (du plus rapide au plus lent) :
1. Admin : Accès direct
2. Créateur : Vérification directe
3. Formation gratuite : Vérification directe
4. Enrollment direct : Une jointure
5. Accès via programme : Jointures multiples (mais optimisées avec index)

### Fonction `get_course_id_from_item(item_id_param UUID)`
Récupère le course_id d'un item via les jointures items → modules → courses.

### Policy optimisée
```sql
CREATE POLICY "Chapters viewable with item access" ON chapters
  FOR SELECT USING (
    public.user_has_course_access(
      public.get_course_id_from_item(chapters.item_id)
    )
  );
```

Cette approche est beaucoup plus performante car :
- Les fonctions sont mises en cache par PostgreSQL
- Les index optimisent les jointures
- La vérification est faite une seule fois par chapitre au lieu de multiples jointures imbriquées






---


### 📄 Correction : Erreur "Type invalide: undefined"

*Source: `portal-formations/FIX-UNDEFINED-TYPE-ERROR.md`*


---

# Correction : Erreur "Type invalide: undefined"

## 🔍 Problème

Lors de l'importation d'un fichier JSON de cours dans Portal Formation, vous obtenez l'erreur :
```
Type invalide: "undefined". Types valides: resource, slide, exercise, activity, tp, game
```

## ✅ Solution appliquée

J'ai amélioré la validation dans `AdminCourseEditJson.tsx` pour mieux gérer les cas où :
1. Le type est la valeur `undefined` ou `null`
2. Le type est la chaîne littérale `"undefined"` ou `"null"`
3. Le type est une chaîne vide ou ne contient que des espaces

### Modifications apportées

1. **Validation améliorée dans `handleJsonChange`** (ligne ~365) :
   - Détection de la chaîne `"undefined"` et `"null"`
   - Détection des chaînes vides
   - Messages d'erreur plus clairs

2. **Nettoyage amélioré dans `convertSlidesFormatToCourseJson`** (ligne ~155) :
   - Filtrage des types invalides incluant la chaîne `"undefined"`
   - Normalisation automatique des types (minuscules, sans espaces)
   - Détection intelligente du type par défaut basée sur le contenu

3. **Validation améliorée dans `validateItemType`** (ligne ~535) :
   - Vérification après normalisation
   - Messages d'erreur plus précis

## 🔧 Vérification du fichier JSON

Avant d'importer, vérifiez que votre fichier JSON ne contient pas :
- `"type": undefined` (devrait être omis ou avoir une valeur)
- `"type": "undefined"` (chaîne littérale)
- `"type": null`
- `"type": ""` (chaîne vide)

### Script de vérification

J'ai créé un script `fix-json-types.js` dans le dossier `titanic-learning-app` qui :
- Vérifie tous les items pour des types invalides
- Corrige automatiquement les types manquants ou invalides
- Crée une sauvegarde avant modification

Pour l'utiliser :
```bash
cd titanic-learning-app
node fix-json-types.js
```

## 📋 Types valides

Les types d'items valides sont :
- `resource` : Ressource de cours
- `slide` : Support de présentation
- `exercise` : Exercice pratique
- `activity` : Activité interactive
- `tp` : Travaux pratiques
- `game` : Jeu/Quiz interactif

## 🚀 Prochaines étapes

1. **Vérifiez votre fichier JSON** avec le script `fix-json-types.js`
2. **Réessayez l'importation** dans Portal Formation
3. Si l'erreur persiste, vérifiez la console du navigateur (F12) pour plus de détails

## ⚠️ Note

Le fichier `lms-titanic-big-data.json` a été vérifié et est correct. Si vous obtenez toujours l'erreur après ces corrections, il se peut que :
- Le fichier ait été modifié entre-temps
- Il y ait un problème de cache dans le navigateur (essayez Ctrl+F5)
- Il y ait un problème de transformation du JSON lors de l'importation

Dans ce cas, vérifiez la console du navigateur pour voir exactement quel item cause le problème.



---


### 📄 Solution : 0 apprenants inscrits dans une session

*Source: `portal-formations/SOLUTION-0-APPRENANTS.md`*


---

# Solution : 0 apprenants inscrits dans une session

## 🔍 Diagnostic

Si vous voyez "0 apprenants inscrits" et "0 soumissions totales", cela signifie que :
- ✅ La session existe et est active
- ❌ **Aucun enrollment n'est lié à cette session** (`session_id` est NULL ou incorrect)

## ✅ Solution en 3 étapes

### Étape 1 : Vérifier les enrollments sans session

Exécutez cette requête pour voir les enrollments qui ne sont pas liés à une session :

```sql
SELECT 
  e.id as enrollment_id,
  p.full_name as nom_apprenant,
  c.title as cours,
  e.status,
  e.session_id,
  CASE 
    WHEN e.session_id IS NULL THEN '⚠️ Pas de session'
    ELSE '✅ Déjà lié'
  END as etat
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN courses c ON c.id = e.course_id
WHERE e.status = 'active'
AND e.session_id IS NULL
ORDER BY c.title, p.full_name;
```

### Étape 2 : Lier les enrollments à la session

Exécutez cette requête pour lier automatiquement tous les enrollments actifs à leur session correspondante :

```sql
UPDATE enrollments e
SET session_id = (
  SELECT s.id 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1
)
WHERE e.status = 'active'
AND e.session_id IS NULL
AND EXISTS (
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
)
RETURNING 
  e.id,
  (SELECT full_name FROM profiles WHERE id = e.user_id) as nom_apprenant,
  (SELECT title FROM courses WHERE id = e.course_id) as cours,
  (SELECT title FROM sessions WHERE id = e.session_id) as session_title;
```

### Étape 3 : Vérifier que les apprenants sont membres de l'organisation

Les apprenants doivent être membres de l'organisation de la session. Vérifiez avec :

```sql
SELECT 
  p.full_name as nom_apprenant,
  o.name as organisation,
  CASE 
    WHEN om.id IS NULL THEN '❌ Pas membre'
    ELSE '✅ Membre'
  END as statut
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN sessions s ON s.id = e.session_id
JOIN orgs o ON o.id = s.org_id
LEFT JOIN org_members om ON om.user_id = e.user_id AND om.org_id = o.id
WHERE e.status = 'active'
AND s.status = 'active'
ORDER BY o.name, p.full_name;
```

Si certains apprenants ne sont pas membres, ajoutez-les :

```sql
INSERT INTO org_members (org_id, user_id, role, display_name)
SELECT DISTINCT
  s.org_id,
  e.user_id,
  'student' as role,
  p.full_name as display_name
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN sessions s ON s.id = e.session_id
LEFT JOIN org_members om ON om.user_id = e.user_id AND om.org_id = s.org_id
WHERE e.status = 'active'
AND s.status = 'active'
AND om.id IS NULL
ON CONFLICT (org_id, user_id) DO NOTHING;
```

## 🎯 Script complet

Le fichier `lier-apprenants-session.sql` contient toutes ces requêtes dans l'ordre. Exécutez-le étape par étape.

## ✅ Vérification finale

Après avoir exécuté les scripts, rafraîchissez le portail formateur (`/trainer/session/:sessionId`) et vous devriez voir :
- ✅ Le nombre d'apprenants inscrits > 0
- ✅ La liste des apprenants avec leurs soumissions
- ✅ Les boutons "Détails" fonctionnels

## 💡 Pourquoi cela arrive ?

Cela arrive quand :
1. Les enrollments ont été créés **avant** la création de la session
2. Le trigger automatique (`update_enrollment_session`) n'est pas actif
3. Les apprenants ne sont pas membres de l'organisation de la session

## 🔧 Prévention

Pour éviter ce problème à l'avenir :
1. Créez d'abord la session
2. Ensuite, créez les enrollments (ils seront automatiquement liés si le trigger est actif)
3. Ou exécutez régulièrement le script de liaison






---


### 📄 Solution : "0 sessions" s'affiche dans le portail formateur

*Source: `portal-formations/SOLUTION-0-SESSIONS.md`*


---

# Solution : "0 sessions" s'affiche dans le portail formateur

## 🔍 Diagnostic

Si vous voyez "0 sessions" dans le portail formateur, cela signifie que :
- ✅ Votre organisation existe
- ✅ Vous avez accès au portail formateur
- ❌ **Aucune session n'a été créée** pour cette organisation et ce cours

## ✅ Solution rapide

### Option 1 : Via SQL (le plus rapide)

1. **Ouvrir Supabase SQL Editor**
2. **Exécuter le script** `creer-session-rapide.sql`
3. **Rafraîchir** le portail formateur (`/trainer`)

Le script va :
- Trouver automatiquement votre organisation
- Trouver le cours "M1 FULL-STACK 2025/2026"
- Créer une session active

### Option 2 : Via l'interface (à implémenter)

Actuellement, il n'y a pas d'interface pour créer des sessions depuis le portail formateur. Vous devez :
- Soit utiliser SQL (Option 1)
- Soit créer une interface d'administration (à développer)

## 📋 Vérification après création

Après avoir créé une session, vous devriez voir :

1. **Dans le portail formateur** (`/trainer`) :
   - Votre organisation avec "1 session" (au lieu de "0 sessions")
   - En cliquant sur l'organisation, vous verrez la session créée
   - Un bouton "Apprenants" pour voir les apprenants de cette session

2. **Dans la console du navigateur** (F12) :
   - `✅ Sessions chargées pour [nom org]: 1`

## 🎯 Prochaines étapes

Une fois la session créée :

1. **Ajouter des apprenants** :
   - Aller sur `/admin/courses/:courseId/enrollments`
   - Ajouter des inscriptions pour les apprenants
   - Les enrollments seront automatiquement liés à la session si le trigger est actif

2. **Voir les apprenants** :
   - Aller sur `/trainer/session/:sessionId`
   - Vous verrez la liste des apprenants avec leurs soumissions

## 🔧 Script SQL de diagnostic

Si la session ne s'affiche toujours pas après création, exécutez `diagnostic-sessions.sql` pour identifier le problème.

## 💡 Note importante

Les sessions doivent être créées **manuellement**. Il n'y a pas de création automatique de sessions quand :
- Un cours est créé
- Un apprenant s'inscrit
- Un formateur accède au portail

C'est une fonctionnalité à développer si vous souhaitez automatiser la création de sessions.






---


### 📄 Solution : Créer les sessions manquantes pour les cours du programme

*Source: `portal-formations/SOLUTION-CREER-SESSIONS.md`*


---

# Solution : Créer les sessions manquantes pour les cours du programme

## 🔍 Situation actuelle

✅ Les enrollments ont été créés avec succès  
❌ Mais ils n'ont pas de `session_id` car **aucune session n'existe** pour ces cours

## ✅ Solution en 3 étapes

### Étape 1 : Identifier votre organisation

Exécutez cette requête pour trouver l'ID de votre organisation :

```sql
SELECT 
  o.id as org_id,
  o.name as organisation,
  COUNT(DISTINCT om.user_id) as nb_membres
FROM orgs o
LEFT JOIN org_members om ON om.org_id = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at DESC;
```

**Notez l'`org_id`** de votre organisation.

### Étape 2 : Vérifier que les apprenants sont membres de l'organisation

```sql
SELECT 
  p.full_name as nom_apprenant,
  o.name as organisation,
  CASE 
    WHEN om.id IS NULL THEN '❌ Pas membre'
    ELSE '✅ Membre'
  END as statut
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.user_id
JOIN programs pr ON pr.id = pe.program_id
LEFT JOIN org_members om ON om.user_id = pe.user_id
LEFT JOIN orgs o ON o.id = om.org_id
WHERE pe.status = 'active'
AND pr.title = 'Les API';
```

Si certains apprenants ne sont pas membres, ajoutez-les :

```sql
-- Remplacez 'ORG_ID' par l'ID de votre organisation
INSERT INTO org_members (org_id, user_id, role, display_name)
SELECT DISTINCT
  'ORG_ID'::uuid,  -- ⚠️ REMPLACEZ
  pe.user_id,
  'student' as role,
  p.full_name as display_name
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.user_id
JOIN programs pr ON pr.id = pe.program_id
LEFT JOIN org_members om ON om.user_id = pe.user_id AND om.org_id = 'ORG_ID'::uuid
WHERE pe.status = 'active'
AND pr.title = 'Les API'
AND om.id IS NULL
ON CONFLICT (org_id, user_id) DO NOTHING;
```

### Étape 3 : Créer les sessions et lier les enrollments

Exécutez le script `creer-sessions-pour-programme.sql` en remplaçant `'ORG_ID'` par l'ID de votre organisation.

Ou exécutez directement cette requête :

```sql
-- 1. Créer les sessions pour chaque cours du programme "Les API"
INSERT INTO sessions (org_id, course_id, title, status, created_by)
SELECT DISTINCT
  'ORG_ID'::uuid as org_id,  -- ⚠️ REMPLACEZ
  c.id as course_id,
  'Session ' || c.title || ' - ' || TO_CHAR(NOW(), 'DD/MM/YYYY') as title,
  'active' as status,
  auth.uid() as created_by
FROM program_courses pc
JOIN programs pr ON pr.id = pc.program_id
JOIN courses c ON c.id = pc.course_id
LEFT JOIN sessions s ON s.course_id = c.id 
  AND s.org_id = 'ORG_ID'::uuid  -- ⚠️ REMPLACEZ
  AND s.status = 'active'
WHERE pr.title = 'Les API'
AND s.id IS NULL;

-- 2. Lier tous les enrollments aux sessions
UPDATE enrollments e
SET session_id = (
  SELECT s.id 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1
)
WHERE e.status = 'active'
AND e.session_id IS NULL
AND EXISTS (
  SELECT 1 FROM org_members om WHERE om.user_id = e.user_id
)
AND EXISTS (
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
);
```

## ✅ Vérification

Après avoir exécuté les scripts, vérifiez avec :

```sql
SELECT 
  s.title as session_title,
  c.title as cours,
  COUNT(DISTINCT e.user_id) as nb_apprenants
FROM sessions s
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
WHERE s.status = 'active'
GROUP BY s.id, s.title, c.title;
```

Vous devriez voir 4 sessions (une par cours) avec 13 apprenants chacune.

## 🎯 Résultat attendu

Après ces étapes :
- ✅ 4 sessions créées (une par cours du programme "Les API")
- ✅ 52 enrollments liés aux sessions (13 apprenants × 4 cours)
- ✅ Les apprenants apparaissent dans le portail formateur

Rafraîchissez le portail formateur (`/trainer`) et vous devriez voir les sessions avec les apprenants !






---


### 📄 🔧 Solution : Écran blanc pour l'exercice REST Bibliothèque

*Source: `portal-formations/SOLUTION-ECRAN-BLANC.md`*


---

# 🔧 Solution : Écran blanc pour l'exercice REST Bibliothèque

## 🔍 Diagnostic

Le problème vient probablement d'un **chapitre vide** dans la base de données qui masque le contenu de l'exercice.

### Symptômes observés :
- ✅ Le titre de l'exercice s'affiche
- ✅ Un chapitre "#1" avec le même titre est affiché
- ❌ Le contenu est blanc/vide

### Cause probable :
Un chapitre a été créé automatiquement (ou manuellement) pour cet exercice, mais il est vide. Le système affiche le chapitre au lieu du contenu de l'exercice.

## ✅ Solutions

### Solution 1 : Supprimer le chapitre vide (Recommandé)

Exécutez cette requête SQL après avoir trouvé l'ID de l'exercice :

```sql
-- 1. Trouver l'ID de l'exercice
SELECT id, title, type 
FROM items 
WHERE title ILIKE '%bibliothèque%' 
   OR title ILIKE '%REST%';

-- 2. Voir les chapitres de cet exercice
SELECT c.id, c.title, c.content, c.position
FROM chapters c
JOIN items i ON c.item_id = i.id
WHERE i.title ILIKE '%bibliothèque%' 
   OR i.title ILIKE '%REST%';

-- 3. Supprimer les chapitres vides
DELETE FROM chapters 
WHERE item_id = 'VOTRE_ITEM_ID' 
  AND (content IS NULL OR content::text = 'null' OR content::text = '{}');
```

### Solution 2 : Remplir le chapitre avec le contenu de l'exercice

Si vous voulez garder le chapitre, vous pouvez y copier le contenu de la question :

```sql
-- Remplacer VOTRE_ITEM_ID et VOTRE_CHAPTER_ID
UPDATE chapters 
SET content = (
    SELECT content->'question' 
    FROM items 
    WHERE id = 'VOTRE_ITEM_ID'
)
WHERE id = 'VOTRE_CHAPTER_ID';
```

### Solution 3 : Vérifier via l'interface d'administration

1. Allez dans **Admin** → **Items**
2. Trouvez l'exercice "Identifiez les ressources REST pour un système de gestion de bibliothèque"
3. Cliquez sur l'exercice
4. Allez dans l'onglet **Chapitres**
5. Supprimez les chapitres vides ou ajoutez du contenu

## 🔍 Vérifications

### Vérifier que l'exercice a bien un contenu

```sql
SELECT 
    id,
    title,
    type,
    content->'question' IS NOT NULL as has_question,
    content->'correction' IS NOT NULL as has_correction,
    jsonb_typeof(content->'question') as question_type
FROM items
WHERE title ILIKE '%bibliothèque%';
```

### Vérifier les chapitres

```sql
SELECT 
    c.id,
    c.title,
    c.position,
    CASE 
        WHEN c.content IS NULL THEN 'NULL'
        WHEN c.content::text = 'null' THEN 'null string'
        WHEN c.content::text = '{}' THEN 'empty object'
        ELSE 'has content'
    END as content_status
FROM chapters c
JOIN items i ON c.item_id = i.id
WHERE i.title ILIKE '%bibliothèque%';
```

## 🎯 Solution rapide (via Supabase Dashboard)

1. Ouvrez le **Supabase Dashboard**
2. Allez dans **Table Editor** → **chapters**
3. Filtrez par `item_id` = l'ID de votre exercice
4. Supprimez les chapitres vides (ceux avec `content` = NULL ou vide)
5. Rechargez la page de l'exercice

## 📝 Note importante

Les exercices n'ont **pas besoin de chapitres**. Le contenu de l'exercice (question et correction) est stocké directement dans `items.content.question` et `items.content.correction`.

Les chapitres sont utilisés pour :
- Les ressources (slides, documents)
- Les jeux avec plusieurs niveaux
- Les contenus structurés en plusieurs parties

Pour un exercice simple, **supprimez les chapitres vides** et le contenu s'affichera correctement via `ItemRenderer`.

## ✅ Après correction

Une fois le chapitre vide supprimé, vous devriez voir :
- ✅ La section "Énoncé" avec la question formatée
- ✅ La zone de saisie pour la réponse
- ✅ Le bouton "Soumettre"
- ✅ La correction (si disponible)






---


### 📄 Solution : Apprenants via programmes et sessions

*Source: `portal-formations/SOLUTION-PROGRAMMES-SESSIONS.md`*


---

# Solution : Apprenants via programmes et sessions

## 🔍 Problème identifié

Si vos utilisateurs sont inscrits à un **programme** (qui contient plusieurs formations), le problème vient probablement de :

1. **Les enrollments sont créés automatiquement** via le trigger `inherit_course_access_from_program()`
2. **Mais ces enrollments n'ont pas de `session_id`** car ils sont créés sans passer par le trigger de session
3. **Les apprenants n'apparaissent donc pas** dans le portail formateur

## ✅ Solution en 4 étapes

### Étape 1 : Diagnostic

Exécutez le script `lier-apprenants-session-avec-programmes.sql` pour voir :
- Combien d'apprenants sont inscrits via des programmes
- Combien d'enrollments ont été créés
- Combien ont un `session_id`

### Étape 2 : Vérifier que les apprenants sont membres de l'organisation

Les apprenants doivent être membres de l'organisation de la session. Vérifiez avec :

```sql
SELECT 
  p.full_name as nom_apprenant,
  pr.title as programme,
  o.name as organisation,
  CASE 
    WHEN om.id IS NULL THEN '❌ Pas membre'
    ELSE '✅ Membre'
  END as statut
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.user_id
JOIN programs pr ON pr.id = pe.program_id
LEFT JOIN org_members om ON om.user_id = pe.user_id
LEFT JOIN orgs o ON o.id = om.org_id
WHERE pe.status = 'active';
```

### Étape 3 : Lier les enrollments aux sessions

Exécutez cette requête pour lier tous les enrollments (créés via programme ou directement) aux sessions :

```sql
UPDATE enrollments e
SET session_id = (
  SELECT s.id 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1
)
WHERE e.status = 'active'
AND e.session_id IS NULL
AND EXISTS (
  SELECT 1 FROM org_members om WHERE om.user_id = e.user_id
)
AND EXISTS (
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
);
```

### Étape 4 : Créer les enrollments manquants (si nécessaire)

Si le trigger n'a pas créé les enrollments, créez-les manuellement :

```sql
INSERT INTO enrollments (user_id, course_id, status, source, enrolled_at)
SELECT DISTINCT
  pe.user_id,
  pc.course_id,
  'active' as status,
  'manual' as source,
  pe.enrolled_at
FROM program_enrollments pe
JOIN program_courses pc ON pc.program_id = pe.program_id
LEFT JOIN enrollments e ON e.user_id = pe.user_id AND e.course_id = pc.course_id
WHERE pe.status = 'active'
AND e.id IS NULL
ON CONFLICT (user_id, course_id) DO NOTHING;
```

## 🔧 Amélioration du trigger (optionnel)

Pour que les enrollments créés via les programmes aient automatiquement un `session_id`, modifiez le trigger `inherit_course_access_from_program()` :

```sql
CREATE OR REPLACE FUNCTION inherit_course_access_from_program()
RETURNS TRIGGER AS $$
DECLARE
  course_record RECORD;
  v_session_id UUID;
BEGIN
  IF NEW.status = 'active' THEN
    FOR course_record IN
      SELECT course_id
      FROM program_courses
      WHERE program_id = NEW.program_id
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM enrollments
        WHERE user_id = NEW.user_id
          AND course_id = course_record.course_id
      ) THEN
        -- Trouver la session pour ce cours et cette organisation
        SELECT s.id INTO v_session_id
        FROM sessions s
        JOIN org_members om ON om.org_id = s.org_id
        WHERE s.course_id = course_record.course_id
        AND om.user_id = NEW.user_id
        AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1;
        
        INSERT INTO enrollments (
          user_id,
          course_id,
          status,
          source,
          enrolled_at,
          session_id
        )
        VALUES (
          NEW.user_id,
          course_record.course_id,
          NEW.status,
          'manual',
          NEW.enrolled_at,
          v_session_id
        )
        ON CONFLICT (user_id, course_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📋 Checklist

- [ ] Les apprenants sont inscrits à un programme (`program_enrollments`)
- [ ] Les enrollments aux cours ont été créés (`enrollments`)
- [ ] Les apprenants sont membres de l'organisation (`org_members`)
- [ ] Les enrollments ont un `session_id` (sinon, exécutez l'étape 3)
- [ ] Les sessions existent et sont actives

## 💡 Résumé

**Le problème :** Les enrollments créés automatiquement via les programmes n'ont pas de `session_id`.

**La solution :** Exécutez le script `lier-apprenants-session-avec-programmes.sql` qui :
1. Diagnostique la situation
2. Lie les enrollments aux sessions
3. Crée les enrollments manquants si nécessaire






---


### 📄 🔧 Dépannage : Exercice REST Bibliothèque - Écran blanc

*Source: `portal-formations/TROUBLESHOOTING-EXERCICE-REST.md`*


---

# 🔧 Dépannage : Exercice REST Bibliothèque - Écran blanc

## ✅ Vérifications à faire

### 1. Vérifier le type de l'item

L'exercice doit être de type **`"exercise"`** et non **`"game"`**.

```json
{
  "type": "exercise",  // ✅ Correct
  // PAS "type": "game"  // ❌ Incorrect
}
```

### 2. Vérifier la structure du contenu

Le contenu doit avoir `question` et `correction` :

```json
{
  "content": {
    "question": { ... },  // ✅ Doit exister
    "correction": { ... } // ✅ Doit exister
  }
}
```

### 3. Vérifier le format TipTap

La question et la correction doivent être au format TipTap valide :

```json
{
  "question": {
    "type": "doc",
    "content": [ ... ]  // ✅ Array d'éléments
  }
}
```

### 4. Vérifier dans la console du navigateur

Ouvrez la console du navigateur (F12) et cherchez :
- ❌ Erreurs JavaScript (rouge)
- ⚠️ Avertissements (jaune)
- 🔍 Messages de debug

### 5. Vérifier comment l'exercice est importé

#### Option A : Import dans un cours JSON

```json
{
  "modules": [
    {
      "items": [
        {
          "type": "exercise",
          "title": "...",
          "content": { ... }
        }
      ]
    }
  ]
}
```

#### Option B : Création directe dans la base de données

Vérifiez que :
- `type = 'exercise'` (pas 'game')
- `content` est un JSON valide
- `content.question` existe
- `content.correction` existe

## 🐛 Problèmes courants et solutions

### Problème 1 : Écran blanc sans erreur

**Cause possible** : Le RichTextEditor ne peut pas rendre le contenu

**Solution** :
1. Vérifiez que le contenu TipTap est valide
2. Vérifiez qu'il n'y a pas de `codeBlock` (remplacé par des paragraphes avec `code`)
3. Vérifiez que tous les nœuds TipTap sont supportés

### Problème 2 : L'exercice s'affiche mais la question est vide

**Cause possible** : Format TipTap invalide

**Solution** :
1. Vérifiez que `content.question.type === 'doc'`
2. Vérifiez que `content.question.content` est un array
3. Vérifiez que chaque élément a un `type` valide

### Problème 3 : Erreur "Cannot read property 'content' of null"

**Cause possible** : Le contenu n'est pas chargé correctement

**Solution** :
1. Vérifiez que l'item existe dans la base de données
2. Vérifiez que `content` n'est pas `null`
3. Vérifiez que le JSON est valide

### Problème 4 : L'exercice est importé comme un jeu

**Cause possible** : Type incorrect lors de l'import

**Solution** :
1. Vérifiez que `type: "exercise"` dans le JSON
2. Si importé via l'interface, vérifiez le type sélectionné
3. Si importé via SQL, vérifiez la colonne `type`

## 🔍 Commandes de diagnostic

### Vérifier le JSON

```bash
cd portal-formations
node -e "try { const data = require('./exercice-rest-bibliotheque.json'); console.log('✅ JSON valide'); console.log('Type:', data.type); } catch(e) { console.error('❌ Erreur:', e.message); }"
```

### Vérifier dans la base de données

```sql
-- Trouver l'exercice
SELECT id, title, type, content->>'question' as question_exists
FROM items 
WHERE title ILIKE '%bibliothèque%' 
  OR title ILIKE '%REST%';

-- Vérifier le type
SELECT id, title, type 
FROM items 
WHERE type = 'exercise' 
  AND title ILIKE '%bibliothèque%';
```

### Vérifier le rendu dans React

Ouvrez la console du navigateur et cherchez :
```javascript
// Dans ReactRenderer.tsx, il y a des console.log pour debug
🔍 renderExercise - Item: ...
🔍 renderExercise - Content: ...
```

## 📝 Format minimal qui fonctionne

Si l'exercice ne fonctionne toujours pas, testez avec ce format minimal :

```json
{
  "type": "exercise",
  "title": "Test exercice",
  "position": 0,
  "published": true,
  "content": {
    "question": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Question de test"
            }
          ]
        }
      ]
    },
    "correction": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Correction de test"
            }
          ]
        }
      ]
    }
  }
}
```

## 🚀 Solution rapide

Si l'écran est blanc :

1. **Ouvrez la console du navigateur** (F12)
2. **Cherchez les erreurs** (onglet Console)
3. **Vérifiez le type** : doit être `"exercise"` pas `"game"`
4. **Vérifiez le format** : `content.question` doit être un objet TipTap valide
5. **Rechargez la page** (Ctrl+R ou Cmd+R)

## 📞 Informations à fournir pour le support

Si le problème persiste, fournissez :

1. **Console du navigateur** : Capture d'écran des erreurs
2. **Type de l'item** : `SELECT type FROM items WHERE id = '...'`
3. **Structure du contenu** : `SELECT content FROM items WHERE id = '...'`
4. **URL de la page** : Où l'exercice est affiché
5. **Navigateur utilisé** : Chrome, Firefox, Safari, etc.

## ✅ Checklist de vérification

- [ ] Le JSON est valide (pas d'erreur de syntaxe)
- [ ] Le type est `"exercise"` (pas `"game"`)
- [ ] `content.question` existe et est un objet TipTap valide
- [ ] `content.correction` existe et est un objet TipTap valide
- [ ] `content.question.type === 'doc'`
- [ ] `content.question.content` est un array
- [ ] Pas d'erreur dans la console du navigateur
- [ ] L'item est publié (`published: true`)
- [ ] L'item est dans un module/cours actif






---


### 📄 Guide de résolution : Erreur "Type d'élément non supporté" pour les slides

*Source: `portal-formations/GUIDE-FIX-TYPE-SLIDE.md`*


---

# Guide de résolution : Erreur "Type d'élément non supporté" pour les slides

## 🔍 Diagnostic étape par étape

### Étape 1 : Vérifier le type en base de données

Exécutez le script `diagnose-item-type.sql` pour vérifier :

```sql
-- Vérifier tous les types d'items
SELECT type, COUNT(*) 
FROM items 
GROUP BY type;

-- Vérifier un item spécifique (remplacez l'ID)
SELECT id, type, title, LENGTH(type) as type_length
FROM items
WHERE title LIKE '%Architecture%';
```

**Si le type n'est pas exactement `'slide'`** (avec des espaces, majuscules, etc.), corrigez-le :

```sql
UPDATE items
SET type = 'slide'
WHERE type != 'slide' 
  AND (LOWER(TRIM(type)) = 'slide' OR title LIKE '%Architecture%');
```

### Étape 2 : Vérifier la contrainte CHECK

Vérifiez que la contrainte inclut bien 'slide' :

```sql
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conname LIKE '%type%';
```

Si 'slide' n'est pas dans la liste, exécutez :

```sql
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game'));
```

### Étape 3 : Tester avec un JSON minimal

Utilisez le fichier `slide-m1-minimal-test.json` pour tester :

1. Allez dans `/admin/courses/{courseId}/edit`
2. Cliquez sur "Mode JSON"
3. Collez le contenu de `slide-m1-minimal-test.json`
4. Cliquez sur "Sauvegarder"

Si ça fonctionne, le problème vient du JSON original. Si ça ne fonctionne pas, le problème vient de la base de données ou du code.

### Étape 4 : Vérifier dans la console du navigateur

1. Ouvrez la console (F12)
2. Allez sur la page de l'item qui pose problème
3. Dans la console, tapez :

```javascript
// Si vous êtes sur la page ItemView
console.log('Item type:', window.item?.type);
console.log('Item:', window.item);
```

Ou ajoutez temporairement dans `ItemRenderer.tsx` (ligne 18) :

```typescript
console.log('🔍 ItemRenderer - item.type:', item.type, 'typeof:', typeof item.type);
console.log('🔍 ItemRenderer - item:', item);
```

### Étape 5 : Vérifier l'import JSON

Si vous importez via JSON, vérifiez que :

1. Le JSON est valide (utilisez un validateur JSON)
2. Le type est exactement `"slide"` (minuscules, pas d'espaces)
3. Le JSON est bien parsé (pas d'erreur dans la console)

### Étape 6 : Vérifier le rendu

Si l'item est créé mais ne s'affiche pas correctement :

1. Vérifiez que `item.type === 'slide'` dans le switch case
2. Vérifiez que la fonction `renderSlide()` existe et fonctionne
3. Vérifiez qu'il n'y a pas d'erreur JavaScript dans la console

## 🛠️ Solutions rapides

### Solution 1 : Recréer l'item

Si l'item existe déjà avec un type incorrect :

```sql
-- Supprimer l'item problématique
DELETE FROM items WHERE id = 'VOTRE_ITEM_ID';

-- Puis recréer via l'interface ou le JSON
```

### Solution 2 : Corriger le type directement

```sql
UPDATE items
SET type = 'slide'
WHERE id = 'VOTRE_ITEM_ID';
```

### Solution 3 : Vérifier le module_id

Assurez-vous que l'item a un `module_id` valide :

```sql
SELECT i.id, i.type, i.title, i.module_id, m.title as module_title
FROM items i
LEFT JOIN modules m ON m.id = i.module_id
WHERE i.id = 'VOTRE_ITEM_ID';
```

## 📋 Checklist de vérification

- [ ] Le type en base est exactement `'slide'` (minuscules, pas d'espaces)
- [ ] La contrainte CHECK inclut `'slide'`
- [ ] Le JSON utilise `"type": "slide"` (minuscules, guillemets doubles)
- [ ] L'item a un `module_id` valide
- [ ] L'item est `published: true`
- [ ] Pas d'erreur JavaScript dans la console
- [ ] Le JSON est valide (pas d'erreur de parsing)

## 🎯 Test final

Créez un item de test directement en SQL :

```sql
INSERT INTO items (module_id, type, title, position, published, content)
VALUES (
  'VOTRE_MODULE_ID',
  'slide',
  'Test Slide',
  1,
  true,
  '{"body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test"}]}]}}'::jsonb
)
RETURNING id, type;
```

Puis vérifiez qu'il s'affiche correctement dans l'interface.

## 🐛 Si le problème persiste

1. Vérifiez les logs du serveur (Supabase)
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que le code est à jour (pas de cache)
4. Testez avec un autre type (ex: `"type": "resource"`) pour voir si le problème est spécifique aux slides






---


### 📄 🔧 Fix : Configuration invalide pour les jeux dans les chapitres

*Source: `portal-formations/exemples-jeux/FIX-GAME-CONTENT-CHAPTER.md`*


---

# 🔧 Fix : Configuration invalide pour les jeux dans les chapitres

## Problème

Le jeu dans un chapitre affiche l'erreur :
```
⚠️ Configuration invalide
Champs manquants ou invalides :
- leftColumn (array)
- rightColumn (array)
- correctMatches (array)
```

## Diagnostic SQL

Exécutez ces requêtes dans Supabase SQL Editor pour trouver et diagnostiquer le problème :

### 1. Trouver le chapitre avec le jeu

```sql
SELECT 
  id,
  title,
  type,
  game_content,
  pg_typeof(game_content) as game_content_type
FROM chapters
WHERE type = 'game'
  AND title ILIKE '%endpoints API%'  -- ou le titre de votre jeu
ORDER BY created_at DESC
LIMIT 1;
```

### 2. Vérifier la structure du game_content

```sql
SELECT 
  id,
  title,
  -- Vérifier si game_content est un objet JSONB
  game_content->>'gameType' as game_type,
  -- Vérifier les arrays
  jsonb_typeof(game_content->'leftColumn') as left_column_type,
  jsonb_typeof(game_content->'rightColumn') as right_column_type,
  jsonb_typeof(game_content->'correctMatches') as matches_type,
  -- Vérifier les longueurs
  jsonb_array_length(game_content->'leftColumn') as left_count,
  jsonb_array_length(game_content->'rightColumn') as right_count,
  jsonb_array_length(game_content->'correctMatches') as matches_count,
  -- Voir un échantillon
  game_content->'leftColumn'->0 as first_left_item,
  game_content->'rightColumn'->0 as first_right_item
FROM chapters
WHERE id = 'VOTRE_CHAPTER_ID';
```

### 3. Vérifier si game_content est une chaîne JSON

```sql
SELECT 
  id,
  title,
  game_content,
  CASE 
    WHEN pg_typeof(game_content) = 'text' THEN 'STRING - PROBLÈME !'
    WHEN pg_typeof(game_content) = 'jsonb' THEN 'JSONB - OK'
    ELSE pg_typeof(game_content)::text
  END as status
FROM chapters
WHERE id = 'VOTRE_CHAPTER_ID';
```

### 4. Voir la structure complète

```sql
SELECT 
  id,
  title,
  jsonb_pretty(game_content) as game_content_formatted
FROM chapters
WHERE id = 'VOTRE_CHAPTER_ID';
```

## Solutions

### Solution 1 : Si game_content est une chaîne JSON (text)

Si `pg_typeof(game_content) = 'text'`, vous devez convertir en JSONB :

```sql
-- Convertir le game_content de text à jsonb
UPDATE chapters
SET game_content = game_content::jsonb
WHERE id = 'VOTRE_CHAPTER_ID'
  AND pg_typeof(game_content) = 'text';
```

### Solution 2 : Si la structure est imbriquée incorrectement

Si le `game_content` contient une structure imbriquée comme `{ "content": { "gameType": ... } }` ou `{ "game_content": { "gameType": ... } }` :

```sql
-- Extraire le game_content imbriqué
UPDATE chapters
SET game_content = game_content->'content'  -- ou game_content->'game_content'
WHERE id = 'VOTRE_CHAPTER_ID'
  AND game_content->'content' IS NOT NULL;  -- ou game_content->'game_content'
```

### Solution 3 : Si les arrays sont stockés comme des chaînes

Si `jsonb_typeof(game_content->'leftColumn') = 'string'` :

```sql
-- Reconstruire le game_content avec les arrays correctement formatés
UPDATE chapters
SET game_content = jsonb_set(
  jsonb_set(
    jsonb_set(
      game_content,
      '{leftColumn}',
      (game_content->>'leftColumn')::jsonb
    ),
    '{rightColumn}',
    (game_content->>'rightColumn')::jsonb
  ),
  '{correctMatches}',
  (game_content->>'correctMatches')::jsonb
)
WHERE id = 'VOTRE_CHAPTER_ID'
  AND jsonb_typeof(game_content->'leftColumn') = 'string';
```

### Solution 4 : Recréer le game_content avec le bon format

Si rien ne fonctionne, recréez le `game_content` avec le format correct :

```sql
-- Exemple pour un jeu de type "connection"
UPDATE chapters
SET game_content = '{
  "gameType": "connection",
  "leftColumn": [
    "GET /health",
    "GET /tasks",
    "GET /tasks/{id}",
    "POST /tasks",
    "PUT /tasks/{id}",
    "PATCH /tasks/{id}",
    "DELETE /tasks/{id}"
  ],
  "rightColumn": [
    "Vérification de l\'état de santé de l\'API",
    "Récupération d\'une tâche par son identifiant unique",
    "Création d\'une nouvelle tâche",
    "Mise à jour complète d\'une tâche (tous les champs)",
    "Mise à jour partielle d\'une tâche (champs sélectionnés)",
    "Suppression d\'une tâche",
    "Liste des tâches avec pagination et filtres"
  ],
  "correctMatches": [
    { "left": 0, "right": 0 },
    { "left": 1, "right": 6 },
    { "left": 2, "right": 1 },
    { "left": 3, "right": 2 },
    { "left": 4, "right": 3 },
    { "left": 5, "right": 4 },
    { "left": 6, "right": 5 }
  ],
  "description": "Dans une API REST, chaque endpoint a une fonction spécifique.",
  "instructions": "Cliquez sur un endpoint de la colonne de gauche, puis sur sa fonction correspondante dans la colonne de droite."
}'::jsonb
WHERE id = 'VOTRE_CHAPTER_ID';
```

**Ou utilisez un fichier JSON :**

1. Ouvrez le fichier `api-endpoints-connection-game-content-only.json`
2. Copiez le contenu
3. Dans Supabase SQL Editor :

```sql
UPDATE chapters
SET game_content = 'COLLER_LE_CONTENU_ICI'::jsonb
WHERE id = 'VOTRE_CHAPTER_ID';
```

## Vérification après correction

Après avoir appliqué une solution, vérifiez que tout est correct :

```sql
SELECT 
  id,
  title,
  game_content->>'gameType' as game_type,
  jsonb_typeof(game_content->'leftColumn') as left_type,
  jsonb_typeof(game_content->'rightColumn') as right_type,
  jsonb_typeof(game_content->'correctMatches') as matches_type,
  jsonb_array_length(game_content->'leftColumn') as left_count,
  jsonb_array_length(game_content->'rightColumn') as right_count,
  jsonb_array_length(game_content->'correctMatches') as matches_count
FROM chapters
WHERE id = 'VOTRE_CHAPTER_ID';
```

**Résultat attendu :**
- `game_type` = `'connection'`
- `left_type` = `'array'`
- `right_type` = `'array'`
- `matches_type` = `'array'`
- `left_count` > 0
- `right_count` > 0
- `matches_count` > 0

## Format correct pour game_content dans un chapitre

Le `game_content` d'un chapitre doit contenir **directement** la configuration du jeu, **SANS** structure imbriquée :

```json
{
  "gameType": "connection",
  "leftColumn": [...],
  "rightColumn": [...],
  "correctMatches": [...],
  "description": "...",
  "instructions": "..."
}
```

**❌ Format INCORRECT :**
```json
{
  "content": {
    "gameType": "connection",
    ...
  }
}
```

ou

```json
{
  "game_content": {
    "gameType": "connection",
    ...
  }
}
```

## Prévention

Pour éviter ce problème à l'avenir :

1. **Utilisez l'interface admin** `/admin/chapters/{chapterId}/json` pour créer/modifier les chapitres de type game
2. **Vérifiez que le type de colonne `game_content` est `jsonb`** dans Supabase (pas `text`)
3. **Utilisez les fichiers `*-content-only.json`** comme référence pour le format
4. **Testez le jeu immédiatement après création** pour détecter les problèmes rapidement






---


### 📄 🔧 Fix : Configuration invalide pour les jeux de type "connection"

*Source: `portal-formations/exemples-jeux/FIX-CONFIGURATION-CONNECTION-GAME.md`*


---

# 🔧 Fix : Configuration invalide pour les jeux de type "connection"

## Problème

Le jeu affiche l'erreur :
```
⚠️ Configuration invalide
La configuration du jeu "Jeu de connexion avec lignes animées" est invalide.
```

## Cause

Le fichier JSON d'exemple contient la structure complète avec `type`, `title`, `description` au niveau racine, mais dans la base de données, ces champs sont déjà dans les colonnes de la table `items`. Le champ `content` de l'item doit contenir **uniquement** le contenu du jeu.

## Solution

### Option 1 : Vérifier et corriger dans la base de données

1. **Trouver l'item avec le jeu :**
```sql
SELECT id, title, type, content 
FROM items 
WHERE type = 'game' 
  AND title ILIKE '%endpoints API%';
```

2. **Vérifier la structure du content :**
Le `content` doit être un objet JSONB avec cette structure :
```json
{
  "gameType": "connection",
  "leftColumn": [...],
  "rightColumn": [...],
  "correctMatches": [...],
  "description": "...",
  "instructions": "..."
}
```

**❌ Structure INCORRECTE (ne pas utiliser) :**
```json
{
  "type": "game",
  "title": "...",
  "description": "...",
  "content": {
    "gameType": "connection",
    ...
  }
}
```

3. **Corriger si nécessaire :**
```sql
-- Si le content contient une structure imbriquée incorrecte
UPDATE items
SET content = content->'content'  -- Extrait le content imbriqué
WHERE id = 'VOTRE_ITEM_ID'
  AND content->>'type' = 'game';  -- Seulement si content.type existe
```

### Option 2 : Utiliser le bon format lors de l'import

Lors de la création d'un item de type `game`, utilisez **uniquement** la partie `content` du JSON d'exemple :

**Format correct pour l'import :**
```json
{
  "gameType": "connection",
  "leftColumn": [
    "GET /health",
    "GET /tasks",
    "GET /tasks/{id}",
    "POST /tasks",
    "PUT /tasks/{id}",
    "PATCH /tasks/{id}",
    "DELETE /tasks/{id}"
  ],
  "rightColumn": [
    "Vérification de l'état de santé de l'API",
    "Récupération d'une tâche par son identifiant unique",
    "Création d'une nouvelle tâche",
    "Mise à jour complète d'une tâche (tous les champs)",
    "Mise à jour partielle d'une tâche (champs sélectionnés)",
    "Suppression d'une tâche",
    "Liste des tâches avec pagination et filtres"
  ],
  "correctMatches": [
    { "left": 0, "right": 0 },
    { "left": 1, "right": 6 },
    { "left": 2, "right": 1 },
    { "left": 3, "right": 2 },
    { "left": 4, "right": 3 },
    { "left": 5, "right": 4 },
    { "left": 6, "right": 5 }
  ],
  "description": "Dans une API REST, chaque endpoint a une fonction spécifique.",
  "instructions": "Cliquez sur un endpoint de la colonne de gauche, puis sur sa fonction correspondante dans la colonne de droite."
}
```

### Option 3 : Via l'interface d'administration

1. Allez dans `/admin/items/{itemId}` (ou créez un nouvel item)
2. Sélectionnez le type `game`
3. Dans le champ `content`, collez **uniquement** la partie `content` du JSON d'exemple (sans `type`, `title`, `description` au niveau racine)
4. Le `title` et la `description` doivent être remplis dans les champs séparés de l'interface, pas dans le JSON

## Vérification

Après correction, vérifiez que :
- ✅ `content->>'gameType'` = `'connection'`
- ✅ `content->'leftColumn'` est un array avec au moins 1 élément
- ✅ `content->'rightColumn'` est un array avec au moins 1 élément
- ✅ `content->'correctMatches'` est un array

```sql
SELECT 
  id,
  title,
  content->>'gameType' as game_type,
  jsonb_array_length(content->'leftColumn') as left_count,
  jsonb_array_length(content->'rightColumn') as right_count,
  jsonb_array_length(content->'correctMatches') as matches_count
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

## Exemple de correction SQL complète

```sql
-- 1. Trouver l'item
SELECT id, title, content 
FROM items 
WHERE type = 'game' 
  AND title ILIKE '%endpoints API%';

-- 2. Voir la structure actuelle
SELECT 
  id,
  title,
  content,
  content->>'gameType' as game_type,
  content->'content' as nested_content
FROM items
WHERE id = 'VOTRE_ITEM_ID';

-- 3. Corriger si content est imbriqué
UPDATE items
SET content = content->'content'
WHERE id = 'VOTRE_ITEM_ID'
  AND content->>'type' = 'game'  -- Si content.type existe
  AND content->'content' IS NOT NULL;

-- 4. Vérifier après correction
SELECT 
  id,
  title,
  content->>'gameType' as game_type,
  jsonb_array_length(content->'leftColumn') as left_count,
  jsonb_array_length(content->'rightColumn') as right_count
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

## Notes importantes

- Le champ `content` d'un item de type `game` doit contenir **directement** la configuration du jeu
- Les champs `type`, `title`, `description` sont dans les colonnes de la table `items`, pas dans `content`
- Pour les chapitres de type `game`, utilisez `game_content` au lieu de `content`






---


### 📄 🔍 Diagnostic : Configuration invalide pour les jeux

*Source: `portal-formations/exemples-jeux/DIAGNOSTIC-CONFIGURATION-INVALIDE.md`*


---

# 🔍 Diagnostic : Configuration invalide pour les jeux

## Problème

Le jeu affiche l'erreur :
```
⚠️ Configuration invalide
Champs manquants ou invalides :
- leftColumn (array)
- rightColumn (array)
- correctMatches (array)
```

## Causes possibles

1. **Les données sont stockées comme des chaînes JSON au lieu d'objets JSONB**
2. **Structure imbriquée incorrecte dans la base de données**
3. **Les arrays sont vides ou mal formatés**

## Diagnostic SQL

Exécutez ces requêtes dans Supabase SQL Editor pour diagnostiquer le problème :

### 1. Trouver votre jeu

```sql
SELECT 
  id,
  title,
  type,
  content,
  pg_typeof(content) as content_type
FROM items
WHERE type = 'game'
  AND title ILIKE '%endpoints API%'  -- ou le titre de votre jeu
ORDER BY created_at DESC
LIMIT 1;
```

### 2. Vérifier la structure du content

```sql
SELECT 
  id,
  title,
  -- Vérifier si content est un objet JSONB
  content->>'gameType' as game_type,
  -- Vérifier les arrays
  jsonb_typeof(content->'leftColumn') as left_column_type,
  jsonb_typeof(content->'rightColumn') as right_column_type,
  jsonb_typeof(content->'correctMatches') as matches_type,
  -- Vérifier les longueurs
  jsonb_array_length(content->'leftColumn') as left_count,
  jsonb_array_length(content->'rightColumn') as right_count,
  jsonb_array_length(content->'correctMatches') as matches_count,
  -- Voir un échantillon
  content->'leftColumn'->0 as first_left_item,
  content->'rightColumn'->0 as first_right_item
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

### 3. Vérifier si content est une chaîne JSON

```sql
SELECT 
  id,
  title,
  content,
  CASE 
    WHEN pg_typeof(content) = 'text' THEN 'STRING - PROBLÈME !'
    WHEN pg_typeof(content) = 'jsonb' THEN 'JSONB - OK'
    ELSE pg_typeof(content)::text
  END as status
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

## Solutions

### Solution 1 : Si content est une chaîne JSON (text)

Si `pg_typeof(content) = 'text'`, vous devez convertir en JSONB :

```sql
-- Convertir le content de text à jsonb
UPDATE items
SET content = content::jsonb
WHERE id = 'VOTRE_ITEM_ID'
  AND pg_typeof(content) = 'text';
```

### Solution 2 : Si la structure est imbriquée incorrectement

Si le content contient une structure imbriquée comme `{ "content": { "gameType": ... } }` :

```sql
-- Extraire le content imbriqué
UPDATE items
SET content = content->'content'
WHERE id = 'VOTRE_ITEM_ID'
  AND content->>'type' = 'game'  -- Si content.type existe
  AND content->'content' IS NOT NULL;
```

### Solution 3 : Si les arrays sont vides ou manquants

Vérifiez d'abord ce qui manque :

```sql
SELECT 
  id,
  title,
  CASE 
    WHEN content->'leftColumn' IS NULL THEN 'leftColumn MANQUANT'
    WHEN jsonb_array_length(content->'leftColumn') = 0 THEN 'leftColumn VIDE'
    ELSE 'leftColumn OK'
  END as left_status,
  CASE 
    WHEN content->'rightColumn' IS NULL THEN 'rightColumn MANQUANT'
    WHEN jsonb_array_length(content->'rightColumn') = 0 THEN 'rightColumn VIDE'
    ELSE 'rightColumn OK'
  END as right_status,
  CASE 
    WHEN content->'correctMatches' IS NULL THEN 'correctMatches MANQUANT'
    WHEN jsonb_array_length(content->'correctMatches') = 0 THEN 'correctMatches VIDE'
    ELSE 'correctMatches OK'
  END as matches_status
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

Si les champs manquent, vous devez recréer l'item avec le bon format.

### Solution 4 : Recréer l'item avec le bon format

1. **Exporter le JSON actuel :**
```sql
SELECT 
  jsonb_pretty(
    jsonb_build_object(
      'type', type,
      'title', title,
      'position', position,
      'published', published,
      'content', content
    )
  ) as json_export
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

2. **Corriger le JSON** en utilisant un des fichiers `*-IMPORT.json`

3. **Réimporter via l'interface** `/admin/items/new/json?module_id=XXX`

## Vérification après correction

Après avoir appliqué une solution, vérifiez que tout est correct :

```sql
SELECT 
  id,
  title,
  content->>'gameType' as game_type,
  jsonb_typeof(content->'leftColumn') as left_type,
  jsonb_typeof(content->'rightColumn') as right_type,
  jsonb_typeof(content->'correctMatches') as matches_type,
  jsonb_array_length(content->'leftColumn') as left_count,
  jsonb_array_length(content->'rightColumn') as right_count,
  jsonb_array_length(content->'correctMatches') as matches_count
FROM items
WHERE id = 'VOTRE_ITEM_ID';
```

**Résultat attendu :**
- `game_type` = `'connection'`
- `left_type` = `'array'`
- `right_type` = `'array'`
- `matches_type` = `'array'`
- `left_count` > 0
- `right_count` > 0
- `matches_count` > 0

## Prévention

Pour éviter ce problème à l'avenir :

1. **Utilisez toujours les fichiers `*-IMPORT.json`** pour l'import via l'interface JSON
2. **Vérifiez que le type de colonne `content` est `jsonb`** dans Supabase (pas `text`)
3. **Testez le jeu immédiatement après l'import** pour détecter les problèmes rapidement

## Logs de débogage dans le navigateur

Ouvrez la console du navigateur (F12) et regardez les logs. Vous devriez voir :
- `[GameRenderer] Configuration invalide:` avec les détails
- `[extractGameContent]` si le gameType est manquant

Ces logs vous indiqueront exactement ce qui ne va pas.






---


## 6. Documentation Technique


---


### 📄 API BUILDER – Constructeur de routes REST avec Drag & Drop

*Source: `portal-formations/README-API-BUILDER.md`*


---

# API BUILDER – Constructeur de routes REST avec Drag & Drop

## 📋 Description

L'API Builder est un exercice interactif qui permet aux apprenants de construire des routes REST en glissant-déposant des blocs visuels. C'est un outil pédagogique pour apprendre les conventions REST de manière visuelle et ludique.

## 🎯 Objectifs pédagogiques

- **Modélisation REST** : Comprendre comment structurer des routes REST
- **Uniformité** : Apprendre les conventions de nommage et de structure
- **Lecture visuelle d'une API** : Visualiser une API complète d'un coup d'œil
- **Validation REST** : Identifier les bonnes pratiques et anti-patterns

## 🧱 Éléments graphiques

L'exercice propose 4 types de blocs :

1. **🧱 Blocs Ressource** (Bleu) : User, Order, Product, Book, Author, etc.
2. **🔧 Blocs Verbe HTTP** (Vert) : GET, POST, PUT, PATCH, DELETE
3. **🎯 Blocs Endpoint** (Violet) : `/users`, `/users/{id}`, `/orders`, etc.
4. **🏷️ Blocs Status Code** (Orange) : 200, 201, 204, 400, 404, 500

## 🎨 Feedback visuel

Le système de validation REST fournit un feedback en temps réel :

- **🟢 Vert** → Route REST valide (conforme aux bonnes pratiques)
- **🟠 Orange** → Route REST acceptable (fonctionne mais peut être améliorée)
- **🔴 Rouge** → Anti-pattern REST détecté (violation des conventions)

## 📥 Import dans le système

### Option 1 : Import via l'interface d'administration

1. Allez dans **Admin** → **Cours** → Sélectionnez ou créez un cours
2. Cliquez sur **"+ Élément"** dans un module
3. Sélectionnez le type **"Jeu"**
4. Copiez le contenu du fichier `exercice-api-builder.json`
5. Collez-le dans l'éditeur JSON
6. Sauvegardez

### Option 2 : Import direct dans un module

Ajoutez l'exercice dans le tableau `items` d'un module :

```json
{
  "modules": [
    {
      "items": [
        {
          "type": "game",
          "title": "API BUILDER – Drag & Drop ⭐",
          "position": 0,
          "published": true,
          "content": {
            "gameType": "api-builder",
            "description": "Construisez des routes REST...",
            "instructions": "1. Glissez-déposez les blocs...",
            // ... configuration complète
          }
        }
      ]
    }
  ]
}
```

## ⚙️ Configuration

### Structure de base

```json
{
  "type": "game",
  "title": "API BUILDER – Drag & Drop ⭐",
  "content": {
    "gameType": "api-builder",
    "description": "Description de l'exercice",
    "instructions": "Instructions détaillées",
    "resources": [...],
    "verbs": [...],
    "endpoints": [...],
    "statusCodes": [...],
    "correctRoutes": [...] // Optionnel
  }
}
```

### Exemple de configuration complète

```json
{
  "gameType": "api-builder",
  "description": "Construisez des routes REST pour un système de bibliothèque",
  "instructions": "Créez les routes CRUD pour les livres et les auteurs",
  "resources": [
    { "id": "book", "label": "Book", "value": "books" },
    { "id": "author", "label": "Author", "value": "authors" }
  ],
  "verbs": [
    { "id": "get", "label": "GET", "value": "GET" },
    { "id": "post", "label": "POST", "value": "POST" },
    { "id": "put", "label": "PUT", "value": "PUT" },
    { "id": "delete", "label": "DELETE", "value": "DELETE" }
  ],
  "endpoints": [
    { "id": "books-collection", "label": "/books", "value": "/books" },
    { "id": "books-item", "label": "/books/{id}", "value": "/books/{id}" },
    { "id": "authors-collection", "label": "/authors", "value": "/authors" },
    { "id": "authors-item", "label": "/authors/{id}", "value": "/authors/{id}" }
  ],
  "statusCodes": [
    { "id": "200", "label": "200 OK", "value": "200" },
    { "id": "201", "label": "201 Created", "value": "201" },
    { "id": "204", "label": "204 No Content", "value": "204" },
    { "id": "404", "label": "404 Not Found", "value": "404" }
  ],
  "correctRoutes": [
    {
      "resource": "books",
      "verb": "GET",
      "endpoint": "/books",
      "status": "200"
    },
    {
      "resource": "books",
      "verb": "POST",
      "endpoint": "/books",
      "status": "201"
    }
  ]
}
```

## ✅ Règles de validation REST

Le système valide automatiquement les routes selon les conventions REST :

### Routes valides (🟢)

- **GET** sur collection → **200 OK**
- **GET** sur item → **200 OK**
- **POST** sur collection → **201 Created**
- **PUT** sur item → **200 OK** ou **204 No Content**
- **DELETE** sur item → **204 No Content** ou **200 OK**

### Routes acceptables (🟠)

- **POST** avec **200 OK** au lieu de **201 Created** (fonctionne mais moins sémantique)
- **PUT** avec **201 Created** (peu commun mais possible)

### Anti-patterns (🔴)

- **GET** avec **201**, **204**, **400** (sauf **404** pour item non trouvé)
- **POST** sur item (devrait être sur collection)
- **DELETE** sur collection (devrait être sur item)
- **PUT** sur collection (devrait être sur item)
- Endpoint ne correspondant pas à la ressource

## 🎓 Utilisation pédagogique

### Avant l'exercice

- Réviser les principes REST
- Expliquer les conventions de nommage (ressources au pluriel)
- Présenter les méthodes HTTP et leurs usages
- Montrer des exemples de routes REST valides

### Pendant l'exercice

- Laisser les apprenants explorer librement
- Encourager la construction de plusieurs routes
- Rappeler les bonnes pratiques REST
- Guider vers la validation pour voir le feedback

### Après l'exercice

- Discuter des routes construites
- Expliquer pourquoi certaines routes sont valides/invalides
- Proposer des variantes (gestion des erreurs, pagination, etc.)
- Montrer comment ces routes s'intègrent dans une API complète

## 🔄 Extensions possibles

Vous pouvez étendre l'exercice en ajoutant :

1. **Gestion des erreurs** : Routes avec codes 400, 404, 500
2. **Relations** : Routes imbriquées (`/books/{id}/authors`)
3. **Actions personnalisées** : Routes comme `/books/{id}/publish`
4. **Filtres et pagination** : Routes avec query parameters
5. **Versioning** : Routes avec `/v1/`, `/v2/`

## 📊 Fonctionnalités

- ✅ Drag & drop intuitif
- ✅ Validation REST en temps réel
- ✅ Feedback visuel (vert/orange/rouge)
- ✅ **Support de plusieurs routes simultanées** - Créez autant de routes que nécessaire dans le même exercice
- ✅ Ajout/suppression de routes dynamiques
- ✅ **Compteur de progression** - Affiche le nombre de routes créées vs attendues
- ✅ Validation par règles REST ou par routes correctes prédéfinies
- ✅ Interface responsive (mobile/tablette/desktop)

## 🐛 Dépannage

### Le jeu ne s'affiche pas

1. Vérifiez que `gameType: "api-builder"` est présent
2. Vérifiez que le JSON est valide
3. Vérifiez la console du navigateur pour les erreurs

### Les blocs ne se déplacent pas

1. Vérifiez que JavaScript est activé
2. Vérifiez que les événements de drag & drop ne sont pas bloqués
3. Testez dans un autre navigateur

### La validation ne fonctionne pas

1. Vérifiez que tous les slots sont remplis (Ressource + Verbe + Endpoint + Status)
2. Vérifiez que les types de blocs correspondent aux slots
3. Cliquez sur "Valider les routes" pour voir le feedback

## 📚 Ressources complémentaires

- [REST API Tutorial](https://restfulapi.net/)
- [HTTP Methods](https://developer.mozilla.org/fr/docs/Web/HTTP/Methods)
- [RESTful API Design](https://restfulapi.net/rest-api-design-tutorial-with-example/)
- [HTTP Status Codes](https://developer.mozilla.org/fr/docs/Web/HTTP/Status)

## 💡 Exemples d'utilisation

### Exercice 1 : CRUD basique (5 routes)

Demandez aux apprenants de créer les routes CRUD pour une ressource "Product" :
- GET /products (liste)
- GET /products/{id} (détail)
- POST /products (création)
- PUT /products/{id} (mise à jour)
- DELETE /products/{id} (suppression)

**Fichier** : `exercice-api-builder-multi-routes.json`

### Exercice 2 : API E-commerce complète (12 routes)

Demandez aux apprenants de construire une API complète pour un système e-commerce avec plusieurs ressources :
- Products (5 routes CRUD)
- Orders (5 routes CRUD)
- Customers (2 routes GET)

**Fichier** : `exercice-api-builder-ecommerce.json`

### Exercice 3 : Identifier les anti-patterns

Pré-remplissez des routes avec des erreurs et demandez aux apprenants de les corriger.

### Exercice 4 : API complète multi-ressources

Demandez aux apprenants de construire une API complète pour un système de bibliothèque avec Books, Authors, et Loans.




---


### 📄 Création du Cours "Développement d'API Professionnelles"

*Source: `portal-formations/README-API-COURSE.md`*


---

# Création du Cours "Développement d'API Professionnelles"

Ce guide explique comment créer la structure complète du cours dans votre base de données Supabase.

## 📋 Prérequis

1. Avoir un compte admin ou instructor dans votre base de données
2. Accès à l'interface SQL de Supabase
3. Les tables `courses`, `modules`, `items`, et `chapters` doivent exister (voir `supabase-schema.sql` et `add-chapters-schema.sql`)

## 🚀 Étapes d'installation

### 1. Obtenir votre UUID utilisateur

Exécutez cette requête dans l'éditeur SQL de Supabase pour obtenir votre UUID :

```sql
SELECT id, role, full_name 
FROM profiles 
WHERE role IN ('admin', 'instructor') 
LIMIT 1;
```

Copiez l'UUID retourné (format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2. Modifier le script SQL

Ouvrez le fichier `create-api-course-structure.sql` et remplacez la ligne 17 :

```sql
user_uuid UUID := 'VOTRE_USER_ID'::UUID; -- ⚠️ REMPLACEZ CETTE VALEUR
```

Par votre UUID, par exemple :

```sql
user_uuid UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID;
```

### 3. Exécuter le script

1. Ouvrez l'éditeur SQL de Supabase
2. Copiez-collez le contenu complet de `create-api-course-structure.sql`
3. Cliquez sur "Run" ou exécutez le script

### 4. Vérifier la création

Exécutez cette requête pour vérifier que tout a été créé :

```sql
SELECT 
  c.title as course,
  COUNT(DISTINCT m.id) as modules,
  COUNT(DISTINCT i.id) as items,
  COUNT(DISTINCT ch.id) as chapters
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN items i ON i.module_id = m.id
LEFT JOIN chapters ch ON ch.item_id = i.id
WHERE c.title = 'Développement d''API Professionnelles'
GROUP BY c.id, c.title;
```

Vous devriez voir :
- **1 cours**
- **11 modules**
- **47 items (leçons)**
- **~188 chapitres**

## 📊 Structure créée

Le script crée la hiérarchie complète :

```
📚 Développement d'API Professionnelles
  ├── 📦 Module 1: Fondamentaux et Paradigmes d'API (4 leçons)
  ├── 📦 Module 2: Spécifications et Contrats (3 leçons)
  ├── 📦 Module 3: Modélisation et Persistance (4 leçons)
  ├── 📦 Module 4: Sécurité by Design (5 leçons)
  ├── 📦 Module 5: Gestion des Erreurs et Observabilité (4 leçons)
  ├── 📦 Module 6: Tests et Qualité (4 leçons)
  ├── 📦 Module 7: Performance et Scalabilité (4 leçons)
  ├── 📦 Module 8: Architecture Micro-services et Event-Driven (5 leçons)
  ├── 📦 Module 9: Documentation et Portail Développeur (3 leçons)
  ├── 📦 Module 10: Déploiement Continu (4 leçons)
  └── 📦 Module 11: Projet Fil Rouge - Application Full-Stack PWA (7 leçons)
```

## ⚠️ Notes importantes

- **Le cours est créé en statut `published`** : il sera visible par tous les utilisateurs
- **Le cours est en accès `free`** : vous pouvez le modifier après création
- **Tous les chapitres sont vides** : vous devrez ajouter le contenu via l'interface d'édition
- **Les items du module 11 sont de type `tp`** (travaux pratiques) : les autres sont de type `resource`

## 🔧 Personnalisation

Après la création, vous pouvez :

1. **Modifier le contenu** via l'interface admin (`/admin/courses/{courseId}/edit`)
2. **Ajouter du contenu aux chapitres** via l'éditeur TipTap
3. **Réorganiser les modules/leçons** via l'interface
4. **Ajouter des exercices** en créant des items de type `exercise` ou `game`

## 🐛 Dépannage

### Erreur : "invalid input syntax for type uuid"

- Vérifiez que vous avez bien remplacé `'VOTRE_USER_ID'` par un UUID valide
- L'UUID doit être au format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Erreur : "violates foreign key constraint"

- Vérifiez que l'utilisateur avec l'UUID existe dans la table `profiles`
- Vérifiez que l'utilisateur a le rôle `admin` ou `instructor`

### Erreur : "relation does not exist"

- Vérifiez que toutes les tables existent (exécutez `supabase-schema.sql` et `add-chapters-schema.sql`)

### Le cours est créé mais vide

- Vérifiez les logs dans la console Supabase
- Le script utilise un bloc `DO $$` qui peut masquer certaines erreurs
- Essayez d'exécuter le script section par section

## 📝 Prochaines étapes

Une fois le cours créé :

1. **Ajouter le contenu** dans chaque chapitre via l'éditeur riche
2. **Créer des exercices** pour renforcer l'apprentissage
3. **Ajouter des ressources** (PDF, vidéos, liens externes)
4. **Tester le parcours** en vous inscrivant comme étudiant
5. **Publier le cours** (déjà en `published` mais vous pouvez le mettre en `draft` pour travailler dessus)

## 📚 Ressources

- [Documentation Supabase SQL](https://supabase.com/docs/guides/database)
- [Guide de chapitrage](./CHAPITRAGE.md)
- [Schéma de base de données](./supabase-schema.sql)






---


### 📄 Guide de création du cours "Conception et développement d'API performantes et sécurisées"

*Source: `portal-formations/README-COURSE-API-PERFORMANTES.md`*


---

# Guide de création du cours "Conception et développement d'API performantes et sécurisées"

## 📚 Description

Ce script SQL crée la structure complète du cours avec :
- **1 cours** : "Conception et développement d'API performantes et sécurisées"
- **10 modules** : Chaque module contient ses métadonnées (finalité, compétences, contenus, livrables)

## 🚀 Utilisation

### Étape 1 : Obtenir votre UUID utilisateur

Avant d'exécuter le script, vous devez obtenir l'UUID d'un utilisateur avec le rôle `admin` ou `instructor` :

```sql
SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;
```

Ou si vous connaissez votre email :

```sql
SELECT p.id 
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'votre-email@example.com';
```

### Étape 2 : Modifier le script

Ouvrez le fichier `create-course-api-performantes-securisees.sql` et remplacez :

```sql
user_uuid UUID := 'VOTRE_USER_ID'::UUID;
```

par :

```sql
user_uuid UUID := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::UUID;
```

(où `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` est votre UUID réel)

### Étape 3 : Exécuter le script

Exécutez le script dans l'interface SQL de Supabase ou via psql :

```bash
psql -h votre-host -U votre-user -d votre-database -f create-course-api-performantes-securisees.sql
```

Ou copiez-collez le contenu dans l'éditeur SQL de Supabase.

## 📊 Structure créée

Le script crée la hiérarchie complète :

```
📚 Conception et développement d'API performantes et sécurisées
  ├── 📦 Module 1: Fondations des architectures d'API
  │   └── 📄 Métadonnées du module M1 (finalité, compétences, contenus, livrables)
  ├── 📦 Module 2: Conception contractuelle et approche API-first
  │   └── 📄 Métadonnées du module M2
  ├── 📦 Module 3: Modélisation, persistance et gestion des données
  │   └── 📄 Métadonnées du module M3
  ├── 📦 Module 4: Sécurité des API – Security by Design
  │   └── 📄 Métadonnées du module M4
  ├── 📦 Module 5: Gestion des erreurs et observabilité
  │   └── 📄 Métadonnées du module M5
  ├── 📦 Module 6: Tests, qualité et fiabilité des API
  │   └── 📄 Métadonnées du module M6
  ├── 📦 Module 7: Performance et scalabilité
  │   └── 📄 Métadonnées du module M7
  ├── 📦 Module 8: Architectures distribuées et event-driven
  │   └── 📄 Métadonnées du module M8
  ├── 📦 Module 9: Déploiement continu et exploitation
  │   └── 📄 Métadonnées du module M9
  └── 📦 Module 10: Projet fil rouge Full-Stack
      └── 📄 Métadonnées du module M10
```

## 📋 Contenu des modules

Chaque module contient un item de type `resource` avec les métadonnées suivantes stockées dans le champ `content` JSONB :

- **module_id** : Identifiant du module (M1, M2, etc.)
- **finalite** : Finalité pédagogique du module
- **competences** : Liste des compétences visées
- **contenus** : Liste des contenus abordés
- **livrables** : Liste des livrables attendus

## ⚠️ Notes importantes

- **Le cours est créé en statut `published`** : il sera visible par tous les utilisateurs
- **Le cours est en accès `free`** : vous pouvez le modifier après création
- **Les métadonnées sont stockées dans des items de type `resource`** : vous pouvez les consulter et les modifier via l'interface d'édition
- **Les items sont publiés** : ils sont visibles par défaut

## 🔧 Personnalisation

Après la création, vous pouvez :

1. **Ajouter du contenu aux modules** : Créez des items supplémentaires (leçons, exercices, TP) dans chaque module
2. **Modifier les métadonnées** : Éditez les items de métadonnées via l'interface admin (`/admin/courses/{courseId}/edit`)
3. **Ajouter des chapitres** : Créez des chapitres dans les items pour structurer le contenu
4. **Réorganiser les modules** : Modifiez les positions via l'interface

## 🐛 Dépannage

### Erreur : "invalid input syntax for type uuid"

- Vérifiez que vous avez bien remplacé `'VOTRE_USER_ID'` par un UUID valide
- L'UUID doit être au format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Erreur : "violates foreign key constraint"

- Vérifiez que l'utilisateur avec l'UUID existe dans la table `profiles`
- Vérifiez que l'utilisateur a le rôle `admin` ou `instructor`

### Erreur : "relation does not exist"

- Vérifiez que toutes les tables existent (exécutez `SCHEMA-COMPLET-TOUTES-LES-TABLES.sql`)

## 📝 Exemple de requête pour consulter les métadonnées

Pour consulter les métadonnées d'un module après création :

```sql
SELECT 
  m.title as module_title,
  i.content->>'module_id' as module_id,
  i.content->>'finalite' as finalite,
  i.content->'competences' as competences,
  i.content->'contenus' as contenus,
  i.content->'livrables' as livrables
FROM modules m
JOIN items i ON i.module_id = m.id
WHERE m.course_id = 'VOTRE_COURSE_ID'
  AND i.title LIKE 'Métadonnées%'
ORDER BY m.position;
```






---


### 📄 Configuration de la table Data Science Exercises

*Source: `portal-formations/README-DATA-SCIENCE-EXERCISES.md`*


---

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





---


### 📄 Exercice : Identifiez les ressources REST pour un système de gestion de bibliothèque

*Source: `portal-formations/README-EXERCICE-REST-BIBLIOTHEQUE.md`*


---

# Exercice : Identifiez les ressources REST pour un système de gestion de bibliothèque

## 📋 Description

Cet exercice permet aux étudiants d'identifier les ressources REST et de proposer les URLs correspondantes pour un système de gestion de bibliothèque.

## 🎯 Objectifs pédagogiques

- Comprendre les conventions REST
- Identifier les ressources dans un contexte métier
- Construire des URLs REST appropriées
- Associer les méthodes HTTP aux opérations CRUD

## 📥 Import dans le système

### Option 1 : Import via l'interface d'administration

1. Allez dans **Admin** → **Cours** → Sélectionnez ou créez un cours
2. Cliquez sur **"Éditer le JSON"** ou **"Ajouter un item"**
3. Copiez le contenu du fichier `exercice-rest-bibliotheque.json`
4. Collez-le dans la section appropriée du JSON du cours
5. Sauvegardez

### Option 2 : Import direct dans un module

Ajoutez l'exercice dans le tableau `items` d'un module :

```json
{
  "modules": [
    {
      "items": [
        {
          "type": "exercise",
          "title": "Exercice : Identifiez les ressources REST pour un système de gestion de bibliothèque",
          "position": 0,
          "published": true,
          "content": {
            // ... contenu de l'exercice
          }
        }
      ]
    }
  ]
}
```

## ✅ Correction facilitée

L'exercice est structuré pour faciliter la correction :

### Format de réponse attendu

Les étudiants doivent remplir un template structuré :

```
1. Récupérer tous les livres
   Ressource : [réponse]
   URL : [réponse]
   Méthode HTTP : [réponse]
```

### Critères de correction

1. **Ressource** : Doit être au pluriel (livres, books)
2. **URL** : Doit suivre les conventions REST
   - Collection : `/api/ressource`
   - Ressource spécifique : `/api/ressource/:id`
3. **Méthode HTTP** : Doit correspondre à l'opération
   - GET pour la lecture
   - POST pour la création
   - PUT/PATCH pour la mise à jour

### Réponses attendues

#### 1. Récupérer tous les livres
- **Ressource** : `livres` ou `books`
- **URL** : `/api/livres` ou `/api/books`
- **Méthode HTTP** : `GET`

#### 2. Récupérer un livre spécifique (ID: 42)
- **Ressource** : `livres` ou `books`
- **URL** : `/api/livres/42` ou `/api/books/42`
- **Méthode HTTP** : `GET`

#### 3. Créer un nouveau livre
- **Ressource** : `livres` ou `books`
- **URL** : `/api/livres` ou `/api/books`
- **Méthode HTTP** : `POST`

#### 4. Mettre à jour un livre
- **Ressource** : `livres` ou `books`
- **URL** : `/api/livres/42` ou `/api/books/42` (avec l'ID du livre)
- **Méthode HTTP** : `PUT` ou `PATCH`

## 🔍 Points d'attention pour la correction

### Erreurs courantes à vérifier

1. ❌ Ressource au singulier (`livre` au lieu de `livres`)
2. ❌ URL incorrecte pour la récupération d'un livre spécifique (oubli de l'ID)
3. ❌ Mauvaise méthode HTTP (ex: GET pour créer, POST pour récupérer)
4. ❌ URL avec verbe d'action (`/api/getLivres` au lieu de `/api/livres`)
5. ❌ Oubli du préfixe `/api/`

### Variantes acceptables

- `livres` ou `books` (français/anglais)
- `PUT` ou `PATCH` pour la mise à jour (les deux sont acceptables)
- Format d'URL avec ou sans trailing slash (`/api/livres` ou `/api/livres/`)

## 📊 Grille de correction rapide

| Question | Ressource | URL | Méthode | Points |
|----------|-----------|-----|---------|--------|
| 1. Tous les livres | ✅ pluriel | ✅ /api/... | ✅ GET | /3 |
| 2. Livre ID 42 | ✅ pluriel | ✅ /api/.../42 | ✅ GET | /3 |
| 3. Créer livre | ✅ pluriel | ✅ /api/... | ✅ POST | /3 |
| 4. Mettre à jour | ✅ pluriel | ✅ /api/.../42 | ✅ PUT/PATCH | /3 |

**Total : 12 points**

## 🎓 Utilisation pédagogique

### Avant l'exercice

- Réviser les principes REST
- Expliquer les conventions de nommage
- Présenter les méthodes HTTP et leurs usages

### Pendant l'exercice

- Laisser les étudiants réfléchir individuellement
- Encourager l'utilisation du template fourni
- Rappeler les bonnes pratiques REST

### Après l'exercice

- Corriger en utilisant la correction fournie
- Discuter des erreurs communes
- Proposer des variantes (ex: gestion des emprunts, recherche de livres)

## 🔄 Extensions possibles

Vous pouvez étendre cet exercice en demandant :

1. **Supprimer un livre** : DELETE /api/livres/42
2. **Récupérer les emprunts d'un livre** : GET /api/livres/42/emprunts
3. **Rechercher des livres** : GET /api/livres?titre=...&auteur=...
4. **Gérer les auteurs** : CRUD complet sur /api/auteurs

## 📝 Notes

- L'exercice utilise le format TipTap JSON pour un affichage riche
- La correction est détaillée avec des explications pour chaque réponse
- Le template guide l'étudiant pour faciliter la correction
- Compatible avec le système de soumission et correction du portail

## 🐛 Dépannage

### L'exercice ne s'affiche pas correctement

1. Vérifiez que le JSON est valide (utilisez un validateur JSON)
2. Vérifiez que `type: "exercise"` est bien présent
3. Vérifiez que `content.question` et `content.correction` sont bien formatés

### La correction ne s'affiche pas

1. Vérifiez que `content.correction` est présent
2. Vérifiez le format TipTap JSON (doit commencer par `{"type": "doc", ...}`)

## 📚 Ressources complémentaires

- [REST API Tutorial](https://restfulapi.net/)
- [HTTP Methods](https://developer.mozilla.org/fr/docs/Web/HTTP/Methods)
- [RESTful API Design](https://restfulapi.net/rest-api-design-tutorial-with-example/)






---


### 📄 Correction des Warnings de Performance RLS

*Source: `portal-formations/README-FIX-RLS-PERFORMANCE.md`*


---

# Correction des Warnings de Performance RLS

Ce document explique comment corriger les warnings de performance RLS détectés par Supabase.

## Problèmes identifiés

### 1. auth_rls_initplan
Les politiques RLS utilisent `auth.uid()` directement, ce qui cause une réévaluation de la fonction pour chaque ligne. Cela impacte les performances à grande échelle.

**Solution** : Remplacer `auth.uid()` par `(select auth.uid())` dans toutes les politiques RLS.

### 2. multiple_permissive_policies
Certaines tables ont plusieurs politiques permissives pour le même rôle et la même action. Chaque politique doit être exécutée, ce qui peut ralentir les requêtes.

**Note** : Ces politiques multiples sont souvent nécessaires pour la logique métier (ex: un utilisateur peut voir ses propres données OU être admin). La fusion de ces politiques nécessiterait une refonte de la logique d'accès.

## Fichier de correction

Le fichier `fix-rls-performance-warnings.sql` contient toutes les corrections nécessaires :

1. **Fonctions helper optimisées** : Les fonctions `is_admin()` et `is_org_member_with_role()` sont déjà optimisées.

2. **Suppression de toutes les politiques existantes** : Le script supprime toutes les politiques mentionnées dans les warnings.

3. **Recréation avec `(select auth.uid())`** : Toutes les politiques sont recréées en utilisant `(select auth.uid())` au lieu de `auth.uid()`.

## Tables corrigées

- `sessions`
- `item_documents`
- `profiles`
- `courses`
- `modules`
- `items`
- `chapters`
- `enrollments`
- `submissions`
- `game_scores`
- `programs`
- `program_courses`
- `program_enrollments`
- `orgs`
- `org_members`
- `exercises`
- `user_settings`
- `trainer_scripts`
- `notifications`
- `assigned_resources`
- `user_time_tracking`
- `chat_messages`
- `user_presence`
- `user_responses`

## Instructions d'utilisation

1. **Sauvegarder la base de données** : Avant d'exécuter le script, assurez-vous d'avoir une sauvegarde de votre base de données.

2. **Exécuter le script** : Copiez le contenu de `fix-rls-performance-warnings.sql` dans l'éditeur SQL de Supabase et exécutez-le.

3. **Vérifier les résultats** : Le script affichera toutes les politiques créées à la fin. Vérifiez que toutes les politiques attendues sont présentes.

4. **Vérifier les warnings** : Après l'exécution, vérifiez dans l'interface Supabase que les warnings `auth_rls_initplan` ont disparu.

## Notes importantes

- Les warnings concernant les politiques multiples (`multiple_permissive_policies`) peuvent persister. C'est normal si la logique métier nécessite plusieurs politiques pour le même rôle/action.

- Si vous avez des politiques personnalisées qui ne sont pas dans ce script, vous devrez les corriger manuellement en remplaçant `auth.uid()` par `(select auth.uid())`.

- Les fonctions helper (`is_admin()`, `is_org_member_with_role()`) utilisent déjà `SECURITY DEFINER STABLE`, ce qui est optimal pour les performances.

## Exemple de transformation

**Avant** :
```sql
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

**Après** :
```sql
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING ((select auth.uid()) = id);
```

## Impact sur les performances

Cette correction devrait améliorer significativement les performances des requêtes sur les tables avec beaucoup de lignes, car `auth.uid()` ne sera plus réévalué pour chaque ligne mais une seule fois par requête.





---


### 📄 🔧 Outil de fusion du Module 6

*Source: `portal-formations/README-FUSION-MODULE-6.md`*


---

# 🔧 Outil de fusion du Module 6

Cet outil permet de fusionner automatiquement le Module 6 avec le cours "Architecture client–serveur et bases du Web".

## 📋 Prérequis

- Node.js installé sur votre système
- Les fichiers suivants doivent exister :
  - `architecture-client-serveur-web.json` (cours complet)
  - `module-6-client-serveur-api.json` (Module 6 seul)

## 🚀 Utilisation

### Méthode 1 : Exécution directe

```bash
cd portal-formations
node fusionner-module-6.cjs
```

### Méthode 2 : Exécution avec permissions

```bash
chmod +x fusionner-module-6.cjs
./fusionner-module-6.cjs
```

## 📝 Ce que fait le script

1. **Charge les fichiers JSON** :
   - Le cours complet (`architecture-client-serveur-web.json`)
   - Le Module 6 (`module-6-client-serveur-api.json`)

2. **Vérifie si le Module 6 existe déjà** :
   - Si oui : le remplace par la nouvelle version
   - Si non : l'ajoute au cours

3. **Ajuste les positions** :
   - Trie les modules par position
   - Réajuste les positions pour qu'elles soient séquentielles (1, 2, 3, 4, 5, 6...)

4. **Sauvegarde le résultat** :
   - Crée un nouveau fichier : `architecture-client-serveur-web-avec-module-6.json`
   - Le fichier original n'est **pas modifié** (sécurité)

## 📤 Import dans l'interface

Après l'exécution du script :

1. Allez sur `/admin/courses/{courseId}/json`
   - Remplacez `{courseId}` par l'ID de votre cours
2. Cliquez sur **"Importer JSON"**
3. Sélectionnez le fichier `architecture-client-serveur-web-avec-module-6.json`
4. Vérifiez l'aperçu
5. Cliquez sur **"Sauvegarder"**

## ⚠️ Important

- Le fichier original `architecture-client-serveur-web.json` n'est **pas modifié**
- Un nouveau fichier est créé : `architecture-client-serveur-web-avec-module-6.json`
- Si le Module 6 existe déjà, il sera **remplacé** automatiquement
- Tous les modules sont réorganisés avec des positions séquentielles

## 🔍 Vérification

Après l'import, vérifiez que :
- ✅ Tous les modules sont présents (1 à 6)
- ✅ Le Module 6 apparaît bien
- ✅ Tous les items du Module 6 sont visibles (7 items)
- ✅ Les positions sont correctes

## 🆘 En cas de problème

Si le script échoue :

1. **Vérifiez que les fichiers existent** :
   ```bash
   ls -la architecture-client-serveur-web.json
   ls -la module-6-client-serveur-api.json
   ```

2. **Vérifiez que les JSON sont valides** :
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('architecture-client-serveur-web.json', 'utf8'))"
   node -e "JSON.parse(require('fs').readFileSync('module-6-client-serveur-api.json', 'utf8'))"
   ```

3. **Vérifiez la console** pour les messages d'erreur détaillés

## 📊 Exemple de sortie

```
📖 Chargement des fichiers...
✅ Cours chargé: "Architecture client–serveur et bases du Web"
   Modules existants: 5
➕ Ajout du Module 6...
✅ Module 6 ajouté en position 6

✅ Fichier fusionné sauvegardé: architecture-client-serveur-web-avec-module-6.json
   Total modules: 6

📋 Prochaines étapes:
   1. Vérifiez le fichier: architecture-client-serveur-web-avec-module-6.json
   2. Importez-le dans l'interface admin: /admin/courses/{courseId}/json
   3. Cliquez sur "Importer JSON" et sélectionnez le fichier
   4. Cliquez sur "Sauvegarder"
```




---


### 📄 QUERY BUILDER » GraphQL (Drag & Drop de champs) ⭐

*Source: `portal-formations/README-GRAPHQL-QUERY-BUILDER.md`*


---

# QUERY BUILDER » GraphQL (Drag & Drop de champs) ⭐

## 📋 Description

Le GraphQL Query Builder est un exercice interactif qui permet aux apprenants de construire des requêtes GraphQL en glissant-déposant des champs depuis un schéma. C'est un outil pédagogique pour apprendre GraphQL de manière visuelle et pratique.

## 🎯 Objectifs pédagogiques

- **Comprendre GraphQL** : Apprendre la structure des requêtes GraphQL
- **Schéma GraphQL** : Visualiser et comprendre les relations entre types
- **Optimisation** : Apprendre à ne sélectionner que les champs nécessaires
- **Relations** : Comprendre les relations entre objets (User → Order → Product)
- **Validation** : Identifier les erreurs de requête (champs impossibles, types incorrects)

## 🎨 Interface

L'exercice propose 3 zones principales :

1. **📊 Schéma GraphQL (Gauche)** : Affiche le schéma avec tous les types et champs disponibles
2. **🔨 Zone de construction (Centre)** : Zone où l'apprenant construit sa requête en drag & drop
3. **👁️ Preview (Droite)** : Affiche la requête GraphQL générée et le résultat JSON simulé

## 🧩 Fonctionnalités

- ✅ **Drag & Drop intuitif** : Glissez les champs depuis le schéma vers la requête
- ✅ **Validation en temps réel** : Les champs impossibles sont rejetés
- ✅ **Preview GraphQL** : Visualisez la requête générée
- ✅ **Résultat JSON simulé** : Voyez le résultat de votre requête
- ✅ **Scénarios multiples** : Plusieurs scénarios d'entraînement
- ✅ **Optimisation** : Score basé sur le nombre de champs sélectionnés
- ✅ **Relations imbriquées** : Construisez des requêtes complexes avec plusieurs niveaux

## 📥 Import dans le système

### Option 1 : Import via l'interface d'administration

1. Allez dans **Admin** → **Cours** → Sélectionnez ou créez un cours
2. Cliquez sur **"+ Élément"** dans un module
3. Sélectionnez le type **"Jeu"**
4. Copiez le contenu du fichier `exercice-graphql-query-builder.json`
5. Collez-le dans l'éditeur JSON
6. Sauvegardez

### Option 2 : Import direct dans un module

```json
{
  "modules": [
    {
      "items": [
        {
          "type": "game",
          "title": "QUERY BUILDER » GraphQL",
          "content": {
            "gameType": "graphql-query-builder",
            // ... configuration
          }
        }
      ]
    }
  ]
}
```

## ⚙️ Configuration

### Structure de base

```json
{
  "type": "game",
  "title": "QUERY BUILDER » GraphQL",
  "content": {
    "gameType": "graphql-query-builder",
    "description": "Description de l'exercice",
    "instructions": "Instructions détaillées",
    "scenarios": [...],
    "schema": {
      "queryType": "Query",
      "types": [...]
    }
  }
}
```

### Schéma GraphQL

Le schéma doit définir :
- **Query** : Les champs racine de la requête
- **Types** : Tous les types d'objets (User, Order, Product, etc.)
- **Relations** : Les champs qui pointent vers d'autres types

Exemple :

```json
{
  "schema": {
    "queryType": "Query",
    "types": [
      {
        "name": "Query",
        "kind": "OBJECT",
        "fields": [
          {
            "id": "user",
            "name": "user",
            "type": "User",
            "isRequired": false,
            "isList": false,
            "args": [
              { "name": "id", "type": "ID!", "defaultValue": null }
            ],
            "fields": [
              { "id": "id", "name": "id", "type": "ID", "isRequired": true, "isList": false },
              { "id": "name", "name": "name", "type": "String", "isRequired": true, "isList": false }
            ]
          }
        ]
      },
      {
        "name": "User",
        "kind": "OBJECT",
        "fields": [
          { "id": "id", "name": "id", "type": "ID", "isRequired": true, "isList": false },
          { "id": "name", "name": "name", "type": "String", "isRequired": true, "isList": false },
          {
            "id": "orders",
            "name": "orders",
            "type": "Order",
            "isRequired": false,
            "isList": true
          }
        ]
      }
    ]
  }
}
```

### Scénarios

Chaque scénario définit un objectif d'apprentissage :

```json
{
  "scenarios": [
    {
      "id": "scenario-1",
      "title": "Scénario 1 : Informations utilisateur",
      "description": "Récupérez les informations de base d'un utilisateur",
      "objective": "Construire une requête pour récupérer le nom et l'email d'un utilisateur",
      "expectedFields": ["user", "name", "email"],
      "maxCost": 3
    }
  ]
}
```

**Propriétés des scénarios :**
- `id` : Identifiant unique du scénario
- `title` : Titre affiché dans l'interface
- `description` : Description du scénario
- `objective` : Objectif pédagogique
- `expectedFields` : Liste des champs attendus (pour validation)
- `maxCost` : Nombre maximum de champs recommandé (pour optimisation)

## 🎓 Utilisation pédagogique

### Avant l'exercice

- Réviser les concepts GraphQL (requêtes, schéma, types)
- Expliquer la différence avec REST
- Présenter la structure d'une requête GraphQL
- Montrer des exemples de requêtes simples

### Pendant l'exercice

- Laisser les apprenants explorer librement
- Encourager la construction de requêtes complexes
- Rappeler l'importance de l'optimisation (ne sélectionner que les champs nécessaires)
- Guider vers l'exécution pour voir le résultat

### Après l'exercice

- Discuter des requêtes construites
- Expliquer pourquoi certaines requêtes sont valides/invalides
- Montrer comment optimiser les requêtes
- Comparer avec les requêtes REST équivalentes

## ✅ Règles de validation

Le système valide automatiquement les requêtes :

### Règles de base

1. **Champs de Query** : Doivent commencer par un champ de Query (user, users, etc.)
2. **Types objets** : Les champs de type objet doivent avoir au moins un sous-champ
3. **Relations** : Les champs ne peuvent être ajoutés que s'ils existent dans le type parent
4. **Arguments** : Les arguments requis doivent être fournis

### Validation visuelle

- **Champs valides** : S'affichent normalement
- **Champs impossibles** : Sont rejetés lors du drag & drop
- **Requête incomplète** : Affiche des erreurs lors de l'exécution

## 💡 Exemples de scénarios

### Scénario 1 : Informations utilisateur

**Objectif** : Récupérer le nom et l'email d'un utilisateur

**Requête attendue** :
```graphql
query {
  user(id: "42") {
    name
    email
  }
}
```

### Scénario 2 : Commandes utilisateur

**Objectif** : Récupérer les commandes d'un utilisateur avec leur total

**Requête attendue** :
```graphql
query {
  user(id: "42") {
    name
    orders {
      id
      total
    }
  }
}
```

### Scénario 3 : Dernières commandes

**Objectif** : Récupérer les 3 dernières commandes avec détails

**Requête attendue** :
```graphql
query {
  user(id: "42") {
    name
    orders(limit: 3) {
      id
      total
      date
    }
  }
}
```

### Scénario 4 : Détails produits

**Objectif** : Récupérer les produits dans les commandes

**Requête attendue** :
```graphql
query {
  user(id: "42") {
    orders {
      items {
        product {
          name
          price
        }
      }
    }
  }
}
```

## 🔄 Extensions possibles

Vous pouvez étendre l'exercice en ajoutant :

1. **Mutations** : Ajouter des mutations GraphQL (createUser, updateOrder, etc.)
2. **Fragments** : Support des fragments GraphQL
3. **Variables** : Gestion des variables de requête
4. **Directives** : Support des directives (@include, @skip, etc.)
5. **Subscriptions** : Ajouter des subscriptions GraphQL

## 🐛 Dépannage

### Le jeu ne s'affiche pas

1. Vérifiez que `gameType: "graphql-query-builder"` est présent
2. Vérifiez que le JSON est valide
3. Vérifiez que le schéma est correctement formaté

### Les champs ne se déplacent pas

1. Vérifiez que JavaScript est activé
2. Vérifiez que les événements de drag & drop ne sont pas bloqués
3. Testez dans un autre navigateur

### La requête ne s'exécute pas

1. Vérifiez que tous les champs de type objet ont des sous-champs
2. Vérifiez que les arguments requis sont fournis
3. Consultez les messages d'erreur affichés

## 📚 Ressources complémentaires

- [GraphQL Documentation](https://graphql.org/learn/)
- [GraphQL Queries](https://graphql.org/learn/queries/)
- [GraphQL Schema](https://graphql.org/learn/schema/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

## 🎯 Fichiers disponibles

- `exercice-graphql-query-builder.json` : Exercice avec 5 scénarios de base
- `exercice-graphql-advanced.json` : Exercice avec 3 scénarios avancés

## 💡 Conseils pour créer vos propres scénarios

1. **Commencez simple** : Créez des scénarios avec 2-3 champs au début
2. **Progressez** : Ajoutez des relations imbriquées progressivement
3. **Optimisation** : Encouragez l'optimisation avec `maxCost`
4. **Contexte métier** : Utilisez des exemples concrets (e-commerce, blog, etc.)






---


### 📄 Quiz d'introduction - Big Data, Machine Learning et Data Science

*Source: `portal-formations/README-QUIZ-INTRODUCTION.md`*


---

# Quiz d'introduction - Big Data, Machine Learning et Data Science

## 📋 Description

Ce quiz d'introduction permet de recueillir la compréhension actuelle des participants sur trois concepts clés :
- **Le Big Data**
- **Le Machine Learning**
- **La Data Science**

Il permet également de connaître les attentes et objectifs d'apprentissage de chaque participant.

## 🎯 Objectifs pédagogiques

1. **Évaluer le niveau de départ** : Comprendre où en sont les participants permet d'adapter le rythme et la profondeur du cours.
2. **Créer un engagement** : En demandant aux participants de partager leur vision, on les implique activement dès le début.
3. **Identifier les attentes** : Connaître les objectifs de chacun permet de mettre en avant les parties du cours les plus pertinentes.
4. **Créer un référentiel de départ** : À la fin du cours, on pourra revenir sur ces définitions pour montrer l'évolution de la compréhension.

## 📁 Fichiers disponibles

### 1. `quiz-introduction-big-data-interactif.json`
**Format recommandé** - Quiz interactif avec composant React dédié.

Ce fichier utilise le composant `IntroductionQuiz` qui permet :
- Des champs de texte libres pour chaque question
- Sauvegarde automatique dans le localStorage
- Sauvegarde optionnelle dans Supabase (si l'utilisateur est connecté)
- Interface utilisateur moderne et responsive

**Structure :**
```json
{
  "type": "game",
  "title": "Quiz d'introduction - Vos définitions et attentes",
  "content": {
    "gameType": "introduction-quiz",
    "description": "...",
    "instructions": "...",
    "questions": [
      {
        "id": "bigdata",
        "label": "D'après vous, qu'est-ce que le Big Data ?",
        "placeholder": "Exemple : Le Big Data représente pour moi..."
      },
      // ... autres questions
    ]
  }
}
```

### 2. `quiz-introduction-big-data.json`
Format QCM avec le composant QuizGame standard.

Ce format utilise le système de quiz existant avec des questions à choix multiples. Les réponses sont présentées comme des options, mais toutes sont considérées comme valides (pas de bonne/mauvaise réponse).

### 3. `quiz-introduction-big-data-formulaire.json`
Format slide avec texte libre.

Ce format utilise une slide standard avec des espaces pour les réponses. Les participants peuvent compléter leurs réponses directement dans le texte ou via un outil externe.

## 🚀 Utilisation

### Option 1 : Quiz interactif (recommandé)

1. Intégrez le fichier `quiz-introduction-big-data-interactif.json` dans votre cours JSON
2. Placez-le en première position dans le premier module
3. Les participants pourront répondre directement dans l'interface
4. Les réponses sont sauvegardées automatiquement

**Exemple d'intégration dans un cours :**
```json
{
  "modules": [
    {
      "title": "Module 1 : Introduction",
      "items": [
        {
          "type": "game",
          "title": "Quiz d'introduction",
          "position": 1,
          "published": true,
          "content": {
            "gameType": "introduction-quiz",
            "description": "Partagez votre compréhension...",
            "questions": [
              // ... questions
            ]
          }
        }
      ]
    }
  ]
}
```

### Option 2 : Animation en présentiel

Si vous préférez animer le quiz en présentiel :

1. Utilisez le fichier `quiz-introduction-big-data-formulaire.json` comme support visuel
2. Faites un tour de table où chacun partage sa définition
3. Utilisez un outil collaboratif (Mentimeter, Padlet, Google Forms) pour collecter les réponses
4. Créez un nuage de mots à partir des réponses
5. Revenez sur ces définitions en fin de cours pour mesurer l'apprentissage

## 💾 Stockage des réponses

### Sauvegarde locale (automatique)
Les réponses sont automatiquement sauvegardées dans le `localStorage` du navigateur avec la clé `introduction_quiz_answers`.

### Sauvegarde Supabase (optionnelle)
Si vous souhaitez stocker les réponses dans Supabase, créez la table suivante :

```sql
CREATE TABLE IF NOT EXISTS user_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL,
  responses JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quiz_type)
);

-- Index pour les requêtes
CREATE INDEX idx_user_responses_user_id ON user_responses(user_id);
CREATE INDEX idx_user_responses_quiz_type ON user_responses(quiz_type);

-- RLS (Row Level Security)
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir et modifier leurs propres réponses
CREATE POLICY "Users can view their own responses"
  ON user_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON user_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON user_responses FOR UPDATE
  USING (auth.uid() = user_id);
```

## 📊 Analyse des réponses

### Interface dédiée (Recommandé)

Les formateurs et administrateurs ont accès à une **interface dédiée** pour consulter toutes les réponses :

#### Pour les Formateurs
- **URL** : `/trainer/quiz-responses`
- **Avec contexte cours** : `/trainer/courses/:courseId/quiz-responses`
- **Avec contexte session** : `/trainer/sessions/:sessionId/quiz-responses`
- **Accès depuis** : Dashboard formateur (bouton "Voir les réponses du quiz d'introduction")

#### Pour les Administrateurs
- **URL** : `/admin/quiz-responses`
- **Avec contexte cours** : `/admin/courses/:courseId/quiz-responses`
- **Accès depuis** : Page des soumissions (bouton "Voir les réponses du quiz d'introduction")

**Fonctionnalités de l'interface :**
- ✅ Recherche par nom, email ou contenu
- ✅ Filtrage par type de quiz
- ✅ Statistiques (total, réponses complètes, dernière réponse)
- ✅ Export CSV
- ✅ Affichage détaillé de chaque réponse

### Via SQL (Avancé)

Pour analyser les réponses directement via SQL :

1. **Via Supabase** : Interrogez la table `user_responses` avec `quiz_type = 'introduction_big_data'`
2. **Via la vue** : Utilisez la vue `introduction_quiz_responses` pour un format plus lisible

**Exemple de requête Supabase :**
```sql
-- Via la vue (recommandé)
SELECT * FROM introduction_quiz_responses;

-- Ou directement
SELECT 
  user_id,
  responses->>'bigdata' as bigdata_definition,
  responses->>'machinelearning' as ml_definition,
  responses->>'datascience' as ds_definition,
  responses->>'expectations' as expectations,
  updated_at
FROM user_responses
WHERE quiz_type = 'introduction_big_data'
ORDER BY updated_at DESC;
```

### Via localStorage (Développement)

Les réponses sont également stockées localement dans le navigateur avec la clé `introduction_quiz_answers` (format JSON).

## 🎨 Personnalisation

### Modifier les questions

Éditez le fichier JSON et modifiez le tableau `questions` :

```json
{
  "id": "nouvelle-question",
  "label": "Votre nouvelle question ?",
  "placeholder": "Placeholder optionnel"
}
```

### Modifier le style

Le composant `IntroductionQuiz` utilise Tailwind CSS. Vous pouvez modifier les styles directement dans le composant ou via les classes CSS.

## 📝 Notes pour le formateur

- **Durée estimée** : 10-15 minutes
- **Format** : Individuel ou collectif (tour de table)
- **Retour** : Revenez sur ces définitions en fin de cours pour montrer l'évolution
- **Adaptation** : Utilisez les réponses pour adapter le contenu du cours

## 🔄 Retour en fin de cours

En fin de formation, vous pouvez :
1. Revenir sur les définitions initiales
2. Comparer avec les définitions actuelles
3. Mesurer l'évolution de la compréhension
4. Identifier les points à renforcer

## 📚 Ressources complémentaires

- [Documentation du composant IntroductionQuiz](../src/components/IntroductionQuiz.tsx)
- [Exemples de quiz existants](../exemples-jeux/)




---


### 📄 Guide de création de slides à partir des métadonnées des modules

*Source: `portal-formations/README-SLIDES-MODULES.md`*


---

# Guide de création de slides à partir des métadonnées des modules

## 📚 Description

Ce guide explique comment transformer les métadonnées des modules (finalité, compétences, contenus, livrables) en slides structurées.

## 🎯 Deux approches disponibles

### 1. Script SQL automatique (Recommandé)

Le fichier `add-slides-from-metadata.sql` crée automatiquement des slides pour tous les modules qui contiennent des métadonnées.

**Avantages :**
- Automatique : crée toutes les slides en une seule exécution
- Cohérent : même format pour toutes les slides
- Rapide : pas besoin de créer manuellement chaque slide

**Utilisation :**

1. Exécutez d'abord `create-course-api-performantes-securisees.sql` pour créer le cours et les modules
2. Exécutez ensuite `add-slides-from-metadata.sql` pour créer les slides

```sql
-- Dans l'interface SQL de Supabase
-- 1. Créer le cours
\i create-course-api-performantes-securisees.sql

-- 2. Créer les slides
\i add-slides-from-metadata.sql
```

### 2. Format JSON (Pour import manuel)

Le fichier `slides-modules-example.json` montre la structure JSON d'une slide complète.

**Avantages :**
- Contrôle total sur le contenu
- Peut être importé via l'interface d'administration
- Permet de personnaliser chaque slide individuellement

**Utilisation :**

1. Ouvrez le fichier `slides-modules-example.json` comme référence
2. Créez un fichier JSON similaire pour chaque module
3. Importez via l'interface admin (`/admin/courses/{courseId}/edit`) en mode JSON

## 📋 Structure d'une slide

Chaque slide contient :

1. **Titre principal** (Heading niveau 1)
   - Format : `{module_id} - {titre du module}`
   - Exemple : `M1 - Fondations des architectures d'API`

2. **Section Finalité** (Heading niveau 2)
   - Paragraphe avec la finalité du module

3. **Section Compétences visées** (Heading niveau 2)
   - Liste à puces avec toutes les compétences

4. **Section Contenus abordés** (Heading niveau 2)
   - Liste à puces avec tous les contenus

5. **Section Livrables attendus** (Heading niveau 2)
   - Liste à puces avec tous les livrables

## 🔧 Format TipTap JSON

Les slides utilisent le format TipTap JSON pour le contenu. Structure de base :

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [
        { "type": "text", "text": "Titre" }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Texte du paragraphe" }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "text": "Élément de liste" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## 📊 Résultat attendu

Après exécution du script SQL, chaque module contiendra :

1. **Item de métadonnées** (type `resource`, position 0)
   - Contient les métadonnées brutes en JSONB

2. **Slide de présentation** (type `slide`, position 1)
   - Contient le contenu formaté et structuré

## 🐛 Dépannage

### Les slides ne sont pas créées

- Vérifiez que les items de métadonnées existent avec le titre `Métadonnées du module M*`
- Vérifiez que les métadonnées contiennent bien les champs `competences`, `contenus`, `livrables`

### Le contenu des slides est vide

- Vérifiez que les métadonnées sont bien au format JSONB
- Vérifiez que les tableaux ne sont pas vides

### Erreur de syntaxe SQL

- Vérifiez que vous utilisez PostgreSQL 12+ (pour le support JSONB avancé)
- Vérifiez que toutes les tables existent (`items`, `modules`)

## 📝 Exemple de requête pour vérifier

Pour vérifier que les slides ont été créées :

```sql
SELECT 
  m.title as module_title,
  i.type as item_type,
  i.title as item_title,
  i.position
FROM modules m
JOIN items i ON i.module_id = m.id
WHERE m.course_id = 'VOTRE_COURSE_ID'
ORDER BY m.position, i.position;
```

Pour voir le contenu d'une slide :

```sql
SELECT 
  i.title,
  i.content->'body'->'content' as slide_content
FROM items i
WHERE i.type = 'slide'
  AND i.title LIKE 'Présentation du module%'
LIMIT 1;
```

## 🎨 Personnalisation

Après création, vous pouvez :

1. **Modifier le contenu** via l'interface d'édition
2. **Ajouter des chapitres** pour structurer davantage
3. **Ajouter des images** via `asset_path`
4. **Modifier le format** (ajouter des tableaux, citations, etc.)

## 📌 Notes importantes

- Les slides sont créées en position après les items de métadonnées
- Les slides sont publiées par défaut (`published: true`)
- Le format TipTap permet d'ajouter du formatage riche (gras, italique, liens, etc.)






---


### 📄 TP : Identifier les impacts du Big Data et de la Data Science

*Source: `portal-formations/README-TP-BIG-DATA.md`*


---

# TP : Identifier les impacts du Big Data et de la Data Science

## 📋 Description

Ce TP complet et interactif permet aux étudiants d'analyser et d'identifier les impacts du Big Data et de la Data Science dans différents contextes métier. Les étudiants créent une application React interactive pour visualiser ces impacts à travers des cas d'usage concrets.

## 🎯 Objectifs pédagogiques

- Comprendre les différents types d'impacts du Big Data et de la Data Science
- Analyser des cas d'usage réels dans différents secteurs d'activité
- Identifier les opportunités et les défis liés à l'implémentation
- Créer une application React interactive pour visualiser et analyser ces impacts
- Développer une réflexion critique sur les enjeux éthiques et réglementaires

## 📁 Fichier

Le TP est défini dans le fichier : `tp-big-data-data-science-impacts.json`

## 🚀 Utilisation

### Import dans le LMS

Pour importer ce TP dans votre système de formation :

1. Accédez à l'interface d'administration
2. Créez un nouveau cours ou module
3. Importez le fichier `tp-big-data-data-science-impacts.json`
4. Le TP sera automatiquement structuré en 3 modules :
   - **Module 1** : Contexte et fondamentaux
   - **Module 2** : TP pratique - Application interactive
   - **Module 3** : Analyse et réflexion

### Structure du TP

#### Module 1 : Contexte et fondamentaux
- Introduction au TP
- Les dimensions des impacts (organisationnels, techniques, économiques, sociaux)
- Cas d'usage par secteur (santé, finance, retail, logistique, industrie)

#### Module 2 : TP pratique
- Instructions détaillées pour créer l'application React
- Checklist complète (21 points)
- Critères d'évaluation
- Livrables attendus
- Exemples de cas d'usage à implémenter

#### Module 3 : Analyse et réflexion
- Exercice d'analyse critique
- Ressources supplémentaires

## 💻 Technologies utilisées dans le TP

Les étudiants devront utiliser :
- React 18+ avec TypeScript
- Vite pour le build
- Tailwind CSS pour le styling
- Recharts ou Chart.js pour les visualisations
- React Router pour la navigation
- Zustand ou Context API pour la gestion d'état
- React Hook Form pour les formulaires

## ✨ Fonctionnalités de l'application

L'application React doit inclure :
- Dashboard avec statistiques et vue d'ensemble
- Gestion CRUD des cas d'usage
- Visualisations interactives (radar, barres, circulaire, scatter plot)
- Système de comparaison entre cas d'usage
- Export de rapports PDF/HTML
- Filtrage et recherche avancée

## 📊 Cas d'usage fournis

Le TP inclut 5 exemples de cas d'usage :
1. Détection de fraude bancaire en temps réel
2. Diagnostic médical assisté par IA
3. Recommandation de produits e-commerce
4. Optimisation de la chaîne logistique
5. Maintenance prédictive industrielle

## ⏱️ Durée estimée

4h à 6h de travail

## 📝 Livrables attendus

1. Code source de l'application React (repository Git)
2. README.md avec instructions d'installation et d'utilisation
3. Capture d'écran ou démo vidéo de l'application
4. Document d'analyse (2-3 pages) expliquant les choix techniques et les insights

## 🎨 Design

Le TP encourage un design moderne et professionnel avec :
- Interface responsive (mobile, tablette, desktop)
- Palette de couleurs cohérente
- Animations et transitions fluides
- Mode sombre (optionnel)

## 📚 Ressources

Le TP inclut des liens vers :
- Articles et études (McKinsey, Harvard Business Review)
- Documentation des outils (Apache Spark, TensorFlow)
- Documentation React et Vite

## ✅ Checklist complète

Le TP inclut une checklist de 21 points couvrant :
- Setup du projet
- Structure des données
- Composants de base
- Dashboard et liste des cas d'usage
- CRUD complet
- Visualisations (5 types de graphiques)
- Système de comparaison
- Export et rapports
- Tests et documentation

## 🔍 Critères d'évaluation

- Qualité du code
- Complétude des fonctionnalités
- Design et UX
- Qualité des visualisations
- Gestion d'état et performance
- Validation et gestion des erreurs
- Diversité des cas d'usage
- Documentation

## 📌 Notes

Ce TP est conçu pour être très complet et permettre aux étudiants de développer une application professionnelle tout en approfondissant leur compréhension des impacts du Big Data et de la Data Science dans les organisations.





---


### 📄 Système de Chapitrage et Éditeur de Contenu

*Source: `portal-formations/CHAPITRAGE.md`*


---

# Système de Chapitrage et Éditeur de Contenu

## Fonctionnalités ajoutées

### 1. Éditeur de contenu riche (TipTap)
- Éditeur WYSIWYG intégré pour écrire le contenu des formations directement dans l'application
- Support des formats : gras, italique, titres (H1, H2, H3), listes à puces, listes numérotées, liens
- Sauvegarde au format JSON (TipTap)

### 2. Système de chapitrage
- Possibilité de créer plusieurs chapitres pour chaque leçon (item)
- Chaque chapitre a :
  - Un titre
  - Un contenu riche (éditeur TipTap)
  - Une position (ordre d'affichage)
- Gestion complète : ajout, modification, suppression, réorganisation (drag & drop via boutons haut/bas)

### 3. Affichage pour les étudiants
- Affichage du contenu principal de la leçon
- Affichage des chapitres avec système d'accordéon (expand/collapse)
- Navigation facile entre les chapitres

## Installation

### 1. Base de données
Exécuter le script SQL pour créer la table `chapters` :
```sql
-- Voir le fichier add-chapters-schema.sql
```

### 2. Dépendances
Les dépendances ont déjà été installées :
- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-placeholder`
- `@tiptap/extension-link`
- `@tiptap/extension-image`
- `@tailwindcss/typography`

## Utilisation

### Pour les administrateurs/formateurs

1. **Créer ou modifier une leçon** :
   - Aller dans `/admin/items/{itemId}/edit`
   - Remplir les informations de base (titre, type, module)

2. **Écrire le contenu principal** :
   - Une fois la leçon sauvegardée, l'éditeur de contenu riche apparaît
   - Écrire directement le contenu dans l'éditeur
   - Le contenu est sauvegardé automatiquement dans `item.content.body`

3. **Créer des chapitres** :
   - Cliquer sur "Ajouter un chapitre"
   - Donner un titre au chapitre
   - Écrire le contenu du chapitre dans l'éditeur riche
   - Les chapitres sont sauvegardés automatiquement après 2 secondes d'inactivité

4. **Réorganiser les chapitres** :
   - Utiliser les boutons flèches haut/bas pour déplacer un chapitre
   - Les positions sont mises à jour automatiquement

### Pour les étudiants

1. **Consulter une leçon** :
   - Aller dans `/items/{itemId}`
   - Le contenu principal s'affiche en premier (s'il existe)
   - Les chapitres s'affichent ensuite avec un système d'accordéon
   - Cliquer sur un chapitre pour le développer/réduire

## Structure des données

### Table `chapters`
```sql
- id: UUID (PK)
- item_id: UUID (FK vers items)
- title: TEXT
- content: JSONB (format TipTap)
- position: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Format du contenu
Le contenu est stocké au format JSON TipTap, qui est un format standard pour les éditeurs de texte riche.

## Composants créés

1. **RichTextEditor** (`src/components/RichTextEditor.tsx`)
   - Éditeur de contenu riche basé sur TipTap
   - Mode édition et lecture seule
   - Barre d'outils avec les principales fonctionnalités

2. **ChapterManager** (`src/components/ChapterManager.tsx`)
   - Gestion complète des chapitres (CRUD)
   - Auto-sauvegarde
   - Réorganisation par drag & drop

3. **ChapterViewer** (`src/components/ChapterViewer.tsx`)
   - Affichage des chapitres pour les étudiants
   - Système d'accordéon
   - Lecture seule

## Notes importantes

- Les chapitres ne sont disponibles qu'après la première sauvegarde de l'item
- Le contenu est sauvegardé automatiquement après 2 secondes d'inactivité
- Les chapitres sont triés par position (ordre croissant)
- Le premier chapitre s'ouvre automatiquement pour les étudiants






---


### 📄 Liste complète de toutes les tables nécessaires

*Source: `portal-formations/LISTE-TOUTES-LES-TABLES.md`*


---

# Liste complète de toutes les tables nécessaires

Ce document liste toutes les tables que vous devez créer pour que l'application fonctionne correctement.

## 📊 Résumé

**Total : 22 tables**

## 📋 Liste détaillée des tables

### 1. Tables de base (7 tables)

#### 1. `profiles`
- **Description** : Profils utilisateurs (liés à `auth.users`)
- **Colonnes principales** : `id`, `role`, `full_name`, `created_at`
- **Fichier source** : `supabase-schema.sql`

#### 2. `courses`
- **Description** : Cours/formations disponibles
- **Colonnes principales** : `id`, `title`, `description`, `status`, `access_type`, `price_cents`, `created_by`, `created_at`, `updated_at`
- **Fichier source** : `supabase-schema.sql`

#### 3. `modules`
- **Description** : Modules contenus dans les cours
- **Colonnes principales** : `id`, `course_id`, `title`, `position`, `created_at`
- **Fichier source** : `supabase-schema.sql`

#### 4. `items`
- **Description** : Items/leçons contenus dans les modules (ressources, slides, exercices, TP, jeux)
- **Colonnes principales** : `id`, `module_id`, `type`, `title`, `content` (JSONB), `position`, `published`, `created_at`, `updated_at`
- **Fichier source** : `supabase-schema.sql`

#### 5. `enrollments`
- **Description** : Inscriptions des utilisateurs aux cours
- **Colonnes principales** : `id`, `user_id`, `course_id`, `status`, `source`, `enrolled_at`, `session_id`
- **Fichier source** : `supabase-schema.sql` + `add-session-support.sql`

#### 6. `submissions`
- **Description** : Soumissions/réponses des étudiants aux exercices
- **Colonnes principales** : `id`, `user_id`, `item_id`, `answer_text`, `answer_json`, `file_path`, `status`, `grade`, `submitted_at`, `graded_at`, `session_id`
- **Fichier source** : `supabase-schema.sql` + `add-session-support.sql`

#### 7. `game_scores`
- **Description** : Scores des jeux
- **Colonnes principales** : `id`, `user_id`, `course_id`, `item_id`, `score`, `metadata`, `created_at`
- **Fichier source** : `supabase-schema.sql`

---

### 2. Tables pour les programmes (3 tables)

#### 8. `programs`
- **Description** : Programmes (regroupements de formations)
- **Colonnes principales** : `id`, `title`, `description`, `status`, `access_type`, `price_cents`, `created_by`, `created_at`, `updated_at`
- **Fichier source** : `add-programs-schema.sql`

#### 9. `program_courses`
- **Description** : Liaison entre programmes et cours (avec ordre)
- **Colonnes principales** : `id`, `program_id`, `course_id`, `position`, `created_at`
- **Fichier source** : `add-programs-schema.sql`

#### 10. `program_enrollments`
- **Description** : Inscriptions aux programmes
- **Colonnes principales** : `id`, `user_id`, `program_id`, `status`, `source`, `enrolled_at`
- **Fichier source** : `add-programs-schema.sql`

---

### 3. Tables pour les chapitres (1 table)

#### 11. `chapters`
- **Description** : Chapitres contenus dans les items/leçons
- **Colonnes principales** : `id`, `item_id`, `title`, `content` (JSONB), `position`, `created_at`, `updated_at`
- **Fichier source** : `add-chapters-schema.sql`

---

### 4. Tables pour les organisations et sessions (7 tables)

#### 12. `orgs`
- **Description** : Organisations (multi-tenant)
- **Colonnes principales** : `id`, `name`, `slug`, `created_at`, `updated_at`
- **Fichier source** : `trainer-schema.sql`

#### 13. `org_members`
- **Description** : Membres des organisations (rôles par organisation)
- **Colonnes principales** : `id`, `org_id`, `user_id`, `role`, `display_name`, `created_at`
- **Fichier source** : `trainer-schema.sql`

#### 14. `sessions`
- **Description** : Sessions de formation (groupes de formation)
- **Colonnes principales** : `id`, `org_id`, `course_id`, `title`, `start_date`, `end_date`, `status`, `created_by`, `created_at`, `updated_at`
- **Fichier source** : `trainer-schema.sql`

#### 15. `exercises`
- **Description** : Détails des exercices (pour les items de type 'exercise')
- **Colonnes principales** : `id`, `item_id`, `type`, `correct_answer` (JSONB), `max_attempts`, `passing_score`, `metadata`, `created_at`, `updated_at`
- **Fichier source** : `trainer-schema.sql`

#### 16. `exercise_attempts`
- **Description** : Tentatives d'exercices (historique des tentatives)
- **Colonnes principales** : `id`, `user_id`, `exercise_id`, `session_id`, `answer_text`, `answer_json`, `score`, `is_correct`, `feedback`, `attempt_number`, `submitted_at`
- **Fichier source** : `trainer-schema.sql`

#### 17. `module_progress`
- **Description** : Progression des utilisateurs par module
- **Colonnes principales** : `id`, `user_id`, `module_id`, `session_id`, `percent`, `completed_at`, `started_at`, `updated_at`
- **Fichier source** : `trainer-schema.sql`

#### 18. `activity_events`
- **Description** : Événements d'activité (tracking des actions utilisateurs)
- **Colonnes principales** : `id`, `user_id`, `session_id`, `course_id`, `module_id`, `item_id`, `event_type`, `metadata`, `created_at`
- **Fichier source** : `trainer-schema.sql`

#### 19. `trainer_notes`
- **Description** : Notes privées des formateurs
- **Colonnes principales** : `id`, `trainer_id`, `org_id`, `course_id`, `module_id`, `session_id`, `user_id`, `title`, `content`, `tags`, `is_private`, `created_at`, `updated_at`
- **Fichier source** : `trainer-schema.sql`

---

### 5. Tables pour les jeux (2 tables)

#### 20. `game_attempts`
- **Description** : Historique de toutes les tentatives de jeu
- **Colonnes principales** : `id`, `user_id`, `game_type`, `level`, `score`, `total`, `percentage`, `badge`, `wrong_ids`, `created_at`
- **Fichier source** : `game-format-files-schema.sql`

#### 21. `game_progress`
- **Description** : Progression par niveau (meilleur score et dernier score)
- **Colonnes principales** : `id`, `user_id`, `game_type`, `level`, `best_score`, `best_badge`, `last_score`, `last_badge`, `updated_at`
- **Fichier source** : `game-format-files-schema.sql`

---

### 6. Tables pour les paramètres (1 table)

#### 22. `user_settings`
- **Description** : Paramètres utilisateur (zoom PDF, thème, taille de police, etc.)
- **Colonnes principales** : `id`, `user_id`, `pdf_zoom`, `theme`, `font_size`, `layout_preferences` (JSONB), `created_at`, `updated_at`
- **Fichier source** : `add-user-settings-schema.sql`

---

## 🚀 Comment créer toutes les tables

### Option 1 : Utiliser le fichier consolidé (recommandé)

Exécutez le fichier `SCHEMA-COMPLET-TOUTES-LES-TABLES.sql` dans l'interface SQL de Supabase. Ce fichier contient :
- ✅ Toutes les 22 tables
- ✅ Tous les indexes
- ✅ Toutes les fonctions
- ✅ Tous les triggers
- ✅ Activation du RLS sur toutes les tables

**⚠️ Important** : Après avoir exécuté ce fichier, vous devrez également exécuter les fichiers de politiques RLS pour configurer les permissions :
- `supabase-schema.sql` (politiques pour les tables de base)
- `add-programs-schema.sql` (politiques pour les programmes)
- `add-chapters-schema.sql` (politiques pour les chapitres)
- `trainer-schema.sql` (politiques pour orgs, sessions, etc.)
- `game-format-files-schema.sql` (politiques pour les jeux)
- `add-user-settings-schema.sql` (politiques pour les paramètres)
- `fix-orgs-rls-policies.sql` (corrections des politiques orgs)
- `fix-sessions-rls-for-admins.sql` (politiques sessions pour admins)

### Option 2 : Exécuter les fichiers dans l'ordre

1. `supabase-schema.sql` (tables de base)
2. `add-programs-schema.sql` (programmes)
3. `add-chapters-schema.sql` (chapitres)
4. `trainer-schema.sql` (organisations et sessions)
5. `add-session-support.sql` (ajout de session_id aux tables)
6. `game-format-files-schema.sql` (jeux)
7. `add-user-settings-schema.sql` (paramètres utilisateur)
8. `fix-orgs-rls-policies.sql` (corrections politiques)
9. `fix-sessions-rls-for-admins.sql` (politiques sessions)

---

## 📝 Notes importantes

1. **Dépendances** : Les tables doivent être créées dans l'ordre car certaines référencent d'autres tables (clés étrangères).

2. **RLS (Row Level Security)** : Toutes les tables ont RLS activé. Assurez-vous d'exécuter les fichiers de politiques pour que les utilisateurs puissent accéder aux données.

3. **Triggers** : Plusieurs triggers sont créés automatiquement :
   - Création automatique de profil lors de l'inscription
   - Mise à jour automatique de `updated_at`
   - Attribution automatique de `session_id` dans enrollments et submissions

4. **Fonctions** : Plusieurs fonctions sont créées pour :
   - Vérifier si un utilisateur est admin
   - Déterminer la session d'un utilisateur pour un cours
   - Obtenir les modules d'un programme
   - Obtenir le meilleur score d'un jeu

5. **Indexes** : Tous les indexes nécessaires sont créés pour optimiser les performances.

---

## ✅ Vérification

Pour vérifier que toutes les tables ont été créées, exécutez cette requête :

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'profiles', 'courses', 'modules', 'items', 'enrollments', 'submissions', 'game_scores',
    'programs', 'program_courses', 'program_enrollments',
    'chapters',
    'orgs', 'org_members', 'sessions', 'exercises', 'exercise_attempts', 'module_progress', 'activity_events', 'trainer_notes',
    'game_attempts', 'game_progress',
    'user_settings'
  )
ORDER BY table_name;
```

Vous devriez voir 22 tables listées.






---


### 📄 Formats JSON - Documentation

*Source: `portal-formations/FORMATS-JSON.md`*


---

# Formats JSON - Documentation

Ce document décrit les formats JSON attendus pour chaque entité du système.

## 1. Format JSON d'un Chapitre

Le format JSON d'un chapitre est le plus simple et le plus modulaire. Un chapitre peut être de type "content" (contenu normal) ou "game" (jeu interactif).

### Chapitre de type "content" (par défaut)

```json
{
  "title": "Titre du chapitre",
  "position": 0,
  "type": "content",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Contenu du chapitre en format TipTap JSON."
          }
        ]
      }
    ]
  }
}
```

### Chapitre de type "game"

```json
{
  "title": "Jeu : Associer les termes",
  "position": 1,
  "type": "game",
  "game_content": {
    "gameType": "matching",
    "pairs": [
      { "term": "REST", "definition": "Architecture stateless avec ressources HTTP" },
      { "term": "GraphQL", "definition": "Requêtes flexibles avec un seul endpoint" }
    ]
  }
}
```

### Champs

- **title** (string, requis) : Titre du chapitre
- **position** (number, requis) : Position du chapitre dans la liste (0-indexed)
- **type** (string, optionnel) : Type de chapitre - `"content"` (par défaut) ou `"game"`
- **content** (object, optionnel) : Contenu au format TipTap JSON. Utilisé uniquement si `type === "content"`. Peut être `null` si le chapitre n'a pas encore de contenu.
- **game_content** (object, optionnel) : Contenu du jeu. Utilisé uniquement si `type === "game"`. Structure dépend du `gameType` :
  - `matching` : `{ gameType: "matching", pairs: Array<{term: string, definition: string}> }`
  - `column-matching` : `{ gameType: "column-matching", leftColumn: string[], rightColumn: string[], correctMatches: Array<{left: number, right: number}> }`
  - `api-types` : `{ gameType: "api-types", apiTypes: any[], scenarios: any[] }`
  - `format-files` : `{ gameType: "format-files", levels: Array<{level: number, name: string, questions: any[]}> }`

### Exemple minimal (chapitre de contenu)

```json
{
  "title": "Introduction aux APIs",
  "position": 0,
  "content": null
}
```

### Exemple minimal (chapitre de jeu)

```json
{
  "title": "Jeu : Types d'API",
  "position": 1,
  "type": "game",
  "game_content": {
    "gameType": "matching",
    "pairs": []
  }
}
```

---

## 2. Format JSON d'un Item

Un item peut contenir des chapitres, mais ceux-ci peuvent aussi être édités séparément.

```json
{
  "type": "resource",
  "title": "Titre de l'élément",
  "position": 0,
  "published": true,
  "content": {
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Contenu principal de l'élément..."
            }
          ]
        }
      ]
    }
  },
  "chapters": [
    {
      "title": "Chapitre 1",
      "position": 0,
      "content": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Contenu du chapitre..."
              }
            ]
          }
        ]
      }
    }
  ],
  "asset_path": "chemin/vers/fichier.pdf",
  "external_url": "https://example.com",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  }
}
```

### Types d'items

#### 1. Resource (`type: "resource"`)

```json
{
  "type": "resource",
  "title": "Documentation API",
  "position": 0,
  "published": true,
  "content": {
    "description": "Description de la ressource",
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Contenu de la ressource..."
            }
          ]
        }
      ]
    }
  },
  "asset_path": "modules/module-id/item-id/document.pdf",
  "external_url": "https://example.com"
}
```

#### 2. Slide (`type: "slide"`)

```json
{
  "type": "slide",
  "title": "Support de cours",
  "position": 0,
  "published": true,
  "content": {
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Contenu du support..."
            }
          ]
        }
      ]
    }
  }
}
```

#### 3. Exercise (`type: "exercise"`)

```json
{
  "type": "exercise",
  "title": "Exercice pratique",
  "position": 0,
  "published": true,
  "content": {
    "question": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Question de l'exercice..."
            }
          ]
        }
      ]
    },
    "correction": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Correction de l'exercice..."
            }
          ]
        }
      ]
    }
  }
}
```

#### 4. TP (`type: "tp"`)

```json
{
  "type": "tp",
  "title": "Travaux pratiques",
  "position": 0,
  "published": true,
  "content": {
    "instructions": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Instructions du TP..."
            }
          ]
        }
      ]
    },
    "checklist": [
      "Tâche 1 à réaliser",
      "Tâche 2 à réaliser",
      "Tâche 3 à réaliser"
    ]
  }
}
```

#### 5. Game (`type: "game"`)

##### Matching Game

```json
{
  "type": "game",
  "title": "Jeu de correspondance",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "matching",
    "description": "Description du jeu",
    "instructions": "Instructions pour jouer",
    "pairs": [
      {
        "term": "Terme 1",
        "definition": "Définition 1"
      },
      {
        "term": "Terme 2",
        "definition": "Définition 2"
      }
    ]
  }
}
```

##### Column Matching Game

```json
{
  "type": "game",
  "title": "Jeu de correspondance par colonnes",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "column-matching",
    "description": "Description du jeu",
    "instructions": "Instructions pour jouer",
    "leftColumn": [
      "Élément gauche 1",
      "Élément gauche 2",
      "Élément gauche 3"
    ],
    "rightColumn": [
      "Élément droit 1",
      "Élément droit 2",
      "Élément droit 3"
    ],
    "correctMatches": [
      {
        "left": 0,
        "right": 0
      },
      {
        "left": 1,
        "right": 1
      },
      {
        "left": 2,
        "right": 2
      }
    ]
  }
}
```

##### API Types Game

```json
{
  "type": "game",
  "title": "Jeu des types d'API",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "api-types",
    "description": "Description du jeu",
    "instructions": "Instructions pour jouer",
    "apiTypes": [
      {
        "name": "REST",
        "description": "Representational State Transfer",
        "characteristics": ["Stateless", "Cacheable", "Uniform Interface"]
      },
      {
        "name": "GraphQL",
        "description": "Query Language for APIs",
        "characteristics": ["Single Endpoint", "Flexible Queries", "Strongly Typed"]
      }
    ],
    "scenarios": [
      {
        "description": "Scénario 1",
        "correctType": "REST"
      }
    ]
  }
}
```

##### Format Files Game (JSON / XML / Protobuf)

```json
{
  "type": "game",
  "title": "Jeu : Formats de fichiers",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "format-files",
    "description": "Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf",
    "instructions": "Répondez aux questions pour progresser dans les 3 niveaux de difficulté",
    "levels": [
      {
        "level": 1,
        "name": "Découverte",
        "questions": [
          {
            "id": "q1-1",
            "type": "identify-format",
            "prompt": "Quel est ce format de données ?",
            "snippet": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
            "options": ["JSON", "XML", "Protobuf"],
            "answer": "JSON",
            "explanation": "C'est du JSON car il utilise des accolades {} et des paires clé-valeur avec des guillemets.",
            "difficulty": 1
          },
          {
            "id": "q1-2",
            "type": "json-valid",
            "prompt": "Ce JSON est-il valide ?",
            "snippet": "{\"name\": \"John\", \"age\": 30}",
            "answer": true,
            "explanation": "Oui, c'est un JSON valide avec une syntaxe correcte.",
            "difficulty": 1
          }
        ]
      },
      {
        "level": 2,
        "name": "Intermédiaire",
        "questions": [
          {
            "id": "q2-1",
            "type": "fix-json-mcq",
            "prompt": "Quelle est l'erreur dans ce JSON ?",
            "snippet": "{\n  \"name\": \"John\",\n  age: 30\n}",
            "options": [
              "Manque des guillemets autour de \"age\"",
              "Manque une virgule",
              "Manque une accolade fermante"
            ],
            "answer": "Manque des guillemets autour de \"age\"",
            "explanation": "En JSON, toutes les clés doivent être entre guillemets doubles.",
            "difficulty": 2
          }
        ]
      },
      {
        "level": 3,
        "name": "Avancé",
        "questions": [
          {
            "id": "q3-1",
            "type": "choose-format",
            "prompt": "Quel format choisiriez-vous pour une API microservices haute performance ?",
            "options": ["JSON", "XML", "Protobuf"],
            "answer": "Protobuf",
            "explanation": "Protobuf est binaire et optimisé pour la performance, idéal pour les microservices.",
            "difficulty": 3
          }
        ]
      }
    ]
  }
}
```

**Types de questions supportés :**
- `identify-format` : Identifier le format (JSON, XML, Protobuf)
- `json-valid` : Déterminer si un JSON est valide (réponse booléenne)
- `fix-json-mcq` : Corriger une erreur JSON (QCM)
- `fix-json-editor` : Corriger un JSON dans un éditeur (réponse texte)
- `choose-format` : Choisir le format selon un cas d'usage

### Champs communs aux items

- **type** (string, requis) : Type d'item (`"resource"`, `"slide"`, `"exercise"`, `"tp"`, `"game"`)
- **title** (string, requis) : Titre de l'élément
- **position** (number, requis) : Position dans le module (0-indexed)
- **published** (boolean, optionnel) : Si l'élément est publié (défaut: `true`)
- **content** (object, requis) : Contenu selon le type (voir exemples ci-dessus)
- **chapters** (array, optionnel) : Liste des chapitres (peuvent être édités séparément)
- **asset_path** (string, optionnel) : Chemin vers un fichier (PDF, etc.)
- **external_url** (string, optionnel) : URL externe
- **theme** (object, optionnel) : Thème personnalisé
  - `primaryColor` (string) : Couleur principale (hex)
  - `secondaryColor` (string) : Couleur secondaire (hex)
  - `fontFamily` (string) : Police de caractères

---

## 3. Format JSON d'un Cours

Le format JSON d'un cours contient tous les modules et leurs items.

```json
{
  "title": "Titre du cours",
  "description": "Description du cours",
  "status": "published",
  "access_type": "free",
  "price_cents": 0,
  "currency": "EUR",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Module 1",
      "position": 0,
      "theme": {
        "primaryColor": "#10B981",
        "secondaryColor": "#059669",
        "fontFamily": "Inter"
      },
      "items": [
        {
          "id": "item-id-1",
          "type": "resource",
          "title": "Ressource 1",
          "position": 0,
          "published": true,
          "content": {},
          "chapters": [
            {
              "title": "Chapitre 1",
              "position": 0,
              "content": {
                "type": "doc",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      {
                        "type": "text",
                        "text": "Contenu..."
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### Champs du cours

- **title** (string, requis) : Titre du cours
- **description** (string, requis) : Description du cours
- **status** (string, requis) : Statut (`"draft"` ou `"published"`)
- **access_type** (string, requis) : Type d'accès (`"free"`, `"paid"`, `"invite"`)
- **price_cents** (number, optionnel) : Prix en centimes (si `access_type: "paid"`)
- **currency** (string, optionnel) : Devise (ex: `"EUR"`, `"USD"`)
- **theme** (object, optionnel) : Thème du cours
- **modules** (array, requis) : Liste des modules

### Champs d'un module

- **title** (string, requis) : Titre du module
- **position** (number, requis) : Position dans le cours (0-indexed)
- **theme** (object, optionnel) : Thème du module (hérite du thème du cours si non défini)
- **items** (array, requis) : Liste des items du module

### Champs d'un item dans un cours

Les items dans un cours ont les mêmes champs que les items indépendants, avec en plus :
- **id** (string, optionnel) : ID de l'item (pour les liens dans la sidebar)

---

## Format TipTap JSON

Le contenu des chapitres et des items utilise le format TipTap JSON. Voici un exemple de base :

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Texte simple"
        }
      ]
    },
    {
      "type": "heading",
      "attrs": {
        "level": 1
      },
      "content": [
        {
          "type": "text",
          "text": "Titre de niveau 1"
        }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "Premier élément de liste"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Types de nœuds TipTap courants

- `paragraph` : Paragraphe de texte
- `heading` : Titre (avec `attrs.level` de 1 à 6)
- `bulletList` / `orderedList` : Listes
- `listItem` : Élément de liste
- `text` : Texte simple
- `hardBreak` : Saut de ligne
- `blockquote` : Citation
- `codeBlock` : Bloc de code
- `horizontalRule` : Ligne horizontale

---

## Notes importantes

1. **Modularité** : Les chapitres peuvent être édités séparément de leur item parent pour plus de modularité.

2. **IDs** : Les IDs ne sont pas nécessaires dans le JSON (sauf pour les items dans un cours pour les liens). Ils sont générés automatiquement lors de la sauvegarde.

3. **Positions** : Les positions sont 0-indexed (commencent à 0).

4. **Contenu optionnel** : Le champ `content` peut être `null` ou un objet vide `{}` si le contenu n'est pas encore défini.

5. **Thèmes** : Les thèmes sont optionnels et héritent des valeurs par défaut si non définis.

6. **Chapitres** : Les chapitres dans un item sont optionnels. Ils peuvent être édités dans le JSON de l'item ou séparément via leur propre page JSON.




---


### 📄 📊 Comparaison des performances des paradigmes d'API

*Source: `portal-formations/comparaison-performances-paradigmes-api.md`*


---

# 📊 Comparaison des performances des paradigmes d'API

> Support visuel clair et pédagogique pour comparer les performances des principaux paradigmes d'API.
> Pensé pour être directement intégrable dans un slide.

---

## 📋 Vue synthétique (tableau comparatif)

| Paradigme API | Latence | Bande passante | Scalabilité | Complexité | Cas d'usage typiques |
|---------------|---------|----------------|-------------|------------|---------------------|
| **REST** | 🟡 Moyenne | 🟡 Moyenne | 🟢 Bonne | 🟢 Faible | APIs web classiques, CRUD, back-office |
| **GraphQL** | 🟢 Faible | 🟢 Optimisée | 🟡 Moyenne | 🔴 Élevée | Frontend complexes, apps mobiles |
| **SOAP** | 🔴 Élevée | 🔴 Lourde | 🟡 Moyenne | 🔴 Élevée | Systèmes legacy, banque, assurance |
| **gRPC** | 🟢 Très faible | 🟢 Très optimisée | 🟢 Excellente | 🔴 Élevée | Microservices, inter-services |
| **WebSocket** | 🟢 Très faible | 🟢 Continue | 🟡 Moyenne | 🟡 Moyenne | Temps réel (chat, jeux, IoT) |
| **Event-Driven** (Kafka, MQ) | 🟢 Asynchrone | 🟢 Massive | 🟢 Excellente | 🔴 Élevée | Big Data, streaming, SI distribués |

---

## 📈 Lecture "performance pure"

### ⚡ Latence (du plus rapide au plus lent)

```
gRPC ≈ WebSocket
    ↓
GraphQL
    ↓
REST
    ↓
SOAP
```

### 📦 Consommation réseau

```
gRPC (binaire)
    ↓
GraphQL (données ciblées)
    ↓
REST (JSON standard)
    ↓
SOAP (XML verbeux)
```

### 📈 Scalabilité

```
Event-Driven
    ↓
gRPC
    ↓
REST
    ↓
GraphQL
    ↓
SOAP
```

---

## 🎯 Lecture pédagogique (message clé à faire passer)

### ❌ Il n'existe PAS "la meilleure API"
### ✅ Il existe la meilleure API pour un contexte donné

| Contexte | Paradigme recommandé |
|----------|---------------------|
| CRUD simple | **REST** |
| Frontend riche / mobile | **GraphQL** |
| Microservices performants | **gRPC** |
| Temps réel | **WebSocket** |
| Systèmes critiques legacy | **SOAP** |
| Architecture à grande échelle | **Event-Driven** |

---

## 🎓 Version "slide unique" (recommandée)

### 👉 Titre du slide

**Comparer les paradigmes d'API : performances & usages**

### 👉 Visuel central

- **Tableau comparatif** (voir section "Vue synthétique" ci-dessus)
- **Icônes** ⚡📦📈 pour Latence / Réseau / Scalabilité

### 👉 Phrase de conclusion

> **La performance n'est pas une valeur absolue, mais un compromis.**

---

## 📝 Notes pédagogiques

### Points clés à retenir

1. **Pas de solution universelle** : Chaque paradigme a ses forces et faiblesses
2. **Contexte avant tout** : Le choix dépend des besoins métier et techniques
3. **Compromis nécessaire** : Performance vs Complexité vs Maintenabilité
4. **Évolution possible** : Un système peut utiliser plusieurs paradigmes (ex: REST + WebSocket)

### Questions à poser pour choisir

- Quel est le volume de données à transférer ?
- Quelle est la fréquence des requêtes ?
- Faut-il du temps réel ?
- Quelle est la complexité acceptable ?
- Quels sont les contraintes réseau (mobile, IoT) ?
- Y a-t-il des systèmes legacy à intégrer ?

---

## 🔗 Ressources complémentaires

- [Exemples REST](exemple-ressource-api-rest-sites.json)
- [Exemples GraphQL](exemple-ressource-graphql-sites.json)
- [Exemples gRPC](exemple-ressource-rpc-grpc-sites.json)






---


### 📄 Solutions - GraphQL Query Builder

*Source: `portal-formations/solutions-graphql-query-builder.md`*


---

# Solutions - GraphQL Query Builder

## 📋 Solutions pour les scénarios

Ce document contient les solutions attendues pour chaque scénario de l'exercice GraphQL Query Builder.

---

## Scénario 1 : Informations utilisateur

**Objectif** : Construire une requête pour récupérer le nom et l'email d'un utilisateur avec l'ID '42'

### Solution attendue

```graphql
query {
  user(id: "42") {
    name
    email
  }
}
```

### Explication

- Commencez par le champ `user` de Query (avec l'argument `id: "42"`)
- Ajoutez les champs scalaires `name` et `email` du type `User`
- Ne sélectionnez que les champs nécessaires (optimisation)

### Résultat JSON simulé

```json
{
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Champs attendus
- `user` (champ racine)
- `name` (champ du type User)
- `email` (champ du type User)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Champs manquants : -20 points par champ
- ⚠️ Champs supplémentaires : -5 points par champ (si maxCost défini)

---

## Scénario 2 : Commandes utilisateur

**Objectif** : Construire une requête pour récupérer le nom d'un utilisateur et ses commandes (ID et total)

### Solution attendue

```graphql
query {
  user(id: "42") {
    name
    orders {
      id
      total
    }
  }
}
```

### Explication

- Commencez par `user(id: "42")`
- Ajoutez `name` (champ scalaire)
- Ajoutez `orders` (relation vers Order)
- Dans `orders`, ajoutez `id` et `total` (champs scalaires)

### Résultat JSON simulé

```json
{
  "user": {
    "name": "John Doe",
    "orders": [
      {
        "id": "1",
        "total": 99.99
      },
      {
        "id": "2",
        "total": 149.50
      }
    ]
  }
}
```

### Champs attendus
- `user`
- `name`
- `orders`
- `id` (dans orders)
- `total` (dans orders)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Champs manquants : -20 points par champ

---

## Scénario 3 : Dernières commandes

**Objectif** : Construire une requête pour récupérer le nom d'un utilisateur et ses 3 dernières commandes (ID, total, date)

### Solution attendue

```graphql
query {
  user(id: "42") {
    name
    orders(limit: 3) {
      id
      total
      date
    }
  }
}
```

### Explication

- Commencez par `user(id: "42")`
- Ajoutez `name`
- Ajoutez `orders(limit: 3)` avec l'argument `limit: 3`
- Dans `orders`, ajoutez `id`, `total`, et `date`

### Résultat JSON simulé

```json
{
  "user": {
    "name": "John Doe",
    "orders": [
      {
        "id": "1",
        "total": 99.99,
        "date": "2024-01-15"
      },
      {
        "id": "2",
        "total": 149.50,
        "date": "2024-01-10"
      },
      {
        "id": "3",
        "total": 79.99,
        "date": "2024-01-05"
      }
    ]
  }
}
```

### Champs attendus
- `user`
- `name`
- `orders`
- `id` (dans orders)
- `total` (dans orders)
- `date` (dans orders)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Argument `limit` manquant : -10 points
- ⚠️ Champs manquants : -20 points par champ

---

## Scénario 4 : Détails produits

**Objectif** : Construire une requête pour récupérer les commandes d'un utilisateur avec les items et les produits associés

### Solution attendue

```graphql
query {
  user(id: "42") {
    orders {
      items {
        product {
          name
          price
        }
      }
    }
  }
}
```

### Explication

- Commencez par `user(id: "42")`
- Ajoutez `orders` (relation)
- Dans `orders`, ajoutez `items` (relation vers OrderItem)
- Dans `items`, ajoutez `product` (relation vers Product)
- Dans `product`, ajoutez `name` et `price` (champs scalaires)

### Résultat JSON simulé

```json
{
  "user": {
    "orders": [
      {
        "items": [
          {
            "product": {
              "name": "Laptop",
              "price": 999.99
            }
          },
          {
            "product": {
              "name": "Mouse",
              "price": 29.99
            }
          }
        ]
      }
    ]
  }
}
```

### Champs attendus
- `user`
- `orders`
- `items`
- `product`
- `name` (dans product)
- `price` (dans product)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Champs manquants : -20 points par champ
- ⚠️ Trop de champs : -5 points par champ supplémentaire (si maxCost défini)

---

## Scénario 5 : Liste utilisateurs

**Objectif** : Construire une requête pour récupérer une liste de 10 utilisateurs avec leur nom et email

### Solution attendue

```graphql
query {
  users(limit: 10) {
    name
    email
  }
}
```

### Explication

- Utilisez le champ `users` de Query (liste)
- Ajoutez l'argument `limit: 10` pour limiter à 10 utilisateurs
- Ajoutez les champs `name` et `email` du type `User`

### Résultat JSON simulé

```json
{
  "users": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    // ... 8 autres utilisateurs
  ]
}
```

### Champs attendus
- `users` (champ racine)
- `name` (dans users)
- `email` (dans users)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Argument `limit` manquant : -10 points
- ⚠️ Champs manquants : -20 points par champ

---

## Scénarios avancés

### Scénario avancé 1 : Optimisation - Champs minimaux

**Objectif** : Construire une requête optimisée pour récupérer uniquement le nom d'un utilisateur et l'ID de ses commandes

### Solution attendue

```graphql
query {
  user(id: "42") {
    name
    orders {
      id
    }
  }
}
```

### Explication

- Ne sélectionnez que les champs strictement nécessaires
- Évitez les champs inutiles comme `email`, `total`, `date`, etc.
- Optimisation : 4 champs au total (maxCost: 4)

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Champs supplémentaires : -5 points par champ au-delà de maxCost

---

### Scénario avancé 2 : Requête complète - E-commerce

**Objectif** : Construire une requête complète pour récupérer un utilisateur avec ses commandes, les items de chaque commande, et les détails des produits

### Solution attendue

```graphql
query {
  user(id: "42") {
    name
    orders {
      id
      total
      date
      items {
        quantity
        product {
          name
          price
        }
      }
    }
  }
}
```

### Explication

- Requête complète avec tous les niveaux de relations
- User → Orders → Items → Product
- Tous les champs pertinents sélectionnés

### Champs attendus
- `user`, `name`, `orders`, `id`, `total`, `date`, `items`, `quantity`, `product`, `name`, `price`

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Champs manquants : -20 points par champ

---

### Scénario avancé 3 : Liste avec filtres

**Objectif** : Construire une requête pour récupérer une liste de 5 utilisateurs avec leur nom et email

### Solution attendue

```graphql
query {
  users(limit: 5) {
    name
    email
  }
}
```

### Explication

- Utilisez `users` avec l'argument `limit: 5`
- Sélectionnez uniquement `name` et `email`

### Score
- ✅ Tous les champs présents : 100 points
- ⚠️ Argument `limit` manquant : -10 points

---

## 📊 Grille de correction

| Scénario | Champs requis | Arguments | Score max | Pénalités |
|----------|---------------|-----------|-----------|-----------|
| Scénario 1 | 3 | 1 (id) | 100 | -20/champ manquant |
| Scénario 2 | 5 | 1 (id) | 100 | -20/champ manquant |
| Scénario 3 | 6 | 2 (id, limit) | 100 | -20/champ, -10/arg |
| Scénario 4 | 6 | 1 (id) | 100 | -20/champ manquant |
| Scénario 5 | 3 | 1 (limit) | 100 | -20/champ, -10/arg |
| Avancé 1 | 4 | 1 (id) | 100 | -20/champ, -5/supplémentaire |
| Avancé 2 | 11 | 1 (id) | 100 | -20/champ manquant |
| Avancé 3 | 3 | 1 (limit) | 100 | -20/champ, -10/arg |

---

## 💡 Conseils pour la correction

1. **Vérifiez la structure** : La requête doit commencer par un champ de Query
2. **Vérifiez les relations** : Les champs de type objet doivent avoir des sous-champs
3. **Vérifiez les arguments** : Les arguments requis doivent être présents
4. **Vérifiez l'optimisation** : Si maxCost est défini, pénalisez les champs supplémentaires
5. **Vérifiez les types** : Les champs doivent correspondre aux types du schéma

---

## 🔍 Erreurs courantes

### ❌ Erreur 1 : Champ de type objet sans sous-champs

```graphql
query {
  user(id: "42") {
    orders  # ❌ Erreur : orders est un objet, il faut des sous-champs
  }
}
```

**Correction** :
```graphql
query {
  user(id: "42") {
    orders {
      id
    }
  }
}
```

### ❌ Erreur 2 : Argument manquant

```graphql
query {
  user {  # ❌ Erreur : l'argument id est requis
    name
  }
}
```

**Correction** :
```graphql
query {
  user(id: "42") {
    name
  }
}
```

### ❌ Erreur 3 : Champ impossible (mauvais type)

```graphql
query {
  user(id: "42") {
    name
    orders {
      name  # ❌ Erreur : Order n'a pas de champ name
    }
  }
}
```

**Correction** :
```graphql
query {
  user(id: "42") {
    name
    orders {
      id
      total
    }
  }
}
```

---

## 📚 Ressources

- [GraphQL Queries](https://graphql.org/learn/queries/)
- [GraphQL Schema](https://graphql.org/learn/schema/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)






---


### 📄 🚀 Commandes rapides pour lancer l'application

*Source: `big-data-impacts-app/COMMANDES-RAPIDES.md`*


---

# 🚀 Commandes rapides pour lancer l'application

## Depuis n'importe où

```bash
cd /Users/sebastien/ProjectStudies/big-data-impacts-app
npm run dev
```

## Depuis le répertoire ProjectStudies

```bash
cd big-data-impacts-app
npm run dev
```

## Chemin complet

L'application se trouve dans :
```
/Users/sebastien/ProjectStudies/big-data-impacts-app
```

## Vérifier que vous êtes au bon endroit

```bash
pwd
# Doit afficher : /Users/sebastien/ProjectStudies/big-data-impacts-app

ls package.json
# Doit afficher : package.json
```

## Si vous êtes dans le répertoire home (~)

```bash
cd ProjectStudies/big-data-impacts-app
npm run dev
```





---


### 📄 🔌 Configuration du port

*Source: `big-data-impacts-app/README-PORT.md`*


---

# 🔌 Configuration du port

## Port par défaut : 5173

L'application est configurée pour utiliser le port **5173**.

### Si le port est occupé

Si le port 5173 est déjà utilisé, Vite affichera une erreur. Vous avez deux options :

#### Option 1 : Libérer le port 5173

```bash
# Trouver le processus qui utilise le port
lsof -ti:5173

# Tuer le processus
lsof -ti:5173 | xargs kill -9
```

#### Option 2 : Utiliser un autre port

Si vous devez utiliser un autre port, modifiez :

1. **vite.config.ts** :
```typescript
server: {
  port: 5174, // ou un autre port
  strictPort: true,
}
```

2. **tp-big-data-data-science-impacts.json** :
```json
{
  "external_url": "http://localhost:5174"
}
```

### Vérifier le port utilisé

Quand vous lancez `npm run dev`, Vite affiche le port utilisé :

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Assurez-vous que l'URL dans le TP correspond au port affiché.





---


## 7. TP et Exercices


---


### 📄 TP : Analyser une requête HTTP

*Source: `portal-formations/TP_Analyser_Requete_HTTP.md`*


---

# TP : Analyser une requête HTTP

## 📋 Objectif pédagogique

À l'issue de ce TP, vous serez capable de :
- Utiliser les outils de développement du navigateur pour inspecter les requêtes HTTP
- Identifier et comprendre les composants d'une requête HTTP (méthode, URL, headers, body)
- Analyser les réponses HTTP (code de statut, headers, body)
- Comprendre le cycle de vie d'une requête HTTP
- Détecter les problèmes courants (erreurs 404, 500, timeouts)

## 🎯 Prérequis

- Navigateur web moderne (Chrome, Firefox, Edge, Safari)
- Connaissances de base sur le web (URL, navigateur)
- Aucune installation logicielle requise

---

## 📚 Partie 1 : Préparation de l'environnement

### Étape 1.1 : Ouvrir les outils de développement

**Action à réaliser :**

1. Ouvrez votre navigateur (Chrome recommandé pour ce TP)
2. Appuyez sur la touche **F12** (ou **Cmd+Option+I** sur Mac, **Ctrl+Shift+I** sur Windows/Linux)
3. Vous devriez voir un panneau s'ouvrir en bas ou sur le côté de votre navigateur

**Vérification :**
- ✅ Le panneau des outils de développement est visible
- ✅ Vous voyez plusieurs onglets : Elements, Console, Sources, Network, etc.

**Astuce :** Si le panneau ne s'ouvre pas, allez dans le menu :
- Chrome : Menu (⋮) → Plus d'outils → Outils de développement
- Firefox : Menu (☰) → Outils Web → Outils de développement
- Edge : Menu (⋯) → Plus d'outils → Outils de développement

---

### Étape 1.2 : Accéder à l'onglet Network (Réseau)

**Action à réaliser :**

1. Dans le panneau des outils de développement, cliquez sur l'onglet **"Network"** (ou **"Réseau"** en français)
2. Si vous ne voyez pas cet onglet, il peut être caché sous le menu **⋮** (trois points) → sélectionnez-le

**Vérification :**
- ✅ L'onglet Network est actif
- ✅ Vous voyez une liste (actuellement vide ou avec quelques requêtes)
- ✅ Vous voyez des colonnes : Name, Status, Type, Size, Time

**Ce que vous voyez :**
- **Name** : Nom de la ressource (fichier, API, etc.)
- **Status** : Code de statut HTTP (200, 404, etc.)
- **Type** : Type de ressource (document, xhr, fetch, etc.)
- **Size** : Taille de la réponse
- **Time** : Temps de chargement

---

### Étape 1.3 : Configurer l'affichage Network

**Action à réaliser :**

1. Vérifiez que le filtre **"All"** est sélectionné (en haut de l'onglet Network)
2. Cochez l'option **"Preserve log"** (Conserver le journal) si disponible
   - Cela permet de garder l'historique même lors de navigations
3. Décochez **"Disable cache"** pour l'instant (nous l'utiliserons plus tard)

**Vérification :**
- ✅ Le filtre "All" est actif
- ✅ Les options sont configurées comme indiqué

---

## 📚 Partie 2 : Capturer une requête simple

### Étape 2.1 : Nettoyer l'historique et recharger

**Action à réaliser :**

1. Cliquez sur le bouton **🚫** (Clear) pour effacer l'historique actuel
2. Naviguez vers une page web simple, par exemple : `https://jsonplaceholder.typicode.com/posts/1`
3. Observez la liste des requêtes qui apparaissent dans l'onglet Network

**Vérification :**
- ✅ L'historique a été effacé
- ✅ Après le rechargement, vous voyez au moins une requête dans la liste
- ✅ La requête principale (document HTML) apparaît en haut

**Ce qui se passe :**
- Le navigateur fait une requête GET vers l'URL
- Le serveur répond avec du contenu
- Cette transaction apparaît dans l'onglet Network

---

### Étape 2.2 : Sélectionner et examiner la requête principale

**Action à réaliser :**

1. Cliquez sur la première requête dans la liste (généralement celle qui correspond à l'URL de la page)
2. Un panneau de détails s'ouvre en dessous avec plusieurs onglets : Headers, Preview, Response, etc.

**Vérification :**
- ✅ La requête est sélectionnée (surbrillée)
- ✅ Le panneau de détails est visible
- ✅ Vous voyez les onglets : Headers, Preview, Response, Timing, etc.

---

## 📚 Partie 3 : Analyser les composants de la requête

### Étape 3.1 : Examiner les Headers de la requête (Request Headers)

**Action à réaliser :**

1. Dans le panneau de détails, cliquez sur l'onglet **"Headers"**
2. Faites défiler jusqu'à la section **"Request Headers"** (En-têtes de requête)
3. Identifiez et notez les en-têtes suivants :

**En-têtes à identifier :**

| En-tête | Description | Exemple de valeur |
|---------|-------------|-------------------|
| `Host` | Domaine du serveur | `jsonplaceholder.typicode.com` |
| `User-Agent` | Identifiant du navigateur | `Mozilla/5.0...` |
| `Accept` | Types de contenu acceptés | `text/html, application/json` |
| `Accept-Language` | Langues préférées | `fr-FR, fr;q=0.9` |
| `Accept-Encoding` | Encodages acceptés | `gzip, deflate, br` |
| `Connection` | Type de connexion | `keep-alive` |
| `Referer` | Page d'origine (si applicable) | URL de la page précédente |

**Action détaillée :**

Pour chaque en-tête identifié :
1. Cliquez sur l'en-tête pour voir sa valeur complète
2. Notez sa valeur dans un tableau (ou prenez une capture d'écran)
3. Comprenez son rôle dans la communication HTTP

**Exemple de ce que vous devriez voir :**

```
Request Headers:
  Host: jsonplaceholder.typicode.com
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...
  Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
  Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7
  Accept-Encoding: gzip, deflate, br
  Connection: keep-alive
  Upgrade-Insecure-Requests: 1
```

**Vérification :**
- ✅ Vous avez identifié au moins 5 en-têtes de requête
- ✅ Vous comprenez le rôle de chaque en-tête
- ✅ Vous avez noté leurs valeurs

**Question de réflexion :**
- Pourquoi le navigateur envoie-t-il ces informations au serveur ?
- Que se passerait-il si certains en-têtes manquaient ?

---

### Étape 3.2 : Identifier la méthode HTTP et l'URL

**Action à réaliser :**

1. Dans l'onglet **"Headers"**, regardez la section **"General"** (en haut)
2. Identifiez :
   - **Request Method** : La méthode HTTP utilisée (GET, POST, PUT, DELETE, etc.)
   - **Request URL** : L'URL complète de la requête
   - **Status Code** : Le code de statut de la réponse (200, 404, 500, etc.)

**Exemple de ce que vous devriez voir :**

```
General:
  Request URL: https://jsonplaceholder.typicode.com/posts/1
  Request Method: GET
  Status Code: 200 OK
  Remote Address: 104.21.xx.xx:443
  Referrer Policy: strict-origin-when-cross-origin
```

**Action détaillée :**

1. **Copiez l'URL complète** et analysez-la :
   - Protocole : `https://`
   - Domaine : `jsonplaceholder.typicode.com`
   - Chemin : `/posts/1`
   - Paramètres de requête (query string) : s'il y en a, ils apparaissent après `?`

2. **Notez la méthode HTTP** :
   - GET : récupération de données (lecture)
   - POST : création de données
   - PUT : mise à jour complète
   - PATCH : mise à jour partielle
   - DELETE : suppression

3. **Notez le code de statut** :
   - 200 : Succès
   - 301/302 : Redirection
   - 404 : Non trouvé
   - 500 : Erreur serveur

**Vérification :**
- ✅ Vous avez identifié la méthode HTTP (probablement GET)
- ✅ Vous avez copié l'URL complète
- ✅ Vous avez noté le code de statut

**Question de réflexion :**
- Pourquoi cette méthode HTTP a-t-elle été utilisée ?
- Que signifierait un code 404 à la place de 200 ?

---

### Étape 3.3 : Examiner le corps de la requête (Request Payload)

**Action à réaliser :**

1. Dans l'onglet **"Headers"**, faites défiler jusqu'à **"Request Payload"** ou **"Query String Parameters"**
2. Pour une requête GET simple, il n'y a généralement pas de corps (body)
3. Si vous voyez "Query String Parameters", examinez-les

**Note :** Pour voir un corps de requête, nous devrons faire une requête POST (voir Partie 4)

**Vérification :**
- ✅ Vous avez vérifié la section Request Payload
- ✅ Vous comprenez que GET n'a généralement pas de corps

---

## 📚 Partie 4 : Analyser la réponse HTTP

### Étape 4.1 : Examiner les Headers de la réponse (Response Headers)

**Action à réaliser :**

1. Dans l'onglet **"Headers"**, faites défiler jusqu'à **"Response Headers"** (En-têtes de réponse)
2. Identifiez et notez les en-têtes suivants :

**En-têtes à identifier :**

| En-tête | Description | Exemple de valeur |
|---------|-------------|-------------------|
| `Content-Type` | Type de contenu de la réponse | `application/json; charset=utf-8` |
| `Content-Length` | Taille du contenu en octets | `292` |
| `Date` | Date et heure de la réponse | `Mon, 01 Jan 2024 12:00:00 GMT` |
| `Server` | Logiciel serveur utilisé | `cloudflare` |
| `Cache-Control` | Instructions de mise en cache | `max-age=14400` |
| `ETag` | Identifiant de version (si présent) | `"abc123"` |
| `Status` | Code de statut HTTP | `200 OK` |

**Action détaillée :**

1. Cliquez sur chaque en-tête pour voir sa valeur complète
2. Notez particulièrement :
   - **Content-Type** : Indique le format des données (JSON, HTML, XML, etc.)
   - **Status** : Confirme le code de statut HTTP

**Exemple de ce que vous devriez voir :**

```
Response Headers:
  content-type: application/json; charset=utf-8
  content-length: 292
  date: Mon, 01 Jan 2024 12:00:00 GMT
  server: cloudflare
  cache-control: public, max-age=14400
  status: 200
```

**Vérification :**
- ✅ Vous avez identifié au moins 5 en-têtes de réponse
- ✅ Vous avez noté le Content-Type
- ✅ Vous avez compris le rôle de chaque en-tête

**Question de réflexion :**
- Pourquoi le serveur envoie-t-il ces informations au client ?
- Que signifierait un Content-Type différent (par exemple `text/html`) ?

---

### Étape 4.2 : Examiner le corps de la réponse (Response Body)

**Action à réaliser :**

1. Cliquez sur l'onglet **"Response"** (ou **"Preview"** pour un affichage formaté)
2. Examinez le contenu de la réponse

**Si vous êtes sur `jsonplaceholder.typicode.com/posts/1`, vous devriez voir :**

```json
{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
}
```

**Action détaillée :**

1. **Si l'onglet "Preview" est disponible** : Utilisez-le pour voir le JSON formaté
2. **Si vous êtes dans "Response"** : Le JSON brut s'affiche
3. **Analysez la structure** :
   - Type de données : JSON, HTML, XML, texte brut ?
   - Structure : Objet, tableau, texte simple ?
   - Contenu : Que représentent ces données ?

**Vérification :**
- ✅ Vous avez visualisé le corps de la réponse
- ✅ Vous avez identifié le format (JSON, HTML, etc.)
- ✅ Vous comprenez la structure des données

**Question de réflexion :**
- Comment le navigateur utilise-t-il ces données ?
- Que se passerait-il si le Content-Type ne correspondait pas au contenu réel ?

---

### Étape 4.3 : Analyser le timing de la requête

**Action à réaliser :**

1. Cliquez sur l'onglet **"Timing"** (ou regardez la section Timing dans Headers)
2. Examinez les différentes phases du chargement :

**Phases à identifier :**

| Phase | Description | Temps typique |
|-------|-------------|---------------|
| **Queued** | Temps d'attente avant l'envoi | 0-50ms |
| **Stalled** | Temps bloqué (proxy, DNS, etc.) | Variable |
| **DNS Lookup** | Résolution du nom de domaine | 0-100ms |
| **Initial Connection** | Établissement de la connexion TCP | 50-200ms |
| **SSL** | Négociation TLS/SSL (si HTTPS) | 50-200ms |
| **Request Sent** | Envoi de la requête | < 1ms |
| **Waiting (TTFB)** | Temps jusqu'au premier octet | 100-500ms |
| **Content Download** | Téléchargement du contenu | Variable |

**Exemple de ce que vous devriez voir :**

```
Timing:
  Queued: 0.12 ms
  DNS Lookup: 12.45 ms
  Initial Connection: 45.67 ms
  SSL: 78.90 ms
  Request Sent: 0.23 ms
  Waiting (TTFB): 123.45 ms
  Content Download: 5.67 ms
  Total: 266.59 ms
```

**Action détaillée :**

1. **Notez le temps total** de la requête
2. **Identifiez la phase la plus longue** (souvent "Waiting" ou "SSL")
3. **Comprenez ce que chaque phase représente** :
   - **TTFB (Time To First Byte)** : Temps jusqu'à la première réponse du serveur
   - **Content Download** : Temps de téléchargement des données

**Vérification :**
- ✅ Vous avez identifié toutes les phases du timing
- ✅ Vous avez noté le temps total
- ✅ Vous avez identifié la phase la plus lente

**Question de réflexion :**
- Quelle phase prend le plus de temps ? Pourquoi ?
- Comment pourrait-on optimiser ce temps de chargement ?

---

## 📚 Partie 5 : Analyser différents types de requêtes

### Étape 5.1 : Analyser une requête POST avec corps

**Action à réaliser :**

1. Dans l'onglet Network, assurez-vous que **"Preserve log"** est coché
2. Ouvrez la console JavaScript (onglet **Console**)
3. Exécutez cette commande pour faire une requête POST :

```javascript
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Mon nouveau post',
    body: 'Contenu de mon post',
    userId: 1
  })
})
.then(response => response.json())
.then(data => console.log('Réponse:', data));
```

4. Revenez dans l'onglet **Network**
5. Vous devriez voir une nouvelle requête apparaître (probablement nommée "posts")
6. Cliquez sur cette requête

**Action détaillée :**

1. **Dans l'onglet Headers**, vérifiez :
   - **Request Method** : Doit être `POST`
   - **Request URL** : `https://jsonplaceholder.typicode.com/posts`

2. **Dans la section Request Headers**, vérifiez :
   - `Content-Type: application/json` (important pour POST avec JSON)

3. **Cliquez sur l'onglet "Payload"** (ou regardez "Request Payload" dans Headers) :
   - Vous devriez voir le corps de la requête que vous avez envoyé

**Exemple de ce que vous devriez voir :**

```
Request Payload:
{
  "title": "Mon nouveau post",
  "body": "Contenu de mon post",
  "userId": 1
}
```

4. **Dans l'onglet Response**, vérifiez la réponse du serveur :
   - Le serveur devrait renvoyer l'objet créé avec un `id` attribué

**Vérification :**
- ✅ Vous avez créé une requête POST
- ✅ Vous avez identifié la méthode POST dans les headers
- ✅ Vous avez vu le corps de la requête (Request Payload)
- ✅ Vous avez examiné la réponse du serveur

**Question de réflexion :**
- Quelle est la différence entre GET et POST ?
- Pourquoi POST nécessite-t-il un Content-Type dans les headers ?

---

### Étape 5.2 : Analyser une requête avec paramètres de requête (Query String)

**Action à réaliser :**

1. Dans la console JavaScript, exécutez :

```javascript
fetch('https://jsonplaceholder.typicode.com/posts?userId=1&_limit=5')
  .then(response => response.json())
  .then(data => console.log('Réponse:', data));
```

2. Dans l'onglet Network, cliquez sur la nouvelle requête
3. Dans l'onglet **Headers**, regardez la section **"Query String Parameters"**

**Exemple de ce que vous devriez voir :**

```
Query String Parameters:
  userId: 1
  _limit: 5
```

**Action détaillée :**

1. **Analysez l'URL complète** :
   - Base : `https://jsonplaceholder.typicode.com/posts`
   - Paramètres : `?userId=1&_limit=5`
   - Le `?` indique le début des paramètres
   - Le `&` sépare les paramètres multiples

2. **Comprenez le rôle des paramètres** :
   - `userId=1` : Filtre les posts par utilisateur
   - `_limit=5` : Limite les résultats à 5

**Vérification :**
- ✅ Vous avez identifié les paramètres de requête
- ✅ Vous comprenez leur format dans l'URL
- ✅ Vous avez vu comment ils sont affichés dans les outils de développement

---

### Étape 5.3 : Analyser une requête avec erreur (404, 500)

**Action à réaliser :**

1. Dans la console JavaScript, exécutez :

```javascript
fetch('https://jsonplaceholder.typicode.com/posts/99999')
  .then(response => {
    console.log('Status:', response.status);
    return response.json();
  })
  .then(data => console.log('Réponse:', data))
  .catch(error => console.error('Erreur:', error));
```

2. Dans l'onglet Network, cliquez sur la requête
3. **Observez le code de statut** : Il devrait être `404` (ou `200` si l'API gère différemment)

**Pour simuler une erreur 500, essayez :**

```javascript
fetch('https://httpstat.us/500')
  .then(response => {
    console.log('Status:', response.status);
    return response.text();
  })
  .then(data => console.log('Réponse:', data));
```

**Action détaillée :**

1. **Dans l'onglet Headers**, vérifiez :
   - **Status Code** : `404 Not Found` ou `500 Internal Server Error`
   - La requête apparaît souvent en rouge dans la liste

2. **Dans l'onglet Response**, examinez le message d'erreur :
   - Les erreurs 404 affichent généralement un message "Not Found"
   - Les erreurs 500 affichent un message d'erreur serveur

3. **Dans l'onglet Timing**, observez si le temps de réponse est différent

**Vérification :**
- ✅ Vous avez généré une requête avec erreur
- ✅ Vous avez identifié le code de statut d'erreur
- ✅ Vous avez examiné le message d'erreur dans la réponse

**Question de réflexion :**
- Que signifie un code 404 ? 500 ? 403 ?
- Comment le navigateur gère-t-il ces erreurs ?

---

## 📚 Partie 6 : Filtrer et rechercher dans les requêtes

### Étape 6.1 : Utiliser les filtres de type

**Action à réaliser :**

1. En haut de l'onglet Network, vous voyez des boutons de filtre : **All**, **XHR**, **JS**, **CSS**, **Img**, etc.
2. Cliquez sur **XHR** (XMLHttpRequest) ou **Fetch**
3. Rechargez la page ou faites de nouvelles requêtes
4. Observez que seules les requêtes de type XHR/Fetch sont affichées

**Types de filtres disponibles :**

| Filtre | Description | Exemple |
|--------|-------------|---------|
| **All** | Toutes les requêtes | Toutes |
| **XHR** | Requêtes AJAX/Fetch | API REST |
| **JS** | Fichiers JavaScript | `app.js`, `vendor.js` |
| **CSS** | Feuilles de style | `style.css` |
| **Img** | Images | `.jpg`, `.png`, `.svg` |
| **Media** | Vidéos, audio | `.mp4`, `.mp3` |
| **Font** | Polices | `.woff`, `.ttf` |
| **Doc** | Documents HTML | Page principale |

**Vérification :**
- ✅ Vous avez utilisé au moins 3 filtres différents
- ✅ Vous comprenez ce que chaque filtre affiche

---

### Étape 6.2 : Rechercher une requête spécifique

**Action à réaliser :**

1. Dans la barre de recherche de l'onglet Network (en haut, avec l'icône 🔍)
2. Tapez un terme de recherche, par exemple : `posts` ou `jsonplaceholder`
3. Les requêtes correspondantes sont filtrées en temps réel

**Astuces de recherche :**

- Recherche par nom de fichier : `style.css`
- Recherche par domaine : `google.com`
- Recherche par type MIME : `application/json`
- Recherche par méthode : `POST`, `GET`

**Vérification :**
- ✅ Vous avez utilisé la fonction de recherche
- ✅ Vous avez trouvé des requêtes spécifiques

---

### Étape 6.3 : Exporter les données d'une requête

**Action à réaliser :**

1. Cliquez avec le bouton droit sur une requête dans la liste
2. Sélectionnez **"Copy"** → **"Copy as cURL"** (ou **"Copier en tant que cURL"**)
3. Collez le résultat dans un éditeur de texte

**Exemple de ce que vous obtiendrez :**

```bash
curl 'https://jsonplaceholder.typicode.com/posts/1' \
  -H 'Accept: application/json' \
  -H 'User-Agent: Mozilla/5.0...'
```

**Action détaillée :**

1. **Copiez la commande cURL**
2. **Testez-la dans un terminal** (si vous avez curl installé) :
   ```bash
   curl 'https://jsonplaceholder.typicode.com/posts/1'
   ```
3. **Comprenez l'utilité** :
   - Reproduire une requête exacte
   - Partager une requête avec un collègue
   - Tester une API depuis la ligne de commande

**Autres options de copie disponibles :**
- **Copy as cURL** : Commande cURL complète
- **Copy as fetch** : Code JavaScript fetch()
- **Copy as Node.js fetch** : Code Node.js
- **Copy request headers** : Juste les headers
- **Copy response** : Juste le corps de la réponse

**Vérification :**
- ✅ Vous avez copié une requête en cURL
- ✅ Vous comprenez l'utilité de cette fonctionnalité

---

## 📚 Partie 7 : Cas pratiques avancés

### Étape 7.1 : Analyser une requête avec authentification

**Action à réaliser :**

1. Dans la console JavaScript, simulez une requête avec un token d'authentification :

```javascript
fetch('https://jsonplaceholder.typicode.com/posts/1', {
  headers: {
    'Authorization': 'Bearer mon-token-secret-123',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Réponse:', data));
```

2. Dans l'onglet Network, cliquez sur la requête
3. Dans l'onglet **Headers**, regardez la section **Request Headers**
4. **Identifiez l'en-tête Authorization** :
   - Format : `Authorization: Bearer mon-token-secret-123`
   - C'est ainsi que les APIs sécurisées authentifient les utilisateurs

**Vérification :**
- ✅ Vous avez ajouté un header d'authentification
- ✅ Vous l'avez identifié dans les Request Headers
- ✅ Vous comprenez son rôle dans la sécurité

**Question de réflexion :**
- Pourquoi ne pas mettre le token dans l'URL ?
- Que se passerait-il si le token était expiré ?

---

### Étape 7.2 : Analyser les cookies (si présents)

**Action à réaliser :**

1. Naviguez vers un site qui utilise des cookies (par exemple, un site de e-commerce)
2. Dans l'onglet Network, sélectionnez une requête
3. Dans l'onglet **Headers**, cherchez la section **"Cookies"** (dans Request Headers ou Response Headers)

**Si vous ne voyez pas de cookies :**

1. Ouvrez l'onglet **Application** (ou **Storage** dans Firefox)
2. Allez dans **Cookies** → sélectionnez le domaine
3. Vous verrez tous les cookies stockés

**Action détaillée :**

1. **Dans Request Headers**, cherchez :
   - `Cookie: session_id=abc123; user_pref=dark_mode`
   - Les cookies sont envoyés automatiquement par le navigateur

2. **Dans Response Headers**, cherchez :
   - `Set-Cookie: session_id=abc123; Path=/; HttpOnly`
   - Le serveur définit de nouveaux cookies

**Vérification :**
- ✅ Vous avez identifié les cookies dans les headers
- ✅ Vous comprenez la différence entre Cookie (requête) et Set-Cookie (réponse)

---

### Étape 7.3 : Analyser une requête avec redirection

**Action à réaliser :**

1. Dans la console JavaScript, exécutez :

```javascript
fetch('https://httpstat.us/301', {
  redirect: 'follow'  // Suivre les redirections
})
.then(response => {
  console.log('URL finale:', response.url);
  console.log('Status:', response.status);
  return response.text();
})
.then(data => console.log('Réponse:', data));
```

2. Dans l'onglet Network, vous devriez voir **plusieurs requêtes** :
   - La première avec le code 301 (redirection)
   - La seconde vers l'URL finale

**Action détaillée :**

1. **Cliquez sur la première requête** (301) :
   - Status Code : `301 Moved Permanently`
   - Response Headers : `Location: https://httpstat.us/200` (URL de destination)

2. **Cliquez sur la seconde requête** :
   - Status Code : `200 OK`
   - C'est la requête vers l'URL finale après redirection

**Vérification :**
- ✅ Vous avez observé une redirection
- ✅ Vous avez identifié le header `Location`
- ✅ Vous avez vu la requête finale après redirection

**Question de réflexion :**
- Quelle est la différence entre 301 et 302 ?
- Pourquoi les redirections sont-elles importantes pour le SEO ?

---

## 📚 Partie 8 : Synthèse et validation

### Étape 8.1 : Créer un rapport d'analyse

**Action à réaliser :**

Créez un document (Word, Markdown, ou texte) avec l'analyse complète d'au moins **3 requêtes différentes** :

**Pour chaque requête, documentez :**

1. **Informations générales :**
   - URL complète
   - Méthode HTTP
   - Code de statut

2. **Requête :**
   - Headers principaux (au moins 5)
   - Corps de la requête (si présent)
   - Paramètres de requête (si présents)

3. **Réponse :**
   - Headers principaux (au moins 5)
   - Type de contenu (Content-Type)
   - Structure du corps de la réponse

4. **Performance :**
   - Temps total
   - Phase la plus lente
   - Taille de la réponse

5. **Analyse :**
   - Objectif de la requête
   - Problèmes éventuels
   - Points d'optimisation possibles

**Exemple de structure :**

```markdown
# Analyse de requête HTTP

## Requête 1 : Récupération d'un post

### Informations générales
- URL: https://jsonplaceholder.typicode.com/posts/1
- Méthode: GET
- Status: 200 OK

### Headers de requête
- Host: jsonplaceholder.typicode.com
- User-Agent: Mozilla/5.0...
- Accept: application/json

### Headers de réponse
- Content-Type: application/json; charset=utf-8
- Content-Length: 292
- Status: 200

### Performance
- Temps total: 266.59 ms
- Phase la plus lente: Waiting (TTFB) - 123.45 ms

### Analyse
Cette requête récupère un post spécifique. Le temps de réponse est acceptable.
```

**Vérification :**
- ✅ Vous avez créé un rapport avec au moins 3 requêtes
- ✅ Chaque requête est documentée complètement
- ✅ Vous avez inclus une analyse pour chaque requête

---

### Étape 8.2 : Checklist de validation

**Cochez chaque point une fois complété :**

**Partie 1 - Environnement :**
- [ ] J'ai ouvert les outils de développement (F12)
- [ ] J'ai accédé à l'onglet Network
- [ ] J'ai configuré les options d'affichage

**Partie 2 - Capture :**
- [ ] J'ai capturé une requête simple
- [ ] J'ai sélectionné et examiné une requête

**Partie 3 - Analyse requête :**
- [ ] J'ai identifié au moins 5 headers de requête
- [ ] J'ai identifié la méthode HTTP et l'URL
- [ ] J'ai examiné le corps de la requête (si présent)

**Partie 4 - Analyse réponse :**
- [ ] J'ai identifié au moins 5 headers de réponse
- [ ] J'ai examiné le corps de la réponse
- [ ] J'ai analysé le timing de la requête

**Partie 5 - Types de requêtes :**
- [ ] J'ai analysé une requête POST avec corps
- [ ] J'ai analysé une requête avec paramètres de requête
- [ ] J'ai analysé une requête avec erreur (404 ou 500)

**Partie 6 - Filtres :**
- [ ] J'ai utilisé les filtres de type (XHR, JS, CSS)
- [ ] J'ai utilisé la fonction de recherche
- [ ] J'ai exporté une requête en cURL

**Partie 7 - Cas avancés :**
- [ ] J'ai analysé une requête avec authentification
- [ ] J'ai analysé les cookies (si disponibles)
- [ ] J'ai analysé une requête avec redirection

**Partie 8 - Synthèse :**
- [ ] J'ai créé un rapport d'analyse avec au moins 3 requêtes
- [ ] Mon rapport est complet et structuré

---

## 🎓 Questions de compréhension

Répondez aux questions suivantes pour valider votre compréhension :

1. **Quelle est la différence entre les headers de requête et les headers de réponse ?**
   - Réponse attendue : Les headers de requête sont envoyés par le client au serveur, les headers de réponse sont envoyés par le serveur au client.

2. **Pourquoi le navigateur envoie-t-il un header `User-Agent` ?**
   - Réponse attendue : Pour informer le serveur du type de navigateur et du système d'exploitation, permettant au serveur d'adapter sa réponse.

3. **Que signifie un code de statut 200 ? 404 ? 500 ?**
   - Réponse attendue :
     - 200 : Succès, la requête a réussi
     - 404 : Ressource non trouvée
     - 500 : Erreur interne du serveur

4. **Quelle est la différence entre GET et POST ?**
   - Réponse attendue :
     - GET : Récupère des données, pas de corps, peut être mis en cache
     - POST : Crée/modifie des données, a un corps, ne doit pas être mis en cache

5. **Qu'est-ce que le TTFB (Time To First Byte) ?**
   - Réponse attendue : Le temps écoulé entre l'envoi de la requête et la réception du premier octet de la réponse. C'est un indicateur de performance du serveur.

6. **Pourquoi utiliser l'onglet Network plutôt que la console pour déboguer les requêtes ?**
   - Réponse attendue : L'onglet Network offre une vue complète de toutes les requêtes, leurs headers, leurs réponses, et leur timing, ce qui est plus détaillé que les logs de la console.

---

## 🚀 Défis supplémentaires (optionnels)

Si vous avez terminé toutes les étapes, essayez ces défis :

### Défi 1 : Analyser une requête sur votre site préféré
1. Ouvrez votre site web préféré (réseau social, e-commerce, etc.)
2. Analysez toutes les requêtes qui se produisent au chargement
3. Identifiez :
   - Les requêtes les plus lentes
   - Les types de ressources chargées
   - Les APIs utilisées

### Défi 2 : Comparer les performances
1. Analysez le même endpoint sur deux sites différents
2. Comparez :
   - Les temps de réponse
   - Les tailles des réponses
   - Les headers utilisés
3. Identifiez les différences et expliquez-les

### Défi 3 : Simuler un problème réseau
1. Dans l'onglet Network, utilisez le throttling (ralentissement réseau)
2. Sélectionnez "Slow 3G" ou "Fast 3G"
3. Rechargez une page et observez :
   - L'impact sur les temps de chargement
   - L'ordre de chargement des ressources
   - Les timeouts éventuels

### Défi 4 : Analyser une API REST complète
1. Trouvez une API REST publique (par exemple : https://api.github.com)
2. Faites plusieurs requêtes (GET, POST, PUT, DELETE)
3. Analysez chaque requête et créez un tableau comparatif :
   - Méthodes utilisées
   - Codes de statut
   - Formats de données
   - Headers d'authentification

---

## 📖 Ressources complémentaires

- **Documentation MDN sur HTTP** : https://developer.mozilla.org/fr/docs/Web/HTTP
- **Liste des codes de statut HTTP** : https://developer.mozilla.org/fr/docs/Web/HTTP/Status
- **Guide des headers HTTP** : https://developer.mozilla.org/fr/docs/Web/HTTP/Headers
- **Chrome DevTools - Network** : https://developer.chrome.com/docs/devtools/network/

---

## ✅ Conclusion

Félicitations ! Vous avez maintenant les compétences pour :
- ✅ Utiliser les outils de développement pour analyser les requêtes HTTP
- ✅ Comprendre la structure complète d'une requête et d'une réponse HTTP
- ✅ Identifier et résoudre les problèmes de communication HTTP
- ✅ Optimiser les performances en analysant les timings

Ces compétences sont essentielles pour :
- Déboguer les problèmes d'API
- Optimiser les performances web
- Comprendre le fonctionnement des applications web modernes
- Préparer des entretiens techniques

**Prochaines étapes suggérées :**
- Apprendre à utiliser Postman ou Insomnia pour tester les APIs
- Étudier les concepts avancés (CORS, WebSockets, Server-Sent Events)
- Pratiquer l'analyse de performance avec Lighthouse

---

*TP créé le : [Date]*  
*Version : 1.0*  
*Durée estimée : 2-3 heures*






---


### 📄 TP 1 : Big Data - Exploration des données brutes

*Source: `titanic-learning-app/TP-01-BIG-DATA.md`*


---

# TP 1 : Big Data - Exploration des données brutes

**Durée estimée :** 1h30  
**Niveau :** Débutant  
**Application :** https://titaniclearning.netlify.app

---

## 📋 Objectifs pédagogiques

À la fin de ce TP, vous serez capable de :
- Comprendre la structure d'un dataset
- Identifier les types de données (numériques, catégorielles)
- Détecter les valeurs manquantes
- Utiliser des filtres pour explorer les données
- Formuler des observations sur la qualité des données

---

## 🎯 Contexte

Vous disposez d'un dataset contenant 25 passagers du Titanic avec les informations suivantes :
- **Sexe** : male ou female
- **Âge** : nombre d'années (peut être vide)
- **Classe** : 1, 2 ou 3
- **Prix** : prix du billet en livres sterling
- **Embarquement** : port d'embarquement (S, C ou Q)
- **Survivant** : oui ou non

---

## 📝 Exercices

### Exercice 1 : Exploration visuelle (15 min)

1. **Ouvrez l'application** et accédez au module "Big Data"
2. **Observez le tableau** de données affiché
3. **Comptez manuellement** le nombre de lignes visibles
4. **Notez** le nombre total de lignes affiché en haut du tableau

**Question à répondre dans l'application :**
- Combien de lignes vois-tu ? (choisissez dans le dropdown puis saisissez le nombre exact)

---

### Exercice 2 : Identification des types de données (20 min)

1. **Examinez chaque colonne** du tableau
2. **Identifiez** les colonnes qui contiennent des nombres
3. **Distinguer** :
   - Les colonnes numériques (nombres entiers ou décimaux)
   - Les colonnes catégorielles (texte avec catégories limitées)
   - Les colonnes booléennes (oui/non)

**Question à répondre dans l'application :**
- Quelles colonnes sont numériques ? (sélectionnez dans le dropdown puis listez-les)

**Réflexion :**
- Pourquoi est-il important de distinguer les types de données ?

---

### Exercice 3 : Détection des valeurs manquantes (20 min)

1. **Parcourez** toutes les lignes du tableau
2. **Cherchez** les cellules vides ou contenant "?"
3. **Notez** dans quelles colonnes se trouvent ces valeurs manquantes
4. **Comptez** le nombre de valeurs manquantes par colonne

**Question à répondre dans l'application :**
- Y a-t-il des valeurs manquantes ? (oui/non)
- Où ? (précisez la colonne et le nombre)

**Réflexion :**
- Quelles sont les conséquences des valeurs manquantes pour l'analyse ?

---

### Exercice 4 : Utilisation des filtres (20 min)

1. **Testez chaque filtre** disponible :
   - Recherche globale
   - Filtre par Sexe
   - Filtre par Classe
   - Filtre par Embarquement
   - Filtre par Survivant
   - Filtres min/max pour Âge et Prix

2. **Combinez plusieurs filtres** pour répondre aux questions suivantes :
   - Combien de femmes de classe 1 ont survécu ?
   - Quel est l'âge minimum des passagers de classe 3 ?
   - Combien de passagers ont payé plus de 50 livres ?

3. **Utilisez le tri** en cliquant sur les en-têtes de colonnes

**Observation :**
- Notez comment le nombre de lignes filtrées change selon vos critères

---

### Exercice 5 : Détection d'ambiguïtés (15 min)

1. **Examinez attentivement** les données
2. **Cherchez** des incohérences ou ambiguïtés potentielles :
   - Valeurs qui semblent étranges
   - Données contradictoires
   - Formats incohérents

**Question à répondre dans l'application :**
- Une donnée te semble ambiguë ? (oui/non)
- Laquelle et pourquoi ? (décrivez l'ambiguïté)

**Exemples d'ambiguïtés possibles :**
- Un passager avec un prix de billet très bas en classe 1
- Un âge de 0 ou très élevé
- Des incohérences entre classe et prix

---

## 🔍 Analyse approfondie (Bonus)

### Exercice bonus 1 : Statistiques descriptives

En utilisant les filtres et le tri, calculez manuellement :
- L'âge moyen des passagers (en ignorant les valeurs manquantes)
- Le prix moyen par classe
- Le taux de survie global
- Le taux de survie par sexe

### Exercice bonus 2 : Questions de recherche

Formulez 3 questions que vous pourriez explorer avec ce dataset :
1. ________________________________
2. ________________________________
3. ________________________________

---

## ✅ Validation

Avant de passer au module suivant, vérifiez que vous avez :
- [ ] Répondu aux 4 questions dans l'application
- [ ] Utilisé tous les types de filtres
- [ ] Testé le tri sur au moins 3 colonnes
- [ ] Identifié les valeurs manquantes
- [ ] Exporté vos réponses (bouton "Exporter mes réponses")

---

## 📊 Critères d'évaluation

| Critère | Points | Description |
|---------|--------|-------------|
| Réponses complètes | 4 pts | Toutes les questions sont répondues |
| Justesse des observations | 3 pts | Les observations sont correctes |
| Utilisation des filtres | 2 pts | Tous les filtres ont été testés |
| Qualité de l'analyse | 1 pt | Détection d'ambiguïtés pertinentes |

**Total : 10 points**

---

## 💡 Conseils

- **Prenez votre temps** : l'exploration de données nécessite de l'attention
- **Notez vos observations** : gardez un carnet de notes à côté
- **Testez les limites** : que se passe-t-il si vous combinez tous les filtres ?
- **Comparez** : utilisez les filtres pour comparer des sous-groupes

---

## 🚀 Prochaines étapes

Une fois ce TP terminé, vous pouvez passer au **TP 2 : Data Science** où vous apprendrez à :
- Créer des visualisations
- Calculer des statistiques
- Identifier des patterns dans les données

---

## 📚 Ressources complémentaires

- [Documentation sur les types de données](https://www.kaggle.com/learn/data-cleaning)
- [Guide sur les valeurs manquantes](https://www.kaggle.com/learn/data-cleaning)
- [Best practices en exploration de données](https://www.kaggle.com/learn/intro-to-machine-learning)

---

**Bon travail ! 🎓**



---


### 📄 TP 2 : Data Science - Analyse et visualisation

*Source: `titanic-learning-app/TP-02-DATA-SCIENCE.md`*


---

# TP 2 : Data Science - Analyse et visualisation

**Durée estimée :** 2h  
**Niveau :** Intermédiaire  
**Application :** https://titaniclearning.netlify.app  
**Prérequis :** TP 1 - Big Data terminé

---

## 📋 Objectifs pédagogiques

À la fin de ce TP, vous serez capable de :
- Interpréter des graphiques statistiques
- Calculer des taux et proportions
- Identifier des corrélations dans les données
- Formuler des hypothèses basées sur des visualisations
- Comprendre les biais potentiels dans les données

---

## 🎯 Contexte

Maintenant que vous avez exploré les données brutes, vous allez extraire du sens en utilisant des visualisations et des analyses statistiques simples. L'objectif est de comprendre quels facteurs influencent la survie des passagers.

---

## 📝 Exercices

### Exercice 1 : Analyse du taux de survie par sexe (25 min)

1. **Observez le graphique** "Taux de survie par Sexe"
2. **Calculez mentalement** les pourcentages :
   - Combien de femmes au total ?
   - Combien de femmes ont survécu ?
   - Quel est le pourcentage de survie des femmes ?
   - Répétez pour les hommes

3. **Utilisez les filtres** pour vérifier vos calculs :
   - Filtrez par "female" et "survivant: oui" → comptez
   - Filtrez par "male" et "survivant: oui" → comptez

**Question à répondre dans l'application :**
- Qui survit le plus ? (Femmes / Hommes / Aucune différence)
- Justification : Expliquez votre réponse en vous basant sur les données observées

**Réflexion :**
- Pourquoi observez-vous cette différence ?
- Quels facteurs sociaux ou culturels pourraient expliquer cela ?

---

### Exercice 2 : Impact de la classe sur la survie (25 min)

1. **Observez le graphique** "Taux de survie par Classe"
2. **Comparez** les trois barres :
   - Quelle classe a le meilleur taux de survie ?
   - Quelle classe a le pire taux de survie ?
   - Y a-t-il une progression évidente ?

3. **Analysez la relation** entre classe et prix :
   - Utilisez les filtres pour voir les prix moyens par classe
   - La classe 1 correspond-elle toujours aux prix les plus élevés ?

**Question à répondre dans l'application :**
- La classe influence-t-elle la survie ? (Beaucoup / Un peu / Pas du tout)
- Justification : Décrivez l'impact observé et son importance

**Réflexion :**
- Pourquoi la classe sociale pourrait influencer la survie ?
- Quels sont les mécanismes possibles (proximité des canots, priorité d'évacuation, etc.) ?

---

### Exercice 3 : Distribution de l'âge (20 min)

1. **Observez l'histogramme** "Distribution de l'Âge"
2. **Identifiez** :
   - La tranche d'âge la plus représentée
   - Les tranches d'âge avec peu ou pas de passagers
   - La forme générale de la distribution (normale, asymétrique, etc.)

3. **Analysez** la relation âge/survie :
   - Utilisez les filtres pour comparer les âges moyens des survivants vs non-survivants
   - Y a-t-il une différence notable ?

**Observation :**
- Notez si les enfants (âge < 18) semblent avoir un taux de survie différent

---

### Exercice 4 : Analyse du prix (20 min)

1. **Observez le résumé** "Prix par Survivant"
2. **Comparez** :
   - Le prix moyen des survivants
   - Le prix moyen des non-survivants
   - Y a-t-il une différence significative ?

3. **Explorez** avec les filtres :
   - Filtrez par "survivant: oui" → triez par prix décroissant
   - Filtrez par "survivant: non" → triez par prix décroissant
   - Observez les extrêmes

**Réflexion :**
- Le prix du billet est-il un bon indicateur de survie ?
- Pourquoi le prix pourrait être corrélé avec la survie ?

---

### Exercice 5 : Facteur le plus influent (20 min)

Maintenant que vous avez analysé plusieurs facteurs, vous devez déterminer lequel semble le plus important.

**Méthodologie :**
1. **Listez** tous les facteurs analysés :
   - Sexe
   - Classe
   - Âge
   - Prix
   - Embarquement

2. **Pour chaque facteur**, évaluez :
   - L'ampleur de la différence observée
   - La cohérence du pattern
   - L'importance pratique

3. **Comparez** les graphiques entre eux

**Question à répondre dans l'application :**
- Quel facteur semble le plus fort ? (Sexe / Classe / Age / Prix / Embarquement)
- Justification : Expliquez pourquoi ce facteur vous semble le plus déterminant

---

### Exercice 6 : Décision éthique (20 min)

Imaginez que vous êtes le capitaine du Titanic et que vous devez prendre des décisions sur qui sauver en priorité.

**Scénario :**
- Les canots de sauvetage sont limités
- Vous devez établir des priorités
- Vous avez accès aux données que vous venez d'analyser

**Question à répondre dans l'application :**
- Quelle décision humaine proposerais-tu ? (Priorité femmes & enfants / Priorité classe 1 / Priorité proches canots / Autre)
- Détails : Décrivez votre stratégie et justifiez-la

**Réflexion éthique :**
- Quels sont les enjeux éthiques de votre décision ?
- Y a-t-il des biais dans votre approche ?
- Comment équilibrer efficacité et équité ?

---

## 🔍 Analyse approfondie (Bonus)

### Exercice bonus 1 : Analyse croisée

Créez des analyses croisées en combinant les filtres :
- Taux de survie des femmes de classe 1 vs femmes de classe 3
- Taux de survie des hommes de classe 1 vs femmes de classe 3
- Impact de l'âge sur la survie selon le sexe

### Exercice bonus 2 : Hypothèses de recherche

Formulez 3 hypothèses testables basées sur vos observations :
1. ________________________________
2. ________________________________
3. ________________________________

### Exercice bonus 3 : Limites de l'analyse

Identifiez les limites de cette analyse :
- Taille de l'échantillon
- Variables manquantes
- Biais potentiels
- Généralisabilité

---

## ✅ Validation

Avant de passer au module suivant, vérifiez que vous avez :
- [ ] Répondu aux 4 questions dans l'application
- [ ] Analysé tous les graphiques proposés
- [ ] Utilisé les filtres pour vérifier vos observations
- [ ] Formulé des hypothèses basées sur les données
- [ ] Exporté vos réponses

---

## 📊 Critères d'évaluation

| Critère | Points | Description |
|---------|--------|-------------|
| Interprétation des graphiques | 3 pts | Compréhension correcte des visualisations |
| Justesse des conclusions | 3 pts | Conclusions cohérentes avec les données |
| Qualité de la justification | 2 pts | Justifications claires et argumentées |
| Réflexion éthique | 2 pts | Conscience des enjeux éthiques |

**Total : 10 points**

---

## 💡 Conseils méthodologiques

- **Comparez toujours** : Ne regardez pas un graphique isolément, comparez-les
- **Vérifiez vos intuitions** : Utilisez les filtres pour confirmer ce que vous voyez
- **Soyez critique** : Questionnez les patterns que vous observez
- **Pensez aux biais** : Les données peuvent refléter des biais sociaux

---

## 🚀 Prochaines étapes

Une fois ce TP terminé, vous pouvez passer au **TP 3 : Machine Learning** où vous apprendrez à :
- Faire des prédictions
- Évaluer la performance d'un modèle
- Identifier les biais dans les prédictions

---

## 📚 Ressources complémentaires

- [Guide d'interprétation des graphiques](https://www.kaggle.com/learn/data-visualization)
- [Statistiques descriptives](https://www.kaggle.com/learn/intro-to-machine-learning)
- [Éthique en data science](https://www.kaggle.com/learn/ethics)

---

**Bon travail ! 🎓**



---


### 📄 TP 3 : Machine Learning - Prédictions et biais

*Source: `titanic-learning-app/TP-03-MACHINE-LEARNING.md`*


---

# TP 3 : Machine Learning - Prédictions et biais

**Durée estimée :** 2h  
**Niveau :** Avancé  
**Application :** https://titaniclearning.netlify.app  
**Prérequis :** TP 1 et TP 2 terminés

---

## 📋 Objectifs pédagogiques

À la fin de ce TP, vous serez capable de :
- Faire des prédictions basées sur des patterns observés
- Évaluer la performance d'un modèle de prédiction
- Identifier les biais dans les prédictions
- Comprendre les risques éthiques du machine learning
- Réfléchir aux limites des modèles prédictifs

---

## 🎯 Contexte

Dans ce TP, vous allez jouer le rôle d'un "modèle humain" : vous allez prédire la survie de 8 passagers en vous basant sur les patterns que vous avez observés dans les modules précédents. Ensuite, vous comparerez vos prédictions avec la réalité et analyserez vos biais potentiels.

---

## 📝 Exercices

### Exercice 1 : Prédictions manuelles (40 min)

**Instructions :**
1. **Accédez au module Machine Learning** dans l'application
2. **Pour chaque passager** (8 au total), vous devez :
   - Examiner ses caractéristiques (sexe, âge, classe, prix, embarquement)
   - Faire une prédiction : survivra-t-il ou non ?
   - Justifier votre prédiction

**Méthodologie recommandée :**

Pour chaque passager, suivez cette démarche :

1. **Analysez les caractéristiques** :
   - Quel est le sexe ? (rappelez-vous : les femmes survivent plus)
   - Quelle est la classe ? (rappelez-vous : classe 1 > classe 2 > classe 3)
   - Quel est l'âge ? (les enfants ont-ils plus de chances ?)
   - Quel est le prix ? (corrélé avec la classe)
   - Quel est le port d'embarquement ?

2. **Appliquez vos connaissances** :
   - Utilisez les patterns observés dans le TP 2
   - Combinez plusieurs facteurs
   - Pesez l'importance de chaque facteur

3. **Faites votre prédiction** :
   - Choisissez "Oui" ou "Non" dans le dropdown
   - Rédigez une justification claire

**Exemple de justification :**
> "Je prédits 'Oui' car c'est une femme de classe 1, et d'après les graphiques du module 2, les femmes de classe 1 ont un très haut taux de survie."

**⚠️ Important :**
- Ne trichez pas ! Faites vos prédictions avant de révéler les résultats
- Justifiez chaque prédiction
- Notez vos doutes et incertitudes

---

### Exercice 2 : Évaluation de performance (20 min)

Une fois que vous avez fait toutes vos prédictions :

1. **Cliquez sur "Révéler la vérité"**
2. **Observez vos résultats** :
   - Combien de prédictions correctes ?
   - Combien d'erreurs ?
   - Quel est votre score en pourcentage ?

3. **Analysez vos erreurs** :
   - Pour chaque erreur, examinez :
     - Pourquoi avez-vous prédit cela ?
     - Qu'est-ce qui vous a trompé ?
     - Y a-t-il un pattern dans vos erreurs ?

**Question à répondre dans l'application :**
- Le modèle comprend-il le contexte humain ? (Oui / Non)
- Justification : Expliquez si vos prédictions reflètent une compréhension nuancée ou des règles simplistes

**Réflexion :**
- Un modèle de machine learning aurait-il fait mieux ou moins bien ?
- Quels sont les avantages et limites d'un "modèle humain" ?

---

### Exercice 3 : Détection des biais (25 min)

**Analysez vos prédictions pour détecter des biais :**

1. **Examinez vos prédictions par sexe** :
   - Avez-vous prédit "non" pour tous les hommes ?
   - Avez-vous prédit "oui" pour toutes les femmes ?
   - Y a-t-il un pattern systématique ?

2. **Examinez vos prédictions par classe** :
   - Avez-vous systématiquement favorisé la classe 1 ?
   - Avez-vous systématiquement défavorisé la classe 3 ?

3. **Observez l'alerte de biais** :
   - Si une alerte apparaît, lisez-la attentivement
   - Réfléchissez à ce qu'elle signifie

**Question à répondre dans l'application :**
- Quel risque principal ? (Biais / Surconfiance / Mauvaise donnée / Tous)
- Justification : Décrivez le risque que vous avez identifié et pourquoi il est problématique

**Types de biais à considérer :**

- **Biais de genre** : Discrimination systématique basée sur le sexe
- **Biais de classe** : Discrimination basée sur le statut socio-économique
- **Surconfiance** : Trop de certitude dans des prédictions incertaines
- **Biais de confirmation** : Chercher des preuves qui confirment nos hypothèses

---

### Exercice 4 : Risques en contexte réel (25 min)

Imaginez maintenant que votre modèle de prédiction est utilisé dans un contexte réel.

**Scénarios à considérer :**

1. **Crédit bancaire** :
   - Un modèle prédit qui peut obtenir un prêt
   - Basé sur des données similaires (âge, revenu, historique)
   - Quels sont les risques ?

2. **Recrutement** :
   - Un modèle prédit qui sera embauché
   - Basé sur CV, parcours, caractéristiques démographiques
   - Quels sont les risques ?

3. **Santé** :
   - Un modèle prédit qui recevra un traitement prioritaire
   - Basé sur l'âge, les antécédents, les ressources
   - Quels sont les risques ?

**Question à répondre dans l'application :**
- Dans quel domaine c'est dangereux ? (Crédit / Recrutement / Santé / Tous)
- Justification : Expliquez pourquoi l'utilisation de modèles prédictifs est risquée dans ce(s) domaine(s)

**Réflexion éthique :**
- Quelles sont les conséquences d'une erreur de prédiction dans chaque domaine ?
- Comment équilibrer efficacité et équité ?
- Qui est responsable des biais dans les modèles ?

---

## 🔍 Analyse approfondie (Bonus)

### Exercice bonus 1 : Amélioration du modèle

Réfléchissez à comment améliorer votre modèle :
- Quelles données supplémentaires seraient utiles ?
- Quels facteurs avez-vous négligés ?
- Comment réduire les biais ?

### Exercice bonus 2 : Comparaison avec ML

Comparez votre approche avec celle d'un algorithme de machine learning :
- Avantages de l'approche humaine
- Avantages de l'approche algorithmique
- Quand utiliser l'une ou l'autre ?

### Exercice bonus 3 : Protocole d'éthique

Proposez un protocole pour déployer un modèle prédictif de manière éthique :
1. Étape 1 : ________________________________
2. Étape 2 : ________________________________
3. Étape 3 : ________________________________

---

## ✅ Validation

Avant de terminer, vérifiez que vous avez :
- [ ] Fait des prédictions pour les 8 passagers
- [ ] Justifié chaque prédiction
- [ ] Révélé les résultats et calculé votre score
- [ ] Analysé vos erreurs
- [ ] Identifié vos biais potentiels
- [ ] Répondu aux 3 questions dans l'application
- [ ] Exporté vos réponses

---

## 📊 Critères d'évaluation

| Critère | Points | Description |
|---------|--------|-------------|
| Qualité des prédictions | 2 pts | Prédictions cohérentes avec les patterns observés |
| Justification des prédictions | 2 pts | Justifications claires et argumentées |
| Analyse des erreurs | 2 pts | Compréhension des erreurs et apprentissage |
| Détection des biais | 2 pts | Identification correcte des biais potentiels |
| Réflexion éthique | 2 pts | Conscience des risques et enjeux éthiques |

**Total : 10 points**

---

## 💡 Conseils méthodologiques

- **Soyez honnête** : Ne modifiez pas vos prédictions après avoir vu les résultats
- **Documentez votre processus** : Notez votre raisonnement pour chaque prédiction
- **Acceptez l'incertitude** : Il est normal de ne pas être sûr
- **Apprenez de vos erreurs** : Analysez ce qui vous a trompé

---

## 🎓 Leçons clés

### Ce que vous avez appris :

1. **Les modèles ne sont pas parfaits** :
   - Ils font des erreurs
   - Ils peuvent avoir des biais
   - Ils nécessitent une validation constante

2. **Le contexte compte** :
   - Les mêmes patterns peuvent avoir des significations différentes selon le contexte
   - L'éthique doit être au centre des préoccupations

3. **La transparence est essentielle** :
   - Il faut comprendre comment fonctionne un modèle
   - Il faut pouvoir justifier les prédictions
   - Il faut identifier et corriger les biais

---

## 🚀 Prochaines étapes

Maintenant que vous avez terminé les 3 TP, vous pouvez :
- **Approfondir** : Explorer d'autres datasets
- **Pratiquer** : Créer vos propres analyses
- **Apprendre** : Suivre des cours sur le machine learning
- **Contribuer** : Partager vos analyses et réflexions

---

## 📚 Ressources complémentaires

- [Introduction au Machine Learning](https://www.kaggle.com/learn/intro-to-machine-learning)
- [Éthique en IA](https://www.kaggle.com/learn/ethics)
- [Détection et correction des biais](https://www.kaggle.com/learn/fairness)
- [Responsible AI](https://ai.google/responsibilities/responsible-ai-practices/)

---

## 🎉 Félicitations !

Vous avez terminé les 3 TP sur le dataset Titanic. Vous avez maintenant une compréhension solide de :
- L'exploration de données (Big Data)
- L'analyse statistique (Data Science)
- Les prédictions et leurs limites (Machine Learning)

**Continuez à explorer, analyser et questionner ! 🎓**

---

**Bon travail ! 🎓**



---


### 📄 TP : Swagger UI / OpenAPI 3 – Création d'une API simple

*Source: `tp-openapi-swagger/TP_ENONCE.md`*


---

# TP : Swagger UI / OpenAPI 3 – Création d'une API simple

**Durée estimée : 2h30 à 3h30**  
**Niveau : MBA1 Développeur Full Stack**

---

## 📋 Contexte

Vous êtes développeur backend dans une startup qui souhaite adopter une approche **API-first** pour développer ses services. Votre mission est de concevoir et implémenter une API REST simple pour la gestion de tâches, en suivant les bonnes pratiques OpenAPI 3 et en utilisant Swagger UI pour la documentation interactive.

L'objectif est de démontrer que vous maîtrisez :
- La conception d'une API avec OpenAPI 3
- L'utilisation de Swagger UI pour tester et documenter
- L'implémentation d'une API REST conforme au contrat
- La validation des données et la gestion d'erreurs standardisées

---

## 🎯 Objectifs pédagogiques

À la fin de ce TP, vous serez capable de :

1. **Concevoir** une spécification OpenAPI 3 complète pour une API REST
2. **Configurer** Swagger UI pour servir et tester votre API
3. **Implémenter** une API Express avec TypeScript conforme à la spécification
4. **Valider** les données d'entrée avec Zod
5. **Gérer** les erreurs de manière standardisée
6. **Tester** l'API via Swagger UI et curl

---

## ✅ Prérequis

- Node.js 18+ installé
- Connaissances de base en TypeScript
- Connaissances de base en Express.js
- Compréhension des concepts REST (GET, POST, PUT, PATCH, DELETE)
- Notions de base sur OpenAPI/Swagger (vue en cours)

---

## 📦 Périmètre fonctionnel

### API "Tasks" - Gestion de tâches

**Modèle de données :**
- `id` : UUID v4 (généré automatiquement)
- `title` : string (minimum 3 caractères, requis)
- `description` : string (optionnel)
- `status` : enum `'todo' | 'doing' | 'done'` (défaut: `'todo'`)
- `createdAt` : date ISO 8601 (généré automatiquement)
- `updatedAt` : date ISO 8601 (mis à jour automatiquement)

**Endpoints à implémenter :**

1. `GET /health` - Vérification de l'état de santé de l'API
2. `GET /tasks` - Liste des tâches (avec pagination `limit`, `offset` et filtre `status` optionnel)
3. `GET /tasks/{id}` - Récupération d'une tâche par ID
4. `POST /tasks` - Création d'une nouvelle tâche
5. `PUT /tasks/{id}` - Mise à jour complète d'une tâche
6. `PATCH /tasks/{id}` - Mise à jour partielle d'une tâche
7. `DELETE /tasks/{id}` - Suppression d'une tâche

**Règles métier :**
- Les IDs doivent être des UUID v4
- Le titre doit contenir au moins 3 caractères
- Le statut doit être l'un des trois valeurs autorisées
- Les dates sont au format ISO 8601
- La pagination par défaut : `limit=10`, `offset=0`
- Le filtre `status` est optionnel sur `GET /tasks`

---

## 🛠️ Stack technique

- **Runtime** : Node.js 18+
- **Language** : TypeScript
- **Framework** : Express.js
- **Validation** : Zod
- **Documentation** : Swagger UI + OpenAPI 3 (fichier YAML)
- **Persistence** : En mémoire (array JavaScript)
- **Rate limiting** : express-rate-limit (optionnel mais recommandé)

---

## 📝 Étapes du TP

### Étape 1 : Initialisation du projet (15 min)

1. Créer un nouveau projet Node.js avec TypeScript
2. Installer les dépendances nécessaires :
   - `express`, `@types/express`
   - `swagger-ui-express`, `@types/swagger-ui-express`
   - `zod`
   - `uuid`, `@types/uuid`
   - `express-rate-limit`
   - `cors`, `@types/cors`
   - `js-yaml`, `@types/js-yaml`
   - `tsx` (pour le développement)
   - `typescript`, `@types/node`
   - `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`

3. Configurer `tsconfig.json` avec les options strictes
4. Créer la structure de dossiers :
   ```
   src/
     ├── server.ts
     ├── routes/
     │   └── tasks.ts
     ├── middlewares/
     │   ├── errorHandler.ts
     │   ├── validate.ts
     │   └── rateLimit.ts
     ├── services/
     │   └── taskService.ts
     ├── types/
     │   └── task.ts
     ├── openapi/
     │   └── openapi.yaml
     └── docs/
         └── swagger.ts
   ```

**✅ Vérification :** Exécuter `npm run dev` doit démarrer le serveur (même s'il n'y a pas encore de routes).

---

### Étape 2 : Création de la spécification OpenAPI 3 (45 min)

Créer le fichier `src/openapi/openapi.yaml` avec :

1. **Section `info`** :
   - Titre, description, version
   - Contact (optionnel)

2. **Section `servers`** :
   - Serveur local : `http://localhost:3000`
   - Serveur de production (exemple) : `https://api.example.com`

3. **Section `tags`** :
   - `Health` : pour les endpoints de santé
   - `Tasks` : pour les endpoints de gestion des tâches

4. **Section `paths`** :
   Pour chaque endpoint, définir :
   - `summary` et `description`
   - `operationId` (unique)
   - `parameters` (si applicable)
   - `requestBody` (pour POST, PUT, PATCH)
   - `responses` avec codes HTTP appropriés :
     - `200` : Succès
     - `201` : Créé (POST)
     - `204` : Pas de contenu (DELETE)
     - `400` : Erreur de validation
     - `404` : Non trouvé
     - `500` : Erreur serveur

5. **Section `components`** :
   - `schemas` : `Task`, `TaskCreate`, `TaskUpdate`, `ErrorEnvelope`, `HealthResponse`, `TasksListResponse`, `TaskResponse`
   - `parameters` : `TaskId`, `Limit`, `Offset`, `StatusFilter`
   - `responses` : `BadRequest`, `NotFound`, `InternalServerError`, `Unauthorized` (pour JWT)
   - `securitySchemes` : `bearerAuth` (JWT, optionnel)

**✅ Vérification :** Le fichier YAML doit être valide (pas d'erreurs de syntaxe). Vous pouvez le valider avec un outil en ligne comme [Swagger Editor](https://editor.swagger.io/).

**⚠️ Points de vigilance :**
- Les schémas doivent correspondre exactement aux types TypeScript que vous allez créer
- Les `operationId` doivent être uniques et descriptifs
- Les exemples dans les schémas aident à comprendre l'API

---

### Étape 3 : Configuration Swagger UI (20 min)

1. Créer `src/docs/swagger.ts` :
   - Charger le fichier `openapi.yaml`
   - Servir Swagger UI sur `/docs`
   - Servir le fichier OpenAPI brut sur `/openapi` et `/openapi.json`

2. Intégrer dans `src/server.ts` :
   - Importer et appeler `setupSwagger(app)`

**✅ Vérification :** 
- Accéder à `http://localhost:3000/docs` doit afficher Swagger UI
- Accéder à `http://localhost:3000/openapi` doit retourner le YAML
- Accéder à `http://localhost:3000/openapi.json` doit retourner le JSON

**⚠️ Points de vigilance :**
- Vérifier que le chemin vers `openapi.yaml` est correct (relatif à `__dirname`)
- Si vous voyez une erreur 404, vérifiez l'ordre des middlewares dans Express

---

### Étape 4 : Implémentation des types et du service (30 min)

1. Créer `src/types/task.ts` avec les interfaces TypeScript :
   - `Task`, `TaskCreate`, `TaskUpdate`, `TaskStatus`, `TaskQueryParams`

2. Créer `src/services/taskService.ts` :
   - Classe `TaskService` avec stockage en mémoire (array)
   - Méthodes : `findAll()`, `findById()`, `create()`, `update()`, `patch()`, `delete()`
   - Utiliser `uuid` pour générer les IDs
   - Gérer les dates avec `new Date().toISOString()`
   - Implémenter la pagination et le filtrage dans `findAll()`

**✅ Vérification :** 
- Les types doivent correspondre aux schémas OpenAPI
- Le service doit être testable unitairement (pas de dépendance Express)

---

### Étape 5 : Implémentation des middlewares (30 min)

1. Créer `src/middlewares/errorHandler.ts` :
   - Middleware de gestion d'erreurs centralisée
   - Format d'erreur standardisé : `{ error: { code, message, details?, traceId? } }`
   - Codes d'erreur : `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`, etc.
   - Middleware `notFoundHandler` pour les routes 404

2. Créer `src/middlewares/validate.ts` :
   - Middleware de validation avec Zod
   - Valider `body`, `query`, `params`
   - Retourner des erreurs formatées en cas d'échec

3. Créer `src/middlewares/rateLimit.ts` :
   - Rate limiter avec `express-rate-limit`
   - 100 requêtes par 15 minutes par IP
   - Exclure `/health` et `/docs` du rate limiting

**✅ Vérification :**
- Les erreurs doivent suivre le format défini dans OpenAPI
- Les validations doivent bloquer les données invalides

---

### Étape 6 : Implémentation des routes (45 min)

Créer `src/routes/tasks.ts` avec tous les endpoints :

1. **GET /health** :
   - Retourner `{ status: 'ok', timestamp, uptime }`

2. **GET /tasks** :
   - Récupérer les paramètres de pagination et filtre
   - Appeler `taskService.findAll()`
   - Retourner `{ data: tasks[], pagination: { total, limit, offset } }`

3. **GET /tasks/:id** :
   - Valider que `id` est un UUID
   - Appeler `taskService.findById()`
   - Retourner 404 si non trouvé

4. **POST /tasks** :
   - Valider le body avec Zod
   - Appeler `taskService.create()`
   - Retourner 201 avec la tâche créée

5. **PUT /tasks/:id** :
   - Valider params et body
   - Vérifier que la tâche existe (404 si non)
   - Appeler `taskService.update()`
   - Retourner la tâche mise à jour

6. **PATCH /tasks/:id** :
   - Valider params et body (tous les champs optionnels)
   - Appeler `taskService.patch()`
   - Retourner 404 si non trouvé

7. **DELETE /tasks/:id** :
   - Valider params
   - Appeler `taskService.delete()`
   - Retourner 204 si succès, 404 si non trouvé

**✅ Vérification :**
- Tester chaque endpoint dans Swagger UI (`/docs`)
- Vérifier que les codes HTTP sont corrects
- Vérifier que les validations fonctionnent (essayer des données invalides)

**⚠️ Points de vigilance :**
- L'ordre des middlewares est important (validation avant la logique métier)
- PUT nécessite tous les champs, PATCH seulement ceux fournis
- DELETE retourne 204 (pas de body), pas 200

---

### Étape 7 : Configuration du serveur Express (15 min)

Créer `src/server.ts` :

1. Configurer Express avec :
   - `cors()` pour autoriser les requêtes cross-origin
   - `express.json()` pour parser le JSON
   - Rate limiting (sauf `/health` et `/docs`)
   - Swagger UI
   - Routes `/` (qui incluent `/tasks` et `/health`)
   - Middlewares d'erreur en dernier

2. Démarrer le serveur sur le port 3000

**✅ Vérification :**
- Le serveur démarre sans erreur
- Tous les endpoints sont accessibles
- Swagger UI fonctionne

---

### Étape 8 : Tests et validation (20 min)

1. **Tester dans Swagger UI** :
   - Ouvrir `http://localhost:3000/docs`
   - Tester chaque endpoint avec "Try it out"
   - Vérifier les réponses et les codes HTTP

2. **Tester avec curl** (voir section "Exemples d'appels" ci-dessous)

3. **Vérifier la conformité** :
   - Les réponses correspondent aux schémas OpenAPI
   - Les erreurs suivent le format standardisé
   - Les validations fonctionnent

**✅ Vérification finale :**
- ✅ Swagger UI accessible et fonctionnel
- ✅ Tous les endpoints implémentés et testés
- ✅ Validations en place
- ✅ Gestion d'erreurs standardisée
- ✅ Code propre et structuré

---

## 🧪 Exemples d'appels curl

### GET /health
```bash
curl -X GET http://localhost:3000/health
```

### GET /tasks (avec pagination)
```bash
curl -X GET "http://localhost:3000/tasks?limit=5&offset=0"
```

### GET /tasks (avec filtre status)
```bash
curl -X GET "http://localhost:3000/tasks?status=todo"
```

### GET /tasks/{id}
```bash
curl -X GET http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000
```

### POST /tasks
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Réviser le cours OpenAPI",
    "description": "Relire les chapitres 1 à 5",
    "status": "todo"
  }'
```

### PUT /tasks/{id}
```bash
curl -X PUT http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tâche mise à jour",
    "description": "Nouvelle description",
    "status": "done"
  }'
```

### PATCH /tasks/{id}
```bash
curl -X PATCH http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "doing"
  }'
```

### DELETE /tasks/{id}
```bash
curl -X DELETE http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000
```

---

## 🐛 Section Debug

### Problème : Swagger UI ne s'affiche pas (404)
- **Cause** : Le middleware Swagger n'est pas correctement configuré ou le chemin est incorrect
- **Solution** : Vérifier que `setupSwagger()` est appelé avant les routes, et que le chemin vers `openapi.yaml` est correct

### Problème : Erreur CORS
- **Cause** : Le middleware `cors()` n'est pas installé ou pas utilisé
- **Solution** : Vérifier que `app.use(cors())` est présent dans `server.ts`

### Problème : Erreur de validation Zod
- **Cause** : Le schéma Zod ne correspond pas aux données reçues
- **Solution** : Vérifier que les schémas Zod correspondent aux schémas OpenAPI

### Problème : Le fichier OpenAPI n'est pas valide
- **Cause** : Erreur de syntaxe YAML ou structure incorrecte
- **Solution** : Valider le fichier avec [Swagger Editor](https://editor.swagger.io/) ou un linter YAML

### Problème : Les dates ne sont pas au bon format
- **Cause** : Utilisation de `new Date()` au lieu de `new Date().toISOString()`
- **Solution** : Toujours utiliser `.toISOString()` pour les dates

---

## ✅ Critères de réussite

### Obligatoires (80% de la note)

- [ ] Le fichier OpenAPI 3 est complet et valide
- [ ] Swagger UI est accessible sur `/docs` et fonctionne
- [ ] Tous les endpoints sont implémentés et fonctionnels
- [ ] Les validations Zod sont en place pour tous les inputs
- [ ] La gestion d'erreurs est standardisée (format `ErrorEnvelope`)
- [ ] Les codes HTTP sont corrects (201 pour POST, 204 pour DELETE, etc.)
- [ ] La pagination et le filtrage fonctionnent sur `GET /tasks`
- [ ] Le code est structuré et propre (pas de code dupliqué)

### Bonus (20% de la note)

- [ ] Rate limiting implémenté et fonctionnel
- [ ] Tests unitaires pour le service (optionnel)
- [ ] Documentation supplémentaire dans les commentaires
- [ ] Gestion des cas limites (ex: pagination avec offset > total)
- [ ] Authentification JWT basique (même si non requise)

---

## 📚 Ressources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Zod Documentation](https://zod.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Swagger Editor](https://editor.swagger.io/) - Pour valider votre fichier OpenAPI

---

## 🎓 Questions de réflexion (pour aller plus loin)

1. Comment pourriez-vous ajouter l'authentification JWT de manière propre ?
2. Quels seraient les avantages d'utiliser une base de données au lieu du stockage en mémoire ?
3. Comment pourriez-vous générer automatiquement les types TypeScript à partir du fichier OpenAPI ?
4. Quels seraient les avantages d'utiliser `zod-to-openapi` pour générer la spec OpenAPI depuis les schémas Zod ?

---

**Bon courage ! 🚀**






---


### 📄 TP : Swagger UI / OpenAPI 3 – Corrigé Formateur

*Source: `tp-openapi-swagger/TP_CORRIGE.md`*


---

# TP : Swagger UI / OpenAPI 3 – Corrigé Formateur

**Durée estimée : 2h30 à 3h30**  
**Niveau : MBA1 Développeur Full Stack**

---

## 📋 Architecture de la solution

### Choix techniques justifiés

**Express.js vs Fastify :**
- **Express** a été choisi car c'est le framework le plus répandu et enseigné
- Plus de ressources pédagogiques disponibles
- Écosystème mature et stable
- Les étudiants sont plus susceptibles de le rencontrer en entreprise

**Zod vs Ajv (JSON Schema) :**
- **Zod** a été choisi pour sa meilleure intégration TypeScript
- Validation et typage en une seule étape
- Messages d'erreur plus clairs
- Possibilité future d'utiliser `zod-to-openapi` pour générer la spec depuis le code

**Stockage en mémoire vs SQLite :**
- **En mémoire** pour rester simple et se concentrer sur OpenAPI/Swagger
- Pas de configuration de base de données nécessaire
- Les étudiants peuvent se concentrer sur l'API et la documentation
- Facile à migrer vers une vraie DB plus tard

### Structure du projet

```
tp-openapi-swagger/
├── package.json              # Dépendances et scripts
├── tsconfig.json             # Configuration TypeScript
├── .eslintrc.json           # Configuration ESLint
├── .gitignore
├── README.md                 # Instructions d'installation
├── TP_ENONCE.md             # Énoncé apprenant
├── TP_CORRIGE.md            # Ce fichier
├── CHECKLIST.md             # Checklist de conformité
└── src/
    ├── server.ts             # Point d'entrée Express
    ├── routes/
    │   └── tasks.ts          # Routes de l'API Tasks
    ├── middlewares/
    │   ├── errorHandler.ts   # Gestion centralisée des erreurs
    │   ├── validate.ts       # Validation Zod
    │   └── rateLimit.ts      # Rate limiting
    ├── services/
    │   └── taskService.ts    # Logique métier (stockage en mémoire)
    ├── types/
    │   └── task.ts           # Types TypeScript
    ├── openapi/
    │   └── openapi.yaml      # Spécification OpenAPI 3
    └── docs/
        └── swagger.ts        # Configuration Swagger UI
```

---

## 🔍 Explications détaillées par composant

### 1. Types TypeScript (`src/types/task.ts`)

**Points clés :**
- Les types correspondent exactement aux schémas OpenAPI
- `TaskStatus` est un type union pour garantir la sécurité de type
- `TaskCreate` et `TaskUpdate` sont séparés pour différencier création et mise à jour
- `TaskQueryParams` pour la pagination et les filtres

**Pièges fréquents :**
- ❌ Utiliser `any` au lieu de types stricts
- ❌ Ne pas différencier `TaskCreate` (tous champs requis sauf optionnels) et `TaskUpdate` (tous optionnels)
- ✅ Toujours utiliser des types stricts pour éviter les erreurs à l'exécution

---

### 2. Service (`src/services/taskService.ts`)

**Points clés :**
- Pattern Singleton : une seule instance partagée
- Stockage en mémoire avec un array privé
- Génération d'UUID avec `uuid` v4
- Dates au format ISO 8601 avec `toISOString()`
- Pagination et filtrage dans `findAll()`

**Pièges fréquents :**
- ❌ Utiliser des IDs séquentiels au lieu d'UUID
- ❌ Ne pas gérer les cas où l'ID n'existe pas (retourner `null` ou `undefined`)
- ❌ Oublier de mettre à jour `updatedAt` lors des modifications
- ✅ Toujours retourner `null` ou `undefined` si la ressource n'existe pas (pour permettre 404)

**Variantes possibles :**
- Ajouter un système de recherche par texte (titre, description)
- Ajouter un tri (par date, statut, etc.)
- Implémenter un cache avec TTL

---

### 3. Middleware de validation (`src/middlewares/validate.ts`)

**Points clés :**
- Validation centralisée avec Zod
- Support de `body`, `query`, et `params`
- Transformation des erreurs Zod en format API standardisé
- Utilisation de `parse()` qui lance une exception en cas d'échec

**Pièges fréquents :**
- ❌ Valider seulement le body et oublier les query params
- ❌ Ne pas transformer les query params (toujours des strings dans Express)
- ❌ Messages d'erreur Zod non formatés pour l'API
- ✅ Toujours transformer les query params numériques avec `.transform()` et `.pipe()`

**Exemple de transformation :**
```typescript
limit: z
  .string()
  .optional()
  .transform((val) => (val ? parseInt(val, 10) : undefined))
  .pipe(z.number().int().positive().max(100).optional())
```

---

### 4. Middleware de gestion d'erreurs (`src/middlewares/errorHandler.ts`)

**Points clés :**
- Format d'erreur standardisé : `{ error: { code, message, details?, traceId? } }`
- Mapping des codes d'erreur vers codes HTTP
- Génération d'un `traceId` unique pour le debugging
- Middleware `notFoundHandler` pour les routes 404

**Pièges fréquents :**
- ❌ Retourner des formats d'erreur différents selon les endpoints
- ❌ Ne pas logger les erreurs (difficile à déboguer en production)
- ❌ Oublier le `traceId` (essentiel pour le support)
- ✅ Toujours utiliser le même format d'erreur partout

**Codes d'erreur standardisés :**
- `VALIDATION_ERROR` → 400
- `UNAUTHORIZED` → 401
- `NOT_FOUND` → 404
- `RATE_LIMIT_EXCEEDED` → 429
- `INTERNAL_ERROR` → 500

---

### 5. Routes (`src/routes/tasks.ts`)

**Points clés :**
- Chaque endpoint a sa validation Zod spécifique
- Codes HTTP corrects : 201 pour POST, 204 pour DELETE, 200 pour GET/PUT/PATCH
- Gestion des cas d'erreur (404 si ressource non trouvée)
- PUT vs PATCH : PUT remplace tout, PATCH met à jour partiellement

**Pièges fréquents :**
- ❌ Utiliser PUT pour une mise à jour partielle (devrait être PATCH)
- ❌ Retourner 200 au lieu de 201 pour POST
- ❌ Retourner un body avec DELETE (devrait être 204 sans body)
- ❌ Ne pas valider les UUID dans les params
- ✅ Toujours valider les params avant de les utiliser

**Différence PUT vs PATCH :**
- **PUT** : Remplacement complet → tous les champs requis doivent être fournis
- **PATCH** : Mise à jour partielle → seuls les champs fournis sont mis à jour

---

### 6. Configuration Swagger (`src/docs/swagger.ts`)

**Points clés :**
- Chargement du fichier YAML avec `fs.readFileSync()`
- Parsing YAML vers JSON avec `js-yaml`
- Servir le YAML brut sur `/openapi`
- Servir le JSON sur `/openapi.json`
- Configuration Swagger UI avec options personnalisées

**Pièges fréquents :**
- ❌ Chemin incorrect vers `openapi.yaml` (problème avec `__dirname` après compilation)
- ❌ Ne pas servir le fichier OpenAPI brut (utile pour l'intégration avec d'autres outils)
- ❌ Oublier de configurer `persistAuthorization` (le token JWT est perdu au rafraîchissement)
- ✅ Utiliser `path.join(__dirname, ...)` pour les chemins relatifs

**Solution pour le chemin :**
```typescript
const openApiPath = path.join(__dirname, '../openapi/openapi.yaml');
```

---

### 7. Fichier OpenAPI (`src/openapi/openapi.yaml`)

**Points clés :**
- Structure complète avec `info`, `servers`, `tags`, `paths`, `components`
- Réutilisation via `$ref` pour éviter la duplication
- Exemples dans les schémas et les requêtes
- Security schemes documentés (même si non implémentés)

**Pièges fréquents :**
- ❌ Oublier les `operationId` (nécessaires pour la génération de clients)
- ❌ Ne pas réutiliser les composants (`$ref`) → duplication
- ❌ Schémas qui ne correspondent pas à l'implémentation
- ❌ Oublier les exemples (rendent l'API plus compréhensible)
- ✅ Toujours valider le YAML avec Swagger Editor avant de tester

**Structure recommandée :**
1. `info` : métadonnées de l'API
2. `servers` : URLs des serveurs
3. `tags` : organisation des endpoints
4. `paths` : définition des endpoints
5. `components` : schémas, paramètres, réponses réutilisables

---

### 8. Serveur Express (`src/server.ts`)

**Points clés :**
- Ordre des middlewares est crucial
- Rate limiting appliqué sélectivement (pas sur `/health` et `/docs`)
- CORS activé pour permettre les requêtes cross-origin
- Middlewares d'erreur en dernier

**Ordre recommandé :**
1. CORS
2. Body parsers (JSON, URL encoded)
3. Rate limiting (sélectif)
4. Swagger UI
5. Routes
6. 404 handler
7. Error handler

**Pièges fréquents :**
- ❌ Mettre les middlewares d'erreur avant les routes (ne capturera pas les erreurs des routes)
- ❌ Oublier CORS (problèmes avec Swagger UI ou les clients frontend)
- ❌ Rate limiting sur `/docs` (peut bloquer l'accès à la documentation)
- ✅ Toujours mettre les error handlers en dernier

---

## 🎯 Grille de correction

### Critères obligatoires (80 points)

#### 1. Fichier OpenAPI 3 (20 points)
- [ ] **Structure complète** (5 pts) : `info`, `servers`, `tags`, `paths`, `components`
- [ ] **Tous les endpoints documentés** (5 pts) : 7 endpoints avec descriptions
- [ ] **Schémas corrects** (5 pts) : `Task`, `TaskCreate`, `TaskUpdate`, `ErrorEnvelope`
- [ ] **Réutilisation via `$ref`** (3 pts) : Paramètres et réponses réutilisables
- [ ] **Exemples présents** (2 pts) : Au moins un exemple par endpoint

#### 2. Swagger UI (10 points)
- [ ] **Accessible sur `/docs`** (3 pts)
- [ ] **Fichier OpenAPI servi sur `/openapi`** (2 pts)
- [ ] **Interface fonctionnelle** (3 pts) : "Try it out" fonctionne
- [ ] **Pas d'erreurs de chargement** (2 pts)

#### 3. Implémentation des endpoints (25 points)
- [ ] **GET /health** (2 pts) : Retourne status, timestamp, uptime
- [ ] **GET /tasks** (5 pts) : Liste avec pagination et filtre status
- [ ] **GET /tasks/:id** (3 pts) : Récupération par ID avec 404 si absent
- [ ] **POST /tasks** (4 pts) : Création avec validation, retourne 201
- [ ] **PUT /tasks/:id** (4 pts) : Mise à jour complète avec 404 si absent
- [ ] **PATCH /tasks/:id** (4 pts) : Mise à jour partielle avec 404 si absent
- [ ] **DELETE /tasks/:id** (3 pts) : Suppression avec 204 si succès, 404 si absent

#### 4. Validation (15 points)
- [ ] **Validation Zod en place** (5 pts) : Pour tous les inputs (body, query, params)
- [ ] **Messages d'erreur clairs** (5 pts) : Format standardisé avec détails
- [ ] **Codes HTTP corrects** (5 pts) : 400 pour validation, 404 pour not found, etc.

#### 5. Gestion d'erreurs (10 points)
- [ ] **Format standardisé** (5 pts) : `{ error: { code, message, details?, traceId? } }`
- [ ] **Middleware centralisé** (3 pts) : `errorHandler` et `notFoundHandler`
- [ ] **Codes d'erreur cohérents** (2 pts) : `VALIDATION_ERROR`, `NOT_FOUND`, etc.

### Bonus (20 points)

- [ ] **Rate limiting** (5 pts) : Implémenté et fonctionnel
- [ ] **Tests unitaires** (5 pts) : Au moins pour le service
- [ ] **Documentation code** (3 pts) : Commentaires JSDoc
- [ ] **Gestion cas limites** (4 pts) : Pagination, filtres, etc.
- [ ] **Authentification JWT** (3 pts) : Même basique (non requise)

### Pénalités

- **-5 pts** : Code non fonctionnel (erreurs de compilation)
- **-3 pts** : Structure de projet non respectée
- **-2 pts** : Pas de README ou instructions manquantes
- **-2 pts** : Code dupliqué ou non structuré

---

## 🐛 Pièges fréquents et solutions

### Piège 1 : Swagger UI ne charge pas le fichier OpenAPI

**Symptôme :** Page blanche ou erreur "Failed to load API definition"

**Causes possibles :**
1. Chemin incorrect vers `openapi.yaml`
2. Fichier YAML invalide (erreur de syntaxe)
3. Middleware Swagger mal configuré

**Solution :**
```typescript
// Vérifier le chemin (après compilation, __dirname pointe vers dist/)
const openApiPath = path.join(__dirname, '../openapi/openapi.yaml');
console.log('OpenAPI path:', openApiPath); // Debug

// Valider le YAML avec Swagger Editor
// https://editor.swagger.io/
```

---

### Piège 2 : Erreurs CORS lors des appels depuis Swagger UI

**Symptôme :** Erreur "CORS policy" dans la console du navigateur

**Cause :** Middleware `cors()` manquant ou mal configuré

**Solution :**
```typescript
import cors from 'cors';
app.use(cors()); // Doit être avant les routes
```

---

### Piège 3 : Les query params sont toujours des strings

**Symptôme :** `req.query.limit` est une string au lieu d'un number

**Cause :** Express parse tous les query params comme des strings

**Solution :** Utiliser Zod avec transformation :
```typescript
limit: z
  .string()
  .optional()
  .transform((val) => (val ? parseInt(val, 10) : undefined))
  .pipe(z.number().int().positive().max(100).optional())
```

---

### Piège 4 : Les UUID ne sont pas validés

**Symptôme :** L'API accepte n'importe quelle string comme ID

**Cause :** Pas de validation sur les params

**Solution :** Valider avec Zod :
```typescript
const taskParamsSchema = z.object({
  id: z.string().uuid('ID doit être un UUID valide'),
});
```

---

### Piège 5 : PUT vs PATCH confondus

**Symptôme :** PUT ne fonctionne que partiellement

**Cause :** PUT doit remplacer complètement la ressource (tous les champs requis)

**Solution :**
- **PUT** : Utiliser `taskCreateSchema` (tous les champs requis sauf optionnels)
- **PATCH** : Utiliser `taskUpdateSchema` (tous les champs optionnels)

---

### Piège 6 : DELETE retourne un body

**Symptôme :** DELETE retourne `{ data: ... }` au lieu de 204

**Cause :** Oubli que DELETE doit retourner 204 No Content sans body

**Solution :**
```typescript
res.status(204).send(); // Pas de .json() !
```

---

## 🔄 Variantes et extensions possibles

### Variante 1 : Génération OpenAPI depuis Zod

Au lieu de maintenir manuellement le fichier OpenAPI, utiliser `zod-to-openapi` :

```typescript
import { z } from 'zod';
import { createDocument } from 'zod-to-openapi';

const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3),
  // ...
});

const document = createDocument({
  openapi: '3.0.3',
  info: { title: 'API Tasks', version: '1.0.0' },
  // ...
});
```

**Avantages :** Une seule source de vérité (Zod), moins de duplication  
**Inconvénients :** Moins de contrôle sur la documentation, dépendance supplémentaire

---

### Variante 2 : Ajout d'une base de données (SQLite)

Remplacer le stockage en mémoire par SQLite :

```typescript
import Database from 'better-sqlite3';

const db = new Database('tasks.db');

// Créer la table
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`);
```

**Avantages :** Persistance des données, plus réaliste  
**Inconvénients :** Configuration supplémentaire, gestion des migrations

---

### Variante 3 : Authentification JWT

Ajouter un middleware d'authentification :

```typescript
import jwt from 'jsonwebtoken';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token manquant' }
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token invalide' }
    });
  }
}
```

**Avantages :** Sécurisation de l'API, réalisme  
**Inconvénients :** Complexité supplémentaire, gestion des secrets

---

### Variante 4 : Tests unitaires

Ajouter des tests avec Jest :

```typescript
import { taskService } from './taskService';

describe('TaskService', () => {
  beforeEach(() => {
    // Réinitialiser le service avant chaque test
  });

  test('should create a task', () => {
    const task = taskService.create({ title: 'Test' });
    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test');
  });
});
```

**Avantages :** Qualité du code, détection précoce des bugs  
**Inconvénients :** Temps de développement supplémentaire

---

## 📊 Métriques de qualité

### Code quality

- **Couverture de types** : 100% (TypeScript strict)
- **Complexité cyclomatique** : Faible (fonctions simples)
- **Duplication** : Minimale (réutilisation via `$ref` dans OpenAPI)

### Performance

- **Temps de réponse** : < 50ms pour la plupart des endpoints (stockage en mémoire)
- **Rate limiting** : 100 req/15min par IP (configurable)

### Sécurité

- **Validation** : Tous les inputs validés avec Zod
- **CORS** : Activé (configurable pour la production)
- **Rate limiting** : Protection contre les abus
- **Erreurs** : Pas de fuite d'informations sensibles

---

## 🎓 Points pédagogiques à souligner

1. **API-first** : La spec OpenAPI est le contrat, l'implémentation doit s'y conformer
2. **Validation** : Toujours valider les inputs, jamais faire confiance aux données client
3. **Gestion d'erreurs** : Format standardisé facilite le debugging et l'intégration
4. **Documentation** : Swagger UI permet de tester l'API sans écrire de code client
5. **Types** : TypeScript + Zod = sécurité de type à la compilation et à l'exécution

---

## 📝 Checklist de correction rapide

Avant de corriger, vérifier :

- [ ] Le projet compile sans erreur (`npm run build`)
- [ ] Le serveur démarre (`npm run dev`)
- [ ] Swagger UI est accessible (`http://localhost:3000/docs`)
- [ ] Tous les endpoints sont testables dans Swagger UI
- [ ] Les validations fonctionnent (tester avec des données invalides)
- [ ] Les codes HTTP sont corrects
- [ ] Le format d'erreur est standardisé
- [ ] Le README est présent et complet

---

**Fin du corrigé formateur**






---


## 8. Jeux Interactifs


---


### 📄 🎮 Nouveaux jeux interactifs - Guide

*Source: `portal-formations/NOUVEAUX_JEUX.md`*


---

# 🎮 Nouveaux jeux interactifs - Guide

J'ai créé **3 nouveaux types de jeux** plus visuels et fun que le simple jeu de colonnes. Voici ce qui est disponible :

## 📋 Liste des nouveaux jeux

### 1. 🎯 ConnectionGame - Jeu de connexion avec lignes animées

**Type :** `connection`

**Description :** Un jeu où les étudiants connectent des éléments de deux colonnes avec des lignes animées qui s'affichent en temps réel. Les connexions correctes apparaissent en vert avec des effets visuels.

**Configuration :**
```json
{
  "gameType": "connection",
  "leftColumn": ["Élément 1", "Élément 2", "Élément 3"],
  "rightColumn": ["Correspondance 1", "Correspondance 2", "Correspondance 3"],
  "correctMatches": [
    { "left": 0, "right": 0 },
    { "left": 1, "right": 2 },
    { "left": 2, "right": 1 }
  ],
  "description": "Connectez les éléments correspondants",
  "instructions": "Cliquez sur un élément de gauche, puis sur son correspondant à droite"
}
```

**Caractéristiques :**
- ✨ Lignes animées avec courbes de Bézier
- 🎨 Effets visuels (ombres, animations)
- ✅ Feedback immédiat (vert = correct, rouge = incorrect)
- 📊 Statistiques en temps réel
- 🏆 Système de scoring

---

### 2. 🕐 TimelineGame - Jeu de timeline chronologique

**Type :** `timeline`

**Description :** Un jeu où les étudiants placent des événements dans l'ordre chronologique sur une timeline visuelle. Parfait pour apprendre les séquences, l'histoire, ou les processus.

**Configuration :**
```json
{
  "gameType": "timeline",
  "events": [
    "Événement 1",
    "Événement 2",
    "Événement 3",
    "Événement 4"
  ],
  "correctOrder": [0, 1, 2, 3],
  "description": "Placez les événements dans l'ordre chronologique",
  "instructions": "Cliquez sur un événement, puis sur un emplacement de la timeline"
}
```

**Caractéristiques :**
- 📅 Timeline visuelle avec ligne horizontale
- 🎯 Emplacements numérotés pour chaque étape
- ✅ Feedback visuel (vert = correct, rouge = incorrect)
- 🔄 Drag & drop ou clic pour placer
- 📊 Suivi du progrès

---

### 3. 📁 CategoryGame - Jeu de classification

**Type :** `category`

**Description :** Un jeu où les étudiants classent des items dans différentes catégories colorées. Idéal pour apprendre les classifications, les catégories, ou organiser des concepts.

**Configuration :**
```json
{
  "gameType": "category",
  "categories": [
    { "name": "Catégorie A", "color": "#3B82F6", "icon": "📦" },
    { "name": "Catégorie B", "color": "#10B981", "icon": "📚" },
    { "name": "Catégorie C", "color": "#F59E0B", "icon": "🎯" }
  ],
  "items": [
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5",
    "Item 6"
  ],
  "correctCategories": [
    { "item": "Item 1", "category": "Catégorie A" },
    { "item": "Item 2", "category": "Catégorie B" },
    { "item": "Item 3", "category": "Catégorie A" }
  ],
  "description": "Classifiez les items dans les bonnes catégories",
  "instructions": "Glissez-déposez les items dans les catégories appropriées"
}
```

**Caractéristiques :**
- 🎨 Catégories colorées avec icônes personnalisables
- 🖱️ Drag & drop fluide
- ✅ Feedback par item (vert = correct, rouge = incorrect)
- 📊 Compteur d'items par catégorie
- 🎯 Interface responsive et moderne

---

## 🚀 Comment utiliser ces jeux

### Dans l'éditeur de contenu

1. Créez un nouvel item de type `game`
2. Sélectionnez le `gameType` approprié (`connection`, `timeline`, ou `category`)
3. Configurez les données selon le format JSON ci-dessus
4. Enregistrez et testez !
5. **Notez l'ID de l'item** pour construire le lien d'accès

### 🔗 Accéder aux jeux

Une fois le jeu créé, vous pouvez y accéder de plusieurs façons :

#### Si le jeu est un **item** (type `game` dans la table `items`) :
```
/items/{itemId}
```
Remplacez `{itemId}` par l'ID de l'item dans la base de données.

**Exemple :** Si l'ID est `123e4567-e89b-12d3-a456-426614174000`, l'URL sera :
```
/items/123e4567-e89b-12d3-a456-426614174000
```

#### Si le jeu est dans un **chapitre** (type `game` dans la table `chapters`) :
```
/courses/{courseId}
```
ou
```
/programs/{programId}
```
Naviguez ensuite jusqu'au chapitre contenant le jeu dans la liste des chapitres.

#### Trouver l'ID d'un jeu dans la base de données :

**Pour un item :**
```sql
SELECT id, title, type FROM items 
WHERE type = 'game' 
  AND title ILIKE '%votre recherche%';
```

**Pour un chapitre :**
```sql
SELECT id, title, type FROM chapters 
WHERE type = 'game' 
  AND title ILIKE '%votre recherche%';
```

#### Via l'interface d'administration :

1. Allez dans `/admin/items` pour voir tous les items de type `game`
2. Cliquez sur un item pour voir son ID dans l'URL : `/admin/items/{itemId}`
3. L'URL d'accès pour les étudiants sera : `/items/{itemId}`

### Exemple complet pour ConnectionGame

```json
 
  "gameType": "column-matching",
  "leftColumn": [...],
  "rightColumn": [...],
  "correctMatches": [...]
}

// Après (connection) - même format !
{
  "gameType": "connection",
  "leftColumn": [...],
  "rightColumn": [...],
  "correctMatches": [...]
}
```

Le format des données est identique, seul le `gameType` change !

---

## 💡 Idées d'utilisation

### ConnectionGame
- Associer concepts théoriques
- Relier définitions et termes
- Connecter causes et effets
- Lier API endpoints et leurs fonctions

### TimelineGame
- Histoire chronologique
- Processus étape par étape
- Cycle de vie d'un projet
- Séquence d'opérations

### CategoryGame
- Classification de concepts
- Organisation par thèmes
- Tri par types
- Regroupement logique

---

---

## 📍 Résumé des liens d'accès

| Type de jeu | Format d'URL | Exemple |
|------------|-------------|---------|
| **Item de type game** | `/items/{itemId}` | `/items/123e4567-e89b-12d3-a456-426614174000` |
| **Chapitre de type game** | `/courses/{courseId}` puis naviguer au chapitre | `/courses/abc123` → Chapitre "Jeu de connexion" |
| **Jeu dans un programme** | `/programs/{programId}` puis naviguer au chapitre | `/programs/xyz789` → Chapitre "Jeu de timeline" |

### 🔍 Comment trouver l'ID d'un jeu

1. **Via l'interface admin** : `/admin/items` ou `/admin/chapters`
2. **Via SQL** : Utilisez les requêtes SQL ci-dessus
3. **Via l'URL** : L'ID apparaît dans l'URL après avoir cliqué sur un jeu dans l'admin

---

**Bon amusement avec ces nouveaux jeux ! 🎉**




---


### 📄 Structure complète des jeux

*Source: `portal-formations/STRUCTURE-COMPLETE-JEUX.md`*


---

# Structure complète des jeux

Ce document décrit l'ossature complète requise pour chaque type de jeu dans l'application.

## 📋 Structure de base commune

Tous les jeux doivent respecter cette structure de base :

### Pour un Item de type "game"

```json
{
  "type": "game",
  "title": "Titre du jeu",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "matching",  // Type de jeu (requis)
    "description": "Description du jeu",  // Optionnel mais recommandé
    "instructions": "Instructions pour jouer"  // Optionnel mais recommandé
    // ... champs spécifiques selon le gameType
  }
}
```

### Pour un Chapitre de type "game"

```json
{
  "title": "Titre du jeu",
  "position": 0,
  "type": "game",
  "published": true,
  "game_content": {
    "gameType": "matching",  // Type de jeu (requis)
    "description": "Description du jeu",  // Optionnel mais recommandé
    "instructions": "Instructions pour jouer"  // Optionnel mais recommandé
    // ... champs spécifiques selon le gameType
  }
}
```

⚠️ **IMPORTANT** : Pour les chapitres, le contenu du jeu va dans `game_content`, PAS dans `content`.

---

## 🎮 Types de jeux disponibles

### 1. Matching (Association de cartes)

**gameType** : `"matching"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Associer les termes",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "matching",
    "description": "Associez chaque terme à sa définition",
    "instructions": "Cliquez sur une carte pour la retourner, puis trouvez sa paire",
    "pairs": [
      {
        "term": "REST",
        "definition": "Architecture stateless avec ressources HTTP"
      },
      {
        "term": "GraphQL",
        "definition": "Requêtes flexibles avec un seul endpoint"
      },
      {
        "term": "WebSocket",
        "definition": "Communication bidirectionnelle en temps réel"
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"matching"`
- ✅ `pairs`: Array d'objets avec `term` et `definition`

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 2. Column Matching (Association de colonnes)

**gameType** : `"column-matching"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Associer les colonnes",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "column-matching",
    "description": "Associez les éléments de la colonne gauche à ceux de la colonne droite",
    "instructions": "Glissez les éléments de la colonne gauche vers la colonne droite",
    "leftColumn": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "rightColumn": [
      "Récupérer une ressource",
      "Créer une ressource",
      "Mettre à jour une ressource",
      "Supprimer une ressource"
    ],
    "correctMatches": [
      { "left": 0, "right": 0 },
      { "left": 1, "right": 1 },
      { "left": 2, "right": 2 },
      { "left": 3, "right": 3 }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"column-matching"`
- ✅ `leftColumn`: Array de strings (éléments de gauche)
- ✅ `rightColumn`: Array de strings (éléments de droite)
- ✅ `correctMatches`: Array d'objets avec `left` (index) et `right` (index)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

**Note** : Les indices dans `correctMatches` commencent à 0.

---

### 3. Connection (Connexion avec lignes animées)

**gameType** : `"connection"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Connectez les éléments",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "connection",
    "description": "Connectez les éléments de deux colonnes avec des lignes animées",
    "instructions": "Cliquez sur un élément de gauche, puis sur son correspondant à droite",
    "leftColumn": [
      "GET /tasks",
      "POST /tasks",
      "PUT /tasks/{id}",
      "DELETE /tasks/{id}"
    ],
    "rightColumn": [
      "Récupère une liste",
      "Crée une ressource",
      "Met à jour complètement",
      "Supprime une ressource"
    ],
    "correctMatches": [
      { "left": 0, "right": 0 },
      { "left": 1, "right": 1 },
      { "left": 2, "right": 2 },
      { "left": 3, "right": 3 }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"connection"`
- ✅ `leftColumn`: Array de strings (éléments de gauche)
- ✅ `rightColumn`: Array de strings (éléments de droite)
- ✅ `correctMatches`: Array d'objets avec `left` (index) et `right` (index)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

**Note** : Même format que `column-matching`, mais avec des lignes animées et des effets visuels améliorés.

---

### 4. Timeline (Timeline chronologique)

**gameType** : `"timeline"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Timeline chronologique",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "timeline",
    "description": "Placez les événements dans l'ordre chronologique",
    "instructions": "Cliquez sur un événement, puis sur un emplacement de la timeline",
    "events": [
      "Événement 1",
      "Événement 2",
      "Événement 3",
      "Événement 4"
    ],
    "correctOrder": [0, 1, 2, 3]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"timeline"`
- ✅ `events`: Array de strings (événements à placer)
- ✅ `correctOrder`: Array de numbers (ordre correct, indices 0-based)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

**Note** : `correctOrder` peut être un array d'indices `[0, 1, 2, 3]` ou un array d'objets `[{text: "...", order: 0}]`.

---

### 5. Category (Classification par catégories)

**gameType** : `"category"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Classification",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "category",
    "description": "Classez les items dans les bonnes catégories",
    "instructions": "Glissez-déposez les items dans les catégories appropriées",
    "categories": [
      {
        "name": "Catégorie A",
        "color": "#3B82F6",
        "icon": "📦"
      },
      {
        "name": "Catégorie B",
        "color": "#10B981",
        "icon": "📚"
      }
    ],
    "items": [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4"
    ],
    "correctCategories": [
      { "item": "Item 1", "category": "Catégorie A" },
      { "item": "Item 2", "category": "Catégorie B" },
      { "item": "Item 3", "category": "Catégorie A" },
      { "item": "Item 4", "category": "Catégorie B" }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"category"`
- ✅ `categories`: Array d'objets avec :
  - `name`: string (nom de la catégorie)
  - `color`: string (couleur hex, ex: "#3B82F6")
  - `icon`: string (optionnel, emoji ou icône)
- ✅ `items`: Array de strings (items à classer)
- ✅ `correctCategories`: Array d'objets avec :
  - `item`: string (nom de l'item) ou number (index)
  - `category`: string (nom de la catégorie) ou number (index)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 6. API Types (Choix de type d'API)

**gameType** : `"api-types"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Quel type d'API utiliser ?",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "api-types",
    "description": "Choisissez le bon type d'API pour chaque scénario",
    "instructions": "Glissez le type d'API approprié pour chaque scénario",
    "apiTypes": [
      {
        "id": "rest",
        "name": "REST API",
        "color": "bg-blue-500",
        "description": "Architecture stateless avec ressources HTTP"
      },
      {
        "id": "graphql",
        "name": "GraphQL",
        "color": "bg-pink-500",
        "description": "Requêtes flexibles avec un seul endpoint"
      },
      {
        "id": "websocket",
        "name": "WebSocket",
        "color": "bg-green-500",
        "description": "Communication bidirectionnelle en temps réel"
      },
      {
        "id": "grpc",
        "name": "gRPC",
        "color": "bg-purple-500",
        "description": "RPC haute performance avec Protocol Buffers"
      }
    ],
    "scenarios": [
      {
        "id": 1,
        "text": "Application de chat en temps réel",
        "correctType": "websocket",
        "explanation": "Les chats nécessitent une communication bidirectionnelle en temps réel."
      },
      {
        "id": 2,
        "text": "API publique pour un site e-commerce",
        "correctType": "rest",
        "explanation": "REST est idéal pour les APIs publiques avec des ressources bien définies."
      },
      {
        "id": 3,
        "text": "Application mobile avec besoins de données flexibles",
        "correctType": "graphql",
        "explanation": "GraphQL permet de récupérer exactement les données nécessaires."
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"api-types"`
- ✅ `apiTypes`: Array d'objets avec :
  - `id`: string (identifiant unique)
  - `name`: string (nom affiché)
  - `color`: string (classe Tailwind CSS, ex: "bg-blue-500")
  - `description`: string (description du type d'API)
- ✅ `scenarios`: Array d'objets avec :
  - `id`: number (identifiant unique)
  - `text`: string (texte du scénario)
  - `correctType`: string (id du type d'API correct)
  - `explanation`: string (explication de la réponse)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 7. Format Files (Formats JSON/XML/Protobuf)

**gameType** : `"format-files"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Formats de fichiers",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "format-files",
    "description": "Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf",
    "instructions": "Répondez aux questions pour progresser dans les niveaux",
    "levels": [
      {
        "level": 1,
        "name": "Découverte",
        "questions": [
          {
            "id": "q1-1",
            "type": "identify-format",
            "prompt": "Quel est ce format de données ?",
            "snippet": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
            "options": ["JSON", "XML", "Protobuf"],
            "answer": "JSON",
            "explanation": "C'est du JSON : les accolades {} et les guillemets doubles indiquent ce format.",
            "difficulty": 1
          },
          {
            "id": "q1-2",
            "type": "json-valid",
            "prompt": "Ce JSON est-il valide ?",
            "snippet": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
            "answer": true,
            "explanation": "Oui, c'est un JSON valide avec une syntaxe correcte.",
            "difficulty": 1
          }
        ]
      },
      {
        "level": 2,
        "name": "Intermédiaire",
        "questions": [
          {
            "id": "q2-1",
            "type": "fix-json-mcq",
            "prompt": "Quelle est la correction de ce JSON ?",
            "snippet": "{\n  name: \"John\",\n  age: 30\n}",
            "options": [
              "{\"name\": \"John\", \"age\": 30}",
              "{name: \"John\", age: 30}",
              "{\"name\": \"John\", \"age\": 30}"
            ],
            "answer": "{\"name\": \"John\", \"age\": 30}",
            "explanation": "En JSON, les clés doivent être entre guillemets doubles.",
            "difficulty": 2
          }
        ]
      },
      {
        "level": 3,
        "name": "Avancé",
        "questions": [
          {
            "id": "q3-1",
            "type": "fix-json-editor",
            "prompt": "Corrigez ce JSON dans l'éditeur :",
            "snippet": "{\n  \"users\": [\n    {\"name\": \"John\", \"age\": 30}\n    {\"name\": \"Jane\", \"age\": 25}\n  ]\n}",
            "answer": "{\n  \"users\": [\n    {\"name\": \"John\", \"age\": 30},\n    {\"name\": \"Jane\", \"age\": 25}\n  ]\n}",
            "explanation": "Il manque une virgule entre les deux objets du tableau.",
            "difficulty": 3
          }
        ]
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"format-files"`
- ✅ `levels`: Array d'objets avec :
  - `level`: number (numéro du niveau, 1, 2, 3...)
  - `name`: string (nom du niveau)
  - `questions`: Array d'objets question

**Structure d'une question** :

Chaque question doit avoir :
- ✅ `id`: string (identifiant unique)
- ✅ `type`: string - un des types suivants :
  - `"identify-format"` : Identifier le format (JSON/XML/Protobuf)
  - `"json-valid"` : Vérifier si le JSON est valide (réponse booléenne)
  - `"fix-json-mcq"` : Corriger le JSON (choix multiples)
  - `"fix-json-editor"` : Corriger le JSON dans un éditeur
  - `"choose-format"` : Choisir le format approprié
- ✅ `prompt`: string (question posée)
- ✅ `answer`: string | boolean (réponse correcte)
- ✅ `explanation`: string (explication de la réponse)
- ✅ `difficulty`: number (niveau de difficulté, 1-3)

**Champs optionnels selon le type de question** :
- `snippet`: string (code à analyser) - requis pour la plupart des types
- `options`: Array<string> (options de réponse) - requis pour `identify-format` et `fix-json-mcq`

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 8. JSON File Types (Nouveau type)

**gameType** : `"json-file-types"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Types de fichiers JSON",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "json-file-types",
    "description": "Identifiez le type de fichier JSON",
    "instructions": "Regardez le contenu et choisissez le type de fichier",
    "fileTypes": [
      {
        "id": "package.json",
        "name": "package.json",
        "description": "Fichier de configuration npm",
        "color": "bg-red-500"
      },
      {
        "id": "tsconfig.json",
        "name": "tsconfig.json",
        "description": "Configuration TypeScript",
        "color": "bg-blue-500"
      }
    ],
    "examples": [
      {
        "id": 1,
        "content": "{\n  \"name\": \"my-app\",\n  \"version\": \"1.0.0\"\n}",
        "correctType": "package.json",
        "explanation": "Ce contenu correspond à un package.json avec name et version."
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"json-file-types"`
- ✅ `fileTypes`: Array d'objets avec `id`, `name`, `description`, `color`
- ✅ `examples`: Array d'objets avec `id`, `content`, `correctType`, `explanation`

---

## ✅ Checklist de validation

Pour qu'un jeu soit complet et fonctionnel, vérifiez :

### Structure de base
- [ ] `type` = `"game"` (pour un item) ou `type` = `"game"` dans le chapitre
- [ ] `title` présent et non vide
- [ ] `position` défini (number)
- [ ] `published` = `true` (ou omis, par défaut `true`)

### Contenu du jeu
- [ ] `gameType` présent et valide (matching, column-matching, connection, timeline, category, api-types, format-files, json-file-types)
- [ ] Tous les champs requis pour le `gameType` sont présents
- [ ] Les arrays requis ne sont pas vides (pairs, levels, apiTypes, scenarios, etc.)
- [ ] Les indices dans `correctMatches` sont valides (0-indexed)
- [ ] Les `id` dans les questions/scénarios sont uniques

### Pour les chapitres
- [ ] `game_content` contient le jeu (PAS `content`)
- [ ] `game_content.gameType` est défini
- [ ] Structure du jeu directement dans `game_content` (pas imbriquée)

### Pour les items
- [ ] `content.gameType` est défini
- [ ] Structure du jeu directement dans `content` (pas imbriquée)

---

## 📝 Exemples complets par contexte

### Exemple : Jeu dans un Item

```json
{
  "type": "game",
  "title": "Jeu : Associer les termes API",
  "position": 1,
  "published": true,
  "content": {
    "gameType": "matching",
    "description": "Associez chaque terme à sa définition",
    "instructions": "Cliquez sur les cartes pour les retourner",
    "pairs": [
      { "term": "REST", "definition": "Architecture stateless" },
      { "term": "GraphQL", "definition": "Requêtes flexibles" }
    ]
  }
}
```

### Exemple : Jeu dans un Chapitre

```json
{
  "title": "Jeu : Associer les termes API",
  "position": 1,
  "type": "game",
  "published": true,
  "game_content": {
    "gameType": "matching",
    "description": "Associez chaque terme à sa définition",
    "instructions": "Cliquez sur les cartes pour les retourner",
    "pairs": [
      { "term": "REST", "definition": "Architecture stateless" },
      { "term": "GraphQL", "definition": "Requêtes flexibles" }
    ]
  }
}
```

---

## 🚨 Erreurs courantes à éviter

1. ❌ Mettre `game_content` dans un item (utiliser `content` à la place)
2. ❌ Mettre `content` dans un chapitre de type game (utiliser `game_content`)
3. ❌ Imbriquer la structure : `game_content.game_content.gameType` (structure plate requise)
4. ❌ Oublier `gameType` (champ requis)
5. ❌ Arrays vides dans les champs requis (pairs, levels, etc.)
6. ❌ Indices incorrects dans `correctMatches` (doivent être 0-indexed)
7. ❌ `id` dupliqués dans les questions/scénarios

---

## 🔗 Accéder aux jeux

Une fois un jeu créé, vous pouvez y accéder de plusieurs façons :

### Si le jeu est un **item** (table `items`)

**URL d'accès :**
```
/items/{itemId}
```

**Exemple :**
```
/items/123e4567-e89b-12d3-a456-426614174000
```

**Trouver l'ID :**
```sql
SELECT id, title, type FROM items 
WHERE type = 'game' 
  AND title ILIKE '%votre recherche%';
```

### Si le jeu est dans un **chapitre** (table `chapters`)

**URL d'accès :**
```
/courses/{courseId}
```
ou
```
/programs/{programId}
```

Naviguez ensuite jusqu'au chapitre contenant le jeu dans la liste des chapitres.

**Trouver l'ID :**
```sql
SELECT id, title, type FROM chapters 
WHERE type = 'game' 
  AND title ILIKE '%votre recherche%';
```

### Via l'interface d'administration

1. Allez dans `/admin/items` pour voir tous les items de type `game`
2. Ou allez dans `/admin/chapters` pour voir tous les chapitres de type `game`
3. Cliquez sur un jeu pour voir son ID dans l'URL : `/admin/items/{itemId}` ou `/admin/chapters/{chapterId}`
4. L'URL d'accès pour les étudiants sera : `/items/{itemId}` ou via le cours/programme

### Tableau récapitulatif

| Type | Table | URL d'accès | Comment trouver l'ID |
|------|-------|-------------|---------------------|
| Item game | `items` | `/items/{itemId}` | SQL : `SELECT id FROM items WHERE type = 'game'` |
| Chapitre game | `chapters` | `/courses/{courseId}` → naviguer au chapitre | SQL : `SELECT id FROM chapters WHERE type = 'game'` |

---

## 📚 Ressources supplémentaires

- `GUIDE-FORMAT-JEU-CHAPITRE.md` : Guide détaillé pour les chapitres
- `FORMATS-JSON.md` : Documentation complète des formats JSON
- `exemples-chapitres-jeux.json` : Exemples complets de tous les types
- `GUIDE-AJOUT-NOUVEAU-JEU.md` : Comment ajouter un nouveau type de jeu
- `exemples-jeux/README-JEUX-API.md` : Exemples de jeux pour l'apprentissage des APIs




---


### 📄 Guide : Comment ajouter un nouveau jeu

*Source: `portal-formations/GUIDE-AJOUT-NOUVEAU-JEU.md`*


---

# Guide : Comment ajouter un nouveau jeu

Ce guide explique comment ajouter un nouveau jeu au système de manière modulaire, sans modifier les fichiers de rendu existants.

## Architecture du système

Le système utilise un **registre de jeux** (`gameRegistry`) qui permet d'enregistrer dynamiquement des jeux. Chaque jeu est un module indépendant qui peut être ajouté facilement.

### Fichiers clés

- **`src/lib/gameRegistry.ts`** : Registre centralisé des jeux
- **`src/components/GameRenderer.tsx`** : Composant générique qui rend n'importe quel jeu enregistré
- **`src/components/ChapterViewer.tsx`** : Utilise `GameRenderer` pour afficher les jeux dans les chapitres

## Étapes pour ajouter un nouveau jeu

### 1. Créer le composant du jeu

Créez un nouveau fichier dans `src/components/` avec votre composant de jeu.

**Exemple : `src/components/MonNouveauJeu.tsx`**

```typescript
import { useState } from 'react'
import { BaseGameProps } from '../lib/gameRegistry'

// Interface pour les props spécifiques à votre jeu
interface MonNouveauJeuProps extends BaseGameProps {
  questions?: Array<{
    id: string
    question: string
    options: string[]
    correctAnswer: string
  }>
  // Ajoutez d'autres props spécifiques à votre jeu
}

export function MonNouveauJeu({ 
  questions = [], 
  onScore, 
  description 
}: MonNouveauJeuProps) {
  const [score, setScore] = useState(0)
  
  // Votre logique de jeu ici
  
  const handleAnswer = (questionId: string, answer: string) => {
    // Logique de validation
    const question = questions.find(q => q.id === questionId)
    if (question && question.correctAnswer === answer) {
      setScore(prev => prev + 1)
    }
    
    // Appeler onScore quand le jeu est terminé
    if (onScore) {
      onScore(score, { /* metadata */ })
    }
  }
  
  return (
    <div className="space-y-6">
      {description && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">{description}</p>
        </div>
      )}
      
      {/* Votre interface de jeu */}
      <div>
        {questions.map(question => (
          <div key={question.id} className="mb-4">
            <p className="font-semibold mb-2">{question.question}</p>
            <div className="space-y-2">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(question.id, option)}
                  className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2. Enregistrer le jeu dans le registre

Ouvrez `src/lib/gameRegistry.ts` et ajoutez votre jeu :

```typescript
import { MonNouveauJeu } from '../components/MonNouveauJeu'

// ... dans la section d'enregistrement des jeux

gameRegistry.register({
  gameType: 'mon-nouveau-jeu', // Type unique (utilisé dans game_content.gameType)
  name: 'Mon Nouveau Jeu',
  description: 'Description de votre jeu',
  component: MonNouveauJeu,
  validateConfig: (config) => {
    // Fonction optionnelle pour valider la configuration
    return (
      Array.isArray(config.questions) &&
      config.questions.length > 0 &&
      config.questions.every(q => 
        q.id && 
        q.question && 
        Array.isArray(q.options) && 
        q.correctAnswer
      )
    )
  }
})
```

### 3. Créer un exemple de configuration JSON

Créez un fichier d'exemple pour documenter le format attendu dans `game_content` :

**Exemple : `exemples-chapitres-jeux-mon-nouveau.json`**

```json
{
  "title": "Jeu : Mon Nouveau Jeu",
  "position": 0,
  "type": "game",
  "game_content": {
    "gameType": "mon-nouveau-jeu",
    "description": "Apprenez les concepts de base",
    "instructions": "Répondez aux questions pour progresser",
    "questions": [
      {
        "id": "q1",
        "question": "Quelle est la capitale de la France ?",
        "options": ["Paris", "Lyon", "Marseille", "Toulouse"],
        "correctAnswer": "Paris"
      },
      {
        "id": "q2",
        "question": "Quel est le langage de programmation le plus utilisé ?",
        "options": ["JavaScript", "Python", "Java", "C++"],
        "correctAnswer": "JavaScript"
      }
    ]
  }
}
```

### 4. Utiliser le jeu dans un chapitre

Dans la base de données Supabase, créez un chapitre avec :

- `type` = `'game'`
- `game_content` = l'objet JSON (sans `type`, `title`, `position` qui sont dans les autres colonnes)

**Format dans la colonne `game_content` :**

```json
{
  "gameType": "mon-nouveau-jeu",
  "description": "Apprenez les concepts de base",
  "instructions": "Répondez aux questions pour progresser",
  "questions": [
    {
      "id": "q1",
      "question": "Quelle est la capitale de la France ?",
      "options": ["Paris", "Lyon", "Marseille", "Toulouse"],
      "correctAnswer": "Paris"
    }
  ]
}
```

## Structure des props communes

Tous les jeux reçoivent automatiquement ces props via `BaseGameProps` :

- **`onScore?: (score: number, metadata?: any) => void`** : Callback appelé quand le score est calculé
- **`description?: string`** : Description du jeu (affichée en haut)
- **`instructions?: string`** : Instructions pour jouer

## Validation de la configuration

Si vous fournissez une fonction `validateConfig`, elle sera appelée automatiquement pour vérifier que la configuration est valide avant de rendre le jeu.

```typescript
validateConfig: (config) => {
  // Retourne true si la config est valide, false sinon
  return Array.isArray(config.questions) && config.questions.length > 0
}
```

Si la validation échoue, un message d'erreur sera affiché automatiquement.

## Exemple complet : Jeu "Quel type d'API utiliser ?"

Le jeu `ApiTypesGame` est un bon exemple à suivre :

1. **Composant** : `src/components/ApiTypesGame.tsx`
2. **Enregistrement** : Dans `src/lib/gameRegistry.ts` :
   ```typescript
   gameRegistry.register({
     gameType: 'api-types',
     name: 'Quel type d\'API utiliser ?',
     description: 'Choisissez le type d\'API approprié pour chaque scénario',
     component: ApiTypesGame,
     validateConfig: (config) => {
       return (
         Array.isArray(config.apiTypes) &&
         Array.isArray(config.scenarios) &&
         config.apiTypes.length > 0 &&
         config.scenarios.length > 0
       )
     }
   })
   ```
3. **Format JSON** : Voir `GUIDE-FORMAT-JEU-CHAPITRE.md` section "API Types"

## Avantages de ce système

✅ **Modulaire** : Chaque jeu est indépendant  
✅ **Extensible** : Ajoutez de nouveaux jeux sans modifier les fichiers existants  
✅ **Type-safe** : TypeScript garantit la cohérence des types  
✅ **Validation automatique** : Les configurations invalides sont détectées  
✅ **Réutilisable** : Le même système fonctionne dans `ChapterViewer`, `ReactRenderer`, etc.

## Dépannage

### Le jeu ne s'affiche pas

1. Vérifiez que le jeu est bien enregistré dans `gameRegistry.ts`
2. Vérifiez que `gameType` dans `game_content` correspond exactement au `gameType` dans le registre
3. Vérifiez la console pour les erreurs de validation

### Erreur de validation

Si vous voyez "Configuration invalide", vérifiez :
- Que tous les champs requis sont présents
- Que les types de données sont corrects (tableaux, objets, etc.)
- Que votre fonction `validateConfig` retourne `true` pour une config valide

### Le composant ne reçoit pas les bonnes props

Vérifiez que :
- Les props spécifiques à votre jeu sont bien dans `game_content`
- Vous avez bien étendu `BaseGameProps` dans votre interface
- Les noms des props correspondent exactement aux clés dans `game_content`

## Prochaines étapes

Une fois votre jeu créé et enregistré :

1. Testez-le dans un chapitre
2. Documentez le format JSON attendu
3. Ajoutez des exemples dans la documentation
4. Partagez avec l'équipe !






---


### 📄 🎮 Exemples de jeux pour l'apprentissage des APIs

*Source: `portal-formations/exemples-jeux/README-JEUX-API.md`*


---

# 🎮 Exemples de jeux pour l'apprentissage des APIs

Ce dossier contient des exemples de jeux JSON prêts à l'emploi pour enseigner les concepts d'API REST et OpenAPI.

> 📋 **Guide d'import complet :** Consultez `IMPORT-GUIDE.md` pour les instructions détaillées avec tous les titres et descriptions à utiliser.

## 📁 Fichiers disponibles

### 1. Endpoints API et leurs fonctions

**Fichiers :**
- `api-endpoints-connection-game.json` : Format complet (documentation)
- `api-endpoints-connection-game-IMPORT.json` : **Format pour import JSON** ✅ (recommandé)
- `api-endpoints-connection-game-content-only.json` : Format content-only (pour import manuel)

**Jeu : Associez les endpoints API à leurs fonctions**

**📝 Informations pour l'import :**
- **Titre :** `Associez les endpoints API à leurs fonctions`
- **Description :** `Connectez chaque endpoint HTTP à sa fonction correspondante pour maîtriser les opérations REST`

Associe les endpoints HTTP (GET, POST, PUT, PATCH, DELETE) à leurs fonctions correspondantes.

**Endpoints inclus :**
- `GET /health` → Vérification de l'état de santé
- `GET /tasks` → Liste des tâches
- `GET /tasks/{id}` → Récupération par ID
- `POST /tasks` → Création
- `PUT /tasks/{id}` → Mise à jour complète
- `PATCH /tasks/{id}` → Mise à jour partielle
- `DELETE /tasks/{id}` → Suppression

**Utilisation :** Parfait pour le TP OpenAPI/Swagger, module sur les méthodes HTTP REST.

**🔗 Lien d'accès :**
- Si le jeu est un **item** : `/items/{itemId}` (remplacez `{itemId}` par l'ID de l'item dans la base de données)
- Si le jeu est dans un **chapitre** : `/courses/{courseId}` ou `/programs/{programId}` (naviguez jusqu'au chapitre contenant le jeu)

**Pour trouver l'ID de l'item :**
```sql
SELECT id, title FROM items 
WHERE type = 'game' 
  AND title ILIKE '%endpoints API%';
```

---

### 2. Méthodes HTTP et leurs codes de réponse

**Fichiers :**
- `api-methods-connection-game.json` : Format complet (documentation)
- `api-methods-connection-game-IMPORT.json` : **Format pour import JSON** ✅ (recommandé)
- `api-methods-connection-game-content-only.json` : Format content-only (pour import manuel)

**Jeu : Méthodes HTTP et leurs codes de réponse**

**📝 Informations pour l'import :**
- **Titre :** `Méthodes HTTP et leurs codes de réponse`
- **Description :** `Associez les méthodes HTTP aux codes de statut qu'elles retournent typiquement`

Associe les méthodes HTTP aux codes de statut qu'elles retournent typiquement.

**Concepts couverts :**
- Codes de succès (200, 201, 204)
- Codes d'erreur (400, 404)
- Différence entre PUT et PATCH
- Gestion des erreurs de validation

**Utilisation :** Pour comprendre les conventions REST et les codes HTTP.

**🔗 Lien d'accès :**
- Si le jeu est un **item** : `/items/{itemId}` (remplacez `{itemId}` par l'ID de l'item dans la base de données)
- Si le jeu est dans un **chapitre** : `/courses/{courseId}` ou `/programs/{programId}` (naviguez jusqu'au chapitre contenant le jeu)

**Pour trouver l'ID de l'item :**
```sql
SELECT id, title FROM items 
WHERE type = 'game' 
  AND title ILIKE '%Méthodes HTTP%';
```

---

### 3. Concepts OpenAPI et leurs définitions

**Fichiers :**
- `api-concepts-connection-game.json` : Format complet (documentation)
- `api-concepts-connection-game-IMPORT.json` : **Format pour import JSON** ✅ (recommandé)
- `api-concepts-connection-game-content-only.json` : Format content-only (pour import manuel)

**Jeu : Concepts OpenAPI et leurs définitions**

**📝 Informations pour l'import :**
- **Titre :** `Concepts OpenAPI et leurs définitions`
- **Description :** `Associez les concepts clés d'OpenAPI 3 à leurs définitions`

Associe les concepts clés d'OpenAPI 3 à leurs définitions.

**Concepts inclus :**
- OpenAPI Specification
- Swagger UI
- operationId, schema, components
- path parameters, query parameters
- requestBody, responses
- Zod (validation)

**Utilisation :** Pour maîtriser le vocabulaire et les concepts OpenAPI.

**🔗 Lien d'accès :**
- Si le jeu est un **item** : `/items/{itemId}` (remplacez `{itemId}` par l'ID de l'item dans la base de données)
- Si le jeu est dans un **chapitre** : `/courses/{courseId}` ou `/programs/{programId}` (naviguez jusqu'au chapitre contenant le jeu)

**Pour trouver l'ID de l'item :**
```sql
SELECT id, title FROM items 
WHERE type = 'game' 
  AND title ILIKE '%Concepts OpenAPI%';
```

---

## 🚀 Comment utiliser ces jeux

### ⚠️ Important : Format des fichiers

Il existe **trois formats** de fichiers JSON :

1. **Format complet** (`*-game.json`) : Contient `type`, `title`, `description` et `content`
   - Utilisé pour la documentation et la référence

2. **Format IMPORT** (`*-IMPORT.json`) : Format complet prêt pour l'import JSON ✅ **RECOMMANDÉ**
   - Contient tous les champs nécessaires (`type`, `title`, `position`, `published`, `content`)
   - **Utilisez ce format** pour l'import via `/admin/items/new/json`

3. **Format content-only** (`*-content-only.json`) : Contient uniquement le contenu du jeu
   - Pour l'import manuel via l'interface normale
   - Le `title` et la `description` doivent être remplis dans les champs séparés

### Option 1 : Import via l'interface JSON (Recommandé) ✅

1. Allez dans `/admin/items/new/json?module_id=XXX` (remplacez XXX par l'ID de votre module)
2. Cliquez sur "Importer un fichier JSON"
3. Sélectionnez le fichier **`*-IMPORT.json`** correspondant
4. Le JSON sera chargé automatiquement avec tous les champs (type, title, content, etc.)
5. Ajustez la `position` si nécessaire
6. Cliquez sur "Sauvegarder"
7. **Notez l'ID de l'item créé** pour construire le lien d'accès : `/items/{itemId}`

**Avantages :**
- ✅ Import en un clic
- ✅ Tous les champs sont pré-remplis (titre, description, type, etc.)
- ✅ Moins d'erreurs

### Option 2 : Import manuel via l'interface normale

Si vous préférez utiliser l'interface normale (pas JSON) :

1. Allez dans `/admin/items/new?module_id=XXX`
2. Sélectionnez le type `game`
3. Remplissez le titre et la description (voir les informations ci-dessous)
4. Dans le champ Content, collez le contenu du fichier **`*-content-only.json`**
5. Sauvegardez
6. **Notez l'ID de l'item créé** pour construire le lien d'accès : `/items/{itemId}`

### Option 3 : Modification personnalisée

1. Ouvrez le fichier **`*-content-only.json`**
2. Modifiez les colonnes `leftColumn` et `rightColumn` selon vos besoins
3. Ajustez les `correctMatches` en conséquence
4. Sauvegardez et importez
5. **Notez l'ID** pour construire le lien d'accès

### 🔧 Si vous avez une erreur "Configuration invalide"

Si vous voyez l'erreur "Configuration invalide", c'est probablement que vous avez utilisé le format complet au lieu du format content-only. Consultez le guide : `FIX-CONFIGURATION-CONNECTION-GAME.md`

---

## 📝 Format des correspondances

Les correspondances utilisent des indices (0-based) :

```json
"correctMatches": [
  { "left": 0, "right": 0 },  // Premier élément gauche → Premier élément droit
  { "left": 1, "right": 6 }, // Deuxième élément gauche → Septième élément droit
  ...
]
```

**Important :** Les indices correspondent à la position dans les tableaux `leftColumn` et `rightColumn`.

---

## 🎯 Suggestions d'utilisation pédagogique

### Pour le TP OpenAPI/Swagger

1. **Avant le TP** : Utilisez `api-concepts-connection-game.json` pour introduire le vocabulaire
2. **Pendant le TP** : Utilisez `api-endpoints-connection-game.json` pour renforcer la compréhension des méthodes HTTP
3. **Après le TP** : Utilisez `api-methods-connection-game.json` pour valider la compréhension des codes HTTP

### Variantes possibles

- **Niveau débutant** : Réduisez le nombre de correspondances (5-6 au lieu de 7-10)
- **Niveau avancé** : Ajoutez des endpoints plus complexes (nested resources, query params complexes)
- **Évaluation** : Utilisez ces jeux comme quiz de validation des connaissances

---

## 🔧 Personnalisation

### Ajouter des endpoints

Pour ajouter un nouvel endpoint :

1. Ajoutez l'endpoint dans `leftColumn`
2. Ajoutez sa fonction dans `rightColumn`
3. Ajoutez la correspondance dans `correctMatches` :

```json
{
  "left": 7,  // Index du nouvel endpoint dans leftColumn
  "right": 7 // Index de sa fonction dans rightColumn
}
```

### Modifier les descriptions

Les champs `description` et `instructions` peuvent être personnalisés selon votre contexte pédagogique.

---

## ✅ Checklist avant utilisation

- [ ] Vérifier que tous les indices dans `correctMatches` sont valides
- [ ] S'assurer que `leftColumn` et `rightColumn` ont le même nombre d'éléments (ou au moins que toutes les correspondances sont valides)
- [ ] Tester le jeu dans l'interface pour vérifier le rendu
- [ ] Vérifier que les descriptions sont claires et adaptées au niveau des étudiants

---

**Bon apprentissage ! 🚀**




---


### 📄 🎮 Jeux innovants sur les méthodes HTTP

*Source: `portal-formations/exemples-jeux/README-JEUX-HTTP-METHODS.md`*


---

# 🎮 Jeux innovants sur les méthodes HTTP

Ce dossier contient des versions innovantes et pédagogiques de jeux sur les méthodes HTTP, transformant un simple jeu d'association en expériences d'apprentissage multidimensionnelles.

## 🆕 Nouveaux jeux créés

### 1. 🗂️ Classifiez les méthodes HTTP (Category Game)

**Fichiers :**
- `http-methods-category-game-IMPORT.json` : Format pour import JSON ✅ (recommandé)
- `http-methods-category-game-content-only.json` : Format content-only (pour import manuel)

**Concept innovant :** Au lieu de simplement associer une méthode à son action, les étudiants classifient les méthodes HTTP selon **plusieurs dimensions** :

- **📖 Lecture vs ✏️ Écriture** : Comprendre si la méthode lit ou modifie les données
- **🔄 Idempotent vs ⚠️ Non-idempotent** : Concept avancé sur la répétabilité des opérations
- **📦 Avec corps vs 🚫 Sans corps** : Comprendre quelles méthodes utilisent un body

**Avantages pédagogiques :**
- ✅ Apprentissage multidimensionnel (une méthode peut être dans plusieurs catégories)
- ✅ Compréhension approfondie des propriétés des méthodes HTTP
- ✅ Préparation aux concepts avancés (idempotence, sécurité, performance)
- ✅ Jeu interactif avec drag & drop

**Utilisation :**
- Parfait pour approfondir après avoir appris les bases
- Idéal pour comprendre les différences subtiles entre PUT et PATCH
- Excellent pour préparer aux entretiens techniques

---

### 2. ⏱️ Cycle de vie d'une requête HTTP (Timeline Game)

**Fichiers :**
- `http-request-timeline-game-IMPORT.json` : Format pour import JSON ✅

**Concept innovant :** Les étudiants reconstituent le **cycle de vie complet** d'une requête HTTP, de l'action utilisateur jusqu'à l'affichage du résultat.

**Étapes couvertes :**
1. Action utilisateur (clic)
2. Préparation de la requête côté client
3. Envoi via le réseau
4. Réception et parsing côté serveur
5. Exécution de la logique métier
6. Accès à la base de données
7. Génération de la réponse
8. Envoi de la réponse
9. Réception côté client
10. Mise à jour de l'interface

**Avantages pédagogiques :**
- ✅ Compréhension du flux complet client/serveur
- ✅ Visualisation de l'ordre chronologique
- ✅ Intégration des concepts (HTTP, base de données, interface)
- ✅ Préparation à l'architecture des applications web

**Utilisation :**
- Parfait pour comprendre l'architecture client/serveur
- Idéal après avoir appris les méthodes HTTP
- Excellent pour visualiser le processus complet

---

## 📊 Comparaison des approches

| Aspect | Column-Matching (original) | Category Game (nouveau) | Timeline Game (nouveau) |
|-------|---------------------------|------------------------|------------------------|
| **Complexité** | Simple | Moyenne | Moyenne |
| **Dimensions** | 1 (action) | 3 (lecture/écriture, idempotence, corps) | 1 (chronologie) |
| **Niveau** | Débutant | Intermédiaire | Intermédiaire |
| **Focus** | Association simple | Propriétés avancées | Architecture |
| **Innovation** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 Recommandations d'utilisation

### Progression pédagogique suggérée

1. **Niveau 1 - Débutant** : Jeu column-matching original
   - Apprendre les actions de base (GET = lire, POST = créer, etc.)

2. **Niveau 2 - Intermédiaire** : Jeu Category
   - Approfondir les propriétés (idempotence, corps de requête)
   - Comprendre les différences subtiles (PUT vs PATCH)

3. **Niveau 3 - Architecture** : Jeu Timeline
   - Visualiser le flux complet
   - Intégrer tous les concepts

### Scénarios d'utilisation

**Pour un cours complet sur les APIs REST :**
1. Commencer par le column-matching pour les bases
2. Utiliser le category game pour approfondir
3. Terminer par le timeline pour l'intégration

**Pour un TP OpenAPI/Swagger :**
- Utiliser le category game pour comprendre les propriétés des méthodes
- Utiliser le timeline pour comprendre le contexte d'utilisation

**Pour une préparation technique :**
- Le category game couvre les questions fréquentes en entretien (idempotence, PUT vs PATCH)
- Le timeline montre la compréhension de l'architecture

---

## 🚀 Import

### Option 1 : Import JSON (Recommandé)

1. Allez dans `/admin/items/new/json?module_id=XXX`
2. Cliquez sur "Importer un fichier JSON"
3. Sélectionnez le fichier `*-IMPORT.json`
4. Ajustez la position si nécessaire
5. Sauvegardez

### Option 2 : Import manuel

1. Allez dans `/admin/items/new?module_id=XXX`
2. Sélectionnez le type `game`
3. Remplissez le titre et la description
4. Collez le contenu du fichier `*-content-only.json` dans le champ Content
5. Sauvegardez

---

## 💡 Idées d'extensions

### Pour le Category Game :
- Ajouter des catégories : "Safe" vs "Unsafe", "Cacheable" vs "Non-cacheable"
- Ajouter d'autres méthodes : HEAD, OPTIONS, TRACE
- Créer des variantes avec des codes HTTP

### Pour le Timeline Game :
- Ajouter des étapes de gestion d'erreur
- Créer des variantes pour différents scénarios (création, mise à jour, suppression)
- Ajouter des étapes de cache et de validation

---

**Bon apprentissage avec ces jeux innovants ! 🎉**






---


### 📄 📋 Guide d'import des jeux

*Source: `portal-formations/exemples-jeux/IMPORT-GUIDE.md`*


---

# 📋 Guide d'import des jeux

## 🎯 Deux méthodes d'import

### Méthode 1 : Import via l'interface JSON (Recommandé) ✅

Utilisez les fichiers `*-IMPORT.json` qui contiennent la structure complète.

**Étapes :**
1. Allez dans `/admin/items/new/json?module_id=XXX` (remplacez XXX par l'ID de votre module)
2. Cliquez sur "Importer un fichier JSON"
3. Sélectionnez le fichier `*-IMPORT.json` correspondant
4. Le JSON sera chargé automatiquement avec tous les champs (type, title, content, etc.)
5. Ajustez la `position` si nécessaire
6. Cliquez sur "Sauvegarder"

**Fichiers disponibles :**
- `api-endpoints-connection-game-IMPORT.json`
- `api-methods-connection-game-IMPORT.json`
- `api-concepts-connection-game-IMPORT.json`

### Méthode 2 : Import via l'interface normale

Utilisez les fichiers `*-content-only.json` et remplissez manuellement les champs.

**Étapes :**
1. Allez dans `/admin/items/new?module_id=XXX`
2. Sélectionnez le type `game`
3. Remplissez le titre et la description (voir ci-dessous)
4. Dans le champ Content, collez le contenu du fichier `*-content-only.json`
5. Sauvegardez

---

## ⚠️ Important : Format des fichiers

Les fichiers `*-content-only.json` contiennent **uniquement le contenu du jeu**. Ils ne contiennent **PAS** le titre ni la description au niveau racine, car ces champs sont dans les colonnes de la table `items`, pas dans `content`.

## 📝 Informations à remplir dans l'interface admin

Lors de l'import d'un jeu, vous devez remplir ces informations dans l'interface admin (`/admin/items/new` ou `/admin/items/{itemId}`) :

### 1. `api-endpoints-connection-game-content-only.json`

**Titre :** `Associez les endpoints API à leurs fonctions`

**Description :** `Connectez chaque endpoint HTTP à sa fonction correspondante pour maîtriser les opérations REST`

**Type :** `game`

**Content :** Copiez-collez le contenu du fichier `api-endpoints-connection-game-content-only.json`

---

### 2. `api-methods-connection-game-content-only.json`

**Titre :** `Méthodes HTTP et leurs codes de réponse`

**Description :** `Associez les méthodes HTTP aux codes de statut qu'elles retournent typiquement`

**Type :** `game`

**Content :** Copiez-collez le contenu du fichier `api-methods-connection-game-content-only.json`

---

### 3. `api-concepts-connection-game-content-only.json`

**Titre :** `Concepts OpenAPI et leurs définitions`

**Description :** `Associez les concepts clés d'OpenAPI 3 à leurs définitions`

**Type :** `game`

**Content :** Copiez-collez le contenu du fichier `api-concepts-connection-game-content-only.json`

---

## 🚀 Étapes d'import

1. **Allez dans l'interface admin :** `/admin/items/new`
2. **Remplissez les champs :**
   - **Type :** Sélectionnez `game`
   - **Titre :** Utilisez le titre indiqué ci-dessus
   - **Description :** Utilisez la description indiquée ci-dessus
   - **Position :** Définissez la position dans le module
   - **Published :** Cochez si vous voulez publier immédiatement
3. **Dans le champ Content (JSON) :**
   - Ouvrez le fichier `*-content-only.json` correspondant
   - Copiez **tout le contenu** du fichier
   - Collez-le dans le champ Content
4. **Sauvegardez** l'item
5. **Notez l'ID** de l'item créé pour construire le lien d'accès : `/items/{itemId}`

## ✅ Vérification

Après création, vérifiez que :
- ✅ Le champ `type` de l'item = `'game'`
- ✅ Le champ `title` est rempli
- ✅ Le champ `content->>'gameType'` = `'connection'`
- ✅ Le champ `content->'leftColumn'` est un array non vide
- ✅ Le champ `content->'rightColumn'` est un array non vide

```sql
SELECT 
  id,
  title,
  type,
  content->>'gameType' as game_type,
  jsonb_array_length(content->'leftColumn') as left_count,
  jsonb_array_length(content->'rightColumn') as right_count
FROM items
WHERE type = 'game'
  AND title ILIKE '%OpenAPI%'  -- ou le titre de votre jeu
ORDER BY created_at DESC
LIMIT 1;
```

## 🔗 Accès au jeu

Une fois créé, accédez au jeu via :
```
/items/{itemId}
```

Remplacez `{itemId}` par l'ID de l'item créé.




---


## 9. Big Data Impacts App


---


### 📄 Big Data Impacts - Application d'analyse des impacts

*Source: `big-data-impacts-app/README.md`*


---

# Big Data Impacts - Application d'analyse des impacts

Application React interactive pour analyser et visualiser les impacts du Big Data et de la Data Science dans différents contextes métier.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Configuration

#### Pour l'analyse IA (optionnel)

Pour activer l'analyse IA des cas d'usage :

1. Créez un compte sur [OpenRouter](https://openrouter.ai/)
2. Générez une clé API
3. Ajoutez-la dans `.env` :
```bash
VITE_OPENROUTER_API_KEY=votre_cle_api_ici
VITE_OPENROUTER_MODEL=google/gemini-3-flash-preview
```

#### Pour la sauvegarde des analyses (optionnel)

Pour sauvegarder les analyses IA dans Supabase (visible par les formateurs) :

1. Créez un projet sur [Supabase](https://app.supabase.com/)
2. Exécutez le script SQL `creer-table-use-case-analyses.sql` dans votre base Supabase
3. Ajoutez les variables dans `.env` :
```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

**Note** : Si l'application est intégrée dans portal-formations via iframe, le userId sera automatiquement récupéré depuis le parent.

### Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5174`

### Build pour production

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`

## 🌐 Déploiement

### Netlify

1. Connectez votre dépôt GitHub à Netlify
2. Les paramètres de build sont déjà configurés dans `netlify.toml`
3. Le déploiement se fera automatiquement à chaque push

### Vercel

1. Connectez votre dépôt GitHub à Vercel
2. Les paramètres de build sont déjà configurés dans `vercel.json`
3. Le déploiement se fera automatiquement à chaque push

### Autres plateformes

L'application est une SPA React standard. Utilisez les commandes suivantes :

- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Install command**: `npm install`

## ✨ Fonctionnalités

- **Dashboard** : Vue d'ensemble avec statistiques et graphiques
- **Gestion des cas d'usage** : CRUD complet (Créer, Lire, Modifier, Supprimer)
- **Visualisations interactives** :
  - Graphique radar (spider chart) pour les impacts
  - Graphique en barres pour la comparaison
  - Graphique circulaire pour la répartition par secteur
  - Scatter plot ROI vs Impact
- **Système de comparaison** : Comparez jusqu'à 4 cas d'usage côte à côte
- **Recherche et filtrage** : Par secteur, par titre, par description
- **Persistance des données** : Sauvegarde automatique dans le localStorage

## 📦 Technologies utilisées

- React 19+ avec TypeScript
- Vite pour le build
- Tailwind CSS pour le styling
- Recharts pour les visualisations
- React Router pour la navigation
- Zustand pour la gestion d'état
- React Hook Form + Zod pour les formulaires
- Lucide React pour les icônes

## 📊 Structure des données

Chaque cas d'usage contient :
- Titre et description
- Secteur d'activité
- Impacts (organisationnel, technique, économique, social) sur 10
- ROI estimé (%)
- Technologies utilisées
- Défis et risques identifiés

## 🎨 Design

Interface moderne et responsive avec :
- Design mobile-first
- Palette de couleurs cohérente
- Animations et transitions fluides
- Feedback visuel pour les actions utilisateur
- Compatible iframe (X-Frame-Options: SAMEORIGIN)

## 📝 Données initiales

L'application est pré-chargée avec 5 cas d'usage exemples :
1. Détection de fraude bancaire en temps réel
2. Diagnostic médical assisté par IA
3. Système de recommandation de produits
4. Optimisation de la chaîne logistique
5. Maintenance prédictive industrielle

## 🔧 Développement

### Structure du projet

```
src/
├── components/       # Composants réutilisables
│   ├── charts/       # Composants de graphiques
│   └── Layout.tsx    # Layout principal
├── pages/            # Pages de l'application
├── store/            # Gestion d'état (Zustand)
├── types/            # Types TypeScript
├── data/             # Données initiales
└── App.tsx           # Composant principal
```

### Scripts disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Build pour la production
- `npm run preview` : Prévisualise le build de production
- `npm run lint` : Vérifie le code avec ESLint

## 🔗 Intégration dans un LMS

Cette application peut être intégrée dans un LMS via iframe :

```html
<iframe 
  src="https://votre-domaine.netlify.app" 
  width="100%" 
  height="800px"
  frameborder="0"
></iframe>
```

L'application est configurée pour accepter l'intégration en iframe (X-Frame-Options: SAMEORIGIN).

## 📄 Licence

Ce projet est créé dans le cadre d'un TP sur les impacts du Big Data et de la Data Science.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📧 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.



---


### 📄 Guide de déploiement

*Source: `big-data-impacts-app/DEPLOYMENT.md`*


---

# Guide de déploiement

Ce guide explique comment déployer l'application Big Data Impacts sur différentes plateformes.

## 📋 Prérequis

- Un compte GitHub
- Un compte sur la plateforme de déploiement choisie (Netlify, Vercel, etc.)
- Node.js 18+ installé localement (pour les tests)

## 🚀 Déploiement sur Netlify

### Méthode 1 : Via l'interface Netlify

1. **Créer un nouveau site**
   - Connectez-vous à [Netlify](https://www.netlify.com/)
   - Cliquez sur "Add new site" > "Import an existing project"
   - Sélectionnez "Deploy with GitHub"

2. **Connecter le dépôt**
   - Autorisez Netlify à accéder à votre dépôt GitHub
   - Sélectionnez le dépôt `big-data-impacts-app`

3. **Configurer le build**
   - Netlify détectera automatiquement les paramètres depuis `netlify.toml`
   - Vérifiez que les paramètres suivants sont corrects :
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
     - **Base directory**: `.` (racine)

4. **Déployer**
   - Cliquez sur "Deploy site"
   - Attendez que le build se termine
   - Votre site sera accessible sur `https://votre-site.netlify.app`

### Méthode 2 : Via Netlify CLI

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Initialiser le site
netlify init

# Déployer
netlify deploy --prod
```

## 🚀 Déploiement sur Vercel

### Méthode 1 : Via l'interface Vercel

1. **Créer un nouveau projet**
   - Connectez-vous à [Vercel](https://vercel.com/)
   - Cliquez sur "Add New..." > "Project"
   - Importez votre dépôt GitHub

2. **Configurer le projet**
   - Vercel détectera automatiquement les paramètres depuis `vercel.json`
   - Vérifiez que les paramètres suivants sont corrects :
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Déployer**
   - Cliquez sur "Deploy"
   - Attendez que le build se termine
   - Votre site sera accessible sur `https://votre-site.vercel.app`

### Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

## 🔧 Configuration de l'URL de production

Une fois déployé, notez l'URL de production et mettez à jour les références dans votre LMS :

### Dans le fichier JSON du cours

Remplacez :
```json
"external_url": "http://localhost:5174"
```

Par :
```json
"external_url": "https://votre-site.netlify.app"
```

ou

```json
"external_url": "https://votre-site.vercel.app"
```

## 🔒 Sécurité et headers

L'application est configurée avec les headers de sécurité suivants :
- `X-Frame-Options: SAMEORIGIN` - Permet l'intégration en iframe depuis le même domaine ou configuré
- `X-XSS-Protection: 1; mode=block` - Protection contre les attaques XSS
- `X-Content-Type-Options: nosniff` - Empêche le MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` - Contrôle des informations de referrer

## 📝 Variables d'environnement

Actuellement, l'application n'utilise pas de variables d'environnement. Si vous devez en ajouter :

### Netlify
1. Allez dans Site settings > Environment variables
2. Ajoutez vos variables

### Vercel
1. Allez dans Project settings > Environment Variables
2. Ajoutez vos variables

## 🔄 Déploiement continu (CI/CD)

Le workflow GitHub Actions est configuré pour :
- Vérifier le code avec ESLint
- Builder l'application
- Créer des artifacts

Pour activer le déploiement automatique :
- Netlify : Connectez votre dépôt GitHub, le déploiement sera automatique
- Vercel : Connectez votre dépôt GitHub, le déploiement sera automatique

## 🐛 Dépannage

### Le build échoue
- Vérifiez que Node.js 18+ est utilisé
- Vérifiez que toutes les dépendances sont installées
- Consultez les logs de build sur la plateforme

### L'application ne se charge pas
- Vérifiez que le dossier `dist` est bien publié
- Vérifiez les règles de redirection (toutes les routes doivent pointer vers `/index.html`)
- Vérifiez la console du navigateur pour les erreurs

### Problèmes d'iframe
- Vérifiez que `X-Frame-Options: SAMEORIGIN` est bien configuré
- Si vous intégrez depuis un autre domaine, vous devrez peut-être ajuster les headers

## 📞 Support

Pour toute question, ouvrez une issue sur GitHub.





---


### 📄 Nouvelles fonctionnalités IA et d'aide contextuelle

*Source: `big-data-impacts-app/FEATURES-IA.md`*


---

# Nouvelles fonctionnalités IA et d'aide contextuelle

## 🎯 Fonctionnalités ajoutées

### 1. **Aide contextuelle pour les technologies**

Lors de la création d'un cas d'usage, les étudiants peuvent maintenant :

- **Recherche intelligente** : Tapez le nom d'une technologie (ex: "Kafka", "TensorFlow") et voyez les suggestions avec descriptions
- **Autocomplétion** : Sélectionnez une technologie depuis la liste pour l'ajouter automatiquement
- **Informations détaillées** : Cliquez sur l'icône ℹ️ à côté de chaque technologie pour voir :
  - Description de la technologie
  - Fonctions principales
  - Cas d'usage typiques

**Technologies disponibles** : Apache Kafka, TensorFlow, Apache Spark, PostgreSQL, MongoDB, Redis, Apache Hadoop, PyTorch, Kubernetes, Apache Airflow, InfluxDB, Scikit-learn, AWS S3, Grafana, Spark Streaming, DICOM, OR-Tools, Python

### 2. **Aide contextuelle pour les défis et risques**

Lors de l'identification des défis, les étudiants peuvent :

- **Recherche intelligente** : Tapez un défi (ex: "Latence", "Scalabilité") et voyez les suggestions
- **Raisonnement guidé** : Chaque défi inclut une section "💡 Comment identifier ce défi ?" qui aide l'étudiant à raisonner
- **Stratégies de mitigation** : Voir des solutions concrètes pour chaque défi
- **Exemples de cas d'usage** : Comprendre dans quels contextes ce défi apparaît

**Défis disponibles** : Latence temps réel, Faux positifs, Conformité RGPD, Scalabilité, Explicabilité, Biais algorithmiques, Intégration systèmes existants, Cold start problem, Diversité des recommandations, Privacy, Complexité algorithmique, Données en temps réel, Coûts infrastructure, Qualité données capteurs, Interprétabilité, Coûts IoT, Conformité médicale

### 3. **Analyse IA automatique**

Après la création d'un cas d'usage, l'IA génère automatiquement :

- **Synthèse** (150-200 mots) : Évaluation globale du cas d'usage
- **Points forts** : 3-5 points positifs identifiés
- **Améliorations possibles** : 3-5 suggestions d'amélioration
- **Recommandations d'optimisation** : 3-5 recommandations concrètes pour améliorer les impacts et le ROI
- **Évaluation des scores** : Notes suggérées pour chaque dimension d'impact

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
VITE_OPENROUTER_API_KEY=votre_cle_api_ici
VITE_OPENROUTER_MODEL=google/gemini-3-flash-preview
```

### Obtenir une clé API OpenRouter

1. Créez un compte sur [OpenRouter](https://openrouter.ai/)
2. Allez dans "Keys" et générez une nouvelle clé
3. Ajoutez-la dans votre fichier `.env`
4. Redémarrez le serveur de développement

**Note** : L'analyse IA est optionnelle. Si la clé API n'est pas configurée, l'application fonctionnera normalement mais l'analyse IA ne sera pas disponible.

## 📝 Utilisation

### Pour les étudiants

1. **Créer un cas d'usage** :
   - Remplissez les informations de base
   - Pour les technologies : tapez le nom et sélectionnez depuis les suggestions
   - Cliquez sur ℹ️ pour voir les détails d'une technologie
   - Pour les défis : tapez le nom et sélectionnez depuis les suggestions
   - Cliquez sur ℹ️ pour voir le raisonnement et les stratégies de mitigation

2. **Soumettre le cas d'usage** :
   - Cliquez sur "Créer et analyser"
   - L'IA génère automatiquement une analyse complète
   - Consultez la synthèse, les points forts, améliorations et recommandations
   - Utilisez ces informations pour optimiser votre cas d'usage

### Pour les formateurs

Les analyses IA ne sont pas encore sauvegardées dans la base de données. Elles sont affichées uniquement après la création du cas d'usage.

## 🎨 Interface

- **Autocomplétion** : Suggestions en temps réel lors de la saisie
- **Tooltips** : Icônes ℹ️ cliquables pour voir les détails
- **Modal d'analyse** : Interface élégante avec dégradé pour l'analyse IA
- **Feedback visuel** : Indicateurs de chargement pendant la génération de l'analyse

## 🔄 Améliorations futures possibles

- Sauvegarder les analyses IA dans la base de données
- Permettre de régénérer l'analyse après modification
- Comparer plusieurs analyses IA
- Export PDF de l'analyse
- Historique des analyses





---


### 📄 Instructions d'utilisation - Big Data Impacts App

*Source: `big-data-impacts-app/INSTRUCTIONS.md`*


---

# Instructions d'utilisation - Big Data Impacts App

## 🚀 Démarrage

1. **Installer les dépendances** (si ce n'est pas déjà fait) :
```bash
npm install
```

2. **Lancer l'application en mode développement** :
```bash
npm run dev
```

3. **Ouvrir dans le navigateur** :
L'application s'ouvrira automatiquement sur `http://localhost:5173`

## 📱 Utilisation de l'application

### Dashboard
- Vue d'ensemble avec statistiques (nombre de cas d'usage, ROI moyen, impact moyen, secteurs)
- Graphiques de synthèse (répartition par secteur, impacts moyens)
- Liste des cas d'usage récents

### Gestion des cas d'usage
- **Créer** : Cliquez sur "Nouveau cas d'usage" et remplissez le formulaire
- **Lire** : Cliquez sur une carte de cas d'usage pour voir les détails
- **Modifier** : Sur la page de détail, cliquez sur "Modifier"
- **Supprimer** : Sur la page de détail, cliquez sur "Supprimer" et confirmez

### Visualisations
- **Graphique radar** : Impacts moyens sur les 4 dimensions
- **Graphique circulaire** : Répartition par secteur
- **Graphique en barres** : Comparaison des impacts par cas d'usage
- **Scatter plot** : Relation entre ROI et impact global

### Comparaison
- Sélectionnez jusqu'à 4 cas d'usage à comparer
- Visualisez-les sur un graphique radar superposé
- Consultez le tableau comparatif détaillé

## 💾 Sauvegarde des données

Les données sont automatiquement sauvegardées dans le **localStorage** du navigateur. Elles persistent même après fermeture de l'application.

## 🎨 Fonctionnalités

- ✅ Interface responsive (mobile, tablette, desktop)
- ✅ Recherche et filtrage par secteur
- ✅ Validation des formulaires
- ✅ Graphiques interactifs
- ✅ Comparaison de cas d'usage
- ✅ Données pré-chargées (5 cas d'usage exemples)

## 📊 Données initiales

L'application est pré-chargée avec 5 cas d'usage exemples :
1. Détection de fraude bancaire en temps réel (Finance)
2. Diagnostic médical assisté par IA (Santé)
3. Système de recommandation de produits (E-commerce)
4. Optimisation de la chaîne logistique (Logistique)
5. Maintenance prédictive industrielle (Industrie)

## 🔧 Build pour production

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`.

## 📝 Notes

- Les données sont stockées localement dans le navigateur
- Pour partager les données, vous devrez exporter/importer manuellement
- L'application fonctionne entièrement hors ligne après le premier chargement





---


### 📄 Comment voir les bases de données de technologies et défis

*Source: `big-data-impacts-app/VOIR-BASES-DONNEES.md`*


---

# Comment voir les bases de données de technologies et défis

## 📋 Méthode 1 : Dans l'application (recommandé)

### Pour voir les technologies :

1. **Lancez l'application** :
   ```bash
   cd big-data-impacts-app
   npm run dev
   ```

2. **Allez sur la page de création de cas d'usage** :
   - Cliquez sur "Cas d'usage" dans le menu
   - Cliquez sur "Nouveau cas d'usage"

3. **Dans le champ "Technologies utilisées"** :
   - Commencez à taper le nom d'une technologie (ex: "Kafka", "TensorFlow", "Spark")
   - Vous verrez apparaître une liste déroulante avec les suggestions
   - Chaque suggestion affiche le nom et la description
   - Sélectionnez une technologie pour l'ajouter

4. **Pour voir les détails complets** :
   - Une fois la technologie ajoutée, une icône ℹ️ bleue apparaît à côté
   - Cliquez sur cette icône pour voir :
     - Description complète
     - Fonctions principales
     - Cas d'usage typiques

### Pour voir les défis :

1. **Dans le champ "Défis et risques"** :
   - Commencez à taper le nom d'un défi (ex: "Latence", "Scalabilité", "RGPD")
   - Vous verrez apparaître une liste déroulante avec les suggestions
   - Sélectionnez un défi pour l'ajouter

2. **Pour voir les détails complets** :
   - Une fois le défi ajouté, une icône ℹ️ orange apparaît à côté
   - Cliquez sur cette icône pour voir :
     - Description du défi
     - 💡 Comment identifier ce défi ? (raisonnement guidé)
     - Stratégies de mitigation
     - Exemples de cas d'usage

## 📁 Méthode 2 : Dans le code source

### Technologies

Fichier : `src/data/technologiesData.ts`

Liste des 18 technologies disponibles :
- Apache Kafka
- TensorFlow
- Apache Spark
- PostgreSQL
- MongoDB
- Redis
- Apache Hadoop
- PyTorch
- Kubernetes
- Apache Airflow
- InfluxDB
- Scikit-learn
- AWS S3
- Grafana
- Spark Streaming
- DICOM
- OR-Tools
- Python

Chaque technologie contient :
- `name` : Nom de la technologie
- `description` : Description générale
- `mainFunctions` : Liste des fonctions principales
- `useCases` : Cas d'usage typiques
- `category` : Catégorie (processing, storage, streaming, ml, database, orchestration)

### Défis

Fichier : `src/data/challengesData.ts`

Liste des 17 défis disponibles :
- Latence temps réel
- Faux positifs
- Conformité RGPD
- Scalabilité
- Explicabilité
- Biais algorithmiques
- Intégration systèmes existants
- Cold start problem
- Diversité des recommandations
- Privacy
- Complexité algorithmique
- Données en temps réel
- Coûts infrastructure
- Qualité données capteurs
- Interprétabilité
- Coûts IoT
- Conformité médicale

Chaque défi contient :
- `name` : Nom du défi
- `description` : Description du défi
- `reasoning` : Guide de raisonnement pour identifier le défi
- `mitigation` : Stratégies de mitigation
- `examples` : Exemples de cas d'usage
- `category` : Catégorie (technical, organizational, economic, legal, data-quality)

## 🔍 Méthode 3 : Via la console du navigateur

1. Ouvrez l'application dans votre navigateur
2. Ouvrez la console développeur (F12)
3. Dans la console, tapez :

```javascript
// Pour voir toutes les technologies
import { technologiesDatabase } from './src/data/technologiesData';
console.table(technologiesDatabase);

// Pour voir tous les défis
import { challengesDatabase } from './src/data/challengesData';
console.table(challengesDatabase);
```

## 📊 Méthode 4 : Liste complète dans ce document

### Technologies (18)

1. **Apache Kafka** - Plateforme de streaming distribuée
2. **TensorFlow** - Framework de machine learning
3. **Apache Spark** - Moteur de traitement distribué
4. **PostgreSQL** - Base de données relationnelle
5. **MongoDB** - Base de données NoSQL
6. **Redis** - Base de données en mémoire
7. **Apache Hadoop** - Framework pour Big Data
8. **PyTorch** - Framework de deep learning
9. **Kubernetes** - Orchestrateur de conteneurs
10. **Apache Airflow** - Orchestration de workflows
11. **InfluxDB** - Base de données temporelle
12. **Scikit-learn** - Bibliothèque ML Python
13. **AWS S3** - Stockage objet
14. **Grafana** - Visualisation et monitoring
15. **Spark Streaming** - Traitement de flux
16. **DICOM** - Standard images médicales
17. **OR-Tools** - Optimisation combinatoire
18. **Python** - Langage de programmation

### Défis (17)

1. **Latence temps réel** - Délai de traitement
2. **Faux positifs** - Erreurs de détection
3. **Conformité RGPD** - Protection des données
4. **Scalabilité** - Gestion de la charge
5. **Explicabilité** - Compréhension des décisions IA
6. **Biais algorithmiques** - Discrimination
7. **Intégration systèmes existants** - Compatibilité
8. **Cold start problem** - Nouveaux utilisateurs/produits
9. **Diversité des recommandations** - Éviter les bulles
10. **Privacy** - Vie privée
11. **Complexité algorithmique** - Performance
12. **Données en temps réel** - Traitement continu
13. **Coûts infrastructure** - Investissements
14. **Qualité données capteurs** - Fiabilité IoT
15. **Interprétabilité** - Compréhension des résultats
16. **Coûts IoT** - Investissements capteurs
17. **Conformité médicale** - Normes médicales

## 💡 Astuce

La façon la plus intuitive de voir ces bases de données est d'utiliser l'application directement. L'autocomplétion et les tooltips vous permettront de découvrir progressivement toutes les technologies et défis disponibles.





---


## 10. Titanic Learning App


---


### 📄 Titanic Learning App

*Source: `titanic-learning-app/README.md`*


---

# Titanic Learning App

Application React complète pour apprendre le Big Data, la Data Science et le Machine Learning avec le dataset Titanic.

🌐 **Application en ligne :** https://titaniclearning.netlify.app

## 📚 Travaux Pratiques

Des TP complets sont disponibles pour chaque module :

- **[TP 1 : Big Data](./TP-01-BIG-DATA.md)** - Exploration des données brutes (1h30)
- **[TP 2 : Data Science](./TP-02-DATA-SCIENCE.md)** - Analyse et visualisation (2h)
- **[TP 3 : Machine Learning](./TP-03-MACHINE-LEARNING.md)** - Prédictions et biais (2h)

📖 **Guide complet :** [GUIDE-TP.md](./GUIDE-TP.md)

## 🚀 Installation et lancement

```bash
# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build
npm run preview
```

L'application sera accessible sur `http://localhost:5173` (ou le port indiqué par Vite).

## 📦 Structure de l'application

```
titanic-learning-app/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── Layout.tsx       # Layout principal avec navigation
│   │   ├── DataTable.tsx    # Tableau de données avec tri et pagination
│   │   ├── Filters.tsx      # Filtres par colonnes
│   │   ├── Questions.tsx     # Système de questions/réponses
│   │   └── charts/          # Composants de graphiques
│   ├── modules/             # Les 3 modules d'apprentissage
│   │   ├── BigData.tsx
│   │   ├── DataScience.tsx
│   │   └── MachineLearning.tsx
│   ├── data/                # Données Titanic intégrées
│   │   └── titanic.ts
│   ├── lib/                 # Utilitaires
│   │   └── useLocalStorage.ts
│   ├── types/               # Types TypeScript
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
```

## 🎯 Fonctionnalités

### Module 1 : Big Data
- Observation des données brutes
- Tableau avec filtres, recherche, tri et pagination
- 4 questions sur la structure des données
- Progression sauvegardée

### Module 2 : Data Science
- Analyse avec graphiques (bar charts, histogramme)
- Visualisation des taux de survie par sexe/classe
- Distribution de l'âge
- 4 questions d'analyse

### Module 3 : Machine Learning
- Prédictions manuelles sur 8 passagers
- Comparaison avec la réalité
- Calcul de score
- Détection de biais potentiels
- 3 questions réflexives

## 💾 Persistance des données

Toutes les réponses et filtres sont sauvegardés automatiquement dans le `localStorage` du navigateur :
- `big-data-answers` / `big-data-filters`
- `data-science-answers` / `data-science-filters`
- `machine-learning-answers` / `machine-learning-predictions`

## 📤 Export des réponses

Chaque module propose un bouton "Exporter mes réponses" qui télécharge un fichier JSON avec toutes vos réponses.

## 🎨 Interface

- Design moderne et responsive (mobile + desktop)
- Navigation par sidebar/onglets
- Thème clair et lisible
- Animations et transitions fluides

## 🔧 Technologies

- **React 18** avec TypeScript
- **Vite** pour le build et le dev server
- **CSS** pur (pas de framework CSS)
- **localStorage** pour la persistance
- **Pas de backend** : tout est côté client

## 📝 Notes

- Le dataset Titanic est intégré directement dans le code (25 lignes)
- Aucune dépendance externe pour le parsing CSV (fait manuellement)
- Les graphiques sont créés en CSS pur (pas de bibliothèque de chart)
- Compatible avec tous les navigateurs modernes



---


## 11. TP OpenAPI Swagger


---


### 📄 TP OpenAPI 3 + Swagger UI - API Tasks

*Source: `tp-openapi-swagger/README.md`*


---

# TP OpenAPI 3 + Swagger UI - API Tasks

API REST simple pour la gestion de tâches, implémentée avec Express.js, TypeScript, et documentée avec OpenAPI 3 et Swagger UI.

## 🚀 Installation

### Prérequis

- Node.js 18+ installé
- npm ou yarn

### Étapes

1. **Cloner ou télécharger le projet**

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Démarrer le serveur en mode développement :**
   ```bash
   npm run dev
   ```

   Le serveur démarre sur `http://localhost:3000`

4. **Accéder à la documentation Swagger UI :**
   - Ouvrir `http://localhost:3000/docs` dans votre navigateur

## 📚 Scripts disponibles

- `npm run dev` : Démarre le serveur en mode développement avec rechargement automatique (tsx watch)
- `npm run build` : Compile le TypeScript vers JavaScript dans le dossier `dist/`
- `npm run start` : Démarre le serveur en mode production (nécessite `npm run build` avant)
- `npm run lint` : Vérifie le code avec ESLint
- `npm run lint:fix` : Corrige automatiquement les erreurs ESLint
- `npm run type-check` : Vérifie les types TypeScript sans compiler

## 🌐 Endpoints disponibles

### Health Check
- `GET /health` - Vérifie l'état de santé de l'API

### Tasks
- `GET /tasks` - Liste toutes les tâches (pagination et filtre optionnels)
- `GET /tasks/:id` - Récupère une tâche par son ID
- `POST /tasks` - Crée une nouvelle tâche
- `PUT /tasks/:id` - Met à jour complètement une tâche
- `PATCH /tasks/:id` - Met à jour partiellement une tâche
- `DELETE /tasks/:id` - Supprime une tâche

### Documentation
- `GET /docs` - Interface Swagger UI
- `GET /openapi` - Fichier OpenAPI YAML brut
- `GET /openapi.json` - Fichier OpenAPI JSON

## 📖 Exemples d'appels avec curl

### Health Check
```bash
curl -X GET http://localhost:3000/health
```

**Réponse attendue :**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

### Créer une tâche (POST)
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Réviser le cours OpenAPI",
    "description": "Relire les chapitres 1 à 5",
    "status": "todo"
  }'
```

**Réponse attendue (201) :**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Réviser le cours OpenAPI",
    "description": "Relire les chapitres 1 à 5",
    "status": "todo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Lister les tâches (GET)
```bash
curl -X GET "http://localhost:3000/tasks?limit=10&offset=0"
```

**Avec filtre par statut :**
```bash
curl -X GET "http://localhost:3000/tasks?status=todo&limit=5"
```

**Réponse attendue (200) :**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Réviser le cours OpenAPI",
      "description": "Relire les chapitres 1 à 5",
      "status": "todo",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

### Récupérer une tâche par ID (GET)
```bash
curl -X GET http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000
```

**Réponse attendue (200) :**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Réviser le cours OpenAPI",
    "description": "Relire les chapitres 1 à 5",
    "status": "todo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Si la tâche n'existe pas (404) :**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Tâche avec l'ID 550e8400-e29b-41d4-a716-446655440000 non trouvée",
    "traceId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

### Mettre à jour complètement une tâche (PUT)
```bash
curl -X PUT http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tâche mise à jour",
    "description": "Nouvelle description",
    "status": "done"
  }'
```

**Réponse attendue (200) :**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Tâche mise à jour",
    "description": "Nouvelle description",
    "status": "done",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:45:00.000Z"
  }
}
```

---

### Mettre à jour partiellement une tâche (PATCH)
```bash
curl -X PATCH http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "doing"
  }'
```

**Réponse attendue (200) :**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Réviser le cours OpenAPI",
    "description": "Relire les chapitres 1 à 5",
    "status": "doing",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:45:00.000Z"
  }
}
```

---

### Supprimer une tâche (DELETE)
```bash
curl -X DELETE http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000
```

**Réponse attendue (204) :** Pas de contenu (body vide)

**Si la tâche n'existe pas (404) :**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Tâche avec l'ID 550e8400-e29b-41d4-a716-446655440000 non trouvée",
    "traceId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

## 🔍 Exemples d'erreurs

### Erreur de validation (400)
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AB"
  }'
```

**Réponse (400) :**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Erreur de validation",
    "details": [
      {
        "path": "title",
        "message": "Le titre doit contenir au moins 3 caractères"
      }
    ],
    "traceId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

### ID invalide (400)
```bash
curl -X GET http://localhost:3000/tasks/invalid-id
```

**Réponse (400) :**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Erreur de validation",
    "details": [
      {
        "path": "id",
        "message": "ID doit être un UUID valide"
      }
    ],
    "traceId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

## 🏗️ Structure du projet

```
tp-openapi-swagger/
├── src/
│   ├── server.ts              # Point d'entrée Express
│   ├── routes/
│   │   └── tasks.ts           # Routes de l'API Tasks
│   ├── middlewares/
│   │   ├── errorHandler.ts    # Gestion centralisée des erreurs
│   │   ├── validate.ts        # Validation Zod
│   │   └── rateLimit.ts       # Rate limiting
│   ├── services/
│   │   └── taskService.ts     # Logique métier (stockage en mémoire)
│   ├── types/
│   │   └── task.ts            # Types TypeScript
│   ├── openapi/
│   │   └── openapi.yaml       # Spécification OpenAPI 3
│   └── docs/
│       └── swagger.ts         # Configuration Swagger UI
├── dist/                      # Code compilé (généré)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Technologies utilisées

- **Node.js** : Runtime JavaScript
- **TypeScript** : Langage de programmation typé
- **Express.js** : Framework web
- **Zod** : Validation de schémas
- **Swagger UI** : Documentation interactive
- **OpenAPI 3** : Spécification d'API
- **express-rate-limit** : Protection contre les abus

---

## 📝 Notes importantes

- **Stockage** : Les données sont stockées en mémoire (array). Les données sont perdues au redémarrage du serveur.
- **UUID** : Les IDs sont générés automatiquement avec UUID v4.
- **Dates** : Toutes les dates sont au format ISO 8601.
- **Rate limiting** : 100 requêtes par 15 minutes par IP (sauf `/health` et `/docs`).
- **Validation** : Tous les inputs sont validés avec Zod avant traitement.

---

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifier que Node.js 18+ est installé : `node --version`
- Vérifier que les dépendances sont installées : `npm install`
- Vérifier les erreurs dans la console

### Swagger UI ne s'affiche pas
- Vérifier que le serveur est démarré
- Accéder à `http://localhost:3000/docs`
- Vérifier la console du navigateur pour les erreurs

### Erreurs CORS
- Le middleware `cors()` est activé par défaut
- Si problème persiste, vérifier la configuration dans `server.ts`

---

## 📚 Ressources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Zod Documentation](https://zod.dev/)
- [Express.js Documentation](https://expressjs.com/)

---

## 📄 Licence

MIT






---


### 📄 🎯 Actions concrètes pour les étudiants - TP OpenAPI/Swagger

*Source: `tp-openapi-swagger/ACTIONS_ETUDIANTS.md`*


---

# 🎯 Actions concrètes pour les étudiants - TP OpenAPI/Swagger

Ce document liste **concrètement** ce que vous devez faire pour réaliser ce TP.

---

## 📋 Vue d'ensemble

**Objectif final :** Créer une API REST complète pour gérer des tâches, avec documentation OpenAPI 3 et interface Swagger UI.

**Ce que vous allez créer :**
- Un fichier OpenAPI 3 (spécification de l'API)
- Un serveur Express avec TypeScript
- 7 endpoints REST (GET /health, CRUD sur /tasks)
- Une interface Swagger UI pour tester l'API
- Validation des données avec Zod
- Gestion d'erreurs standardisée

**Durée :** 2h30 à 3h30

---

## ✅ Checklist des actions à réaliser

### 🚀 ÉTAPE 1 : Initialiser le projet (15 min)

**Actions concrètes :**

1. **Créer un nouveau dossier pour votre projet**
   ```bash
   mkdir tp-openapi-swagger
   cd tp-openapi-swagger
   ```

2. **Initialiser un projet Node.js**
   ```bash
   npm init -y
   ```

3. **Installer toutes les dépendances nécessaires**
   ```bash
   npm install express swagger-ui-express swagger-jsdoc zod express-rate-limit cors uuid js-yaml
   
   npm install -D @types/express @types/swagger-ui-express @types/swagger-jsdoc @types/cors @types/uuid @types/js-yaml @types/node @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint tsx typescript
   ```

4. **Créer le fichier `tsconfig.json`**
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "commonjs",
       "lib": ["ES2022"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "moduleResolution": "node"
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

5. **Créer la structure de dossiers**
   ```bash
   mkdir -p src/routes src/middlewares src/services src/types src/openapi src/docs
   ```

6. **Ajouter les scripts dans `package.json`**
   ```json
   {
     "scripts": {
       "dev": "tsx watch src/server.ts",
       "build": "tsc",
       "start": "node dist/server.js"
     }
   }
   ```

**✅ Vérification :** Exécutez `npm run dev` → Le serveur doit démarrer (même s'il n'y a pas encore de routes).

---

### 📝 ÉTAPE 2 : Créer la spécification OpenAPI 3 (45 min)

**Actions concrètes :**

1. **Créer le fichier `src/openapi/openapi.yaml`**

2. **Écrire la section `info`** :
   ```yaml
   openapi: 3.0.3
   info:
     title: API Tasks - Gestion de tâches
     description: API REST simple pour la gestion de tâches
     version: 1.0.0
   ```

3. **Écrire la section `servers`** :
   ```yaml
   servers:
     - url: http://localhost:3000
       description: Serveur de développement local
   ```

4. **Écrire la section `tags`** :
   ```yaml
   tags:
     - name: Health
       description: Endpoints de santé
     - name: Tasks
       description: Gestion des tâches
   ```

5. **Écrire la section `paths`** pour chaque endpoint :
   - `GET /health`
   - `GET /tasks`
   - `GET /tasks/{id}`
   - `POST /tasks`
   - `PUT /tasks/{id}`
   - `PATCH /tasks/{id}`
   - `DELETE /tasks/{id}`
   
   Pour chaque endpoint, définir :
   - `summary` et `description`
   - `operationId`
   - `parameters` (si applicable)
   - `requestBody` (pour POST, PUT, PATCH)
   - `responses` (200, 201, 204, 400, 404, 500)

6. **Écrire la section `components`** :
   - `schemas` : Task, TaskCreate, TaskUpdate, ErrorEnvelope, etc.
   - `parameters` : TaskId, Limit, Offset, StatusFilter
   - `responses` : BadRequest, NotFound, InternalServerError
   - `securitySchemes` : bearerAuth (JWT)

**✅ Vérification :** 
- Valider votre YAML sur [Swagger Editor](https://editor.swagger.io/)
- Aucune erreur de syntaxe

**💡 Astuce :** Commencez par un endpoint simple (GET /health), puis copiez-collez la structure pour les autres.

---

### 🔧 ÉTAPE 3 : Configurer Swagger UI (20 min)

**Actions concrètes :**

1. **Créer le fichier `src/docs/swagger.ts`**

2. **Écrire le code pour charger le fichier OpenAPI** :
   ```typescript
   import swaggerUi from 'swagger-ui-express';
   import { Express } from 'express';
   import fs from 'fs';
   import path from 'path';
   import * as yaml from 'js-yaml';

   export function setupSwagger(app: Express): void {
     const openApiPath = path.join(__dirname, '../openapi/openapi.yaml');
     const openApiFile = fs.readFileSync(openApiPath, 'utf8');
     const openApiSpec = yaml.load(openApiFile) as Record<string, unknown>;

     // Servir le YAML brut
     app.get('/openapi', (req, res) => {
       res.setHeader('Content-Type', 'application/yaml');
       res.send(openApiFile);
     });

     // Servir le JSON
     app.get('/openapi.json', (req, res) => {
       res.json(openApiSpec);
     });

     // Configurer Swagger UI
     app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
   }
   ```

3. **Créer un fichier `src/server.ts` minimal** :
   ```typescript
   import express from 'express';
   import { setupSwagger } from './docs/swagger';

   const app = express();
   setupSwagger(app);

   app.listen(3000, () => {
     console.log('Serveur démarré sur http://localhost:3000');
   });
   ```

**✅ Vérification :**
- Exécutez `npm run dev`
- Ouvrez `http://localhost:3000/docs` → Swagger UI doit s'afficher
- Ouvrez `http://localhost:3000/openapi` → Le YAML doit s'afficher

---

### 🏗️ ÉTAPE 4 : Créer les types et le service (30 min)

**Actions concrètes :**

1. **Créer `src/types/task.ts`** :
   ```typescript
   export type TaskStatus = 'todo' | 'doing' | 'done';

   export interface Task {
     id: string;
     title: string;
     description?: string;
     status: TaskStatus;
     createdAt: string;
     updatedAt: string;
   }

   export interface TaskCreate {
     title: string;
     description?: string;
     status?: TaskStatus;
   }

   export interface TaskUpdate {
     title?: string;
     description?: string;
     status?: TaskStatus;
   }
   ```

2. **Créer `src/services/taskService.ts`** :
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   import { Task, TaskCreate, TaskUpdate } from '../types/task';

   class TaskService {
     private tasks: Task[] = [];

     findAll(limit = 10, offset = 0, status?: string) {
       // Implémenter la logique de pagination et filtrage
     }

     findById(id: string): Task | undefined {
       // Retourner la tâche ou undefined
     }

     create(data: TaskCreate): Task {
       // Créer une nouvelle tâche avec UUID et dates
     }

     update(id: string, data: TaskUpdate): Task | null {
       // Mettre à jour complètement
     }

     patch(id: string, data: Partial<TaskUpdate>): Task | null {
       // Mettre à jour partiellement
     }

     delete(id: string): boolean {
       // Supprimer la tâche
     }
   }

   export const taskService = new TaskService();
   ```

**✅ Vérification :**
- Le code compile sans erreur (`npm run build`)
- Les types correspondent aux schémas OpenAPI

---

### 🛡️ ÉTAPE 5 : Créer les middlewares (30 min)

**Actions concrètes :**

1. **Créer `src/middlewares/errorHandler.ts`** :
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import { v4 as uuidv4 } from 'uuid';

   export interface ApiError {
     code: string;
     message: string;
     details?: unknown;
     traceId?: string;
   }

   export function errorHandler(
     err: Error | ApiError,
     req: Request,
     res: Response,
     next: NextFunction
   ): void {
     const traceId = uuidv4();
     // Implémenter la gestion d'erreurs
   }

   export function notFoundHandler(req: Request, res: Response): void {
     // Retourner 404 avec format standardisé
   }
   ```

2. **Créer `src/middlewares/validate.ts`** :
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import { ZodSchema, ZodError } from 'zod';

   export function validate(schema: {
     body?: ZodSchema;
     query?: ZodSchema;
     params?: ZodSchema;
   }) {
     return (req: Request, res: Response, next: NextFunction): void {
       // Valider body, query, params avec Zod
       // Retourner erreur formatée si échec
     }
   }
   ```

3. **Créer `src/middlewares/rateLimit.ts`** :
   ```typescript
   import rateLimit from 'express-rate-limit';

   export const apiRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // 100 requêtes max
     // Message d'erreur formaté
   });
   ```

**✅ Vérification :**
- Les erreurs suivent le format `{ error: { code, message, details?, traceId? } }`
- Les validations bloquent les données invalides

---

### 🛣️ ÉTAPE 6 : Implémenter les routes (45 min)

**Actions concrètes :**

1. **Créer `src/routes/tasks.ts`**

2. **Implémenter chaque endpoint un par un :**

   **GET /health** :
   ```typescript
   router.get('/health', (req, res) => {
     res.json({
       status: 'ok',
       timestamp: new Date().toISOString(),
       uptime: process.uptime()
     });
   });
   ```

   **GET /tasks** :
   ```typescript
   router.get('/tasks', validate({ query: taskQuerySchema }), (req, res) => {
     const { limit, offset, status } = req.query;
     const result = taskService.findAll(limit, offset, status);
     res.json({ data: result.tasks, pagination: { ... } });
   });
   ```

   **GET /tasks/:id** :
   ```typescript
   router.get('/tasks/:id', validate({ params: taskParamsSchema }), (req, res) => {
     const task = taskService.findById(req.params.id);
     if (!task) {
       return res.status(404).json({ error: { ... } });
     }
     res.json({ data: task });
   });
   ```

   **POST /tasks** :
   ```typescript
   router.post('/tasks', validate({ body: taskCreateSchema }), (req, res) => {
     const task = taskService.create(req.body);
     res.status(201).json({ data: task });
   });
   ```

   **PUT /tasks/:id** :
   ```typescript
   router.put('/tasks/:id', validate({ ... }), (req, res) => {
     // Vérifier existence, mettre à jour complètement
   });
   ```

   **PATCH /tasks/:id** :
   ```typescript
   router.patch('/tasks/:id', validate({ ... }), (req, res) => {
     // Mettre à jour partiellement
   });
   ```

   **DELETE /tasks/:id** :
   ```typescript
   router.delete('/tasks/:id', validate({ params: taskParamsSchema }), (req, res) => {
     const deleted = taskService.delete(req.params.id);
     if (!deleted) {
       return res.status(404).json({ error: { ... } });
     }
     res.status(204).send();
   });
   ```

3. **Créer les schémas Zod de validation** :
   ```typescript
   const taskCreateSchema = z.object({
     title: z.string().min(3),
     description: z.string().optional(),
     status: z.enum(['todo', 'doing', 'done']).optional()
   });
   ```

**✅ Vérification :**
- Tester chaque endpoint dans Swagger UI (`http://localhost:3000/docs`)
- Vérifier les codes HTTP (201 pour POST, 204 pour DELETE, etc.)
- Tester avec des données invalides → doit retourner 400

---

### ⚙️ ÉTAPE 7 : Configurer le serveur Express (15 min)

**Actions concrètes :**

1. **Compléter `src/server.ts`** :
   ```typescript
   import express from 'express';
   import cors from 'cors';
   import tasksRouter from './routes/tasks';
   import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
   import { apiRateLimiter } from './middlewares/rateLimit';
   import { setupSwagger } from './docs/swagger';

   const app = express();

   // Middlewares globaux
   app.use(cors());
   app.use(express.json());

   // Rate limiting (sauf /health et /docs)
   app.use((req, res, next) => {
     if (req.path === '/health' || req.path.startsWith('/docs')) {
       return next();
     }
     return apiRateLimiter(req, res, next);
   });

   // Swagger UI
   setupSwagger(app);

   // Routes
   app.use('/', tasksRouter);

   // Gestion des erreurs (en dernier)
   app.use(notFoundHandler);
   app.use(errorHandler);

   app.listen(3000, () => {
     console.log('🚀 Serveur démarré sur http://localhost:3000');
     console.log('📚 Swagger UI : http://localhost:3000/docs');
   });
   ```

**✅ Vérification :**
- Le serveur démarre sans erreur
- Tous les endpoints sont accessibles
- Swagger UI fonctionne

---

### 🧪 ÉTAPE 8 : Tester et valider (20 min)

**Actions concrètes :**

1. **Tester dans Swagger UI** :
   - Ouvrir `http://localhost:3000/docs`
   - Pour chaque endpoint :
     - Cliquer sur "Try it out"
     - Remplir les paramètres
     - Cliquer sur "Execute"
     - Vérifier la réponse et le code HTTP

2. **Tester avec curl** :
   ```bash
   # Health check
   curl http://localhost:3000/health

   # Créer une tâche
   curl -X POST http://localhost:3000/tasks \
     -H "Content-Type: application/json" \
     -d '{"title": "Test", "status": "todo"}'

   # Lister les tâches
   curl http://localhost:3000/tasks

   # Récupérer une tâche (remplacer l'ID)
   curl http://localhost:3000/tasks/VOTRE_ID_ICI
   ```

3. **Tester les cas d'erreur** :
   - Titre trop court (< 3 caractères) → doit retourner 400
   - ID invalide (pas un UUID) → doit retourner 400
   - ID inexistant → doit retourner 404
   - Données manquantes → doit retourner 400

4. **Vérifier la conformité** :
   - Les réponses correspondent aux schémas OpenAPI
   - Les codes HTTP sont corrects
   - Le format d'erreur est standardisé
   - La pagination fonctionne
   - Le filtrage par status fonctionne

**✅ Vérification finale :**
- ✅ Swagger UI accessible et fonctionnel
- ✅ Tous les endpoints implémentés et testés
- ✅ Validations en place
- ✅ Gestion d'erreurs standardisée
- ✅ Code propre et structuré

---

## 📦 Livrables attendus

À la fin du TP, vous devez avoir :

1. **Un projet fonctionnel** avec :
   - Fichier OpenAPI 3 complet (`src/openapi/openapi.yaml`)
   - Serveur Express avec tous les endpoints
   - Swagger UI accessible sur `/docs`

2. **Code source** :
   - Types TypeScript
   - Service de gestion des tâches
   - Middlewares (validation, erreurs, rate limiting)
   - Routes complètes

3. **Tests** :
   - Tous les endpoints testés dans Swagger UI
   - Au moins 3 appels curl testés

---

## 🎯 Critères de réussite

### Obligatoires (80% de la note)

- [ ] Le fichier OpenAPI 3 est complet et valide
- [ ] Swagger UI est accessible sur `/docs` et fonctionne
- [ ] Tous les 7 endpoints sont implémentés et fonctionnels
- [ ] Les validations Zod sont en place pour tous les inputs
- [ ] La gestion d'erreurs est standardisée (format `ErrorEnvelope`)
- [ ] Les codes HTTP sont corrects (201 pour POST, 204 pour DELETE, etc.)
- [ ] La pagination et le filtrage fonctionnent sur `GET /tasks`
- [ ] Le code est structuré et propre (pas de code dupliqué)

### Bonus (20% de la note)

- [ ] Rate limiting implémenté et fonctionnel
- [ ] Tests unitaires pour le service
- [ ] Documentation supplémentaire dans les commentaires
- [ ] Gestion des cas limites

---

## 🐛 En cas de problème

### Le serveur ne démarre pas
- Vérifiez que Node.js 18+ est installé : `node --version`
- Vérifiez que toutes les dépendances sont installées : `npm install`
- Vérifiez les erreurs dans la console

### Swagger UI ne s'affiche pas
- Vérifiez que le chemin vers `openapi.yaml` est correct
- Vérifiez que le fichier YAML est valide (utilisez Swagger Editor)
- Vérifiez la console du navigateur pour les erreurs

### Les endpoints ne fonctionnent pas
- Vérifiez que les routes sont bien enregistrées dans `server.ts`
- Vérifiez l'ordre des middlewares (validation avant logique métier)
- Vérifiez les logs du serveur pour les erreurs

---

**Bon courage ! 🚀**






---


### 📄 Arborescence du projet TP OpenAPI 3 + Swagger UI

*Source: `tp-openapi-swagger/ARBORESCENCE.md`*


---

# Arborescence du projet TP OpenAPI 3 + Swagger UI

```
tp-openapi-swagger/
├── .eslintrc.json              # Configuration ESLint
├── .gitignore                  # Fichiers à ignorer par Git
├── package.json                # Dépendances et scripts npm
├── tsconfig.json               # Configuration TypeScript
├── README.md                   # Instructions d'installation et exemples
├── TP_ENONCE.md                # Énoncé apprenant (instructions du TP)
├── TP_CORRIGE.md               # Corrigé formateur (avec grille de correction)
├── CHECKLIST.md                # Checklist de conformité OpenAPI/Swagger
├── ARBORESCENCE.md             # Ce fichier
└── src/                        # Code source TypeScript
    ├── server.ts               # Point d'entrée Express
    ├── routes/
    │   └── tasks.ts            # Routes de l'API Tasks (7 endpoints)
    ├── middlewares/
    │   ├── errorHandler.ts     # Gestion centralisée des erreurs
    │   ├── validate.ts         # Middleware de validation Zod
    │   └── rateLimit.ts        # Rate limiting (100 req/15min)
    ├── services/
    │   └── taskService.ts      # Logique métier (stockage en mémoire)
    ├── types/
    │   └── task.ts             # Types TypeScript (Task, TaskCreate, etc.)
    ├── openapi/
    │   └── openapi.yaml        # Spécification OpenAPI 3 complète
    └── docs/
        └── swagger.ts          # Configuration Swagger UI
```

## Description des fichiers

### Configuration
- **`.eslintrc.json`** : Règles ESLint pour le linting du code TypeScript
- **`.gitignore`** : Exclut `node_modules/`, `dist/`, fichiers de log, etc.
- **`package.json`** : Dépendances (Express, Zod, Swagger UI, etc.) et scripts npm
- **`tsconfig.json`** : Configuration TypeScript stricte (ES2022, strict mode)

### Documentation
- **`README.md`** : Guide d'installation, exemples curl, structure du projet
- **`TP_ENONCE.md`** : Énoncé complet du TP pour les apprenants
- **`TP_CORRIGE.md`** : Corrigé détaillé avec explications et grille de correction
- **`CHECKLIST.md`** : Checklist de conformité OpenAPI/Swagger

### Code source (`src/`)

#### Point d'entrée
- **`server.ts`** : Configuration Express, middlewares globaux, démarrage du serveur

#### Routes
- **`routes/tasks.ts`** : 7 endpoints REST (GET /health, CRUD tasks)

#### Middlewares
- **`middlewares/errorHandler.ts`** : Format d'erreur standardisé, gestion centralisée
- **`middlewares/validate.ts`** : Validation Zod pour body, query, params
- **`middlewares/rateLimit.ts`** : Protection contre les abus (100 req/15min)

#### Services
- **`services/taskService.ts`** : Logique métier (CRUD, pagination, filtrage) - stockage en mémoire

#### Types
- **`types/task.ts`** : Interfaces TypeScript (Task, TaskCreate, TaskUpdate, TaskStatus)

#### OpenAPI
- **`openapi/openapi.yaml`** : Spécification OpenAPI 3 complète (info, servers, paths, components)

#### Documentation
- **`docs/swagger.ts`** : Configuration Swagger UI, chargement du fichier OpenAPI

## Fichiers générés (non versionnés)

- **`dist/`** : Code JavaScript compilé (généré par `npm run build`)
- **`node_modules/`** : Dépendances npm (générées par `npm install`)

## Commandes principales

```bash
# Installation
npm install

# Développement (avec rechargement automatique)
npm run dev

# Compilation
npm run build

# Production
npm run start

# Linting
npm run lint
npm run lint:fix

# Vérification des types
npm run type-check
```






---


### 📄 Checklist de conformité OpenAPI 3 / Swagger

*Source: `tp-openapi-swagger/CHECKLIST.md`*


---

# Checklist de conformité OpenAPI 3 / Swagger

Cette checklist permet de vérifier que votre API est conforme aux bonnes pratiques OpenAPI 3 et que Swagger UI fonctionne correctement.

---

## ✅ Structure du fichier OpenAPI

### Section `info`
- [ ] `title` : Présent et descriptif
- [ ] `description` : Présent avec description détaillée de l'API
- [ ] `version` : Présent (format semver recommandé, ex: "1.0.0")
- [ ] `contact` : Présent (optionnel mais recommandé)

### Section `servers`
- [ ] Au moins un serveur défini
- [ ] Serveur local : `http://localhost:3000` (ou port approprié)
- [ ] Description pour chaque serveur

### Section `tags`
- [ ] Tags définis pour organiser les endpoints
- [ ] Description pour chaque tag

---

## ✅ Définition des endpoints (`paths`)

### Pour chaque endpoint

#### Métadonnées
- [ ] `summary` : Présent et concis
- [ ] `description` : Présent avec détails
- [ ] `operationId` : Présent et unique
- [ ] `tags` : Présent (au moins un tag)

#### Paramètres (`parameters`)
- [ ] Paramètres de route (`in: path`) : `required: true`
- [ ] Paramètres de query (`in: query`) : `required: false` si optionnel
- [ ] Schémas de validation pour chaque paramètre
- [ ] Exemples pour les paramètres complexes

#### Body de requête (`requestBody`)
- [ ] Présent pour POST, PUT, PATCH
- [ ] `required: true` si obligatoire
- [ ] Content-Type : `application/json`
- [ ] Référence à un schéma (`$ref`) ou schéma inline
- [ ] Exemples de requêtes

#### Réponses (`responses`)
- [ ] Code 200 : Succès (GET, PUT, PATCH)
- [ ] Code 201 : Créé (POST)
- [ ] Code 204 : No Content (DELETE)
- [ ] Code 400 : Bad Request (validation)
- [ ] Code 404 : Not Found (ressource absente)
- [ ] Code 500 : Internal Server Error
- [ ] Schémas de réponse pour chaque code
- [ ] Exemples de réponses

---

## ✅ Composants réutilisables (`components`)

### Schémas (`schemas`)
- [ ] `Task` : Schéma complet de la ressource
- [ ] `TaskCreate` : Schéma pour la création (champs requis)
- [ ] `TaskUpdate` : Schéma pour la mise à jour (champs optionnels)
- [ ] `ErrorEnvelope` : Format d'erreur standardisé
- [ ] `HealthResponse` : Réponse du health check
- [ ] `TasksListResponse` : Réponse de la liste avec pagination
- [ ] `TaskResponse` : Enveloppe pour une seule tâche

**Pour chaque schéma :**
- [ ] `type` : Défini (object, string, etc.)
- [ ] `required` : Liste des champs obligatoires
- [ ] `properties` : Toutes les propriétés définies
- [ ] `description` : Pour chaque propriété
- [ ] `example` : Au moins un exemple par schéma
- [ ] Validation : `minLength`, `maxLength`, `enum`, `format` (uuid, date-time)

### Paramètres (`parameters`)
- [ ] `TaskId` : Paramètre `id` réutilisable
- [ ] `Limit` : Paramètre de pagination `limit`
- [ ] `Offset` : Paramètre de pagination `offset`
- [ ] `StatusFilter` : Paramètre de filtre `status`

**Pour chaque paramètre :**
- [ ] `name` : Nom du paramètre
- [ ] `in` : Emplacement (path, query)
- [ ] `required` : Booléen correct
- [ ] `schema` : Schéma de validation
- [ ] `description` : Description claire
- [ ] `example` : Exemple de valeur

### Réponses (`responses`)
- [ ] `BadRequest` : Réponse 400 réutilisable
- [ ] `Unauthorized` : Réponse 401 (si auth implémentée)
- [ ] `NotFound` : Réponse 404 réutilisable
- [ ] `InternalServerError` : Réponse 500 réutilisable

**Pour chaque réponse :**
- [ ] `description` : Description de l'erreur
- [ ] `content` : Format JSON avec schéma `ErrorEnvelope`
- [ ] `example` : Exemple d'erreur

### Security Schemes (`securitySchemes`)
- [ ] `bearerAuth` : Défini (même si non implémenté)
- [ ] `type: http`
- [ ] `scheme: bearer`
- [ ] `bearerFormat: JWT`
- [ ] `description` : Instructions d'utilisation

---

## ✅ Réutilisation et DRY

- [ ] Utilisation de `$ref` pour les schémas au lieu de duplication
- [ ] Utilisation de `$ref` pour les paramètres réutilisables
- [ ] Utilisation de `$ref` pour les réponses réutilisables
- [ ] Pas de duplication de code dans les schémas

---

## ✅ Validation et contraintes

### Schémas
- [ ] `minLength` / `maxLength` pour les strings
- [ ] `minimum` / `maximum` pour les nombres
- [ ] `enum` pour les valeurs limitées (status: todo, doing, done)
- [ ] `format` : `uuid` pour les IDs, `date-time` pour les dates
- [ ] `required` : Liste correcte des champs obligatoires

### Paramètres
- [ ] Validation des UUID dans les paramètres de route
- [ ] Validation des nombres (limit, offset) avec min/max
- [ ] Validation des enums (status)

---

## ✅ Swagger UI

### Configuration
- [ ] Swagger UI accessible sur `/docs`
- [ ] Fichier OpenAPI accessible sur `/openapi` (YAML)
- [ ] Fichier OpenAPI accessible sur `/openapi.json` (JSON)
- [ ] Interface Swagger UI fonctionnelle
- [ ] Bouton "Try it out" fonctionne pour tous les endpoints

### Affichage
- [ ] Tous les endpoints visibles et organisés par tags
- [ ] Schémas affichés correctement
- [ ] Exemples visibles dans l'interface
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Les requêtes peuvent être exécutées depuis l'interface

---

## ✅ Implémentation (conformité code ↔ spec)

### Correspondance schémas
- [ ] Types TypeScript correspondent aux schémas OpenAPI
- [ ] Validation Zod correspond aux contraintes OpenAPI
- [ ] Réponses de l'API correspondent aux schémas de réponse

### Codes HTTP
- [ ] GET retourne 200 (ou 404 si non trouvé)
- [ ] POST retourne 201 (ou 400 si erreur)
- [ ] PUT retourne 200 (ou 404 si non trouvé)
- [ ] PATCH retourne 200 (ou 404 si non trouvé)
- [ ] DELETE retourne 204 (ou 404 si non trouvé)
- [ ] Erreurs de validation retournent 400
- [ ] Ressource non trouvée retourne 404
- [ ] Erreurs serveur retournent 500

### Format d'erreur
- [ ] Toutes les erreurs suivent le format `ErrorEnvelope`
- [ ] Code d'erreur standardisé (`VALIDATION_ERROR`, `NOT_FOUND`, etc.)
- [ ] Message d'erreur clair et lisible
- [ ] Détails présents pour les erreurs de validation
- [ ] `traceId` présent pour le debugging

### Validation
- [ ] Tous les inputs validés (body, query, params)
- [ ] Messages d'erreur de validation clairs
- [ ] Erreurs retournées au format standardisé

---

## ✅ Bonnes pratiques

### Documentation
- [ ] Descriptions claires et complètes
- [ ] Exemples pour chaque endpoint
- [ ] Exemples pour chaque schéma
- [ ] Instructions d'utilisation (si nécessaire)

### Sécurité
- [ ] Security schemes documentés (même si non implémentés)
- [ ] Endpoints marqués avec `security` si nécessaire
- [ ] `/health` et `/docs` sans authentification

### Performance
- [ ] Pagination implémentée et documentée
- [ ] Filtres documentés et fonctionnels
- [ ] Rate limiting documenté (si implémenté)

---

## ✅ Tests

### Tests manuels dans Swagger UI
- [ ] GET /health : Fonctionne
- [ ] GET /tasks : Retourne la liste
- [ ] GET /tasks avec pagination : Fonctionne
- [ ] GET /tasks avec filtre status : Fonctionne
- [ ] GET /tasks/:id : Retourne la tâche
- [ ] GET /tasks/:id avec ID invalide : Retourne 400
- [ ] GET /tasks/:id avec ID inexistant : Retourne 404
- [ ] POST /tasks : Crée une tâche (201)
- [ ] POST /tasks avec données invalides : Retourne 400
- [ ] PUT /tasks/:id : Met à jour complètement (200)
- [ ] PUT /tasks/:id avec ID inexistant : Retourne 404
- [ ] PATCH /tasks/:id : Met à jour partiellement (200)
- [ ] PATCH /tasks/:id avec ID inexistant : Retourne 404
- [ ] DELETE /tasks/:id : Supprime (204)
- [ ] DELETE /tasks/:id avec ID inexistant : Retourne 404

### Tests avec curl
- [ ] Tous les endpoints testables avec curl
- [ ] Réponses correspondent aux schémas
- [ ] Codes HTTP corrects

---

## ✅ Qualité du code

### Structure
- [ ] Code organisé en modules (routes, services, middlewares)
- [ ] Pas de code dupliqué
- [ ] Séparation des responsabilités

### TypeScript
- [ ] Types stricts (pas de `any`)
- [ ] Interfaces correspondant aux schémas OpenAPI
- [ ] Compilation sans erreur

### Gestion d'erreurs
- [ ] Middleware d'erreur centralisé
- [ ] Format d'erreur standardisé
- [ ] Logging des erreurs (console ou fichier)

---

## 📊 Score de conformité

**Total de points : 100**

- **Structure OpenAPI** : 20 points
- **Définition des endpoints** : 25 points
- **Composants réutilisables** : 15 points
- **Validation et contraintes** : 10 points
- **Swagger UI** : 10 points
- **Implémentation** : 15 points
- **Bonnes pratiques** : 5 points

**Score minimum requis : 80/100**

---

## 🔍 Outils de validation

### Validation du fichier OpenAPI
- [ ] Valider avec [Swagger Editor](https://editor.swagger.io/)
- [ ] Pas d'erreurs de syntaxe YAML
- [ ] Pas d'erreurs de structure OpenAPI

### Validation de l'implémentation
- [ ] Tester tous les endpoints dans Swagger UI
- [ ] Vérifier que les réponses correspondent aux schémas
- [ ] Vérifier les codes HTTP

---

## 📝 Notes

- Cette checklist est exhaustive. Tous les points ne sont pas obligatoires pour un TP, mais ils représentent les bonnes pratiques.
- Les points marqués comme "optionnel" peuvent être ignorés si non pertinents pour votre cas d'usage.
- En cas de doute, privilégier la clarté et la conformité à la spécification OpenAPI.

---

**Date de vérification :** _______________  
**Vérifié par :** _______________  
**Score :** _______ / 100






---


### 📄 Guide : Générer un PDF complet du TP

*Source: `tp-openapi-swagger/GENERER_PDF.md`*


---

# Guide : Générer un PDF complet du TP

Ce guide explique plusieurs méthodes pour générer un PDF à partir des documents du TP.

## 📋 Méthode 1 : Script automatique (recommandé)

### Prérequis

```bash
npm install puppeteer --save-dev
```

### Génération

```bash
npm run generate-pdf
```

Le PDF sera généré dans `TP-OpenAPI-Swagger-COMPLET.pdf`

---

## 📋 Méthode 2 : Utiliser un outil en ligne (simple)

### Option A : Markdown to PDF (markdowntopdf.com)

1. Allez sur [markdowntopdf.com](https://www.markdowntopdf.com/)
2. Copiez le contenu de `TP_ENONCE.md`
3. Collez dans l'éditeur
4. Cliquez sur "Download PDF"
5. Répétez pour `ACTIONS_ETUDIANTS.md` et `CHECKLIST.md`
6. Fusionnez les PDFs avec un outil en ligne

### Option B : Dillinger.io

1. Allez sur [dillinger.io](https://dillinger.io/)
2. Importez ou collez le contenu markdown
3. Cliquez sur "Export as" → "PDF"
4. Répétez pour chaque fichier

---

## 📋 Méthode 3 : Utiliser Pandoc (professionnel)

### Installation

**macOS :**
```bash
brew install pandoc
brew install basictex
```

**Linux :**
```bash
sudo apt-get install pandoc texlive-latex-base
```

**Windows :**
Téléchargez depuis [pandoc.org](https://pandoc.org/installing.html)

### Génération

```bash
# Générer un PDF depuis l'énoncé
pandoc TP_ENONCE.md -o TP-ENONCE.pdf --pdf-engine=xelatex -V geometry:margin=2cm

# Générer un PDF depuis les actions
pandoc ACTIONS_ETUDIANTS.md -o ACTIONS.pdf --pdf-engine=xelatex -V geometry:margin=2cm

# Fusionner tous les documents
pandoc TP_ENONCE.md ACTIONS_ETUDIANTS.md CHECKLIST.md README.md -o TP-COMPLET.pdf --pdf-engine=xelatex -V geometry:margin=2cm --toc
```

---

## 📋 Méthode 4 : Utiliser VS Code (simple)

### Extension Markdown PDF

1. Installez l'extension "Markdown PDF" dans VS Code
2. Ouvrez `TP_ENONCE.md`
3. Clic droit → "Markdown PDF: Export (pdf)"
4. Répétez pour les autres fichiers

---

## 📋 Méthode 5 : Utiliser un service cloud

### Option A : GitHub Actions

Créez un workflow GitHub Actions qui génère automatiquement le PDF à chaque commit.

### Option B : GitLab CI/CD

Utilisez un pipeline GitLab pour générer le PDF.

---

## 📋 Méthode 6 : Conversion manuelle

1. Ouvrez les fichiers markdown dans un éditeur qui supporte l'export PDF
2. Utilisez "Imprimer" → "Enregistrer en PDF"
3. Fusionnez les PDFs avec un outil comme :
   - [PDF24](https://tools.pdf24.org/fr/fusionner-pdf)
   - [ILovePDF](https://www.ilovepdf.com/fr/fusionner-pdf)
   - Adobe Acrobat

---

## 🎯 Recommandation

Pour un résultat professionnel et automatisé, utilisez **Pandoc** (Méthode 3).

Pour une solution rapide sans installation, utilisez **Dillinger.io** (Méthode 2, Option B).

---

## 📄 Contenu à inclure dans le PDF

Le PDF complet devrait contenir :

1. **Page de garde**
   - Titre du TP
   - Niveau et durée
   - Date

2. **Table des matières**

3. **Énoncé du TP** (`TP_ENONCE.md`)
   - Contexte
   - Objectifs
   - Prérequis
   - Périmètre fonctionnel
   - Étapes détaillées
   - Exemples curl

4. **Actions concrètes** (`ACTIONS_ETUDIANTS.md`)
   - Checklist
   - Instructions étape par étape
   - Code complet

5. **Checklist de conformité** (`CHECKLIST.md`)
   - Vérifications OpenAPI
   - Vérifications Swagger UI
   - Score de conformité

6. **Documentation** (`README.md`)
   - Exemples d'appels
   - Structure du projet
   - Dépannage

---

## ✅ Vérification du PDF généré

Avant de partager le PDF, vérifiez :

- [ ] Toutes les pages sont présentes
- [ ] Le code est bien formaté et lisible
- [ ] Les tableaux sont correctement alignés
- [ ] Les liens sont cliquables (si possible)
- [ ] La table des matières fonctionne
- [ ] Les numéros de page sont présents
- [ ] Le style est cohérent

---

**Le PDF est prêt à être partagé ! 📄**






---


### 📄 Guide : Injecter le pas à pas détaillé dans le LMS

*Source: `tp-openapi-swagger/GUIDE_INJECTION_LMS.md`*


---

# Guide : Injecter le pas à pas détaillé dans le LMS

Ce guide explique comment injecter le document **PAS_A_PAS_DETAILLE_LMS.json** dans votre LMS.

## 📋 Fichier fourni

**`PAS_A_PAS_DETAILLE_LMS.json`** : Document complet au format TipTap JSON contenant le pas à pas détaillé du TP, prêt à être injecté dans le LMS.

## 🚀 Méthode 1 : Via l'interface admin (recommandé)

### Option A : Ajouter comme ressource dans un module existant

1. **Accéder à l'interface admin**
   - Connectez-vous en tant qu'admin
   - Allez dans la gestion du cours "TP OpenAPI/Swagger"

2. **Créer un nouvel item de type "resource"**
   - Dans le Module 2 (TP pratique), ajoutez un nouvel item
   - Type : `resource`
   - Titre : "Pas à pas détaillé - Instructions complètes"

3. **Copier le contenu JSON**
   - Ouvrez le fichier `PAS_A_PAS_DETAILLE_LMS.json`
   - Copiez tout le contenu (c'est un objet JSON avec `type: "doc"` et `content: [...]`)

4. **Coller dans le champ `content.body`**
   - Dans l'éditeur JSON de l'item, trouvez le champ `content.body`
   - Remplacez son contenu par le JSON copié
   - Sauvegardez

### Option B : Remplacer les instructions du TP existant

1. **Ouvrir l'item TP existant**
   - Dans le Module 2, ouvrez l'item "TP : Création d'une API OpenAPI 3 avec Swagger UI"

2. **Remplacer le champ `content.instructions`**
   - Ouvrez le fichier `PAS_A_PAS_DETAILLE_LMS.json`
   - Copiez tout le contenu
   - Dans l'éditeur JSON, remplacez `content.instructions` par le JSON copié
   - Sauvegardez

## 🗄️ Méthode 2 : Via SQL (insertion directe)

Si vous préférez insérer directement en base de données :

```sql
-- 1. Trouver l'ID de l'item TP
SELECT id, title, module_id 
FROM items 
WHERE title LIKE '%TP%OpenAPI%';

-- 2. Mettre à jour le champ content.instructions
-- (Remplacez ITEM_ID par l'ID trouvé)
UPDATE items
SET content = jsonb_set(
  content,
  '{instructions}',
  'CONTENU_DU_FICHIER_PAS_A_PAS_DETAILLE_LMS_JSON_ICI'::jsonb
)
WHERE id = 'ITEM_ID';
```

**Note :** Vous devrez charger le contenu du fichier JSON et l'insérer comme JSONB.

## 📝 Structure du JSON

Le fichier `PAS_A_PAS_DETAILLE_LMS.json` contient :

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Titre" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Texte..." }]
    },
    {
      "type": "codeBlock",
      "attrs": { "language": "typescript" },
      "content": [{ "type": "text", "text": "code..." }]
    }
  ]
}
```

C'est un document TipTap complet avec :
- Titres (heading level 1-3)
- Paragraphes
- Listes à puces et numérotées
- Blocs de code avec coloration syntaxique
- Liens

## ✅ Vérification

Après l'injection :

1. **Vérifiez l'affichage**
   - Ouvrez le cours en tant qu'étudiant
   - Vérifiez que le pas à pas s'affiche correctement
   - Vérifiez que les blocs de code sont bien formatés
   - Vérifiez que les titres sont hiérarchisés

2. **Testez la navigation**
   - Vérifiez que les étudiants peuvent suivre les étapes
   - Vérifiez que les liens fonctionnent (Swagger Editor)

## 🔧 Personnalisation

Si vous souhaitez modifier le contenu :

1. **Éditez le fichier JSON**
   - Ouvrez `PAS_A_PAS_DETAILLE_LMS.json`
   - Modifiez le contenu selon vos besoins
   - Respectez la structure TipTap

2. **Réinjectez dans le LMS**
   - Suivez les mêmes étapes que ci-dessus

## 📚 Format TipTap

Le document utilise le format TipTap avec ces types de nœuds :

- `heading` : Titres (level 1-6)
- `paragraph` : Paragraphes de texte
- `bulletList` / `orderedList` : Listes
- `listItem` : Élément de liste
- `codeBlock` : Bloc de code (avec `attrs.language`)
- `text` : Texte simple (peut avoir des `marks` : bold, code, link)

Pour plus d'informations sur le format TipTap, consultez la documentation de votre LMS.

---

**Le pas à pas est maintenant prêt à être utilisé par vos étudiants ! 🎓**






---


### 📄 Génération du PDF du TP

*Source: `tp-openapi-swagger/README_PDF.md`*


---

# Génération du PDF du TP

Ce guide explique comment générer un PDF complet du TP à partir des fichiers markdown.

## 📋 Prérequis

- Node.js 18+ installé
- npm installé

## 🚀 Génération du PDF

### Étape 1 : Installer les dépendances

```bash
npm install
```

Cela installera `puppeteer` nécessaire pour la génération du PDF.

### Étape 2 : Générer le PDF

```bash
npm run generate-pdf
```

Ou directement :

```bash
node generer-pdf.js
```

### Étape 3 : Récupérer le PDF

Le PDF sera généré dans le fichier :
```
TP-OpenAPI-Swagger-COMPLET.pdf
```

## 📄 Contenu du PDF

Le PDF généré contient :

1. **Énoncé du TP** (`TP_ENONCE.md`)
   - Contexte et objectifs
   - Prérequis
   - Périmètre fonctionnel
   - Étapes détaillées
   - Exemples d'appels curl

2. **Actions concrètes** (`ACTIONS_ETUDIANTS.md`)
   - Checklist des actions à réaliser
   - Instructions étape par étape
   - Code complet pour chaque étape
   - Vérifications à faire

3. **Checklist de conformité** (`CHECKLIST.md`)
   - Vérification OpenAPI 3
   - Vérification Swagger UI
   - Vérification de l'implémentation
   - Score de conformité

4. **Exemples et documentation** (`README.md`)
   - Exemples d'appels curl
   - Structure du projet
   - Dépannage

## 🎨 Format du PDF

- **Format** : A4
- **Marges** : 2cm de chaque côté
- **En-têtes et pieds de page** : Numérotation automatique
- **Style** : Professionnel avec code coloré
- **Table des matières** : Navigation facilitée

## 🔧 Personnalisation

Pour modifier le contenu du PDF :

1. Éditez les fichiers markdown source :
   - `TP_ENONCE.md`
   - `ACTIONS_ETUDIANTS.md`
   - `CHECKLIST.md`
   - `README.md`

2. Régénérez le PDF :
   ```bash
   npm run generate-pdf
   ```

## 📦 Partage du PDF

Le PDF généré peut être :
- Partagé directement avec les étudiants
- Mis en ligne sur votre LMS
- Imprimé pour distribution papier
- Archivé pour référence future

## 🐛 Dépannage

### Erreur : Puppeteer non installé

```bash
npm install puppeteer
```

### Erreur : Chrome/Chromium non trouvé

Puppeteer télécharge automatiquement Chromium. Si cela échoue :
- Vérifiez votre connexion internet
- Vérifiez les permissions d'écriture dans le dossier

### Le PDF est vide ou mal formaté

- Vérifiez que tous les fichiers markdown existent
- Vérifiez les erreurs dans la console
- Vérifiez que les fichiers markdown sont valides

---

**Le PDF est prêt à être partagé ! 📄**






---


## 12. Autres


---


### 📄 Portail Formations

*Source: `portal-formations/README.md`*


---

# Portail Formations

Application web de formation en ligne avec React, Vite, TypeScript et Supabase.

## 🚀 Fonctionnalités

- **Authentification** : Email/password + OAuth Google/Apple
- **Gestion des formations** : CRUD complet avec modules et éléments
- **Types d'éléments** : Ressources, supports, exercices, TP, mini-jeux
- **Stockage** : Upload de fichiers via Supabase Storage
- **Administration** : Interface complète pour gérer le contenu
- **Préparation paiement** : Structure prête pour Stripe (formations payantes)

## 🛠️ Stack Technique

- **Frontend** : React 18 + Vite + TypeScript
- **UI** : TailwindCSS + Lucide Icons
- **Backend** : Supabase (Auth, DB, Storage)
- **Déploiement** : Netlify (SPA)
- **PDF** : react-pdf + pdfjs

## 📦 Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd portal-formations
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration Supabase**
   - Créer un projet sur [supabase.com](https://supabase.com)
   - Copier le schéma SQL depuis `supabase-schema.sql`
   - Créer les buckets Storage :
     - `course-assets` (public)
     - `submissions` (privé)

4. **Variables d'environnement**
   ```bash
   cp .env.example .env
   ```

   Remplir `.env` :
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Démarrage développement**
   ```bash
   npm run dev
   ```

## 🚀 Déploiement Netlify

### Configuration OAuth Supabase

1. **Google OAuth**
   - Aller dans [Google Cloud Console](https://console.cloud.google.com/)
   - Créer un projet ou en sélectionner un
   - Activer Google+ API
   - Créer des identifiants OAuth 2.0
   - URLs de redirection autorisées :
     - Production : `https://votredomaine.netlify.app`
     - Preview : `https://deploy-preview-XX--votredomaine.netlify.dev`

2. **Apple OAuth**
   - Aller dans [Apple Developer](https://developer.apple.com/)
   - Créer un App ID avec Sign In with Apple
   - Créer un Service ID
   - Configurer Sign In with Apple
   - URLs de redirection :
     - Même que Google

3. **Configuration Supabase**
   - Dans Supabase Dashboard > Authentication > Providers
   - Activer Google et Apple
   - Remplir les champs avec les identifiants obtenus

### Déploiement

1. **Push sur Git**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connexion Netlify**
   - Aller sur [netlify.com](https://netlify.com)
   - "New site from Git"
   - Sélectionner le repository
   - Configuration build :
     - Build command : `npm run build`
     - Publish directory : `dist`
   - Variables d'environnement :
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Domain personnalisé** (optionnel)
   - Dans Netlify > Site settings > Domain management
   - Ajouter votre domaine personnalisé

## 📊 Structure Base de Données

### Tables principales
- `profiles` : Profils utilisateurs (lié à auth.users)
- `courses` : Formations
- `modules` : Modules dans les formations
- `items` : Éléments (ressources, exercices, etc.)
- `enrollments` : Inscriptions aux formations
- `submissions` : Soumissions d'exercices/TP
- `game_scores` : Scores des mini-jeux

### RLS (Row Level Security)
- Activé sur toutes les tables
- Policies détaillées pour admin/student access

## 🔒 Sécurité

- **Authentification** : Gestion complète via Supabase
- **Autorisation** : RLS + vérifications côté client
- **Stockage** : Policies Storage restrictives
- **Headers** : Sécurité configurée dans netlify.toml

## 🎯 Utilisation

### Pour les étudiants
- Inscription/connexion
- Accès aux formations inscrites
- Soumission d'exercices et TP
- Téléchargement de ressources
- **Jeux interactifs** : Mini-jeux pédagogiques pour renforcer l'apprentissage

### Pour les admins
- Gestion complète des formations
- Upload de fichiers
- Gestion des utilisateurs
- Publication/dépublication de contenu
- **Création de jeux** : Créer des jeux interactifs (matching, connection, timeline, category, etc.)

## 🎮 Jeux interactifs

L'application supporte plusieurs types de jeux pédagogiques :

### Types de jeux disponibles
- **Matching** : Association de cartes (terme/définition)
- **Column Matching** : Association de colonnes
- **Connection** : Connexion avec lignes animées
- **Timeline** : Placement chronologique d'événements
- **Category** : Classification d'items dans des catégories
- **API Types** : Choix du type d'API approprié
- **Format Files** : Apprentissage des formats JSON/XML/Protobuf
- **JSON File Types** : Identification de types de fichiers JSON

### Accéder aux jeux

**Si le jeu est un item :**
```
/items/{itemId}
```

**Si le jeu est dans un chapitre :**
```
/courses/{courseId}
```
Naviguez ensuite jusqu'au chapitre contenant le jeu.

**Trouver l'ID d'un jeu :**
```sql
-- Pour un item
SELECT id, title FROM items WHERE type = 'game';

-- Pour un chapitre
SELECT id, title FROM chapters WHERE type = 'game';
```

### Documentation des jeux

- 📖 `STRUCTURE-COMPLETE-JEUX.md` : Structure complète de tous les types de jeux
- 🎯 `NOUVEAUX_JEUX.md` : Guide des nouveaux jeux interactifs (connection, timeline, category)
- 📚 `exemples-jeux/README-JEUX-API.md` : Exemples de jeux pour l'apprentissage des APIs
- 🔧 `GUIDE-FORMAT-JEU-CHAPITRE.md` : Guide pour intégrer un jeu dans un chapitre
- 🔍 `GUIDE-TROUVER-ITEM-ID.md` : Comment trouver l'ID d'un item ou chapitre

## 🚧 Évolutions Prévues

### Phase 2 : Paiements
- Intégration Stripe
- Formations payantes
- Abonnements
- Codes promo

### Phase 3 : Fonctionnalités avancées
- Progression utilisateur
- Badges/certificats
- Forum communautaire
- Analytics d'apprentissage

## 📝 Scripts Disponibles

- `npm run dev` : Démarrage développement
- `npm run build` : Build production
- `npm run preview` : Prévisualisation build
- `npm run lint` : Linting du code

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push et créer une PR

## 📄 Licence

MIT License - voir LICENSE pour plus de détails.



---


### 📄 📊 Accès aux réponses du quiz d'introduction

*Source: `portal-formations/ACCES-REPONSES-QUIZ.md`*


---

# 📊 Accès aux réponses du quiz d'introduction

## ✅ Oui, les formateurs et admins peuvent voir toutes les réponses !

Les réponses du quiz d'introduction sont **bien visibles** dans le suivi pédagogique de l'application pour les formateurs et les administrateurs.

## 🔐 Accès selon le rôle

### 👨‍🏫 Pour les Formateurs (Trainer)

**Page dédiée :** `/trainer/quiz-responses`

**Fonctionnalités :**
- ✅ Voir toutes les réponses des participants
- ✅ Filtrer par cours ou session
- ✅ Rechercher dans les réponses
- ✅ Exporter en CSV
- ✅ Statistiques (total, réponses complètes, dernière réponse)

**Accès :**
1. Via l'URL directe : `/trainer/quiz-responses`
2. Via le contexte d'un cours : `/trainer/courses/:courseId/quiz-responses`
3. Via le contexte d'une session : `/trainer/sessions/:sessionId/quiz-responses`

### 👨‍💼 Pour les Administrateurs (Admin)

**Page dédiée :** `/admin/quiz-responses` ou `/admin/courses/:courseId/quiz-responses`

**Fonctionnalités :**
- ✅ Voir toutes les réponses des participants
- ✅ Filtrer par cours
- ✅ Rechercher dans les réponses
- ✅ Exporter en CSV
- ✅ Statistiques (total, réponses complètes, dernière réponse)
- ✅ Lien direct depuis la page des soumissions

**Accès :**
1. Via l'URL directe : `/admin/quiz-responses`
2. Via le contexte d'un cours : `/admin/courses/:courseId/quiz-responses`
3. **Depuis la page des soumissions** : Bouton "Voir les réponses du quiz d'introduction"

## 📋 Informations affichées

Pour chaque participant, vous pouvez voir :

1. **Définition du Big Data** - Réponse libre du participant
2. **Définition du Machine Learning** - Réponse libre du participant
3. **Définition de la Data Science** - Réponse libre du participant
4. **Attentes du cours** - Objectifs d'apprentissage du participant

**Métadonnées :**
- Nom complet du participant
- Email du participant
- Date et heure de la réponse
- Statut (complète ou partielle)

## 🔍 Fonctionnalités de recherche et filtrage

### Recherche
- Par nom du participant
- Par email
- Par contenu des réponses (Big Data, ML, DS, attentes)

### Filtres
- Par type de quiz (actuellement : `introduction_big_data`)
- Par cours (si dans le contexte d'un cours)
- Par session (si dans le contexte d'une session)

## 📊 Statistiques disponibles

- **Total de réponses** : Nombre total de participants ayant répondu
- **Réponses complètes** : Nombre de participants ayant répondu aux 4 questions
- **Dernière réponse** : Date et heure de la dernière réponse reçue

## 📥 Export des données

**Format CSV** avec les colonnes :
- Nom
- Email
- Big Data
- Machine Learning
- Data Science
- Attentes
- Date de réponse

## 🔒 Sécurité (RLS)

Les politiques de sécurité (RLS) sont configurées pour :
- ✅ Les participants peuvent voir et modifier **uniquement leurs propres réponses**
- ✅ Les formateurs peuvent voir **toutes les réponses** de leurs cours/sessions
- ✅ Les administrateurs peuvent voir **toutes les réponses**

## 🚀 Intégration dans le suivi pédagogique

Les réponses du quiz d'introduction sont **intégrées** dans le suivi pédagogique :

1. **Page des soumissions admin** : Lien direct vers les réponses du quiz
2. **Dashboard formateur** : Accessible via le menu formateur
3. **Contexte cours/session** : Filtrage automatique par cours ou session

## 📝 Exemple d'utilisation

### Scénario 1 : Formateur veut voir les réponses de sa session

1. Aller sur `/trainer/sessions/:sessionId/quiz-responses`
2. Les réponses sont automatiquement filtrées pour cette session
3. Rechercher, analyser, exporter

### Scénario 2 : Admin veut voir toutes les réponses d'un cours

1. Aller sur `/admin/courses/:courseId/submissions`
2. Cliquer sur "Voir les réponses du quiz d'introduction"
3. Ou aller directement sur `/admin/courses/:courseId/quiz-responses`

### Scénario 3 : Analyser les attentes avant le cours

1. Accéder aux réponses du quiz
2. Exporter en CSV
3. Analyser les attentes pour adapter le contenu du cours

## 🎯 Cas d'usage pédagogiques

1. **Avant le cours** : Analyser les définitions et attentes pour adapter le contenu
2. **Pendant le cours** : Revenir sur les définitions initiales pour montrer l'évolution
3. **Après le cours** : Comparer les définitions avant/après pour mesurer l'apprentissage
4. **Personnalisation** : Identifier les besoins spécifiques de chaque participant

## 📚 Fichiers créés

- `src/pages/trainer/TrainerQuizResponses.tsx` - Page formateur
- `src/pages/admin/AdminQuizResponses.tsx` - Page admin
- Routes ajoutées dans `src/App.tsx`
- Lien ajouté dans `src/pages/admin/AdminCourseSubmissions.tsx`

## ✅ Résumé

**OUI**, les formateurs et admins ont un accès complet et visible aux réponses du quiz d'introduction dans le suivi pédagogique de l'application, avec :
- Interface dédiée et intuitive
- Recherche et filtrage avancés
- Export des données
- Statistiques en temps réel
- Intégration dans le workflow pédagogique





---


### 📄 Amélioration de la stabilité de l'application

*Source: `portal-formations/AMELIORATION-STABILITE.md`*


---

# Amélioration de la stabilité de l'application

## Problèmes identifiés

1. **Déconnexions régulières** : Les sessions expiraient sans être rafraîchies
2. **Temps de réponse instables** : Pas de retry en cas d'erreur réseau
3. **Pas de gestion des erreurs réseau** : Les erreurs réseau causaient des crashes
4. **Pas de détection de connexion** : Pas d'indication quand la connexion est perdue

## Solutions implémentées

### 1. Système de retry avec backoff exponentiel

**Fichier** : `src/lib/supabaseHelpers.ts`

- **Fonction `withRetry`** : Retry automatique avec backoff exponentiel
  - 3 tentatives par défaut
  - Délai initial : 500ms
  - Multiplicateur : 2x (500ms → 1000ms → 2000ms)
  - Délai maximum : 5 secondes

- **Détection des erreurs retryables** :
  - Erreurs réseau (network, timeout, fetch)
  - Erreurs serveur (5xx)
  - Rate limiting (429)

- **Fonction `withTimeout`** : Timeout par défaut de 30 secondes pour toutes les requêtes

### 2. Amélioration de la gestion de session

**Fichier** : `src/hooks/useAuth.tsx`

- **Refresh token proactif** :
  - Vérification toutes les minutes
  - Refresh automatique si le token expire dans les 5 prochaines minutes
  - Prévention des déconnexions inattendues

- **Gestion améliorée des erreurs d'authentification** :
  - Détection automatique des erreurs JWT/token
  - Déconnexion automatique en cas d'erreur d'auth
  - Retry avec backoff pour les requêtes de profil

- **Timeout optimisés** :
  - Session fetch : 5 secondes (avec retry)
  - Profile fetch : 8 secondes (avec retry)
  - Timeout global auth : 5 secondes

### 3. Détection de connexion réseau

**Fichier** : `src/hooks/useNetworkStatus.tsx`

- Détection automatique de la perte de connexion
- Détection de la reconnexion
- Indication visuelle du statut de connexion

**Fichier** : `src/components/NetworkStatus.tsx`

- Bannière en haut de l'écran
- Rouge quand hors ligne
- Vert quand reconnexion réussie

**Fichier** : `src/components/ProtectedRoute.tsx`

- Blocage de l'interface si hors ligne
- Message clair pour l'utilisateur

### 4. Optimisation des requêtes Supabase

**Fichier** : `src/lib/supabaseClient.ts`

- Timeout de 30 secondes par défaut pour toutes les requêtes
- Configuration améliorée du client Supabase
- Gestion des erreurs de refresh token

**Fichiers modifiés** :
- `src/pages/CourseView.tsx` : Retry sur toutes les requêtes
- `src/pages/Dashboard.tsx` : Retry sur toutes les requêtes
- Toutes les requêtes utilisent maintenant `withRetry` et `withTimeout`

### 5. Gestion améliorée des erreurs

- **Détection des erreurs d'authentification** : Déconnexion automatique
- **Détection des erreurs réseau** : Retry automatique
- **Messages d'erreur clairs** : Indication de la cause du problème
- **Gestion gracieuse** : L'application continue de fonctionner même en cas d'erreur non critique

## Fonctionnalités ajoutées

### Système de retry
```typescript
import { withRetry, withTimeout } from '../lib/supabaseHelpers'

const result = await withRetry(
  () => withTimeout(
    supabase.from('table').select('*'),
    15000,
    'Request timeout'
  ),
  { maxRetries: 2, initialDelay: 1000 }
)
```

### Détection de connexion
```typescript
import { useNetworkStatus } from '../hooks/useNetworkStatus'

const { isOnline, wasOffline } = useNetworkStatus()
```

### Gestion d'erreurs
```typescript
import { isAuthError, isPermissionError } from '../lib/supabaseHelpers'

if (isAuthError(error)) {
  // Déconnecter l'utilisateur
}
```

## Résultats attendus

1. **Moins de déconnexions** :
   - Refresh token proactif
   - Détection et gestion des erreurs d'auth
   - Retry automatique en cas d'erreur réseau

2. **Temps de réponse plus stables** :
   - Retry automatique avec backoff
   - Timeout appropriés
   - Gestion des erreurs réseau

3. **Meilleure expérience utilisateur** :
   - Indication claire du statut de connexion
   - Messages d'erreur explicites
   - Application qui continue de fonctionner même en cas d'erreur

## Configuration recommandée

### Variables d'environnement
Assurez-vous que les variables d'environnement sont correctement configurées :
```
VITE_SUPABASE_URL=votre_url
VITE_SUPABASE_ANON_KEY=votre_clé
```

### Base de données
Vérifiez que les policies RLS ne créent pas de récursion :
- Exécutez `fix-rls-recursion.sql` si nécessaire
- Vérifiez que la fonction `is_admin` existe

## Monitoring

Pour surveiller la stabilité :
1. Ouvrez la console du navigateur (F12)
2. Surveillez les logs :
   - `Token refreshed successfully` : Refresh réussi
   - `Retry attempt X/Y` : Retry en cours
   - `Network connection lost/restored` : Changement de connexion
   - `Auth error` : Problème d'authentification

## Dépannage

### Si les déconnexions persistent
1. Vérifiez les logs dans la console
2. Vérifiez que le refresh token fonctionne
3. Vérifiez les policies RLS
4. Nettoyez le localStorage si nécessaire

### Si les temps de réponse sont toujours instables
1. Vérifiez votre connexion Internet
2. Vérifiez les logs de retry
3. Augmentez les timeouts si nécessaire
4. Vérifiez les performances de Supabase






---


### 📄 Différence entre Contenu (Ressource) et Slide (Support projeté)

*Source: `portal-formations/DIFFERENCE-CONTENU-SLIDE.md`*


---

# Différence entre Contenu (Ressource) et Slide (Support projeté)

## 📄 Ressource (`resource`)

**Utilisation** : Pour partager des documents, liens, fichiers téléchargeables

**Caractéristiques** :
- ✅ Contenu texte riche (éditeur TipTap)
- ✅ Fichiers à télécharger (PDF, DOC, images, etc.)
- ✅ Liens externes
- ✅ Description textuelle
- ✅ Affichage : Téléchargement ou visualisation PDF

**Cas d'usage** :
- Documents de référence
- Liens vers des ressources externes
- Fichiers à télécharger
- Documentation complémentaire
- Articles, guides, tutoriels

**Exemple** :
- Un document PDF à télécharger
- Un lien vers un site web
- Un fichier Word avec des instructions

---

## 🎯 Support projeté (`slide`)

**Utilisation** : Pour les présentations, slides, supports visuels à projeter

**Caractéristiques** :
- ✅ Contenu texte riche (éditeur TipTap)
- ✅ Fichiers visuels (PDF, images)
- ✅ Affichage optimisé pour la projection
- ✅ Description textuelle
- ✅ Affichage : Visualisation directe (PDF viewer ou image)

**Cas d'usage** :
- Présentations PowerPoint converties en PDF
- Slides de cours
- Supports visuels pour présentation
- Images pédagogiques
- Documents à projeter en classe

**Exemple** :
- Un PDF de présentation à visualiser directement
- Une image de slide à afficher
- Un support de cours à projeter

---

## 🔄 Différences principales

| Caractéristique | Ressource | Slide |
|----------------|-----------|-------|
| **Objectif** | Téléchargement/Consultation | Visualisation/Projection |
| **Affichage PDF** | Viewer ou téléchargement | Viewer direct |
| **Images** | Lien de téléchargement | Affichage direct |
| **Usage** | Documents de référence | Supports de présentation |
| **Contenu texte** | ✅ Oui | ✅ Oui |

---

## 💡 Quand utiliser quoi ?

### Utilisez **Ressource** quand :
- Vous voulez que l'étudiant télécharge un fichier
- Vous partagez un lien externe
- C'est un document de référence à consulter
- C'est un fichier à utiliser hors ligne

### Utilisez **Slide** quand :
- Vous voulez que l'étudiant visualise directement le contenu
- C'est un support de présentation
- C'est une image pédagogique à afficher
- C'est un document à projeter

---

## 🎨 Options de mise en page (à venir)

Des options de mise en page complémentaires seront ajoutées pour le contenu :
- Colonnes (1, 2, 3 colonnes)
- Alignement (gauche, centre, droite, justifié)
- Couleurs de texte et de fond
- Espacement personnalisé
- Bordures et ombres
- Mise en page responsive

---

## ⚙️ Paramètres utilisateur

Les paramètres suivants seront sauvegardés :
- **Zoom** : Niveau de zoom préféré (50%, 75%, 100%, 125%, 150%, 200%)
- **Thème** : Mode clair/sombre
- **Taille de police** : Petite, normale, grande
- **Mise en page** : Préférences d'affichage






---


### 📄 Évolution UX : Slides avec Contexte Pédagogique

*Source: `portal-formations/EVOLUTION-UX-SLIDES.md`*


---

# Évolution UX : Slides avec Contexte Pédagogique

## 📋 Résumé de la solution

Cette évolution de l'UX permet de reproduire l'expérience d'un cours réel avec support projeté, commenté et enrichi en temps réel par le formateur.

---

## ✅ Fonctionnalités implémentées

### 1️⃣ Gestion et affichage des slides (support projeté)

✅ **Composant `SlideBlock`** créé
- Affiche la slide si elle existe (image, PDF, ou contenu rich text)
- Affiche un message d'avertissement clair si aucun slide n'est présent :
  ```
  ⚠️ Aucun slide projeté pour cette section
  Le contenu pédagogique sera disponible ci-dessous une fois le slide ajouté.
  ```

**Fichier :** `src/components/SlideBlock.tsx`

### 2️⃣ Contenu pédagogique sous chaque slide (contexte)

✅ **Composant `ContextBlock`** créé
- Visuellement distinct du slide
- Légèrement indenté vers la droite (`ml-8 md:ml-12`)
- Aspect "annotation / commentaire formateur"
- Fond clair avec bordure gauche colorée
- Icône "MessageSquare" pour identifier le contexte

**Fichier :** `src/components/ContextBlock.tsx`

**Utilisation :**
- Explications du formateur
- Contextualisation
- Exemples concrets
- Points clés à retenir

### 3️⃣ Bandeau Lexique & Définitions (aide permanente)

✅ **Système existant amélioré**
- Le lexique est déjà implémenté dans `src/pages/Lexique.tsx`
- Accessible via un drawer à droite dans `CourseView.tsx`
- Visible directement dans la fenêtre du cours
- Repliable sur mobile, fixe sur desktop

**Améliorations possibles (futures) :**
- Lier les termes du lexique aux slides concernées
- Recherche améliorée
- Export du lexique

---

## 📁 Structure des fichiers créés/modifiés

### Nouveaux fichiers

1. **`src/components/SlideBlock.tsx`**
   - Composant pour afficher les slides
   - Gère les messages d'avertissement

2. **`src/components/ContextBlock.tsx`**
   - Composant pour le contexte pédagogique
   - Style indenté et distinct

3. **`exemple-slide-avec-contexte.json`**
   - Exemple complet de structure JSON
   - Montre les différents cas d'usage

4. **`GUIDE-SLIDES-CONTEXTE.md`**
   - Documentation complète
   - Exemples et bonnes pratiques

### Fichiers modifiés

1. **`src/components/ReactRenderer.tsx`**
   - Import des nouveaux composants
   - Modification de `renderSlide()` pour utiliser `SlideBlock` et `ContextBlock`

2. **`src/types/courseJson.ts`**
   - Ajout du type `pedagogical_context` dans `content`
   - Support pour `text`, `body` (TipTap), ou `description`

---

## 🎨 Layout JSX proposé

### Structure d'affichage

```jsx
<div className="slide-container space-y-0">
  {/* 1. Slide principale (support projeté) */}
  <SlideBlock item={item} theme={theme} />
  
  {/* 2. Contexte pédagogique (indenté, sous la slide) */}
  {item.content?.pedagogical_context && (
    <ContextBlock 
      context={item.content.pedagogical_context} 
      theme={theme} 
    />
  )}
  
  {/* 3. Chapitres si disponibles */}
  {item.chapters && item.chapters.length > 0 && (
    <div className="mt-6">
      <ChapterList chapters={item.chapters} theme={theme} />
    </div>
  )}
</div>
```

### Hiérarchie visuelle

```
┌─────────────────────────────────────┐
│  SLIDE PRINCIPALE (SlideBlock)      │
│  - Image/PDF ou Rich Text           │
│  - Message d'avertissement si vide  │
└─────────────────────────────────────┘
    ┌─────────────────────────────────┐
    │  CONTEXTE PÉDAGOGIQUE            │
    │  (ContextBlock - indenté)        │
    │  - Explications                  │
    │  - Exemples                      │
    │  - Points clés                   │
    └─────────────────────────────────┘
```

---

## 📊 Structure de données (JSON/Supabase)

### Structure pour une slide avec contexte

```json
{
  "type": "slide",
  "title": "Titre de la slide",
  "position": 1,
  "published": true,
  "asset_path": "module1/slide1.png",  // Optionnel
  "content": {
    "summary": "Résumé optionnel",
    "body": { /* TipTap JSON */ },  // Optionnel
    "pedagogical_context": {
      "text": "Texte simple",
      // OU
      "body": { /* TipTap JSON */ },
      // OU
      "description": "Description simple"
    }
  }
}
```

### Champs disponibles

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `type` | string | `"slide"` | ✅ Oui |
| `title` | string | Titre de la slide | ✅ Oui |
| `asset_path` | string | Chemin vers image/PDF | ❌ Non |
| `content.body` | object | Contenu TipTap JSON | ❌ Non |
| `content.pedagogical_context` | object | Contexte pédagogique | ❌ Non (recommandé) |
| `content.pedagogical_context.text` | string | Texte simple | ❌ Non |
| `content.pedagogical_context.body` | object | TipTap JSON | ❌ Non |
| `content.pedagogical_context.description` | string | Description | ❌ Non |

---

## 🎯 Styles CSS/Tailwind

### SlideBlock

```css
.slide-block {
  /* Conteneur principal */
  margin-bottom: 1.5rem;
}

.slide-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}
```

### ContextBlock

```css
.context-block {
  margin-top: 1rem;
  margin-bottom: 1.5rem;
}

.context-block > div {
  margin-left: 2rem;  /* Desktop: ml-12 */
  margin-left: 1rem;  /* Mobile: ml-8 */
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid var(--theme-primary);
  background: #F9FAFB;
}
```

### Message d'avertissement

```css
/* Fond jaune clair avec bordure */
background-color: #FEF3C7;
border-color: #F59E0B;
border-width: 2px;
border-style: dashed;
```

---

## 🚀 Utilisation

### 1. Créer une slide avec contexte

Dans votre JSON de cours :

```json
{
  "type": "slide",
  "title": "Introduction aux APIs",
  "position": 1,
  "published": true,
  "asset_path": "module1/api-intro.png",
  "content": {
    "pedagogical_context": {
      "text": "Cette slide présente les concepts de base. L'API agit comme un intermédiaire entre votre application et les données."
    }
  }
}
```

### 2. Slide sans contenu (avertissement)

```json
{
  "type": "slide",
  "title": "Slide à venir",
  "position": 2,
  "published": true,
  "content": {
    "pedagogical_context": {
      "text": "Le slide sera ajouté prochainement."
    }
  }
}
```

### 3. Slide avec contexte riche (TipTap)

```json
{
  "type": "slide",
  "title": "Types d'APIs",
  "position": 3,
  "published": true,
  "content": {
    "body": { /* Contenu de la slide */ },
    "pedagogical_context": {
      "body": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "Explication avec " },
              { "type": "text", "marks": [{ "type": "bold" }], "text": "formatage" }
            ]
          }
        ]
      }
    }
  }
}
```

---

## 📱 Responsive

- **Desktop** : Indentation `ml-12` (48px)
- **Tablette** : Indentation `ml-8` (32px)
- **Mobile** : Indentation `ml-8` (32px)
- Les slides s'adaptent automatiquement

---

## ✅ Contraintes respectées

- ✅ Modification de l'UX existante (pas de nouvelle app)
- ✅ React avec composants clairs et réutilisables
- ✅ Responsive (desktop / tablette / mobile)
- ✅ Code lisible et maintenable
- ✅ Objectif pédagogique avant esthétique
- ✅ Reproduction de l'expérience d'un cours réel

---

## 🔄 Prochaines étapes possibles

1. **Amélioration du lexique**
   - Lier les termes aux slides concernées
   - Recherche améliorée avec filtres

2. **Annotations interactives**
   - Permettre aux formateurs d'ajouter des annotations en temps réel
   - Synchronisation avec vidéo (timestamps)

3. **Export et partage**
   - Export du contexte pédagogique séparément
   - Génération de PDF avec slides + contexte

4. **Analytics**
   - Suivi du temps passé sur chaque slide
   - Identification des slides les plus consultées

---

## 📚 Documentation complémentaire

- **`GUIDE-SLIDES-CONTEXTE.md`** : Guide détaillé avec exemples
- **`exemple-slide-avec-contexte.json`** : Exemple complet de structure JSON

---

## 🎓 Objectif pédagogique atteint

✅ **Dissociation claire** entre support projeté et savoir transmis
✅ **Expérience immersive** comme dans une vraie salle de formation
✅ **Flexibilité** pour les formateurs (texte simple ou rich text)
✅ **Avertissements clairs** pour les slides manquantes
✅ **Aide permanente** avec le lexique accessible





---


### 📄 Guide d'import direct de cours JSON

*Source: `portal-formations/GUIDE-IMPORT-DIRECT.md`*


---

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




---


### 📄 Guide d'import du Module 6 : Du client-serveur aux API

*Source: `portal-formations/GUIDE-IMPORT-MODULE-6.md`*


---

# Guide d'import du Module 6 : Du client-serveur aux API

Ce guide vous explique comment importer le Module 6 dans votre cours "Architecture client–serveur et bases du Web".

## 🚀 Méthode rapide : Utiliser l'outil de fusion

**Recommandé** : Utilisez l'outil automatique pour fusionner le Module 6 :

```bash
cd portal-formations
node fusionner-module-6.cjs
```

Cet outil :
- ✅ Fusionne automatiquement le Module 6 avec le cours
- ✅ Gère les positions des modules
- ✅ Crée un fichier de sortie séparé (ne modifie pas l'original)
- ✅ Détecte et remplace le Module 6 s'il existe déjà

Consultez `README-FUSION-MODULE-6.md` pour plus de détails.

---

## 📋 Méthode manuelle

### ⚠️ Important

L'import JSON dans l'interface d'administration **remplace tous les modules existants**. Vous devez donc d'abord exporter votre cours complet, ajouter le Module 6, puis réimporter.

## 📋 Étapes d'import

### Étape 1 : Exporter le cours existant

1. Allez dans l'administration : `/admin/courses/{courseId}/json`
   - Remplacez `{courseId}` par l'ID de votre cours "Architecture client–serveur et bases du Web"
2. Cliquez sur le bouton **"Exporter"** (icône téléchargement)
3. Sauvegardez le fichier JSON (par exemple : `architecture-client-serveur-web-backup.json`)

### Étape 2 : Ajouter le Module 6 au JSON exporté

1. Ouvrez le fichier JSON exporté dans un éditeur de texte
2. Ouvrez le fichier `module-6-client-serveur-api.json` (contenant uniquement le Module 6)
3. Dans le JSON exporté, trouvez le tableau `"modules"` (ligne ~11)
4. Ajoutez le Module 6 à la fin du tableau `modules`, juste avant la fermeture du tableau

**Exemple :**

```json
{
  "title": "Architecture client–serveur et bases du Web",
  "description": "...",
  "modules": [
    {
      "title": "Module 1 : ...",
      ...
    },
    {
      "title": "Module 5 : ...",
      ...
    },
    {
      "title": "Module 6 : Du client-serveur aux API",
      "position": 6,
      "theme": {
        "primaryColor": "#6366F1",
        "secondaryColor": "#4F46E5"
      },
      "items": [
        ...
      ]
    }
  ]
}
```

**⚠️ Important :** Assurez-vous que :
- Le Module 6 est bien dans le tableau `modules` (entre les crochets `[...]`)
- Il y a une virgule `,` après le Module 5 et avant le Module 6
- Le JSON reste valide (vous pouvez le valider avec un outil en ligne)

### Étape 3 : Réimporter le cours complet

1. Retournez sur la page d'édition JSON du cours : `/admin/courses/{courseId}/json`
2. Cliquez sur **"Importer JSON"** (icône upload)
3. Sélectionnez le fichier JSON modifié (avec le Module 6 ajouté)
4. Vérifiez l'aperçu pour confirmer que tous les modules sont présents
5. Cliquez sur **"Sauvegarder"**

## ✅ Vérification

Après l'import, vérifiez que :
- Tous les modules sont présents (1 à 6)
- Le Module 6 apparaît bien en position 6
- Tous les items du Module 6 sont visibles (7 items au total)

## 🔄 Alternative : Ajout manuel via l'interface

Si vous préférez ne pas utiliser l'import JSON, vous pouvez :

1. Aller sur `/admin/courses/{courseId}` (édition normale, pas JSON)
2. Cliquer sur **"Ajouter un module"**
3. Donner le titre : "Module 6 : Du client-serveur aux API"
4. Ajouter les items un par un en copiant le contenu depuis `module-6-client-serveur-api.json`

## 📁 Fichiers disponibles

- `module-6-client-serveur-api.json` : Module 6 seul (à ajouter au cours)
- `architecture-client-serveur-web.json` : Cours complet avec Module 6 inclus

## 🆘 En cas de problème

Si l'import échoue :
1. Vérifiez que le JSON est valide (utilisez un validateur JSON en ligne)
2. Vérifiez qu'il n'y a pas de virgules en trop ou manquantes
3. Assurez-vous que tous les modules ont un `position` unique
4. Vérifiez la console du navigateur pour les erreurs détaillées




---


### 📄 Guide d'importation : TP Titanic dans Portal Formation

*Source: `portal-formations/GUIDE-IMPORT-TITANIC-TP.md`*


---

# Guide d'importation : TP Titanic dans Portal Formation

## 🔍 Problème résolu

L'erreur "Type invalide: undefined" lors de l'importation du fichier `lms-titanic-big-data.json` a été corrigée.

## ✅ Corrections apportées

### 1. Amélioration de la validation des types

Le code de validation dans `AdminCourseEditJson.tsx` a été amélioré pour :
- Détecter la chaîne littérale `"undefined"` (pas seulement la valeur `undefined`)
- Normaliser automatiquement les types (minuscules, sans espaces)
- Mapper les variantes de types vers les types valides
- Fournir des types par défaut intelligents basés sur le contenu

### 2. Amélioration de la fonction de transformation

La fonction `convertSlidesFormatToCourseJson` garantit maintenant que :
- Tous les items ont toujours un type valide
- Les types sont normalisés avant validation
- Les types invalides sont automatiquement corrigés

## 📋 Structure attendue du fichier JSON

Votre fichier `lms-titanic-big-data.json` doit avoir cette structure :

```json
{
  "title": "Titre du cours",
  "description": "Description du cours",
  "status": "published",
  "access_type": "free",
  "price_cents": 0,
  "currency": "EUR",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Titre du module",
      "position": 0,
      "theme": { ... },
      "items": [
        {
          "type": "resource",
          "title": "Titre de l'item",
          "position": 0,
          "published": true,
          "content": { ... }
        },
        {
          "type": "tp",
          "title": "TP 1 : ...",
          "position": 1,
          "published": true,
          "content": {
            "description": "...",
            "instructions": { /* Format TipTap JSON */ },
            "checklist": [ ... ]
          }
        }
      ]
    }
  ]
}
```

## 🚀 Étapes d'importation

1. **Vérifiez votre fichier JSON** (optionnel mais recommandé) :
   ```bash
   cd titanic-learning-app
   node validate-and-fix-json.js
   ```

2. **Ouvrez Portal Formation** :
   - Allez dans l'interface d'administration
   - Créez un nouveau cours ou éditez un cours existant

3. **Importez le JSON** :
   - Cliquez sur "Mode JSON" ou "Éditer en JSON"
   - Collez le contenu complet de `lms-titanic-big-data.json`
   - Cliquez sur "Sauvegarder"

4. **Vérifiez le résultat** :
   - Le cours devrait être créé avec tous les modules et items
   - Vérifiez que les items de type "tp" sont bien présents

## 🔧 Types valides

Les types d'items acceptés sont :
- `resource` : Ressource de cours
- `slide` : Support de présentation
- `exercise` : Exercice pratique
- `activity` : Activité interactive
- `tp` : Travaux pratiques
- `game` : Jeu/Quiz interactif

## ⚠️ Notes importantes

1. **Assurez-vous d'être dans l'interface COURS**, pas ITEM
2. **Le fichier doit être un cours complet**, pas un item individuel
3. **Tous les items doivent avoir un type valide** dans la liste ci-dessus
4. **Les types sont normalisés automatiquement** (minuscules, sans espaces)

## 🐛 Si l'erreur persiste

1. **Vérifiez la console du navigateur** (F12) pour voir les erreurs détaillées
2. **Utilisez le fichier de test** `lms-titanic-big-data-TEST.json` pour tester avec une version simplifiée
3. **Vérifiez que le JSON est valide** avec `validate-and-fix-json.js`
4. **Vérifiez que vous n'avez pas de caractères invisibles** ou d'encodage incorrect

## 📝 Fichiers créés

- `validate-and-fix-json.js` : Script de validation et correction
- `lms-titanic-big-data-TEST.json` : Version de test simplifiée
- `FIX-UNDEFINED-TYPE-ERROR.md` : Documentation des corrections



---


### 📄 Optimisation de la sauvegarde

*Source: `portal-formations/OPTIMISATION-SAUVEGARDE.md`*


---

# Optimisation de la sauvegarde

## Problèmes identifiés

1. **Sauvegarde très lente** : La fonction `handleSave` faisait trop de requêtes séquentielles
2. **Rechargement complet** : Après chaque sauvegarde, on rechargeait tout le cours depuis la base
3. **Boucles séquentielles** : Les mises à jour des modules et items se faisaient une par une

## Optimisations apportées

### 1. Requêtes parallèles avec Promise.all

**Avant** :
```typescript
// Mise à jour séquentielle (lent)
for (const module of modulesToUpdate) {
  await supabase.from('modules').update(...).eq('id', module.id)
}
```

**Après** :
```typescript
// Mise à jour parallèle (rapide)
const updatePromises = modulesToUpdate.map(module =>
  supabase.from('modules').update(...).eq('id', module.id)
)
await Promise.all(updatePromises)
```

### 2. Récupération des IDs directement

**Avant** :
- Créer les items
- Recharger tout le cours pour avoir les IDs

**Après** :
- Créer les items avec `.select()` pour récupérer les IDs
- Mettre à jour l'état local directement avec les IDs
- Pas de rechargement complet

### 3. Mise à jour de l'état local

**Avant** :
```typescript
await fetchCourse() // Recharge tout depuis la base
```

**Après** :
```typescript
// Mise à jour directe de l'état avec les IDs récupérés
setModules(updatedModules)
```

### 4. Rechargement conditionnel

- Rechargement seulement si vraiment nécessaire
- Rechargement en arrière-plan (non bloquant)
- Mise à jour immédiate de l'UI

## Améliorations de performance

### Avant
- Sauvegarde d'un cours avec 5 modules et 20 items : ~5-10 secondes
- Requêtes séquentielles : 1 + 5 + 20 = 26 requêtes
- Rechargement complet après sauvegarde

### Après
- Sauvegarde d'un cours avec 5 modules et 20 items : ~1-2 secondes
- Requêtes parallèles : 1 + 1 (modules) + 1 (items) = 3 requêtes principales
- Mise à jour directe de l'état

## Fichiers modifiés

1. **`src/pages/admin/AdminCourseEdit.tsx`**
   - Optimisation de `handleSave` avec Promise.all
   - Récupération directe des IDs
   - Mise à jour de l'état local
   - Amélioration de `saveAndEditItem`

## Points importants

- Les requêtes sont maintenant parallèles au lieu de séquentielles
- L'état local est mis à jour directement sans rechargement
- Le feedback utilisateur est amélioré ("Sauvegarde en cours...")
- Les erreurs sont mieux gérées et affichées

## Tests à effectuer

1. **Test de sauvegarde rapide** :
   - Créer une formation avec plusieurs modules et items
   - Sauvegarder
   - Vérifier que c'est rapide (< 2 secondes)

2. **Test de mise à jour** :
   - Modifier des modules et items existants
   - Sauvegarder
   - Vérifier que les changements sont bien appliqués

3. **Test de création** :
   - Créer de nouveaux modules et items
   - Sauvegarder
   - Vérifier que les IDs sont bien mis à jour
   - Vérifier que le bouton "Modifier" devient actif






---


### 📄 📝 Résumé - Quiz d'introduction Big Data / Machine Learning / Data Science

*Source: `portal-formations/QUIZ-INTRODUCTION-RESUME.md`*


---

# 📝 Résumé - Quiz d'introduction Big Data / Machine Learning / Data Science

## ✅ Ce qui a été créé

### 1. Composant React interactif
- **Fichier** : `src/components/IntroductionQuiz.tsx`
- **Fonctionnalités** :
  - Champs de texte libres pour chaque question
  - Sauvegarde automatique dans localStorage
  - Sauvegarde optionnelle dans Supabase
  - Interface moderne et responsive
  - Validation (toutes les questions doivent être remplies)

### 2. Fichiers JSON de configuration

#### `quiz-introduction-big-data-interactif.json` ⭐ **RECOMMANDÉ**
- Format interactif avec composant React dédié
- 4 questions ouvertes :
  1. Définition du Big Data
  2. Définition du Machine Learning
  3. Définition de la Data Science
  4. Attentes du cours

#### `quiz-introduction-big-data.json`
- Format QCM avec QuizGame standard
- Questions à choix multiples (toutes valides)

#### `quiz-introduction-big-data-formulaire.json`
- Format slide avec espaces pour réponses libres
- Idéal pour animation en présentiel

### 3. Intégration dans le système
- ✅ Composant enregistré dans `gameRegistry.ts`
- ✅ Support ajouté dans `ReactRenderer.tsx`
- ✅ Type de jeu : `introduction-quiz`

### 4. Base de données
- **Fichier SQL** : `creer-table-user-responses-quiz.sql`
- Table `user_responses` avec :
  - Stockage JSONB des réponses
  - RLS (Row Level Security)
  - Vue d'analyse `introduction_quiz_responses`
  - Index pour performances

### 5. Documentation
- **README** : `README-QUIZ-INTRODUCTION.md`
- Guide complet d'utilisation et d'intégration

## 🚀 Utilisation rapide

### Étape 1 : Créer la table (si pas déjà fait)
```sql
-- Exécuter le fichier SQL
\i creer-table-user-responses-quiz.sql
```

### Étape 2 : Intégrer dans votre cours JSON
```json
{
  "modules": [
    {
      "title": "Module 1 : Introduction",
      "items": [
        {
          "type": "game",
          "title": "Quiz d'introduction - Vos définitions et attentes",
          "position": 1,
          "published": true,
          "content": {
            "gameType": "introduction-quiz",
            "description": "Partagez votre compréhension...",
            "instructions": "Ce quiz n'a pas de bonne ou mauvaise réponse...",
            "questions": [
              {
                "id": "bigdata",
                "label": "D'après vous, qu'est-ce que le Big Data ?",
                "placeholder": "Exemple : Le Big Data représente pour moi..."
              },
              {
                "id": "machinelearning",
                "label": "Comment définiriez-vous le Machine Learning ?",
                "placeholder": "Exemple : Le Machine Learning est selon moi..."
              },
              {
                "id": "datascience",
                "label": "Qu'est-ce que la Data Science pour vous ?",
                "placeholder": "Exemple : La Data Science consiste à..."
              },
              {
                "id": "expectations",
                "label": "Qu'attendez-vous de ce cours ?",
                "placeholder": "Exemple : J'aimerais apprendre à..."
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### Étape 3 : Utiliser le quiz
1. Les participants répondent directement dans l'interface
2. Les réponses sont sauvegardées automatiquement
3. Vous pouvez analyser les réponses via la vue SQL ou Supabase

## 📊 Analyser les réponses

### Via SQL
```sql
SELECT * FROM introduction_quiz_responses;
```

### Via Supabase Dashboard
- Aller dans Table Editor > `user_responses`
- Filtrer par `quiz_type = 'introduction_big_data'`

## 🎯 Objectifs pédagogiques atteints

✅ Évaluation du niveau de départ  
✅ Engagement actif des participants  
✅ Identification des attentes  
✅ Référentiel pour mesurer l'évolution  

## 📚 Fichiers créés

1. `src/components/IntroductionQuiz.tsx` - Composant React
2. `quiz-introduction-big-data-interactif.json` - Configuration interactive ⭐
3. `quiz-introduction-big-data.json` - Configuration QCM
4. `quiz-introduction-big-data-formulaire.json` - Configuration slide
5. `creer-table-user-responses-quiz.sql` - Script SQL
6. `src/pages/trainer/TrainerQuizResponses.tsx` - Page formateur pour voir les réponses
7. `src/pages/admin/AdminQuizResponses.tsx` - Page admin pour voir les réponses
8. `README-QUIZ-INTRODUCTION.md` - Documentation complète
9. `ACCES-REPONSES-QUIZ.md` - Guide d'accès aux réponses pour formateurs/admins
10. `QUIZ-INTRODUCTION-RESUME.md` - Ce fichier

## 🔧 Modifications apportées

- `src/lib/gameRegistry.ts` - Enregistrement du nouveau type de jeu
- `src/components/ReactRenderer.tsx` - Support du rendu du quiz
- `src/App.tsx` - Routes ajoutées pour les pages formateur/admin
- `src/pages/admin/AdminCourseSubmissions.tsx` - Lien vers les réponses du quiz
- `src/pages/trainer/TrainerDashboard.tsx` - Lien vers les réponses du quiz

## ✅ Accès formateur/admin

**Les formateurs et administrateurs peuvent voir toutes les réponses !**

- ✅ Interface dédiée avec recherche et filtres
- ✅ Export CSV disponible
- ✅ Statistiques en temps réel
- ✅ Intégré dans le suivi pédagogique

Voir le fichier `ACCES-REPONSES-QUIZ.md` pour plus de détails.

## 💡 Prochaines étapes possibles

1. ✅ ~~Créer un dashboard formateur pour visualiser toutes les réponses~~ (FAIT)
2. Ajouter des statistiques avancées (nuage de mots, analyse de sentiment)
3. Comparer les définitions avant/après le cours
4. ✅ ~~Exporter les réponses en CSV~~ (FAIT)




---


### 📄 Résumé des fonctionnalités Titanic - Upload JSON et Analyse IA

*Source: `portal-formations/TITANIC-FEATURES-SUMMARY.md`*


---

# Résumé des fonctionnalités Titanic - Upload JSON et Analyse IA

## ✅ Fonctionnalités implémentées

### 1. Upload de JSON par les étudiants

**Fichiers créés :**
- `src/components/TitanicJsonUploader.tsx` - Composant d'upload
- `src/components/TitanicJsonUploader.css` - Styles du composant

**Fonctionnalités :**
- ✅ Upload de fichier JSON depuis l'application Titanic
- ✅ Validation automatique du format JSON
- ✅ Détection automatique du module (Big Data, Data Science, Machine Learning)
- ✅ Sauvegarde dans `submission.answer_json.titanicData`
- ✅ Messages d'erreur/succès clairs
- ✅ Instructions intégrées

**Intégration :**
- ✅ Ajouté dans `ItemRenderer.tsx` pour les TP de type Titanic
- ✅ Détection automatique basée sur le titre ou `content.titanicModule`

### 2. Analyse IA pour les formateurs

**Fichiers créés :**
- `src/lib/titanicAnalyzer.ts` - Service d'analyse IA
- `src/components/trainer/TitanicAnalysisPanel.tsx` - Panneau d'affichage
- `src/components/trainer/TitanicAnalysisPanel.css` - Styles du panneau

**Fonctionnalités :**
- ✅ Analyse IA des réponses Big Data / Data Science
- ✅ Analyse IA des prédictions Machine Learning
- ✅ Génération automatique de :
  - Résumé global
  - Points forts
  - Points faibles
  - Suggestions
  - Score estimé (sur 20)
  - Analyse détaillée
- ✅ Sauvegarde de l'analyse dans `submission.answer_json.aiAnalysis`
- ✅ Interface visuelle claire et structurée

**Intégration :**
- ✅ Ajouté dans `AdminCourseSubmissions.tsx`
- ✅ Affichage automatique pour les soumissions avec données Titanic

### 3. Documentation

**Fichiers créés :**
- `GUIDE-TITANIC-INTEGRATION.md` - Guide complet d'utilisation
- `TITANIC-FEATURES-SUMMARY.md` - Ce document

## 📋 Structure des données

### Format de stockage dans `submission.answer_json`

```json
{
  "titanicData": {
    "big-data-answers": { ... },
    "data-science-answers": { ... },
    "answers": { ... },
    "predictions": [ ... ]
  },
  "moduleType": "big-data" | "data-science" | "machine-learning",
  "uploadedAt": "2024-01-01T00:00:00.000Z",
  "fileName": "big-data-reponses.json",
  "aiAnalysis": {
    "summary": "...",
    "strengths": [ ... ],
    "weaknesses": [ ... ],
    "suggestions": [ ... ],
    "score": 15,
    "detailedAnalysis": "..."
  },
  "analyzedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Configuration requise

### Variables d'environnement

```env
VITE_OPENROUTER_API_KEY=sk-or-v1-...
VITE_OPENROUTER_MODEL=google/gemini-1.5-pro
```

### Détection des TP Titanic

Le système détecte automatiquement les TP Titanic si :
- Le titre contient "Titanic", "Big Data", "Data Science" ou "Machine Learning"
- OU `item.content.titanicModule` est défini

## 🎯 Workflow complet

### Étudiant
1. Complète le TP dans l'application Titanic
2. Exporte les réponses (JSON)
3. Importe le JSON dans le LMS
4. Les données sont sauvegardées automatiquement

### Formateur
1. Accède aux soumissions du cours
2. Ouvre une soumission avec données Titanic
3. Clique sur "Analyser avec l'IA"
4. Consulte l'analyse générée
5. Utilise l'analyse pour noter et donner du feedback

## 📊 Avantages

### Pour les étudiants
- ✅ Pas besoin de copier-coller manuellement
- ✅ Données structurées et complètes
- ✅ Validation automatique

### Pour les formateurs
- ✅ Gain de temps considérable
- ✅ Analyse objective et détaillée
- ✅ Suggestions d'amélioration
- ✅ Score estimé pour guider la notation
- ✅ Focus sur le feedback plutôt que l'analyse manuelle

## 🚀 Prochaines améliorations possibles

- [ ] Export de l'analyse IA en PDF
- [ ] Comparaison entre plusieurs étudiants
- [ ] Statistiques globales par module
- [ ] Historique des analyses
- [ ] Personnalisation des prompts d'analyse
- [ ] Support de plusieurs langues pour l'analyse

## 📝 Notes techniques

- L'analyse IA utilise OpenRouter avec le modèle Gemini 1.5 Pro par défaut
- Les données sont stockées en JSONB dans PostgreSQL
- Le système est extensible pour d'autres types de données JSON
- L'interface est responsive et accessible

---

**Fonctionnalités prêtes à l'emploi ! 🎉**



---


### 📄 Dashboard Formateur - Guide d'installation et d'utilisation

*Source: `portal-formations/TRAINER-DASHBOARD.md`*


---

# Dashboard Formateur - Guide d'installation et d'utilisation

## Vue d'ensemble

Le dashboard Formateur est un système complet de suivi et d'analyse pour les formateurs et administrateurs. Il permet de :

- Visualiser les KPIs en temps réel (apprenants actifs, taux de complétion, scores moyens)
- Suivre la progression des apprenants par session
- Analyser les modules et exercices en difficulté
- Gérer des notes privées par formateur

## Prérequis

- Node.js 18+ et npm
- Un projet Supabase configuré
- Les variables d'environnement Supabase configurées (voir `.env.example`)

## Installation

### 1. Exécuter le schéma SQL

Exécutez le fichier `trainer-schema.sql` dans l'interface SQL de Supabase pour créer les tables nécessaires :

```sql
-- Exécuter trainer-schema.sql dans Supabase SQL Editor
```

Ce schéma crée les tables suivantes :
- `orgs` : Organisations
- `org_members` : Membres d'organisation avec rôles
- `sessions` : Sessions de formation
- `exercises` : Détails des exercices
- `exercise_attempts` : Tentatives d'exercices
- `module_progress` : Progression par module
- `activity_events` : Événements d'activité
- `trainer_notes` : Notes privées formateur

### 2. Configuration des variables d'environnement

Assurez-vous que votre fichier `.env` contient :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

### 3. Installation des dépendances

```bash
npm install
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

## Structure du code

```
src/
├── components/
│   └── trainer/
│       ├── KPICard.tsx          # Carte KPI réutilisable
│       ├── AlertCard.tsx         # Carte d'alerte
│       ├── LearnersTable.tsx     # Table des apprenants
│       └── TrainerRouteGuard.tsx # Guard de route pour formateurs
├── pages/
│   └── trainer/
│       ├── TrainerDashboard.tsx  # Page principale (/trainer)
│       ├── SessionLearners.tsx   # Liste apprenants (/trainer/session/:id)
│       ├── SessionAnalytics.tsx  # Analyses (/trainer/analytics/:id)
│       └── TrainerNotes.tsx      # Notes privées (/trainer/notes)
├── lib/
│   └── queries/
│       └── trainerQueries.ts    # Toutes les requêtes Supabase
└── utils/
    └── trainerUtils.ts           # Utilitaires (format, dates, etc.)
```

## Utilisation

### Accès au dashboard

1. Connectez-vous avec un compte ayant le rôle `trainer` ou `admin` dans `org_members`
2. Accédez à `/trainer`

### Pages disponibles

#### 1. Dashboard principal (`/trainer`)

Affiche :
- **KPIs** : Apprenants actifs (7j), taux de complétion, score moyen, modules en difficulté
- **Alertes** : Notifications automatiques (apprenants inactifs, modules en difficulté, etc.)
- **Actions rapides** : Liens vers les autres pages

#### 2. Liste des apprenants (`/trainer/session/:sessionId`)

Affiche pour chaque apprenant :
- Nom d'affichage
- Pourcentage de complétion
- Score moyen
- Dernière activité
- Blocage principal

Actions disponibles :
- **Relancer** : Envoyer un rappel (à implémenter)
- **Ressource** : Assigner une ressource (à implémenter)
- **Note** : Ajouter une note privée

#### 3. Analyses détaillées (`/trainer/analytics/:sessionId`)

Deux onglets :

**Modules en difficulté** :
- Taux d'abandon
- Temps moyen de complétion
- Score moyen

**Exercices** :
- Taux d'échec
- Score moyen
- Erreurs fréquentes

#### 4. Notes privées (`/trainer/notes`)

CRUD complet pour les notes privées :
- Créer, modifier, supprimer
- Filtrer par course, module, session, utilisateur
- Tags pour organisation
- Notes privées par défaut

## Requêtes Supabase

Toutes les requêtes sont centralisées dans `src/lib/queries/trainerQueries.ts` :

- `getTrainerContext()` : Récupère l'org et le rôle du formateur
- `getSessions(orgId)` : Liste des sessions actives
- `getSessionKPIs(sessionId)` : KPIs d'une session
- `getLearnersTable(sessionId)` : Table des apprenants
- `getModuleAnalytics(sessionId)` : Analytics des modules
- `getExerciseAnalytics(sessionId)` : Analytics des exercices
- `getTrainerNotes()` : Liste des notes
- `createTrainerNote()` : Créer une note
- `updateTrainerNote()` : Modifier une note
- `deleteTrainerNote()` : Supprimer une note

## Sécurité

### Row Level Security (RLS)

Toutes les tables ont des policies RLS activées :
- Les formateurs peuvent voir les données de leur organisation
- Les apprenants ne peuvent voir que leurs propres données
- Les admins peuvent tout voir

### Route Guards

Le composant `TrainerRouteGuard` vérifie :
- L'authentification de l'utilisateur
- Le rôle dans `org_members` (doit être `trainer` ou `admin`)
- Redirige vers `/login` ou affiche "Accès refusé" si non autorisé

## Données de test

Pour tester le dashboard, vous devez :

1. **Créer une organisation** :
```sql
INSERT INTO orgs (id, name, slug) VALUES
  (gen_random_uuid(), 'Organisation Test', 'org-test');
```

2. **Créer un membre formateur** :
```sql
-- Remplacez USER_ID par l'ID d'un utilisateur existant
INSERT INTO org_members (org_id, user_id, role, display_name)
SELECT 
  (SELECT id FROM orgs LIMIT 1),
  'USER_ID',
  'trainer',
  'Formateur Test';
```

3. **Créer une session** :
```sql
-- Remplacez COURSE_ID et USER_ID
INSERT INTO sessions (org_id, course_id, title, status, created_by)
SELECT 
  (SELECT id FROM orgs LIMIT 1),
  'COURSE_ID',
  'Session Test',
  'active',
  'USER_ID';
```

## Optimisations possibles

### Vues SQL (optionnel)

Pour améliorer les performances, vous pouvez créer des vues SQL :

```sql
-- Vue pour les KPIs de session
CREATE VIEW session_kpis_view AS
SELECT 
  s.id as session_id,
  COUNT(DISTINCT ae.user_id) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '7 days') as active_learners_7d,
  -- ... autres calculs
FROM sessions s
LEFT JOIN activity_events ae ON ae.session_id = s.id
GROUP BY s.id;
```

### Pagination

Les requêtes actuelles chargent toutes les données. Pour de grandes sessions, ajoutez la pagination :

```typescript
const { data, error } = await supabase
  .from('learners')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1);
```

## Dépannage

### Erreur "Aucune organisation trouvée"

- Vérifiez que l'utilisateur a un enregistrement dans `org_members` avec le rôle `trainer` ou `admin`

### Erreur "Accès refusé"

- Vérifiez les policies RLS dans Supabase
- Vérifiez que l'utilisateur est bien authentifié

### Données vides

- Vérifiez que les sessions existent et sont actives
- Vérifiez que les enrollments sont liés aux bons cours
- Vérifiez que les activity_events sont créés lors des interactions

## Prochaines étapes

- [ ] Implémenter la relance par email
- [ ] Implémenter l'assignation de ressources
- [ ] Ajouter des graphiques (Chart.js ou Recharts)
- [ ] Exporter les données en CSV/Excel
- [ ] Notifications en temps réel (Supabase Realtime)
- [ ] Mode offline (PWA)

## Support

Pour toute question ou problème, consultez la documentation Supabase ou ouvrez une issue.






---


### 📄 Backend API avec Swagger - Portal Formations

*Source: `portal-formations/server/README.md`*


---

# Backend API avec Swagger - Portal Formations

Ce dossier contient le serveur Express avec Swagger UI pour documenter l'API.

## 🚀 Démarrage rapide

### Installation des dépendances

```bash
npm install
```

### Démarrer le serveur de développement

```bash
npm run dev:server
```

Le serveur démarre sur `http://localhost:3001`

### Démarrer le serveur en production

```bash
npm run server
```

## 📚 Accès à la documentation Swagger

Une fois le serveur démarré, accédez à :

- **Swagger UI** : http://localhost:3001/docs
- **OpenAPI Spec (YAML)** : http://localhost:3001/openapi
- **OpenAPI Spec (JSON)** : http://localhost:3001/openapi.json

## 📁 Structure du projet

```
server/
├── src/
│   ├── server.ts          # Point d'entrée du serveur Express
│   ├── docs/
│   │   └── swagger.ts     # Configuration Swagger UI
│   ├── routes/
│   │   └── index.ts       # Routes API
│   ├── middlewares/
│   │   └── errorHandler.ts # Gestion des erreurs
│   └── openapi/
│       └── openapi.yaml   # Spécification OpenAPI
├── tsconfig.json          # Configuration TypeScript
└── README.md
```

## 🔧 Ajouter de nouvelles routes

1. Créer un nouveau fichier dans `src/routes/` (ex: `courses.ts`)
2. Définir les routes avec Express Router
3. Importer et utiliser dans `src/routes/index.ts`
4. Documenter les routes dans `src/openapi/openapi.yaml`

### Exemple de route

```typescript
// src/routes/courses.ts
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Liste des cours' });
});

export default router;
```

Puis dans `src/routes/index.ts` :

```typescript
import coursesRouter from './courses.js';

router.use('/courses', coursesRouter);
```

## 📝 Documenter les routes dans OpenAPI

Éditez `src/openapi/openapi.yaml` pour ajouter la documentation de vos nouvelles routes.

Exemple :

```yaml
paths:
  /api/courses:
    get:
      tags:
        - Courses
      summary: Liste tous les cours
      responses:
        '200':
          description: Liste des cours
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Course'
```

## 🛠️ Scripts disponibles

- `npm run dev:server` : Démarre le serveur en mode développement avec rechargement automatique
- `npm run server` : Démarre le serveur en mode production

## 🔐 Authentification

L'API utilise JWT Bearer tokens (via Supabase). Pour tester avec authentification dans Swagger UI :

1. Cliquez sur le bouton "Authorize" en haut de la page Swagger
2. Entrez votre token JWT : `Bearer <votre-token>`
3. Cliquez sur "Authorize"

## 📦 Dépendances principales

- `express` : Framework web
- `swagger-ui-express` : Interface Swagger UI
- `js-yaml` : Parser YAML pour OpenAPI
- `cors` : Gestion CORS
- `tsx` : Exécution TypeScript en développement





---
