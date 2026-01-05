import { ChatWidget } from '../components/ChatWidget'

export function Chat() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">💬 Chat avec le formateur</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            Utilisez le chat pour communiquer avec votre formateur ou les administrateurs.
            Le widget de chat est également disponible en bas à droite de l'écran.
          </p>
          <ChatWidget defaultOpen={true} />
        </div>
      </div>
    </div>
  )
}

