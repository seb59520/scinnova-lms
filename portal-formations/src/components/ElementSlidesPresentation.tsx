import { useEffect, useState } from 'react'
import { Chapter } from '../types/database'
import { RichTextEditor } from './RichTextEditor'
import { useUserSettings } from '../hooks/useUserSettings'
import { X, ChevronLeft, ChevronRight, Maximize2, Settings } from 'lucide-react'
import { extractSlideElements, getSlideTitle, SlideElement } from '../utils/tipTapSlides'

interface ElementSlidesPresentationProps {
  chapters: Chapter[]
  initialChapterIndex: number
  onClose: () => void
}

export function ElementSlidesPresentation({ 
  chapters, 
  initialChapterIndex, 
  onClose 
}: ElementSlidesPresentationProps) {
  const [slides, setSlides] = useState<SlideElement[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { settings, updateLayoutPreferences } = useUserSettings()

  // Valeurs par défaut pour les tailles
  const defaultTitleSize = 100 // %
  const defaultTextSize = 100 // %

  // Récupérer les tailles sauvegardées ou utiliser les valeurs par défaut
  const titleSize = settings?.layout_preferences?.presentationTitleSize ?? defaultTitleSize
  const textSize = settings?.layout_preferences?.presentationTextSize ?? defaultTextSize

  // États locaux pour une mise à jour immédiate
  const [titleSizeLocal, setTitleSizeLocal] = useState(titleSize)
  const [textSizeLocal, setTextSizeLocal] = useState(textSize)

  // Extraire les slides au chargement
  useEffect(() => {
    console.log('Extracting slides from chapters:', chapters)
    const extractedSlides = extractSlideElements(chapters)
    console.log('Extracted slides:', extractedSlides.length, extractedSlides)
    setSlides(extractedSlides)
    
    // Trouver la première slide du chapitre initial
    if (extractedSlides.length > 0 && initialChapterIndex >= 0) {
      const firstSlideOfChapter = extractedSlides.findIndex(
        slide => slide.chapterIndex === initialChapterIndex
      )
      if (firstSlideOfChapter >= 0) {
        setCurrentSlideIndex(firstSlideOfChapter)
      }
    }
  }, [chapters, initialChapterIndex])

  // Synchroniser avec les settings quand ils changent
  useEffect(() => {
    if (settings?.layout_preferences?.presentationTitleSize) {
      setTitleSizeLocal(settings.layout_preferences.presentationTitleSize)
    }
    if (settings?.layout_preferences?.presentationTextSize) {
      setTextSizeLocal(settings.layout_preferences.presentationTextSize)
    }
  }, [settings])

  const handleTitleSizeChange = (value: number) => {
    setTitleSizeLocal(value)
    updateLayoutPreferences({ presentationTitleSize: value }).catch(console.error)
  }

  const handleTextSizeChange = (value: number) => {
    setTextSizeLocal(value)
    updateLayoutPreferences({ presentationTextSize: value }).catch(console.error)
  }

  // Appliquer les styles directement au DOM
  useEffect(() => {
    const applyStyles = () => {
      const proseMirror = document.querySelector('.element-slide-content .ProseMirror') as HTMLElement
      if (proseMirror) {
        const zoomFactor = textSizeLocal / 100
        proseMirror.style.setProperty('transform', `scale(${zoomFactor})`, 'important')
        proseMirror.style.setProperty('transform-origin', 'top left', 'important')
      }

      const titleEl = document.querySelector('.element-slide-title') as HTMLElement
      if (titleEl) {
        const viewportWidth = window.innerWidth
        let baseSize = 24
        
        if (viewportWidth >= 1280) baseSize = 60
        else if (viewportWidth >= 1024) baseSize = 48
        else if (viewportWidth >= 768) baseSize = 36
        else if (viewportWidth >= 640) baseSize = 30
        
        const newSize = (baseSize * titleSizeLocal) / 100
        titleEl.style.setProperty('font-size', `${newSize}px`, 'important')
      }
    }

    applyStyles()
    const timeouts = [
      setTimeout(applyStyles, 50),
      setTimeout(applyStyles, 200),
      setTimeout(applyStyles, 500)
    ]
    
    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [textSizeLocal, titleSizeLocal, currentSlideIndex])

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevious()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNext()
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlideIndex, slides.length])

  // Gestion du plein écran natif
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const goToPrevious = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentSlideIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

  const currentSlide = slides[currentSlideIndex]
  const slideTitle = currentSlide ? getSlideTitle(currentSlide) : null
  
  // Debug: afficher les informations de la slide (doit être avant les returns)
  useEffect(() => {
    if (currentSlide) {
      console.log('Current slide:', {
        index: currentSlideIndex,
        type: currentSlide.type,
        hasContent: !!currentSlide.content,
        contentStructure: currentSlide.content,
        slideTitle
      })
    }
  }, [currentSlideIndex, currentSlide, slideTitle])

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Aucun élément à afficher</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  if (!currentSlide) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden">
      {/* Contrôles en haut */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-2 md:p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Fermer"
            title="Fermer (Échap)"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-sm font-medium">
            <div>Slide {currentSlideIndex + 1} / {slides.length}</div>
            <div className="text-xs text-white/70">{currentSlide.chapterTitle}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Paramètres"
            title="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Plein écran"
            title="Plein écran (F)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Panneau de paramètres */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-20 bg-black/90 backdrop-blur-sm rounded-lg p-4 min-w-[280px] border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Paramètres d'affichage</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Fermer les paramètres"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">
                Taille du titre: <span className="font-bold text-white">{titleSizeLocal}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="1"
                value={titleSizeLocal}
                onChange={(e) => handleTitleSizeChange(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>50%</span>
                <span>200%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">
                Taille du texte: <span className="font-bold text-white">{textSizeLocal}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="1"
                value={textSizeLocal}
                onChange={(e) => handleTextSizeChange(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
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
      >
        <div className="w-full max-w-[96%] sm:max-w-[94%] lg:max-w-[92%] xl:max-w-[88%] mx-auto h-full flex flex-col justify-center py-2">
          {/* Afficher le titre seulement si c'est un heading ou si on a extrait un titre */}
          {slideTitle && currentSlide.type === 'heading' && (
            <h1 
              className="font-extrabold mb-4 md:mb-5 text-center chapter-title-highlight flex-shrink-0 px-2 break-words hyphens-auto element-slide-title"
            >
              {slideTitle}
            </h1>
          )}
          {/* Afficher le titre du chapitre en petit si ce n'est pas un heading */}
          {currentSlide.type !== 'heading' && (
            <div className="text-sm text-white/60 text-center mb-2">
              {currentSlide.chapterTitle}
            </div>
          )}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-5 lg:p-6 flex-1 min-h-0 overflow-y-auto flex items-center justify-center">
            {currentSlide.content ? (
              <div 
                className="element-slide-content prose prose-invert max-w-none presentation-text w-full"
                style={{ color: 'white' }}
              >
                {(() => {
                  // Vérifier que le contenu est valide
                  if (!currentSlide.content || !currentSlide.content.type) {
                    console.error('Invalid slide content:', currentSlide.content)
                    return (
                      <p className="text-red-400 text-center">
                        Erreur: contenu invalide pour cette slide
                      </p>
                    )
                  }
                  
                  // Vérifier que le contenu a bien un contenu array
                  if (!currentSlide.content.content || !Array.isArray(currentSlide.content.content)) {
                    console.error('Invalid slide content structure:', currentSlide.content)
                    return (
                      <p className="text-red-400 text-center">
                        Erreur: structure de contenu invalide
                      </p>
                    )
                  }
                  
                  // Vérifier que le contenu array n'est pas vide
                  if (currentSlide.content.content.length === 0) {
                    console.warn('Empty content array for slide:', currentSlide)
                    return (
                      <p className="text-yellow-400 text-center">
                        Avertissement: cette slide a un contenu vide
                      </p>
                    )
                  }
                  
                  console.log('Rendering RichTextEditor with content:', currentSlide.content)
                  
                  return (
                    <div className="w-full" style={{ color: 'white' }}>
                      <RichTextEditor
                        content={currentSlide.content}
                        onChange={() => {}}
                        editable={false}
                      />
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 italic text-center text-lg md:text-xl lg:text-2xl">
                  Cette slide n'a pas de contenu.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation - Flèches */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="fixed left-6 md:left-8 top-1/2 -translate-y-1/2 z-30 group pointer-events-auto"
            aria-label="Slide précédente"
            title="Précédent (← ou ↑)"
          >
            <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 backdrop-blur-lg border-2 border-white/30 hover:bg-white/25 hover:border-white/50 transition-all duration-300 shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95">
              <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 text-white group-hover:text-blue-300 transition-colors duration-300 drop-shadow-lg" />
            </div>
          </button>
          <button
            onClick={goToNext}
            className="fixed right-6 md:right-8 top-1/2 -translate-y-1/2 z-30 group pointer-events-auto"
            aria-label="Slide suivante"
            title="Suivant (→ ou ↓)"
          >
            <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 backdrop-blur-lg border-2 border-white/30 hover:bg-white/25 hover:border-white/50 transition-all duration-300 shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95">
              <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white group-hover:text-blue-300 transition-colors duration-300 drop-shadow-lg" />
            </div>
          </button>
        </>
      )}

      {/* Indicateurs en bas */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-2 md:p-3">
          <div className="flex justify-center space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlideIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlideIndex
                    ? 'bg-white w-8'
                    : 'bg-white/40 w-2 hover:bg-white/60'
                }`}
                aria-label={`Aller à la slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10 text-xs text-white/60 hidden md:block">
        <div className="space-y-1">
          <div>← → Navigation</div>
          <div>F Plein écran</div>
          <div>Échap Quitter</div>
        </div>
      </div>
    </div>
  )
}

