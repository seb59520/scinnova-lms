import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import type {
  GradebookActivity,
  LearnerSubmission,
  Grade,
  GradebookSummary
} from '../types/sessions';

interface UseGradebookOptions {
  sessionId: string;
  isTrainer?: boolean;
}

interface UseGradebookReturn {
  // Données
  activities: GradebookActivity[];
  submissions: Map<string, LearnerSubmission[]>; // activity_id -> submissions
  grades: Map<string, Grade>; // submission_id -> grade
  summaries: Map<string, GradebookSummary>; // user_id -> summary
  mySubmissions: LearnerSubmission[];
  mySummary: GradebookSummary | null;
  
  // État
  isLoading: boolean;
  error: string | null;
  
  // Actions formateur
  trainerActions: {
    createActivity: (activity: Partial<GradebookActivity>) => Promise<GradebookActivity | null>;
    updateActivity: (activityId: string, updates: Partial<GradebookActivity>) => Promise<void>;
    deleteActivity: (activityId: string) => Promise<void>;
    publishActivity: (activityId: string) => Promise<void>;
    gradeSubmission: (submissionId: string, gradeData: Partial<Grade>) => Promise<void>;
    publishGrade: (gradeId: string) => Promise<void>;
    publishAllGrades: (activityId: string) => Promise<void>;
  };
  
  // Actions apprenant
  learnerActions: {
    startSubmission: (activityId: string) => Promise<LearnerSubmission | null>;
    saveSubmissionDraft: (submissionId: string, data: Partial<LearnerSubmission>) => Promise<void>;
    submitSubmission: (submissionId: string) => Promise<void>;
    getMySubmission: (activityId: string) => LearnerSubmission | undefined;
  };
  
  // Rafraîchissement
  refresh: () => Promise<void>;
}

