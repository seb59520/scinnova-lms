/**
 * Jeux de données pour les démonstrations ML
 */

export interface MLDataPoint {
  x: number;
  y: number;
  label?: number;
  metadata?: Record<string, any>;
}

export interface MLDataset {
  id: string;
  name: string;
  description: string;
  category: 'classification' | 'clustering' | 'anomaly';
  data: MLDataPoint[];
  source: string;
}

/**
 * Dataset 1: Classification binaire - Prédiction de crédit
 * Simule des données de clients avec revenu (x) et score de crédit (y)
 */
export const creditDataset: MLDataset = {
  id: 'credit',
  name: 'Prédiction de crédit',
  description: 'Données simulées de clients : revenu mensuel (x) vs score de crédit (y). Classe 0 = crédit refusé, Classe 1 = crédit accordé.',
  category: 'classification',
  source: 'Simulé - basé sur des patterns réels',
  data: [
    // Clients avec crédit refusé (classe 0) - revenus faibles, scores bas
    { x: 1.5, y: 2.0, label: 0, metadata: { revenu: 1500, score: 200 } },
    { x: 1.8, y: 2.2, label: 0, metadata: { revenu: 1800, score: 220 } },
    { x: 2.0, y: 1.8, label: 0, metadata: { revenu: 2000, score: 180 } },
    { x: 2.2, y: 2.5, label: 0, metadata: { revenu: 2200, score: 250 } },
    { x: 1.6, y: 1.5, label: 0, metadata: { revenu: 1600, score: 150 } },
    { x: 2.1, y: 2.0, label: 0, metadata: { revenu: 2100, score: 200 } },
    { x: 1.9, y: 1.9, label: 0, metadata: { revenu: 1900, score: 190 } },
    { x: 2.3, y: 2.1, label: 0, metadata: { revenu: 2300, score: 210 } },
    
    // Clients avec crédit accordé (classe 1) - revenus élevés, scores élevés
    { x: 6.5, y: 7.0, label: 1, metadata: { revenu: 6500, score: 700 } },
    { x: 7.0, y: 7.5, label: 1, metadata: { revenu: 7000, score: 750 } },
    { x: 6.8, y: 6.8, label: 1, metadata: { revenu: 6800, score: 680 } },
    { x: 7.5, y: 8.0, label: 1, metadata: { revenu: 7500, score: 800 } },
    { x: 6.2, y: 6.5, label: 1, metadata: { revenu: 6200, score: 650 } },
    { x: 7.2, y: 7.8, label: 1, metadata: { revenu: 7200, score: 780 } },
    { x: 6.9, y: 7.2, label: 1, metadata: { revenu: 6900, score: 720 } },
    { x: 7.8, y: 8.2, label: 1, metadata: { revenu: 7800, score: 820 } },
    
    // Zone de transition (quelques exemples mixtes)
    { x: 4.0, y: 4.5, label: 0, metadata: { revenu: 4000, score: 450 } },
    { x: 4.5, y: 5.0, label: 1, metadata: { revenu: 4500, score: 500 } },
    { x: 3.8, y: 4.2, label: 0, metadata: { revenu: 3800, score: 420 } },
    { x: 5.0, y: 5.5, label: 1, metadata: { revenu: 5000, score: 550 } },
  ],
};

/**
 * Dataset 2: Clustering - Segmentation clients e-commerce
 * Simule des groupes de clients selon leurs habitudes d'achat
 */
export const customerSegmentationDataset: MLDataset = {
  id: 'customers',
  name: 'Segmentation clients e-commerce',
  description: 'Données de clients selon fréquence d\'achat (x) et montant moyen (y). 3 groupes naturels de clients.',
  category: 'clustering',
  source: 'Simulé - basé sur des patterns e-commerce réels',
  data: [
    // Groupe 1: Clients occasionnels (fréquence faible, montant faible)
    { x: 1.0, y: 1.2, metadata: { frequence: 1, montant: 20 } },
    { x: 1.2, y: 1.0, metadata: { frequence: 1.2, montant: 15 } },
    { x: 0.8, y: 1.1, metadata: { frequence: 0.8, montant: 18 } },
    { x: 1.1, y: 0.9, metadata: { frequence: 1.1, montant: 12 } },
    { x: 0.9, y: 1.3, metadata: { frequence: 0.9, montant: 25 } },
    { x: 1.3, y: 1.1, metadata: { frequence: 1.3, montant: 19 } },
    { x: 1.0, y: 0.8, metadata: { frequence: 1.0, montant: 10 } },
    { x: 0.7, y: 1.0, metadata: { frequence: 0.7, montant: 16 } },
    
    // Groupe 2: Clients réguliers (fréquence moyenne, montant moyen)
    { x: 4.5, y: 4.8, metadata: { frequence: 4.5, montant: 80 } },
    { x: 5.0, y: 5.0, metadata: { frequence: 5.0, montant: 85 } },
    { x: 4.8, y: 4.5, metadata: { frequence: 4.8, montant: 75 } },
    { x: 5.2, y: 5.2, metadata: { frequence: 5.2, montant: 90 } },
    { x: 4.3, y: 4.7, metadata: { frequence: 4.3, montant: 78 } },
    { x: 5.1, y: 4.9, metadata: { frequence: 5.1, montant: 82 } },
    { x: 4.6, y: 5.1, metadata: { frequence: 4.6, montant: 88 } },
    { x: 4.9, y: 4.6, metadata: { frequence: 4.9, montant: 76 } },
    
    // Groupe 3: VIP (fréquence élevée, montant élevé)
    { x: 8.5, y: 8.8, metadata: { frequence: 8.5, montant: 180 } },
    { x: 9.0, y: 9.0, metadata: { frequence: 9.0, montant: 190 } },
    { x: 8.8, y: 8.5, metadata: { frequence: 8.8, montant: 170 } },
    { x: 9.2, y: 9.2, metadata: { frequence: 9.2, montant: 200 } },
    { x: 8.3, y: 8.7, metadata: { frequence: 8.3, montant: 175 } },
    { x: 9.1, y: 8.9, metadata: { frequence: 9.1, montant: 185 } },
    { x: 8.6, y: 9.1, metadata: { frequence: 8.6, montant: 195 } },
    { x: 8.9, y: 8.6, metadata: { frequence: 8.9, montant: 172 } },
  ],
};

