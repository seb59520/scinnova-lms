import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Course } from '../../types/database'
import { Save, Upload, Download, Code, Eye, Sparkles } from 'lucide-react'
import { ReactRenderer } from '../../components/ReactRenderer'
import { CourseJson } from '../../types/courseJson'
import { generateAndUploadSlide } from '../../lib/slideGenerator'
import { generateSlideWithExternalAPI } from '../../lib/slideGeneratorAdvanced'

export function AdminCourseEditJson() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  // isNew est true si courseId est 'new', undefined, ou null
  const isNew = !courseId || courseId === 'new'

  const [, setCourse] = useState<Course | null>(null)
  const [jsonContent, setJsonContent] = useState<string>('')
  const [parsedJson, setParsedJson] = useState<CourseJson | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [previewMode, setPreviewMode] = useState(false)
  const [generatingSlides, setGeneratingSlides] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [useAdvancedGeneration, setUseAdvancedGeneration] = useState(false)

  useEffect(() => {
    if (!isNew && courseId) {
      fetchCourse()
    } else {
      // Template JSON par défaut
      const defaultJson: CourseJson = {
        title: 'Nouveau cours',
        description: 'Description du cours',
        status: 'draft',
        access_type: 'free',
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#8B5CF6',
          fontFamily: 'Inter'
        },
        modules: [] // Toujours initialiser modules comme un tableau vide
      }
      setJsonContent(JSON.stringify(defaultJson, null, 2))
      setParsedJson(defaultJson)
      setLoading(false)
    }
  }, [courseId, isNew])

  const fetchCourse = async () => {
    try {
      // Récupérer le cours
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      // Récupérer les modules avec items
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          items (*)
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true })

      if (modulesError) throw modulesError

      // Récupérer tous les chapitres pour tous les items
      const allItemIds = (modulesData || []).flatMap(m => (m.items || []).map((i: any) => i.id))
      let chaptersMap = new Map<string, any[]>()
      
      if (allItemIds.length > 0) {
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('*')
          .in('item_id', allItemIds)
          .order('position', { ascending: true })

        if (chaptersData) {
          chaptersData.forEach(ch => {
            if (!chaptersMap.has(ch.item_id)) {
              chaptersMap.set(ch.item_id, [])
            }
            chaptersMap.get(ch.item_id)!.push({
              title: ch.title,
              position: ch.position,
              content: ch.content || undefined
            })
          })
        }
      }

      // Construire le JSON
      const courseJson: CourseJson = {
        title: courseData.title,
        description: courseData.description || '',
        status: courseData.status as 'draft' | 'published',
        access_type: courseData.access_type as 'free' | 'paid' | 'invite',
        price_cents: courseData.price_cents || undefined,
        currency: courseData.currency || undefined,
        modules: (modulesData || []).map(module => ({
          title: module.title,
          position: module.position,
          items: (module.items || []).sort((a: any, b: any) => a.position - b.position).map((item: any) => ({
            type: item.type,
            title: item.title,
            position: item.position,
            published: item.published,
            content: item.content || {},
            asset_path: item.asset_path || undefined,
            external_url: item.external_url || undefined,
            chapters: chaptersMap.get(item.id) || undefined
          }))
        }))
      }

      setJsonContent(JSON.stringify(courseJson, null, 2))
      setParsedJson(courseJson)
    } catch (error) {
      console.error('Error fetching course:', error)
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour convertir le format slides en format modules/items
  const convertSlidesFormatToCourseJson = (input: any): CourseJson => {
    // Si c'est déjà au bon format, retourner tel quel
    if (input.modules && Array.isArray(input.modules)) {
      return input as CourseJson
    }

    // Détecter le format avec slides
    const courseData = input.course || input
    const slides = input.slides || courseData.slides || []
    const title = input.title || courseData.title || 'Nouveau cours'
    const description = courseData.description || `Cours sur ${title}`
    
    // Convertir les slides en items
    const items = slides.map((slide: any, index: number) => {
      const content: any = {
        description: slide.objective || slide.title || '',
        summary: slide.on_screen?.join('\n') || '',
        speaker_notes: slide.speaker_notes || ''
      }

      // Ajouter l'activité si présente
      if (slide.activity) {
        content.activity = slide.activity
      }

      // Déterminer le type : 'game' si mini_game existe, sinon 'slide'
      const itemType = slide.mini_game ? 'game' : 'slide'
      
      // Si c'est un jeu, convertir le mini_game en format attendu
      if (slide.mini_game) {
        const miniGame = slide.mini_game
        // Convertir selon le format du jeu
        if (miniGame.format === 'drag_drop' && miniGame.items) {
          // Format pour CardMatchingGame ou ColumnMatchingGame
          if (miniGame.name?.includes('Match') || miniGame.items[0]?.action) {
            // ColumnMatchingGame
            content.leftColumn = miniGame.items.map((it: any) => it.action || it.term || it)
            content.rightColumn = miniGame.items.map((it: any) => it.method || it.definition || it)
            content.correctMatches = miniGame.items.map((_it: any, idx: number) => ({ left: idx, right: idx }))
            content.gameType = 'column-matching'
          } else {
            // CardMatchingGame
            content.pairs = miniGame.items.map((item: any) => ({
              term: item.term || item.left || item.action || '',
              definition: item.definition || item.right || item.method || ''
            }))
            content.gameType = 'matching'
          }
        } else if (miniGame.format === 'multiple_choice' && miniGame.questions) {
          // Format pour ApiTypesGame ou autre jeu à choix multiples
          content.apiTypes = []
          content.scenarios = miniGame.questions.map((q: any) => ({
            question: q.q || q.question || '',
            choices: q.choices || [],
            correctAnswer: q.answer || q.correct || '',
            explanation: q.explanation || ''
          }))
          content.gameType = 'api-types'
        } else if (miniGame.format === 'fill_in_blank' && miniGame.items) {
          // Format pour FormatFilesGame ou autre
          content.levels = [{
            level: 1,
            name: miniGame.name || 'Niveau 1',
            questions: miniGame.items.map((item: any, qIdx: number) => ({
              id: `q-${index}-${qIdx}`,
              type: 'fill-in-blank' as any,
              prompt: item.template || item.prompt || '',
              answer: item.answer || '',
              explanation: item.explanation || '',
              difficulty: 1
            }))
          }]
          content.gameType = 'format-files'
        } else if (miniGame.format === 'checklist' && miniGame.tasks) {
          // Format checklist
          content.levels = [{
            level: 1,
            name: miniGame.name || 'Checklist',
            questions: miniGame.tasks.map((task: string, qIdx: number) => ({
              id: `task-${index}-${qIdx}`,
              type: 'choose-format' as any,
              prompt: task,
              answer: true,
              explanation: '',
              difficulty: 1
            }))
          }]
          content.gameType = 'format-files'
        } else {
          // Format générique - garder tel quel
          content.mini_game = miniGame
          content.gameType = miniGame.gameType || 'matching'
        }
        content.instructions = miniGame.description || content.description
      }

      // Créer des chapitres à partir du contenu de la slide
      const chapters: any[] = []
      
      // Chapitre principal avec le contenu de la slide
      if (slide.on_screen && slide.on_screen.length > 0) {
        chapters.push({
          title: slide.title || `Contenu principal`,
          position: 0,
          type: 'content' as const,
          content: {
            type: 'doc',
            content: [
              {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: slide.objective || slide.title || '' }]
              },
              ...slide.on_screen.map((line: string) => ({
                type: 'paragraph',
                content: [{ type: 'text', text: line }]
              }))
            ]
          },
          published: true
        })
      }

      // Chapitre avec les notes du formateur si présentes
      if (slide.speaker_notes) {
        chapters.push({
          title: 'Notes du formateur',
          position: 1,
          type: 'content' as const,
          content: {
            type: 'doc',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: slide.speaker_notes }]
            }]
          },
          published: true
        })
      }

      return {
        type: itemType as 'slide' | 'game',
        title: slide.title || `Slide ${slide.number || index + 1}`,
        position: slide.number ? slide.number - 1 : index,
        published: true,
        content: content,
        chapters: chapters.length > 0 ? chapters : undefined
      }
    })

    // Créer un module unique contenant tous les slides
    return {
      title: title,
      description: description,
      status: 'draft' as const,
      access_type: 'free' as const,
      modules: [{
        title: 'Contenu du cours',
        position: 0,
        items: items
      }]
    }
  }

  const handleJsonChange = (value: string) => {
    setJsonContent(value)
    try {
      const parsed = JSON.parse(value) as any
      
      // Détecter et convertir le format slides si nécessaire
      const converted = convertSlidesFormatToCourseJson(parsed)
      
      // S'assurer que modules est toujours un tableau
      if (!converted.modules) {
        converted.modules = []
      }
      
      setParsedJson(converted)
      setError('')
    } catch (e) {
      // Ne pas afficher d'erreur pendant la saisie
      if (value.trim() !== '') {
        setError('JSON invalide')
      }
    }
  }

  const handleSave = async () => {
    // Essayer de parser le JSON si ce n'est pas déjà fait
    let jsonToSave = parsedJson
    if (!jsonToSave && jsonContent.trim()) {
      try {
        const parsed = JSON.parse(jsonContent) as any
        // Convertir le format slides si nécessaire
        jsonToSave = convertSlidesFormatToCourseJson(parsed)
        // S'assurer que modules est toujours un tableau
        if (!jsonToSave.modules) {
          jsonToSave.modules = []
        }
        setParsedJson(jsonToSave)
      } catch (e) {
        setError('JSON invalide. Veuillez corriger les erreurs de syntaxe JSON.')
        return
      }
    }

    if (!jsonToSave) {
      setError('JSON invalide. Veuillez fournir un JSON valide.')
      return
    }
    
    // S'assurer que modules est toujours un tableau même si jsonToSave existe
    if (!jsonToSave.modules) {
      jsonToSave.modules = []
    }

    if (!user?.id) {
      setError('Vous devez être connecté pour sauvegarder un cours.')
      return
    }

    // Validation stricte du titre
    if (!jsonToSave.title) {
      setError('Le champ "title" est obligatoire dans le JSON. Veuillez ajouter un titre au cours.')
      return
    }

    const title = jsonToSave.title.trim()
    if (!title) {
      setError('Le champ "title" ne peut pas être vide. Veuillez fournir un titre valide pour le cours.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const courseData = {
        title: title, // Utiliser la version trimée et validée
        description: jsonToSave.description || null,
        status: jsonToSave.status || 'draft',
        access_type: jsonToSave.access_type || 'free',
        price_cents: jsonToSave.price_cents || null,
        currency: jsonToSave.currency || 'EUR',
        is_paid: jsonToSave.access_type === 'paid',
        created_by: user.id,
        updated_at: new Date().toISOString()
      }

      let finalCourseId: string | undefined

      // Créer ou mettre à jour le cours
      if (isNew) {
        // Mode création : insérer un nouveau cours
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single()

        if (error) throw error
        if (!data?.id) {
          throw new Error('Le cours a été créé mais aucun ID n\'a été retourné.')
        }
        finalCourseId = data.id
        navigate(`/admin/courses/${data.id}/json`, { replace: true })
      } else {
        // Mode édition : mettre à jour le cours existant
        if (!courseId) {
          throw new Error('ID du cours manquant. Veuillez recharger la page.')
        }
        
        // Vérifier que le cours existe
        const { data: existingCourse, error: checkError } = await supabase
          .from('courses')
          .select('id')
          .eq('id', courseId)
          .single()

        if (checkError || !existingCourse) {
          throw new Error('Le cours à modifier n\'existe pas. Veuillez recharger la page.')
        }

        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId)

        if (error) throw error
        finalCourseId = courseId
      }

      // Vérifier que finalCourseId est défini avant de continuer
      if (!finalCourseId) {
        throw new Error('ID du cours non défini. Impossible de continuer la sauvegarde.')
      }

      // Supprimer les anciens modules et items
      if (!isNew) {
        const { data: oldModules } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', finalCourseId)

        if (oldModules && oldModules.length > 0) {
          await supabase
            .from('modules')
            .delete()
            .in('id', oldModules.map(m => m.id))
        }
      }

      // Créer les nouveaux modules et items
      for (const module of jsonToSave.modules || []) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .insert({
            course_id: finalCourseId,
            title: module.title,
            position: module.position
          })
          .select()
          .single()

        if (moduleError) throw moduleError
        if (!moduleData?.id) {
          throw new Error(`Le module "${module.title}" a été créé mais aucun ID n'a été retourné.`)
        }

        // Créer les items du module
        if (module.items && module.items.length > 0) {
          // Fonction pour valider et normaliser le type d'item
          const validateItemType = (type: string | undefined | null): 'resource' | 'slide' | 'exercise' | 'activity' | 'tp' | 'game' => {
            if (!type) {
              throw new Error('Le type d\'item est requis.')
            }
            
            const normalizedType = type.toLowerCase().trim()
            
            // Mapping des variantes possibles vers les types valides
            const typeMap: Record<string, 'resource' | 'slide' | 'exercise' | 'activity' | 'tp' | 'game'> = {
              'resource': 'resource',
              'slide': 'slide',
              'slides': 'slide',
              'exercise': 'exercise',
              'exercice': 'exercise',
              'exercises': 'exercise',
              'case': 'exercise', // Étude de cas → exercice
              'case-study': 'exercise',
              'case study': 'exercise',
              'étude de cas': 'exercise',
              'etude de cas': 'exercise',
              'activity': 'activity',
              'activité': 'activity',
              'activite': 'activity',
              'activities': 'activity',
              'activités': 'activity',
              'q/r': 'activity',
              'qr': 'activity',
              'questions-réponses': 'activity',
              'questions-reponses': 'activity',
              'tp': 'tp',
              'travaux-pratiques': 'tp',
              'travaux pratiques': 'tp',
              'game': 'game',
              'jeu': 'game',
              'games': 'game',
              'jeux': 'game'
            }
            
            const validType = typeMap[normalizedType]
            
            if (!validType) {
              throw new Error(`Type d'item invalide: "${type}". Types autorisés: resource, slide, exercise, activity, tp, game`)
            }
            
            return validType
          }

          const itemsData = module.items.map((item, index) => {
            try {
              const validatedType = validateItemType(item.type)
              
              return {
                module_id: moduleData.id,
                type: validatedType,
                title: item.title || `Item ${index + 1}`,
                position: item.position ?? index,
                published: item.published !== false,
                content: item.content || {},
                asset_path: item.asset_path || null,
                external_url: item.external_url || null
              }
            } catch (error: any) {
              throw new Error(`Erreur dans l'item "${item.title || `à la position ${index + 1}`}": ${error.message}`)
            }
          })

          const { data: savedItems, error: itemsError } = await supabase
            .from('items')
            .insert(itemsData)
            .select()

          if (itemsError) throw itemsError
          if (!savedItems || savedItems.length === 0) {
            console.warn(`Aucun item n'a été créé pour le module "${module.title}"`)
            continue
          }

          // Créer les chapitres pour chaque item
          for (let i = 0; i < savedItems.length; i++) {
            const savedItem = savedItems[i]
            const originalItem = module.items[i]
            
            if (!savedItem?.id) {
              console.warn(`L'item "${originalItem.title}" n'a pas d'ID, impossible de créer les chapitres`)
              continue
            }
            
            if (originalItem.chapters && originalItem.chapters.length > 0) {
              const chaptersData = originalItem.chapters.map((ch: any) => {
                // S'assurer que le type est valide ('content' ou 'game')
                const validType = (ch.type === 'content' || ch.type === 'game') ? ch.type : 'content'
                
                return {
                  item_id: savedItem.id,
                  title: ch.title,
                  position: ch.position,
                  content: ch.content || null,
                  type: validType,
                  game_content: ch.game_content || null,
                  published: ch.published !== undefined ? ch.published : true
                }
              })

              const { error: chaptersError } = await supabase
                .from('chapters')
                .insert(chaptersData)

              if (chaptersError) {
                console.error('Error creating chapters for item:', savedItem.id, chaptersError)
                // Ne pas bloquer la sauvegarde si les chapitres échouent
              }
            }
          }
        }
      }

      // Recharger les données
      if (!isNew) {
        await fetchCourse()
      }
    } catch (error: any) {
      console.error('Error saving course:', error)
      
      // Extraire le message d'erreur de manière plus détaillée
      let errorMessage = 'Erreur inconnue'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.code) {
        errorMessage = `Erreur ${error.code}: ${error.message || error.details || 'Erreur inconnue'}`
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else if (error?.details) {
        errorMessage = error.details
      } else if (error?.hint) {
        errorMessage = error.hint
      }
      
      // Ajouter des informations supplémentaires si disponibles
      if (error?.code) {
        errorMessage += ` (Code: ${error.code})`
      }
      
      setError(`Erreur lors de la sauvegarde: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    if (!parsedJson) return

    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${parsedJson.title.replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content) as any
        // Convertir le format slides si nécessaire
        const converted = convertSlidesFormatToCourseJson(parsed)
        // S'assurer que modules est toujours un tableau
        if (!converted.modules) {
          converted.modules = []
        }
        setJsonContent(JSON.stringify(converted, null, 2))
        setParsedJson(converted)
        setError('')
      } catch (error) {
        setError('Erreur lors de la lecture du fichier JSON.')
      }
    }
    reader.readAsText(file)
  }

  const handleGenerateSlides = async () => {
    if (!parsedJson || !courseId) {
      setError('Veuillez d\'abord sauvegarder le cours pour générer les slides.')
      return
    }

    if (!parsedJson.modules || parsedJson.modules.length === 0) {
      setError('Aucun module trouvé. Veuillez d\'abord créer des modules avec des slides.')
      return
    }

    setGeneratingSlides(true)
    setError('')
    
    try {
      // Compter le nombre total de slides à générer
      let totalSlides = 0
      parsedJson.modules.forEach(module => {
        totalSlides += module.items.filter(item => item.type === 'slide').length
      })
      
      setGenerationProgress({ current: 0, total: totalSlides })

      // Parcourir tous les modules et items
      const updatedModules = await Promise.all(
        parsedJson.modules.map(async (module, moduleIndex) => {
          // Récupérer l'ID du module depuis la base de données
          let moduleId = (module as any).id || `temp-${moduleIndex}`
          
          // Si c'est un module temporaire, on doit d'abord le sauvegarder
          if (moduleId.startsWith('temp-')) {
            // Pour l'instant, on utilise un ID temporaire
            // L'utilisateur devra sauvegarder le cours d'abord
            throw new Error('Veuillez d\'abord sauvegarder le cours pour générer les slides.')
          }

          // Récupérer les slides déjà générées de ce module pour éviter la répétition
          const slidesInModule = module.items.filter(i => i.type === 'slide')
          const previousDesigns: any[] = [] // On pourrait enrichir cela avec les designs réels

          const updatedItems = await Promise.all(
            module.items.map(async (item) => {
              // Générer seulement pour les slides
              if (item.type !== 'slide') {
                return item
              }

              // Préparer le contenu de la slide
              const slideContent = {
                title: item.title,
                objective: item.content?.description || item.content?.summary || '',
                on_screen: item.content?.summary?.split('\n') || [],
                speaker_notes: item.content?.speaker_notes || '',
                activity: item.content?.activity,
                mini_game: item.content?.mini_game
              }

              try {
                // Préparer le contexte pour Gemini avec les designs précédents
                const courseContext = {
                  courseTitle: parsedJson.title,
                  courseDescription: parsedJson.description,
                  moduleTitle: module.title,
                  slidePosition: item.position,
                  totalSlides: slidesInModule.length,
                  previousDesigns: previousDesigns.slice(-3) // Derniers 3 designs pour éviter répétition
                }

                // Générer le design avec Gemini d'abord
                const { generateSlideDesign } = await import('../../lib/slideGenerator')
                const design = await generateSlideDesign(slideContent, courseContext)

                // Générer et uploader la slide (avancée ou standard)
                let assetPath: string
                if (useAdvancedGeneration) {
                  try {
                    // Essayer d'abord avec l'API externe (htmlcsstoimage.com)
                    assetPath = await generateSlideWithExternalAPI(
                      slideContent,
                      design,
                      courseId,
                      moduleId,
                      item.id
                    )
                  } catch (error) {
                    console.warn(`⚠️ Génération avancée échouée pour "${item.title}", fallback vers standard:`, error)
                    // Fallback vers génération standard
                    assetPath = await generateAndUploadSlide(
                      slideContent,
                      courseId,
                      moduleId,
                      item.id,
                      courseContext
                    )
                  }
                } else {
                  // Génération standard avec Canvas
                  assetPath = await generateAndUploadSlide(
                    slideContent,
                    courseId,
                    moduleId,
                    item.id,
                    courseContext
                  )
                }

                // Ajouter le design généré à la liste (pour les slides suivantes)
                // Note: on ne peut pas récupérer le design réel ici, mais on pourrait le stocker

                setGenerationProgress(prev => ({ ...prev, current: prev.current + 1 }))

                // Mettre à jour l'item avec le chemin de l'asset
                return {
                  ...item,
                  asset_path: assetPath
                }
              } catch (error) {
                console.error(`Erreur lors de la génération de la slide "${item.title}":`, error)
                // Continuer avec les autres slides même en cas d'erreur
                return item
              }
            })
          )

          return {
            ...module,
            items: updatedItems
          }
        })
      )

      // Mettre à jour le JSON avec les nouveaux asset_path
      const updatedJson: CourseJson = {
        ...parsedJson,
        modules: updatedModules
      }

      setParsedJson(updatedJson)
      setJsonContent(JSON.stringify(updatedJson, null, 2))
      setError('')
    } catch (error: any) {
      console.error('Erreur lors de la génération des slides:', error)
      setError(`Erreur lors de la génération: ${error.message || 'Erreur inconnue'}`)
    } finally {
      setGeneratingSlides(false)
      setGenerationProgress({ current: 0, total: 0 })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Nouveau cours (JSON)' : 'Modifier le cours (JSON)'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="btn-secondary inline-flex items-center justify-center space-x-2 !h-10 py-0 min-w-[140px]"
              >
                <Eye className="w-4 h-4" />
                <span>{previewMode ? 'Éditer' : 'Prévisualiser'}</span>
              </button>
              <label className="btn-secondary inline-flex items-center justify-center space-x-2 cursor-pointer !h-10 py-0 min-w-[140px]">
                <Upload className="w-4 h-4" />
                <span>Importer JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExport}
                disabled={!parsedJson}
                className="btn-secondary inline-flex items-center justify-center space-x-2 disabled:opacity-50 !h-10 py-0 min-w-[140px]"
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
              <div className="flex items-center space-x-2">
                {parsedJson?.modules?.some(m => m.items.some(i => i.type === 'slide')) && (
                  <label className="flex items-center space-x-1 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAdvancedGeneration}
                      onChange={(e) => setUseAdvancedGeneration(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Design avancé</span>
                  </label>
                )}
                <button
                  onClick={handleGenerateSlides}
                  disabled={generatingSlides || !parsedJson || (!courseId && isNew)}
                  className="inline-flex items-center justify-center space-x-2 px-4 !h-10 py-0 rounded-md font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600 min-w-[140px]"
                  title={
                    !parsedJson
                      ? "Importez d'abord un JSON"
                      : isNew && !courseId 
                        ? "Sauvegardez d'abord le cours pour générer les slides" 
                        : !parsedJson?.modules?.some(m => m.items.some(i => i.type === 'slide'))
                          ? "Aucune slide trouvée dans le cours"
                          : useAdvancedGeneration 
                            ? "Générer avec design avancé (HTML/CSS via opérateur)"
                            : "Générer les slides avec IA (Gemini + Canvas)"
                  }
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {generatingSlides 
                      ? `Génération... ${generationProgress.current}/${generationProgress.total}`
                      : useAdvancedGeneration 
                        ? 'Générer slides avancées'
                        : 'Générer slides IA'
                    }
                  </span>
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !parsedJson || !!error}
                className="btn-primary inline-flex items-center justify-center space-x-2 disabled:opacity-50 !h-10 py-0 min-w-[140px]"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded text-xs">
              <strong>Debug:</strong> courseId={courseId || 'undefined'}, isNew={isNew ? 'true' : 'false'}, 
              parsedJson={parsedJson ? 'ok' : 'null'}, 
              slides={parsedJson?.modules?.some(m => m.items.some(i => i.type === 'slide')) ? 'trouvées' : 'aucune'}
            </div>
          )}

          {parsedJson && parsedJson.modules && parsedJson.modules.some(m => m.items.some(i => i.type === 'slide')) && (
            <div className="mb-4 bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>
                    <strong>Génération IA disponible :</strong> Ce cours contient des slides qui peuvent être générées automatiquement avec l'IA.
                    {isNew && !courseId && ' Sauvegardez d\'abord le cours pour activer la génération.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {previewMode && parsedJson ? (
            <div className="bg-white shadow rounded-lg p-6">
              <ReactRenderer courseJson={parsedJson} />
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>JSON du cours</span>
                </h2>
                <div className="text-sm">
                  {parsedJson ? (
                    parsedJson.title?.trim() ? (
                      <span className="text-green-600">✓ JSON valide</span>
                    ) : (
                      <span className="text-red-600">⚠ Titre manquant</span>
                    )
                  ) : (
                    <span className="text-red-600">⚠ JSON invalide</span>
                  )}
                </div>
              </div>
              <textarea
                value={jsonContent}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full h-[calc(100vh-300px)] font-mono text-sm border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Collez votre JSON ici..."
                spellCheck={false}
              />
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-semibold mb-2">Structure JSON attendue :</p>
                <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
{`{
  "title": "Titre du cours",
  "description": "Description",
  "status": "draft" | "published",
  "access_type": "free" | "paid" | "invite",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Titre du module",
      "position": 1,
      "theme": { ... },
      "items": [
        {
          "type": "resource" | "slide" | "exercise" | "tp" | "game",
          "title": "Titre de l'item",
          "position": 1,
          "published": true,
          "content": { ... },
          "chapters": [                    // Chapitres intégrés (optionnel)
            {
              "title": "Titre du chapitre",
              "position": 1,
              "content": { ... }            // Format TipTap JSON
            }
          ]
        }
      ]
    }
  ]
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

