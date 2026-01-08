import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Mail, Check, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

interface CourseLeadModalProps {
  courseId: string
  courseTitle: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CourseLeadModal({ 
  courseId, 
  courseTitle, 
  isOpen, 
  onClose,
  onSuccess 
}: CourseLeadModalProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email')
      return
    }

    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide')
      return
    }

    setLoading(true)

    try {
      // 1. Sauvegarder l'email dans course_leads
      const { error: insertError } = await supabase
        .from('course_leads')
        .insert({
          email: email.trim().toLowerCase(),
          course_id: courseId,
          source: 'landing_page',
          subscribed: true
        })

      // Si l'email existe déjà, continuer quand même
      if (insertError && insertError.code !== '23505') {
        throw insertError
      }

      // 2. Utiliser signInWithOtp qui créera automatiquement le compte si nécessaire
      // et permettra à l'utilisateur de se reconnecter plus tard avec le même email
      const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/courses/${courseId}?auto_enroll=true`,
          data: {
            course_id: courseId,
            action: 'course_access',
            full_name: `Visiteur ${email.trim().split('@')[0]}`
          }
        }
      })

      if (otpError) {
        throw new Error(`Erreur lors de l'envoi du lien de connexion: ${otpError.message}`)
      }

      // 3. Stocker l'information dans course_leads pour référence future
      // Le système créera automatiquement le profil et l'inscription
      // quand l'utilisateur cliquera sur le lien dans l'email

      setSuccess(true)
      
      // 4. Informer l'utilisateur et fermer le modal
      setTimeout(() => {
        onSuccess?.()
        onClose()
        setEmail('')
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      console.error('Error saving lead and creating user:', err)
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Intéressé par cette formation ?</h2>
              <p className="text-sm text-gray-600">{courseTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Lien de connexion envoyé !
              </h3>
              <p className="text-gray-600 mb-4">
                Un email avec un lien de connexion a été envoyé à <strong>{email}</strong>.
              </p>
              <p className="text-sm text-gray-500">
                Cliquez sur le lien dans l'email pour accéder à la formation. 
                Vous pourrez vous reconnecter plus tard avec le même email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Votre adresse email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 En laissant votre email, vous acceptez de recevoir des informations sur cette formation. 
                  Vous pourrez vous désinscrire à tout moment.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
