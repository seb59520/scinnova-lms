import React, { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTimeTracking } from '../hooks/useTimeTracking';

export function TimeTrackingProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const params = useParams<{ sessionId?: string; courseId?: string }>();
  
  // Extraire sessionId et courseId de l'URL ou des params
  const sessionId = params.sessionId || new URLSearchParams(location.search).get('session_id') || undefined;
  const courseId = params.courseId || new URLSearchParams(location.search).get('course_id') || undefined;

  // Utiliser le hook de tracking
  useTimeTracking(sessionId, courseId);

  return <>{children}</>;
}



