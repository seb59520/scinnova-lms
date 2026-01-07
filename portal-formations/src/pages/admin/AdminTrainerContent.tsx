import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAllTrainerOrgs, getSessions, getSessionKPIs } from '../../lib/queries/trainerQueries';
import type { Session, SessionKPIs, Org } from '../../types/database';
import { KPICard } from '../../components/trainer/KPICard';
import { AlertCard } from '../../components/trainer/AlertCard';
import { formatPercent, formatScore, daysSince } from '../../utils/trainerUtils';
import { Users, BookOpen, TrendingUp, AlertTriangle, Building2, ChevronDown, ChevronRight, Clock, FileText, BarChart3, MessageSquare } from 'lucide-react';

interface OrgWithSessions extends Org {
  sessions: Session[];
}

export function AdminTrainerContent() {
  const { user } = useAuth();
  const [orgsWithSessions, setOrgsWithSessions] = useState<OrgWithSessions[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [kpis, setKpis] = useState<SessionKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<Array<{ type: 'warning' | 'error' | 'info'; title: string; message: string }>>([]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      setLoading(true);

      // Charger toutes les organisations
      const { orgs, error: orgsError } = await getAllTrainerOrgs();

      if (orgsError) {
        console.error('❌ Error loading orgs:', orgsError);
        setLoading(false);
        return;
      }

      // Charger les sessions pour chaque organisation
      const orgsWithSessionsData: OrgWithSessions[] = await Promise.all(
        orgs.map(async (org) => {
          const { sessions, error: sessionsError } = await getSessions(org.id, false);
          
          if (sessionsError) {
            console.error(`❌ Error loading sessions for org ${org.name}:`, sessionsError);
            return { ...org, sessions: [] };
          }

          return { ...org, sessions: sessions || [] };
        })
      );

      setOrgsWithSessions(orgsWithSessionsData);

      // Développer automatiquement la première organisation avec des sessions
      const firstOrgWithSessions = orgsWithSessionsData.find(org => org.sessions.length > 0);
      if (firstOrgWithSessions) {
        setExpandedOrgs(new Set([firstOrgWithSessions.id]));
        if (firstOrgWithSessions.sessions.length > 0) {
          setSelectedSessionId(firstOrgWithSessions.sessions[0].id);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [user]);

  useEffect(() => {
    async function loadKPIs() {
      if (!selectedSessionId) return;

      const { kpis: sessionKPIs, error } = await getSessionKPIs(selectedSessionId);
      if (error) {
        console.error('Error loading KPIs:', error);
      } else {
        setKpis(sessionKPIs);
        generateAlerts(sessionKPIs);
      }
    }

    loadKPIs();
  }, [selectedSessionId]);

  function generateAlerts(kpis: SessionKPIs | null) {
    if (!kpis) return;

    const newAlerts: Array<{ type: 'warning' | 'error' | 'info'; title: string; message: string }> = [];

    if (kpis.active_learners_7d === 0) {
      newAlerts.push({
        type: 'warning',
        title: 'Aucun apprenant actif',
        message: 'Aucun apprenant n\'a été actif au cours des 7 derniers jours.',
      });
    }

    if (kpis.completion_rate < 0.5) {
      newAlerts.push({
        type: 'warning',
        title: 'Taux de complétion faible',
        message: `Le taux de complétion est de ${formatPercent(kpis.completion_rate)}.`,
      });
    }

    if (kpis.avg_score < 50) {
      newAlerts.push({
        type: 'error',
        title: 'Score moyen faible',
        message: `Le score moyen est de ${formatScore(kpis.avg_score)}.`,
      });
    }

    setAlerts(newAlerts);
  }

  function toggleOrg(orgId: string) {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedOrgs(newExpanded);
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Portail Formateur</h1>
        <p className="text-gray-600">
          Gérez les sessions, suivez la progression des apprenants et analysez les performances
        </p>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Link
          to="/trainer/time-tracking"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium text-gray-900">Temps passé</div>
            <div className="text-sm text-gray-500">Suivi du temps</div>
          </div>
        </Link>
        <Link
          to="/trainer/notes"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium text-gray-900">Notes</div>
            <div className="text-sm text-gray-500">Notes privées</div>
          </div>
        </Link>
        <Link
          to="/trainer"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium text-gray-900">Dashboard</div>
            <div className="text-sm text-gray-500">Vue complète</div>
          </div>
        </Link>
        <Link
          to="/admin"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <Building2 className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium text-gray-900">Administration</div>
            <div className="text-sm text-gray-500">Retour admin</div>
          </div>
        </Link>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Apprenants actifs (7j)"
            value={kpis.active_learners_7d.toString()}
            icon={<Users className="h-8 w-8" />}
          />
          <KPICard
            title="Taux de complétion"
            value={formatPercent(kpis.completion_rate)}
            icon={<TrendingUp className="h-8 w-8" />}
          />
          <KPICard
            title="Score moyen"
            value={formatScore(kpis.avg_score)}
            icon={<BookOpen className="h-8 w-8" />}
          />
          <KPICard
            title="Modules en difficulté"
            value={kpis.difficult_modules.toString()}
            icon={<AlertTriangle className="h-8 w-8" />}
          />
        </div>
      )}

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {alerts.map((alert, index) => (
            <AlertCard key={index} type={alert.type} title={alert.title} message={alert.message} />
          ))}
        </div>
      )}

      {/* Liste des organisations et sessions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sessions actives</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {orgsWithSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucune organisation avec des sessions actives
            </div>
          ) : (
            orgsWithSessions.map((org) => (
              <div key={org.id} className="p-4">
                <button
                  onClick={() => toggleOrg(org.id)}
                  className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedOrgs.has(org.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{org.name}</div>
                      <div className="text-sm text-gray-500">
                        {org.sessions.length} session{org.sessions.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </button>

                {expandedOrgs.has(org.id) && (
                  <div className="ml-8 mt-2 space-y-2">
                    {org.sessions.length === 0 ? (
                      <div className="text-sm text-gray-500 p-2">Aucune session active</div>
                    ) : (
                      org.sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            selectedSessionId === session.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{session.title}</div>
                              <div className="text-sm text-gray-500">
                                Statut: <span className="capitalize">{session.status}</span>
                                {session.start_date && (
                                  <> • Début: {new Date(session.start_date).toLocaleDateString('fr-FR')}</>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link
                                to={`/trainer/session/${session.id}`}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Apprenants
                              </Link>
                              <Link
                                to={`/trainer/analytics/${session.id}`}
                                className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Analyses
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

