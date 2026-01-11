import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { Profile } from '../types/database'
import { isAuthError } from '../lib/supabaseHelpers'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInAsGhost: (accessCode: string) => Promise<{ error: AuthError | Error | null }>
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
    let sessionFoundInStorage = false

    // ÉTAPE 1: Vérifier IMMÉDIATEMENT le localStorage pour une session valide
    // Cela évite d'attendre getSession() qui peut être lent
    try {
      const storedSession = localStorage.getItem('sb-auth-token')
      if (storedSession) {
        const parsed = JSON.parse(storedSession)
        // Vérifier que la session est valide (a un access_token et un user)
        if (parsed?.access_token && parsed?.user?.id) {
          console.log('✅ [useAuth] Session valide trouvée dans localStorage, utilisation immédiate')
          setSession(parsed)
          setUser(parsed.user)
          sessionFoundInStorage = true
          // Charger le profil immédiatement
          // NOTE: fetchProfile mettra loading à false quand le profil sera chargé
          // On ne met PAS loading à false ici pour attendre le profil
          fetchProfile(parsed.user.id)
        } else {
          console.warn('⚠️ [useAuth] Session localStorage invalide, nettoyage...')
          localStorage.removeItem('sb-auth-token')
        }
      }
    } catch (e) {
      console.warn('⚠️ [useAuth] Erreur de parsing localStorage, nettoyage...')
      try {
        localStorage.removeItem('sb-auth-token')
      } catch {}
    }

    // ÉTAPE 2: Timeout de sécurité (seulement si pas de session trouvée dans localStorage)
    if (!sessionFoundInStorage) {
      timeoutId = setTimeout(() => {
        if (mounted && loading) {
          console.warn('Auth loading timeout - forcing loading to false')
          setLoading(false)
          setProfile(null)
          setUser(null)
          setSession(null)
        }
      }, 3000) // Réduit à 3 secondes car le localStorage est déjà vérifié
    }

    // ÉTAPE 3: Récupérer la session via getSession() en arrière-plan
    // Cela synchronise avec Supabase et valide le token
    console.log('🔍 [useAuth] Début de la récupération de session via getSession()')
    
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return
        if (timeoutId) clearTimeout(timeoutId)
        
        if (error) {
          console.warn('⚠️ [useAuth] getSession() erreur:', error.message)
          // Si erreur et pas de session en storage, déconnecter
          if (!sessionFoundInStorage) {
            setLoading(false)
          }
          return
        }
        
        if (session) {
          console.log('✅ [useAuth] Session confirmée via getSession()')
          setSession(session)
          setUser(session.user ?? null)
          if (session.user && !sessionFoundInStorage) {
            // Charger le profil seulement si pas déjà fait via localStorage
            // fetchProfile mettra loading à false quand terminé
            fetchProfile(session.user.id)
          }
          // Si session vient de localStorage, fetchProfile est déjà en cours
          // et mettra loading à false quand le profil sera chargé
          // Sinon (nouveau getSession), fetchProfile vient d'être appelé ci-dessus
          // Dans les deux cas, on ne met PAS loading à false ici
        } else if (!sessionFoundInStorage) {
          // Pas de session ni dans localStorage ni via getSession()
          console.log('ℹ️ [useAuth] Aucune session trouvée')
          setLoading(false)
          setUser(null)
          setSession(null)
        }
      })
      .catch((error) => {
        if (!mounted) return
        console.warn('⚠️ [useAuth] getSession() exception:', error?.message)
        // En cas d'erreur réseau, utiliser la session du localStorage si disponible
        if (!sessionFoundInStorage) {
          setLoading(false)
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
          
          // Détecter si on vient d'un callback OAuth
          const isOAuthCallback = window.location.pathname === '/' || 
                                  window.location.pathname === '/app' ||
                                  window.location.search.includes('code=') ||
                                  window.location.search.includes('access_token=')
          
          // Attendre un court délai pour que le trigger SQL crée le profil
          setTimeout(async () => {
            // Essayer de récupérer le profil plusieurs fois si nécessaire
            let profileFound = false
            let attempts = 0
            
            while (!profileFound && attempts < 5) {
              await fetchProfile(session.user.id)
              
              // Vérifier si le profil existe maintenant
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle()
              
              if (profileData) {
                profileFound = true
                setProfile(profileData)
                break
              }
              
              // Si le profil n'existe pas après 2 tentatives, essayer de le créer
              if (attempts === 2) {
                const userMetadata = session.user.user_metadata || {}
                const fullName = userMetadata.full_name || 
                               userMetadata.name || 
                               session.user.email?.split('@')[0] || 
                               'Utilisateur'
                
                const { data: newProfile } = await supabase
                  .from('profiles')
                  .upsert({
                    id: session.user.id,
                    role: 'student',
                    full_name: fullName,
                    is_active: true
                  }, {
                    onConflict: 'id'
                  })
                  .select()
                  .single()
                
                if (newProfile) {
                  profileFound = true
                  setProfile(newProfile)
                  break
                }
              }
              
              attempts++
              if (attempts < 5) {
                await new Promise(resolve => setTimeout(resolve, 300))
              }
            }
            
            // Rediriger après connexion OAuth si on est sur la page de callback
            if (isOAuthCallback) {
              // Déterminer où rediriger : si on était sur la landing page, y retourner
              // Sinon, aller vers /app
              const currentPath = window.location.pathname
              const redirectPath = (currentPath === '/' || currentPath === '/landing') ? '/' : '/app'
              
              // Nettoyer l'URL des paramètres OAuth
              const cleanUrl = window.location.origin + redirectPath
              
              // Attendre un peu pour s'assurer que tout est prêt
              setTimeout(() => {
                window.location.replace(cleanUrl)
              }, 300)
            }
          }, 500)
        } else {
          await fetchProfile(session.user.id)
          
          // Si l'utilisateur vient d'un magic link avec course_id, créer l'inscription
          // Note: Cette logique est maintenant gérée dans CourseView via le paramètre auto_enroll
          // pour éviter les problèmes de timing avec la création du profil
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
      
      // Requête simple sans retry complexe - RLS désactivé donc devrait être rapide
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      const { data, error } = result || { data: null, error: null }
      
      console.log('🔍 [useAuth] Profile fetch result:', {
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint,
        profileRole: data?.role,
        profileId: data?.id,
        fullProfile: data
      })
      
      // Log détaillé de l'erreur si elle existe
      if (error) {
        console.error('❌ [useAuth] Erreur complète:', JSON.stringify(error, null, 2))
        console.error('❌ [useAuth] Code:', error.code)
        console.error('❌ [useAuth] Message:', error.message)
        console.error('❌ [useAuth] Details:', error.details)
        console.error('❌ [useAuth] Hint:', error.hint)
      }

      if (error) {
        // Si le profil n'existe pas, ce n'est pas forcément une erreur critique
        if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
          console.warn('Profile not found for user:', userId, '- This is normal for new users or OAuth users')
          // Essayer de créer un profil par défaut (si les permissions le permettent)
          try {
            // Récupérer l'utilisateur depuis l'état ou la session
            const currentUser = user || session?.user
            // Pour OAuth Google, récupérer le nom depuis les métadonnées
            const userMetadata = currentUser?.user_metadata || {}
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
                // Retry sans filtre is_active pour permettre la récupération même si is_active est NULL
                const { data: retryProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userId)
                  .or('is_active.is.null,is_active.eq.true')
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
    // Déterminer où rediriger après OAuth
    // Si on est sur la landing page, y retourner, sinon aller vers /app
    const currentPath = window.location.pathname
    const redirectPath = currentPath === '/' || currentPath === '/landing' ? '/' : '/app'
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    return { error }
  }

  // Fonction pour générer un nom cartoon aléatoire
  const generateCartoonName = (): string => {
    const adjectives = ['Curieux', 'Agile', 'Rusé', 'Sage', 'Malin', 'Solitaire', 'Savant', 'Joyeux', 'Brave', 'Astucieux']
    const animals = ['Panda', 'Lapin', 'Renard', 'Ours', 'Chat', 'Loup', 'Hibou', 'Dauphin', 'Lion', 'Aigle']
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)]
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `${randomAnimal} ${randomAdjective}-${randomSuffix}`
  }

  const signInAsGhost = async (accessCode: string) => {
    try {
      // 1. Vérifier que le code existe et est valide
      const { data: codeData, error: codeError } = await supabase
        .rpc('use_ghost_code', { code_to_check: accessCode })

      if (codeError || !codeData || codeData.length === 0 || !codeData[0]?.is_valid) {
        return { 
          error: new Error(codeData?.[0]?.message || 'Code invalide ou déjà utilisé') 
        }
      }

      // codeInfo contient les informations du code (is_valid, message, etc.)

      // 2. Générer un nom cartoon aléatoire
      const cartoonName = generateCartoonName()

      // 3. Créer un utilisateur anonyme
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            full_name: cartoonName,
            access_code: accessCode,
            is_ghost: true,
            created_via: 'ghost_code'
          }
        }
      })

      if (authError) {
        return { error: authError }
      }

      if (!authData.user) {
        return { error: new Error('Échec de la création de l\'utilisateur anonyme') }
      }

      // 4. Marquer le code comme utilisé
      const { error: markError } = await supabase
        .rpc('mark_ghost_code_used', {
          code_to_mark: accessCode,
          user_id: authData.user.id
        })

      if (markError) {
        console.warn('Erreur lors du marquage du code comme utilisé:', markError)
        // Essayer une mise à jour directe en fallback
        try {
          await supabase
            .from('ghost_codes')
            .update({ 
              is_used: true, 
              used_at: new Date().toISOString(),
              used_by: authData.user.id 
            })
            .eq('code', accessCode)
        } catch {
          // Ignorer les erreurs de mise à jour
        }
      }

      return { error: null }
    } catch (error: any) {
      console.error('Error in signInAsGhost:', error)
      return { error: error instanceof Error ? error : new Error('Erreur inconnue lors de la connexion ghost') }
    }
  }

  const signOut = async () => {
    try {
      const isGhost = user?.user_metadata?.is_ghost || user?.app_metadata?.is_ghost
      const userId = user?.id

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

      // Si c'est un utilisateur ghost, le supprimer via une Edge Function ou API
      // Note: La suppression directe dans auth.users nécessite l'Admin API
      // On peut appeler une Edge Function ou laisser un job de nettoyage s'en charger
      if (isGhost && userId) {
        try {
          // Option 1: Appeler une Edge Function (si disponible)
          await fetch('/api/admin/delete-ghost-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          }).catch(() => {
            // Si l'endpoint n'existe pas, on log juste
            console.log('Ghost user will be cleaned up by scheduled job')
          })
        } catch (cleanupError) {
          console.warn('Could not delete ghost user immediately:', cleanupError)
          // Le nettoyage sera fait par un job programmé
        }
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
      console.log('🔄 [useAuth] Forcing profile refresh for user:', user.id)
      // Réinitialiser le profil avant de le recharger pour forcer le rafraîchissement
      setProfile(null)
      await fetchProfile(user.id)
    } else {
      console.warn('⚠️ [useAuth] Cannot refresh profile: no user ID')
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
