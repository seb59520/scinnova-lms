import type { MetricInfo } from '../types/dataScience';

/**
 * Base de données des métriques d'évaluation
 * avec formules, interprétations, et guide d'utilisation
 */
export const metricsDatabase: MetricInfo[] = [
  // Métriques de classification
  {
    name: 'Accuracy',
    category: 'classification',
    description: 'Proportion de prédictions correctes parmi toutes les prédictions',
    formula: '(TP + TN) / (TP + TN + FP + FN)',
    interpretation: 'Pourcentage de bonnes prédictions. Utile quand les classes sont équilibrées.',
    range: '0 à 1 (ou 0% à 100%)',
    bestValue: 'higher',
    examples: [
      '95% accuracy = 95 prédictions correctes sur 100',
      'Utile pour les problèmes équilibrés',
      'Peut être trompeur avec classes déséquilibrées'
    ]
  },
  {
    name: 'Precision',
    category: 'classification',
    description: 'Proportion de vrais positifs parmi toutes les prédictions positives',
    formula: 'TP / (TP + FP)',
    interpretation: 'Quand le modèle prédit "positif", à quel point est-il fiable ? Important quand les faux positifs sont coûteux.',
    range: '0 à 1',
    bestValue: 'higher',
    examples: [
      'Precision de 0.9 = 90% des prédictions positives sont correctes',
      'Important pour la détection de fraude (éviter les fausses alertes)',
      'Important pour le diagnostic médical (éviter les faux diagnostics)'
    ]
  },
  {
    name: 'Recall (Sensibilité)',
    category: 'classification',
    description: 'Proportion de vrais positifs parmi tous les vrais positifs',
    formula: 'TP / (TP + FN)',
    interpretation: 'Quelle proportion des cas positifs réels le modèle détecte-t-il ? Important quand les faux négatifs sont coûteux.',
    range: '0 à 1',
    bestValue: 'higher',
    examples: [
      'Recall de 0.8 = le modèle détecte 80% des cas positifs',
      'Important pour la détection de cancer (ne pas rater de cas)',
      'Important pour la sécurité (ne pas rater de menaces)'
    ]
  },
  {
    name: 'F1-Score',
    category: 'classification',
    description: 'Moyenne harmonique de Precision et Recall',
    formula: '2 × (Precision × Recall) / (Precision + Recall)',
    interpretation: 'Équilibre entre Precision et Recall. Utile quand vous voulez un compromis entre les deux.',
    range: '0 à 1',
    bestValue: 'higher',
    examples: [
      'F1 de 0.85 = bon équilibre entre précision et rappel',
      'Utile pour comparer des modèles',
      'Bon métrique général pour la classification'
    ]
  },
  {
    name: 'AUC-ROC',
    category: 'classification',
    description: 'Aire sous la courbe ROC - mesure la capacité du modèle à distinguer les classes',
    formula: 'Aire sous la courbe (TPR vs FPR)',
    interpretation: 'Capacité du modèle à séparer les classes. 0.5 = aléatoire, 1.0 = parfait.',
    range: '0 à 1',
    bestValue: 'higher',
    examples: [
      'AUC de 0.9 = excellent modèle',
      'AUC de 0.7 = modèle acceptable',
      'AUC de 0.5 = modèle inutile (aléatoire)'
    ]
  },
  // Métriques de régression
  {
    name: 'RMSE (Root Mean Squared Error)',
    category: 'regression',
    description: 'Racine carrée de la moyenne des erreurs au carré',
    formula: '√(Σ(y_true - y_pred)² / n)',
    interpretation: 'Erreur moyenne en unités de la variable cible. Pénalise les grandes erreurs.',
    range: '0 à +∞',
    bestValue: 'lower',
    examples: [
      'RMSE de 10€ pour un modèle de prix = erreur moyenne de 10€',
      'Utile quand les grandes erreurs sont très pénalisantes',
      'Même unité que la variable cible'
    ]
  },
  {
    name: 'MAE (Mean Absolute Error)',
    category: 'regression',
    description: 'Moyenne des valeurs absolues des erreurs',
    formula: 'Σ|y_true - y_pred| / n',
    interpretation: 'Erreur moyenne absolue. Moins sensible aux outliers que RMSE.',
    range: '0 à +∞',
    bestValue: 'lower',
    examples: [
      'MAE de 5€ = erreur moyenne de 5€ en valeur absolue',
      'Plus robuste aux outliers que RMSE',
      'Plus facile à interpréter'
    ]
  },
  {
    name: 'R² (Coefficient de détermination)',
    category: 'regression',
    description: 'Proportion de variance expliquée par le modèle',
    formula: '1 - (SS_res / SS_tot)',
    interpretation: 'Pourcentage de variance expliquée. 1.0 = parfait, 0.0 = pas mieux que la moyenne, négatif = pire que la moyenne.',
    range: '-∞ à 1',
    bestValue: 'higher',
    examples: [
      'R² de 0.85 = le modèle explique 85% de la variance',
      'R² de 0.5 = le modèle explique 50% de la variance',
      'R² négatif = le modèle est pire que prédire la moyenne'
    ]
  },
  // Métriques de clustering
  {
    name: 'Silhouette Score',
    category: 'clustering',
    description: 'Mesure de la qualité du clustering (cohésion intra-cluster vs séparation inter-cluster)',
    formula: '(b - a) / max(a, b) où a = distance moyenne intra-cluster, b = distance moyenne au cluster le plus proche',
    interpretation: 'Score proche de 1 = clusters bien séparés et cohésifs. Score proche de -1 = mauvais clustering.',
    range: '-1 à 1',
    bestValue: 'higher',
    examples: [
      'Silhouette de 0.7 = bon clustering',
      'Silhouette de 0.3 = clustering acceptable',
      'Silhouette négatif = points mal assignés'
    ]
  },
  {
    name: 'Inertie (Within-cluster sum of squares)',
    category: 'clustering',
    description: 'Somme des distances au carré entre chaque point et son centroïde',
    formula: 'Σ ||x - centroid||²',
    interpretation: 'Mesure de la compacité des clusters. Plus bas = clusters plus compacts.',
    range: '0 à +∞',
    bestValue: 'lower',
    examples: [
      'Inertie de 100 = clusters relativement compacts',
      'Utilisé dans K-Means pour optimiser',
      'Tendance à diminuer avec plus de clusters'
    ]
  }
];

/**
 * Obtenir les métriques par catégorie
 */
export function getMetricsByCategory(category: MetricInfo['category']): MetricInfo[] {
  return metricsDatabase.filter(metric => metric.category === category);
}

/**
 * Rechercher une métrique
 */
export function searchMetrics(query: string): MetricInfo[] {
  const lowerQuery = query.toLowerCase();
  return metricsDatabase.filter(
    metric =>
      metric.name.toLowerCase().includes(lowerQuery) ||
      metric.description.toLowerCase().includes(lowerQuery) ||
      metric.interpretation.toLowerCase().includes(lowerQuery)
  );
}


