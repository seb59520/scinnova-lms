import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectRestitution } from '../hooks/useProjectRestitution';
import {
  Star, Send, Save, FileText, Link as LinkIcon, Upload, Trash2,
  ExternalLink, Plus, ChevronLeft, CheckCircle, Clock, AlertCircle,
  Play, File, Info, Award, ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import type { ToolUsed, ProjectFile, EvaluationCriterion, CriterionScore } from '../types/sessions';

// Composant étoiles en lecture seule
function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export function ProjectSubmissionPage() {
  const { sessionId, restitutionId } = useParams<{ sessionId: string; restitutionId: string }>();
  
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [presentationLink, setPresentationLink] = useState('');
  const [appLink, setAppLink] = useState('');
  const [documentationLink, setDocumentationLink] = useState('');
  const [repositoryLink, setRepositoryLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [learnerNotes, setLearnerNotes] = useState('');
  const [toolsUsed, setToolsUsed] = useState<ToolUsed[]>([]);
  const [newTool, setNewTool] = useState({ name: '', role: '', plan: '', cost_monthly: '' });
  const [showToolForm, setShowToolForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    currentRestitution,
    mySubmission,
    myEvaluation,
    isLoading,
    error,
    learnerActions,
    refresh
  } = useProjectRestitution({
    sessionId: sessionId || '',
    restitutionId,
    isTrainer: false
  });

  // Charger les données existantes
  React.useEffect(() => {
    if (mySubmission) {
      setProjectTitle(mySubmission.project_title || '');
      setProjectDescription(mySubmission.project_description || '');
      setPresentationLink(mySubmission.presentation_link || '');
      setAppLink(mySubmission.app_link || '');
      setDocumentationLink(mySubmission.documentation_link || '');
      setRepositoryLink(mySubmission.repository_link || '');
      setVideoLink(mySubmission.video_link || '');
      setLearnerNotes(mySubmission.learner_notes || '');
      setToolsUsed(mySubmission.tools_used || []);
    }
  }, [mySubmission]);

  // Initialiser la soumission si nécessaire
  const ensureSubmission = async () => {
    if (!mySubmission && restitutionId) {
      return await learnerActions.startSubmission(restitutionId);
    }
    return mySubmission;
  };

  // Sauvegarder le brouillon
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const submission = await ensureSubmission();
      if (submission) {
        await learnerActions.saveSubmissionDraft(submission.id, {
          project_title: projectTitle,
          project_description: projectDescription,
          presentation_link: presentationLink || null,
          app_link: appLink || null,
          documentation_link: documentationLink || null,
          repository_link: repositoryLink || null,
          video_link: videoLink || null,
          learner_notes: learnerNotes || null,
          tools_used: toolsUsed
        });
        await refresh();
      }
    } catch (err) {
      console.error('Error saving draft:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Soumettre le projet
  const handleSubmit = async () => {
    if (!confirm('Êtes-vous sûr de vouloir soumettre votre projet ? Vous ne pourrez plus le modifier après.')) {
      return;
    }
    
    setIsSaving(true);
    try {
      const submission = await ensureSubmission();
      if (submission) {
        // Sauvegarder d'abord
        await learnerActions.saveSubmissionDraft(submission.id, {
          project_title: projectTitle,
          project_description: projectDescription,
          presentation_link: presentationLink || null,
          app_link: appLink || null,
          documentation_link: documentationLink || null,
          repository_link: repositoryLink || null,
          video_link: videoLink || null,
          learner_notes: learnerNotes || null,
          tools_used: toolsUsed
        });
        // Puis soumettre
        await learnerActions.submitSubmission(submission.id);
        await refresh();
      }
    } catch (err) {
      console.error('Error submitting:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Upload de fichier
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      const submission = await ensureSubmission();
      if (submission) {
        for (const file of Array.from(files)) {
          await learnerActions.uploadFile(submission.id, file);
        }
        await refresh();
      }
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Supprimer un fichier
  const handleDeleteFile = async (filePath: string) => {
    if (!mySubmission) return;
    await learnerActions.deleteFile(mySubmission.id, filePath);
    await refresh();
  };

  // Ajouter un outil
  const handleAddTool = () => {
    if (!newTool.name.trim()) return;
    
    setToolsUsed([...toolsUsed, {
      name: newTool.name,
      role: newTool.role,
      plan: newTool.plan,
      cost_monthly: newTool.cost_monthly ? parseFloat(newTool.cost_monthly) : null
    }]);
    setNewTool({ name: '', role: '', plan: '', cost_monthly: '' });
    setShowToolForm(false);
  };

  // Supprimer un outil
  const handleRemoveTool = (index: number) => {
    setToolsUsed(toolsUsed.filter((_, i) => i !== index));
  };

  // État de la soumission
  const isSubmitted = mySubmission?.status === 'submitted' || mySubmission?.status === 'late' || mySubmission?.status === 'evaluated';
  const isReadonly = isSubmitted;

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-medium text-gray-600">Restitution non trouvée</h2>
        </div>
      </div>
    );
  }

  // Vérifier si les soumissions sont ouvertes
  if (currentRestitution.status !== 'open' && !mySubmission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Clock className="h-16 w-16 mx-auto text-orange-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-600 mb-2">
            Soumissions non ouvertes
          </h2>
          <p className="text-gray-500">
            Les soumissions pour ce projet ne sont pas encore ouvertes ou sont déjà fermées.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{currentRestitution.title}</h1>
          {currentRestitution.due_date && (
            <p className="text-sm text-orange-600 flex items-center gap-1 mt-1">
              <Clock className="h-4 w-4" />
              Échéance: {new Date(currentRestitution.due_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Statut de soumission */}
        {mySubmission && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            mySubmission.status === 'submitted' ? 'bg-blue-50 border border-blue-200' :
            mySubmission.status === 'late' ? 'bg-orange-50 border border-orange-200' :
            mySubmission.status === 'evaluated' ? 'bg-green-50 border border-green-200' :
            mySubmission.status === 'returned' ? 'bg-red-50 border border-red-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            {mySubmission.status === 'submitted' && (
              <>
                <Send className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="font-medium text-blue-800">Projet soumis</span>
                  <span className="text-blue-600 ml-2">
                    le {new Date(mySubmission.submitted_at!).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </>
            )}
            {mySubmission.status === 'late' && (
              <>
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <span className="font-medium text-orange-800">Soumis en retard</span>
                </div>
              </>
            )}
            {mySubmission.status === 'evaluated' && !myEvaluation?.is_published && (
              <>
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <span className="font-medium text-yellow-800">En cours d'évaluation</span>
                </div>
              </>
            )}
            {mySubmission.status === 'draft' && (
              <>
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <span className="font-medium text-gray-800">Brouillon</span>
                  <span className="text-gray-500 ml-2">
                    - Dernière sauvegarde: {new Date(mySubmission.last_saved_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Affichage de l'évaluation si publiée */}
        {myEvaluation?.is_published && (
          <div className="mb-6 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8" />
                  <div>
                    <h2 className="text-xl font-bold">Votre note</h2>
                    <p className="text-green-100 text-sm">Projet évalué</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">
                    {myEvaluation.final_score?.toFixed(1) || myEvaluation.score_20?.toFixed(1)}
                    <span className="text-2xl text-green-200">/20</span>
                  </div>
                  <div className={`text-sm ${myEvaluation.passed ? 'text-green-200' : 'text-red-200'}`}>
                    {myEvaluation.passed ? '✓ Validé' : '✗ Non validé'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Détail par critère */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Détail par critère</h3>
                <div className="space-y-3">
                  {currentRestitution.criteria.map((criterion: EvaluationCriterion) => {
                    const score = myEvaluation.criteria_scores[criterion.id] as CriterionScore | undefined;
                    return (
                      <div key={criterion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{criterion.name}</span>
                            <span className="text-xs text-gray-500">({criterion.weight}%)</span>
                          </div>
                          {score?.comment && (
                            <p className="text-sm text-gray-600 mt-1">{score.comment}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StarDisplay value={score?.stars || 0} max={criterion.max_stars} />
                          <span className="text-sm text-gray-500 w-10 text-right">
                            {score?.stars || 0}/{criterion.max_stars}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Feedback */}
              {myEvaluation.strengths && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                    <ThumbsUp className="h-4 w-4" />
                    Points forts
                  </div>
                  <p className="text-green-700">{myEvaluation.strengths}</p>
                </div>
              )}
              
              {myEvaluation.improvements && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800 font-medium mb-2">
                    <ThumbsDown className="h-4 w-4" />
                    Axes d'amélioration
                  </div>
                  <p className="text-orange-700">{myEvaluation.improvements}</p>
                </div>
              )}
              
              {myEvaluation.global_feedback && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                    <MessageSquare className="h-4 w-4" />
                    Commentaire du formateur
                  </div>
                  <p className="text-blue-700">{myEvaluation.global_feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {currentRestitution.instructions && !myEvaluation?.is_published && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
                <div className="text-blue-800 prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {currentRestitution.instructions}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de soumission */}
        {!myEvaluation?.is_published && (
          <div className="space-y-6">
            {/* Infos projet */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du projet</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du projet *
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Ex: Application de gestion de tâches"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isReadonly}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description du projet
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Décrivez brièvement votre projet et le problème qu'il résout..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    disabled={isReadonly}
                  />
                </div>
              </div>
            </div>

            {/* Liens */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Liens du projet</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Lien présentation / Fiche projet
                    {currentRestitution.settings?.require_presentation_link && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="url"
                    value={presentationLink}
                    onChange={(e) => setPresentationLink(e.target.value)}
                    placeholder="https://notion.so/..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isReadonly}
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Play className="h-4 w-4 text-green-600" />
                    Lien application déployée
                    {currentRestitution.settings?.require_app_link && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="url"
                    value={appLink}
                    onChange={(e) => setAppLink(e.target.value)}
                    placeholder="https://myapp.bubble.io/..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isReadonly}
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <File className="h-4 w-4 text-purple-600" />
                    Lien documentation
                    {currentRestitution.settings?.require_documentation && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="url"
                    value={documentationLink}
                    onChange={(e) => setDocumentationLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isReadonly}
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Play className="h-4 w-4 text-red-600" />
                    Lien vidéo de démonstration
                  </label>
                  <input
                    type="url"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://youtube.com/... ou https://loom.com/..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isReadonly}
                  />
                </div>
              </div>
            </div>

            {/* Outils utilisés */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Outils No-Code/Low-Code utilisés</h2>
                {!isReadonly && (
                  <button
                    onClick={() => setShowToolForm(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un outil
                  </button>
                )}
              </div>
              
              {/* Liste des outils */}
              {toolsUsed.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucun outil ajouté. Ajoutez les outils que vous avez utilisés.
                </p>
              ) : (
                <div className="space-y-2">
                  {toolsUsed.map((tool, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{tool.name}</span>
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {tool.plan}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{tool.role}</p>
                      </div>
                      {tool.cost_monthly !== null && (
                        <span className="text-sm text-gray-600 mr-4">
                          {tool.cost_monthly === 0 ? 'Gratuit' : `${tool.cost_monthly}€/mois`}
                        </span>
                      )}
                      {!isReadonly && (
                        <button
                          onClick={() => handleRemoveTool(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Total des coûts */}
                  {toolsUsed.some(t => t.cost_monthly !== null) && (
                    <div className="pt-3 border-t mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Coût mensuel total:</span>
                        <span className="font-medium text-gray-900">
                          {toolsUsed.reduce((sum, t) => sum + (t.cost_monthly || 0), 0)}€/mois
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Coût annuel estimé:</span>
                        <span className="font-medium text-gray-900">
                          {toolsUsed.reduce((sum, t) => sum + (t.cost_monthly || 0), 0) * 12}€/an
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Formulaire d'ajout d'outil */}
              {showToolForm && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={newTool.name}
                      onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                      placeholder="Nom de l'outil (ex: Supabase)"
                      className="px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      value={newTool.plan}
                      onChange={(e) => setNewTool({ ...newTool, plan: e.target.value })}
                      placeholder="Plan utilisé (ex: Free, Pro)"
                      className="px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      value={newTool.role}
                      onChange={(e) => setNewTool({ ...newTool, role: e.target.value })}
                      placeholder="Rôle dans le projet (ex: Base de données)"
                      className="px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      value={newTool.cost_monthly}
                      onChange={(e) => setNewTool({ ...newTool, cost_monthly: e.target.value })}
                      placeholder="Coût mensuel (€)"
                      className="px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowToolForm(false);
                        setNewTool({ name: '', role: '', plan: '', cost_monthly: '' });
                      }}
                      className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddTool}
                      disabled={!newTool.name.trim()}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Fichiers */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fichiers joints</h2>
              
              {/* Liste des fichiers */}
              {mySubmission?.files && mySubmission.files.length > 0 && (
                <div className="space-y-2 mb-4">
                  {mySubmission.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <File className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="font-medium text-gray-900">{file.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      </div>
                      {!isReadonly && (
                        <button
                          onClick={() => handleDeleteFile(file.path)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload */}
              {!isReadonly && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.pptx,.ppt,.doc,.docx,.zip,.png,.jpg,.jpeg,.mp4"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Upload className={`h-8 w-8 ${isUploading ? 'animate-bounce' : ''} text-gray-400`} />
                    <span className="text-gray-600">
                      {isUploading ? 'Upload en cours...' : 'Cliquez pour ajouter des fichiers'}
                    </span>
                    <span className="text-xs text-gray-400">
                      PDF, PowerPoint, Word, ZIP, Images (max {currentRestitution.settings?.max_file_size_mb || 50}MB)
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes supplémentaires</h2>
              <textarea
                value={learnerNotes}
                onChange={(e) => setLearnerNotes(e.target.value)}
                placeholder="Ajoutez des notes ou commentaires pour le formateur..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                disabled={isReadonly}
              />
            </div>

            {/* Actions */}
            {!isReadonly && (
              <div className="flex justify-end gap-3 pb-8">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  {isSaving ? 'Enregistrement...' : 'Sauvegarder le brouillon'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving || !projectTitle.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                  {isSaving ? 'Soumission...' : 'Soumettre mon projet'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
