import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { AppHeader } from '../components/AppHeader'
import { Glossary, GlossaryTerm, GlossaryCategory } from '../types/database'
import { ArrowLeft, BookOpen, Search, X, ExternalLink, ArrowUpDown, List, Grid } from 'lucide-react'

export function ProgramGlossaryView() {
  const { programId } = useParams<{ programId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [program, setProgram] = useState<any>(null)
  const [glossary, setGlossary] = useState<Glossary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null)
  const [relatedTerms, setRelatedTerms] = useState<GlossaryTerm[]>([])
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'original'>('original')
  const [ignoreSymbols, setIgnoreSymbols] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (programId && user) {
      fetchProgramAndGlossary()
    }
  }, [programId, user])

  // Sélectionner le terme depuis l'URL quand le glossaire est chargé
  useEffect(() => {
    const termParam = searchParams.get('term')
    if (termParam && glossary && !selectedTerm) {
      const term = glossary.terms.find(t => t.id === termParam || t.word.toLowerCase() === termParam.toLowerCase())
      if (term) {
        setSelectedTerm(term)
        // Scroll vers le terme après un court délai
        setTimeout(() => {
          const element = document.getElementById(`term-${term.id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 300)
      }
    }
  }, [glossary, searchParams])

  useEffect(() => {
    if (selectedTerm && glossary) {
      // Charger les termes liés
      const related = glossary.terms.filter(t => 
        selectedTerm.related_terms?.includes(t.id)
      )
      setRelatedTerms(related)
    }
  }, [selectedTerm, glossary])

  const fetchProgramAndGlossary = async () => {
    try {
      setError('')
      setLoading(true)

      // Récupérer le programme avec son glossaire
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single()

      if (programError) {
        if (programError.code === 'PGRST116') {
          setError('Programme introuvable.')
        } else {
          throw programError
        }
        return
      }

      setProgram(programData)

      // Vérifier l'accès au programme
      if (profile?.role !== 'admin' && user?.id && programData) {
        if (programData.created_by !== user.id) {
          if (!(programData.access_type === 'free' && programData.status === 'published')) {
            const { data: enrollment } = await supabase
              .from('program_enrollments')
              .select('id, status')
              .eq('user_id', user.id)
              .eq('program_id', programId)
              .eq('status', 'active')
              .single()

            if (!enrollment) {
              setError('Vous n\'avez pas accès à ce programme.')
              return
            }
          }
        }
      }

      // Charger le glossaire
      if (programData.glossary) {
        setGlossary(programData.glossary)
      } else {
        setError('Ce programme n\'a pas de glossaire associé.')
      }
    } catch (error: any) {
      console.error('Error fetching program glossary:', error)
      setError(`Erreur lors du chargement: ${error.message || 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredTerms = (): GlossaryTerm[] => {
    if (!glossary) return []

    let terms = glossary.terms

    // Filtrer par catégorie
    if (selectedCategory) {
      terms = terms.filter(t => t.category_id === selectedCategory)
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      terms = terms.filter(t => 
        t.word.toLowerCase().includes(query) ||
        t.explanation.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return terms
  }

  const normalizeForSort = (text: string): string => {
    if (ignoreSymbols) {
      // Enlever les symboles et garder seulement lettres et chiffres
      return text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    }
    return text.toLowerCase()
  }

  const sortTerms = (terms: GlossaryTerm[]): GlossaryTerm[] => {
    if (sortOrder === 'original') {
      return terms
    }
    
    return [...terms].sort((a, b) => {
      const wordA = normalizeForSort(a.word)
      const wordB = normalizeForSort(b.word)
      return wordA.localeCompare(wordB, 'fr', { numeric: true, sensitivity: 'base' })
    })
  }

  const getTermsByCategory = (): Map<string, GlossaryTerm[]> => {
    const filteredTerms = getFilteredTerms()
    const termsByCategory = new Map<string, GlossaryTerm[]>()
    const uncategorizedTerms: GlossaryTerm[] = []

    filteredTerms.forEach(term => {
      if (term.category_id) {
        if (!termsByCategory.has(term.category_id)) {
          termsByCategory.set(term.category_id, [])
        }
        termsByCategory.get(term.category_id)!.push(term)
      } else {
        uncategorizedTerms.push(term)
      }
    })

    // Trier les termes dans chaque catégorie
    termsByCategory.forEach((terms, categoryId) => {
      termsByCategory.set(categoryId, sortTerms(terms))
    })

    // Si on a des termes non catégorisés, les ajouter
    if (uncategorizedTerms.length > 0) {
      termsByCategory.set('uncategorized', sortTerms(uncategorizedTerms))
    }

    return termsByCategory
  }

  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId || !glossary) return 'Sans catégorie'
    const category = glossary.categories?.find(c => c.id === categoryId)
    return category?.name || 'Sans catégorie'
  }

  const handleTermClick = (term: GlossaryTerm) => {
    setSelectedTerm(term)
  }

  const handleRelatedTermClick = (termId: string) => {
    if (!glossary) return
    const term = glossary.terms.find(t => t.id === termId)
    if (term) {
      setSelectedTerm(term)
      // Scroll vers le terme
      setTimeout(() => {
        const element = document.getElementById(`term-${term.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

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

  if (error || !glossary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            to={programId ? `/programs/${programId}` : '/app'}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Glossaire non disponible'}
          </div>
        </div>
      </div>
    )
  }

  const filteredTerms = getFilteredTerms()
  const categories = glossary.categories || []

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/programs/${programId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au programme
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {glossary.metadata.title}
                </h1>
                {glossary.metadata.description && (
                  <p className="text-gray-600">{glossary.metadata.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {glossary.terms.length} terme{glossary.terms.length > 1 ? 's' : ''}
                  {categories.length > 0 && ` • ${categories.length} catégorie${categories.length > 1 ? 's' : ''}`}
                </p>
              </div>
              <Link
                to={`/programs/${programId}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir le programme
              </Link>
            </div>
          </div>
        </div>

        {/* Recherche et filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Ligne 1: Recherche et vue */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un terme..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {/* Boutons de vue */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Vue grille"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Vue liste"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ligne 2: Catégories et options de tri */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex gap-2 flex-wrap flex-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                    selectedCategory === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Toutes
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Options de tri */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setSortOrder(sortOrder === 'alphabetical' ? 'original' : 'alphabetical')}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm inline-flex items-center gap-2 ${
                    sortOrder === 'alphabetical'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Trier par ordre alphabétique"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortOrder === 'alphabetical' ? 'A-Z' : 'Ordre original'}
                </button>
                {sortOrder === 'alphabetical' && (
                  <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={ignoreSymbols}
                      onChange={(e) => setIgnoreSymbols(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-gray-700">Ignorer symboles</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Liste des termes organisés par catégories */}
        <div className="space-y-6">
          {(() => {
            const termsByCategory = getTermsByCategory()
            const filteredTerms = getFilteredTerms()

            if (filteredTerms.length === 0) {
              return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchQuery ? 'Aucun terme trouvé pour cette recherche.' : 'Aucun terme dans cette catégorie.'}
                  </p>
                </div>
              )
            }

            // Si une catégorie est sélectionnée, afficher seulement cette catégorie
            if (selectedCategory) {
              const categoryTerms = termsByCategory.get(selectedCategory) || []
              const category = categories.find(c => c.id === selectedCategory)
              return (
                <div className="space-y-4">
                  {category && (
                    <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-r-lg mb-4">
                      <h2 className="text-xl font-semibold text-indigo-900">{category.name}</h2>
                      {category.description && (
                        <p className="text-sm text-indigo-700 mt-1">{category.description}</p>
                      )}
                      <p className="text-xs text-indigo-600 mt-2">
                        {categoryTerms.length} terme{categoryTerms.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  {/* Grille ou liste selon le mode */}
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                    : 'space-y-4'
                  }>
                    {categoryTerms.map((term) => (
                      <div
                        key={term.id}
                        id={`term-${term.id}`}
                        className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md ${
                          selectedTerm?.id === term.id ? 'ring-2 ring-blue-500' : ''
                        } ${
                          viewMode === 'grid' 
                            ? 'p-4 flex flex-col' 
                            : 'p-6'
                        }`}
                        onClick={() => handleTermClick(term)}
                      >
                        <div className={viewMode === 'grid' ? 'flex-1' : ''}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className={`font-bold text-gray-900 mb-2 ${
                                viewMode === 'grid' ? 'text-lg' : 'text-2xl'
                              }`}>
                                {term.word}
                              </h3>
                              {term.difficulty && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  term.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                  term.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {term.difficulty === 'beginner' ? 'Débutant' :
                                   term.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {viewMode === 'list' && (
                            <>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                {term.tags && term.tags.length > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    {term.tags.slice(0, 3).map(tag => (
                                      <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </span>
                                )}
                              </div>

                              <div className="prose max-w-none mb-4">
                                <p className="text-gray-700 whitespace-pre-line text-sm line-clamp-3">
                                  {term.explanation}
                                </p>
                              </div>

                              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-medium text-gray-700">Exemple :</span>
                                  {term.language && (
                                    <span className="px-2 py-0.5 bg-gray-200 rounded text-xs text-gray-600">
                                      {term.language}
                                    </span>
                                  )}
                                </div>
                                <pre className="text-xs overflow-x-auto bg-white p-2 rounded border border-gray-200">
                                  <code className={`language-${term.language || 'text'}`} style={{ fontFamily: 'monospace' }}>
                                    {term.example.substring(0, 100)}{term.example.length > 100 ? '...' : ''}
                                  </code>
                                </pre>
                              </div>
                            </>
                          )}

                          {viewMode === 'grid' && (
                            <>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {term.explanation}
                              </p>
                              {term.tags && term.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {term.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                          {/* Termes liés */}
                          {viewMode === 'list' && term.related_terms && term.related_terms.length > 0 && (
                            <div className="border-t border-gray-200 pt-3 mt-3">
                              <p className="text-xs font-medium text-gray-700 mb-2">Termes liés :</p>
                              <div className="flex flex-wrap gap-2">
                                {term.related_terms.slice(0, 3).map(relatedId => {
                                  const relatedTerm = glossary.terms.find(t => t.id === relatedId)
                                  if (!relatedTerm) return null
                                  return (
                                    <button
                                      key={relatedId}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRelatedTermClick(relatedId)
                                      }}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                                    >
                                      {relatedTerm.word}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            // Sinon, afficher tous les termes organisés par catégories
            // Trier les catégories selon l'ordre défini dans le glossaire
            const sortedCategoryEntries = Array.from(termsByCategory.entries()).sort(([idA], [idB]) => {
              if (idA === 'uncategorized') return 1
              if (idB === 'uncategorized') return -1
              
              const indexA = categories.findIndex(c => c.id === idA)
              const indexB = categories.findIndex(c => c.id === idB)
              
              if (indexA === -1) return 1
              if (indexB === -1) return -1
              
              return indexA - indexB
            })

            return sortedCategoryEntries.map(([categoryId, categoryTerms]) => {
              // Ignorer la catégorie "uncategorized" si elle est vide
              if (categoryId === 'uncategorized' && categoryTerms.length === 0) {
                return null
              }

              const category = categoryId !== 'uncategorized' 
                ? categories.find(c => c.id === categoryId)
                : null

              return (
                <div key={categoryId} className="space-y-4">
                  {/* En-tête de catégorie */}
                  <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-r-lg">
                    <h2 className="text-xl font-semibold text-indigo-900">
                      {category ? category.name : 'Autres termes'}
                    </h2>
                    {category?.description && (
                      <p className="text-sm text-indigo-700 mt-1">{category.description}</p>
                    )}
                    <p className="text-xs text-indigo-600 mt-2">
                      {categoryTerms.length} terme{categoryTerms.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Termes de cette catégorie */}
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                    : 'space-y-4'
                  }>
                    {categoryTerms.map((term) => (
                      <div
                        key={term.id}
                        id={`term-${term.id}`}
                        className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md cursor-pointer ${
                          selectedTerm?.id === term.id ? 'ring-2 ring-blue-500' : ''
                        } ${
                          viewMode === 'grid' 
                            ? 'p-4 flex flex-col' 
                            : 'p-6'
                        }`}
                        onClick={() => handleTermClick(term)}
                      >
                        <div className={viewMode === 'grid' ? 'flex-1' : ''}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className={`font-bold text-gray-900 mb-2 ${
                                viewMode === 'grid' ? 'text-lg' : 'text-2xl'
                              }`}>
                                {term.word}
                              </h3>
                              {term.difficulty && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  term.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                  term.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {term.difficulty === 'beginner' ? 'Débutant' :
                                   term.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {viewMode === 'list' && (
                            <>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                {term.tags && term.tags.length > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    {term.tags.slice(0, 3).map(tag => (
                                      <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </span>
                                )}
                              </div>

                              <div className="prose max-w-none mb-4">
                                <p className="text-gray-700 whitespace-pre-line text-sm">
                                  {term.explanation}
                                </p>
                              </div>

                              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-medium text-gray-700">Exemple :</span>
                                  {term.language && (
                                    <span className="px-2 py-0.5 bg-gray-200 rounded text-xs text-gray-600">
                                      {term.language}
                                    </span>
                                  )}
                                </div>
                                <pre className="text-xs overflow-x-auto bg-white p-2 rounded border border-gray-200">
                                  <code className={`language-${term.language || 'text'}`} style={{ fontFamily: 'monospace' }}>
                                    {term.example}
                                  </code>
                                </pre>
                              </div>
                            </>
                          )}

                          {viewMode === 'grid' && (
                            <>
                              <p className="text-sm text-gray-600 line-clamp-3 mb-3 flex-1">
                                {term.explanation}
                              </p>
                              {term.tags && term.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {term.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                          {/* Termes liés */}
                          {viewMode === 'list' && term.related_terms && term.related_terms.length > 0 && (
                            <div className="border-t border-gray-200 pt-3 mt-3">
                              <p className="text-xs font-medium text-gray-700 mb-2">Termes liés :</p>
                              <div className="flex flex-wrap gap-2">
                                {term.related_terms.map(relatedId => {
                                  const relatedTerm = glossary.terms.find(t => t.id === relatedId)
                                  if (!relatedTerm) return null
                                  return (
                                    <button
                                      key={relatedId}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRelatedTermClick(relatedId)
                                      }}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                                    >
                                      {relatedTerm.word}
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          })()}
        </div>

        {/* Modal pour afficher les détails d'un terme (mode grille) */}
        {selectedTerm && viewMode === 'grid' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTerm(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTerm.word}</h2>
                <button
                  onClick={() => setSelectedTerm(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {selectedTerm.difficulty && (
                    <span className={`px-3 py-1 text-sm font-medium rounded ${
                      selectedTerm.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      selectedTerm.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedTerm.difficulty === 'beginner' ? 'Débutant' :
                       selectedTerm.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                    </span>
                  )}
                  {selectedTerm.category_id && (
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {getCategoryName(selectedTerm.category_id)}
                    </span>
                  )}
                </div>

                <div className="prose max-w-none mb-4">
                  <p className="text-gray-700 whitespace-pre-line">{selectedTerm.explanation}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Exemple :</span>
                    {selectedTerm.language && (
                      <span className="px-2 py-0.5 bg-gray-200 rounded text-xs text-gray-600">
                        {selectedTerm.language}
                      </span>
                    )}
                  </div>
                  <pre className="text-sm overflow-x-auto bg-white p-3 rounded border border-gray-200">
                    <code className={`language-${selectedTerm.language || 'text'}`} style={{ fontFamily: 'monospace' }}>
                      {selectedTerm.example}
                    </code>
                  </pre>
                </div>

                {selectedTerm.tags && selectedTerm.tags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Tags :</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTerm.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTerm.related_terms && selectedTerm.related_terms.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Termes liés :</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTerm.related_terms.map(relatedId => {
                        const relatedTerm = glossary.terms.find(t => t.id === relatedId)
                        if (!relatedTerm) return null
                        return (
                          <button
                            key={relatedId}
                            onClick={() => {
                              setSelectedTerm(relatedTerm)
                              setTimeout(() => {
                                const element = document.getElementById(`term-${relatedTerm.id}`)
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                }
                              }, 100)
                            }}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium inline-flex items-center gap-1"
                          >
                            {relatedTerm.word}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
