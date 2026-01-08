import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUseCaseStore } from '../store/useCaseStore';
import { initialUseCases } from '../data/initialData';
import { Plus, TrendingUp, BarChart3, Target, Brain } from 'lucide-react';
import { UseCaseCard } from '../components/UseCaseCard';
import { SectorDistributionChart } from '../components/charts/SectorDistributionChart';
import { ImpactSummaryChart } from '../components/charts/ImpactSummaryChart';

export function Dashboard() {
  const { useCases, addUseCase } = useUseCaseStore();

  useEffect(() => {
    // Les données sont initialisées dans App.tsx
  }, []);

  const totalUseCases = useCases.length;
  const avgROI = useCases.length > 0
    ? Math.round(useCases.reduce((sum, uc) => sum + uc.roi, 0) / useCases.length)
    : 0;
  const avgImpact = useCases.length > 0
    ? Math.round(
        useCases.reduce(
          (sum, uc) =>
            sum +
            (uc.impacts.organizational +
              uc.impacts.technical +
              uc.impacts.economic +
              uc.impacts.social) /
              4,
          0
        ) / useCases.length
      )
    : 0;
  const sectors = [...new Set(useCases.map((uc) => uc.sector))];

  const stats = [
    {
      label: 'Cas d\'usage',
      value: totalUseCases,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'ROI moyen',
      value: `${avgROI}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Impact moyen',
      value: `${avgImpact}/10`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Secteurs',
      value: sectors.length,
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Analyse des impacts du Big Data et de la Data Science
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/ml-playground"
            className="btn-primary flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Brain className="w-5 h-5" />
            ML Playground
          </Link>
          <Link
            to="/use-cases/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau cas d'usage
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-purple-600 p-3 rounded-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">ML Playground</h3>
              <p className="text-gray-600 mt-1">
                Testez et comprenez les algorithmes de machine learning de manière interactive
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Régression logistique • K-means • Détection d'anomalies
              </p>
            </div>
          </div>
          <Link
            to="/ml-playground"
            className="btn-primary bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
          >
            Accéder au Playground
            <Brain className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Répartition par secteur</h2>
          <SectorDistributionChart useCases={useCases} />
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Impacts moyens</h2>
          <ImpactSummaryChart useCases={useCases} />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Cas d'usage récents</h2>
          <Link
            to="/use-cases"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases
            .slice()
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
            .slice(0, 6)
            .map((useCase) => (
              <UseCaseCard key={useCase.id} useCase={useCase} />
            ))}
        </div>
      </div>
    </div>
  );
}

