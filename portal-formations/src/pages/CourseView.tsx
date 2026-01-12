import { useEffect, useState, useLayoutEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { isAuthError } from '../lib/supabaseHelpers'
import { Course, Module, Item, CourseAllTp, TpBatchWithItems } from '../types/database'
import { CourseFeaturesTiles } from '../components/CourseFeaturesTiles'
import { Progress } from '../components/Progress'
import { ReactRenderer } from '../components/ReactRenderer'
import { CourseSidebar } from '../components/CourseSidebar'
import { ResizableSidebar } from '../components/ResizableSidebar'
import { CourseJson } from '../types/courseJson'
import { Eye, EyeOff, X, BookOpen, FileText, Download, Menu, List } from 'lucide-react'
import { Lexique } from './Lexique'
import { getCurrentUserRole } from '../lib/queries/userRole'
import { CourseResourcesViewer } from '../components/CourseResourcesViewer'

interface ModuleWithItems extends Module {
  items: Item[]
}

export function CourseView() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithItems[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [courseJson, setCourseJson] = useState<CourseJson | null>(null)
  const [directTps, setDirectTps] = useState<CourseAllTp[]>([])
  const [tpBatches, setTpBatches] = useState<TpBatchWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showHeaderContent, setShowHeaderContent] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Par défaut fermée
  // Le lexique est ouvert par défaut en mode desktop, fermé en mode mobile
  const [lexiqueDrawerOpen, setLexiqueDrawerOpen] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isTrainer, setIsTrainer] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [courseViewMode, setCourseViewMode] = useState<'all' | 'module'>('all') // 'all' = tout à la suite, 'module' = un module à la fois
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null)
  const viewMode = searchParams.get('view')

  // Détecter si on est sur desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])
  
  // Vérifier si le cours contient un lexique
  const hasLexique = courseJson?.modules
    ?.flatMap(m => m.items || [])
    ?.some(item => item.title?.toLowerCase().includes('lexique') || item.content?.isLexique) || false

  // Obtenir la couleur dominante d'un module basée sur les types d'items
  const getModuleColor = (module: any) => {
    if (!module || !module.items) return 'bg-gray-500'
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

  // Filtrer les modules pour exclure ceux sans items publiés
  const visibleModules = courseJson?.modules?.filter((module, index) => {
    const lexiqueItem = courseJson.modules
      ?.flatMap(m => m.items || [])
      ?.find(item => item.title?.toLowerCase().includes('lexique') || item.content?.isLexique)
    
    const moduleItems = lexiqueItem 
      ? (module.items || []).filter(item => 
          !(item.title?.toLowerCase().includes('lexique') || item.content?.isLexique) && item.published !== false
        )
      : (module.items || []).filter(item => item.published !== false)
    
    return moduleItems.length > 0
  }) || []

  // Debug: log pour vérifier la détection du lexique
  useEffect(() => {
    if (courseJson) {
      console.log('Course JSON:', courseJson)
      console.log('Has Lexique:', hasLexique)
      console.log('Modules:', courseJson.modules)
      courseJson.modules?.forEach((m, idx) => {
        console.log(`Module ${idx}:`, m.title, 'Items:', m.items?.map(i => i.title))
      })
    }
  }, [courseJson, hasLexique])


  useEffect(() => {
    if (courseId && user) {
      fetchCourse()
      
      // Vérifier si l'utilisateur vient d'un magic link et doit être inscrit automatiquement
      const autoEnroll = searchParams.get('auto_enroll')
      if (autoEnroll === 'true' && courseId) {
        handleAutoEnrollment()
      }
    }
  }, [courseId, user, searchParams])

  const handleAutoEnrollment = async () => {
    if (!user || !courseId) return
    
    try {
      // Créer le profil si nécessaire
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (!existingProfile) {
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur'
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            role: 'student',
            full_name: fullName,
            is_active: true
          }, {
            onConflict: 'id'
          })
      }
      
      // Créer l'inscription à la formation
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          source: 'manual'
        }, {
          onConflict: 'user_id,course_id'
        })
      
      if (enrollmentError) {
        console.warn('Erreur lors de l\'inscription automatique:', enrollmentError)
      } else {
        console.log('Inscription automatique réussie pour le cours:', courseId)
        // Nettoyer le paramètre de l'URL
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.delete('auto_enroll')
        window.history.replaceState({}, '', `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription automatique:', error)
    }
  }

  // Vérifier si l'utilisateur est formateur
  useEffect(() => {
    async function checkTrainerRole() {
      if (user) {
        const roleContext = await getCurrentUserRole()
        setIsTrainer(roleContext.role === 'trainer' || roleContext.role === 'admin')
      }
    }
    checkTrainerRole()
  }, [user])

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!courseId) {
      alert('ID du cours manquant');
      return;
    }
    
    setDownloadingPdf(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const fullUrl = `${apiUrl}/api/courses/${courseId}/pdf`;
      
      console.log('📥 Début du téléchargement PDF...');
      console.log('URL API:', apiUrl);
      console.log('URL complète:', fullUrl);
      
      // Récupérer le token d'authentification
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erreur lors de la récupération de la session:', sessionError);
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (!sessionData?.session?.access_token) {
        console.error('Aucun token d\'authentification disponible');
        throw new Error('Vous devez être connecté pour télécharger le PDF.');
      }
      
      console.log('Token d\'authentification récupéré');
      
      // Faire la requête
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Réponse reçue:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        // Essayer de récupérer le message d'erreur
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('Erreur détaillée:', errorData);
        } catch (e) {
          // Si ce n'est pas du JSON, essayer de récupérer le texte
          try {
            const errorText = await response.text();
            console.error('Erreur (texte):', errorText);
            if (errorText) errorMessage = errorText;
          } catch (e2) {
            console.error('Impossible de lire la réponse d\'erreur');
          }
        }
        
        // Messages d'erreur spécifiques
        if (response.status === 404) {
          errorMessage = 'Cours non trouvé. Vérifiez que le cours existe.';
        } else if (response.status === 403) {
          errorMessage = 'Le téléchargement PDF n\'est pas activé pour ce cours.';
        } else if (response.status === 500) {
          errorMessage = 'Erreur serveur. Vérifiez que le serveur backend est démarré et que Puppeteer est installé.';
        } else if (response.status === 0 || response.type === 'opaque') {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré sur ' + apiUrl;
        }
        
        throw new Error(errorMessage);
      }

      console.log('Téléchargement du blob...');
      const blob = await response.blob();
      console.log('Blob reçu, taille:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Le PDF généré est vide. Vérifiez les logs du serveur.');
      }
      
      // Vérifier que c'est bien un PDF
      if (!blob.type.includes('pdf') && !blob.type.includes('application/octet-stream')) {
        console.warn('Type MIME inattendu:', blob.type);
        // Essayer quand même de télécharger
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${course?.title?.replace(/[^a-z0-9]/gi, '_') || 'cours'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ PDF téléchargé avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors du téléchargement du PDF:', error);
      console.error('Détails:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = 'Erreur lors du téléchargement';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
        errorMessage = 'Impossible de se connecter au serveur backend. Vérifiez que:\n' +
          '1. Le serveur backend est démarré (npm run dev:server dans le dossier server/)\n' +
          '2. L\'URL de l\'API est correcte dans les variables d\'environnement\n' +
          '3. Il n\'y a pas de problème CORS';
      } else if (error.name === 'AbortError') {
        errorMessage = 'La requête a expiré. Le serveur prend trop de temps à répondre.';
      }
      
      alert(`Erreur lors du téléchargement:\n${errorMessage}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fetchCourse = async () => {
    try {
      setError('')

      // Récupérer les détails de la formation
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) {
        if (isAuthError(courseError)) {
          setError('Session expirée. Veuillez vous reconnecter.')
          return
        }
        throw courseError
      }

      // Vérifier l'accès à la formation (seulement si pas admin)
      if (profile?.role !== 'admin' && user?.id && courseData) {
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
                setError('Vous n\'avez pas accès à cette formation.')
                setLoading(false)
                return
              }
            } else {
              // Pas de programme contenant cette formation
              setError('Vous n\'avez pas accès à cette formation.')
              setLoading(false)
              return
            }
          }
        }
      }
      setCourse(courseData)

      // Continuer le chargement même si on a créé un enrollment

      // Vérifier d'abord l'accès au cours pour optimiser les policies RLS
      // Cela permet à Supabase de mieux optimiser les requêtes suivantes
      const { data: courseAccessCheck } = await supabase
        .from('courses')
        .select('id, status, access_type, created_by')
        .eq('id', courseId)
        .single()

      if (!courseAccessCheck) {
        setError('Formation introuvable.')
        setLoading(false)
        return
      }

      // Récupérer les modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position', { ascending: true })

      if (modulesError) {
        if (isAuthError(modulesError)) {
          setError('Session expirée. Veuillez vous reconnecter.')
          return
        }
        throw modulesError
      }

      // Récupérer les items séparément pour éviter les problèmes RLS avec les jointures
      let allItemsMap = new Map<string, Item[]>()
      
      if (modulesData && modulesData.length > 0) {
        const moduleIds = modulesData.map(m => m.id)
        
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .in('module_id', moduleIds)
          .order('position', { ascending: true })

        if (itemsError) {
          console.error('Error fetching items:', itemsError)
          console.error('  - Error code:', itemsError.code)
          console.error('  - Error message:', itemsError.message)
          console.error('  - Error details:', itemsError.details)
          
          if (isAuthError(itemsError)) {
            setError('Session expirée. Veuillez vous reconnecter.')
            return
          } else if (itemsError.code === '57014' || itemsError.message?.includes('timeout')) {
            console.error('⚠️ Timeout SQL détecté lors du chargement des items!')
            console.error('Solution: Exécutez le script optimize-all-policies-performance.sql dans Supabase')
            setError('Le chargement prend trop de temps. Les politiques RLS doivent être optimisées.')
            return
          } else if (itemsError.code === 'PGRST301' || itemsError.message?.includes('permission')) {
            console.error('⚠️ Problème de permissions RLS détecté!')
            setError('Erreur de permissions lors du chargement des items.')
            return
          }
          // Pour les autres erreurs, continuer mais sans items
          console.warn('Continuing without items due to error')
        } else if (itemsData) {
          // Grouper les items par module_id
          itemsData.forEach(item => {
            if (!allItemsMap.has(item.module_id)) {
              allItemsMap.set(item.module_id, [])
            }
            allItemsMap.get(item.module_id)!.push(item)
          })
        }
      }

      // Trier les items dans chaque module
      const sortedModules = (modulesData || []).map(module => ({
        ...module,
        items: (allItemsMap.get(module.id) || []).sort((a: Item, b: Item) => a.position - b.position)
      }))

      console.log('Modules data:', sortedModules)
      console.log('Items count:', sortedModules.reduce((acc, m) => acc + (m.items?.length || 0), 0))
      sortedModules.forEach((module, idx) => {
        console.log(`Module ${idx} (${module.title}):`, module.items?.length || 0, 'items')
        module.items?.forEach((item, itemIdx) => {
          console.log(`  Item ${itemIdx}:`, item.title, 'type:', item.type, 'published:', item.published, 'has content:', !!item.content)
        })
      })

      setModules(sortedModules)

      // Collecter tous les items pour les tuiles
      const allItemsList = sortedModules.flatMap(module => module.items || [])
      setAllItems(allItemsList)

      // Récupérer tous les chapitres pour tous les items
      const allItemIds = allItemsList.map(item => item.id)
      let chaptersMap = new Map<string, any[]>()
      
      console.log('=== Fetching chapters ===')
      console.log('Items count:', allItemIds.length)
      console.log('Item IDs:', allItemIds)
      console.log('User ID:', user?.id)
      console.log('User role:', profile?.role)
      
      if (allItemIds.length > 0) {
        // Construire la requête - gérer le cas où published n'existe pas
        let chaptersQuery = supabase
          .from('chapters')
          .select('*')
          .in('item_id', allItemIds)
        
        let chaptersData: any[] | null = null
        let chaptersError: any = null
        
        // Essayer avec le filtre published d'abord
        if (profile?.role !== 'admin') {
          try {
            const result = await chaptersQuery.eq('published', true).order('position', { ascending: true })
            chaptersData = result.data
            chaptersError = result.error
          } catch (err: any) {
            chaptersError = err
          }
          
          // Si l'erreur est due à la colonne published manquante, réessayer sans filtre
          if (chaptersError && (chaptersError.code === '42703' || chaptersError.message?.includes('published'))) {
            console.warn('Colonne published non disponible pour chapters, récupération de tous les chapitres')
            const retryResult = await supabase
              .from('chapters')
              .select('*')
              .in('item_id', allItemIds)
              .order('position', { ascending: true })
            
            chaptersData = retryResult.data
            chaptersError = retryResult.error
          }
        } else {
          // Admin : pas de filtre
          const result = await chaptersQuery.order('position', { ascending: true })
          chaptersData = result.data
          chaptersError = result.error
        }

        console.log('Chapters query result:')
        console.log('  - Data:', chaptersData)
        console.log('  - Data length:', chaptersData?.length || 0)
        console.log('  - Error:', chaptersError)
        console.log('  - Error code:', chaptersError?.code)
        console.log('  - Error message:', chaptersError?.message)
        console.log('  - Error details:', chaptersError?.details)
        console.log('  - Error hint:', chaptersError?.hint)

        if (chaptersError) {
          console.error('❌ Error fetching chapters:', chaptersError)
          // Afficher plus de détails sur l'erreur
          if (chaptersError.code === 'PGRST301' || chaptersError.message?.includes('permission')) {
            console.error('⚠️ Problème de permissions RLS détecté!')
            console.error('Vérifiez que la policy "Chapters viewable with item access" inclut l\'accès via programmes')
          } else if (chaptersError.code === '57014' || chaptersError.message?.includes('timeout')) {
            console.error('⚠️ Timeout SQL détecté! La policy RLS est trop lente.')
            console.error('Solution: Exécutez le script fix-chapters-policy-performance.sql dans Supabase')
            console.error('Ce script optimise la policy en utilisant des fonctions SQL réutilisables')
          }
        } else {
          console.log('✅ Chapters fetched successfully')
        }

        if (chaptersData) {
          console.log('Processing chapters data...')
          // Filtrer les chapitres non publiés si l'utilisateur n'est pas admin
          // Si published n'existe pas, on considère tous les chapitres comme publiés
          const visibleChapters = profile?.role === 'admin' 
            ? chaptersData 
            : chaptersData.filter((ch: any) => ch.published !== false)
          
          visibleChapters.forEach((ch, idx) => {
            if (!chaptersMap.has(ch.item_id)) {
              chaptersMap.set(ch.item_id, [])
            }
            chaptersMap.get(ch.item_id)!.push({
              title: ch.title,
              position: ch.position,
              content: ch.content || undefined,
              type: ch.type || 'content',
              game_content: ch.game_content || undefined
            })
            console.log(`  Chapter ${idx + 1}: item_id=${ch.item_id}, title="${ch.title}", position=${ch.position}, published=${ch.published}`)
          })
          
          console.log('Chapters map summary:')
          const mapSummary = Array.from(chaptersMap.entries()).map(([itemId, chaps]) => ({
            itemId,
            chaptersCount: chaps.length,
            titles: chaps.map(c => c.title)
          }))
          console.log('  Total items with chapters:', mapSummary.length)
          mapSummary.forEach(summary => {
            console.log(`  - Item ${summary.itemId}: ${summary.chaptersCount} chapters`)
          })
          console.log('=== End chapters fetch ===')
        } else {
          console.log('⚠️ No chapters data returned (chaptersData is null/undefined)')
          console.log('=== End chapters fetch ===')
        }
      }

      // Construire le CourseJson pour ReactRenderer
      const courseJsonData: CourseJson = {
        title: courseData.title,
        description: courseData.description || '',
        status: courseData.status as 'draft' | 'published',
        access_type: courseData.access_type as 'free' | 'paid' | 'invite',
        price_cents: courseData.price_cents || undefined,
        currency: courseData.currency || undefined,
        modules: sortedModules.map(module => ({
          title: module.title,
          position: module.position,
          items: module.items.map((item: Item) => {
            const itemChapters = chaptersMap.get(item.id) || undefined
            console.log(`Item ${item.title} (${item.type}):`, {
              hasChapters: !!itemChapters,
              chaptersCount: itemChapters?.length || 0,
              hasAssetPath: !!item.asset_path,
              hasContentBody: !!item.content?.body,
              hasContentQuestion: !!item.content?.question,
              hasContentDescription: !!item.content?.description,
              contentKeys: item.content ? Object.keys(item.content) : [],
              fullContent: item.content
            })
            return {
              id: item.id, // Inclure l'ID pour les liens
              type: item.type as 'resource' | 'slide' | 'exercise' | 'tp' | 'game',
              title: item.title,
              position: item.position,
              published: item.published,
              content: item.content || {},
              asset_path: item.asset_path || undefined,
              external_url: item.external_url || undefined,
              chapters: itemChapters
            }
          })
        }))
      }
      
      console.log('CourseJson created with chapters:', courseJsonData.modules.map(m => ({
        module: m.title,
        items: m.items.map(i => ({
          title: i.title,
          type: i.type,
          chaptersCount: i.chapters?.length || 0
        }))
      })))

      setCourseJson(courseJsonData)

      // Récupérer les TP associés directement et les lots de TP
      await fetchCourseTpsAndBatches()
    } catch (error: any) {
      console.error('Error fetching course:', error)
      if (isAuthError(error)) {
        setError('Session expirée. Veuillez vous reconnecter.')
      } else if (error?.message?.includes('timeout')) {
        setError('Le chargement prend trop de temps. Vérifiez votre connexion Internet.')
      } else {
        setError('Erreur lors du chargement de la formation.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseTpsAndBatches = async () => {
    if (!courseId) return

    try {
      // Récupérer tous les TP du cours (vue unifiée)
      const { data: allTpsData, error: tpsError } = await supabase
        .from('course_all_tps')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_visible', true)
        .order('position_in_course', { ascending: true })

      if (tpsError) {
        console.error('Error fetching course TPs:', tpsError)
      } else {
        // Filtrer les TP associés directement
        const direct = (allTpsData || []).filter(tp => tp.source_type === 'direct')
        setDirectTps(direct)
      }

      // Récupérer les lots de TP du cours
      const { data: batchesData, error: batchesError } = await supabase
        .from('tp_batches')
        .select(`
          *,
          tp_batch_items (
            *,
            items!tp_batch_items_item_id_fkey (*),
            prerequisite_items:items!tp_batch_items_prerequisite_item_id_fkey (*)
          )
        `)
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('position', { ascending: true })

      if (batchesError) {
        console.error('Error fetching TP batches:', batchesError)
      } else {
        setTpBatches((batchesData || []) as TpBatchWithItems[])
      }
    } catch (error) {
      console.error('Error fetching course TPs and batches:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Formation non trouvée'}
          </h2>
          <Link to="/app" className="btn-primary">
            Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 course-view-container" style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <header className="bg-white shadow" style={{ zIndex: 40 }}>
        <div className="w-full">
          <div 
            className="flex justify-between items-center py-4 px-4 transition-all duration-300"
            style={{
              marginLeft: viewMode !== 'progress' && courseJson && sidebarOpen && isDesktop
                ? 'var(--sidebar-width, 256px)'
                : viewMode !== 'progress' && courseJson && sidebarOpen && !isDesktop
                  ? 'var(--sidebar-width, 256px)' 
                  : '0',
              width: viewMode !== 'progress' && courseJson && sidebarOpen && isDesktop
                ? `calc(100% - var(--sidebar-width, 256px))`
                : '100%'
            }}
          >
            <div className="flex items-center space-x-4 flex-1">
              <Link
                to="/app"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour
              </Link>
            </div>
            <div className="flex-1 flex justify-center min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{course.title}</h1>
            </div>
            <div className="flex items-center space-x-2 flex-1 justify-end flex-wrap gap-2">
              {/* Boutons d'action principaux - rangée horizontale */}
              <div className="flex items-center space-x-2">
                {/* Voir la progression */}
                {viewMode !== 'progress' ? (
                  <Link
                    to={`/courses/${courseId}?view=progress`}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <span>Voir la progression</span>
                  </Link>
                ) : (
                  <Link
                    to={`/courses/${courseId}`}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <span>Retour au contenu</span>
                  </Link>
                )}

                {/* Script (formateurs uniquement) */}
                {isTrainer && viewMode !== 'progress' && (
                  <Link
                    to={`/trainer/courses/${course.id}/script`}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    title="Voir le script pédagogique seul"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Script</span>
                  </Link>
                )}

                {/* Script + Cours (formateurs uniquement) */}
                {isTrainer && viewMode !== 'progress' && (
                  <Link
                    to={`/trainer/courses/${course.id}/script?split=true`}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                    title="Voir le cours et le script côte à côte"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Script + Cours</span>
                  </Link>
                )}

                {/* Modifier (admins uniquement) */}
                {profile?.role === 'admin' && (
                  <Link
                    to={`/admin/courses/${course.id}`}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <span>Modifier</span>
                  </Link>
                )}

                {/* Masquer/Afficher */}
                <button
                  onClick={() => setShowHeaderContent(!showHeaderContent)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  title={showHeaderContent ? 'Masquer le contenu' : 'Afficher le contenu'}
                >
                  {showHeaderContent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span>{showHeaderContent ? 'Masquer' : 'Afficher'}</span>
                </button>
              </div>

              {/* Boutons secondaires (PDF, Lexique) */}
              {viewMode !== 'progress' && (
                <div className="flex items-center space-x-2">
                  {course.allow_pdf_download && (
                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Télécharger le cours complet en PDF (format paysage)"
                    >
                      {downloadingPdf ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Génération...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>PDF</span>
                        </>
                      )}
                    </button>
                  )}
                  {hasLexique && (
                    <button
                      onClick={() => setLexiqueDrawerOpen(!lexiqueDrawerOpen)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title={lexiqueDrawerOpen ? 'Fermer le lexique' : 'Ouvrir le lexique'}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Lexique</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content avec sidebar */}
      <main className="w-full flex relative">
        {/* Bouton pour ouvrir/fermer la sidebar */}
        {viewMode !== 'progress' && courseJson && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Bouton sidebar cliqué, sidebarOpen:', sidebarOpen)
              setSidebarOpen(!sidebarOpen)
            }}
            className="fixed z-[60] p-2.5 bg-white rounded-md shadow-lg border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
            style={{
              left: sidebarOpen && isDesktop 
                ? `calc(var(--sidebar-width, 300px) + 1rem)` 
                : '1rem',
              top: '5.5rem',
              pointerEvents: 'auto'
            }}
            title={sidebarOpen ? 'Fermer la table des matières' : 'Ouvrir la table des matières'}
            type="button"
            aria-label={sidebarOpen ? 'Fermer la table des matières' : 'Ouvrir la table des matières'}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <List className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}

        {/* Sidebar avec table des matières */}
        {viewMode !== 'progress' && courseJson && (
          <>
            {/* Overlay pour mobile quand sidebar est ouverte */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            {/* Sidebar redimensionnable et fixe */}
            <div className={`
              fixed lg:sticky top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `} style={{ height: '100vh', zIndex: 50 }}>
              <ResizableSidebar
                storageKey="course-sidebar-width"
                minWidth={200}
                maxWidth={800}
                defaultWidth={300}
                side="left"
                onWidthChange={setSidebarWidth}
              >
                <div className="h-full flex flex-col" style={{ height: '100vh' }}>
                  <CourseSidebar 
                    courseJson={courseJson}
                    onClose={() => setSidebarOpen(false)}
                    sidebarWidth={sidebarWidth}
                    minWidth={200}
                    onModuleSelect={(moduleIndex) => {
                      setCourseViewMode('module')
                      setCurrentModuleIndex(moduleIndex)
                    }}
                    selectedModuleIndex={courseViewMode === 'module' ? currentModuleIndex : null}
                    directTps={directTps}
                    tpBatches={tpBatches}
                  />
                </div>
              </ResizableSidebar>
            </div>
          </>
        )}

        {/* Contenu principal */}
        <div 
          className="flex-1 py-6 transition-all duration-300"
          style={{
            marginLeft: viewMode !== 'progress' && courseJson && sidebarOpen && !isDesktop
              ? 'var(--sidebar-width, 256px)' 
              : '0',
            marginRight: hasLexique && lexiqueDrawerOpen 
              ? '384px' // w-96 = 384px
              : hasLexique 
                ? '0' // Le drawer est présent mais caché
                : '0',
            width: viewMode !== 'progress' && courseJson && sidebarOpen && isDesktop
              ? `calc(100% - var(--sidebar-width, 300px))`
              : '100%'
          }}
        >
          <div className="w-full" style={{
            paddingLeft: viewMode !== 'progress' && courseJson && sidebarOpen && isDesktop
              ? '1rem' 
              : '1rem',
            paddingRight: '1rem'
          }}>
            {/* Vue de progression */}
            {viewMode === 'progress' ? (
              <Progress />
            ) : (
              <>
                {/* Tuiles de fonctionnalités */}
                {showHeaderContent && course && allItems.length > 0 && (
                  <div className="mb-6">
                    <CourseFeaturesTiles 
                      course={course} 
                      items={allItems} 
                      courseId={courseId!} 
                    />
                  </div>
                )}

                {/* Ressources de la formation */}
                {showHeaderContent && courseId && (
                  <CourseResourcesViewer courseId={courseId} />
                )}

                {/* Navigation par module - étiquettes colorées */}
                {courseJson && visibleModules.length > 0 && (
                  <div className="mb-4 flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">Affichage :</span>
                    <button
                      onClick={() => {
                        setCourseViewMode('all')
                        setCurrentModuleIndex(null)
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        courseViewMode === 'all'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tout le cours
                    </button>
                    <span className="text-gray-400">|</span>
                    <div className="flex flex-wrap gap-2">
                      {visibleModules.map((module, index) => {
                        const originalIndex = courseJson.modules.findIndex(m => m.title === module.title)
                        const isActive = courseViewMode === 'module' && currentModuleIndex === originalIndex
                        const moduleColor = getModuleColor(module)
                        
                        return (
                          <button
                            key={originalIndex}
                            onClick={() => {
                              setCourseViewMode('module')
                              setCurrentModuleIndex(originalIndex)
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all ${
                              isActive 
                                ? `${moduleColor} shadow-md ring-2 ring-offset-2 ring-gray-300` 
                                : `${moduleColor} opacity-70 hover:opacity-100`
                            }`}
                            title={module.title}
                          >
                            Module {originalIndex + 1}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Contenu du cours avec ReactRenderer */}
                {courseJson ? (
                  <div className="bg-white shadow rounded-lg p-6">
                    {courseViewMode === 'all' ? (
                      <ReactRenderer courseJson={courseJson} />
                    ) : currentModuleIndex !== null ? (
                      <ReactRenderer 
                        courseJson={{
                          ...courseJson,
                          modules: [courseJson.modules[currentModuleIndex]]
                        }} 
                      />
                    ) : (
                      <ReactRenderer courseJson={courseJson} />
                    )}
                  </div>
                ) : modules.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg">
                      Cette formation ne contient aucun module pour le moment.
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Drawer du lexique à droite */}
      {hasLexique && (
        <>
          {/* Overlay pour mobile quand drawer est ouvert */}
          {lexiqueDrawerOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setLexiqueDrawerOpen(false)}
            />
          )}
          {/* Drawer du lexique */}
          <div className={`
            fixed top-0 right-0 z-50 h-screen transition-transform duration-300 ease-in-out
            ${lexiqueDrawerOpen 
              ? 'translate-x-0' 
              : 'translate-x-full'}
            w-full lg:w-96
          `}>
            <div className="h-full bg-white border-l border-gray-200 shadow-lg flex flex-col">
              {/* Header du drawer */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Lexique</h2>
                </div>
                <button
                  onClick={() => setLexiqueDrawerOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Fermer le lexique"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Contenu du lexique */}
              <div className="flex-1 overflow-y-auto p-4">
                <Lexique />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
