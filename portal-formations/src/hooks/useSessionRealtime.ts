import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import type {
  SessionState,
  SessionMember,
  LearnerProgress,
  SessionEvent,
  SessionPresence,
  MemberRole,
  SessionStatus,
  LearnerRelativeStatus
} from '../types/sessions';

interface UseSessionRealtimeOptions {
  sessionId: string;
  autoJoin?: boolean;
}

interface UseSessionRealtimeReturn {
  // État
  sessionState: SessionState | null;
  members: SessionMember[];
  learnerProgress: Map<string, LearnerProgress>;
  recentEvents: SessionEvent[];
  presence: Map<string, SessionPresence>;
  myProgress: LearnerProgress | null;
  myRole: MemberRole | null;
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions formateur
  trainerActions: {
    startSession: () => Promise<void>;
    pauseSession: () => Promise<void>;
    resumeSession: () => Promise<void>;
    endSession: () => Promise<void>;
    setCurrentModule: (moduleId: string) => Promise<void>;
    setCurrentItem: (itemId: string) => Promise<void>;
    unlockModule: (moduleId: string) => Promise<void>;
    unlockItem: (itemId: string) => Promise<void>;
    sendMessage: (message: string, type: 'info' | 'warning' | 'success' | 'action') => Promise<void>;
    clearMessage: () => Promise<void>;
    setSessionMode: (mode: 'exercise' | 'quiz_live' | 'discussion' | 'live') => Promise<void>;
  };

  // Actions apprenant
  learnerActions: {
    updateProgress: (data: Partial<LearnerProgress>) => Promise<void>;
    markItemViewed: (itemId: string) => Promise<void>;
    markItemCompleted: (itemId: string) => Promise<void>;
    requestHelp: (message?: string) => Promise<void>;
    cancelHelpRequest: () => Promise<void>;
    sendHeartbeat: () => Promise<void>;
  };

  // Rafraîchissement
  refresh: () => Promise<void>;
}

