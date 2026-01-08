import { useParams, Link } from 'react-router-dom';
import { useUseCaseStore } from '../store/useCaseStore';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { Edit, Trash2, ArrowLeft, TrendingUp, Building2 } from 'lucide-react';
import { useState } from 'react';

export function UseCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { getUseCase, deleteUseCase } = useUseCaseStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const useCase = id ? getUseCase(id) : null;

  if (!useCase) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Cas d'usage non trouvé</p>
        <Link to="/use-cases" className="btn-primary mt-4 inline-block">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (id) {
      deleteUseCase(id);
      setTimeout(() => {
        window.location.href = '/use-cases';
      }, 100);
    }
  };

  const radarData = [
    { dimension: 'Organisationnel', value: useCase.impacts.organizational },
    { dimension: 'Technique', value: useCase.impacts.technical },
    { dimension: 'Économique', value: useCase.impacts.economic },
    { dimension: 'Social', value: useCase.impacts.social },
  ];

  const avgImpact =
    (useCase.impacts.organizational +
      useCase.impacts.technical +
      useCase.impacts.economic +
      useCase.impacts.social) /
    4;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/use-cases"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
        <div className="flex gap-2">
          <Link
            to={`/use-cases/${id}/edit`}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-800 mb-4">
            Êtes-vous sûr de vouloir supprimer ce cas d'usage ?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Confirmer
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {useCase.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span>{useCase.sector}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-600">
                  ROI: {useCase.roi}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-6">{useCase.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Technologies</h3>
            <div className="flex flex-wrap gap-2">
              {useCase.technologies.map((tech, index) => (
                <span
                  key={index}
                  className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Défis et risques</h3>
            <div className="flex flex-wrap gap-2">
              {useCase.challenges.map((challenge, index) => (
                <span
                  key={index}
                  className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                >
                  {challenge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Analyse des impacts</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Impact moyen</p>
            <p className="text-2xl font-bold text-gray-900">
              {avgImpact.toFixed(1)}/10
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" />
              <PolarRadiusAxis angle={90} domain={[0, 10]} />
              <Radar
                name="Impacts"
                dataKey="value"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.6}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Détails des impacts</h2>
          <div className="space-y-4">
            {[
              { label: 'Organisationnel', value: useCase.impacts.organizational },
              { label: 'Technique', value: useCase.impacts.technical },
              { label: 'Économique', value: useCase.impacts.economic },
              { label: 'Social', value: useCase.impacts.social },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {value}/10
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(value / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

