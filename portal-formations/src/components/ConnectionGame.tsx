import { useState, useEffect, useRef } from 'react'
import { RotateCcw, Trophy, Clock, Sparkles, Zap } from 'lucide-react'

interface ConnectionItem {
  id: string
  text: string
  position: { x: number; y: number }
  connectedTo?: string
}

type CorrectMatch = 
  | { left: number; right: number }
  | { left: string; right: string }

interface ConnectionGameProps {
  leftColumn: string[]
  rightColumn: string[]
  correctMatches: Array<CorrectMatch>
  onScore: (score: number, metadata: { attempts: number; time: number; totalMatches: number }) => void
  description?: string
}

export function ConnectionGame({ 
  leftColumn, 
  rightColumn, 
  correctMatches, 
  onScore, 
  description 
}: ConnectionGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const normalizedMatches: Array<{ left: number; right: number }> = correctMatches.map(match => {
    if (typeof match.left === 'string' && typeof match.right === 'string') {
      const leftIndex = leftColumn.findIndex(text => text === match.left)
      const rightIndex = rightColumn.findIndex(text => text === match.right)
      if (leftIndex === -1 || rightIndex === -1) return { left: -1, right: -1 }
      return { left: leftIndex, right: rightIndex }
    }
    return match as { left: number; right: number }
  }).filter(match => match.left >= 0 && match.right >= 0)

  const [leftItems, setLeftItems] = useState<ConnectionItem[]>([])
  const [rightItems, setRightItems] = useState<ConnectionItem[]>([])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
  const [attempts, setAttempts] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [animations, setAnimations] = useState<Array<{ from: string; to: string; correct: boolean; progress: number }>>([])

  // Initialiser les items avec positions
  useEffect(() => {
    if (leftColumn.length === 0 || rightColumn.length === 0) return

    const left: ConnectionItem[] = leftColumn.map((text, index) => ({
      id: `left-${index}`,
      text,
      position: { x: 0, y: 0 }
    }))

    const right: ConnectionItem[] = rightColumn.map((text, index) => ({
      id: `right-${index}`,
      text,
      position: { x: 0, y: 0 }
    }))

    setLeftItems(left)
    setRightItems(right)
  }, [leftColumn, rightColumn])

  // Calculer les positions après le rendu
  useEffect(() => {
    if (!containerRef.current || leftItems.length === 0) return

    const updatePositions = () => {
      const leftElements = containerRef.current?.querySelectorAll('[data-left-item]')
      const rightElements = containerRef.current?.querySelectorAll('[data-right-item]')
      
      if (leftElements && rightElements) {
        setLeftItems(prev => prev.map((item, index) => {
          const el = leftElements[index] as HTMLElement
          if (el) {
            const rect = el.getBoundingClientRect()
            const containerRect = containerRef.current!.getBoundingClientRect()
            return {
              ...item,
              position: {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2
              }
            }
          }
          return item
        }))

        setRightItems(prev => prev.map((item, index) => {
          const el = rightElements[index] as HTMLElement
          if (el) {
            const rect = el.getBoundingClientRect()
            const containerRect = containerRef.current!.getBoundingClientRect()
            return {
              ...item,
              position: {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2
              }
            }
          }
          return item
        }))
      }
    }

    setTimeout(updatePositions, 100)
    window.addEventListener('resize', updatePositions)
    return () => window.removeEventListener('resize', updatePositions)
  }, [leftItems.length, rightItems.length, gameStarted])

  // Dessiner les lignes de connexion
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = containerRef.current
    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Dessiner les connexions validées
      matchedPairs.forEach(leftId => {
        const leftItem = leftItems.find(item => item.id === leftId)
        const rightItem = rightItems.find(item => item.id === leftItem?.connectedTo)
        
        if (leftItem && rightItem && leftItem.position.x > 0 && rightItem.position.x > 0) {
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 3
          ctx.shadowColor = '#10b981'
          ctx.shadowBlur = 10
          ctx.beginPath()
          ctx.moveTo(leftItem.position.x, leftItem.position.y)
          ctx.bezierCurveTo(
            leftItem.position.x + (rightItem.position.x - leftItem.position.x) * 0.5,
            leftItem.position.y,
            leftItem.position.x + (rightItem.position.x - leftItem.position.x) * 0.5,
            rightItem.position.y,
            rightItem.position.x,
            rightItem.position.y
          )
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      })

      // Dessiner les animations de feedback
      animations.forEach(anim => {
        const leftItem = leftItems.find(item => item.id === anim.from)
        const rightItem = rightItems.find(item => item.id === anim.to)
        
        if (leftItem && rightItem && leftItem.position.x > 0 && rightItem.position.x > 0) {
          ctx.strokeStyle = anim.correct ? '#10b981' : '#ef4444'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.globalAlpha = 1 - anim.progress
          ctx.beginPath()
          ctx.moveTo(leftItem.position.x, leftItem.position.y)
          ctx.bezierCurveTo(
            leftItem.position.x + (rightItem.position.x - leftItem.position.x) * 0.5,
            leftItem.position.y,
            leftItem.position.x + (rightItem.position.x - leftItem.position.x) * 0.5,
            rightItem.position.y,
            rightItem.position.x,
            rightItem.position.y
          )
          ctx.stroke()
          ctx.setLineDash([])
          ctx.globalAlpha = 1
        }
      })

      // Dessiner la ligne de sélection temporaire
      if (selectedLeft && !matchedPairs.has(selectedLeft)) {
        const leftItem = leftItems.find(item => item.id === selectedLeft)
        if (leftItem && leftItem.position.x > 0) {
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.globalAlpha = 0.5
          ctx.beginPath()
          ctx.moveTo(leftItem.position.x, leftItem.position.y)
          ctx.lineTo(canvas.width / 2, leftItem.position.y)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.globalAlpha = 1
        }
      }
    }

    draw()
    const interval = setInterval(draw, 16)
    return () => clearInterval(interval)
  }, [leftItems, rightItems, matchedPairs, selectedLeft, animations])

  // Animer les feedbacks
  useEffect(() => {
    if (animations.length === 0) return

    const interval = setInterval(() => {
      setAnimations(prev => 
        prev.map(anim => ({ ...anim, progress: Math.min(anim.progress + 0.05, 1) }))
          .filter(anim => anim.progress < 1)
      )
    }, 50)

    return () => clearInterval(interval)
  }, [animations.length])

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
    setMatchedPairs(new Set())
    setGameFinished(false)
    setSelectedLeft(null)
    setSelectedRight(null)
    setLeftItems(prev => prev.map(item => ({ ...item, connectedTo: undefined })))
    setRightItems(prev => prev.map(item => ({ ...item, connectedTo: undefined })))
  }

  const handleLeftClick = (itemId: string) => {
    if (!gameStarted || gameFinished || matchedPairs.has(itemId)) return

    if (selectedLeft === itemId) {
      setSelectedLeft(null)
    } else {
      setSelectedLeft(itemId)
      setSelectedRight(null)
      
      if (selectedRight) {
        checkMatch(itemId, selectedRight)
      }
    }
  }

  const handleRightClick = (itemId: string) => {
    if (!gameStarted || gameFinished) return
    const rightItem = rightItems.find(item => item.id === itemId)
    if (rightItem?.connectedTo) return

    if (selectedRight === itemId) {
      setSelectedRight(null)
    } else {
      setSelectedRight(itemId)
      setSelectedLeft(null)
      
      if (selectedLeft) {
        checkMatch(selectedLeft, itemId)
      }
    }
  }

  const checkMatch = (leftId: string, rightId: string) => {
    const leftIndex = parseInt(leftId.split('-')[1])
    const rightIndex = parseInt(rightId.split('-')[1])
    
    const isCorrect = normalizedMatches.some(
      match => match.left === leftIndex && match.right === rightIndex
    )

    setAttempts(prev => prev + 1)

    // Animation de feedback
    setAnimations(prev => [...prev, { from: leftId, to: rightId, correct: isCorrect, progress: 0 }])

    if (isCorrect) {
      setMatchedPairs(prev => new Set([...prev, leftId, rightId]))
      setLeftItems(prev => prev.map(item => 
        item.id === leftId ? { ...item, connectedTo: rightId } : item
      ))
      setRightItems(prev => prev.map(item => 
        item.id === rightId ? { ...item, connectedTo: leftId } : item
      ))
    }

    setSelectedLeft(null)
    setSelectedRight(null)
  }

  useEffect(() => {
    if (matchedPairs.size === normalizedMatches.length * 2 && normalizedMatches.length > 0 && gameStarted) {
      setGameFinished(true)
      calculateScore()
    }
  }, [matchedPairs.size, normalizedMatches.length, gameStarted])

  const calculateScore = () => {
    if (!startTime) return

    const time = Math.floor((Date.now() - startTime) / 1000)
    const totalMatches = normalizedMatches.length
    
    const timeScore = Math.max(0, 1000 - (time * 5))
    const attemptsScore = Math.max(0, 1000 - ((attempts - totalMatches) * 100))
    const totalScore = Math.max(0, Math.floor(timeScore + attemptsScore))

    onScore(totalScore, {
      attempts,
      time,
      totalMatches
    })
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameFinished(false)
    setSelectedLeft(null)
    setSelectedRight(null)
    setMatchedPairs(new Set())
    setAttempts(0)
    setElapsedTime(0)
    setStartTime(null)
    setLeftItems(prev => prev.map(item => ({ ...item, connectedTo: undefined })))
    setRightItems(prev => prev.map(item => ({ ...item, connectedTo: undefined })))
  }

  if (leftColumn.length === 0 || rightColumn.length === 0 || normalizedMatches.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Configuration incomplète. Veuillez configurer les colonnes et les correspondances.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {description && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">{description}</p>
        </div>
      )}

      {/* Statistiques */}
      {gameStarted && (
        <div className="flex items-center justify-center gap-6 bg-gradient-to-r from-white to-blue-50 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Temps: <span className="text-blue-600 font-bold">{elapsedTime}s</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Tentatives: <span className="text-blue-600 font-bold">{attempts}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Connexions: <span className="text-blue-600 font-bold">{matchedPairs.size / 2}/{normalizedMatches.length}</span>
            </span>
          </div>
        </div>
      )}

      {/* Message de fin */}
      {gameFinished && (() => {
        const totalMatches = normalizedMatches.length
        const timeScore = Math.max(0, 1000 - (elapsedTime * 5))
        const attemptsScore = Math.max(0, 1000 - ((attempts - totalMatches) * 100))
        const finalScore = Math.max(0, Math.floor(timeScore + attemptsScore))
        
        return (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">🎉 Excellent travail !</h3>
              <p className="text-green-800 mb-4">
                Toutes les connexions établies en {elapsedTime}s avec {attempts} tentatives
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 mb-4 shadow-inner">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">Score final</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-gray-700">Points de temps :</span>
                  <span className="font-semibold text-blue-600">{timeScore} pts</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-gray-700">Points de précision :</span>
                  <span className="font-semibold text-purple-600">{attemptsScore} pts</span>
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
            <Sparkles className="w-5 h-5 mr-2" />
            Comment jouer ?
          </h4>
          <div className="space-y-2 text-sm text-indigo-800">
            <p>Cliquez sur un élément de gauche, puis sur son correspondant à droite pour créer une connexion.</p>
            <p className="font-semibold">Les connexions correctes apparaîtront en vert avec une animation !</p>
          </div>
        </div>
      )}

      {/* Bouton de démarrage */}
      {!gameStarted && (
        <div className="text-center">
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg px-8 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🚀 Commencer le jeu
          </button>
        </div>
      )}

      {/* Zone de jeu avec canvas */}
      {gameStarted && (
        <div ref={containerRef} className="relative bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-8 min-h-[400px]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
          />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Colonne gauche */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 text-center mb-6 bg-white rounded-lg p-3 shadow-md">
                📋 Colonne 1
              </h3>
              {leftItems.map((item) => {
                const isMatched = matchedPairs.has(item.id)
                const isSelected = selectedLeft === item.id
                
                return (
                  <button
                    key={item.id}
                    data-left-item
                    onClick={() => handleLeftClick(item.id)}
                    disabled={isMatched || gameFinished}
                    className={`
                      w-full p-5 rounded-xl text-left transition-all duration-300 transform
                      ${isMatched
                        ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white border-2 border-green-500 shadow-lg scale-105'
                        : isSelected
                        ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white border-2 border-blue-600 shadow-lg scale-105'
                        : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:scale-102 shadow-md'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">{item.text}</span>
                      {isMatched && (
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Colonne droite */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 text-center mb-6 bg-white rounded-lg p-3 shadow-md">
                🎯 Colonne 2
              </h3>
              {rightItems.map((item) => {
                const isMatched = item.connectedTo !== undefined
                const isSelected = selectedRight === item.id
                
                return (
                  <button
                    key={item.id}
                    data-right-item
                    onClick={() => handleRightClick(item.id)}
                    disabled={isMatched || gameFinished}
                    className={`
                      w-full p-5 rounded-xl text-left transition-all duration-300 transform
                      ${isMatched
                        ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white border-2 border-green-500 shadow-lg scale-105'
                        : isSelected
                        ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white border-2 border-purple-600 shadow-lg scale-105'
                        : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 hover:scale-102 shadow-md'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">{item.text}</span>
                      {isMatched && (
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      )}
                    </div>
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

