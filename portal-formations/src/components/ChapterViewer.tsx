import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Chapter } from '../types/database'
import { RichTextEditor } from './RichTextEditor'
import { ChevronDown, ChevronUp, Presentation, RefreshCw, ChevronsDownUp, Gamepad2 } from 'lucide-react'
import { GameRenderer } from './GameRenderer'
import { useAuth } from '../hooks/useAuth'
import { useGammaPresentation } from '../hooks/useGammaPresentation'

interface ChapterViewerProps {
  itemId: string
}

export function ChapterViewer({ itemId }: ChapterViewerProps) {
  const { profile } = useAuth()
  const { openGammaPresentation } = useGammaPresentation()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [hasInitialized, setHasInitialized] = useState(false)
  const [courseId, setCourseId] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchChapters()
  }, [itemId])

  // Rafraîchir les chapitres toutes les 3 secondes pour détecter les nouveaux chapitres
  useEffect(() => {
    if (!itemId) return
    
    const interval = setInterval(() => {
      fetchChapters()
    }, 3000)

    return () => clearInterval(interval)
  }, [itemId])

  const fetchChapters = async () => {
    if (!itemId) {
      setLoading(false)
      return
    }
    
    try {
      console.log('=== ChapterViewer: Fetching chapters ===')
      console.log('Item ID:', itemId)
      
      // D'abord récupérer l'item pour obtenir le courseId
      const { data: itemData } = await supabase
        .from('items')
        .select(`
          id,
          module_id,
          modules (
            id,
            course_id
          )
        `)
        .eq('id', itemId)
        .single()
      
      if (itemData?.modules?.course_id) {
        const currentCourseId = itemData.modules.course_id
        setCourseId(currentCourseId)
        
        // Récupérer tous les modules du cours
        const { data: modulesData } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', currentCourseId)
        
        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map(m => m.id)
          
          // Récupérer tous les items de ces modules
          const { data: allItemsData } = await supabase
            .from('items')
            .select('id')
            .in('module_id', moduleIds)
          
          if (allItemsData && allItemsData.length > 0) {
            const allItemIds = allItemsData.map(i => i.id)
            // Note: On récupère les chapitres mais on ne les utilise pas ici
            // C'était pour la navigation entre modules, mais maintenant on utilise une nouvelle fenêtre
            await supabase
              .from('chapters')
              .select(`
                *,
                items (
                  id,
                  module_id,
                  modules (
                    id,
                    title,
                    position
                  )
                )
              `)
              .in('item_id', allItemIds)
              .order('position', { ascending: true })
          }
        }
      }
      
      // Construire la requête - ne pas filtrer sur published si la colonne n'existe pas
      let chaptersQuery = supabase
        .from('chapters')
        .select('*')
        .eq('item_id', itemId)
      
      // Filtrer les chapitres non publiés sauf pour les admins
      // Note: On essaie de filtrer sur published, mais si la colonne n'existe pas,
      // on ignore l'erreur et on récupère tous les chapitres
      if (profile?.role !== 'admin') {
        // On essaie de filtrer, mais on gérera l'erreur si la colonne n'existe pas
        chaptersQuery = chaptersQuery.eq('published', true)
      }
      
      let data: any = null
      let error: any = null
      
      try {
        const result = await chaptersQuery.order('position', { ascending: true })
        data = result.data
        error = result.error
      } catch (err: any) {
        error = err
      }
      
      // Si l'erreur est due à la colonne published manquante, réessayer sans filtre
      if (error && (error.code === '42703' || error.message?.includes('published'))) {
        console.warn('Colonne published non disponible, récupération de tous les chapitres')
        const retryResult = await supabase
          .from('chapters')
          .select('*')
          .eq('item_id', itemId)
          .order('position', { ascending: true })
        
        if (retryResult.error) {
          error = retryResult.error
        } else {
          // Filtrer côté client si nécessaire (pour les non-admins)
          // Si published n'existe pas, on considère tous les chapitres comme publiés
          data = retryResult.data || []
          error = null
        }
      }

      console.log('ChapterViewer query result:')
      console.log('  - Data:', data)
      console.log('  - Data length:', data?.length || 0)
      console.log('  - Error:', error)
      console.log('  - Error code:', error?.code)
      console.log('  - Error message:', error?.message)

      if (error) {
        console.error('❌ ChapterViewer: Error fetching chapters:', error)
        if (error.code === 'PGRST301' || error.message?.includes('permission')) {
          console.error('⚠️ Problème de permissions RLS détecté dans ChapterViewer!')
        }
        throw error
      }
      
      const fetchedChapters = data || []
      
      // Debug: vérifier les données récupérées
      console.log('=== Chapters fetched ===')
      console.log('Total chapters:', fetchedChapters.length)
      fetchedChapters.forEach((ch: any, idx: number) => {
        console.log(`Chapter ${idx + 1}:`, {
          id: ch.id,
          title: ch.title,
          type: ch.type,
          position: ch.position,
          hasContent: !!ch.content,
          hasGameContent: !!ch.game_content,
          gameContentType: typeof ch.game_content,
          gameContent: ch.game_content
        })
        if (ch.type === 'game') {
          console.log(`  → GAME CHAPTER "${ch.title}":`, {
            game_content: ch.game_content,
            gameType: ch.game_content?.gameType,
            hasLevels: !!ch.game_content?.levels,
            levelsCount: ch.game_content?.levels?.length || 0
          })
        }
      })
      console.log('=======================')
      
      // Détecter les nouveaux chapitres et préserver l'état d'expansion existant
      setChapters(prevChapters => {
        const prevIds = new Set(prevChapters.map((ch: Chapter) => ch.id))
        const newChapters = fetchedChapters.filter((ch: Chapter) => !prevIds.has(ch.id))
        
        // Ouvrir automatiquement uniquement les nouveaux chapitres
        if (newChapters.length > 0) {
          setExpandedChapters(prev => new Set([...prev, ...newChapters.map((ch: Chapter) => ch.id)]))
        }
        
        return fetchedChapters
      })
      
      // Ouvrir tous les chapitres par défaut UNIQUEMENT au premier chargement
      if (!hasInitialized && fetchedChapters.length > 0) {
        setExpandedChapters(new Set(fetchedChapters.map((ch: Chapter) => ch.id)))
        setHasInitialized(true)
      }
    } catch (error) {
      console.error('Error fetching chapters:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId)
    } else {
      newExpanded.add(chapterId)
    }
    setExpandedChapters(newExpanded)
  }

  const toggleAllChapters = () => {
    if (expandedChapters.size === chapters.length) {
      // Tout plier
      setExpandedChapters(new Set())
    } else {
      // Tout déplier
      setExpandedChapters(new Set(chapters.map(ch => ch.id)))
    }
  }

  const openPresentation = async () => {
    try {
      // D'abord, vérifier si l'élément actuel a une présentation Gamma
      if (itemId) {
        const { data: currentItem } = await supabase
          .from('items')
          .select('asset_path')
          .eq('id', itemId)
          .single()

        // Si l'élément a une présentation Gamma (URL commençant par https://), l'ouvrir en mode présentation intégré
        if (currentItem?.asset_path && currentItem.asset_path.startsWith('https://')) {
          // Récupérer aussi les URLs PDF/PPTX si disponibles
          const { data: itemWithUrls } = await supabase
            .from('items')
            .select('asset_path, pdf_url, pptx_url')
            .eq('id', itemId)
            .single()
          
          openGammaPresentation({
            gammaUrl: itemWithUrls?.asset_path || currentItem.asset_path,
            pdfUrl: (itemWithUrls as any)?.pdf_url,
            pptxUrl: (itemWithUrls as any)?.pptx_url,
          })
          return
        }
      }

      // Récupérer le courseId depuis l'item si pas déjà chargé
      let finalCourseId = courseId
      
      if (!finalCourseId) {
        const { data: itemData } = await supabase
          .from('items')
          .select(`
            id,
            module_id,
            modules (
              id,
              course_id
            )
          `)
          .eq('id', itemId)
          .single()
        
        if (itemData?.modules?.course_id) {
          finalCourseId = itemData.modules.course_id
        } else {
          alert('Impossible de récupérer l\'ID du cours.')
          return
        }
      }

      // Vérifier s'il existe une présentation Gamma pour ce cours
      const { data: itemsWithGamma } = await supabase
        .from('items')
        .select(`
          id,
          asset_path,
          modules!inner(course_id)
        `)
        .eq('modules.course_id', finalCourseId)
        .not('asset_path', 'is', null)
        .like('asset_path', 'https://%')
        .limit(1)
        .single()

      // Si une présentation Gamma existe, l'ouvrir en mode présentation intégré
      if (itemsWithGamma?.asset_path) {
        openGammaPresentation({
          gammaUrl: itemsWithGamma.asset_path,
          pdfUrl: (itemsWithGamma as any).pdf_url,
          pptxUrl: (itemsWithGamma as any).pptx_url,
        })
        return
      }
      
      // Sinon, utiliser le comportement par défaut (présentation des chapitres)
      const presentationUrl = `${window.location.origin}/presentation/${finalCourseId}`
      const presentationWindow = window.open(
        presentationUrl,
        'presentation',
        'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
      )
      
      if (!presentationWindow) {
        alert('Veuillez autoriser les popups pour ouvrir la présentation dans une nouvelle fenêtre.')
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la présentation:', error)
      // Fallback vers le comportement par défaut en cas d'erreur
      if (courseId) {
        const presentationUrl = `${window.location.origin}/presentation/${courseId}`
        window.open(
          presentationUrl,
          'presentation',
          'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
        )
      }
    }
  }

  if (loading) {
    return <div className="text-gray-500">Chargement des chapitres...</div>
  }

  if (chapters.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Chapitres</h2>
            <button
              onClick={() => {
                setLoading(true)
                fetchChapters()
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Rafraîchir les chapitres"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {chapters.length > 0 && (
              <span className="text-sm text-gray-500">
                ({chapters.length} {chapters.length === 1 ? 'chapitre' : 'chapitres'})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {chapters.length > 0 && (
              <button
                onClick={toggleAllChapters}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title={expandedChapters.size === chapters.length ? 'Tout plier' : 'Tout déplier'}
              >
                <ChevronsDownUp className="w-4 h-4" />
                <span>{expandedChapters.size === chapters.length ? 'Tout plier' : 'Tout déplier'}</span>
              </button>
            )}
            {chapters.length > 0 && (
              <button
                onClick={openPresentation}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Mode présentation (plein écran)"
              >
                <Presentation className="w-5 h-5" />
                <span>Présentation</span>
              </button>
            )}
          </div>
        </div>
        <div className="space-y-3">
        {chapters.map((chapter, index) => {
          // Détecter un jeu si type === 'game' OU si game_content existe
          const isGame = chapter.type === 'game' || (!!chapter.game_content && typeof chapter.game_content === 'object')
          const chapterNumber = chapters.filter((c, i) => i < index && c.type !== 'game').length + 1

          return (
            <div
              key={chapter.id}
              id={`chapter-${index}`}
              className={`border rounded-lg shadow-sm ${
                isGame 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="flex-1 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg -m-2 p-2"
                >
                  <div className="flex items-center space-x-3">
                    {isGame ? (
                      <>
                        <Gamepad2 className="w-5 h-5 text-red-600" />
                        <h3 className="text-lg font-semibold text-red-900">{chapter.title}</h3>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-gray-500">#{chapterNumber}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{chapter.title}</h3>
                      </>
                    )}
                  </div>
                  <div className="flex items-center">
                    {expandedChapters.has(chapter.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>
                {!isGame && (
                  <button
                    onClick={openPresentation}
                    className="ml-2 p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                    title="Ouvrir en mode présentation"
                  >
                    <Presentation className="w-4 h-4" />
                  </button>
                )}
              </div>

              {expandedChapters.has(chapter.id) && (
                <div className="px-6 lg:px-8 pb-6 lg:pb-8 border-t border-gray-200">
                  <div className="pt-6">
                    {(() => {
                      if (isGame) {
                        // Debug: vérifier la structure de game_content avant de le passer au GameRenderer
                        if (process.env.NODE_ENV === 'development') {
                          console.log('[ChapterViewer] Rendering game chapter:', {
                            chapterId: chapter.id,
                            chapterTitle: chapter.title,
                            gameContentType: typeof chapter.game_content,
                            gameContent: chapter.game_content,
                            hasGameType: !!chapter.game_content?.gameType,
                            gameType: chapter.game_content?.gameType,
                            hasLeftColumn: !!chapter.game_content?.leftColumn,
                            leftColumnType: typeof chapter.game_content?.leftColumn,
                            leftColumnIsArray: Array.isArray(chapter.game_content?.leftColumn),
                            hasRightColumn: !!chapter.game_content?.rightColumn,
                            rightColumnType: typeof chapter.game_content?.rightColumn,
                            rightColumnIsArray: Array.isArray(chapter.game_content?.rightColumn),
                            hasCorrectMatches: !!chapter.game_content?.correctMatches,
                            correctMatchesType: typeof chapter.game_content?.correctMatches,
                            correctMatchesIsArray: Array.isArray(chapter.game_content?.correctMatches),
                            allKeys: chapter.game_content ? Object.keys(chapter.game_content) : []
                          })
                        }
                        
                        // Utiliser GameRenderer pour rendre n'importe quel jeu enregistré
                        return (
                          <GameRenderer
                            gameContent={chapter.game_content}
                            onScore={(score, metadata) => {
                              console.log('Game score:', score, metadata)
                              // TODO: Sauvegarder le score si nécessaire
                            }}
                          />
                        )
                      } else if (chapter.content) {
                        // Support pour content.text (texte simple) ou content (objet RichText)
                        if (chapter.content.text) {
                          return (
                            <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                              {chapter.content.text}
                            </div>
                          )
                        } else if (typeof chapter.content === 'string') {
                          return (
                            <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                              {chapter.content}
                            </div>
                          )
                        } else {
                          return (
                            <RichTextEditor
                              content={chapter.content}
                              onChange={() => {}} // Lecture seule
                              editable={false}
                            />
                          )
                        }
                      } else {
                        return (
                          <p className="text-gray-500 italic">Ce chapitre n'a pas encore de contenu.</p>
                        )
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>
    </>
  )
}

