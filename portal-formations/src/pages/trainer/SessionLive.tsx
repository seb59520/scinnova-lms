import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSessionRealtime } from '../../hooks/useSessionRealtime';
import { SessionStateBar } from '../../components/session/SessionStateBar';
import { LearnersProgressList } from '../../components/session/LearnersProgressList';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import {
  Play, Pause, Square, Coffee, PenTool, MessageSquare,
  Send, X, ChevronRight, BarChart3, BookOpen, HelpCircle,
  Settings, Users, Clock, AlertTriangle
} from 'lucide-react';

export function SessionLive() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [messageInput, setMessageInput] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'success' | 'action'>('info');
  const [showMessagePanel, setShowMessagePanel] = useState(false);

  const {
    sessionState,
    members,
    learnerProgress,
    presence,
    recentEvents,
    isLoading,
    error,
    trainerActions
  } = useSessionRealtime({
    sessionId: sessionId || '',
    autoJoin: true
  });

  if (!sessionId) {
    return <div className="p-8 text-center">Session ID manquant</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement de la session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />

      {/* Barre d'état de la session */}
      <SessionStateBar
        sessionState={sessionState}
        activeCount={activeCount}
        totalCount={learners.length}
        helpRequestsCount={helpRequests}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Contrôles principaux */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Contrôles de session</h2>
            <Link
              to={`/trainer/analytics/${sessionId}`}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <BarChart3 className="h-4 w-4" />
              Voir les analytics
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Boutons de contrôle principaux */}
            {sessionState?.session_status === 'waiting' && (
              <button
                onClick={trainerActions.startSession}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="h-5 w-5" />
                Démarrer la session
              </button>
            )}

            {sessionState?.session_status === 'live' && (
              <>
                <button
                  onClick={trainerActions.pauseSession}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Coffee className="h-5 w-5" />
                  Pause
                </button>
                <button
                  onClick={() => trainerActions.setSessionMode('exercise')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PenTool className="h-5 w-5" />
                  Mode exercice
                </button>
                <button
                  onClick={() => trainerActions.setSessionMode('discussion')}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                  Discussion
                </button>
              </>
            )}

            {sessionState?.session_status === 'break' && (
              <button
                onClick={trainerActions.resumeSession}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="h-5 w-5" />
                Reprendre
              </button>
            )}

            {(sessionState?.session_status === 'exercise' || sessionState?.session_status === 'discussion') && (
              <button
                onClick={() => trainerActions.setSessionMode('live')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="h-5 w-5" />
                Retour au cours
              </button>
            )}

            {sessionState?.session_status !== 'waiting' && sessionState?.session_status !== 'completed' && (
              <button
                onClick={trainerActions.endSession}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="h-5 w-5" />
                Terminer
              </button>
            )}

            {/* Message aux apprenants */}
            <button
              onClick={() => setShowMessagePanel(!showMessagePanel)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-auto"
            >
              <Send className="h-5 w-5" />
              Envoyer un message
            </button>
          </div>

          {/* Panel de message */}
          {showMessagePanel && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 mb-3">
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as any)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="info">Information</option>
                  <option value="warning">Attention</option>
                  <option value="success">Succès</option>
                  <option value="action">Action requise</option>
                </select>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Votre message aux apprenants..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Envoyer
                </button>
                {sessionState?.trainer_message && (
                  <button
                    onClick={trainerActions.clearMessage}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Liste des apprenants */}
          <div className="col-span-8">
            <LearnersProgressList
              members={members}
              progress={learnerProgress}
              presence={presence}
            />
          </div>

          {/* Panneau latéral */}
          <div className="col-span-4 space-y-6">
            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-900 mb-3">Actions rapides</h3>
              <div className="space-y-2">
                <Link
                  to={`/trainer/session/${sessionId}/gradebook`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Carnet de notes
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
                <Link
                  to={`/trainer/session/${sessionId}/quiz`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-purple-600" />
                    Lancer un quiz live
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
                <Link
                  to={`/trainer/session/${sessionId}/documents`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    Documents & émargement
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Événements récents */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-900 mb-3">Activité récente</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentEvents.slice(0, 10).map(event => (
                  <div key={event.id} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-400 text-xs whitespace-nowrap">
                      {new Date(event.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-gray-600">
                      {getEventLabel(event.event_type)}
                    </span>
                  </div>
                ))}
                {recentEvents.length === 0 && (
                  <p className="text-gray-500 text-sm">Aucune activité récente</p>
                )}
              </div>
            </div>

            {/* Demandes d'aide */}
            {helpRequests > 0 && (
              <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
                <h3 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Demandes d'aide ({helpRequests})
                </h3>
                <div className="space-y-2">
                  {Array.from(learnerProgress.values())
                    .filter(p => p.relative_status === 'stuck')
                    .map(p => {
                      const member = members.find(m => m.user_id === p.user_id);
                      return (
                        <div key={p.user_id} className="flex items-center justify-between p-2 bg-white rounded">
                          <span className="text-sm font-medium">
                            {member?.display_name || member?.profile?.full_name || 'Apprenant'}
                          </span>
                          <button className="text-sm text-blue-600 hover:text-blue-800">
                            Aider
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    session_started: 'Session démarrée',
    session_paused: 'Session en pause',
    session_resumed: 'Session reprise',
    session_ended: 'Session terminée',
    learner_joined: 'Un apprenant a rejoint',
    learner_left: 'Un apprenant est parti',
    item_completed: 'Item complété',
    help_requested: 'Demande d\'aide',
    help_resolved: 'Aide résolue',
    module_activated: 'Module activé',
    item_activated: 'Item activé'
  };
  return labels[eventType] || eventType;
}
