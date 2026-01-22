import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { AppHeader } from '../components/AppHeader';
import type { ProgramEvaluation, EvaluationQuestion } from '../types/database';
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  Send
} from 'lucide-react';

export function StudentProgramEvaluation() {
  const { programId, evaluationId } = useParams<{ programId: string; evaluationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState<ProgramEvaluation | null>(null);
  const [programTitle, setProgramTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État du quiz
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
  } | null>(null);

  // Tentatives précédentes
  const [previousAttempts, setPreviousAttempts] = useState<any[]>([]);
  const [canAttempt, setCanAttempt] = useState(true);

  useEffect(() => {
    if (evaluationId && user) {
      loadEvaluation();
      loadPreviousAttempts();
    }
  }, [evaluationId, user]);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger l'évaluation
      const { data: evalData, error: evalError } = await supabase
        .from('program_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .eq('is_published', true)
        .single();

      if (evalError) throw evalError;
      if (!evalData) {
        setError('Évaluation introuvable ou non publiée.');
        return;
      }

      setEvaluation(evalData);

      // Charger le titre du programme
      const { data: programData } = await supabase
        .from('programs')
        .select('title')
        .eq('id', programId)
        .single();

      if (programData) {
        setProgramTitle(programData.title);
      }
    } catch (err) {
      console.error('Error loading evaluation:', err);
      setError('Erreur lors du chargement de l\'évaluation.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousAttempts = async () => {
    if (!user || !evaluationId) return;

    try {
      const { data: attempts } = await supabase
        .from('program_evaluation_attempts')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      setPreviousAttempts(attempts || []);

      // Vérifier si l'utilisateur peut encore tenter
      if (evaluation && attempts) {
        setCanAttempt(attempts.length < (evaluation.max_attempts || 3));
      }
    } catch (err) {
      console.error('Error loading attempts:', err);
    }
  };

  useEffect(() => {
    if (evaluation && previousAttempts.length > 0) {
      setCanAttempt(previousAttempts.length < (evaluation.max_attempts || 3));
    }
  }, [evaluation, previousAttempts]);

  // Timer
  useEffect(() => {
    if (!started || !evaluation?.time_limit_minutes || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [started, timeRemaining]);

  const handleStart = () => {
    if (!canAttempt) {
      setError('Vous avez atteint le nombre maximum de tentatives.');
      return;
    }

    setStarted(true);
    if (evaluation?.time_limit_minutes) {
      setTimeRemaining(evaluation.time_limit_minutes * 60);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (!evaluation || !user || submitting) return;

    setSubmitting(true);

    try {
      // Calculer le score pour les questions auto-corrigées (MCQ, true_false)
      let score = 0;
      let totalPoints = 0;

      evaluation.questions.forEach(q => {
        totalPoints += q.points;

        if (q.type === 'multiple_choice' || q.type === 'true_false') {
          if (answers[q.id] === q.correct_answer) {
            score += q.points;
          }
        }
      });

      const percentage = Math.round((score / totalPoints) * 100);
      const passed = percentage >= (evaluation.passing_score || 70);

      // Enregistrer la tentative
      const { error: insertError } = await supabase
        .from('program_evaluation_attempts')
        .insert({
          evaluation_id: evaluationId,
          user_id: user.id,
          answers: answers,
          score: score,
          total_points: totalPoints,
          percentage: percentage,
          is_passed: passed,
          submitted_at: new Date().toISOString(),
          graded_at: new Date().toISOString(),
          attempt_number: previousAttempts.length + 1
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        // Si la table n'existe pas, on affiche quand même le résultat localement
      }

      setResult({ score, total: totalPoints, percentage, passed });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      setError('Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  }, [evaluation, user, answers, evaluationId, previousAttempts, submitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !evaluation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-3xl mx-auto py-12 px-4 pt-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
          <Link
            to={`/programs/${programId}`}
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au programme
          </Link>
        </div>
      </div>
    );
  }

  // Page de résultat
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-2xl mx-auto py-12 px-4 pt-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              result.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {result.passed ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {result.passed ? 'Félicitations !' : 'Évaluation terminée'}
            </h1>

            <p className="text-gray-600 mb-6">
              {result.passed
                ? 'Vous avez réussi cette évaluation.'
                : `Vous n'avez pas atteint le score minimum de ${evaluation?.passing_score}%.`}
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-5xl font-bold mb-2" style={{
                color: result.passed ? '#16a34a' : '#dc2626'
              }}>
                {result.percentage}%
              </div>
              <div className="text-gray-500">
                {result.score} / {result.total} points
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Link
                to={`/programs/${programId}`}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Retour au programme
              </Link>
              {!result.passed && canAttempt && previousAttempts.length < (evaluation?.max_attempts || 3) - 1 && (
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setStarted(false);
                    setAnswers({});
                    setCurrentQuestionIndex(0);
                    setResult(null);
                    loadPreviousAttempts();
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Réessayer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page d'accueil de l'évaluation (avant de commencer)
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-2xl mx-auto py-12 px-4 pt-8">
          <Link
            to={`/programs/${programId}`}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au programme
          </Link>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="text-sm opacity-80 mb-1">{programTitle}</div>
              <h1 className="text-2xl font-bold">{evaluation?.title}</h1>
            </div>

            <div className="p-6">
              {evaluation?.description && (
                <p className="text-gray-600 mb-6">{evaluation.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {evaluation?.questions.length}
                  </div>
                  <div className="text-sm text-gray-500">Questions</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {evaluation?.passing_score}%
                  </div>
                  <div className="text-sm text-gray-500">Score minimum</div>
                </div>
                {evaluation?.time_limit_minutes && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {evaluation.time_limit_minutes}
                    </div>
                    <div className="text-sm text-gray-500">Minutes</div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {previousAttempts.length} / {evaluation?.max_attempts || 3}
                  </div>
                  <div className="text-sm text-gray-500">Tentatives</div>
                </div>
              </div>

              {/* Tentatives précédentes */}
              {previousAttempts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tentatives précédentes</h3>
                  <div className="space-y-2">
                    {previousAttempts.map((attempt, idx) => (
                      <div
                        key={attempt.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          attempt.is_passed ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <span className="text-sm">
                          Tentative {previousAttempts.length - idx}
                        </span>
                        <span className={`font-medium ${
                          attempt.is_passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attempt.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!canAttempt ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Vous avez atteint le nombre maximum de tentatives.
                </div>
              ) : (
                <button
                  onClick={handleStart}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                >
                  <Award className="w-5 h-5" />
                  Commencer l'évaluation
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz en cours
  const currentQuestion = evaluation?.questions[currentQuestionIndex];
  const totalQuestions = evaluation?.questions.length || 0;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe avec timer */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} / {totalQuestions}
            </div>
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
          {/* Barre de progression */}
          <div className="mt-2 h-1 bg-gray-200 rounded-full">
            <div
              className="h-1 bg-blue-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Contenu avec flèches de navigation latérales */}
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto relative">
          {/* Flèche gauche - Question précédente */}
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className={`fixed left-4 top-1/2 -translate-y-1/2 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 hover:shadow-xl'
            }`}
            title="Question précédente"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Flèche droite - Question suivante */}
          <button
            onClick={() => {
              if (currentQuestionIndex < totalQuestions - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
              }
            }}
            disabled={currentQuestionIndex >= totalQuestions - 1}
            className={`fixed right-4 top-1/2 -translate-y-1/2 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
              currentQuestionIndex >= totalQuestions - 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 hover:shadow-xl'
            }`}
            title="Question suivante"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="max-w-3xl mx-auto">
            {currentQuestion && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-6">
                  <span className="text-sm text-gray-500 mb-2 block">
                    {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                  </span>
                  <h2 className="text-xl font-medium text-gray-900">
                    {currentQuestion.question}
                  </h2>
                </div>

                {/* Options pour MCQ et Vrai/Faux */}
                {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[currentQuestion.id] === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={answers[currentQuestion.id] === option}
                          onChange={() => handleAnswerChange(currentQuestion.id, option)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-3 text-gray-900">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Champ texte pour questions ouvertes */}
                {(currentQuestion.type === 'text' || currentQuestion.type === 'code') && (
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    rows={currentQuestion.type === 'code' ? 8 : 4}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      currentQuestion.type === 'code' ? 'font-mono text-sm' : ''
                    }`}
                    placeholder={
                      currentQuestion.type === 'code'
                        ? '// Écrivez votre code ici...'
                        : 'Votre réponse...'
                    }
                  />
                )}

                {/* Navigation rapide au-dessus des boutons du bas */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Précédent
                  </button>

                  <span className="text-sm text-gray-500">
                    {currentQuestionIndex + 1} / {totalQuestions}
                  </span>

                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Suivant
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Terminer
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Précédent
          </button>

          <div className="flex gap-1">
            {evaluation?.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium ${
                  idx === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[evaluation.questions[idx].id]
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Suivant
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {submitting ? 'Envoi...' : 'Terminer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
