import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  path?: string
}

export function Breadcrumb() {
  const location = useLocation()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathnames = location.pathname.split('/').filter((x) => x)
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Accueil', path: '/app' }]

    if (pathnames.length === 0) {
      return [{ label: 'Dashboard', path: undefined }]
    }

    pathnames.forEach((value, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`
      
      let label = value
      
      // Mapper les routes aux labels
      if (value === 'courses') {
        label = 'Formations'
      } else if (value === 'programs') {
        label = 'Programmes'
      } else if (value === 'items') {
        label = 'Contenu'
      } else if (value === 'admin') {
        label = 'Administration'
      } else if (value === 'trainer') {
        label = 'Formateur'
      } else if (value === 'profile') {
        label = 'Mon profil'
      } else if (value === 'landing') {
        label = 'Page d\'accueil'
      } else {
        // Capitaliser la première lettre
        label = value.charAt(0).toUpperCase() + value.slice(1)
      }

      breadcrumbs.push({
        label,
        path: index === pathnames.length - 1 ? undefined : path,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4 px-4 sm:px-6 lg:px-8">
      <Link
        to="/app"
        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {breadcrumb.path ? (
            <Link
              to={breadcrumb.path}
              className="hover:text-gray-900 transition-colors"
            >
              {breadcrumb.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{breadcrumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
