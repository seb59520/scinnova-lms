import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home, Layers, BookOpen, FolderOpen, FileText, ChevronDown, ChevronUp, MapPin } from 'lucide-react'

// Types pour le contexte de navigation
export interface NavigationItem {
  id: string
  title: string
  type: 'program' | 'course' | 'module' | 'item'
  path?: string
}

export interface NavigationContextData {
  program?: NavigationItem
  course?: NavigationItem
  module?: NavigationItem
  item?: NavigationItem
  totalItems?: number
  currentItemIndex?: number
  modules?: Array<{
    id: string
    title: string
    position: number
    items: Array<{
      id: string
      title: string
      type: string
      position: number
      completed?: boolean
    }>
  }>
}

interface NavigationContextType {
  context: NavigationContextData
  setContext: (data: NavigationContextData) => void
  clearContext: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [context, setContextState] = useState<NavigationContextData>({})

  const setContext = useCallback((data: NavigationContextData) => {
    setContextState(prev => ({ ...prev, ...data }))
  }, [])

  const clearContext = useCallback(() => {
    setContextState({})
  }, [])

  return (
    <NavigationContext.Provider value={{ context, setContext, clearContext }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigationContext() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigationContext must be used within a NavigationProvider')
  }
  return context
}

// Composant Fil d'Ariane amélioré
export function EnhancedBreadcrumb() {
  const location = useLocation()
  const { context } = useNavigationContext()

  const getIcon = (type: string) => {
    switch (type) {
      case 'program': return <Layers className="w-4 h-4" />
      case 'course': return <BookOpen className="w-4 h-4" />
      case 'module': return <FolderOpen className="w-4 h-4" />
      case 'item': return <FileText className="w-4 h-4" />
      default: return null
    }
  }

  const breadcrumbs: Array<{ label: string; path?: string; icon?: ReactNode; isCurrent?: boolean }> = []

  // Accueil
  breadcrumbs.push({ label: 'Accueil', path: '/app', icon: <Home className="w-4 h-4" /> })

  // Programme
  if (context.program) {
    breadcrumbs.push({
      label: context.program.title,
      path: `/programs/${context.program.id}`,
      icon: getIcon('program')
    })
  }

  // Cours
  if (context.course) {
    breadcrumbs.push({
      label: context.course.title,
      path: `/courses/${context.course.id}`,
      icon: getIcon('course')
    })
  }

  // Module (affiché mais non cliquable)
  if (context.module) {
    breadcrumbs.push({
      label: context.module.title,
      icon: getIcon('module')
    })
  }

  // Item courant
  if (context.item) {
    breadcrumbs.push({
      label: context.item.title,
      icon: getIcon('item'),
      isCurrent: true
    })
  }

  // Si pas de contexte, utiliser le chemin URL comme fallback
  if (breadcrumbs.length === 1) {
    const pathnames = location.pathname.split('/').filter(x => x)
    // Helper to detect UUID
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

    let prevSegment = ''
    pathnames.forEach((value, index) => {
      if (value === 'app') {
        prevSegment = value
        return
      }
      const path = `/${pathnames.slice(0, index + 1).join('/')}`
      let label = value

      // Handle known routes
      if (value === 'courses') label = 'Formations'
      else if (value === 'programs') label = 'Programmes'
      else if (value === 'items') label = 'Contenu'
      else if (value === 'admin') label = 'Administration'
      else if (value === 'trainer') label = 'Formateur'
      else if (value === 'glossaires') label = 'Glossaires'
      else if (value === 'glossary') label = 'Glossaire'
      // Handle UUIDs - show generic label based on previous segment
      else if (isUUID(value)) {
        if (prevSegment === 'courses') label = 'Formation'
        else if (prevSegment === 'programs') label = 'Programme'
        else if (prevSegment === 'items') label = 'Element'
        else label = 'Chargement...'
      }
      else label = value.charAt(0).toUpperCase() + value.slice(1)

      breadcrumbs.push({
        label,
        path: index === pathnames.length - 1 ? undefined : path,
        isCurrent: index === pathnames.length - 1
      })

      prevSegment = value
    })
  }

  if (breadcrumbs.length <= 1) return null

  return (
    <nav 
      className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto min-w-0 scroll-smooth breadcrumb-scroll"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
      }}
    >
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-2 whitespace-nowrap flex-shrink-0">
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          {crumb.path ? (
            <Link
              to={crumb.path}
              className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1 px-1.5 rounded hover:bg-blue-50/50"
              title={crumb.label}
            >
              {crumb.icon}
              <span className="max-w-[200px] truncate">{crumb.label}</span>
            </Link>
          ) : (
            <span 
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded ${crumb.isCurrent ? 'text-gray-900 font-semibold bg-gray-50' : ''}`}
              title={crumb.label}
            >
              {crumb.icon}
              <span className="max-w-[300px] truncate">{crumb.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

// Barre de contexte persistante pour les cours (simplifiée - pas de fil d'Ariane)
export function CourseContextBar() {
  const { context } = useNavigationContext()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!context.course) return null

  const progress = context.totalItems && context.currentItemIndex !== undefined
    ? Math.round(((context.currentItemIndex + 1) / context.totalItems) * 100)
    : 0

  return (
    <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-b border-blue-100/50 sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barre principale - discrète avec progression uniquement */}
        <div className="flex items-center justify-end py-2 gap-3">

          {/* Progression et toggle - design compact et élégant */}
          <div className="flex items-center gap-2.5">
            {/* Indicateur de position compact */}
            {context.totalItems && context.currentItemIndex !== undefined && (
              <div className="flex items-center gap-2 bg-white/60 rounded-lg px-2.5 py-1.5 border border-blue-100/50">
                <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                  {context.currentItemIndex + 1} / {context.totalItems}
                </span>
                {/* Barre de progression compacte */}
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-700 min-w-[2.5rem]">{progress}%</span>
              </div>
            )}

            {/* Toggle mini-map - design amélioré */}
            {context.modules && context.modules.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-white/80 rounded-lg transition-all border border-blue-200/50 shadow-sm hover:shadow"
              >
                <span className="hidden sm:inline">Structure</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mini-map expandable */}
        {isExpanded && context.modules && (
          <CourseMiniMap
            modules={context.modules}
            currentModuleId={context.module?.id}
            currentItemId={context.item?.id}
          />
        )}
      </div>
    </div>
  )
}

// Mini-map du cours
interface CourseMiniMapProps {
  modules: NavigationContextData['modules']
  currentModuleId?: string
  currentItemId?: string
}

export function CourseMiniMap({ modules, currentModuleId, currentItemId }: CourseMiniMapProps) {
  if (!modules || modules.length === 0) return null

  return (
    <div className="py-3 border-t border-blue-100">
      <div className="flex flex-wrap gap-2">
        {modules.map((module, moduleIndex) => {
          const isCurrentModule = module.id === currentModuleId
          const completedItems = module.items.filter(i => i.completed).length
          const totalItems = module.items.length

          return (
            <div
              key={module.id}
              className={`relative group ${isCurrentModule ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
            >
              {/* Module card */}
              <div className={`
                px-3 py-2 rounded-lg text-sm transition-all cursor-pointer
                ${isCurrentModule
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }
              `}>
                <div className="font-medium truncate max-w-[120px]">
                  {moduleIndex + 1}. {module.title}
                </div>

                {/* Mini progress pour les items */}
                <div className="flex gap-0.5 mt-1.5">
                  {module.items.slice(0, 8).map((item) => {
                    const isCurrent = item.id === currentItemId
                    return (
                      <Link
                        key={item.id}
                        to={`/items/${item.id}`}
                        className={`
                          w-3 h-3 rounded-sm transition-all
                          ${isCurrent
                            ? 'bg-blue-500 ring-2 ring-blue-300'
                            : item.completed
                              ? 'bg-green-400'
                              : 'bg-gray-300 hover:bg-gray-400'
                          }
                        `}
                        title={item.title}
                      />
                    )
                  })}
                  {module.items.length > 8 && (
                    <span className="text-xs text-gray-500 ml-1">+{module.items.length - 8}</span>
                  )}
                </div>

                {/* Compteur */}
                <div className="text-xs text-gray-500 mt-1">
                  {completedItems}/{totalItems} terminés
                </div>
              </div>

              {/* Tooltip avec liste des items (on hover) */}
              <div className="
                absolute left-0 top-full mt-1 z-50
                hidden group-hover:block
                bg-white rounded-lg shadow-lg border border-gray-200
                p-2 min-w-[200px] max-w-[300px]
              ">
                <div className="text-xs font-medium text-gray-500 mb-2 px-1">
                  {module.title}
                </div>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {module.items.map((item, itemIndex) => {
                    const isCurrent = item.id === currentItemId
                    return (
                      <Link
                        key={item.id}
                        to={`/items/${item.id}`}
                        className={`
                          block px-2 py-1.5 rounded text-sm transition-colors
                          ${isCurrent
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`
                            w-2 h-2 rounded-full flex-shrink-0
                            ${isCurrent ? 'bg-blue-500' : item.completed ? 'bg-green-400' : 'bg-gray-300'}
                          `} />
                          <span className="truncate">{itemIndex + 1}. {item.title}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
