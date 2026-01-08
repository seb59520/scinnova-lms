export interface ImpactGuideQuestion {
  id: string;
  impactType: 'organizational' | 'technical' | 'economic' | 'social';
  question: string;
  description: string;
  reflectionPoints: string[];
  scaleGuide: {
    low: string;
    medium: string;
    high: string;
  };
}

/**
 * Guide interactif pour aider les utilisateurs à évaluer les impacts
 * en leur posant des questions de réflexion
 */
export const impactGuideQuestions: ImpactGuideQuestion[] = [
  // Impacts organisationnels
  {
    id: 'org-1',
    impactType: 'organizational',
    question: 'Quel impact sur la structure et les processus de l\'organisation ?',
    description: 'Comment le projet va-t-il transformer l\'organisation ?',
    reflectionPoints: [
      'Y a-t-il un changement de processus métier important ?',
      'Faut-il créer de nouveaux postes ou réorganiser les équipes ?',
      'Y a-t-il une transformation culturelle nécessaire (data-driven) ?',
      'Quel niveau de formation est requis pour les équipes ?',
      'Y a-t-il une résistance au changement à gérer ?'
    ],
    scaleGuide: {
      low: 'Changement mineur, processus existants peu modifiés',
      medium: 'Modification de certains processus, formation nécessaire',
      high: 'Transformation majeure, réorganisation, changement culturel'
    }
  },
  {
    id: 'org-2',
    impactType: 'organizational',
    question: 'Quel impact sur les compétences et la formation ?',
    description: 'Besoin en nouvelles compétences et formation',
    reflectionPoints: [
      'Faut-il recruter de nouveaux profils (data scientists, data engineers) ?',
      'Quel niveau de formation pour les équipes existantes ?',
      'Y a-t-il un besoin en compétences techniques spécialisées ?',
      'Combien de personnes doivent être formées ?'
    ],
    scaleGuide: {
      low: 'Formation minimale, compétences existantes suffisantes',
      medium: 'Formation modérée, quelques nouvelles compétences nécessaires',
      high: 'Formation importante, recrutement nécessaire, nouvelles compétences critiques'
    }
  },

  // Impacts techniques
  {
    id: 'tech-1',
    impactType: 'technical',
    question: 'Quel impact sur l\'infrastructure et les systèmes existants ?',
    description: 'Complexité technique et intégration avec les systèmes en place',
    reflectionPoints: [
      'Faut-il créer une nouvelle infrastructure ou modifier l\'existant ?',
      'Y a-t-il des intégrations complexes avec des systèmes legacy ?',
      'Quel niveau de scalabilité est requis ?',
      'Y a-t-il des contraintes de performance critiques ?',
      'Faut-il migrer des données importantes ?'
    ],
    scaleGuide: {
      low: 'Infrastructure simple, intégration facile',
      medium: 'Infrastructure modérée, quelques intégrations complexes',
      high: 'Infrastructure complexe, intégrations multiples, migration importante'
    }
  },
  {
    id: 'tech-2',
    impactType: 'technical',
    question: 'Quel niveau de complexité technique du projet ?',
    description: 'Complexité algorithmique et technologique',
    reflectionPoints: [
      'Y a-t-il des algorithmes complexes à développer ?',
      'Faut-il gérer des volumes de données très importants ?',
      'Y a-t-il des contraintes temps réel strictes ?',
      'Le projet nécessite-t-il de la recherche et développement ?',
      'Y a-t-il des risques techniques majeurs ?'
    ],
    scaleGuide: {
      low: 'Technologies maîtrisées, solutions standards',
      medium: 'Technologies avancées, quelques défis techniques',
      high: 'Technologies de pointe, R&D nécessaire, risques techniques élevés'
    }
  },

  // Impacts économiques
  {
    id: 'econ-1',
    impactType: 'economic',
    question: 'Quel investissement initial est nécessaire ?',
    description: 'Coûts de développement et d\'infrastructure',
    reflectionPoints: [
      'Quel est le coût de développement (équipe, temps) ?',
      'Quel est le coût d\'infrastructure (serveurs, stockage, cloud) ?',
      'Y a-t-il des coûts de licences logicielles ?',
      'Faut-il investir dans du matériel spécialisé (GPU, IoT) ?',
      'Quel est le budget total estimé ?'
    ],
    scaleGuide: {
      low: 'Investissement < 50k€, infrastructure minimale',
      medium: 'Investissement 50-200k€, infrastructure modérée',
      high: 'Investissement > 200k€, infrastructure importante, matériel spécialisé'
    }
  },
  {
    id: 'econ-2',
    impactType: 'economic',
    question: 'Quels sont les coûts récurrents (maintenance, opération) ?',
    description: 'Coûts opérationnels et de maintenance',
    reflectionPoints: [
      'Quel est le coût mensuel/annuel d\'infrastructure ?',
      'Faut-il une équipe dédiée pour la maintenance ?',
      'Y a-t-il des coûts de licences récurrentes ?',
      'Quel est le coût de la formation continue ?',
      'Y a-t-il des coûts de monitoring et support ?'
    ],
    scaleGuide: {
      low: 'Coûts récurrents < 10k€/an, maintenance minimale',
      medium: 'Coûts récurrents 10-50k€/an, maintenance régulière',
      high: 'Coûts récurrents > 50k€/an, équipe dédiée, support important'
    }
  },
  {
    id: 'econ-3',
    impactType: 'economic',
    question: 'Quel est le potentiel de retour sur investissement (ROI) ?',
    description: 'Bénéfices attendus et rentabilité',
    reflectionPoints: [
      'Quels sont les bénéfices attendus (revenus, économies) ?',
      'Quel est le délai de retour sur investissement ?',
      'Y a-t-il des économies récurrentes importantes ?',
      'Le projet génère-t-il de nouveaux revenus ?',
      'Quel est le ROI estimé ?'
    ],
    scaleGuide: {
      low: 'ROI < 50%, bénéfices limités',
      medium: 'ROI 50-150%, bénéfices modérés',
      high: 'ROI > 150%, bénéfices importants, rentabilité élevée'
    }
  },

  // Impacts sociaux
  {
    id: 'social-1',
    impactType: 'social',
    question: 'Quel impact sur les emplois et les compétences ?',
    description: 'Effets sur l\'emploi et l\'évolution des métiers',
    reflectionPoints: [
      'Y a-t-il des créations d\'emplois (data scientists, data engineers) ?',
      'Y a-t-il des transformations de postes existants ?',
      'Faut-il former les employés à de nouvelles compétences ?',
      'Y a-t-il un risque de suppression de postes ?',
      'Comment le projet affecte-t-il la satisfaction au travail ?'
    ],
    scaleGuide: {
      low: 'Impact minimal sur les emplois, pas de transformation majeure',
      medium: 'Création de quelques postes, formation nécessaire',
      high: 'Transformation importante des métiers, création/suppression de postes'
    }
  },
  {
    id: 'social-2',
    impactType: 'social',
    question: 'Quel impact sur les clients et utilisateurs finaux ?',
    description: 'Effets sur l\'expérience utilisateur et la société',
    reflectionPoints: [
      'Le projet améliore-t-il l\'expérience client ?',
      'Y a-t-il un impact sur l\'accessibilité des services ?',
      'Le projet crée-t-il de nouveaux services utiles ?',
      'Y a-t-il des risques d\'exclusion ou de discrimination ?',
      'Le projet respecte-t-il la vie privée des utilisateurs ?'
    ],
    scaleGuide: {
      low: 'Impact limité sur les utilisateurs',
      medium: 'Amélioration modérée de l\'expérience utilisateur',
      high: 'Transformation de l\'expérience utilisateur, impact sociétal important'
    }
  },
  {
    id: 'social-3',
    impactType: 'social',
    question: 'Quel impact sur l\'éthique et la responsabilité ?',
    description: 'Considérations éthiques et responsabilité sociale',
    reflectionPoints: [
      'Y a-t-il des risques de biais algorithmiques ?',
      'Le projet respecte-t-il la vie privée et les données personnelles ?',
      'Y a-t-il des risques de discrimination ?',
      'Le projet est-il transparent et explicable ?',
      'Y a-t-il des enjeux de responsabilité (décisions automatisées) ?'
    ],
    scaleGuide: {
      low: 'Risques éthiques limités, conformité simple',
      medium: 'Quelques enjeux éthiques à gérer, conformité nécessaire',
      high: 'Enjeux éthiques majeurs, conformité stricte, responsabilité importante'
    }
  }
];

/**
 * Obtenir les questions par type d'impact
 */
export function getImpactQuestionsByType(
  impactType: ImpactGuideQuestion['impactType']
): ImpactGuideQuestion[] {
  return impactGuideQuestions.filter(q => q.impactType === impactType);
}

/**
 * Obtenir toutes les questions pour un type d'impact
 */
export function getAllImpactQuestions(): ImpactGuideQuestion[] {
  return impactGuideQuestions;
}


