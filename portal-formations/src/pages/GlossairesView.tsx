import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { AppHeader } from '../components/AppHeader'
import { BookOpen, Search, Layers, ChevronRight } from 'lucide-react'

interface ProgramWithGlossary {
  id: string
  title: string
  description: string | null
  glossary: {
    metadata: {
      title: string
      description?: string
    }
    terms: Array<{ id: string; word: string }>
  }
}

export function GlossairesView() {
  const { user, profile } = useAuth()
  const [programs, setPrograms] = useState<ProgramWithGlossary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      fetchGlossaires()
    }
  }, [user])

  const fetchGlossaires = async () => {
    try {
      setLoading(true)
      setError('')

      // Récupérer tous les programmes avec glossaires
      let query = supabase
        .from('programs')
        .select('id, title, description, glossary')
        .not('glossary', 'is', null)

      // Si pas admin, filtrer par accès
      if (profile?.role !== 'admin' && user?.id) {
        // Programmes publiés et gratuits OU programmes où l'utilisateur est inscrit
        const { data: enrollments } = await supabase
          .from('program_enrollments')
          .select('program_id')
          .eq('user_id', user.id)
          .eq('status', 'active')

        const enrolledProgramIds = enrollments?.map(e => e.program_id) || []

        if (enrolledProgramIds.length > 0) {
          query = query.or(
            `status.eq.published,access_type.eq.free,id.in.(${enrolledProgramIds.join(',')})`
          )
        } else {
          query = query.or('status.eq.published,access_type.eq.free')
        }
      }

      const { data, error: fetchError } = await query
        .order('title', { ascending: true })

      if (fetchError) throw fetchError

      // Filtrer et formater les programmes avec glossaires valides
      const programsWithGlossaires = (data || [])
        .filter((p: any) => {
          if (!p.glossary) return false
          try {
            const glossary = typeof p.glossary === 'string' 
              ? JSON.parse(p.glossary) 
              : p.glossary
            return glossary.metadata && glossary.terms && Array.isArray(glossary.terms)
          } catch {
            return false
          }
        })
        .map((p: any) => {
          const glossary = typeof p.glossary === 'string' 
            ? JSON.parse(p.glossary) 
            : p.glossary
          return {
            id: p.id,
            title: p.title,
            description: p.description,
            glossary: {
              metadata: glossary.metadata,
              terms: glossary.terms || []
            }
          }
        })

      setPrograms(programsWithGlossaires)
    } catch (error: any) {
      console.error('Error fetching glossaires:', error)
      setError(`Erreur lors du chargement: ${error.message || 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrograms = programs.filter(program => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      program.title.toLowerCase().includes(query) ||
      program.description?.toLowerCase().includes(query) ||
      program.glossary.metadata.title.toLowerCase().includes(query) ||
      program.glossary.metadata.description?.toLowerCase().includes(query) ||
      program.glossary.terms.some(term => 
        term.word.toLowerCase().includes(query)
      )
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Glossaires</h1>
              <p className="text-gray-600 mt-1">
                Consultez les définitions et exemples des termes utilisés dans les programmes
              </p>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un glossaire ou un terme..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Liste des glossaires */}
        {filteredPrograms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              {searchQuery 
                ? 'Aucun glossaire trouvé pour cette recherche'
                : 'Aucun glossaire disponible pour le moment'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Réinitialiser la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrograms.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <h2 className="text-xl font-semibold text-gray-900">
                        {program.glossary.metadata.title}
                      </h2>
                    </div>
                    
                    {program.glossary.metadata.description && (
                      <p className="text-gray-600 mb-3">
                        {program.glossary.metadata.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {program.glossary.terms.length} terme{program.glossary.terms.length > 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span>Programme: {program.title}</span>
                    </div>

                    {/* Aperçu des premiers termes */}
                    {program.glossary.terms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {program.glossary.terms.slice(0, 8).map((term) => (
                          <span
                            key={term.id}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                          >
                            {term.word}
                          </span>
                        ))}
                        {program.glossary.terms.length > 8 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                            +{program.glossary.terms.length - 8} autres
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/programs/${program.id}/glossary`}
                    className="ml-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium inline-flex items-center gap-2 flex-shrink-0"
                  >
                    Consulter
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistiques */}
        {programs.length > 0 && (
          <div className="mt-8 bg-indigo-50 rounded-lg p-6 border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4">
              Statistiques
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">
                  {programs.length}
                </div>
                <div className="text-sm text-indigo-700 mt-1">
                  Glossaire{programs.length > 1 ? 's' : ''} disponible{programs.length > 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">
                  {programs.reduce((sum, p) => sum + p.glossary.terms.length, 0)}
                </div>
                <div className="text-sm text-indigo-700 mt-1">
                  Terme{programs.reduce((sum, p) => sum + p.glossary.terms.length, 0) > 1 ? 's' : ''} au total
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">
                  {Math.round(
                    programs.reduce((sum, p) => sum + p.glossary.terms.length, 0) / programs.length
                  )}
                </div>
                <div className="text-sm text-indigo-700 mt-1">
                  Termes par glossaire (moyenne)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
