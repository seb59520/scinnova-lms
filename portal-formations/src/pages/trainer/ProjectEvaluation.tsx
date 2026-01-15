import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectRestitution } from '../../hooks/useProjectRestitution';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { SubmitForLearnerModal } from '../../components/trainer/SubmitForLearnerModal';
import {
  Star, User, ExternalLink, FileText, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronRight, ChevronLeft, Send, Eye, Download,
  ThumbsUp, ThumbsDown, MessageSquare, Play, File, Link as LinkIcon,
  BarChart3, Plus, Settings, Archive, Users, Award, Trash2, RotateCcw
} from 'lucide-react';
import type { 
  ProjectSubmission, 
  ProjectEvaluation as ProjectEvaluationType,
  EvaluationCriterion,
  CriterionScore
} from '../../types/sessions';

// Composant pour afficher des étoiles cliquables
function StarRating({
  value,
  max = 5,
  onChange,
  size = 'md',
  readonly = false
}: {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => {
        const filled = hovered !== null ? star <= hovered : star <= value;
        return (
          <button
            key={star}
            type="button"
            className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(null)}
            disabled={readonly}
          >
            <Star
              className={`${sizeClasses[size]} ${
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
}

// Composant pour afficher un critère d'évaluation
function CriterionEvaluator({
  criterion,
  score,
  onChange,
  readonly = false
}: {
  criterion: EvaluationCriterion;
  score: CriterionScore | undefined;
  onChange: (score: CriterionScore) => void;
  readonly?: boolean;
}) {
  const currentScore = score || { stars: 0 };
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{criterion.name}</h4>
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {criterion.weight}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{criterion.description}</p>
        </div>
        <div className="ml-4">
          <StarRating
            value={currentScore.stars}
            max={criterion.max_stars}
            onChange={(stars) => onChange({ ...currentScore, stars })}
            size="lg"
            readonly={readonly}
          />
          <div className="text-center text-sm text-gray-500 mt-1">
            {currentScore.stars}/{criterion.max_stars}
          </div>
        </div>
      </div>
      
      {/* Sous-critères à cocher */}
      {criterion.subcriteria && criterion.subcriteria.length > 0 && (
        <div className="mt-3 space-y-1">
          {criterion.subcriteria.map((sub, index) => (
            <label key={index} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={currentScore.subcriteria_checked?.[index] || false}
                onChange={(e) => {
                  const newChecked = [...(currentScore.subcriteria_checked || [])];
                  newChecked[index] = e.target.checked;
                  onChange({ ...currentScore, subcriteria_checked: newChecked });
                }}
                disabled={readonly}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>{sub}</span>
            </label>
          ))}
        </div>
      )}
      
      {/* Commentaire sur le critère */}
      {!readonly && (
        <div className="mt-3">
          <textarea
            value={currentScore.comment || ''}
            onChange={(e) => onChange({ ...currentScore, comment: e.target.value })}
            placeholder="Commentaire sur ce critère (optionnel)..."
            className="w-full px-3 py-2 text-sm border rounded-lg resize-none"
            rows={2}
          />
        </div>
      )}
    </div>
  );
}

// Composant carte de soumission
function SubmissionCard({
  submission,
  evaluation,
  isSelected,
  onClick
}: {
  submission: ProjectSubmission;
  evaluation?: ProjectEvaluationType;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-600', label: 'Brouillon', icon: FileText },
    submitted: { color: 'bg-blue-100 text-blue-700', label: 'Soumis', icon: Send },
    late: { color: 'bg-orange-100 text-orange-700', label: 'En retard', icon: Clock },
    evaluated: { color: 'bg-green-100 text-green-700', label: 'Évalué', icon: CheckCircle },
    returned: { color: 'bg-red-100 text-red-700', label: 'Retourné', icon: AlertCircle }
  };
  
  const status = statusConfig[submission.status] || statusConfig.draft;
  const StatusIcon = status.icon;
  
  return (
    <div
      className={`p-4 cursor-pointer transition-all border-l-4 ${
        isSelected
          ? 'bg-blue-50 border-blue-500'
          : 'bg-white hover:bg-gray-50 border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
          {submission.profile?.full_name?.[0] || '?'}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {submission.profile?.full_name || 'Élève'}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${status.color}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate mt-0.5">
            {submission.project_title}
          </p>
          {submission.submitted_at && (
            <p className="text-xs text-gray-400 mt-1">
              Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
        
        {/* Note */}
        <div className="text-right">
          {evaluation?.is_published ? (
            <div className={`text-2xl font-bold ${evaluation.passed ? 'text-green-600' : 'text-red-600'}`}>
              {evaluation.final_score?.toFixed(1) || evaluation.score_20?.toFixed(1)}
              <span className="text-sm text-gray-400">/20</span>
            </div>
          ) : evaluation?.evaluated_at ? (
            <div className="text-lg font-medium text-gray-600">
              {evaluation.score_20?.toFixed(1)}
              <span className="text-sm text-gray-400">/20</span>
              <div className="text-xs text-orange-500">Non publié</div>
            </div>
          ) : submission.status !== 'draft' ? (
            <span className="text-sm text-gray-400">À évaluer</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ProjectEvaluation() {
  const { sessionId, restitutionId } = useParams<{ sessionId: string; restitutionId: string }>();
  
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, CriterionScore>>({});
  const [globalFeedback, setGlobalFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [finalScoreOverride, setFinalScoreOverride] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showSubmitForLearnerModal, setShowSubmitForLearnerModal] = useState(false);
  const [sessionLearners, setSessionLearners] = useState<Array<{ id: string; full_name: string; avatar_url?: string }>>([]);
  
  const {
    currentRestitution,
    submissions,
    evaluations,
    summary,
    isLoading,
    error,
    trainerActions,
    refresh
  } = useProjectRestitution({
    sessionId: sessionId || '',
    restitutionId,
    isTrainer: true
  });

  // Charger les apprenants de la session pour le modal de soumission
  React.useEffect(() => {
    async function loadLearners() {
      if (!sessionId) return;

      const { supabase } = await import('../../lib/supabaseClient');
      
      // Charger les membres sans jointure pour éviter les problèmes RLS
      const { data: membersData, error: membersError } = await supabase
        .from('session_members')
        .select('user_id, role')
        .eq('session_id', sessionId)
        .eq('role', 'learner');

      console.log('📋 Session members chargés:', membersData, membersError);

      if (membersError) {
        console.error('Erreur chargement session_members:', membersError);
        return;
      }

      if (membersData && membersData.length > 0) {
        // Charger les profils séparément
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        console.log('📋 Profils chargés:', profilesData?.length, profilesError);

        if (profilesData) {
          const learners = profilesData.map(p => ({
            id: p.id,
            full_name: p.full_name || 'Apprenant',
            avatar_url: p.avatar_url
          }));
          setSessionLearners(learners);
        }
      } else {
        setSessionLearners([]);
      }
    }
    loadLearners();
  }, [sessionId]);

  // Filtrer les soumissions
  const filteredSubmissions = useMemo(() => {
    if (filterStatus === 'all') return submissions.filter(s => s.status !== 'draft');
    if (filterStatus === 'pending') {
      return submissions.filter(s => 
        s.status === 'submitted' && !evaluations.has(s.id)
      );
    }
    if (filterStatus === 'evaluated') {
      return submissions.filter(s => evaluations.has(s.id));
    }
    return submissions.filter(s => s.status === filterStatus);
  }, [submissions, evaluations, filterStatus]);

  // Soumission sélectionnée
  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);
  const selectedEvaluation = selectedSubmissionId ? evaluations.get(selectedSubmissionId) : null;

  // Charger les données de l'évaluation existante
  React.useEffect(() => {
    if (selectedEvaluation) {
      setCriteriaScores(selectedEvaluation.criteria_scores || {});
      setGlobalFeedback(selectedEvaluation.global_feedback || '');
      setStrengths(selectedEvaluation.strengths || '');
      setImprovements(selectedEvaluation.improvements || '');
      setPrivateNotes(selectedEvaluation.private_notes || '');
      setFinalScoreOverride(selectedEvaluation.final_score?.toString() || '');
    } else {
      // Reset
      setCriteriaScores({});
      setGlobalFeedback('');
      setStrengths('');
      setImprovements('');
      setPrivateNotes('');
      setFinalScoreOverride('');
    }
  }, [selectedEvaluation, selectedSubmissionId]);

  // Calculer la note prévisionnelle
  const calculatePreviewScore = () => {
    if (!currentRestitution?.criteria) return { total: 0, percentage: 0, score20: 0 };
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let totalStars = 0;
    let maxStars = 0;
    
    currentRestitution.criteria.forEach(criterion => {
      const score = criteriaScores[criterion.id];
      const stars = score?.stars || 0;
      const maxCriterionStars = criterion.max_stars || 5;
      
      if (criterion.weight > 0) {
        totalWeightedScore += (stars / maxCriterionStars) * criterion.weight;
        totalWeight += criterion.weight;
      }
      
      totalStars += stars;
      maxStars += maxCriterionStars;
    });
    
    const percentage = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
    const score20 = percentage / 5; // 100% = 20/20
    
    return {
      total: totalStars,
      max: maxStars,
      percentage: Math.round(percentage * 10) / 10,
      score20: Math.round(score20 * 10) / 10
    };
  };

  const previewScore = calculatePreviewScore();

  // Sauvegarder l'évaluation
  const handleSave = async (publish: boolean = false) => {
    if (!selectedSubmissionId) return;
    
    setIsSaving(true);
    try {
      const evaluation = await trainerActions.evaluateSubmission(
        selectedSubmissionId,
        criteriaScores,
        {
          global_feedback: globalFeedback,
          strengths,
          improvements,
          private_notes: privateNotes,
          final_score: finalScoreOverride ? parseFloat(finalScoreOverride) : undefined
        }
      );
      
      if (evaluation && publish) {
        await trainerActions.publishEvaluation(evaluation.id);
      }
      
      await refresh();
    } catch (err) {
      console.error('Error saving evaluation:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!sessionId || !restitutionId) {
    return <div className="p-8 text-center">Paramètres manquants</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!currentRestitution) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TrainerHeader />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-medium text-gray-600">Restitution non trouvée</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-6 pt-28">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/trainer/session/${sessionId}/projects`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour aux projets
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentRestitution.title}</h1>
              <p className="text-gray-500">Évaluation des projets</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitForLearnerModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Soumettre pour un apprenant
              </button>
              <button
                onClick={() => trainerActions.publishAllEvaluations(restitutionId!)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Send className="h-4 w-4" />
                Publier toutes les notes
              </button>
              <Link
                to={`/trainer/session/${sessionId}/project/${restitutionId}/report`}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <BarChart3 className="h-4 w-4" />
                Compte rendu
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{summary?.total_submissions || 0}</div>
                <div className="text-sm text-gray-500">Soumissions</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{summary?.evaluated_count || 0}</div>
                <div className="text-sm text-gray-500">Évalués</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{summary?.pending_count || 0}</div>
                <div className="text-sm text-gray-500">En attente</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {summary?.average_score?.toFixed(1) || '-'}/20
                </div>
                <div className="text-sm text-gray-500">Moyenne</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Liste des soumissions */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-medium text-gray-900">Élèves</h2>
                </div>
                {/* Filtres */}
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'Tous' },
                    { value: 'pending', label: 'À évaluer' },
                    { value: 'evaluated', label: 'Évalués' }
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setFilterStatus(filter.value)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        filterStatus === filter.value
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Aucune soumission</p>
                  </div>
                ) : (
                  filteredSubmissions.map(submission => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      evaluation={evaluations.get(submission.id)}
                      isSelected={selectedSubmissionId === submission.id}
                      onClick={() => setSelectedSubmissionId(submission.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Panneau d'évaluation */}
          <div className="col-span-8">
            {!selectedSubmission ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Sélectionnez un élève pour l'évaluer</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Info projet */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedSubmission.project_title}
                        </h2>
                        <p className="text-sm text-gray-500">
                          Par {selectedSubmission.profile?.full_name || 'Élève'}
                        </p>
                      </div>
                      {/* Actions sur la soumission */}
                      <div className="flex items-center gap-2">
                        {selectedSubmission.status !== 'draft' && (
                          <button
                            onClick={async () => {
                              if (confirm('Réinitialiser cette soumission ? L\'étudiant pourra resoumettre son projet.')) {
                                await trainerActions.resetSubmission(selectedSubmission.id);
                                setSelectedSubmissionId(null);
                                await refresh();
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg"
                            title="Permettre à l'étudiant de resoumettre"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Réinitialiser
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (confirm('Supprimer cette soumission ? Cette action est irréversible.')) {
                              await trainerActions.deleteSubmission(selectedSubmission.id);
                              setSelectedSubmissionId(null);
                              await refresh();
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {/* Description */}
                    {selectedSubmission.project_description && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                        <p className="text-gray-600">{selectedSubmission.project_description}</p>
                      </div>
                    )}
                    
                    {/* Liens */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {selectedSubmission.presentation_link && (
                        <a
                          href={selectedSubmission.presentation_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">Présentation</span>
                          <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                        </a>
                      )}
                      {selectedSubmission.app_link && (
                        <a
                          href={selectedSubmission.app_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Play className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">Application</span>
                          <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                        </a>
                      )}
                      {selectedSubmission.documentation_link && (
                        <a
                          href={selectedSubmission.documentation_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <File className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium">Documentation</span>
                          <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                        </a>
                      )}
                      {selectedSubmission.video_link && (
                        <a
                          href={selectedSubmission.video_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Play className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium">Vidéo démo</span>
                          <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                        </a>
                      )}
                    </div>
                    
                    {/* Outils utilisés */}
                    {selectedSubmission.tools_used && selectedSubmission.tools_used.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Outils utilisés</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedSubmission.tools_used.map((tool, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                            >
                              {tool.name} ({tool.plan})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Fichiers */}
                    {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Fichiers joints</h3>
                        <div className="space-y-2">
                          {selectedSubmission.files.map((file, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg"
                            >
                              <File className="h-4 w-4 text-gray-400" />
                              <span className="text-sm flex-1">{file.name}</span>
                              <span className="text-xs text-gray-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Évaluation par critères */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Évaluation</h2>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Note prévisionnelle:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {previewScore.score20.toFixed(1)}
                          </span>
                          <span className="text-gray-400">/20</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {previewScore.total}/{previewScore.max} étoiles ({previewScore.percentage}%)
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {currentRestitution.criteria.map(criterion => (
                      <CriterionEvaluator
                        key={criterion.id}
                        criterion={criterion}
                        score={criteriaScores[criterion.id]}
                        onChange={(score) => {
                          setCriteriaScores(prev => ({
                            ...prev,
                            [criterion.id]: score
                          }));
                        }}
                        readonly={selectedEvaluation?.is_published}
                      />
                    ))}
                  </div>
                </div>

                {/* Feedback global */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback</h2>
                  
                  <div className="space-y-4">
                    {/* Points forts */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        Points forts
                      </label>
                      <textarea
                        value={strengths}
                        onChange={(e) => setStrengths(e.target.value)}
                        placeholder="Ce qui a été bien réalisé..."
                        className="w-full px-4 py-2 border rounded-lg"
                        rows={2}
                        disabled={selectedEvaluation?.is_published}
                      />
                    </div>
                    
                    {/* Axes d'amélioration */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <ThumbsDown className="h-4 w-4 text-orange-600" />
                        Axes d'amélioration
                      </label>
                      <textarea
                        value={improvements}
                        onChange={(e) => setImprovements(e.target.value)}
                        placeholder="Ce qui pourrait être amélioré..."
                        className="w-full px-4 py-2 border rounded-lg"
                        rows={2}
                        disabled={selectedEvaluation?.is_published}
                      />
                    </div>
                    
                    {/* Commentaire général */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        Commentaire général
                      </label>
                      <textarea
                        value={globalFeedback}
                        onChange={(e) => setGlobalFeedback(e.target.value)}
                        placeholder="Retour global sur le projet..."
                        className="w-full px-4 py-2 border rounded-lg"
                        rows={3}
                        disabled={selectedEvaluation?.is_published}
                      />
                    </div>
                    
                    {/* Notes privées */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Eye className="h-4 w-4 text-gray-400" />
                        Notes privées (non visibles par l'élève)
                      </label>
                      <textarea
                        value={privateNotes}
                        onChange={(e) => setPrivateNotes(e.target.value)}
                        placeholder="Notes pour vous-même..."
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                        rows={2}
                        disabled={selectedEvaluation?.is_published}
                      />
                    </div>
                    
                    {/* Ajustement note finale */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">
                          Note finale (ajustement manuel)
                        </label>
                        <p className="text-xs text-gray-500">
                          Laissez vide pour utiliser la note calculée ({previewScore.score20.toFixed(1)}/20)
                        </p>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={finalScoreOverride}
                          onChange={(e) => setFinalScoreOverride(e.target.value)}
                          placeholder={previewScore.score20.toFixed(1)}
                          className="w-full px-4 py-2 border rounded-lg text-center text-lg font-bold"
                          disabled={selectedEvaluation?.is_published}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!selectedEvaluation?.is_published && (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleSave(false)}
                      disabled={isSaving}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      {isSaving ? 'Enregistrement...' : 'Enregistrer brouillon'}
                    </button>
                    <button
                      onClick={() => handleSave(true)}
                      disabled={isSaving}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {isSaving ? 'Publication...' : 'Enregistrer et publier'}
                    </button>
                  </div>
                )}
                
                {selectedEvaluation?.is_published && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-medium text-green-800">Note publiée</span>
                      <span className="text-green-600 ml-2">
                        le {new Date(selectedEvaluation.published_at!).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour soumettre au nom d'un apprenant */}
      {showSubmitForLearnerModal && restitutionId && sessionId && (
        <SubmitForLearnerModal
          restitutionId={restitutionId}
          sessionId={sessionId}
          learners={sessionLearners}
          onClose={() => setShowSubmitForLearnerModal(false)}
          onSuccess={() => {
            setShowSubmitForLearnerModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
