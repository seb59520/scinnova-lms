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


