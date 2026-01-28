import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import type {
  LiveQuizSession,
  LiveQuizAnswer,
  LiveQuizScore,
  LeaderboardEntry,
  QuestionResult,
  QuizQuestion,
  GradebookActivity
} from '../types/sessions';

interface UseLiveQuizOptions {
  sessionId: string;
  activityId: string;
  isTrainer: boolean;
}

interface UseLiveQuizReturn {
  // État du quiz
  quizState: LiveQuizSession | null;
  currentQuestion: QuizQuestion | null;
  questions: QuizQuestion[];
  questionResults: Map<number, QuestionResult>;
  leaderboard: LeaderboardEntry[];
  
  // État personnel (apprenant)
  myAnswer: string | string[] | null;
  myScore: LiveQuizScore | null;
  hasAnswered: boolean;
  
  // Timer
  timeRemaining: number;
  
  // État général
  isLoading: boolean;
  error: string | null;
  
  // Actions formateur
  trainerActions: {
    startQuiz: () => Promise<void>;
    showQuestion: (index: number) => Promise<void>;
    openAnswers: () => Promise<void>;
    closeAnswers: () => Promise<void>;
    showResults: () => Promise<void>;
    showLeaderboard: () => Promise<void>;
    nextQuestion: () => Promise<void>;
    endQuiz: () => Promise<void>;
  };
  
  // Actions apprenant
  submitAnswer: (answer: string | string[]) => Promise<void>;
  
  // Rafraîchissement
  refresh: () => Promise<void>;
}

