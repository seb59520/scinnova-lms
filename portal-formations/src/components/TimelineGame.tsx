import { useState, useEffect } from 'react'
import { RotateCcw, Trophy, Clock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'

interface TimelineEvent {
  id: string
  text: string
  order: number
  placed?: boolean
  correctPosition?: number
}

type CorrectOrder = 
  | number[]
  | { text: string; order: number }[]

interface TimelineGameProps {
  events: string[]
  correctOrder: CorrectOrder
  onScore: (score: number, metadata: { attempts: number; time: number; total: number }) => void
  description?: string
}

export function TimelineGame({ 
  events, 
  correctOrder, 
  onScore, 
  description 
}: TimelineGameProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [availableEvents, setAvailableEvents] = useState<TimelineEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({})

  // Normaliser l'ordre correct
  const normalizedOrder: Record<string, number> = (() => {
    if (Array.isArray(correctOrder) && correctOrder.length > 0) {
      if (typeof correctOrder[0] === 'number') {
        // Format: [0, 1, 2, 3]
        const order = correctOrder as number[]
        return events.reduce((acc, event, index) => {
          acc[event] = order[index] ?? index
          return acc
        }, {} as Record<string, number>)
      } else {
        // Format: [{ text: "...", order: 0 }]
        const order = correctOrder as { text: string; order: number }[]
        return order.reduce((acc, item) => {
          acc[item.text] = item.order
          return acc
        }, {} as Record<string, number>)
      }
    }
    return {}
  })()

  // Initialiser les événements
  useEffect(() => {
    if (events.length === 0) return

    const shuffled = events
      .map((text, index) => ({
        id: `event-${index}`,
        text,
        order: normalizedOrder[text] ?? index,
        placed: false
      }))
      .sort(() => Math.random() - 0.5)

    setAvailableEvents(shuffled)
    setTimelineEvents(Array(events.length).fill(null).map(() => ({ id: '', text: '', order: -1, placed: false })))
  }, [events, normalizedOrder])

  // Timer
  useEffect(() => {
    if (!gameStarted || gameFinished) return

    const interval = setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStarted, gameFinished, startTime])

  const startGame = () => {
    setGameStarted(true)
    setStartTime(Date.now())
    setElapsedTime(0)
    setAttempts(0)
    setGameFinished(false)
    setSelectedEvent(null)
    setFeedback({})
    
    const shuffled = events
      .map((text, index) => ({
        id: `event-${index}`,
        text,
        order: normalizedOrder[text] ?? index,
        placed: false
      }))
      .sort(() => Math.random() - 0.5)

    setAvailableEvents(shuffled)
    setTimelineEvents(Array(events.length).fill(null).map(() => ({ id: '', text: '', order: -1, placed: false })))
  }

  const handleEventClick = (eventId: string) => {
    if (!gameStarted || gameFinished) return
    const event = availableEvents.find(e => e.id === eventId)
    if (!event || event.placed) return

    if (selectedEvent === eventId) {
      setSelectedEvent(null)
    } else {
      setSelectedEvent(eventId)
    }
  }

  const handleTimelineSlotClick = (slotIndex: number) => {
    if (!gameStarted || gameFinished || !selectedEvent) return

    const event = availableEvents.find(e => e.id === selectedEvent)
    if (!event) return

    // Vérifier si le slot est déjà occupé
    if (timelineEvents[slotIndex]?.placed) return

    setAttempts(prev => prev + 1)

    // Placer l'événement
    const isCorrect = normalizedOrder[event.text] === slotIndex
    
    setTimelineEvents(prev => {
      const newEvents = [...prev]
      newEvents[slotIndex] = { ...event, placed: true, correctPosition: normalizedOrder[event.text] }
      return newEvents
    })

    setAvailableEvents(prev => prev.map(e => 
      e.id === selectedEvent ? { ...e, placed: true } : e
    ))

    setFeedback(prev => ({ ...prev, [selectedEvent]: isCorrect ? 'correct' : 'incorrect' }))
    setSelectedEvent(null)

    // Vérifier si le jeu est terminé
    setTimeout(() => {
      const allPlaced = timelineEvents.every((e, idx) => 
        idx === slotIndex ? true : e.placed
      ) && availableEvents.every(e => e.id === selectedEvent ? true : e.placed)
      
      if (allPlaced || timelineEvents.filter(e => e.placed).length + 1 === events.length) {
        checkCompletion()
      }
    }, 100)
  }

  const checkCompletion = () => {
    const allCorrect = timelineEvents.every((event, index) => 
      event.placed && normalizedOrder[event.text] === index
    )

    if (allCorrect && timelineEvents.every(e => e.placed)) {
      setGameFinished(true)
      calculateScore()
    }
  }

  const calculateScore = () => {
    if (!startTime) return

    const time = Math.floor((Date.now() - startTime) / 1000)
    const total = events.length
    const correct = timelineEvents.filter((event, index) => 
      event.placed && normalizedOrder[event.text] === index
    ).length

    const accuracyScore = Math.floor((correct / total) * 1000)
    const timeScore = Math.max(0, 1000 - (time * 5))
    const totalScore = Math.max(0, Math.floor(accuracyScore + timeScore))

    onScore(totalScore, {
      attempts,
      time,
      total
    })
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameFinished(false)
    setSelectedEvent(null)
    setAttempts(0)
    setElapsedTime(0)
    setStartTime(null)
    setFeedback({})
    
    const shuffled = events
      .map((text, index) => ({
        id: `event-${index}`,
        text,
        order: normalizedOrder[text] ?? index,
        placed: false
      }))
      .sort(() => Math.random() - 0.5)

    setAvailableEvents(shuffled)
    setTimelineEvents(Array(events.length).fill(null).map(() => ({ id: '', text: '', order: -1, placed: false })))
  }

  if (events.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Configuration incomplète. Veuillez configurer les événements et l'ordre correct.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {description && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
          <p className="text-orange-800">{description}</p>
        </div>
      )}

      {/* Statistiques */}
      {gameStarted && (
        <div className="flex items-center justify-center gap-6 bg-gradient-to-r from-white to-orange-50 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Temps: <span className="text-orange-600 font-bold">{elapsedTime}s</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Tentatives: <span className="text-orange-600 font-bold">{attempts}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Placés: <span className="text-orange-600 font-bold">{timelineEvents.filter(e => e.placed).length}/{events.length}</span>
            </span>
          </div>
        </div>
      )}

      {/* Message de fin */}
      {gameFinished && (() => {
        const total = events.length
        const correct = timelineEvents.filter((event, index) => 
          event.placed && normalizedOrder[event.text] === index
        ).length
        const accuracyScore = Math.floor((correct / total) * 1000)
        const timeScore = Math.max(0, 1000 - (elapsedTime * 5))
        const finalScore = Math.max(0, Math.floor(accuracyScore + timeScore))
        
        return (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">🎉 Timeline complète !</h3>
              <p className="text-green-800 mb-4">
                {correct}/{total} événements dans le bon ordre en {elapsedTime}s
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 mb-4 shadow-inner">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">Score final</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-gray-700">Points de précision :</span>
                  <span className="font-semibold text-blue-600">{accuracyScore} pts</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-gray-700">Points de temps :</span>
                  <span className="font-semibold text-purple-600">{timeScore} pts</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded border-2 border-green-300">
                  <span className="font-bold text-gray-900">Total :</span>
                  <span className="font-bold text-green-700 text-xl">{finalScore} / 2000 pts</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="btn-primary inline-flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Rejouer
              </button>
            </div>
          </div>
        )
      })()}

      {/* Règles */}
      {!gameStarted && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <h4 className="font-semibold text-indigo-900 mb-3 flex items-center">
            <ArrowRight className="w-5 h-5 mr-2" />
            Comment jouer ?
          </h4>
          <div className="space-y-2 text-sm text-indigo-800">
            <p>Cliquez sur un événement disponible, puis sur un emplacement de la timeline pour le placer dans l'ordre chronologique.</p>
            <p className="font-semibold">Placez tous les événements dans le bon ordre !</p>
          </div>
        </div>
      )}

      {/* Bouton de démarrage */}
      {!gameStarted && (
        <div className="text-center">
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white text-lg px-8 py-3 rounded-lg font-bold hover:from-orange-700 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🕐 Commencer le jeu
          </button>
        </div>
      )}

      {/* Zone de jeu */}
      {gameStarted && (
        <div className="space-y-8">
          {/* Timeline */}
          <div className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">
              📅 Timeline chronologique
            </h3>
            
            <div className="relative">
              {/* Ligne de timeline */}
              <div className="absolute left-0 right-0 top-1/2 h-2 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 rounded-full transform -translate-y-1/2" />
              
              {/* Événements placés */}
              <div className="relative flex justify-between items-center">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="flex flex-col items-center relative z-10">
                    <button
                      onClick={() => handleTimelineSlotClick(index)}
                      className={`
                        w-24 h-24 rounded-full flex items-center justify-center text-center font-semibold text-sm transition-all duration-300 transform
                        ${event.placed
                          ? feedback[event.id] === 'correct'
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white border-4 border-green-600 shadow-xl scale-110'
                            : 'bg-gradient-to-br from-red-400 to-red-500 text-white border-4 border-red-600 shadow-xl scale-110'
                          : 'bg-white text-gray-400 border-4 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 shadow-md hover:scale-105'
                        }
                        ${selectedEvent ? 'cursor-pointer' : 'cursor-default'}
                      `}
                    >
                      {event.placed ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs mb-1">{event.text}</span>
                          {feedback[event.id] === 'correct' ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <XCircle className="w-6 h-6" />
                          )}
                        </div>
                      ) : (
                        <span className="text-2xl">?</span>
                      )}
                    </button>
                    <div className="mt-2 text-xs font-medium text-gray-600">
                      Étape {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Événements disponibles */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📋 Événements disponibles
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableEvents.map((event) => {
                const isSelected = selectedEvent === event.id
                const isPlaced = event.placed
                const feedbackType = feedback[event.id]
                
                return (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    disabled={isPlaced || gameFinished}
                    className={`
                      p-4 rounded-lg text-left transition-all duration-300 transform
                      ${isPlaced
                        ? 'bg-gray-200 text-gray-400 border-2 border-gray-300 cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white border-2 border-orange-600 shadow-lg scale-105'
                        : feedbackType === 'correct'
                        ? 'bg-green-100 text-green-900 border-2 border-green-400'
                        : feedbackType === 'incorrect'
                        ? 'bg-red-100 text-red-900 border-2 border-red-400'
                        : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-orange-400 hover:bg-orange-50 shadow-md hover:scale-102'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="font-medium">{event.text}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


