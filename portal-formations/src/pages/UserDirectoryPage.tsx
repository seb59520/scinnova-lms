import { UserDirectory } from '../components/UserDirectory'
import { useNavigate } from 'react-router-dom'

export function UserDirectoryPage() {
  const navigate = useNavigate()

  const handleSelectUser = (userId: string, userName: string) => {
    // Rediriger vers le chat avec cet utilisateur
    navigate('/chat', { state: { recipientId: userId, recipientName: userName } })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-8rem)]">
          <UserDirectory onSelectUser={handleSelectUser} showChatButton={true} />
        </div>
      </div>
    </div>
  )
}

