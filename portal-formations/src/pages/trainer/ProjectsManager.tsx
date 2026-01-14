import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProjectRestitution } from '../../hooks/useProjectRestitution';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import {
  Plus, FileText, CheckCircle, Clock, AlertCircle, Settings,
  ChevronRight, Users, Award, BarChart3, Play, Pause, Archive,
  Edit, Trash2, Eye, Copy, Calendar, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import type { SessionProjectRestitution, EvaluationCriterion } from '../../types/sessions';

export function ProjectsManager() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Copier le lien de soumission
  const copySubmissionLink = (restitutionId: string) => {
    const link = `${window.location.origin}/session/${sessionId}/project/${restitutionId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(restitutionId);
    setTimeout(() => setCopiedLink(null), 2000);
  };
  
  const {
    restitutions,
    templates,
    isLoading,
    trainerActions,
    refresh
  } = useProjectRestitution({
    sessionId: sessionId || '',
    isTrainer: true
  });

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;
    
    const template = templates.find(t => t.id === selectedTemplateId);
    
    const newRestitution = await trainerActions.createRestitution({
      title: newProjectTitle,
      template_id: selectedTemplateId || null,
      criteria: template?.criteria || [],
      settings: template?.settings || {
        max_stars: 5,
        passing_percentage: 50,
        allow_late_submission: true,
        require_presentation_link: true,
        require_app_link: true,
        require_documentation: true,
        file_types_allowed: ['pdf', 'pptx', 'doc', 'docx', 'zip', 'png', 'jpg'],
        max_file_size_mb: 50,
        max_files: 10
      },
      instructions: template?.instructions || '',
      status: 'draft'
    });
    
    if (newRestitution) {
      setShowCreateModal(false);
      setNewProjectTitle('');
      setSelectedTemplateId('');
      navigate(`/trainer/session/${sessionId}/project/${newRestitution.id}/evaluate`);
    }
  };

  const handleOpenProject = async (id: string) => {
    await trainerActions.openRestitution(id);
    refresh();
  };

  const handleCloseProject = async (id: string) => {
    await trainerActions.closeRestitution(id);
    refresh();
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette restitution de projet ?')) {
      await trainerActions.deleteRestitution(id);
      refresh();
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; label: string; icon: React.ComponentType<any> }> = {
      draft: { color: 'bg-gray-100 text-gray-600', label: 'Brouillon', icon: FileText },
      published: { color: 'bg-blue-100 text-blue-700', label: 'Publié', icon: Eye },
      open: { color: 'bg-green-100 text-green-700', label: 'Ouvert', icon: Play },
      closed: { color: 'bg-orange-100 text-orange-700', label: 'Fermé', icon: Pause },
      grading: { color: 'bg-purple-100 text-purple-700', label: 'En notation', icon: Award },
      completed: { color: 'bg-teal-100 text-teal-700', label: 'Terminé', icon: CheckCircle },
      archived: { color: 'bg-gray-100 text-gray-500', label: 'Archivé', icon: Archive }
    };
    return configs[status] || configs.draft;
  };

  if (!sessionId) {
    return <div className="p-8 text-center">Session ID manquant</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      
      <div className="max-w-6xl mx-auto px-4 py-6 pt-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Restitutions de projet</h1>
            <p className="text-gray-500">Gérez les projets à évaluer pour cette session</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/trainer/project-templates"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Settings className="h-5 w-5" />
              Gérer les templates
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Nouvelle restitution
            </button>
          </div>
        </div>

        {/* Liste des restitutions */}
        {restitutions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-600 mb-2">
              Aucune restitution de projet
            </h2>
            <p className="text-gray-500 mb-6">
              Créez une restitution pour permettre aux élèves de soumettre leurs projets
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Créer une restitution
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {restitutions.map(restitution => {
              const status = getStatusConfig(restitution.status);
              const StatusIcon = status.icon;
              
              return (
                <div key={restitution.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {restitution.title}
                          </h3>
                          <span className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="h-4 w-4" />
                            {status.label}
                          </span>
                        </div>
                        
                        {restitution.description && (
                          <p className="text-gray-600 mb-3">{restitution.description}</p>
                        )}
                        
                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Users className="h-4 w-4" />
                            {restitution.submissions_count}/{restitution.total_learners || '?'} soumissions
                          </span>
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {restitution.evaluated_count} évalués
                          </span>
                          {restitution.average_score && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <Award className="h-4 w-4" />
                              Moyenne: {restitution.average_score.toFixed(1)}/20
                            </span>
                          )}
                          {restitution.due_date && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Calendar className="h-4 w-4" />
                              Échéance: {new Date(restitution.due_date).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        
                        {/* Lien de soumission pour les étudiants */}
                        {restitution.status === 'open' && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-green-700">
                                <LinkIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">Lien pour les étudiants :</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-white px-2 py-1 rounded border">
                                  /session/{sessionId}/project/{restitution.id}
                                </code>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copySubmissionLink(restitution.id);
                                  }}
                                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                                    copiedLink === restitution.id
                                      ? 'bg-green-600 text-white'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  <Copy className="h-3 w-3" />
                                  {copiedLink === restitution.id ? 'Copié !' : 'Copier'}
                                </button>
                                <a
                                  href={`/session/${sessionId}/project/${restitution.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Tester
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Critères */}
                        {restitution.criteria && restitution.criteria.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {restitution.criteria.map((criterion: EvaluationCriterion) => (
                              <span
                                key={criterion.id}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {criterion.name} ({criterion.weight}%)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {restitution.status === 'draft' && (
                          <button
                            onClick={() => handleOpenProject(restitution.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Ouvrir aux soumissions"
                          >
                            <Play className="h-5 w-5" />
                          </button>
                        )}
                        {restitution.status === 'open' && (
                          <button
                            onClick={() => handleCloseProject(restitution.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                            title="Fermer les soumissions"
                          >
                            <Pause className="h-5 w-5" />
                          </button>
                        )}
                        <Link
                          to={`/trainer/session/${sessionId}/project/${restitution.id}/evaluate`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Évaluer les projets"
                        >
                          <BarChart3 className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProject(restitution.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <Link
                          to={`/trainer/session/${sessionId}/project/${restitution.id}/evaluate`}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-2"
                        >
                          Évaluer
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Nouvelle restitution de projet
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la restitution
                </label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="Ex: Projet No-Code / Low-Code"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template de critères ({templates.length} disponible{templates.length > 1 ? 's' : ''})
                </label>
                {templates.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      ⚠️ Aucun template disponible. Les critères seront à définir manuellement après création.
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Créer sans template --</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.title}
                        </option>
                      ))}
                    </select>
                    {selectedTemplateId && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700 font-medium mb-2">
                          Critères d'évaluation inclus :
                        </p>
                        <div className="space-y-1">
                          {templates.find(t => t.id === selectedTemplateId)?.criteria.map((c: EvaluationCriterion) => (
                            <div key={c.id} className="flex items-center justify-between text-sm">
                              <span className="text-blue-800">{c.name}</span>
                              <span className="text-blue-600 font-medium">{c.weight}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectTitle('');
                  setSelectedTemplateId('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
