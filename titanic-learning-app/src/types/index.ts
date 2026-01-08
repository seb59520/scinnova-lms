export type ModuleId = 'big-data' | 'data-science' | 'machine-learning';

export interface Passenger {
  sexe: 'male' | 'female';
  age: number | null;
  classe: number;
  prix: number;
  embarquement: 'S' | 'C' | 'Q';
  survivant: 'oui' | 'non';
}

export interface Answer {
  questionId: string;
  dropdownValue: string;
  inputValue: string;
  timestamp: number;
}

export interface ModuleAnswers {
  [questionId: string]: Answer;
}

export interface AppState {
  'big-data': ModuleAnswers;
  'data-science': ModuleAnswers;
  'machine-learning': ModuleAnswers;
}

export interface Prediction {
  passenger: Passenger;
  userPrediction: 'oui' | 'non' | null;
  justification: string;
  revealed: boolean;
}
