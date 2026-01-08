import { useState } from 'react';
import { HelpCircle, X, Check, ChevronRight } from 'lucide-react';
import { challengeGuideQuestions, type ChallengeGuideQuestion, getGuideCategories } from '../data/challengeGuide';

interface ChallengeGuideProps {
  onSelectChallenge: (challengeName: string) => void;
  existingChallenges: string[];
}

export function ChallengeGuide({ onSelectChallenge, existingChallenges }: ChallengeGuideProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = getGuideCategories();
  const categoryLabels: Record<string, string> = {
    legal: 'Conformité & Légal',
    technical: 'Technique & Performance',
    organizational: 'Organisationnel',
    economic: 'Économique',
    'data-quality': 'Qualité des données'
  };

  const filteredQuestions = selectedCategory
    ? challengeGuideQuestions.filter(q => q.category === selectedCategory)
    : challengeGuideQuestions;

  const searchFilteredQuestions = searchQuery.trim()
    ? filteredQuestions.filter(
        q =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.challengeName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredQuestions;

  const handleSelectQuestion = (question: ChallengeGuideQuestion) => {
    if (!existingChallenges.includes(question.challengeName)) {
      onSelectChallenge(question.challengeName);
    }
  };

  if (!showGuide) {
    return (
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-2"
      >
        <HelpCircle className="w-4 h-4" />
        <span>Je ne connais pas les termes techniques - Guide d'aide</span>
      </button>
    );
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            Guide d'aide : Identifiez vos défis à partir de vos préoccupations
          </h3>
          <p className="text-xs text-blue-700">
            Sélectionnez une préoccupation qui correspond à votre situation, le système vous proposera le défi correspondant
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowGuide(false);
            setSelectedCategory(null);
            setSearchQuery('');
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par préoccupation (ex: 'conforme', 'rapide', 'coûts')..."
          className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filtres par catégorie */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
          }`}
        >
          Toutes les catégories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
            }`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Liste des questions */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {searchFilteredQuestions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucune préoccupation trouvée. Essayez une autre recherche.
          </p>
        ) : (
          searchFilteredQuestions.map((question) => {
            const isAlreadyAdded = existingChallenges.includes(question.challengeName);
            return (
              <button
                key={question.id}
                type="button"
                onClick={() => handleSelectQuestion(question)}
                disabled={isAlreadyAdded}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isAlreadyAdded
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                    : 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {question.question}
                      </span>
                      {isAlreadyAdded && (
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{question.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600">
                        → Défi correspondant :
                      </span>
                      <span className="text-xs font-semibold text-blue-800">
                        {question.challengeName}
                      </span>
                    </div>
                  </div>
                  {!isAlreadyAdded && (
                    <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {searchFilteredQuestions.length > 0 && (
        <p className="text-xs text-blue-600 mt-3 text-center">
          💡 Cliquez sur une préoccupation pour ajouter automatiquement le défi correspondant
        </p>
      )}
    </div>
  );
}

