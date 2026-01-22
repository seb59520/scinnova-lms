import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '../../components/AppHeader'
import { AdminCoursesContent } from './AdminCoursesContent'
import { AdminProgramsContent } from './AdminProgramsContent'
import { AdminUsersContent } from './AdminUsersContent'
import { AdminOrgsContent } from './AdminOrgsContent'
import { AdminItemsContent } from './AdminItemsContent'
import { AdminTrainerContent } from './AdminTrainerContent'
import { AdminStudentsContent } from './AdminStudentsContent'
import {
  BookOpen,
  Layers,
  Users,
  Building2,
  FileText,
  GraduationCap,
  Package,
  Radio,
  Award,
  ClipboardCheck,
  ChevronDown,
  Eye
} from 'lucide-react'
import '../../styles/admin-unified.css'

type AdminTab = 'courses' | 'programs' | 'users' | 'orgs' | 'items' | 'trainer' | 'students'

interface SubMenu {
  id: string;
  label: string;
  icon: any;
  path: string;
}

type AccentTone = 'blue' | 'purple' | 'emerald' | 'orange' | 'rose' | 'indigo' | 'cyan';

interface TabWithSubMenu {
  id: AdminTab;
  label: string;
  icon: any;
  description: string;
  accent: AccentTone;
  subMenus?: SubMenu[];
}

