import { useState, useEffect } from 'react'
import { UserDirectory } from '../components/UserDirectory'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export function UserDirectoryPage() {
  const navigate = useNavigate()
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>()

  useEffect(() => {
    // Récupérer le rôle de l'utilisateur actuel
    supabase.auth.getUser().then(({ data: authData, error: authError }) => {
      if (authError || !authData?.user) return
      const user = authData.user
      
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setCurrentUserRole(data.role)
          }
        })
    })
  }, [])

  const handleSelectUser = (userId: string, userName: string) => {
    // Vérifier que les étudiants ne peuvent sélectionner que les admins
    // MAIS ils peuvent sélectionner quelqu'un avec qui ils ont déjà une conversation
    if (currentUserRole === 'student') {
      supabase.auth.getUser().then(({ data: authData }) => {
        if (!authData?.user) return
        const currentUserId = authData.user.id

        // Vérifier d'abord s'il existe déjà une conversation avec cet utilisateur
        supabase
          .from('chat_messages')
          .select('id')
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`)
          .limit(1)
          .then(({ data: existingMessages }) => {
            // Si une conversation existe déjà, permettre la navigation
            if (existingMessages && existingMessages.length > 0) {
              navigate('/chat', { state: { recipientId: userId, recipientName: userName } })
            } else {
              // Sinon, vérifier que c'est un admin
              supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()
                .then(({ data, error }) => {
                  if (!error && data && data.role === 'admin') {
                    navigate('/chat', { state: { recipientId: userId, recipientName: userName } })
                  } else {
                    alert('Vous ne pouvez initier une conversation qu\'avec les administrateurs.')
                  }
                })
            }
          })
      })
    } else {
      // Pour les admins/instructeurs, aucune restriction
      navigate('/chat', { state: { recipientId: userId, recipientName: userName } })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-8rem)]">
          <UserDirectory 
            onSelectUser={handleSelectUser} 
            showChatButton={true}
            currentUserRole={currentUserRole}
          />
        </div>
      </div>
    </div>
  )
}

