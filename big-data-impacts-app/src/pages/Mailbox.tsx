import { Mail, Inbox, Send, Archive, Trash2 } from 'lucide-react';

export function Mailbox() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Mail className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Boîte aux lettres</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Inbox className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Reçus</p>
              <p className="text-2xl font-bold text-blue-600">0</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <Send className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Envoyés</p>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Archive className="w-6 h-6 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Archivés</p>
              <p className="text-2xl font-bold text-gray-600">0</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <Trash2 className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Corbeille</p>
              <p className="text-2xl font-bold text-red-600">0</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun message
            </h3>
            <p className="text-gray-500">
              Votre boîte aux lettres est vide pour le moment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


