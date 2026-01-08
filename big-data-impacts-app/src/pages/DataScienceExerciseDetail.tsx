import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Lightbulb, BookOpen, Code, Send } from 'lucide-react';
import { getExerciseById } from '../data/dataScienceExercises';
import { useDataScienceStore } from '../store/dataScienceStore';
import type { ExerciseQuestion } from '../types/dataScience';
import { saveExerciseSubmission } from '../lib/apiService';
import type { ExerciseSubmissionData } from '../lib/apiService';

export function DataScienceExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const exercise = id ? getExerciseById(id) : null;
  const { addSubmission, getSubmission } = useDataScienceStore();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    if (!exercise) return;

    const userId = localStorage.getItem('big-data-user-id') || `temp-${crypto.randomUUID()}`;
    localStorage.setItem('big-data-user-id', userId);

    const existingSubmission = getSubmission(exercise.id, userId);
    if (existingSubmission) {
      setSubmitted(true);
      setScore(existingSubmission.score || null);
      setFeedback(existingSubmission.feedback || '');
      const answersMap: Record<string, any> = {};
      existingSubmission.answers.forEach((a) => {
        answersMap[a.questionId] = a.answer;
      });
      setAnswers(answersMap);
    }
  }, [exercise, getSubmission]);

  if (!exercise) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Exercice non trouvé</p>
        <button
          onClick={() => navigate('/data-science/exercises')}
          className="mt-4 text-purple-600 hover:text-purple-700"
        >
          Retour aux exercices
        </button>
      </div>
    );
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleHint = (questionId: string) => {
    setShowHints((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmit = async () => {
    if (!exercise) return;

    const userId = localStorage.getItem('big-data-user-id') || `temp-${crypto.randomUUID()}`;
    localStorage.setItem('big-data-user-id', userId);

    // Calculer le score (simplifié - à améliorer avec IA)
    let calculatedScore = 0;
    const totalQuestions = exercise.questions.length;

    exercise.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      if (question.answer !== undefined) {
        if (typeof question.answer === 'string' && typeof userAnswer === 'string') {
          if (userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim()) {
            calculatedScore++;
          }
        } else if (Array.isArray(question.answer) && Array.isArray(userAnswer)) {
          if (JSON.stringify(question.answer.sort()) === JSON.stringify(userAnswer.sort())) {
            calculatedScore++;
          }
        } else if (question.answer === userAnswer) {
          calculatedScore++;
        }
      }
    });

    const finalScore = Math.round((calculatedScore / totalQuestions) * 100);

    const submission = {
      exerciseId: exercise.id,
      userId,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
      score: finalScore,
      feedback: `Vous avez obtenu ${calculatedScore}/${totalQuestions} bonnes réponses.`,
    };

    addSubmission(submission);
    setSubmitted(true);
    setScore(finalScore);
    setFeedback(submission.feedback);

    // Sauvegarder dans Supabase
    const submissionData: ExerciseSubmissionData = {
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      userId,
      answers: submission.answers,
      score: finalScore,
      feedback: submission.feedback,
    };
    await saveExerciseSubmission(submissionData);
  };

  const renderQuestion = (question: ExerciseQuestion, index: number) => {
    const userAnswer = answers[question.id];
    const isCorrect = submitted && question.answer !== undefined
      ? (typeof question.answer === 'string' && typeof userAnswer === 'string'
          ? userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim()
          : question.answer === userAnswer)
      : null;

    return (
      <div key={question.id} className="bg-white rounded-lg shadow p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Question {index + 1}
            </h3>
            <p className="text-gray-700">{question.prompt}</p>
          </div>
          {submitted && isCorrect !== null && (
            <div className="ml-4">
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
          )}
        </div>

        {/* Réponse selon le type */}
        {question.type === 'mcq' && question.options && (
          <div className="space-y-2">
            {question.options.map((option, optIndex) => (
              <label
                key={optIndex}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  userAnswer === option
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-300'
                } ${submitted && option === question.answer ? 'bg-green-50 border-green-500' : ''}`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={userAnswer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={submitted}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'text' && (
          <textarea
            value={userAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            disabled={submitted}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={4}
            placeholder="Votre réponse..."
          />
        )}

        {question.type === 'numeric' && (
          <input
            type="number"
            value={userAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value) || 0)}
            disabled={submitted}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Votre réponse numérique..."
          />
        )}

        {question.type === 'code' && (
          <div>
            {question.codeTemplate && (
              <pre className="bg-gray-100 p-3 rounded mb-2 text-sm text-gray-600">
                {question.codeTemplate}
              </pre>
            )}
            <textarea
              value={userAnswer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              disabled={submitted}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              rows={10}
              placeholder="Votre code Python..."
            />
          </div>
        )}

        {/* Indice */}
        {exercise.hints.length > 0 && (
          <button
            onClick={() => toggleHint(question.id)}
            className="mt-3 flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm"
          >
            <Lightbulb className="w-4 h-4" />
            {showHints[question.id] ? 'Masquer l\'indice' : 'Afficher l\'indice'}
          </button>
        )}

        {showHints[question.id] && exercise.hints.length > 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 <strong>Indice:</strong> {exercise.hints[0]}
            </p>
          </div>
        )}

        {/* Explication après soumission */}
        {submitted && question.explanation && (
          <div className={`mt-4 p-4 rounded-lg ${
            isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className="text-sm font-medium mb-1">
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            <p className="text-sm text-gray-700">{question.explanation}</p>
            {question.answer !== undefined && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Réponse attendue:</strong> {Array.isArray(question.answer) ? question.answer.join(', ') : String(question.answer)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/data-science/exercises')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux exercices
      </button>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">{exercise.title}</h1>
        <p className="text-purple-100">{exercise.description}</p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Instructions</h3>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          {exercise.instructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ol>
      </div>

      {/* Dataset info */}
      {exercise.dataset && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📊 Dataset</h3>
          <p className="text-gray-700 mb-1"><strong>{exercise.dataset.name}</strong></p>
          <p className="text-sm text-gray-600 mb-2">{exercise.dataset.description}</p>
          <div className="text-sm text-gray-600">
            <p><strong>Colonnes:</strong> {exercise.dataset.columns.join(', ')}</p>
            <p><strong>Taille:</strong> {exercise.dataset.sampleSize.toLocaleString()} lignes</p>
          </div>
        </div>
      )}

      {/* Questions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions</h2>
        {exercise.questions.map((question, index) => renderQuestion(question, index))}
      </div>

      {/* Bouton de soumission */}
      {!submitted && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            Soumettre mes réponses
          </button>
        </div>
      )}

      {/* Résultats */}
      {submitted && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Résultats</h3>
          {score !== null && (
            <div className="mb-4">
              <div className="text-4xl font-bold text-purple-600 mb-2">{score}%</div>
              <p className="text-gray-700">{feedback}</p>
            </div>
          )}
          <div className="mt-4 p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-600">
              ✓ Votre soumission a été enregistrée et sera visible par votre formateur.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

