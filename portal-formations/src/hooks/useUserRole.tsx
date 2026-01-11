/**
 * Hook pour récupérer le rôle unifié d'un utilisateur
 * Utilise getUserRole() pour garantir une détermination cohérente du rôle
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { getUserRole, type UnifiedRole, type UserRoleContext } from '../lib/queries/userRole';

export function useUserRole() {
  const { user, profile } = useAuth();
  const [roleContext, setRoleContext] = useState<UserRoleContext | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Utiliser des refs pour éviter les boucles de dépendances
  const userIdRef = useRef<string | undefined>(user?.id);
  const profileRoleRef = useRef<string | undefined>(profile?.role);
  const hasLoadedRef = useRef(false);

  // Mettre à jour les refs quand les valeurs changent
  useEffect(() => {
    userIdRef.current = user?.id;
    profileRoleRef.current = profile?.role;
  }, [user?.id, profile?.role]);

  const fetchRole = useCallback(async () => {
    const userId = userIdRef.current;
    const profileRole = profileRoleRef.current;
    
    // Pas d'utilisateur = pas de rôle, terminer immédiatement
    if (!userId) {
      setRoleContext(null);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    // Si on a déjà le profil en cache, l'utiliser directement sans requête
    if (profileRole) {
      console.log('✅ useUserRole - Utilisation du profil en cache, role:', profileRole);
      const roleFromProfile = profileRole === 'admin' ? 'admin' :
                              profileRole === 'instructor' ? 'trainer' :
                              profileRole === 'student' ? 'student' : 'student';
      setRoleContext({
        role: roleFromProfile as UnifiedRole,
        source: profileRole === 'admin' ? 'profiles_admin' : 'profiles_default',
        orgId: null,
      });
      setLoading(false);
      hasLoadedRef.current = true;
      return;
    }

    // IMPORTANT: Ne pas faire de requête supplémentaire si le profil n'est pas chargé
    // Cela évite les blocages quand Supabase ne répond pas
    // Utiliser un rôle par défaut et laisser l'application fonctionner
    console.warn('⚠️ useUserRole - Profil non disponible, utilisation du rôle par défaut (student)');
    setRoleContext({
      role: 'student',
      source: 'profiles_default',
      orgId: null,
    });
    setLoading(false);
    
    // Optionnel: essayer de charger le rôle en arrière-plan avec timeout
    // mais ne pas bloquer l'interface - et seulement si pas déjà fait
    if (userId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const rolePromise = getUserRole(userId, undefined).catch(() => null);
      
      Promise.race([rolePromise, timeoutPromise]).then((context) => {
        if (context && context.role) {
          console.log('🔍 useUserRole - Rôle chargé en arrière-plan:', context);
          setRoleContext(context);
        }
      });
    }
  }, []); // Pas de dépendances - utilise les refs

  // Effect pour charger le rôle quand user.id ou profile.role change
  useEffect(() => {
    // Réinitialiser hasLoadedRef si l'utilisateur change
    if (user?.id !== userIdRef.current) {
      hasLoadedRef.current = false;
    }
    
    fetchRole();
  }, [user?.id, profile?.role, fetchRole]); // Dépendances stables

  // Retourner le rôle unifié avec des helpers
  const role: UnifiedRole = roleContext?.role ?? null;
  const isAdmin = role === 'admin';
  const isTrainer = role === 'trainer' || role === 'instructor';
  const isStudent = role === 'student';
  const isAuditor = role === 'auditor';

  // Helper pour obtenir le label du rôle
  const roleLabel = 
    isAdmin ? 'Administrateur' :
    isTrainer ? 'Formateur' :
    isAuditor ? 'Auditeur' :
    'Étudiant';

  return {
    role,
    roleContext,
    isAdmin,
    isTrainer,
    isStudent,
    isAuditor,
    roleLabel,
    loading,
    // Fallback vers profile.role si roleContext n'est pas encore chargé
    effectiveRole: role ?? (profile?.role as UnifiedRole) ?? null,
    // Fonction pour forcer le rafraîchissement du rôle
    refreshRole: fetchRole,
  };
}

