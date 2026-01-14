import React from 'react';
import { 
  Play, Pause, Coffee, PenTool, HelpCircle, MessageSquare,
  Users, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import type { SessionState, SessionStatus } from '../../types/sessions';

interface SessionStateBarProps {
  sessionState: SessionState | null;
  activeCount: number;
  totalCount: number;
  helpRequestsCount: number;
  onHelpClick?: () => void;
}

export function SessionStateBar({
  sessionState,
  activeCount,
  totalCount,
  helpRequestsCount,
  onHelpClick
}: SessionStateBarProps) {
  if (!sessionState) return null;

  const getStatusConfig = (status: SessionStatus) => {
    const configs: Record<SessionStatus, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
      waiting: {
        icon: <Clock className="h-5 w-5" />,
        label: 'En attente',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      },
      live: {
        icon: <Play className="h-5 w-5" />,
        label: 'En cours',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      break: {
        icon: <Coffee className="h-5 w-5" />,
        label: 'Pause',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      },
      exercise: {
        icon: <PenTool className="h-5 w-5" />,
        label: 'Exercice',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      quiz_live: {
        icon: <HelpCircle className="h-5 w-5" />,
        label: 'Quiz Live',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      discussion: {
        icon: <MessageSquare className="h-5 w-5" />,
        label: 'Discussion',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100'
      },
      completed: {
        icon: <CheckCircle className="h-5 w-5" />,
        label: 'Terminée',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      }
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(sessionState.session_status);

  // Calculer le temps écoulé
  const getElapsedTime = () => {
    if (!sessionState.started_at) return null;
    
    const start = new Date(sessionState.started_at);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  return (
    <div className={`${statusConfig.bgColor} border-b px-4 py-3`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Statut */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 ${statusConfig.color}`}>
            {statusConfig.icon}
            <span className="font-medium">{statusConfig.label}</span>
          </div>
          
          {sessionState.started_at && (
            <span className="text-sm text-gray-500">
              • Démarré depuis {getElapsedTime()}
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="flex items-center gap-6">
          {/* Participants */}
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-4 w-4" />
            <span className="text-sm">
              <span className="font-medium">{activeCount}</span>
              <span className="text-gray-400">/{totalCount}</span>
              <span className="ml-1">actifs</span>
            </span>
          </div>

          {/* Demandes d'aide */}
          {helpRequestsCount > 0 && (
            <button
              onClick={onHelpClick}
              className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {helpRequestsCount} demande{helpRequestsCount > 1 ? 's' : ''} d'aide
              </span>
            </button>
          )}
        </div>

        {/* Message formateur */}
        {sessionState.trainer_message && (
          <div className={`
            flex items-center gap-2 px-4 py-2 rounded-lg
            ${sessionState.trainer_message_type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              sessionState.trainer_message_type === 'success' ? 'bg-green-100 text-green-800' :
              sessionState.trainer_message_type === 'action' ? 'bg-blue-100 text-blue-800' :
              'bg-white text-gray-800'}
          `}>
            <span className="text-sm">{sessionState.trainer_message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
