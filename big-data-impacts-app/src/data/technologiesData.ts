export interface TechnologyInfo {
  name: string;
  description: string;
  mainFunctions: string[];
  useCases: string[];
  category: 'processing' | 'storage' | 'streaming' | 'ml' | 'database' | 'orchestration';
}

export const technologiesDatabase: TechnologyInfo[] = [
  {
    name: 'Apache Kafka',
    description: 'Plateforme de streaming distribuée pour la gestion de flux de données en temps réel',
    mainFunctions: [
      'Ingestion de données en temps réel',
      'Messaging asynchron entre systèmes',
      'Stockage de logs distribués',
      'Traitement de flux de données'
    ],
    useCases: [
      'Détection de fraude en temps réel',
      'Monitoring d\'infrastructure',
      'Collecte de données IoT',
      'Event-driven architectures'
    ],
    category: 'streaming'
  },
  {
    name: 'TensorFlow',
    description: 'Framework open-source de machine learning développé par Google',
    mainFunctions: [
      'Entraînement de modèles de deep learning',
      'Inference (prédiction) en production',
      'Traitement d\'images et de texte',
      'Recommandation et classification'
    ],
    useCases: [
      'Reconnaissance d\'images',
      'Traitement du langage naturel',
      'Recommandation de produits',
      'Prédiction de séries temporelles'
    ],
    category: 'ml'
  },
  {
    name: 'Apache Spark',
    description: 'Moteur de traitement distribué pour le traitement de grandes quantités de données',
    mainFunctions: [
      'Traitement par lots (batch processing)',
      'Traitement de flux (streaming)',
      'Requêtes SQL distribuées',
      'Machine learning distribué'
    ],
    useCases: [
      'Analyse de grandes bases de données',
      'ETL (Extract, Transform, Load)',
      'Recommandation à grande échelle',
      'Analyse de logs'
    ],
    category: 'processing'
  },
  {
    name: 'PostgreSQL',
    description: 'Base de données relationnelle open-source robuste et performante',
    mainFunctions: [
      'Stockage structuré de données',
      'Requêtes SQL complexes',
      'Transactions ACID',
      'Extensions pour données géospatiales, JSON, etc.'
    ],
    useCases: [
      'Stockage de données transactionnelles',
      'Data warehouse',
      'Applications web',
      'Systèmes de gestion de contenu'
    ],
    category: 'database'
  },
  {
    name: 'MongoDB',
    description: 'Base de données NoSQL orientée documents',
    mainFunctions: [
      'Stockage de documents JSON',
      'Requêtes flexibles',
      'Scalabilité horizontale',
      'Indexation performante'
    ],
    useCases: [
      'Applications web modernes',
      'Catalogues produits',
      'Systèmes de recommandation',
      'IoT et données temps réel'
    ],
    category: 'database'
  },
  {
    name: 'Redis',
    description: 'Base de données en mémoire (in-memory) pour le cache et le stockage de données clé-valeur',
    mainFunctions: [
      'Cache haute performance',
      'Stockage de sessions',
      'Pub/Sub (messaging)',
      'Structures de données avancées (listes, sets, etc.)'
    ],
    useCases: [
      'Cache d\'applications',
      'Sessions utilisateurs',
      'Leaderboards en temps réel',
      'Rate limiting'
    ],
    category: 'storage'
  },
  {
    name: 'Apache Hadoop',
    description: 'Framework open-source pour le stockage et le traitement distribué de grandes quantités de données',
    mainFunctions: [
      'Stockage distribué (HDFS)',
      'Traitement par lots (MapReduce)',
      'Gestion de clusters',
      'Scalabilité horizontale'
    ],
    useCases: [
      'Data lakes',
      'Analyse de grandes volumes',
      'Archivage de données',
      'ETL à grande échelle'
    ],
    category: 'processing'
  },
  {
    name: 'PyTorch',
    description: 'Framework de deep learning développé par Facebook, privilégié pour la recherche',
    mainFunctions: [
      'Entraînement de réseaux de neurones',
      'Calcul tensoriel',
      'Automatic differentiation',
      'Déploiement de modèles'
    ],
    useCases: [
      'Recherche en IA',
      'Vision par ordinateur',
      'NLP (Natural Language Processing)',
      'Reinforcement learning'
    ],
    category: 'ml'
  },
  {
    name: 'Kubernetes',
    description: 'Orchestrateur de conteneurs pour la gestion de déploiements à grande échelle',
    mainFunctions: [
      'Orchestration de conteneurs',
      'Auto-scaling',
      'Load balancing',
      'Gestion de la haute disponibilité'
    ],
    useCases: [
      'Déploiement de microservices',
      'Applications cloud-native',
      'MLOps (déploiement de modèles ML)',
      'Infrastructure as code'
    ],
    category: 'orchestration'
  },
  {
    name: 'Apache Airflow',
    description: 'Plateforme open-source pour orchestrer et planifier des workflows de données',
    mainFunctions: [
      'Orchestration de pipelines ETL',
      'Planification de tâches',
      'Monitoring de workflows',
      'Gestion des dépendances'
    ],
    useCases: [
      'Pipelines de données',
      'ETL automatisés',
      'Rapports automatisés',
      'Data engineering'
    ],
    category: 'orchestration'
  },
  {
    name: 'InfluxDB',
    description: 'Base de données temporelle (time-series) optimisée pour les données IoT et de monitoring',
    mainFunctions: [
      'Stockage de séries temporelles',
      'Requêtes temporelles performantes',
      'Rétention automatique des données',
      'Agrégations en temps réel'
    ],
    useCases: [
      'IoT et capteurs',
      'Monitoring d\'infrastructure',
      'Métriques applicatives',
      'Maintenance prédictive'
    ],
    category: 'database'
  },
  {
    name: 'Scikit-learn',
    description: 'Bibliothèque Python pour le machine learning classique',
    mainFunctions: [
      'Classification et régression',
      'Clustering',
      'Feature engineering',
      'Validation croisée'
    ],
    useCases: [
      'Analyse prédictive',
      'Segmentation client',
      'Détection d\'anomalies',
      'Recommandation simple'
    ],
    category: 'ml'
  },
  {
    name: 'AWS S3',
    description: 'Service de stockage objet d\'Amazon Web Services',
    mainFunctions: [
      'Stockage de fichiers à grande échelle',
      'Archivage de données',
      'Hébergement de données pour analytics',
      'Backup et disaster recovery'
    ],
    useCases: [
      'Data lakes',
      'Stockage de données brutes',
      'Hébergement de modèles ML',
      'Archivage long terme'
    ],
    category: 'storage'
  },
  {
    name: 'Grafana',
    description: 'Plateforme open-source de visualisation et monitoring',
    mainFunctions: [
      'Visualisation de métriques',
      'Dashboards interactifs',
      'Alerting',
      'Intégration avec multiples sources de données'
    ],
    useCases: [
      'Monitoring d\'infrastructure',
      'Business intelligence',
      'Observabilité applicative',
      'Analytics en temps réel'
    ],
    category: 'orchestration'
  },
  {
    name: 'Spark Streaming',
    description: 'Extension d\'Apache Spark pour le traitement de flux de données en temps réel',
    mainFunctions: [
      'Traitement de streams',
      'Window operations',
      'Intégration avec Kafka',
      'Traitement micro-batch'
    ],
    useCases: [
      'Analytics en temps réel',
      'Détection de fraude',
      'Monitoring de logs',
      'Recommandation temps réel'
    ],
    category: 'streaming'
  },
  {
    name: 'DICOM',
    description: 'Standard pour le stockage et la transmission d\'images médicales',
    mainFunctions: [
      'Stockage d\'images médicales',
      'Transmission sécurisée',
      'Métadonnées médicales',
      'Intégration systèmes hospitaliers'
    ],
    useCases: [
      'Imagerie médicale',
      'Télémédecine',
      'Archivage médical',
      'IA médicale'
    ],
    category: 'storage'
  },
  {
    name: 'OR-Tools',
    description: 'Suite d\'outils Google pour l\'optimisation combinatoire',
    mainFunctions: [
      'Optimisation de routes',
      'Scheduling',
      'Bin packing',
      'Résolution de problèmes d\'optimisation'
    ],
    useCases: [
      'Logistique et transport',
      'Planification de production',
      'Allocation de ressources',
      'Optimisation de coûts'
    ],
    category: 'processing'
  },
  {
    name: 'Python',
    description: 'Langage de programmation très utilisé en data science et machine learning',
    mainFunctions: [
      'Scripting et automation',
      'Data analysis (pandas, numpy)',
      'Machine learning',
      'API et services web'
    ],
    useCases: [
      'Data science',
      'Prototypage rapide',
      'ETL et data processing',
      'Développement d\'APIs'
    ],
    category: 'processing'
  }
];

export function getTechnologyInfo(name: string): TechnologyInfo | undefined {
  return technologiesDatabase.find(
    tech => tech.name.toLowerCase() === name.toLowerCase()
  );
}

export function searchTechnologies(query: string): TechnologyInfo[] {
  const lowerQuery = query.toLowerCase();
  return technologiesDatabase.filter(
    tech =>
      tech.name.toLowerCase().includes(lowerQuery) ||
      tech.description.toLowerCase().includes(lowerQuery) ||
      tech.mainFunctions.some(f => f.toLowerCase().includes(lowerQuery))
  );
}


