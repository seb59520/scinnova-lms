import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { FileUpload } from './FileUpload'
import { Download, Trash2, Plus, FileText, ArrowUp, ArrowDown } from 'lucide-react'

interface ItemDocument {
  id: string
  item_id: string
  title: string
  description?: string
  file_path: string
  file_name: string
  file_size?: number
  file_type?: string
  order_index: number
}

interface ItemDocumentsManagerProps {
  itemId: string
  itemType: string
}

export function ItemDocumentsManager({ itemId, itemType }: ItemDocumentsManagerProps) {
  const { user, profile } = useAuth()
  const [documents, setDocuments] = useState<ItemDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    file: null as File | null
  })

  // Afficher uniquement pour les exercices et TP
  if (itemType !== 'exercise' && itemType !== 'tp') {
    return null
  }

  useEffect(() => {
    if (itemId && itemId !== 'new') {
      fetchDocuments()
    } else {
      setLoading(false)
    }
  }, [itemId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('item_documents')
        .select('*')
        .eq('item_id', itemId)
        .order('order_index', { ascending: true })

      if (fetchError) throw fetchError

      setDocuments(data || [])
    } catch (err: any) {
      console.error('Error fetching documents:', err)
      setError('Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setNewDocument(prev => ({ ...prev, file }))
      setError('') // Effacer les erreurs précédentes
    } else {
      setNewDocument(prev => ({ ...prev, file: null }))
    }
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

    if (!newDocument.title.trim() || !newDocument.file || !itemId || itemId === 'new') {
      const missingFields = []
      if (!newDocument.title.trim()) missingFields.push('titre')
      if (!newDocument.file) missingFields.push('fichier')
      if (!itemId || itemId === 'new') missingFields.push('itemId valide')
      
      console.warn('⚠️ Champs manquants:', missingFields)
      setError(`Veuillez remplir le titre et sélectionner un fichier. Manquant: ${missingFields.join(', ')}`)
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      // Upload du fichier vers Supabase Storage
      const fileExt = newDocument.file.name.split('.').pop()
      const fileName = `${itemId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-documents')
        .upload(fileName, newDocument.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // Messages d'erreur plus explicites
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
          throw new Error('Le bucket "item-documents" n\'existe pas. Veuillez exécuter le script SQL setup-item-documents-storage.sql dans Supabase.')
        }
        if (uploadError.message?.includes('new row violates row-level security')) {
          throw new Error('Vous n\'avez pas les permissions pour uploader des documents. Vérifiez que vous êtes admin, trainer ou instructor.')
        }
        if (uploadError.message?.includes('File size exceeds')) {
          throw new Error('Le fichier est trop volumineux. Taille maximum: 50MB')
        }
        
        throw uploadError
      }

      // Créer l'entrée dans la table item_documents
      const nextOrderIndex = documents.length > 0 
        ? Math.max(...documents.map(d => d.order_index)) + 1 
        : 0

      const { data: docData, error: docError } = await supabase
        .from('item_documents')
        .insert({
          item_id: itemId,
          title: newDocument.title.trim(),
          description: newDocument.description.trim() || null,
          file_path: fileName,
          file_name: newDocument.file.name,
          file_size: newDocument.file.size,
          file_type: newDocument.file.type,
          order_index: nextOrderIndex,
          created_by: profile?.id || user?.id
        })
        .select()
        .single()

      if (docError) throw docError

      setDocuments([...documents, docData])
      setNewDocument({ title: '', description: '', file: null })
      setSuccess('Document ajouté avec succès')
      
      // Recharger la liste des documents
      await fetchDocuments()
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du document:', err)
      setError(err.message || 'Erreur lors de l\'ajout du document.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return
    }

    try {
      setError('')
      
      // Supprimer le fichier du storage
      const { error: deleteFileError } = await supabase.storage
        .from('item-documents')
        .remove([filePath])

      if (deleteFileError) {
        console.warn('Error deleting file from storage:', deleteFileError)
        // Continuer même si la suppression du fichier échoue
      }

      // Supprimer l'entrée de la base de données
      const { error: deleteError } = await supabase
        .from('item_documents')
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
      // Échanger les order_index
      const { error: error1 } = await supabase
        .from('item_documents')
        .update({ order_index: otherDoc.order_index })
        .eq('id', doc.id)

      if (error1) throw error1

      const { error: error2 } = await supabase
        .from('item_documents')
        .update({ order_index: doc.order_index })
        .eq('id', otherDoc.id)

      if (error2) throw error2

      // Mettre à jour l'état local
      const newDocuments = [...documents]
      ;[newDocuments[docIndex], newDocuments[newIndex]] = [newDocuments[newIndex], newDocuments[docIndex]]
      setDocuments(newDocuments)
    } catch (err: any) {
      console.error('Error moving document:', err)
      setError(err.message || 'Erreur lors du déplacement du document')
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Chargement des documents...</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" />
        Documents à télécharger
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Ajoutez des documents (PDF, images, fichiers de données, etc.) que les apprenants pourront télécharger pour réaliser cet exercice ou TP.
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
      {itemId && itemId !== 'new' && (
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
          <h4 className="font-medium text-gray-900 mb-3">Ajouter un document</h4>
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
                placeholder="Ex: Fichier de données, Modèle Excel, etc."
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
                placeholder="Description du document..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fichier *
              </label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.rar,.txt,.jpg,.jpeg,.png,.json,.xml"
                maxSize={50}
              />
              {newDocument.file ? (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Fichier sélectionné: {newDocument.file.name}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Taille: {(newDocument.file.size / 1024).toFixed(1)} KB • Type: {newDocument.file.type || 'Non spécifié'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Aucun fichier sélectionné
                </p>
              )}
            </div>
            <button
              onClick={handleAddDocument}
              disabled={uploading || !newDocument.title.trim() || !newDocument.file || !profile || !['admin', 'trainer', 'instructor'].includes(profile.role)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{uploading ? 'Ajout...' : 'Ajouter le document'}</span>
            </button>
            <div className="mt-2 space-y-1">
              {(!newDocument.title.trim() || !newDocument.file) && (
                <p className="text-xs text-gray-500">
                  {!newDocument.title.trim() && !newDocument.file && '⚠️ Veuillez remplir le titre et sélectionner un fichier'}
                  {!newDocument.title.trim() && newDocument.file && '⚠️ Veuillez remplir le titre'}
                  {newDocument.title.trim() && !newDocument.file && '⚠️ Veuillez sélectionner un fichier'}
                </p>
              )}
              {!profile && (
                <p className="text-xs text-yellow-600">⚠️ Profil en cours de chargement...</p>
              )}
              {profile && !['admin', 'trainer', 'instructor'].includes(profile.role) && (
                <p className="text-xs text-red-600">⚠️ Permissions insuffisantes (rôle: {profile.role})</p>
              )}
            </div>
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
                  <h4 className="font-medium text-gray-900">{doc.title}</h4>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {doc.file_name} • {(doc.file_size ? doc.file_size / 1024 : 0).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={supabase.storage.from('item-documents').getPublicUrl(doc.file_path).data.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
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
          Aucun document ajouté. Les apprenants n'auront pas de documents à télécharger pour cet exercice/TP.
        </p>
      )}
    </div>
  )
}

