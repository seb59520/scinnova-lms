import { useState, useEffect } from 'react'
import { RotateCcw, Trophy, Clock, FolderOpen, Sparkles } from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

interface CategoryItem {
  id: string
  text: string
  categoryId: string
}

type CorrectCategory = 
  | { item: string; category: string }
  | { item: number; category: number }

interface CategoryGameProps {
  categories: Array<{ name: string; color: string; icon?: string }>
  items: string[]
  correctCategories: Array<CorrectCategory>
  onScore: (score: number, metadata: { attempts: number; time: number; total: number; correct: number }) => void
  description?: string
}

export function CategoryGame({ 
  categories, 
  items, 
  correctCategories, 
  onScore, 
  description 
}: CategoryGameProps) {
  const [categoryList, setCategoryList] = useState<Category[]>([])
  const [availableItems, setAvailableItems] = useState<CategoryItem[]>([])
  const [categoryItems, setCategoryItems] = useState<Record<string, CategoryItem[]>>({})
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({})

  // Normaliser les catégories correctes
  const normalizedCategories: Record<string, string> = (() => {
    const result: Record<string, string> = {}
    correctCategories.forEach(cat => {
      if (typeof cat.item === 'string' && typeof cat.category === 'string') {
        result[cat.item] = cat.category
      } else if (typeof cat.item === 'number' && typeof cat.category === 'number') {
        result[items[cat.item]] = categories[cat.category]?.name || ''
      }
    })
    return result
  })()

  // Initialiser les catégories et items
  useEffect(() => {
    if (categories.length === 0 || items.length === 0) return

    const cats: Category[] = categories.map((cat, index) => ({
      id: `cat-${index}`,
      name: cat.name,
      color: cat.color,
      icon: cat.icon
    }))

    const shuffledItems: CategoryItem[] = items
      .map((text, index) => ({
        id: `item-${index}`,
        text,
        categoryId: ''
      }))
      .sort(() => Math.random() - 0.5)

    setCategoryList(cats)
    setAvailableItems(shuffledItems)
    setCategoryItems(cats.reduce((acc, cat) => {
      acc[cat.id] = []
      return acc
    }, {} as Record<string, CategoryItem[]>))
  }, [categories, items])

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
    setDraggedItem(null)
    setDragOverCategory(null)
    setFeedback({})
    
    const shuffledItems: CategoryItem[] = items
      .map((text, index) => ({
        id: `item-${index}`,
        text,
        categoryId: ''
      }))
      .sort(() => Math.random() - 0.5)

    setAvailableItems(shuffledItems)
    setCategoryItems(categoryList.reduce((acc, cat) => {
      acc[cat.id] = []
      return acc
    }, {} as Record<string, CategoryItem[]>))
  }

  const handleDragStart = (itemId: string) => {
    if (!gameStarted || gameFinished) return
    setDraggedItem(itemId)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverCategory(null)
  }

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    if (draggedItem) {
      setDragOverCategory(categoryId)
    }
  }

  const handleDragLeave = () => {
    setDragOverCategory(null)
  }

  const handleDrop = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    if (!draggedItem || !gameStarted || gameFinished) return

    const item = availableItems.find(i => i.id === draggedItem)
    if (!item) return

    // Retirer l'item de sa catégorie précédente si elle existe
    const previousCategoryId = item.categoryId
    if (previousCategoryId) {
      setCategoryItems(prev => ({
        ...prev,
        [previousCategoryId]: prev[previousCategoryId].filter(i => i.id !== item.id)
      }))
    }

    // Retirer de la liste disponible
    setAvailableItems(prev => prev.filter(i => i.id !== item.id))

    // Ajouter à la nouvelle catégorie
    const updatedItem = { ...item, categoryId }
    setCategoryItems(prev => ({
      ...prev,
      [categoryId]: [...prev[categoryId], updatedItem]
    }))

    // Vérifier si c'est correct
    const category = categoryList.find(c => c.id === categoryId)
    const isCorrect = normalizedCategories[item.text] === category?.name

    setAttempts(prev => prev + 1)
    setFeedback(prev => ({ ...prev, [item.id]: isCorrect ? 'correct' : 'incorrect' }))

    setDraggedItem(null)
    setDragOverCategory(null)

    // Vérifier si le jeu est terminé
    setTimeout(() => {
      const allCategorized = availableItems.length === 1 && categoryItems[categoryId]?.length === items.length
      if (allCategorized || Object.values(categoryItems).flat().length === items.length) {
        checkCompletion()
      }
    }, 100)
  }

  const handleItemClick = (itemId: string, categoryId: string) => {
    if (!gameStarted || gameFinished) return

    const item = availableItems.find(i => i.id === itemId) || 
                 Object.values(categoryItems).flat().find(i => i.id === itemId)
    if (!item) return

    // Si l'item est déjà dans une catégorie, le retirer
    if (item.categoryId) {
      setCategoryItems(prev => ({
        ...prev,
        [item.categoryId]: prev[item.categoryId].filter(i => i.id !== item.id)
      }))
      setAvailableItems(prev => [...prev, { ...item, categoryId: '' }])
    } else {
      // Ajouter à la catégorie
      setAvailableItems(prev => prev.filter(i => i.id !== item.id))
      setCategoryItems(prev => ({
        ...prev,
        [categoryId]: [...prev[categoryId], { ...item, categoryId }]
      }))

      const category = categoryList.find(c => c.id === categoryId)
      const isCorrect = normalizedCategories[item.text] === category?.name

      setAttempts(prev => prev + 1)
      setFeedback(prev => ({ ...prev, [item.id]: isCorrect ? 'correct' : 'incorrect' }))
    }

    setTimeout(() => {
      if (Object.values(categoryItems).flat().length + (item.categoryId ? 0 : 1) === items.length) {
        checkCompletion()
      }
    }, 100)
  }

  const checkCompletion = () => {
    const allCategorized = Object.values(categoryItems).flat().length === items.length
    if (allCategorized) {
      setGameFinished(true)
      calculateScore()
    }
  }

  const calculateScore = () => {
    if (!startTime) return

    const time = Math.floor((Date.now() - startTime) / 1000)
    const total = items.length
    const correct = Object.values(categoryItems).flat().filter(item => {
      const category = categoryList.find(c => c.id === item.categoryId)
      return normalizedCategories[item.text] === category?.name
    }).length

    const accuracyScore = Math.floor((correct / total) * 1000)
    const timeScore = Math.max(0, 1000 - (time * 5))
    const totalScore = Math.max(0, Math.floor(accuracyScore + timeScore))

    onScore(totalScore, {
      attempts,
      time,
      total,
      correct
    })
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameFinished(false)
    setDraggedItem(null)
    setDragOverCategory(null)
    setAttempts(0)
    setElapsedTime(0)
    setStartTime(null)
    setFeedback({})
    
    const shuffledItems: CategoryItem[] = items
      .map((text, index) => ({
        id: `item-${index}`,
        text,
        categoryId: ''
      }))
      .sort(() => Math.random() - 0.5)

    setAvailableItems(shuffledItems)
    setCategoryItems(categoryList.reduce((acc, cat) => {
      acc[cat.id] = []
      return acc
    }, {} as Record<string, CategoryItem[]>))
  }

  if (categories.length === 0 || items.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Configuration incomplète. Veuillez configurer les catégories et les items.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {description && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4">
          <p className="text-pink-800">{description}</p>
        </div>
      )}

      {/* Statistiques */}
      {gameStarted && (
        <div className="flex items-center justify-center gap-6 bg-gradient-to-r from-white to-pink-50 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Temps: <span className="text-pink-600 font-bold">{elapsedTime}s</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Tentatives: <span className="text-pink-600 font-bold">{attempts}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Classés: <span className="text-pink-600 font-bold">{Object.values(categoryItems).flat().length}/{items.length}</span>
            </span>
          </div>
        </div>
      )}

      {/* Message de fin */}
      {gameFinished && (() => {
        const total = items.length
        const correct = Object.values(categoryItems).flat().filter(item => {
          const category = categoryList.find(c => c.id === item.categoryId)
          return normalizedCategories[item.text] === category?.name
        }).length
        const accuracyScore = Math.floor((correct / total) * 1000)
        const timeScore = Math.max(0, 1000 - (elapsedTime * 5))
        const finalScore = Math.max(0, Math.floor(accuracyScore + timeScore))
        
        return (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">🎉 Classification terminée !</h3>
              <p className="text-green-800 mb-4">
                {correct}/{total} items correctement classés en {elapsedTime}s
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
            <FolderOpen className="w-5 h-5 mr-2" />
            Comment jouer ?
          </h4>
          <div className="space-y-2 text-sm text-indigo-800">
            <p>Glissez-déposez ou cliquez sur les items pour les classer dans les bonnes catégories.</p>
            <p className="font-semibold">Les items correctement classés apparaîtront en vert !</p>
          </div>
        </div>
      )}

      {/* Bouton de démarrage */}
      {!gameStarted && (
        <div className="text-center">
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white text-lg px-8 py-3 rounded-lg font-bold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            📁 Commencer le jeu
          </button>
        </div>
      )}

      {/* Zone de jeu */}
      {gameStarted && (
        <div className="space-y-8">
          {/* Catégories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryList.map((category) => {
              const itemsInCategory = categoryItems[category.id] || []
              const isDragOver = dragOverCategory === category.id
              
              return (
                <div
                  key={category.id}
                  onDragOver={(e) => handleDragOver(e, category.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, category.id)}
                  className={`
                    rounded-xl p-6 transition-all duration-300 transform
                    ${isDragOver ? 'scale-105 shadow-2xl' : 'shadow-lg'}
                  `}
                  style={{
                    background: `linear-gradient(135deg, ${category.color}15, ${category.color}25)`,
                    border: `3px solid ${isDragOver ? category.color : category.color + '40'}`
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {category.icon && (
                      <span className="text-3xl">{category.icon}</span>
                    )}
                    <h3 className="text-xl font-bold" style={{ color: category.color }}>
                      {category.name}
                    </h3>
                    <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-white/50" style={{ color: category.color }}>
                      {itemsInCategory.length}
                    </span>
                  </div>
                  
                  <div className="min-h-[150px] space-y-2">
                    {itemsInCategory.map((item) => {
                      const isCorrect = feedback[item.id] === 'correct'
                      const isIncorrect = feedback[item.id] === 'incorrect'
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleItemClick(item.id, category.id)}
                          className={`
                            p-3 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105
                            ${isCorrect
                              ? 'bg-green-100 border-2 border-green-400 text-green-900'
                              : isIncorrect
                              ? 'bg-red-100 border-2 border-red-400 text-red-900'
                              : 'bg-white border-2 border-gray-300 text-gray-900 hover:border-gray-400'
                            }
                            ${gameFinished ? 'cursor-default' : ''}
                          `}
                        >
                          <div className="font-medium text-sm">{item.text}</div>
                        </div>
                      )
                    })}
                    
                    {itemsInCategory.length === 0 && (
                      <div className="h-full flex items-center justify-center text-gray-400 italic text-sm border-2 border-dashed border-gray-300 rounded-lg p-4">
                        Déposez des items ici...
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Items disponibles */}
          {availableItems.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Items disponibles
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableItems.map((item) => {
                  const isDragged = draggedItem === item.id
                  const feedbackType = feedback[item.id]
                  
                  return (
                    <div
                      key={item.id}
                      draggable={!gameFinished}
                      onDragStart={() => handleDragStart(item.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        // Permettre de cliquer pour voir les catégories disponibles
                        if (!gameFinished) {
                          // Optionnel: afficher un menu de sélection
                        }
                      }}
                      className={`
                        p-4 rounded-lg cursor-move transition-all duration-200 transform hover:scale-105
                        ${isDragged
                          ? 'opacity-50 scale-95'
                          : feedbackType === 'correct'
                          ? 'bg-green-100 border-2 border-green-400 text-green-900'
                          : feedbackType === 'incorrect'
                          ? 'bg-red-100 border-2 border-red-400 text-red-900'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 text-gray-900 hover:border-pink-400 hover:shadow-md'
                        }
                        ${gameFinished ? 'cursor-default' : ''}
                      `}
                    >
                      <div className="font-medium text-sm text-center">{item.text}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



