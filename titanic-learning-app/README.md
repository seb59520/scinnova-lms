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
