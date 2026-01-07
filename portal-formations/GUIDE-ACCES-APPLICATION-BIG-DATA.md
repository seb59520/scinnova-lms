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

