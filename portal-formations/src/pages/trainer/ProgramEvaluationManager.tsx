import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProgramEvaluations } from '../../hooks/useProgramEvaluations';
import { EvaluationQuestionEditor } from '../../components/trainer/EvaluationQuestionEditor';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { supabase } from '../../lib/supabaseClient';
import type { EvaluationQuestion, ProgramEvaluation } from '../../types/database';
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  GripVertical,
  Settings,
  ClipboardCheck,
  Users,
  BarChart3,
  Clock,
  Award,
  Upload,
  Download,
  FileJson,
  BookOpen,
  Gamepad2
} from 'lucide-react';

interface ExpectedItem {
  id: string;
  item_id: string;
  item_type: 'quiz' | 'tp' | 'exercise' | 'game';
  is_required: boolean;
  items?: {
    id: string;
    title: string;
    type: string;
    modules?: {
      id: string;
      title: string;
      courses?: {
        id: string;
        title: string;
      };
    };
  };
}

export function ProgramEvaluationManager() {
  const { programId } = useParams<{ programId: string }>();

  const {
    evaluations,
    currentEvaluation,
    isLoading,
    error,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    publishEvaluation,
    unpublishEvaluation,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    refresh
  } = useProgramEvaluations({ programId });

  const [isCreating, setIsCreating] = useState(false);
  const [selectedEvalId, setSelectedEvalId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expectedItems, setExpectedItems] = useState<ExpectedItem[]>([]);
  const [loadingExpectedItems, setLoadingExpectedItems] = useState(true);

  const [newEvalForm, setNewEvalForm] = useState({
    title: '',
    description: '',
    passing_score: 70,
    max_attempts: 3,
    time_limit_minutes: null as number | null
  });
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const selectedEvaluation = evaluations.find(e => e.id === selectedEvalId);

  // Charger les items attendus (quiz, TP) depuis program_expected_items
  useEffect(() => {
    if (!programId) return;

    const fetchExpectedItems = async () => {
      try {
        setLoadingExpectedItems(true);
        const { data, error: fetchError } = await supabase
          .from('program_expected_items')
          .select('*')
          .eq('program_id', programId)
          .order('position', { ascending: true });

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          const itemIds = data.map(ei => ei.item_id);
          const { data: itemsData, error: itemsError } = await supabase
            .from('items')
            .select('id, title, type, module_id')
            .in('id', itemIds);

          if (itemsError) throw itemsError;

          // Récupérer les modules
          const moduleIds = [...new Set((itemsData || []).map(i => i.module_id).filter(Boolean))];
          let modulesMap = new Map();
          if (moduleIds.length > 0) {
            const { data: modulesData } = await supabase
              .from('modules')
              .select('id, title, course_id')
              .in('id', moduleIds);

            if (modulesData) {
              modulesMap = new Map(modulesData.map(m => [m.id, m]));
            }
          }

          // Récupérer les cours
          const courseIds = [...new Set(Array.from(modulesMap.values()).map((m: any) => m.course_id).filter(Boolean))];
          let coursesMap = new Map();
          if (courseIds.length > 0) {
            const { data: coursesData } = await supabase
              .from('courses')
              .select('id, title')
              .in('id', courseIds);

            if (coursesData) {
              coursesMap = new Map(coursesData.map(c => [c.id, c]));
            }
          }

          // Enrichir les données
          const enriched = data.map(ei => {
            const item = (itemsData || []).find(i => i.id === ei.item_id);
            const module = item?.module_id ? modulesMap.get(item.module_id) : null;
            const course = module?.course_id ? coursesMap.get(module.course_id) : null;

            return {
              ...ei,
              items: item ? {
                id: item.id,
                title: item.title,
                type: item.type,
                modules: module ? {
                  id: module.id,
                  title: module.title,
                  courses: course ? {
                    id: course.id,
                    title: course.title
                  } : null
                } : null
              } : null
            };
          });

          setExpectedItems(enriched);
        } else {
          setExpectedItems([]);
        }
      } catch (err) {
        console.error('Error fetching expected items:', err);
      } finally {
        setLoadingExpectedItems(false);
      }
    };

    fetchExpectedItems();
  }, [programId]);

  // Import JSON evaluation
  const handleImportEvaluation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validation
      if (!data.title) {
        throw new Error('Le champ "title" est requis');
      }
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Le champ "questions" doit être un tableau');
      }

      // Valider et formater les questions
      const questions: EvaluationQuestion[] = data.questions.map((q: any, index: number) => {
        if (!q.question) {
          throw new Error(`Question ${index + 1}: le champ "question" est requis`);
        }
        if (!q.type || !['multiple_choice', 'true_false', 'text', 'code'].includes(q.type)) {
          throw new Error(`Question ${index + 1}: type invalide (utilisez: multiple_choice, true_false, text, code)`);
        }
        if ((q.type === 'multiple_choice' || q.type === 'true_false') && (!q.options || !Array.isArray(q.options))) {
          throw new Error(`Question ${index + 1}: les options sont requises pour le type ${q.type}`);
        }

        return {
          id: `q-${Date.now()}-${index}`,
          question: q.question,
          type: q.type,
          options: q.options || [],
          correct_answer: q.correct_answer || '',
          points: q.points || 1
        };
      });

      // Créer l'évaluation
      const result = await createEvaluation({
        title: data.title,
        description: data.description || '',
        passing_score: data.passing_score || 70,
        max_attempts: data.max_attempts || 3,
        time_limit_minutes: data.time_limit_minutes || null,
        questions: questions
      });

      if (result) {
        setSelectedEvalId(result.id);
        alert(`Évaluation importée avec succès: ${questions.length} questions`);
      }
    } catch (err) {
      console.error('Import error:', err);
      setImportError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleCreateEvaluation = async () => {
    if (!newEvalForm.title.trim()) return;

    const result = await createEvaluation({
      title: newEvalForm.title,
      description: newEvalForm.description,
      passing_score: newEvalForm.passing_score,
      max_attempts: newEvalForm.max_attempts,
      time_limit_minutes: newEvalForm.time_limit_minutes,
      questions: []
    });

    if (result) {
      setIsCreating(false);
      setNewEvalForm({
        title: '',
        description: '',
        passing_score: 70,
        max_attempts: 3,
        time_limit_minutes: null
      });
      setSelectedEvalId(result.id);
    }
  };

  const handleDeleteEvaluation = async (evalId: string) => {
    if (!confirm('Supprimer cette évaluation et toutes ses questions ?')) return;
    await deleteEvaluation(evalId);
    if (selectedEvalId === evalId) {
      setSelectedEvalId(null);
    }
  };

  const handleTogglePublish = async (evaluation: ProgramEvaluation) => {
    if (evaluation.is_published) {
      await unpublishEvaluation(evaluation.id);
    } else {
      if (evaluation.questions.length === 0) {
        alert('Ajoutez au moins une question avant de publier.');
        return;
      }
      await publishEvaluation(evaluation.id);
    }
  };

  const handleSaveQuestion = async (question: EvaluationQuestion) => {
    if (!selectedEvalId) return;

    if (editingQuestionId) {
      await updateQuestion(selectedEvalId, question.id, question);
    } else {
      await addQuestion(selectedEvalId, question);
    }

    setEditingQuestionId(null);
    setIsAddingQuestion(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedEvalId) return;
    if (!confirm('Supprimer cette question ?')) return;
    await deleteQuestion(selectedEvalId, questionId);
  };

  const handleUpdateSettings = async (settings: Partial<ProgramEvaluation>) => {
    if (!selectedEvalId) return;
    await updateEvaluation(selectedEvalId, settings);
    setShowSettings(false);
  };

  // Debug: afficher les évaluations même pendant le chargement
  console.log('📊 Évaluations dans le composant:', evaluations.length, evaluations);
  console.log('📋 Détails des évaluations:', evaluations.map(e => ({ id: e.id, title: e.title, is_published: e.is_published })));
  console.log('⏳ État de chargement:', isLoading);
  console.log('❌ Erreur:', error);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Chargement des évaluations...</p>
          <p className="text-xs text-gray-400">Évaluations trouvées: {evaluations.length}</p>
        </div>
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
              to="/trainer/dashboard/by-program"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Évaluations du Programme</h1>
                <p className="mt-1 text-gray-600">
                  Gérez les évaluations et questionnaires du programme
                </p>
              </div>
              {!selectedEvalId && (
                <div className="flex items-center gap-2">
                  {/* Télécharger template */}
                  <a
                    href="/templates/evaluation-template.json"
                    download="evaluation-template.json"
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Télécharger le template JSON"
                  >
                    <Download className="w-4 h-4" />
                    Template
                  </a>

                  {/* Import JSON */}
                  <label className={`flex items-center gap-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer ${importing ? 'opacity-50' : ''}`}>
                    <Upload className="w-4 h-4" />
                    {importing ? 'Import...' : 'Importer JSON'}
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportEvaluation}
                      disabled={importing}
                      className="hidden"
                    />
                  </label>

                  {/* Créer manuellement */}
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle évaluation
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {importError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
              <FileJson className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Erreur d'import</p>
                <p className="text-sm">{importError}</p>
              </div>
              <button
                onClick={() => setImportError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Formulaire de création */}
          {isCreating && (
            <div className="mb-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Nouvelle évaluation</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={newEvalForm.title}
                    onChange={(e) => setNewEvalForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Évaluation finale Python"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newEvalForm.description}
                    onChange={(e) => setNewEvalForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Description de l'évaluation..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Score minimum (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newEvalForm.passing_score}
                      onChange={(e) => setNewEvalForm(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 70 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tentatives max
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newEvalForm.max_attempts}
                      onChange={(e) => setNewEvalForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 3 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temps limite (min)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newEvalForm.time_limit_minutes || ''}
                      onChange={(e) => setNewEvalForm(prev => ({
                        ...prev,
                        time_limit_minutes: e.target.value ? parseInt(e.target.value) : null
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Sans limite"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateEvaluation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Créer l'évaluation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste des évaluations ou éditeur */}
          {!selectedEvalId ? (
            // Liste des évaluations
            <div className="space-y-4">
              {/* Section Items attendus (Quiz, TP) */}
              {expectedItems.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Quiz, TP et Exercices attendus</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {expectedItems.map((expectedItem) => {
                      const getItemTypeIcon = () => {
                        switch (expectedItem.item_type) {
                          case 'quiz':
                          case 'game':
                            return <Gamepad2 className="w-5 h-5" />;
                          case 'tp':
                            return <ClipboardCheck className="w-5 h-5" />;
                          case 'exercise':
                            return <BookOpen className="w-5 h-5" />;
                          default:
                            return <ClipboardCheck className="w-5 h-5" />;
                        }
                      };

                      const getItemTypeColor = () => {
                        switch (expectedItem.item_type) {
                          case 'quiz':
                            return 'bg-purple-100 text-purple-700';
                          case 'tp':
                            return 'bg-blue-100 text-blue-700';
                          case 'exercise':
                            return 'bg-yellow-100 text-yellow-700';
                          case 'game':
                            return 'bg-green-100 text-green-700';
                          default:
                            return 'bg-gray-100 text-gray-700';
                        }
                      };

                      const getItemTypeLabel = () => {
                        switch (expectedItem.item_type) {
                          case 'quiz':
                            return 'Quiz';
                          case 'tp':
                            return 'TP';
                          case 'exercise':
                            return 'Exercice';
                          case 'game':
                            return 'Jeu';
                          default:
                            return expectedItem.item_type;
                        }
                      };

                      return (
                        <div
                          key={expectedItem.id}
                          className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-400"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${getItemTypeColor()}`}>
                              {getItemTypeIcon()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900">
                                  {expectedItem.items?.title || 'Item inconnu'}
                                </h3>
                                <span className={`text-xs px-2 py-0.5 rounded ${getItemTypeColor()}`}>
                                  {getItemTypeLabel()}
                                </span>
                                {expectedItem.is_required && (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                    Obligatoire
                                  </span>
                                )}
                              </div>
                              {expectedItem.items?.modules?.courses && (
                                <p className="text-sm text-gray-500">
                                  {expectedItem.items.modules.courses.title}
                                  {expectedItem.items.modules.title && ` • ${expectedItem.items.modules.title}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section Évaluations créées */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Évaluations créées</h2>
                  {evaluations.length > 0 && (
                    <span className="text-sm text-gray-500">({evaluations.length} évaluation{evaluations.length > 1 ? 's' : ''})</span>
                  )}
                </div>
                {evaluations.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <ClipboardCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune évaluation
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Créez votre première évaluation pour ce programme
                  </p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Créer une évaluation
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            evaluation.is_published ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <ClipboardCheck className={`w-5 h-5 ${
                              evaluation.is_published ? 'text-green-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{evaluation.title}</h3>
                            <p className="text-sm text-gray-500">
                              {evaluation.questions.length} question{evaluation.questions.length > 1 ? 's' : ''}
                              {' • '}
                              {evaluation.is_published ? (
                                <span className="text-green-600">Publié</span>
                              ) : (
                                <span className="text-gray-500">Brouillon</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePublish(evaluation)}
                            className={`p-2 rounded-lg ${
                              evaluation.is_published
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={evaluation.is_published ? 'Dépublier' : 'Publier'}
                          >
                            {evaluation.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setSelectedEvalId(evaluation.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/trainer/programs/${programId}/evaluations/${evaluation.id}/results`}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Voir les résultats"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteEvaluation(evaluation.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="font-medium">{evaluation.passing_score}%</div>
                          <div className="text-xs text-gray-500">Score min</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="font-medium">{evaluation.max_attempts}</div>
                          <div className="text-xs text-gray-500">Tentatives</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="font-medium">
                            {evaluation.time_limit_minutes ? `${evaluation.time_limit_minutes} min` : '-'}
                          </div>
                          <div className="text-xs text-gray-500">Temps</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="font-medium">
                            {evaluation.questions.reduce((sum, q) => sum + q.points, 0)}
                          </div>
                          <div className="text-xs text-gray-500">Points total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          ) : (
            // Éditeur de questions
            <div>
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setSelectedEvalId(null)}
                  className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la liste
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </button>
                  <Link
                    to={`/trainer/programs/${programId}/evaluations/${selectedEvalId}/results`}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Résultats
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{selectedEvaluation?.title}</h2>
                {selectedEvaluation?.description && (
                  <p className="mt-1 text-gray-600">{selectedEvaluation.description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {selectedEvaluation?.passing_score}% pour réussir
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedEvaluation?.max_attempts} tentative(s)
                  </span>
                  {selectedEvaluation?.time_limit_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedEvaluation.time_limit_minutes} minutes
                    </span>
                  )}
                </div>
              </div>

              {/* Liste des questions */}
              <div className="space-y-4">
                {selectedEvaluation?.questions.map((question, index) => (
                  editingQuestionId === question.id ? (
                    <EvaluationQuestionEditor
                      key={question.id}
                      question={question}
                      questionNumber={index + 1}
                      onSave={handleSaveQuestion}
                      onCancel={() => setEditingQuestionId(null)}
                    />
                  ) : (
                    <div
                      key={question.id}
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 text-gray-400">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                Question {index + 1} • {question.points} point{question.points > 1 ? 's' : ''}
                              </span>
                              <p className="mt-1 text-gray-900">{question.question}</p>
                              {question.options && (
                                <div className="mt-2 space-y-1">
                                  {question.options.map((option, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className={`text-sm pl-4 ${
                                        option === question.correct_answer
                                          ? 'text-green-600 font-medium'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      {option === question.correct_answer ? '✓ ' : '○ '}
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingQuestionId(question.id)}
                                className="p-1.5 text-gray-400 hover:text-blue-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))}

                {/* Ajout de question */}
                {isAddingQuestion ? (
                  <EvaluationQuestionEditor
                    questionNumber={(selectedEvaluation?.questions.length || 0) + 1}
                    onSave={handleSaveQuestion}
                    onCancel={() => setIsAddingQuestion(false)}
                  />
                ) : (
                  <button
                    onClick={() => setIsAddingQuestion(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter une question
                  </button>
                )}
              </div>

              {/* Info max questions */}
              <p className="mt-4 text-sm text-gray-500 text-center">
                {selectedEvaluation?.questions.length || 0} / 50 questions
              </p>
            </div>
          )}

          {/* Modal paramètres */}
          {showSettings && selectedEvaluation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h3 className="text-lg font-semibold mb-4">Paramètres de l'évaluation</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    handleUpdateSettings({
                      title: formData.get('title') as string,
                      description: formData.get('description') as string,
                      passing_score: parseInt(formData.get('passing_score') as string),
                      max_attempts: parseInt(formData.get('max_attempts') as string),
                      time_limit_minutes: formData.get('time_limit')
                        ? parseInt(formData.get('time_limit') as string)
                        : null
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      name="title"
                      defaultValue={selectedEvaluation.title}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      defaultValue={selectedEvaluation.description || ''}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Score min (%)</label>
                      <input
                        name="passing_score"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={selectedEvaluation.passing_score}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tentatives</label>
                      <input
                        name="max_attempts"
                        type="number"
                        min={1}
                        max={10}
                        defaultValue={selectedEvaluation.max_attempts}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temps limite (min)</label>
                    <input
                      name="time_limit"
                      type="number"
                      min={0}
                      defaultValue={selectedEvaluation.time_limit_minutes || ''}
                      placeholder="Sans limite"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
