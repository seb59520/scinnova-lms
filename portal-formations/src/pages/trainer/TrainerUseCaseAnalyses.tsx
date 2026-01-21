import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Profile } from '../../types/database'
import { FileText, Search, Download, User, Calendar, ChevronDown, ChevronUp, Sparkles, TrendingUp, Target, AlertCircle } from 'lucide-react'
import { TrainerHeader } from '../../components/trainer/TrainerHeader'

interface UseCaseAnalysis {
  id: string
  user_id: string
  use_case_id: string
  use_case_title: string
  use_case_data: {
    title: string
    description: string
    sector: string
    impacts: {
      organizational: number
      technical: number
      economic: number
      social: number
    }
    roi: number
    technologies: string[]
    challenges: string[]
  }
  analysis: {
    summary: string
    strengths: string[]
    improvements: string[]
    recommendations: string[]
    score: {
      overall: number
      organizational: number
      technical: number
      economic: number
      social: number
    }
  }
  applied_suggestions: {
    technologies?: string[]
    challenges?: string[]
    impacts?: {
      organizational?: number
      technical?: number
      economic?: number
      social?: number
    }
    roi?: number
  } | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export function TrainerUseCaseAnalyses() {
  const { courseId, sessionId } = useParams<{ courseId?: string; sessionId?: string }>()
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState<UseCaseAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalyses()
  }, [courseId, sessionId])

  const fetchAnalyses = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('use_case_analyses')
        .select(`
          *,
          profiles (
            id,
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false })

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

      // Si on est dans le contexte d'une session, filtrer par les utilisateurs de la session
      if (sessionId) {
        const { data: sessionEnrollments } = await supabase
          .from('enrollments')
          .select('user_id')
          .eq('session_id', sessionId)
          .eq('status', 'active')

        if (sessionEnrollments && sessionEnrollments.length > 0) {
          const userIds = sessionEnrollments.map(e => e.user_id)
          query = query.in('user_id', userIds)
        }
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setAnalyses((data as UseCaseAnalysis[]) || [])
    } catch (err) {
      console.error('Erreur lors de la récupération des analyses:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const filteredAnalyses = analyses.filter((analysis) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      analysis.use_case_title.toLowerCase().includes(searchLower) ||
      analysis.use_case_data.description.toLowerCase().includes(searchLower) ||
      analysis.use_case_data.sector.toLowerCase().includes(searchLower) ||
      analysis.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      analysis.analysis.summary.toLowerCase().includes(searchLower)
    )
  })

  const toggleExpand = (id: string) => {
    setExpandedAnalysis(expandedAnalysis === id ? null : id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <TrainerHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Chargement...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <TrainerHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Erreur : {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <TrainerHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analyses IA des cas d'usage Big Data
          </h1>
          <p className="text-gray-600">
            Consultez les analyses IA générées pour les cas d'usage créés par les étudiants
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total analyses</p>
                <p className="text-2xl font-bold text-gray-900">{analyses.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suggestions appliquées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyses.filter(a => a.applied_suggestions).length}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Score moyen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyses.length > 0
                    ? (analyses.reduce((sum, a) => sum + a.analysis.score.overall, 0) / analyses.length).toFixed(1)
                    : '0'}
                  /10
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Étudiants uniques</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(analyses.map(a => a.user_id)).size}
                </p>
              </div>
              <User className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par titre, description, secteur, étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste des analyses */}
        <div className="space-y-4">
          {filteredAnalyses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Aucune analyse ne correspond à votre recherche' : 'Aucune analyse disponible'}
              </p>
            </div>
          ) : (
            filteredAnalyses.map((analysis) => {
              const isExpanded = expandedAnalysis === analysis.id
              return (
                <div key={analysis.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* En-tête */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(analysis.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {analysis.use_case_title}
                          </h3>
                          {analysis.applied_suggestions && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              Suggestions appliquées
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {analysis.profiles?.full_name || 'Utilisateur inconnu'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {analysis.use_case_data.sector}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            Score: {analysis.analysis.score.overall}/10
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenu détaillé */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-6 space-y-6">
                      {/* Données du cas d'usage */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">📋 Cas d'usage</h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Description :</span>
                            <p className="text-gray-600 mt-1">{analysis.use_case_data.description}</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Impacts :</span>
                              <div className="text-sm text-gray-600 mt-1">
                                <div>Org: {analysis.use_case_data.impacts.organizational}/10</div>
                                <div>Tech: {analysis.use_case_data.impacts.technical}/10</div>
                                <div>Éco: {analysis.use_case_data.impacts.economic}/10</div>
                                <div>Soc: {analysis.use_case_data.impacts.social}/10</div>
                              </div>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">ROI :</span>
                              <p className="text-gray-600 mt-1">{analysis.use_case_data.roi}%</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Technologies :</span>
                              <p className="text-gray-600 mt-1 text-sm">
                                {analysis.use_case_data.technologies.join(', ')}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Défis :</span>
                              <p className="text-gray-600 mt-1 text-sm">
                                {analysis.use_case_data.challenges.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Analyse IA */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">🤖 Analyse IA</h4>
                        
                        {/* Synthèse */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
                          <h5 className="font-medium text-blue-900 mb-2">📊 Synthèse</h5>
                          <p className="text-blue-800 text-sm">{analysis.analysis.summary}</p>
                        </div>

                        {/* Points forts */}
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">✅ Points forts</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {analysis.analysis.strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Améliorations */}
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">🔧 Améliorations possibles</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {analysis.analysis.improvements.map((improvement, idx) => (
                              <li key={idx}>{improvement}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommandations */}
                        <div className="bg-purple-50 border border-purple-200 p-4 rounded mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">💡 Recommandations</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {analysis.analysis.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Scores */}
                        <div className="bg-gray-50 p-4 rounded">
                          <h5 className="font-medium text-gray-900 mb-3">📈 Scores d'évaluation</h5>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {analysis.analysis.score.overall}/10
                              </div>
                              <div className="text-xs text-gray-600 mt-1">Global</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-blue-600">
                                {analysis.analysis.score.organizational}/10
                              </div>
                              <div className="text-xs text-gray-600 mt-1">Organisationnel</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-green-600">
                                {analysis.analysis.score.technical}/10
                              </div>
                              <div className="text-xs text-gray-600 mt-1">Technique</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-yellow-600">
                                {analysis.analysis.score.economic}/10
                              </div>
                              <div className="text-xs text-gray-600 mt-1">Économique</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-purple-600">
                                {analysis.analysis.score.social}/10
                              </div>
                              <div className="text-xs text-gray-600 mt-1">Social</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Suggestions appliquées */}
                      {analysis.applied_suggestions && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded">
                          <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Suggestions appliquées
                          </h5>
                          <div className="text-sm text-gray-700 space-y-2">
                            {analysis.applied_suggestions.impacts && (
                              <div>
                                <span className="font-medium">Impacts ajustés :</span>
                                <ul className="list-disc list-inside ml-4">
                                  {analysis.applied_suggestions.impacts.organizational && (
                                    <li>Organisationnel: {analysis.applied_suggestions.impacts.organizational}/10</li>
                                  )}
                                  {analysis.applied_suggestions.impacts.technical && (
                                    <li>Technique: {analysis.applied_suggestions.impacts.technical}/10</li>
                                  )}
                                  {analysis.applied_suggestions.impacts.economic && (
                                    <li>Économique: {analysis.applied_suggestions.impacts.economic}/10</li>
                                  )}
                                  {analysis.applied_suggestions.impacts.social && (
                                    <li>Social: {analysis.applied_suggestions.impacts.social}/10</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            {analysis.applied_suggestions.roi && (
                              <div>
                                <span className="font-medium">ROI ajusté :</span> {analysis.applied_suggestions.roi}%
                              </div>
                            )}
                            {analysis.applied_suggestions.technologies && analysis.applied_suggestions.technologies.length > 0 && (
                              <div>
                                <span className="font-medium">Technologies ajoutées :</span>{' '}
                                {analysis.applied_suggestions.technologies.join(', ')}
                              </div>
                            )}
                            {analysis.applied_suggestions.challenges && analysis.applied_suggestions.challenges.length > 0 && (
                              <div>
                                <span className="font-medium">Défis ajoutés :</span>{' '}
                                {analysis.applied_suggestions.challenges.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}


