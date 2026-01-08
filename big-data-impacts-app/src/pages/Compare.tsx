import { useState } from 'react';
import { useUseCaseStore } from '../store/useCaseStore';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b'];

export function Compare() {
  const { useCases } = useUseCaseStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedUseCases = useCases.filter((uc) => selectedIds.includes(uc.id));

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev
    );
  };

  const radarData = selectedUseCases.map((uc) => ({
    name: uc.title,
    data: [
      { dimension: 'Organisationnel', value: uc.impacts.organizational },
      { dimension: 'Technique', value: uc.impacts.technical },
      { dimension: 'Économique', value: uc.impacts.economic },
      { dimension: 'Social', value: uc.impacts.social },
    ],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comparer les cas d'usage</h1>
        <p className="mt-2 text-gray-600">
          Sélectionnez jusqu'à 4 cas d'usage pour les comparer
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Sélectionner les cas d'usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {useCases.map((uc) => {
            const isSelected = selectedIds.includes(uc.id);
            return (
              <div
                key={uc.id}
                onClick={() => toggleSelection(uc.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {uc.title}
                    </h3>
                    <p className="text-sm text-gray-600">{uc.sector}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedUseCases.length > 0 && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Comparaison visuelle</h2>
              <button
                onClick={() => setSelectedIds([])}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Tout désélectionner
              </button>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis angle={90} domain={[0, 10]} />
                {radarData.map((item, index) => (
                  <Radar
                    key={item.name}
                    name={item.name}
                    dataKey="value"
                    data={item.data}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.3}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Tableau comparatif</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cas d'usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Secteur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Org.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tech.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Éco.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Social
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedUseCases.map((uc) => {
                    const avgImpact =
                      (uc.impacts.organizational +
                        uc.impacts.technical +
                        uc.impacts.economic +
                        uc.impacts.social) /
                      4;
                    return (
                      <tr key={uc.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {uc.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {uc.sector}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {uc.impacts.organizational}/10
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {uc.impacts.technical}/10
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {uc.impacts.economic}/10
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {uc.impacts.social}/10
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {uc.roi}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

