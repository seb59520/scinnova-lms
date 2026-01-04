import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { Profile } from '../types/database'
import { withRetry, withTimeout, isAuthError } from '../lib/supabaseHelpers'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    // Timeout de sécurité pour éviter un blocage infini (optimisé)
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - forcing loading to false')
        setLoading(false)
        // Essayer de récupérer la session depuis le localStorage avant de forcer à null
        try {
          const storedSession = localStorage.getItem('sb-auth-token')
          if (storedSession) {
            const parsed = JSON.parse(storedSession)
            if (parsed?.currentSession) {
              console.log('Found session in localStorage after timeout, using it')
              const session = parsed.currentSession
              setSession(session)
              setUser(session?.user ?? null)
              if (session?.user) {
                fetchProfile(session.user.id)
              }
              return
            }
          }
        } catch (e) {
          console.warn('Could not parse stored session:', e)
        }
        // Si pas de session trouvée, forcer à null
        setProfile(null)
        setUser(null)
        setSession(null)
      }
    }, 8000) // 8 secondes max (optimisé)

    // Récupérer la session initiale avec timeout optimisé
    withRetry(
      () => withTimeout(
        supabase.auth.getSession(),
        5000, // Réduit à 5 secondes
        'Session fetch timeout'
      ),
      { maxRetries: 1, initialDelay: 500, maxDelay: 1000 } // Réduire les retries
    )
      .then((result: any) => {
        if (!mounted) return

        const { data: { session }, error } = result

        if (error) {
          console.error('Error getting session:', error)
          // Si erreur d'auth, nettoyer la session
          if (isAuthError(error)) {
            supabase.auth.signOut().catch(() => {})
            setSession(null)
            setUser(null)
            setProfile(null)
          }
          setLoading(false)
          if (timeoutId) clearTimeout(timeoutId)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          fetchProfile(session.user.id).finally(() => {
            if (mounted && timeoutId) {
              clearTimeout(timeoutId)
            }
          })
        } else {
          setLoading(false)
          if (timeoutId) clearTimeout(timeoutId)
        }
      })
      .catch((error) => {
        console.error('Error in getSession:', error)
        if (mounted) {
          // Si timeout ou erreur réseau, essayer de récupérer depuis localStorage
          if (error.message?.includes('timeout') || error.message?.includes('network') || error.message?.includes('aborted')) {
            console.warn('Session fetch timeout/network error, trying localStorage fallback')
            // Essayer de récupérer la session depuis le localStorage directement
            try {
              const storedSession = localStorage.getItem('sb-auth-token')
              if (storedSession) {
                const parsed = JSON.parse(storedSession)
                if (parsed?.currentSession) {
                  console.log('Found session in localStorage, using it as fallback')
                  const session = parsed.currentSession
                  setSession(session)
                  setUser(session?.user ?? null)
                  if (session?.user) {
                    fetchProfile(session.user.id).finally(() => {
                      setLoading(false)
                      if (timeoutId) clearTimeout(timeoutId)
                    })
                    return // Ne pas continuer, on attend le profil
                  }
                }
              }
            } catch (e) {
              console.warn('Could not parse stored session:', e)
            }
            // Si pas de session dans localStorage, continuer sans session
            console.warn('No session found in localStorage, continuing without session')
            setLoading(false)
          } else {
            // Autre type d'erreur
            setUser(null)
            setSession(null)
            setProfile(null)
            setLoading(false)
          }
          if (timeoutId) clearTimeout(timeoutId)
        }
      })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state changed:', event, session?.user?.id)

      // Gérer le refresh token
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
        if (session?.user) {
          // Rafraîchir le profil après refresh token
          await fetchProfile(session.user.id)
        }
        return
      }

      // Gérer les erreurs de token
      if (event === 'SIGNED_OUT' && session === null && user) {
        console.warn('Session expired or invalid, signing out')
        setUser(null)
        setProfile(null)
        setSession(null)
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.replace('/login')
        }
        return
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Pour les connexions OAuth, s'assurer que le profil est créé
        // Le trigger SQL devrait le faire automatiquement, mais on attend un peu si nécessaire
        if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
          console.log('Google OAuth sign-in detected, fetching profile...')
          // Attendre un court délai pour que le trigger SQL crée le profil
          setTimeout(async () => {
            await fetchProfile(session.user.id)
            // Rediriger vers /app après connexion OAuth si on est sur la page de callback
            if (window.location.pathname === '/' || window.location.pathname.includes('code=')) {
              window.location.replace('/app')
            }
          }, 500)
        } else {
          await fetchProfile(session.user.id)
        }
        
        // Démarrer un intervalle pour vérifier et rafraîchir le token si nécessaire
        if (!refreshIntervalRef.current) {
          refreshIntervalRef.current = setInterval(async () => {
            if (!mounted || isRefreshingRef.current) return
            
            try {
              const { data: { session: currentSession } } = await supabase.auth.getSession()
              if (currentSession) {
                // Vérifier si le token expire bientôt (dans les 5 prochaines minutes)
                const expiresAt = currentSession.expires_at
                if (expiresAt) {
                  const expiresIn = expiresAt - Math.floor(Date.now() / 1000)
                  if (expiresIn < 300 && expiresIn > 0) {
                    // Rafraîchir le token
                    isRefreshingRef.current = true
                    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()
                    if (error) {
                      console.error('Error refreshing session:', error)
                      if (isAuthError(error)) {
                        // Session invalide, déconnecter
                        await supabase.auth.signOut()
                      }
                    } else if (refreshedSession) {
                      console.log('Session refreshed proactively')
                      setSession(refreshedSession)
                    }
                    isRefreshingRef.current = false
                  }
                }
              }
            } catch (error) {
              console.error('Error checking session:', error)
              isRefreshingRef.current = false
            }
          }, 60000) // Vérifier toutes les minutes
        }
      } else {
        setProfile(null)
        setLoading(false)
        // Arrêter l'intervalle de refresh
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
          refreshIntervalRef.current = null
        }
        // Si l'utilisateur se déconnecte et qu'on n'est pas déjà sur la page de login
        if (event === 'SIGNED_OUT' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          // Utiliser replace pour éviter d'ajouter à l'historique
          window.location.replace('/login')
        }
      }
    })

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 [useAuth] Fetching profile for user:', userId)
      
      // Utiliser retry et timeout optimisé
      const result = await withRetry(
        () => withTimeout(
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          5000, // Réduit à 5 secondes pour une réponse plus rapide
          'Profile fetch timeout'
        ),
        { maxRetries: 0, initialDelay: 0 } // Pas de retry pour éviter les attentes
      )
      
      const { data, error } = result || { data: null, error: null }
      
      console.log('🔍 [useAuth] Profile fetch result:', {
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        profileRole: data?.role
      })

      if (error) {
        // Si le profil n'existe pas, ce n'est pas forcément une erreur critique
        if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
          console.warn('Profile not found for user:', userId, '- This is normal for new users or OAuth users')
          // Essayer de créer un profil par défaut (si les permissions le permettent)
          try {
            // Récupérer l'utilisateur depuis l'état ou la session
            const currentUser = user || session?.user
            // Pour OAuth Google, récupérer le nom depuis les métadonnées
            const userMetadata = currentUser?.user_metadata || currentUser?.raw_user_meta_data || {}
            const userName = userMetadata.full_name || 
                           userMetadata.name || 
                           userMetadata.display_name || 
                           currentUser?.email?.split('@')[0] || 
                           'Utilisateur'
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                role: 'student',
                full_name: userName
              })
              .select()
              .single()
            
            if (!createError && newProfile) {
              console.log('Profile created successfully:', newProfile)
              setProfile(newProfile)
              setLoading(false)
              return
            } else if (createError && !createError.message?.includes('duplicate')) {
              console.warn('Could not create profile (may need admin action or trigger):', createError.message)
              // Le trigger SQL devrait créer le profil automatiquement, attendre un peu et réessayer
              setTimeout(async () => {
                const { data: retryProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userId)
                  .maybeSingle()
                if (retryProfile) {
                  console.log('Profile found after retry:', retryProfile)
                  setProfile(retryProfile)
                }
              }, 1000)
            }
          } catch (createErr) {
            console.warn('Error attempting to create profile:', createErr)
          }
          setProfile(null)
          setLoading(false)
          return
        }
        
        // Si erreur d'auth, déconnecter
        if (isAuthError(error)) {
          console.error('Auth error fetching profile, signing out')
          await supabase.auth.signOut()
          setProfile(null)
          setUser(null)
          setSession(null)
          setLoading(false)
          return
        }
        
        // En cas d'erreur, on continue quand même
        console.warn('Error fetching profile, continuing without profile:', error)
        setProfile(null)
        setLoading(false)
        return
      } else if (data) {
        console.log('✅ [useAuth] Profile fetched successfully:', data)
        console.log('✅ [useAuth] Profile role:', data.role, 'Type:', typeof data.role)
        // Vérifier que le rôle est bien une chaîne et non null/undefined
        if (data.role && typeof data.role === 'string') {
          console.log('✅ [useAuth] Role is valid string:', data.role)
        } else {
          console.warn('⚠️ [useAuth] Role is not a valid string!', data.role, typeof data.role)
        }
        console.log('✅ [useAuth] Setting profile state...')
        setProfile(data)
        console.log('✅ [useAuth] Profile state set to:', data)
      } else {
        // Pas de données mais pas d'erreur (maybeSingle retourne null si pas de résultat)
        console.warn('No profile found for user:', userId)
        setProfile(null)
      }
    } catch (error: any) {
      // Gérer spécifiquement les timeouts
      if (error?.message?.includes('timeout')) {
        console.warn('Profile fetch timeout for user:', userId)
        console.warn('Continuing without profile - this may indicate a network issue or slow database')
        // Ne pas bloquer l'application, continuer sans profil
        // Le profil peut être créé plus tard ou chargé lors d'une prochaine tentative
      } else if (isAuthError(error)) {
        console.error('Auth error, signing out')
        await supabase.auth.signOut()
        setProfile(null)
        setUser(null)
        setSession(null)
      } else {
        console.warn('Error fetching profile:', error?.message || error)
        // Ne pas bloquer l'application pour une erreur de profil
      }
      // En cas d'erreur ou timeout, on continue quand même sans profil
      // L'application peut fonctionner sans profil (rôle par défaut: student)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error }
  }

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

  const signOut = async () => {
    try {
      // Réinitialiser l'état local d'abord
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Déconnecter de Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        // Même en cas d'erreur, on continue car l'état local est déjà réinitialisé
      }
    } catch (error) {
      console.error('Error during sign out:', error)
      // En cas d'erreur, on s'assure que l'état est réinitialisé
      setUser(null)
      setProfile(null)
      setSession(null)
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
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
