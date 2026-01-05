import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Download, FileText, File, Image, FileSpreadsheet, FileCode } from 'lucide-react'

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

interface ItemDocumentsProps {
  itemId: string
}

export function ItemDocuments({ itemId }: ItemDocumentsProps) {
  const [documents, setDocuments] = useState<ItemDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (itemId) {
      fetchDocuments()
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

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="w-5 h-5" />
    
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />
    if (fileType.includes('image')) return <Image className="w-5 h-5 text-green-600" />
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />
    }
    if (fileType.includes('code') || fileType.includes('text')) {
      return <FileCode className="w-5 h-5 text-blue-600" />
    }
    return <File className="w-5 h-5" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Taille inconnue'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getDownloadUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('item-documents')
      .getPublicUrl(filePath)
    return data.publicUrl
  }

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Chargement des documents...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return null // Ne rien afficher s'il n'y a pas de documents
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" />
        Documents à télécharger
      </h3>
      
      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="mt-1">
                  {getFileIcon(doc.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">{doc.title}</h4>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{doc.file_name}</span>
                    {doc.file_size && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <a
                href={getDownloadUrl(doc.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                download
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Télécharger</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


