import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Course, Item, CourseTpWithItem, CourseAllTp } from '../../types/database'
import { Plus, Trash2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'

export function AdminCourseTpAssociations() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [directAssociations, setDirectAssociations] = useState<CourseTpWithItem[]>([])
  const [allTps, setAllTps] = useState<CourseAllTp[]>([])
  const [availableTps, setAvailableTps] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTpId, setSelectedTpId] = useState('')

  useEffect(() => {
    if (courseId) {
      loadAllData()
    }
  }, [courseId])

  const loadAllData = async () => {
    setLoading(true)
    setError('')
    try {
      await Promise.all([
        fetchCourse(),
        fetchAssociations(),
        fetchAllTps(),
        fetchAvailableTps()
      ])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourse = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (error) {
      console.error('Error fetching course:', error)
      throw error
    }
    setCourse(data)
  }

  const fetchAssociations = async () => {
    const { data, error } = await supabase
      .from('course_tps')
      .select(`
        *,
        items (*)
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching associations:', error)
      // Ne pas throw pour ne pas bloquer les autres requêtes
      return
    }
    setDirectAssociations(data || [])
  }

  const fetchAllTps = async () => {
    const { data, error } = await supabase
      .from('course_all_tps')
      .select('*')
      .eq('course_id', courseId)
      .order('position_in_course', { ascending: true })

    if (error) {
      console.error('Error fetching all TPs:', error)
      // La vue course_all_tps pourrait ne pas exister encore, ce n'est pas bloquant
      return
    }
    setAllTps(data || [])
  }

  const fetchAvailableTps = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('type', 'tp')
      .eq('published', true)
      .order('title', { ascending: true })

    if (error) {
      console.error('Error fetching available TPs:', error)
      return
    }
    setAvailableTps(data || [])
  }

  const handleAddAssociation = async () => {
    try {
      if (!selectedTpId) {
        setError('Sélectionnez un TP')
        return
      }

      const maxPosition = Math.max(...directAssociations.map(a => a.position), -1)

      const { error } = await supabase
        .from('course_tps')
        .insert({
          course_id: courseId!,
          item_id: selectedTpId,
          position: maxPosition + 1,
          is_required: true,
          is_visible: true,
          metadata: {}
        })

      if (error) throw error

      setSelectedTpId('')
      setShowAddModal(false)
      await fetchAssociations()
      await fetchAllTps()
    } catch (err: any) {
      console.error('Error adding association:', err)
      setError(err.message || 'Erreur lors de l\'ajout de l\'association')
    }
  }

  const handleRemoveAssociation = async (associationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cette association ?')) return

    try {
      const { error } = await supabase
        .from('course_tps')
        .delete()
        .eq('id', associationId)

      if (error) throw error
      await fetchAssociations()
      await fetchAllTps()
    } catch (err: any) {
      console.error('Error removing association:', err)
      setError(err.message || 'Erreur lors de la suppression')
    }
  }

  const handleToggleVisibility = async (associationId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('course_tps')
        .update({ is_visible: !currentValue })
        .eq('id', associationId)

      if (error) throw error
      await fetchAssociations()
    } catch (err: any) {
      console.error('Error toggling visibility:', err)
      setError(err.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleToggleRequired = async (associationId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('course_tps')
        .update({ is_required: !currentValue })
        .eq('id', associationId)

      if (error) throw error
      await fetchAssociations()
    } catch (err: any) {
      console.error('Error toggling required:', err)
      setError(err.message || 'Erreur lors de la mise à jour')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  // Grouper les TP par source
  const tpsBySource = {
    module: allTps.filter(tp => tp.source_type === 'module'),
    direct: allTps.filter(tp => tp.source_type === 'direct'),
    batch: allTps.filter(tp => tp.source_type === 'batch')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Associations TP - {course?.title}
        </h1>
        <div className="flex items-center gap-4">
          {courseId && (
            <Link 
              to={`/admin/courses/${courseId}`} 
              className="text-sm text-blue-600 hover:underline"
            >
              ← Retour au cours
            </Link>
          )}
          <Link to="/admin" className="text-sm text-blue-600 hover:underline">
            ← Retour à l'administration
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Associations directes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Associations directes ({directAssociations.length})
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une association
            </button>
          </div>

          {directAssociations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucune association directe. Les TP sont actuellement uniquement dans les modules.
            </p>
          ) : (
            <div className="space-y-2">
              {directAssociations.map(assoc => (
                <div key={assoc.id} className="p-4 border rounded flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{assoc.items?.title || 'TP inconnu'}</div>
                    <div className="text-sm text-gray-500">
                      Position: {assoc.position}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVisibility(assoc.id, assoc.is_visible)}
                      className={`p-2 rounded ${
                        assoc.is_visible
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={assoc.is_visible ? 'Visible' : 'Masqué'}
                    >
                      {assoc.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleToggleRequired(assoc.id, assoc.is_required)}
                      className={`p-2 rounded ${
                        assoc.is_required
                          ? 'text-blue-600 hover:bg-blue-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={assoc.is_required ? 'Obligatoire' : 'Optionnel'}
                    >
                      {assoc.is_required ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveAssociation(assoc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vue d'ensemble de tous les TP */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Vue d'ensemble de tous les TP du cours</h2>
          
          {tpsBySource.module.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">
                TP dans les modules ({tpsBySource.module.length})
              </h3>
              <div className="space-y-1">
                {tpsBySource.module.map(tp => (
                  <div key={tp.tp_id} className="text-sm text-gray-600 pl-4">
                    • {tp.tp_title} {tp.module_title && `(Module: ${tp.module_title})`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tpsBySource.direct.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">
                TP associés directement ({tpsBySource.direct.length})
              </h3>
              <div className="space-y-1">
                {tpsBySource.direct.map(tp => (
                  <div key={tp.tp_id} className="text-sm text-gray-600 pl-4">
                    • {tp.tp_title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tpsBySource.batch.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                TP dans les lots ({tpsBySource.batch.length})
              </h3>
              <div className="space-y-1">
                {tpsBySource.batch.map(tp => (
                  <div key={tp.tp_id} className="text-sm text-gray-600 pl-4">
                    • {tp.tp_title} {tp.tp_batch_title && `(Lot: ${tp.tp_batch_title})`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {allTps.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Aucun TP dans ce cours.
            </p>
          )}
        </div>
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Ajouter une association TP-Cours</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">TP</label>
              <select
                value={selectedTpId}
                onChange={(e) => setSelectedTpId(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Sélectionnez un TP</option>
                {availableTps
                  .filter(tp => !directAssociations.some(a => a.item_id === tp.id))
                  .map(tp => (
                    <option key={tp.id} value={tp.id}>
                      {tp.title}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedTpId('')
                }}
                className="px-4 py-2 border rounded"
              >
                Annuler
              </button>
              <button
                onClick={handleAddAssociation}
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
