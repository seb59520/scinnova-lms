import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { UseCase } from '../../types';

interface SectorDistributionChartProps {
  useCases: UseCase[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export function SectorDistributionChart({ useCases }: SectorDistributionChartProps) {
  const sectorCounts = useCases.reduce((acc, uc) => {
    acc[uc.sector] = (acc[uc.sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(sectorCounts).map(([sector, count]) => ({
    name: sector,
    value: count,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

