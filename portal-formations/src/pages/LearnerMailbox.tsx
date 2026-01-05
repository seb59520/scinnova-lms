import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { AppHeader } from '../components/AppHeader';
import { Mail, FileText, Link as LinkIcon, CheckCircle, Download, ExternalLink, Eye } from 'lucide-react';
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

export function LearnerMailbox() {
  const { user } = useAuth();
  const [resources, setResources] = useState<AssignedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    loadResources();
    
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Boîte aux lettres</h1>
                <p className="text-gray-600">Ressources assignées par vos formateurs</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {resources.length === 0 ? (
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
          )}
        </div>
      </div>
    </div>
  );
}


