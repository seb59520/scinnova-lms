import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Upload, Link as LinkIcon, FileText, User, Send, Plus, Trash2, CheckCircle, Save } from 'lucide-react';
import type { ProjectSubmission, ToolUsed, ProjectFile } from '../../types/sessions';

interface SubmitForLearnerModalProps {
  restitutionId: string;
  sessionId: string;
  learners: Array<{ id: string; full_name: string; avatar_url?: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

// Clé pour le localStorage
const getStorageKey = (restitutionId: string) => `submit-for-learner-draft-${restitutionId}`;

interface DraftData {
  selectedLearnerId: string;
  projectTitle: string;
  projectDescription: string;
  presentationLink: string;
  appLink: string;
  documentationLink: string;
  repositoryLink: string;
  videoLink: string;
  learnerNotes: string;
  toolsUsed: ToolUsed[];
  files: ProjectFile[];
  savedAt: string;
}

export function SubmitForLearnerModal({
  restitutionId,
  sessionId,
  learners,
  onClose,
  onSuccess
}: SubmitForLearnerModalProps) {
  // Charger le brouillon depuis localStorage
  const loadDraft = useCallback((): Partial<DraftData> => {
    try {
      const saved = localStorage.getItem(getStorageKey(restitutionId));
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erreur chargement brouillon:', e);
    }
    return {};
  }, [restitutionId]);

  const draft = loadDraft();

  const [selectedLearnerId, setSelectedLearnerId] = useState(draft.selectedLearnerId || '');
  const [projectTitle, setProjectTitle] = useState(draft.projectTitle || '');
  const [projectDescription, setProjectDescription] = useState(draft.projectDescription || '');
  const [presentationLink, setPresentationLink] = useState(draft.presentationLink || '');
  const [appLink, setAppLink] = useState(draft.appLink || '');
  const [documentationLink, setDocumentationLink] = useState(draft.documentationLink || '');
  const [repositoryLink, setRepositoryLink] = useState(draft.repositoryLink || '');
  const [videoLink, setVideoLink] = useState(draft.videoLink || '');
  const [learnerNotes, setLearnerNotes] = useState(draft.learnerNotes || '');
  const [toolsUsed, setToolsUsed] = useState<ToolUsed[]>(draft.toolsUsed || []);
  const [files, setFiles] = useState<ProjectFile[]>(draft.files || []);
  const [newTool, setNewTool] = useState({ name: '', role: '', plan: '', cost_monthly: '' });
  const [showToolForm, setShowToolForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(draft.savedAt ? new Date(draft.savedAt) : null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sauvegarder automatiquement dans localStorage
  const saveDraft = useCallback(() => {
    const draftData: DraftData = {
      selectedLearnerId,
      projectTitle,
      projectDescription,
      presentationLink,
      appLink,
      documentationLink,
      repositoryLink,
      videoLink,
      learnerNotes,
      toolsUsed,
      files,
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(getStorageKey(restitutionId), JSON.stringify(draftData));
      setLastSaved(new Date());
    } catch (e) {
      console.error('Erreur sauvegarde brouillon:', e);
    }
  }, [restitutionId, selectedLearnerId, projectTitle, projectDescription, presentationLink, 
      appLink, documentationLink, repositoryLink, videoLink, learnerNotes, toolsUsed, files]);

  // Sauvegarder automatiquement toutes les 3 secondes si des changements
  useEffect(() => {
    const timer = setTimeout(() => {
      if (projectTitle || selectedLearnerId || presentationLink || appLink) {
        saveDraft();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [saveDraft, projectTitle, selectedLearnerId, presentationLink, appLink]);

  // Sauvegarder quand on quitte la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveDraft]);

  // Effacer le brouillon après soumission réussie
  const clearDraft = () => {
    localStorage.removeItem(getStorageKey(restitutionId));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0 || !selectedLearnerId) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const newFiles: ProjectFile[] = [];

      for (const file of Array.from(uploadedFiles)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `projects/${sessionId}/${selectedLearnerId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        newFiles.push({
          name: file.name,
          path: fileName,
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString()
        });
      }

      setFiles([...files, ...newFiles]);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Erreur lors de l\'upload des fichiers');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

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

  const handleRemoveTool = (index: number) => {
    setToolsUsed(toolsUsed.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearnerId || !projectTitle.trim()) {
      setError('Veuillez sélectionner un apprenant et donner un titre au projet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Vérifier si une soumission existe déjà
      const { data: existing } = await supabase
        .from('project_submissions')
        .select('id')
        .eq('restitution_id', restitutionId)
        .eq('user_id', selectedLearnerId)
        .maybeSingle();

      const submissionData = {
        project_title: projectTitle,
        project_description: projectDescription || null,
        presentation_link: presentationLink || null,
        app_link: appLink || null,
        documentation_link: documentationLink || null,
        repository_link: repositoryLink || null,
        video_link: videoLink || null,
        learner_notes: learnerNotes || null,
        files,
        tools_used: toolsUsed,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        submitted_by_trainer: user.id,
        last_saved_at: new Date().toISOString()
      };

      if (existing) {
        // Mettre à jour
        const { error: updateError } = await supabase
          .from('project_submissions')
          .update(submissionData)
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Créer
        const { error: insertError } = await supabase
          .from('project_submissions')
          .insert({
            ...submissionData,
            restitution_id: restitutionId,
            session_id: sessionId,
            user_id: selectedLearnerId,
            started_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Effacer le brouillon après soumission réussie
      clearDraft();
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error submitting for learner:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Projet soumis !</h2>
          <p className="text-gray-600">
            Le projet a été soumis au nom de l'apprenant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Soumettre un projet pour un apprenant</h2>
            {lastSaved && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <Save className="w-3 h-3" />
                Brouillon sauvegardé à {lastSaved.toLocaleTimeString('fr-FR')}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Sélection de l'apprenant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-1" />
              Apprenant *
            </label>
            <select
              value={selectedLearnerId}
              onChange={(e) => setSelectedLearnerId(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un apprenant...</option>
              {learners.map(learner => (
                <option key={learner.id} value={learner.id}>
                  {learner.full_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Utilisez cette fonction si l'apprenant vous a envoyé son projet par mail ou autre moyen.
            </p>
          </div>

          {/* Titre et description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre du projet *
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Application de gestion de tâches"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Description du projet..."
              />
            </div>
          </div>

          {/* Liens */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Liens du projet
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="url"
                value={presentationLink}
                onChange={(e) => setPresentationLink(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Lien présentation (Notion, Slides...)"
              />
              <input
                type="url"
                value={appLink}
                onChange={(e) => setAppLink(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Lien application déployée"
              />
              <input
                type="url"
                value={documentationLink}
                onChange={(e) => setDocumentationLink(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Lien documentation"
              />
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Lien vidéo démo"
              />
            </div>
          </div>

          {/* Fichiers */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Fichiers joints
            </h3>
            
            {files.length > 0 && (
              <div className="space-y-2 mb-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={!selectedLearnerId}
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.txt,.csv,.md,.json,.mp4,.webm,.mov"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !selectedLearnerId}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Upload className={`w-5 h-5 ${uploading ? 'animate-bounce' : ''}`} />
                {uploading ? 'Upload en cours...' : 'Ajouter des fichiers'}
              </div>
              <span className="text-xs text-gray-500">
                PDF, Images (PNG, JPG, GIF, WebP), Word, PowerPoint, Excel, ZIP, Vidéos (MP4, WebM) - Max 100 Mo
              </span>
            </button>
          </div>

          {/* Outils utilisés */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Outils utilisés</h3>
              <button
                type="button"
                onClick={() => setShowToolForm(true)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {toolsUsed.length > 0 && (
              <div className="space-y-2 mb-3">
                {toolsUsed.map((tool, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{tool.name}</span>
                      {tool.plan && <span className="text-xs text-gray-500 ml-2">({tool.plan})</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTool(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showToolForm && (
              <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newTool.name}
                    onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="Nom de l'outil"
                  />
                  <input
                    type="text"
                    value={newTool.plan}
                    onChange={(e) => setNewTool({ ...newTool, plan: e.target.value })}
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="Plan (Free, Pro...)"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowToolForm(false)}
                    className="px-3 py-1 text-sm text-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTool}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (visibles par l'apprenant)
            </label>
            <textarea
              value={learnerNotes}
              onChange={(e) => setLearnerNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Notes sur le projet..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                if (confirm('Effacer le brouillon ?')) {
                  clearDraft();
                  setSelectedLearnerId('');
                  setProjectTitle('');
                  setProjectDescription('');
                  setPresentationLink('');
                  setAppLink('');
                  setDocumentationLink('');
                  setVideoLink('');
                  setLearnerNotes('');
                  setToolsUsed([]);
                  setFiles([]);
                  setLastSaved(null);
                }
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Effacer le brouillon
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  saveDraft();
                  onClose();
                }}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Sauvegarder et fermer
              </button>
              <button
                type="submit"
                disabled={loading || !selectedLearnerId || !projectTitle.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Soumission...' : 'Soumettre le projet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
