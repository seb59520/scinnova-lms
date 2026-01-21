import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { isAuthError } from '../lib/supabaseHelpers'
import { getUserOrg } from '../lib/queries/userQueries'
import { Course, Enrollment, Program, ProgramEnrollment, Org } from '../types/database'
import { AppHeader } from '../components/AppHeader'
import { LayoutGrid, List, Calendar, BookOpen, Layers, Building2, ClipboardCheck, Clock, CheckCircle, AlertCircle, Send, Search, X, Info, Filter, ArrowUpDown, PlayCircle, CheckCircle2, Circle, ArrowRight } from 'lucide-react'

// Type pour les projets à rendre
interface ProjectToSubmit {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  session_id: string;
  session_title: string;
  submission_status: 'not_started' | 'draft' | 'submitted' | 'evaluated';
  is_published: boolean;
  score?: number | null;
  passed?: boolean | null;
}

interface CourseWithEnrollment extends Course {
  enrollment?: Enrollment
  type?: 'course'
  progressPercent?: number
  lastAccessedAt?: string | null
  progressStatus?: 'not_started' | 'in_progress' | 'completed'
}

interface ProgramWithEnrollment extends Program {
  enrollment?: ProgramEnrollment
  type?: 'program'
  progressPercent?: number
  lastAccessedAt?: string | null
  progressStatus?: 'not_started' | 'in_progress' | 'completed'
}

type LibraryItem = CourseWithEnrollment | ProgramWithEnrollment

type ViewMode = 'grid' | 'list'
type ProgressFilter = 'all' | 'not_started' | 'in_progress' | 'completed'
type SortOption = 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc' | 'progress_asc' | 'progress_desc' | 'recent'

