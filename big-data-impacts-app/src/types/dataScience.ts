/**
 * Types pour les exercices Data Science
 */

export type ExerciseType = 
  | 'data-analysis'      // Analyse de données
  | 'model-building'    // Création de modèles
  | 'visualization'     // Visualisation
  | 'interpretation'    // Interprétation de résultats
  | 'evaluation'        // Évaluation de modèles
  | 'preprocessing';    // Préparation des données

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DataScienceExercise {
  id: string;
  title: string;
  description: string;
  type: ExerciseType;
  difficulty: DifficultyLevel;
  dataset?: {
    name: string;
    description: string;
    url?: string;
    columns: string[];
    sampleSize: number;
  };
  instructions: string[];
  questions: ExerciseQuestion[];
  expectedOutput?: {
    type: 'code' | 'text' | 'visualization' | 'metric';
    description: string;
  };
  hints: string[];
  solution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseQuestion {
  id: string;
  type: 'mcq' | 'code' | 'text' | 'numeric' | 'visualization';
  prompt: string;
  options?: string[];
  answer?: string | number | string[];
  explanation?: string;
  codeTemplate?: string;
  expectedOutput?: any;
}

export interface ExerciseSubmission {
  id: string;
  exerciseId: string;
  userId: string;
  answers: {
    questionId: string;
    answer: string | number | string[] | any;
  }[];
  code?: string;
  score?: number;
  feedback?: string;
  submittedAt: string;
}

export interface AlgorithmInfo {
  name: string;
  category: 'supervised' | 'unsupervised' | 'reinforcement' | 'deep-learning';
  description: string;
  useCases: string[];
  parameters: {
    name: string;
    description: string;
    type: string;
    default?: any;
  }[];
  pros: string[];
  cons: string[];
  whenToUse: string;
}

export interface MetricInfo {
  name: string;
  category: 'classification' | 'regression' | 'clustering' | 'general';
  description: string;
  formula?: string;
  interpretation: string;
  range: string;
  bestValue: 'higher' | 'lower';
  examples: string[];
}


