import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGradebook } from '../../hooks/useGradebook';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import {
  Plus, FileText, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronRight, User, Send, Eye, Edit,
  Trash2, BarChart3, Download
} from 'lucide-react';
import type { GradebookActivity, LearnerSubmission, Grade } from '../../types/sessions';

export function TrainerGradebook() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<string>('');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  const {
    activities,
    submissions,
    grades,
    summaries,
    isLoading,
    error,
    trainerActions
  } = useGradebook({
    sessionId: sessionId || '',
    isTrainer: true
  });

  if (!sessionId) {
    return <div className="p-8 text-center">Session ID manquant</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement du carnet de notes...</div>
      </div>
    );
  }

  const selectedActivity = activities.find(a => a.id === selectedActivityId);
  const activitySubmissions = selectedActivityId ? submissions.get(selectedActivityId) || [] : [];

  const getActivityStats = (activity: GradebookActivity) => {
    const subs = submissions.get(activity.id) || [];
    const submitted = subs.filter(s => s.status !== 'draft').length;
    const graded = subs.filter(s => grades.get(s.id)?.is_published).length;
    return { submitted, graded, total: summaries.size };
  };

  const handleGradeSubmit = async () => {
    if (!gradingSubmissionId || !gradeScore) return;

    await trainerActions.gradeSubmission(gradingSubmissionId, {
      score: parseFloat(gradeScore),
      feedback_text: gradeFeedback
    });

    setGradingSubmissionId(null);
    setGradeScore('');
    setGradeFeedback('');
  };

  const handlePublishGrade = async (gradeId: string) => {
    await trainerActions.publishGrade(gradeId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Carnet de notes</h1>
            <p className="text-gray-500">Gérez les évaluations et les notes</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Download className="h-5 w-5" />
              Exporter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-5 w-5" />
              Nouvelle activité
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Liste des activités */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b">
                <h2 className="font-medium text-gray-900">Activités ({activities.length})</h2>
              </div>
              <div className="divide-y">
                {activities.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Aucune activité créée</p>
                    <button className="mt-4 text-blue-600 hover:text-blue-800">
                      Créer une activité
                    </button>
                  </div>
                ) : (
                  activities.map(activity => {
                    const stats = getActivityStats(activity);
                    const isSelected = selectedActivityId === activity.id;

                    return (
                      <div
                        key={activity.id}
                        className={`p-4 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedActivityId(activity.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{activity.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                activity.activity_type === 'quiz' ? 'bg-purple-100 text-purple-700' :
                                activity.activity_type === 'tp' ? 'bg-blue-100 text-blue-700' :
                                activity.activity_type === 'exercise' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {activity.activity_type.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {activity.max_points} pts
                              </span>
                            </div>
                          </div>
                          <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                            isSelected ? 'rotate-90' : ''
                          }`} />
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1 text-gray-500">
                            <FileText className="h-4 w-4" />
                            {stats.submitted}/{stats.total}
                          </span>
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {stats.graded} notés
                          </span>
                          {stats.submitted - stats.graded > 0 && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="h-4 w-4" />
                              {stats.submitted - stats.graded} à corriger
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Détail de l'activité / Soumissions */}
          <div className="col-span-8">
            {!selectedActivity ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Sélectionnez une activité pour voir les soumissions</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                {/* Header de l'activité */}
                <div className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedActivity.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedActivity.description || 'Pas de description'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => trainerActions.publishAllGrades(selectedActivity.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Publier toutes les notes
                      </button>
                    </div>
                  </div>

                  {/* Info activité */}
                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                    <span>Type: {selectedActivity.activity_type}</span>
                    <span>Max: {selectedActivity.max_points} pts</span>
                    <span>Seuil: {selectedActivity.passing_score}%</span>
                    {selectedActivity.due_date && (
                      <span>Échéance: {new Date(selectedActivity.due_date).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                </div>

                {/* Liste des soumissions */}
                <div className="divide-y">
                  {activitySubmissions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucune soumission pour cette activité</p>
                    </div>
                  ) : (
                    activitySubmissions.map(submission => {
                      const grade = grades.get(submission.id);
                      const isGrading = gradingSubmissionId === submission.id;

                      return (
                        <div key={submission.id} className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {submission.profile?.avatar_url ? (
                                <img
                                  src={submission.profile.avatar_url}
                                  alt=""
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <User className="h-5 w-5 text-gray-500" />
                              )}
                            </div>

                            {/* Infos */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {submission.profile?.full_name || 'Apprenant'}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  submission.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                  submission.status === 'graded' ? 'bg-green-100 text-green-700' :
                                  submission.status === 'late' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {submission.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {submission.submitted_at
                                  ? `Soumis le ${new Date(submission.submitted_at).toLocaleString('fr-FR')}`
                                  : 'Non soumis'}
                              </div>
                            </div>

                            {/* Note */}
                            <div className="text-right">
                              {grade?.is_published ? (
                                <div>
                                  <span className={`text-2xl font-bold ${
                                    grade.passed ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {grade.final_score}
                                  </span>
                                  <span className="text-gray-400">/{selectedActivity.max_points}</span>
                                </div>
                              ) : grade ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-medium text-gray-600">
                                    {grade.score}/{selectedActivity.max_points}
                                  </span>
                                  <button
                                    onClick={() => handlePublishGrade(grade.id)}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                                  >
                                    Publier
                                  </button>
                                </div>
                              ) : submission.status !== 'draft' ? (
                                <button
                                  onClick={() => setGradingSubmissionId(submission.id)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                  Noter
                                </button>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                                <Eye className="h-5 w-5" />
                              </button>
                            </div>
                          </div>

                          {/* Panel de notation */}
                          {isGrading && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Note (sur {selectedActivity.max_points})
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={selectedActivity.max_points}
                                    value={gradeScore}
                                    onChange={(e) => setGradeScore(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Feedback
                                  </label>
                                  <textarea
                                    value={gradeFeedback}
                                    onChange={(e) => setGradeFeedback(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows={2}
                                    placeholder="Commentaire pour l'apprenant..."
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-4">
                                <button
                                  onClick={() => setGradingSubmissionId(null)}
                                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                  Annuler
                                </button>
                                <button
                                  onClick={handleGradeSubmit}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                  Enregistrer la note
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
