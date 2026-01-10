import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Item, Submission } from '../types/database'
import { ItemRenderer } from '../components/ItemRenderer'
import { ChapterViewer } from '../components/ChapterViewer'
import { RichTextEditor } from '../components/RichTextEditor'
import { ResizableContainer } from '../components/ResizableContainer'
import { Lexique } from './Lexique'
import { FileText, ChevronDown, ChevronUp, Target, Lightbulb, BookOpen, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'

// Vérifie si le body TipTap contient du contenu substantiel
// (plus qu'un simple paragraphe de description courte)
function hasSubstantialBody(body: any): boolean {
  if (!body || typeof body !== 'object') return false
  
  const content = body.content
  if (!content || !Array.isArray(content)) return false
  
  // Si plus d'un élément, c'est substantiel
  if (content.length > 1) return true
  
  // Si un seul élément, vérifier la longueur du texte
  const firstElement = content[0]
  if (!firstElement) return false
  
  // Compter le texte total
  let textLength = 0
  const countText = (node: any) => {
    if (node.text) textLength += node.text.length
    if (node.content) node.content.forEach(countText)
  }
  countText(firstElement)
  
  // Moins de 200 caractères = probablement juste une description
  return textLength > 200
}

interface ScriptSection {
  title: string
  type: 'introduction' | 'content' | 'exercise' | 'transition' | 'summary'
  content: string
  keyPoints: string[]
  arguments: string[]
  sources: string[]
  questions: string[]
  examples: string[]
  estimatedTime: number
  order: number
}

export function ItemView() {
  const { itemId } = useParams<{ itemId: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scriptSection, setScriptSection] = useState<ScriptSection | null>(null)
  const [showScript, setShowScript] = useState(false)
  const [courseItems, setCourseItems] = useState<Item[]>([])
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1)

  // Log pour déboguer le profil
  useEffect(() => {
    console.log('👤 Profile state changed:', {
      hasProfile: !!profile,
      profileRole: profile?.role,
      hasUser: !!user,
      userId: user?.id
    })
  }, [profile, user])

  useEffect(() => {
    if (itemId) {
      // Réinitialiser l'état lors du changement d'item
      setLoading(true)
      setItem(null)
      setError('')
      setCurrentItemIndex(-1)
      fetchItem()
    }
  }, [itemId]) // Ne pas dépendre de profile ici pour éviter les rechargements

  // Charger le script quand le profil est disponible et que l'item est chargé
  useEffect(() => {
    console.log('🔄 useEffect for script loading triggered:', {
      hasItem: !!item,
      hasProfile: !!profile,
      itemType: item?.type,
      profileRole: profile?.role,
      hasUserId: !!user?.id
    })
    
    if (item && profile && (item.type === 'slide' || item.type === 'resource')) {
      const courseId = item.modules?.courses?.id
      const isAuthorized = profile.role === 'admin' || profile.role === 'trainer' || profile.role === 'instructor'
      
      console.log('🔍 Checking script loading conditions:', {
        courseId,
        hasUserId: !!user?.id,
        isAuthorized,
        itemId: item.id,
        itemTitle: item.title
      })
      
      if (courseId && user?.id && isAuthorized) {
        console.log('✅ All conditions met, loading trainer script...')
        loadTrainerScript(courseId, item.id, item.title)
      } else {
        console.log('❌ Conditions not met:', {
          hasCourseId: !!courseId,
          hasUserId: !!user?.id,
          isAuthorized
        })
      }
    } else {
      console.log('⏳ Waiting for item or profile:', {
        hasItem: !!item,
        hasProfile: !!profile,
        isSlideOrResource: item?.type === 'slide' || item?.type === 'resource'
      })
    }
  }, [item, profile, user])

  const loadTrainerScript = async (courseId: string, itemId: string, itemTitle: string) => {
    if (!user?.id) {
      console.log('❌ loadTrainerScript: No user ID')
      return
    }
    
    try {
      console.log('🔍 Loading trainer script from Supabase:', { courseId, itemId, itemTitle, userId: user.id })
      
      // Chercher directement par item_id (méthode la plus fiable)
      const { data: scriptData, error: scriptError } = await supabase
        .from('trainer_scripts')
        .select('*')
        .eq('course_id', courseId)
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .maybeSingle() // Utiliser maybeSingle au lieu de single pour éviter l'erreur si aucun résultat

      console.log('🔍 Search by item_id result:', { 
        found: !!scriptData, 
        error: scriptError,
        itemId,
        courseId,
        userId: user.id
      })

      if (scriptData) {
        // Script trouvé directement par item_id
        const section: ScriptSection = {
          title: scriptData.section_title,
          type: scriptData.section_type,
          content: scriptData.content || '',
          keyPoints: Array.isArray(scriptData.key_points) ? scriptData.key_points : [],
          arguments: Array.isArray(scriptData.arguments) ? scriptData.arguments : [],
          sources: Array.isArray(scriptData.sources) ? scriptData.sources : [],
          questions: Array.isArray(scriptData.questions) ? scriptData.questions : [],
          examples: Array.isArray(scriptData.examples) ? scriptData.examples : [],
          estimatedTime: scriptData.estimated_time || 0,
          order: scriptData.section_order
        }
        console.log('✅ Script found by item_id:', section.title)
        setScriptSection(section)
        return
      }

      if (scriptError) {
        console.log('⚠️ Error searching by item_id:', scriptError)
      } else {
        console.log('⚠️ No script found by item_id, trying by title...')
      }

      // Si pas trouvé par item_id, chercher par titre dans toutes les sections du cours
      const { data: allScripts, error: allScriptsError } = await supabase
        .from('trainer_scripts')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .order('section_order', { ascending: true })

      console.log('🔍 Query for all scripts:', {
        courseId,
        userId: user.id,
        found: allScripts?.length || 0,
        error: allScriptsError
      })

      if (!allScriptsError && allScripts && allScripts.length > 0) {
        console.log('📋 All script sections found:', allScripts.length)
        console.log('📋 All script titles:', allScripts.map((s: any) => s.section_title))
        console.log('📋 Scripts with item_id:', allScripts.filter((s: any) => s.item_id).map((s: any) => ({
          title: s.section_title,
          item_id: s.item_id,
          matches: s.item_id === itemId
        })))
        console.log('📋 Scripts without item_id:', allScripts.filter((s: any) => !s.item_id).map((s: any) => s.section_title))
        const sections: ScriptSection[] = allScripts.map((dbSection: any) => ({
          title: dbSection.section_title,
          type: dbSection.section_type,
          content: dbSection.content || '',
          keyPoints: Array.isArray(dbSection.key_points) ? dbSection.key_points : [],
          arguments: Array.isArray(dbSection.arguments) ? dbSection.arguments : [],
          sources: Array.isArray(dbSection.sources) ? dbSection.sources : [],
          questions: Array.isArray(dbSection.questions) ? dbSection.questions : [],
          examples: Array.isArray(dbSection.examples) ? dbSection.examples : [],
          estimatedTime: dbSection.estimated_time || 0,
          order: dbSection.section_order
        }))
        console.log('📋 Section titles:', sections.map(s => s.title))
        console.log('🔍 Looking for item:', { itemId, itemTitle })
        findMatchingSection(sections, itemTitle)
        return
      }

      if (allScriptsError) {
        console.error('❌ Error loading all scripts:', allScriptsError)
      }

      // Fallback sur localStorage
      console.log('⚠️ No script found in Supabase, trying localStorage...')
      const storageKey = `trainer-script-${courseId}-${user.id}`
      const saved = localStorage.getItem(storageKey)
      
      if (saved) {
        const parsed: ScriptSection[] = JSON.parse(saved)
        console.log('📋 Script sections found in localStorage:', parsed.length)
        findMatchingSection(parsed, itemTitle)
      } else {
        console.log('❌ No script found in localStorage either')
      }
    } catch (error) {
      console.error('❌ Error loading trainer script:', error)
    }
  }

  const findMatchingSection = (sections: ScriptSection[], itemTitle: string) => {
    // Normaliser le titre de l'item (enlever les préfixes comme "SLIDE — " ou "🟦 SLIDE — ")
    const normalizedItemTitle = itemTitle
      .replace(/^[🟦🟩🟨🟧🟥🟪⬛⬜]+\s*/, '') // Enlever les emojis au début
      .replace(/^(SLIDE|Slide|slide)\s*[—–-]\s*/i, '') // Enlever "SLIDE — "
      .trim()
    
    console.log('🔍 Searching for section:', { original: itemTitle, normalized: normalizedItemTitle })
    
    // Essayer d'abord une correspondance exacte
    let matchingSection = sections.find(section => {
      const sectionTitle = section.title.trim()
      return sectionTitle === itemTitle || sectionTitle === normalizedItemTitle
    })
    
    if (!matchingSection) {
      // Essayer avec une correspondance partielle (insensible à la casse)
      const itemTitleLower = normalizedItemTitle.toLowerCase().trim()
      matchingSection = sections.find(section => {
        const sectionTitleLower = section.title.toLowerCase().trim()
        // Correspondance exacte (normalisée)
        if (sectionTitleLower === itemTitleLower) return true
        // L'un contient l'autre
        if (sectionTitleLower.includes(itemTitleLower) || itemTitleLower.includes(sectionTitleLower)) {
          // Vérifier que la correspondance est significative (au moins 5 caractères)
          const minLength = Math.min(sectionTitleLower.length, itemTitleLower.length)
          if (minLength >= 5) return true
        }
        return false
      })
    }
    
    if (matchingSection) {
      console.log('✅ Matching section found:', matchingSection.title)
      setScriptSection(matchingSection)
    } else {
      console.log('❌ No matching section found for:', itemTitle)
      console.log('📋 Available titles:', sections.map(s => s.title))
      console.log('💡 Tip: The section title must match the item title exactly or be very similar')
      // Essayer aussi de chercher par item_id dans les sections (si disponible)
      // Note: les sections chargées depuis Supabase n'ont pas itemId dans le format ScriptSection
      // mais on peut vérifier si une section correspond à l'item en comparant les titres normalisés
    }
  }

  const fetchItem = async () => {
    try {
      setError('')

      // Récupérer l'item avec vérification d'accès
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select(`
          *,
          modules (
            course_id,
            courses (
              id,
              title,
              access_type,
              status,
              created_by
            )
          )
        `)
        .eq('id', itemId)
        .eq('published', true)
        .single()

      if (itemError) throw itemError

      // Vérifier l'accès à la formation (seulement si pas admin)
      const courseId = itemData.modules?.courses?.id
      const courseData = itemData.modules?.courses
      
      // Stocker courseId pour le script formateur
      const currentCourseId = courseId
      
      if (courseId && profile?.role !== 'admin' && user?.id && courseData) {
        // Vérifier si l'utilisateur est le créateur de la formation
        if (courseData.created_by === user.id) {
          // Le créateur a toujours accès
        }
        // Vérifier si la formation est gratuite et publiée
        else if (courseData.access_type === 'free' && courseData.status === 'published') {
          // Les formations gratuites et publiées sont accessibles à tous
          // Créer automatiquement un enrollment si nécessaire
          const { data: existingEnrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle()

          if (!existingEnrollment) {
            // Créer automatiquement l'enrollment pour les formations gratuites
            await supabase
              .from('enrollments')
              .insert({
                user_id: user.id,
                course_id: courseId,
                status: 'active',
                source: 'manual'
              })
          }
        }
        // Pour les autres cas, vérifier l'enrollment direct OU via un programme
        else {
          // Vérifier d'abord l'enrollment direct
          const { data: accessCheck, error: accessError } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .eq('status', 'active')
            .maybeSingle()

          // Si pas d'inscription directe, vérifier via un programme
          if (accessError || !accessCheck) {
            // Vérifier si l'utilisateur a accès via un programme
            const { data: programCourses } = await supabase
              .from('program_courses')
              .select('program_id')
              .eq('course_id', courseId)

            if (programCourses && programCourses.length > 0) {
              const programIds = programCourses.map(pc => pc.program_id)
              const { data: programAccess } = await supabase
                .from('program_enrollments')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .in('program_id', programIds)
                .maybeSingle()

              if (!programAccess) {
                setError('Vous n\'avez pas accès à cet élément.')
                setLoading(false)
                return
              }
            } else {
              // Pas de programme contenant cette formation
              setError('Vous n\'avez pas accès à cet élément.')
              setLoading(false)
              return
            }
          }
        }
      }

      setItem(itemData)

      // Récupérer tous les items du cours pour la navigation
      if (courseId) {
        // Récupérer tous les modules du cours
        const { data: modulesData } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', courseId)
          .order('position', { ascending: true })

        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map(m => m.id)
          
          // Récupérer tous les items publiés de ces modules
          const { data: allItemsData } = await supabase
            .from('items')
            .select('id, title, type, position, module_id')
            .in('module_id', moduleIds)
            .eq('published', true)
            .order('position', { ascending: true })

          if (allItemsData) {
            // Trier par module puis par position
            const sortedItems = allItemsData.sort((a, b) => {
              const moduleAIndex = moduleIds.indexOf(a.module_id)
              const moduleBIndex = moduleIds.indexOf(b.module_id)
              if (moduleAIndex !== moduleBIndex) {
                return moduleAIndex - moduleBIndex
              }
              return a.position - b.position
            })

            setCourseItems(sortedItems)
            
            // Trouver l'index de l'item actuel
            const currentIndex = sortedItems.findIndex(i => i.id === itemId)
            setCurrentItemIndex(currentIndex)
          }
        }
      }

      // Récupérer la soumission existante si c'est un exercice ou TP
      if ((itemData.type === 'exercise' || itemData.type === 'tp') && user?.id) {
        const { data: submissionData } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .single()

        setSubmission(submissionData)
      }

      // Le script sera chargé par le useEffect séparé quand le profil sera disponible
      // Pas besoin de le charger ici
    } catch (error) {
      console.error('Error fetching item:', error)
      setError('Erreur lors du chargement de l\'élément.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Élément non trouvé'}
          </h2>
          <Link to="/app" className="btn-primary">
            Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Flèches de navigation latérales pour les slides */}
      {courseItems.length > 1 && item.type === 'slide' && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (currentItemIndex > 0 && courseItems.length > 0) {
                const prevItem = courseItems[currentItemIndex - 1]
                if (prevItem?.id) {
                  setLoading(true)
                  navigate(`/items/${prevItem.id}`, { replace: false })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }
            }}
            disabled={currentItemIndex <= 0 || loading}
            className={`fixed left-6 top-1/2 -translate-y-1/2 z-30 group pointer-events-auto transition-all duration-300 ${
              currentItemIndex <= 0 || loading ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110'
            }`}
            aria-label="Slide précédente"
            title={currentItemIndex > 0 ? courseItems[currentItemIndex - 1]?.title : 'Première slide'}
          >
            <div className={`flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full backdrop-blur-lg border-2 transition-all duration-300 shadow-2xl ${
              currentItemIndex <= 0
                ? 'bg-gray-200/50 border-gray-300/50'
                : 'bg-blue-600/90 border-blue-500/50 hover:bg-blue-700/90 hover:border-blue-400/70 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] active:scale-95'
            }`}>
              <ChevronLeft className={`w-8 h-8 md:w-10 md:h-10 text-white transition-transform duration-300 ${
                currentItemIndex > 0 ? 'group-hover:translate-x-[-3px]' : ''
              } drop-shadow-lg`} />
            </div>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (currentItemIndex < courseItems.length - 1 && courseItems.length > 0) {
                const nextItem = courseItems[currentItemIndex + 1]
                if (nextItem?.id) {
                  setLoading(true)
                  navigate(`/items/${nextItem.id}`, { replace: false })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }
            }}
            disabled={currentItemIndex >= courseItems.length - 1 || loading}
            className={`fixed right-6 top-1/2 -translate-y-1/2 z-30 group pointer-events-auto transition-all duration-300 ${
              currentItemIndex >= courseItems.length - 1 || loading ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110'
            }`}
            aria-label="Slide suivante"
            title={currentItemIndex < courseItems.length - 1 ? courseItems[currentItemIndex + 1]?.title : 'Dernière slide'}
          >
            <div className={`flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full backdrop-blur-lg border-2 transition-all duration-300 shadow-2xl ${
              currentItemIndex >= courseItems.length - 1
                ? 'bg-gray-200/50 border-gray-300/50'
                : 'bg-blue-600/90 border-blue-500/50 hover:bg-blue-700/90 hover:border-blue-400/70 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] active:scale-95'
            }`}>
              <ChevronRight className={`w-8 h-8 md:w-10 md:h-10 text-white transition-transform duration-300 ${
                currentItemIndex < courseItems.length - 1 ? 'group-hover:translate-x-[3px]' : ''
              } drop-shadow-lg`} />
            </div>
          </button>
        </>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="w-full mx-auto">
          <ResizableContainer storageKey="item-view-width" defaultWidth={95} minWidth={60} maxWidth={100}>
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center space-x-4 flex-1">
                  <Link
                    to={`/courses/${item.modules?.courses?.id}`}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    ← Retour à la formation
                  </Link>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
                    <p className="text-sm text-gray-600">
                      Formation: {item.modules?.courses?.title}
                    </p>
                  </div>
                </div>
                
                {/* Navigation entre slides - Flèches modernes et visibles */}
                {courseItems.length > 1 && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (currentItemIndex > 0 && courseItems.length > 0) {
                          const prevItem = courseItems[currentItemIndex - 1]
                          if (prevItem?.id) {
                            setLoading(true)
                            navigate(`/items/${prevItem.id}`, { replace: false })
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }
                        }
                      }}
                      disabled={currentItemIndex <= 0 || loading}
                      className={`group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 shadow-lg ${
                        currentItemIndex <= 0 || loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 active:scale-95 hover:shadow-xl'
                      }`}
                      title={currentItemIndex > 0 ? courseItems[currentItemIndex - 1]?.title : 'Première slide'}
                    >
                      <ChevronLeft className={`w-6 h-6 ${currentItemIndex > 0 ? 'group-hover:translate-x-[-2px]' : ''} transition-transform duration-300`} />
                    </button>
                    <div className="flex flex-col items-center min-w-[60px]">
                      <span className="text-sm font-semibold text-gray-900">
                        {currentItemIndex + 1} / {courseItems.length}
                      </span>
                      <span className="text-xs text-gray-500">
                        {courseItems[currentItemIndex]?.type === 'slide' ? 'Slide' : 'Élément'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (currentItemIndex < courseItems.length - 1 && courseItems.length > 0) {
                          const nextItem = courseItems[currentItemIndex + 1]
                          if (nextItem?.id) {
                            setLoading(true)
                            navigate(`/items/${nextItem.id}`, { replace: false })
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }
                        }
                      }}
                      disabled={currentItemIndex >= courseItems.length - 1 || loading}
                      className={`group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 shadow-lg ${
                        currentItemIndex >= courseItems.length - 1 || loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 active:scale-95 hover:shadow-xl'
                      }`}
                      title={currentItemIndex < courseItems.length - 1 ? courseItems[currentItemIndex + 1]?.title : 'Dernière slide'}
                    >
                      <ChevronRight className={`w-6 h-6 ${currentItemIndex < courseItems.length - 1 ? 'group-hover:translate-x-[2px]' : ''} transition-transform duration-300`} />
                    </button>
                  </div>
                )}
                
                {profile?.role === 'admin' && (
                  <Link
                    to={`/admin/items/${item.id}/edit`}
                    className="btn-secondary text-sm ml-4"
                  >
                    Modifier
                  </Link>
                )}
              </div>
            </div>
          </ResizableContainer>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full py-6">
        <div className="w-full mx-auto">
          <ResizableContainer storageKey="item-view-width" defaultWidth={95} minWidth={60} maxWidth={100}>
            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* Détecter si c'est le lexique */}
          {item.title.toLowerCase().includes('lexique') || item.content?.isLexique ? (
            <div className="bg-white rounded-lg shadow">
              <Lexique />
            </div>
          ) : (
            <>
              {/* Contenu principal de l'item - seulement si le body est substantiel (pas juste une description courte) */}
              {item.content?.body && item.type !== 'game' && item.type !== 'slide' && hasSubstantialBody(item.content.body) && (
                <div className="bg-white rounded-lg shadow p-6 lg:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Contenu</h2>
                  <RichTextEditor
                    content={item.content.body}
                    onChange={() => {}} // Lecture seule
                    editable={false}
                  />
                </div>
              )}

              {/* Chapitres */}
              <div className="bg-white rounded-lg shadow p-6 lg:p-8">
                <ChapterViewer itemId={item.id} />
              </div>

              {/* Contenu spécifique selon le type (exercices, TP, slides, etc.) */}
              <div className="bg-white rounded-lg shadow p-6 lg:p-8">
                <ItemRenderer
                  item={item}
                  submission={submission}
                  onSubmissionUpdate={setSubmission}
                />
              </div>

              {/* Script formateur pour les slides (visible uniquement pour les formateurs/admins) */}
              {(item.type === 'slide' || item.type === 'resource') && 
               (profile?.role === 'admin' || profile?.role === 'trainer' || profile?.role === 'instructor') && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg shadow p-6 lg:p-8 mt-6">
                  {(() => {
                    console.log('🎭 Rendering script section:', {
                      hasScriptSection: !!scriptSection,
                      scriptSectionTitle: scriptSection?.title,
                      itemType: item.type,
                      itemTitle: item.title,
                      itemId: item.id,
                      userRole: profile?.role
                    })
                    return null
                  })()}
                  {scriptSection ? (
                    <>
                      <button
                        onClick={() => setShowScript(!showScript)}
                        className="w-full flex items-center justify-between text-left mb-4"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <h2 className="text-xl font-bold text-purple-900">
                            Script formateur
                          </h2>
                        </div>
                        {showScript ? (
                          <ChevronUp className="w-5 h-5 text-purple-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-purple-600" />
                        )}
                      </button>

                      {showScript && (
                    <div className="space-y-4">
                      {/* Contenu principal */}
                      {scriptSection.content && (
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <h3 className="font-semibold text-purple-900 mb-2">Contenu à présenter</h3>
                          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {scriptSection.content}
                          </div>
                        </div>
                      )}

                      {/* Points clés */}
                      {scriptSection.keyPoints && scriptSection.keyPoints.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Target className="w-4 h-4 text-purple-600" />
                            <h3 className="font-semibold text-purple-900">Points clés</h3>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {scriptSection.keyPoints.map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Arguments */}
                      {scriptSection.arguments && scriptSection.arguments.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-purple-600" />
                            <h3 className="font-semibold text-purple-900">Arguments</h3>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {scriptSection.arguments.map((arg, idx) => (
                              <li key={idx}>{arg}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Sources */}
                      {scriptSection.sources && scriptSection.sources.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <BookOpen className="w-4 h-4 text-purple-600" />
                            <h3 className="font-semibold text-purple-900">Sources</h3>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {scriptSection.sources.map((source, idx) => (
                              <li key={idx}>{source}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Questions */}
                      {scriptSection.questions && scriptSection.questions.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-purple-600" />
                            <h3 className="font-semibold text-purple-900">Questions à poser</h3>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {scriptSection.questions.map((question, idx) => (
                              <li key={idx}>{question}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Exemples */}
                      {scriptSection.examples && scriptSection.examples.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-purple-600" />
                            <h3 className="font-semibold text-purple-900">Exemples</h3>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {scriptSection.examples.map((example, idx) => (
                              <li key={idx}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-purple-700 text-sm font-medium">
                        Aucun script formateur trouvé pour cette slide
                      </p>
                      <p className="text-purple-600 text-xs mt-2">
                        Le script sera disponible après avoir été généré et sauvegardé dans la vue script du cours.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
            </div>
          </ResizableContainer>
        </div>
      </main>
    </div>
  )
}
