import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { FileUpload } from './FileUpload'
import { Download, Trash2, Plus, FileText, ArrowUp, ArrowDown, Calendar, CheckCircle, XCircle, Eye } from 'lucide-react'
import type { FillableDocument, FillableDocumentFormData } from '../types/fillableDocuments'

interface FillableDocumentsManagerProps {
  courseId: string
}

export function FillableDocumentsManager({ courseId }: FillableDocumentsManagerProps) {
  const { user, profile } = useAuth()
  const [documents, setDocuments] = useState<FillableDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [newDocument, setNewDocument] = useState<FillableDocumentFormData>({
    title: '',
    description: '',
    templateFile: null,
    is_required: false,
    due_date: null,
    allow_multiple_submissions: false,
    published: true
  })

  useEffect(() => {
    if (courseId && courseId !== 'new') {
      fetchDocuments()
    } else {
      setLoading(false)
    }
  }, [courseId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('fillable_documents')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (fetchError) throw fetchError

      setDocuments(data || [])
      
      // Générer les URLs signées pour les templates
      if (data && data.length > 0) {
        generateSignedUrls(data)
      }
    } catch (err: any) {
      console.error('Error fetching documents:', err)
      setError('Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
    }
  }

  const generateSignedUrls = async (docs: FillableDocument[]) => {
    try {
      const urls: Record<string, string> = {}
      
      for (const doc of docs) {
        const { data, error } = await supabase.storage
          .from('fillable-documents')
          .createSignedUrl(doc.template_file_path, 3600) // URL valide 1 heure
        
        if (!error && data) {
          urls[doc.id] = data.signedUrl
        }
      }

      setSignedUrls(urls)
    } catch (err) {
      console.error('Error generating signed URLs:', err)
    }
  }

  const handleFileSelect = (file: File | null) => {
    setNewDocument(prev => ({ ...prev, templateFile: file }))
    setError('')
  }

  const handleAddDocument = async () => {
    // Vérifier que le profil est chargé et que l'utilisateur a les permissions
    if (!profile) {
      console.error('❌ Profil non chargé')
      setError('Votre profil n\'est pas encore chargé. Veuillez patienter quelques secondes et réessayer.')
      return
    }

    const allowedRoles = ['admin', 'trainer', 'instructor']
    if (!allowedRoles.includes(profile.role)) {
      console.error('❌ Rôle insuffisant:', profile.role)
      setError(`Vous n'avez pas les permissions pour ajouter des documents. Rôle requis: admin, trainer ou instructor. Votre rôle: ${profile.role}`)
      return
    }

    if (!newDocument.title.trim() || !newDocument.templateFile || !courseId || courseId === 'new') {
      const missingFields = []
      if (!newDocument.title.trim()) missingFields.push('titre')
      if (!newDocument.templateFile) missingFields.push('fichier template')
      if (!courseId || courseId === 'new') missingFields.push('cours valide')
      
      console.warn('⚠️ Champs manquants:', missingFields)
      setError(`Veuillez remplir le titre et sélectionner un fichier template. Manquant: ${missingFields.join(', ')}`)
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      // Upload du fichier template vers Supabase Storage
      const fileExt = newDocument.templateFile.name.split('.').pop()
      const fileName = `templates/${courseId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fillable-documents')
        .upload(fileName, newDocument.templateFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
          throw new Error('Le bucket "fillable-documents" n\'existe pas. Veuillez exécuter le script SQL setup-fillable-documents-storage.sql dans Supabase.')
        }
        if (uploadError.message?.includes('new row violates row-level security')) {
          throw new Error('Vous n\'avez pas les permissions pour uploader des documents. Vérifiez que vous êtes admin, trainer ou instructor.')
        }
        if (uploadError.message?.includes('File size exceeds')) {
          throw new Error('Le fichier est trop volumineux. Taille maximum: 50MB')
        }
        
        throw uploadError
      }

      // Créer l'entrée dans la table fillable_documents
      const nextOrderIndex = documents.length > 0 
        ? Math.max(...documents.map(d => d.order_index)) + 1 
        : 0

      const { data: docData, error: docError } = await supabase
        .from('fillable_documents')
        .insert({
          course_id: courseId,
          title: newDocument.title.trim(),
          description: newDocument.description.trim() || null,
          template_file_path: fileName,
          template_file_name: newDocument.templateFile.name,
          template_file_size: newDocument.templateFile.size,
          template_file_type: newDocument.templateFile.type,
          is_required: newDocument.is_required,
          due_date: newDocument.due_date || null,
          allow_multiple_submissions: newDocument.allow_multiple_submissions,
          order_index: nextOrderIndex,
          published: newDocument.published,
          created_by: profile?.id || user?.id
        })
        .select()
        .single()

      if (docError) throw docError

      setDocuments([...documents, docData])
      setNewDocument({
        title: '',
        description: '',
        templateFile: null,
        is_required: false,
        due_date: null,
        allow_multiple_submissions: false,
        published: true
      })
      setShowForm(false)
      setSuccess('Document ajouté avec succès')
      
      await fetchDocuments()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du document:', err)
      setError(err.message || 'Erreur lors de l\'ajout du document.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.')) {
      return
    }

    try {
      setError('')
      
      // Supprimer le fichier du storage
      const { error: deleteFileError } = await supabase.storage
        .from('fillable-documents')
        .remove([filePath])

      if (deleteFileError) {
        console.warn('Error deleting file from storage:', deleteFileError)
      }

      // Supprimer l'entrée de la base de données
      const { error: deleteError } = await supabase
        .from('fillable_documents')
        .delete()
        .eq('id', docId)

      if (deleteError) throw deleteError

      setDocuments(documents.filter(d => d.id !== docId))
      setSuccess('Document supprimé avec succès')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error deleting document:', err)
      setError(err.message || 'Erreur lors de la suppression du document')
    }
  }

  const handleMoveDocument = async (docId: string, direction: 'up' | 'down') => {
    const docIndex = documents.findIndex(d => d.id === docId)
    if (docIndex === -1) return

    const newIndex = direction === 'up' ? docIndex - 1 : docIndex + 1
    if (newIndex < 0 || newIndex >= documents.length) return

    const doc = documents[docIndex]
    const otherDoc = documents[newIndex]

    try {
      const { error: error1 } = await supabase
        .from('fillable_documents')
        .update({ order_index: otherDoc.order_index })
        .eq('id', doc.id)

      if (error1) throw error1

      const { error: error2 } = await supabase
        .from('fillable_documents')
        .update({ order_index: doc.order_index })
        .eq('id', otherDoc.id)

      if (error2) throw error2

      const newDocuments = [...documents]
      ;[newDocuments[docIndex], newDocuments[newIndex]] = [newDocuments[newIndex], newDocuments[docIndex]]
      setDocuments(newDocuments)
    } catch (err: any) {
      console.error('Error moving document:', err)
      setError(err.message || 'Erreur lors du déplacement du document')
    }
  }

  const handleTogglePublished = async (docId: string, currentPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('fillable_documents')
        .update({ published: !currentPublished })
        .eq('id', docId)

      if (error) throw error

      setDocuments(documents.map(d => 
        d.id === docId ? { ...d, published: !currentPublished } : d
      ))
      setSuccess(`Document ${!currentPublished ? 'publié' : 'masqué'} avec succès`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error toggling published:', err)
      setError(err.message || 'Erreur lors de la mise à jour')
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Chargement des documents à compléter...</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Documents à compléter
        </h3>
        {courseId && courseId !== 'new' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Annuler' : 'Ajouter un document'}</span>
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Gérez les documents à compléter par les étudiants (formulaires, questionnaires, etc.). 
        Les étudiants pourront télécharger le template, le compléter et le soumettre.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && courseId && courseId !== 'new' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {!profile && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⏳ Chargement de votre profil... Veuillez patienter quelques secondes avant d'ajouter un document.
              </p>
            </div>
          )}
          {profile && !['admin', 'trainer', 'instructor'].includes(profile.role) && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ Vous n'avez pas les permissions pour ajouter des documents. Rôle requis: admin, trainer ou instructor. Votre rôle: {profile.role}
              </p>
            </div>
          )}
          <h4 className="font-medium text-gray-900 mb-3">Nouveau document à compléter</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre du document *
              </label>
              <input
                type="text"
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                className="input-field"
                placeholder="Ex: Formulaire d'évaluation, Questionnaire de satisfaction, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optionnel)
              </label>
              <textarea
                value={newDocument.description}
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                className="input-field h-20 resize-none"
                placeholder="Instructions pour compléter le document..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fichier template (PDF, DOCX, etc.) *
              </label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                maxSize={50}
              />
              {newDocument.templateFile ? (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Fichier sélectionné: {newDocument.templateFile.name}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Taille: {(newDocument.templateFile.size / 1024).toFixed(1)} KB • Type: {newDocument.templateFile.type || 'Non spécifié'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Aucun fichier sélectionné
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={newDocument.is_required}
                  onChange={(e) => setNewDocument({ ...newDocument, is_required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_required" className="text-sm text-gray-700">
                  Document obligatoire
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allow_multiple"
                  checked={newDocument.allow_multiple_submissions}
                  onChange={(e) => setNewDocument({ ...newDocument, allow_multiple_submissions: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="allow_multiple" className="text-sm text-gray-700">
                  Autoriser plusieurs soumissions
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  checked={newDocument.published}
                  onChange={(e) => setNewDocument({ ...newDocument, published: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="published" className="text-sm text-gray-700">
                  Publié (visible pour les étudiants)
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date limite (optionnel)
              </label>
              <input
                type="datetime-local"
                value={newDocument.due_date || ''}
                onChange={(e) => setNewDocument({ ...newDocument, due_date: e.target.value || null })}
                className="input-field"
              />
            </div>
            <button
              onClick={handleAddDocument}
              disabled={uploading || !newDocument.title.trim() || !newDocument.templateFile || !profile || !['admin', 'trainer', 'instructor'].includes(profile.role)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{uploading ? 'Ajout...' : 'Ajouter le document'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Liste des documents */}
      {documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => handleMoveDocument(doc.id, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Déplacer vers le haut"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDocument(doc.id, 'down')}
                    disabled={index === documents.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Déplacer vers le bas"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{doc.title}</h4>
                    {doc.published ? (
                      <CheckCircle className="w-4 h-4 text-green-500" title="Publié" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" title="Non publié" />
                    )}
                    {doc.is_required && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Obligatoire</span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{doc.template_file_name}</span>
                    {doc.due_date && (
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Échéance: {new Date(doc.due_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {doc.allow_multiple_submissions && (
                      <span className="text-blue-600">Soumissions multiples autorisées</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={signedUrls[doc.id] || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Voir le template"
                  onClick={(e) => {
                    if (!signedUrls[doc.id]) {
                      e.preventDefault()
                      // Régénérer l'URL si elle n'existe pas
                      supabase.storage
                        .from('fillable-documents')
                        .createSignedUrl(doc.template_file_path, 3600)
                        .then(({ data, error }) => {
                          if (!error && data) {
                            window.open(data.signedUrl, '_blank')
                          }
                        })
                    }
                  }}
                >
                  <Eye className="w-5 h-5" />
                </a>
                <button
                  onClick={() => handleTogglePublished(doc.id, doc.published)}
                  className={`p-2 rounded-lg transition-colors ${
                    doc.published 
                      ? 'text-green-600 hover:bg-green-50' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title={doc.published ? 'Masquer' : 'Publier'}
                >
                  {doc.published ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleDeleteDocument(doc.id, doc.template_file_path)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">
          Aucun document à compléter. Cliquez sur "Ajouter un document" pour en créer un.
        </p>
      )}
    </div>
  )
}
