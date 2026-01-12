import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { Profile } from '../types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInAsGhost: (accessCode: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider suivant les recommandations officielles de Supabase
 * @see https://supabase.com/docs/guides/auth/quickstarts/react
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Récupère le profil utilisateur depuis la base de données
   */
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Erreur récupération profil:', error.message)
        return null
      }

      return data
    } catch (err) {
      console.error('Exception récupération profil:', err)
      return null
    }
  }, [])

  /**
   * Crée un profil utilisateur s'il n'existe pas (pour OAuth)
   */
  const createProfileIfNeeded = useCallback(async (currentUser: User): Promise<Profile | null> => {
    // Vérifier si le profil existe
    let profileData = await fetchProfile(currentUser.id)
    
    if (profileData) {
      return profileData
    }

    // Créer le profil pour les nouveaux utilisateurs OAuth
    const metadata = currentUser.user_metadata || {}
    const fullName = metadata.full_name || 
                     metadata.name || 
                     currentUser.email?.split('@')[0] || 
                     'Utilisateur'

    try {
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          role: 'student',
          full_name: fullName,
          is_active: true
        }, { onConflict: 'id' })
        .select()
        .single()

      if (error) {
        console.warn('Erreur création profil:', error.message)
        // Réessayer de récupérer (peut-être créé par un trigger)
        return await fetchProfile(currentUser.id)
      }

      return newProfile
    } catch (err) {
      console.error('Exception création profil:', err)
      return await fetchProfile(currentUser.id)
    }
  }, [fetchProfile])

  useEffect(() => {
    let isMounted = true

    /**
     * Initialisation de la session au montage
     * Pattern officiel Supabase : getSession() + onAuthStateChange()
     */
    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.error('Erreur getSession:', error.message)
          setLoading(false)
          return
        }

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          const profileData = await createProfileIfNeeded(currentSession.user)
          if (isMounted) {
            setProfile(profileData)
          }
        }
        
        if (isMounted) {
          setLoading(false)
        }
      } catch (err) {
        console.error('Exception initSession:', err)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initSession()

    /**
     * Écouter les changements d'authentification
     * C'est le seul endroit où on gère les événements auth
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return

        console.log('Auth event:', event)

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          // Charger le profil de manière asynchrone sans bloquer
          const profileData = await createProfileIfNeeded(currentSession.user)
          if (isMounted) {
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [createProfileIfNeeded])

  /**
   * Connexion par email/mot de passe
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  /**
   * Inscription par email/mot de passe
   */
  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    return { error }
  }

  /**
   * Connexion avec Google OAuth
   */
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    return { error }
  }

  /**
   * Génère un nom cartoon aléatoire pour les utilisateurs ghost
   */
  const generateCartoonName = (): string => {
    const adjectives = ['Curieux', 'Agile', 'Rusé', 'Sage', 'Malin', 'Solitaire', 'Savant', 'Joyeux', 'Brave', 'Astucieux']
    const animals = ['Panda', 'Lapin', 'Renard', 'Ours', 'Chat', 'Loup', 'Hibou', 'Dauphin', 'Lion', 'Aigle']
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)]
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${randomAnimal} ${randomAdjective}-${randomSuffix}`
  }

  /**
   * Connexion anonyme avec code ghost
   */
  const signInAsGhost = async (accessCode: string): Promise<{ error: Error | null }> => {
    try {
      // 1. Vérifier le code ghost
      const { data: codeData, error: codeError } = await supabase
        .rpc('use_ghost_code', { code_to_check: accessCode })

      if (codeError || !codeData?.[0]?.is_valid) {
        return { error: new Error(codeData?.[0]?.message || 'Code invalide ou déjà utilisé') }
      }

      // 2. Créer un utilisateur anonyme
      const cartoonName = generateCartoonName()
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            full_name: cartoonName,
            access_code: accessCode,
            is_ghost: true,
          }
        }
      })

      if (authError) {
        return { error: authError }
      }

      if (!authData.user) {
        return { error: new Error('Échec de la création de l\'utilisateur anonyme') }
      }

      // 3. Marquer le code comme utilisé
      try {
        await supabase.rpc('mark_ghost_code_used', {
          code_to_mark: accessCode,
          user_id: authData.user.id
        })
      } catch {
        // Fallback: mise à jour directe
        await supabase
          .from('ghost_codes')
          .update({ 
            is_used: true, 
            used_at: new Date().toISOString(),
            used_by: authData.user!.id 
          })
          .eq('code', accessCode)
      }

      return { error: null }
    } catch (err) {
      console.error('Erreur signInAsGhost:', err)
      return { error: err instanceof Error ? err : new Error('Erreur inconnue') }
    }
  }

  /**
   * Déconnexion
   */
  const signOut = async () => {
    const isGhost = user?.user_metadata?.is_ghost
    const userId = user?.id

    // Réinitialiser l'état local
    setUser(null)
    setProfile(null)
    setSession(null)

    // Déconnecter de Supabase
    await supabase.auth.signOut()

    // Nettoyage des utilisateurs ghost (optionnel)
    if (isGhost && userId) {
      fetch('/api/admin/delete-ghost-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }).catch(() => {})
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  /**
   * Rafraîchir le profil manuellement
   */
  const refreshProfile = async () => {
    if (user?.id) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInAsGhost,
    signOut,
    resetPassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
