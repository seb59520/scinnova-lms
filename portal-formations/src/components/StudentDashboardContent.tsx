import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Course, Enrollment, Program, ProgramEnrollment, Glossary, PedagogicalObjective, Prerequisite } from '../types/database'
import {
  Calendar, BookOpen, Layers, ClipboardCheck, CheckCircle,
  Target, Lightbulb, HelpCircle, Award, Rocket, BookMarked,
  Code, FileQuestion, FileCheck, GraduationCap, ChevronRight,
  X, Book, ExternalLink, Search
} from 'lucide-react'

interface ProjectToSubmit {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: string
  session_id: string
  session_title: string
  submission_status: 'not_started' | 'draft' | 'submitted' | 'evaluated'
  is_published: boolean
  score?: number | null
  passed?: boolean | null
}

interface CourseWithEnrollment extends Course {
  enrollment?: Enrollment
  type?: 'course'
  progressPercent?: number
  lastAccessedAt?: string | null
  progressStatus?: 'not_started' | 'in_progress' | 'completed'
  pedagogical_objectives?: PedagogicalObjective[] | null
  prerequisites?: Prerequisite[] | null
  recommended_path?: string | null
}

interface ProgramWithEnrollment extends Program {
  enrollment?: ProgramEnrollment
  type?: 'program'
}

interface ObjectiveOption {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  description: string
  contentTypes: string[]
}

const objectives: ObjectiveOption[] = [
  {
    id: 'beginner',
    label: 'Je débute',
    icon: <Lightbulb className="w-5 h-5" />,
    color: 'bg-green-500',
    description: 'Découvrir les bases et comprendre les fondamentaux',
    contentTypes: ['Cours', 'Exemples commentés']
  },
  {
    id: 'review',
    label: 'Je révise',
    icon: <BookMarked className="w-5 h-5" />,
    color: 'bg-blue-500',
    description: 'Revoir les concepts clés et consolider mes acquis',
    contentTypes: ['Ressources clés', 'Quiz', 'Cours']
  },
  {
    id: 'stuck',
    label: 'Je bloque sur un concept',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'bg-orange-500',
    description: 'Comprendre un point difficile avec des explications détaillées',
    contentTypes: ['Exemples commentés', 'Corrections détaillées', 'Exercices guidés']
  },
  {
    id: 'exam',
    label: 'Je prépare une évaluation',
    icon: <Award className="w-5 h-5" />,
    color: 'bg-purple-500',
    description: 'M\'entraîner et valider mes connaissances',
    contentTypes: ['Quiz', 'Exercices guidés', 'TP contextualisés']
  },
  {
    id: 'advanced',
    label: 'Je veux aller plus loin',
    icon: <Rocket className="w-5 h-5" />,
    color: 'bg-indigo-500',
    description: 'Approfondir et me challenger avec des cas complexes',
    contentTypes: ['TP contextualisés', 'Ressources clés']
  }
]

const contentTypeInfo: Record<string, { description: string; icon: React.ReactNode }> = {
  'Cours': { description: 'Apporter la connaissance', icon: <BookOpen className="w-4 h-4" /> },
  'Exemples commentés': { description: 'Montrer comment on applique', icon: <Code className="w-4 h-4" /> },
  'Exercices guidés': { description: 'Vérifier la compréhension', icon: <FileQuestion className="w-4 h-4" /> },
  'TP contextualisés': { description: 'Mettre en situation réelle', icon: <Target className="w-4 h-4" /> },
  'Quiz': { description: 'Valider les acquis', icon: <CheckCircle className="w-4 h-4" /> },
  'Corrections détaillées': { description: 'Apprendre par l\'erreur', icon: <FileCheck className="w-4 h-4" /> },
  'Ressources clés': { description: 'Révisions / approfondissement', icon: <BookMarked className="w-4 h-4" /> }
}

interface ProgramDetails {
  id: string
  title: string
  description: string | null
  glossary: Glossary | null
  thumbnail_image_path: string | null
  courses: Array<{ id: string; title: string; description: string | null; position: number }>
}

// Helper pour obtenir l'URL publique d'une image
const getThumbnailUrl = (path: string | null | undefined): string | null => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const cleanPath = path.replace(/^course-assets\//, '')
  const { data } = supabase.storage.from('course-assets').getPublicUrl(cleanPath)
  return data.publicUrl
}

