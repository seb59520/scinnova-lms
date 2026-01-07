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

