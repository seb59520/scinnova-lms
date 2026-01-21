import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import {
  Plus, FileText, Edit, Trash2, Save, X, ChevronLeft, Star,
  GripVertical, Copy, Check, AlertCircle
} from 'lucide-react';
import type { ProjectRestitutionTemplate, EvaluationCriterion } from '../../types/sessions';

// Critère par défaut
const DEFAULT_CRITERION: EvaluationCriterion = {
  id: '',
  name: '',
  description: '',
  weight: 10,
  max_stars: 5,
  subcriteria: []
};

export function ProjectTemplatesManager() {
  const [templates, setTemplates] = useState<ProjectRestitutionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<ProjectRestitutionTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les templates
  const loadTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('project_restitution_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
      setError('Erreur lors du chargement des templates');
    } else {
      setTemplates(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Créer un nouveau template
  const handleCreate = () => {
    setEditingTemplate({
      id: '',
      org_id: null,
      title: 'Nouveau template',
      description: '',
      slug: null,
      criteria: [
        {
          id: 'criterion_1',
          name: 'Critère 1',
          description: 'Description du critère',
          weight: 100,
          max_stars: 5,
          subcriteria: []
        }
      ],
      settings: {
        max_stars: 5,
        passing_percentage: 50,
        allow_late_submission: true,
        require_presentation_link: false,
        require_app_link: false,
        require_documentation: false,
        file_types_allowed: ['pdf', 'pptx', 'doc', 'docx', 'zip', 'png', 'jpg'],
        max_file_size_mb: 50,
        max_files: 10
      },
      instructions: '',
      is_active: true,
      created_by: null,
      created_at: '',
      updated_at: ''
    });
    setIsCreating(true);
  };

  // Dupliquer un template
  const handleDuplicate = (template: ProjectRestitutionTemplate) => {
    setEditingTemplate({
      ...template,
      id: '',
      title: `${template.title} (copie)`,
      slug: null
    });
    setIsCreating(true);
  };

  // Sauvegarder le template
  const handleSave = async () => {
    if (!editingTemplate) return;

    // Vérifier que le total des poids = 100
    const totalWeight = editingTemplate.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight !== 100) {
      setError(`Le total des poids doit être égal à 100% (actuellement ${totalWeight}%)`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        // Créer
        const { data, error } = await supabase
          .from('project_restitution_templates')
          .insert({
            title: editingTemplate.title,
            description: editingTemplate.description,
            criteria: editingTemplate.criteria,
            settings: editingTemplate.settings,
            instructions: editingTemplate.instructions,
            is_active: editingTemplate.is_active
          })
          .select()
          .single();

        if (error) throw error;
        setSuccess('Template créé avec succès !');
      } else {
        // Mettre à jour
        const { error } = await supabase
          .from('project_restitution_templates')
          .update({
            title: editingTemplate.title,
            description: editingTemplate.description,
            criteria: editingTemplate.criteria,
            settings: editingTemplate.settings,
            instructions: editingTemplate.instructions,
            is_active: editingTemplate.is_active
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        setSuccess('Template mis à jour avec succès !');
      }

      await loadTemplates();
      setEditingTemplate(null);
      setIsCreating(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer un template
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    const { error } = await supabase
      .from('project_restitution_templates')
      .delete()
      .eq('id', id);

    if (error) {
      setError('Erreur lors de la suppression');
    } else {
      setSuccess('Template supprimé');
      loadTemplates();
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Ajouter un critère
  const addCriterion = () => {
    if (!editingTemplate) return;
    const newId = `criterion_${Date.now()}`;
    setEditingTemplate({
      ...editingTemplate,
      criteria: [
        ...editingTemplate.criteria,
        { ...DEFAULT_CRITERION, id: newId, name: `Critère ${editingTemplate.criteria.length + 1}` }
      ]
    });
  };

  // Modifier un critère
  const updateCriterion = (index: number, updates: Partial<EvaluationCriterion>) => {
    if (!editingTemplate) return;
    const newCriteria = [...editingTemplate.criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    setEditingTemplate({ ...editingTemplate, criteria: newCriteria });
  };

  // Supprimer un critère
  const removeCriterion = (index: number) => {
    if (!editingTemplate || editingTemplate.criteria.length <= 1) return;
    const newCriteria = editingTemplate.criteria.filter((_, i) => i !== index);
    setEditingTemplate({ ...editingTemplate, criteria: newCriteria });
  };

  // Calculer le total des poids
  const totalWeight = editingTemplate?.criteria.reduce((sum, c) => sum + c.weight, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TrainerHeader />
        <div className="pt-8 flex items-center justify-center">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />

      <div className="max-w-5xl mx-auto px-4 py-6 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              to="/trainer/sessions"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Templates de critères</h1>
            <p className="text-gray-500">Créez et gérez vos grilles d'évaluation</p>
          </div>
          {!editingTemplate && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Nouveau template
            </button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <Check className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Éditeur de template */}
        {editingTemplate ? (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {isCreating ? 'Nouveau template' : 'Modifier le template'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || totalWeight !== 100}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Infos générales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du template *
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.title}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Ex: Projet No-Code/Low-Code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.description || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Description courte"
                  />
                </div>
              </div>

              {/* Critères */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Critères d'évaluation
                  </h3>
                  <div className={`text-sm font-medium ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    Total: {totalWeight}% {totalWeight !== 100 && '(doit être 100%)'}
                  </div>
                </div>

                <div className="space-y-3">
                  {editingTemplate.criteria.map((criterion, index) => (
                    <div key={criterion.id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-12 gap-3">
                          <div className="col-span-5">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Nom du critère
                            </label>
                            <input
                              type="text"
                              value={criterion.name}
                              onChange={(e) => updateCriterion(index, { name: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              placeholder="Nom du critère"
                            />
                          </div>
                          <div className="col-span-5">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={criterion.description}
                              onChange={(e) => updateCriterion(index, { description: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              placeholder="Description"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Poids %
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={criterion.weight}
                              onChange={(e) => updateCriterion(index, { weight: parseInt(e.target.value) || 0 })}
                              className="w-full px-2 py-2 border rounded-lg text-sm text-center"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Étoiles
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={criterion.max_stars}
                              onChange={(e) => updateCriterion(index, { max_stars: parseInt(e.target.value) || 5 })}
                              className="w-full px-2 py-2 border rounded-lg text-sm text-center"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeCriterion(index)}
                          disabled={editingTemplate.criteria.length <= 1}
                          className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addCriterion}
                  className="mt-3 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un critère
                </button>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions pour les étudiants
                </label>
                <textarea
                  value={editingTemplate.instructions || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, instructions: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Instructions détaillées pour les étudiants..."
                />
              </div>

              {/* Options */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingTemplate.settings?.require_presentation_link}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        settings: { ...editingTemplate.settings, require_presentation_link: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">Lien présentation obligatoire</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingTemplate.settings?.require_app_link}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        settings: { ...editingTemplate.settings, require_app_link: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">Lien application obligatoire</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingTemplate.settings?.require_documentation}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        settings: { ...editingTemplate.settings, require_documentation: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">Documentation obligatoire</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingTemplate.settings?.allow_late_submission}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        settings: { ...editingTemplate.settings, allow_late_submission: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">Autoriser soumissions en retard</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Liste des templates */
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-medium text-gray-600 mb-2">
                  Aucun template
                </h2>
                <p className="text-gray-500 mb-6">
                  Créez votre premier template de critères d'évaluation
                </p>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  Créer un template
                </button>
              </div>
            ) : (
              templates.map(template => (
                <div key={template.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.title}
                        </h3>
                        {!template.is_active && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                            Inactif
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-gray-600 mb-3">{template.description}</p>
                      )}
                      
                      {/* Critères */}
                      <div className="flex flex-wrap gap-2">
                        {template.criteria.map((c: EvaluationCriterion) => (
                          <span
                            key={c.id}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded flex items-center gap-1"
                          >
                            <Star className="h-3 w-3" />
                            {c.name} ({c.weight}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDuplicate(template)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Dupliquer"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setIsCreating(false);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
