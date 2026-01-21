import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { History, Clock, X } from 'lucide-react'

interface HistoryItem {
  path: string
  title: string
  timestamp: number
}

const MAX_HISTORY_ITEMS = 10
const STORAGE_KEY = 'navigation_history'

export function NavigationHistory() {
  const location = useLocation()
  const navigate = useNavigate()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setHistory(JSON.parse(stored))
      } catch (e) {
        console.error('Error loading navigation history:', e)
      }
    }
  }, [])

  // Ajouter la page actuelle à l'historique
  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/register') {
      return // Ne pas enregistrer les pages de connexion
    }

    const title = document.title.replace(' - SCINNOVA - LMS', '') || location.pathname
    const newItem: HistoryItem = {
      path: location.pathname,
      title,
      timestamp: Date.now(),
    }

    setHistory((prev) => {
      // Éviter les doublons consécutifs
      if (prev.length > 0 && prev[0].path === newItem.path) {
        return prev
      }

      // Filtrer les anciennes entrées pour le même chemin
      const filtered = prev.filter((item) => item.path !== newItem.path)
      
      // Ajouter la nouvelle entrée au début
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)
      
      // Sauvegarder dans localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      
      return updated
    })
  }, [location.pathname])

  const removeFromHistory = (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHistory((prev) => {
      const updated = prev.filter((item) => item.path !== path)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return new Date(timestamp).toLocaleDateString('fr-FR')
  }

  if (history.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        title="Historique de navigation"
      >
        <History className="w-4 h-4" />
        <span className="hidden md:inline">Historique</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Historique</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Tout effacer
                </button>
              )}
            </div>
            <div className="overflow-y-auto">
              {history.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  Aucun historique
                </div>
              ) : (
                <div className="py-2">
                  {history.map((item, index) => (
                    <button
                      key={`${item.path}-${item.timestamp}`}
                      onClick={() => {
                        navigate(item.path)
                        setIsOpen(false)
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors group flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatTime(item.timestamp)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => removeFromHistory(item.path, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
                        title="Supprimer de l'historique"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
