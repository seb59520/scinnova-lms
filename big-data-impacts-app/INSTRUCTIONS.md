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


