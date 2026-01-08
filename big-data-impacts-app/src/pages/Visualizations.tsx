import { useUseCaseStore } from '../store/useCaseStore';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, ZAxis } from 'recharts';
import { SectorDistributionChart } from '../components/charts/SectorDistributionChart';

export function Visualizations() {
  const { useCases } = useUseCaseStore();

  if (useCases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Aucun cas d'usage disponible pour les visualisations
        </p>
      </div>
    );
  }

  // Données pour le graphique radar moyen
  const avgImpacts = useCases.reduce(
    (acc, uc) => ({
      organizational: acc.organizational + uc.impacts.organizational,
      technical: acc.technical + uc.impacts.technical,
      economic: acc.economic + uc.impacts.economic,
      social: acc.social + uc.impacts.social,
    }),
    { organizational: 0, technical: 0, economic: 0, social: 0 }
  );

  const count = useCases.length;
  const radarData = [
    {
      dimension: 'Organisationnel',
      value: Number((avgImpacts.organizational / count).toFixed(1)),
    },
    {
      dimension: 'Technique',
      value: Number((avgImpacts.technical / count).toFixed(1)),
    },
    {
      dimension: 'Économique',
      value: Number((avgImpacts.economic / count).toFixed(1)),
    },
    {
      dimension: 'Social',
      value: Number((avgImpacts.social / count).toFixed(1)),
    },
  ];

  // Données pour le graphique en barres par cas d'usage
  const barData = useCases.map((uc) => ({
    name: uc.title.length > 20 ? uc.title.substring(0, 20) + '...' : uc.title,
    Organisationnel: uc.impacts.organizational,
    Technique: uc.impacts.technical,
    Économique: uc.impacts.economic,
    Social: uc.impacts.social,
  }));

  // Données pour le scatter plot ROI vs Impact
  const scatterData = useCases.map((uc) => {
    const avgImpact =
      (uc.impacts.organizational +
        uc.impacts.technical +
        uc.impacts.economic +
        uc.impacts.social) /
      4;
    return {
      x: avgImpact,
      y: uc.roi,
      z: uc.title,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Visualisations</h1>
        <p className="mt-2 text-gray-600">
          Analysez les impacts du Big Data et de la Data Science
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">
            Impacts moyens (Graphique Radar)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" />
              <PolarRadiusAxis angle={90} domain={[0, 10]} />
              <Radar
                name="Impacts moyens"
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
          <h2 className="text-xl font-semibold mb-4">
            Répartition par secteur
          </h2>
          <SectorDistributionChart useCases={useCases} />
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">
          Comparaison des impacts par cas d'usage
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Organisationnel" fill="#6366f1" />
            <Bar dataKey="Technique" fill="#8b5cf6" />
            <Bar dataKey="Économique" fill="#10b981" />
            <Bar dataKey="Social" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">
          ROI vs Impact global (Scatter Plot)
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Impact moyen"
              domain={[0, 10]}
              label={{ value: 'Impact moyen', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="ROI"
              label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis dataKey="z" name="Cas d'usage" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Cas d'usage" data={scatterData} fill="#6366f1" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


