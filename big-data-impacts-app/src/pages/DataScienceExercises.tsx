import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code, BarChart3, Brain, Database, TrendingUp, Filter, Search } from 'lucide-react';
import type { DataScienceExercise, ExerciseType, DifficultyLevel } from '../types/dataScience';
import { useDataScienceStore } from '../store/dataScienceStore';
import { dataScienceExercises } from '../data/dataScienceExercises';

const exerciseTypeIcons = {
  'data-analysis': Database,
  'model-building': Brain,
  'visualization': BarChart3,
  'interpretation': TrendingUp,
  'evaluation': Code,
  'preprocessing': Code,
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

const difficultyLabels = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export function DataScienceExercises() {
  const [filteredExercises, setFilteredExercises] = useState<DataScienceExercise[]>(dataScienceExercises);
  const [selectedType, setSelectedType] = useState<ExerciseType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { loadFromStorage, getSubmission } = useDataScienceStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    let filtered = dataScienceExercises;

    if (selectedType !== 'all') {
      filtered = filtered.filter((ex) => ex.type === selectedType);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((ex) => ex.difficulty === selectedDifficulty);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ex) =>
          ex.title.toLowerCase().includes(lowerSearch) ||
          ex.description.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredExercises(filtered);
  }, [selectedType, selectedDifficulty, searchTerm]);

  const getUserId = () => {
    return localStorage.getItem('big-data-user-id') || `temp-${crypto.randomUUID()}`;
  };

  const hasSubmission = (exerciseId: string) => {
    const userId = getUserId();
    return !!getSubmission(exerciseId, userId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Exercices Data Science</h1>
        <p className="text-purple-100">
          Pratiquez vos compétences en Data Science avec des exercices interactifs couvrant l'analyse de données,
          la création de modèles, la visualisation et l'interprétation.
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-5 h-5" />
          <span>Filtres</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un exercice..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ExerciseType | 'all')}
          >
            <option value="all">Tous les types</option>
            <option value="data-analysis">Analyse de données</option>
            <option value="model-building">Création de modèles</option>
            <option value="visualization">Visualisation</option>
            <option value="interpretation">Interprétation</option>
            <option value="evaluation">Évaluation</option>
            <option value="preprocessing">Préparation</option>
          </select>

          {/* Difficulté */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel | 'all')}
          >
            <option value="all">Toutes les difficultés</option>
            <option value="beginner">Débutant</option>
            <option value="intermediate">Intermédiaire</option>
            <option value="advanced">Avancé</option>
          </select>
        </div>
      </div>

      {/* Liste des exercices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((exercise) => {
          const Icon = exerciseTypeIcons[exercise.type];
          const submitted = hasSubmission(exercise.id);

          return (
            <Link
              key={exercise.id}
              to={`/data-science/exercises/${exercise.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
                </div>
                {submitted && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    ✓ Fait
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 flex-grow">{exercise.description}</p>

              <div className="flex items-center justify-between mt-auto">
                <span className={`text-xs font-medium px-2 py-1 rounded ${difficultyColors[exercise.difficulty]}`}>
                  {difficultyLabels[exercise.difficulty]}
                </span>
                <span className="text-xs text-gray-500">
                  {exercise.questions.length} question{exercise.questions.length > 1 ? 's' : ''}
                </span>
              </div>

              {exercise.dataset && (
                <div className="mt-2 text-xs text-gray-500">
                  📊 Dataset: {exercise.dataset.name} ({exercise.dataset.sampleSize.toLocaleString()} lignes)
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Aucun exercice ne correspond à vos critères de recherche.</p>
        </div>
      )}
    </div>
  );
}