/**
 * Dataset 3: Détection d'anomalies - Transactions bancaires
 * Simule des transactions normales avec quelques anomalies
 */
export const transactionDataset: MLDataset = {
  id: 'transactions',
  name: 'Transactions bancaires',
  description: 'Transactions normales (montant x, heure y) avec quelques anomalies suspectes à détecter.',
  category: 'anomaly',
  source: 'Simulé - basé sur des patterns de fraude',
  data: [
    // Transactions normales (cluster autour de 5, 5)
    { x: 4.8, y: 5.2, metadata: { montant: 48, heure: 14 } },
    { x: 5.1, y: 4.9, metadata: { montant: 51, heure: 12 } },
    { x: 5.0, y: 5.0, metadata: { montant: 50, heure: 13 } },
    { x: 4.9, y: 5.1, metadata: { montant: 49, heure: 15 } },
    { x: 5.2, y: 4.8, metadata: { montant: 52, heure: 11 } },
    { x: 4.7, y: 5.3, metadata: { montant: 47, heure: 16 } },
    { x: 5.3, y: 4.7, metadata: { montant: 53, heure: 10 } },
    { x: 4.6, y: 5.4, metadata: { montant: 46, heure: 17 } },
    { x: 5.4, y: 4.6, metadata: { montant: 54, heure: 9 } },
    { x: 4.5, y: 5.5, metadata: { montant: 45, heure: 18 } },
    { x: 5.5, y: 4.5, metadata: { montant: 55, heure: 8 } },
    { x: 4.4, y: 5.6, metadata: { montant: 44, heure: 19 } },
    { x: 5.6, y: 4.4, metadata: { montant: 56, heure: 7 } },
    { x: 4.3, y: 5.7, metadata: { montant: 43, heure: 20 } },
    { x: 5.7, y: 4.3, metadata: { montant: 57, heure: 6 } },
    { x: 4.2, y: 5.8, metadata: { montant: 42, heure: 21 } },
    { x: 5.8, y: 4.2, metadata: { montant: 58, heure: 5 } },
    { x: 4.1, y: 5.9, metadata: { montant: 41, heure: 22 } },
    { x: 5.9, y: 4.1, metadata: { montant: 59, heure: 4 } },
    { x: 4.0, y: 6.0, metadata: { montant: 40, heure: 23 } },
    
    // Anomalies (valeurs extrêmes)
    { x: 0.5, y: 0.3, metadata: { montant: 5, heure: 1, isAnomaly: true } }, // Montant très faible, heure suspecte
    { x: 9.5, y: 9.8, metadata: { montant: 950, heure: 23, isAnomaly: true } }, // Montant très élevé
    { x: 0.2, y: 9.5, metadata: { montant: 2, heure: 22, isAnomaly: true } }, // Montant très faible, heure tardive
    { x: 9.8, y: 0.1, metadata: { montant: 980, heure: 0, isAnomaly: true } }, // Montant très élevé, heure suspecte
    { x: 1.0, y: 1.0, metadata: { montant: 10, heure: 2, isAnomaly: true } }, // Valeur isolée
  ],
};

export const mlDatasets: MLDataset[] = [
  creditDataset,
  customerSegmentationDataset,
  transactionDataset,
];

export function getDatasetById(id: string): MLDataset | undefined {
  return mlDatasets.find(d => d.id === id);
}

export function getDatasetsByCategory(category: MLDataset['category']): MLDataset[] {
  return mlDatasets.filter(d => d.category === category);
}

