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
import { CourseHomePage } from '../components/CourseHomePage'
import { CourseJson } from '../types/courseJson'
import { Eye, EyeOff, X, BookOpen, FileText, Download, List, ChevronRight, Home, LayoutGrid, ArrowRight, ArrowLeft } from 'lucide-react'
import { Lexique } from './Lexique'
import { getCurrentUserRole } from '../lib/queries/userRole'
import { CourseResourcesViewer } from '../components/CourseResourcesViewer'
import { ResourceViewer } from '../components/ResourceViewer'
import { FillableDocumentsViewer } from '../components/FillableDocumentsViewer'
import { CourseGammaSlides } from '../components/CourseGammaSlides'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { AppHeader } from '../components/AppHeader'
import { useNavigationContext, EnhancedBreadcrumb } from '../components/NavigationContext'

interface ModuleWithItems extends Module {
  items: Item[]
}

export function CourseView() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const { setContext, clearContext } = useNavigationContext()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithItems[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [courseJson, setCourseJson] = useState<CourseJson | null>(null)
  const [directTps, setDirectTps] = useState<CourseAllTp[]>([])
  const [tpBatches, setTpBatches] = useState<TpBatchWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showHeaderContent, setShowHeaderContent] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true) // Par défaut ouverte
  // Le lexique est ouvert par défaut en mode desktop, fermé en mode mobile
  const [lexiqueDrawerOpen, setLexiqueDrawerOpen] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isTrainer, setIsTrainer] = useState(false)
  const [courseViewMode, setCourseViewMode] = useState<'all' | 'module'>('all') // 'all' = tout à la suite, 'module' = un module à la fois
  const [showHomePage, setShowHomePage] = useState(true) // Show homepage overview by default
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null)
  const [moduleProgress, setModuleProgress] = useState<Record<string, { percent: number; completed: boolean }>>({})
  const [hasFillableDocuments, setHasFillableDocuments] = useState<boolean | null>(null)
  const [hasCourseResources, setHasCourseResources] = useState<boolean | null>(null)
  const [hasResources, setHasResources] = useState<boolean | null>(null)
  const [programData, setProgramData] = useState<{ id: string; title: string } | null>(null)
  const [showNextItemButton, setShowNextItemButton] = useState(false)
  const [currentItemId, setCurrentItemId] = useState<string | null>(null)
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null)
  const [detectedModuleId, setDetectedModuleId] = useState<string | null>(null)
  const viewMode = searchParams.get('view')

  // Détecter le module actuellement visible via scroll
  useEffect(() => {
    if (showHomePage || !courseJson || modules.length === 0) {
      // Réinitialiser la détection si on revient à la page d'accueil
      setDetectedModuleId(null)
      return
    }

    const handleScroll = () => {
      // Trouver le module le plus proche du haut de la fenêtre
      let closestModule: { id: string; distance: number } | null = null

      modules.forEach((module, moduleIndex) => {
        // Chercher un élément avec l'ID du module dans le DOM
        // ReactRenderer utilise module-{index} mais on peut aussi chercher par data-module-id
        const moduleElement = document.getElementById(`module-${moduleIndex}`) || 
                             document.querySelector(`[data-module-id="${module.id}"]`) ||
                             document.querySelector(`[id*="module-${module.id}"]`)
        
        if (moduleElement) {
          const rect = moduleElement.getBoundingClientRect()
          // Si le module est visible (même partiellement) et proche du haut
          if (rect.top <= window.innerHeight && rect.bottom >= 0) {
            const distance = Math.abs(rect.top)
            if (!closestModule || distance < closestModule.distance) {
              closestModule = { id: module.id, distance }
            }
          }
        }
      })

      if (closestModule) {
        setDetectedModuleId(closestModule.id)
      } else if (modules.length > 0) {
        // Si aucun module n'est détecté, chercher le dernier module qui a été scrollé
        let lastVisibleId: string | null = null
        for (let i = modules.length - 1; i >= 0; i--) {
          const module = modules[i]
          const moduleElement = document.getElementById(`module-${i}`) || 
                               document.querySelector(`[data-module-id="${module.id}"]`)
          if (moduleElement) {
            const rect = moduleElement.getBoundingClientRect()
            // Si le module est au-dessus du bas de la fenêtre (a été scrollé)
            if (rect.top < window.innerHeight) {
              lastVisibleId = module.id
              break
            }
          }
        }
        // Si toujours rien, prendre le premier module par défaut (on est en haut de page)
        // Ne pas forcer la mise à jour si on n'a rien trouvé (garder la valeur précédente)
        if (lastVisibleId) {
          setDetectedModuleId(lastVisibleId)
        } else if (!detectedModuleId) {
          // Seulement définir le premier module si on n'a jamais détecté de module
          setDetectedModuleId(modules[0].id)
        }
      }
    }

    // Détecter au scroll
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Détecter au chargement avec un petit délai pour laisser le DOM se charger
    const timeoutId = setTimeout(handleScroll, 1000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeoutId)
    }
  }, [showHomePage, courseJson, modules])

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

  // Mettre à jour le contexte de navigation
  useEffect(() => {
    if (course) {
      setContext({
        program: programData ? {
          id: programData.id,
          title: programData.title,
          type: 'program'
        } : undefined,
        course: {
          id: course.id,
          title: course.title,
          type: 'course'
        }
      })
    }

    return () => {
      clearContext()
    }
  }, [course, programData, setContext, clearContext])

  const [downloadingMarkdown, setDownloadingMarkdown] = useState(false);

  const handleDownloadMarkdown = async () => {
    if (!courseId) {
      alert('ID du cours manquant');
      return;
    }
    
    setDownloadingMarkdown(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const fullUrl = `${apiUrl}/api/courses/${courseId}/markdown`;
      
      console.log('📥 Début du téléchargement Markdown...');
      console.log('URL API:', apiUrl);
      console.log('URL complète:', fullUrl);
      
      // Vérifier que l'URL est valide
      if (!apiUrl || apiUrl === ':3001') {
        throw new Error('URL API non configurée. Vérifiez la variable d\'environnement VITE_API_URL ou démarrez le serveur backend sur http://localhost:3001');
      }
      
      // Récupérer le token d'authentification
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erreur lors de la récupération de la session:', sessionError);
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (!sessionData?.session?.access_token) {
        console.error('Aucun token d\'authentification disponible');
        throw new Error('Vous devez être connecté pour télécharger le Markdown.');
      }
      
      console.log('Token d\'authentification récupéré');
      
      // Faire la requête avec gestion d'erreur réseau
      let response: Response;
      try {
        response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
        });
      } catch (fetchError: any) {
        // Erreur réseau (connexion refusée, timeout, etc.)
        console.error('❌ Erreur réseau lors de la requête:', fetchError);
        if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error(
            `Impossible de se connecter au serveur backend.\n\n` +
            `Le serveur backend n'est pas démarré ou n'est pas accessible.\n\n` +
            `Pour démarrer le serveur backend :\n` +
            `1. Ouvrez un terminal\n` +
            `2. Allez dans le dossier portal-formations\n` +
            `3. Exécutez : npm run dev:server\n\n` +
            `Ou vérifiez que le serveur est bien démarré sur ${apiUrl}`
          );
        }
        throw new Error(`Erreur réseau : ${fetchError.message || 'Connexion impossible'}`);
      }

      console.log('Réponse reçue:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        // Essayer de récupérer le message d'erreur
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        let errorData: any = null;
        
        try {
          errorData = await response.json();
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
          const details = errorData?.details || '';
          errorMessage = errorData?.error || errorMessage;
          if (details) {
            errorMessage += `\n\nDétails: ${details}`;
          }
        } else if (response.status === 403) {
          errorMessage = errorData?.error || errorMessage;
          if (errorData?.details) {
            errorMessage += `\n\n${errorData.details}`;
          }
        } else if (response.status === 500) {
          // Utiliser le message d'erreur du serveur s'il est disponible
          errorMessage = errorData?.error || errorData?.message || errorMessage;
          if (errorData?.message && errorData.message !== errorMessage) {
            errorMessage += `\n\n${errorData.message}`;
          }
          if (errorData?.details) {
            errorMessage += `\n\nDétails techniques: ${errorData.details}`;
          }
        } else if (response.status === 0 || response.type === 'opaque') {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré sur ' + apiUrl;
        }
        
        throw new Error(errorMessage);
      }

      console.log('Téléchargement du fichier Markdown...');
      const blob = await response.blob();
      console.log('Blob reçu, taille:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Le fichier Markdown généré est vide. Vérifiez les logs du serveur.');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${course?.title?.replace(/[^a-z0-9]/gi, '_') || 'cours'}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Markdown téléchargé avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors du téléchargement du Markdown:', error);
      console.error('Détails:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Afficher un message d'erreur plus clair à l'utilisateur
      const errorMessage = error.message || 'Erreur inconnue lors du téléchargement du Markdown';
      
      // Si c'est une erreur de connexion, afficher un message spécial
      if (errorMessage.includes('Impossible de se connecter') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        alert(
          '🚫 Serveur backend non disponible\n\n' +
          'Le serveur backend n\'est pas démarré.\n\n' +
          'Pour télécharger le Markdown, vous devez démarrer le serveur backend :\n\n' +
          '1. Ouvrez un terminal\n' +
          '2. Allez dans le dossier portal-formations\n' +
          '3. Exécutez : npm run dev:server\n\n' +
          'Le serveur doit être accessible sur http://localhost:3001'
        );
      } else {
        // Afficher l'erreur avec plus de détails
        const fullMessage = errorMessage.length > 500 
          ? errorMessage.substring(0, 500) + '...\n\n(Voir la console pour plus de détails)'
          : errorMessage;
        alert(`Erreur lors du téléchargement du Markdown :\n\n${fullMessage}\n\nConsultez les logs du serveur backend pour plus d'informations.`);
      }
    } finally {
      setDownloadingMarkdown(false);
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
          const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle()

          console.log('Enrollment check:', { existingEnrollment, enrollmentCheckError, courseId, userId: user.id, courseAccessType: courseData.access_type, courseStatus: courseData.status })

          if (!existingEnrollment) {
            // Créer automatiquement l'enrollment pour les formations gratuites
            const { data: newEnrollment, error: enrollmentInsertError } = await supabase
              .from('enrollments')
              .insert({
                user_id: user.id,
                course_id: courseId,
                status: 'active',
                source: 'manual',
                enrolled_at: new Date().toISOString()
              })
              .select()

            console.log('Auto-enrollment created:', { newEnrollment, enrollmentInsertError })
            
            if (enrollmentInsertError) {
              console.error('❌ Error creating enrollment:', enrollmentInsertError)
            } else {
              console.log('✅ Enrollment created successfully:', newEnrollment)
            }
          } else {
            console.log('✅ Enrollment already exists:', existingEnrollment)
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
      console.log('🔍 [CourseView] Récupération des modules pour course_id:', courseId)
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position', { ascending: true })

      console.log('🔍 [CourseView] Résultat de la requête modules:', {
        modulesData,
        modulesCount: modulesData?.length || 0,
        modulesError,
        courseId
      })

      if (modulesError) {
        console.error('❌ [CourseView] Erreur lors de la récupération des modules:', modulesError)
        if (isAuthError(modulesError)) {
          setError('Session expirée. Veuillez vous reconnecter.')
          return
        }
        throw modulesError
      }

      if (modulesData) {
        console.log('✅ [CourseView] Modules récupérés:', modulesData.map(m => ({
          id: m.id,
          title: m.title,
          position: m.position,
          course_id: m.course_id
        })))
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

      // Détecter l'item actuel depuis l'URL (si on vient d'un lien direct)
      const itemIdFromUrl = searchParams.get('itemId')
      if (itemIdFromUrl) {
        setCurrentItemId(itemIdFromUrl)
        // Trouver le module de cet item
        const item = allItemsList.find(i => i.id === itemIdFromUrl)
        if (item) {
          setCurrentModuleId(item.module_id)
          console.log('📍 [CourseView] Module détecté depuis item:', item.module_id)
        }
      } else if (sortedModules.length > 0) {
        // Si pas d'item spécifique, on est probablement sur le premier module
        setCurrentModuleId(sortedModules[0].id)
        console.log('📍 [CourseView] Module par défaut (premier):', sortedModules[0].id, sortedModules[0].title)
      }

      // Créer les entrées module_progress pour marquer que la formation a été commencée
      // Cela permet de distinguer "non commencé" de "en cours"
      if (user?.id && sortedModules.length > 0 && profile?.role !== 'admin') {
        const moduleIds = sortedModules.map(m => m.id)
        console.log('Creating initial progressions for modules:', moduleIds)
        
        // Vérifier quelles progressions existent déjà
        const { data: existingProgress, error: existingProgressError } = await supabase
          .from('module_progress')
          .select('module_id, started_at')
          .eq('user_id', user.id)
          .in('module_id', moduleIds)
        
        console.log('Existing progressions:', existingProgress, 'error:', existingProgressError)
        
        const existingModuleIds = new Set(existingProgress?.map(p => p.module_id) || [])
        
        // Créer les progressions manquantes avec started_at
        const newProgressions = moduleIds
          .filter(moduleId => !existingModuleIds.has(moduleId))
          .map(moduleId => ({
            user_id: user.id,
            module_id: moduleId,
            session_id: null, // Pour les formations hors session
            percent: 0,
            started_at: new Date().toISOString()
          }))
        
        console.log('New progressions to create:', newProgressions.length, newProgressions)
        
        if (newProgressions.length > 0) {
          const { data: insertedProgress, error: progressError } = await supabase
            .from('module_progress')
            .insert(newProgressions)
            .select()
          
          if (progressError) {
            console.error('❌ Erreur lors de la création des progressions:', progressError)
            // Ne pas bloquer le chargement si ça échoue
          } else {
            console.log(`✅ ${newProgressions.length} progression(s) créée(s) pour marquer le début de la formation:`, insertedProgress)
          }
        } else {
          console.log('✅ Toutes les progressions existent déjà')
        }
      }

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
          id: module.id, // Inclure l'ID du module pour la progression
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

      // Chercher si le cours fait partie d'un programme
      const { data: programCourse } = await supabase
        .from('program_courses')
        .select('programs (id, title)')
        .eq('course_id', courseId)
        .limit(1)
        .maybeSingle()

      if (programCourse?.programs) {
        const prog = programCourse.programs as any
        setProgramData({ id: prog.id, title: prog.title })
      }

      // Récupérer les TP associés directement et les lots de TP
      await fetchCourseTpsAndBatches()

      // Charger les progressions des modules pour afficher les checkboxes
      await fetchModuleProgress()
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

  // Charger les progressions des modules
  const fetchModuleProgress = async () => {
    console.log('fetchModuleProgress called:', { userId: user?.id, modulesLength: modules.length, modules: modules.map(m => ({ id: m.id, title: m.title })) })
    
    if (!user?.id || !modules.length) {
      console.log('Cannot fetch module progress:', { userId: user?.id, modulesLength: modules.length })
      return
    }

    try {
      const moduleIds = modules.map(m => m.id)
      console.log('Fetching module progress for modules:', moduleIds, 'user:', user.id)
      
      const { data: progressions, error } = await supabase
        .from('module_progress')
        .select('module_id, percent, completed_at, updated_at')
        .eq('user_id', user.id)
        .in('module_id', moduleIds)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching module progress:', error)
        throw error
      }

      console.log('Raw progressions from DB:', progressions)

      // Utiliser un Map pour garder seulement la progression la plus récente par module
      const progressMap: Record<string, { percent: number; completed: boolean; completed_at: string | null }> = {}
      const seenModules = new Set<string>()
      
      // Les progressions sont déjà triées par updated_at décroissant
      // On garde seulement la première occurrence de chaque module_id
      progressions?.forEach(p => {
        if (!seenModules.has(p.module_id)) {
          seenModules.add(p.module_id)
          // Un module est complété si completed_at n'est pas null OU si percent est 100
          const isCompleted = p.completed_at !== null || p.percent === 100
          console.log('Processing progression (latest):', {
            module_id: p.module_id,
            percent: p.percent,
            completed_at: p.completed_at,
            updated_at: p.updated_at,
            isCompleted,
            completed_at_is_null: p.completed_at === null,
            percent_is_100: p.percent === 100
          })
          progressMap[p.module_id] = {
            percent: p.percent,
            completed: isCompleted,
            completed_at: p.completed_at
          }
        }
      })

      console.log('Module progress fetched:', progressMap, 'from', progressions?.length || 0, 'records')
      console.log('Full progress map keys:', Object.keys(progressMap))
      console.log('Progress map details:', Object.entries(progressMap).map(([k, v]) => ({ moduleId: k, ...v })))
      setModuleProgress(progressMap)
      
      // Vérifier que les modules complétés sont bien dans la map
      const completedModules = Object.entries(progressMap).filter(([_, v]) => v.completed)
      console.log('Completed modules in map:', completedModules.length, completedModules)
    } catch (error) {
      console.error('Error fetching module progress:', error)
    }
  }

  // Marquer/démarquer un module comme complété
  const toggleModuleComplete = async (moduleId: string, moduleTitle: string) => {
    if (!user?.id) {
      console.error('User not authenticated')
      alert('Vous devez être connecté pour marquer un module comme complété.')
      return
    }

    const currentProgress = moduleProgress[moduleId]
    const isCompleted = currentProgress?.completed || false
    const newCompleted = !isCompleted

    try {
      // Récupérer la session_id depuis l'enrollment si elle existe
      let sessionId: string | null = null
      if (courseId) {
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select('session_id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('status', 'active')
          .maybeSingle()
        
        if (enrollmentData?.session_id) {
          sessionId = enrollmentData.session_id
        }
      }

      console.log('Toggling module completion:', {
        moduleId,
        moduleTitle,
        newCompleted,
        sessionId,
        userId: user.id
      })

      // Utiliser la fonction SQL upsert_module_progress pour éviter les problèmes RLS
      console.log('Calling RPC upsert_module_progress with:', {
        p_module_id: moduleId,
        p_session_id: sessionId,
        p_percent: newCompleted ? 100 : 0,
        p_completed_at: newCompleted ? new Date().toISOString() : null
      })
      
      const { data: progressId, error: rpcError } = await supabase.rpc('upsert_module_progress', {
        p_module_id: moduleId,
        p_session_id: sessionId,
        p_percent: newCompleted ? 100 : 0,
        p_completed_at: newCompleted ? new Date().toISOString() : null
      })

      console.log('RPC result:', { progressId, rpcError, errorCode: rpcError?.code, errorMessage: rpcError?.message })

      if (rpcError) {
        // Si la fonction n'existe pas, fallback sur l'approche directe
        if (rpcError.code === '42883' || rpcError.message?.includes('function') || rpcError.message?.includes('does not exist')) {
          console.warn('Function upsert_module_progress not found, using direct approach')
          
          // Vérifier si une progression existe
          const { data: existing, error: selectError } = await supabase
            .from('module_progress')
            .select('id, session_id')
            .eq('user_id', user.id)
            .eq('module_id', moduleId)
            .maybeSingle()

          if (selectError) {
            console.error('Error fetching existing progress:', selectError)
            throw selectError
          }

          if (existing) {
            // Mettre à jour la progression existante
            const { error: updateError } = await supabase
              .from('module_progress')
              .update({
                percent: newCompleted ? 100 : 0,
                completed_at: newCompleted ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id)
              .eq('user_id', user.id)

            if (updateError) {
              console.error('Error updating module progress:', updateError)
              throw updateError
            }
          } else {
            // Créer une nouvelle progression
            console.log('Inserting new module progress:', {
              user_id: user.id,
              module_id: moduleId,
              session_id: sessionId,
              percent: newCompleted ? 100 : 0,
              completed_at: newCompleted ? new Date().toISOString() : null
            })
            
            const { data: insertData, error: insertError } = await supabase
              .from('module_progress')
              .insert({
                user_id: user.id,
                module_id: moduleId,
                session_id: sessionId,
                percent: newCompleted ? 100 : 0,
                completed_at: newCompleted ? new Date().toISOString() : null,
                started_at: new Date().toISOString()
              })
              .select()

            console.log('Insert result:', { insertData, insertError })

            if (insertError) {
              console.error('Error inserting module progress:', insertError)
              console.error('Insert error details:', {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint
              })
              throw insertError
            }
          }
        } else {
          console.error('Error calling upsert_module_progress:', rpcError)
          console.error('Error details:', {
            code: rpcError.code,
            message: rpcError.message,
            details: rpcError.details,
            hint: rpcError.hint,
            moduleId,
            userId: user.id,
            sessionId
          })
          throw rpcError
        }
      }

      // Vérifier immédiatement si la progression a été sauvegardée
      const { data: verifyData, error: verifyError } = await supabase
        .from('module_progress')
        .select('id, module_id, percent, completed_at, user_id')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .maybeSingle()
      
      console.log('Verification after update:', { 
        verifyData, 
        verifyError,
        expectedUserId: user.id,
        expectedModuleId: moduleId
      })
      
      if (!verifyData && !verifyError) {
        console.warn('⚠️ Progress was not saved! Verification returned no data and no error.')
      }
      
      // Attendre un peu pour s'assurer que la transaction est commitée
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Rafraîchir la progression depuis la base de données pour s'assurer de la synchronisation
      await fetchModuleProgress()
      
      console.log('Module progress updated successfully for module:', moduleId)
    } catch (error: any) {
      console.error('Error toggling module completion:', error)
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de la mise à jour. Veuillez réessayer.'
      if (error?.code === '42501' || error?.message?.includes('permission') || error?.message?.includes('policy')) {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action. Veuillez contacter l\'administrateur.'
      } else if (error?.message) {
        errorMessage = `Erreur: ${error.message}`
      }
      
      alert(errorMessage)
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

  const summaryChips = [
    `${visibleModules.length || 0} modules`,
    `${allItems.length} elements`,
    course.access_type === 'free' ? 'Acces libre' : 'Acces restreint',
    course.status === 'published' ? 'Publie' : 'Brouillon'
  ]

  const outlineButton = 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900'
  const solidButton = 'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition'

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        title={course.title}
        showBackButton
        backTo="/app"
        backLabel="Retour"
      />
      <div className="pt-8">
        {/* Header masque quand page d'accueil affichee - boutons dans le fil d'Ariane */}
        {!showHomePage && (
        <header className="bg-white border-b border-slate-200" style={{ zIndex: 40 }}>
          <div className="mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <div className="flex flex-wrap gap-2">
                {summaryChips.map((chip) => (
                  <span key={chip} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {chip}
                  </span>
                ))}
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Formation</p>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-3xl font-semibold text-slate-900">{course.title}</h1>
                {course.description && (
                  <p className="text-sm text-slate-600 leading-relaxed">{course.description}</p>
                )}
              </div>
              <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                <div className="flex w-full flex-wrap justify-end gap-2 md:flex-nowrap">
                  {viewMode !== 'progress' ? (
                    <Link
                      to={`/courses/${courseId}?view=progress`}
                      className={outlineButton}
                    >
                      Voir la progression
                    </Link>
                  ) : (
                    <Link
                      to={`/courses/${courseId}`}
                      className={outlineButton}
                    >
                      Retour au contenu
                    </Link>
                  )}

                  {isTrainer && viewMode !== 'progress' && (
                    <Link
                      to={`/trainer/courses/${course.id}/script`}
                      className={outlineButton}
                      title="Voir le script pedagogique"
                    >
                      <FileText className="w-4 h-4" />
                      Script
                    </Link>
                  )}

                  {isTrainer && viewMode !== 'progress' && (
                    <Link
                      to={`/trainer/courses/${course.id}/script?split=true`}
                      className={`${solidButton} bg-purple-600 hover:bg-purple-700`}
                      title="Voir le cours et le script cote a cote"
                    >
                      <FileText className="w-4 h-4" />
                      Script + Cours
                    </Link>
                  )}
                </div>

                <div className="flex w-full flex-wrap justify-end gap-2 md:flex-nowrap">
                  {profile?.role === 'admin' && (
                    <Link
                      to={`/admin/courses/${course.id}`}
                      className={outlineButton}
                    >
                      Modifier
                    </Link>
                  )}

                  <button
                    onClick={() => setShowHeaderContent(!showHeaderContent)}
                    className={outlineButton}
                    title={showHeaderContent ? 'Masquer les tuiles' : 'Afficher les tuiles'}
                  >
                    {showHeaderContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showHeaderContent ? 'Masquer' : 'Afficher'}
                  </button>

                  {viewMode !== 'progress' && (
                    <button
                      onClick={() => setShowHomePage(!showHomePage)}
                      className={outlineButton}
                      title={showHomePage ? 'Voir le contenu detaille' : 'Voir la page d\'accueil'}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      {showHomePage ? 'Contenu' : 'Accueil'}
                    </button>
                  )}

                  {course.allow_pdf_download && viewMode !== 'progress' && (
                    <button
                      onClick={handleDownloadMarkdown}
                      disabled={downloadingMarkdown}
                      className={`${solidButton} bg-blue-600 hover:bg-blue-700 disabled:opacity-50`}
                      title="Télécharger le cours en Markdown"
                    >
                      {downloadingMarkdown ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                          Generation...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Markdown
                        </>
                      )}
                    </button>
                  )}

                  {hasLexique && viewMode !== 'progress' && (
                    <button
                      onClick={() => setLexiqueDrawerOpen(!lexiqueDrawerOpen)}
                      className={outlineButton}
                      title={lexiqueDrawerOpen ? 'Fermer le lexique' : 'Ouvrir le lexique'}
                    >
                      <BookOpen className="w-4 h-4" />
                      Lexique
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        )}

      <main 
        className="px-4 sm:px-6 lg:px-10 py-10 transition-all"
        style={{
          marginRight: hasLexique && lexiqueDrawerOpen && isDesktop ? '384px' : undefined,
          marginLeft: viewMode !== 'progress' && courseJson && sidebarOpen && !isDesktop ? '320px' : undefined
        }}
      >
        <div className="mx-auto w-full" style={{ position: 'relative' }}>
          {/* Fil d'Ariane amélioré + boutons si page d'accueil */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <EnhancedBreadcrumb />
            </div>
            {showHomePage && viewMode !== 'progress' && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {profile?.role === 'admin' && (
                  <Link
                    to={`/admin/courses/${course?.id}`}
                    className={outlineButton}
                  >
                    Modifier
                  </Link>
                )}
                <Link
                  to={`/courses/${courseId}?view=progress`}
                  className={outlineButton}
                >
                  Progression
                </Link>
                <button
                  onClick={() => setShowHomePage(false)}
                  className={solidButton}
                >
                  Voir le contenu
                </button>
              </div>
            )}
          </div>

          {/* Grid avec sidebar uniquement si pas sur la page d'accueil */}
          <div className={`grid gap-6 ${viewMode !== 'progress' && courseJson && !showHomePage ? 'lg:grid-cols-[320px_minmax(0,1fr)]' : ''}`} style={{ position: 'relative' }}>
            {viewMode !== 'progress' && courseJson && !showHomePage && (
              <>
                {/* Sidebar desktop - sticky, suit le scroll */}
                <aside className="hidden lg:block" style={{ alignSelf: 'start' }}>
                  <div 
                    className="sticky rounded-3xl border border-slate-100 bg-white shadow-sm" 
                    style={{ 
                      position: 'sticky',
                      top: '2rem',
                      maxHeight: 'calc(100vh - 4rem)',
                      zIndex: 10
                    }}
                  >
                    <CourseSidebar
                      courseJson={courseJson}
                      sidebarWidth={320}
                      minWidth={280}
                      onModuleSelect={(moduleIndex) => {
                        setCourseViewMode('module')
                        setCurrentModuleIndex(moduleIndex)
                      }}
                      selectedModuleIndex={courseViewMode === 'module' ? currentModuleIndex : null}
                      directTps={directTps}
                      tpBatches={tpBatches}
                      fullHeight={false}
                    />
                  </div>
                </aside>

                {/* Sidebar mobile - toujours visible */}
                {sidebarOpen && (
                  <div className="lg:hidden fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-slate-200 shadow-lg flex flex-col">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                      <h3 className="text-sm font-semibold text-slate-900">Table des matières</h3>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                        title="Fermer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4">
                        <CourseSidebar
                          courseJson={courseJson}
                          sidebarWidth={320}
                          minWidth={280}
                          onModuleSelect={(moduleIndex) => {
                            setCourseViewMode('module')
                            setCurrentModuleIndex(moduleIndex)
                          }}
                          selectedModuleIndex={courseViewMode === 'module' ? currentModuleIndex : null}
                          directTps={directTps}
                          tpBatches={tpBatches}
                          fullHeight={true}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bouton pour ouvrir la sidebar sur mobile */}
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden fixed left-4 top-24 z-30 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
                  >
                    <List className="w-4 h-4" />
                    Table des matières
                  </button>
                )}
              </>
            )}

            <section className="space-y-6">
              {viewMode === 'progress' ? (
                <Progress />
              ) : showHomePage && course ? (
                /* Course Homepage View */
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <CourseHomePage
                    course={course}
                    modules={modules}
                    onStartCourse={() => setShowHomePage(false)}
                  />
                </div>
              ) : (
                /* Detailed Course Content View */
                <>
                  {showHeaderContent && course && allItems.length > 0 && (
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                      <CourseFeaturesTiles
                        course={course}
                        items={allItems}
                        courseId={courseId!}
                      />
                    </div>
                  )}

                  {showHeaderContent && courseId && (
                    <>
                      {hasCourseResources === true && (
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                          <CourseResourcesViewer
                            courseId={courseId}
                            onHasResourcesChange={setHasCourseResources}
                          />
                        </div>
                      )}
                      {hasCourseResources === null && (
                        <div style={{ display: 'none' }}>
                          <CourseResourcesViewer
                            courseId={courseId}
                            onHasResourcesChange={setHasCourseResources}
                          />
                        </div>
                      )}
                      {hasResources === true && (
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mt-6">
                          <ResourceViewer
                            courseId={courseId}
                            title="Ressources du cours"
                            onHasResourcesChange={setHasResources}
                          />
                        </div>
                      )}
                      {hasResources === null && (
                        <div style={{ display: 'none' }}>
                          <ResourceViewer
                            courseId={courseId}
                            title="Ressources du cours"
                            onHasResourcesChange={setHasResources}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Documents à compléter */}
                  {showHeaderContent && courseId && (
                    <>
                      {hasFillableDocuments === true && (
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mt-6">
                          <FillableDocumentsViewer
                            courseId={courseId}
                            onHasDocumentsChange={setHasFillableDocuments}
                          />
                        </div>
                      )}
                      {hasFillableDocuments === null && (
                        <div style={{ display: 'none' }}>
                          <FillableDocumentsViewer
                            courseId={courseId}
                            onHasDocumentsChange={setHasFillableDocuments}
                          />
                        </div>
                      )}
                    </>
                  )}


                  {courseId && (
                    <ErrorBoundary fallback={null}>
                      <CourseGammaSlides courseId={courseId} />
                    </ErrorBoundary>
                  )}

                  {courseJson ? (
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                      {(() => {
                        console.log('Rendering ReactRenderer with moduleProgress:', moduleProgress, 'modules:', modules.map(m => ({ id: m.id, title: m.title })))
                        return null
                      })()}
                      <ReactRenderer
                        courseJson={courseJson}
                        modules={modules}
                        moduleProgress={moduleProgress}
                        onToggleModuleComplete={toggleModuleComplete}
                        userRole={profile?.role}
                      />
                    </div>
                  ) : modules.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-gray-500 text-lg">
                        Cette formation ne contient aucun module pour le moment.
                      </p>
                    </div>
                  ) : null}

                  {/* Navigation vers le module suivant - affiché en bas de page */}
                  {!showHomePage && modules.length > 0 && (
                    <div className="mt-8 mb-4" id="course-navigation-bottom">
                      {(() => {
                        // Utiliser le module détecté par scroll, ou celui défini manuellement
                        const activeModuleId = detectedModuleId || currentModuleId
                        
                        // Trouver l'index du module actuel
                        let currentModuleIndex = -1
                        if (activeModuleId) {
                          currentModuleIndex = modules.findIndex(m => m.id === activeModuleId)
                        }
                        
                        // Si pas de module détecté, essayer de détecter depuis le scroll actuel
                        if (currentModuleIndex === -1 && modules.length > 0) {
                          // Chercher le module le plus proche du haut de la fenêtre
                          let closestIndex = -1
                          let closestDistance = Infinity
                          
                          modules.forEach((module, index) => {
                            const moduleElement = document.getElementById(`module-${index}`) || 
                                                 document.querySelector(`[data-module-id="${module.id}"]`)
                            if (moduleElement) {
                              const rect = moduleElement.getBoundingClientRect()
                              // Si le module est visible (même partiellement)
                              if (rect.top <= window.innerHeight && rect.bottom >= 0) {
                                const distance = Math.abs(rect.top)
                                if (distance < closestDistance) {
                                  closestDistance = distance
                                  closestIndex = index
                                }
                              }
                            }
                          })
                          
                          if (closestIndex >= 0) {
                            currentModuleIndex = closestIndex
                          } else {
                            // Si aucun module n'est visible, chercher le dernier module qui a été scrollé
                            // (celui qui est le plus proche du bas de la fenêtre mais encore visible)
                            let lastVisibleIndex = -1
                            modules.forEach((module, index) => {
                              const moduleElement = document.getElementById(`module-${index}`) || 
                                                   document.querySelector(`[data-module-id="${module.id}"]`)
                              if (moduleElement) {
                                const rect = moduleElement.getBoundingClientRect()
                                // Si le module est au-dessus du bas de la fenêtre (a été scrollé)
                                if (rect.top < window.innerHeight) {
                                  lastVisibleIndex = index
                                }
                              }
                            })
                            
                            // Si on a trouvé un module scrollé, l'utiliser, sinon prendre le premier
                            // (par défaut, on commence par le premier module)
                            currentModuleIndex = lastVisibleIndex >= 0 ? lastVisibleIndex : 0
                          }
                        }
                        
                        // S'assurer qu'on a toujours un index valide
                        // PAR DÉFAUT: Si on ne peut pas détecter, on est sur le premier module (index 0)
                        // Cela permet d'afficher le module suivant (module 2) quand on est sur le module 1
                        if (currentModuleIndex === -1 && modules.length > 0) {
                          console.log('⚠️ [Navigation] Aucun module détecté, utilisation du premier module par défaut (index 0)')
                          currentModuleIndex = 0
                        }

                        // Debug: logs pour comprendre le problème
                        console.log('🔍 [Navigation] État actuel:', {
                          detectedModuleId,
                          currentModuleId,
                          activeModuleId: detectedModuleId || currentModuleId,
                          currentModuleIndex,
                          totalModules: modules.length,
                          modulesList: modules.map((m, idx) => ({ index: idx, id: m.id, title: m.title, position: m.position }))
                        })
                        
                        // IMPORTANT: Si on n'a pas pu détecter le module actuel, on considère qu'on est sur le premier module
                        // Cela permet d'afficher le module suivant (module 2) quand on est sur le module 1
                        if (currentModuleIndex === -1) {
                          console.log('⚠️ [Navigation] Aucun module détecté, utilisation du premier module par défaut (index 0)')
                          currentModuleIndex = 0
                        }
                        
                        // Trouver le module suivant
                        // IMPORTANT: Vérifier que currentModuleIndex est valide et qu'il y a un module suivant
                        let nextModule: ModuleWithItems | null = null
                        if (currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1) {
                          nextModule = modules[currentModuleIndex + 1]
                          console.log('✅ [Navigation] Module suivant trouvé:', {
                            currentIndex: currentModuleIndex,
                            nextIndex: currentModuleIndex + 1,
                            nextModuleTitle: nextModule?.title,
                            nextModuleId: nextModule?.id
                          })
                        } else {
                          console.log('❌ [Navigation] Pas de module suivant:', {
                            currentIndex: currentModuleIndex,
                            totalModules: modules.length,
                            condition: currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1
                          })
                        }
                        
                        console.log('🔍 [Navigation] Résultat:', {
                          currentModuleIndex,
                          currentModuleTitle: currentModuleIndex >= 0 ? modules[currentModuleIndex]?.title : 'N/A',
                          hasNextModule: !!nextModule,
                          nextModuleTitle: nextModule?.title || 'N/A (dernier module)',
                          nextModuleIndex: nextModule ? currentModuleIndex + 1 : -1,
                          isLastModule: currentModuleIndex === modules.length - 1,
                          totalModules: modules.length,
                          willShowNextButton: !!nextModule,
                          willShowProgramButton: !nextModule && !!programData
                        })
                        
                        // FORCER l'affichage du module suivant si on est sur le premier module et qu'il y a un module suivant
                        // (pour résoudre le problème où la détection ne fonctionne pas)
                        if (currentModuleIndex === 0 && modules.length > 1 && !nextModule) {
                          console.warn('⚠️ [Navigation] BUG DÉTECTÉ: On est sur le module 0 mais nextModule est null!')
                          console.warn('   Modules disponibles:', modules.map((m, i) => `${i}: ${m.title}`))
                          // Forcer le module suivant
                          const forcedNextModule = modules[1]
                          if (forcedNextModule) {
                            console.log('✅ [Navigation] Correction appliquée: nextModule forcé à', forcedNextModule.title)
                            // Utiliser forcedNextModule au lieu de nextModule
                            const actualNextModule = forcedNextModule
                            const actualCurrentModule = modules[0]
                            
                            // Afficher le bouton avec le module forcé
                            return (
                              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-3xl p-6 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">Module suivant</p>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {actualNextModule.title}
                                    </h3>
                                    {actualNextModule.items && actualNextModule.items.length > 0 && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {actualNextModule.items.length} élément{actualNextModule.items.length > 1 ? 's' : ''}
                                      </p>
                                    )}
                                    {actualCurrentModule && (
                                      <p className="text-xs text-blue-600 mt-2 italic">
                                        ✓ Votre participation au module "{actualCurrentModule.title}" sera enregistrée
                                      </p>
                                    )}
                                  </div>
                                  {actualNextModule.items && actualNextModule.items.length > 0 ? (
                                    <button
                                      onClick={async (e) => {
                                        e.preventDefault()
                                        if (actualCurrentModule && user?.id) {
                                          try {
                                            let sessionId: string | null = null
                                            if (courseId) {
                                              const { data: enrollmentData } = await supabase
                                                .from('enrollments')
                                                .select('session_id')
                                                .eq('user_id', user.id)
                                                .eq('course_id', courseId)
                                                .eq('status', 'active')
                                                .maybeSingle()
                                              
                                              if (enrollmentData?.session_id) {
                                                sessionId = enrollmentData.session_id
                                              }
                                            }

                                            const currentProgress = moduleProgress[actualCurrentModule.id]
                                            const hasProgress = currentProgress && currentProgress.percent > 0
                                            
                                            if (!hasProgress) {
                                              try {
                                                const { error: rpcError } = await supabase.rpc('upsert_module_progress', {
                                                  p_module_id: actualCurrentModule.id,
                                                  p_session_id: sessionId,
                                                  p_percent: 50,
                                                  p_completed_at: null
                                                })

                                                if (rpcError && (rpcError.code === '42883' || rpcError.message?.includes('function'))) {
                                                  const { data: existing } = await supabase
                                                    .from('module_progress')
                                                    .select('id')
                                                    .eq('user_id', user.id)
                                                    .eq('module_id', actualCurrentModule.id)
                                                    .eq('session_id', sessionId)
                                                    .maybeSingle()

                                                  if (existing) {
                                                    await supabase
                                                      .from('module_progress')
                                                      .update({
                                                        percent: 50,
                                                        updated_at: new Date().toISOString()
                                                      })
                                                      .eq('id', existing.id)
                                                  } else {
                                                    await supabase
                                                      .from('module_progress')
                                                      .insert({
                                                        user_id: user.id,
                                                        module_id: actualCurrentModule.id,
                                                        session_id: sessionId,
                                                        percent: 50,
                                                        started_at: new Date().toISOString(),
                                                        updated_at: new Date().toISOString()
                                                      })
                                                  }
                                                }
                                                
                                                await fetchModuleProgress()
                                              } catch (error) {
                                                console.error('Error saving module participation:', error)
                                              }
                                            }

                                            const firstItem = actualNextModule.items[0]
                                            window.location.href = `/items/${firstItem.id}${programData ? `?programId=${programData.id}` : ''}`
                                          } catch (error) {
                                            console.error('Error navigating to next module:', error)
                                            const firstItem = actualNextModule.items[0]
                                            window.location.href = `/items/${firstItem.id}${programData ? `?programId=${programData.id}` : ''}`
                                          }
                                        }
                                      }}
                                      className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium shadow-lg transition-colors whitespace-nowrap"
                                    >
                                      Accéder au module
                                      <ArrowRight className="w-5 h-5" />
                                    </button>
                                  ) : (
                                    <span className="text-sm text-gray-500 italic">
                                      Module vide
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          }
                        }

                        // Trouver le module actuel pour valider la participation
                        const currentModule = currentModuleIndex >= 0 
                          ? modules[currentModuleIndex] 
                          : null

                        // Fonction pour valider la participation au module actuel
                        const handleNavigateToNextModule = async (e: React.MouseEvent) => {
                          if (currentModule && user?.id) {
                            e.preventDefault()
                            
                            try {
                              // Récupérer la session_id depuis l'enrollment si elle existe
                              let sessionId: string | null = null
                              if (courseId) {
                                const { data: enrollmentData } = await supabase
                                  .from('enrollments')
                                  .select('session_id')
                                  .eq('user_id', user.id)
                                  .eq('course_id', courseId)
                                  .eq('status', 'active')
                                  .maybeSingle()
                                
                                if (enrollmentData?.session_id) {
                                  sessionId = enrollmentData.session_id
                                }
                              }

                              // Marquer le module actuel comme "vu/participé" (percent > 0 mais pas forcément 100%)
                              // On met un pourcentage minimal pour indiquer la participation
                              const currentProgress = moduleProgress[currentModule.id]
                              const hasProgress = currentProgress && currentProgress.percent > 0
                              
                              if (!hasProgress) {
                                // Créer ou mettre à jour la progression pour marquer la participation
                                // Utiliser la fonction RPC si disponible, sinon fallback sur upsert direct
                                try {
                                  const { error: rpcError } = await supabase.rpc('upsert_module_progress', {
                                    p_module_id: currentModule.id,
                                    p_session_id: sessionId,
                                    p_percent: 50, // 50% = participation validée (pas complété mais participé)
                                    p_completed_at: null
                                  })

                                  if (rpcError && (rpcError.code === '42883' || rpcError.message?.includes('function'))) {
                                    // Fallback sur upsert direct si la fonction RPC n'existe pas
                                    // Vérifier d'abord si une progression existe
                                    const { data: existing } = await supabase
                                      .from('module_progress')
                                      .select('id')
                                      .eq('user_id', user.id)
                                      .eq('module_id', currentModule.id)
                                      .eq('session_id', sessionId)
                                      .maybeSingle()

                                    if (existing) {
                                      // Mettre à jour
                                      const { error: updateError } = await supabase
                                        .from('module_progress')
                                        .update({
                                          percent: 50,
                                          updated_at: new Date().toISOString()
                                        })
                                        .eq('id', existing.id)

                                      if (updateError) {
                                        console.error('Error updating module participation:', updateError)
                                      }
                                    } else {
                                      // Créer
                                      const { error: insertError } = await supabase
                                        .from('module_progress')
                                        .insert({
                                          user_id: user.id,
                                          module_id: currentModule.id,
                                          session_id: sessionId,
                                          percent: 50,
                                          started_at: new Date().toISOString(),
                                          updated_at: new Date().toISOString()
                                        })

                                      if (insertError) {
                                        console.error('Error inserting module participation:', insertError)
                                      }
                                    }
                                  } else if (rpcError) {
                                    console.error('Error calling upsert_module_progress:', rpcError)
                                  }
                                  
                                  // Rafraîchir la progression
                                  await fetchModuleProgress()
                                } catch (error) {
                                  console.error('Error saving module participation:', error)
                                }
                              }

                              // Naviguer vers le module suivant
                              if (nextModule && nextModule.items && nextModule.items.length > 0) {
                                // Aller au premier item du module suivant
                                const firstItem = nextModule.items[0]
                                window.location.href = `/items/${firstItem.id}${programData ? `?programId=${programData.id}` : ''}`
                              }
                            } catch (error) {
                              console.error('Error navigating to next module:', error)
                              // En cas d'erreur, naviguer quand même
                              if (nextModule && nextModule.items && nextModule.items.length > 0) {
                                const firstItem = nextModule.items[0]
                                window.location.href = `/items/${firstItem.id}${programData ? `?programId=${programData.id}` : ''}`
                              }
                            }
                          }
                        }

                        // Si pas de module suivant ET qu'on fait partie d'un programme
                        if (!nextModule && programData) {
                          return (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-3xl p-6 shadow-sm">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    🎉 Vous avez terminé ce cours !
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Retournez au programme pour continuer votre parcours.
                                  </p>
                                </div>
                                <Link
                                  to={`/programs/${programData.id}`}
                                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg transition-colors whitespace-nowrap"
                                >
                                  <ArrowLeft className="w-5 h-5" />
                                  Retour au programme
                                </Link>
                              </div>
                            </div>
                          )
                        }

                        // Si pas de module suivant et pas de programme, ne rien afficher
                        if (!nextModule) {
                          return null
                        }

                        // Afficher le bouton pour aller au module suivant
                        return (
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-1">Module suivant</p>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {nextModule.title}
                                </h3>
                                {nextModule.items && nextModule.items.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {nextModule.items.length} élément{nextModule.items.length > 1 ? 's' : ''}
                                  </p>
                                )}
                                {currentModule && (
                                  <p className="text-xs text-blue-600 mt-2 italic">
                                    ✓ Votre participation au module "{currentModule.title}" sera enregistrée
                                  </p>
                                )}
                              </div>
                              {nextModule.items && nextModule.items.length > 0 ? (
                                <button
                                  onClick={handleNavigateToNextModule}
                                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium shadow-lg transition-colors whitespace-nowrap"
                                >
                                  Accéder au module
                                  <ArrowRight className="w-5 h-5" />
                                </button>
                              ) : (
                                <span className="text-sm text-gray-500 italic">
                                  Module vide
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Overlay pour mobile quand sidebar est ouverte */}
      {viewMode !== 'progress' && courseJson && sidebarOpen && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
    </div>
  )
}
