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
