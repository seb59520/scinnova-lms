import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import type { Notification, NotificationPreferences } from '../types/sessions';

interface UseNotificationsReturn {
  // Données
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  
  // État
  isLoading: boolean;
  error: string | null;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  
  // Push
  isPushSupported: boolean;
  isPushEnabled: boolean;
  enablePush: () => Promise<boolean>;
  disablePush: () => Promise<boolean>;
  
  // Rafraîchissement
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  
  // État
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  
  // Support push
  const isPushSupported = typeof window !== 'undefined' && 
    'Notification' in window && 
    'serviceWorker' in navigator;

  // Charger les données
  const loadData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Charger les notifications
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (notifError) throw notifError;
      setNotifications(notifData || []);
      
      // Charger les préférences
      const { data: prefsData, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (prefsError) throw prefsError;
      setPreferences(prefsData);
      
      // Vérifier l'état du push
      if (isPushSupported) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsPushEnabled(!!subscription);
      }
      
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [user, isPushSupported]);

  // Charger au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Écouter les nouvelles notifications en temps réel
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase.channel(`notifications:${user.id}`);
    
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      const newNotification = payload.new as Notification;
      setNotifications(prev => [newNotification, ...prev]);
      
      // Afficher une notification browser si autorisé
      if (Notification.permission === 'granted' && preferences?.in_app_enabled) {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico'
        });
      }
    });
    
    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      const updated = payload.new as Notification;
      setNotifications(prev => 
        prev.map(n => n.id === updated.id ? updated : n)
      );
    });
    
    channel.on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      const deleted = payload.old as Notification;
      setNotifications(prev => prev.filter(n => n.id !== deleted.id));
    });
    
    channel.subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [user, preferences?.in_app_enabled]);

  // Actions
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId 
        ? { ...n, is_read: true, read_at: new Date().toISOString() } 
        : n
      )
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    if (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
    
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAll = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
    
    setNotifications([]);
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        ...updates,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    
    if (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
    
    setPreferences(prev => prev ? { ...prev, ...updates } : null);
  };

  // Push notifications
  const enablePush = async (): Promise<boolean> => {
    if (!isPushSupported || !user) return false;
    
    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;
      
      // S'abonner au push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
      });
      
      // Sauvegarder en base
      const subscriptionJson = subscription.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh_key: subscriptionJson.keys?.p256dh || '',
          auth_key: subscriptionJson.keys?.auth || '',
          device_type: 'web',
          user_agent: navigator.userAgent,
          is_active: true
        }, { onConflict: 'user_id,endpoint' });
      
      if (error) throw error;
      
      setIsPushEnabled(true);
      return true;
      
    } catch (err) {
      console.error('Error enabling push:', err);
      return false;
    }
  };

  const disablePush = async (): Promise<boolean> => {
    if (!isPushSupported || !user) return false;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Désactiver en base
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('endpoint', subscription.endpoint);
      }
      
      setIsPushEnabled(false);
      return true;
      
    } catch (err) {
      console.error('Error disabling push:', err);
      return false;
    }
  };

  // Compteur non lus
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    isPushSupported,
    isPushEnabled,
    enablePush,
    disablePush,
    refresh: loadData
  };
}
