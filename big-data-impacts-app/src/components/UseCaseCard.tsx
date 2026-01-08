import { Link } from 'react-router-dom';
import type { UseCase } from '../types';
import { TrendingUp, Building2 } from 'lucide-react';

interface UseCaseCardProps {
  useCase: UseCase;
}

export function UseCaseCard({ useCase }: UseCaseCardProps) {
  const avgImpact =
    (useCase.impacts.organizational +
      useCase.impacts.technical +
      useCase.impacts.economic +
      useCase.impacts.social) /
    4;

  return (
    <Link
      to={`/use-cases/${useCase.id}`}
      className="card hover:shadow-lg transition-shadow block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {useCase.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>{useCase.sector}</span>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {useCase.description}
      </p>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-500">Impact moyen</p>
            <p className="text-sm font-semibold text-gray-900">
              {avgImpact.toFixed(1)}/10
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ROI</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-green-600">
                {useCase.roi}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

