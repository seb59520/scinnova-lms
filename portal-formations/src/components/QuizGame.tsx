import { useState, useEffect, useRef } from 'react'
import { Trophy, RotateCcw, CheckCircle, XCircle, ArrowRight, ArrowLeft, BookOpen, ArrowUp } from 'lucide-react'
import { calculateScore, validateAnswer } from '../lib/scoring'
import { saveCompleteProgress, getGameProgress, type GameProgress } from '../lib/progress'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

export interface QuizQuestion {
  id: string
  type: 'mcq' | 'true-false'
  prompt: string
  options?: string[]
  answer: string | boolean
  explanation: string
  difficulty: number
}

export interface QuizLevel {
  level: number
  name: string
  description?: string
  questions: QuizQuestion[]
}

interface QuizGameProps {
  levels?: QuizLevel[]
  onScore?: (score: number, metadata: any) => void
  description?: string
  instructions?: string
  objectives?: string[]
  scoring?: {
    totalQuestions?: number
    pointsPerQuestion?: number
    passingScore?: number
    levels?: {
      [key: string]: string
    }
  }
  itemId?: string
  quizType?: string
}

type GameState = 'menu' | 'playing' | 'results' | 'revision'

export function QuizGame({ 
  levels: propsLevels, 
  onScore, 
  description,
  instructions,
  objectives,
  scoring,
  itemId,
  quizType = 'big_data_quiz'
}: QuizGameProps) {
  const { user, profile } = useAuth()
  const quizContainerRef = useRef<HTMLDivElement>(null)
  
  // Vérification de sécurité : si aucun niveau n'est disponible
  if (!propsLevels || propsLevels.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800 font-medium mb-2">⚠️ Aucun niveau disponible</p>
        <p className="text-yellow-700 text-sm">
          Le quiz n'a pas de niveaux configurés. Vérifiez que le champ "levels" dans game_content contient des données.
        </p>
      </div>
    )
  }

  const levels = propsLevels

  // États du jeu
  const [gameState, setGameState] = useState<GameState>('menu')
  const [currentLevel, setCurrentLevel] = useState<number>(1)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [userAnswers, setUserAnswers] = useState<Map<string, string | boolean>>(new Map())
  const [showExplanation, setShowExplanation] = useState(false)
  const [isRevisionMode, setIsRevisionMode] = useState(false)
  const [revisionQuestions, setRevisionQuestions] = useState<QuizQuestion[]>([])
  const [progress, setProgress] = useState<GameProgress | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Question actuelle
  const activeLevel = levels.find(l => l.level === currentLevel)
  const questionsToUse = isRevisionMode ? revisionQuestions : (activeLevel?.questions || [])
  const currentQuestion = questionsToUse[currentQuestionIndex]

  // Charger la progression au montage
  useEffect(() => {
    if (user && currentLevel) {
      loadProgress()
    }
  }, [user, currentLevel])

  // Gérer l'affichage du bouton scroll to top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fonction pour remonter en haut
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const loadProgress = async () => {
    if (!user) return
    try {
      const progressData = await getGameProgress(user.id, 'quiz', currentLevel)
      if (progressData) {
        setProgress(progressData)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  // Démarrer un niveau
  const startLevel = (level: number) => {
    const selectedLevel = levels.find(l => l.level === level)
    
    if (!selectedLevel || !selectedLevel.questions || selectedLevel.questions.length === 0) {
      alert(`Aucune question disponible pour le niveau ${level}`)
      return
    }
    
    setCurrentLevel(level)
    setCurrentQuestionIndex(0)
    setScore(0)
    setWrongIds([])
    setUserAnswers(new Map())
    setShowExplanation(false)
    setIsRevisionMode(false)
    setRevisionQuestions([])
    setGameState('playing')
    
    // Scroll vers le quiz au lieu de remonter en haut
    setTimeout(() => {
      if (quizContainerRef.current) {
        quizContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Démarrer le mode révision
  const startRevision = async () => {
    if (!user || wrongIds.length === 0) return

    // Récupérer les questions ratées depuis tous les niveaux
    const allQuestions = levels.flatMap(l => l.questions)
    const failedQuestions = allQuestions.filter(q => wrongIds.includes(q.id))

    if (failedQuestions.length === 0) {
      alert('Aucune question à réviser !')
      return
    }

    setRevisionQuestions(failedQuestions)
    setCurrentQuestionIndex(0)
    setScore(0)
    setUserAnswers(new Map())
    setShowExplanation(false)
    setIsRevisionMode(true)
    setGameState('playing')
  }

  // Valider une réponse pour les types de quiz
  const validateQuizAnswer = (
    userAnswer: string | boolean,
    correctAnswer: string | boolean,
    questionType: string
  ): boolean => {
    // Pour les questions true-false, comparer les booléens
    if (questionType === 'true-false') {
      return userAnswer === correctAnswer
    }

    // Pour les questions mcq, comparer les strings (case-insensitive)
    if (questionType === 'mcq') {
      return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
    }

    // Par défaut, comparer les strings
    return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
  }

  // Gérer la réponse
  const handleAnswer = (answer: string | boolean) => {
    if (!currentQuestion) return

    const isCorrect = validateQuizAnswer(answer, currentQuestion.answer, currentQuestion.type)

    setUserAnswers(prev => new Map(prev).set(currentQuestion.id, answer))

    if (isCorrect) {
      setScore(prev => prev + 1)
    } else {
      setWrongIds(prev => [...prev, currentQuestion.id])
    }

    setShowExplanation(true)
  }

  // Question suivante
  const handleNext = () => {
    if (currentQuestionIndex < questionsToUse.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowExplanation(false)
    } else {
      // Fin du niveau
      finishLevel()
    }
  }

  // Finir le niveau
  const finishLevel = async () => {
    const total = questionsToUse.length
    const scoreResult = calculateScore(score, total)

    // Sauvegarder la progression
    if (user && !isRevisionMode) {
      await saveCompleteProgress(
        user.id,
        'quiz',
        currentLevel,
        scoreResult,
        wrongIds
      )

      // Sauvegarder aussi dans user_responses pour le formateur
      const userId = profile?.id || user.id
      if (userId) {
        try {
          const quizTypeKey = itemId ? `quiz_${itemId}` : quizType
          const responses = {
            level: currentLevel,
            score: scoreResult.score,
            total: scoreResult.total,
            percentage: scoreResult.percentage,
            badge: scoreResult.badge,
            wrongIds: wrongIds,
            userAnswers: Object.fromEntries(userAnswers),
            completedAt: new Date().toISOString()
          }

          await supabase
            .from('user_responses')
            .upsert({
              user_id: userId,
              quiz_type: quizTypeKey,
              responses: responses,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,quiz_type'
            })
        } catch (error) {
          console.error('Erreur lors de la sauvegarde dans user_responses:', error)
        }
      }
    }

    // Appeler le callback onScore si fourni
    if (onScore) {
      onScore(scoreResult.score, {
        total: scoreResult.total,
        percentage: scoreResult.percentage,
        badge: scoreResult.badge,
        level: currentLevel,
        wrongIds
      })
    }

    setGameState('results')
  }

  // Rendu du menu
  const renderMenu = () => {
    return (
      <div className="space-y-6">
        {description && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-800">{description}</p>
          </div>
        )}

        {instructions && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-700 text-sm">{instructions}</p>
          </div>
        )}

        {objectives && objectives.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">🎯 Objectifs pédagogiques :</h4>
            <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
              {objectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {levels.map(level => (
            <button
              key={level.level}
              onClick={() => startLevel(level.level)}
              className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900">Niveau {level.level}</h3>
                <span className="text-sm text-gray-500">{level.questions.length} questions</span>
              </div>
              <p className="text-gray-600 font-medium">{level.name}</p>
              {level.description && (
                <p className="text-sm text-gray-500 mt-2">{level.description}</p>
              )}
            </button>
          ))}
        </div>

        {wrongIds.length > 0 && (
          <div className="mt-6">
            <button
              onClick={startRevision}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span>Réviser mes erreurs ({wrongIds.length} questions)</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // Rendu de la question
  const renderQuestion = () => {
    // Vérifier si on a des questions
    if (questionsToUse.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800 mb-4">
            Aucune question disponible pour le niveau {currentLevel}.
          </p>
          <button
            onClick={() => setGameState('menu')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retour au menu
          </button>
        </div>
      )
    }
    
    if (!currentQuestion) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 mb-4">
            Erreur : Question introuvable (index {currentQuestionIndex} sur {questionsToUse.length}).
          </p>
          <button
            onClick={() => setGameState('menu')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retour au menu
          </button>
        </div>
      )
    }

    const userAnswer = userAnswers.get(currentQuestion.id)
    const isAnswered = userAnswer !== undefined
    const isCorrect = isAnswered && validateQuizAnswer(userAnswer, currentQuestion.answer, currentQuestion.type)

    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isRevisionMode ? 'Mode Révision' : `Niveau ${currentLevel} - ${activeLevel?.name}`}
            </h3>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} / {questionsToUse.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Score actuel</p>
            <p className="text-2xl font-bold text-blue-600">{score} / {questionsToUse.length}</p>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4">{currentQuestion.prompt}</h4>

          {/* Réponses */}
          {!isAnswered && (
            <div className="space-y-3">
              {currentQuestion.type === 'true-false' ? (
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleAnswer(true)}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                  >
                    ✅ Vrai
                  </button>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                  >
                    ❌ Faux
                  </button>
                </div>
              ) : currentQuestion.type === 'mcq' && currentQuestion.options ? (
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-left"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Feedback et explication */}
          {isAnswered && (
            <div className="mt-4">
              <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-green-800 font-semibold">Bonne réponse !</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span className="text-red-800 font-semibold">Mauvaise réponse</span>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Explication :</p>
                  <p>{currentQuestion.explanation}</p>
                  {!isCorrect && (
                    <p className="mt-2 text-gray-600">
                      <strong>Réponse correcte :</strong> {String(currentQuestion.answer)}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <span>{currentQuestionIndex < questionsToUse.length - 1 ? 'Question suivante' : 'Voir les résultats'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Rendu des résultats
  const renderResults = () => {
    const total = questionsToUse.length
    const scoreResult = calculateScore(score, total)

    // Déterminer le niveau de performance selon le scoring configuré
    let performanceLevel = ''
    if (scoring?.levels) {
      const percentage = scoreResult.percentage
      if (percentage >= 80) {
        performanceLevel = scoring.levels['12-15'] || scoring.levels['7-11'] || ''
      } else if (percentage >= 47) {
        performanceLevel = scoring.levels['7-11'] || ''
      } else {
        performanceLevel = scoring.levels['0-6'] || ''
      }
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-2">Niveau terminé !</h3>
          {scoreResult.badge && (
            <div className="text-4xl mb-4">{scoreResult.badge}</div>
          )}
          <div className="text-5xl font-bold mb-2">{scoreResult.percentage}%</div>
          <p className="text-xl">
            {scoreResult.score} / {scoreResult.total} bonnes réponses
          </p>
          {performanceLevel && (
            <p className="text-lg mt-2 opacity-90">{performanceLevel}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setGameState('menu')}
            className="p-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour au menu</span>
          </button>
          {wrongIds.length > 0 && (
            <button
              onClick={startRevision}
              className="p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Réviser mes erreurs ({wrongIds.length})</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Rendu principal
  return (
    <>
      <div 
        ref={quizContainerRef}
        className="quiz-game space-y-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 md:p-8 shadow-lg"
      >
        {gameState === 'menu' && renderMenu()}
        {gameState === 'playing' && renderQuestion()}
        {gameState === 'results' && renderResults()}
      </div>

      {/* Bouton pour remonter en haut - en bas à gauche */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 left-8 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Remonter en haut"
          title="Remonter en haut"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </>
  )
}


