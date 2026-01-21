import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Key, Plus, Copy, Check, X, Search, AlertCircle, Users } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Link } from 'react-router-dom'

interface GhostCode {
  id: string
  code: string
  is_used: boolean
  used_at: string | null
  expires_at: string | null
  created_at: string
  created_by: string | null
  notes: string | null
  used_by: string | null
  ghost_user_name: string | null // Nom cartoon de l'utilisateur ghost
}

export function AdminGhostCodes() {
  const { profile } = useAuth()
  const [codes, setCodes] = useState<GhostCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    count: 5,
    expiresInHours: 24,
    notes: ''
  })

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchCodes()
    }
  }, [profile])

  const fetchCodes = async () => {
    try {
      setLoading(true)
      // Récupérer les codes
      const { data: codesData, error: codesError } = await supabase
        .from('ghost_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (codesError) throw codesError
      
      // Récupérer les IDs des utilisateurs ghost qui ont utilisé les codes
      const usedByIds = (codesData || [])
        .filter(code => code.is_used && code.used_by)
        .map(code => code.used_by)
        .filter((id): id is string => id !== null)
      
      // Récupérer les profils des utilisateurs ghost
      let profilesMap: Record<string, string> = {}
      if (usedByIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', usedByIds)
        
        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile.full_name || 'Sans nom'
            return acc
          }, {} as Record<string, string>)
        }
      }
      
      // Combiner les codes avec les noms des utilisateurs ghost
      const codesWithNames = (codesData || []).map((code: any) => ({
        ...code,
        ghost_user_name: code.is_used && code.used_by ? profilesMap[code.used_by] || null : null
      }))
      
      setCodes(codesWithNames)
    } catch (error: any) {
      console.error('Error fetching codes:', error)
      setError('Erreur lors du chargement des codes.')
    } finally {
      setLoading(false)
    }
  }

  const generateCodes = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.rpc('generate_ghost_codes', {
        count: formData.count,
        expires_in_hours: formData.expiresInHours,
        created_by_user: profile?.id || null
      })

      if (error) throw error

      if (data && data.length > 0) {
        setSuccess(`${data.length} code(s) généré(s) avec succès !`)
        setFormData({ count: 5, expiresInHours: 24, notes: '' })
        setShowGenerateForm(false)
        await fetchCodes()
      } else {
        throw new Error('Aucun code généré')
      }
    } catch (error: any) {
      console.error('Error generating codes:', error)
      setError(error.message || 'Erreur lors de la génération des codes.')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getStatus = (code: GhostCode) => {
    if (code.is_used) return { label: 'Utilisé', color: 'bg-gray-100 text-gray-800' }
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return { label: 'Expiré', color: 'bg-red-100 text-red-800' }
    }
    return { label: 'Disponible', color: 'bg-green-100 text-green-800' }
  }

  const filteredCodes = codes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code.notes && code.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (code.ghost_user_name && code.ghost_user_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const availableCodes = filteredCodes.filter(code => !code.is_used && 
    (!code.expires_at || new Date(code.expires_at) > new Date())).length
  const usedCodes = filteredCodes.filter(code => code.is_used).length
  const expiredCodes = filteredCodes.filter(code => 
    !code.is_used && code.expires_at && new Date(code.expires_at) < new Date()).length

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h2>
          <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="SCINNOVA - LMS" showBackButton={true} backTo="/admin" backLabel="Retour à l'administration" />
      <div className="py-8 px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gestion des codes Ghost</h2>
                <p className="text-sm text-gray-500 mt-0.5">Générez et gérez les codes d'accès pour les utilisateurs anonymes</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/admin/users"
                  className="btn-secondary flex items-center gap-2"
                  title="Gérer les utilisateurs"
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden sm:inline">Utilisateurs</span>
                </Link>
                <button
                  onClick={() => setShowGenerateForm(!showGenerateForm)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Générer des codes
                </button>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Codes disponibles</div>
                <div className="text-2xl font-bold text-green-600">{availableCodes}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Codes utilisés</div>
                <div className="text-2xl font-bold text-gray-600">{usedCodes}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Codes expirés</div>
                <div className="text-2xl font-bold text-red-600">{expiredCodes}</div>
              </div>
            </div>

            {/* Messages */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-center justify-between">
                <span>{success}</span>
                <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Formulaire de génération */}
            {showGenerateForm && (
              <div className="mb-6 p-6 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Générer de nouveaux codes</h3>
                <form onSubmit={generateCodes} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de codes
                      </label>
                      <input
                        id="count"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.count}
                        onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="expiresInHours" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration (heures)
                      </label>
                      <input
                        id="expiresInHours"
                        type="number"
                        min="1"
                        value={formData.expiresInHours}
                        onChange={(e) => setFormData({ ...formData, expiresInHours: parseInt(e.target.value) || 24 })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optionnel)
                    </label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="input-field w-full"
                      rows={2}
                      placeholder="Ex: Session de formation du 15/01/2024"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={generating} className="btn-primary">
                      {generating ? 'Génération...' : 'Générer les codes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGenerateForm(false)
                        setFormData({ count: 5, expiresInHours: 24, notes: '' })
                      }}
                      className="btn-secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Barre de recherche */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field w-full pl-10"
                />
              </div>
            </div>
          </div>

          {/* Liste des codes */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Chargement des codes...</p>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom attribué
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisé le
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        {searchTerm ? 'Aucun code trouvé' : 'Aucun code généré'}
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((code) => {
                      const status = getStatus(code)
                      return (
                        <tr key={code.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono font-semibold text-gray-900">
                                {code.code}
                              </code>
                              <button
                                onClick={() => copyToClipboard(code.code)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copier le code"
                              >
                                {copiedCode === code.code ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {code.is_used && code.ghost_user_name ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-indigo-600">
                                  {code.ghost_user_name}
                                </span>
                                <span className="text-xs text-gray-400">👻</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {code.expires_at
                              ? new Date(code.expires_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Jamais'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {code.used_at
                              ? new Date(code.used_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {code.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {!code.is_used && (
                              <button
                                onClick={() => copyToClipboard(code.code)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Copier le code"
                              >
                                <Copy className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            Total: {filteredCodes.length} code{filteredCodes.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

