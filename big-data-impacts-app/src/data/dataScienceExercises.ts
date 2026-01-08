import type { DataScienceExercise } from '../types/dataScience';

/**
 * Base de données des exercices Data Science
 */
export const dataScienceExercises: DataScienceExercise[] = [
  {
    id: 'ex1-data-exploration',
    title: 'Exploration et analyse exploratoire de données',
    description: 'Analysez un dataset de ventes e-commerce pour identifier les patterns et insights clés',
    type: 'data-analysis',
    difficulty: 'beginner',
    dataset: {
      name: 'Ventes e-commerce',
      description: 'Dataset contenant les ventes d\'un site e-commerce sur 6 mois',
      columns: ['date', 'produit', 'categorie', 'prix', 'quantite', 'region', 'client_id'],
      sampleSize: 10000
    },
    instructions: [
      'Chargez le dataset et examinez sa structure',
      'Identifiez les valeurs manquantes et les outliers',
      'Calculez les statistiques descriptives (moyenne, médiane, écart-type)',
      'Identifiez les corrélations entre les variables',
      'Formulez 3 insights clés sur les données'
    ],
    questions: [
      {
        id: 'q1-stats',
        type: 'numeric',
        prompt: 'Quelle est la moyenne des prix des produits ?',
        answer: 0, // Sera calculé dynamiquement
        explanation: 'La moyenne se calcule en additionnant tous les prix et en divisant par le nombre de produits'
      },
      {
        id: 'q2-insights',
        type: 'text',
        prompt: 'Quels sont les 3 insights principaux que vous avez identifiés ?',
        explanation: 'Les insights doivent être basés sur les données analysées et être actionnables'
      },
      {
        id: 'q3-correlation',
        type: 'mcq',
        prompt: 'Quelle est la corrélation la plus forte observée ?',
        options: [
          'Prix et Quantité',
          'Région et Catégorie',
          'Date et Prix',
          'Quantité et Catégorie'
        ],
        answer: 'Prix et Quantité',
        explanation: 'La corrélation entre prix et quantité est généralement négative (plus le prix est élevé, moins on vend)'
      }
    ],
    expectedOutput: {
      type: 'visualization',
      description: 'Graphiques montrant la distribution des prix, les ventes par catégorie, et les corrélations'
    },
    hints: [
      'Utilisez pandas pour charger et explorer les données',
      'Utilisez describe() pour les statistiques descriptives',
      'Utilisez corr() pour les corrélations',
      'Visualisez avec matplotlib ou seaborn'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ex2-model-classification',
    title: 'Création d\'un modèle de classification',
    description: 'Créez un modèle pour prédire si un client va acheter un produit',
    type: 'model-building',
    difficulty: 'intermediate',
    dataset: {
      name: 'Comportement clients',
      description: 'Dataset avec les caractéristiques des clients et leur comportement d\'achat',
      columns: ['age', 'revenu', 'historique_achats', 'temps_site', 'pages_vues', 'a_achete'],
      sampleSize: 5000
    },
    instructions: [
      'Préparez les données (encodage, normalisation)',
      'Divisez en train/test (80/20)',
      'Entraînez un modèle de classification (Logistic Regression ou Random Forest)',
      'Évaluez le modèle avec les métriques appropriées',
      'Interprétez les résultats'
    ],
    questions: [
      {
        id: 'q1-algorithm',
        type: 'mcq',
        prompt: 'Quel algorithme avez-vous choisi et pourquoi ?',
        options: [
          'Logistic Regression - Simple et interprétable',
          'Random Forest - Bonne performance et robustesse',
          'SVM - Bon pour les données non-linéaires',
          'Tous les trois sont valides selon le contexte'
        ],
        answer: 'Tous les trois sont valides selon le contexte',
        explanation: 'Le choix dépend du contexte : Logistic Regression pour l\'interprétabilité, Random Forest pour la performance, SVM pour les cas complexes'
      },
      {
        id: 'q2-metrics',
        type: 'mcq',
        prompt: 'Quelles métriques sont les plus appropriées pour ce problème ?',
        options: [
          'Accuracy uniquement',
          'Precision, Recall, F1-score',
          'RMSE uniquement',
          'R² uniquement'
        ],
        answer: 'Precision, Recall, F1-score',
        explanation: 'Pour la classification, surtout avec classes déséquilibrées, Precision, Recall et F1-score sont essentielles'
      },
      {
        id: 'q3-performance',
        type: 'numeric',
        prompt: 'Quelle est la précision (accuracy) de votre modèle sur le test set ?',
        answer: 0,
        explanation: 'L\'accuracy se calcule comme (vrais positifs + vrais négatifs) / total'
      }
    ],
    expectedOutput: {
      type: 'metric',
      description: 'Métriques de performance : Accuracy, Precision, Recall, F1-score, Matrice de confusion'
    },
    hints: [
      'Utilisez train_test_split de sklearn',
      'Normalisez les features numériques',
      'Encodez les variables catégorielles',
      'Utilisez cross-validation pour valider'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ex3-visualization',
    title: 'Visualisation de données complexes',
    description: 'Créez des visualisations pour communiquer les insights d\'un dataset de santé',
    type: 'visualization',
    difficulty: 'beginner',
    dataset: {
      name: 'Données de santé',
      description: 'Dataset anonymisé avec des indicateurs de santé',
      columns: ['age', 'bmi', 'tension', 'cholesterol', 'glucose', 'diabete'],
      sampleSize: 2000
    },
    instructions: [
      'Créez un histogramme de la distribution de l\'âge',
      'Créez un scatter plot montrant la relation entre BMI et tension',
      'Créez un heatmap des corrélations',
      'Créez un graphique montrant la prévalence du diabète par groupe d\'âge'
    ],
    questions: [
      {
        id: 'q1-chart-type',
        type: 'mcq',
        prompt: 'Quel type de graphique est le plus approprié pour montrer la distribution de l\'âge ?',
        options: [
          'Ligne',
          'Histogramme',
          'Scatter plot',
          'Pie chart'
        ],
        answer: 'Histogramme',
        explanation: 'L\'histogramme est idéal pour visualiser la distribution d\'une variable continue'
      },
      {
        id: 'q2-insight',
        type: 'text',
        prompt: 'Quel insight principal pouvez-vous tirer de vos visualisations ?',
        explanation: 'L\'insight doit être clair, basé sur les données, et actionnable'
      }
    ],
    expectedOutput: {
      type: 'visualization',
      description: '4 graphiques : histogramme, scatter plot, heatmap, graphique de prévalence'
    },
    hints: [
      'Utilisez matplotlib ou seaborn',
      'Ajoutez des labels et titres clairs',
      'Choisissez des couleurs accessibles',
      'Assurez-vous que les graphiques sont lisibles'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ex4-model-interpretation',
    title: 'Interprétation d\'un modèle de Machine Learning',
    description: 'Analysez et interprétez les résultats d\'un modèle de prédiction de crédit',
    type: 'interpretation',
    difficulty: 'advanced',
    dataset: {
      name: 'Scoring crédit',
      description: 'Modèle entraîné pour prédire le risque de défaut de crédit',
      columns: ['revenu', 'duree_emploi', 'montant_credit', 'historique', 'age', 'risque'],
      sampleSize: 3000
    },
    instructions: [
      'Analysez l\'importance des features',
      'Identifiez les features les plus influentes',
      'Expliquez comment le modèle prend ses décisions',
      'Identifiez les biais potentiels'
    ],
    questions: [
      {
        id: 'q1-feature-importance',
        type: 'mcq',
        prompt: 'Quelle feature est la plus importante pour la prédiction ?',
        options: [
          'Revenu',
          'Durée d\'emploi',
          'Historique de crédit',
          'Montant du crédit'
        ],
        answer: 'Historique de crédit',
        explanation: 'L\'historique de crédit est généralement le meilleur prédicteur du risque de défaut'
      },
      {
        id: 'q2-bias',
        type: 'text',
        prompt: 'Y a-t-il des biais potentiels dans ce modèle ? Si oui, lesquels ?',
        explanation: 'Les biais peuvent être liés à l\'âge, au genre, à la région, etc.'
      }
    ],
    expectedOutput: {
      type: 'text',
      description: 'Rapport d\'interprétation avec importance des features, explications, et identification des biais'
    },
    hints: [
      'Utilisez SHAP values pour l\'interprétabilité',
      'Analysez les distributions par groupe',
      'Testez le modèle sur différents sous-groupes',
      'Vérifiez les corrélations avec des variables protégées'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ex5-preprocessing',
    title: 'Préparation et nettoyage de données',
    description: 'Préparez un dataset brut pour l\'analyse',
    type: 'preprocessing',
    difficulty: 'intermediate',
    dataset: {
      name: 'Données brutes',
      description: 'Dataset avec valeurs manquantes, outliers, et incohérences',
      columns: ['nom', 'age', 'email', 'salaire', 'departement', 'date_embauche'],
      sampleSize: 5000
    },
    instructions: [
      'Identifiez et traitez les valeurs manquantes',
      'Détectez et gérez les outliers',
      'Standardisez les formats (dates, emails)',
      'Vérifiez les incohérences',
      'Créez des features dérivées si nécessaire'
    ],
    questions: [
      {
        id: 'q1-missing',
        type: 'mcq',
        prompt: 'Quelle stratégie avez-vous utilisée pour les valeurs manquantes ?',
        options: [
          'Suppression des lignes',
          'Imputation par la moyenne/médiane',
          'Imputation par prédiction',
          'Toutes les stratégies peuvent être valides selon le contexte'
        ],
        answer: 'Toutes les stratégies peuvent être valides selon le contexte',
        explanation: 'Le choix dépend du pourcentage de valeurs manquantes, de leur nature (MCAR, MAR, MNAR), et du contexte métier'
      },
      {
        id: 'q2-outliers',
        type: 'text',
        prompt: 'Comment avez-vous détecté et traité les outliers ?',
        explanation: 'Les méthodes courantes incluent IQR, Z-score, isolation forest'
      }
    ],
    expectedOutput: {
      type: 'code',
      description: 'Code Python avec toutes les étapes de preprocessing documentées'
    },
    hints: [
      'Utilisez isnull() pour identifier les valeurs manquantes',
      'Utilisez IQR ou Z-score pour les outliers',
      'Validez les formats avec des regex',
      'Documentez chaque étape'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * Obtenir les exercices par type
 */
export function getExercisesByType(type: DataScienceExercise['type']): DataScienceExercise[] {
  return dataScienceExercises.filter(ex => ex.type === type);
}

/**
 * Obtenir les exercices par difficulté
 */
export function getExercisesByDifficulty(difficulty: DataScienceExercise['difficulty']): DataScienceExercise[] {
  return dataScienceExercises.filter(ex => ex.difficulty === difficulty);
}

/**
 * Obtenir un exercice par ID
 */
export function getExerciseById(id: string): DataScienceExercise | undefined {
  return dataScienceExercises.find(ex => ex.id === id);
}


