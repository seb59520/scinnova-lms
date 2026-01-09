import { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { CourseJson } from '../types/courseJson'
import { CourseAllTp, TpBatchWithItems } from '../types/database'
import { ChevronDown, ChevronUp, BookOpen, FileText, Presentation, PenTool, Gamepad2, X, Layers } from 'lucide-react'

interface CourseSidebarProps {
  courseJson: CourseJson
  onClose?: () => void
  sidebarWidth?: number
  minWidth?: number
  onModuleSelect?: (moduleIndex: number) => void
  selectedModuleIndex?: number | null
  directTps?: CourseAllTp[]
  tpBatches?: TpBatchWithItems[]
}

export function CourseSidebar({ courseJson, onClose, sidebarWidth = 256, minWidth = 200, onModuleSelect, selectedModuleIndex, directTps = [], tpBatches = [] }: CourseSidebarProps) {
  const { courseId } = useParams<{ courseId: string }>()
  const location = useLocation()
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set()) // Par défaut, tous fermés
  const [expandedLexique, setExpandedLexique] = useState(false)
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set())
  
  // Détecter si la sidebar est réduite au minimum (à 5px près pour gérer les arrondis)
  const isMinimized = sidebarWidth <= minWidth + 5

  // Synchroniser avec le module sélectionné depuis le contenu principal
  useEffect(() => {
    if (selectedModuleIndex !== null && selectedModuleIndex !== undefined) {
      setExpandedModules(new Set([selectedModuleIndex]))
    }
  }, [selectedModuleIndex])

  // Détecter si on est sur la page du cours ou sur une page d'item individuel
  const isCourseView = location.pathname.includes('/courses/') && !location.pathname.includes('/items/')
  const currentItemId = location.pathname.includes('/items/') 
    ? location.pathname.split('/items/')[1] 
    : undefined

  const toggleModule = (index: number) => {
    const newExpanded = new Set<number>()
    // Si le module est déjà ouvert, on le ferme
    // Sinon, on ferme tous les autres et on ouvre seulement celui-ci
    if (!expandedModules.has(index)) {
      newExpanded.add(index)
      // Notifier le parent pour synchroniser la vue du contenu
      if (onModuleSelect) {
        onModuleSelect(index)
      }
    }
    setExpandedModules(newExpanded)
  }

  // Obtenir la couleur dominante d'un module basée sur les types d'items
  const getModuleColor = (module: any) => {
    const items = module.items || []
    if (items.length === 0) return 'bg-gray-200'
    
    // Compter les types d'items
    const typeCounts: Record<string, number> = {}
    items.forEach((item: any) => {
      const type = item.type || 'resource'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    
    // Trouver le type le plus fréquent
    const dominantType = Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0]] > typeCounts[b[0]] ? a : b
    )[0]
    
    // Retourner la couleur correspondante
    switch (dominantType) {
      case 'resource':
        return 'bg-blue-500'
      case 'slide':
        return 'bg-green-500'
      case 'exercise':
        return 'bg-yellow-500'
      case 'tp':
        return 'bg-purple-500'
      case 'game':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Trouver le lexique
  const lexiqueItem = courseJson.modules
    .flatMap(m => m.items)
    .find(item => item.title.toLowerCase().includes('lexique') || item.content?.isLexique)

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'resource':
        return <FileText className="w-4 h-4" />
      case 'slide':
        return <Presentation className="w-4 h-4" />
      case 'exercise':
        return <PenTool className="w-4 h-4" />
      case 'tp':
        return <FileText className="w-4 h-4" />
      case 'game':
        return <Gamepad2 className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getItemColor = (type: string) => {
    switch (type) {
      case 'resource':
        return 'text-blue-600'
      case 'slide':
        return 'text-green-600'
      case 'exercise':
        return 'text-yellow-600'
      case 'tp':
        return 'text-purple-600'
      case 'game':
        return 'text-pink-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="w-full bg-white border-r border-gray-200 h-full flex flex-col shadow-lg" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="flex-1 overflow-y-auto" style={{ height: '100%', overflowY: 'auto' }}>
        <div className="p-4">
        {!isMinimized && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Table des matières
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Lexique - masqué quand minimisé */}
        {!isMinimized && lexiqueItem && (
          <div className="mb-4">
            <button
              onClick={() => setExpandedLexique(!expandedLexique)}
              className="w-full flex items-center justify-between text-left p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {lexiqueItem.title}
                </span>
              </div>
              {expandedLexique ? (
                <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>
            {expandedLexique && (
              <div className="ml-6 mt-1">
                <Link
                  to={`/courses/${courseId}#lexique`}
                  className="block text-xs text-gray-600 hover:text-blue-600 py-1"
                  onClick={(e) => {
                    e.preventDefault()
                    // Scroll vers le lexique dans la page
                    const lexiqueElement = document.getElementById('lexique')
                    if (lexiqueElement) {
                      lexiqueElement.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  Voir le lexique
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Étiquettes de modules cliquables - affichées en haut */}
        {!isMinimized && (
          <div className="mb-4 flex flex-wrap gap-2">
            {courseJson.modules.map((module, moduleIndex) => {
              const moduleItems = lexiqueItem 
                ? module.items.filter(item => 
                    !(item.title.toLowerCase().includes('lexique') || item.content?.isLexique) && item.published !== false
                  )
                : module.items.filter(item => item.published !== false)

              if (moduleItems.length === 0) {
                return null
              }

              const isExpanded = expandedModules.has(moduleIndex)
              const moduleColor = getModuleColor(module)

              return (
                <button
                  key={moduleIndex}
                  onClick={() => toggleModule(moduleIndex)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all ${
                    isExpanded 
                      ? `${moduleColor} shadow-md ring-2 ring-offset-2 ring-gray-300` 
                      : `${moduleColor} opacity-70 hover:opacity-100`
                  }`}
                  title={module.title}
                >
                  Module {moduleIndex + 1}
                </button>
              )
            })}
          </div>
        )}

        {/* Modules */}
        <div className="space-y-1">
          {courseJson.modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.has(moduleIndex)
            
            // Filtrer les items (exclure le lexique s'il est affiché séparément)
            const moduleItems = lexiqueItem 
              ? module.items.filter(item => 
                  !(item.title.toLowerCase().includes('lexique') || item.content?.isLexique) && item.published !== false
                )
              : module.items.filter(item => item.published !== false)

            if (moduleItems.length === 0) {
              return null
            }

            // Si la sidebar est minimisée, n'afficher que le titre du module
            if (isMinimized) {
              return (
                <div key={moduleIndex} className="mb-2">
                  <a
                    href={`/courses/${courseId}#module-${moduleIndex}`}
                    onClick={(e) => {
                      e.preventDefault()
                      const element = document.getElementById(`module-${moduleIndex}`)
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        if (onClose && window.innerWidth < 1024) {
                          setTimeout(() => onClose(), 300)
                        }
                      }
                    }}
                    className="flex items-center justify-center text-left p-2 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                    title={module.title}
                  >
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      Module {moduleIndex + 1}
                    </span>
                  </a>
                </div>
              )
            }

            // Si le module n'est pas ouvert, ne pas l'afficher
            if (!isExpanded) {
              return null
            }

            return (
              <div key={moduleIndex} className="mb-2">
                <div className="w-full flex items-center justify-between mb-2">
                  <div className="flex-1 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 truncate flex-1">
                      {module.title}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2">
                      ({moduleItems.length})
                    </span>
                  </div>
                  <button
                    onClick={() => toggleModule(moduleIndex)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                    title="Fermer ce module"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="ml-2 mt-1 space-y-1">
                    {moduleItems.map((item, itemIndex) => {
                      // Utiliser l'ID de l'item s'il est disponible
                      const itemId = item.id
                      const isActive = currentItemId === itemId
                      
                      // Créer un ID d'ancre basé sur le titre de l'item
                      const anchorId = `item-${moduleIndex}-${itemIndex}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                      
                      // Pour les exercices et TP, toujours naviguer vers la page individuelle pour permettre la soumission
                      // Pour les autres types, utiliser des ancres si on est en mode course view
                      const isExerciseOrTp = item.type === 'exercise' || item.type === 'tp'
                      
                      const handleClick = (e: React.MouseEvent) => {
                        // Si c'est un exercice ou TP avec un ID, laisser le lien naturel fonctionner
                        if (isExerciseOrTp && itemId) {
                          // Fermer la sidebar sur mobile après navigation
                          if (onClose && window.innerWidth < 1024) {
                            setTimeout(() => onClose(), 300)
                          }
                          return // Laisser le Link gérer la navigation
                        }
                        
                        // Pour les autres types en mode course view, faire un scroll
                        if (isCourseView && !isExerciseOrTp) {
                          e.preventDefault()
                          const element = document.getElementById(anchorId)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            // Fermer la sidebar sur mobile après navigation
                            if (onClose && window.innerWidth < 1024) {
                              setTimeout(() => onClose(), 300)
                            }
                          }
                        }
                      }
                      
                      // Pour les exercices/TP avec ID, toujours aller vers la page individuelle
                      // Sinon, utiliser des ancres si on est en mode course view
                      const linkTo = (isExerciseOrTp && itemId)
                        ? `/items/${itemId}`
                        : isCourseView 
                          ? `#${anchorId}`
                          : itemId 
                            ? `/items/${itemId}`
                            : `/courses/${courseId}#${anchorId}`
                      
                      // Récupérer les chapitres depuis la base de données ou depuis item.chapters
                      const itemChapters = item.chapters || []
                      
                      return (
                        <div key={itemIndex} className="mb-1">
                          <a
                            href={linkTo}
                            onClick={handleClick}
                            className={`flex items-center space-x-2 p-2 rounded text-sm transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <span className={getItemColor(item.type)}>
                              {getItemIcon(item.type)}
                            </span>
                            <span className="truncate flex-1">{item.title}</span>
                          </a>
                          
                          {/* Afficher les titres des chapitres si disponibles - maintenant cliquables */}
                          {itemChapters.length > 0 && (
                            <div className="ml-6 mt-1 space-y-0.5">
                              {itemChapters
                                .sort((a, b) => (a.position || 0) - (b.position || 0))
                                .map((chapter, chapterIndex) => {
                                  const isGame = chapter.type === 'game' || (!!chapter.game_content && typeof chapter.game_content === 'object')
                                  // Créer un lien vers l'item avec ancre pour le chapitre
                                  const chapterLink = itemId 
                                    ? `/items/${itemId}#chapter-${chapterIndex}`
                                    : `/courses/${courseId}#item-${moduleIndex}-${itemIndex}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-chapter-${chapterIndex}`
                                  
                                  return (
                                    <a
                                      key={chapterIndex}
                                      href={chapterLink}
                                      onClick={(e) => {
                                        // Si on a un itemId, naviguer vers la page item
                                        if (itemId) {
                                          // Fermer la sidebar sur mobile après navigation
                                          if (onClose && window.innerWidth < 1024) {
                                            setTimeout(() => onClose(), 300)
                                          }
                                          // Le lien naturel fonctionnera
                                          return
                                        }
                                        
                                        // Sinon, faire un scroll vers l'ancre
                                        e.preventDefault()
                                        const element = document.getElementById(`item-${moduleIndex}-${itemIndex}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-chapter-${chapterIndex}`)
                                        if (element) {
                                          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                          // Fermer la sidebar sur mobile après navigation
                                          if (onClose && window.innerWidth < 1024) {
                                            setTimeout(() => onClose(), 300)
                                          }
                                        }
                                      }}
                                      className="flex items-center space-x-1.5 py-0.5 px-2 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded transition-colors cursor-pointer"
                                    >
                                      {isGame ? (
                                        <Gamepad2 className="w-3 h-3 text-red-500 flex-shrink-0" />
                                      ) : (
                                        <span className="text-gray-400">•</span>
                                      )}
                                      <span className="truncate">{chapter.title}</span>
                                    </a>
                                  )
                                })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>

        {/* TP associés directement */}
        {!isMinimized && directTps.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              TP Associés
            </h3>
            <div className="space-y-1">
              {directTps.map((tp) => {
                const isActive = currentItemId === tp.tp_id
                return (
                  <Link
                    key={tp.tp_id}
                    to={`/items/${tp.tp_id}`}
                    onClick={() => {
                      if (onClose && window.innerWidth < 1024) {
                        setTimeout(() => onClose(), 300)
                      }
                    }}
                    className={`flex items-center space-x-2 p-2 rounded text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="truncate">{tp.tp_title}</span>
                    {tp.is_required && (
                      <span className="text-xs text-blue-600">*</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Lots de TP */}
        {!isMinimized && tpBatches.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Lots de TP
            </h3>
            <div className="space-y-2">
              {tpBatches.map((batch) => {
                const isExpanded = expandedBatches.has(batch.id)
                const sortedItems = [...(batch.tp_batch_items || [])].sort((a, b) => a.position - b.position)
                
                return (
                  <div key={batch.id} className="border border-gray-200 rounded">
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedBatches)
                        if (isExpanded) {
                          newExpanded.delete(batch.id)
                        } else {
                          newExpanded.add(batch.id)
                        }
                        setExpandedBatches(newExpanded)
                      }}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-t transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Layers className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {batch.title}
                        </span>
                        {batch.sequential_order && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            Séquentiel
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="p-2 space-y-1 border-t border-gray-200">
                        {sortedItems.map((batchItem) => {
                          const isActive = currentItemId === batchItem.item_id
                          const item = batchItem.items
                          if (!item) return null
                          
                          return (
                            <Link
                              key={batchItem.id}
                              to={`/items/${batchItem.item_id}`}
                              onClick={() => {
                                if (onClose && window.innerWidth < 1024) {
                                  setTimeout(() => onClose(), 300)
                                }
                              }}
                              className={`flex items-center space-x-2 p-1.5 rounded text-sm transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <FileText className="w-3 h-3 text-purple-600 flex-shrink-0" />
                              <span className="truncate text-xs">{item.title}</span>
                              {batchItem.is_required && (
                                <span className="text-xs text-blue-600">*</span>
                              )}
                              {batchItem.prerequisite_item_id && (
                                <span className="text-xs text-gray-400" title="Prérequis">
                                  🔗
                                </span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

