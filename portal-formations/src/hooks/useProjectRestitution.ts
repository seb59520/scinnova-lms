import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import type {
  SessionProjectRestitution,
  ProjectSubmission,
  ProjectEvaluation,
  ProjectRestitutionTemplate,
  EvaluationCriterion,
  CriterionScore,
  ProjectFile,
  ToolUsed,
  ProjectEvaluationSummary
} from '../types/sessions';

interface UseProjectRestitutionOptions {
  sessionId: string;
  restitutionId?: string;
  isTrainer?: boolean;
}

interface UseProjectRestitutionReturn {
  // Données
  restitutions: SessionProjectRestitution[];
  currentRestitution: SessionProjectRestitution | null;
  submissions: ProjectSubmission[];
  evaluations: Map<string, ProjectEvaluation>; // submission_id -> evaluation
  mySubmission: ProjectSubmission | null;
  myEvaluation: ProjectEvaluation | null;
  templates: ProjectRestitutionTemplate[];
  summary: ProjectEvaluationSummary | null;
  
  // État
  isLoading: boolean;
  error: string | null;
  
  // Actions formateur
  trainerActions: {
    createRestitution: (data: Partial<SessionProjectRestitution>) => Promise<SessionProjectRestitution | null>;
    updateRestitution: (id: string, updates: Partial<SessionProjectRestitution>) => Promise<void>;
    deleteRestitution: (id: string) => Promise<void>;
    openRestitution: (id: string) => Promise<void>;
    closeRestitution: (id: string) => Promise<void>;
    evaluateSubmission: (submissionId: string, scores: Record<string, CriterionScore>, feedback: {
      global_feedback?: string;
      strengths?: string;
      improvements?: string;
      private_notes?: string;
      final_score?: number;
    }) => Promise<ProjectEvaluation | null>;
    publishEvaluation: (evaluationId: string) => Promise<void>;
    publishAllEvaluations: (restitutionId: string) => Promise<void>;
    returnSubmission: (submissionId: string, reason: string) => Promise<void>;
  };
  
  // Actions apprenant
  learnerActions: {
    startSubmission: (restitutionId: string) => Promise<ProjectSubmission | null>;
    saveSubmissionDraft: (submissionId: string, data: Partial<ProjectSubmission>) => Promise<void>;
    submitSubmission: (submissionId: string) => Promise<void>;
    uploadFile: (submissionId: string, file: File) => Promise<ProjectFile | null>;
    deleteFile: (submissionId: string, filePath: string) => Promise<void>;
    addTool: (submissionId: string, tool: ToolUsed) => Promise<void>;
    removeTool: (submissionId: string, toolIndex: number) => Promise<void>;
  };
  
  // Rafraîchissement
  refresh: () => Promise<void>;
}

