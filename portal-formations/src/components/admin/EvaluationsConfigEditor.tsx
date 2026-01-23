import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, X, CheckCircle } from 'lucide-react'
import { EvaluationsConfig, EvaluationItem, Item } from '../../types/database'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'

interface EvaluationsConfigEditorProps {
  courseId?: string
  programId?: string
  config: EvaluationsConfig | null
  onChange: (config: EvaluationsConfig | null) => void
}

export function EvaluationsConfigEditor({ courseId, programId, config, onChange }: EvaluationsConfigEditorProps) {
  const { profile } = useAuth()
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [availableEvaluations, setAvailableEvaluations] = useState<Array<{id: string, title: string}>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showItemSelector, setShowItemSelector] = useState(false)
  
  const isAdmin = profile?.role === 'admin' || profile?.role === 'trainer' || profile?.role === 'instructor'

  useEffect(() => {
    if (courseId && courseId !== 'new') {
      fetchCourseItems()
    } else if (programId && programId !== 'new') {
      fetchProgramItems()
    } else {
      setLoading(false)
    }
  }, [courseId, programId, profile])

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

  const fetchProgramItems = async () => {
    try {
      setLoading(true)
      
      // Calculer isAdmin localement pour éviter les problèmes de closure
      const currentIsAdmin = profile?.role === 'admin' || profile?.role === 'trainer' || profile?.role === 'instructor'
      
      // 1. Récupérer les cours du programme
      const { data: programCourses, error: pcError } = await supabase
        .from('program_courses')
        .select('course_id')
        .eq('program_id', programId)

      if (pcError) {
        console.error('❌ Erreur lors de la récupération des cours du programme:', pcError)
        throw pcError
      }

      console.log('📚 Cours du programme trouvés:', programCourses?.length || 0)

      const courseIds = (programCourses || []).map(pc => pc.course_id)
      
      // 2. Récupérer les modules de ces cours (seulement si on a des cours)
      let moduleIds: string[] = []
      if (courseIds.length > 0) {
        const { data: modules, error: modulesError } = await supabase
          .from('modules')
          .select('id, course_id')
          .in('course_id', courseIds)

        if (modulesError) {
          console.error('❌ Erreur lors de la récupération des modules:', modulesError)
          throw modulesError
        }

        moduleIds = (modules || []).map(m => m.id)
        console.log('📦 Modules trouvés:', moduleIds.length)

        // 3. Récupérer les items (TP, exercices, jeux) de ces modules
        if (moduleIds.length > 0) {
          const { data: items, error: itemsError } = await supabase
            .from('items')
            .select('*')
            .in('module_id', moduleIds)
            .in('type', ['exercise', 'activity', 'tp', 'game'])
            .eq('published', true)
            .order('position', { ascending: true })

          if (itemsError) {
            console.error('❌ Erreur lors de la récupération des items:', itemsError)
            throw itemsError
          }
          console.log('✅ Items trouvés:', items?.length || 0)
          setAvailableItems(items || [])
        } else {
          setAvailableItems([])
        }
      } else {
        setAvailableItems([])
      }

      // 4. Récupérer les évaluations de programme (quiz)
      console.log('🔍 Récupération des évaluations de programme pour programId:', programId)
      console.log('👤 Utilisateur actuel:', { 
        profileId: profile?.id, 
        role: profile?.role,
        isAdmin: currentIsAdmin 
      })
      
      try {
        // Essayer d'abord sans filtre pour voir toutes les évaluations
        const { data: allEvaluations, error: allError } = await supabase
          .from('program_evaluations')
          .select('id, title, is_published, program_id, created_at')
          .eq('program_id', programId)
          .order('created_at', { ascending: true })

        console.log('📊 Résultat COMPLET de la requête program_evaluations:', {
          allEvaluations,
          error: allError,
          count: allEvaluations?.length || 0,
          isAdmin: currentIsAdmin,
          programId,
          errorDetails: allError ? {
            code: allError.code,
            message: allError.message,
            details: allError.details,
            hint: allError.hint
          } : null
        })

        if (allError) {
          console.error('❌ Error fetching program evaluations:', {
            error: allError,
            code: allError.code,
            message: allError.message,
            details: allError.details,
            hint: allError.hint
          })
          setAvailableEvaluations([])
        } else {
          // Pour les admins, afficher toutes les évaluations (publiées et non publiées)
          // Pour les autres, afficher uniquement les publiées
          const filteredEvaluations = currentIsAdmin 
            ? (allEvaluations || [])
            : (allEvaluations || []).filter(evaluation => evaluation.is_published === true)
          
          console.log('✅ Évaluations après filtrage:', {
            total: allEvaluations?.length || 0,
            filtered: filteredEvaluations.length,
            isAdmin: currentIsAdmin,
            evaluations: filteredEvaluations.map(e => ({
              id: e.id,
              title: e.title,
              is_published: e.is_published
            }))
          })
          
          setAvailableEvaluations(filteredEvaluations.map(e => ({ id: e.id, title: e.title })))
          
          // Si aucune évaluation n'est trouvée, essayer une requête alternative
          if (filteredEvaluations.length === 0 && allEvaluations?.length === 0) {
            console.warn('⚠️ Aucune évaluation trouvée. Vérification si des évaluations existent pour ce programme...')
            
            // Essayer une requête plus simple pour voir si le problème vient de RLS
            const { data: countData, error: countError } = await supabase
              .from('program_evaluations')
              .select('id', { count: 'exact', head: true })
              .eq('program_id', programId)
            
            console.log('🔍 Test de comptage (head: true):', { 
              count: countData, 
              error: countError 
            })
            
            // Essayer aussi sans filtre program_id pour voir toutes les évaluations
            if (currentIsAdmin) {
              const { data: allProgramEvals, error: allEvalsError } = await supabase
                .from('program_evaluations')
                .select('id, title, program_id, is_published')
                .limit(10)
              
              console.log('🔍 Toutes les évaluations (admin, limit 10):', {
                data: allProgramEvals,
                error: allEvalsError,
                count: allProgramEvals?.length || 0
              })
            }
          }
        }
      } catch (fetchError) {
        console.error('❌ Exception lors de la récupération des évaluations:', fetchError)
        setAvailableEvaluations([])
      }
    } catch (error) {
      console.error('Error fetching program items:', error)
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

  const addEvaluation = (evaluation: {id: string, title: string}) => {
    const newEvalItem: EvaluationItem = {
      itemId: evaluation.id, // Pour les évaluations, on utilise l'ID de l'évaluation
      title: evaluation.title,
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

  const filteredAvailableEvaluations = availableEvaluations.filter(evaluation =>
    !currentItems.some(ci => ci.itemId === evaluation.id) &&
    evaluation.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const idToCheck = courseId || programId
  if (idToCheck === 'new') {
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
              ) : filteredAvailableItems.length === 0 && filteredAvailableEvaluations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {searchTerm ? 'Aucun element trouve' : 'Aucun element disponible'}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Afficher les évaluations de programme (quiz) en premier */}
                  {filteredAvailableEvaluations.length > 0 && (
                    <>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                        Quiz / Évaluations
                      </div>
                      {filteredAvailableEvaluations.map(evaluation => (
                        <button
                          key={evaluation.id}
                          onClick={() => addEvaluation(evaluation)}
                          className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                        >
                          <span className="w-3 h-3 rounded-full flex-shrink-0 bg-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{evaluation.title}</p>
                            <p className="text-xs text-gray-500">Quiz</p>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </button>
                      ))}
                      {filteredAvailableItems.length > 0 && (
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-4 px-2">
                          TP / Exercices
                        </div>
                      )}
                    </>
                  )}
                  {/* Afficher les items (TP, exercices) */}
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
