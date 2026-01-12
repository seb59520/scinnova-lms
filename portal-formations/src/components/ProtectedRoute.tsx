import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types/database'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
  requireAuth?: boolean
}

/**
 * Composant de protection des routes
 * - Affiche un loader pendant le chargement
 * - Redirige vers /login si non authentifié (et auth requise)
 * - Vérifie les rôles si spécifiés
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // Pages qui ne doivent jamais rediriger vers /app même si connecté
  const publicPaths = ['/', '/landing', '/login', '/register', '/reset-password', '/ghost-login']
  const isPublicPath = publicPaths.includes(location.pathname)

  // Vérifier si c'est un callback OAuth
  const isOAuthCallback = location.search.includes('code=') || 
                          location.search.includes('access_token=')

  // Afficher un loader pendant le chargement initial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Cas 1: Callback OAuth en cours
  if (isOAuthCallback && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Finalisation de la connexion...</p>
        </div>
      </div>
    )
  }

  // Cas 2: Authentification requise mais utilisateur non connecté
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Cas 3: Authentification non requise et utilisateur connecté sur page publique (sauf landing)
  if (!requireAuth && user && !isPublicPath) {
    return <Navigate to="/app" replace />
  }

  // Cas 4: Rôle admin requis
  if (requiredRole === 'admin') {
    // Vérifier que le profil est chargé et que l'utilisateur est admin
    const isAdmin = profile?.role === 'admin'
    
    if (!isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600 mb-4">
              Vous devez être administrateur pour accéder à cette page.
            </p>
            <button
              onClick={() => window.location.href = '/app'}
              className="btn-primary"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      )
    }
  }

  // Cas 5: Autre rôle requis
  if (requiredRole && requiredRole !== 'admin') {
    const hasRole = profile?.role === requiredRole || profile?.role === 'admin'
    
    if (!hasRole) {
      return <Navigate to="/app" replace />
    }
  }

  // Tout est OK, afficher le contenu
  return <>{children}</>
}
