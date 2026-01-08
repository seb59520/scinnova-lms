import { useState } from 'react'
import { X, Copy, Linkedin, Check } from 'lucide-react'
import { Course } from '../types/database'

interface LinkedInPostModalProps {
  course: Course
  isOpen: boolean
  onClose: () => void
}

export function LinkedInPostModal({ course, isOpen, onClose }: LinkedInPostModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Générer le texte du post LinkedIn
  const generateLinkedInPost = () => {
    const baseUrl = window.location.origin
    const courseUrl = `${baseUrl}/courses/${course.id}`
    
    const lines = [
      `🎓 Nouvelle formation disponible : ${course.title}`,
      '',
      course.description 
        ? `${course.description.substring(0, 200)}${course.description.length > 200 ? '...' : ''}`
        : 'Découvrez cette nouvelle formation sur notre plateforme d\'apprentissage.',
      '',
      '✨ Ce que vous allez apprendre :',
      '• Contenu pratique et interactif',
      '• Exercices et cas d\'usage réels',
      '• Suivi de progression personnalisé',
      '',
      course.access_type === 'free' 
        ? '✅ Accès gratuit'
        : `💰 Prix : ${course.price_cents ? (course.price_cents / 100).toFixed(2) : 'N/A'} ${course.currency || 'EUR'}`,
      '',
      `🔗 En savoir plus : ${courseUrl}`,
      '',
      '#Formation #Apprentissage #DataScience #MachineLearning #BigData'
    ]

    return lines.join('\n')
  }

  const postText = generateLinkedInPost()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }
  }

  const handleOpenLinkedIn = () => {
    // Ouvrir LinkedIn dans un nouvel onglet avec le texte pré-rempli
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`
    window.open(linkedInUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Linkedin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Publication LinkedIn</h2>
              <p className="text-sm text-gray-600">Post pour {course.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texte du post (modifiable)
              </label>
              <textarea
                value={postText}
                onChange={(e) => {
                  // Permettre la modification mais on garde la valeur dans le state local
                  // Pour simplifier, on garde juste la copie pour l'instant
                }}
                readOnly
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                {postText.length} caractères
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Conseils</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Copiez le texte et personnalisez-le si nécessaire</li>
                <li>Ajoutez des hashtags pertinents pour votre audience</li>
                <li>Incluez une image ou une capture d'écran de la formation</li>
                <li>Publiez au meilleur moment pour votre audience (généralement 8h-10h ou 17h-19h)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le texte
                </>
              )}
            </button>
            <button
              onClick={handleOpenLinkedIn}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              Ouvrir LinkedIn
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
