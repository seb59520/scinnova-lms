import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUseCaseStore } from '../store/useCaseStore';
import type { UseCaseFormData } from '../types';
import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { TechnologyAutocomplete } from '../components/TechnologyAutocomplete';
import { TechnologyGuide } from '../components/TechnologyGuide';
import { ChallengeAutocomplete } from '../components/ChallengeAutocomplete';
import { ChallengeGuide } from '../components/ChallengeGuide';
import { ROIGuide } from '../components/ROIGuide';
import { ImpactGuide } from '../components/ImpactGuide';
import { TechnologyTooltip } from '../components/TechnologyTooltip';
import { ChallengeTooltip } from '../components/ChallengeTooltip';
import { generateUseCaseAnalysis } from '../lib/aiService';
import type { UseCaseAnalysis } from '../lib/aiService';
import { saveUseCaseAnalysis, updateUseCaseAnalysis } from '../lib/apiService';

const useCaseSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  sector: z.string().min(1, 'Le secteur est requis'),
  organizational: z.number().min(1).max(10),
  technical: z.number().min(1).max(10),
  economic: z.number().min(1).max(10),
  social: z.number().min(1).max(10),
  roi: z.number().min(0),
  technologies: z.array(z.string()),
  challenges: z.array(z.string()),
});

