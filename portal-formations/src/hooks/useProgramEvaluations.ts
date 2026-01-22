import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import type {
  ProgramEvaluation,
  ProgramEvaluationAttempt,
  EvaluationQuestion,
  EvaluationResultsSummary
} from '../types/database';

interface UseProgramEvaluationsOptions {
  programId?: string;
  evaluationId?: string;
}

interface UseProgramEvaluationsReturn {
  // Données
  evaluations: ProgramEvaluation[];
  currentEvaluation: ProgramEvaluation | null;
  attempts: ProgramEvaluationAttempt[];
  myAttempts: ProgramEvaluationAttempt[];
  resultsSummary: EvaluationResultsSummary | null;

  // État
  isLoading: boolean;
  error: string | null;

  // Actions CRUD évaluation
  createEvaluation: (data: Partial<ProgramEvaluation>) => Promise<ProgramEvaluation | null>;
  updateEvaluation: (id: string, updates: Partial<ProgramEvaluation>) => Promise<void>;
  deleteEvaluation: (id: string) => Promise<void>;
  publishEvaluation: (id: string) => Promise<void>;
  unpublishEvaluation: (id: string) => Promise<void>;

  // Actions questions
  addQuestion: (evaluationId: string, question: EvaluationQuestion) => Promise<void>;
  updateQuestion: (evaluationId: string, questionId: string, updates: Partial<EvaluationQuestion>) => Promise<void>;
  deleteQuestion: (evaluationId: string, questionId: string) => Promise<void>;
  reorderQuestions: (evaluationId: string, questions: EvaluationQuestion[]) => Promise<void>;

  // Actions tentatives (apprenant)
  startAttempt: (evaluationId: string) => Promise<ProgramEvaluationAttempt | null>;
  saveAttempt: (attemptId: string, answers: Record<string, string>) => Promise<void>;
  submitAttempt: (attemptId: string) => Promise<ProgramEvaluationAttempt | null>;

  // Rafraîchissement
  refresh: () => Promise<void>;
}

