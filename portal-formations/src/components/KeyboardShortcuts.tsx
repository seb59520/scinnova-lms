import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserRole } from '../hooks/useUserRole'

export function KeyboardShortcuts() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isAdmin, isTrainer } = useUserRole()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input, textarea, ou contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Raccourcis avec Ctrl/Cmd + K (menu de commande)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        // TODO: Ouvrir un menu de commande (command palette)
        return
      }

      // Raccourcis avec Ctrl/Cmd + nombre
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            navigate('/app')
            break
          case '2':
            e.preventDefault()
            navigate('/app#courses')
            break
          case '3':
            e.preventDefault()
            navigate('/app#programs')
            break
          case '4':
            e.preventDefault()
            if (user) {
              navigate('/profile')
            }
            break
          case '5':
            e.preventDefault()
            if (isAdmin) {
              navigate('/admin')
            }
            break
          case '6':
            e.preventDefault()
            if (isTrainer || isAdmin) {
              navigate('/trainer')
            }
            break
        }
      }

      // Raccourcis avec Alt + lettre
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault()
            navigate('/app')
            break
          case 'p':
            e.preventDefault()
            if (user) {
              navigate('/profile')
            }
            break
          case 'a':
            e.preventDefault()
            if (isAdmin) {
              navigate('/admin')
            }
            break
        }
      }

      // Échap pour revenir en arrière
      if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Ne rien faire si on est déjà sur la page d'accueil
        if (window.location.pathname !== '/app') {
          // Naviguer vers la page précédente ou vers /app
          if (window.history.length > 1) {
            navigate(-1)
          } else {
            navigate('/app')
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, user, isAdmin, isTrainer])

  return null // Ce composant ne rend rien
}
