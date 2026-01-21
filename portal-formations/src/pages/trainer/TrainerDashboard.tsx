import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAllTrainerOrgs, getSessions, getSessionKPIs } from '../../lib/queries/trainerQueries';
import type { Session, SessionKPIs, Org } from '../../types/database';
import { KPICard } from '../../components/trainer/KPICard';
import { AlertCard } from '../../components/trainer/AlertCard';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { formatPercent, formatScore, daysSince } from '../../utils/trainerUtils';
import { Users, BookOpen, TrendingUp, AlertTriangle, Building2, ChevronDown, ChevronRight, MessageSquare, ClipboardCheck, Award, Play } from 'lucide-react';

interface OrgWithSessions extends Org {
  sessions: Session[];
}

export function TrainerDashboard() {
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
      console.log('🔍 Organisations chargées:', orgs.length, orgs);

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

          console.log(`✅ Sessions chargées pour ${org.name}:`, sessions.length);
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

    if (kpis.completion_rate < 50) {
      newAlerts.push({
        type: 'error',
        title: 'Taux de complétion faible',
        message: `Seulement ${formatPercent(kpis.completion_rate)} des apprenants ont complété la formation.`,
      });
    }

    if (kpis.avg_score < 60) {
      newAlerts.push({
        type: 'warning',
        title: 'Score moyen faible',
        message: `Le score moyen est de ${formatScore(kpis.avg_score)}.`,
      });
    }

    if (kpis.red_modules > 0) {
      newAlerts.push({
        type: 'error',
        title: 'Modules en difficulté',
        message: `${kpis.red_modules} module(s) nécessitent une attention particulière.`,
      });
    }

    setAlerts(newAlerts);
  }

  const toggleOrg = (orgId: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedOrgs(newExpanded);
  };

  const allSessions = orgsWithSessions.flatMap(org => org.sessions);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6 pt-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="mt-2 text-gray-600">
              Vue multi-organisations
            </p>
          </div>

          {/* Multi-org view */}
          {orgsWithSessions.length > 0 ? (
            <div className="space-y-4 mb-8">
              {orgsWithSessions.map((org) => (
                <div key={org.id} className="bg-white rounded-lg shadow border border-gray-200">
                  {/* Organization header */}
                  <button
                    onClick={() => toggleOrg(org.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedOrgs.has(org.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <h2 className="text-lg font-semibold text-gray-900">{org.name}</h2>
                        <p className="text-sm text-gray-500">
                          {org.sessions.length} session{org.sessions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Sessions list */}
                  {expandedOrgs.has(org.id) && (
                    <div className="border-t border-gray-200">
                      {org.sessions.length > 0 ? (
                        <div className="p-4 space-y-2">
                          {org.sessions.map((session) => (
                            <div
                              key={session.id}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedSessionId === session.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedSessionId(session.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-900">{session.title}</h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Statut: <span className="capitalize">{session.status}</span>
                                    {session.start_date && (
                                      <> • Début: {new Date(session.start_date).toLocaleDateString('fr-FR')}</>
                                    )}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Link
                                    to={`/trainer/session/${session.id}/live`}
                                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Play className="w-3 h-3" />
                                    Live
                                  </Link>
                                  <Link
                                    to={`/trainer/session/${session.id}/projects`}
                                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ClipboardCheck className="w-3 h-3" />
                                    Projets
                                  </Link>
                                  <Link
                                    to={`/trainer/session/${session.id}`}
                                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Apprenants
                                  </Link>
                                  <Link
                                    to={`/trainer/analytics/${session.id}`}
                                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Analyses
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <p>Aucune session pour cette organisation</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune organisation</h3>
              <p className="text-gray-500 mb-4">
                Vous n'êtes membre d'aucune organisation. Contactez un administrateur pour être ajouté à une organisation.
              </p>
              <Link
                to="/admin/orgs"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Gérer les organisations
              </Link>
            </div>
          )}

        {/* KPIs */}
        {kpis && (
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Apprenants actifs (7j)"
              value={kpis.active_learners_7d}
              icon={<Users className="h-8 w-8" />}
              color="blue"
            />
            <KPICard
              title="Taux de complétion"
              value={formatPercent(kpis.completion_rate)}
              icon={<BookOpen className="h-8 w-8" />}
              color={kpis.completion_rate >= 80 ? 'green' : kpis.completion_rate >= 50 ? 'yellow' : 'red'}
            />
            <KPICard
              title="Score moyen"
              value={formatScore(kpis.avg_score)}
              icon={<TrendingUp className="h-8 w-8" />}
              color={kpis.avg_score >= 80 ? 'green' : kpis.avg_score >= 60 ? 'yellow' : 'red'}
            />
            <KPICard
              title="Modules en difficulté"
              value={kpis.red_modules}
              icon={<AlertTriangle className="h-8 w-8" />}
              color={kpis.red_modules === 0 ? 'green' : 'red'}
            />
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-4">
            {alerts.map((alert, index) => (
              <AlertCard
                key={index}
                type={alert.type}
                title={alert.title}
                message={alert.message}
              />
            ))}
          </div>
        )}

        {/* Quick actions */}
        {selectedSessionId && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
            <Link
              to={`/trainer/session/${selectedSessionId}/live`}
              className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center hover:bg-green-100 transition-colors"
            >
              <Play className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Session Live</h3>
              <p className="mt-1 text-sm text-gray-600">Animer en direct</p>
            </Link>
            <Link
              to={`/trainer/session/${selectedSessionId}/projects`}
              className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6 text-center hover:bg-purple-100 transition-colors"
            >
              <ClipboardCheck className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Projets</h3>
              <p className="mt-1 text-sm text-gray-600">Évaluer les restitutions</p>
            </Link>
            <Link
              to={`/trainer/session/${selectedSessionId}/gradebook`}
              className="rounded-lg border-2 border-amber-200 bg-amber-50 p-6 text-center hover:bg-amber-100 transition-colors"
            >
              <Award className="h-8 w-8 mx-auto text-amber-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Carnet de notes</h3>
              <p className="mt-1 text-sm text-gray-600">Gérer les notes</p>
            </Link>
            <Link
              to={`/trainer/session/${selectedSessionId}`}
              className="rounded-lg border bg-white p-6 text-center hover:bg-gray-50"
            >
              <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Apprenants</h3>
              <p className="mt-1 text-sm text-gray-600">Liste et actions</p>
            </Link>
            <Link
              to={`/trainer/analytics/${selectedSessionId}`}
              className="rounded-lg border bg-white p-6 text-center hover:bg-gray-50"
            >
              <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Analyses</h3>
              <p className="mt-1 text-sm text-gray-600">Modules et exercices</p>
            </Link>
            <Link
              to="/trainer/notes"
              className="rounded-lg border bg-white p-6 text-center hover:bg-gray-50"
            >
              <MessageSquare className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Mes notes</h3>
              <p className="mt-1 text-sm text-gray-600">Notes privées</p>
            </Link>
          </div>
        )}

        {/* Quiz responses link */}
        <div className="mb-8">
          <Link
            to={selectedSessionId ? `/trainer/sessions/${selectedSessionId}/quiz-responses` : '/trainer/quiz-responses'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Voir les réponses du quiz d'introduction
          </Link>
        </div>

        </div>
      </div>
    </div>
  );
}

