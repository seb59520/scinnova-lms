import { useState } from 'react';
import { Calculator, X, ChevronRight, TrendingUp } from 'lucide-react';
import { roiGuideQuestions, type ROIGuideQuestion, getROICategories, roiCalculationFormula } from '../data/roiGuide';

interface ROIGuideProps {
  currentROI: number;
}

export function ROIGuide({ currentROI }: ROIGuideProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ROIGuideQuestion | null>(null);

  const categories = getROICategories();
  const categoryLabels: Record<string, string> = {
    revenue: 'Revenus',
    'cost-savings': 'Réduction de coûts',
    efficiency: 'Efficacité',
    'risk-reduction': 'Réduction de risques',
    customer: 'Client'
  };

  const filteredQuestions = selectedCategory
    ? roiGuideQuestions.filter(q => q.category === selectedCategory)
    : roiGuideQuestions;

  const handleQuestionSelect = (question: ROIGuideQuestion) => {
    setSelectedQuestion(question);
  };

  if (!showGuide) {
    return (
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-2"
      >
        <Calculator className="w-4 h-4" />
        <span>Je ne sais pas comment calculer le ROI - Guide d'aide</span>
      </button>
    );
  }

  return (
    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-green-900 mb-1">
            Guide d'aide : Comment calculer le ROI ?
          </h3>
          <p className="text-xs text-green-700">
            Réfléchissez à ces questions pour estimer les bénéfices et coûts de votre projet
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowGuide(false);
            setSelectedCategory(null);
            setSelectedQuestion(null);
            setShowFormula(false);
          }}
          className="text-green-600 hover:text-green-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ROI actuel */}
      {currentROI > 0 && (
        <div className="mb-4 p-3 bg-green-100 rounded border border-green-300">
          <div className="text-sm font-semibold text-green-900">
            ROI actuel : {currentROI.toFixed(0)}%
          </div>
        </div>
      )}

      {/* Formule de calcul */}
      <div className="mb-4 p-3 bg-white rounded border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">Formule du ROI</span>
          </div>
          <button
            type="button"
            onClick={() => setShowFormula(!showFormula)}
            className="text-xs text-green-600 hover:text-green-800"
          >
            {showFormula ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        {showFormula && (
          <div className="mt-2 space-y-2 text-xs">
            <div className="font-mono bg-gray-50 p-2 rounded">
              {roiCalculationFormula.formula}
            </div>
            <p className="text-gray-600">{roiCalculationFormula.explanation}</p>
            <div className="space-y-1">
              {roiCalculationFormula.steps.map((step, idx) => (
                <div key={idx} className="text-gray-700">{step}</div>
              ))}
            </div>
            <div className="mt-2 p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-900 mb-1">Exemple :</div>
              <div className="text-gray-700">
                Bénéfices : {roiCalculationFormula.example.benefits.toLocaleString('fr-FR')}€
                <br />
                Coûts : {roiCalculationFormula.example.costs.toLocaleString('fr-FR')}€
                <br />
                ROI = {roiCalculationFormula.example.roi.toFixed(0)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtres par catégorie */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-green-600 text-white'
              : 'bg-white text-green-600 border border-green-300 hover:bg-green-50'
          }`}
        >
          Toutes les catégories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setSelectedQuestion(null);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-green-600 text-white'
                : 'bg-white text-green-600 border border-green-300 hover:bg-green-50'
            }`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Liste des questions */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredQuestions.map((question) => {
          const isSelected = selectedQuestion?.id === question.id;
          return (
            <div key={question.id}>
              <button
                type="button"
                onClick={() => handleQuestionSelect(question)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-green-100 border-green-400 shadow-md'
                    : 'bg-white border-green-200 hover:border-green-400 hover:shadow-md'
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
                      <div className="mt-2 space-y-2">
                        <div className="text-xs">
                          <div className="font-semibold text-green-700 mb-1">💡 Comment calculer :</div>
                          <div className="text-gray-700 bg-green-50 p-2 rounded">
                            {question.calculationHint}
                          </div>
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold text-green-700 mb-1">📊 Exemples :</div>
                          <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {question.examples.map((example, idx) => (
                              <li key={idx}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-green-600 flex-shrink-0 transition-transform ${
                      isSelected ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-white rounded border border-green-200">
        <div className="text-xs text-green-700 mb-2">
          <strong>💡 Astuce :</strong> Additionnez tous les bénéfices annuels (revenus + économies), 
          soustrayez les coûts annuels, puis calculez le pourcentage de retour.
        </div>
        <div className="text-xs text-gray-600">
          Après avoir réfléchi aux questions ci-dessus, entrez votre ROI estimé dans le champ ci-dessous.
        </div>
      </div>
    </div>
  );
}