export function useProjectRestitution({
  sessionId,
  restitutionId,
  isTrainer = false
}: UseProjectRestitutionOptions): UseProjectRestitutionReturn {
  const { user } = useAuth();
  
  // État
  const [restitutions, setRestitutions] = useState<SessionProjectRestitution[]>([]);
  const [currentRestitution, setCurrentRestitution] = useState<SessionProjectRestitution | null>(null);
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, ProjectEvaluation>>(new Map());
  const [templates, setTemplates] = useState<ProjectRestitutionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    if (!sessionId || !user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Charger les restitutions de la session
      const { data: restitutionsData, error: restitutionsError } = await supabase
        .from('session_project_restitutions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
      
      if (restitutionsError) throw restitutionsError;
      setRestitutions(restitutionsData || []);
      
      // Si un ID spécifique est fourni, le charger
      if (restitutionId) {
        const current = restitutionsData?.find(r => r.id === restitutionId) || null;
        setCurrentRestitution(current);
      }
      
      // Charger les soumissions
      let submissionsQuery = supabase
        .from('project_submissions')
        .select(`
          *,
          profile:profiles(full_name)
        `)
        .eq('session_id', sessionId);
      
      if (restitutionId) {
        submissionsQuery = submissionsQuery.eq('restitution_id', restitutionId);
      }
      
      // Si pas formateur, filtrer sur ses propres soumissions
      if (!isTrainer) {
        submissionsQuery = submissionsQuery.eq('user_id', user.id);
      }
      
      const { data: submissionsData, error: submissionsError } = await submissionsQuery
        .order('submitted_at', { ascending: false, nullsFirst: false });
      
      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);
      
      // Charger les évaluations
      let evaluationsQuery = supabase
        .from('project_evaluations')
        .select('*')
        .eq('session_id', sessionId);
      
      if (restitutionId) {
        evaluationsQuery = evaluationsQuery.eq('restitution_id', restitutionId);
      }
      
      // Si pas formateur, ne voir que ses évaluations publiées
      if (!isTrainer) {
        evaluationsQuery = evaluationsQuery
          .eq('user_id', user.id)
          .eq('is_published', true);
      }
      
      const { data: evaluationsData, error: evaluationsError } = await evaluationsQuery;
      
      if (evaluationsError) throw evaluationsError;
      
      const evaluationsMap = new Map<string, ProjectEvaluation>();
      evaluationsData?.forEach(e => evaluationsMap.set(e.submission_id, e));
      setEvaluations(evaluationsMap);
      
      // Charger les templates si formateur
      if (isTrainer) {
        const { data: templatesData, error: templatesError } = await supabase
          .from('project_restitution_templates')
          .select('*')
          .eq('is_active', true);
        
        if (templatesError) throw templatesError;
        setTemplates(templatesData || []);
      }
      
    } catch (err) {
      console.error('Error loading project restitution data:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, restitutionId, user, isTrainer]);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!sessionId) return;
    
    const channel = supabase.channel(`project-restitution:${sessionId}`);
    
    // Écouter les nouvelles soumissions
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'project_submissions',
      filter: `session_id=eq.${sessionId}`
    }, () => {
      loadData();
    });
    
    // Écouter les évaluations
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'project_evaluations',
      filter: `session_id=eq.${sessionId}`
    }, () => {
      loadData();
    });
    
    // Écouter les changements de restitutions
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'session_project_restitutions',
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
    createRestitution: async (data: Partial<SessionProjectRestitution>): Promise<SessionProjectRestitution | null> => {
      const { data: result, error } = await supabase
        .from('session_project_restitutions')
        .insert({
          ...data,
          session_id: sessionId,
          created_by: user?.id,
          status: 'draft'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating restitution:', error);
        return null;
      }
      
      return result;
    },
    
    updateRestitution: async (id: string, updates: Partial<SessionProjectRestitution>) => {
      const { error } = await supabase
        .from('session_project_restitutions')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating restitution:', error);
        throw error;
      }
    },
    
    deleteRestitution: async (id: string) => {
      const { error } = await supabase
        .from('session_project_restitutions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting restitution:', error);
        throw error;
      }
    },
    
    openRestitution: async (id: string) => {
      const { error } = await supabase
        .from('session_project_restitutions')
        .update({
          status: 'open',
          available_from: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error opening restitution:', error);
        throw error;
      }
    },
    
    closeRestitution: async (id: string) => {
      const { error } = await supabase
        .from('session_project_restitutions')
        .update({ status: 'closed' })
        .eq('id', id);
      
      if (error) {
        console.error('Error closing restitution:', error);
        throw error;
      }
    },
    
    evaluateSubmission: async (
      submissionId: string,
      scores: Record<string, CriterionScore>,
      feedback: {
        global_feedback?: string;
        strengths?: string;
        improvements?: string;
        private_notes?: string;
        final_score?: number;
      }
    ): Promise<ProjectEvaluation | null> => {
      // Récupérer la soumission
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) {
        console.error('Submission not found');
        return null;
      }
      
      // Créer ou mettre à jour l'évaluation
      const { data, error } = await supabase
        .from('project_evaluations')
        .upsert({
          submission_id: submissionId,
          restitution_id: submission.restitution_id,
          session_id: sessionId,
          user_id: submission.user_id,
          criteria_scores: scores,
          global_feedback: feedback.global_feedback,
          strengths: feedback.strengths,
          improvements: feedback.improvements,
          private_notes: feedback.private_notes,
          final_score: feedback.final_score,
          evaluated_by: user?.id,
          evaluated_at: new Date().toISOString()
        }, { onConflict: 'submission_id' })
        .select()
        .single();
      
      if (error) {
        console.error('Error evaluating submission:', error);
        return null;
      }
      
      // Mettre à jour le statut de la soumission
      await supabase
        .from('project_submissions')
        .update({ status: 'evaluated' })
        .eq('id', submissionId);
      
      return data;
    },
    
    publishEvaluation: async (evaluationId: string) => {
      const { error } = await supabase
        .from('project_evaluations')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', evaluationId);
      
      if (error) {
        console.error('Error publishing evaluation:', error);
        throw error;
      }
    },
    
    publishAllEvaluations: async (restitutionId: string) => {
      const { error } = await supabase
        .from('project_evaluations')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('restitution_id', restitutionId)
        .eq('is_published', false);
      
      if (error) {
        console.error('Error publishing all evaluations:', error);
        throw error;
      }
    },
    
    returnSubmission: async (submissionId: string, reason: string) => {
      const { error } = await supabase
        .from('project_submissions')
        .update({
          status: 'returned',
          metadata: { return_reason: reason, returned_at: new Date().toISOString() }
        })
        .eq('id', submissionId);
      
      if (error) {
        console.error('Error returning submission:', error);
        throw error;
      }
    },
    
    deleteSubmission: async (submissionId: string) => {
      // Supprimer d'abord l'évaluation associée si elle existe
      await supabase
        .from('project_evaluations')
        .delete()
        .eq('submission_id', submissionId);
      
      // Puis supprimer la soumission
      const { error } = await supabase
        .from('project_submissions')
        .delete()
        .eq('id', submissionId);
      
      if (error) {
        console.error('Error deleting submission:', error);
        throw error;
      }
    },
    
    resetSubmission: async (submissionId: string) => {
      // Réinitialiser la soumission pour permettre à l'étudiant de resoumettre
      const { error } = await supabase
        .from('project_submissions')
        .update({
          status: 'draft',
          submitted_at: null
        })
        .eq('id', submissionId);
      
      // Supprimer l'évaluation associée si elle existe
      await supabase
        .from('project_evaluations')
        .delete()
        .eq('submission_id', submissionId);
      
      if (error) {
        console.error('Error resetting submission:', error);
        throw error;
      }
    }
  };

  // Actions apprenant
  const learnerActions = {
    startSubmission: async (restitutionId: string): Promise<ProjectSubmission | null> => {
      if (!user) return null;
      
      // Vérifier si une soumission existe déjà
      const existing = submissions.find(s => s.restitution_id === restitutionId && s.user_id === user.id);
      if (existing) return existing;
      
      const { data, error } = await supabase
        .from('project_submissions')
        .insert({
          restitution_id: restitutionId,
          session_id: sessionId,
          user_id: user.id,
          project_title: 'Mon projet',
          status: 'draft',
          files: [],
          tools_used: [],
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
    
    saveSubmissionDraft: async (submissionId: string, data: Partial<ProjectSubmission>) => {
      const { error } = await supabase
        .from('project_submissions')
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
      const submission = submissions.find(s => s.id === submissionId);
      const restitution = restitutions.find(r => r.id === submission?.restitution_id);
      
      // Vérifier si c'est en retard
      const isLate = restitution?.due_date && new Date() > new Date(restitution.due_date);
      
      const { error } = await supabase
        .from('project_submissions')
        .update({
          status: isLate ? 'late' : 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      
      if (error) {
        console.error('Error submitting:', error);
        throw error;
      }
    },
    
    uploadFile: async (submissionId: string, file: File): Promise<ProjectFile | null> => {
      if (!user) return null;
      
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) return null;
      
      // Nettoyer le nom de fichier pour Supabase Storage
      // Remplacer les caractères spéciaux, accents et espaces
      const cleanFileName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Remplacer les caractères spéciaux par _
        .replace(/_+/g, '_') // Éviter les underscores multiples
        .toLowerCase();
      
      const filePath = `${user.id}/${submissionId}/${Date.now()}_${cleanFileName}`;
      
      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
      }
      
      const newFile: ProjectFile = {
        name: file.name,
        path: filePath,
        size: file.size,
        type: file.type,
        uploaded_at: new Date().toISOString()
      };
      
      // Mettre à jour la liste des fichiers
      const currentFiles = submission.files || [];
      const { error: updateError } = await supabase
        .from('project_submissions')
        .update({
          files: [...currentFiles, newFile]
        })
        .eq('id', submissionId);
      
      if (updateError) {
        console.error('Error updating files list:', updateError);
        return null;
      }
      
      return newFile;
    },
    
    deleteFile: async (submissionId: string, filePath: string) => {
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) return;
      
      // Supprimer du storage
      await supabase.storage
        .from('project-files')
        .remove([filePath]);
      
      // Mettre à jour la liste
      const updatedFiles = submission.files.filter(f => f.path !== filePath);
      const { error } = await supabase
        .from('project_submissions')
        .update({ files: updatedFiles })
        .eq('id', submissionId);
      
      if (error) {
        console.error('Error deleting file:', error);
        throw error;
      }
    },
    
    addTool: async (submissionId: string, tool: ToolUsed) => {
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) return;
      
      const currentTools = submission.tools_used || [];
      const { error } = await supabase
        .from('project_submissions')
        .update({
          tools_used: [...currentTools, tool]
        })
        .eq('id', submissionId);
      
      if (error) {
        console.error('Error adding tool:', error);
        throw error;
      }
    },
    
    removeTool: async (submissionId: string, toolIndex: number) => {
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) return;
      
      const updatedTools = submission.tools_used.filter((_, i) => i !== toolIndex);
      const { error } = await supabase
        .from('project_submissions')
        .update({ tools_used: updatedTools })
        .eq('id', submissionId);
      
      if (error) {
        console.error('Error removing tool:', error);
        throw error;
      }
    }
  };

  // Ma soumission
  const mySubmission = user && restitutionId
    ? submissions.find(s => s.user_id === user.id && s.restitution_id === restitutionId) || null
    : null;
  
  // Mon évaluation
  const myEvaluation = mySubmission ? evaluations.get(mySubmission.id) || null : null;

  // Calcul du résumé
  const summary: ProjectEvaluationSummary | null = isTrainer && restitutionId ? {
    total_submissions: submissions.filter(s => s.status !== 'draft').length,
    evaluated_count: Array.from(evaluations.values()).filter(e => e.evaluated_at).length,
    pending_count: submissions.filter(s => s.status === 'submitted' && !evaluations.has(s.id)).length,
    average_score: currentRestitution?.average_score || null,
    score_distribution: calculateScoreDistribution(Array.from(evaluations.values())),
    criteria_averages: calculateCriteriaAverages(
      Array.from(evaluations.values()),
      currentRestitution?.criteria || []
    )
  } : null;

  return {
    restitutions,
    currentRestitution,
    submissions,
    evaluations,
    mySubmission,
    myEvaluation,
    templates,
    summary,
    isLoading,
    error,
    trainerActions,
    learnerActions,
    refresh: loadData
  };
}

