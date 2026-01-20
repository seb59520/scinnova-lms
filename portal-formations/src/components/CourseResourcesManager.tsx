import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CourseResource, CourseResourceType } from '../types/database'
import { 
  FileText, 
  Link2, 
  Video, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  Plus,
  X,
  Download,
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  Loader2
} from 'lucide-react'

interface CourseResourcesManagerProps {
  courseId: string
  readOnly?: boolean
}

export function CourseResourcesManager({ courseId, readOnly = false }: CourseResourcesManagerProps) {
  const [resources, setResources] = useState<CourseResource[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResources()
  }, [courseId])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', courseId)
        .order('position', { ascending: true })

      if (error) throw error
      setResources(data || [])
    } catch (err: any) {
      console.error('Error fetching resources:', err)
      setError('Erreur lors du chargement des ressources')
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (resource: CourseResource) => {
    try {
      const { error } = await supabase
        .from('course_resources')
        .update({ is_visible: !resource.is_visible, updated_at: new Date().toISOString() })
        .eq('id', resource.id)

      if (error) throw error
      
      setResources(prev => 
        prev.map(r => r.id === resource.id ? { ...r, is_visible: !r.is_visible } : r)
      )
    } catch (err: any) {
      console.error('Error toggling visibility:', err)
    }
  }

  const deleteResource = async (resource: CourseResource) => {
    if (!confirm(`Supprimer la ressource "${resource.title}" ?`)) return

    try {
      // Supprimer le fichier du storage si c'est un fichier uploadé
      if (resource.file_path) {
        await supabase.storage
          .from('course-resources')
          .remove([resource.file_path])
      }

      const { error } = await supabase
        .from('course_resources')
        .delete()
        .eq('id', resource.id)

      if (error) throw error
      
      setResources(prev => prev.filter(r => r.id !== resource.id))
    } catch (err: any) {
      console.error('Error deleting resource:', err)
      setError('Erreur lors de la suppression')
    }
  }

  const getResourceIcon = (type: CourseResourceType, mimeType?: string | null) => {
    if (type === 'url') return <Link2 className="w-5 h-5 text-blue-500" />
    if (type === 'video') return <Video className="w-5 h-5 text-purple-500" />
    
    // Pour les fichiers, afficher une icône selon le type MIME
    if (mimeType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    if (mimeType?.includes('image')) return <FileImage className="w-5 h-5 text-green-500" />
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || mimeType?.includes('csv')) 
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />
    
    return <File className="w-5 h-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getDownloadUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('course-resources')
      .createSignedUrl(filePath, 3600) // 1 heure
    return data?.signedUrl
  }

  const handleDownload = async (resource: CourseResource) => {
    if (resource.external_url) {
      window.open(resource.external_url, '_blank')
    } else if (resource.file_path) {
      const url = await getDownloadUrl(resource.file_path)
      if (url) {
        window.open(url, '_blank')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Ressources de la formation
        </h3>
        {!readOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ressource
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {resources.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucune ressource associée à cette formation</p>
          {!readOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              + Ajouter une première ressource
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className={`flex items-center gap-4 p-4 bg-white border rounded-lg ${
                resource.is_visible ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              {!readOnly && (
                <div className="cursor-move">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
              )}
              
              <div className="flex-shrink-0">
                {getResourceIcon(resource.resource_type, resource.mime_type)}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{resource.title}</h4>
                {resource.description && (
                  <p className="text-sm text-gray-500 truncate">{resource.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="capitalize">{resource.resource_type}</span>
                  {resource.file_size && (
                    <span>{formatFileSize(resource.file_size)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(resource)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={resource.external_url ? 'Ouvrir le lien' : 'Télécharger'}
                >
                  {resource.external_url ? (
                    <ExternalLink className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>

                {!readOnly && (
                  <>
                    <button
                      onClick={() => toggleVisibility(resource)}
                      className={`p-2 rounded-lg transition-colors ${
                        resource.is_visible 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={resource.is_visible ? 'Masquer' : 'Afficher'}
                    >
                      {resource.is_visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => deleteResource(resource)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout de ressource */}
      {showAddModal && (
        <AddResourceModal
          courseId={courseId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchResources()
          }}
          nextPosition={resources.length}
        />
      )}
    </div>
  )
}

// Modal pour ajouter une ressource
interface AddResourceModalProps {
  courseId: string
  onClose: () => void
  onSuccess: () => void
  nextPosition: number
}

function AddResourceModal({ courseId, onClose, onSuccess, nextPosition }: AddResourceModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resourceType, setResourceType] = useState<CourseResourceType>('file')
  const [file, setFile] = useState<File | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fonction pour sanitizer le nom de fichier (supprime les caractères invalides)
  const sanitizeFileName = (fileName: string): string => {
    // Extraire l'extension
    const lastDot = fileName.lastIndexOf('.')
    const nameWithoutExt = lastDot > 0 ? fileName.substring(0, lastDot) : fileName
    const extension = lastDot > 0 ? fileName.substring(lastDot) : ''
    
    // Normaliser les caractères accentués
    const normalized = nameWithoutExt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les diacritiques
      .replace(/[^a-zA-Z0-9._-]/g, '-') // Remplacer les caractères spéciaux par des tirets
      .replace(/-+/g, '-') // Remplacer les tirets multiples par un seul
      .replace(/^-|-$/g, '') // Supprimer les tirets en début/fin
    
    return normalized + extension
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      let filePath: string | null = null
      let fileSize: number | null = null
      let mimeType: string | null = null

      // Upload du fichier si c'est un fichier
      if ((resourceType === 'file' || resourceType === 'document') && file) {
        const fileExt = file.name.split('.').pop()
        const sanitizedName = sanitizeFileName(file.name)
        const fileName = `${courseId}/${Date.now()}-${sanitizedName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('course-resources')
          .upload(fileName, file, { upsert: true })

        if (uploadError) throw uploadError

        filePath = fileName
        fileSize = file.size
        mimeType = file.type
      }

      // Créer la ressource
      const { error: insertError } = await supabase
        .from('course_resources')
        .insert({
          course_id: courseId,
          title,
          description: description || null,
          resource_type: resourceType,
          file_path: filePath,
          external_url: resourceType === 'url' || resourceType === 'video' ? externalUrl : null,
          file_size: fileSize,
          mime_type: mimeType,
          position: nextPosition,
          is_visible: true,
          created_by: user.id
        })

      if (insertError) throw insertError

      onSuccess()
    } catch (err: any) {
      console.error('Error adding resource:', err)
      setError(err.message || 'Erreur lors de l\'ajout')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Ajouter une ressource</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de ressource
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResourceType('file')}
                className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                  resourceType === 'file'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-5 h-5" />
                <span>Fichier</span>
              </button>
              <button
                type="button"
                onClick={() => setResourceType('url')}
                className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                  resourceType === 'url'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Link2 className="w-5 h-5" />
                <span>Lien</span>
              </button>
              <button
                type="button"
                onClick={() => setResourceType('video')}
                className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                  resourceType === 'video'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Video className="w-5 h-5" />
                <span>Vidéo</span>
              </button>
              <button
                type="button"
                onClick={() => setResourceType('document')}
                className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                  resourceType === 'document'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Document</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Support de cours PDF"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description optionnelle..."
            />
          </div>

          {(resourceType === 'file' || resourceType === 'document') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fichier *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  className="w-full"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv,.txt,.md,.json,.py,.ipynb"
                />
                {file && (
                  <p className="mt-2 text-sm text-gray-600">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          )}

          {(resourceType === 'url' || resourceType === 'video') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={resourceType === 'video' ? 'https://youtube.com/...' : 'https://...'}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Ajouter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
