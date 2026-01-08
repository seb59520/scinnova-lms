import { useState } from 'react';
import { HelpCircle, X, Check, ChevronRight } from 'lucide-react';
import { technologyGuideQuestions, type TechnologyGuideQuestion, getTechnologyGuideCategories } from '../data/technologyGuide';

interface TechnologyGuideProps {
  onSelectTechnologies: (technologyNames: string[]) => void;
  existingTechnologies: string[];
}

export function TechnologyGuide({ onSelectTechnologies, existingTechnologies }: TechnologyGuideProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = getTechnologyGuideCategories();
  const categoryLabels: Record<string, string> = {
    ml: 'Machine Learning & IA',
    streaming: 'Temps réel & Streaming',
    storage: 'Stockage',
    database: 'Bases de données',
    processing: 'Traitement de données',
    orchestration: 'Orchestration & Déploiement'
  };

  const filteredQuestions = selectedCategory
    ? technologyGuideQuestions.filter(q => q.category === selectedCategory)
    : technologyGuideQuestions;

  const searchFilteredQuestions = searchQuery.trim()
    ? filteredQuestions.filter(
        q =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.technologyNames.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredQuestions;

  const handleSelectQuestion = (question: TechnologyGuideQuestion) => {
    // Ajouter uniquement les technologies qui ne sont pas déjà présentes
    const newTechnologies = question.technologyNames.filter(
      tech => !existingTechnologies.includes(tech)
    );
    
    if (newTechnologies.length > 0) {
      onSelectTechnologies(newTechnologies);
    }
  };

  const getNewTechnologiesCount = (question: TechnologyGuideQuestion): number => {
    return question.technologyNames.filter(
      tech => !existingTechnologies.includes(tech)
    ).length;
  };

  if (!showGuide) {
    return (
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-2"
      >
        <HelpCircle className="w-4 h-4" />
        <span>Je ne sais pas quelles technologies choisir - Guide d'aide</span>
      </button>
    );
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            Guide d'aide : Choisissez vos technologies à partir de vos besoins
          </h3>
          <p className="text-xs text-blue-700">
            Sélectionnez un besoin qui correspond à votre situation, le système vous proposera les technologies adaptées
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
          placeholder="Rechercher par besoin (ex: 'temps réel', 'machine learning', 'stockage')..."
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
            Aucun besoin trouvé. Essayez une autre recherche.
          </p>
        ) : (
          searchFilteredQuestions.map((question) => {
            const newCount = getNewTechnologiesCount(question);
            const allAlreadyAdded = newCount === 0;
            
            return (
              <button
                key={question.id}
                type="button"
                onClick={() => handleSelectQuestion(question)}
                disabled={allAlreadyAdded}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  allAlreadyAdded
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
                      {allAlreadyAdded && (
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{question.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-blue-600">
                        → Technologies proposées :
                      </span>
                      {question.technologyNames.map((tech) => {
                        const isAlreadyAdded = existingTechnologies.includes(tech);
                        return (
                          <span
                            key={tech}
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              isAlreadyAdded
                                ? 'bg-green-100 text-green-700 line-through'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {tech}
                            {isAlreadyAdded && ' ✓'}
                          </span>
                        );
                      })}
                      {newCount > 0 && (
                        <span className="text-xs text-blue-600 font-medium">
                          ({newCount} nouvelle{newCount > 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                  </div>
                  {!allAlreadyAdded && (
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
          💡 Cliquez sur un besoin pour ajouter automatiquement les technologies correspondantes
        </p>
      )}
    </div>
  );
}

