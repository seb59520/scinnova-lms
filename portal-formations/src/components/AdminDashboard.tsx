import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  Users, BookOpen, Layers, Building2, Calendar,
  GraduationCap, Key, Sparkles,
  BarChart3, Clock, FolderOpen, BookMarked,
  ChevronRight, Plus, TrendingUp, UserPlus,
  FileText, Eye, Package
} from 'lucide-react'
import { AdminCoursesContent } from '../pages/admin/AdminCoursesContent'
import { AdminProgramsContent } from '../pages/admin/AdminProgramsContent'
import { AdminUsersContent } from '../pages/admin/AdminUsersContent'
import { AdminOrgsContent } from '../pages/admin/AdminOrgsContent'
import { AdminItemsContent } from '../pages/admin/AdminItemsContent'
import { StudentDashboardContent } from './StudentDashboardContent'

interface AdminStats {
  totalUsers: number
  totalCourses: number
  totalPrograms: number
  totalEnrollments: number
  activeSessions: number
  totalOrganizations: number
  publishedCourses: number
  draftCourses: number
}

type AdminTab = 'overview' | 'courses' | 'programs' | 'users' | 'orgs' | 'items' | 'students'

interface TabConfig {
  id: AdminTab
  label: string
  icon: React.ReactNode
  color: string
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalPrograms: 0,
    totalEnrollments: 0,
    activeSessions: 0,
    totalOrganizations: 0,
    publishedCourses: 0,
    draftCourses: 0
  })
  const [recentCourses, setRecentCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  useEffect(() => {
    fetchAdminStats()
    fetchRecentCourses()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const [
        usersResult,
        coursesResult,
        programsResult,
        enrollmentsResult,
        sessionsResult,
        orgsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id, status', { count: 'exact' }),
        supabase.from('programs').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('orgs').select('id', { count: 'exact', head: true })
      ])

      const courses = coursesResult.data || []
      const publishedCourses = courses.filter(c => c.status === 'published').length
      const draftCourses = courses.filter(c => c.status === 'draft').length

      setStats({
        totalUsers: usersResult.count || 0,
        totalCourses: coursesResult.count || courses.length,
        totalPrograms: programsResult.count || 0,
        totalEnrollments: enrollmentsResult.count || 0,
        activeSessions: sessionsResult.count || 0,
        totalOrganizations: orgsResult.count || 0,
        publishedCourses,
        draftCourses
      })
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentCourses = async () => {
    try {
      const { data } = await supabase
        .from('courses')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentCourses(data || [])
    } catch (error) {
      console.error('Error fetching recent courses:', error)
    }
  }

  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <TrendingUp className="w-4 h-4" />, color: 'blue' },
    { id: 'students', label: 'Vue élève', icon: <Eye className="w-4 h-4" />, color: 'cyan' },
    { id: 'courses', label: 'Formations', icon: <BookOpen className="w-4 h-4" />, color: 'blue' },
    { id: 'programs', label: 'Programmes', icon: <Layers className="w-4 h-4" />, color: 'purple' },
    { id: 'users', label: 'Utilisateurs', icon: <Users className="w-4 h-4" />, color: 'green' },
    { id: 'orgs', label: 'Organisations', icon: <Building2 className="w-4 h-4" />, color: 'orange' },
    { id: 'items', label: 'Éléments', icon: <FileText className="w-4 h-4" />, color: 'rose' },
  ]

  const quickLinks = [
    { title: 'Sessions', href: '/trainer/sessions', icon: <Calendar className="w-5 h-5" />, color: 'bg-orange-500' },
    { title: 'Codes invités', href: '/admin/ghost-codes', icon: <Key className="w-5 h-5" />, color: 'bg-pink-500' },
    { title: 'Quiz', href: '/admin/quiz-responses', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-cyan-500' },
    { title: 'Générateur IA', href: '/admin/courses/ai-generator', icon: <Sparkles className="w-5 h-5" />, color: 'bg-amber-500' },
    { title: 'Lots de TP', href: '/admin/tp-batches', icon: <Package className="w-5 h-5" />, color: 'bg-indigo-500' },
    { title: 'Glossaires', href: '/glossaires', icon: <BookMarked className="w-5 h-5" />, color: 'bg-teal-500' },
    { title: 'Suivi temps', href: '/trainer/time-tracking', icon: <Clock className="w-5 h-5" />, color: 'bg-slate-500' },
    { title: 'Formateur', href: '/trainer', icon: <GraduationCap className="w-5 h-5" />, color: 'bg-violet-500' },
  ]

  const statCards = [
    { label: 'Utilisateurs', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: 'text-green-600 bg-green-100', onClick: () => setActiveTab('users') },
    { label: 'Formations', value: stats.totalCourses, subtext: `${stats.publishedCourses} publiées`, icon: <BookOpen className="w-5 h-5" />, color: 'text-blue-600 bg-blue-100', onClick: () => setActiveTab('courses') },
    { label: 'Programmes', value: stats.totalPrograms, icon: <Layers className="w-5 h-5" />, color: 'text-purple-600 bg-purple-100', onClick: () => setActiveTab('programs') },
    { label: 'Inscriptions', value: stats.totalEnrollments, subtext: 'actives', icon: <GraduationCap className="w-5 h-5" />, color: 'text-orange-600 bg-orange-100', onClick: () => setActiveTab('users') },
    { label: 'Sessions', value: stats.activeSessions, subtext: 'en cours', icon: <Calendar className="w-5 h-5" />, color: 'text-cyan-600 bg-cyan-100', href: '/trainer/sessions' },
    { label: 'Organisations', value: stats.totalOrganizations, icon: <Building2 className="w-5 h-5" />, color: 'text-indigo-600 bg-indigo-100', onClick: () => setActiveTab('orgs') },
  ]

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((stat) => {
                const content = (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`p-2 rounded-lg ${stat.color}`}>
                        {stat.icon}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                    {stat.subtext && (
                      <div className="text-xs text-gray-400 mt-0.5">{stat.subtext}</div>
                    )}
                  </>
                )

                if (stat.href) {
                  return (
                    <Link
                      key={stat.label}
                      to={stat.href}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
                    >
                      {content}
                    </Link>
                  )
                }

                return (
                  <button
                    key={stat.label}
                    onClick={stat.onClick}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group text-left w-full"
                  >
                    {content}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Quick Links */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Outils & Raccourcis</h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.title}
                  to={link.href}
                  className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group flex flex-col items-center text-center"
                >
                  <span className={`p-2.5 rounded-xl text-white ${link.color} mb-2`}>
                    {link.icon}
                  </span>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">
                    {link.title}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent Courses */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-500" />
                Formations récentes
              </h2>
              <button
                onClick={() => setActiveTab('courses')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                Voir tout
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {recentCourses.length > 0 ? (
              <div className="space-y-2">
                {recentCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/admin/courses/${course.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                        <BookOpen className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                        {course.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        course.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {course.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">Aucune formation créée</p>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4" />
                  Créer une formation
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Management Tab Contents */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-blue-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-600" />
              Vue élève
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Visualisez l'expérience apprenant : formations, programmes et projets à rendre
            </p>
          </div>
          <div className="p-4">
            <StudentDashboardContent />
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Gestion des formations
            </h2>
            <p className="text-sm text-gray-500 mt-1">Créez, modifiez et publiez vos formations</p>
          </div>
          <div className="p-4">
            <AdminCoursesContent />
          </div>
        </div>
      )}

      {activeTab === 'programs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              Gestion des programmes
            </h2>
            <p className="text-sm text-gray-500 mt-1">Assemblez plusieurs formations en parcours</p>
          </div>
          <div className="p-4">
            <AdminProgramsContent />
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Gestion des utilisateurs
            </h2>
            <p className="text-sm text-gray-500 mt-1">Gérez les comptes, rôles et inscriptions</p>
          </div>
          <div className="p-4">
            <AdminUsersContent />
          </div>
        </div>
      )}

      {activeTab === 'orgs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              Gestion des organisations
            </h2>
            <p className="text-sm text-gray-500 mt-1">Structurez vos apprenants par entreprise ou classe</p>
          </div>
          <div className="p-4">
            <AdminOrgsContent />
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-600" />
              Gestion des éléments
            </h2>
            <p className="text-sm text-gray-500 mt-1">Administrez les items, chapitres et activités</p>
          </div>
          <div className="p-4">
            <AdminItemsContent />
          </div>
        </div>
      )}
    </div>
  )
}
