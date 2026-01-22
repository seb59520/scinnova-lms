import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, X, CheckCircle } from 'lucide-react'
import { EvaluationsConfig, EvaluationItem, Item } from '../../types/database'
import { supabase } from '../../lib/supabaseClient'

interface EvaluationsConfigEditorProps {
  courseId: string
  config: EvaluationsConfig | null
  onChange: (config: EvaluationsConfig | null) => void
}

export function EvaluationsConfigEditor({ courseId, config, onChange }: EvaluationsConfigEditorProps) {
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showItemSelector, setShowItemSelector] = useState(false)

  useEffect(() => {
    if (courseId && courseId !== 'new') {
      fetchCourseItems()
    } else {
      setLoading(false)
    }
  }, [courseId])

  const fetchCourseItems = async () => {
    try {
      setLoading(true)
      // Get modules for this course
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId)

      if (modulesError) throw modulesError

      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id)

        // Get items that could be evaluations (exercises, activities, TPs)
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .in('module_id', moduleIds)
          .in('type', ['exercise', 'activity', 'tp', 'game'])
          .order('position', { ascending: true })

        if (itemsError) throw itemsError
        setAvailableItems(items || [])
      }
    } catch (error) {
      console.error('Error fetching course items:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentItems = config?.items || []
  const passingScore = config?.passingScore ?? 60

  const addItem = (item: Item) => {
    const newEvalItem: EvaluationItem = {
      itemId: item.id,
      title: item.title,
      weight: 1,
      threshold: undefined
    }

    const newConfig: EvaluationsConfig = {
      items: [...currentItems, newEvalItem],
      passingScore
    }

    onChange(newConfig)
    setShowItemSelector(false)
    setSearchTerm('')
  }

  const updateItem = (itemId: string, updates: Partial<EvaluationItem>) => {
    const newItems = currentItems.map(item =>
      item.itemId === itemId ? { ...item, ...updates } : item
    )

    onChange({
      items: newItems,
      passingScore
    })
  }

  const removeItem = (itemId: string) => {
    const newItems = currentItems.filter(item => item.itemId !== itemId)
    onChange({
      items: newItems,
      passingScore
    })
  }

  const updatePassingScore = (score: number) => {
    onChange({
      items: currentItems,
      passingScore: score
    })
  }

  const totalWeight = currentItems.reduce((sum, item) => sum + item.weight, 0)

  const filteredAvailableItems = availableItems.filter(item =>
    !currentItems.some(ci => ci.itemId === item.id) &&
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (courseId === 'new') {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
        <p className="text-gray-500 text-sm">
          Sauvegardez la formation d'abord pour configurer les evaluations.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Configuration des evaluations ({currentItems.length})
        </h3>
        <button
          type="button"
          onClick={() => setShowItemSelector(true)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Passing score */}
      <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <label className="text-sm text-green-800">Score de reussite:</label>
        <input
          type="number"
          min="0"
          max="100"
          value={passingScore}
          onChange={(e) => updatePassingScore(parseInt(e.target.value) || 0)}
          className="w-20 input-field text-sm text-center"
        />
        <span className="text-sm text-green-700">%</span>
      </div>

      {currentItems.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">
            Aucune evaluation configuree.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Ajoutez des exercices, TP ou activites comme evaluations
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentItems.map((evalItem, index) => (
            <div
              key={evalItem.itemId}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                {index + 1}
              </span>

              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{evalItem.title}</p>
                <p className="text-xs text-gray-500">
                  Coefficient: {evalItem.weight} ({totalWeight > 0 ? Math.round((evalItem.weight / totalWeight) * 100) : 0}%)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Coef:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={evalItem.weight}
                  onChange={(e) => updateItem(evalItem.itemId, { weight: parseInt(e.target.value) || 1 })}
                  className="w-16 input-field text-sm text-center"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Seuil:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={evalItem.threshold || ''}
                  onChange={(e) => updateItem(evalItem.itemId, {
                    threshold: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="w-16 input-field text-sm text-center"
                  placeholder="-"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>

              <button
                type="button"
                onClick={() => removeItem(evalItem.itemId)}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                title="Retirer cette evaluation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Total weight indicator */}
      {currentItems.length > 0 && (
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          Poids total: {totalWeight} ({currentItems.length} evaluation(s))
        </div>
      )}

      {/* Item selector modal */}
      {showItemSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Selectionner une evaluation</h3>
              <button
                onClick={() => {
                  setShowItemSelector(false)
                  setSearchTerm('')
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full input-field pl-9 text-sm"
                  placeholder="Rechercher un element..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredAvailableItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {searchTerm ? 'Aucun element trouve' : 'Aucun element disponible'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        item.type === 'exercise' ? 'bg-yellow-500' :
                        item.type === 'activity' ? 'bg-orange-500' :
                        item.type === 'tp' ? 'bg-purple-500' :
                        item.type === 'game' ? 'bg-pink-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                      </div>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowItemSelector(false)
                  setSearchTerm('')
                }}
                className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
