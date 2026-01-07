import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { AppHeader } from '../components/AppHeader';
import { Mail, FileText, Link as LinkIcon, CheckCircle, Download, ExternalLink, Eye, Send, Upload, X, User } from 'lucide-react';
import { formatRelativeDate } from '../utils/trainerUtils';

interface AssignedResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: 'file' | 'url' | 'text' | 'correction';
  file_path: string | null;
  external_url: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  trainer: {
    full_name: string;
  } | null;
  session: {
    title: string;
    course: {
      title: string;
    };
  } | null;
}

interface SentMessage {
  id: string;
  content: string;
  message_type: 'text' | 'file';
  file_url: string | null;
  recipient: {
    full_name: string;
    role: string;
  } | null;
  created_at: string;
}

export function LearnerMailbox() {
  const { user } = useAuth();
  const [resources, setResources] = useState<AssignedResource[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipients, setRecipients] = useState<Array<{ id: string; full_name: string; role: string }>>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    if (!user?.id) return;

    loadResources();
    loadSentMessages();
    loadRecipients();
    
    // Écouter les nouvelles ressources en temps réel
    const subscription = supabase
      .channel('assigned_resources')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assigned_resources',
          filter: `learner_id=eq.${user.id}`,
        },
        () => {
          loadResources();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  async function loadResources() {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assigned_resources')
        .select(`
          *,
          trainer:profiles!assigned_resources_trainer_id_fkey(full_name),
          session:sessions!assigned_resources_session_id_fkey(
            title,
            course:courses!sessions_course_id_fkey(title)
          )
        `)
        .eq('learner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setResources(data || []);
      setUnreadCount((data || []).filter((r: any) => !r.is_read).length);
    } catch (error) {
      console.error('Erreur lors du chargement des ressources:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(resourceId: string) {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('assigned_resources')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', resourceId)
        .eq('learner_id', user.id);

      if (error) throw error;

      // Mettre à jour aussi la notification correspondante
      await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('resource_id', resourceId)
        .eq('user_id', user.id);

      loadResources();
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  }

  async function loadSentMessages() {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          recipient:profiles!chat_messages_recipient_id_fkey(id, full_name, role)
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSentMessages(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des messages envoyés:', error);
    }
  }

  async function loadRecipients() {
    if (!user?.id) return;

    try {
      // Charger les formateurs et admins
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['admin', 'trainer', 'instructor'])
        .order('full_name', { ascending: true });

      if (error) throw error;

      setRecipients(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des destinataires:', error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || (!messageContent.trim() && !selectedFile) || !selectedRecipient) return;

    setSending(true);
    try {
      let fileUrl: string | null = null;

      // Upload du fichier si présent
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `mailbox/${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resources')
          .upload(fileName, selectedFile, { upsert: false });

        if (uploadError) {
          throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
        }

        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from('resources')
          .getPublicUrl(fileName);

        fileUrl = urlData?.publicUrl || null;
      }

      // Créer le message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedRecipient,
          content: messageContent.trim() || (selectedFile ? `Fichier: ${selectedFile.name}` : ''),
          message_type: selectedFile ? 'file' : 'text',
          file_url: fileUrl,
        });

      if (messageError) throw messageError;

      // Réinitialiser le formulaire
      setMessageContent('');
      setSelectedFile(null);
      setSelectedRecipient('');
      setShowSendModal(false);
      
      // Recharger les messages envoyés
      loadSentMessages();
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi:', error);
      alert(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  }

  async function downloadFile(filePath: string, fileName: string) {
    try {
      const { data, error } = await supabase.storage
        .from('resources')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh] pt-24">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Boîte aux lettres</h1>
                <p className="text-gray-600">Ressources assignées par vos formateurs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                  {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={() => setShowSendModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Envoyer un document
              </button>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('received')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'received'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reçus ({resources.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Envoyés ({sentMessages.length})
            </button>
          </div>

          {activeTab === 'received' ? (
            resources.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune ressource assignée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map((resource) => (
                <div
                  key={resource.id}
                  className={`border rounded-lg p-4 ${
                    !resource.is_read
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {!resource.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                        <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                        {resource.resource_type === 'correction' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Correction
                          </span>
                        )}
                      </div>

                      {resource.description && (
                        <p className="text-gray-600 text-sm mb-2">{resource.description}</p>
                      )}

                      {resource.session && (
                        <p className="text-xs text-gray-500 mb-2">
                          {resource.session.course?.title} - {resource.session.title}
                        </p>
                      )}

                      {resource.trainer && (
                        <p className="text-xs text-gray-500 mb-3">
                          De: {resource.trainer.full_name}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        {resource.resource_type === 'file' && resource.file_path && (
                          <button
                            onClick={() => {
                              markAsRead(resource.id);
                              downloadFile(resource.file_path!, resource.title);
                            }}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Télécharger
                          </button>
                        )}

                        {resource.resource_type === 'url' && resource.external_url && (
                          <a
                            href={resource.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markAsRead(resource.id)}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Ouvrir le lien
                          </a>
                        )}

                        {(resource.resource_type === 'text' || resource.resource_type === 'correction') && resource.content && (
                          <div className="mt-2 p-3 bg-gray-50 rounded border">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                              {resource.content}
                            </pre>
                          </div>
                        )}

                        {!resource.is_read && (
                          <button
                            onClick={() => markAsRead(resource.id)}
                            className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Marquer comme lu
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        {formatRelativeDate(resource.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )
          ) : (
            sentMessages.length === 0 ? (
              <div className="text-center py-12">
                <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun message envoyé</p>
                <button
                  onClick={() => setShowSendModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Envoyer votre premier message
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sentMessages.map((message) => (
                  <div
                    key={message.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          À: {message.recipient?.full_name || 'Destinataire inconnu'}
                        </span>
                        {message.recipient && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {message.recipient.role}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatRelativeDate(message.created_at)}
                      </span>
                    </div>
                    {message.content && (
                      <p className="text-gray-700 mb-3">{message.content}</p>
                    )}
                    {message.message_type === 'file' && message.file_url && (
                      <div className="mt-3">
                        <a
                          href={message.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm inline-flex"
                        >
                          <FileText className="w-4 h-4" />
                          Ouvrir le fichier
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Modal d'envoi */}
          {showSendModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Envoyer un document</h2>
                  <button
                    onClick={() => {
                      setShowSendModal(false);
                      setMessageContent('');
                      setSelectedFile(null);
                      setSelectedRecipient('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destinataire *
                    </label>
                    <select
                      value={selectedRecipient}
                      onChange={(e) => setSelectedRecipient(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Sélectionner un destinataire</option>
                      {recipients.map((recipient) => (
                        <option key={recipient.id} value={recipient.id}>
                          {recipient.full_name} ({recipient.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message (optionnel)
                    </label>
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ajoutez un message accompagnant votre document..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document
                    </label>
                    <div className="mt-1 flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        {selectedFile ? selectedFile.name : 'Choisir un fichier'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
                              return
                            }
                            setSelectedFile(null)
                          }}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-500">
                        Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSendModal(false);
                        setMessageContent('');
                        setSelectedFile(null);
                        setSelectedRecipient('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={sending || (!messageContent.trim() && !selectedFile) || !selectedRecipient}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


