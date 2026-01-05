import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Search, Users, Building2, MessageCircle, Circle } from 'lucide-react'

interface UserWithPresence {
  id: string
  full_name: string | null
  role: string
  org_id: string
  org_name: string
  org_role: string
  is_online: boolean
  last_seen: string | null
}

interface OrgWithUsers {
  org_id: string
  org_name: string
  users: UserWithPresence[]
}

interface UserDirectoryProps {
  onSelectUser?: (userId: string, userName: string) => void
  showChatButton?: boolean
  currentUserRole?: string // Rôle de l'utilisateur actuel pour filtrer les permissions
}

export function UserDirectory({ onSelectUser, showChatButton = true, currentUserRole }: UserDirectoryProps) {
  const [orgsWithUsers, setOrgsWithUsers] = useState<OrgWithUsers[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())
  
  // Debounce pour la recherche
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms de debounce pour la recherche
    
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Récupérer les utilisateurs par organisation
  useEffect(() => {
    fetchUsersByOrg()
    
    // Écouter les changements de présence en temps réel (avec debounce)
    let debounceTimer: NodeJS.Timeout | null = null
    
    const presenceChannel = supabase
      .channel('directory-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        () => {
          // Debounce : attendre 3 secondes avant de rafraîchir
          if (debounceTimer) {
            clearTimeout(debounceTimer)
          }
          debounceTimer = setTimeout(() => {
            fetchUsersByOrg()
          }, 3000) // 3 secondes de debounce
        }
      )
      .subscribe()

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      supabase.removeChannel(presenceChannel)
    }
  }, [])

  const fetchUsersByOrg = async () => {
    try {
      setLoading(true)
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) return

      // Récupérer toutes les organisations
      const { data: orgs, error: orgsError } = await supabase
        .from('orgs')
        .select('id, name')
        .order('name', { ascending: true })

      if (orgsError) throw orgsError

      // Pour chaque organisation, récupérer les membres avec leurs profils et présence
      const orgsData: OrgWithUsers[] = []

      for (const org of orgs || []) {
        const { data: members, error: membersError } = await supabase
          .from('org_members')
          .select(`
            user_id,
            role,
            profiles:user_id (
              id,
              full_name,
              role
            )
          `)
          .eq('org_id', org.id)
          .order('role', { ascending: true })

        if (membersError) {
          console.error(`Erreur pour l'org ${org.id}:`, membersError)
          continue
        }

        // Récupérer les IDs des utilisateurs
        const userIds = (members || [])
          .map(m => (m.profiles as any)?.id)
          .filter(Boolean)

        // Récupérer les statuts de présence
        let presenceMap: Record<string, { is_online: boolean; last_seen: string | null }> = {}
        if (userIds.length > 0) {
          const { data: presenceData } = await supabase
            .from('user_presence')
            .select('user_id, is_online, last_seen')
            .in('user_id', userIds)

          if (presenceData) {
            presenceMap = presenceData.reduce((acc, p) => {
              acc[p.user_id] = { is_online: p.is_online, last_seen: p.last_seen }
              return acc
            }, {} as Record<string, { is_online: boolean; last_seen: string | null }>)
          }
        }

        // Construire la liste des utilisateurs avec présence
        let users: UserWithPresence[] = (members || [])
          .map(m => {
            const profile = m.profiles as any
            if (!profile) return null

            return {
              id: profile.id,
              full_name: profile.full_name,
              role: profile.role,
              org_id: org.id,
              org_name: org.name,
              org_role: m.role,
              is_online: presenceMap[profile.id]?.is_online || false,
              last_seen: presenceMap[profile.id]?.last_seen || null,
            }
          })
          .filter(Boolean) as UserWithPresence[]

        // Si l'utilisateur est étudiant, ne montrer que les admins
        if (currentUserRole === 'student') {
          users = users.filter(user => user.role === 'admin')
        }

        if (users.length > 0) {
          orgsData.push({
            org_id: org.id,
            org_name: org.name,
            users: users.sort((a, b) => {
              // Trier : en ligne d'abord, puis par nom
              if (a.is_online && !b.is_online) return -1
              if (!a.is_online && b.is_online) return 1
              return (a.full_name || '').localeCompare(b.full_name || '')
            }),
          })
        }
      }

      setOrgsWithUsers(orgsData)
      
      // Développer toutes les organisations par défaut
      setExpandedOrgs(new Set(orgsData.map(o => o.org_id)))
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les organisations et utilisateurs selon la recherche (utiliser debouncedSearchQuery)
  const filteredOrgs = orgsWithUsers
    .map(org => ({
      ...org,
      users: org.users.filter(user => {
        if (!debouncedSearchQuery.trim()) return true
        const query = debouncedSearchQuery.toLowerCase()
        return (
          user.full_name?.toLowerCase().includes(query) ||
          org.org_name.toLowerCase().includes(query) ||
          user.org_role.toLowerCase().includes(query)
        )
      }),
    }))
    .filter(org => org.users.length > 0 || org.org_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))

  // Filtrer par organisation sélectionnée
  const displayOrgs = selectedOrg
    ? filteredOrgs.filter(org => org.org_id === selectedOrg)
    : filteredOrgs

  const toggleOrg = (orgId: string) => {
    setExpandedOrgs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orgId)) {
        newSet.delete(orgId)
      } else {
        newSet.add(orgId)
      }
      return newSet
    })
  }

  const getTimeAgo = (timestamp: string | null): string => {
    if (!timestamp) return ''
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'instructor':
      case 'trainer':
        return 'bg-blue-100 text-blue-800'
      case 'student':
        return 'bg-green-100 text-green-800'
      case 'auditor':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* En-tête avec recherche et filtre */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {currentUserRole === 'student' ? 'Administrateurs disponibles' : 'Répertoire des utilisateurs'}
          </h2>
        </div>
        
        {/* Message informatif pour les étudiants */}
        {currentUserRole === 'student' && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 En tant qu'étudiant, vous pouvez uniquement contacter les administrateurs.
            </p>
          </div>
        )}
        
        {/* Barre de recherche */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par nom, organisation ou rôle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Filtre par organisation */}
        {orgsWithUsers.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedOrg(null)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedOrg === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            {orgsWithUsers.map(org => (
              <button
                key={org.org_id}
                onClick={() => setSelectedOrg(org.org_id)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedOrg === org.org_id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {org.org_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Liste des organisations et utilisateurs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Chargement...</div>
          </div>
        ) : displayOrgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Users className="w-12 h-12 mb-2 opacity-50" />
            <p>{searchQuery ? 'Aucun résultat trouvé' : 'Aucune organisation trouvée'}</p>
          </div>
        ) : (
          displayOrgs.map(org => (
            <div key={org.org_id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* En-tête de l'organisation */}
              <button
                onClick={() => toggleOrg(org.org_id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{org.org_name}</h3>
                    <p className="text-xs text-gray-500">
                      {org.users.length} membre{org.users.length > 1 ? 's' : ''}
                      {' • '}
                      {org.users.filter(u => u.is_online).length} en ligne
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expandedOrgs.has(org.org_id) ? (
                    <span className="text-gray-400">▼</span>
                  ) : (
                    <span className="text-gray-400">▶</span>
                  )}
                </div>
              </button>

              {/* Liste des utilisateurs */}
              {expandedOrgs.has(org.org_id) && (
                <div className="border-t border-gray-200">
                  {org.users.map(user => (
                    <div
                      key={user.id}
                      className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {user.full_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          {user.is_online && (
                            <Circle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" fill="currentColor" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {user.full_name || 'Utilisateur sans nom'}
                            </p>
                            <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getRoleBadgeColor(user.org_role)}`}>
                              {user.org_role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {user.is_online ? (
                              <span className="text-xs text-green-600 font-medium">En ligne</span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {user.last_seen ? getTimeAgo(user.last_seen) : 'Jamais connecté'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {showChatButton && onSelectUser && (
                        <button
                          onClick={() => {
                            // Vérifier que les étudiants ne peuvent contacter que les admins
                            if (currentUserRole === 'student' && user.role !== 'admin') {
                              return // Ne rien faire si l'étudiant essaie de contacter un non-admin
                            }
                            onSelectUser(user.id, user.full_name || 'Utilisateur')
                          }}
                          disabled={currentUserRole === 'student' && user.role !== 'admin'}
                          className={`ml-3 p-2 rounded-lg transition-colors flex-shrink-0 ${
                            currentUserRole === 'student' && user.role !== 'admin'
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title={
                            currentUserRole === 'student' && user.role !== 'admin'
                              ? 'Vous ne pouvez contacter que les administrateurs'
                              : 'Démarrer une conversation'
                          }
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

