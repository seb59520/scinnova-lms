import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Item } from '../../types/database'
import { Save, Upload, Download, Code, Eye, ArrowLeft, Sparkles } from 'lucide-react'
import { ReactItemRenderer } from '../../components/ReactItemRenderer'
import { generateAndUploadSlide } from '../../lib/slideGenerator'
import { generateSlideWithExternalAPI } from '../../lib/slideGeneratorAdvanced'

export interface ChapterJson {
  title: string
  position: number
  content?: any // Format TipTap JSON
  type?: 'content' | 'game' // Type de chapitre : contenu normal ou jeu
  game_content?: any // Contenu du jeu si type === 'game'
  published?: boolean // Publication du chapitre
}

export interface ItemJson {
  type: 'resource' | 'slide' | 'exercise' | 'tp' | 'game'
  title: string
  position: number
  published?: boolean
  content: {
    body?: any
    description?: string
    question?: any
    correction?: any
    instructions?: any
    checklist?: string[]
    gameType?: string
    pairs?: Array<{ term: string; definition: string }>
    leftColumn?: string[]
    rightColumn?: string[]
    correctMatches?: Array<{ left: number; right: number }>
    apiTypes?: any[]
    scenarios?: any[]
    levels?: Array<{
      level: number
      name: string
      questions: Array<{
        id: string
        type: 'identify-format' | 'json-valid' | 'fix-json-mcq' | 'fix-json-editor' | 'choose-format'
        prompt: string
        snippet?: string
        options?: string[]
        answer: string | boolean
        explanation: string
        difficulty: number
      }>
    }>
    [key: string]: any
  }
  chapters?: ChapterJson[] // Chapitres intégrés dans le JSON
  asset_path?: string
  external_url?: string
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
  }
}

