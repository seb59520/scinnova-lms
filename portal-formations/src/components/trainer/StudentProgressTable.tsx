import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { StudentProgramProgress } from '../../types/database';
import {
  User,
  Building2,
  BookOpen,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Search,
  Filter
} from 'lucide-react';

interface StudentProgressTableProps {
  data: StudentProgramProgress[];
  showOrg?: boolean;
  showProgram?: boolean;
  isLoading?: boolean;
}

type SortField = 'user_name' | 'org_name' | 'program_title' | 'overall_progress_percent' | 'last_activity_at' | 'best_evaluation_score';
type SortDirection = 'asc' | 'desc';

export function StudentProgressTable({
  data,
  showOrg = true,
  showProgram = true,
  isLoading = false
}: StudentProgressTableProps) {
  const [sortField, setSortField] = useState<SortField>('last_activity_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [progressFilter, setProgressFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  // Filtrage et tri
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filtrage par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.user_name.toLowerCase().includes(query) ||
        item.org_name.toLowerCase().includes(query) ||
        item.program_title.toLowerCase().includes(query) ||
        (item.current_course_title?.toLowerCase().includes(query)) ||
        (item.current_module_title?.toLowerCase().includes(query))
      );
    }

    // Filtrage par progression
    switch (progressFilter) {
      case 'completed':
        result = result.filter(item => item.overall_progress_percent >= 100);
        break;
      case 'in_progress':
        result = result.filter(item => item.overall_progress_percent > 0 && item.overall_progress_percent < 100);
        break;
      case 'not_started':
        result = result.filter(item => item.overall_progress_percent === 0);
        break;
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'user_name':
          comparison = a.user_name.localeCompare(b.user_name);
          break;
        case 'org_name':
          comparison = a.org_name.localeCompare(b.org_name);
          break;
        case 'program_title':
          comparison = a.program_title.localeCompare(b.program_title);
          break;
        case 'overall_progress_percent':
          comparison = a.overall_progress_percent - b.overall_progress_percent;
          break;
        case 'last_activity_at':
          const dateA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
          const dateB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'best_evaluation_score':
          comparison = (a.best_evaluation_score || 0) - (b.best_evaluation_score || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [data, searchQuery, progressFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-blue-500';
    if (percent >= 50) return 'bg-yellow-500';
    if (percent >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Barre de filtres */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un apprenant, une organisation, un programme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtre progression */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value as typeof progressFilter)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous</option>
              <option value="completed">Terminé</option>
              <option value="in_progress">En cours</option>
              <option value="not_started">Non commencé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('user_name')}
              >
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Apprenant
                  <SortIcon field="user_name" />
                </div>
              </th>

              {showOrg && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('org_name')}
                >
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    Organisation
                    <SortIcon field="org_name" />
                  </div>
                </th>
              )}

              {showProgram && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('program_title')}
                >
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    Programme
                    <SortIcon field="program_title" />
                  </div>
                </th>
              )}

              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Module actuel
              </th>

              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('overall_progress_percent')}
              >
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Progression
                  <SortIcon field="overall_progress_percent" />
                </div>
              </th>

              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('best_evaluation_score')}
              >
                <div className="flex items-center gap-1">
                  Évaluation
                  <SortIcon field="best_evaluation_score" />
                </div>
              </th>

              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('last_activity_at')}
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Dernière activité
                  <SortIcon field="last_activity_at" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Aucun apprenant trouvé
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((item, index) => (
                <tr key={`${item.user_id}-${item.program_id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {item.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{item.user_name}</div>
                      </div>
                    </div>
                  </td>

                  {showOrg && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.org_name}</div>
                    </td>
                  )}

                  {showProgram && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/programs/${item.program_id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {item.program_title}
                      </Link>
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {item.current_course_title ? (
                        <>
                          <div className="text-gray-900">{item.current_course_title}</div>
                          {item.current_module_title && (
                            <div className="text-xs text-gray-500">{item.current_module_title}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full w-24">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(item.overall_progress_percent)}`}
                          style={{ width: `${Math.min(item.overall_progress_percent, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.overall_progress_percent}%
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.best_evaluation_score !== null ? (
                      <div className="flex items-center gap-1">
                        {item.evaluation_passed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          item.evaluation_passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.best_evaluation_score.toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-500">
                          ({item.evaluation_attempts} tentative{item.evaluation_attempts > 1 ? 's' : ''})
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${
                      item.last_activity_at ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {formatDate(item.last_activity_at)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer avec compteur */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-500">
          {filteredAndSortedData.length} apprenant{filteredAndSortedData.length > 1 ? 's' : ''} affiché{filteredAndSortedData.length > 1 ? 's' : ''}
          {filteredAndSortedData.length !== data.length && (
            <span> sur {data.length} au total</span>
          )}
        </p>
      </div>
    </div>
  );
}
