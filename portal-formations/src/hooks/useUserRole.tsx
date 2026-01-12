/**
 * Hook pour récupérer le rôle unifié d'un utilisateur
 * Utilise le profil de useAuth pour éviter les appels réseau supplémentaires
 */

import { useMemo } from 'react'
import { useAuth } from './useAuth'

export type UnifiedRole = 'admin' | 'trainer' | 'instructor' | 'student' | 'auditor' | null

export interface UserRoleContext {
  role: UnifiedRole
  source: string
  orgId: string | null
}

export function useUserRole() {
  const { user, profile, loading: authLoading } = useAuth()

  // Calculer le rôle à partir du profil (déjà chargé par useAuth)
  const roleContext = useMemo<UserRoleContext | null>(() => {
    if (!user || !profile?.role) {
      return null
    }

    // Mapper le rôle du profil vers le rôle unifié
    const role: UnifiedRole = 
      profile.role === 'admin' ? 'admin' :
      profile.role === 'instructor' ? 'trainer' :
      profile.role === 'student' ? 'student' :
      profile.role === 'auditor' ? 'auditor' :
      'student'

    return {
      role,
      source: 'profiles',
      orgId: null,
    }
  }, [user, profile?.role])

  // Le loading dépend uniquement de authLoading
  // car le profil est chargé en même temps que l'auth
  const loading = authLoading

  // Helpers pour vérifier les rôles
  const role = roleContext?.role ?? null
  const isAdmin = role === 'admin'
  const isTrainer = role === 'trainer' || role === 'instructor'
  const isStudent = role === 'student'
  const isAuditor = role === 'auditor'

  const roleLabel = 
    isAdmin ? 'Administrateur' :
    isTrainer ? 'Formateur' :
    isAuditor ? 'Auditeur' :
    'Étudiant'

  return {
    role,
    roleContext,
    isAdmin,
    isTrainer,
    isStudent,
    isAuditor,
    roleLabel,
    loading,
    effectiveRole: role ?? (profile?.role as UnifiedRole) ?? null,
    // Pour compatibilité avec l'ancien code
    refreshRole: () => {},
  }
}
