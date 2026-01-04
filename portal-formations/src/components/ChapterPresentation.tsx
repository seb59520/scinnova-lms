import { useEffect, useState } from 'react'
import { Chapter } from '../types/database'
import { RichTextEditor } from './RichTextEditor'
import { useUserSettings } from '../hooks/useUserSettings'
import { X, ChevronLeft, ChevronRight, Maximize2, Settings, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

interface ChapterPresentationProps {
  chapters: Chapter[]
  initialIndex: number
  onClose: () => void
  courseId?: string // Optionnel : pour récupérer tous les modules
}

export function ChapterPresentation({ chapters, initialIndex, onClose, courseId }: ChapterPresentationProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showSettings, setShowSettings] = useState(false)
  const [currentModuleInfo, setCurrentModuleInfo] = useState<{ title: string; index: number } | null>(null)
  const [moduleBoundaries, setModuleBoundaries] = useState<Array<{ startIndex: number; endIndex: number; title: string }>>([])
  const { settings, updateLayoutPreferences } = useUserSettings()

  // Synchroniser currentIndex avec initialIndex quand il change
  useEffect(() => {
    console.log('[ChapterPresentation] initialIndex changed:', initialIndex, 'current chapters length:', chapters.length)
    if (initialIndex >= 0 && initialIndex < chapters.length) {
      console.log('[ChapterPresentation] Setting currentIndex to:', initialIndex)
      setCurrentIndex(initialIndex)
    } else {
      console.warn('[ChapterPresentation] Invalid initialIndex:', initialIndex, 'chapters length:', chapters.length)
      // Si l'index est invalide, utiliser 0
      setCurrentIndex(0)
    }
  }, [initialIndex, chapters.length])

  // Valeurs par défaut pour les tailles
  const defaultTitleSize = 100 // %
  const defaultTextSize = 100 // %

  // Récupérer les tailles sauvegardées ou utiliser les valeurs par défaut
  const titleSize = settings?.layout_preferences?.presentationTitleSize ?? defaultTitleSize
  const textSize = settings?.layout_preferences?.presentationTextSize ?? defaultTextSize

  const currentChapter = chapters[currentIndex]
  
  console.log('[ChapterPresentation] Render - currentIndex:', currentIndex, 'initialIndex:', initialIndex, 'chapters.length:', chapters.length, 'currentChapter:', currentChapter?.title)

  const handleTitleSizeChange = (value: number) => {
    // Mise à jour immédiate
    setTitleSizeLocal(value)
    // Sauvegarder en arrière-plan
    updateLayoutPreferences({ presentationTitleSize: value }).catch(console.error)
  }

  const handleTextSizeChange = (value: number) => {
    // Mise à jour immédiate
    setTextSizeLocal(value)
    // Sauvegarder en arrière-plan
    updateLayoutPreferences({ presentationTextSize: value }).catch(console.error)
  }

  // États locaux pour une mise à jour immédiate
  const [titleSizeLocal, setTitleSizeLocal] = useState(titleSize)
  const [textSizeLocal, setTextSizeLocal] = useState(textSize)

  // Synchroniser avec les settings quand ils changent
  useEffect(() => {
    if (settings?.layout_preferences?.presentationTitleSize) {
      setTitleSizeLocal(settings.layout_preferences.presentationTitleSize)
    }
    if (settings?.layout_preferences?.presentationTextSize) {
      setTextSizeLocal(settings.layout_preferences.presentationTextSize)
    }
  }, [settings])

  // Appliquer les styles directement au DOM
  useEffect(() => {
    const applyStyles = () => {
      console.log('Applying styles - titleSize:', titleSizeLocal, 'textSize:', textSizeLocal)
      
      // Appliquer la taille du texte avec transform scale
      const proseMirror = document.querySelector('.chapter-presentation-content .ProseMirror') as HTMLElement
      if (proseMirror) {
        const zoomFactor = textSizeLocal / 100
        console.log('Applying text zoom factor:', zoomFactor)
        proseMirror.style.setProperty('transform', `scale(${zoomFactor})`, 'important')
        proseMirror.style.setProperty('transform-origin', 'top left', 'important')
        // Forcer le texte en bleu foncé
        proseMirror.style.setProperty('color', '#1e40af', 'important')
        // S'assurer que tous les éléments de texte sont en bleu (sauf les liens qui restent bleus)
        const textElements = proseMirror.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, div, strong, em, b, i, u, code, pre, blockquote')
        textElements.forEach((el: any) => {
          if (el.style) {
            const currentColor = el.style.color || window.getComputedStyle(el).color
            // Si le texte est blanc ou très clair, le mettre en bleu
            if (currentColor === 'rgb(255, 255, 255)' || currentColor === 'white' || currentColor === '#ffffff' || currentColor === '#fff') {
              el.style.setProperty('color', '#1e40af', 'important')
            } else if (!currentColor || currentColor === 'rgb(0, 0, 0)' || currentColor === 'black' || currentColor === '#000000' || currentColor === '#000') {
              // Si c'est noir, le mettre en bleu foncé
              el.style.setProperty('color', '#1e40af', 'important')
            } else {
              // Sinon, garder la couleur mais s'assurer qu'elle n'est pas blanche
              el.style.setProperty('color', '#1e40af', 'important')
            }
          }
        })
        // Les liens en bleu plus clair
        const linkElements = proseMirror.querySelectorAll('a')
        linkElements.forEach((el: any) => {
          if (el.style) {
            el.style.setProperty('color', '#2563eb', 'important')
          }
        })
      } else {
        console.warn('ProseMirror element not found')
      }

      // Appliquer la taille du titre - utiliser une taille de base fixe
      const titleEl = document.querySelector('.presentation-title') as HTMLElement
      if (titleEl) {
        // Taille de base responsive (en px)
        const viewportWidth = window.innerWidth
        let baseSize = 24 // mobile
        
        if (viewportWidth >= 1280) baseSize = 60 // xl
        else if (viewportWidth >= 1024) baseSize = 48 // lg  
        else if (viewportWidth >= 768) baseSize = 36 // md
        else if (viewportWidth >= 640) baseSize = 30 // sm
        
        const newSize = (baseSize * titleSizeLocal) / 100
        console.log('Applying title size:', newSize, 'px (base:', baseSize, 'factor:', titleSizeLocal, '%)')
        titleEl.style.setProperty('font-size', `${newSize}px`, 'important')
      } else {
        console.warn('Title element not found')
      }
    }

    // Appliquer immédiatement et avec des délais
    applyStyles()
    const timeouts = [
      setTimeout(applyStyles, 50),
      setTimeout(applyStyles, 200),
      setTimeout(applyStyles, 500)
    ]
    
    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [textSizeLocal, titleSizeLocal, currentIndex])

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (e.shiftKey && moduleBoundaries.length > 1) {
          // Shift + flèche = navigation entre modules
          e.preventDefault()
          goToPreviousModule()
        } else {
          e.preventDefault()
        goToPrevious()
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (e.shiftKey && moduleBoundaries.length > 1) {
          // Shift + flèche = navigation entre modules
          e.preventDefault()
          goToNextModule()
        } else {
          e.preventDefault()
        goToNext()
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, moduleBoundaries])

  // Récupérer les informations des modules pour la navigation
  useEffect(() => {
    const fetchModuleInfo = async () => {
      console.log('[ChapterPresentation] fetchModuleInfo called', { courseId, chaptersLength: chapters.length, chapters: chapters })
      
      // Essayer de récupérer les infos même sans courseId, en utilisant les données des chapitres
      if (chapters.length === 0) {
        console.log('[ChapterPresentation] No chapters, skipping')
        return
      }
      
      // Vérifier si les chapitres contiennent déjà les infos des items/modules
      // (si les chapitres viennent de AdminCourseEdit avec la requête jointe)
      const firstChapter = chapters[0] as any
      if (firstChapter?.items?.modules) {
        console.log('[ChapterPresentation] Chapters already have module info, using it directly')
        // Les chapitres contiennent déjà les infos des modules
        const boundaries: Array<{ startIndex: number; endIndex: number; title: string; position: number }> = []
        let currentModuleId: string | null = null
        let currentModuleTitle = ''
        let currentModulePosition = 0
        let startIndex = 0
        
        chapters.forEach((chapter: any, index) => {
          const module = chapter.items?.modules
          const moduleId = module?.id || null
          
          if (moduleId !== currentModuleId) {
            if (currentModuleId !== null) {
              boundaries.push({
                startIndex,
                endIndex: index - 1,
                title: currentModuleTitle,
                position: currentModulePosition
              })
            }
            currentModuleId = moduleId
            currentModuleTitle = module?.title || 'Module inconnu'
            currentModulePosition = module?.position ?? 999
            startIndex = index
          }
        })
        
        if (currentModuleId !== null) {
          boundaries.push({
            startIndex,
            endIndex: chapters.length - 1,
            title: currentModuleTitle,
            position: currentModulePosition
          })
        }
        
        boundaries.sort((a, b) => a.position - b.position)
        console.log('[ChapterPresentation] Boundaries from chapter data:', boundaries)
        setModuleBoundaries(boundaries)
        
        const currentModule = boundaries.find(b => 
          currentIndex >= b.startIndex && currentIndex <= b.endIndex
        )
        
        if (currentModule) {
          setCurrentModuleInfo({
            title: currentModule.title,
            index: boundaries.indexOf(currentModule)
          })
        }
        return
      }
      
      try {
        // Récupérer tous les items des chapitres pour obtenir leurs modules
        const itemIds = [...new Set(chapters.map(ch => ch.item_id))]
        console.log('[ChapterPresentation] Item IDs:', itemIds)
        
        const { data: itemsData, error } = await supabase
          .from('items')
          .select(`
            id,
            module_id,
            modules (
              id,
              title,
              position
            )
          `)
          .in('id', itemIds)
        
        if (error) {
          console.error('[ChapterPresentation] Error fetching items:', error)
          return
        }
        
        console.log('[ChapterPresentation] Items data:', itemsData)
        
        if (!itemsData || itemsData.length === 0) {
          console.log('[ChapterPresentation] No items data')
          return
        }
        
        // Créer une map item_id -> module
        const itemToModule = new Map<string, any>()
        itemsData.forEach((item: any) => {
          if (item.modules) {
            itemToModule.set(item.id, item.modules)
          }
        })
        
        console.log('[ChapterPresentation] Item to module map:', Array.from(itemToModule.entries()))
        
        // Créer les limites des modules
        const boundaries: Array<{ startIndex: number; endIndex: number; title: string; position: number }> = []
        let currentModuleId: string | null = null
        let currentModuleTitle = ''
        let currentModulePosition = 0
        let startIndex = 0
        
        chapters.forEach((chapter, index) => {
          const module = itemToModule.get(chapter.item_id)
          const moduleId = module?.id || null
          
          if (moduleId !== currentModuleId) {
            // Nouveau module détecté
            if (currentModuleId !== null) {
              // Fermer le module précédent
              boundaries.push({
                startIndex,
                endIndex: index - 1,
                title: currentModuleTitle,
                position: currentModulePosition
              })
            }
            // Commencer un nouveau module
            currentModuleId = moduleId
            currentModuleTitle = module?.title || 'Module inconnu'
            currentModulePosition = module?.position ?? 999
            startIndex = index
          }
        })
        
        // Fermer le dernier module
        if (currentModuleId !== null) {
          boundaries.push({
            startIndex,
            endIndex: chapters.length - 1,
            title: currentModuleTitle,
            position: currentModulePosition
          })
        }
        
        console.log('[ChapterPresentation] Boundaries before sort:', boundaries)
        
        // Trier par position
        boundaries.sort((a, b) => a.position - b.position)
        console.log('[ChapterPresentation] Boundaries after sort:', boundaries)
        console.log('[ChapterPresentation] Number of modules found:', boundaries.length)
        
        setModuleBoundaries(boundaries)
        
        // Déterminer le module actuel
        const currentModule = boundaries.find(b => 
          currentIndex >= b.startIndex && currentIndex <= b.endIndex
        )
        
        if (currentModule) {
          const moduleIndex = boundaries.indexOf(currentModule)
          console.log('[ChapterPresentation] Current module:', currentModule, 'index:', moduleIndex)
          setCurrentModuleInfo({
            title: currentModule.title,
            index: moduleIndex
          })
        } else {
          console.log('[ChapterPresentation] No current module found for index:', currentIndex)
        }
      } catch (error) {
        console.error('[ChapterPresentation] Error fetching module info:', error)
      }
    }
    
    fetchModuleInfo()
  }, [chapters, currentIndex, courseId])

  // Gestion du plein écran natif (pour les futures fonctionnalités)
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Peut être utilisé pour des fonctionnalités futures
      const isFullscreen = !!document.fullscreenElement
      console.log('Fullscreen changed:', isFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? chapters.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === chapters.length - 1 ? 0 : prev + 1))
  }

  const goToPreviousModule = () => {
    if (moduleBoundaries.length === 0) return
    
    const currentModule = moduleBoundaries.find(b => 
      currentIndex >= b.startIndex && currentIndex <= b.endIndex
    )
    
    if (!currentModule) return
    
    const currentModuleIndex = moduleBoundaries.indexOf(currentModule)
    if (currentModuleIndex > 0) {
      // Aller au premier chapitre du module précédent
      const previousModule = moduleBoundaries[currentModuleIndex - 1]
      setCurrentIndex(previousModule.startIndex)
    } else {
      // Aller au dernier module (boucle)
      const lastModule = moduleBoundaries[moduleBoundaries.length - 1]
      setCurrentIndex(lastModule.startIndex)
    }
  }

  const goToNextModule = () => {
    if (moduleBoundaries.length === 0) return
    
    const currentModule = moduleBoundaries.find(b => 
      currentIndex >= b.startIndex && currentIndex <= b.endIndex
    )
    
    if (!currentModule) return
    
    const currentModuleIndex = moduleBoundaries.indexOf(currentModule)
    if (currentModuleIndex < moduleBoundaries.length - 1) {
      // Aller au premier chapitre du module suivant
      const nextModule = moduleBoundaries[currentModuleIndex + 1]
      setCurrentIndex(nextModule.startIndex)
    } else {
      // Aller au premier module (boucle)
      const firstModule = moduleBoundaries[0]
      setCurrentIndex(firstModule.startIndex)
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

  if (!currentChapter) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-white text-gray-900 overflow-hidden">
      {/* Contrôles en haut */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white/95 to-transparent p-2 md:p-3 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
            aria-label="Fermer"
            title="Fermer (Échap)"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-sm font-medium text-gray-900">
            <div>Chapitre {currentIndex + 1} / {chapters.length}</div>
            {currentModuleInfo && (
              <div className="text-xs text-gray-600 mt-0.5">
                Module: {currentModuleInfo.title} ({currentModuleInfo.index + 1} / {moduleBoundaries.length})
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
            aria-label="Paramètres"
            title="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
            aria-label="Plein écran"
            title="Plein écran (F)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Panneau de paramètres */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-20 bg-white rounded-lg p-4 min-w-[280px] border border-gray-300 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Paramètres d'affichage</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-700"
              aria-label="Fermer les paramètres"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Taille du titre */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Taille du titre: <span className="font-bold text-gray-900">{titleSizeLocal}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="1"
                value={titleSizeLocal}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  console.log('Title size changed to:', val)
                  handleTitleSizeChange(val)
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50%</span>
                <span>200%</span>
              </div>
            </div>

            {/* Taille du texte */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Taille du texte: <span className="font-bold text-gray-900">{textSizeLocal}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="1"
                value={textSizeLocal}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  console.log('Text size changed to:', val)
                  handleTextSizeChange(val)
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50%</span>
                <span>200%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div 
        className="h-full flex items-center justify-center pt-20 pb-2 px-4 md:px-6 lg:px-8 overflow-y-auto"
        style={{
          '--title-size': `${titleSizeLocal}%`,
          '--text-size': `${textSizeLocal}%`
        } as React.CSSProperties & { '--title-size': string; '--text-size': string }}
      >
        <div className="w-full max-w-[96%] sm:max-w-[94%] lg:max-w-[92%] xl:max-w-[88%] mx-auto h-full flex flex-col justify-center py-2">
          <h1 
            className="font-extrabold mb-6 md:mb-8 text-center flex-shrink-0 px-2 break-words hyphens-auto presentation-title"
            style={{ 
              fontSize: `calc(${titleSizeLocal}% * clamp(1.5rem, 4vw, 3.75rem))`,
              '--title-size': `${titleSizeLocal}%`,
              color: '#1f2937',
              textShadow: 'none'
            } as React.CSSProperties & { '--title-size': string }}
            key={`chapter-title-${currentIndex}`}
          >
            {currentChapter.title}
          </h1>
          <div className="bg-gray-50 rounded-lg p-6 md:p-8 lg:p-10 flex-1 min-h-0 overflow-y-auto shadow-lg border border-gray-200">
            {currentChapter.content ? (
              <div 
                className="chapter-presentation-content prose max-w-none presentation-text"
                style={{ 
                  fontSize: `var(--text-size)`,
                  color: '#1f2937'
                }}
                key={`chapter-content-${currentIndex}`}
              >
                <style>{`
                  .chapter-presentation-content .ProseMirror,
                  .chapter-presentation-content .ProseMirror * {
                    color: #1e40af !important;
                  }
                  .chapter-presentation-content .ProseMirror p,
                  .chapter-presentation-content .ProseMirror h1,
                  .chapter-presentation-content .ProseMirror h2,
                  .chapter-presentation-content .ProseMirror h3,
                  .chapter-presentation-content .ProseMirror h4,
                  .chapter-presentation-content .ProseMirror h5,
                  .chapter-presentation-content .ProseMirror h6,
                  .chapter-presentation-content .ProseMirror li,
                  .chapter-presentation-content .ProseMirror span,
                  .chapter-presentation-content .ProseMirror div,
                  .chapter-presentation-content .ProseMirror strong,
                  .chapter-presentation-content .ProseMirror em,
                  .chapter-presentation-content .ProseMirror b,
                  .chapter-presentation-content .ProseMirror i,
                  .chapter-presentation-content .ProseMirror u,
                  .chapter-presentation-content .ProseMirror code,
                  .chapter-presentation-content .ProseMirror pre,
                  .chapter-presentation-content .ProseMirror blockquote,
                  .chapter-presentation-content .ProseMirror td,
                  .chapter-presentation-content .ProseMirror th {
                    color: #1e40af !important;
                  }
                  .chapter-presentation-content .ProseMirror a {
                    color: #2563eb !important;
                  }
                  /* Forcer tous les textes blancs en bleu */
                  .chapter-presentation-content .ProseMirror *[style*="color: white"],
                  .chapter-presentation-content .ProseMirror *[style*="color: #fff"],
                  .chapter-presentation-content .ProseMirror *[style*="color: #ffffff"],
                  .chapter-presentation-content .ProseMirror *[style*="color: rgb(255, 255, 255)"] {
                    color: #1e40af !important;
                  }
                `}</style>
                <RichTextEditor
                  key={`chapter-editor-${currentIndex}-${currentChapter.id}`}
                  content={currentChapter.content}
                  onChange={() => {}}
                  editable={false}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 italic text-center text-lg md:text-xl lg:text-2xl">
                Ce chapitre n'a pas encore de contenu.
              </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation - Flèches modernes et centrées */}
      {chapters.length > 1 && (
        <>
          {/* Navigation chapitres - Flèches plus grandes et plus visibles */}
          <button
            onClick={goToPrevious}
            className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 group pointer-events-auto"
            aria-label="Chapitre précédent"
            title="Chapitre précédent (← ou ↑)"
          >
            <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-600 border-4 border-blue-700 hover:bg-blue-700 hover:border-blue-800 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:scale-110 active:scale-100 backdrop-blur-sm">
              <ChevronLeft className="w-12 h-12 md:w-14 md:h-14 text-white drop-shadow-lg group-hover:translate-x-[-2px] transition-transform duration-300" strokeWidth={3} />
            </div>
          </button>
          <button
            onClick={goToNext}
            className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 group pointer-events-auto"
            aria-label="Chapitre suivant"
            title="Chapitre suivant (→ ou ↓)"
          >
            <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-600 border-4 border-blue-700 hover:bg-blue-700 hover:border-blue-800 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:scale-110 active:scale-100 backdrop-blur-sm">
              <ChevronRight className="w-12 h-12 md:w-14 md:h-14 text-white drop-shadow-lg group-hover:translate-x-[2px] transition-transform duration-300" strokeWidth={3} />
            </div>
          </button>
          
          {/* Navigation modules (si plusieurs modules) - Flèches doubles plus visibles */}
          {(() => {
            console.log('[ChapterPresentation] Rendering navigation - moduleBoundaries.length:', moduleBoundaries.length)
            return moduleBoundaries.length > 1 ? (
              <>
                <button
                  onClick={goToPreviousModule}
                  className="fixed left-4 md:left-6 top-1/2 z-30 group pointer-events-auto"
                  style={{ transform: 'translateY(calc(-50% + 120px))' }}
                  aria-label="Module précédent"
                  title="Module précédent (Shift + ← ou ↑)"
                >
                  <div className="flex items-center justify-center w-18 h-18 md:w-20 md:h-20 rounded-full bg-purple-600 border-4 border-purple-700 hover:bg-purple-700 hover:border-purple-800 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-110 active:scale-100 backdrop-blur-sm" style={{ width: '4.5rem', height: '4.5rem' }}>
                    <ChevronsLeft className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg group-hover:translate-x-[-2px] transition-transform duration-300" strokeWidth={3} />
                  </div>
                </button>
                <button
                  onClick={goToNextModule}
                  className="fixed right-4 md:right-6 top-1/2 z-30 group pointer-events-auto"
                  style={{ transform: 'translateY(calc(-50% + 120px))' }}
                  aria-label="Module suivant"
                  title="Module suivant (Shift + → ou ↓)"
                >
                  <div className="flex items-center justify-center rounded-full bg-purple-600 border-4 border-purple-700 hover:bg-purple-700 hover:border-purple-800 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-110 active:scale-100 backdrop-blur-sm" style={{ width: '4.5rem', height: '4.5rem' }}>
                    <ChevronsRight className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg group-hover:translate-x-[2px] transition-transform duration-300" strokeWidth={3} />
                  </div>
                </button>
              </>
            ) : null
          })()}
        </>
      )}

      {/* Indicateurs en bas */}
      {chapters.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white/95 to-transparent p-2 md:p-3 border-t border-gray-200">
          <div className="flex justify-center space-x-2">
            {chapters.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Aller au chapitre ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10 text-xs text-gray-600 hidden md:block bg-white/90 px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div>← → Chapitres</div>
          {moduleBoundaries.length > 1 && (
            <div>Shift + ← → Modules</div>
          )}
          <div>F Plein écran</div>
          <div>Échap Quitter</div>
        </div>
      </div>
    </div>
  )
}