export function Dashboard() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([])
  const [programs, setPrograms] = useState<ProgramWithEnrollment[]>([])
  const [projects, setProjects] = useState<ProjectToSubmit[]>([])
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<Org | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Récupérer le mode de vue depuis localStorage
    const saved = localStorage.getItem('dashboard-view-mode')
    return (saved as ViewMode) || 'grid'
  })
  const [showTPOnly, setShowTPOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCourses, setFilteredCourses] = useState<CourseWithEnrollment[]>([])
  const [courseModules, setCourseModules] = useState<Record<string, Array<{ title: string; items: Array<{ title: string }> }>>>({})
  const [activeContentTab, setActiveContentTab] = useState<'courses' | 'programs'>('courses')

  // Écouter les événements de changement d'onglet depuis la sidebar
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const tab = event.detail?.tab
      if (tab === 'courses' || tab === 'programs') {
        setActiveContentTab(tab)
      }
    }

    window.addEventListener('dashboard-tab-change', handleTabChange as EventListener)
    
    // Vérifier sessionStorage au chargement
    const savedTab = sessionStorage.getItem('dashboardActiveTab')
    if (savedTab === 'courses' || savedTab === 'programs') {
      setActiveContentTab(savedTab)
      sessionStorage.removeItem('dashboardActiveTab')
    }

    return () => {
      window.removeEventListener('dashboard-tab-change', handleTabChange as EventListener)
    }
  }, [])
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [courseProgress, setCourseProgress] = useState<Record<string, { percent: number; lastAccessed: string | null }>>({})

  // Sauvegarder le mode de vue dans localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('dashboard-view-mode', mode)
  }

  useEffect(() => {
    if (user?.id) {
      fetchLibraryItems()
    } else {
      // Si pas d'utilisateur (ne devrait pas arriver dans une route protégée)
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    async function loadOrg() {
      if (!user?.id || profile?.role === 'admin') return; // Pas besoin pour les admins
      
      const { org: userOrg } = await getUserOrg(user.id)
      setOrg(userOrg)
    }
    
    loadOrg()
  }, [user?.id, profile?.role])

  // Charger les projets à rendre
  useEffect(() => {
    async function loadProjects() {
      if (!user?.id) return;
      // Note: même les admins peuvent avoir des projets à rendre s'ils sont inscrits comme learner

      try {
        // 1. Récupérer les sessions où l'utilisateur est inscrit
        const { data: memberSessions, error: memberError } = await supabase
          .from('session_members')
          .select('session_id, role, session:sessions(id, title)')
          .eq('user_id', user.id);

        console.log('📋 Session members pour', user.id, ':', memberSessions, memberError);

        // Filtrer pour ne garder que les learners
        const learnerSessions = memberSessions?.filter(m => m.role === 'learner') || [];
        console.log('📋 Sessions en tant que learner:', learnerSessions.length);

        if (learnerSessions.length === 0) {
          console.log('⚠️ Aucune session en tant que learner trouvée');
          setProjects([]);
          return;
        }

        const sessionIds = learnerSessions.map(m => m.session_id);
        const sessionMap = new Map(learnerSessions.map(m => [m.session_id, (m.session as any)?.title || 'Session']));

        // 2. Récupérer les restitutions de projet ouvertes pour ces sessions
        const { data: restitutions, error: restitError } = await supabase
          .from('session_project_restitutions')
          .select('*')
          .in('session_id', sessionIds)
          .in('status', ['open', 'published', 'grading', 'completed']);

        console.log('📋 Restitutions pour sessions', sessionIds, ':', restitutions?.length, restitError);

        if (!restitutions || restitutions.length === 0) {
          console.log('⚠️ Aucune restitution trouvée');
          setProjects([]);
          return;
        }

        // 3. Récupérer les soumissions de l'utilisateur
        const restitutionIds = restitutions.map(r => r.id);
        const { data: submissions, error: subError } = await supabase
          .from('project_submissions')
          .select('restitution_id, status')
          .eq('user_id', user.id)
          .in('restitution_id', restitutionIds);

        console.log('📋 Soumissions:', submissions, subError);
        const submissionMap = new Map(submissions?.map(s => [s.restitution_id, s.status]) || []);

        // 4. Récupérer les évaluations publiées avec les notes
        const { data: evaluations, error: evalError } = await supabase
          .from('project_evaluations')
          .select('restitution_id, is_published, score_20, final_score, passed, user_id')
          .eq('user_id', user.id)
          .in('restitution_id', restitutionIds);
        
        console.log('📋 Évaluations (toutes):', evaluations, evalError);
        console.log('📋 Évaluations publiées:', evaluations?.filter(e => e.is_published));

        // Filtrer pour ne garder que les évaluations publiées
        const publishedEvaluations = evaluations?.filter(e => e.is_published) || [];
        const evaluationMap = new Map(publishedEvaluations.map(e => [e.restitution_id, {
          is_published: e.is_published,
          score: e.final_score || e.score_20,
          passed: e.passed
        }]));

        // 5. Construire la liste des projets
        const projectsList: ProjectToSubmit[] = restitutions.map(r => {
          const subStatus = submissionMap.get(r.id);
          const evaluation = evaluationMap.get(r.id);
          
          let submission_status: ProjectToSubmit['submission_status'] = 'not_started';
          if (evaluation?.is_published) {
            submission_status = 'evaluated';
          } else if (subStatus === 'submitted' || subStatus === 'evaluated') {
            submission_status = 'submitted';
          } else if (subStatus === 'draft') {
            submission_status = 'draft';
          }

          return {
            id: r.id,
            title: r.title,
            description: r.description,
            due_date: r.due_date,
            status: r.status,
            session_id: r.session_id,
            session_title: sessionMap.get(r.session_id) || 'Session',
            submission_status,
            is_published: evaluation?.is_published || false,
            score: evaluation?.score || null,
            passed: evaluation?.passed || null
          };
        });

        // Trier : non soumis d'abord, puis par date limite
        projectsList.sort((a, b) => {
          const order = { not_started: 0, draft: 1, submitted: 2, evaluated: 3 };
          if (order[a.submission_status] !== order[b.submission_status]) {
            return order[a.submission_status] - order[b.submission_status];
          }
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          return 0;
        });

        setProjects(projectsList);
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    }

    loadProjects();
  }, [user?.id, profile?.role])

  const fetchLibraryItems = async () => {
    try {
      if (!user?.id) {
        setLoading(false)
        return
      }

      const allItems: LibraryItem[] = []
      const isAdmin = profile?.role === 'admin'

      // Faire TOUTES les requêtes en parallèle pour optimiser le chargement
      const promises: Promise<any>[] = [
        // Inscriptions aux cours (ancienne méthode)
        supabase
          .from('enrollments')
          .select(`*, courses (*)`)
          .eq('user_id', user.id)
          .eq('status', 'active'),
        // Inscriptions aux programmes
        supabase
          .from('program_enrollments')
          .select(`*, programs (*)`)
          .eq('user_id', user.id)
          .eq('status', 'active'),
        // Inscriptions via sessions (nouvelle méthode)
        supabase
          .from('session_members')
          .select(`
            *,
            session:sessions (
              id,
              title,
              course_id
            )
          `)
          .eq('user_id', user.id)
          .eq('role', 'learner'),
      ]

      // Si admin, ajouter les requêtes pour tous les cours et programmes
      if (isAdmin) {
        promises.push(
          supabase.from('courses').select('*').order('created_at', { ascending: false }),
          supabase.from('programs').select('*').order('created_at', { ascending: false })
        )
      }

      const results = await Promise.all(promises)
      
      const [enrollmentsResult, programEnrollmentsResult, sessionMembersResult, coursesResult, programsResult] = results

      // Set pour éviter les doublons de cours
      const addedCourseIds = new Set<string>()

      // Traiter les inscriptions aux cours (ancienne méthode)
      const { data: enrollments, error: enrollmentsError } = enrollmentsResult
      if (enrollmentsError && enrollmentsError.code !== 'PGRST116') {
        console.error('Error fetching enrollments:', enrollmentsError)
        if (isAuthError(enrollmentsError)) {
          console.error('Auth error, user may need to reconnect')
          return
        }
      }

      const enrolledCourses: CourseWithEnrollment[] = (enrollments?.map((e: any) => ({
        ...e.courses,
        enrollment: e,
        type: 'course' as const
      })) || []).filter((c: any) => c.id)

      enrolledCourses.forEach((c: any) => addedCourseIds.add(c.id))
      allItems.push(...enrolledCourses)

      // Traiter les inscriptions via sessions (nouvelle méthode)
      const { data: sessionMembers, error: sessionMembersError } = sessionMembersResult
      if (sessionMembersError && sessionMembersError.code !== 'PGRST116') {
        console.error('Error fetching session members:', sessionMembersError)
      } else if (sessionMembers && sessionMembers.length > 0) {
        // Récupérer les course_ids des sessions
        const courseIdsFromSessions = sessionMembers
          .filter((sm: any) => sm.session?.course_id && !addedCourseIds.has(sm.session.course_id))
          .map((sm: any) => sm.session.course_id)
        
        if (courseIdsFromSessions.length > 0) {
          // Charger les cours correspondants
          const { data: sessionCoursesData, error: sessionCoursesError } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIdsFromSessions)

          if (!sessionCoursesError && sessionCoursesData) {
            const sessionCourses: CourseWithEnrollment[] = sessionCoursesData.map((course: any) => {
              const sm = sessionMembers.find((m: any) => m.session?.course_id === course.id)
              return {
                ...course,
                session: sm?.session,
                sessionMember: sm,
                type: 'course' as const
              }
            })
            
            sessionCourses.forEach((c: any) => addedCourseIds.add(c.id))
            allItems.push(...sessionCourses)
          }
        }
      }

      // Traiter les inscriptions aux programmes
      const { data: programEnrollments, error: programEnrollmentsError } = programEnrollmentsResult
      if (programEnrollmentsError && programEnrollmentsError.code !== 'PGRST116') {
        console.error('Error fetching program enrollments:', programEnrollmentsError)
      } else {
        const enrolledPrograms: ProgramWithEnrollment[] = (programEnrollments?.map((e: any) => ({
          ...e.programs,
          enrollment: e,
          type: 'program' as const
        })) || [])

        allItems.push(...enrolledPrograms)
      }

      // Si admin, ajouter tous les cours et programmes
      if (isAdmin && coursesResult && programsResult) {

        // Créer des maps pour éviter les doublons
        const courseMap = new Map<string, CourseWithEnrollment>()
        const programMap = new Map<string, ProgramWithEnrollment>()

        // Ajouter les éléments déjà récupérés
        allItems.forEach(item => {
          if (item.type === 'course') {
            courseMap.set(item.id, item as CourseWithEnrollment)
          } else if (item.type === 'program') {
            programMap.set(item.id, item as ProgramWithEnrollment)
          }
        })

        // Ajouter toutes les formations (admin voit tout)
        if (coursesResult.data) {
          coursesResult.data.forEach(course => {
            if (!courseMap.has(course.id)) {
              courseMap.set(course.id, { ...course, type: 'course' as const })
            }
          })
        }

        // Ajouter tous les programmes (admin voit tout)
        if (programsResult.data) {
          programsResult.data.forEach(program => {
            if (!programMap.has(program.id)) {
              programMap.set(program.id, { ...program, type: 'program' as const })
            }
          })
        }

        // Reconstruire allItems avec tous les éléments
        allItems.length = 0
        allItems.push(...Array.from(courseMap.values()), ...Array.from(programMap.values()))
      }

      // Séparer les cours et les programmes
      const coursesList: CourseWithEnrollment[] = []
      const programsList: ProgramWithEnrollment[] = []

      allItems.forEach(item => {
        if (item.type === 'course') {
          coursesList.push(item as CourseWithEnrollment)
        } else if (item.type === 'program') {
          programsList.push(item as ProgramWithEnrollment)
        }
      })

      // Trier par date de création (plus récent en premier)
      coursesList.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
      })

      programsList.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
      })

      setItems(allItems)
      setCourses(coursesList)
      setPrograms(programsList)

      // Charger les progressions pour les cours
      if (user?.id && coursesList.length > 0) {
        await fetchCourseProgress(coursesList.map(c => c.id))
      }
    } catch (error) {
      console.error('Error fetching library items:', error)
    } finally {
      setLoading(false)
    }
  }

  // Récupérer les progressions des cours
  const fetchCourseProgress = async (courseIds: string[]) => {
    if (!user?.id || courseIds.length === 0) return

    try {
      // Récupérer les modules de ces cours
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, course_id')
        .in('course_id', courseIds)

      if (modulesError) throw modulesError

      const moduleIds = modules?.map(m => m.id) || []
      if (moduleIds.length === 0) return

      // Récupérer les progressions des modules
      const { data: progressions, error: progressError } = await supabase
        .from('module_progress')
        .select('module_id, percent, updated_at, started_at')
        .eq('user_id', user.id)
        .in('module_id', moduleIds)

      if (progressError) throw progressError

      // Calculer la progression moyenne par cours
      const progressMap: Record<string, { percent: number; lastAccessed: string | null; hasStarted: boolean }> = {}
      
      courseIds.forEach(courseId => {
        const courseModules = modules?.filter(m => m.course_id === courseId) || []
        const courseModuleIds = courseModules.map(m => m.id)
        const courseProgressions = progressions?.filter(p => courseModuleIds.includes(p.module_id)) || []
        
        if (courseProgressions.length > 0) {
          const avgPercent = Math.round(
            courseProgressions.reduce((sum, p) => sum + p.percent, 0) / courseProgressions.length
          )
          const lastAccessed = courseProgressions
            .map(p => p.updated_at)
            .sort()
            .reverse()[0] || null
          
          // Vérifier si au moins un module a un started_at (formation commencée)
          const hasStarted = courseProgressions.some(p => p.started_at !== null)
          
          progressMap[courseId] = {
            percent: avgPercent,
            lastAccessed,
            hasStarted
          }
        } else {
          progressMap[courseId] = {
            percent: 0,
            lastAccessed: null,
            hasStarted: false
          }
        }
      })

      setCourseProgress(progressMap)

      // Mettre à jour les cours avec leurs progressions
      setCourses(prevCourses => 
        prevCourses.map(course => {
          const progress = progressMap[course.id]
          if (progress) {
            // Une formation est "commencée" si elle a un started_at (même avec percent = 0)
            // Cela permet de distinguer "non commencé" de "commencé mais pas encore de progression"
            let progressStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started'
            if (progress.percent === 100) {
              progressStatus = 'completed'
            } else if (progress.hasStarted || progress.percent > 0) {
              // Considérer comme "en cours" si started_at existe OU si percent > 0
              progressStatus = 'in_progress'
            }
            
            return {
              ...course,
              progressPercent: progress.percent,
              lastAccessedAt: progress.lastAccessed,
              progressStatus
            }
          }
          return course
        })
      )
    } catch (error) {
      console.error('Error fetching course progress:', error)
    }
  }

  // Charger les modules et items des cours pour la recherche avancée
  useEffect(() => {
    async function loadCourseModules() {
      if (!searchQuery.trim() || courses.length === 0) {
        setCourseModules({})
        return
      }

      try {
        const courseIds = courses.map(c => c.id)
        if (courseIds.length === 0) return

        // Charger les modules avec leurs items
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select(`
            id,
            course_id,
            title,
            items (
              id,
              title
            )
          `)
          .in('course_id', courseIds)

        if (modulesError) {
          console.error('Error loading modules:', modulesError)
          return
        }

        // Organiser les données par course_id
        const modulesByCourse: Record<string, Array<{ title: string; items: Array<{ title: string }> }>> = {}
        
        modulesData?.forEach((module: any) => {
          if (!modulesByCourse[module.course_id]) {
            modulesByCourse[module.course_id] = []
          }
          modulesByCourse[module.course_id].push({
            title: module.title,
            items: module.items || []
          })
        })

        setCourseModules(modulesByCourse)
      } catch (error) {
        console.error('Error loading course modules:', error)
      }
    }

    loadCourseModules()
  }, [searchQuery, courses])

  // Fonction de tri
  const sortItems = <T extends CourseWithEnrollment | ProgramWithEnrollment>(items: T[]): T[] => {
    const sorted = [...items]
    
    switch (sortOption) {
      case 'name_asc':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      case 'name_desc':
        return sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''))
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'progress_asc':
        return sorted.sort((a, b) => (a.progressPercent || 0) - (b.progressPercent || 0))
      case 'progress_desc':
        return sorted.sort((a, b) => (b.progressPercent || 0) - (a.progressPercent || 0))
      case 'recent':
        return sorted.sort((a, b) => {
          // Priorité 1 : Cours avec date de consultation (les plus récents en premier)
          const dateA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0
          const dateB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0
          
          // Si les deux ont une date de consultation, trier par date décroissante
          if (dateA > 0 && dateB > 0) {
            return dateB - dateA
          }
          
          // Si seulement A a une date de consultation, A vient en premier
          if (dateA > 0 && dateB === 0) {
            return -1
          }
          
          // Si seulement B a une date de consultation, B vient en premier
          if (dateA === 0 && dateB > 0) {
            return 1
          }
          
          // Si aucun n'a de date de consultation, trier par date de création (plus récents en premier)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      default:
        return sorted
    }
  }

  // Filtrer et trier les cours
  useEffect(() => {
    let filtered = courses

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(course => {
        const titleMatch = course.title?.toLowerCase().includes(query)
        const descriptionMatch = course.description?.toLowerCase().includes(query)
        const courseModulesData = courseModules[course.id] || []
        const moduleMatch = courseModulesData.some(module => 
          module.title?.toLowerCase().includes(query)
        )
        const itemMatch = courseModulesData.some(module =>
          module.items.some(item => item.title?.toLowerCase().includes(query))
        )
        return titleMatch || descriptionMatch || moduleMatch || itemMatch
      })
    }

    // Filtre par statut de progression
    if (progressFilter !== 'all') {
      filtered = filtered.filter(course => course.progressStatus === progressFilter)
    }

    // Trier
    filtered = sortItems(filtered)

    setFilteredCourses(filtered)
  }, [searchQuery, courses, courseModules, progressFilter, sortOption])


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="pt-4">

      {/* Hero Section - Compact */}
      <div className="bg-white border-b border-gray-200 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Bienvenue{profile?.full_name ? `, ${profile.full_name}` : ''}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {profile?.role === 'admin' 
                  ? 'Gérez vos formations et suivez les apprenants'
                  : 'Découvrez et suivez vos formations'}
              </p>
              {org && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>Organisation: <span className="font-medium text-gray-700">{org.name}</span></span>
                </div>
              )}
            </div>
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Créer une formation
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-8">
          
          {/* Section Projets à rendre - visible aussi pour les admins s'ils sont inscrits comme learner */}
          {projects.length > 0 && (
            <section data-section="projects">
              <div className="flex items-center gap-3 mb-4">
                <ClipboardCheck className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  Mes projets à rendre
                </h2>
                <span className="text-sm bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
                  {projects.filter(p => p.submission_status !== 'evaluated').length} en attente
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => {
                  const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.submission_status !== 'submitted' && project.submission_status !== 'evaluated';
                  
                  return (
                    <Link
                      key={project.id}
                      to={`/session/${project.session_id}/project/${project.id}`}
                      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 ${
                        project.submission_status === 'evaluated' ? 'border-green-500' :
                        project.submission_status === 'submitted' ? 'border-blue-500' :
                        isOverdue ? 'border-red-500' :
                        project.submission_status === 'draft' ? 'border-yellow-500' :
                        'border-purple-500'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{project.title}</h3>
                          {project.submission_status === 'evaluated' ? (
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${project.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {project.score?.toFixed(1)}/20
                              </span>
                              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                project.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                <CheckCircle className="w-3 h-3" />
                                {project.passed ? 'Validé' : 'Non validé'}
                              </span>
                            </div>
                          ) : project.submission_status === 'submitted' ? (
                            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                              <Send className="w-3 h-3" />
                              Soumis
                            </span>
                          ) : project.submission_status === 'draft' ? (
                            <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full whitespace-nowrap">
                              <Clock className="w-3 h-3" />
                              Brouillon
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full whitespace-nowrap">
                              <AlertCircle className="w-3 h-3" />
                              À faire
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-3">{project.session_title}</p>
                        
                        {project.due_date && (
                          <div className={`flex items-center gap-1 text-xs ${
                            isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {isOverdue ? 'En retard - ' : 'Date limite : '}
                            {new Date(project.due_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t">
                          <span className={`text-sm font-medium ${
                            project.submission_status === 'evaluated' 
                              ? 'text-green-600 hover:text-green-800' 
                              : 'text-purple-600 hover:text-purple-800'
                          }`}>
                            {project.submission_status === 'evaluated' 
                              ? 'Voir le détail →' 
                              : project.submission_status === 'submitted'
                                ? 'Voir ma soumission →'
                                : project.submission_status === 'draft' 
                                  ? 'Continuer →' 
                                  : 'Commencer →'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section "Continuer où j'en étais" */}
          {(() => {
            const inProgressCourses = courses.filter(c => c.progressStatus === 'in_progress' && c.progressPercent && c.progressPercent > 0)
            const displayedCourses = inProgressCourses
              .sort((a, b) => (b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0) - (a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0))
              .slice(0, 6)
            const hasMoreCourses = inProgressCourses.length > 6
            
            return inProgressCourses.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <PlayCircle className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                      Continuer où j'en étais
                    </h2>
                    <span className="text-sm bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                      {inProgressCourses.length}
                    </span>
                  </div>
                  {hasMoreCourses && (
                    <button
                      onClick={() => {
                        setActiveContentTab('courses')
                        setProgressFilter('in_progress')
                        setSortOption('recent')
                        // Scroll vers la section formations
                        setTimeout(() => {
                          const section = document.querySelector('[data-content-tab="courses"]')
                          if (section) {
                            section.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }, 100)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      Voir toutes ({inProgressCourses.length})
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedCourses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/courses/${course.id}`}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 border-blue-500 p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                            {course.title}
                          </h3>
                          {course.lastAccessedAt && (
                            <p className="text-xs text-gray-500">
                              Dernière consultation : {new Date(course.lastAccessedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {course.progressPercent !== undefined && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Progression</span>
                            <span className="text-xs font-medium text-gray-700">{course.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${course.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          Continuer → 
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })()}

          {/* Section Formations et Programmes avec navigation par onglets */}
          <section>
            {/* Navigation par onglets */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
              <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <nav className="flex -mb-px" aria-label="Tabs">
                  <button
                    onClick={() => setActiveContentTab('courses')}
                    className={`
                      flex-1 flex items-center justify-center gap-2.5 px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-200 relative
                      ${activeContentTab === 'courses'
                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <BookOpen className={`w-5 h-5 ${activeContentTab === 'courses' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>Formations</span>
                    {courses.length > 0 && (
                      <span className={`ml-1.5 px-2.5 py-1 rounded-full text-xs font-semibold min-w-[24px] text-center ${
                        activeContentTab === 'courses'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {courses.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveContentTab('programs')}
                    className={`
                      flex-1 flex items-center justify-center gap-2.5 px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-200 relative
                      ${activeContentTab === 'programs'
                        ? 'border-purple-600 text-purple-600 bg-purple-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Layers className={`w-5 h-5 ${activeContentTab === 'programs' ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span>Programmes</span>
                    {programs.length > 0 && (
                      <span className={`ml-1.5 px-2.5 py-1 rounded-full text-xs font-semibold min-w-[24px] text-center ${
                        activeContentTab === 'programs'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {programs.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>
              
              {/* Explication de la différence */}
              <div className="px-5 py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">Formation</span>
                      <span className="text-gray-600">:</span>
                      <span className="text-gray-700">contenu pédagogique autonome (cours, TP, exercices)</span>
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">Programme</span>
                      <span className="text-gray-600">:</span>
                      <span className="text-gray-700">parcours structuré regroupant plusieurs formations dans un ordre défini</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu Formations */}
            {activeContentTab === 'courses' && (
              <div data-content-tab="courses">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        {profile?.role === 'admin' ? 'Toutes les formations' : 'Mes formations'}
                      </h2>
                      {(filteredCourses.length > 0 || searchQuery) && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          {searchQuery ? `${filteredCourses.length} résultat${filteredCourses.length > 1 ? 's' : ''}` : filteredCourses.length}
                        </span>
                      )}
                    </div>
                {courses.length > 0 && (
                  <div className="flex items-center gap-3">
                  {/* Toggle pour filtrer les TP */}
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                    <label htmlFor="tp-filter" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Afficher les TP
                    </label>
                    <button
                      id="tp-filter"
                      type="button"
                      role="switch"
                      aria-checked={showTPOnly}
                      onClick={() => setShowTPOnly(!showTPOnly)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        showTPOnly ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showTPOnly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {/* Boutons de vue */}
                  <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                    <button
                      onClick={() => handleViewModeChange('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Vue grille"
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Vue liste"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              {courses.length > 0 && (
                <div className="w-full space-y-3">
                  {/* Barre de recherche */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Rechercher une formation (ex: python read, fichiers...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Filtres et Tri */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Filtre par progression */}
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <select
                        value={progressFilter}
                        onChange={(e) => setProgressFilter(e.target.value as ProgressFilter)}
                        className="text-sm border-0 focus:ring-0 bg-transparent text-gray-700 cursor-pointer"
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="not_started">Non commencé</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminé</option>
                      </select>
                    </div>
                    
                    {/* Tri */}
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                      <ArrowUpDown className="w-4 h-4 text-gray-500" />
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="text-sm border-0 focus:ring-0 bg-transparent text-gray-700 cursor-pointer"
                      >
                        <option value="recent">Récemment consultés</option>
                        <option value="name_asc">Nom (A-Z)</option>
                        <option value="name_desc">Nom (Z-A)</option>
                        <option value="progress_desc">Progression (↓)</option>
                        <option value="progress_asc">Progression (↑)</option>
                        <option value="date_desc">Plus récent</option>
                        <option value="date_asc">Plus ancien</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(() => {
              // Séparer les cours en TP et non-TP si le toggle est activé
              const tpCourses = filteredCourses.filter(course => course.title?.startsWith('TP'))
              const otherCourses = filteredCourses.filter(course => !course.title?.startsWith('TP'))
              
              const displayCourses = showTPOnly ? filteredCourses : filteredCourses
              
              if (displayCourses.length === 0 && !searchQuery) {
                return (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="max-w-md mx-auto">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 text-base mb-2">
                        {profile?.role === 'admin'
                          ? 'Aucune formation créée pour le moment.'
                          : 'Vous n\'êtes inscrit à aucune formation.'}
                      </p>
                      {profile?.role === 'admin' && (
                        <Link to="/admin" className="btn-primary inline-flex items-center text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Créer une formation
                        </Link>
                      )}
                    </div>
                  </div>
                )
              }
              
              if (filteredCourses.length === 0 && searchQuery) {
                return (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="max-w-md mx-auto">
                      <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 text-base mb-2">
                        Aucun résultat pour "{searchQuery}"
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Effacer la recherche
                      </button>
                    </div>
                  </div>
                )
              }
              
              return viewMode === 'grid' ? (
              /* Vue Grille - Formations */
              <div className={showTPOnly ? "grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4" : ""}>
                {showTPOnly ? (
                  <>
                    {/* Section TP */}
                    {tpCourses.length > 0 && (
                      <div className="flex flex-col">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 pb-2 border-b-2 border-purple-500">
                          Travaux Pratiques ({tpCourses.length})
                        </h3>
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                          {tpCourses.map((course) => (
                            <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 flex flex-col">
                              <div className="p-3 sm:p-4 lg:p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2 sm:mb-3">
                                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words flex-1 pr-2 line-clamp-2">
                                    {course.title}
                                  </h3>
                                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                                    course.status === 'published'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {course.status === 'published' ? 'Publié' : 'Brouillon'}
                                  </span>
                                </div>

                                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 flex-1">
                                  {course.description || 'Aucune description disponible.'}
                                </p>

                                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                  {course.access_type === 'paid' && (
                                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700">
                                      💰 {course.price_cents ? `${course.price_cents / 100}€` : 'Prix à définir'}
                                    </span>
                                  )}
                                  {course.access_type === 'free' && (
                                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-green-100 text-green-700">
                                      Gratuit
                                    </span>
                                  )}
                                </div>

                                <div className="mt-auto">
                                  {profile?.role === 'admin' ? (
                                    <Link
                                      to={`/admin/courses/${course.id}`}
                                      className="btn-primary text-xs sm:text-sm w-full text-center block py-1.5 sm:py-2"
                                    >
                                      Gérer la formation
                                    </Link>
                                  ) : (
                                    <Link
                                      to={`/courses/${course.id}`}
                                      className="btn-primary text-xs sm:text-sm w-full text-center block py-1.5 sm:py-2"
                                    >
                                      Accéder à la formation
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Section Cours */}
                    {otherCourses.length > 0 && (
                      <div className="flex flex-col">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 pb-2 border-b-2 border-blue-500">
                          Cours ({otherCourses.length})
                        </h3>
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                          {otherCourses.map((course) => (
                            <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 flex flex-col">
                              <div className="p-3 sm:p-4 lg:p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2 sm:mb-3">
                                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words flex-1 pr-2 line-clamp-2">
                                    {course.title}
                                  </h3>
                                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                                    course.status === 'published'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {course.status === 'published' ? 'Publié' : 'Brouillon'}
                                  </span>
                                </div>

                                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 flex-1">
                                  {course.description || 'Aucune description disponible.'}
                                </p>

                                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                  {course.access_type === 'paid' && (
                                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700">
                                      💰 {course.price_cents ? `${course.price_cents / 100}€` : 'Prix à définir'}
                                    </span>
                                  )}
                                  {course.access_type === 'free' && (
                                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-green-100 text-green-700">
                                      Gratuit
                                    </span>
                                  )}
                                </div>

                                <div className="mt-auto">
                                  {profile?.role === 'admin' ? (
                                    <Link
                                      to={`/admin/courses/${course.id}`}
                                      className="btn-primary text-xs sm:text-sm w-full text-center block py-1.5 sm:py-2"
                                    >
                                      Gérer la formation
                                    </Link>
                                  ) : (
                                    <Link
                                      to={`/courses/${course.id}`}
                                      className="btn-primary text-xs sm:text-sm w-full text-center block py-1.5 sm:py-2"
                                    >
                                      Accéder à la formation
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredCourses.map((course) => (
                      <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border-l-4 border-blue-500 border-r border-t border-b border-gray-200 flex flex-col">
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Formation</span>
                            {course.progressStatus && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                course.progressStatus === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : course.progressStatus === 'in_progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {course.progressStatus === 'completed' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    Terminé
                                  </>
                                ) : course.progressStatus === 'in_progress' ? (
                                  <>
                                    <PlayCircle className="w-3 h-3" />
                                    En cours
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-3 h-3" />
                                    Non commencé
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-base font-semibold text-gray-900 break-words flex-1 pr-2 line-clamp-2">
                              {course.title}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                              course.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {course.status === 'published' ? 'Publié' : 'Brouillon'}
                            </span>
                          </div>

                          {/* Barre de progression */}
                          {course.progressPercent !== undefined && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600">Progression</span>
                                <span className="text-xs font-medium text-gray-700">{course.progressPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    course.progressPercent === 100
                                      ? 'bg-green-500'
                                      : course.progressPercent > 0
                                      ? 'bg-blue-500'
                                      : 'bg-gray-300'
                                  }`}
                                  style={{ width: `${course.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                            {course.description || 'Aucune description disponible.'}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {course.access_type === 'paid' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                💰 {course.price_cents ? `${course.price_cents / 100}€` : 'Prix à définir'}
                              </span>
                            )}
                            {course.access_type === 'free' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                Gratuit
                              </span>
                            )}
                          </div>

                          <div className="mt-auto">
                            {profile?.role === 'admin' ? (
                              <Link
                                to={`/admin/courses/${course.id}`}
                                className="btn-primary text-sm w-full text-center block"
                              >
                                Gérer la formation
                              </Link>
                            ) : course.progressStatus === 'in_progress' && course.progressPercent && course.progressPercent > 0 ? (
                              <Link
                                to={`/courses/${course.id}`}
                                className="btn-primary text-sm w-full text-center block bg-blue-600 hover:bg-blue-700"
                              >
                                Reprendre ({course.progressPercent}%)
                              </Link>
                            ) : (
                              <Link
                                to={`/courses/${course.id}`}
                                className="btn-primary text-sm w-full text-center block"
                              >
                                Accéder à la formation
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              ) : (
                /* Vue Liste - Formations */
              <div className={showTPOnly ? "grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6" : ""}>
                {showTPOnly ? (
                  <>
                    {tpCourses.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-50 border-b border-purple-200">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            Travaux Pratiques ({tpCourses.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {tpCourses.map((course) => (
                            <div 
                              key={course.id} 
                              className="p-3 sm:p-4 lg:p-5 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-300">
                                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                                      <span className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wide">Formation</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                        {course.title}
                                      </h3>
                                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                                        course.status === 'published'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                      }`}>
                                        {course.status === 'published' ? 'Publié' : 'Brouillon'}
                                      </span>
                                      {course.access_type === 'paid' && (
                                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700">
                                          💰 {course.price_cents ? `${course.price_cents / 100}€` : 'Prix à définir'}
                                        </span>
                                      )}
                                      {course.access_type === 'free' && (
                                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-green-100 text-green-700">
                                          Gratuit
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">
                                      {course.description || 'Aucune description disponible.'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 sm:ml-4">
                                  {profile?.role === 'admin' ? (
                                    <Link
                                      to={`/admin/courses/${course.id}`}
                                      className="btn-primary text-xs sm:text-sm inline-flex items-center py-1.5 sm:py-2"
                                    >
                                      Gérer
                                    </Link>
                                  ) : (
                                    <Link
                                      to={`/courses/${course.id}`}
                                      className="btn-primary text-xs sm:text-sm inline-flex items-center py-1.5 sm:py-2"
                                    >
                                      Accéder
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {otherCourses.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-50 border-b border-blue-200">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            Cours ({otherCourses.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {otherCourses.map((course) => (
                            <div 
                              key={course.id} 
                              className="p-3 sm:p-4 lg:p-5 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-300">
                                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                                      <span className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wide">Formation</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                        {course.title}
                                      </h3>
                                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                                        course.status === 'published'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                      }`}>
                                        {course.status === 'published' ? 'Publié' : 'Brouillon'}
                                      </span>
                                      {course.access_type === 'paid' && (
                                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700">
                                          💰 {course.price_cents ? `${course.price_cents / 100}€` : 'Prix à définir'}
                                        </span>
                                      )}
                                      {course.access_type === 'free' && (
                                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-green-100 text-green-700">
                                          Gratuit
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">
                                      {course.description || 'Aucune description disponible.'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 sm:ml-4">
                                  {profile?.role === 'admin' ? (
                                    <Link
                                      to={`/admin/courses/${course.id}`}
                                      className="btn-primary text-xs sm:text-sm inline-flex items-center py-1.5 sm:py-2"
                                    >
                                      Gérer
                                    </Link>
                                  ) : (
                                    <Link
                                      to={`/courses/${course.id}`}
                                      className="btn-primary text-xs sm:text-sm inline-flex items-center py-1.5 sm:py-2"
                                    >
                                      Accéder
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {filteredCourses.map((course) => (
                        <div 
                          key={course.id} 
                          className="p-3 sm:p-4 lg:p-5 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-300">
                                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                                  <span className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wide">Formation</span>
                                  {course.progressStatus && (
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      course.progressStatus === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : course.progressStatus === 'in_progress'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {course.progressStatus === 'completed' ? (
                                        <>
                                          <CheckCircle2 className="w-2.5 h-2.5" />
                                          Terminé
                                        </>
                                      ) : course.progressStatus === 'in_progress' ? (
                                        <>
                                          <PlayCircle className="w-2.5 h-2.5" />
                                          En cours
                                        </>
                                      ) : (
                                        <>
                                          <Circle className="w-2.5 h-2.5" />
                                          Non commencé
                                        </>
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                    {course.title}
                                  </h3>
                                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                                    course.status === 'published'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {course.status === 'published' ? 'Publié' : 'Brouillon'}
                                  </span>
                                  {course.progressPercent !== undefined && (
                                    <span className="text-xs font-medium text-gray-700">
                                      {course.progressPercent}%
                                    </span>
                                  )}
                                  {course.access_type === 'paid' && (
                                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700">
                                      💰 {course.price_cents ? `${course.price_cents / 100}€` : 'Prix à définir'}
                                    </span>
                                  )}
                                  {course.access_type === 'free' && (
                                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-green-100 text-green-700">
                                      Gratuit
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">
                                  {course.description || 'Aucune description disponible.'}
                                </p>
                                
                                {/* Barre de progression en mode liste */}
                                {course.progressPercent !== undefined && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-600">Progression</span>
                                      <span className="text-xs font-medium text-gray-700">{course.progressPercent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full transition-all ${
                                          course.progressPercent === 100
                                            ? 'bg-green-500'
                                            : course.progressPercent > 0
                                            ? 'bg-blue-500'
                                            : 'bg-gray-300'
                                        }`}
                                        style={{ width: `${course.progressPercent}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 sm:ml-4">
                              {profile?.role === 'admin' ? (
                                <Link
                                  to={`/admin/courses/${course.id}`}
                                  className="btn-primary text-xs sm:text-sm inline-flex items-center py-1.5 sm:py-2"
                                >
                                  Gérer
                                </Link>
                              ) : course.progressStatus === 'in_progress' && course.progressPercent && course.progressPercent > 0 ? (
                                <Link
                                  to={`/courses/${course.id}`}
                                  className="btn-primary text-xs sm:text-sm inline-flex items-center py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700"
                                >
                                  Reprendre
                                </Link>
                              ) : (
                                <Link
                                  to={`/courses/${course.id}`}
                                  className="btn-primary text-xs sm:text-sm inline-flex items-center py-1.5 sm:py-2"
                                >
                                  Accéder
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
            })()}
              </div>
            </div>
            )}

            {/* Contenu Programmes */}
            {activeContentTab === 'programs' && (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Layers className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                      {profile?.role === 'admin' ? 'Tous les programmes' : 'Mes programmes'}
                    </h2>
                    {programs.length > 0 && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        {programs.length}
                      </span>
                    )}
                  </div>
                </div>

                {programs.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="max-w-md mx-auto">
                      <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 text-base mb-2">
                        {profile?.role === 'admin'
                          ? 'Aucun programme créé pour le moment.'
                          : 'Vous n\'êtes inscrit à aucun programme.'}
                      </p>
                    </div>
                  </div>
                ) : viewMode === 'grid' ? (
                  /* Vue Grille - Programmes */
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {programs.map((program) => (
                  <div key={program.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border-l-4 border-purple-500 border-r border-t border-b border-gray-200 flex flex-col">
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Layers className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Programme</span>
                      </div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-base font-semibold text-gray-900 break-words flex-1 pr-2 line-clamp-2">
                          {program.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                          program.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {program.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                        {program.description || 'Aucune description disponible.'}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {program.access_type === 'paid' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            💰 {program.price_cents ? `${program.price_cents / 100}€` : 'Prix à définir'}
                          </span>
                        )}
                        {program.access_type === 'free' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            Gratuit
                          </span>
                        )}
                      </div>

                      <div className="mt-auto">
                        {profile?.role === 'admin' ? (
                          <Link
                            to={`/admin/programs/${program.id}`}
                            className="btn-primary text-sm w-full text-center block"
                          >
                            Gérer le programme
                          </Link>
                        ) : (
                          <Link
                            to={`/programs/${program.id}`}
                            className="btn-primary text-sm w-full text-center block"
                          >
                            Accéder au programme
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                  </div>
                ) : (
                  /* Vue Liste - Programmes */
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {programs.map((program) => (
                    <div 
                      key={program.id} 
                      className="p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center border-2 border-purple-300">
                            <Layers className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Programme</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {program.title}
                              </h3>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                program.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {program.status === 'published' ? 'Publié' : 'Brouillon'}
                              </span>
                              {program.access_type === 'paid' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  💰 {program.price_cents ? `${program.price_cents / 100}€` : 'Prix à définir'}
                                </span>
                              )}
                              {program.access_type === 'free' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  Gratuit
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {program.description || 'Aucune description disponible.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 sm:ml-4">
                          {profile?.role === 'admin' ? (
                            <Link
                              to={`/admin/programs/${program.id}`}
                              className="btn-primary text-sm inline-flex items-center"
                            >
                              Gérer
                            </Link>
                          ) : (
                            <Link
                              to={`/programs/${program.id}`}
                              className="btn-primary text-sm inline-flex items-center"
                            >
                              Accéder
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                  </div>
                )
                }
              </div>
            )}
          </section>
        </div>
      </main>
      </div>
    </div>
  )
}
