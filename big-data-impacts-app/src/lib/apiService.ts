import { supabase } from './supabaseClient';

// Récupérer l'ID utilisateur depuis localStorage ou session
async function getUserIdAsync(): Promise<string> {
  // Si on est dans un iframe, essayer de récupérer le userId depuis le parent
  if (window.parent !== window) {
    // Envoyer un message au parent pour demander le userId
    window.parent.postMessage({ type: 'GET_USER_ID' }, '*');
    
    // Écouter la réponse
    return new Promise<string>((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'USER_ID' && event.data.userId) {
          window.removeEventListener('message', handler);
          localStorage.setItem('big-data-user-id', event.data.userId);
          resolve(event.data.userId);
          return;
        }
      };
      
      window.addEventListener('message', handler);
      
      // Timeout après 1 seconde si pas de réponse
      setTimeout(() => {
        window.removeEventListener('message', handler);
        // Utiliser un ID temporaire
        const stored = localStorage.getItem('big-data-user-id');
        if (stored) {
          resolve(stored);
        } else {
          const userId = `temp-${crypto.randomUUID()}`;
          localStorage.setItem('big-data-user-id', userId);
          resolve(userId);
        }
      }, 1000);
    });
  }
  
  // Sinon, utiliser un ID temporaire stocké dans localStorage
  const stored = localStorage.getItem('big-data-user-id');
  if (stored) {
    return stored;
  }
  
  // Générer un ID unique pour cet utilisateur
  const userId = `temp-${crypto.randomUUID()}`;
  localStorage.setItem('big-data-user-id', userId);
  return userId;
}

export interface UseCaseAnalysisData {
  useCaseId: string;
  useCaseTitle: string;
  useCaseData: {
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
  };
  analysis: {
    summary: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    score: {
      overall: number;
      organizational: number;
      technical: number;
      economic: number;
      social: number;
    };
  };
  appliedSuggestions?: {
    technologies?: string[];
    challenges?: string[];
    impacts?: {
      organizational?: number;
      technical?: number;
      economic?: number;
      social?: number;
    };
    roi?: number;
  };
}

/**
 * Sauvegarde une analyse IA dans Supabase
 */
export async function saveUseCaseAnalysis(data: UseCaseAnalysisData): Promise<void> {
  if (!supabase) {
    console.warn('⚠️ Supabase non configuré. L\'analyse ne sera pas sauvegardée.');
    return;
  }

  try {
    const userId = await getUserIdAsync();
    if (!userId) {
      throw new Error('Impossible de récupérer l\'ID utilisateur');
    }

    const { error } = await supabase
      .from('use_case_analyses')
      .upsert(
        {
          user_id: userId,
          use_case_id: data.useCaseId,
          use_case_title: data.useCaseTitle,
          use_case_data: data.useCaseData,
          analysis: data.analysis,
          applied_suggestions: data.appliedSuggestions || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,use_case_id',
        }
      );

    if (error) {
      throw error;
    }

    console.log('✅ Analyse IA sauvegardée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de l\'analyse:', error);
    // Ne pas bloquer l'utilisateur si la sauvegarde échoue
    console.warn('⚠️ L\'analyse n\'a pas pu être sauvegardée, mais le cas d\'usage a été créé');
  }
}

/**
 * Met à jour une analyse IA avec les suggestions appliquées
 */
export async function updateUseCaseAnalysis(
  useCaseId: string,
  appliedSuggestions: UseCaseAnalysisData['appliedSuggestions']
): Promise<void> {
  if (!supabase) {
    console.warn('⚠️ Supabase non configuré. La mise à jour ne sera pas sauvegardée.');
    return;
  }

  try {
    const userId = await getUserIdAsync();
    if (!userId) {
      throw new Error('Impossible de récupérer l\'ID utilisateur');
    }

    const { error } = await supabase
      .from('use_case_analyses')
      .update({
        applied_suggestions: appliedSuggestions,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('use_case_id', useCaseId);

    if (error) {
      throw error;
    }

    console.log('✅ Analyse IA mise à jour avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'analyse:', error);
    // Ne pas bloquer l'utilisateur si la mise à jour échoue
  }
}

/**
 * Interface pour les soumissions d'exercices Data Science
 */
export interface ExerciseSubmissionData {
  exerciseId: string;
  exerciseTitle: string;
  userId: string;
  answers: {
    questionId: string;
    answer: string | number | string[] | any;
  }[];
  score?: number;
  feedback?: string;
}

/**
 * Sauvegarde une soumission d'exercice Data Science dans Supabase
 */
export async function saveExerciseSubmission(data: ExerciseSubmissionData): Promise<void> {
  if (!supabase) {
    console.warn('⚠️ Supabase non configuré. La soumission ne sera pas sauvegardée.');
    return;
  }

  try {
    const userId = await getUserIdAsync();
    if (!userId) {
      throw new Error('Impossible de récupérer l\'ID utilisateur');
    }

    const { error } = await supabase
      .from('data_science_exercises')
      .upsert(
        {
          user_id: userId,
          exercise_id: data.exerciseId,
          exercise_title: data.exerciseTitle,
          answers: data.answers,
          score: data.score || null,
          feedback: data.feedback || null,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,exercise_id',
        }
      );

    if (error) {
      throw error;
    }

    console.log('✅ Soumission d\'exercice sauvegardée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la soumission:', error);
    console.warn('⚠️ La soumission n\'a pas pu être sauvegardée, mais elle est stockée localement');
  }
}