// Helper: calculer la distribution des scores
function calculateScoreDistribution(evaluations: ProjectEvaluation[]): { range: string; count: number }[] {
  const ranges = [
    { range: '0-4', min: 0, max: 4 },
    { range: '5-7', min: 5, max: 7 },
    { range: '8-9', min: 8, max: 9 },
    { range: '10-11', min: 10, max: 11 },
    { range: '12-13', min: 12, max: 13 },
    { range: '14-15', min: 14, max: 15 },
    { range: '16-17', min: 16, max: 17 },
    { range: '18-20', min: 18, max: 20 }
  ];
  
  return ranges.map(({ range, min, max }) => ({
    range,
    count: evaluations.filter(e => e.score_20 >= min && e.score_20 <= max).length
  }));
}

// Helper: calculer les moyennes par critère
function calculateCriteriaAverages(
  evaluations: ProjectEvaluation[],
  criteria: EvaluationCriterion[]
): { criterion_id: string; criterion_name: string; average_stars: number }[] {
  return criteria.map(criterion => {
    const scores = evaluations
      .map(e => e.criteria_scores[criterion.id]?.stars)
      .filter((s): s is number => s !== undefined);
    
    const average = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
    
    return {
      criterion_id: criterion.id,
      criterion_name: criterion.name,
      average_stars: Math.round(average * 10) / 10
    };
  });
}
