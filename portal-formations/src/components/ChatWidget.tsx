import { useState, useEffect, useRef } from 'react'
import { useChat } from '../hooks/useChat'
import { usePresence } from '../hooks/usePresence'
import { supabase } from '../lib/supabaseClient'
import { MessageCircle, X, Send, User, ChevronDown, ChevronUp, Search, Building2 } from 'lucide-react'
import { UserDirectory } from './UserDirectory'

interface ChatWidgetProps {
  recipientId?: string | null
  recipientName?: string
  defaultOpen?: boolean
}

export function ChatWidget({ recipientId = null, recipientName, defaultOpen = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState('')
  const [currentRecipient, setCurrentRecipient] = useState<string | null>(recipientId)
  const [showConversations, setShowConversations] = useState(false)
  const [showDirectory, setShowDirectory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const {
    messages,
    conversations,
    loading,
    sending,
    unreadCount,
    sendMessage,
    markAsRead,
  } = useChat(currentRecipient)

  // Gérer la présence en ligne
  usePresence()

  // Récupérer l'utilisateur actuel
  useEffect(() => {
    supabase.auth.getUser().then(({ data: authData, error: authError }) => {
      if (authError || !authData?.user) return
      const user = authData.user
      
      supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setCurrentUser(data)
          }
        })
        .catch((error) => {
          console.error('Erreur lors de la récupération du profil:', error)
        })
    })
  }, [])

  // Faire défiler vers le bas quand de nouveaux messages arrivent (avec debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100) // Petit délai pour éviter les scrolls multiples
    
    return () => clearTimeout(timer)
  }, [messages.length]) // Utiliser messages.length au lieu de messages pour éviter les re-renders

  // Marquer les messages comme lus quand la conversation est ouverte (avec debounce)
  useEffect(() => {
    if (!isOpen || !currentRecipient || !currentUser) return
    
    const timer = setTimeout(() => {
      const unreadIds = messages
        .filter(msg => !msg.read_at && msg.sender_id !== currentUser.id)
        .map(msg => msg.id)
      if (unreadIds.length > 0) {
        markAsRead(unreadIds)
      }
    }, 500) // Délai de 500ms pour éviter les appels multiples
    
    return () => clearTimeout(timer)
  }, [isOpen, currentRecipient, currentUser?.id, messages.length]) // Utiliser messages.length

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    // Vérifier qu'un destinataire est sélectionné
    if (!currentRecipient && currentUser?.role === 'student') {
      alert('Veuillez sélectionner un administrateur pour commencer la conversation.')
      return
    }

    const content = message.trim()
    setMessage('')
    
    try {
      await sendMessage(content)
      inputRef.current?.focus()
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi:', error)
      // Afficher un message d'erreur à l'utilisateur
      const errorMessage = error?.message || 'Erreur lors de l\'envoi du message'
      alert(errorMessage)
      setMessage(content) // Restaurer le message en cas d'erreur
    }
  }

  const handleSelectConversation = (interlocutorId: string | null) => {
    setCurrentRecipient(interlocutorId)
    setShowConversations(false)
    setShowDirectory(false)
    setIsOpen(true)
    setIsMinimized(false)
  }

  const handleSelectUserFromDirectory = async (userId: string, userName: string) => {
    // Vérifier que les étudiants ne peuvent sélectionner que les admins
    // MAIS ils peuvent sélectionner quelqu'un avec qui ils ont déjà une conversation
    if (currentUser?.role === 'student') {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData?.user) return
        const currentUserId = authData.user.id

        // Vérifier d'abord s'il existe déjà une conversation avec cet utilisateur
        const { data: existingMessages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('id')
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`)
          .limit(1)

        // Si une conversation existe déjà, permettre la sélection
        if (existingMessages && existingMessages.length > 0) {
          setCurrentRecipient(userId)
          setShowDirectory(false)
          setShowConversations(false)
          setIsOpen(true)
          setIsMinimized(false)
          return
        }

        // Sinon, vérifier que c'est un admin
        const { data: recipientProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (!profileError && recipientProfile && recipientProfile.role === 'admin') {
          setCurrentRecipient(userId)
          setShowDirectory(false)
          setShowConversations(false)
          setIsOpen(true)
          setIsMinimized(false)
        } else {
          // Afficher un message d'erreur si l'étudiant essaie de contacter un non-admin
          alert('Vous ne pouvez initier une conversation qu\'avec les administrateurs.')
        }
      } catch (error) {
        console.error('Erreur lors de la sélection de l\'utilisateur:', error)
        alert('Erreur lors de la sélection de l\'utilisateur. Veuillez réessayer.')
      }
    } else {
      // Pour les admins/instructeurs, aucune restriction
      setCurrentRecipient(userId)
      setShowDirectory(false)
      setShowConversations(false)
      setIsOpen(true)
      setIsMinimized(false)
    }
  }

  const isAdminOrInstructor = currentUser?.role === 'admin' || currentUser?.role === 'instructor'

  // Fonction pour formater le temps écoulé
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

  return (
    <>
      {/* Bouton flottant pour ouvrir le chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-50 flex items-center gap-2"
          aria-label="Ouvrir le chat"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Widget de chat */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 flex flex-col transition-all ${
          isMinimized ? 'h-16 w-80' : 'h-[600px] w-96'
        }`}>
          {/* En-tête */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">
                  {currentRecipient && recipientName
                    ? recipientName
                    : isAdminOrInstructor
                    ? 'Messages des étudiants'
                    : currentUser?.role === 'student'
                    ? 'Chat avec l\'administrateur'
                    : 'Chat avec le formateur'}
                </h3>
                {unreadCount > 0 && !currentRecipient && (
                  <p className="text-xs opacity-90">{unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Répertoire : accessible à tous, mais les étudiants ne verront que les admins */}
              <button
                onClick={() => {
                  setShowDirectory(!showDirectory)
                  setShowConversations(false)
                }}
                className={`p-2 hover:bg-white/20 rounded transition-all ${
                  showDirectory ? 'bg-white/30 ring-2 ring-white/50' : ''
                }`}
                aria-label="Répertoire des utilisateurs"
                title={
                  isAdminOrInstructor
                    ? 'Voir le répertoire par organisation'
                    : 'Voir les administrateurs disponibles'
                }
              >
                <Building2 className="w-5 h-5 text-white" />
              </button>
              
              {/* Liste des conversations : accessible à tous */}
              <button
                onClick={() => {
                  setShowConversations(!showConversations)
                  setShowDirectory(false)
                }}
                className={`p-2 hover:bg-white/20 rounded transition-all ${
                  showConversations ? 'bg-white/30 ring-2 ring-white/50' : ''
                }`}
                aria-label="Voir les conversations"
                title={
                  isAdminOrInstructor
                    ? 'Voir les conversations et rechercher des étudiants'
                    : 'Voir vos conversations'
                }
              >
                <div className="relative">
                  <User className="w-5 h-5 text-white" />
                  {conversations.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-white"></span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded"
                aria-label={isMinimized ? 'Agrandir' : 'Réduire'}
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Répertoire des utilisateurs par organisation (accessible à tous) */}
          {showDirectory && !isMinimized && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <UserDirectory
                onSelectUser={handleSelectUserFromDirectory}
                showChatButton={true}
                currentUserRole={currentUser?.role}
              />
            </div>
          )}

          {/* Liste des conversations (pour tous, mais avec fonctionnalités différentes selon le rôle) */}
          {showConversations && !isMinimized && !showDirectory && (
            <div className="border-b border-gray-200 flex flex-col">
              {/* Barre de recherche */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={
                      isAdminOrInstructor
                        ? 'Rechercher un étudiant...'
                        : 'Rechercher une conversation...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              
              {/* Liste filtrée */}
              <div className="max-h-64 overflow-y-auto">
                {(() => {
                  const filtered = conversations.filter(conv => {
                    if (!searchQuery.trim()) return true
                    const query = searchQuery.toLowerCase()
                    return conv.interlocutor_name.toLowerCase().includes(query) ||
                           (conv.last_message_content?.toLowerCase().includes(query) || false)
                  })
                  
                  if (filtered.length === 0) {
                    return (
                      <p className="p-4 text-sm text-gray-500 text-center">
                        {searchQuery ? 'Aucun résultat trouvé' : 'Aucune conversation'}
                      </p>
                    )
                  }
                  
                  return filtered.map((conv) => (
                    <button
                      key={conv.interlocutor_id}
                      onClick={() => handleSelectConversation(conv.interlocutor_id)}
                      className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 ${
                        currentRecipient === conv.interlocutor_id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{conv.interlocutor_name}</p>
                              {conv.is_online && (
                                <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full" title="En ligne" />
                              )}
                              {!conv.is_online && conv.last_seen && (
                                <span className="text-xs text-gray-400" title={`Vu il y a ${getTimeAgo(conv.last_seen)}`}>
                                  {getTimeAgo(conv.last_seen)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{conv.last_message_content || 'Aucun message'}</p>
                          </div>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                })()}
              </div>
            </div>
          )}

          {/* Zone de messages */}
          {!isMinimized && !showDirectory && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-gray-500">Chargement...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun message</p>
                      <p className="text-sm">Commencez la conversation !</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUser?.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isOwn
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-semibold mb-1 opacity-90">
                              {msg.sender_name || 'Utilisateur'}
                              {msg.sender_role === 'admin' && (
                                <span className="ml-1 text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded">Admin</span>
                              )}
                              {msg.sender_role === 'instructor' && (
                                <span className="ml-1 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">Formateur</span>
                              )}
                            </p>
                          )}
                          {isOwn && (
                            <p className="text-xs font-semibold mb-1 opacity-90">
                              Vous
                              {currentUser?.role === 'admin' && (
                                <span className="ml-1 text-xs bg-purple-500/80 text-white px-1.5 py-0.5 rounded">Admin</span>
                              )}
                              {currentUser?.role === 'instructor' && (
                                <span className="ml-1 text-xs bg-blue-500/80 text-white px-1.5 py-0.5 rounded">Formateur</span>
                              )}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulaire d'envoi */}
              <form onSubmit={handleSend} className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      currentRecipient
                        ? (() => {
                            const conversation = conversations.find(c => c.interlocutor_id === currentRecipient)
                            return `Répondre à ${conversation?.interlocutor_name || 'l\'utilisateur'}...`
                          })()
                        : isAdminOrInstructor
                        ? 'Sélectionnez une conversation pour répondre...'
                        : currentUser?.role === 'student'
                        ? 'Sélectionnez un administrateur pour commencer...'
                        : 'Envoyez un message au formateur...'
                    }
                    disabled={sending || !currentRecipient || (currentUser?.role === 'student' && !currentRecipient)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sending || !currentRecipient}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}