export function useSessionRealtime({
  sessionId,
  autoJoin = true
}: UseSessionRealtimeOptions): UseSessionRealtimeReturn {
  const { user, profile } = useAuth();

  // État
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [learnerProgress, setLearnerProgress] = useState<Map<string, LearnerProgress>>(new Map());
  const [recentEvents, setRecentEvents] = useState<SessionEvent[]>([]);
  const [presence, setPresence] = useState<Map<string, SessionPresence>>(new Map());
  const [myRole, setMyRole] = useState<MemberRole | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les données initiales
  const loadInitialData = useCallback(async () => {
    if (!sessionId || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Charger l'état de la session
      const { data: stateData, error: stateError } = await supabase
        .from('session_state')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (stateError && stateError.code !== 'PGRST116') {
        throw stateError;
      }
      setSessionState(stateData);

      // Charger les membres
      const { data: membersData, error: membersError } = await supabase
        .from('session_members')
        .select(`
          *,
          profile:profiles(full_name, avatar_url)
        `)
        .eq('session_id', sessionId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Trouver mon rôle
      const myMember = membersData?.find(m => m.user_id === user.id);
      setMyRole(myMember?.role || null);

      // Charger la progression des apprenants
      const { data: progressData, error: progressError } = await supabase
        .from('learner_progress')
        .select('*')
        .eq('session_id', sessionId);

      if (progressError) throw progressError;
      const progressMap = new Map<string, LearnerProgress>();
      progressData?.forEach(p => progressMap.set(p.user_id, p));
      setLearnerProgress(progressMap);

      // Charger les événements récents
      const { data: eventsData, error: eventsError } = await supabase
        .from('session_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;
      setRecentEvents(eventsData || []);

    } catch (err) {
      console.error('Error loading session data:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, user]);

  // Configurer les abonnements temps réel
  useEffect(() => {
    if (!sessionId || !user) return;

    loadInitialData();

    // Créer le channel Supabase
    const channel = supabase.channel(`session:${sessionId}`, {
      config: { broadcast: { self: true } }
    });

    // Écouter les changements de session_state
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'session_state',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        setSessionState(payload.new as SessionState);
      }
    });

    // Écouter les changements de membres
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'session_members',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setMembers(prev => [...prev, payload.new as SessionMember]);
      } else if (payload.eventType === 'UPDATE') {
        setMembers(prev => prev.map(m => 
          m.id === (payload.new as SessionMember).id ? payload.new as SessionMember : m
        ));
      } else if (payload.eventType === 'DELETE') {
        setMembers(prev => prev.filter(m => m.id !== (payload.old as SessionMember).id));
      }
    });

    // Écouter les changements de progression
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'learner_progress',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const progress = payload.new as LearnerProgress;
        setLearnerProgress(prev => {
          const updated = new Map(prev);
          updated.set(progress.user_id, progress);
          return updated;
        });
      }
    });

    // Écouter les nouveaux événements
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'session_events',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      setRecentEvents(prev => [payload.new as SessionEvent, ...prev].slice(0, 50));
    });

    // Écouter la présence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const presenceMap = new Map<string, SessionPresence>();
      
      Object.entries(state).forEach(([_key, presences]) => {
        (presences as any[]).forEach(p => {
          if (p.user_id) {
            presenceMap.set(p.user_id, {
              id: p.user_id,
              session_id: sessionId,
              user_id: p.user_id,
              is_online: true,
              current_page: p.current_page,
              last_activity: p.last_activity,
              connected_at: p.connected_at || new Date().toISOString(),
              last_ping_at: new Date().toISOString()
            });
          }
        });
      });
      
      setPresence(presenceMap);
    });

    // Souscrire
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsOnline(true);
        
        // Rejoindre la présence
        if (autoJoin && user) {
          await channel.track({
            user_id: user.id,
            display_name: profile?.full_name || 'Anonyme',
            connected_at: new Date().toISOString(),
            current_page: window.location.pathname
          });
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsOnline(false);
      }
    });

    channelRef.current = channel;

    // Heartbeat toutes les 30 secondes
    heartbeatIntervalRef.current = setInterval(() => {
      if (user && myRole === 'learner') {
        supabase
          .from('learner_progress')
          .update({ last_heartbeat_at: new Date().toISOString() })
          .eq('session_id', sessionId)
          .eq('user_id', user.id);
      }
    }, 30000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      channel.unsubscribe();
    };
  }, [sessionId, user, autoJoin, profile, loadInitialData, myRole]);

  // Actions formateur
  const trainerActions = {
    startSession: async () => {
      await supabase
        .from('session_state')
        .update({
          session_status: 'live' as SessionStatus,
          started_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('session_id', sessionId);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: user?.id,
        event_type: 'session_started',
        payload: {}
      });
    },

    pauseSession: async () => {
      await supabase
        .from('session_state')
        .update({
          session_status: 'break' as SessionStatus,
          paused_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('session_id', sessionId);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: user?.id,
        event_type: 'session_paused',
        payload: {}
      });
    },

    resumeSession: async () => {
      await supabase
        .from('session_state')
        .update({
          session_status: 'live' as SessionStatus,
          paused_at: null,
          updated_by: user?.id
        })
        .eq('session_id', sessionId);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: user?.id,
        event_type: 'session_resumed',
        payload: {}
      });
    },

    endSession: async () => {
      await supabase
        .from('session_state')
        .update({
          session_status: 'completed' as SessionStatus,
          updated_by: user?.id
        })
        .eq('session_id', sessionId);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: user?.id,
        event_type: 'session_ended',
        payload: {}
      });
    },

    setCurrentModule: async (moduleId: string) => {
      await supabase
        .from('session_state')
        .update({
          current_module_id: moduleId,
          updated_by: user?.id
        })
        .eq('session_id', sessionId);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: user?.id,
        event_type: 'module_activated',
        payload: { module_id: moduleId }
      });
    },

    setCurrentItem: async (itemId: string) => {
      await supabase
        .from('session_state')
        .update({
          current_item_id: itemId,
          updated_by: user?.id
        })
        .eq('session_id', sessionId);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: user?.id,
        event_type: 'item_activated',
        payload: { item_id: itemId }
      });
    },

    unlockModule: async (moduleId: string) => {
      const currentUnlocked = sessionState?.unlocked_modules || [];
      if (!currentUnlocked.includes(moduleId)) {
        await supabase
          .from('session_state')
          .update({
            unlocked_modules: [...currentUnlocked, moduleId],
            updated_by: user?.id
          })
          .eq('session_id', sessionId);

        await supabase.from('session_events').insert({
          session_id: sessionId,
          user_id: user?.id,
          event_type: 'module_unlocked',
          payload: { module_id: moduleId }
        });
      }
    },

    unlockItem: async (itemId: string) => {
      const currentUnlocked = sessionState?.unlocked_items || [];
      if (!currentUnlocked.includes(itemId)) {
        await supabase
          .from('session_state')
          .update({
            unlocked_items: [...currentUnlocked, itemId],
            updated_by: user?.id
          })
          .eq('session_id', sessionId);

        await supabase.from('session_events').insert({
          session_id: sessionId,
          user_id: user?.id,
          event_type: 'item_unlocked',
          payload: { item_id: itemId }
        });
      }
    },

    sendMessage: async (message: string, type: 'info' | 'warning' | 'success' | 'action') => {
      await supabase
        .from('session_state')
        .update({
          trainer_message: message,
          trainer_message_type: type,
          trainer_message_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('session_id', sessionId);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: user?.id,
        event_type: 'trainer_message',
        payload: { message, type }
      });
    },

    clearMessage: async () => {
      await supabase
        .from('session_state')
        .update({
          trainer_message: null,
          trainer_message_type: null,
          trainer_message_at: null,
          updated_by: user?.id
        })
        .eq('session_id', sessionId);
    },

    setSessionMode: async (mode: 'exercise' | 'quiz_live' | 'discussion' | 'live') => {
      await supabase
        .from('session_state')
        .update({
          session_status: mode as SessionStatus,
          updated_by: user?.id
        })
        .eq('session_id', sessionId);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: user?.id,
        event_type: `${mode === 'live' ? 'session_resumed' : `${mode}_started`}`,
        payload: { mode }
      });
    }
  };

  // Actions apprenant
  const learnerActions = {
    updateProgress: async (data: Partial<LearnerProgress>) => {
      if (!user) return;
      
      await supabase
        .from('learner_progress')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);
    },

    markItemViewed: async (itemId: string) => {
      if (!user) return;
      
      const myProgress = learnerProgress.get(user.id);
      const viewedItems = myProgress?.viewed_items || [];
      
      if (!viewedItems.includes(itemId)) {
        await supabase
          .from('learner_progress')
          .update({
            viewed_items: [...viewedItems, itemId],
            items_viewed: viewedItems.length + 1,
            current_item_id: itemId,
            last_heartbeat_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .eq('user_id', user.id);

        await supabase.from('session_events').insert({
          session_id: sessionId,
          user_id: user.id,
          event_type: 'item_started',
          payload: { item_id: itemId }
        });
      }
    },

    markItemCompleted: async (itemId: string) => {
      if (!user) return;
      
      const myProgress = learnerProgress.get(user.id);
      const completedItems = myProgress?.completed_items || [];
      
      if (!completedItems.includes(itemId)) {
        await supabase
          .from('learner_progress')
          .update({
            completed_items: [...completedItems, itemId],
            items_completed: completedItems.length + 1,
            last_heartbeat_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .eq('user_id', user.id);

        await supabase.from('session_events').insert({
          session_id: sessionId,
          user_id: user.id,
          event_type: 'item_completed',
          payload: { item_id: itemId }
        });
      }
    },

    requestHelp: async (message?: string) => {
      if (!user) return;
      
      await supabase
        .from('learner_progress')
        .update({
          relative_status: 'stuck' as LearnerRelativeStatus
        })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: user.id,
        event_type: 'help_requested',
        payload: { message }
      });
    },

    cancelHelpRequest: async () => {
      if (!user) return;
      
      await supabase
        .from('learner_progress')
        .update({
          relative_status: 'on_track' as LearnerRelativeStatus
        })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      await supabase.from('session_events').insert({
        session_id: sessionId,
        user_id: user.id,
        event_type: 'help_resolved',
        payload: {}
      });
    },

    sendHeartbeat: async () => {
      if (!user) return;
      
      await supabase
        .from('learner_progress')
        .update({
          last_heartbeat_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);
    }
  };

  // Ma progression
  const myProgress = user ? learnerProgress.get(user.id) || null : null;

  return {
    sessionState,
    members,
    learnerProgress,
    recentEvents,
    presence,
    myProgress,
    myRole,
    isOnline,
    isLoading,
    error,
    trainerActions,
    learnerActions,
    refresh: loadInitialData
  };
}
