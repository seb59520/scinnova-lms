import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { TpBatchWithCourse } from '../../types/database'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'

export function AdminTpBatchesList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [batches, setBatches] = useState<TpBatchWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tp_batches')
        .select(`
          *,
          courses (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBatches(data || [])
    } catch (err: any) {
      console.error('Error fetching batches:', err)
      setError(err.message || 'Erreur lors du chargement des lots')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (batchId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) return

    try {
      const { error } = await supabase
        .from('tp_batches')
        .delete()
        .eq('id', batchId)

      if (error) throw error
      await fetchBatches()
    } catch (err: any) {
      console.error('Error deleting batch:', err)
      setError(err.message || 'Erreur lors de la suppression')
    }
  }

  const filteredBatches = batches.filter(batch =>
    batch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold">Lots de TP</h1>
          <p className="text-gray-600">Gérez les lots de TP liés entre eux</p>
        </div>
        <Link
          to="/admin/tp-batches/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau lot
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un lot..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      {filteredBatches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">Aucun lot de TP trouvé</p>
          <Link to="/admin/tp-batches/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Créer le premier lot
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBatches.map(batch => (
            <div key={batch.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{batch.title}</h3>
                    {batch.is_published ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  {batch.description && (
                    <p className="text-gray-600 mb-2">{batch.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {batch.courses && (
                      <span>Cours: {batch.courses.title}</span>
                    )}
                    {batch.sequential_order && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        Ordre séquentiel
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/tp-batches/${batch.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
