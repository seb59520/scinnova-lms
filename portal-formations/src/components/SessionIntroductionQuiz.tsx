import { useState, useEffect, useCallback, useRef } from 'react'
import { Save, CheckCircle, MessageSquare, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useParams } from 'react-router-dom'

interface SessionIntroductionQuizProps {
  questions: Array<{
    id: string
    label: string
    placeholder?: string
  }>
  title?: string
  description?: string
  quizType?: string
  onSave?: (answers: Record<string, string>) => void
}

export function SessionIntroductionQuiz({
  questions,
  title = "Quiz d'introduction",
  description,
  quizType = 'introduction_python',
  onSave
}: SessionIntroductionQuizProps) {
  const { user, profile } = useAuth()
  const { sessionId } = useParams<{ sessionId?: string }>()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Charger les réponses sauvegardées au montage
  useEffect(() => {
    async function loadSavedAnswers() {
      const userId = profile?.id || user?.id
      if (!userId) return

      try {
        const { data, error } = await supabase
          .from('user_responses')
          .select('responses')
          .eq('user_id', userId)
          .eq('quiz_type', quizType)
          .maybeSingle()

        if (!error && data?.responses) {
          setAnswers(data.responses as Record<string, string>)
        }
      } catch (e) {
        console.error('Erreur lors du chargement des réponses:', e)
      }
    }

    loadSavedAnswers()
  }, [user, profile, quizType])

  // Configurer le canal temps réel pour émettre les changements
  useEffect(() => {
    if (!sessionId || !user) return

    const channel = supabase.channel(`quiz-responses:${sessionId}`, {
      config: { broadcast: { self: false } }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [sessionId, user])

  // Fonction de sauvegarde avec émission temps réel
  const saveAnswers = useCallback(async (answersToSave: Record<string, string>, silent = false) => {
    const userId = profile?.id || user?.id
    if (!userId) return

    setSaving(true)
    try {
      // Sauvegarder dans Supabase
      const { error } = await supabase
        .from('user_responses')
        .upsert({
          user_id: userId,
          quiz_type: quizType,
          responses: answersToSave,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,quiz_type'
        })

      if (error) {
        console.error('Erreur lors de la sauvegarde:', error)
        return
      }

      // Émettre un événement temps réel pour informer le formateur
      if (sessionId && channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'quiz_response_updated',
          payload: {
            user_id: userId,
            user_name: profile?.full_name || 'Anonyme',
            quiz_type: quizType,
            question_ids: Object.keys(answersToSave),
            completed: questions.every(q => answersToSave[q.id]?.trim().length > 0),
            updated_at: new Date().toISOString()
          }
        })
      }

      if (!silent) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }

      onSave?.(answersToSave)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }, [user, profile, quizType, sessionId, questions, onSave])

  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = {
      ...answers,
      [questionId]: value
    }
    setAnswers(newAnswers)
    setSaved(false)

    // Auto-save après 2 secondes d'inactivité
    if (autoSaveEnabled) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveAnswers(newAnswers, true) // Sauvegarde silencieuse
      }, 2000)
    }
  }

  const handleManualSave = async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    await saveAnswers(answers, false)
  }

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  const allAnswered = questions.every(q => answers[q.id]?.trim().length > 0)
  const answeredCount = questions.filter(q => answers[q.id]?.trim().length > 0).length

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
            Il s'agit de recueillir votre compréhension actuelle, votre niveau et vos attentes pour personnaliser le cours.
          </p>
        </div>
        {sessionId && (
          <div className="mt-3 text-xs text-blue-700">
            📡 Vos réponses sont sauvegardées automatiquement et visibles par le formateur en temps réel.
          </div>
        )}
      </div>

      {/* Indicateur de progression */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm text-gray-600">{answeredCount} / {questions.length} questions</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
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
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-500">
                  {answers[question.id].length} caractère{answers[question.id].length > 1 ? 's' : ''}
                </p>
                {answers[question.id].trim().length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Sauvegardé</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          {saving && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Sauvegarde...</span>
            </div>
          )}
          {saved && !saving && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Réponses sauvegardées !</span>
            </div>
          )}
          {!saved && !saving && autoSaveEnabled && (
            <div className="text-xs text-gray-500">
              💾 Sauvegarde automatique activée
            </div>
          )}
        </div>
        <button
          onClick={handleManualSave}
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
            ⚠️ Veuillez répondre à toutes les questions avant de finaliser.
          </p>
        </div>
      )}
    </div>
  )
}
