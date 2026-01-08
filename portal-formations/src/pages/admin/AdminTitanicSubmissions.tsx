import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Submission, Item, Profile } from '../../types/database'
import { FileText, Search, Download, CheckCircle, Clock, XCircle, File, Eye, MessageSquare, BarChart3, Database, Brain } from 'lucide-react'
import { TitanicAnalysisPanel } from '../../components/trainer/TitanicAnalysisPanel'

interface SubmissionWithDetails extends Submission {
  profiles: Profile
  items: (Item & {
    content?: {
      titanicModule?: 'big-data' | 'data-science' | 'machine-learning'
      [key: string]: any
    }
  }) | null
}

type TitanicModule = 'big-data' | 'data-science' | 'machine-learning'

interface GroupedSubmissions {
  [key: string]: SubmissionWithDetails[]
}

export function AdminTitanicSubmissions() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all')
  const [moduleFilter, setModuleFilter] = useState<'all' | TitanicModule>('all')
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null)
  const [gradeValue, setGradeValue] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTitanicSubmissions()
  }, [])

  const fetchTitanicSubmissions = async () => {
    try {
      setLoading(true)
      
      // Récupérer tous les items de type TP
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          type,
          title,
          content
        `)
        .eq('type', 'tp')

      if (itemsError) throw itemsError

      // Filtrer les items Titanic (ceux qui ont titanicModule dans content ou titre contenant Titanic/Big Data/etc)
      const titanicItems = (itemsData || []).filter(item => {
        const content = item.content as any
        const hasTitanicModule = content?.titanicModule
        const titleLower = (item.title || '').toLowerCase()
        const hasTitanicKeywords = titleLower.includes('titanic') || 
                                   titleLower.includes('big data') ||
                                   titleLower.includes('data science') ||
                                   titleLower.includes('machine learning')
        return hasTitanicModule || hasTitanicKeywords
      })

      const itemIds = titanicItems.map(item => item.id)

      if (itemIds.length === 0) {
        setSubmissions([])
        setLoading(false)
        return
      }

      // Récupérer les soumissions avec les profils et les items
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles (*),
          items (
            id,
            type,
            title,
            content
          )
        `)
        .in('item_id', itemIds)
        .order('submitted_at', { ascending: false })

      if (submissionsError) throw submissionsError

      // Transformer les données
      const transformedSubmissions = (submissionsData || []).map(sub => ({
        ...sub,
        items: sub.items as any
      }))

      setSubmissions(transformedSubmissions)
    } catch (error: any) {
      console.error('Error fetching Titanic submissions:', error)
      setError('Erreur lors du chargement des soumissions Titanic.')
    } finally {
      setLoading(false)
    }
  }

  const getTitanicModule = (submission: SubmissionWithDetails): TitanicModule | null => {
    const content = submission.items?.content as any
    if (content?.titanicModule) {
      return content.titanicModule
    }
    
    const titleLower = (submission.items?.title || '').toLowerCase()
    if (titleLower.includes('big data')) return 'big-data'
    if (titleLower.includes('data science')) return 'data-science'
    if (titleLower.includes('machine learning')) return 'machine-learning'
    
    return null
  }

  const getModuleLabel = (module: TitanicModule): string => {
    switch (module) {
      case 'big-data':
        return 'Big Data'
      case 'data-science':
        return 'Data Science'
      case 'machine-learning':
        return 'Machine Learning'
      default:
        return 'Autre'
    }
  }

  const getModuleIcon = (module: TitanicModule) => {
    switch (module) {
      case 'big-data':
        return Database
      case 'data-science':
        return BarChart3
      case 'machine-learning':
        return Brain
      default:
        return FileText
    }
  }

  const getFileUrl = (filePath: string): string | null => {
    if (!filePath) return null
    const { data } = supabase.storage
      .from('submissions')
      .getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleGrade = async (submissionId: string) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('submissions')
        .update({
          grade: gradeValue,
          feedback: feedback || null,
          status: 'graded',
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (error) throw error

      // Rafraîchir les soumissions
      await fetchTitanicSubmissions()
      setGradingSubmission(null)
      setGradeValue(0)
      setFeedback('')
    } catch (error: any) {
      console.error('Error grading submission:', error)
      setError('Erreur lors de la notation.')
    } finally {
      setSaving(false)
    }
  }

  // Grouper les soumissions par module
  const groupedSubmissions: GroupedSubmissions = submissions.reduce((acc, submission) => {
    const module = getTitanicModule(submission)
    if (!module) return acc
    
    const key = module
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(submission)
    return acc
  }, {} as GroupedSubmissions)

  // Filtrer les soumissions
  const filteredSubmissions = submissions.filter(submission => {
    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const studentName = submission.profiles?.full_name?.toLowerCase() || ''
      const itemTitle = submission.items?.title?.toLowerCase() || ''
      if (!studentName.includes(searchLower) && !itemTitle.includes(searchLower)) {
        return false
      }
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      if (submission.status !== statusFilter) return false
    }

    // Filtre par module
    if (moduleFilter !== 'all') {
      const module = getTitanicModule(submission)
      if (module !== moduleFilter) return false
    }

    return true
  })

  // Grouper les soumissions filtrées
  const filteredGroupedSubmissions: GroupedSubmissions = filteredSubmissions.reduce((acc, submission) => {
    const module = getTitanicModule(submission)
    if (!module) return acc
    
    const key = module
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(submission)
    return acc
  }, {} as GroupedSubmissions)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  TP Titanic - Soumissions par niveau
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Analyse des réponses des étudiants aux TP Titanic
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Filtres */}
          <div className="mb-6 space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par étudiant ou TP..."
                className="input-field pl-10"
              />
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'submitted' | 'graded')}
                  className="input-field"
                >
                  <option value="all">Tous</option>
                  <option value="submitted">Soumis</option>
                  <option value="graded">Noté</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module
                </label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value as 'all' | TitanicModule)}
                  className="input-field"
                >
                  <option value="all">Tous les modules</option>
                  <option value="big-data">Big Data</option>
                  <option value="data-science">Data Science</option>
                  <option value="machine-learning">Machine Learning</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistiques par module */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(['big-data', 'data-science', 'machine-learning'] as TitanicModule[]).map(module => {
              const moduleSubmissions = groupedSubmissions[module] || []
              const Icon = getModuleIcon(module)
              return (
                <div key={module} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-medium text-gray-900">
                          {getModuleLabel(module)}
                        </h3>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {moduleSubmissions.length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        soumission{moduleSubmissions.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Liste des soumissions groupées par module */}
          {Object.keys(filteredGroupedSubmissions).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">
                {searchTerm || statusFilter !== 'all' || moduleFilter !== 'all'
                  ? 'Aucune soumission ne correspond à vos critères.'
                  : 'Aucune soumission Titanic pour le moment.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {(['big-data', 'data-science', 'machine-learning'] as TitanicModule[]).map(module => {
                const moduleSubmissions = filteredGroupedSubmissions[module] || []
                if (moduleSubmissions.length === 0) return null

                const Icon = getModuleIcon(module)
                return (
                  <div key={module} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                          {getModuleLabel(module)}
                        </h2>
                        <span className="text-sm text-gray-500">
                          ({moduleSubmissions.length} soumission{moduleSubmissions.length > 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>

                    <ul className="divide-y divide-gray-200">
                      {moduleSubmissions.map((submission) => (
                        <li key={submission.id} className="px-6 py-4">
                          <div className="space-y-4">
                            {/* En-tête */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {submission.items?.title || 'TP sans titre'}
                                  </h3>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    submission.status === 'graded'
                                      ? 'bg-green-100 text-green-800'
                                      : submission.status === 'submitted'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {submission.status === 'graded' ? (
                                      <>
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Noté
                                      </>
                                    ) : submission.status === 'submitted' ? (
                                      <>
                                        <Clock className="w-3 h-3 mr-1" />
                                        Soumis
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Brouillon
                                      </>
                                    )}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                  Étudiant: <span className="font-medium">{submission.profiles?.full_name || 'Sans nom'}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                {submission.grade !== null && (
                                  <p className="text-sm font-semibold text-green-600 mt-1">
                                    Note: {submission.grade}/100
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                {submission.file_path && (
                                  <a
                                    href={getFileUrl(submission.file_path) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Télécharger
                                  </a>
                                )}
                                <button
                                  onClick={() => {
                                    setExpandedSubmission(
                                      expandedSubmission === submission.id ? null : submission.id
                                    )
                                  }}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  {expandedSubmission === submission.id ? 'Masquer' : 'Voir'}
                                </button>
                                {submission.status === 'submitted' && (
                                  <button
                                    onClick={() => {
                                      setGradingSubmission(submission.id)
                                      setGradeValue(submission.grade || 0)
                                    }}
                                    className="btn-primary"
                                  >
                                    Noter
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Contenu détaillé */}
                            {expandedSubmission === submission.id && (
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                {/* Panneau d'analyse IA pour les réponses Titanic */}
                                {submission.answer_json?.titanicData && (
                                  <TitanicAnalysisPanel
                                    submission={submission}
                                    itemTitle={submission.items?.title || ''}
                                    questions={[]} // TODO: Récupérer les questions depuis item.content
                                  />
                                )}

                                {/* Réponse texte */}
                                {submission.answer_text && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Réponse de l'étudiant</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <p className="text-gray-700 whitespace-pre-wrap">{submission.answer_text}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Données JSON (si présentes) */}
                                {submission.answer_json && !submission.answer_json.titanicData && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Données JSON</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <pre className="text-xs text-gray-700 overflow-auto max-h-96">
                                        {JSON.stringify(submission.answer_json, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}

                                {/* Fichier soumis */}
                                {submission.file_path && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Fichier soumis</h4>
                                    <div className="flex items-center space-x-2">
                                      <File className="w-5 h-5 text-gray-400" />
                                      <span className="text-sm text-gray-600">{submission.file_path.split('/').pop()}</span>
                                      <a
                                        href={getFileUrl(submission.file_path) || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        Ouvrir
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {/* Lien vers l'exercice */}
                                <div>
                                  <Link
                                    to={`/items/${submission.item_id}`}
                                    className="text-blue-600 hover:text-blue-500 text-sm"
                                  >
                                    Voir le TP →
                                  </Link>
                                </div>
                              </div>
                            )}

                            {/* Formulaire de notation */}
                            {gradingSubmission === submission.id && (
                              <div className="mt-4 pt-4 border-t border-gray-200 bg-blue-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Noter cette soumission</h4>
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Note (0-100)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={gradeValue}
                                      onChange={(e) => setGradeValue(Number(e.target.value))}
                                      className="input-field"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Commentaires
                                    </label>
                                    <textarea
                                      value={feedback}
                                      onChange={(e) => setFeedback(e.target.value)}
                                      rows={4}
                                      className="input-field"
                                      placeholder="Ajoutez vos commentaires..."
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => {
                                        setGradingSubmission(null)
                                        setGradeValue(0)
                                        setFeedback('')
                                      }}
                                      className="btn-secondary"
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      onClick={() => handleGrade(submission.id)}
                                      disabled={saving}
                                      className="btn-primary"
                                    >
                                      {saving ? 'Enregistrement...' : 'Enregistrer la note'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