export function useLiveQuiz({
  sessionId,
  activityId,
  isTrainer
}: UseLiveQuizOptions): UseLiveQuizReturn {
  const { user, profile } = useAuth();
  
  // État
  const [quizState, setQuizState] = useState<LiveQuizSession | null>(null);
  const [activity, setActivity] = useState<GradebookActivity | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionResults, setQuestionResults] = useState<Map<number, QuestionResult>>(new Map());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myAnswer, setMyAnswer] = useState<string | string[] | null>(null);
  const [myScore, setMyScore] = useState<LiveQuizScore | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les données initiales
  const loadData = useCallback(async () => {
    if (!sessionId || !activityId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Charger l'activité et ses questions
      const { data: activityData, error: activityError } = await supabase
        .from('gradebook_activities')
        .select('*')
        .eq('id', activityId)
        .single();
      
      if (activityError) throw activityError;
      setActivity(activityData);
      setQuestions((activityData.questions as QuizQuestion[]) || []);
      
      // Charger l'état du quiz live
      const { data: quizData, error: quizError } = await supabase
        .from('live_quiz_sessions')
        .select('*')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (quizError && quizError.code !== 'PGRST116') throw quizError;
      setQuizState(quizData);
      
      if (quizData) {
        // Mettre à jour la question actuelle
        const qs = (activityData.questions as QuizQuestion[]) || [];
        setCurrentQuestion(qs[quizData.current_question_index] || null);
        setLeaderboard(quizData.leaderboard || []);
        
        // Reconstruire questionResults depuis la base pour toutes les questions déjà traitées
        // (évite les résultats manquants pour les questions 2, 4, etc. après refresh ou cumul)
        const { data: allAnswers } = await supabase
          .from('live_quiz_answers')
          .select('*')
          .eq('live_quiz_id', quizData.id);
        
        if (allAnswers && allAnswers.length > 0) {
          const resultsMap = new Map<number, QuestionResult>();
          const questionIndices = [...new Set(allAnswers.map((a: { question_index: number }) => a.question_index))];
          for (const qi of questionIndices) {
            const question = qs[qi];
            if (!question) continue;
            const answersForQ = allAnswers.filter((a: { question_index: number }) => a.question_index === qi);
            const distribution: Record<string, number> = {};
            let correctCount = 0;
            let totalTime = 0;
            answersForQ.forEach((a: { answer: unknown; is_correct?: boolean; answer_time_ms?: number }) => {
              const key = JSON.stringify(a.answer);
              distribution[key] = (distribution[key] || 0) + 1;
              if (a.is_correct) correctCount++;
              totalTime += a.answer_time_ms || 0;
            });
            const q = question as QuizQuestion & { answer?: string | string[] };
            const correctAnswer = q.correct_answer ?? q.answer ?? '';
            resultsMap.set(qi, {
              question_index: qi,
              correct_answer: correctAnswer,
              answer_distribution: distribution,
              correct_count: correctCount,
              total_answers: answersForQ.length,
              average_time_ms: answersForQ.length ? totalTime / answersForQ.length : 0
            });
          }
          setQuestionResults(resultsMap);
        } else {
          setQuestionResults(new Map());
        }
        
        // Calculer le temps restant
        if (quizData.question_started_at && quizData.question_time_limit) {
          const elapsed = (Date.now() - new Date(quizData.question_started_at).getTime()) / 1000;
          const remaining = Math.max(0, quizData.question_time_limit - elapsed);
          setTimeRemaining(Math.floor(remaining));
        }
        
        // Charger mon score si apprenant
        if (!isTrainer && user) {
          const { data: scoreData } = await supabase
            .from('live_quiz_scores')
            .select('*')
            .eq('live_quiz_id', quizData.id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          setMyScore(scoreData);
          
          // Vérifier si j'ai déjà répondu à la question actuelle
          const { data: answerData } = await supabase
            .from('live_quiz_answers')
            .select('*')
            .eq('live_quiz_id', quizData.id)
            .eq('user_id', user.id)
            .eq('question_index', quizData.current_question_index)
            .maybeSingle();
          
          if (answerData) {
            setMyAnswer(answerData.answer);
            setHasAnswered(true);
          } else {
            setMyAnswer(null);
            setHasAnswered(false);
          }
        }
      }
      
    } catch (err) {
      console.error('Error loading quiz data:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, activityId, isTrainer, user]);

  // Charger au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timer
  useEffect(() => {
    if (timeRemaining > 0 && quizState?.status === 'answering') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState?.status, timeRemaining]);

  // Abonnements temps réel
  useEffect(() => {
    if (!activityId) return;
    
    const channel = supabase.channel(`live-quiz:${activityId}`, {
      config: { broadcast: { self: true } }
    });
    
    // Écouter les changements d'état du quiz
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'live_quiz_sessions',
      filter: `activity_id=eq.${activityId}`
    }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newState = payload.new as LiveQuizSession;
        setQuizState(newState);
        setLeaderboard(newState.leaderboard || []);
        
        // Nouvelle session : vider les résultats pour éviter cumul avec une session précédente
        if (payload.eventType === 'INSERT') {
          setQuestionResults(new Map());
        }
        
        // Mettre à jour la question actuelle
        setCurrentQuestion(questions[newState.current_question_index] || null);
        
        // Reset l'état de réponse pour une nouvelle question
        if (payload.eventType === 'UPDATE') {
          const oldState = payload.old as LiveQuizSession;
          if (newState.current_question_index !== oldState.current_question_index) {
            setMyAnswer(null);
            setHasAnswered(false);
          }
        }
        
        // Démarrer le timer si on passe en mode réponse
        if (newState.status === 'answering' && newState.question_time_limit) {
          setTimeRemaining(newState.question_time_limit);
        }
      }
    });
    
    // Écouter les broadcasts pour les résultats
    channel.on('broadcast', { event: 'question_results' }, ({ payload }) => {
      const result = payload as QuestionResult;
      setQuestionResults(prev => {
        const updated = new Map(prev);
        updated.set(result.question_index, result);
        return updated;
      });
    });
    
    // Écouter le compteur de réponses (formateur)
    if (isTrainer) {
      channel.on('broadcast', { event: 'answer_count' }, ({ payload }) => {
        setQuizState(prev => prev ? {
          ...prev,
          answers_received: payload.count
        } : null);
      });
    }
    
    channel.subscribe();
    channelRef.current = channel;
    
    return () => {
      channel.unsubscribe();
    };
  }, [activityId, questions, isTrainer]);

  // Actions formateur
  const trainerActions = {
    startQuiz: async () => {
      if (!questions.length) return;
      
      // Compter les participants
      const { count } = await supabase
        .from('session_members')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('role', 'learner')
        .in('status', ['active', 'enrolled']);
      
      // Créer la session de quiz
      const { data, error } = await supabase
        .from('live_quiz_sessions')
        .insert({
          session_id: sessionId,
          activity_id: activityId,
          status: 'waiting',
          total_questions: questions.length,
          current_question_index: 0,
          participant_count: count || 0,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error starting quiz:', error);
        throw error;
      }
      
      setQuizState(data);
    },
    
    showQuestion: async (index: number) => {
      if (!quizState || index >= questions.length) return;
      
      const question = questions[index];
      
      await supabase
        .from('live_quiz_sessions')
        .update({
          status: 'question_display',
          current_question_index: index,
          answers_received: 0
        })
        .eq('id', quizState.id);
      
      setCurrentQuestion(question);
    },
    
    openAnswers: async () => {
      if (!quizState || !currentQuestion) return;
      
      const timeLimit = currentQuestion.time_limit || 30;
      
      await supabase
        .from('live_quiz_sessions')
        .update({
          status: 'answering',
          question_started_at: new Date().toISOString(),
          question_time_limit: timeLimit
        })
        .eq('id', quizState.id);
      
      setTimeRemaining(timeLimit);
    },
    
    closeAnswers: async () => {
      if (!quizState) return;
      
      await supabase
        .from('live_quiz_sessions')
        .update({ status: 'answer_closed' })
        .eq('id', quizState.id);
      
      setTimeRemaining(0);
    },
    
    showResults: async () => {
      if (!quizState || !currentQuestion) return;
      
      // Récupérer toutes les réponses
      const { data: answers } = await supabase
        .from('live_quiz_answers')
        .select('*')
        .eq('live_quiz_id', quizState.id)
        .eq('question_index', quizState.current_question_index);
      
      // Calculer les statistiques
      const distribution: Record<string, number> = {};
      let correctCount = 0;
      let totalTime = 0;
      
      answers?.forEach(a => {
        const key = JSON.stringify(a.answer);
        distribution[key] = (distribution[key] || 0) + 1;
        if (a.is_correct) correctCount++;
        totalTime += a.answer_time_ms || 0;
      });
      
      const result: QuestionResult = {
        question_index: quizState.current_question_index,
        correct_answer: currentQuestion.correct_answer,
        answer_distribution: distribution,
        correct_count: correctCount,
        total_answers: answers?.length || 0,
        average_time_ms: answers?.length ? totalTime / answers.length : 0
      };
      
      // Mettre à jour l'état
      await supabase
        .from('live_quiz_sessions')
        .update({ status: 'showing_results' })
        .eq('id', quizState.id);
      
      // Broadcast les résultats
      channelRef.current?.send({
        type: 'broadcast',
        event: 'question_results',
        payload: result
      });
      
      setQuestionResults(prev => {
        const updated = new Map(prev);
        updated.set(result.question_index, result);
        return updated;
      });
    },
    
    showLeaderboard: async () => {
      if (!quizState) return;
      
      // Récupérer le classement
      const { data: leaderboardData } = await supabase
        .rpc('get_live_quiz_leaderboard', {
          p_live_quiz_id: quizState.id,
          p_limit: 10
        });
      
      await supabase
        .from('live_quiz_sessions')
        .update({ 
          status: 'leaderboard',
          leaderboard: leaderboardData || []
        })
        .eq('id', quizState.id);
      
      setLeaderboard(leaderboardData || []);
    },
    
    nextQuestion: async () => {
      if (!quizState) return;
      
      const nextIndex = quizState.current_question_index + 1;
      
      if (nextIndex < questions.length) {
        await trainerActions.showQuestion(nextIndex);
      } else {
        await trainerActions.endQuiz();
      }
    },
    
    endQuiz: async () => {
      if (!quizState) return;
      
      await supabase
        .from('live_quiz_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', quizState.id);
    }
  };

  // Action apprenant: soumettre une réponse
  const submitAnswer = async (answer: string | string[]) => {
    if (!quizState || !user || hasAnswered || quizState.status !== 'answering') return;
    
    const answerTime = quizState.question_time_limit 
      ? (quizState.question_time_limit - timeRemaining) * 1000 
      : 0;
    
    // Vérifier si correct
    const isCorrect = JSON.stringify(answer) === JSON.stringify(currentQuestion?.correct_answer);
    
    // Calculer les points
    const basePoints = currentQuestion?.points || 100;
    const timeBonus = isCorrect && quizState.question_time_limit
      ? Math.floor((timeRemaining / quizState.question_time_limit) * basePoints * 0.5)
      : 0;
    const totalPoints = isCorrect ? basePoints + timeBonus : 0;
    
    // Enregistrer la réponse
    await supabase
      .from('live_quiz_answers')
      .insert({
        live_quiz_id: quizState.id,
        user_id: user.id,
        question_index: quizState.current_question_index,
        answer: answer,
        answer_time_ms: answerTime,
        is_correct: isCorrect,
        points_earned: totalPoints,
        time_bonus: timeBonus
      });
    
    // Mettre à jour le score
    const newScore = {
      total_score: (myScore?.total_score || 0) + totalPoints,
      correct_answers: (myScore?.correct_answers || 0) + (isCorrect ? 1 : 0),
      total_answered: (myScore?.total_answered || 0) + 1
    };
    
    await supabase
      .from('live_quiz_scores')
      .upsert({
        live_quiz_id: quizState.id,
        user_id: user.id,
        ...newScore
      }, { onConflict: 'live_quiz_id,user_id' });
    
    setMyAnswer(answer);
    setHasAnswered(true);
    setMyScore(prev => prev ? { ...prev, ...newScore } : newScore as LiveQuizScore);
    
    // Notifier le formateur
    channelRef.current?.send({
      type: 'broadcast',
      event: 'answer_count',
      payload: { count: (quizState.answers_received || 0) + 1 }
    });
  };

  return {
    quizState,
    currentQuestion,
    questions,
    questionResults,
    leaderboard,
    myAnswer,
    myScore,
    hasAnswered,
    timeRemaining,
    isLoading,
    error,
    trainerActions,
    submitAnswer,
    refresh: loadData
  };
}
