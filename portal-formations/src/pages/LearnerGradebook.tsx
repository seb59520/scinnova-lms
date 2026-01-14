import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGradebook } from '../hooks/useGradebook';
import { useAuth } from '../hooks/useAuth';
import {
  Trophy, FileText, CheckCircle, Clock, AlertCircle,
  ChevronRight, TrendingUp, Award, Target
} from 'lucide-react';

export function LearnerGradebook() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { profile } = useAuth();

  const {
    activities,
    mySubmissions,
    mySummary,
    grades,
    isLoading,
    error,
    learnerActions
  } = useGradebook({
    sessionId: sessionId || '',
    isTrainer: false
  });

  if (!sessionId) {
    return <div className="p-8 text-center">Session ID manquant</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement de vos notes...</div>
      </div>
    );
  }

  const getActivitySubmission = (activityId: string) => {
    return mySubmissions.find(s => s.activity_id === activityId);
  };

  const getActivityGrade = (activityId: string) => {
    const submission = getActivitySubmission(activityId);
    if (!submission) return null;
    return grades.get(submission.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Mes notes</h1>
          <p className="text-gray-500">Suivez votre progression et vos résultats</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Résumé */}
        {mySummary && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Résumé</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                mySummary.is_passing
                  ? 'bg-green-100 text-green-800'
                  : mySummary.overall_status === 'not_started'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {mySummary.is_passing ? 'Validé' :
                 mySummary.overall_status === 'not_started' ? 'Non commencé' :
                 mySummary.overall_status === 'in_progress' ? 'En cours' :
                 'Non validé'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {/* Moyenne */}
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">
                  {mySummary.weighted_average?.toFixed(1) || '-'}
                </div>
                <div className="text-sm text-blue-600 mt-1">Moyenne</div>
              </div>

              {/* Activités complétées */}
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">
                  {mySummary.completed_activities}/{mySummary.total_activities}
                </div>
                <div className="text-sm text-green-600 mt-1">Complétées</div>
              </div>

              {/* Points */}
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600">
                  {mySummary.total_points_earned.toFixed(0)}
                </div>
                <div className="text-sm text-purple-600 mt-1">Points gagnés</div>
              </div>

              {/* À faire */}
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-3xl font-bold text-orange-600">
                  {mySummary.pending_activities}
                </div>
                <div className="text-sm text-orange-600 mt-1">À compléter</div>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Progression globale</span>
                <span>{Math.round((mySummary.completed_activities / Math.max(1, mySummary.total_activities)) * 100)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  style={{
                    width: `${(mySummary.completed_activities / Math.max(1, mySummary.total_activities)) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Liste des activités */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Activités ({activities.length})</h2>
          </div>

          <div className="divide-y">
            {activities.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Aucune activité pour le moment</p>
              </div>
            ) : (
              activities.map(activity => {
                const submission = getActivitySubmission(activity.id);
                const grade = getActivityGrade(activity.id);
                const isPublished = grade?.is_published;

                return (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Icône de statut */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isPublished && grade.passed ? 'bg-green-100' :
                        isPublished && !grade.passed ? 'bg-red-100' :
                        submission?.status === 'submitted' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        {isPublished && grade.passed ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : isPublished && !grade.passed ? (
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        ) : submission?.status === 'submitted' ? (
                          <Clock className="h-6 w-6 text-blue-600" />
                        ) : (
                          <FileText className="h-6 w-6 text-gray-400" />
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{activity.title}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            activity.activity_type === 'quiz' ? 'bg-purple-100 text-purple-700' :
                            activity.activity_type === 'tp' ? 'bg-blue-100 text-blue-700' :
                            activity.activity_type === 'exercise' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {activity.activity_type.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{activity.max_points} points</span>
                          {activity.due_date && (
                            <span>
                              Échéance: {new Date(activity.due_date).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                          {activity.weight !== 1 && (
                            <span>Coefficient: {activity.weight}</span>
                          )}
                        </div>
                      </div>

                      {/* Note / Action */}
                      <div className="text-right">
                        {isPublished ? (
                          <div>
                            <div className={`text-2xl font-bold ${
                              grade.passed ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {grade.final_score?.toFixed(1)}
                              <span className="text-lg text-gray-400">/{activity.max_points}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {grade.percentage?.toFixed(0)}%
                            </div>
                          </div>
                        ) : submission?.status === 'submitted' ? (
                          <div className="text-blue-600">
                            <Clock className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-sm">En correction</span>
                          </div>
                        ) : submission?.status === 'draft' ? (
                          <Link
                            to={`/activity/${activity.id}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Continuer
                          </Link>
                        ) : (
                          <Link
                            to={`/activity/${activity.id}`}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Commencer
                          </Link>
                        )}
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>

                    {/* Feedback */}
                    {isPublished && grade.feedback_text && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 mb-1">Feedback du formateur:</div>
                        <div className="text-sm text-blue-700">{grade.feedback_text}</div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
