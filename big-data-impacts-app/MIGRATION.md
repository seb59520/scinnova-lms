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


