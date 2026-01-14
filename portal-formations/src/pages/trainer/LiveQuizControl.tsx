import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuiz } from '../../hooks/useLiveQuiz';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import {
  Play, Pause, SkipForward, Trophy, Users, Clock,
  CheckCircle, XCircle, ArrowLeft, Eye, Send
} from 'lucide-react';

export function LiveQuizControl() {
  const { sessionId, activityId } = useParams<{ sessionId: string; activityId: string }>();

  const {
    quizState,
    currentQuestion,
    questions,
    questionResults,
    leaderboard,
    timeRemaining,
    isLoading,
    error,
    trainerActions
  } = useLiveQuiz({
    sessionId: sessionId || '',
    activityId: activityId || '',
    isTrainer: true
  });

  if (!sessionId || !activityId) {
    return <div className="p-8 text-center">Paramètres manquants</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Chargement du quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  // Écran d'attente (pas de quiz démarré)
  if (!quizState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            to={`/trainer/session/${sessionId}`}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour à la session
          </Link>

          <div className="text-center">
            <div className="text-8xl mb-8">🎮</div>
            <h1 className="text-4xl font-bold text-white mb-4">Quiz Live</h1>
            <p className="text-xl text-white/70 mb-8">
              {questions.length} questions prêtes
            </p>

            <button
              onClick={trainerActions.startQuiz}
              className="px-8 py-4 bg-green-500 text-white text-xl font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg"
            >
              <Play className="h-6 w-6 inline mr-2" />
              Démarrer le Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Écran de contrôle du quiz
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to={`/trainer/session/${sessionId}`}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour
          </Link>

          <div className="flex items-center gap-6">
            {/* Participants */}
            <div className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              <span className="font-medium">{quizState.participant_count}</span>
              <span className="text-white/60">participants</span>
            </div>

            {/* Progression */}
            <div className="text-white">
              Question {quizState.current_question_index + 1} / {quizState.total_questions}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Panneau de contrôle */}
          <div className="col-span-3">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-4">Contrôles</h2>

              <div className="space-y-3">
                {quizState.status === 'waiting' && (
                  <button
                    onClick={() => trainerActions.showQuestion(0)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Eye className="h-5 w-5" />
                    Afficher Q1
                  </button>
                )}

                {quizState.status === 'question_display' && (
                  <button
                    onClick={trainerActions.openAnswers}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Play className="h-5 w-5" />
                    Ouvrir les réponses
                  </button>
                )}

                {quizState.status === 'answering' && (
                  <>
                    <div className="text-center py-4">
                      <div className="text-5xl font-mono font-bold text-yellow-400">
                        {timeRemaining}s
                      </div>
                      <div className="text-white/60 mt-2">
                        {quizState.answers_received} / {quizState.participant_count} réponses
                      </div>
                    </div>
                    <button
                      onClick={trainerActions.closeAnswers}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Pause className="h-5 w-5" />
                      Fermer les réponses
                    </button>
                  </>
                )}

                {quizState.status === 'answer_closed' && (
                  <button
                    onClick={trainerActions.showResults}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Afficher les résultats
                  </button>
                )}

                {quizState.status === 'showing_results' && (
                  <>
                    <button
                      onClick={trainerActions.showLeaderboard}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                      <Trophy className="h-5 w-5" />
                      Classement
                    </button>
                    <button
                      onClick={trainerActions.nextQuestion}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <SkipForward className="h-5 w-5" />
                      Question suivante
                    </button>
                  </>
                )}

                {quizState.status === 'leaderboard' && (
                  <button
                    onClick={trainerActions.nextQuestion}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <SkipForward className="h-5 w-5" />
                    {quizState.current_question_index + 1 < quizState.total_questions
                      ? 'Question suivante'
                      : 'Terminer le quiz'}
                  </button>
                )}

                {quizState.status === 'completed' && (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🏆</div>
                    <div className="text-xl font-bold">Quiz terminé !</div>
                  </div>
                )}
              </div>
            </div>

            {/* Liste des questions */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 mt-6 text-white">
              <h3 className="text-sm font-medium mb-3 text-white/70">Questions</h3>
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`flex items-center gap-2 p-2 rounded ${
                      idx === quizState.current_question_index
                        ? 'bg-blue-500/30 border border-blue-400'
                        : idx < quizState.current_question_index
                        ? 'bg-green-500/20'
                        : 'bg-white/5'
                    }`}
                  >
                    <span className="w-6 h-6 flex items-center justify-center text-sm rounded-full bg-white/10">
                      {idx + 1}
                    </span>
                    <span className="text-sm truncate flex-1">{q.question}</span>
                    {idx < quizState.current_question_index && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Zone principale */}
          <div className="col-span-9">
            {/* Question en cours */}
            {currentQuestion && ['question_display', 'answering', 'answer_closed'].includes(quizState.status) && (
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                  {currentQuestion.question}
                </h2>

                {currentQuestion.image_url && (
                  <img
                    src={currentQuestion.image_url}
                    alt=""
                    className="max-h-64 mx-auto mb-8 rounded-lg"
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  {currentQuestion.options?.map((option, idx) => {
                    const colors = [
                      'bg-red-500 hover:bg-red-600',
                      'bg-blue-500 hover:bg-blue-600',
                      'bg-yellow-500 hover:bg-yellow-600',
                      'bg-green-500 hover:bg-green-600'
                    ];

                    return (
                      <div
                        key={option.id}
                        className={`${colors[idx]} text-white p-6 rounded-xl text-xl font-medium text-center`}
                      >
                        {option.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Résultats */}
            {quizState.status === 'showing_results' && currentQuestion && (
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                  Résultats
                </h2>

                {questionResults.get(quizState.current_question_index) && (
                  <>
                    <div className="text-center mb-8">
                      <div className="text-5xl font-bold text-green-600 mb-2">
                        {Math.round(
                          (questionResults.get(quizState.current_question_index)!.correct_count /
                            Math.max(1, questionResults.get(quizState.current_question_index)!.total_answers)) *
                            100
                        )}%
                      </div>
                      <div className="text-gray-500">
                        {questionResults.get(quizState.current_question_index)!.correct_count} /{' '}
                        {questionResults.get(quizState.current_question_index)!.total_answers} réponses correctes
                      </div>
                    </div>

                    <div className="space-y-4">
                      {currentQuestion.options?.map((option) => {
                        const result = questionResults.get(quizState.current_question_index)!;
                        const count = result.answer_distribution[JSON.stringify(option.id)] || 0;
                        const percentage = (count / Math.max(1, result.total_answers)) * 100;
                        const isCorrect = currentQuestion.correct_answer === option.id;

                        return (
                          <div key={option.id} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-gray-700'}`}>
                                {isCorrect && '✓ '}
                                {option.text}
                              </span>
                              <span className="text-gray-500">{count} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-1000 ${
                                  isCorrect ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Classement */}
            {quizState.status === 'leaderboard' && (
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-8 flex items-center justify-center gap-2">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  Classement
                </h2>

                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((entry, idx) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-4 rounded-xl ${
                        idx === 0
                          ? 'bg-yellow-100 border-2 border-yellow-400'
                          : idx === 1
                          ? 'bg-gray-100 border-2 border-gray-400'
                          : idx === 2
                          ? 'bg-orange-100 border-2 border-orange-400'
                          : 'bg-gray-50 border'
                      }`}
                    >
                      <div
                        className={`text-3xl font-bold w-12 text-center ${
                          idx === 0
                            ? 'text-yellow-600'
                            : idx === 1
                            ? 'text-gray-600'
                            : idx === 2
                            ? 'text-orange-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                      </div>

                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{entry.display_name}</div>
                        <div className="text-sm text-gray-500">
                          {entry.correct_answers} bonnes réponses
                        </div>
                      </div>

                      <div className="text-2xl font-bold text-gray-900">{entry.total_score} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiz terminé */}
            {quizState.status === 'completed' && (
              <div className="bg-white rounded-2xl p-12 shadow-2xl text-center">
                <div className="text-8xl mb-6">🏆</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz terminé !</h2>
                <p className="text-xl text-gray-500 mb-8">
                  Félicitations à tous les participants !
                </p>

                <Link
                  to={`/trainer/session/${sessionId}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Retour à la session
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