export function StudentDashboardContent() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([])
  const [programs, setPrograms] = useState<ProgramWithEnrollment[]>([])
  const [projects, setProjects] = useState<ProjectToSubmit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null)

  // État pour le tooltip du programme
  const [selectedProgram, setSelectedProgram] = useState<ProgramDetails | null>(null)
  const [loadingProgram, setLoadingProgram] = useState(false)
  const [glossarySearch, setGlossarySearch] = useState('')
  const tooltipRef = useRef<HTMLDivElement>(null)

  // État pour le preview de cours
  const [selectedCourse, setSelectedCourse] = useState<CourseWithEnrollment | null>(null)
  const courseTooltipRef = useRef<HTMLDivElement>(null)

  // Fermer le tooltip quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setSelectedProgram(null)
        setGlossarySearch('')
      }
      if (courseTooltipRef.current && !courseTooltipRef.current.contains(event.target as Node)) {
        setSelectedCourse(null)
      }
    }
    if (selectedProgram || selectedCourse) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedProgram, selectedCourse])

  // Reset glossary search when program changes
  useEffect(() => {
    setGlossarySearch('')
  }, [selectedProgram?.id])

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  const fetchData = async () => {
    if (!user?.id) return
    setLoading(true)

    try {
      const [coursesData, programsData, projectsData] = await Promise.all([
        fetchCourses(),
        fetchPrograms(),
        fetchProjects()
      ])

      setCourses(coursesData)
      setPrograms(programsData)
      setProjects(projectsData)

      if (coursesData.length > 0) {
        await fetchCourseProgress(coursesData)
      }
    } catch (error) {
      console.error('Error fetching student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async (): Promise<CourseWithEnrollment[]> => {
    if (!user?.id) return []

    const addedCourseIds = new Set<string>()
    const allCourses: CourseWithEnrollment[] = []

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, courses (*)')
      .eq('user_id', user.id)
      .eq('status', 'active')

    enrollments?.forEach((e: any) => {
      if (e.courses?.id && !addedCourseIds.has(e.courses.id)) {
        addedCourseIds.add(e.courses.id)
        allCourses.push({ ...e.courses, enrollment: e, type: 'course' })
      }
    })

    const { data: sessionMembers } = await supabase
      .from('session_members')
      .select('*, session:sessions (id, title, course_id)')
      .eq('user_id', user.id)
      .eq('role', 'learner')

    const courseIdsFromSessions = sessionMembers
      ?.filter((sm: any) => sm.session?.course_id && !addedCourseIds.has(sm.session.course_id))
      .map((sm: any) => sm.session.course_id) || []

    if (courseIdsFromSessions.length > 0) {
      const { data: sessionCourses } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIdsFromSessions)

      sessionCourses?.forEach((course: any) => {
        if (!addedCourseIds.has(course.id)) {
          addedCourseIds.add(course.id)
          allCourses.push({ ...course, type: 'course' })
        }
      })
    }

    return allCourses.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  const fetchPrograms = async (): Promise<ProgramWithEnrollment[]> => {
    if (!user?.id) return []

    const { data: programEnrollments } = await supabase
      .from('program_enrollments')
      .select('*, programs (*)')
      .eq('user_id', user.id)
      .eq('status', 'active')

    return (programEnrollments?.map((e: any) => ({
      ...e.programs,
      enrollment: e,
      type: 'program' as const
    })) || []).sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  const fetchProjects = async (): Promise<ProjectToSubmit[]> => {
    if (!user?.id) return []

    const { data: memberSessions } = await supabase
      .from('session_members')
      .select('session_id, role, session:sessions(id, title)')
      .eq('user_id', user.id)

    const learnerSessions = memberSessions?.filter(m => m.role === 'learner') || []
    if (learnerSessions.length === 0) return []

    const sessionIds = learnerSessions.map(m => m.session_id)
    const sessionMap = new Map(learnerSessions.map(m => [m.session_id, (m.session as any)?.title || 'Session']))

    const { data: restitutions } = await supabase
      .from('session_project_restitutions')
      .select('*')
      .in('session_id', sessionIds)
      .in('status', ['open', 'published', 'grading', 'completed'])

    if (!restitutions || restitutions.length === 0) return []

    const restitutionIds = restitutions.map(r => r.id)
    const { data: submissions } = await supabase
      .from('project_submissions')
      .select('restitution_id, status')
      .eq('user_id', user.id)
      .in('restitution_id', restitutionIds)

    const submissionMap = new Map(submissions?.map(s => [s.restitution_id, s.status]) || [])

    const { data: evaluations } = await supabase
      .from('project_evaluations')
      .select('restitution_id, is_published, score_20, final_score, passed')
      .eq('user_id', user.id)
      .in('restitution_id', restitutionIds)

    const publishedEvaluations = evaluations?.filter(e => e.is_published) || []
    const evaluationMap = new Map(publishedEvaluations.map(e => [e.restitution_id, {
      is_published: e.is_published,
      score: e.final_score || e.score_20,
      passed: e.passed
    }]))

    const projectsList: ProjectToSubmit[] = restitutions.map(r => {
      const subStatus = submissionMap.get(r.id)
      const evaluation = evaluationMap.get(r.id)

      let submission_status: ProjectToSubmit['submission_status'] = 'not_started'
      if (evaluation?.is_published) {
        submission_status = 'evaluated'
      } else if (subStatus === 'submitted' || subStatus === 'evaluated') {
        submission_status = 'submitted'
      } else if (subStatus === 'draft') {
        submission_status = 'draft'
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
      }
    })

    return projectsList.sort((a, b) => {
      const order = { not_started: 0, draft: 1, submitted: 2, evaluated: 3 }
      if (order[a.submission_status] !== order[b.submission_status]) {
        return order[a.submission_status] - order[b.submission_status]
      }
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return 0
    })
  }

  const fetchCourseProgress = async (coursesList: CourseWithEnrollment[]) => {
    if (!user?.id || coursesList.length === 0) return

    const courseIds = coursesList.map(c => c.id)

    const { data: modules } = await supabase
      .from('modules')
      .select('id, course_id')
      .in('course_id', courseIds)

    const moduleIds = modules?.map(m => m.id) || []
    if (moduleIds.length === 0) return

    const { data: progressions } = await supabase
      .from('module_progress')
      .select('module_id, percent, updated_at, started_at')
      .eq('user_id', user.id)
      .in('module_id', moduleIds)

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
        const hasStarted = courseProgressions.some(p => p.started_at !== null)

        progressMap[courseId] = { percent: avgPercent, lastAccessed, hasStarted }
      } else {
        progressMap[courseId] = { percent: 0, lastAccessed: null, hasStarted: false }
      }
    })

    setCourses(prevCourses =>
      prevCourses.map(course => {
        const progress = progressMap[course.id]
        if (progress) {
          let progressStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started'
          if (progress.percent === 100) {
            progressStatus = 'completed'
          } else if (progress.hasStarted || progress.percent > 0) {
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
  }

  // Charger les détails d'un programme (cours et glossaire)
  const fetchProgramDetails = async (program: ProgramWithEnrollment) => {
    if (selectedProgram?.id === program.id) {
      setSelectedProgram(null)
      return
    }

    setLoadingProgram(true)
    try {
      // Récupérer les cours du programme
      const { data: programCourses } = await supabase
        .from('program_courses')
        .select('course_id, position')
        .eq('program_id', program.id)
        .order('position', { ascending: true })

      let coursesDetails: ProgramDetails['courses'] = []
      if (programCourses && programCourses.length > 0) {
        const courseIds = programCourses.map(pc => pc.course_id)
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title, description')
          .in('id', courseIds)

        if (coursesData) {
          coursesDetails = programCourses.map(pc => {
            const course = coursesData.find(c => c.id === pc.course_id)
            return {
              id: pc.course_id,
              title: course?.title || 'Formation',
              description: course?.description || null,
              position: pc.position
            }
          })
        }
      }

      setSelectedProgram({
        id: program.id,
        title: program.title,
        description: program.description,
        glossary: program.glossary || null,
        thumbnail_image_path: program.thumbnail_image_path || null,
        courses: coursesDetails
      })
    } catch (error) {
      console.error('Error fetching program details:', error)
    } finally {
      setLoadingProgram(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Formations en cours = celles avec progressStatus 'in_progress' (même si percent = 0)
  const inProgressCourses = courses.filter(c => c.progressStatus === 'in_progress')
  const completedCourses = courses.filter(c => c.progressStatus === 'completed')
  const notStartedCourses = courses.filter(c => c.progressStatus === 'not_started' || !c.progressStatus)

  return (
    <div className="space-y-6">
      {/* Projects Section - Full width at top if any */}
      {projects.filter(p => p.submission_status !== 'evaluated').length > 0 && (
        <section className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <ClipboardCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-semibold text-gray-900">Projets à rendre</h2>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {projects.filter(p => p.submission_status !== 'evaluated').length} en attente
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {projects.filter(p => p.submission_status !== 'evaluated').slice(0, 4).map(project => {
              const isOverdue = project.due_date && new Date(project.due_date) < new Date()
              return (
                <Link
                  key={project.id}
                  to={`/session/${project.session_id}/project/${project.id}`}
                  className={`flex-shrink-0 w-56 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 p-3 ${
                    isOverdue ? 'border-red-500' :
                    project.submission_status === 'draft' ? 'border-yellow-500' :
                    'border-purple-500'
                  }`}
                >
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{project.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{project.session_title}</p>
                  {project.due_date && (
                    <p className={`text-xs mt-2 flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                      <Calendar className="w-3 h-3" />
                      {new Date(project.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Objective Selection */}
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-xl p-5 border border-indigo-100 h-fit">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Quel est votre objectif ?</h2>
              <p className="text-xs text-gray-600">Cliquez pour voir les ressources</p>
            </div>
          </div>

          <div className="space-y-2">
            {objectives.map(obj => (
              <button
                key={obj.id}
                onClick={() => setSelectedObjective(selectedObjective === obj.id ? null : obj.id)}
                className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                  selectedObjective === obj.id
                    ? 'border-indigo-500 bg-white shadow-md'
                    : 'border-transparent bg-white/60 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${obj.color} text-white flex items-center justify-center flex-shrink-0`}>
                  {obj.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm">{obj.label}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{obj.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Objective Details */}
          {selectedObjective && (
            <div className="mt-4 p-3 bg-white rounded-xl border border-gray-200">
              <p className="text-xs text-gray-600 mb-2 font-medium">Contenus recommandés :</p>
              <div className="space-y-1.5">
                {objectives.find(o => o.id === selectedObjective)?.contentTypes.map(type => {
                  const info = contentTypeInfo[type]
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg text-xs"
                    >
                      <span className="text-indigo-600">{info?.icon}</span>
                      <span className="font-medium text-gray-900">{type}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500 truncate">{info?.description}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Programs (Parcours) - Point d'entrée principal */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-fit relative">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Mes parcours</h2>
                <p className="text-xs text-gray-500">
                  {programs.length} parcours disponible{programs.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <p className="text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
              Vos programmes de formation. Cliquez sur un parcours pour decouvrir ses formations et commencer votre apprentissage.
            </p>
          </div>

          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {programs.length > 0 ? (
              programs.map(program => {
                const thumbnailUrl = getThumbnailUrl(program.thumbnail_image_path)
                return (
                  <button
                    key={program.id}
                    onClick={() => fetchProgramDetails(program)}
                    className={`w-full text-left bg-purple-50 rounded-lg overflow-hidden hover:bg-purple-100 transition-colors border group ${
                      selectedProgram?.id === program.id ? 'border-purple-400 ring-2 ring-purple-200' : 'border-purple-100'
                    }`}
                  >
                    {/* Vignette du programme */}
                    {thumbnailUrl ? (
                      <div className="relative h-28 w-full">
                        <img
                          src={thumbnailUrl}
                          alt={program.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <h3 className="font-medium text-white text-sm line-clamp-1 drop-shadow-md">
                            {program.title}
                          </h3>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 pb-0">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                          <span className="text-purple-600">Parcours : </span>{program.title}
                        </h3>
                      </div>
                    )}
                    <div className="p-3">
                      {program.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{program.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-purple-600 group-hover:text-purple-700">
                        {loadingProgram && selectedProgram?.id === program.id ? (
                          <span className="animate-pulse">Chargement...</span>
                        ) : (
                          <>
                            <BookOpen className="w-3 h-3" />
                            <span>Voir les formations</span>
                            <ChevronRight className="w-3 h-3" />
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">Aucun parcours disponible</p>
                <p className="text-xs text-gray-400 mt-1">
                  Les parcours regroupent plusieurs formations
                </p>
              </div>
            )}
          </div>

          {/* Tooltip/Popover pour le programme sélectionné */}
          {selectedProgram && (
            <div
              ref={tooltipRef}
              className="absolute top-0 left-0 right-0 z-50 bg-white rounded-xl border-2 border-purple-300 shadow-xl overflow-hidden m-2"
            >
              {/* Header avec vignette */}
              {selectedProgram.thumbnail_image_path && getThumbnailUrl(selectedProgram.thumbnail_image_path) ? (
                <div className="relative h-32 w-full">
                  <img
                    src={getThumbnailUrl(selectedProgram.thumbnail_image_path)!}
                    alt={selectedProgram.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <button
                    onClick={() => setSelectedProgram(null)}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-semibold text-white text-lg drop-shadow-md">
                      {selectedProgram.title}
                    </h3>
                    {selectedProgram.description && (
                      <p className="text-xs text-white/90 mt-1 line-clamp-2 drop-shadow">{selectedProgram.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between p-4 pb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      <span className="text-purple-600">Parcours : </span>{selectedProgram.title}
                    </h3>
                    {selectedProgram.description && (
                      <p className="text-xs text-gray-500 mt-1">{selectedProgram.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedProgram(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}

              <div className="p-4 pt-3">

              {/* Liste des formations */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Formations incluses ({selectedProgram.courses.length})
                </h4>
                {selectedProgram.courses.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedProgram.courses.map((course, index) => (
                      <Link
                        key={course.id}
                        to={`/courses/${course.id}`}
                        className="flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm group"
                        onClick={() => setSelectedProgram(null)}
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <span className="flex-1 text-gray-900 group-hover:text-blue-700 line-clamp-1">{course.title}</span>
                        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucune formation dans ce parcours</p>
                )}
              </div>

              {/* Glossaire avec recherche (compact) */}
              {selectedProgram.glossary && selectedProgram.glossary.terms && selectedProgram.glossary.terms.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                      <Book className="w-3 h-3" />
                      Glossaire
                    </h4>
                    <Link
                      to={`/programs/${selectedProgram.id}/glossary`}
                      className="text-[10px] text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                      onClick={() => setSelectedProgram(null)}
                    >
                      Voir tout <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Champ de recherche compact */}
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={glossarySearch}
                      onChange={(e) => setGlossarySearch(e.target.value)}
                      className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                    {glossarySearch && (
                      <button
                        onClick={() => setGlossarySearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Résultats : juste les mots en tags */}
                  {(() => {
                    const searchLower = glossarySearch.toLowerCase().trim()
                    const filteredTerms = searchLower
                      ? selectedProgram.glossary!.terms.filter(term =>
                          term.word.toLowerCase().includes(searchLower) ||
                          term.explanation.toLowerCase().includes(searchLower)
                        )
                      : selectedProgram.glossary!.terms

                    const totalCount = selectedProgram.glossary!.terms.length

                    return (
                      <>
                        <div className="text-[10px] text-gray-500 mb-1.5">
                          {searchLower
                            ? `${filteredTerms.length} résultat${filteredTerms.length > 1 ? 's' : ''}`
                            : `${totalCount} termes`
                          }
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {filteredTerms.slice(0, 12).map(term => (
                            <Link
                              key={term.id}
                              to={`/programs/${selectedProgram.id}/glossary?term=${encodeURIComponent(term.id)}`}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-200 text-amber-700 rounded text-xs cursor-pointer transition-colors"
                              title={`${term.explanation.slice(0, 100)}${term.explanation.length > 100 ? '...' : ''} (cliquez pour voir)`}
                              onClick={() => setSelectedProgram(null)}
                            >
                              {term.word}
                            </Link>
                          ))}
                          {filteredTerms.length > 12 && (
                            <span className="px-2 py-0.5 text-gray-400 text-xs">
                              +{filteredTerms.length - 12}
                            </span>
                          )}
                        </div>
                        {searchLower && filteredTerms.length === 0 && (
                          <p className="text-xs text-gray-400 italic">Aucun résultat</p>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Bouton pour accéder au parcours complet */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedProgram(null)
                    navigate(`/programs/${selectedProgram.id}`)
                  }}
                  className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  Accéder au parcours complet
                </button>
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Column 3: In-Progress Courses (Formations entamées) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-fit relative">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Formations en cours</h2>
                <p className="text-xs text-gray-500">
                  {inProgressCourses.length} formation{inProgressCourses.length > 1 ? 's' : ''} entamee{inProgressCourses.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
              Formations que vous avez commencees. Pour en demarrer une nouvelle, explorez vos parcours ci-contre.
            </p>
          </div>

          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {inProgressCourses.length > 0 ? (
              <>
                {inProgressCourses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(selectedCourse?.id === course.id ? null : course)}
                    className={`w-full text-left bg-blue-50 rounded-lg p-3 hover:bg-blue-100 transition-colors border ${
                      selectedCourse?.id === course.id ? 'border-blue-400 ring-2 ring-blue-200' : 'border-blue-100'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{course.title}</h3>
                    {course.progressPercent !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progression</span>
                          <span className="font-medium text-blue-600">{course.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${course.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-2">
                      <Target className="w-3 h-3" />
                      <span>Cliquez pour voir les details</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">Aucune formation entamee</p>
                <p className="text-xs text-gray-400 mt-2 px-2">
                  Choisissez un parcours et lancez-vous dans une formation pour la voir apparaitre ici.
                </p>
              </div>
            )}

          {/* Tooltip/Popover pour le cours sélectionné */}
          {selectedCourse && (
            <div
              ref={courseTooltipRef}
              className="absolute top-0 left-0 right-0 z-50 bg-white rounded-xl border-2 border-blue-300 shadow-xl p-4 m-2"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedCourse.title}</h3>
                  {selectedCourse.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{selectedCourse.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Objectifs pédagogiques */}
              {selectedCourse.pedagogical_objectives && selectedCourse.pedagogical_objectives.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3 text-blue-600" />
                    Objectifs ({selectedCourse.pedagogical_objectives.length})
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedCourse.pedagogical_objectives.slice(0, 4).map((obj, index) => (
                      <div key={obj.id} className="flex items-start gap-2 text-xs">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[10px] font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-600 line-clamp-1">{obj.text}</span>
                      </div>
                    ))}
                    {selectedCourse.pedagogical_objectives.length > 4 && (
                      <p className="text-xs text-gray-400 pl-6">+{selectedCourse.pedagogical_objectives.length - 4} autres...</p>
                    )}
                  </div>
                </div>
              )}

              {/* Prérequis */}
              {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-amber-600" />
                    Prerequis ({selectedCourse.prerequisites.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedCourse.prerequisites.slice(0, 5).map((prereq) => {
                      const levelColors: Record<string, string> = {
                        required: 'bg-red-50 text-red-700 border-red-200',
                        recommended: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                        optional: 'bg-gray-50 text-gray-600 border-gray-200'
                      }
                      return (
                        <span
                          key={prereq.id}
                          className={`px-2 py-0.5 rounded border text-[10px] ${levelColors[prereq.level || 'required']}`}
                          title={prereq.text}
                        >
                          {prereq.text.length > 30 ? prereq.text.slice(0, 30) + '...' : prereq.text}
                        </span>
                      )
                    })}
                    {selectedCourse.prerequisites.length > 5 && (
                      <span className="px-2 py-0.5 text-gray-400 text-[10px]">
                        +{selectedCourse.prerequisites.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Parcours conseillé */}
              {selectedCourse.recommended_path && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Rocket className="w-3 h-3 text-green-600" />
                    Parcours conseille
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{selectedCourse.recommended_path}</p>
                </div>
              )}

              {/* Message si pas de metadata */}
              {(!selectedCourse.pedagogical_objectives || selectedCourse.pedagogical_objectives.length === 0) &&
               (!selectedCourse.prerequisites || selectedCourse.prerequisites.length === 0) &&
               !selectedCourse.recommended_path && (
                <p className="text-xs text-gray-400 italic mb-3">
                  Les informations pedagogiques seront disponibles prochainement.
                </p>
              )}

              {/* Bouton pour accéder à la formation */}
              <div className="pt-3 border-t border-gray-100">
                <Link
                  to={`/courses/${selectedCourse.id}`}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  onClick={() => setSelectedCourse(null)}
                >
                  <BookOpen className="w-4 h-4" />
                  Continuer la formation
                </Link>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Completed courses section */}
      {completedCourses.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-semibold text-gray-900">Formations terminees</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {completedCourses.length} completee{completedCourses.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {completedCourses.map(course => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="bg-green-50 rounded-lg p-3 hover:bg-green-100 transition-colors border border-green-100 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{course.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
