import { create } from 'zustand';
import type { DataScienceExercise, ExerciseSubmission } from '../types/dataScience';
import { dataScienceExercises } from '../data/dataScienceExercises';

interface DataScienceStore {
  exercises: DataScienceExercise[];
  submissions: ExerciseSubmission[];
  addSubmission: (submission: Omit<ExerciseSubmission, 'id' | 'submittedAt'>) => void;
  getSubmission: (exerciseId: string, userId: string) => ExerciseSubmission | undefined;
  getSubmissionsByExercise: (exerciseId: string) => ExerciseSubmission[];
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'data-science-submissions';

export const useDataScienceStore = create<DataScienceStore>()((set, get) => ({
  exercises: dataScienceExercises,
  submissions: [],

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ submissions: parsed });
      }
    } catch (e) {
      console.error('Error loading submissions from storage:', e);
    }
  },

  saveToStorage: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().submissions));
    } catch (e) {
      console.error('Error saving submissions to storage:', e);
    }
  },

  addSubmission: (submission) => {
    const newSubmission: ExerciseSubmission = {
      ...submission,
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
    };
    set((state) => {
      const newState = {
        submissions: [...state.submissions, newSubmission],
      };
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.submissions));
      }, 0);
      return newState;
    });
  },

  getSubmission: (exerciseId, userId) => {
    return get().submissions.find(
      (s) => s.exerciseId === exerciseId && s.userId === userId
    );
  },

  getSubmissionsByExercise: (exerciseId) => {
    return get().submissions.filter((s) => s.exerciseId === exerciseId);
  },
}));


