import { create } from 'zustand';
import type { UseCase } from '../types';

interface UseCaseStore {
  useCases: UseCase[];
  addUseCase: (useCase: Omit<UseCase, 'id' | 'createdAt' | 'updatedAt'>) => UseCase;
  updateUseCase: (id: string, useCase: Partial<UseCase>) => void;
  deleteUseCase: (id: string) => void;
  getUseCase: (id: string) => UseCase | undefined;
  getUseCasesBySector: (sector: string) => UseCase[];
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'big-data-use-cases';

export const useUseCaseStore = create<UseCaseStore>()((set, get) => ({
  useCases: [],
  
  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ useCases: parsed });
      }
    } catch (e) {
      console.error('Error loading from storage:', e);
    }
  },
  
  saveToStorage: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().useCases));
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
  },
  
  addUseCase: (useCase) => {
    const newUseCase: UseCase = {
      ...useCase,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => {
      const newState = { useCases: [...state.useCases, newUseCase] };
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.useCases));
      }, 0);
      return newState;
    });
    return newUseCase;
  },
  
  updateUseCase: (id, updates) => {
    set((state) => {
      const newState = {
        useCases: state.useCases.map((uc) =>
          uc.id === id
            ? { ...uc, ...updates, updatedAt: new Date().toISOString() }
            : uc
        ),
      };
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.useCases));
      }, 0);
      return newState;
    });
  },
  
  deleteUseCase: (id) => {
    set((state) => {
      const newState = { useCases: state.useCases.filter((uc) => uc.id !== id) };
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.useCases));
      }, 0);
      return newState;
    });
  },
  
  getUseCase: (id) => {
    return get().useCases.find((uc) => uc.id === id);
  },
  
  getUseCasesBySector: (sector) => {
    return get().useCases.filter((uc) => uc.sector === sector);
  },
}));

