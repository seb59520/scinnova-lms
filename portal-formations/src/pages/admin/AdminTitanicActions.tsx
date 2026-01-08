import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Circle, 
  Settings, 
  Upload, 
  FileJson, 
  Brain, 
  BookOpen, 
  Users, 
  Database,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Info
} from 'lucide-react';

interface Action {
  id: string;
  title: string;
  description: string;
  category: 'setup' | 'import' | 'student' | 'trainer' | 'verification';
  steps: ActionStep[];
  completed?: boolean;
  link?: string;
  externalLink?: string;
}

interface ActionStep {
  id: string;
  text: string;
  completed?: boolean;
  code?: string;
  link?: string;
}

const actions: Action[] = [
  {
    id: 'openrouter-config',
    title: 'Configuration OpenRouter pour l\'analyse IA',
    description: 'Configurer l\'API OpenRouter pour permettre l\'analyse automatique des réponses par l\'IA',
    category: 'setup',
    steps: [
      {
        id: 'step1',
        text: 'Créer un compte sur OpenRouter.ai',
        externalLink: 'https://openrouter.ai/'
      },
      {
        id: 'step2',
        text: 'Générer une clé API dans la section "Keys"',
        externalLink: 'https://openrouter.ai/keys'
      },
      {
        id: 'step3',
        text: 'Ajouter la clé dans le fichier .env',
        code: `VITE_OPENROUTER_API_KEY=sk-or-v1-...
VITE_OPENROUTER_MODEL=google/gemini-1.5-pro`
      },
      {
        id: 'step4',
        text: 'Redémarrer le serveur de développement'
      }
    ],
    externalLink: 'https://openrouter.ai/'
  },
  {
    id: 'import-big-data',
    title: 'Importer le cours Big Data',
    description: 'Importer le fichier JSON du TP Big Data dans le portail',
    category: 'import',
    steps: [
      {
        id: 'step1',
        text: 'Télécharger le fichier lms-titanic-big-data.json',
        link: '/admin/courses'
      },
      {
        id: 'step2',
        text: 'Aller dans Administration → Formations',
        link: '/admin/courses'
      },
      {
        id: 'step3',
        text: 'Créer un nouveau cours ou éditer un cours existant',
        link: '/admin/courses'
      },
      {
        id: 'step4',
        text: 'Cliquer sur "Mode JSON" ou "Éditer en JSON"',
        link: '/admin/courses'
      },
      {
        id: 'step5',
        text: 'Coller le contenu de lms-titanic-big-data.json et sauvegarder'
      },
      {
        id: 'step6',
        text: 'Vérifier que les items de type "tp" sont bien présents'
      }
    ],
    link: '/admin/courses'
  },
  {
    id: 'import-data-science',
    title: 'Importer le cours Data Science',
    description: 'Importer le fichier JSON du TP Data Science dans le portail',
    category: 'import',
    steps: [
      {
        id: 'step1',
        text: 'Télécharger le fichier lms-titanic-data-science.json',
        link: '/admin/courses'
      },
      {
        id: 'step2',
        text: 'Répéter les étapes d\'importation comme pour Big Data',
        link: '/admin/courses'
      }
    ],
    link: '/admin/courses'
  },
  {
    id: 'import-machine-learning',
    title: 'Importer le cours Machine Learning',
    description: 'Importer le fichier JSON du TP Machine Learning dans le portail',
    category: 'import',
    steps: [
      {
        id: 'step1',
        text: 'Télécharger le fichier lms-titanic-machine-learning.json',
        link: '/admin/courses'
      },
      {
        id: 'step2',
        text: 'Répéter les étapes d\'importation comme pour Big Data',
        link: '/admin/courses'
      }
    ],
    link: '/admin/courses'
  },
  {
    id: 'configure-tp',
    title: 'Configurer les TP dans les cours',
    description: 'S\'assurer que les TP sont correctement configurés avec le champ titanicModule',
    category: 'setup',
    steps: [
      {
        id: 'step1',
        text: 'Vérifier que chaque TP a le champ content.titanicModule défini',
        code: `{
  "type": "tp",
  "title": "TP 1 : Big Data - Exploration des données brutes",
  "content": {
    "titanicModule": "big-data",
    "instructions": { ... },
    "checklist": [ ... ]
  }
}`
      },
      {
        id: 'step2',
        text: 'Les valeurs possibles sont : "big-data", "data-science", "machine-learning"'
      },
      {
        id: 'step3',
        text: 'Le système détecte automatiquement les TP si le titre contient "Titanic", "Big Data", "Data Science" ou "Machine Learning"'
      }
    ],
    link: '/admin/courses'
  },
  {
    id: 'student-upload',
    title: 'Guide pour les étudiants : Upload de JSON',
    description: 'Instructions pour que les étudiants importent leurs réponses depuis l\'application Titanic',
    category: 'student',
    steps: [
      {
        id: 'step1',
        text: 'Compléter le TP dans l\'application Titanic',
        externalLink: 'https://titaniclearning.netlify.app'
      },
      {
        id: 'step2',
        text: 'Cliquer sur "Exporter mes réponses" dans le module',
        externalLink: 'https://titaniclearning.netlify.app'
      },
      {
        id: 'step3',
        text: 'Un fichier JSON est téléchargé (ex: big-data-reponses.json)'
      },
      {
        id: 'step4',
        text: 'Accéder au TP correspondant dans le LMS'
      },
      {
        id: 'step5',
        text: 'Le composant d\'upload apparaît automatiquement si c\'est un TP Titanic'
      },
      {
        id: 'step6',
        text: 'Cliquer sur "Sélectionner un fichier JSON" et choisir le fichier exporté'
      },
      {
        id: 'step7',
        text: 'Cliquer sur "Importer les réponses" - les données sont sauvegardées automatiquement'
      }
    ],
    externalLink: 'https://titaniclearning.netlify.app'
  },
  {
    id: 'trainer-analysis',
    title: 'Guide pour les formateurs : Analyse IA',
    description: 'Comment utiliser l\'analyse IA pour évaluer les soumissions des étudiants',
    category: 'trainer',
    steps: [
      {
        id: 'step1',
        text: 'Accéder aux soumissions du cours',
        link: '/admin/courses'
      },
      {
        id: 'step2',
        text: 'Cliquer sur "Voir les soumissions" pour un cours',
        link: '/admin/courses'
      },
      {
        id: 'step3',
        text: 'Cliquer sur "Voir" pour une soumission avec données Titanic'
      },
      {
        id: 'step4',
        text: 'Un panneau spécial s\'affiche avec les données JSON importées'
      },
      {
        id: 'step5',
        text: 'Cliquer sur "Analyser avec l\'IA" dans le panneau Titanic'
      },
      {
        id: 'step6',
        text: 'L\'IA génère : résumé, points forts, points faibles, suggestions, score estimé, analyse détaillée'
      },
      {
        id: 'step7',
        text: 'Utiliser l\'analyse IA comme guide pour noter et donner du feedback'
      }
    ],
    link: '/admin/titanic-submissions'
  },
  {
    id: 'verify-submissions',
    title: 'Vérifier les soumissions',
    description: 'Vérifier que les soumissions sont correctement enregistrées et analysables',
    category: 'verification',
    steps: [
      {
        id: 'step1',
        text: 'Aller dans Administration → Formateur → TP Titanic',
        link: '/admin/titanic-submissions'
      },
      {
        id: 'step2',
        text: 'Vérifier que les soumissions avec données Titanic sont listées'
      },
      {
        id: 'step3',
        text: 'Vérifier que les données JSON sont présentes dans answer_json.titanicData'
      },
      {
        id: 'step4',
        text: 'Tester l\'analyse IA sur une soumission'
      },
      {
        id: 'step5',
        text: 'Vérifier que l\'analyse est sauvegardée dans answer_json.aiAnalysis'
      }
    ],
    link: '/admin/titanic-submissions'
  }
];

