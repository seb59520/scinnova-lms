export interface ROIGuideQuestion {
  id: string;
  category: 'revenue' | 'cost-savings' | 'efficiency' | 'risk-reduction' | 'customer';
  question: string;
  description: string;
  calculationHint: string;
  examples: string[];
}

/**
 * Guide interactif pour aider les utilisateurs à calculer le ROI
 * en leur posant des questions de réflexion
 */
export const roiGuideQuestions: ROIGuideQuestion[] = [
  // Catégorie : Revenus
  {
    id: 'revenue-1',
    category: 'revenue',
    question: 'Mon projet va-t-il générer de nouveaux revenus ?',
    description: 'Estimation des revenus supplémentaires générés par le projet',
    calculationHint: 'Exemples : augmentation des ventes, nouveaux produits/services, tarification dynamique, recommandations qui augmentent le panier moyen',
    examples: [
      'Recommandation produits : +15% de ventes = 100k€/an',
      'Tarification dynamique : +5% de marge = 50k€/an',
      'Nouveau service data : 200k€/an de revenus'
    ]
  },
  {
    id: 'revenue-2',
    category: 'revenue',
    question: 'Vais-je pouvoir facturer un nouveau service ou produit ?',
    description: 'Création de nouveaux revenus via des services data',
    calculationHint: 'Nombre de clients × prix du service × fréquence',
    examples: [
      'Service d\'analyse prédictive : 50 clients × 500€/mois = 300k€/an',
      'API de données : 1000 appels/jour × 0.10€ = 36k€/an'
    ]
  },

  // Catégorie : Réduction de coûts
  {
    id: 'cost-1',
    category: 'cost-savings',
    question: 'Vais-je réduire des coûts opérationnels ?',
    description: 'Économies réalisées grâce à l\'automatisation ou l\'optimisation',
    calculationHint: 'Coût actuel - Coût futur = Économie annuelle',
    examples: [
      'Automatisation processus : -2 ETP = 80k€/an',
      'Réduction des erreurs : -10% de pertes = 50k€/an',
      'Optimisation logistique : -15% de coûts transport = 100k€/an'
    ]
  },
  {
    id: 'cost-2',
    category: 'cost-savings',
    question: 'Vais-je éviter des coûts de maintenance ou de pannes ?',
    description: 'Maintenance prédictive et réduction des arrêts de production',
    calculationHint: 'Coût d\'une panne × Nombre de pannes évitées',
    examples: [
      'Maintenance prédictive : 5 pannes évitées × 20k€ = 100k€/an',
      'Réduction downtime : 100h/an × 500€/h = 50k€/an'
    ]
  },
  {
    id: 'cost-3',
    category: 'cost-savings',
    question: 'Vais-je réduire des coûts de stock ou de gaspillage ?',
    description: 'Optimisation des stocks et réduction du gaspillage',
    calculationHint: 'Valeur du stock moyen × Réduction %',
    examples: [
      'Optimisation stocks : -20% de stock moyen = 200k€ libérés',
      'Réduction gaspillage : -15% de pertes = 30k€/an'
    ]
  },

  // Catégorie : Efficacité
  {
    id: 'efficiency-1',
    category: 'efficiency',
    question: 'Vais-je gagner du temps sur des tâches répétitives ?',
    description: 'Gain de temps grâce à l\'automatisation',
    calculationHint: 'Temps gagné × Coût horaire × Nombre de personnes × Fréquence',
    examples: [
      'Automatisation reporting : 2h/semaine × 50€/h × 5 personnes = 26k€/an',
      'Traitement automatique : 10h/jour × 40€/h = 100k€/an'
    ]
  },
  {
    id: 'efficiency-2',
    category: 'efficiency',
    question: 'Vais-je améliorer la productivité de mes équipes ?',
    description: 'Augmentation de la productivité grâce à de meilleures décisions',
    calculationHint: 'Gain de productivité % × Coût salarial',
    examples: [
      'Meilleures décisions : +10% productivité × 500k€ salaires = 50k€/an',
      'Outils d\'aide à la décision : +5% efficacité = 25k€/an'
    ]
  },

  // Catégorie : Réduction de risques
  {
    id: 'risk-1',
    category: 'risk-reduction',
    question: 'Vais-je réduire les risques de fraude ou d\'erreurs ?',
    description: 'Économies liées à la réduction des fraudes et erreurs',
    calculationHint: 'Montant moyen d\'une fraude/erreur × Nombre évité',
    examples: [
      'Détection fraude : 10 fraudes évitées × 5k€ = 50k€/an',
      'Réduction erreurs : -20% d\'erreurs × 2k€/erreur = 40k€/an'
    ]
  },
  {
    id: 'risk-2',
    category: 'risk-reduction',
    question: 'Vais-je éviter des amendes ou pénalités ?',
    description: 'Conformité réglementaire et évitement de sanctions',
    calculationHint: 'Montant de l\'amende × Probabilité d\'occurrence',
    examples: [
      'Conformité RGPD : évite amende 2M€ (probabilité 10%) = 200k€',
      'Conformité médicale : évite retrait produit = 500k€'
    ]
  },

  // Catégorie : Client
  {
    id: 'customer-1',
    category: 'customer',
    question: 'Vais-je améliorer la satisfaction client ?',
    description: 'Impact sur la rétention et les revenus clients',
    calculationHint: 'Taux de rétention amélioré × Valeur vie client × Nombre de clients',
    examples: [
      'Meilleure expérience : +5% rétention × 1000€/client × 1000 clients = 50k€/an',
      'Réduction churn : -10% churn = 100k€/an'
    ]
  },
  {
    id: 'customer-2',
    category: 'customer',
    question: 'Vais-je réduire le temps de réponse aux clients ?',
    description: 'Amélioration du service client et réduction des coûts',
    calculationHint: 'Temps gagné × Coût support × Nombre d\'appels',
    examples: [
      'Chatbot intelligent : -30% temps support = 40k€/an',
      'Réponses automatisées : -50% appels = 60k€/an'
    ]
  }
];

/**
 * Formule de calcul du ROI
 */
export const roiCalculationFormula = {
  formula: 'ROI = (Bénéfices - Coûts) / Coûts × 100',
  explanation: 'Le ROI mesure le retour sur investissement en pourcentage',
  steps: [
    '1. Additionnez tous les bénéfices annuels (revenus + économies)',
    '2. Additionnez tous les coûts annuels (infrastructure + développement + maintenance)',
    '3. Calculez : (Bénéfices - Coûts) / Coûts × 100',
    '4. Un ROI positif signifie que le projet est rentable'
  ],
  example: {
    benefits: 300000, // 300k€ de bénéfices
    costs: 150000,    // 150k€ de coûts
    roi: ((300000 - 150000) / 150000) * 100 // = 100% ROI
  }
};

/**
 * Obtenir les questions par catégorie
 */
export function getROIQuestionsByCategory(
  category: ROIGuideQuestion['category']
): ROIGuideQuestion[] {
  return roiGuideQuestions.filter(q => q.category === category);
}

/**
 * Obtenir toutes les catégories disponibles
 */
export function getROICategories(): ROIGuideQuestion['category'][] {
  return Array.from(new Set(roiGuideQuestions.map(q => q.category)));
}


