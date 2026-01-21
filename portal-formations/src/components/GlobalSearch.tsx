import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, BookOpen, Layers, User, Settings, GraduationCap, X, Command } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useUserRole } from '../hooks/useUserRole'
import { supabase } from '../lib/supabaseClient'

interface SearchResult {
  id: string
  type: 'course' | 'program' | 'item' | 'user' | 'page'
  title: string
  description?: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isAdmin, isTrainer } = useUserRole()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Ouvrir avec Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
        setResults([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus sur l'input quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Navigation au clavier
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        navigateToResult(results[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  // Scroll vers l'élément sélectionné
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  // Recherche
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    const searchQuery = query.toLowerCase().trim()

    // Recherche dans les pages
    const pageResults: SearchResult[] = [
      {
        id: 'dashboard',
        type: 'page',
        title: 'Dashboard',
        path: '/app',
        icon: BookOpen,
      },
      {
        id: 'profile',
        type: 'page',
        title: 'Mon profil',
        path: '/profile',
        icon: User,
      },
    ]

    if (isAdmin) {
      pageResults.push({
        id: 'admin',
        type: 'page',
        title: 'Administration',
        path: '/admin',
        icon: Settings,
      })
    }

    if (isTrainer || isAdmin) {
      pageResults.push({
        id: 'trainer',
        type: 'page',
        title: 'Formateur',
        path: '/trainer',
        icon: GraduationCap,
      })
    }

    const filteredPages = pageResults.filter((page) =>
      page.title.toLowerCase().includes(searchQuery)
    )

    // Recherche intégrale dans tous les contenus
    const searchInDatabase = async () => {
      try {
        // 1. Recherche dans les cours (titre ET description)
        const coursesQuery = supabase
          .from('courses')
          .select('id, title, description')
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5)

        // 2. Recherche dans les programmes (titre ET description)
        const programsQuery = supabase
          .from('programs')
          .select('id, title, description')
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5)

        // 3. Recherche dans les modules (titre)
        const modulesQuery = supabase
          .from('modules')
          .select('id, title, course_id')
          .ilike('title', `%${searchQuery}%`)
          .limit(5)

        // 4. Recherche dans les items (titre)
        const itemsQuery = supabase
          .from('items')
          .select('id, title, type, module_id, content, description')
          .ilike('title', `%${searchQuery}%`)
          .limit(10)

        // 5. Recherche dans le contenu JSON des items (body, question, description, etc.)
        const itemsContentQuery = supabase
          .from('items')
          .select('id, title, type, module_id, content, description')
          .limit(50) // Récupérer plus d'items pour chercher dans le contenu

        const [coursesResult, programsResult, modulesResult, itemsResult, itemsContentResult] = await Promise.all([
          coursesQuery,
          programsQuery,
          modulesQuery,
          itemsQuery,
          itemsContentQuery,
        ])

        const courseResults: SearchResult[] =
          coursesResult.data?.map((course) => ({
            id: course.id,
            type: 'course' as const,
            title: course.title,
            description: course.description || undefined,
            path: `/courses/${course.id}`,
            icon: BookOpen,
          })) || []

        const programResults: SearchResult[] =
          programsResult.data?.map((program) => ({
            id: program.id,
            type: 'program' as const,
            title: program.title,
            description: program.description || undefined,
            path: `/programs/${program.id}`,
            icon: Layers,
          })) || []

        // Récupérer les cours pour les modules trouvés
        const moduleCourseIds = modulesResult.data?.map(m => m.course_id).filter(Boolean) || []
        let coursesMap = new Map()
        
        if (moduleCourseIds.length > 0) {
          const { data: coursesData } = await supabase
            .from('courses')
            .select('id, title')
            .in('id', moduleCourseIds)
          
          coursesMap = new Map(coursesData?.map(c => [c.id, c]) || [])
        }

        const moduleResults: SearchResult[] =
          modulesResult.data?.map((module) => {
            const course = coursesMap.get(module.course_id)
            const courseTitle = course?.title || 'Cours inconnu'
            
            return {
              id: module.id,
              type: 'item' as const, // Utiliser 'item' pour l'icône
              title: module.title,
              description: `Module dans "${courseTitle}"`,
              path: `/courses/${module.course_id}#module-${module.id}`,
              icon: BookOpen,
            }
          }) || []

        // Récupérer les modules et cours pour les items trouvés
        const allItemModuleIds = [
          ...(itemsResult.data?.map(i => i.module_id).filter(Boolean) || []),
          ...(itemsContentResult.data?.map(i => i.module_id).filter(Boolean) || [])
        ]
        const uniqueModuleIds = [...new Set(allItemModuleIds)]
        
        let modulesMap = new Map()
        
        if (uniqueModuleIds.length > 0) {
          const { data: modulesData } = await supabase
            .from('modules')
            .select('id, course_id, courses(id, title)')
            .in('id', uniqueModuleIds)
          
          modulesMap = new Map(modulesData?.map(m => [m.id, m]) || [])
        }

        // Fonction pour chercher dans le contenu JSON
        const searchInContent = (content: any, query: string): boolean => {
          if (!content) return false
          
          const searchLower = query.toLowerCase()
          
          // Rechercher dans les propriétés textuelles du contenu
          const searchableFields = [
            content.body,
            content.question,
            content.description,
            content.summary,
            content.instructions,
            content.text,
            JSON.stringify(content), // Recherche dans tout le JSON
          ]
          
          return searchableFields.some(field => {
            if (typeof field === 'string') {
              return field.toLowerCase().includes(searchLower)
            }
            return false
          })
        }

        // Items trouvés par titre
        const itemResults: SearchResult[] =
          itemsResult.data?.map((item) => {
            const module = modulesMap.get(item.module_id)
            const course = module?.courses
            const courseTitle = course?.title || 'Cours inconnu'
            
            return {
              id: item.id,
              type: 'item' as const,
              title: item.title,
              description: `Dans "${courseTitle}"`,
              path: `/items/${item.id}`,
              icon: FileText,
            }
          }) || []

        // Items trouvés dans le contenu (mais pas déjà dans itemResults)
        const itemIdsFromTitle = new Set(itemsResult.data?.map(i => i.id) || [])
        const itemsFromContent: SearchResult[] = []
        
        if (itemsContentResult.data) {
          for (const item of itemsContentResult.data) {
            // Ignorer si déjà trouvé par titre
            if (itemIdsFromTitle.has(item.id)) continue
            
            // Chercher dans le contenu
            if (searchInContent(item.content, searchQuery) || 
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))) {
              const module = modulesMap.get(item.module_id)
              const course = module?.courses
              const courseTitle = course?.title || 'Cours inconnu'
              
              itemsFromContent.push({
                id: item.id,
                type: 'item' as const,
                title: item.title,
                description: `Contenu dans "${courseTitle}"`,
                path: `/items/${item.id}`,
                icon: FileText,
              })
              
              // Limiter à 5 résultats de contenu
              if (itemsFromContent.length >= 5) break
            }
          }
        }

        setResults([
          ...filteredPages, 
          ...courseResults, 
          ...programResults, 
          ...moduleResults,
          ...itemResults, 
          ...itemsFromContent
        ])
      } catch (error) {
        console.error('Error searching:', error)
        setResults(filteredPages)
      } finally {
        setIsLoading(false)
      }
    }

    searchInDatabase()
  }, [query, isAdmin, isTrainer])

  const navigateToResult = (result: SearchResult) => {
    navigate(result.path)
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors border border-gray-200"
        title="Recherche globale (Ctrl+K)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">Rechercher...</span>
        <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => {
          setIsOpen(false)
          setQuery('')
          setResults([])
        }}
      />
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl mx-4" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Rechercher des formations, programmes, contenus, pages..."
              className="flex-1 outline-none text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={() => {
                setIsOpen(false)
                setQuery('')
                setResults([])
              }}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div
            ref={resultsRef}
            className="overflow-y-auto flex-1 min-h-0"
          >
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Recherche en cours...
              </div>
            ) : results.length === 0 && query ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Aucun résultat pour "{query}"
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Commencez à taper pour rechercher...
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => {
                  const Icon = result.icon
                  return (
                    <button
                      key={result.id}
                      onClick={() => navigateToResult(result)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                        index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        index === selectedIndex ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${
                          index === selectedIndex ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {result.title}
                        </div>
                        {result.description && (
                          <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                            {result.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {result.type === 'course' && 'Formation'}
                          {result.type === 'program' && 'Programme'}
                          {result.type === 'item' && 'Contenu'}
                          {result.type === 'page' && 'Page'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
            <div className="flex items-center gap-4 flex-wrap">
              <span>↑↓ Navigation</span>
              <span>↵ Sélectionner</span>
              <span>Esc Fermer</span>
            </div>
            <span>{results.length} résultat{results.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </>
  )
}
