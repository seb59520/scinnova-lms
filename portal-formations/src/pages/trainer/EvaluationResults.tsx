import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProgramEvaluations } from '../../hooks/useProgramEvaluations';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import {
  ArrowLeft,
  Users,
  Award,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Download,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function EvaluationResults() {
  const { programId, evalId } = useParams<{ programId: string; evalId: string }>();

  const {
    currentEvaluation,
    attempts,
    resultsSummary,
    isLoading
  } = useProgramEvaluations({ evaluationId: evalId });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'score' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Filtrer et trier les tentatives
  const filteredAttempts = useMemo(() => {
    let result = [...attempts].filter(a => a.submitted_at);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        (a as any).profiles?.full_name?.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = ((a as any).profiles?.full_name || '').localeCompare(
            (b as any).profiles?.full_name || ''
          );
          break;
        case 'score':
          comparison = (a.percentage || 0) - (b.percentage || 0);
          break;
        case 'date':
          comparison = new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [attempts, searchQuery, sortField, sortDirection]);

  // Stats par question
  const questionStats = useMemo(() => {
    if (!currentEvaluation) return [];

    return currentEvaluation.questions.map(question => {
      const attemptsWithAnswer = attempts.filter(a =>
        a.submitted_at && a.results_detail && a.results_detail[question.id]
      );

      const correctCount = attemptsWithAnswer.filter(a =>
        a.results_detail[question.id]?.is_correct
      ).length;

      const totalAnswered = attemptsWithAnswer.length;
      const successRate = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;

      return {
        questionId: question.id,
        questionText: question.question.substring(0, 100) + (question.question.length > 100 ? '...' : ''),
        type: question.type,
        points: question.points,
        totalAnswered,
        correctCount,
        incorrectCount: totalAnswered - correctCount,
        successRate
      };
    });
  }, [currentEvaluation, attempts]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!currentEvaluation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Évaluation non trouvée</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6 pt-8">
        <div className="mx-auto max-w-6xl">
          {/* En-tête */}
          <div className="mb-6">
            <Link
              to={`/trainer/programs/${programId}/evaluations`}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux évaluations
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Résultats: {currentEvaluation.title}
                </h1>
                <p className="mt-1 text-gray-600">
                  {currentEvaluation.questions.length} questions •{' '}
                  Score min: {currentEvaluation.passing_score}%
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Exporter CSV
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {resultsSummary?.total_participants || 0}
                  </div>
                  <div className="text-xs text-gray-500">Participants</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {resultsSummary?.passed_count || 0}
                  </div>
                  <div className="text-xs text-gray-500">Réussis</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {resultsSummary?.failed_count || 0}
                  </div>
                  <div className="text-xs text-gray-500">Échoués</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {resultsSummary?.average_score?.toFixed(1) || '-'}%
                  </div>
                  <div className="text-xs text-gray-500">Score moyen</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {resultsSummary?.total_participants
                      ? Math.round((resultsSummary.passed_count / resultsSummary.total_participants) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs text-gray-500">Taux de réussite</div>
                </div>
              </div>
            </div>
          </div>

          {/* Analyse par question */}
          <div className="mb-6 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                Analyse par question
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {questionStats.map((stat, index) => (
                <div key={stat.questionId} className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 w-8">Q{index + 1}</span>
                  <div className="flex-1">
                    <div className="text-sm text-gray-700 truncate">{stat.questionText}</div>
                    <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          stat.successRate >= 70 ? 'bg-green-500' :
                          stat.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${stat.successRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-24">
                    <span className={`font-medium ${
                      stat.successRate >= 70 ? 'text-green-600' :
                      stat.successRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {stat.successRate.toFixed(0)}%
                    </span>
                    <div className="text-xs text-gray-500">
                      {stat.correctCount}/{stat.totalAnswered}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Liste des tentatives */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Tentatives ({filteredAttempts.length})
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Apprenant
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tentative
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('score')}
                    >
                      <div className="flex items-center gap-1">
                        Score
                        {sortField === 'score' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Résultat
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortField === 'date' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Aucune tentative soumise
                      </td>
                    </tr>
                  ) : (
                    filteredAttempts.map((attempt) => (
                      <React.Fragment key={attempt.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {((attempt as any).profiles?.full_name || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {(attempt as any).profiles?.full_name || 'Utilisateur'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">
                              #{attempt.attempt_number}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-semibold ${
                                (attempt.percentage || 0) >= currentEvaluation.passing_score
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {attempt.percentage?.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500">
                                ({attempt.score}/{attempt.total_points})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {attempt.is_passed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Réussi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                <XCircle className="w-3 h-3" />
                                Échoué
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {attempt.submitted_at ? formatDate(attempt.submitted_at) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => setShowDetails(showDetails === attempt.id ? null : attempt.id)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              {showDetails === attempt.id ? 'Masquer' : 'Détails'}
                            </button>
                          </td>
                        </tr>
                        {showDetails === attempt.id && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-700">Détail des réponses:</h4>
                                {currentEvaluation.questions.map((q, idx) => {
                                  const detail = attempt.results_detail?.[q.id];
                                  return (
                                    <div key={q.id} className="flex items-start gap-3 text-sm">
                                      <span className={`mt-0.5 ${
                                        detail?.is_correct ? 'text-green-500' : 'text-red-500'
                                      }`}>
                                        {detail?.is_correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                      </span>
                                      <div>
                                        <span className="text-gray-500">Q{idx + 1}:</span>{' '}
                                        <span className="text-gray-700">{q.question.substring(0, 80)}...</span>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          Réponse: {detail?.user_answer || '-'}
                                          {!detail?.is_correct && detail?.correct_answer && (
                                            <span className="ml-2 text-green-600">
                                              (Attendu: {detail.correct_answer})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
