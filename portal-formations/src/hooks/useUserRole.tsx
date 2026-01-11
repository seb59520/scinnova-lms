/**
 * Hook pour récupérer le rôle unifié d'un utilisateur
 * Utilise getUserRole() pour garantir une détermination cohérente du rôle
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getUserRole, type UnifiedRole, type UserRoleContext } from '../lib/queries/userRole';

export function useUserRole() {
  const { user, profile } = useAuth();
  const [roleContext, setRoleContext] = useState<UserRoleContext | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    // Pas d'utilisateur = pas de rôle, terminer immédiatement
    if (!user?.id) {
      setRoleContext(null);
      setLoading(false);
      return;
    }

    // Si on a déjà le profil en cache, l'utiliser directement sans requête
    if (profile?.role) {
      console.log('✅ useUserRole - Utilisation du profil en cache:', profile);
      const roleFromProfile = profile.role === 'admin' ? 'admin' :
                              profile.role === 'instructor' ? 'trainer' :
                              profile.role === 'student' ? 'student' : 'student';
      setRoleContext({
        role: roleFromProfile as any,
        source: profile.role === 'admin' ? 'profiles_admin' : 'profiles_default',
        orgId: null,
      });
      setLoading(false);
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
    // mais ne pas bloquer l'interface
    if (user?.id) {
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const rolePromise = getUserRole(user.id, profile || undefined).catch(() => null);
      
      Promise.race([rolePromise, timeoutPromise]).then((context) => {
        if (context && context.role) {
          console.log('🔍 useUserRole - Rôle chargé en arrière-plan:', context);
          setRoleContext(context);
        }
      });
    }
  }, [user?.id, profile]); // Re-fetch si l'utilisateur ou le profil change

  useEffect(() => {
    let mounted = true;

    async function loadRole() {
      await fetchRole();
    }

    loadRole();

    return () => {
      mounted = false;
    };
  }, [fetchRole]); // Re-fetch quand fetchRole change (qui dépend de user?.id et profile?.role)

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

