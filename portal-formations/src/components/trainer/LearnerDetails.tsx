import React, { useEffect, useState } from 'react';
import { X, Download, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getLearnerSubmissions } from '../../lib/queries/trainerQueries';
import { supabase } from '../../lib/supabaseClient';
import { formatRelativeDate, formatScore } from '../../utils/trainerUtils';

interface LearnerDetailsProps {
  sessionId: string;
  userId: string;
  displayName: string;
  onClose: () => void;
}

interface SubmissionDetail {
  id: string;
  item_id: string;
  item_title: string;
  item_type: string;
  module_title: string;
  answer_text: string | null;
  answer_json: Record<string, any> | null;
  file_path: string | null;
  status: string;
  grade: number | null;
  submitted_at: string;
  graded_at: string | null;
}

export function LearnerDetails({
  sessionId,
  userId,
  displayName,
  onClose,
}: LearnerDetailsProps) {
  const [submissions, setSubmissions] = useState<SubmissionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubmissions() {
      console.log('📥 Chargement des soumissions pour:', { sessionId, userId, displayName });
      setLoading(true);
      setError(null);

      const { submissions: data, error: err } = await getLearnerSubmissions(sessionId, userId);
      console.log('📥 Soumissions récupérées:', { count: data?.length || 0, error: err?.message });

      if (err) {
        setError(err.message);
      } else {
        setSubmissions(data);
      }

      setLoading(false);
    }

    loadSubmissions();
  }, [sessionId, userId]);

  const getFileDownloadUrl = (filePath: string | null) => {
    if (!filePath) return null;

    // Pour les fichiers privés, on utilise createSignedUrl
    // Mais pour simplifier, on essaie d'abord getPublicUrl
    const { data } = supabase.storage.from('submissions').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      // Essayer d'abord avec getPublicUrl
      const { data: publicData } = supabase.storage.from('submissions').getPublicUrl(filePath);
      
      // Si le bucket est privé, utiliser createSignedUrl
      const { data: signedData, error: signedError } = await supabase.storage
        .from('submissions')
        .createSignedUrl(filePath, 3600); // URL valide 1 heure

      if (signedError) {
        console.error('Erreur lors de la création de l\'URL signée:', signedError);
        // Essayer avec l'URL publique
        if (publicData?.publicUrl) {
          window.open(publicData.publicUrl, '_blank');
          return;
        }
        alert('Erreur lors du téléchargement du fichier');
        return;
      }

      // Télécharger le fichier
      const link = document.createElement('a');
      link.href = signedData.signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'draft':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'graded':
        return 'Noté';
      case 'submitted':
        return 'Soumis';
      case 'draft':
        return 'Brouillon';
      default:
        return status;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'exercise':
        return 'Exercice';
      case 'tp':
        return 'TP';
      case 'activity':
        return 'Activité';
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Soumissions de {displayName}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {submissions.length} soumission{submissions.length > 1 ? 's' : ''} trouvée{submissions.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">Chargement des soumissions...</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-red-600">Erreur: {error}</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">Aucune soumission trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {submission.item_title}
                          </h3>
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                            {getItemTypeLabel(submission.item_type)}
                          </span>
                          {getStatusIcon(submission.status)}
                          <span className="text-sm text-gray-600">
                            {getStatusLabel(submission.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Module: {submission.module_title}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          Soumis le: {formatRelativeDate(submission.submitted_at)}
                        </p>

                        {submission.grade !== null && (
                          <div className="mt-3">
                            <span className="text-sm font-medium text-gray-700">Note: </span>
                            <span
                              className={`text-lg font-bold ${
                                submission.grade >= 80
                                  ? 'text-green-600'
                                  : submission.grade >= 60
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {formatScore(submission.grade)}
                            </span>
                          </div>
                        )}

                        {submission.answer_text && (
                          <div className="mt-4 rounded-lg bg-gray-50 p-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Réponse:</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                              {submission.answer_text}
                            </p>
                          </div>
                        )}

                        {submission.file_path && (
                          <div className="mt-4 flex items-center gap-3 rounded-lg bg-blue-50 p-4">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">Fichier joint:</p>
                              <p className="text-sm text-gray-600">
                                {submission.file_path.split('/').pop()}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleDownloadFile(
                                  submission.file_path!,
                                  submission.file_path!.split('/').pop() || 'fichier'
                                )
                              }
                              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                              <Download className="h-4 w-4" />
                              Télécharger
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

