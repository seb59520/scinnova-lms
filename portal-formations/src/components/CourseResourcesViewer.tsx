import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CourseResource } from '../types/database'
import { 
  FileText, 
  Link2, 
  Video, 
  Download,
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  Loader2,
  FolderOpen
} from 'lucide-react'

interface CourseResourcesViewerProps {
  courseId: string
}

export function CourseResourcesViewer({ courseId }: CourseResourcesViewerProps) {
  const [resources, setResources] = useState<CourseResource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResources()
  }, [courseId])

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_visible', true)
        .order('position', { ascending: true })

      if (error) throw error
      setResources(data || [])
    } catch (err) {
      console.error('Error fetching resources:', err)
    } finally {
      setLoading(false)
    }
  }

  const getResourceIcon = (type: string, mimeType?: string | null) => {
    if (type === 'url') return <Link2 className="w-5 h-5 text-blue-500" />
    if (type === 'video') return <Video className="w-5 h-5 text-purple-500" />
    
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

  const handleDownload = async (resource: CourseResource) => {
    if (resource.external_url) {
      window.open(resource.external_url, '_blank')
    } else if (resource.file_path) {
      const { data } = await supabase.storage
        .from('course-resources')
        .createSignedUrl(resource.file_path, 3600)
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      </div>
    )
  }

  if (resources.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-blue-600" />
        Ressources de la formation
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {resources.map((resource) => (
          <button
            key={resource.id}
            onClick={() => handleDownload(resource)}
            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-left group"
          >
            <div className="flex-shrink-0">
              {getResourceIcon(resource.resource_type, resource.mime_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                {resource.title}
              </h4>
              {resource.description && (
                <p className="text-xs text-gray-500 truncate">{resource.description}</p>
              )}
              {resource.file_size && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatFileSize(resource.file_size)}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-600">
              {resource.external_url ? (
                <ExternalLink className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
