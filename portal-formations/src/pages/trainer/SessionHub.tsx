import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSessionRealtime } from '../../hooks/useSessionRealtime';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { SessionStateBar } from '../../components/session/SessionStateBar';
import { LearnersProgressList } from '../../components/session/LearnersProgressList';
import { supabase } from '../../lib/supabaseClient';
import type { Session, Course } from '../../types/database';
import {
  LayoutDashboard, Users, FileText, HelpCircle, Clock, BookOpen,
  Play, Pause, Square, Coffee, Send, X, ChevronLeft, ChevronDown, ChevronUp, Radio,
  BarChart3, PenTool, MessageSquare, Settings, AlertTriangle, ClipboardCheck,
  UserPlus, Trash2, Search, User
} from 'lucide-react';
import { FillableDocumentsSubmissionsTracker } from '../../components/FillableDocumentsSubmissionsTracker';

type TabId = 'dashboard' | 'learners' | 'gradebook' | 'projects' | 'quiz' | 'time' | 'documents';

interface SessionDetails extends Session {
  course?: Course;
}

export function SessionHub() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get('tab') as TabId) || 'dashboard'
  );
  
  // Message formateur
  const [messageInput, setMessageInput] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'success' | 'action'>('info');
  const [showMessagePanel, setShowMessagePanel] = useState(false);

  const {
    sessionState,
    members,
    learnerProgress,
    presence,
    recentEvents,
    isLoading: realtimeLoading,
    trainerActions
  } = useSessionRealtime({
    sessionId: sessionId || '',
    autoJoin: true
  });

  // Charger les détails de la session
  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('id', sessionId)
        .single();
      
      if (!error && data) {
        setSession(data);
      }
      setLoading(false);
    }
    
    loadSession();
  }, [sessionId]);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as TabId;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Stats
  const learners = members.filter(m => m.role === 'learner');
  const activeCount = learners.filter(m => presence.get(m.user_id)?.is_online).length;
  const helpRequests = Array.from(learnerProgress.values()).filter(p => p.relative_status === 'stuck').length;

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    await trainerActions.sendMessage(messageInput, messageType);
    setMessageInput('');
    setShowMessagePanel(false);
  };

  if (!sessionId || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TrainerHeader />
        <div className="pt-8 flex items-center justify-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TrainerHeader />
        <div className="pt-8 flex items-center justify-center">
          <p className="text-red-500">Session non trouvée</p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'learners', label: 'Apprenants', icon: <Users className="h-4 w-4" /> },
    { id: 'gradebook', label: 'Notes', icon: <FileText className="h-4 w-4" /> },
    { id: 'projects', label: 'Projets', icon: <ClipboardCheck className="h-4 w-4" /> },
    { id: 'quiz', label: 'Quiz', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'time', label: 'Temps', icon: <Clock className="h-4 w-4" /> },
    { id: 'documents', label: 'Documents', icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />

      {/* Session Header */}
      <div className="pt-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/trainer/sessions"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{session.title}</h1>
                <p className="text-sm text-gray-500">
                  {session.course?.title || 'Cours non défini'}
                  {session.start_date && ` • ${new Date(session.start_date).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
            </div>

            {/* Actions de session */}
            <div className="flex items-center gap-3">
              {session.status === 'active' && (
                <>
                  {sessionState?.session_status === 'waiting' && (
                    <button
                      onClick={trainerActions.startSession}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Play className="h-4 w-4" />
                      Démarrer
                    </button>
                  )}
                  {sessionState?.session_status === 'live' && (
                    <>
                      <button
                        onClick={trainerActions.pauseSession}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                      >
                        <Coffee className="h-4 w-4" />
                        Pause
                      </button>
                      <button
                        onClick={() => setShowMessagePanel(!showMessagePanel)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <Send className="h-4 w-4" />
                        Message
                      </button>
                    </>
                  )}
                  {sessionState?.session_status === 'break' && (
                    <button
                      onClick={trainerActions.resumeSession}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Play className="h-4 w-4" />
                      Reprendre
                    </button>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-full">
                    <Radio className="h-4 w-4 animate-pulse" />
                    <span className="text-sm font-medium">
                      {activeCount}/{learners.length} en ligne
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Barre d'état temps réel */}
        {session.status === 'active' && sessionState && (
          <SessionStateBar
            sessionState={sessionState}
            activeCount={activeCount}
            totalCount={learners.length}
            helpRequestsCount={helpRequests}
          />
        )}

        {/* Panel message */}
        {showMessagePanel && (
          <div className="max-w-7xl mx-auto px-4 py-3 bg-blue-50 border-t">
            <div className="flex items-center gap-3">
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as any)}
                className="px-3 py-2 border rounded-lg bg-white"
              >
                <option value="info">Info</option>
                <option value="warning">Attention</option>
                <option value="success">Succès</option>
                <option value="action">Action</option>
              </select>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Message aux apprenants..."
                className="flex-1 px-4 py-2 border rounded-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Envoyer
              </button>
              <button
                onClick={() => setShowMessagePanel(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            sessionState={sessionState}
            members={members}
            learnerProgress={learnerProgress}
            presence={presence}
            recentEvents={recentEvents}
            helpRequests={helpRequests}
          />
        )}

        {activeTab === 'learners' && (
          <LearnersTab
            sessionId={sessionId}
            members={members}
            learnerProgress={learnerProgress}
            presence={presence}
          />
        )}

        {activeTab === 'gradebook' && (
          <GradebookTab sessionId={sessionId} />
        )}

        {activeTab === 'projects' && (
          <ProjectsTab sessionId={sessionId} />
        )}

        {activeTab === 'quiz' && (
          <QuizTab sessionId={sessionId} />
        )}

        {activeTab === 'time' && (
          <TimeTrackingTab sessionId={sessionId} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab sessionId={sessionId} courseId={session.course_id} />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TAB COMPONENTS
// =============================================================================

function DashboardTab({
  sessionState,
  members,
  learnerProgress,
  presence,
  recentEvents,
  helpRequests
}: any) {
  const learners = members.filter((m: any) => m.role === 'learner');
  const activeCount = learners.filter((m: any) => presence.get(m.user_id)?.is_online).length;
  
  // Calcul des stats
  const completedItems = Array.from(learnerProgress.values()).reduce(
    (sum: number, p: any) => sum + (p.items_completed || 0), 0
  );
  const avgProgress = learners.length > 0
    ? Array.from(learnerProgress.values()).reduce(
        (sum: number, p: any) => sum + ((p.items_completed || 0) / Math.max(1, p.items_viewed || 1)), 0
      ) / learners.length * 100
    : 0;

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* KPIs */}
      <div className="col-span-12 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="text-3xl font-bold text-blue-600">{learners.length}</div>
          <div className="text-sm text-gray-500 mt-1">Apprenants inscrits</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="text-3xl font-bold text-green-600">{activeCount}</div>
          <div className="text-sm text-gray-500 mt-1">En ligne maintenant</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="text-3xl font-bold text-purple-600">{avgProgress.toFixed(0)}%</div>
          <div className="text-sm text-gray-500 mt-1">Progression moyenne</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <div className={`text-3xl font-bold ${helpRequests > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {helpRequests}
          </div>
          <div className="text-sm text-gray-500 mt-1">Demandes d'aide</div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="col-span-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Activité récente</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentEvents.slice(0, 15).map((event: any) => (
              <div key={event.id} className="flex items-start gap-3 text-sm">
                <span className="text-gray-400 text-xs whitespace-nowrap w-16">
                  {new Date(event.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-gray-600">{getEventLabel(event.event_type)}</span>
              </div>
            ))}
            {recentEvents.length === 0 && (
              <p className="text-gray-400 text-center py-8">Aucune activité récente</p>
            )}
          </div>
        </div>
      </div>

      {/* Demandes d'aide */}
      <div className="col-span-4">
        {helpRequests > 0 ? (
          <div className="bg-red-50 rounded-xl shadow p-6 border border-red-200">
            <h3 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Demandes d'aide ({helpRequests})
            </h3>
            <div className="space-y-2">
              {Array.from(learnerProgress.values())
                .filter((p: any) => p.relative_status === 'stuck')
                .map((p: any) => {
                  const member = members.find((m: any) => m.user_id === p.user_id);
                  return (
                    <div key={p.user_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="font-medium text-sm">
                        {member?.display_name || member?.profile?.full_name || 'Apprenant'}
                      </span>
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        Contacter
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">État du groupe</h3>
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-green-600 font-medium">Tout va bien !</p>
              <p className="text-gray-500 text-sm mt-1">Aucune demande d'aide en attente</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LearnersTab({ sessionId, members, learnerProgress, presence }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [adding, setAdding] = useState(false);

  const existingMemberIds = members.map((m: any) => m.user_id);

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      // Charger tous les utilisateurs qui ne sont pas déjà membres
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');

      if (!error && data) {
        // Filtrer les membres existants
        const filtered = data.filter(u => !existingMemberIds.includes(u.id));
        setAvailableUsers(filtered);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenModal = () => {
    setShowAddModal(true);
    setSelectedUsers([]);
    setSearchQuery('');
    loadAvailableUsers();
  };

  const handleAddLearners = async () => {
    if (selectedUsers.length === 0) return;
    setAdding(true);

    try {
      // Insérer les nouveaux membres
      const membersToAdd = selectedUsers.map(userId => ({
        session_id: sessionId,
        user_id: userId,
        role: 'learner',
        status: 'enrolled'
      }));

      const { error } = await supabase
        .from('session_members')
        .insert(membersToAdd);

      if (error) throw error;

      // Fermer le modal et réinitialiser
      setShowAddModal(false);
      setSelectedUsers([]);
      
      // Rafraîchir la page pour voir les nouveaux apprenants
      window.location.reload();
    } catch (err) {
      console.error('Error adding learners:', err);
      alert('Erreur lors de l\'ajout des apprenants');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveLearner = async (memberId: string, userName: string) => {
    if (!confirm(`Retirer ${userName} de cette session ?`)) return;

    try {
      const { error } = await supabase
        .from('session_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      window.location.reload();
    } catch (err) {
      console.error('Error removing learner:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = availableUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const learners = members.filter((m: any) => m.role === 'learner');

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Apprenants inscrits</h2>
          <p className="text-sm text-gray-500">{learners.length} apprenant(s) dans cette session</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-5 w-5" />
          Ajouter des apprenants
        </button>
      </div>

      {/* Liste des apprenants avec option de suppression */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-medium text-gray-900">
            Progression des apprenants
          </h3>
        </div>

        <div className="divide-y">
          {learners.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="mb-4">Aucun apprenant inscrit</p>
              <button
                onClick={handleOpenModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ajouter des apprenants
              </button>
            </div>
          ) : (
            learners.map((member: any) => {
              const lProgress = learnerProgress.get(member.user_id);
              const lPresence = presence.get(member.user_id);
              const isOnline = lPresence?.is_online ?? false;

              return (
                <div
                  key={member.id}
                  className="p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar et présence */}
                    <div className="relative">
                      {member.avatar_url || member.profile?.avatar_url ? (
                        <img
                          src={member.avatar_url || member.profile?.avatar_url || ''}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1">
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      </div>
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {member.display_name || member.profile?.full_name || 'Anonyme'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isOnline ? 'En ligne' : 'Hors ligne'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{lProgress?.items_completed || 0} items complétés</span>
                        {lProgress?.overall_score !== null && lProgress?.overall_score !== undefined && (
                          <span className="font-medium">{lProgress.overall_score.toFixed(0)}%</span>
                        )}
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="w-32">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, ((lProgress?.items_completed || 0) / Math.max(1, lProgress?.items_viewed || 1)) * 100)}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Bouton supprimer */}
                    <button
                      onClick={() => handleRemoveLearner(member.id, member.display_name || member.profile?.full_name || 'cet apprenant')}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Retirer de la session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal d'ajout d'apprenants */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Ajouter des apprenants</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Recherche */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingUsers ? (
                <div className="text-center py-8 text-gray-500">
                  Chargement des utilisateurs...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'Aucun utilisateur trouvé' : 'Tous les utilisateurs sont déjà inscrits'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map(user => (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.includes(user.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {user.full_name || 'Utilisateur sans nom'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({user.role})
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {selectedUsers.length} utilisateur(s) sélectionné(s)
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddLearners}
                    disabled={selectedUsers.length === 0 || adding}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {adding ? (
                      <>Ajout en cours...</>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Ajouter ({selectedUsers.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GradebookTab({ sessionId }: { sessionId: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Carnet de notes</h3>
        <Link
          to={`/trainer/session/${sessionId}/gradebook`}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Ouvrir en plein écran →
        </Link>
      </div>
      <p className="text-gray-500 text-center py-12">
        Le carnet de notes détaillé est accessible via le lien ci-dessus.
      </p>
    </div>
  );
}

function ProjectsTab({ sessionId }: { sessionId: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Restitutions de projet</h3>
          <p className="text-sm text-gray-500 mt-1">Créez et évaluez les projets des apprenants</p>
        </div>
        <Link
          to={`/trainer/session/${sessionId}/projects`}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <ClipboardCheck className="h-4 w-4" />
          Gérer les projets
        </Link>
      </div>
      <div className="border rounded-lg p-8 text-center bg-purple-50">
        <ClipboardCheck className="h-16 w-16 mx-auto text-purple-300 mb-4" />
        <h4 className="font-medium text-gray-900 mb-2">Évaluez les projets avec des étoiles</h4>
        <p className="text-gray-500 text-sm mb-4">
          Créez une restitution de projet, définissez vos critères d'évaluation et notez chaque élève avec des étoiles (1-5).
          La note sur 20 est calculée automatiquement.
        </p>
        <div className="flex justify-center gap-1 text-yellow-400 mb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} className="h-8 w-8 fill-current" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <Link
          to={`/trainer/session/${sessionId}/projects`}
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
        >
          Accéder aux restitutions →
        </Link>
      </div>
    </div>
  );
}

function QuizTab({ sessionId }: { sessionId: string }) {
  const { user } = useAuth();
  const [quizResponses, setQuizResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizTypeFilter, setQuizTypeFilter] = useState<string>('introduction_python');
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Charger les réponses initiales
  useEffect(() => {
    loadResponses();
  }, [sessionId, quizTypeFilter]);

  // Configurer le canal temps réel
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`quiz-responses:${sessionId}`, {
      config: { broadcast: { self: false } }
    });

    // Écouter les mises à jour de réponses
    channel.on('broadcast', { event: 'quiz_response_updated' }, (payload) => {
      loadResponses(); // Recharger les réponses
    });

    // Écouter les changements dans la table
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_responses'
    }, () => {
      loadResponses();
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  const loadResponses = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);

      // Récupérer les membres de la session
      const { data: sessionMembers } = await supabase
        .from('session_members')
        .select('user_id')
        .eq('session_id', sessionId)
        .eq('role', 'learner');

      if (!sessionMembers || sessionMembers.length === 0) {
        setQuizResponses([]);
        setLoading(false);
        return;
      }

      const userIds = sessionMembers.map(m => m.user_id);

      // Récupérer les réponses
      const { data, error } = await supabase
        .from('user_responses')
        .select(`
          *,
          profiles (
            id,
            full_name,
            role
          )
        `)
        .in('user_id', userIds)
        .eq('quiz_type', quizTypeFilter)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setQuizResponses((data || []) as any[]);
    } catch (error) {
      console.error('Erreur lors du chargement des réponses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionStats = () => {
    const total = quizResponses.length;
    const completed = quizResponses.filter(r => {
      const responses = r.responses || {};
      // Vérifier si toutes les questions ont des réponses (on suppose 4 questions pour le quiz Python)
      return Object.keys(responses).length >= 3 && 
             Object.values(responses).every((v: any) => v && v.trim().length > 0);
    }).length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 text-xl mb-2">Suivi des quiz en temps réel</h3>
            <p className="text-sm text-gray-600">
              Suivez l'évolution du remplissage des quiz par vos apprenants
            </p>
          </div>
          <select
            value={quizTypeFilter}
            onChange={(e) => setQuizTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="introduction_python">Quiz Python - Module 0</option>
            <option value="introduction_big_data">Quiz Big Data</option>
            <option value="all">Tous les quiz</option>
          </select>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">Total de réponses</div>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">Quiz complétés</div>
            <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-600 mb-1">Taux de complétion</div>
            <div className="text-2xl font-bold text-purple-900">{stats.percentage}%</div>
          </div>
        </div>

        {/* Liste des réponses */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des réponses...</p>
          </div>
        ) : quizResponses.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Aucune réponse pour le moment</p>
            <p className="text-sm text-gray-400">
              Les réponses apparaîtront ici en temps réel lorsque les apprenants commenceront à remplir le quiz.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizResponses.map((response) => {
              const responses = response.responses || {};
              const answeredCount = Object.keys(responses).filter(k => responses[k]?.trim().length > 0).length;
              const totalQuestions = 4; // Nombre de questions dans le quiz Python
              const isComplete = answeredCount === totalQuestions;

              return (
                <div
                  key={response.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedResponse(expandedResponse === response.id ? null : response.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <h4 className="text-lg font-semibold text-gray-900">
                            {response.profiles?.full_name || 'Utilisateur anonyme'}
                          </h4>
                          {isComplete && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              ✓ Complété
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(response.updated_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {answeredCount}/{totalQuestions} questions
                            </span>
                          </div>
                        </div>
                      </div>
                      <button>
                        {expandedResponse === response.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedResponse === response.id && (
                    <div className="border-t border-gray-200 p-6 space-y-4">
                      {Object.entries(responses).map(([questionId, answer]: [string, any]) => (
                        <div key={questionId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">
                            Question: {questionId}
                          </h5>
                          <p className="text-gray-800 whitespace-pre-wrap">
                            {answer || <span className="text-gray-400 italic">Pas encore répondu</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Autres actions</h4>
        <Link
          to={`/trainer/sessions/${sessionId}/quiz-responses`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Voir toutes les réponses aux quiz
        </Link>
      </div>
    </div>
  );
}

function TimeTrackingTab({ sessionId }: { sessionId: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Temps passé</h3>
        <Link
          to={`/trainer/sessions/${sessionId}/time-tracking`}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Voir le détail →
        </Link>
      </div>
      <p className="text-gray-500 text-center py-12">
        Le suivi du temps détaillé est accessible via le lien ci-dessus.
      </p>
    </div>
  );
}

function DocumentsTab({ sessionId, courseId }: { sessionId: string; courseId: string }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 text-xl mb-2">Suivi des soumissions</h3>
            <p className="text-sm text-gray-600">
              Suivez quels apprenants ont soumis les documents remplissables (questionnaires, formulaires, etc.)
            </p>
          </div>
        </div>
      </div>
      
      <FillableDocumentsSubmissionsTracker 
        sessionId={sessionId}
        courseId={courseId}
      />
    </div>
  );
}

// Helper
function getEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    session_started: 'Session démarrée',
    session_paused: 'Session en pause',
    session_resumed: 'Session reprise',
    session_ended: 'Session terminée',
    learner_joined: 'Un apprenant a rejoint',
    learner_left: 'Un apprenant est parti',
    item_completed: 'Item complété',
    item_started: 'Item démarré',
    help_requested: 'Demande d\'aide',
    help_resolved: 'Aide résolue',
    module_activated: 'Module activé',
    item_activated: 'Item activé',
    trainer_message: 'Message du formateur'
  };
  return labels[eventType] || eventType;
}
