import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Profile } from '../../types/database'
import { MessageSquare, Search, Download, User, Calendar, FileText, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

interface QuizResponse {
  id: string
  user_id: string
  quiz_type: string
  responses: {
    bigdata?: string
    machinelearning?: string
    datascience?: string
    expectations?: string
    [key: string]: string | undefined
  }
  created_at: string
  updated_at: string
  profiles?: Profile
}

export function AdminQuizResponses() {
  const { courseId } = useParams<{ courseId?: string }>()
  const { user } = useAuth()
  const [responses, setResponses] = useState<QuizResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null)
  const [quizTypeFilter, setQuizTypeFilter] = useState<string>('introduction_big_data')

  useEffect(() => {
    fetchResponses()
  }, [quizTypeFilter, courseId])

  const fetchResponses = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('user_responses')
        .select(`
          *,
          profiles (
            id,
            full_name,
            role
          )
        `)
        .eq('quiz_type', quizTypeFilter)
        .order('updated_at', { ascending: false })

      // Si on est dans le contexte d'un cours, filtrer par les utilisateurs inscrits
      if (courseId) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('user_id')
          .eq('course_id', courseId)
          .eq('status', 'active')

        if (enrollments && enrollments.length > 0) {
          const userIds = enrollments.map(e => e.user_id)
          query = query.in('user_id', userIds)
        }
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setResponses((data || []) as QuizResponse[])
    } catch (err: any) {
      console.error('Error fetching quiz responses:', err)
      setError('Erreur lors du chargement des réponses.')
    } finally {
      setLoading(false)
    }
  }

  const filteredResponses = responses.filter(response => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    const userName = response.profiles?.full_name?.toLowerCase() || ''
    const bigdata = response.responses.bigdata?.toLowerCase() || ''
    const ml = response.responses.machinelearning?.toLowerCase() || ''
    const ds = response.responses.datascience?.toLowerCase() || ''
    const expectations = response.responses.expectations?.toLowerCase() || ''

    return (
      userName.includes(searchLower) ||
      bigdata.includes(searchLower) ||
      ml.includes(searchLower) ||
      ds.includes(searchLower) ||
      expectations.includes(searchLower)
    )
  })

  const exportToCSV = () => {
    const headers = ['Nom', 'User ID', 'Big Data', 'Machine Learning', 'Data Science', 'Attentes', 'Date de réponse']
    const rows = filteredResponses.map(r => [
      r.profiles?.full_name || 'N/A',
      r.user_id,
      r.responses.bigdata || '',
      r.responses.machinelearning || '',
      r.responses.datascience || '',
      r.responses.expectations || '',
      new Date(r.updated_at).toLocaleDateString('fr-FR')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `quiz-introduction-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleExpand = (responseId: string) => {
    setExpandedResponse(expandedResponse === responseId ? null : responseId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des réponses...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          {courseId && (
            <Link
              to={`/admin/courses/${courseId}/submissions`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux soumissions
            </Link>
          )}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                Réponses au quiz d'introduction
              </h1>
              <p className="text-gray-600">
                Consultez les définitions et attentes des participants
              </p>
            </div>
            {filteredResponses.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter en CSV
              </button>
            )}
          </div>

          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom ou contenu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={quizTypeFilter}
              onChange={(e) => setQuizTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="introduction_big_data">Quiz Big Data / ML / DS</option>
              <option value="all">Tous les quiz</option>
            </select>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total de réponses</div>
            <div className="text-2xl font-bold text-gray-900">{filteredResponses.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Réponses complètes</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredResponses.filter(r => 
                r.responses.bigdata && 
                r.responses.machinelearning && 
                r.responses.datascience && 
                r.responses.expectations
              ).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Dernière réponse</div>
            <div className="text-sm font-medium text-gray-900">
              {filteredResponses.length > 0 
                ? new Date(filteredResponses[0].updated_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Aucune'}
            </div>
          </div>
        </div>

        {/* Liste des réponses */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {filteredResponses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réponse trouvée</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Aucune réponse ne correspond à votre recherche.'
                : 'Aucun participant n\'a encore complété le quiz d\'introduction.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResponses.map((response) => (
              <div
                key={response.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => toggleExpand(response.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {response.profiles?.full_name || 'Utilisateur anonyme'}
                          </h3>
                          <span className="text-sm text-gray-500">
                            ID: {response.user_id.substring(0, 8)}...
                          </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(response.updated_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <button className="ml-4">
                      {expandedResponse === response.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedResponse === response.id && (
                  <div className="border-t border-gray-200 p-6 space-y-6">
                    {/* Big Data */}
                    {response.responses.bigdata && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Définition du Big Data
                        </h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-gray-800 whitespace-pre-wrap">{response.responses.bigdata}</p>
                        </div>
                      </div>
                    )}

                    {/* Machine Learning */}
                    {response.responses.machinelearning && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Définition du Machine Learning
                        </h4>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <p className="text-gray-800 whitespace-pre-wrap">{response.responses.machinelearning}</p>
                        </div>
                      </div>
                    )}

                    {/* Data Science */}
                    {response.responses.datascience && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Définition de la Data Science
                        </h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-gray-800 whitespace-pre-wrap">{response.responses.datascience}</p>
                        </div>
                      </div>
                    )}

                    {/* Attentes */}
                    {response.responses.expectations && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Attentes du cours
                        </h4>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-gray-800 whitespace-pre-wrap">{response.responses.expectations}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

