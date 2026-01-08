import { useState } from 'react';
import { Target, X, ChevronRight } from 'lucide-react';
import { type ImpactGuideQuestion, getImpactQuestionsByType } from '../data/impactGuide';

interface ImpactGuideProps {
  impactType: 'organizational' | 'technical' | 'economic' | 'social';
  currentValue: number;
  onValueChange: (value: number) => void;
}

const impactLabels = {
  organizational: 'Organisationnel',
  technical: 'Technique',
  economic: 'Économique',
  social: 'Social'
};

export function ImpactGuide({ impactType, currentValue, onValueChange }: ImpactGuideProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ImpactGuideQuestion | null>(null);

  const questions = getImpactQuestionsByType(impactType);

  const handleQuestionSelect = (question: ImpactGuideQuestion) => {
    setSelectedQuestion(question);
  };

  const handleScaleSelect = (scale: 'low' | 'medium' | 'high') => {
    let value = 0;
    if (scale === 'low') value = 3;
    else if (scale === 'medium') value = 6;
    else value = 9;
    onValueChange(value);
  };

  if (!showGuide) {
    return (
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mb-2"
      >
        <Target className="w-4 h-4" />
        <span>Je ne sais pas comment évaluer l'impact {impactLabels[impactType]} - Guide d'aide</span>
      </button>
    );
  }

  return (
    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-purple-900 mb-1">
            Guide d'aide : Évaluer l'impact {impactLabels[impactType]}
          </h3>
          <p className="text-xs text-purple-700">
            Réfléchissez à ces questions pour évaluer l'impact sur une échelle de 1 à 10
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowGuide(false);
            setSelectedQuestion(null);
          }}
          className="text-purple-600 hover:text-purple-800"
        >
          <X className="w-5 h-4" />
        </button>
      </div>

      {/* Échelle actuelle */}
      <div className="mb-4 p-3 bg-white rounded border border-purple-200">
        <div className="text-xs font-semibold text-purple-900 mb-2">
          Valeur actuelle : {currentValue}/10
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleScaleSelect('low')}
            className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
              currentValue <= 4
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            Faible (1-4)
          </button>
          <button
            type="button"
            onClick={() => handleScaleSelect('medium')}
            className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
              currentValue >= 5 && currentValue <= 7
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            Modéré (5-7)
          </button>
          <button
            type="button"
            onClick={() => handleScaleSelect('high')}
            className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
              currentValue >= 8
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            Élevé (8-10)
          </button>
        </div>
      </div>

      {/* Liste des questions */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {questions.map((question) => {
          const isSelected = selectedQuestion?.id === question.id;
          return (
            <div key={question.id}>
              <button
                type="button"
                onClick={() => handleQuestionSelect(question)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-purple-100 border-purple-400 shadow-md'
                    : 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {question.question}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{question.description}</p>
                    {isSelected && (
                      <div className="mt-2 space-y-3">
                        <div className="text-xs">
                          <div className="font-semibold text-purple-700 mb-2">🤔 Questions de réflexion :</div>
                          <ul className="list-disc list-inside text-gray-700 space-y-1 bg-purple-50 p-2 rounded">
                            {question.reflectionPoints.map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-xs space-y-2">
                          <div className="font-semibold text-purple-700 mb-1">📊 Échelle d'évaluation :</div>
                          <div className="space-y-1">
                            <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                              <div className="font-medium text-yellow-900">Faible (1-4) :</div>
                              <div className="text-gray-700">{question.scaleGuide.low}</div>
                            </div>
                            <div className="bg-orange-50 p-2 rounded border border-orange-200">
                              <div className="font-medium text-orange-900">Modéré (5-7) :</div>
                              <div className="text-gray-700">{question.scaleGuide.medium}</div>
                            </div>
                            <div className="bg-red-50 p-2 rounded border border-red-200">
                              <div className="font-medium text-red-900">Élevé (8-10) :</div>
                              <div className="text-gray-700">{question.scaleGuide.high}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-purple-600 flex-shrink-0 transition-transform ${
                      isSelected ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-white rounded border border-purple-200">
        <div className="text-xs text-purple-700">
          <strong>💡 Astuce :</strong> Répondez aux questions de réflexion pour chaque dimension, 
          puis sélectionnez l'échelle qui correspond le mieux à votre situation.
        </div>
      </div>
    </div>
  );
}