export function useGradebook({
  sessionId,
  isTrainer = false
}: UseGradebookOptions): UseGradebookReturn {
  const { user } = useAuth();
  
  // État
  const [activities, setActivities] = useState<GradebookActivity[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, LearnerSubmission[]>>(new Map());
  const [grades, setGrades] = useState<Map<string, Grade>>(new Map());
  const [summaries, setSummaries] = useState<Map<string, GradebookSummary>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    if (!sessionId || !user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Charger les activités
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('gradebook_activities')
        .select('*')
        .eq('session_id', sessionId)
        .order('position', { ascending: true });
      
      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);
      
      // Charger les soumissions
      let submissionsQuery = supabase
        .from('learner_submissions')
        .select(`
          *,
          profile:profiles(full_name, avatar_url)
        `)
        .eq('session_id', sessionId);
      
      // Si pas formateur, filtrer sur ses propres soumissions
      if (!isTrainer) {
        submissionsQuery = submissionsQuery.eq('user_id', user.id);
      }
      
      const { data: submissionsData, error: submissionsError } = await submissionsQuery;
      
      if (submissionsError) throw submissionsError;
      
      // Organiser les soumissions par activité
      const submissionsMap = new Map<string, LearnerSubmission[]>();
      
      submissionsData?.forEach(sub => {
        const activityId = sub.activity_id;
        if (!submissionsMap.has(activityId)) {
          submissionsMap.set(activityId, []);
        }
        submissionsMap.get(activityId)!.push(sub);
      });
      
      setSubmissions(submissionsMap);
      
      // Charger les notes séparément pour éviter les problèmes de jointure
      const submissionIds = submissionsData?.map(s => s.id) || [];
      const gradesMap = new Map<string, Grade>();
      
      if (submissionIds.length > 0) {
        const { data: gradesData, error: gradesError } = await supabase
          .from('grades')
          .select('*')
          .in('submission_id', submissionIds);
        
        if (!gradesError && gradesData) {
          gradesData.forEach(grade => {
            gradesMap.set(grade.submission_id, grade);
          });
        }
      }
      
      setGrades(gradesMap);
      
      // Charger les résumés
      if (isTrainer) {
        const { data: summariesData, error: summariesError } = await supabase
          .from('session_gradebook_summary')
          .select('*')
          .eq('session_id', sessionId);
        
        if (summariesError) throw summariesError;
        
        const summariesMap = new Map<string, GradebookSummary>();
        summariesData?.forEach(s => summariesMap.set(s.user_id, s));
        setSummaries(summariesMap);
      } else {
        // Charger uniquement mon résumé
        const { data: mySummary, error: summaryError } = await supabase
          .from('session_gradebook_summary')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (summaryError) throw summaryError;
        
        if (mySummary) {
          const summariesMap = new Map<string, GradebookSummary>();
          summariesMap.set(user.id, mySummary);
          setSummaries(summariesMap);
        }
      }
      
    } catch (err) {
      console.error('Error loading gradebook data:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, user, isTrainer]);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!sessionId) return;
    
    const channel = supabase.channel(`gradebook:${sessionId}`);
    
    // Écouter les nouvelles soumissions
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'learner_submissions',
      filter: `session_id=eq.${sessionId}`
    }, () => {
      loadData();
    });
    
    // Écouter les changements de notes
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'grades',
      filter: `session_id=eq.${sessionId}`
    }, () => {
      loadData();
    });
    
    // Écouter les changements d'activités
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'gradebook_activities',
      filter: `session_id=eq.${sessionId}`
    }, () => {
      loadData();
    });
    
    channel.subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, loadData]);

  // Actions formateur
  const trainerActions = {
    createActivity: async (activity: Partial<GradebookActivity>): Promise<GradebookActivity | null> => {
      const { data, error } = await supabase
        .from('gradebook_activities')
        .insert({
          ...activity,
          session_id: sessionId,
          created_by: user?.id,
          position: activities.length
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating activity:', error);
        return null;
      }
      
      return data;
    },
    
    updateActivity: async (activityId: string, updates: Partial<GradebookActivity>) => {
      const { error } = await supabase
        .from('gradebook_activities')
        .update(updates)
        .eq('id', activityId);
      
      if (error) {
        console.error('Error updating activity:', error);
        throw error;
      }
    },
    
    deleteActivity: async (activityId: string) => {
      const { error } = await supabase
        .from('gradebook_activities')
        .delete()
        .eq('id', activityId);
      
      if (error) {
        console.error('Error deleting activity:', error);
        throw error;
      }
    },
    
    publishActivity: async (activityId: string) => {
      const { error } = await supabase
        .from('gradebook_activities')
        .update({ 
          status: 'published',
          available_from: new Date().toISOString()
        })
        .eq('id', activityId);
      
      if (error) {
        console.error('Error publishing activity:', error);
        throw error;
      }
    },
    
    gradeSubmission: async (submissionId: string, gradeData: Partial<Grade>) => {
      // Récupérer la soumission pour avoir les infos nécessaires
      const { data: submission, error: subError } = await supabase
        .from('learner_submissions')
        .select('activity_id, user_id')
        .eq('id', submissionId)
        .single();
      
      if (subError) throw subError;
      
      // Calculer le pourcentage et si réussi
      const activity = activities.find(a => a.id === submission.activity_id);
      const percentage = gradeData.score && activity 
        ? (gradeData.score / activity.max_points) * 100 
        : null;
      const passed = percentage !== null && activity 
        ? percentage >= activity.passing_score 
        : null;
      
      // Créer ou mettre à jour la note
      const { error } = await supabase
        .from('grades')
        .upsert({
          submission_id: submissionId,
          activity_id: submission.activity_id,
          session_id: sessionId,
          user_id: submission.user_id,
          ...gradeData,
          percentage,
          passed,
          max_score: activity?.max_points,
          final_score: gradeData.score,
          graded_by: user?.id,
          grading_method: 'manual'
        }, { onConflict: 'submission_id' });
      
      if (error) {
        console.error('Error grading submission:', error);
        throw error;
      }
      
      // Mettre à jour le statut de la soumission
      await supabase
        .from('learner_submissions')
        .update({ status: 'graded' })
        .eq('id', submissionId);
    },
    
    publishGrade: async (gradeId: string) => {
      const { error } = await supabase
        .from('grades')
        .update({ 
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', gradeId);
      
      if (error) {
        console.error('Error publishing grade:', error);
        throw error;
      }
    },
    
    publishAllGrades: async (activityId: string) => {
      const { error } = await supabase
        .from('grades')
        .update({ 
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('activity_id', activityId)
        .eq('is_published', false);
      
      if (error) {
        console.error('Error publishing all grades:', error);
        throw error;
      }
    }
  };

  // Actions apprenant
  const learnerActions = {
    startSubmission: async (activityId: string): Promise<LearnerSubmission | null> => {
      if (!user) return null;
      
      // Vérifier si une soumission existe déjà
      const existing = submissions.get(activityId)?.find(s => s.user_id === user.id);
      if (existing) return existing;
      
      const { data, error } = await supabase
        .from('learner_submissions')
        .insert({
          activity_id: activityId,
          session_id: sessionId,
          user_id: user.id,
          status: 'draft',
          started_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error starting submission:', error);
        return null;
      }
      
      return data;
    },
    
    saveSubmissionDraft: async (submissionId: string, data: Partial<LearnerSubmission>) => {
      const { error } = await supabase
        .from('learner_submissions')
        .update({
          ...data,
          last_saved_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      
      if (error) {
        console.error('Error saving draft:', error);
        throw error;
      }
    },
    
    submitSubmission: async (submissionId: string) => {
      const { error } = await supabase
        .from('learner_submissions')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      
      if (error) {
        console.error('Error submitting:', error);
        throw error;
      }
    },
    
    getMySubmission: (activityId: string): LearnerSubmission | undefined => {
      if (!user) return undefined;
      return submissions.get(activityId)?.find(s => s.user_id === user.id);
    }
  };

  // Mes soumissions
  const mySubmissions = user 
    ? Array.from(submissions.values()).flat().filter(s => s.user_id === user.id)
    : [];
  
  // Mon résumé
  const mySummary = user ? summaries.get(user.id) || null : null;

  return {
    activities,
    submissions,
    grades,
    summaries,
    mySubmissions,
    mySummary,
    isLoading,
    error,
    trainerActions,
    learnerActions,
    refresh: loadData
  };
}
