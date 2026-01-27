import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Course, Program } from '../types/database'
import { CourseLeadModal } from '../components/CourseLeadModal'
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Brain,
  Database,
  TestTube,
  Code,
  BarChart3,
  Lightbulb,
  TrendingDown,
  Shield,
  DollarSign,
  Rocket,
  PlayCircle,
  FileCode,
  FlaskConical,
  Layers,
  BookMarked,
  Star,
  ChevronRight,
  LogIn,
  UserPlus,
  Building2
} from 'lucide-react'

interface PlatformStats {
  totalCourses: number
  totalPrograms: number
  totalUsers: number
  totalEnrollments: number
  publishedCourses: number
}

interface ProgramWithCourses extends Program {
  courses: Course[]
}

export function LandingPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [newCourses, setNewCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [stats, setStats] = useState<PlatformStats>({
    totalCourses: 0,
    totalPrograms: 0,
    totalUsers: 0,
    totalEnrollments: 0,
    publishedCourses: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [programs, setPrograms] = useState<ProgramWithCourses[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)

  useEffect(() => {
    fetchNewCourses()
    fetchPlatformStats()
    fetchProgramsCatalog()
  }, [])

  const fetchPlatformStats = async () => {
    try {
      const [
        coursesResult,
        programsResult,
        usersResult,
        enrollmentsResult
      ] = await Promise.all([
        supabase.from('courses').select('id, status', { count: 'exact' }),
        supabase.from('programs').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active')
      ])

      const courses = coursesResult.data || []
      const publishedCourses = courses.filter(c => c.status === 'published').length

      setStats({
        totalCourses: coursesResult.count || courses.length,
        totalPrograms: programsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalEnrollments: enrollmentsResult.count || 0,
        publishedCourses
      })
    } catch (error) {
      console.error('Error fetching platform stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchProgramsCatalog = async () => {
    try {
      // Récupérer les programmes publiés
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(12)

      if (programsError) throw programsError

      if (!programsData || programsData.length === 0) {
        setPrograms([])
        setLoadingPrograms(false)
        return
      }

      // Pour chaque programme, récupérer les formations associées
      const programsWithCourses: ProgramWithCourses[] = []

      for (const program of programsData) {
        const { data: programCoursesData } = await supabase
          .from('program_courses')
          .select('course_id, position')
          .eq('program_id', program.id)
          .order('position', { ascending: true })

        if (programCoursesData && programCoursesData.length > 0) {
          const courseIds = programCoursesData.map(pc => pc.course_id)
          const { data: coursesData } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds)
            .eq('status', 'published')

          if (coursesData && coursesData.length > 0) {
            programsWithCourses.push({
              ...program,
              courses: coursesData
            })
          }
        }
      }

      setPrograms(programsWithCourses)
    } catch (error) {
      console.error('Error fetching programs catalog:', error)
    } finally {
      setLoadingPrograms(false)
    }
  }

  const fetchNewCourses = async () => {
    try {
      // Récupérer les formations publiques publiées dans les 30 derniers jours
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'published')
        .not('publication_date', 'is', null)
        .gte('publication_date', thirtyDaysAgo.toISOString())
        .order('publication_date', { ascending: false })
        .limit(5)

      if (error) throw error
      setNewCourses(data || [])
    } catch (error) {
      console.error('Error fetching new courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header simple pour landing page */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-extrabold text-blue-600">
                SCINNOVA LMS
              </span>
            </Link>

            {/* Boutons de connexion/inscription */}
            <div className="flex items-center gap-3">
              {user ? (
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Mon tableau de bord</span>
                  <span className="sm:hidden">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all border-2 border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg"
                  >
                    <LogIn className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Je me connecte</span>
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Je m'inscris</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white pt-24 md:pt-32">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Formations professionnelles en Data, IA, Développement et Systèmes
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 font-light">
              Pensées pour le terrain. Conçues par un formateur expert.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/app"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
              >
                Découvrir les formations
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              {user ? (
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-all border-2 border-white/30 shadow-lg"
                >
                  Accéder au LMS
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-all border-2 border-white/30 shadow-lg"
                >
                  Accéder au LMS
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Section 2: À qui s'adresse SCINNOVA ? */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              À qui s'adresse SCINNOVA ?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Apprenants */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Apprenants</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Monter en compétences</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Pratique et concret</span>
                </li>
              </ul>
            </div>

            {/* Entreprises */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Entreprises</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Formations sur mesure</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Montée en compétences équipes</span>
                </li>
              </ul>
            </div>

            {/* Organismes de formation */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Organismes de formation</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Interventions expertes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Contenus structurés et évaluables</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Ce qui fait la différence SCINNOVA */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ce qui fait la différence SCINNOVA
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Formations orientées métier', icon: Target },
              { title: 'TP réels, scénarios professionnels', icon: TestTube },
              { title: 'LMS intelligent (progression, badges)', icon: TrendingUp },
              { title: 'Approche pédagogique structurée', icon: BookOpen },
              { title: 'Expertise terrain (pas du contenu générique)', icon: Brain }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Aperçu du LMS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Aperçu du LMS
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une plateforme moderne et intuitive pour votre apprentissage
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 md:p-12 border-2 border-blue-200 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Interface intuitive</h3>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Navigation claire et structurée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Suivi de progression en temps réel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Badges et certifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Accès multi-appareils</span>
                  </li>
                </ul>
                <Link
                  to={user ? "/app" : "/login"}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Découvrir le LMS
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="bg-white rounded-xl p-8 border border-blue-200 shadow-lg">
                <div className="space-y-4">
                  <div className="h-4 bg-blue-100 rounded w-3/4"></div>
                  <div className="h-4 bg-blue-50 rounded w-full"></div>
                  <div className="h-4 bg-blue-50 rounded w-5/6"></div>
                  <div className="h-32 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200 mt-6 flex items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-blue-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Catalogue / exemples de formations */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Catalogue de formations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des parcours complets pour maîtriser les technologies de demain
            </p>
          </div>

          {loadingPrograms ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                </div>
              ))}
            </div>
          ) : programs.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {programs.slice(0, 6).map((program) => (
                  <div
                    key={program.id}
                    className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Layers className="w-6 h-6 text-white" />
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {program.courses.length} formation{program.courses.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{program.title}</h3>
                    {program.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{program.description}</p>
                    )}
                    <Link
                      to={`/programs/${program.id}`}
                      className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
                    >
                      Voir le programme
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <BookOpen className="w-5 h-5" />
                  Voir toutes les formations
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-blue-200">
              <BookOpen className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Catalogue en cours de construction</p>
            </div>
          )}
        </div>
      </section>

      {/* Section 6: Confiance & crédibilité */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Confiance et crédibilité
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-xl p-8 border border-blue-200">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Présentation de SCINNOVA</h3>
              <p className="text-gray-700 mb-4">
                SCINNOVA est une plateforme de formation professionnelle spécialisée en Data, Intelligence Artificielle, 
                Développement et Systèmes. Conçue par un formateur expert avec une solide expérience terrain.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-8 border border-blue-200">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Interventions pour organismes</h3>
              <p className="text-gray-700 mb-4">
                SCINNOVA intervient régulièrement auprès d'organismes de formation pour dispenser des formations 
                expertes et structurées, avec des contenus évaluables et adaptés aux besoins métier.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
            <div className="flex items-start gap-4">
              <Lightbulb className="w-8 h-8 text-blue-200 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">Expérience terrain</h3>
                <p className="text-blue-100">
                  Toutes nos formations sont pensées pour le terrain. Pas de contenu générique, mais des scénarios 
                  réels, des TP pratiques et une approche pédagogique qui fait la différence. L'expertise SCINNOVA 
                  vient d'années d'expérience en formation professionnelle et d'une connaissance approfondie des 
                  besoins des entreprises et des apprenants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Call To Action final */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à monter en compétences autrement ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez SCINNOVA et développez vos compétences avec des formations pensées pour le terrain
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/app"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
            >
              Accéder aux formations
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-all border-2 border-white/30 shadow-lg"
            >
              Contacter SCINNOVA
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Modal de collecte d'email */}
      {selectedCourse && (
        <CourseLeadModal
          courseId={selectedCourse.id}
          courseTitle={selectedCourse.title}
          isOpen={showLeadModal}
          onClose={() => {
            setShowLeadModal(false)
            setSelectedCourse(null)
          }}
          onSuccess={() => {
            // Optionnel : rediriger vers la page d'inscription après succès
            // navigate('/register')
          }}
        />
      )}
    </div>
  )
}

