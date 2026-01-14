import React from 'react';
import { 
  User, Clock, TrendingUp, AlertTriangle, CheckCircle,
  ChevronRight, HelpCircle
} from 'lucide-react';
import type { SessionMember, LearnerProgress, SessionPresence } from '../../types/sessions';

interface LearnersProgressListProps {
  members: SessionMember[];
  progress: Map<string, LearnerProgress>;
  presence: Map<string, SessionPresence>;
  onLearnerClick?: (userId: string) => void;
}

export function LearnersProgressList({
  members,
  progress,
  presence,
  onLearnerClick
}: LearnersProgressListProps) {
  const learners = members.filter(m => m.role === 'learner');

  const getStatusBadge = (learnerProgress: LearnerProgress | undefined, isOnline: boolean) => {
    if (!learnerProgress) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
          Non commencé
        </span>
      );
    }

    const status = learnerProgress.relative_status;

    if (status === 'stuck') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1">
          <HelpCircle className="h-3 w-3" />
          Bloqué
        </span>
      );
    }

    if (status === 'behind') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          En retard
        </span>
      );
    }

    if (status === 'ahead') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          En avance
        </span>
      );
    }

    // on_track
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Synchronisé
      </span>
    );
  };

  const getPresenceIndicator = (isOnline: boolean, memberStatus: string) => {
    if (memberStatus === 'dropped') {
      return <div className="w-3 h-3 rounded-full bg-red-500" title="Abandon" />;
    }
    if (memberStatus === 'completed') {
      return <div className="w-3 h-3 rounded-full bg-purple-500" title="Terminé" />;
    }
    if (isOnline) {
      return <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" title="En ligne" />;
    }
    return <div className="w-3 h-3 rounded-full bg-gray-300" title="Hors ligne" />;
  };

  const formatDuration = (duration: string | null) => {
    if (!duration) return '-';
    // Format PostgreSQL interval: "HH:MM:SS"
    const match = duration.match(/(\d+):(\d+):(\d+)/);
    if (!match) return duration;
    const [, hours, minutes] = match;
    if (parseInt(hours) > 0) {
      return `${hours}h${minutes}`;
    }
    return `${minutes}min`;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-medium text-gray-900">
          Apprenants ({learners.length})
        </h3>
      </div>

      <div className="divide-y">
        {learners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucun apprenant inscrit</p>
          </div>
        ) : (
          learners.map(member => {
            const learnerProgress = progress.get(member.user_id);
            const learnerPresence = presence.get(member.user_id);
            const isOnline = learnerPresence?.is_online ?? false;

            return (
              <div
                key={member.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onLearnerClick?.(member.user_id)}
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
                      {getPresenceIndicator(isOnline, member.status)}
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {member.display_name || member.profile?.full_name || 'Anonyme'}
                      </span>
                      {getStatusBadge(learnerProgress, isOnline)}
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {/* Progression */}
                      <span>
                        {learnerProgress?.items_completed || 0} items complétés
                      </span>

                      {/* Temps */}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(learnerProgress?.total_time_spent || null)}
                      </span>

                      {/* Score */}
                      {learnerProgress?.overall_score !== null && learnerProgress?.overall_score !== undefined && (
                        <span className="font-medium">
                          {learnerProgress.overall_score.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="w-32">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          learnerProgress?.relative_status === 'stuck' ? 'bg-red-500' :
                          learnerProgress?.relative_status === 'behind' ? 'bg-orange-500' :
                          learnerProgress?.relative_status === 'ahead' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(100, ((learnerProgress?.items_completed || 0) / Math.max(1, learnerProgress?.items_viewed || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
