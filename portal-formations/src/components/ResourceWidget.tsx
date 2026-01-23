import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { FileUpload } from './FileUpload'
import { ResourceImportModal } from './ResourceImportModal'
import { 
  Download, 
  Trash2, 
  Plus, 
  FileText, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff,
  Link2,
  Video,
  Code,
  Database,
  File,
  ExternalLink,
  CheckCircle,
  XCircle,
  Upload
} from 'lucide-react'
import type { Resource, ResourceType, ResourceParentType, ResourceFormData } from '../types/resourcesWidget'

interface ResourceWidgetProps {
  // Une seule de ces props sera fournie
  courseId?: string
  moduleId?: string
  itemId?: string
  readOnly?: boolean
  title?: string
}

export function ResourceWidget({ 
  courseId, 
  moduleId, 
  itemId, 
  readOnly = false,
  title = 'Ressources'
}: ResourceWidgetProps) {
  const { user, profile } = useAuth()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [newResource, setNewResource] = useState<ResourceFormData>({
    title: '',
    description: '',
    resource_type: 'file',
    file: null,
    external_url: '',
    is_required: false,
    is_visible: true
  })

  // Déterminer le type de parent et l'ID
  const parentType: ResourceParentType | null = courseId ? 'course' : moduleId ? 'module' : itemId ? 'item' : null
  const parentId = courseId || moduleId || itemId

  useEffect(() => {
    if (parentId && parentId !== 'new') {
      fetchResources()
    } else {
      setLoading(false)
    }
  }, [courseId, moduleId, itemId])

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('resources')
        .select('*')
        .order('order_index', { ascending: true })

      if (courseId) {
        query = query.eq('course_id', courseId)
      } else if (moduleId) {
        query = query.eq('module_id', moduleId)
      } else if (itemId) {
        query = query.eq('item_id', itemId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setResources(data || [])
      
      // Générer les URLs signées
      if (data && data.length > 0) {
        generateSignedUrls(data)
      }
    } catch (err: any) {
      console.error('Error fetching resources:', err)
      setError('Erreur lors du chargement des ressources')
    } finally {
      setLoading(false)
    }
  }

  const generateSignedUrls = useCallback(async (res: Resource[] = resources) => {
    try {
      const urls: Record<string, string> = {}
      
      for (const resource of res) {
        if (resource.file_path) {
          const { data, error } = await supabase.storage
            .from('resources-widget')
            .createSignedUrl(resource.file_path, 3600)
          
          if (!error && data) {
            urls[resource.id] = data.signedUrl
          }
        }
      }

      setSignedUrls(urls)
    } catch (err) {
      console.error('Error generating signed URLs:', err)
    }
  }, [resources])

  useEffect(() => {
    if (resources.length > 0) {
      generateSignedUrls()
    }
  }, [resources, generateSignedUrls])

  const handleFileSelect = (file: File | null) => {
    setNewResource(prev => ({ ...prev, file }))
    setError('')
  }

  const handleAddResource = async () => {
    if (!profile) {
      setError('Votre profil n\'est pas encore chargé. Veuillez patienter quelques secondes et réessayer.')
      return
    }

    const allowedRoles = ['admin', 'trainer', 'instructor']
    if (!allowedRoles.includes(profile.role)) {
      setError(`Vous n'avez pas les permissions pour ajouter des ressources. Rôle requis: admin, trainer ou instructor.`)
      return
    }

    if (!newResource.title.trim() || !parentId || parentId === 'new') {
      setError('Veuillez remplir le titre et vous assurer que le parent est valide.')
      return
    }

    // Vérifier qu'un fichier ou une URL est fourni selon le type
    if ((newResource.resource_type === 'file' || newResource.resource_type === 'document' || newResource.resource_type === 'code' || newResource.resource_type === 'data') && !newResource.file) {
      setError('Veuillez sélectionner un fichier.')
      return
    }

    if ((newResource.resource_type === 'url' || newResource.resource_type === 'video') && !newResource.external_url.trim()) {
      setError('Veuillez fournir une URL.')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      let filePath: string | null = null
      let fileName: string | null = null
      let fileSize: number | null = null
      let mimeType: string | null = null

      // Upload du fichier si nécessaire
      if (newResource.file) {
        const fileExt = newResource.file.name.split('.').pop()
        const sanitizedName = newResource.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileNamePath = `${parentType}/${parentId}/${Date.now()}-${sanitizedName}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resources-widget')
          .upload(fileNamePath, newResource.file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          if (uploadError.message?.includes('Bucket not found')) {
            throw new Error('Le bucket "resources-widget" n\'existe pas. Veuillez exécuter le script SQL setup-resources-widget-storage.sql dans Supabase.')
          }
          throw uploadError
        }

        filePath = fileNamePath
        fileName = newResource.file.name
        fileSize = newResource.file.size
        mimeType = newResource.file.type
      }

      // Créer l'entrée dans la table resources
      const nextOrderIndex = resources.length > 0 
        ? Math.max(...resources.map(r => r.order_index)) + 1 
        : 0

      const resourceData: any = {
        title: newResource.title.trim(),
        description: newResource.description.trim() || null,
        resource_type: newResource.resource_type,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        external_url: (newResource.resource_type === 'url' || newResource.resource_type === 'video') ? newResource.external_url.trim() : null,
        is_required: newResource.is_required,
        is_visible: newResource.is_visible,
        order_index: nextOrderIndex,
        created_by: profile?.id || user?.id
      }

      if (courseId) resourceData.course_id = courseId
      if (moduleId) resourceData.module_id = moduleId
      if (itemId) resourceData.item_id = itemId

      const { data: resourceDataResult, error: resourceError } = await supabase
        .from('resources')
        .insert(resourceData)
        .select()
        .single()

      if (resourceError) throw resourceError

      setResources([...resources, resourceDataResult])
      setNewResource({
        title: '',
        description: '',
        resource_type: 'file',
        file: null,
        external_url: '',
        is_required: false,
        is_visible: true
      })
      setShowForm(false)
      setSuccess('Ressource ajoutée avec succès')
      
      await fetchResources()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout de la ressource:', err)
      setError(err.message || 'Erreur lors de l\'ajout de la ressource.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteResource = async (resourceId: string, filePath: string | null) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
      return
    }

    try {
      setError('')
      
      // Supprimer le fichier du storage si présent
      if (filePath) {
        const { error: deleteFileError } = await supabase.storage
          .from('resources-widget')
          .remove([filePath])

        if (deleteFileError) {
          console.warn('Error deleting file from storage:', deleteFileError)
        }
      }

      // Supprimer l'entrée de la base de données
      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId)

      if (deleteError) throw deleteError

      setResources(resources.filter(r => r.id !== resourceId))
      setSuccess('Ressource supprimée avec succès')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error deleting resource:', err)
      setError(err.message || 'Erreur lors de la suppression de la ressource')
    }
  }

  const handleMoveResource = async (resourceId: string, direction: 'up' | 'down') => {
    const resourceIndex = resources.findIndex(r => r.id === resourceId)
    if (resourceIndex === -1) return

    const newIndex = direction === 'up' ? resourceIndex - 1 : resourceIndex + 1
    if (newIndex < 0 || newIndex >= resources.length) return

    const resource = resources[resourceIndex]
    const otherResource = resources[newIndex]

    try {
      const { error: error1 } = await supabase
        .from('resources')
        .update({ order_index: otherResource.order_index })
        .eq('id', resource.id)

      if (error1) throw error1

      const { error: error2 } = await supabase
        .from('resources')
        .update({ order_index: resource.order_index })
        .eq('id', otherResource.id)

      if (error2) throw error2

      const newResources = [...resources]
      ;[newResources[resourceIndex], newResources[newIndex]] = [newResources[newIndex], newResources[resourceIndex]]
      setResources(newResources)
    } catch (err: any) {
      console.error('Error moving resource:', err)
      setError(err.message || 'Erreur lors du déplacement de la ressource')
    }
  }

  const handleToggleVisibility = async (resourceId: string, currentVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ is_visible: !currentVisible })
        .eq('id', resourceId)

      if (error) throw error

      setResources(resources.map(r => 
        r.id === resourceId ? { ...r, is_visible: !currentVisible } : r
      ))
      setSuccess(`Ressource ${!currentVisible ? 'rendue visible' : 'masquée'} avec succès`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error toggling visibility:', err)
      setError(err.message || 'Erreur lors de la mise à jour')
    }
  }

  const getResourceIcon = (type: ResourceType, mimeType?: string | null) => {
    switch (type) {
      case 'url':
        return <Link2 className="w-5 h-5 text-blue-500" />
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />
      case 'code':
        return <Code className="w-5 h-5 text-green-500" />
      case 'data':
        return <Database className="w-5 h-5 text-orange-500" />
      case 'document':
      case 'file':
        if (mimeType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
        return <File className="w-5 h-5 text-gray-500" />
      default:
        return <File className="w-5 h-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Chargement des ressources...</p>
      </div>
    )
  }

  if (!parentId || parentId === 'new') {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          {title}
        </h3>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary flex items-center space-x-2"
              title="Importer des ressources en masse"
            >
              <Upload className="w-4 h-4" />
              <span>Importer</span>
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{showForm ? 'Annuler' : 'Ajouter une ressource'}</span>
            </button>
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Fichiers, liens et ressources pour les TP et exercices.
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
      {showForm && !readOnly && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Nouvelle ressource</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                className="input-field"
                placeholder="Ex: Fichier de données, Code source, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optionnel)
              </label>
              <textarea
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                className="input-field h-20 resize-none"
                placeholder="Description de la ressource..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de ressource *
              </label>
              <select
                value={newResource.resource_type}
                onChange={(e) => setNewResource({ ...newResource, resource_type: e.target.value as ResourceType, file: null, external_url: '' })}
                className="input-field"
              >
                <option value="file">Fichier</option>
                <option value="document">Document (PDF, DOCX)</option>
                <option value="code">Code source</option>
                <option value="data">Données (CSV, JSON, Excel)</option>
                <option value="url">Lien externe</option>
                <option value="video">Vidéo (lien)</option>
              </select>
            </div>
            {(newResource.resource_type === 'file' || newResource.resource_type === 'document' || newResource.resource_type === 'code' || newResource.resource_type === 'data') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichier *
                </label>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  accept="*"
                  maxSize={100}
                />
                {newResource.file && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      ✓ Fichier sélectionné: {newResource.file.name}
                    </p>
                  </div>
                )}
              </div>
            )}
            {(newResource.resource_type === 'url' || newResource.resource_type === 'video') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={newResource.external_url}
                  onChange={(e) => setNewResource({ ...newResource, external_url: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={newResource.is_required}
                  onChange={(e) => setNewResource({ ...newResource, is_required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_required" className="text-sm text-gray-700">
                  Ressource obligatoire
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_visible"
                  checked={newResource.is_visible}
                  onChange={(e) => setNewResource({ ...newResource, is_visible: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_visible" className="text-sm text-gray-700">
                  Visible pour les étudiants
                </label>
              </div>
            </div>
            <button
              onClick={handleAddResource}
              disabled={uploading || !newResource.title.trim() || !profile || !['admin', 'trainer', 'instructor'].includes(profile.role)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{uploading ? 'Ajout...' : 'Ajouter la ressource'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Liste des ressources */}
      {resources.length > 0 ? (
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <div
              key={resource.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1">
                {!readOnly && (
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleMoveResource(resource.id, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Déplacer vers le haut"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveResource(resource.id, 'down')}
                      disabled={index === resources.length - 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Déplacer vers le bas"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  {getResourceIcon(resource.resource_type, resource.mime_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{resource.title}</h4>
                    {resource.is_required && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Obligatoire</span>
                    )}
                    {!resource.is_visible && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Masquée</span>
                    )}
                  </div>
                  {resource.description && (
                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {resource.file_name && (
                      <span>{resource.file_name}</span>
                    )}
                    {resource.file_size && (
                      <span>{(resource.file_size / 1024).toFixed(1)} KB</span>
                    )}
                    {resource.external_url && (
                      <span className="text-blue-600">Lien externe</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {resource.file_path && signedUrls[resource.id] && (
                  <a
                    href={signedUrls[resource.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Télécharger"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                )}
                {resource.external_url && (
                  <a
                    href={resource.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ouvrir le lien"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
                {!readOnly && (
                  <>
                    <button
                      onClick={() => handleToggleVisibility(resource.id, resource.is_visible)}
                      className={`p-2 rounded-lg transition-colors ${
                        resource.is_visible 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      title={resource.is_visible ? 'Masquer' : 'Afficher'}
                    >
                      {resource.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteResource(resource.id, resource.file_path)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">
          Aucune ressource. {!readOnly && 'Cliquez sur "Ajouter une ressource" pour en créer une.'}
        </p>
      )}

      {/* Modal d'import */}
      {showImportModal && (
        <ResourceImportModal
          courseId={courseId}
          moduleId={moduleId}
          itemId={itemId}
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            fetchResources()
          }}
        />
      )}
    </div>
  )
}
