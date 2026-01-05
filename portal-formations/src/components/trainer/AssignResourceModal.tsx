import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Upload, Link, FileText, CheckCircle } from 'lucide-react';

interface AssignResourceModalProps {
  learnerId: string;
  learnerName: string;
  sessionId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type ResourceType = 'file' | 'url' | 'text' | 'correction';

export function AssignResourceModal({
  learnerId,
  learnerName,
  sessionId,
  onClose,
  onSuccess,
}: AssignResourceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('file');
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      let filePath: string | null = null;

      // Upload du fichier si nécessaire
      if (resourceType === 'file' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `resources/${user.id}/${learnerId}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resources')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
        }

        filePath = fileName;
      }

      // Créer la ressource assignée
      const { data, error: insertError } = await supabase
        .from('assigned_resources')
        .insert({
          trainer_id: user.id,
          learner_id: learnerId,
          session_id: sessionId,
          title,
          description: description || null,
          resource_type: resourceType,
          file_path: filePath,
          external_url: resourceType === 'url' ? externalUrl : null,
          content: resourceType === 'text' || resourceType === 'correction' ? content : null,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Erreur lors de l'assignation: ${insertError.message}`);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erreur lors de l\'assignation de la ressource:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-center mb-2">Ressource assignée !</h2>
          <p className="text-gray-600 text-center">
            La ressource a été assignée à {learnerName} et une notification a été envoyée.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Assigner une ressource</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Assigner une ressource à <strong>{learnerName}</strong>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Correction de l'exercice 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description optionnelle de la ressource"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de ressource *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResourceType('file')}
                className={`p-3 border rounded-md flex items-center gap-2 ${
                  resourceType === 'file'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-5 h-5" />
                <span>Fichier</span>
              </button>
              <button
                type="button"
                onClick={() => setResourceType('url')}
                className={`p-3 border rounded-md flex items-center gap-2 ${
                  resourceType === 'url'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Link className="w-5 h-5" />
                <span>Lien</span>
              </button>
              <button
                type="button"
                onClick={() => setResourceType('text')}
                className={`p-3 border rounded-md flex items-center gap-2 ${
                  resourceType === 'text'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Texte</span>
              </button>
              <button
                type="button"
                onClick={() => setResourceType('correction')}
                className={`p-3 border rounded-md flex items-center gap-2 ${
                  resourceType === 'correction'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span>Correction</span>
              </button>
            </div>
          </div>

          {resourceType === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fichier *
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {resourceType === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
          )}

          {(resourceType === 'text' || resourceType === 'correction') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenu *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Contenu de la ressource..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Assignation...' : 'Assigner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


