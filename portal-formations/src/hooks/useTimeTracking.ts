import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

interface TimeTrackingData {
  totalSeconds: number;
  activeSeconds: number;
  pageViews: number;
}

const TRACKING_INTERVAL = 30000; // Envoyer les données toutes les 30 secondes
const ACTIVE_CHECK_INTERVAL = 1000; // Vérifier l'activité toutes les secondes
const INACTIVE_THRESHOLD = 60000; // 1 minute d'inactivité = inactif

export function useTimeTracking(sessionId?: string, courseId?: string) {
  const { user } = useAuth();
  const location = useLocation();
  const [isActive, setIsActive] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  
  const startTimeRef = useRef<number>(Date.now());
  const lastActiveTimeRef = useRef<number>(Date.now());
  const totalSecondsRef = useRef<number>(0);
  const activeSecondsRef = useRef<number>(0);
  const pageViewsRef = useRef<number>(0);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Détecter si la page est visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Détecter l'activité de l'utilisateur
  useEffect(() => {
    const handleActivity = () => {
      lastActiveTimeRef.current = Date.now();
      if (!isActive) {
        setIsActive(true);
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isActive]);

  // Vérifier périodiquement si l'utilisateur est actif et incrémenter les compteurs
  useEffect(() => {
    activeCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActiveTimeRef.current;
      
      const wasActive = isActive;
      const shouldBeActive = timeSinceLastActivity <= INACTIVE_THRESHOLD && isVisible;
      
      if (shouldBeActive !== wasActive) {
        setIsActive(shouldBeActive);
      }

      // Incrémenter le temps total (temps depuis le dernier reset)
      totalSecondsRef.current = Math.floor((now - startTimeRef.current) / 1000);
      
      // Incrémenter le temps actif seulement si la page est active et visible
      if (shouldBeActive) {
        activeSecondsRef.current += 1;
      }
    }, ACTIVE_CHECK_INTERVAL);

    return () => {
      if (activeCheckIntervalRef.current) {
        clearInterval(activeCheckIntervalRef.current);
      }
    };
  }, [isActive, isVisible]);

  // Compter les vues de page
  useEffect(() => {
    pageViewsRef.current += 1;
  }, [location.pathname]);

  // Envoyer les données périodiquement
  useEffect(() => {
    if (!user?.id) return;

    const sendTrackingData = async () => {
      if (totalSecondsRef.current === 0 && activeSecondsRef.current === 0) {
        return; // Ne pas envoyer si aucune donnée
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Récupérer les données existantes pour aujourd'hui
        // Utiliser une requête qui gère les NULL correctement
        let query = supabase
          .from('user_time_tracking')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today);
        
        if (sessionId) {
          query = query.eq('session_id', sessionId);
        } else {
          query = query.is('session_id', null);
        }
        
        if (courseId) {
          query = query.eq('course_id', courseId);
        } else {
          query = query.is('course_id', null);
        }
        
        const { data: existingDataArray } = await query;
        const existingData = existingDataArray && existingDataArray.length > 0 ? existingDataArray[0] : null;

        const currentTotal = totalSecondsRef.current;
        const currentActive = activeSecondsRef.current;
        const currentPageViews = pageViewsRef.current;

        if (existingData) {
          // Mettre à jour les données existantes
          await supabase
            .from('user_time_tracking')
            .update({
              total_seconds: existingData.total_seconds + currentTotal,
              active_seconds: existingData.active_seconds + currentActive,
              page_views: existingData.page_views + currentPageViews,
              last_activity_at: new Date().toISOString(),
            })
            .eq('id', existingData.id);
        } else {
          // Créer une nouvelle entrée
          await supabase
            .from('user_time_tracking')
            .insert({
              user_id: user.id,
              session_id: sessionId || null,
              course_id: courseId || null,
              date: today,
              total_seconds: currentTotal,
              active_seconds: currentActive,
              page_views: currentPageViews,
              last_activity_at: new Date().toISOString(),
            });
        }

        // Réinitialiser les compteurs après l'envoi
        startTimeRef.current = Date.now();
        totalSecondsRef.current = 0;
        activeSecondsRef.current = 0;
        pageViewsRef.current = 0;
      } catch (error) {
        console.error('Erreur lors de l\'envoi des données de tracking:', error);
      }
    };

    trackingIntervalRef.current = setInterval(sendTrackingData, TRACKING_INTERVAL);

    // Envoyer les données au démontage du composant
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      // Envoyer les données restantes
      sendTrackingData();
    };
  }, [user?.id, sessionId, courseId]);

  return {
    isActive,
    isVisible,
    totalSeconds: totalSecondsRef.current,
    activeSeconds: activeSecondsRef.current,
    pageViews: pageViewsRef.current,
  };
}

