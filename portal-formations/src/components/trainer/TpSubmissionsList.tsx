import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Star
} from 'lucide-react';

interface TpSubmission {
  id: string;
  user_id: string;
  user_name: string;
  project_title: string;
  status: 'draft' | 'submitted' | 'late' | 'evaluated' | 'returned';
  submitted_at: string | null;
  presentation_link?: string;
  app_link?: string;
  files_count: number;
  evaluation?: {
    score_20: number;
    passed: boolean;
    is_published: boolean;
  } | null;
}

interface TpSubmissionsListProps {
  submissions: TpSubmission[];
  restitutionId: string;
  sessionId: string;
  isLoading?: boolean;
  onEvaluate?: (submissionId: string) => void;
}

type SortField = 'user_name' | 'submitted_at' | 'status' | 'score';
type SortDirection = 'asc' | 'desc';

export function TpSubmissionsList({
  submissions,
  restitutionId,
  sessionId,
  isLoading = false,
  onEvaluate
}: TpSubmissionsListProps) {
  const [sortField, setSortField] = useState<SortField>('submitted_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...submissions];

    // Filtrage par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.user_name.toLowerCase().includes(query) ||
        s.project_title.toLowerCase().includes(query)
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'user_name':
          comparison = a.user_name.localeCompare(b.user_name);
          break;
        case 'submitted_at':
          const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
          const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'status':
          const statusOrder = { draft: 0, submitted: 1, late: 2, evaluated: 3, returned: 4 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'score':
          comparison = (a.evaluation?.score_20 || 0) - (b.evaluation?.score_20 || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [submissions, searchQuery, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status: TpSubmission['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            <FileText className="w-3 h-3" />
            Brouillon
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            <Clock className="w-3 h-3" />
            Soumis
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
            <AlertCircle className="w-3 h-3" />
            En retard
          </span>
        );
      case 'evaluated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Évalué
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            <XCircle className="w-3 h-3" />
            Retourné
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Stats
  const stats = useMemo(() => ({
    total: submissions.length,
    submitted: submissions.filter(s => s.status === 'submitted' || s.status === 'late').length,
    evaluated: submissions.filter(s => s.status === 'evaluated').length,
    pending: submissions.filter(s => s.status === 'submitted' || s.status === 'late').length
  }), [submissions]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total apprenants</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          <div className="text-sm text-gray-500">Soumissions</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.evaluated}</div>
          <div className="text-sm text-gray-500">Évalués</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">À évaluer</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {/* Filtres */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un apprenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="submitted">Soumis</option>
                <option value="late">En retard</option>
                <option value="evaluated">Évalué</option>
                <option value="returned">Retourné</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste */}
        <div className="divide-y divide-gray-200">
          {filteredAndSortedSubmissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucune soumission trouvée
            </div>
          ) : (
            filteredAndSortedSubmissions.map((submission) => (
              <div key={submission.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {submission.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Infos */}
                    <div>
                      <div className="font-medium text-gray-900">{submission.user_name}</div>
                      <div className="text-sm text-gray-500">{submission.project_title}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Statut */}
                    {getStatusBadge(submission.status)}

                    {/* Liens */}
                    <div className="flex items-center gap-2">
                      {submission.presentation_link && (
                        <a
                          href={submission.presentation_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Voir la présentation"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {submission.files_count > 0 && (
                        <span className="text-xs text-gray-500">
                          {submission.files_count} fichier{submission.files_count > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Score */}
                    {submission.evaluation && (
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                        submission.evaluation.passed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <Star className="w-4 h-4" />
                        <span className="font-medium">
                          {submission.evaluation.score_20.toFixed(1)}/20
                        </span>
                        {!submission.evaluation.is_published && (
                          <span className="text-xs">(non publié)</span>
                        )}
                      </div>
                    )}

                    {/* Date de soumission */}
                    <div className="text-sm text-gray-500 min-w-[120px]">
                      {formatDate(submission.submitted_at)}
                    </div>

                    {/* Actions */}
                    {(submission.status === 'submitted' || submission.status === 'late' || submission.status === 'evaluated') && (
                      <Link
                        to={`/trainer/session/${sessionId}/project/${submission.id}/evaluate`}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {submission.status === 'evaluated' ? 'Modifier' : 'Évaluer'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