export function useProgramEvaluations({
  programId,
  evaluationId
}: UseProgramEvaluationsOptions = {}): UseProgramEvaluationsReturn {
  const { user } = useAuth();

  const [evaluations, setEvaluations] = useState<ProgramEvaluation[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<ProgramEvaluation | null>(null);
  const [attempts, setAttempts] = useState<ProgramEvaluationAttempt[]>([]);
  const [myAttempts, setMyAttempts] = useState<ProgramEvaluationAttempt[]>([]);
  const [resultsSummary, setResultsSummary] = useState<EvaluationResultsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      console.log('⚠️ Pas d\'utilisateur, arrêt du chargement');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Charger les évaluations du programme
      if (programId) {
        console.log('🔍 Chargement des évaluations pour le programme:', programId);
        console.log('👤 Utilisateur actuel:', user?.id);
        
        // Vérifier le rôle de l'utilisateur (avec timeout plus long)
        let userRole: string | null = null;
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user?.id)
            .single();
          
          if (profileError) {
            console.warn('⚠️ Erreur lors de la récupération du profil:', profileError);
          } else {
            userRole = profile?.role || null;
            console.log('👤 Rôle utilisateur:', userRole);
          }
        } catch (err) {
          console.warn('⚠️ Exception lors de la récupération du profil:', err);
        }
        
        console.log('📋 Tentative de récupération des évaluations...');
        const { data: evaluationsData, error: evaluationsError } = await supabase
          .from('program_evaluations')
          .select('*')
          .eq('program_id', programId)
          .order('created_at', { ascending: false });

        if (evaluationsError) {
          console.error('❌ Erreur lors du chargement des évaluations:', evaluationsError);
          console.error('❌ Code erreur:', evaluationsError.code);
          console.error('❌ Message:', evaluationsError.message);
          console.error('❌ Détails:', evaluationsError.details);
          console.error('❌ Hint:', evaluationsError.hint);
          
          // Si erreur de permission, essayer de récupérer seulement les publiées
          if (evaluationsError.code === '42501' || evaluationsError.message?.includes('permission')) {
            console.warn('⚠️ Permission refusée, tentative de récupération des évaluations publiées uniquement');
            const { data: publishedData, error: publishedError } = await supabase
              .from('program_evaluations')
              .select('*')
              .eq('program_id', programId)
              .eq('is_published', true)
              .order('created_at', { ascending: false });
            
            if (publishedError) {
              throw publishedError;
            }
            console.log('✅ Évaluations publiées récupérées:', publishedData?.length || 0);
            setEvaluations(publishedData || []);
            return;
          }
          
          throw evaluationsError;
        }
        
        console.log('✅ Évaluations récupérées:', evaluationsData?.length || 0, evaluationsData);
        setEvaluations(evaluationsData || []);
      }

      // Charger une évaluation spécifique
      if (evaluationId) {
        const { data: evalData, error: evalError } = await supabase
          .from('program_evaluations')
          .select('*')
          .eq('id', evaluationId)
          .single();

        if (evalError) throw evalError;
        setCurrentEvaluation(evalData);

        // Charger toutes les tentatives (pour les trainers)
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('program_evaluation_attempts')
          .select('*')
          .eq('evaluation_id', evaluationId)
          .order('submitted_at', { ascending: false });

        if (attemptsError) {
          console.error('Error loading attempts:', attemptsError);
          // Si erreur RLS, c'est peut-être un étudiant - on ignore mais on log l'erreur
          setAttempts([]);
        } else {
          console.log('Loaded attempts:', attemptsData?.length || 0);
          
          // Charger les profiles séparément si on a des tentatives
          if (attemptsData && attemptsData.length > 0) {
            const userIds = [...new Set(attemptsData.map(a => a.user_id))];
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', userIds);
            
            // Créer un map pour faciliter l'accès
            const profilesMap = new Map(
              (profilesData || []).map(p => [p.id, p])
            );
            
            // Enrichir les tentatives avec les profiles
            const enrichedAttempts = attemptsData.map(attempt => ({
              ...attempt,
              profiles: profilesMap.get(attempt.user_id) || null
            }));
            
            setAttempts(enrichedAttempts);
          } else {
            setAttempts(attemptsData || []);
          }
        }

        // Charger le résumé
        const { data: summaryData, error: summaryError } = await supabase
          .from('evaluation_results_summary')
          .select('*')
          .eq('evaluation_id', evaluationId)
          .single();

        if (summaryError) {
          console.error('Error loading results summary:', summaryError);
          // Si la vue n'existe pas ou retourne une erreur, calculer manuellement
          if (attemptsData && attemptsData.length > 0 && currentEvaluation) {
            const submittedAttempts = attemptsData.filter(a => a.submitted_at);
            const totalParticipants = new Set(submittedAttempts.map(a => a.user_id)).size;
            const passedCount = submittedAttempts.filter(a => a.is_passed).length;
            const failedCount = submittedAttempts.filter(a => !a.is_passed).length;
            const percentages = submittedAttempts.map(a => a.percentage || 0).filter(p => p > 0);
            const avgScore = percentages.length > 0
              ? percentages.reduce((sum, p) => sum + p, 0) / percentages.length
              : null;

            setResultsSummary({
              evaluation_id: evaluationId,
              program_id: currentEvaluation.program_id,
              evaluation_title: currentEvaluation.title,
              program_title: '', // On ne peut pas le récupérer facilement ici
              total_participants: totalParticipants,
              passed_count: passedCount,
              failed_count: failedCount,
              average_score: avgScore,
              min_score: percentages.length > 0 ? Math.min(...percentages) : null,
              max_score: percentages.length > 0 ? Math.max(...percentages) : null
            });
          } else {
            setResultsSummary(null);
          }
        } else {
          console.log('Loaded results summary:', summaryData);
          setResultsSummary(summaryData);
        }
      }

      // Charger mes tentatives
      if (evaluationId) {
        const { data: myAttemptsData, error: myAttemptsError } = await supabase
          .from('program_evaluation_attempts')
          .select('*')
          .eq('evaluation_id', evaluationId)
          .eq('user_id', user.id)
          .order('attempt_number', { ascending: true });

        if (!myAttemptsError) {
          setMyAttempts(myAttemptsData || []);
        }
      }
    } catch (err) {
      console.error('Error loading program evaluations:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [user, programId, evaluationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // CRUD Évaluation
  const createEvaluation = async (data: Partial<ProgramEvaluation>): Promise<ProgramEvaluation | null> => {
    try {
      const { data: result, error: insertError } = await supabase
        .from('program_evaluations')
        .insert({
          ...data,
          program_id: programId,
          created_by: user?.id,
          questions: data.questions || []
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await loadData();
      return result;
    } catch (err) {
      console.error('Error creating evaluation:', err);
      setError(err instanceof Error ? err.message : 'Erreur de création');
      return null;
    }
  };

  const updateEvaluation = async (id: string, updates: Partial<ProgramEvaluation>): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('program_evaluations')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await loadData();
    } catch (err) {
      console.error('Error updating evaluation:', err);
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour');
      throw err;
    }
  };

  const deleteEvaluation = async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('program_evaluations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await loadData();
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      setError(err instanceof Error ? err.message : 'Erreur de suppression');
      throw err;
    }
  };

  const publishEvaluation = async (id: string): Promise<void> => {
    await updateEvaluation(id, { is_published: true });
  };

  const unpublishEvaluation = async (id: string): Promise<void> => {
    await updateEvaluation(id, { is_published: false });
  };

  // Gestion des questions
  const addQuestion = async (evalId: string, question: EvaluationQuestion): Promise<void> => {
    const evaluation = evaluations.find(e => e.id === evalId) || currentEvaluation;
    if (!evaluation) return;

    const updatedQuestions = [...evaluation.questions, question];
    await updateEvaluation(evalId, { questions: updatedQuestions });
  };

  const updateQuestion = async (
    evalId: string,
    questionId: string,
    updates: Partial<EvaluationQuestion>
  ): Promise<void> => {
    const evaluation = evaluations.find(e => e.id === evalId) || currentEvaluation;
    if (!evaluation) return;

    const updatedQuestions = evaluation.questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    );
    await updateEvaluation(evalId, { questions: updatedQuestions });
  };

  const deleteQuestion = async (evalId: string, questionId: string): Promise<void> => {
    const evaluation = evaluations.find(e => e.id === evalId) || currentEvaluation;
    if (!evaluation) return;

    const updatedQuestions = evaluation.questions.filter(q => q.id !== questionId);
    await updateEvaluation(evalId, { questions: updatedQuestions });
  };

  const reorderQuestions = async (evalId: string, questions: EvaluationQuestion[]): Promise<void> => {
    await updateEvaluation(evalId, { questions });
  };

  // Actions tentatives (apprenant)
  const startAttempt = async (evalId: string): Promise<ProgramEvaluationAttempt | null> => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('program_evaluation_attempts')
        .insert({
          evaluation_id: evalId,
          user_id: user.id,
          answers: {},
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await loadData();
      return data;
    } catch (err) {
      console.error('Error starting attempt:', err);
      setError(err instanceof Error ? err.message : 'Erreur de démarrage');
      return null;
    }
  };

  const saveAttempt = async (attemptId: string, answers: Record<string, string>): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('program_evaluation_attempts')
        .update({ answers })
        .eq('id', attemptId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error saving attempt:', err);
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
      throw err;
    }
  };

  const submitAttempt = async (attemptId: string): Promise<ProgramEvaluationAttempt | null> => {
    try {
      const { data, error: updateError } = await supabase
        .from('program_evaluation_attempts')
        .update({
          submitted_at: new Date().toISOString()
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (updateError) throw updateError;
      await loadData();
      return data;
    } catch (err) {
      console.error('Error submitting attempt:', err);
      setError(err instanceof Error ? err.message : 'Erreur de soumission');
      return null;
    }
  };

  return {
    evaluations,
    currentEvaluation,
    attempts,
    myAttempts,
    resultsSummary,
    isLoading,
    error,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    publishEvaluation,
    unpublishEvaluation,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    startAttempt,
    saveAttempt,
    submitAttempt,
    refresh: loadData
  };
}
