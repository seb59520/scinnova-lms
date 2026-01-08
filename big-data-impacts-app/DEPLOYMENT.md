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


