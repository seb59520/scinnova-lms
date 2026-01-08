export interface ChallengeGuideQuestion {
  id: string;
  question: string;
  description: string;
  challengeName: string;
  category: 'legal' | 'technical' | 'organizational' | 'economic' | 'data-quality';
}

/**
 * Guide interactif pour aider les utilisateurs à identifier les défis
 * en partant de leurs préoccupations métier plutôt que des termes techniques
 */
export const challengeGuideQuestions: ChallengeGuideQuestion[] = [
  // Catégorie : Conformité et légal
  {
    id: 'rgpd-1',
    question: 'Je veux rester conforme aux normes sur les données personnelles',
    description: 'Vous devez respecter le RGPD pour les données personnelles des utilisateurs européens',
    challengeName: 'Conformité RGPD',
    category: 'legal'
  },
  {
    id: 'privacy-1',
    question: 'Je dois protéger la vie privée de mes utilisateurs',
    description: 'Les données personnelles doivent être protégées et anonymisées',
    challengeName: 'Privacy',
    category: 'legal'
  },
  {
    id: 'medical-1',
    question: 'Mon projet concerne le secteur médical ou la santé',
    description: 'Les outils médicaux doivent respecter des normes strictes (FDA, CE)',
    challengeName: 'Conformité médicale',
    category: 'legal'
  },

  // Catégorie : Performance et temps réel
  {
    id: 'latency-1',
    question: 'Mon système doit répondre très rapidement (moins de quelques secondes)',
    description: 'Les décisions doivent être prises en temps réel',
    challengeName: 'Latence temps réel',
    category: 'technical'
  },
  {
    id: 'realtime-1',
    question: 'Je dois traiter des données qui arrivent en continu',
    description: 'Les données arrivent en flux continu et doivent être traitées au fur et à mesure',
    challengeName: 'Données en temps réel',
    category: 'technical'
  },

  // Catégorie : Scalabilité et croissance
  {
    id: 'scalability-1',
    question: 'Mon système doit gérer une augmentation importante d\'utilisateurs ou de données',
    description: 'Le volume de données ou le nombre d\'utilisateurs va croître significativement',
    challengeName: 'Scalabilité',
    category: 'technical'
  },

  // Catégorie : Qualité et précision
  {
    id: 'false-positives-1',
    question: 'Je dois éviter de bloquer ou rejeter des opérations légitimes par erreur',
    description: 'Le système ne doit pas faire trop d\'erreurs de détection',
    challengeName: 'Faux positifs',
    category: 'technical'
  },
  {
    id: 'sensor-quality-1',
    question: 'J\'utilise des capteurs IoT qui peuvent être défectueux ou mal calibrés',
    description: 'La qualité des données des capteurs peut être variable',
    challengeName: 'Qualité données capteurs',
    category: 'data-quality'
  },

  // Catégorie : Explicabilité et confiance
  {
    id: 'explicability-1',
    question: 'Je dois pouvoir expliquer pourquoi mon système a pris une décision',
    description: 'Les décisions doivent être justifiables et compréhensibles',
    challengeName: 'Explicabilité',
    category: 'technical'
  },
  {
    id: 'interpretability-1',
    question: 'Les utilisateurs doivent comprendre les résultats de mon système',
    description: 'Les résultats doivent être présentés de manière claire et accessible',
    challengeName: 'Interprétabilité',
    category: 'organizational'
  },

  // Catégorie : Biais et discrimination
  {
    id: 'bias-1',
    question: 'Je veux éviter que mon système discrimine certains groupes',
    description: 'Le système ne doit pas favoriser ou défavoriser certains groupes d\'utilisateurs',
    challengeName: 'Biais algorithmiques',
    category: 'organizational'
  },

  // Catégorie : Intégration
  {
    id: 'integration-1',
    question: 'Je dois connecter mon nouveau système avec des systèmes existants',
    description: 'L\'intégration avec les systèmes legacy peut être complexe',
    challengeName: 'Intégration systèmes existants',
    category: 'technical'
  },

  // Catégorie : Recommandation
  {
    id: 'cold-start-1',
    question: 'Je dois faire des recommandations pour de nouveaux utilisateurs ou produits',
    description: 'Sans historique, il est difficile de faire des recommandations pertinentes',
    challengeName: 'Cold start problem',
    category: 'technical'
  },
  {
    id: 'diversity-1',
    question: 'Je veux éviter que mes recommandations soient toujours les mêmes',
    description: 'Il faut équilibrer précision et variété dans les recommandations',
    challengeName: 'Diversité des recommandations',
    category: 'technical'
  },

  // Catégorie : Complexité et performance
  {
    id: 'complexity-1',
    question: 'Mon problème d\'optimisation est très complexe et prend trop de temps à résoudre',
    description: 'Le calcul devient trop long ou coûteux',
    challengeName: 'Complexité algorithmique',
    category: 'technical'
  },

  // Catégorie : Coûts
  {
    id: 'infrastructure-costs-1',
    question: 'Je suis préoccupé par les coûts d\'infrastructure (serveurs, stockage, calcul)',
    description: 'Les ressources nécessaires peuvent être coûteuses',
    challengeName: 'Coûts infrastructure',
    category: 'economic'
  },
  {
    id: 'iot-costs-1',
    question: 'Je dois déployer de nombreux capteurs IoT et je m\'inquiète des coûts',
    description: 'Le déploiement et la maintenance des capteurs peuvent être coûteux',
    challengeName: 'Coûts IoT',
    category: 'economic'
  }
];

/**
 * Recherche de questions du guide par mots-clés
 */
export function searchGuideQuestions(query: string): ChallengeGuideQuestion[] {
  const lowerQuery = query.toLowerCase();
  return challengeGuideQuestions.filter(
    q =>
      q.question.toLowerCase().includes(lowerQuery) ||
      q.description.toLowerCase().includes(lowerQuery) ||
      q.challengeName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Obtenir les questions par catégorie
 */
export function getGuideQuestionsByCategory(
  category: ChallengeGuideQuestion['category']
): ChallengeGuideQuestion[] {
  return challengeGuideQuestions.filter(q => q.category === category);
}

/**
 * Obtenir toutes les catégories disponibles
 */
export function getGuideCategories(): ChallengeGuideQuestion['category'][] {
  return Array.from(new Set(challengeGuideQuestions.map(q => q.category)));
}


