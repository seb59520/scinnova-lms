import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { Ghost, Lock, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'

export function GhostLogin() {
  const { signInAsGhost, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/app', { replace: true })
    }
  }, [user, authLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!accessCode.trim()) {
      setError('Veuillez entrer un code d\'accès')
      setLoading(false)
      return
    }

    const { error: authError } = await signInAsGhost(accessCode.toUpperCase().trim())
    
    if (authError) {
      setError(authError.message || 'Code invalide ou déjà utilisé')
      setLoading(false)
    }
    // La redirection sera gérée par le useEffect quand user sera mis à jour
  }

  // Afficher un loader si on vérifie l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <Link
          to="/login"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour à la connexion
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Ghost className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connexion Utilisateur Fantôme
          </h1>
          <p className="text-sm text-gray-600">
            Entrez votre code d'accès pour vous connecter de manière anonyme
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
              Code d'accès
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder="Entrez votre code (ex: ABC12345)"
                className="input-field w-full pl-10 text-center text-lg font-mono tracking-widest uppercase"
                maxLength={10}
                autoFocus
                disabled={loading}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Votre code vous a été fourni par un administrateur
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !accessCode.trim()}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                <Ghost className="w-5 h-5" />
                Se connecter anonymement
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            🔒 Votre identité reste confidentielle. Un nom aléatoire vous sera attribué.
          </p>
        </div>
      </div>
    </div>
  )
}
