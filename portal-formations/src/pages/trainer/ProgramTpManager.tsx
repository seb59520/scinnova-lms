import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { TpSubmissionsList } from '../../components/trainer/TpSubmissionsList';
import type { SessionTpWithProgram } from '../../types/database';
import {
  ArrowLeft,
  Plus,
  FileText,
  Upload,
  Trash2,
  Edit2,
  Eye,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  ChevronRight,
  Download,
  ExternalLink
} from 'lucide-react';

interface TpWithSubmissions extends SessionTpWithProgram {
  session_title?: string;
  org_name?: string;
}

export function ProgramTpManager() {
  const { programId } = useParams<{ programId: string }>();

  const [tps, setTps] = useState<TpWithSubmissions[]>([]);
  const [selectedTpId, setSelectedTpId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programTitle, setProgramTitle] = useState<string>('');

  // Charger les TP du programme
  useEffect(() => {
    async function loadTps() {
      if (!programId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Charger le titre du programme
        const { data: programData } = await supabase
          .from('programs')
          .select('title')
          .eq('id', programId)
          .single();

        if (programData) {
          setProgramTitle(programData.title);
        }

        // Charger les TP liés au programme
        const { data: tpsData, error: tpsError } = await supabase
          .from('session_project_restitutions')
          .select(`
            *,
            sessions!inner (
              id,
              title,
              org_id,
              orgs (name)
            )
          `)
          .eq('program_id', programId)
          .order('created_at', { ascending: false });

        if (tpsError) throw tpsError;

        const formattedTps: TpWithSubmissions[] = (tpsData || []).map(tp => ({
          ...tp,
          session_title: tp.sessions?.title,
          org_name: tp.sessions?.orgs?.name
        }));

        setTps(formattedTps);
      } catch (err) {
        console.error('Error loading TPs:', err);
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    }

    loadTps();
  }, [programId]);

  const selectedTp = tps.find(tp => tp.id === selectedTpId);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-600', label: 'Brouillon' },
      published: { color: 'bg-blue-100 text-blue-700', label: 'Publié' },
      open: { color: 'bg-green-100 text-green-700', label: 'Ouvert' },
      closed: { color: 'bg-orange-100 text-orange-700', label: 'Fermé' },
      grading: { color: 'bg-purple-100 text-purple-700', label: 'Notation' },
      completed: { color: 'bg-green-100 text-green-700', label: 'Terminé' },
      archived: { color: 'bg-gray-100 text-gray-600', label: 'Archivé' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Stats globales
  const stats = {
    totalTps: tps.length,
    totalSubmissions: tps.reduce((sum, tp) => sum + (tp.submissions_count || 0), 0),
    totalEvaluated: tps.reduce((sum, tp) => sum + (tp.evaluated_count || 0), 0),
    avgScore: tps.filter(tp => tp.average_score !== null).length > 0
      ? tps.reduce((sum, tp) => sum + (tp.average_score || 0), 0) /
        tps.filter(tp => tp.average_score !== null).length
      : null
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6 pt-8">
        <div className="mx-auto max-w-6xl">
          {/* En-tête */}
          <div className="mb-6">
            <Link
              to="/trainer/dashboard/by-program"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  TP du Programme
                </h1>
                <p className="mt-1 text-gray-600">
                  {programTitle}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalTps}</div>
                  <div className="text-xs text-gray-500">TP créés</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</div>
                  <div className="text-xs text-gray-500">Soumissions</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalEvaluated}</div>
                  <div className="text-xs text-gray-500">Évalués</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.avgScore !== null ? `${stats.avgScore.toFixed(1)}/20` : '-'}
                  </div>
                  <div className="text-xs text-gray-500">Score moyen</div>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des TP ou détail */}
          {!selectedTpId ? (
            // Liste des TP
            <div className="space-y-4">
              {tps.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun TP pour ce programme
                  </h3>
                  <p className="text-gray-500">
                    Les TP sont créés au niveau des sessions et peuvent être liés à ce programme.
                  </p>
                </div>
              ) : (
                tps.map((tp) => (
                  <div
                    key={tp.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{tp.title}</h3>
                            <p className="text-sm text-gray-500">
                              {tp.org_name} • {tp.session_title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(tp.status)}
                          <button
                            onClick={() => setSelectedTpId(tp.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Échéance: {formatDate(tp.due_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Upload className="w-4 h-4" />
                          <span>{tp.submissions_count || 0} soumission(s)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <CheckCircle className="w-4 h-4" />
                          <span>{tp.evaluated_count || 0} évalué(s)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>
                            Moyenne: {tp.average_score !== null ? `${tp.average_score.toFixed(1)}/20` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Fichiers sources */}
                      {tp.source_files && tp.source_files.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Ressources fournies ({tp.source_files.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {tp.source_files.map((file, index) => (
                              <a
                                key={index}
                                href="#"
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                              >
                                <Download className="w-3 h-3" />
                                {file.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                      <Link
                        to={`/trainer/session/${tp.session_id}/projects`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                        Voir les soumissions
                      </Link>
                      <Link
                        to={`/trainer/session/${tp.session_id}/project/${tp.id}/evaluate`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                        Évaluer
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Détail d'un TP
            <div>
              <button
                onClick={() => setSelectedTpId(null)}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la liste
              </button>

              {selectedTp && (
                <>
                  <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{selectedTp.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedTp.org_name} • {selectedTp.session_title}
                        </p>
                      </div>
                      {getStatusBadge(selectedTp.status)}
                    </div>

                    {selectedTp.description && (
                      <p className="text-gray-700 mb-4">{selectedTp.description}</p>
                    )}

                    {selectedTp.instructions && (
                      <div className="p-4 bg-blue-50 rounded-lg mb-4">
                        <h3 className="font-medium text-blue-800 mb-2">Instructions</h3>
                        <p className="text-blue-700 text-sm whitespace-pre-wrap">
                          {selectedTp.instructions}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Échéance: {formatDate(selectedTp.due_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Upload className="w-4 h-4" />
                        {selectedTp.submissions_count || 0} soumission(s)
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {selectedTp.evaluated_count || 0} évalué(s)
                      </div>
                    </div>

                    {/* Fichiers sources */}
                    {selectedTp.source_files && selectedTp.source_files.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-3">
                          Ressources et fichiers sources
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {selectedTp.source_files.map((file, index) => (
                            <a
                              key={index}
                              href="#"
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <FileText className="w-8 h-8 text-gray-400" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {file.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {file.description || file.type}
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Soumissions */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Soumissions</h3>
                    </div>
                    <div className="p-4">
                      <Link
                        to={`/trainer/session/${selectedTp.session_id}/projects`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        Voir toutes les soumissions dans la session
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
