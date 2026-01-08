export interface TechnologyGuideQuestion {
  id: string;
  question: string;
  description: string;
  technologyNames: string[];
  category: 'processing' | 'storage' | 'streaming' | 'ml' | 'database' | 'orchestration';
}

/**
 * Guide interactif pour aider les utilisateurs à identifier les technologies
 * en partant de leurs besoins métier plutôt que des termes techniques
 */
export const technologyGuideQuestions: TechnologyGuideQuestion[] = [
  // Catégorie : Machine Learning
  {
    id: 'ml-1',
    question: 'Je veux créer un modèle d\'intelligence artificielle pour analyser des images',
    description: 'Vous avez besoin de frameworks spécialisés en deep learning pour la vision par ordinateur',
    technologyNames: ['TensorFlow', 'PyTorch'],
    category: 'ml'
  },
  {
    id: 'ml-2',
    question: 'Je veux faire des prédictions ou des classifications simples',
    description: 'Pour des modèles de machine learning classiques (régression, classification, clustering)',
    technologyNames: ['Scikit-learn', 'Python'],
    category: 'ml'
  },
  {
    id: 'ml-3',
    question: 'Je veux faire de la recherche en intelligence artificielle',
    description: 'Framework privilégié pour la recherche et l\'expérimentation en IA',
    technologyNames: ['PyTorch', 'Python'],
    category: 'ml'
  },

  // Catégorie : Traitement de données en temps réel
  {
    id: 'streaming-1',
    question: 'Je dois traiter des données qui arrivent en continu (flux)',
    description: 'Vous avez besoin de technologies de streaming pour traiter les données au fur et à mesure',
    technologyNames: ['Apache Kafka', 'Spark Streaming'],
    category: 'streaming'
  },
  {
    id: 'streaming-2',
    question: 'Je dois détecter des fraudes ou anomalies en temps réel',
    description: 'Traitement de flux de données pour des décisions instantanées',
    technologyNames: ['Apache Kafka', 'Spark Streaming', 'Redis'],
    category: 'streaming'
  },
  {
    id: 'streaming-3',
    question: 'Je dois collecter des données de capteurs IoT en temps réel',
    description: 'Ingestion et traitement de données de capteurs en continu',
    technologyNames: ['Apache Kafka', 'InfluxDB'],
    category: 'streaming'
  },

  // Catégorie : Stockage de données
  {
    id: 'storage-1',
    question: 'Je dois stocker de très grandes quantités de données (data lake)',
    description: 'Stockage massif et économique pour des données brutes',
    technologyNames: ['AWS S3', 'Apache Hadoop'],
    category: 'storage'
  },
  {
    id: 'storage-2',
    question: 'Je dois stocker des données structurées avec des relations complexes',
    description: 'Base de données relationnelle pour des données organisées',
    technologyNames: ['PostgreSQL'],
    category: 'database'
  },
  {
    id: 'storage-3',
    question: 'Je dois stocker des données flexibles (documents JSON)',
    description: 'Base de données NoSQL pour des structures de données variées',
    technologyNames: ['MongoDB'],
    category: 'database'
  },
  {
    id: 'storage-4',
    question: 'Je dois stocker des données de capteurs avec des timestamps',
    description: 'Base de données optimisée pour les séries temporelles',
    technologyNames: ['InfluxDB'],
    category: 'database'
  },
  {
    id: 'storage-5',
    question: 'Je dois stocker des images médicales (DICOM)',
    description: 'Standard pour le stockage et la transmission d\'images médicales',
    technologyNames: ['DICOM'],
    category: 'storage'
  },
  {
    id: 'storage-6',
    question: 'Je dois mettre en cache des données pour accélérer mon application',
    description: 'Stockage en mémoire pour des accès ultra-rapides',
    technologyNames: ['Redis'],
    category: 'storage'
  },

  // Catégorie : Traitement de données
  {
    id: 'processing-1',
    question: 'Je dois analyser de très grandes quantités de données',
    description: 'Traitement distribué pour analyser des volumes massifs',
    technologyNames: ['Apache Spark', 'Apache Hadoop'],
    category: 'processing'
  },
  {
    id: 'processing-2',
    question: 'Je dois faire des transformations de données (ETL)',
    description: 'Extraction, transformation et chargement de données',
    technologyNames: ['Apache Spark', 'Python'],
    category: 'processing'
  },
  {
    id: 'processing-3',
    question: 'Je dois optimiser des routes, des horaires ou des allocations',
    description: 'Résolution de problèmes d\'optimisation combinatoire',
    technologyNames: ['OR-Tools', 'Python'],
    category: 'processing'
  },
  {
    id: 'processing-4',
    question: 'Je dois automatiser des scripts et analyser des données',
    description: 'Langage polyvalent pour le data processing et l\'automatisation',
    technologyNames: ['Python'],
    category: 'processing'
  },

  // Catégorie : Orchestration et déploiement
  {
    id: 'orchestration-1',
    question: 'Je dois orchestrer des pipelines de données (ETL automatisés)',
    description: 'Planification et exécution de workflows de données',
    technologyNames: ['Apache Airflow'],
    category: 'orchestration'
  },
  {
    id: 'orchestration-2',
    question: 'Je dois déployer mon application sur plusieurs serveurs (scalabilité)',
    description: 'Orchestration de conteneurs pour gérer la charge',
    technologyNames: ['Kubernetes'],
    category: 'orchestration'
  },
  {
    id: 'orchestration-3',
    question: 'Je dois visualiser et monitorer mes données en temps réel',
    description: 'Dashboards et alertes pour le monitoring',
    technologyNames: ['Grafana', 'InfluxDB'],
    category: 'orchestration'
  },

  // Catégorie : Cas d'usage spécifiques
  {
    id: 'usecase-1',
    question: 'Je veux faire des recommandations de produits ou de contenus',
    description: 'Système de recommandation nécessitant ML et stockage performant',
    technologyNames: ['TensorFlow', 'PyTorch', 'MongoDB', 'Redis'],
    category: 'ml'
  },
  {
    id: 'usecase-2',
    question: 'Je veux faire de la maintenance prédictive (prévoir les pannes)',
    description: 'Analyse prédictive avec données IoT et séries temporelles',
    technologyNames: ['InfluxDB', 'Scikit-learn', 'Python'],
    category: 'ml'
  },
  {
    id: 'usecase-3',
    question: 'Je veux analyser des logs ou des données d\'infrastructure',
    description: 'Traitement et analyse de grandes quantités de logs',
    technologyNames: ['Apache Spark', 'Elasticsearch', 'Grafana'],
    category: 'processing'
  }
];

/**
 * Recherche de questions du guide par mots-clés
 */
export function searchTechnologyGuideQuestions(query: string): TechnologyGuideQuestion[] {
  const lowerQuery = query.toLowerCase();
  return technologyGuideQuestions.filter(
    q =>
      q.question.toLowerCase().includes(lowerQuery) ||
      q.description.toLowerCase().includes(lowerQuery) ||
      q.technologyNames.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Obtenir les questions par catégorie
 */
export function getTechnologyGuideQuestionsByCategory(
  category: TechnologyGuideQuestion['category']
): TechnologyGuideQuestion[] {
  return technologyGuideQuestions.filter(q => q.category === category);
}

/**
 * Obtenir toutes les catégories disponibles
 */
export function getTechnologyGuideCategories(): TechnologyGuideQuestion['category'][] {
  return Array.from(new Set(technologyGuideQuestions.map(q => q.category)));
}


