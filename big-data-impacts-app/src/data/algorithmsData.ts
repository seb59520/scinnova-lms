import type { AlgorithmInfo } from '../types/dataScience';

/**
 * Base de données des algorithmes de Machine Learning
 * avec descriptions, cas d'usage, et guide d'utilisation
 */
export const algorithmsDatabase: AlgorithmInfo[] = [
  {
    name: 'Régression Linéaire',
    category: 'supervised',
    description: 'Modèle simple pour prédire une valeur continue en utilisant une relation linéaire entre les features',
    useCases: [
      'Prédiction de prix',
      'Prévision de ventes',
      'Analyse de tendances',
      'Modélisation de relations simples'
    ],
    parameters: [
      {
        name: 'fit_intercept',
        description: 'Calculer ou non l\'ordonnée à l\'origine',
        type: 'boolean',
        default: true
      },
      {
        name: 'normalize',
        description: 'Normaliser les features avant la régression',
        type: 'boolean',
        default: false
      }
    ],
    pros: [
      'Simple et rapide',
      'Facile à interpréter',
      'Pas de sur-apprentissage si bien régularisé',
      'Bon point de départ'
    ],
    cons: [
      'Assume une relation linéaire',
      'Sensible aux outliers',
      'Peut mal performer sur des données complexes'
    ],
    whenToUse: 'Quand vous avez une relation linéaire claire entre les variables et que vous voulez un modèle simple et interprétable'
  },
  {
    name: 'Régression Logistique',
    category: 'supervised',
    description: 'Modèle de classification pour prédire la probabilité qu\'une observation appartienne à une classe',
    useCases: [
      'Classification binaire (spam/not spam)',
      'Prédiction de churn',
      'Diagnostic médical',
      'Détection de fraude'
    ],
    parameters: [
      {
        name: 'C',
        description: 'Inverse de la force de régularisation (plus petit = plus de régularisation)',
        type: 'float',
        default: 1.0
      },
      {
        name: 'penalty',
        description: 'Type de régularisation (l1, l2, elasticnet)',
        type: 'string',
        default: 'l2'
      }
    ],
    pros: [
      'Interprétable (probabilités)',
      'Rapide à entraîner',
      'Bon pour la classification binaire',
      'Résultats probabilistes'
    ],
    cons: [
      'Assume une relation linéaire',
      'Peut mal performer sur des données non-linéaires',
      'Sensible au déséquilibre des classes'
    ],
    whenToUse: 'Pour la classification binaire quand vous voulez des probabilités et une interprétabilité. Bon point de départ pour les problèmes de classification.'
  },
  {
    name: 'Random Forest',
    category: 'supervised',
    description: 'Ensemble d\'arbres de décision qui vote pour la prédiction finale',
    useCases: [
      'Classification multi-classes',
      'Régression',
      'Sélection de features',
      'Problèmes avec beaucoup de features'
    ],
    parameters: [
      {
        name: 'n_estimators',
        description: 'Nombre d\'arbres dans la forêt',
        type: 'int',
        default: 100
      },
      {
        name: 'max_depth',
        description: 'Profondeur maximale des arbres',
        type: 'int',
        default: null
      },
      {
        name: 'min_samples_split',
        description: 'Nombre minimum d\'échantillons pour diviser un nœud',
        type: 'int',
        default: 2
      }
    ],
    pros: [
      'Très performant',
      'Gère bien les données non-linéaires',
      'Résistant au sur-apprentissage',
      'Peut gérer les valeurs manquantes',
      'Importance des features'
    ],
    cons: [
      'Moins interprétable qu\'un arbre simple',
      'Peut être lent sur de très gros datasets',
      'Utilise beaucoup de mémoire'
    ],
    whenToUse: 'Quand vous voulez de bonnes performances sans trop de tuning, et que l\'interprétabilité n\'est pas critique'
  },
  {
    name: 'K-Means',
    category: 'unsupervised',
    description: 'Algorithme de clustering qui groupe les données en k clusters basés sur la similarité',
    useCases: [
      'Segmentation client',
      'Groupement de documents',
      'Compression d\'images',
      'Détection d\'anomalies'
    ],
    parameters: [
      {
        name: 'n_clusters',
        description: 'Nombre de clusters à former',
        type: 'int',
        default: 8
      },
      {
        name: 'init',
        description: 'Méthode d\'initialisation (k-means++, random)',
        type: 'string',
        default: 'k-means++'
      },
      {
        name: 'max_iter',
        description: 'Nombre maximum d\'itérations',
        type: 'int',
        default: 300
      }
    ],
    pros: [
      'Simple et rapide',
      'Scalable',
      'Bon pour les données sphériques',
      'Facile à comprendre'
    ],
    cons: [
      'Doit spécifier k à l\'avance',
      'Sensible aux outliers',
      'Assume des clusters sphériques',
      'Sensible à l\'initialisation'
    ],
    whenToUse: 'Quand vous voulez découvrir des groupes dans vos données sans labels, et que vous avez une idée du nombre de clusters'
  },
  {
    name: 'Réseaux de Neurones (Neural Networks)',
    category: 'deep-learning',
    description: 'Modèles inspirés du cerveau avec plusieurs couches de neurones pour apprendre des patterns complexes',
    useCases: [
      'Reconnaissance d\'images',
      'Traitement du langage naturel',
      'Recommandation',
      'Prédictions complexes'
    ],
    parameters: [
      {
        name: 'hidden_layers',
        description: 'Nombre et taille des couches cachées',
        type: 'list[int]',
        default: [100, 50]
      },
      {
        name: 'activation',
        description: 'Fonction d\'activation (relu, sigmoid, tanh)',
        type: 'string',
        default: 'relu'
      },
      {
        name: 'learning_rate',
        description: 'Taux d\'apprentissage',
        type: 'float',
        default: 0.001
      }
    ],
    pros: [
      'Très puissant pour les patterns complexes',
      'Peut apprendre des représentations',
      'Bon pour les données non-structurées',
      'Flexible'
    ],
    cons: [
      'Besoin de beaucoup de données',
      'Coûteux en calcul',
      'Difficile à interpréter',
      'Risque de sur-apprentissage',
      'Nécessite du tuning'
    ],
    whenToUse: 'Quand vous avez beaucoup de données, des patterns complexes, et que la performance est plus importante que l\'interprétabilité'
  },
  {
    name: 'XGBoost',
    category: 'supervised',
    description: 'Implémentation optimisée de gradient boosting, très performante pour les compétitions',
    useCases: [
      'Compétitions Kaggle',
      'Prédictions business',
      'Classification et régression',
      'Quand la performance est critique'
    ],
    parameters: [
      {
        name: 'n_estimators',
        description: 'Nombre d\'arbres',
        type: 'int',
        default: 100
      },
      {
        name: 'learning_rate',
        description: 'Taux d\'apprentissage',
        type: 'float',
        default: 0.1
      },
      {
        name: 'max_depth',
        description: 'Profondeur maximale des arbres',
        type: 'int',
        default: 6
      }
    ],
    pros: [
      'Très performant',
      'Gère bien les valeurs manquantes',
      'Résistant au sur-apprentissage',
      'Bon pour les compétitions'
    ],
    cons: [
      'Complexe à tuner',
      'Moins interprétable',
      'Peut être lent',
      'Sensible aux hyperparamètres'
    ],
    whenToUse: 'Quand vous voulez les meilleures performances possibles et que vous êtes prêt à investir du temps dans le tuning'
  }
];

/**
 * Obtenir les algorithmes par catégorie
 */
export function getAlgorithmsByCategory(category: AlgorithmInfo['category']): AlgorithmInfo[] {
  return algorithmsDatabase.filter(alg => alg.category === category);
}

/**
 * Rechercher un algorithme
 */
export function searchAlgorithms(query: string): AlgorithmInfo[] {
  const lowerQuery = query.toLowerCase();
  return algorithmsDatabase.filter(
    alg =>
      alg.name.toLowerCase().includes(lowerQuery) ||
      alg.description.toLowerCase().includes(lowerQuery) ||
      alg.useCases.some(uc => uc.toLowerCase().includes(lowerQuery))
  );
}


