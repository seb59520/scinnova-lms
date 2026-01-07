import { useState, useEffect } from 'react'
import { Save, CheckCircle, MessageSquare } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

interface IntroductionQuizProps {
  questions: Array<{
    id: string
    label: string
    placeholder?: string
  }>
  title?: string
  description?: string
  onSave?: (answers: Record<string, string>) => void
}

export function IntroductionQuiz({
  questions,
  title = "Quiz d'introduction",
  description,
  onSave
}: IntroductionQuizProps) {
  const { user, profile } = useAuth()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Sauvegarder les réponses dans Supabase si l'utilisateur est connecté
      // Utiliser profile.id si disponible, sinon user.id (ils devraient être identiques)
      const userId = profile?.id || user?.id
      if (userId) {
        const { error } = await supabase
          .from('user_responses')
          .upsert({
            user_id: userId,
            quiz_type: 'introduction_big_data',
            responses: answers,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,quiz_type'
          })

        if (error) {
          console.error('Erreur lors de la sauvegarde:', error)
          // Continuer quand même pour permettre la sauvegarde locale
        }
      }

      // Sauvegarder localement aussi
      localStorage.setItem('introduction_quiz_answers', JSON.stringify(answers))
      
      setSaved(true)
      onSave?.(answers)
      
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }

  // Charger les réponses sauvegardées au montage
  useEffect(() => {
    const savedAnswers = localStorage.getItem('introduction_quiz_answers')
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers))
      } catch (e) {
        console.error('Erreur lors du chargement des réponses:', e)
      }
    }
  }, [])

  const allAnswered = questions.every(q => answers[q.id]?.trim().length > 0)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          {title}
        </h2>
        {description && (
          <p className="text-blue-800 mb-4">{description}</p>
        )}
        <div className="bg-blue-100 border border-blue-300 rounded p-3">
          <p className="text-sm text-blue-900">
            <strong>💡 Note importante :</strong> Ce quiz n'a pas de bonne ou mauvaise réponse. 
            Il s'agit de recueillir votre compréhension actuelle et vos attentes pour personnaliser le cours.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <label 
              htmlFor={question.id}
              className="block text-lg font-semibold text-gray-800 mb-3"
            >
              <span className="text-blue-600 mr-2">Question {index + 1} :</span>
              {question.label}
            </label>
            <textarea
              id={question.id}
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder={question.placeholder || "Votre réponse ici..."}
              className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              rows={4}
            />
            {answers[question.id] && (
              <p className="text-sm text-gray-500 mt-2">
                {answers[question.id].length} caractère{answers[question.id].length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Réponses sauvegardées !</span>
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!allAnswered || saving}
          className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            allAnswered && !saving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder mes réponses'}
        </button>
      </div>

      {!allAnswered && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Veuillez répondre à toutes les questions avant de sauvegarder.
          </p>
        </div>
      )}
    </div>
  )
}

