import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserRole } from '../hooks/useUserRole'
import { UserRole } from '../types/database'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
  requireAuth?: boolean
}

/**
 * Composant de protection des routes simplifié
 * - Affiche un loader pendant le chargement
 * - Redirige vers /login si non authentifié (et auth requise)
 * - Redirige vers /app si authentifié sur une page publique
 * - Vérifie les rôles si spécifiés
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: roleLoading } = useUserRole()
  const location = useLocation()

  // Pages qui ne doivent jamais rediriger vers /app même si connecté
  const publicPaths = ['/', '/landing', '/login', '/register', '/reset-password', '/ghost-login']
  const isPublicPath = publicPaths.includes(location.pathname)

  // Afficher un loader pendant le chargement initial
  if (authLoading || (requireAuth && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Cas 1: Authentification requise mais utilisateur non connecté
  if (requireAuth && !user) {
    // Éviter la redirection si on traite un callback OAuth
    const isOAuthCallback = location.search.includes('code=') || 
                            location.search.includes('access_token=')
    
    if (isOAuthCallback) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Finalisation de la connexion...</p>
          </div>
        </div>
      )
    }
    
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Cas 2: Authentification non requise et utilisateur connecté (page publique)
  if (!requireAuth && user && !isPublicPath) {
    return <Navigate to="/app" replace />
  }

  // Cas 3: Rôle admin requis
  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600 mb-4">
            Vous devez être administrateur pour accéder à cette page.
          </p>
          <Navigate to="/app" replace />
        </div>
      </div>
    )
  }

  // Tout est OK, afficher le contenu
  return <>{children}</>
}