export function AdminUnified() {
  const [activeTab, setActiveTab] = useState<AdminTab>('students')
  const navigate = useNavigate()
  const tabs: TabWithSubMenu[] = [
    { 
      id: 'students', 
      label: 'Vue élèves', 
      icon: Eye,
      description: 'Accédez à la vue que voient les élèves pour tester l\'expérience utilisateur.',
      accent: 'cyan'
    },
    { 
      id: 'courses', 
      label: 'Formations', 
      icon: BookOpen,
      description: 'Creez, importez et publiez vos formations, TP et ressources.',
      accent: 'blue',
      subMenus: [
        { id: 'tp-batches', label: 'Lots de TP', icon: Package, path: '/admin/tp-batches' },
      ]
    },
    { 
      id: 'programs', 
      label: 'Programmes', 
      icon: Layers,
      description: 'Assemblez plusieurs formations au sein d\'un parcours coherent.',
      accent: 'purple'
    },
    { 
      id: 'users', 
      label: 'Utilisateurs', 
      icon: Users,
      description: 'Pilotez les roles, invitations, acces et inscriptions.',
      accent: 'emerald'
    },
    { 
      id: 'orgs', 
      label: 'Organisations', 
      icon: Building2,
      description: 'Structurez vos apprenants par entreprises ou classes.',
      accent: 'orange'
    },
    { 
      id: 'items', 
      label: 'Elements', 
      icon: FileText,
      description: 'Administrez les items, chapitres et activites avancees.',
      accent: 'rose'
    },
    { 
      id: 'trainer', 
      label: 'Formateur', 
      icon: GraduationCap,
      description: 'Accedez aux outils quotidiens : suivi, notes et sessions.',
      accent: 'indigo',
      subMenus: [
        { id: 'sessions', label: 'Gestion des sessions', icon: Radio, path: '/trainer/sessions' },
        { id: 'gradebook', label: 'Carnet de notes', icon: Award, path: '/trainer' },
        { id: 'projects', label: 'Restitutions de projet', icon: ClipboardCheck, path: '/trainer/projects' },
      ]
    },
  ];

  const accentThemes: Record<
    AccentTone,
    { gradient: string; pill: string; icon: string; iconActive: string }
  > = {
    blue: {
      gradient: 'from-blue-600 via-indigo-600 to-sky-600',
      pill: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: 'bg-blue-50 text-blue-500',
      iconActive: 'bg-blue-600 text-white'
    },
    purple: {
      gradient: 'from-purple-600 via-fuchsia-600 to-indigo-600',
      pill: 'bg-purple-50 text-purple-700 border-purple-100',
      icon: 'bg-purple-50 text-purple-500',
      iconActive: 'bg-purple-600 text-white'
    },
    emerald: {
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: 'bg-emerald-50 text-emerald-500',
      iconActive: 'bg-emerald-600 text-white'
    },
    orange: {
      gradient: 'from-orange-600 via-amber-600 to-yellow-500',
      pill: 'bg-orange-50 text-orange-700 border-orange-100',
      icon: 'bg-orange-50 text-orange-500',
      iconActive: 'bg-orange-600 text-white'
    },
    rose: {
      gradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
      pill: 'bg-rose-50 text-rose-700 border-rose-100',
      icon: 'bg-rose-50 text-rose-500',
      iconActive: 'bg-rose-600 text-white'
    },
    indigo: {
      gradient: 'from-indigo-600 via-blue-700 to-indigo-900',
      pill: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      icon: 'bg-indigo-50 text-indigo-500',
      iconActive: 'bg-indigo-600 text-white'
    },
    cyan: {
      gradient: 'from-cyan-600 via-blue-600 to-sky-600',
      pill: 'bg-cyan-50 text-cyan-700 border-cyan-100',
      icon: 'bg-cyan-50 text-cyan-500',
      iconActive: 'bg-cyan-600 text-white'
    }
  }

  const activeTabData = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab) + 1

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader title="Administration" />

      <main className="pt-8 pb-12 px-4 sm:px-6 lg:px-10">
        <div className="w-full space-y-8">
          <section className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Administration</p>
                <h1 className="text-3xl font-semibold text-slate-900">Centre de pilotage</h1>
                <p className="text-sm text-slate-600 max-w-2xl">
                  Accédez rapidement aux espaces de publication, de suivi et de gouvernance. La mise en page
                  reste compacte et lisible sur l&apos;ensemble des formats d&apos;écran.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                    Section active · {activeTabData.label}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                    {tabs.length} espaces disponibles
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                    Interface responsive
                  </span>
                </div>
              </div>
              <div className="grid w-full gap-4 sm:w-auto sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-900 p-4 text-white shadow-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">Section active</p>
                  <p className="text-lg font-semibold mt-1">{activeTabData.label}</p>
                  <p className="text-sm text-white/80 mt-2 line-clamp-3">{activeTabData.description}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Navigation</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {activeTabIndex}/{tabs.length}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Utilisez la barre latérale ou le sélecteur mobile pour changer d&apos;espace.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
            <div className="lg:hidden">
              <label htmlFor="admin-space" className="text-xs font-medium text-slate-500">
                Choisir un espace
              </label>
              <div className="mt-2 relative">
                <select
                  id="admin-space"
                  value={activeTab}
                  onChange={(event) => setActiveTab(event.target.value as AdminTab)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <aside className="hidden lg:flex flex-col gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const theme = accentThemes[tab.accent]
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isActive
                        ? 'bg-white border-slate-200 shadow-md ring-offset-slate-50 focus-visible:ring-slate-300'
                        : 'bg-white/80 border-transparent hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-2xl p-2 ${isActive ? theme.iconActive : theme.icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">{tab.label}</p>
                        <p className="mt-1 text-sm text-slate-500 leading-snug">{tab.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </aside>

            <section className="min-w-0 rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-6 border-b border-slate-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Espace</p>
                    <h2 className="text-2xl font-semibold text-slate-900">{activeTabData.label}</h2>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    Vue {activeTabIndex}/{tabs.length}
                  </span>
                </div>
                <p className="text-sm text-slate-500 max-w-3xl">{activeTabData.description}</p>
              </div>

              {activeTabData.subMenus && activeTabData.subMenus.length > 0 && (
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
                  <p className="text-sm font-semibold text-slate-600 mb-3">Accès rapides</p>
                  <div className="flex flex-wrap gap-3">
                    {activeTabData.subMenus.map((subMenu) => {
                      const SubIcon = subMenu.icon
                      return (
                        <button
                          key={subMenu.id}
                          onClick={() => navigate(subMenu.path)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <SubIcon className="h-4 w-4 text-slate-400" />
                          {subMenu.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="p-2 sm:p-4 lg:p-6 bg-slate-50/40">
                <div className="admin-unified min-w-0">
                  {activeTab === 'students' && <AdminStudentsContent />}
                  {activeTab === 'courses' && <AdminCoursesContent />}
                  {activeTab === 'programs' && <AdminProgramsContent />}
                  {activeTab === 'users' && <AdminUsersContent />}
                  {activeTab === 'orgs' && <AdminOrgsContent />}
                  {activeTab === 'items' && <AdminItemsContent />}
                  {activeTab === 'trainer' && <AdminTrainerContent />}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
