import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { UseCase } from '../../types';

interface ImpactSummaryChartProps {
  useCases: UseCase[];
}

export function ImpactSummaryChart({ useCases }: ImpactSummaryChartProps) {
  if (useCases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

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
  const data = [
    {
      name: 'Organisationnel',
      Impact: Number((avgImpacts.organizational / count).toFixed(1)),
    },
    {
      name: 'Technique',
      Impact: Number((avgImpacts.technical / count).toFixed(1)),
    },
    {
      name: 'Économique',
      Impact: Number((avgImpacts.economic / count).toFixed(1)),
    },
    {
      name: 'Social',
      Impact: Number((avgImpacts.social / count).toFixed(1)),
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 10]} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Impact" fill="#6366f1" />
      </BarChart>
    </ResponsiveContainer>
  );
}

