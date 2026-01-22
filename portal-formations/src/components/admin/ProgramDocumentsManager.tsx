import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  Save,
  X,
  GripVertical,
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  Users,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface ProgramDocument {
  id: string;
  program_id: string;
  title: string;
  description: string | null;
  template_url: string | null;
  template_file_path: string | null;
  timing: 'start' | 'end' | 'anytime';
  is_required: boolean;
  is_published: boolean;
  allow_resubmission: boolean;
  due_date: string | null;
  position: number;
  created_at: string;
}

interface ProgramDocumentSubmission {
  id: string;
  document_id: string;
  user_id: string;
  program_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    student_id: string | null;
  };
}

interface ProgramDocumentsManagerProps {
  programId: string;
}

export function ProgramDocumentsManager({ programId }: ProgramDocumentsManagerProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ProgramDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<ProgramDocument | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submissions, setSubmissions] = useState<Record<string, ProgramDocumentSubmission[]>>({});
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set()); // Par défaut, tous les volets sont repliés
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [reviewingSubmission, setReviewingSubmission] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [missingSubmissions, setMissingSubmissions] = useState<Record<string, Array<{
    user_id: string;
    full_name: string | null;
    student_id: string | null;
  }>>>({});
  const [totalEnrolled, setTotalEnrolled] = useState<number>(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template_url: '',
    template_file_path: '',
    timing: 'anytime' as 'start' | 'end' | 'anytime',
    is_required: false,
    is_published: true,
    allow_resubmission: true,
    due_date: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, [programId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('program_documents')
        .select('*')
        .eq('program_id', programId)
        .order('position');

      if (fetchError) throw fetchError;
      const docs = data || [];
      setDocuments(docs);
      
      // Charger les soumissions après avoir chargé les documents
      if (docs.length > 0) {
        await fetchSubmissionsForDocs(docs.map(d => d.id));
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionsForDocs = async (docIds: string[]) => {
    if (docIds.length === 0) return;

    try {
      console.log('🔍 Récupération des soumissions pour documents:', docIds);
      
      // Vérifier le rôle de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      console.log('👤 Rôle utilisateur:', profile?.role);
      
      // Récupérer les soumissions sans jointure (car la FK pointe vers auth.users, pas profiles)
      // On récupère les données séparément et on les combine
      const { data: subsData, error: subsError } = await supabase
        .from('program_document_submissions')
        .select('*')
        .in('document_id', docIds)
        .order('submitted_at', { ascending: false });

      if (subsError) throw subsError;

      // Récupérer les profils séparément
      const userIds = [...new Set((subsData || []).map((s: any) => s.user_id).filter(Boolean))];
      let profilesMap = new Map();
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, student_id')
          .in('id', userIds);

        if (profilesError) {
          console.warn('⚠️ Erreur lors de la récupération des profils:', profilesError);
        } else {
          profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
        }
      }

      // Combiner les données
      const data = (subsData || []).map((sub: any) => ({
        ...sub,
        profiles: profilesMap.get(sub.user_id) || null
      }));

      console.log('✅ Soumissions récupérées:', data?.length || 0, data);

      // Grouper les soumissions par document_id
      const submissionsByDoc: Record<string, ProgramDocumentSubmission[]> = {};
      (data || []).forEach((sub: any) => {
        if (!submissionsByDoc[sub.document_id]) {
          submissionsByDoc[sub.document_id] = [];
        }
        // Normaliser la structure des profils
        const normalizedSub: ProgramDocumentSubmission = {
          ...sub,
          profiles: sub.profiles || null
        };
        submissionsByDoc[sub.document_id].push(normalizedSub);
      });

      console.log('📊 Soumissions groupées par document:', Object.keys(submissionsByDoc).length, 'documents avec soumissions');
      setSubmissions(submissionsByDoc);
      
      // Calculer les personnes n'ayant pas soumis
      await fetchMissingSubmissions(docIds, submissionsByDoc);
    } catch (err) {
      console.error('❌ Error fetching submissions:', err);
      setError(`Erreur lors du chargement des soumissions: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  const fetchMissingSubmissions = async (
    docIds: string[],
    submissionsByDoc: Record<string, ProgramDocumentSubmission[]>
  ) => {
    try {
      // Récupérer tous les inscrits au programme
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('program_enrollments')
        .select(`
          user_id,
          profiles:user_id (
            id,
            full_name,
            student_id
          )
        `)
        .eq('program_id', programId)
        .eq('status', 'active');

      if (enrollmentsError) {
        console.error('Erreur lors de la récupération des inscrits:', enrollmentsError);
        return;
      }

      const enrolledUsers = (enrollments || []).map((e: any) => ({
        user_id: e.user_id,
        full_name: e.profiles?.full_name || null,
        student_id: e.profiles?.student_id || null
      }));

      setTotalEnrolled(enrolledUsers.length);

      // Pour chaque document, trouver les personnes qui n'ont pas soumis
      const missingByDoc: Record<string, Array<{
        user_id: string;
        full_name: string | null;
        student_id: string | null;
      }>> = {};

      docIds.forEach(docId => {
        const docSubmissions = submissionsByDoc[docId] || [];
        const submittedUserIds = new Set(docSubmissions.map(s => s.user_id));
        const missing = enrolledUsers.filter(u => !submittedUserIds.has(u.user_id));
        if (missing.length > 0) {
          missingByDoc[docId] = missing;
        }
      });

      setMissingSubmissions(missingByDoc);
      console.log('📋 Personnes n\'ayant pas soumis:', missingByDoc);
    } catch (err) {
      console.error('Erreur lors du calcul des soumissions manquantes:', err);
    }
  };


  const getFileUrl = async (filePath: string): Promise<string | null> => {
    if (signedUrls[filePath]) {
      return signedUrls[filePath];
    }

    try {
      const { data, error } = await supabase.storage
        .from('fillable-documents')
        .createSignedUrl(filePath, 3600); // URL valide 1 heure

      if (error) throw error;
      if (data) {
        setSignedUrls(prev => ({ ...prev, [filePath]: data.signedUrl }));
        return data.signedUrl;
      }
      return null;
    } catch (err) {
      console.error('Error getting file URL:', err);
      return null;
    }
  };

  const downloadFileWithCustomName = async (
    filePath: string,
    userName: string,
    documentTitle: string,
    originalFileName: string
  ) => {
    try {
      const url = await getFileUrl(filePath);
      if (!url) {
        setError('Impossible de récupérer le fichier');
        return;
      }

      // Récupérer le fichier
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du fichier');
      }

      const blob = await response.blob();

      // Créer le nom de fichier : NOM_DE_CONNEXION - NOM_DU_DOCUMENT.extension
      const fileExtension = originalFileName.split('.').pop() || '';
      const sanitizedUserName = userName
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .trim();
      const sanitizedDocTitle = documentTitle
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .trim();
      const customFileName = `${sanitizedUserName} - ${sanitizedDocTitle}.${fileExtension}`;

      // Créer un lien de téléchargement
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = customFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('Error downloading file:', err);
      setError(err.message || 'Erreur lors du téléchargement du fichier');
    }
  };

  const toggleDocExpanded = (docId: string) => {
    setExpandedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleReviewSubmission = async (submissionId: string) => {
    if (!reviewFeedback.trim() && reviewStatus === 'rejected') {
      setError('Veuillez fournir un feedback pour les soumissions rejetées');
      return;
    }

    try {
      const { error } = await supabase
        .from('program_document_submissions')
        .update({
          status: reviewStatus === 'approved' ? 'approved' : 'rejected',
          feedback: reviewFeedback.trim() || null,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      setReviewingSubmission(null);
      setReviewFeedback('');
      setReviewStatus('approved');
      const docIds = documents.map(d => d.id);
      if (docIds.length > 0) {
        await fetchSubmissionsForDocs(docIds);
      }
    } catch (err: any) {
      console.error('Error reviewing submission:', err);
      setError(err.message || 'Erreur lors de l\'évaluation');
    }
  };

  const handleApproveAll = async (docId: string) => {
    const docSubmissions = submissions[docId] || [];
    const pendingSubmissions = docSubmissions.filter(s => s.status === 'submitted');
    
    if (pendingSubmissions.length === 0) {
      setError('Aucune soumission en attente à approuver');
      return;
    }

    if (!confirm(`Approuver ${pendingSubmissions.length} soumission${pendingSubmissions.length > 1 ? 's' : ''} ?`)) {
      return;
    }

    try {
      const submissionIds = pendingSubmissions.map(s => s.id);
      const { error } = await supabase
        .from('program_document_submissions')
        .update({
          status: 'approved',
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString()
        })
        .in('id', submissionIds);

      if (error) throw error;

      const docIds = documents.map(d => d.id);
      if (docIds.length > 0) {
        await fetchSubmissionsForDocs(docIds);
      }
    } catch (err: any) {
      console.error('Error approving all submissions:', err);
      setError(err.message || 'Erreur lors de l\'approbation en masse');
    }
  };

  const handleDownloadAll = async (docId: string) => {
    const docSubmissions = submissions[docId] || [];
    const doc = documents.find(d => d.id === docId);
    
    if (docSubmissions.length === 0) {
      setError('Aucune soumission à télécharger');
      return;
    }

    try {
      // Télécharger tous les fichiers un par un
      for (const sub of docSubmissions) {
        const userName = sub.profiles?.full_name || 
                        sub.profiles?.student_id || 
                        'Utilisateur_inconnu';
        const docTitle = doc?.title || 'Document';
        await downloadFileWithCustomName(
          sub.file_path,
          userName,
          docTitle,
          sub.file_name
        );
        // Petit délai entre chaque téléchargement pour éviter les problèmes
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (err: any) {
      console.error('Error downloading all files:', err);
      setError(err.message || 'Erreur lors du téléchargement en masse');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      template_url: '',
      template_file_path: '',
      timing: 'anytime',
      is_required: false,
      is_published: true,
      allow_resubmission: true,
      due_date: ''
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    setEditingDoc(null);
  };

  const handleEdit = (doc: ProgramDocument) => {
    setFormData({
      title: doc.title,
      description: doc.description || '',
      template_url: doc.template_url || '',
      template_file_path: doc.template_file_path || '',
      timing: doc.timing,
      is_required: doc.is_required,
      is_published: doc.is_published,
      allow_resubmission: doc.allow_resubmission,
      due_date: doc.due_date ? doc.due_date.split('T')[0] : ''
    });
    setEditingDoc(doc);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return;
    }

    try {
      const docData = {
        program_id: programId,
        title: formData.title,
        description: formData.description || null,
        template_url: formData.template_url || null,
        template_file_path: formData.template_file_path || null,
        timing: formData.timing,
        is_required: formData.is_required,
        is_published: formData.is_published,
        allow_resubmission: formData.allow_resubmission,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        created_by: user?.id
      };

      if (editingDoc) {
        // Update
        const { error: updateError } = await supabase
          .from('program_documents')
          .update(docData)
          .eq('id', editingDoc.id);

        if (updateError) throw updateError;
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('program_documents')
          .insert({
            ...docData,
            position: documents.length
          });

        if (insertError) throw insertError;
      }

      setEditingDoc(null);
      setIsCreating(false);
      resetForm();
      await fetchDocuments();
    } catch (err) {
      console.error('Error saving document:', err);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('program_documents')
        .delete()
        .eq('id', docId);

      if (deleteError) throw deleteError;
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const handleTogglePublished = async (doc: ProgramDocument) => {
    try {
      const { error: updateError } = await supabase
        .from('program_documents')
        .update({ is_published: !doc.is_published })
        .eq('id', doc.id);

      if (updateError) throw updateError;
      fetchDocuments();
    } catch (err) {
      console.error('Error toggling published:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError(null);
    try {
      // Vérifier que l'utilisateur a les permissions
      if (!user) {
        throw new Error('Vous devez être connecté pour uploader un fichier');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'trainer', 'instructor'].includes(profile.role)) {
        throw new Error('Vous n\'avez pas les permissions pour uploader des documents. Seuls les administrateurs et formateurs peuvent uploader.');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `templates/programs/${programId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('fillable-documents')
        .upload(filePath, file);

      if (uploadError) {
        // Messages d'erreur plus explicites
        if (uploadError.message?.includes('new row violates row-level security')) {
          throw new Error('Erreur de permissions : vous n\'avez pas les droits pour uploader dans ce dossier. Vérifiez que vous êtes admin, trainer ou instructor.');
        }
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
          throw new Error('Le bucket "fillable-documents" n\'existe pas. Veuillez exécuter le script SQL setup-fillable-documents-storage.sql dans Supabase.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('fillable-documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        template_url: urlData.publicUrl,
        template_file_path: filePath
      }));
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploadingFile(false);
    }
  };

  const getTimingLabel = (timing: string) => {
    switch (timing) {
      case 'start': return 'Début de parcours';
      case 'end': return 'Fin de parcours';
      default: return 'À tout moment';
    }
  };

  const getTimingColor = (timing: string) => {
    switch (timing) {
      case 'start': return 'bg-blue-100 text-blue-700';
      case 'end': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Chargement...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Documents du programme</h3>
          <span className="text-sm text-gray-500">({documents.length})</span>
          {totalEnrolled > 0 && (() => {
            // Calculer le nombre total de nouvelles soumissions (status = 'submitted')
            const totalNewSubmissions = Object.values(submissions).reduce((total, docSubs) => {
              return total + docSubs.filter(s => s.status === 'submitted').length;
            }, 0);
            // Calculer le nombre total de soumissions
            const totalSubmissions = Object.values(submissions).reduce((total, docSubs) => {
              return total + docSubs.length;
            }, 0);
            const totalExpected = totalEnrolled * documents.length;
            return (
              <span className="text-sm font-medium text-purple-600">
                {totalNewSubmissions > 0 && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    {totalNewSubmissions} nouveau{totalNewSubmissions > 1 ? 'x' : ''}
                  </span>
                )}
                <span className="ml-2 text-gray-600">
                  {totalSubmissions}/{totalExpected} reçu{totalSubmissions > 1 ? 's' : ''}
                </span>
              </span>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (documents.length > 0) {
                fetchSubmissionsForDocs(documents.map(d => d.id));
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            title="Rafraîchir les soumissions"
          >
            <Download className="w-4 h-4" />
            Rafraîchir
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter un document
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm border-b border-red-200">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Fermer</button>
        </div>
      )}

      {/* Formulaire de création/édition */}
      {(isCreating || editingDoc) && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Questionnaire de positionnement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moment
                </label>
                <select
                  value={formData.timing}
                  onChange={(e) => setFormData(prev => ({ ...prev, timing: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="start">Début de parcours</option>
                  <option value="end">Fin de parcours</option>
                  <option value="anytime">À tout moment</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Instructions pour l'apprenant..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichier template
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.template_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_url: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="URL du fichier ou upload..."
                  />
                  <label className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {uploadingFile ? '...' : 'Upload'}
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date limite (optionnel)
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700">Obligatoire</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_resubmission}
                  onChange={(e) => setFormData(prev => ({ ...prev, allow_resubmission: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700">Autoriser re-soumission</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700">Publié</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingDoc(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Save className="w-4 h-4" />
                {editingDoc ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des documents */}
      <div className="divide-y divide-gray-200">
        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun document pour ce programme</p>
            <p className="text-sm mt-1">
              Ajoutez des questionnaires que les apprenants peuvent télécharger et soumettre
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-4 ${!doc.is_published ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 text-gray-400">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{doc.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded ${getTimingColor(doc.timing)}`}>
                          {getTimingLabel(doc.timing)}
                        </span>
                        {doc.is_required && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            Obligatoire
                          </span>
                        )}
                        {!doc.is_published && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            Non publié
                          </span>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {doc.template_url && (
                          <a
                            href={doc.template_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Download className="w-3 h-3" />
                            Télécharger
                          </a>
                        )}
                        {doc.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Échéance: {new Date(doc.due_date).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {doc.allow_resubmission && (
                          <span>Re-soumission autorisée</span>
                        )}
                      </div>
                      {/* Compteur de soumissions */}
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        {(() => {
                          const docSubmissions = submissions[doc.id] || [];
                          const newSubmissions = docSubmissions.filter(s => s.status === 'submitted').length;
                          const totalSubmissions = docSubmissions.length;
                          const expected = totalEnrolled;
                          
                          return (
                            <>
                              {totalSubmissions > 0 && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Users className="w-4 h-4" />
                                  <span>
                                    {newSubmissions > 0 && (
                                      <span className="font-semibold text-purple-600">
                                        {newSubmissions} nouveau{newSubmissions > 1 ? 'x' : ''} /{' '}
                                      </span>
                                    )}
                                    {totalSubmissions}/{expected} reçu{totalSubmissions > 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                              {totalSubmissions === 0 && expected > 0 && (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Users className="w-4 h-4" />
                                  <span>0/{expected} reçu</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        {missingSubmissions[doc.id] && missingSubmissions[doc.id].length > 0 && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>{missingSubmissions[doc.id].length} personne{missingSubmissions[doc.id].length > 1 ? 's' : ''} n'{missingSubmissions[doc.id].length > 1 ? 'ont' : 'a'} pas soumis</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleDocExpanded(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 rounded hover:bg-purple-50"
                        title="Voir les soumissions"
                      >
                        {expandedDocs.has(doc.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleTogglePublished(doc)}
                        className={`p-1.5 rounded ${
                          doc.is_published
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={doc.is_published ? 'Dépublier' : 'Publier'}
                      >
                        {doc.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(doc)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Liste des soumissions */}
              {expandedDocs.has(doc.id) && (
                <div className="mt-4 ml-8 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700">Soumissions des apprenants</h5>
                    {submissions[doc.id] && submissions[doc.id].length > 0 && (
                      <div className="flex items-center gap-2">
                        {submissions[doc.id].some(s => s.status === 'submitted') && (
                          <button
                            onClick={() => handleApproveAll(doc.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            title="Approuver toutes les soumissions en attente"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Tout approuver
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadAll(doc.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          title="Télécharger toutes les soumissions"
                        >
                          <Download className="w-4 h-4" />
                          Tout télécharger
                        </button>
                      </div>
                    )}
                  </div>
                  {submissions[doc.id] && submissions[doc.id].length > 0 ? (
                    <div className="space-y-3">
                      {submissions[doc.id].map((sub) => (
                        <div
                          key={sub.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {sub.profiles?.full_name || sub.profiles?.student_id || 'Utilisateur inconnu'}
                                </span>
                                {sub.profiles?.student_id && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    {sub.profiles.student_id}
                                  </span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  sub.status === 'reviewed' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {sub.status === 'approved' ? 'Approuvé' :
                                   sub.status === 'rejected' ? 'Rejeté' :
                                   sub.status === 'reviewed' ? 'En révision' :
                                   'Soumis'}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                Soumis le {new Date(sub.submitted_at).toLocaleString('fr-FR')}
                              </div>
                              {sub.feedback && (
                                <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                                  <strong>Feedback:</strong> {sub.feedback}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={async () => {
                                  const userName = sub.profiles?.full_name || 
                                                  sub.profiles?.student_id || 
                                                  'Utilisateur_inconnu';
                                  const docTitle = documents.find(d => d.id === sub.document_id)?.title || 
                                                   'Document';
                                  await downloadFileWithCustomName(
                                    sub.file_path,
                                    userName,
                                    docTitle,
                                    sub.file_name
                                  );
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                <Download className="w-4 h-4" />
                                Télécharger
                              </button>
                              {sub.status === 'submitted' && (
                                <button
                                  onClick={() => {
                                    setReviewingSubmission(sub.id);
                                    setReviewFeedback(sub.feedback || '');
                                    setReviewStatus('approved');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Évaluer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-4">
                      Aucune soumission pour ce document
                    </div>
                  )}
                  
                  {/* Liste des personnes n'ayant pas soumis */}
                  {missingSubmissions[doc.id] && missingSubmissions[doc.id].length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-300">
                      <h6 className="text-sm font-medium text-red-700 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Personnes n'ayant pas encore soumis ({missingSubmissions[doc.id].length})
                      </h6>
                      <div className="space-y-2">
                        {missingSubmissions[doc.id].map((user) => (
                          <div
                            key={user.user_id}
                            className="bg-red-50 rounded-lg p-2 border border-red-200"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">
                                {user.full_name || user.student_id || 'Utilisateur inconnu'}
                              </span>
                              {user.student_id && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                  {user.student_id}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal d'évaluation */}
      {reviewingSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Évaluer la soumission</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as 'approved' | 'rejected')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="approved">Approuvé</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (optionnel)
                </label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Commentaires pour l'apprenant..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setReviewingSubmission(null);
                  setReviewFeedback('');
                  setReviewStatus('approved');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReviewSubmission(reviewingSubmission)}
                className={`px-4 py-2 text-white rounded-lg ${
                  reviewStatus === 'approved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewStatus === 'approved' ? 'Approuver' : 'Rejeter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
