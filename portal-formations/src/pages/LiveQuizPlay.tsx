import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuiz } from '../hooks/useLiveQuiz';
import {
  Clock, CheckCircle, XCircle, Trophy, Users, ArrowLeft
} from 'lucide-react';

export function LiveQuizPlay() {
  const { sessionId, activityId } = useParams<{ sessionId: string; activityId: string }>();

  const {
    quizState,
    currentQuestion,
    questionResults,
    leaderboard,
    myAnswer,
    myScore,
    hasAnswered,
    timeRemaining,
    isLoading,
    error,
    submitAnswer
  } = useLiveQuiz({
    sessionId: sessionId || '',
    activityId: activityId || '',
    isTrainer: false
  });

  if (!sessionId || !activityId) {
    return <div className="p-8 text-center">Paramètres manquants</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Connexion au quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  // Écran d'attente
  if (!quizState || quizState.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-8xl mb-8 animate-pulse">🎮</div>
          <h1 className="text-3xl font-bold mb-4">Quiz en préparation...</h1>
          <p className="text-xl text-white/70">Le formateur va bientôt démarrer</p>
          {myScore && (
            <div className="mt-8 p-4 bg-white/10 rounded-xl">
              <div className="text-2xl font-bold">{myScore.total_score} pts</div>
              <div className="text-white/60">Votre score actuel</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Question affichée / Réponses ouvertes
  if (['question_display', 'answering', 'answer_closed'].includes(quizState.status) && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header avec score et timer */}
          <div className="flex items-center justify-between mb-6">
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full text-white">
              <span className="font-bold">{myScore?.total_score || 0}</span> pts
            </div>

            <div className={`
              flex items-center gap-2 text-4xl font-mono font-bold
              ${timeRemaining <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}
            `}>
              <Clock className="h-8 w-8" />
              {timeRemaining}s
            </div>

            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full text-white">
              Q{quizState.current_question_index + 1}/{quizState.total_questions}
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl mb-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              {currentQuestion.question}
            </h2>

            {currentQuestion.image_url && (
              <img
                src={currentQuestion.image_url}
                alt=""
                className="max-h-48 mx-auto mt-4 rounded-lg"
              />
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options?.map((option, idx) => {
              const colors = [
                { bg: 'bg-red-500', hover: 'hover:bg-red-600', selected: 'ring-red-300' },
                { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', selected: 'ring-blue-300' },
                { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', selected: 'ring-yellow-300' },
                { bg: 'bg-green-500', hover: 'hover:bg-green-600', selected: 'ring-green-300' }
              ];
              const color = colors[idx % colors.length];
              const isSelected = myAnswer === option.id;
              const canAnswer = quizState.status === 'answering' && !hasAnswered;

              return (
                <button
                  key={option.id}
                  onClick={() => canAnswer && submitAnswer(option.id)}
                  disabled={!canAnswer}
                  className={`
                    ${color.bg} ${canAnswer ? color.hover : ''} 
                    text-white p-6 rounded-xl text-xl font-medium
                    transition-all duration-200
                    ${isSelected ? `ring-4 ${color.selected} scale-105` : ''}
                    ${!canAnswer && !isSelected ? 'opacity-50' : ''}
                  `}
                >
                  <span className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Message de confirmation */}
          {hasAnswered && quizState.status === 'answering' && (
            <div className="mt-6 text-center text-green-400 font-medium text-xl">
              ✓ Réponse envoyée !
            </div>
          )}
        </div>
      </div>
    );
  }

  // Résultats de la question
  if (quizState.status === 'showing_results' && currentQuestion) {
    const result = questionResults.get(quizState.current_question_index);
    const isCorrect = myAnswer === currentQuestion.correct_answer;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Résultat personnel */}
          <div className={`text-center py-12 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? (
              <>
                <CheckCircle className="h-24 w-24 mx-auto mb-4" />
                <div className="text-4xl font-bold">Correct ! 🎉</div>
              </>
            ) : (
              <>
                <XCircle className="h-24 w-24 mx-auto mb-4" />
                <div className="text-4xl font-bold">Raté 😢</div>
              </>
            )}
          </div>

          {/* Options avec résultats */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => {
                const isCorrectAnswer = option.id === currentQuestion.correct_answer;
                const wasMyAnswer = option.id === myAnswer;

                return (
                  <div
                    key={option.id}
                    className={`
                      p-4 rounded-xl border-2
                      ${isCorrectAnswer
                        ? 'bg-green-100 border-green-500'
                        : wasMyAnswer
                        ? 'bg-red-100 border-red-500'
                        : 'bg-gray-50 border-gray-200'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {isCorrectAnswer && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {wasMyAnswer && !isCorrectAnswer && <XCircle className="h-5 w-5 text-red-600" />}
                      <span className={isCorrectAnswer ? 'font-bold' : ''}>{option.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {currentQuestion.explanation && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <div className="font-medium text-blue-800 mb-1">Explication:</div>
                <div className="text-blue-700">{currentQuestion.explanation}</div>
              </div>
            )}
          </div>

          {/* Score mis à jour */}
          <div className="mt-6 text-center text-white">
            <div className="text-2xl">Votre score:</div>
            <div className="text-5xl font-bold">{myScore?.total_score || 0} pts</div>
          </div>
        </div>
      </div>
    );
  }

  // Classement
  if (quizState.status === 'leaderboard') {
    const myRank = leaderboard.findIndex(e => e.user_id === myScore?.user_id) + 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-white mb-8">
            <Trophy className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
            <h1 className="text-3xl font-bold">Classement</h1>
            {myRank > 0 && (
              <p className="text-xl text-white/70 mt-2">Vous êtes {myRank}ème !</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((entry, idx) => {
                const isMe = entry.user_id === myScore?.user_id;

                return (
                  <div
                    key={entry.user_id}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl
                      ${isMe ? 'bg-blue-100 border-2 border-blue-400' :
                        idx === 0 ? 'bg-yellow-100' :
                        idx === 1 ? 'bg-gray-100' :
                        idx === 2 ? 'bg-orange-100' :
                        'bg-gray-50'}
                    `}
                  >
                    <div className="text-2xl font-bold w-10 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </div>

                    <div className="flex-1">
                      <div className="font-medium">{entry.display_name}</div>
                      <div className="text-sm text-gray-500">
                        {entry.correct_answers} bonnes réponses
                      </div>
                    </div>

                    <div className="text-xl font-bold">{entry.total_score} pts</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz terminé
  if (quizState.status === 'completed') {
    const myRank = leaderboard.findIndex(e => e.user_id === myScore?.user_id) + 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-4xl font-bold mb-4">Quiz terminé !</h1>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8">
            <div className="text-6xl font-bold mb-2">{myScore?.total_score || 0}</div>
            <div className="text-xl text-white/70">points</div>

            <div className="grid grid-cols-2 gap-6 mt-6">
              <div>
                <div className="text-3xl font-bold">{myScore?.correct_answers || 0}</div>
                <div className="text-white/60">bonnes réponses</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{myRank > 0 ? `#${myRank}` : '-'}</div>
                <div className="text-white/60">classement</div>
              </div>
            </div>
          </div>

          <Link
            to={`/session/${sessionId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-900 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour à la session
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