export function UseCaseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addUseCase, updateUseCase, getUseCase } = useUseCaseStore();
  const isEditing = !!id;
  const existingUseCase = id ? getUseCase(id) : null;

  const [technologyInput, setTechnologyInput] = useState('');
  const [challengeInput, setChallengeInput] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<UseCaseAnalysis | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [currentUseCaseId, setCurrentUseCaseId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UseCaseFormData>({
    resolver: zodResolver(useCaseSchema),
    defaultValues: existingUseCase
      ? {
          title: existingUseCase.title,
          description: existingUseCase.description,
          sector: existingUseCase.sector,
          organizational: existingUseCase.impacts.organizational,
          technical: existingUseCase.impacts.technical,
          economic: existingUseCase.impacts.economic,
          social: existingUseCase.impacts.social,
          roi: existingUseCase.roi,
          technologies: existingUseCase.technologies,
          challenges: existingUseCase.challenges,
        }
      : {
          organizational: 5,
          technical: 5,
          economic: 5,
          social: 5,
          roi: 0,
          technologies: [],
          challenges: [],
        },
  });

  const technologies = watch('technologies');
  const challenges = watch('challenges');

  useEffect(() => {
    if (existingUseCase) {
      setValue('technologies', existingUseCase.technologies);
      setValue('challenges', existingUseCase.challenges);
    }
  }, [existingUseCase, setValue]);

  const onSubmit = async (data: UseCaseFormData) => {
    if (isEditing && id) {
      updateUseCase(id, {
        title: data.title,
        description: data.description,
        sector: data.sector,
        impacts: {
          organizational: data.organizational,
          technical: data.technical,
          economic: data.economic,
          social: data.social,
        },
        roi: data.roi,
        technologies: data.technologies,
        challenges: data.challenges,
      });
      navigate('/use-cases');
    } else {
      // Créer le cas d'usage
      const newUseCase = {
        title: data.title,
        description: data.description,
        sector: data.sector,
        impacts: {
          organizational: data.organizational,
          technical: data.technical,
          economic: data.economic,
          social: data.social,
        },
        roi: data.roi,
        technologies: data.technologies,
        challenges: data.challenges,
      };
      
      // Créer le cas d'usage et récupérer son ID
      const createdUseCase = addUseCase(newUseCase);
      const useCaseId = createdUseCase.id;
      setCurrentUseCaseId(useCaseId);
      
      // Générer l'analyse IA
      try {
        setGeneratingAnalysis(true);
        const aiAnalysis = await generateUseCaseAnalysis(newUseCase);
        setAnalysis(aiAnalysis);
        
        // Sauvegarder l'analyse dans Supabase
        try {
          await saveUseCaseAnalysis({
            useCaseId,
            useCaseTitle: newUseCase.title,
            useCaseData: newUseCase,
            analysis: aiAnalysis,
          });
        } catch (saveError) {
          console.error('Erreur lors de la sauvegarde de l\'analyse:', saveError);
          // Ne pas bloquer l'utilisateur si la sauvegarde échoue
        }
        
        setShowAnalysis(true);
      } catch (error: unknown) {
        console.error('Erreur lors de la génération de l\'analyse:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        alert(`Impossible de générer l'analyse IA: ${errorMessage}\n\nLe cas d'usage a été créé, mais l'analyse n'a pas pu être générée.`);
        navigate('/use-cases');
      } finally {
        setGeneratingAnalysis(false);
      }
    }
  };

  const addTechnology = () => {
    if (technologyInput.trim()) {
      const current = technologies || [];
      setValue('technologies', [...current, technologyInput.trim()]);
      setTechnologyInput('');
    }
  };

  const handleSelectTechnologiesFromGuide = (technologyNames: string[]) => {
    const current = technologies || [];
    const newTechnologies = technologyNames.filter(tech => !current.includes(tech));
    if (newTechnologies.length > 0) {
      setValue('technologies', [...current, ...newTechnologies]);
    }
  };

  const removeTechnology = (index: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette technologie ?')) {
      return
    }
    const current = technologies || [];
    setValue('technologies', current.filter((_, i) => i !== index));
  };

  const addChallenge = () => {
    if (challengeInput.trim()) {
      const current = challenges || [];
      setValue('challenges', [...current, challengeInput.trim()]);
      setChallengeInput('');
    }
  };

  const handleSelectChallengeFromGuide = (challengeName: string) => {
    if (!challenges?.includes(challengeName)) {
      const current = challenges || [];
      setValue('challenges', [...current, challengeName]);
    }
  };

  const removeChallenge = (index: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce défi ?')) {
      return
    }
    const current = challenges || [];
    setValue('challenges', current.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Modifier le cas d\'usage' : 'Nouveau cas d\'usage'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                {...register('title')}
                className="input"
                placeholder="Ex: Détection de fraude bancaire"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="input"
                placeholder="Décrivez le cas d'usage..."
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secteur *
              </label>
              <select {...register('sector')} className="input">
                <option value="">Sélectionner un secteur</option>
                <option value="Santé">Santé</option>
                <option value="Finance">Finance</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Logistique">Logistique</option>
                <option value="Industrie">Industrie</option>
                <option value="Autre">Autre</option>
              </select>
              {errors.sector && (
                <p className="text-red-600 text-sm mt-1">{errors.sector.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Impacts (sur 10)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'organizational' as const, label: 'Organisationnel' },
              { key: 'technical' as const, label: 'Technique' },
              { key: 'economic' as const, label: 'Économique' },
              { key: 'social' as const, label: 'Social' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <ImpactGuide
                  impactType={key}
                  currentValue={watch(key) || 5}
                  onValueChange={(value) => setValue(key, value)}
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  {...register(key, { valueAsNumber: true })}
                  className="input mt-2"
                />
                {errors[key] && (
                  <p className="text-red-600 text-sm mt-1">{errors[key]?.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">ROI et technologies</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ROI estimé (%)
              </label>
              
              {/* Guide interactif pour le ROI */}
              <ROIGuide
                currentROI={watch('roi') || 0}
              />
              
              <input
                type="number"
                min="0"
                {...register('roi', { valueAsNumber: true })}
                className="input mt-2"
                placeholder="350"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technologies utilisées
                <span className="text-xs text-gray-500 ml-2">(Recherchez pour voir les explications)</span>
              </label>
              
              {/* Guide interactif pour les débutants */}
              <TechnologyGuide
                onSelectTechnologies={handleSelectTechnologiesFromGuide}
                existingTechnologies={technologies || []}
              />
              
              <TechnologyAutocomplete
                value={technologyInput}
                onChange={setTechnologyInput}
                onAdd={addTechnology}
                existingTechnologies={technologies || []}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {technologies?.map((tech, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                  >
                    {tech}
                    <TechnologyTooltip technologyName={tech} />
                    <button
                      type="button"
                      onClick={() => removeTechnology(index)}
                      className="hover:text-primary-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Défis et risques
                <span className="text-xs text-gray-500 ml-2">(Recherchez pour voir les explications et le raisonnement)</span>
              </label>
              
              {/* Guide interactif pour les débutants */}
              <ChallengeGuide
                onSelectChallenge={handleSelectChallengeFromGuide}
                existingChallenges={challenges || []}
              />
              
              <ChallengeAutocomplete
                value={challengeInput}
                onChange={setChallengeInput}
                onAdd={addChallenge}
                existingChallenges={challenges || []}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {challenges?.map((challenge, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                  >
                    {challenge}
                    <ChallengeTooltip challengeName={challenge} />
                    <button
                      type="button"
                      onClick={() => removeChallenge(index)}
                      className="hover:text-orange-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/use-cases')}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={generatingAnalysis}
          >
            {generatingAnalysis ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Génération de l'analyse...
              </>
            ) : isEditing ? (
              'Enregistrer'
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Créer et analyser
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal d'analyse IA */}
      {showAnalysis && analysis && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setShowAnalysis(false);
              navigate('/use-cases');
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
                <div>
                  <h3 className="text-2xl font-bold">Analyse IA de votre cas d'usage</h3>
                  <p className="text-sm opacity-90 mt-1">{watch('title')}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAnalysis(false);
                    navigate('/use-cases');
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Synthèse */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h4 className="font-semibold text-blue-900 mb-2">📊 Synthèse</h4>
                  <p className="text-blue-800">{analysis.summary}</p>
                </div>

                {/* Points forts */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">✅ Points forts</h4>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Améliorations */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">🔧 Améliorations possibles</h4>
                  <ul className="space-y-2">
                    {analysis.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">→</span>
                        <span className="text-gray-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommandations */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">💡 Recommandations d'optimisation</h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">💎</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Évaluation des scores */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">📈 Évaluation des impacts</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{analysis.score.overall}/10</div>
                      <div className="text-xs text-gray-600 mt-1">Global</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{analysis.score.organizational}/10</div>
                      <div className="text-xs text-gray-600 mt-1">Organisationnel</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{analysis.score.technical}/10</div>
                      <div className="text-xs text-gray-600 mt-1">Technique</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-yellow-600">{analysis.score.economic}/10</div>
                      <div className="text-xs text-gray-600 mt-1">Économique</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">{analysis.score.social}/10</div>
                      <div className="text-xs text-gray-600 mt-1">Social</div>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <button
                    onClick={async () => {
                      if (!analysis || !currentUseCaseId) return;
                      
                      // Appliquer les suggestions de l'IA
                      const appliedSuggestions: {
                        technologies?: string[];
                        challenges?: string[];
                        impacts?: {
                          organizational?: number;
                          technical?: number;
                          economic?: number;
                          social?: number;
                        };
                        roi?: number;
                      } = {};
                      
                      // Appliquer les scores suggérés par l'IA
                      if (analysis.score.organizational !== watch('organizational')) {
                        appliedSuggestions.impacts = {
                          ...appliedSuggestions.impacts,
                          organizational: analysis.score.organizational,
                        };
                        setValue('organizational', analysis.score.organizational);
                      }
                      if (analysis.score.technical !== watch('technical')) {
                        appliedSuggestions.impacts = {
                          ...appliedSuggestions.impacts,
                          technical: analysis.score.technical,
                        };
                        setValue('technical', analysis.score.technical);
                      }
                      if (analysis.score.economic !== watch('economic')) {
                        appliedSuggestions.impacts = {
                          ...appliedSuggestions.impacts,
                          economic: analysis.score.economic,
                        };
                        setValue('economic', analysis.score.economic);
                      }
                      if (analysis.score.social !== watch('social')) {
                        appliedSuggestions.impacts = {
                          ...appliedSuggestions.impacts,
                          social: analysis.score.social,
                        };
                        setValue('social', analysis.score.social);
                      }
                      
                      // Mettre à jour le cas d'usage avec les suggestions appliquées
                      if (Object.keys(appliedSuggestions).length > 0) {
                        updateUseCase(currentUseCaseId, {
                          impacts: {
                            organizational: appliedSuggestions.impacts?.organizational ?? watch('organizational'),
                            technical: appliedSuggestions.impacts?.technical ?? watch('technical'),
                            economic: appliedSuggestions.impacts?.economic ?? watch('economic'),
                            social: appliedSuggestions.impacts?.social ?? watch('social'),
                          },
                        });
                        
                        // Sauvegarder les suggestions appliquées
                        try {
                          await updateUseCaseAnalysis(currentUseCaseId, appliedSuggestions);
                        } catch (error) {
                          console.error('Erreur lors de la sauvegarde des suggestions:', error);
                        }
                      }
                      
                      setShowAnalysis(false);
                      alert('✅ Suggestions appliquées avec succès !');
                      navigate(`/use-cases/${currentUseCaseId}/edit`);
                    }}
                    className="btn-secondary"
                  >
                    ✨ Appliquer les suggestions
                  </button>
                  <button
                    onClick={() => {
                      setShowAnalysis(false);
                      navigate('/use-cases');
                    }}
                    className="btn-primary"
                  >
                    Voir mes cas d'usage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

