export interface UseCase {
  id: string;
  title: string;
  description: string;
  sector: string;
  impacts: {
    organizational: number;
    technical: number;
    economic: number;
    social: number;
  };
  roi: number;
  technologies: string[];
  challenges: string[];
  createdAt: string;
  updatedAt: string;
}

export type Sector = 
  | 'Santé'
  | 'Finance'
  | 'E-commerce'
  | 'Logistique'
  | 'Industrie'
  | 'Autre';

export interface UseCaseFormData {
  title: string;
  description: string;
  sector: string;
  organizational: number;
  technical: number;
  economic: number;
  social: number;
  roi: number;
  technologies: string[];
  challenges: string[];
}


