import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight, ChevronDown, BookOpen, X } from 'lucide-react'
import { useUserRole } from '../../hooks/useUserRole'

interface Section {
  id: string
  title: string
  level: number
  content: string
  subsections: Section[]
}

export function AdminDocumentation() {
  const { isAdmin } = useUserRole()
  const [markdown, setMarkdown] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    async function loadDocumentation() {
      try {
        const response = await fetch('/DOCUMENTATION.md')
        if (!response.ok) {
          throw new Error('Impossible de charger la documentation')
        }
        const text = await response.text()
        setMarkdown(text)
      } catch (error) {
        console.error('Erreur lors du chargement de la documentation:', error)
        setMarkdown('# Erreur\n\nImpossible de charger la documentation.')
      } finally {
        setLoading(false)
      }
    }
    loadDocumentation()
  }, [])

  // Parser le markdown en sections
  const sections = useMemo(() => {
    if (!markdown) return []

    const lines = markdown.split('\n')
    const parsed: Section[] = []
    const stack: Section[] = []
    let currentContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)

      if (headerMatch) {
        // Sauvegarder le contenu précédent
        if (currentContent.length > 0 && stack.length > 0) {
          stack[stack.length - 1].content += currentContent.join('\n')
          currentContent = []
        }

        const level = headerMatch[1].length
        const title = headerMatch[2].trim()
        const id = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        const section: Section = {
          id: `${id}-${i}`,
          title,
          level,
          content: '',
          subsections: []
        }

        // Trouver le bon parent dans la stack
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop()
        }

        if (stack.length === 0) {
          parsed.push(section)
        } else {
          stack[stack.length - 1].subsections.push(section)
        }

        stack.push(section)
      } else {
        currentContent.push(line)
      }
    }

    // Ajouter le dernier contenu
    if (currentContent.length > 0 && stack.length > 0) {
      stack[stack.length - 1].content += currentContent.join('\n')
    }

    return parsed
  }, [markdown])

  // Filtrer les sections selon la recherche
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections

    const query = searchQuery.toLowerCase()
    const filterSection = (section: Section): Section | null => {
      const titleMatch = section.title.toLowerCase().includes(query)
      const contentMatch = section.content.toLowerCase().includes(query)
      
      const filteredSubsections = section.subsections
        .map(filterSection)
        .filter((s): s is Section => s !== null)

      if (titleMatch || contentMatch || filteredSubsections.length > 0) {
        return {
          ...section,
          subsections: filteredSubsections
        }
      }

      return null
    }

    return sections.map(filterSection).filter((s): s is Section => s !== null)
  }, [sections, searchQuery])

  // Auto-expand les sections qui correspondent à la recherche
  useEffect(() => {
    if (searchQuery.trim()) {
      const expandMatching = (section: Section) => {
        const query = searchQuery.toLowerCase()
        if (
          section.title.toLowerCase().includes(query) ||
          section.content.toLowerCase().includes(query) ||
          section.subsections.some(s => 
            s.title.toLowerCase().includes(query) ||
            s.content.toLowerCase().includes(query)
          )
        ) {
          setExpandedSections(prev => new Set([...prev, section.id]))
          section.subsections.forEach(expandMatching)
        }
      }
      filteredSections.forEach(expandMatching)
    }
  }, [searchQuery, filteredSections])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Rendre le markdown en HTML (amélioré)
  const renderMarkdown = (content: string) => {
    if (!content) return null

    let html = content
      // Code blocks avec langage
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'text'
        return `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="language-${language}">${code.trim()}</code></pre>`
      })
      // Inline code
      .replace(/`([^`\n]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="my-6 border-gray-300" />')
      // Headers (doit être après les autres remplacements)
      .replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold mt-5 mb-2 text-gray-900">$1</h4>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4 text-gray-900">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-10 mb-5 text-gray-900">$1</h1>')

    // Traiter les listes et paragraphes ligne par ligne
    const lines = html.split('\n')
    const processed: string[] = []
    let inList = false
    let listType: 'ul' | 'ol' | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)$/)
      const orderedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/)

      if (bulletMatch) {
        if (!inList || listType !== 'ul') {
          if (inList && listType === 'ol') {
            processed.push('</ol>')
          }
          processed.push('<ul class="list-disc list-inside mb-4 space-y-1 ml-4">')
          inList = true
          listType = 'ul'
        }
        processed.push(`<li class="text-gray-700">${bulletMatch[2]}</li>`)
      } else if (orderedMatch) {
        if (!inList || listType !== 'ol') {
          if (inList && listType === 'ul') {
            processed.push('</ul>')
          }
          processed.push('<ol class="list-decimal list-inside mb-4 space-y-1 ml-4">')
          inList = true
          listType = 'ol'
        }
        processed.push(`<li class="text-gray-700">${orderedMatch[2]}</li>`)
      } else {
        if (inList) {
          processed.push(listType === 'ul' ? '</ul>' : '</ol>')
          inList = false
          listType = null
        }
        if (line.trim() && !line.match(/^<[h|p|d|h|s|p|r|e]/)) {
          processed.push(`<p class="mb-4 text-gray-700">${line}</p>`)
        } else if (line.trim()) {
          processed.push(line)
        }
      }
    }

    if (inList) {
      processed.push(listType === 'ul' ? '</ul>' : '</ol>')
    }

    return { __html: processed.join('\n') }
  }

  const renderSection = (section: Section, depth = 0) => {
    const isExpanded = expandedSections.has(section.id)
    const isActive = activeSection === section.id
    const hasSubsections = section.subsections.length > 0

    return (
      <div key={section.id} className="mb-2">
        <div
          id={section.id}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${
            isActive
              ? 'bg-blue-100 border-l-4 border-blue-600'
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          <div
            className="flex items-center justify-between"
            onClick={() => {
              if (hasSubsections) {
                toggleSection(section.id)
              }
              scrollToSection(section.id)
            }}
          >
            <div className="flex items-center space-x-2 flex-1">
              {hasSubsections ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )
              ) : (
                <div className="w-4" />
              )}
              <BookOpen className="w-4 h-4 text-gray-400" />
              <h3
                className={`font-medium text-gray-900 ${
                  section.level === 1
                    ? 'text-lg'
                    : section.level === 2
                    ? 'text-base'
                    : 'text-sm'
                }`}
              >
                {section.title}
              </h3>
            </div>
          </div>
        </div>

        {isExpanded && hasSubsections && (
          <div className="ml-4">
            {section.subsections.map(sub => renderSection(sub, depth + 1))}
          </div>
        )}

        {isExpanded && section.content.trim() && (
          <div
            className="prose max-w-none mt-4 mb-6 px-4 text-gray-700"
            dangerouslySetInnerHTML={renderMarkdown(section.content)}
          />
        )}
      </div>
    )
  }

  // Vérifier que l'utilisateur est admin (après tous les hooks)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h1>
          <p className="text-gray-600 mb-4">Cette page est réservée aux administrateurs.</p>
          <Link
            to="/app"
            className="text-blue-600 hover:text-blue-500"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la documentation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour à l'administration
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documentation complète</h1>
                <p className="text-sm text-gray-600">Guide de référence pour les administrateurs</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 w-full">
          {/* Sidebar - Navigation */}
          <aside className="w-80 flex-shrink-0 bg-white rounded-lg shadow p-4 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <nav className="space-y-1">
              {filteredSections.length === 0 ? (
                <p className="text-gray-500 text-sm p-4">Aucun résultat trouvé</p>
              ) : (
                filteredSections.map(section => renderSection(section))
              )}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-white rounded-lg shadow p-8 min-w-0">
            {filteredSections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun résultat pour "{searchQuery}"</p>
              </div>
            ) : (
              <div className="prose max-w-none">
                {filteredSections.map(section => (
                  <div key={section.id} id={section.id} className="mb-8">
                    <h1 className="text-3xl font-bold mb-4 text-gray-900">{section.title}</h1>
                    {section.content && (
                      <div
                        dangerouslySetInnerHTML={renderMarkdown(section.content)}
                        className="markdown-content"
                      />
                    )}
                    {section.subsections.map(subsection => (
                      <div key={subsection.id} id={subsection.id} className="mt-8">
                        <h2 className="text-2xl font-semibold mb-3 text-gray-900">{subsection.title}</h2>
                        {subsection.content && (
                          <div
                            dangerouslySetInnerHTML={renderMarkdown(subsection.content)}
                            className="markdown-content"
                          />
                        )}
                        {subsection.subsections.map(subsub => (
                          <div key={subsub.id} id={subsub.id} className="mt-6">
                            <h3 className="text-xl font-semibold mb-2 text-gray-900">{subsub.title}</h3>
                            {subsub.content && (
                              <div
                                dangerouslySetInnerHTML={renderMarkdown(subsub.content)}
                                className="markdown-content"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <style>{`
        .markdown-content {
          color: #374151 !important;
        }
        .markdown-content pre {
          background-color: #1f2937 !important;
          color: #f3f4f6 !important;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .markdown-content code {
          background-color: #f3f4f6;
          color: #1f2937 !important;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .markdown-content pre code {
          background-color: transparent !important;
          color: #f3f4f6 !important;
          padding: 0;
        }
        .markdown-content p {
          color: #374151 !important;
        }
        .markdown-content ul, .markdown-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .markdown-content li {
          margin-bottom: 0.5rem;
          color: #374151 !important;
        }
        .markdown-content a {
          color: #2563eb !important;
          text-decoration: underline;
        }
        .markdown-content a:hover {
          color: #1e40af !important;
        }
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4 {
          color: #111827 !important;
        }
      `}</style>
    </div>
  )
}
