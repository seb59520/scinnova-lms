import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { RichTextEditor } from './RichTextEditor';
import { CheckCircle, Circle, Download, FileText, Users, TrendingUp, Clock } from 'lucide-react';
import type { Item, Submission } from '../types/database';

interface StepByStepTpRendererProps {
  item: Item;
  submission: Submission | null;
  onSubmissionUpdate?: (submission: Submission | null) => void;
  viewingUserId?: string | null;
}

interface Step {
  id: string;
  title: string;
  description?: any; // TipTap JSON ou string
  estimatedTime?: string; // Ex: "15 min"
  order: number;
}

interface StepByStepTpContent {
  type: 'step-by-step';
  introduction?: any; // TipTap JSON ou string
  steps: Step[];
  conclusion?: any; // TipTap JSON ou string
}

interface StepProgress {
  stepId: string;
  checked: boolean;
  checkedAt?: string;
}

export function StepByStepTpRenderer({ 
  item, 
  submission, 
  onSubmissionUpdate,
  viewingUserId 
}: StepByStepTpRendererProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState<StepByStepTpContent | null>(null);
  const [stepProgress, setStepProgress] = useState<Map<string, StepProgress>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const isTrainerOrAdmin = profile?.role === 'admin' || profile?.role === 'trainer' || profile?.role === 'instructor';
  const displayUserId = viewingUserId || user?.id;

  // Charger le contenu depuis item.content
  useEffect(() => {
    if (item.content) {
      try {
        const tpContent = item.content as any;
        if (tpContent.type === 'step-by-step' || tpContent.steps) {
          setContent({
            type: 'step-by-step',
            introduction: tpContent.introduction,
            steps: tpContent.steps || [],
            conclusion: tpContent.conclusion
          });
        }
      } catch (e) {
        console.error('Error parsing step-by-step TP content:', e);
        setError('Erreur lors du chargement du contenu du TP');
      }
    }
  }, [item]);

  // Charger la progression depuis la soumission
  useEffect(() => {
    if (submission?.answer_json?.stepProgress) {
      const progress = new Map<string, StepProgress>();
      const savedProgress = submission.answer_json.stepProgress as StepProgress[];
      savedProgress.forEach((sp) => {
        progress.set(sp.stepId, sp);
      });
      setStepProgress(progress);
    }
  }, [submission]);

  // Charger ou créer une soumission pour stocker la progression
  useEffect(() => {
    if (!submission && user && item.id && displayUserId === user.id) {
      const fetchOrCreateSubmission = async () => {
        try {
          const { data, error: fetchError } = await supabase
            .from('submissions')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_id', item.id)
            .maybeSingle();

          if (fetchError && fetchError.code !== 'PGRST116' && fetchError.code !== '406') {
            console.error('Error fetching submission:', fetchError);
            return;
          }

          if (!data) {
            // Créer une nouvelle soumission pour stocker la progression
            const { data: newSubmission, error: createError } = await supabase
              .from('submissions')
              .insert({
                user_id: user.id,
                item_id: item.id,
                answer_json: { stepProgress: [] },
                status: 'draft'
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating submission:', createError);
              return;
            }

            if (onSubmissionUpdate && newSubmission) {
              onSubmissionUpdate(newSubmission);
            }
          } else if (onSubmissionUpdate) {
            onSubmissionUpdate(data);
          }
        } catch (err) {
          console.error('Error in fetchOrCreateSubmission:', err);
        }
      };

      fetchOrCreateSubmission();
    }
  }, [submission, user, item.id, displayUserId, onSubmissionUpdate]);

  const handleStepToggle = async (stepId: string) => {
    if (!user || displayUserId !== user.id) return; // Seul l'étudiant peut cocher

    setLoading(true);
    setError(null);

    try {
      const currentProgress = stepProgress.get(stepId);
      const newChecked = !currentProgress?.checked;
      
      const updatedProgress = new Map(stepProgress);
      updatedProgress.set(stepId, {
        stepId,
        checked: newChecked,
        checkedAt: newChecked ? new Date().toISOString() : undefined
      });

      setStepProgress(updatedProgress);

      // Sauvegarder dans la soumission
      const progressArray = Array.from(updatedProgress.values());
      const answerJson = {
        ...(submission?.answer_json || {}),
        stepProgress: progressArray,
        lastUpdated: new Date().toISOString()
      };

      if (submission) {
        const { data, error: updateError } = await supabase
          .from('submissions')
          .update({
            answer_json: answerJson,
            status: 'draft' // Garder en draft tant que tous les steps ne sont pas complétés
          })
          .eq('id', submission.id)
          .select()
          .single();

        if (updateError) throw updateError;
        if (onSubmissionUpdate && data) {
          onSubmissionUpdate(data);
        }
      } else {
        // Créer une nouvelle soumission
        const { data: newSubmission, error: insertError } = await supabase
          .from('submissions')
          .insert({
            user_id: user.id,
            item_id: item.id,
            answer_json: answerJson,
            status: 'draft'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (onSubmissionUpdate && newSubmission) {
          onSubmissionUpdate(newSubmission);
        }
      }
    } catch (err: any) {
      console.error('Error toggling step:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
      // Restaurer l'état précédent
      setStepProgress(stepProgress);
    } finally {
      setLoading(false);
    }
  };

  const getProgressStats = () => {
    if (!content) return { completed: 0, total: 0, percentage: 0 };
    
    const total = content.steps.length;
    const completed = Array.from(stepProgress.values()).filter(sp => sp.checked).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const stats = getProgressStats();

  if (!content) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Ce TP pas à pas n'a pas de contenu configuré. Veuillez contacter votre formateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contenu pédagogique du TP (body) - EN PREMIER */}
      {item.content?.body && (
        <div className="prose max-w-none">
          <RichTextEditor
            content={item.content.body}
            onChange={() => {}}
            editable={false}
          />
        </div>
      )}

      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
          {displayUserId === user?.id && (
            <button
              onClick={() => setShowProgress(!showProgress)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 text-sm font-medium"
            >
              <TrendingUp className="w-4 h-4" />
              {showProgress ? 'Masquer' : 'Afficher'} les statistiques
            </button>
          )}
        </div>

        {/* Barre de progression */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progression</span>
            <span className="text-sm font-bold text-blue-700">
              {stats.completed} / {stats.total} étapes complétées ({stats.percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* Statistiques détaillées (si affichées) */}
        {showProgress && displayUserId === user?.id && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.completed}</div>
              <div className="text-xs text-gray-600">Complétées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{stats.total - stats.completed}</div>
              <div className="text-xs text-gray-600">Restantes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.percentage}%</div>
              <div className="text-xs text-gray-600">Terminé</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {content.steps.reduce((sum, step) => {
                  const stepProg = stepProgress.get(step.id);
                  return sum + (stepProg?.checked ? 1 : 0);
                }, 0)}
              </div>
              <div className="text-xs text-gray-600">Validées</div>
            </div>
          </div>
        )}
      </div>

      {/* Introduction */}
      {content.introduction && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Introduction
          </h3>
          {typeof content.introduction === 'object' ? (
            <div className="prose max-w-none">
              <RichTextEditor
                content={content.introduction}
                onChange={() => {}}
                editable={false}
              />
            </div>
          ) : (
            <div className="text-blue-800 whitespace-pre-wrap">{content.introduction}</div>
          )}
        </div>
      )}

      {/* Étapes */}
      <div className="space-y-4">
        {content.steps
          .sort((a, b) => a.order - b.order)
          .map((step, index) => {
            const stepProg = stepProgress.get(step.id);
            const isChecked = stepProg?.checked || false;
            const isReadOnly = displayUserId !== user?.id;

            return (
              <div
                key={step.id}
                className={`border-2 rounded-lg p-5 transition-all ${
                  isChecked
                    ? 'bg-green-50 border-green-300'
                    : 'bg-white border-gray-300 hover:border-blue-400'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Case à cocher */}
                  <button
                    onClick={() => !isReadOnly && handleStepToggle(step.id)}
                    disabled={loading || isReadOnly}
                    className={`flex-shrink-0 mt-1 ${
                      isReadOnly ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                    } transition-opacity`}
                  >
                    {isChecked ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </button>

                  {/* Contenu de l'étape */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Étape {index + 1}: {step.title}
                      </h3>
                      {step.estimatedTime && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {step.estimatedTime}
                        </div>
                      )}
                    </div>

                    {step.description && (
                      <div className="mt-2 text-gray-700">
                        {typeof step.description === 'object' ? (
                          <div className="prose max-w-none prose-img:rounded-lg prose-img:shadow-md prose-img:border prose-img:border-gray-200 prose-img:my-4">
                            <RichTextEditor
                              content={step.description}
                              onChange={() => {}}
                              editable={false}
                            />
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{step.description}</div>
                        )}
                      </div>
                    )}

                    {isChecked && stepProg?.checkedAt && (
                      <div className="mt-3 text-xs text-green-600 italic">
                        Complété le {new Date(stepProg.checkedAt).toLocaleString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Conclusion */}
      {content.conclusion && stats.percentage === 100 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Félicitations ! Vous avez terminé ce TP
          </h3>
          {typeof content.conclusion === 'object' ? (
            <div className="prose max-w-none">
              <RichTextEditor
                content={content.conclusion}
                onChange={() => {}}
                editable={false}
              />
            </div>
          ) : (
            <div className="text-purple-800 whitespace-pre-wrap">{content.conclusion}</div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