export function AdminItemEditJson() {
  const { itemId } = useParams<{ itemId: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isNew = itemId === 'new'
  const moduleIdFromUrl = searchParams.get('module_id')
  const returnTo = searchParams.get('returnTo')

  const [item, setItem] = useState<Item | null>(null)
  const [jsonContent, setJsonContent] = useState<string>('')
  const [parsedJson, setParsedJson] = useState<ItemJson | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [previewMode, setPreviewMode] = useState(false)
  const [moduleTitle, setModuleTitle] = useState<string>('')
  const [generatingSlide, setGeneratingSlide] = useState(false)
  const [useAdvancedGeneration, setUseAdvancedGeneration] = useState(false)

  useEffect(() => {
    if (!isNew && itemId) {
      fetchItem()
    } else {
      // Template JSON par défaut
      const defaultJson: ItemJson = {
        type: 'resource',
        title: 'Nouvel élément',
        position: 0,
        published: true,
        content: {},
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#8B5CF6',
          fontFamily: 'Inter'
        }
      }
      setJsonContent(JSON.stringify(defaultJson, null, 2))
      setParsedJson(defaultJson)
      setLoading(false)
    }
  }, [itemId, isNew, moduleIdFromUrl])

  const fetchItem = async () => {
    try {
      setError('')
      
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select(`
          *,
          modules (
            id,
            title,
            course_id,
            courses (
              id,
              title
            )
          )
        `)
        .eq('id', itemId)
        .single()

      if (itemError) throw itemError
      
      setItem(itemData)
      
      if (itemData.modules) {
        setModuleTitle(itemData.modules.title || '')
      }

      // Récupérer les chapitres
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('item_id', itemId)
        .order('position', { ascending: true })

      // Construire le JSON
      const content = itemData.content || {}
      const theme = (content as any).theme || undefined
      // Retirer le theme du content pour la structure JSON
      const { theme: _, ...contentWithoutTheme } = content as any
      
      const itemJson: ItemJson = {
        type: itemData.type as ItemJson['type'],
        title: itemData.title,
        position: itemData.position,
        published: itemData.published,
        content: contentWithoutTheme,
        asset_path: itemData.asset_path || undefined,
        external_url: itemData.external_url || undefined,
        theme: theme,
        chapters: (chaptersData || []).map(ch => ({
          title: ch.title,
          position: ch.position,
          content: ch.content || undefined,
          type: ch.type || 'content',
          game_content: ch.game_content || undefined,
          published: ch.published
        }))
      }

      setJsonContent(JSON.stringify(itemJson, null, 2))
      setParsedJson(itemJson)
    } catch (error) {
      console.error('Error fetching item:', error)
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleJsonChange = (value: string) => {
    setJsonContent(value)
    try {
      const parsed = JSON.parse(value) as ItemJson
      setParsedJson(parsed)
      setError('')
    } catch (e) {
      // Ne pas afficher d'erreur pendant la saisie
      if (value.trim() !== '') {
        setError('JSON invalide')
      }
    }
  }

  const handleSave = async () => {
    if (!parsedJson) {
      setError('JSON invalide. Veuillez corriger les erreurs.')
      return
    }

    if (!parsedJson.title?.trim()) {
      setError('Le titre est obligatoire.')
      return
    }

    // Valider le type
    const validTypes = ['resource', 'slide', 'exercise', 'activity', 'tp', 'game']
    if (!validTypes.includes(parsedJson.type)) {
      setError(`Type invalide: "${parsedJson.type}". Types valides: ${validTypes.join(', ')}`)
      return
    }

    setSaving(true)
    setError('')

    try {
      // Déterminer le module_id
      let moduleId = moduleIdFromUrl || item?.module_id

      if (!moduleId && isNew) {
        setError('Le module_id est obligatoire. Ajoutez ?module_id=XXX à l\'URL ou créez l\'élément depuis la page du module.')
        setSaving(false)
        return
      }

      if (!moduleId) {
        setError('Module ID manquant.')
        setSaving(false)
        return
      }

      // Préparer le contenu - inclure le theme s'il est présent
      const contentData = { ...(parsedJson.content || {}) }
      if (parsedJson.theme) {
        // Stocker le theme dans le content pour compatibilité
        contentData.theme = parsedJson.theme
      }

      const itemData = {
        module_id: moduleId,
        type: parsedJson.type,
        title: parsedJson.title.trim(),
        position: parsedJson.position,
        published: parsedJson.published !== false,
        content: contentData,
        asset_path: parsedJson.asset_path || null,
        external_url: parsedJson.external_url || null,
        updated_at: new Date().toISOString()
      }

      let finalItemId = itemId

      if (isNew) {
        const { data, error } = await supabase
          .from('items')
          .insert(itemData)
          .select()
          .single()

        if (error) throw error
        finalItemId = data.id
        // Rediriger vers la page d'édition avec le nouvel ID et le paramètre returnTo
        const returnToParam = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
        navigate(`/admin/items/${data.id}/json${returnToParam}`, { replace: true })
      } else {
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', itemId)

        if (error) throw error
        finalItemId = itemId
      }

      // Gérer les chapitres
      if (parsedJson.chapters && finalItemId) {
        // Supprimer les anciens chapitres
        if (!isNew) {
          await supabase
            .from('chapters')
            .delete()
            .eq('item_id', finalItemId)
        }

        // Créer les nouveaux chapitres
        if (parsedJson.chapters && parsedJson.chapters.length > 0) {
          const chaptersData = parsedJson.chapters.map(ch => {
            // S'assurer que le type est valide ('content' ou 'game')
            const validType = (ch.type === 'content' || ch.type === 'game') ? ch.type : 'content'
            
            // Valider que le content est un objet valide (TipTap JSON)
            let chapterContent = null
            if (ch.content) {
              if (typeof ch.content === 'object' && ch.content !== null) {
                chapterContent = ch.content
              } else if (typeof ch.content === 'string') {
                try {
                  chapterContent = JSON.parse(ch.content)
                } catch {
                  // Si ce n'est pas du JSON valide, on le stocke comme texte
                  chapterContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: ch.content }] }] }
                }
              }
            }
            
            // Construire l'objet chapitre
            const chapterData: any = {
              item_id: finalItemId,
              title: ch.title || 'Sans titre',
              position: ch.position ?? 0,
              content: chapterContent,
              type: validType,
              published: ch.published !== undefined ? ch.published : true
            }
            
            // Ajouter game_content seulement si présent et non null
            // Note: Si la colonne n'existe pas dans la DB, l'insertion échouera
            // mais on gérera l'erreur dans le catch
            if (ch.game_content !== undefined && ch.game_content !== null) {
              chapterData.game_content = ch.game_content
            }
            
            return chapterData
          })

          // Préparer les données de chapitres en excluant game_content si la colonne n'existe pas
          // On va d'abord essayer avec game_content, puis sans si ça échoue
          let chaptersError = null
          
          try {
            const { error } = await supabase
              .from('chapters')
              .insert(chaptersData)
            chaptersError = error
          } catch (err: any) {
            // Si l'erreur est liée à game_content, réessayer sans cette colonne
            if (err?.message?.includes('game_content') || chaptersError?.message?.includes('game_content')) {
              console.warn('Colonne game_content non disponible, insertion sans cette colonne')
              const chaptersDataWithoutGameContent = chaptersData.map((ch: any) => {
                const { game_content, ...rest } = ch
                return rest
              })
              
              const { error: retryError } = await supabase
                .from('chapters')
                .insert(chaptersDataWithoutGameContent)
              chaptersError = retryError
            } else {
              chaptersError = err
            }
          }

          if (chaptersError) {
            console.error('Erreur lors de la création des chapitres:', chaptersError)
            throw new Error(`Erreur lors de la sauvegarde des chapitres: ${chaptersError.message}`)
          }
        }
      }
      
      // Recharger les données
      if (!isNew) {
        await fetchItem()
      }
    } catch (error: any) {
      console.error('Error saving item:', error)
      
      // Afficher un message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de la sauvegarde'
      
      if (error?.message) {
        errorMessage += `: ${error.message}`
      }
      
      if (error?.code) {
        errorMessage += ` (Code: ${error.code})`
      }
      
      if (error?.details) {
        errorMessage += `\nDétails: ${error.details}`
      }
      
      if (error?.hint) {
        errorMessage += `\nIndication: ${error.hint}`
      }
      
      // Erreurs spécifiques
      if (error?.code === '23505') {
        errorMessage = 'Erreur: Un élément avec ces caractéristiques existe déjà.'
      } else if (error?.code === '23503') {
        errorMessage = 'Erreur: Référence invalide (module_id introuvable).'
      } else if (error?.code === '23514') {
        errorMessage = 'Erreur: Contrainte de validation non respectée (type invalide, etc.).'
      } else if (error?.message?.includes('JSON') || error?.message?.includes('jsonb')) {
        errorMessage = `Erreur de format JSON: ${error.message}\nVérifiez que le contenu JSON est valide.`
      }
      
      setError(errorMessage)
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
        const parsed = JSON.parse(content) as ItemJson
        setJsonContent(JSON.stringify(parsed, null, 2))
        setParsedJson(parsed)
        setError('')
      } catch (error) {
        setError('Erreur lors de la lecture du fichier JSON.')
      }
    }
    reader.readAsText(file)
  }

  const handleGenerateSlide = async () => {
    if (!parsedJson || parsedJson.type !== 'slide') {
      setError('Cette fonctionnalité est uniquement disponible pour les slides.')
      return
    }

    if (!item?.module_id && !moduleIdFromUrl) {
      setError('Impossible de déterminer le module. Sauvegardez d\'abord l\'élément.')
      return
    }

    // Récupérer le course_id depuis le module
    let courseId: string | undefined
    let moduleId = item?.module_id || moduleIdFromUrl
    let courseData: any = null
    let moduleData: any = null

    if ((item as any)?.modules) {
      courseId = ((item as any).modules as any).course_id
      moduleData = (item as any).modules
    } else if (moduleId) {
      // Récupérer le module et le cours pour obtenir toutes les infos
      const { data: modData } = await supabase
        .from('modules')
        .select('course_id, title, courses(id, title, description)')
        .eq('id', moduleId)
        .single()
      
      if (modData) {
        courseId = modData.course_id
        moduleData = modData
        courseData = (modData as any).courses
      }
    }

    if (!courseId) {
      setError('Impossible de déterminer le cours. Sauvegardez d\'abord l\'élément.')
      return
    }

    // Récupérer toutes les slides du module pour éviter la répétition
    let previousSlides: any[] = []
    if (moduleId) {
      const { data: slidesData } = await supabase
        .from('items')
        .select('asset_path, content')
        .eq('module_id', moduleId)
        .eq('type', 'slide')
        .not('asset_path', 'is', null)
        .order('position', { ascending: true })
      
      if (slidesData) {
        previousSlides = slidesData
      }
    }

    setGeneratingSlide(true)
    setError('')

    try {
      // Fonction pour extraire le texte depuis le contenu TipTap
      const extractTextFromTipTap = (content: any): string[] => {
        if (!content || !content.content) return []
        
        const texts: string[] = []
        
        const traverse = (node: any) => {
          if (node.type === 'text' && node.text) {
            texts.push(node.text)
          } else if (node.type === 'heading') {
            // Extraire le texte du heading
            if (node.content) {
              const headingText = node.content
                .filter((c: any) => c.type === 'text')
                .map((c: any) => c.text)
                .join('')
              if (headingText) {
                texts.push(headingText)
              }
            }
          } else if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse)
          }
        }
        
        if (Array.isArray(content.content)) {
          content.content.forEach(traverse)
        } else {
          traverse(content)
        }
        
        return texts
      }
      
      // Extraire les points clés depuis le contenu
      let onScreenPoints: string[] = []
      
      if (parsedJson.content) {
        // Si c'est un objet TipTap (doc)
        if (parsedJson.content.type === 'doc' || parsedJson.content.content) {
          const allTexts = extractTextFromTipTap(parsedJson.content)
          
          // Extraire les headings comme points principaux
          const extractHeadings = (content: any): string[] => {
            if (!content || !content.content) return []
            
            const headings: string[] = []
            
            const traverse = (node: any) => {
              if (node.type === 'heading' && node.content) {
                const headingText = node.content
                  .filter((c: any) => c.type === 'text')
                  .map((c: any) => c.text)
                  .join('')
                if (headingText) {
                  headings.push(headingText)
                }
              } else if (node.content && Array.isArray(node.content)) {
                node.content.forEach(traverse)
              }
            }
            
            if (Array.isArray(content.content)) {
              content.content.forEach(traverse)
            } else {
              traverse(content)
            }
            
            return headings
          }
          
          const headings = extractHeadings(parsedJson.content)
          
          // Utiliser les headings comme points principaux, ou les premiers paragraphes
          if (headings.length > 0) {
            // Limiter à 6-8 points maximum pour l'affichage sur la slide
            onScreenPoints = headings.slice(0, 8).map(h => {
              // Nettoyer et raccourcir si nécessaire
              return h.length > 80 ? h.substring(0, 77) + '...' : h
            })
          } else {
            // Sinon, utiliser les premiers paragraphes
            const paragraphs = allTexts.filter((t) => {
              // Prendre les paragraphes significatifs (plus de 20 caractères)
              return t.length > 20
            })
            onScreenPoints = paragraphs.slice(0, 6).map(p => {
              return p.length > 100 ? p.substring(0, 97) + '...' : p
            })
          }
        } else if (parsedJson.content.summary) {
          // Format simple avec summary
          onScreenPoints = parsedJson.content.summary.split('\n').filter((p: string) => p.trim())
        }
      }
      
      // Préparer le contenu de la slide
      const slideContent = {
        title: parsedJson.title,
        objective: parsedJson.content?.description || parsedJson.content?.summary || '',
        on_screen: onScreenPoints.length > 0 ? onScreenPoints : ['Contenu détaillé disponible dans les chapitres'],
        speaker_notes: parsedJson.content?.speaker_notes || '',
        activity: parsedJson.content?.activity,
        mini_game: parsedJson.content?.mini_game
      }

      console.log('🚀 Génération de la slide avec les paramètres:', {
        courseId,
        moduleId,
        itemId,
        slideContent
      })

      // Préparer le contexte pour Gemini
      const courseContext = {
        courseTitle: courseData?.title || undefined,
        courseDescription: courseData?.description || undefined,
        moduleTitle: moduleData?.title || undefined,
        slidePosition: parsedJson.position,
        totalSlides: previousSlides.length + 1,
        previousDesigns: [] // Pour l'instant vide, pourrait être enrichi avec les designs précédents
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
            moduleId!,
            itemId || undefined
          )
        } catch (error) {
          console.warn('⚠️ Génération avancée échouée, fallback vers standard:', error)
          // Fallback vers génération standard
          assetPath = await generateAndUploadSlide(
            slideContent,
            courseId,
            moduleId!,
            itemId || undefined,
            courseContext
          )
        }
      } else {
        // Génération standard avec Canvas
        assetPath = await generateAndUploadSlide(
          slideContent,
          courseId,
          moduleId!,
          itemId || undefined,
          courseContext
        )
      }

      // Vérifier que l'upload a bien réussi avant de mettre à jour le JSON
      if (!assetPath) {
        throw new Error('Le chemin de l\'asset est vide après l\'upload')
      }

      // Vérifier que le fichier est accessible via son URL publique
      // (plus fiable que list() qui peut avoir des problèmes de timing)
      try {
        const { data: urlData } = supabase.storage
          .from('course-assets')
          .getPublicUrl(assetPath)

        if (!urlData?.publicUrl) {
          console.warn('⚠️ Impossible de générer l\'URL publique, mais l\'upload a réussi')
        } else {
          console.log('✅ URL publique générée:', urlData.publicUrl)
          
          // Optionnel : vérifier que l'URL est accessible (mais cela peut échouer à cause du cache)
          // On fait confiance à l'upload qui a réussi
        }
      } catch (checkError) {
        console.warn('⚠️ Impossible de vérifier l\'URL publique:', checkError)
        // On continue quand même car l'upload a réussi
      }

      // Mettre à jour le JSON avec le chemin de l'asset seulement si tout est OK
      const updatedJson: ItemJson = {
        ...parsedJson,
        asset_path: assetPath
      }

      setParsedJson(updatedJson)
      setJsonContent(JSON.stringify(updatedJson, null, 2))
      setError('')
      
      console.log('✅ Slide générée et JSON mis à jour avec succès')
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération de la slide:', error)
      setError(`Erreur lors de la génération: ${error.message || 'Erreur inconnue'}`)
      // Ne pas mettre à jour le JSON en cas d'erreur
    } finally {
      setGeneratingSlide(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getItemTypeExamples = () => {
    const type = parsedJson?.type || 'resource'
    
    const examples: Record<string, any> = {
      resource: {
        type: 'resource',
        title: 'Titre de la ressource',
        position: 1,
        published: true,
        content: {
          body: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Contenu de la ressource...' }]
              }
            ]
          },
          description: 'Description courte de la ressource'
        },
        external_url: 'https://example.com',
        asset_path: 'module1/resource.pdf'
      },
      slide: {
        type: 'slide',
        title: 'Titre du support',
        position: 1,
        published: true,
        content: {
          description: 'Description du support projeté'
        },
        asset_path: 'module1/slide.pdf'
      },
      exercise: {
        type: 'exercise',
        title: 'Titre de l\'exercice',
        position: 1,
        published: true,
        content: {
          question: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Énoncé de l\'exercice...' }]
              }
            ]
          },
          correction: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Correction de l\'exercice...' }]
              }
            ]
          }
        }
      },
      tp: {
        type: 'tp',
        title: 'Titre du TP',
        position: 1,
        published: true,
        content: {
          instructions: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Instructions du TP...' }]
              }
            ]
          },
          checklist: [
            'Tâche 1',
            'Tâche 2',
            'Tâche 3'
          ]
        }
      },
      game: {
        type: 'game',
        title: 'Titre du jeu',
        position: 1,
        published: true,
        content: {
          gameType: 'matching',
          description: 'Description du jeu',
          instructions: 'Instructions pour jouer',
          pairs: [
            { term: 'Terme 1', definition: 'Définition 1' },
            { term: 'Terme 2', definition: 'Définition 2' }
          ]
        },
      },
      'game-format-files': {
        type: 'game',
        title: 'Jeu : Formats de fichiers (JSON / XML / Protobuf)',
        position: 1,
        published: true,
        content: {
          gameType: 'format-files',
          description: 'Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf',
          instructions: 'Répondez aux questions pour progresser dans les 3 niveaux de difficulté',
          levels: [
            {
              level: 1,
              name: 'Découverte',
              questions: [
                {
                  id: 'q1-1',
                  type: 'identify-format',
                  prompt: 'Quel est ce format de données ?',
                  snippet: '{\n  "name": "John",\n  "age": 30\n}',
                  options: ['JSON', 'XML', 'Protobuf'],
                  answer: 'JSON',
                  explanation: "C'est du JSON car il utilise des accolades {} et des paires clé-valeur avec des guillemets.",
                  difficulty: 1
                }
              ]
            }
          ]
        },
        chapters: [
          {
            title: 'Chapitre 1 : Introduction',
            position: 1,
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Contenu du premier chapitre...' }]
                }
              ]
            }
          },
          {
            title: 'Chapitre 2 : Approfondissement',
            position: 2,
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Contenu du deuxième chapitre...' }]
                }
              ]
            }
          }
        ]
      }
    }

    return examples[type] || examples.resource
  }

  const loadExample = () => {
    const example = getItemTypeExamples()
    setJsonContent(JSON.stringify(example, null, 2))
    setParsedJson(example)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to={returnTo || (item?.module_id ? `/admin/courses/${((item as any).modules as any)?.course_id || ''}` : '/admin')}
                className="text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isNew ? 'Nouvel élément (JSON)' : 'Modifier l\'élément (JSON)'}
                </h1>
                {moduleTitle && (
                  <p className="text-sm text-gray-600 mt-1">
                    Module: {moduleTitle}
                  </p>
                )}
              </div>
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
                {parsedJson?.type === 'slide' && (
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
                  onClick={handleGenerateSlide}
                  disabled={generatingSlide || !parsedJson || isNew || parsedJson?.type !== 'slide'}
                  className="inline-flex items-center justify-center space-x-2 px-4 !h-10 py-0 rounded-md font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600 min-w-[140px]"
                  title={
                    !parsedJson
                      ? "Importez d'abord un JSON"
                      : isNew
                        ? "Sauvegardez d'abord l'élément"
                        : parsedJson?.type !== 'slide'
                          ? "Le type doit être 'slide' pour générer une slide"
                          : useAdvancedGeneration
                            ? "Générer avec design avancé (HTML/CSS)"
                            : "Générer la slide avec IA (Gemini + Canvas)"
                  }
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {generatingSlide ? 'Génération...' : useAdvancedGeneration ? 'Générer slide avancée' : 'Générer slide IA'}
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

          {previewMode && parsedJson ? (
            <div className="bg-white shadow rounded-lg p-6">
              <ReactItemRenderer itemJson={parsedJson} />
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <Code className="w-5 h-5" />
                    <span>JSON de l'élément</span>
                  </h2>
                  {parsedJson && (
                    <span className="text-sm text-gray-500">
                      Type: <span className="font-semibold capitalize">{parsedJson.type}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">
                    {parsedJson ? '✓ JSON valide' : '⚠ JSON invalide'}
                  </div>
                  <button
                    onClick={loadExample}
                    className="btn-secondary text-sm ml-4"
                  >
                    Charger un exemple
                  </button>
                </div>
              </div>
              <textarea
                value={jsonContent}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full h-[calc(100vh-400px)] font-mono text-sm border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Collez votre JSON ici..."
                spellCheck={false}
              />
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-semibold mb-2">Structure JSON attendue :</p>
                <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
{`{
  "type": "resource" | "slide" | "exercise" | "activity" | "tp" | "game",
  "title": "Titre de l'élément",
  "position": 1,
  "published": true,
  "content": {
    // Contenu selon le type
    "body": { ... },           // Pour resource/slide
    "question": { ... },       // Pour exercise
    "correction": { ... },     // Pour exercise
    "instructions": { ... },   // Pour tp
    "checklist": [ ... ],      // Pour tp
    "gameType": "matching",    // Pour game
    "pairs": [ ... ],          // Pour game (matching)
    "leftColumn": [ ... ],     // Pour game (column-matching)
    "rightColumn": [ ... ],    // Pour game (column-matching)
    "correctMatches": [ ... ]  // Pour game (column-matching)
  },
  "chapters": [                // Chapitres intégrés (optionnel)
    {
      "title": "Titre du chapitre",
      "position": 1,
      "content": { ... }        // Format TipTap JSON
    }
  ],
  "asset_path": "chemin/vers/fichier.pdf",
  "external_url": "https://example.com",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  }
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

