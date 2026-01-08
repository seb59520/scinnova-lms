import { Link } from 'react-router-dom';
import { useUseCaseStore } from '../store/useCaseStore';
import { UseCaseCard } from '../components/UseCaseCard';
import { Plus, Search, Filter } from 'lucide-react';
import { useState } from 'react';

export function UseCasesList() {
  const { useCases } = useUseCaseStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('');

  const sectors = [...new Set(useCases.map((uc) => uc.sector))];

  const filteredUseCases = useCases.filter((uc) => {
    const matchesSearch =
      uc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = !selectedSector || uc.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cas d'usage</h1>
          <p className="mt-2 text-gray-600">
            Gérez et analysez vos cas d'usage Big Data et Data Science
          </p>
        </div>
        <Link
          to="/use-cases/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau cas d'usage
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un cas d'usage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="input pl-10 pr-8 appearance-none"
            >
              <option value="">Tous les secteurs</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUseCases.length > 0 ? (
          filteredUseCases.map((useCase) => (
            <UseCaseCard key={useCase.id} useCase={useCase} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">
              {useCases.length === 0
                ? "Aucun cas d'usage pour le moment"
                : "Aucun cas d'usage ne correspond à votre recherche"}
            </p>
            {useCases.length === 0 && (
              <Link
                to="/use-cases/new"
                className="btn-primary inline-flex items-center gap-2 mt-4"
              >
                <Plus className="w-5 h-5" />
                Créer le premier cas d'usage
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


