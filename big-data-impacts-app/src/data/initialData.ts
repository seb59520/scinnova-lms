import type { UseCase } from '../types';

export const initialUseCases: Omit<UseCase, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Détection de fraude bancaire en temps réel',
    sector: 'Finance',
    description: 'Système de détection de fraude utilisant le machine learning pour analyser les transactions en temps réel et identifier les comportements suspects',
    impacts: {
      organizational: 8,
      technical: 9,
      economic: 9,
      social: 7,
    },
    roi: 350,
    technologies: ['Apache Kafka', 'TensorFlow', 'Spark Streaming', 'PostgreSQL', 'Redis'],
    challenges: ['Latence temps réel', 'Faux positifs', 'Conformité RGPD', 'Scalabilité'],
  },
  {
    title: 'Diagnostic médical assisté par IA',
    sector: 'Santé',
    description: "Système d'aide au diagnostic utilisant le deep learning pour analyser des images médicales (IRM, radiographies) et détecter des anomalies",
    impacts: {
      organizational: 9,
      technical: 10,
      economic: 8,
      social: 9,
    },
    roi: 280,
    technologies: ['PyTorch', 'TensorFlow', 'DICOM', 'AWS S3', 'Kubernetes'],
    challenges: ['Explicabilité', 'Conformité médicale', 'Biais algorithmiques', 'Intégration systèmes hospitaliers'],
  },
  {
    title: 'Système de recommandation de produits',
    sector: 'E-commerce',
    description: "Algorithme de recommandation personnalisé utilisant le collaborative filtering et le content-based filtering pour suggérer des produits aux clients",
    impacts: {
      organizational: 7,
      technical: 8,
      economic: 9,
      social: 6,
    },
    roi: 420,
    technologies: ['Apache Spark', 'MongoDB', 'Redis', 'Python', 'Scikit-learn'],
    challenges: ['Cold start problem', 'Scalabilité', 'Diversité des recommandations', 'Privacy'],
  },
  {
    title: 'Optimisation de la chaîne logistique',
    sector: 'Logistique',
    description: "Système d'optimisation des itinéraires et de la gestion des stocks utilisant l'optimisation combinatoire et la prédiction de la demande",
    impacts: {
      organizational: 8,
      technical: 7,
      economic: 9,
      social: 7,
    },
    roi: 380,
    technologies: ['Apache Hadoop', 'Python', 'OR-Tools', 'PostgreSQL', 'Apache Airflow'],
    challenges: ['Complexité algorithmique', 'Intégration systèmes existants', 'Données en temps réel', 'Coûts infrastructure'],
  },
  {
    title: 'Maintenance prédictive industrielle',
    sector: 'Industrie',
    description: "Système de prédiction des pannes d'équipements industriels utilisant l'analyse de données IoT et le machine learning",
    impacts: {
      organizational: 8,
      technical: 9,
      economic: 10,
      social: 6,
    },
    roi: 450,
    technologies: ['Apache Kafka', 'InfluxDB', 'TensorFlow', 'Grafana', 'Kubernetes'],
    challenges: ['Qualité données capteurs', 'Latence', 'Interprétabilité', 'Coûts IoT'],
  },
];

