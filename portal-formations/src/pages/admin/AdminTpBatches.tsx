import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { TpBatch, TpBatchWithItems, TpBatchItemWithItem, Course, Item } from '../../types/database'
import { Save, Plus, Trash2, ChevronUp, ChevronDown, X, GripVertical, Edit, Eye, EyeOff } from 'lucide-react'

export function AdminTpBatches() {
  const { batchId } = useParams<{ batchId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isNew = batchId === 'new'

  const [batch, setBatch] = useState<Partial<TpBatch>>({
    title: '',
    description: '',
    course_id: null,
    position: 0,
    is_published: true,
    sequential_order: false,
    metadata: {},
    created_by: user?.id
  })
  const [batchItems, setBatchItems] = useState<TpBatchItemWithItem[]>([])
  const [availableTps, setAvailableTps] = useState<Item[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTpIds, setSelectedTpIds] = useState<string[]>([])
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!isNew && batchId) {
      fetchBatch()
    }
    fetchAvailableTps()
    fetchAvailableCourses()
  }, [batchId, isNew])

  const fetchBatch = async () => {
    try {
      setLoading(true)
      setError('')

      // Récupérer le lot
      const { data: batchData, error: batchError } = await supabase
        .from('tp_batches')
        .select('*')
        .eq('id', batchId)
        .single()

      if (batchError) throw batchError
      setBatch(batchData)

      // Récupérer les TP du lot
      const { data: itemsData, error: itemsError } = await supabase
        .from('tp_batch_items')
        .select(`
          *,
          items (*),
          prerequisite_items:items!tp_batch_items_prerequisite_item_id_fkey (*)
        `)
        .eq('tp_batch_id', batchId)
        .order('position', { ascending: true })

      if (itemsError) throw itemsError
      setBatchItems(itemsData || [])
    } catch (err: any) {
      console.error('Error fetching batch:', err)
      setError(err.message || 'Erreur lors du chargement du lot')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTps = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'tp')
        .eq('published', true)
        .order('title', { ascending: true })

      if (error) throw error
      setAvailableTps(data || [])
    } catch (err: any) {
      console.error('Error fetching TPs:', err)
    }
  }

  const fetchAvailableCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title', { ascending: true })

      if (error) throw error
      setAvailableCourses(data || [])
    } catch (err: any) {
      console.error('Error fetching courses:', err)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')

      if (!batch.title?.trim()) {
        setError('Le titre est requis')
        return
      }

      let savedBatchId = batchId

      // Sauvegarder ou créer le lot
      if (isNew) {
        const { data: newBatch, error: createError } = await supabase
          .from('tp_batches')
          .insert({
            ...batch,
            created_by: user?.id
          })
          .select()
          .single()

        if (createError) throw createError
        savedBatchId = newBatch.id
        navigate(`/admin/tp-batches/${newBatch.id}`, { replace: true })
      } else {
        const { error: updateError } = await supabase
          .from('tp_batches')
          .update({
            title: batch.title,
            description: batch.description,
            course_id: batch.course_id || null,
            position: batch.position,
            is_published: batch.is_published,
            sequential_order: batch.sequential_order,
            metadata: batch.metadata
          })
          .eq('id', batchId)

        if (updateError) throw updateError
      }

      // Mettre à jour les positions des items
      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i]
        const { error: updateError } = await supabase
          .from('tp_batch_items')
          .update({ position: i })
          .eq('id', item.id)

        if (updateError) {
          console.error('Error updating item position:', updateError)
        }
      }

      if (!isNew) {
        await fetchBatch()
      }
    } catch (err: any) {
      console.error('Error saving batch:', err)
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTps = async () => {
    try {
      if (selectedTpIds.length === 0) {
        setError('Sélectionnez au moins un TP')
        return
      }

      if (!batchId && !isNew) {
        setError('Le lot doit être sauvegardé avant d\'ajouter des TP')
        return
      }

      const batchIdToUse = isNew ? (await createBatchFirst()) : batchId!
      const currentMaxPosition = Math.max(...batchItems.map(i => i.position), -1)

      const newItems = selectedTpIds.map((tpId, index) => ({
        tp_batch_id: batchIdToUse,
        item_id: tpId,
        position: currentMaxPosition + index + 1,
        is_required: true,
        prerequisite_item_id: null,
        metadata: {}
      }))

      const { error: insertError } = await supabase
        .from('tp_batch_items')
        .insert(newItems)

      if (insertError) throw insertError

      setSelectedTpIds([])
      setShowAddModal(false)
      await fetchBatch()
    } catch (err: any) {
      console.error('Error adding TPs:', err)
      setError(err.message || 'Erreur lors de l\'ajout des TP')
    }
  }

  const createBatchFirst = async (): Promise<string> => {
    const { data, error } = await supabase
      .from('tp_batches')
      .insert({
        ...batch,
        created_by: user?.id
      })
      .select()
      .single()

    if (error) throw error
    setBatch({ ...batch, id: data.id })
    navigate(`/admin/tp-batches/${data.id}`, { replace: true })
    return data.id
  }

  const handleRemoveTp = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('tp_batch_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      await fetchBatch()
    } catch (err: any) {
      console.error('Error removing TP:', err)
      setError(err.message || 'Erreur lors de la suppression')
    }
  }

  const handleMoveTp = async (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = batchItems.findIndex(i => i.id === itemId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= batchItems.length) return

    const newItems = [...batchItems]
    const [removed] = newItems.splice(currentIndex, 1)
    newItems.splice(newIndex, 0, removed)

    // Mettre à jour les positions
    newItems.forEach((item, index) => {
      item.position = index
    })

    setBatchItems(newItems)
  }

  const handleSetPrerequisite = async (itemId: string, prerequisiteId: string | null) => {
    try {
      const item = batchItems.find(i => i.id === itemId)
      if (!item) return

      const { error } = await supabase
        .from('tp_batch_items')
        .update({ prerequisite_item_id: prerequisiteId })
        .eq('id', itemId)

      if (error) throw error
      await fetchBatch()
    } catch (err: any) {
      console.error('Error setting prerequisite:', err)
      setError(err.message || 'Erreur lors de la mise à jour du prérequis')
    }
  }

  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedItemId) return

    const draggedIndex = batchItems.findIndex(i => i.id === draggedItemId)
    if (draggedIndex === -1) return

    const newItems = [...batchItems]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(dropIndex, 0, removed)

    newItems.forEach((item, index) => {
      item.position = index
    })

    setBatchItems(newItems)
    setDraggedItemId(null)
    setDragOverIndex(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? 'Nouveau lot de TP' : `Lot de TP : ${batch.title}`}
          </h1>
          <Link to="/admin/tp-batches" className="text-sm text-blue-600 hover:underline">
            ← Retour à la liste
          </Link>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Informations du lot */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Informations du lot</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titre *</label>
              <input
                type="text"
                value={batch.title || ''}
                onChange={(e) => setBatch({ ...batch, title: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Ex: Série TP Data Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={batch.description || ''}
                onChange={(e) => setBatch({ ...batch, description: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
                placeholder="Description du lot de TP..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cours associé (optionnel)</label>
                <select
                  value={batch.course_id || ''}
                  onChange={(e) => setBatch({ ...batch, course_id: e.target.value || null })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Aucun cours</option>
                  {availableCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <input
                  type="number"
                  value={batch.position || 0}
                  onChange={(e) => setBatch({ ...batch, position: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={batch.is_published || false}
                  onChange={(e) => setBatch({ ...batch, is_published: e.target.checked })}
                  className="rounded"
                />
                <span>Publié</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={batch.sequential_order || false}
                  onChange={(e) => setBatch({ ...batch, sequential_order: e.target.checked })}
                  className="rounded"
                />
                <span>Ordre séquentiel (les TP doivent être complétés dans l'ordre)</span>
              </label>
            </div>
          </div>
        </div>

        {/* TP du lot */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">TP du lot ({batchItems.length})</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter des TP
            </button>
          </div>

          {batchItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun TP dans ce lot. Cliquez sur "Ajouter des TP" pour commencer.
            </p>
          ) : (
            <div className="space-y-2">
              {batchItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`p-4 border rounded flex items-center gap-4 ${
                    dragOverIndex === index ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                  <div className="flex-1">
                    <div className="font-medium">{item.items?.title || 'TP inconnu'}</div>
                    <div className="text-sm text-gray-500">
                      Position: {item.position + 1}
                      {item.prerequisite_item_id && (
                        <span className="ml-2">
                          • Prérequis: {item.prerequisite_items?.title || 'TP précédent'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {batch.sequential_order && index > 0 && (
                      <select
                        value={item.prerequisite_item_id || ''}
                        onChange={(e) => handleSetPrerequisite(item.id, e.target.value || null)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="">Aucun prérequis</option>
                        {batchItems
                          .filter(i => i.id !== item.id && i.position < item.position)
                          .map(prereq => (
                            <option key={prereq.id} value={prereq.item_id}>
                              {prereq.items?.title}
                            </option>
                          ))}
                      </select>
                    )}
                    <button
                      onClick={() => handleMoveTp(item.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveTp(item.id, 'down')}
                      disabled={index === batchItems.length - 1}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveTp(item.id)}
                      className="p-1 text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout de TP */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ajouter des TP au lot</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedTpIds([])
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
              {availableTps
                .filter(tp => !batchItems.some(bi => bi.item_id === tp.id))
                .map(tp => (
                  <label key={tp.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedTpIds.includes(tp.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTpIds([...selectedTpIds, tp.id])
                        } else {
                          setSelectedTpIds(selectedTpIds.filter(id => id !== tp.id))
                        }
                      }}
                      className="rounded"
                    />
                    <span>{tp.title}</span>
                  </label>
                ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedTpIds([])
                }}
                className="px-4 py-2 border rounded"
              >
                Annuler
              </button>
              <button
                onClick={handleAddTps}
                className="btn-primary px-4 py-2"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
