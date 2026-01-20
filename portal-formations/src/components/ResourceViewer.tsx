import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  Download, 
  FileText, 
  Link2, 
  Video, 
  Code, 
  Database, 
  File, 
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import type { Resource, ResourceType } from '../types/resourcesWidget'

interface ResourceViewerProps {
  // Une seule de ces props sera fournie
  courseId?: string
  moduleId?: string
  itemId?: string
  title?: string
}

export function ResourceViewer({ 
  courseId, 
  moduleId, 
  itemId,
  title = 'Ressources'
}: ResourceViewerProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

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

      let query = supabase
        .from('resources')
        .select('*')
        .eq('is_visible', true)
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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Chargement des ressources...</p>
      </div>
    )
  }

  if (!parentId || parentId === 'new' || resources.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" />
        {title}
      </h3>

      <div className="space-y-3">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1">
              {getResourceIcon(resource.resource_type, resource.mime_type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">{resource.title}</h4>
                  {resource.is_required && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Obligatoire
                    </span>
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
                    <span>{formatFileSize(resource.file_size)}</span>
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
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger</span>
                </a>
              )}
              {resource.external_url && (
                <a
                  href={resource.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ouvrir</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
