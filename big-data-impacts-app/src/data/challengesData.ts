export interface ChallengeInfo {
  name: string;
  description: string;
  reasoning: string;
  mitigation: string[];
  examples: string[];
  category: 'technical' | 'organizational' | 'economic' | 'legal' | 'data-quality';
}

export const challengesDatabase: ChallengeInfo[] = [
  {
    name: 'Latence temps réel',
    description: 'Délai entre la collecte des données et leur traitement, critique pour les applications temps réel',
    reasoning: 'Pour identifier ce défi, posez-vous ces questions : Est-ce que mon cas d\'usage nécessite une réponse en moins de quelques secondes ? Les données doivent-elles être traitées au fur et à mesure qu\'elles arrivent ? Y a-t-il des contraintes de temps strictes ?',
    mitigation: [
      'Utiliser des technologies de streaming (Kafka, Spark Streaming)',
      'Optimiser les algorithmes pour réduire le temps de traitement',
      'Mettre en cache les résultats fréquents',
      'Utiliser des bases de données en mémoire (Redis)'
    ],
    examples: [
      'Détection de fraude bancaire (décision en < 1 seconde)',
      'Recommandation produits e-commerce (temps de chargement page)',
      'Monitoring d\'infrastructure (alertes immédiates)'
    ],
    category: 'technical'
  },
  {
    name: 'Faux positifs',
    description: 'Cas où le système identifie incorrectement un événement comme suspect ou anormal',
    reasoning: 'Ce défi apparaît quand : Le système doit détecter des anomalies ou des fraudes. Il y a un risque de bloquer des opérations légitimes. La précision est cruciale pour la confiance utilisateur.',
    mitigation: [
      'Améliorer la qualité des données d\'entraînement',
      'Ajuster les seuils de détection',
      'Implémenter un système de validation humaine',
      'Utiliser l\'apprentissage actif pour améliorer le modèle'
    ],
    examples: [
      'Détection de fraude (bloquer des transactions légitimes)',
      'Diagnostic médical (fausses alertes)',
      'Détection d\'intrusion (bloquer des utilisateurs légitimes)'
    ],
    category: 'technical'
  },
  {
    name: 'Conformité RGPD',
    description: 'Respect du Règlement Général sur la Protection des Données européen',
    reasoning: 'Ce défi est présent si : Vous traitez des données personnelles d\'utilisateurs européens. Vous collectez des données sensibles (santé, finance). Vous devez garantir le droit à l\'oubli et la portabilité des données.',
    mitigation: [
      'Implémenter le consentement explicite',
      'Anonymiser ou pseudonymiser les données',
      'Mettre en place des processus de suppression de données',
      'Documenter les traitements de données'
    ],
    examples: [
      'Recommandation produits (données de navigation)',
      'Diagnostic médical (données de santé)',
      'Scoring crédit (données financières)'
    ],
    category: 'legal'
  },
  {
    name: 'Scalabilité',
    description: 'Capacité du système à gérer une augmentation de charge (données, utilisateurs, requêtes)',
    reasoning: 'Posez-vous ces questions : Le volume de données va-t-il augmenter significativement ? Le nombre d\'utilisateurs va-t-il croître ? Les pics de charge sont-ils prévisibles ?',
    mitigation: [
      'Architecture distribuée (Kubernetes, clusters)',
      'Auto-scaling automatique',
      'Partitionnement des données',
      'Cache et CDN pour réduire la charge'
    ],
    examples: [
      'Plateforme e-commerce (Black Friday)',
      'Réseaux sociaux (croissance utilisateurs)',
      'IoT (millions de capteurs)'
    ],
    category: 'technical'
  },
  {
    name: 'Explicabilité',
    description: 'Capacité à expliquer pourquoi un modèle d\'IA a pris une décision',
    reasoning: 'Ce défi est crucial quand : Les décisions ont un impact important (médical, financier, légal). La confiance des utilisateurs est essentielle. La réglementation exige de la transparence.',
    mitigation: [
      'Utiliser des modèles interprétables (régression, arbres de décision)',
      'Techniques d\'explicabilité (SHAP, LIME)',
      'Documentation des règles métier',
      'Interface utilisateur montrant les facteurs de décision'
    ],
    examples: [
      'Diagnostic médical (justification du diagnostic)',
      'Scoring crédit (explication du refus)',
      'Recrutement IA (explication de la sélection)'
    ],
    category: 'technical'
  },
  {
    name: 'Biais algorithmiques',
    description: 'Tendances discriminatoires dans les prédictions d\'un modèle d\'IA',
    reasoning: 'Identifiez ce risque si : Le modèle influence des décisions importantes (embauche, crédit, justice). Les données d\'entraînement peuvent être biaisées. Certains groupes peuvent être désavantagés.',
    mitigation: [
      'Audit des données d\'entraînement',
      'Tests de biais sur différents groupes',
      'Diversité dans les équipes de développement',
      'Monitoring continu des prédictions'
    ],
    examples: [
      'Recrutement (discrimination de genre/ethnie)',
      'Scoring crédit (accès inégal au crédit)',
      'Recommandation (stéréotypes)'
    ],
    category: 'organizational'
  },
  {
    name: 'Intégration systèmes existants',
    description: 'Difficulté à connecter le nouveau système Big Data avec les systèmes informatiques en place',
    reasoning: 'Ce défi apparaît quand : L\'entreprise a déjà des systèmes legacy. Les formats de données sont incompatibles. Les APIs ne sont pas standardisées.',
    mitigation: [
      'Utiliser des APIs REST standardisées',
      'Middleware pour la transformation de données',
      'Migration progressive (pas de big bang)',
      'Formation des équipes techniques'
    ],
    examples: [
      'Système hospitalier (intégration DICOM)',
      'Banque (intégration systèmes core banking)',
      'Industrie (intégration SCADA/MES)'
    ],
    category: 'technical'
  },
  {
    name: 'Cold start problem',
    description: 'Difficulté à faire des recommandations pour de nouveaux utilisateurs ou nouveaux produits sans historique',
    reasoning: 'Ce défi est présent si : Vous avez de nouveaux utilisateurs sans historique. Vous ajoutez de nouveaux produits. Les systèmes de recommandation ont besoin de données pour fonctionner.',
    mitigation: [
      'Recommandations basées sur le contenu (content-based)',
      'Recommandations populaires pour les nouveaux utilisateurs',
      'Collecte rapide de données initiales',
      'Hybridation de plusieurs approches'
    ],
    examples: [
      'E-commerce (nouveaux clients)',
      'Streaming vidéo (nouveaux contenus)',
      'Applications mobiles (première utilisation)'
    ],
    category: 'technical'
  },
  {
    name: 'Diversité des recommandations',
    description: 'Équilibre entre précision et variété dans les recommandations',
    reasoning: 'Ce défi apparaît quand : Les recommandations sont trop similaires. Les utilisateurs veulent découvrir de nouveaux contenus. Il faut éviter les "bulles de filtres".',
    mitigation: [
      'Algorithme de diversification',
      'Mélange de recommandations populaires et personnalisées',
      'A/B testing pour trouver le bon équilibre',
      'Feedback utilisateur pour ajuster'
    ],
    examples: [
      'Recommandation produits (éviter la répétition)',
      'Streaming (découvrir de nouveaux genres)',
      'Réseaux sociaux (variété de contenus)'
    ],
    category: 'technical'
  },
  {
    name: 'Privacy',
    description: 'Protection de la vie privée des utilisateurs dans le traitement des données',
    reasoning: 'Ce défi est présent si : Vous collectez des données personnelles sensibles. Les utilisateurs sont préoccupés par leur vie privée. La réglementation est stricte.',
    mitigation: [
      'Chiffrement des données',
      'Anonymisation et pseudonymisation',
      'Consentement explicite',
      'Minimisation des données collectées'
    ],
    examples: [
      'Recommandation (historique de navigation)',
      'Publicité ciblée (profiling)',
      'Santé (données médicales)'
    ],
    category: 'legal'
  },
  {
    name: 'Complexité algorithmique',
    description: 'Difficulté à résoudre des problèmes d\'optimisation complexes dans un temps raisonnable',
    reasoning: 'Ce défi apparaît si : Le problème nécessite d\'explorer un très grand nombre de solutions. Le temps de calcul devient prohibitif. Les ressources sont limitées.',
    mitigation: [
      'Algorithmes d\'approximation',
      'Heuristiques intelligentes',
      'Parallélisation du calcul',
      'Optimisation continue (amélioration progressive)'
    ],
    examples: [
      'Optimisation de routes (nombreuses combinaisons)',
      'Planification de production (contraintes multiples)',
      'Allocation de ressources (problèmes NP-complets)'
    ],
    category: 'technical'
  },
  {
    name: 'Données en temps réel',
    description: 'Difficulté à intégrer et traiter des données qui arrivent en continu',
    reasoning: 'Ce défi est présent si : Les données arrivent en flux continu. Il faut traiter les données au fur et à mesure. Les données peuvent être incomplètes ou désordonnées.',
    mitigation: [
      'Technologies de streaming (Kafka, Flink)',
      'Buffering et windowing',
      'Gestion de la latence',
      'Tolérance aux pannes'
    ],
    examples: [
      'IoT (flux de capteurs)',
      'Trading haute fréquence',
      'Monitoring d\'infrastructure'
    ],
    category: 'technical'
  },
  {
    name: 'Coûts infrastructure',
    description: 'Investissements importants nécessaires pour l\'infrastructure Big Data',
    reasoning: 'Ce défi apparaît quand : Vous avez besoin de beaucoup de ressources (calcul, stockage). Les coûts cloud peuvent exploser. L\'infrastructure on-premise est coûteuse.',
    mitigation: [
      'Optimisation des ressources (auto-scaling)',
      'Choix entre cloud et on-premise',
      'Réutilisation de l\'infrastructure existante',
      'ROI clair et suivi des coûts'
    ],
    examples: [
      'Data lakes (stockage massif)',
      'Entraînement de modèles ML (GPU coûteux)',
      'Streaming temps réel (bande passante)'
    ],
    category: 'economic'
  },
  {
    name: 'Qualité données capteurs',
    description: 'Fiabilité et précision des données collectées par les capteurs IoT',
    reasoning: 'Ce défi est présent si : Vous utilisez des capteurs IoT. Les capteurs peuvent être défectueux ou mal calibrés. Les données peuvent être bruitées ou manquantes.',
    mitigation: [
      'Validation et nettoyage des données',
      'Calibration régulière des capteurs',
      'Redondance (plusieurs capteurs)',
      'Détection d\'anomalies sur les capteurs'
    ],
    examples: [
      'Maintenance prédictive (capteurs machines)',
      'Smart cities (capteurs environnementaux)',
      'Agriculture de précision (capteurs sol)'
    ],
    category: 'data-quality'
  },
  {
    name: 'Interprétabilité',
    description: 'Facilité à comprendre les résultats et décisions du système',
    reasoning: 'Ce défi apparaît si : Les utilisateurs doivent comprendre les résultats. Les décisions doivent être justifiables. La confiance est importante.',
    mitigation: [
      'Visualisations claires',
      'Explications en langage naturel',
      'Modèles plus simples quand possible',
      'Documentation et formation'
    ],
    examples: [
      'Diagnostic médical (compréhension par les médecins)',
      'Analytics business (compréhension par les managers)',
      'Recommandation (compréhension par les utilisateurs)'
    ],
    category: 'organizational'
  },
  {
    name: 'Coûts IoT',
    description: 'Investissements nécessaires pour déployer et maintenir des capteurs IoT',
    reasoning: 'Ce défi est présent si : Vous déployez de nombreux capteurs. Les capteurs ont besoin de maintenance. La connectivité (réseau) est coûteuse.',
    mitigation: [
      'ROI clair du déploiement IoT',
      'Choix de capteurs adaptés (pas toujours les plus chers)',
      'Maintenance préventive',
      'Partenariats avec fournisseurs IoT'
    ],
    examples: [
      'Smart cities (milliers de capteurs)',
      'Industrie 4.0 (capteurs sur machines)',
      'Agriculture (capteurs dans les champs)'
    ],
    category: 'economic'
  },
  {
    name: 'Conformité médicale',
    description: 'Respect des normes et réglementations du secteur médical (FDA, CE, etc.)',
    reasoning: 'Ce défi est crucial si : Vous développez des outils médicaux. La sécurité des patients est en jeu. La réglementation est très stricte.',
    mitigation: [
      'Validation clinique rigoureuse',
      'Documentation complète',
      'Traçabilité des décisions',
      'Certification par les autorités compétentes'
    ],
    examples: [
      'Diagnostic assisté par IA',
      'Dosage automatisé de médicaments',
      'Détection d\'anomalies médicales'
    ],
    category: 'legal'
  }
];

export function getChallengeInfo(name: string): ChallengeInfo | undefined {
  return challengesDatabase.find(
    challenge => challenge.name.toLowerCase() === name.toLowerCase()
  );
}

export function searchChallenges(query: string): ChallengeInfo[] {
  const lowerQuery = query.toLowerCase();
  return challengesDatabase.filter(
    challenge =>
      challenge.name.toLowerCase().includes(lowerQuery) ||
      challenge.description.toLowerCase().includes(lowerQuery) ||
      challenge.reasoning.toLowerCase().includes(lowerQuery)
  );
}

export function getChallengesByCategory(category: ChallengeInfo['category']): ChallengeInfo[] {
  return challengesDatabase.filter(challenge => challenge.category === category);
}