const categoryLabels = {
  setup: 'Configuration',
  import: 'Importation',
  student: 'Étudiants',
  trainer: 'Formateurs',
  verification: 'Vérification'
};

const categoryIcons = {
  setup: Settings,
  import: Upload,
  student: Users,
  trainer: Brain,
  verification: CheckCircle
};

export function AdminTitanicActions() {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const toggleAction = (actionId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
    }
    setExpandedActions(newExpanded);
  };

  const toggleActionComplete = (actionId: string) => {
    const newCompleted = new Set(completedActions);
    if (newCompleted.has(actionId)) {
      newCompleted.delete(actionId);
    } else {
      newCompleted.add(actionId);
    }
    setCompletedActions(newCompleted);
  };

  const toggleStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const groupedActions = actions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, Action[]>);

  const totalActions = actions.length;
  const completedCount = completedActions.size;
  const progress = totalActions > 0 ? (completedCount / totalActions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Actions à réaliser - Portail Titanic</h1>
              <p className="text-gray-600 mt-1">
                Guide complet pour configurer et utiliser le portail Titanic dans le LMS
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progression globale</span>
              <span className="text-sm font-medium text-gray-700">
                {completedCount} / {totalActions} actions complétées
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Application Titanic</p>
            <p>
              Les étudiants doivent utiliser l'application{' '}
              <a
                href="https://titaniclearning.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                titaniclearning.netlify.app
              </a>{' '}
              pour compléter les TP et exporter leurs réponses en JSON.
            </p>
          </div>
        </div>

        {/* Actions by Category */}
        {Object.entries(groupedActions).map(([category, categoryActions]) => {
          const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
          return (
            <div key={category} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CategoryIcon className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h2>
                <span className="text-sm text-gray-500">
                  ({categoryActions.length} action{categoryActions.length > 1 ? 's' : ''})
                </span>
              </div>

              <div className="space-y-4">
                {categoryActions.map((action) => {
                  const isExpanded = expandedActions.has(action.id);
                  const isCompleted = completedActions.has(action.id);
                  const Icon = isCompleted ? CheckCircle : Circle;

                  return (
                    <div
                      key={action.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleAction(action.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActionComplete(action.id);
                              }}
                              className="mt-1"
                            >
                              <Icon
                                className={`w-5 h-5 ${
                                  isCompleted ? 'text-green-600' : 'text-gray-400'
                                }`}
                              />
                            </button>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                              <p className="text-sm text-gray-600">{action.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {action.link && (
                              <Link
                                to={action.link}
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Ouvrir
                              </Link>
                            )}
                            {action.externalLink && (
                              <a
                                href={action.externalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <ChevronRight
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                isExpanded ? 'transform rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <div className="space-y-3">
                            {action.steps.map((step, index) => {
                              const stepCompleted = completedSteps.has(step.id);
                              const StepIcon = stepCompleted ? CheckCircle : Circle;

                              return (
                                <div
                                  key={step.id}
                                  className="flex items-start gap-3 bg-white rounded p-3 border border-gray-200"
                                >
                                  <button
                                    onClick={() => toggleStepComplete(step.id)}
                                    className="mt-0.5"
                                  >
                                    <StepIcon
                                      className={`w-4 h-4 ${
                                        stepCompleted ? 'text-green-600' : 'text-gray-400'
                                      }`}
                                    />
                                  </button>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-500">
                                        Étape {index + 1}
                                      </span>
                                      {step.link && (
                                        <Link
                                          to={step.link}
                                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                                        >
                                          Ouvrir
                                        </Link>
                                      )}
                                      {step.externalLink && (
                                        <a
                                          href={step.externalLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-700"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">{step.text}</p>
                                    {step.code && (
                                      <pre className="mt-2 p-3 bg-gray-900 text-gray-100 text-xs rounded overflow-x-auto">
                                        <code>{step.code}</code>
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Liens rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/admin/courses"
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Formations</p>
                <p className="text-sm text-gray-600">Gérer les cours et importer les TP</p>
              </div>
            </Link>
            <Link
              to="/admin/titanic-submissions"
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">TP Titanic</p>
                <p className="text-sm text-gray-600">Voir et analyser les soumissions</p>
              </div>
            </Link>
            <a
              href="https://titaniclearning.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Application Titanic</p>
                <p className="text-sm text-gray-600">Ouvrir l'application externe</p>
              </div>
            </a>
            <a
              href="https://openrouter.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Brain className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">OpenRouter</p>
                <p className="text-sm text-gray-600">Configurer l'API pour l'analyse IA</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
