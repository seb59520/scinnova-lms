import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  BookOpen, 
  Layers, 
  Settings, 
  User, 
  ClipboardCheck,
  GraduationCap,
  Building2,
  ChevronRight,
  X
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useUserRole } from '../hooks/useUserRole'
import { useState, useEffect } from 'react'

interface NavigationItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  adminOnly?: boolean
  trainerOnly?: boolean
}

export function NavigationSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { isAdmin, isTrainer } = useUserRole()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsOpen(true) // Desktop: toujours ouvert
      } else {
        setIsOpen(false) // Mobile: fermé par défaut
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fermer le menu mobile quand on change de page
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [location.pathname, isMobile])

  const navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      path: '/app',
      icon: Home,
    },
    {
      label: 'Mes formations',
      path: '/app#courses',
      icon: BookOpen,
    },
    {
      label: 'Mes programmes',
      path: '/app#programs',
      icon: Layers,
    },
    {
      label: 'Projets à rendre',
      path: '/app#projects',
      icon: ClipboardCheck,
    },
    {
      label: 'Mon profil',
      path: '/profile',
      icon: User,
    },
    {
      label: 'Administration',
      path: '/admin',
      icon: Settings,
      adminOnly: true,
    },
    {
      label: 'Formateur',
      path: '/trainer',
      icon: GraduationCap,
      trainerOnly: true,
    },
  ]

  const filteredItems = navigationItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    if (item.trainerOnly && !isTrainer && !isAdmin) return false
    return true
  })

  const handleNavigation = (path: string, e: React.MouseEvent) => {
    if (isMobile) {
      setIsOpen(false)
    }

    // Gérer les ancres pour le Dashboard
    if (path.includes('#')) {
      e.preventDefault()
      const [basePath, hash] = path.split('#')
      
      // Naviguer vers la page de base
      if (location.pathname !== basePath) {
        navigate(basePath)
      }
      
      // Attendre que la page soit chargée puis changer l'onglet ou scroller
      setTimeout(() => {
        if (hash === 'projects') {
          // Pour les projets, scroller vers la section
          const projectsSection = document.querySelector('[data-section="projects"]')
          if (projectsSection) {
            projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        } else {
          // Pour les onglets, stocker et déclencher l'événement
          sessionStorage.setItem('dashboardActiveTab', hash)
          window.dispatchEvent(new CustomEvent('dashboard-tab-change', { detail: { tab: hash } }))
          
          // Scroll vers la section si nécessaire
          const element = document.querySelector(`[data-content-tab="${hash}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }, 100)
    }
  }

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' && !location.hash
    }
    if (path.includes('#')) {
      const [basePath, hash] = path.split('#')
      return location.pathname === basePath && location.hash === `#${hash}`
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Bouton pour ouvrir/fermer sur mobile */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-20 left-4 z-40 lg:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Toggle navigation"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
        </button>
      )}

      {/* Overlay pour mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] z-40
          bg-white border-r border-gray-200 shadow-lg
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          w-64
        `}
      >
        <div className="h-full overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => handleNavigation(item.path, e)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-sm font-medium transition-all duration-200
                    ${
                      active
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Section rapide */}
          <div className="mt-8 px-3">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Accès rapide
            </div>
            <div className="space-y-1">
              <Link
                to="/landing"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4 text-gray-400" />
                <span>Page d'accueil</span>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Espace pour le sidebar sur desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  )
}
