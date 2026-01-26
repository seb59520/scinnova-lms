import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { CheckCircle, Circle, Users, TrendingUp, Clock, Download } from 'lucide-react';
import type { Item, Submission, Profile } from '../../types/database';

interface StepByStepTpProgressViewerProps {
  itemId: string;
  courseId?: string;
  sessionId?: string;
}

interface StepProgress {
  stepId: string;
  checked: boolean;
  checkedAt?: string;
}

interface StudentProgress {
  userId: string;
  userName: string;
  userEmail?: string;
  studentId?: string;
  progress: Map<string, StepProgress>;
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  lastUpdate?: string;
}

export function StepByStepTpProgressViewer({ 
  itemId, 
  courseId,
  sessionId 
}: StepByStepTpProgressViewerProps) {
  const [item, setItem] = useState<Item | null>(null);
  const [studentsProgress, setStudentsProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'lastUpdate'>('progress');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'completed' | 'incomplete'>('all');

  // Charger l'item pour obtenir les steps
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const { data, error: itemError } = await supabase
          .from('items')
          .select('*')
          .eq('id', itemId)
          .single();

        if (itemError) throw itemError;
        setItem(data);
      } catch (err: any) {
        console.error('Error fetching item:', err);
        setError(err.message || 'Erreur lors du chargement du TP');
      }
    };

    fetchItem();
  }, [itemId]);

  // Charger les progressions des étudiants
  useEffect(() => {
    if (!item) return;

    const fetchProgress = async () => {
      setLoading(true);
      setError(null);

      try {
        // Construire la requête pour récupérer les soumissions
        let query = supabase
          .from('submissions')
          .select(`
            id,
            user_id,
            answer_json,
            submitted_at,
            graded_at,
            profiles!inner (
              id,
              full_name,
              student_id
            )
          `)
          .eq('item_id', itemId);

        // Filtrer par session si fourni
        if (sessionId) {
          query = query.eq('session_id', sessionId);
        }

        // Note: Le filtrage par courseId nécessiterait une sous-requête plus complexe
        // Pour l'instant, on récupère toutes les soumissions pour cet item

        const { data: submissions, error: submissionsError } = await query;

        if (submissionsError) throw submissionsError;

        // Extraire les steps depuis le contenu de l'item
        const content = item.content as any;
        const steps = content?.steps || [];
        const totalSteps = steps.length;

        // Traiter les soumissions pour créer les progressions
        const progressMap = new Map<string, StudentProgress>();

        submissions?.forEach((submission: any) => {
          const userId = submission.user_id;
          const profile = submission.profiles;
          const stepProgress = submission.answer_json?.stepProgress || [];

          const progress = new Map<string, StepProgress>();
          stepProgress.forEach((sp: StepProgress) => {
            progress.set(sp.stepId, sp);
          });

          const completedSteps = Array.from(progress.values()).filter(sp => sp.checked).length;
          const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

          // Utiliser lastUpdated depuis answer_json, ou submitted_at, ou graded_at comme fallback
          const lastUpdate = submission.answer_json?.lastUpdated 
            || submission.graded_at 
            || submission.submitted_at 
            || null;

          progressMap.set(userId, {
            userId,
            userName: profile?.full_name || 'Utilisateur inconnu',
            userEmail: profile?.email,
            studentId: profile?.student_id,
            progress,
            completedSteps,
            totalSteps,
            percentage,
            lastUpdate
          });
        });

        // Convertir en tableau et trier
        let sortedProgress = Array.from(progressMap.values());

        // Filtrer
        if (filterCompleted === 'completed') {
          sortedProgress = sortedProgress.filter(sp => sp.percentage === 100);
        } else if (filterCompleted === 'incomplete') {
          sortedProgress = sortedProgress.filter(sp => sp.percentage < 100);
        }

        // Trier
        sortedProgress.sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return a.userName.localeCompare(b.userName);
            case 'progress':
              return b.percentage - a.percentage;
            case 'lastUpdate':
              const aTime = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0;
              const bTime = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0;
              return bTime - aTime;
            default:
              return 0;
          }
        });

        setStudentsProgress(sortedProgress);
      } catch (err: any) {
        console.error('Error fetching progress:', err);
        setError(err.message || 'Erreur lors du chargement des progressions');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [item, itemId, courseId, sessionId, sortBy, filterCompleted]);

  const getStepTitle = (stepId: string): string => {
    if (!item) return stepId;
    const content = item.content as any;
    const steps = content?.steps || [];
    const step = steps.find((s: any) => s.id === stepId);
    return step?.title || stepId;
  };

  const exportProgress = () => {
    const csv = [
      ['Étudiant', 'ID Étudiant', 'Email', 'Étapes complétées', 'Total étapes', 'Pourcentage', 'Dernière mise à jour'],
      ...studentsProgress.map(sp => [
        sp.userName,
        sp.studentId || '',
        sp.userEmail || '',
        sp.completedSteps.toString(),
        sp.totalSteps.toString(),
        `${sp.percentage}%`,
        sp.lastUpdate ? new Date(sp.lastUpdate).toLocaleString('fr-FR') : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `progression-tp-${item?.title || 'tp'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Chargement des progressions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">TP non trouvé</p>
      </div>
    );
  }

  const content = item.content as any;
  const steps = content?.steps || [];
  const totalSteps = steps.length;

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques globales */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Suivi de progression pour {studentsProgress.length} étudiant{studentsProgress.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={exportProgress}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Exporter (CSV)
          </button>
        </div>

        {/* Statistiques globales */}
        {studentsProgress.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">
                {Math.round(studentsProgress.reduce((sum, sp) => sum + sp.percentage, 0) / studentsProgress.length)}%
              </div>
              <div className="text-xs text-gray-600">Progression moyenne</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">
                {studentsProgress.filter(sp => sp.percentage === 100).length}
              </div>
              <div className="text-xs text-gray-600">Terminé{studentsProgress.filter(sp => sp.percentage === 100).length > 1 ? 's' : ''}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-700">
                {studentsProgress.filter(sp => sp.percentage > 0 && sp.percentage < 100).length}
              </div>
              <div className="text-xs text-gray-600">En cours</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-700">
                {studentsProgress.filter(sp => sp.percentage === 0).length}
              </div>
              <div className="text-xs text-gray-600">Non commencé{studentsProgress.filter(sp => sp.percentage === 0).length > 1 ? 's' : ''}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filtres et tri */}
      <div className="flex flex-wrap items-center gap-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Trier par:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'progress' | 'lastUpdate')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="progress">Progression</option>
            <option value="name">Nom</option>
            <option value="lastUpdate">Dernière activité</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filtrer:</label>
          <select
            value={filterCompleted}
            onChange={(e) => setFilterCompleted(e.target.value as 'all' | 'completed' | 'incomplete')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Tous</option>
            <option value="completed">Terminés</option>
            <option value="incomplete">En cours</option>
          </select>
        </div>
      </div>

      {/* Liste des étudiants */}
      <div className="space-y-4">
        {studentsProgress.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Aucun étudiant n'a encore commencé ce TP</p>
          </div>
        ) : (
          studentsProgress.map((student) => (
            <div
              key={student.userId}
              className="bg-white border-2 rounded-lg p-5 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{student.userName}</h3>
                  {student.studentId && (
                    <p className="text-sm text-gray-500">ID: {student.studentId}</p>
                  )}
                  {student.userEmail && (
                    <p className="text-sm text-gray-500">{student.userEmail}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700">
                    {student.percentage}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {student.completedSteps} / {student.totalSteps} étapes
                  </div>
                  {student.lastUpdate && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(student.lastUpdate).toLocaleString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${student.percentage}%` }}
                  />
                </div>
              </div>

              {/* Détail des étapes */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-blue-600">
                  Voir le détail des étapes
                </summary>
                <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
                  {steps.map((step: any, index: number) => {
                    const stepProg = student.progress.get(step.id);
                    const isChecked = stepProg?.checked || false;

                    return (
                      <div
                        key={step.id}
                        className={`flex items-center gap-3 p-2 rounded ${
                          isChecked ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            Étape {index + 1}: {step.title}
                          </div>
                          {isChecked && stepProg?.checkedAt && (
                            <div className="text-xs text-gray-500">
                              Complété le {new Date(stepProg.checkedAt).toLocaleString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
