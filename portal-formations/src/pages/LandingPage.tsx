import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AppHeader } from '../components/AppHeader'
import { supabase } from '../lib/supabaseClient'
import { Course } from '../types/database'
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
  FlaskConical
} from 'lucide-react'

export function LandingPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [newCourses, setNewCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showLeadModal, setShowLeadModal] = useState(false)

  useEffect(() => {
    fetchNewCourses()
  }, [])

  const fetchNewCourses = async () => {
    try {
      // Récupérer les formations publiques publiées dans les 30 derniers jours
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_public', true)
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

  const features = [
    {
      icon: BookOpen,
      title: 'Formations interactives',
      description: 'Accédez à des contenus pédagogiques riches et interactifs, adaptés à votre rythme d\'apprentissage.'
    },
    {
      icon: GraduationCap,
      title: 'Programmes structurés',
      description: 'Suivez des parcours de formation complets et progressifs pour développer vos compétences.'
    },
    {
      icon: Users,
      title: 'Communauté apprenante',
      description: 'Échangez avec vos pairs et formateurs dans un environnement collaboratif et bienveillant.'
    },
    {
      icon: Award,
      title: 'Certifications',
      description: 'Validez vos acquis et obtenez des certifications reconnues pour valoriser votre parcours.'
    },
    {
      icon: Clock,
      title: 'Apprentissage flexible',
      description: 'Apprenez quand vous voulez, où vous voulez, sur tous vos appareils.'
    },
    {
      icon: TrendingUp,
      title: 'Suivi de progression',
      description: 'Visualisez votre progression en temps réel et identifiez vos points d\'amélioration.'
    }
  ]

  const stats = [
    { label: 'Formations disponibles', value: '50+' },
    { label: 'Apprenants actifs', value: '1000+' },
    { label: 'Taux de satisfaction', value: '98%' },
    { label: 'Certifications délivrées', value: '500+' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <AppHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white pt-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Plateforme d'apprentissage nouvelle génération</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Bienvenue sur{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                SCINNOVA LMS
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              La soif d'apprendre. Développez vos compétences avec nos formations expertes et 
              rejoignez une communauté d'apprenants passionnés.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
                >
                  Accéder à mon tableau de bord
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Commencer gratuitement
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-all border-2 border-white/30"
                  >
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* New Courses Alert Section */}
      {!loadingCourses && newCourses.length > 0 && (
        <section className="py-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                🎉 Nouvelles formations disponibles
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => {
                    if (user) {
                      navigate(`/courses/${course.id}`)
                    } else {
                      setSelectedCourse(course)
                      setShowLeadModal(true)
                    }
                  }}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all border border-blue-200 hover:border-blue-400 group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          Nouveau
                        </span>
                        {course.publication_date && (
                          <span className="text-xs text-gray-500">
                            {new Date(course.publication_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {course.description.substring(0, 100)}
                          {course.description.length > 100 ? '...' : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {course.access_type === 'free' ? '✅ Gratuit' : course.price_cents ? `💰 ${(course.price_cents / 100).toFixed(2)} ${course.currency || 'EUR'}` : 'Sur invitation'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir SCINNOVA LMS ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète conçue pour votre réussite et votre développement professionnel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-blue-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Target className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à commencer votre parcours d'apprentissage ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez des milliers d'apprenants qui développent leurs compétences avec SCINNOVA LMS
          </p>
          {user ? (
            <Link
              to="/app"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Accéder à mes formations
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
              >
                Créer mon compte gratuit
                <Zap className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-all border-2 border-white/30"
              >
                J'ai déjà un compte
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nos formations phares
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des parcours pratiques et interactifs pour maîtriser les technologies de demain
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Machine Learning Python */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 shadow-lg border-2 border-orange-200 hover:border-orange-400 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Machine Learning Python</h3>
                  <p className="text-sm text-gray-600">Formation avancée</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Maîtrisez les algorithmes de machine learning avec Python. De la régression logistique aux réseaux de neurones, apprenez en pratiquant sur des cas réels.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Scikit-learn</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">TensorFlow</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Pandas</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>2h de pratique interactive</span>
              </div>
            </div>

            {/* Big Data */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Big Data</h3>
                  <p className="text-sm text-gray-600">Fondamentaux</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Comprenez les enjeux du Big Data et apprenez à manipuler de grands volumes de données. Analysez des datasets réels et découvrez les outils essentiels.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Apache Spark</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Hadoop</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Kafka</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>Pratique sur dataset Titanic</span>
              </div>
            </div>

            {/* Data Science */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Data Science</h3>
                  <p className="text-sm text-gray-600">Analyse avancée</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                Explorez les données, identifiez les patterns et créez des visualisations impactantes. Apprenez les techniques d'analyse statistique et de visualisation.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Visualisation</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Statistiques</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Patterns</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>Exercices interactifs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testing Platforms Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-sm font-medium mb-4">
              <TestTube className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">Apprentissage par la pratique</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Plateformes de test interactives
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Testez vos connaissances en conditions réelles avec nos plateformes dédiées. 
              Apprenez en expérimentant, pas seulement en lisant.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Titanic Learning Platform */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FlaskConical className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Titanic Learning App</h3>
                  <p className="text-gray-600">Dataset réel pour apprendre</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Utilisez le dataset historique du Titanic pour apprendre le Big Data, la Data Science et le Machine Learning. 
                Analysez des données réelles, créez des visualisations et faites des prédictions.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">3 modules progressifs (Big Data → Data Science → ML)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Exercices interactifs avec feedback immédiat</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Export des résultats pour analyse approfondie</span>
                </div>
              </div>
              <a
                href="https://titaniclearning.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
              >
                <PlayCircle className="w-5 h-5" />
                Tester la plateforme
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Use Cases Platform */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Use Cases & Impacts</h3>
                  <p className="text-gray-600">Cas d'usage réels</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Explorez des cas d'usage concrets du Big Data et de la Data Science. Analysez les impacts 
                organisationnels, techniques, économiques et sociaux de projets réels.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Cas d'usage multi-secteurs (Finance, Santé, E-commerce...)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Calcul de ROI et impacts mesurables</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">ML Playground pour tester les algorithmes</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg">
                <Code className="w-5 h-5" />
                Intégré au LMS
              </div>
            </div>
          </div>

          {/* Why Testing Matters */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <Lightbulb className="w-12 h-12 text-yellow-300" />
                <h3 className="text-2xl md:text-3xl font-bold">Pourquoi apprendre par le test ?</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">Rétention améliorée</h4>
                      <p className="text-blue-100 text-sm">La pratique active augmente la rétention de 75% par rapport à la lecture passive</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">Compréhension profonde</h4>
                      <p className="text-blue-100 text-sm">Tester permet de comprendre les mécanismes, pas seulement les concepts</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">Confiance en soi</h4>
                      <p className="text-blue-100 text-sm">L'expérimentation renforce la confiance pour appliquer en situation réelle</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">Détection des erreurs</h4>
                      <p className="text-blue-100 text-sm">Les erreurs deviennent des opportunités d'apprentissage immédiat</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demystification Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Démystifions ensemble
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Les technologies de la data ne sont pas réservées aux experts. 
              Nous rendons les concepts complexes accessibles à tous.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Machine Learning</h3>
              <p className="text-gray-700 mb-4">
                <strong className="text-gray-900">Ce n'est pas :</strong> Une boîte noire magique réservée aux mathématiciens
              </p>
              <p className="text-gray-700">
                <strong className="text-gray-900">C'est :</strong> Des algorithmes qui apprennent à partir d'exemples, comme vous apprenez à reconnaître un chat après en avoir vu plusieurs.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Big Data</h3>
              <p className="text-gray-700 mb-4">
                <strong className="text-gray-900">Ce n'est pas :</strong> Juste "beaucoup de données" nécessitant des serveurs géants
              </p>
              <p className="text-gray-700">
                <strong className="text-gray-900">C'est :</strong> Des données trop volumineuses pour un seul ordinateur, nécessitant des techniques de traitement distribuées que vous pouvez comprendre et utiliser.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Data Science</h3>
              <p className="text-gray-700 mb-4">
                <strong className="text-gray-900">Ce n'est pas :</strong> Une science obscure nécessitant un doctorat
              </p>
              <p className="text-gray-700">
                <strong className="text-gray-900">C'est :</strong> L'art de poser les bonnes questions aux données et d'utiliser des outils pour y répondre, comme un détective qui analyse des indices.
              </p>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 border-2 border-indigo-200">
            <div className="flex items-start gap-4">
              <Lightbulb className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Notre approche</h3>
                <p className="text-gray-700">
                  Nous croyons que tout le monde peut comprendre et utiliser ces technologies. Nos formations partent de zéro, 
                  utilisent des exemples concrets (comme le dataset Titanic), et vous permettent de tester immédiatement 
                  ce que vous apprenez. Pas de théorie sans pratique, pas de concepts sans exemples.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decision Makers Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Target className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pour les décideurs
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Comprenez les enjeux stratégiques et les retours sur investissement de la formation en Data
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* ROI & Benefits */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Retour sur investissement</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Productivité accrue</h4>
                    <p className="text-gray-300 text-sm">
                      Les équipes formées à la Data Science automatisent des tâches répétitives, 
                      libérant 20-30% de temps pour des activités à plus forte valeur ajoutée.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Décisions éclairées</h4>
                    <p className="text-gray-300 text-sm">
                      Des décisions basées sur les données réduisent les risques et améliorent 
                      la précision stratégique de 40% en moyenne.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Rocket className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Innovation</h4>
                    <p className="text-gray-300 text-sm">
                      Les compétences en Data ouvrent la voie à de nouveaux produits, services 
                      et modèles économiques compétitifs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Risks of Not Training */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-red-600 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Risques de ne pas former</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Retard technologique</h4>
                    <p className="text-gray-300 text-sm">
                      Les concurrents qui investissent dans la Data prennent de l'avance sur les marchés.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Départ des talents</h4>
                    <p className="text-gray-300 text-sm">
                      Les meilleurs profils cherchent des entreprises qui investissent dans leur développement.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Opportunités manquées</h4>
                    <p className="text-gray-300 text-sm">
                      Sans compétences internes, vous dépendez d'externes coûteux ou ratez des opportunités.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-xl p-8 border border-blue-400/30">
            <h3 className="text-2xl font-bold mb-6 text-center">Indicateurs clés de succès</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">3-6 mois</div>
                <div className="text-gray-300">Délai de montée en compétence</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">85%</div>
                <div className="text-gray-300">Taux de rétention des apprenants</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">2.5x</div>
                <div className="text-gray-300">ROI moyen sur 2 ans</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">40%</div>
                <div className="text-gray-300">Amélioration de la productivité</div>
              </div>
            </div>
          </div>

          {/* CTA for Decision Makers */}
          <div className="mt-12 text-center">
            <p className="text-xl text-gray-300 mb-6">
              Investissez dans l'avenir de votre organisation
            </p>
            {!user ? (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
              >
                <Target className="w-5 h-5" />
                Demander une démo
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
              >
                Accéder aux formations
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Une expérience d'apprentissage optimale
              </h2>
              <div className="space-y-4">
                {[
                  'Interface intuitive et moderne',
                  'Contenus multimédias interactifs',
                  'Suivi personnalisé de votre progression',
                  'Support technique réactif',
                  'Communauté active et bienveillante'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-lg text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Formations variées</h3>
                    <p className="text-gray-600 text-sm">Plus de 50 formations dans différents domaines</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Certifications reconnues</h3>
                    <p className="text-gray-600 text-sm">Validez vos compétences avec des certifications</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Réseau professionnel</h3>
                    <p className="text-gray-600 text-sm">Connectez-vous avec d'autres apprenants</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">SCINNOVA LMS</h3>
              <p className="text-gray-400">La soif d'apprendre</p>
            </div>
            {!user && (
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Commencer maintenant
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            )}
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

