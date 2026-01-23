import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { Upload, Download, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { CourseResourceType } from '../types/database'

interface CourseResourcesImportModalProps {
  courseId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ImportResourceRow {
  title: string
  description?: string
  resource_type: CourseResourceType
  external_url?: string
}

export function CourseResourcesImportModal({
  courseId,
  isOpen,
  onClose,
  onSuccess
}: CourseResourcesImportModalProps) {
  const { user } = useAuth()
  const [importMethod, setImportMethod] = useState<'csv' | 'json' | 'urls'>('csv')
  const [file, setFile] = useState<File | null>(null)
  const [urlsText, setUrlsText] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [results, setResults] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csvContent = `title,description,resource_type,external_url
Documentation Python,Guide complet sur Python,url,https://docs.python.org/3/
Vidéo Introduction,Introduction à Python,video,https://www.youtube.com/watch?v=example
Article Medium,Article sur les bonnes pratiques,url,https://medium.com/example
Documentation officielle,Documentation officielle Python,url,https://www.python.org/doc/`

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'template-ressources-formation.csv'
      link.click()
    } else {
      const jsonContent = {
        resources: [
          {
            title: 'Documentation Python',
            description: 'Guide complet sur Python',
            resource_type: 'url',
            external_url: 'https://docs.python.org/3/'
          },
          {
            title: 'Vidéo Introduction',
            description: 'Introduction à Python',
            resource_type: 'video',
            external_url: 'https://www.youtube.com/watch?v=example'
          },
          {
            title: 'Article Medium',
            description: 'Article sur les bonnes pratiques',
            resource_type: 'url',
            external_url: 'https://medium.com/example'
          }
        ]
      }

      const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'template-ressources-formation.json'
      link.click()
    }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  const parseCSV = (csvText: string): ImportResourceRow[] => {
    const lines = csvText.trim().split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données')

    const headers = parseCSVLine(lines[0])
    const requiredHeaders = ['title', 'resource_type']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      throw new Error(`En-têtes manquants: ${missingHeaders.join(', ')}`)
    }

    const resources: ImportResourceRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length !== headers.length) {
        throw new Error(`Ligne ${i + 1}: nombre de colonnes incorrect (${values.length} au lieu de ${headers.length})`)
      }

      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })

      if (!row.title || !row.resource_type) {
        throw new Error(`Ligne ${i + 1}: titre et type de ressource requis`)
      }

      const validTypes: CourseResourceType[] = ['file', 'url', 'video', 'document']
      if (!validTypes.includes(row.resource_type as CourseResourceType)) {
        throw new Error(`Ligne ${i + 1}: type de ressource invalide. Types valides: ${validTypes.join(', ')}`)
      }

      if ((row.resource_type === 'url' || row.resource_type === 'video') && !row.external_url) {
        throw new Error(`Ligne ${i + 1}: external_url requis pour les types url et video`)
      }

      resources.push({
        title: row.title,
        description: row.description || '',
        resource_type: row.resource_type as CourseResourceType,
        external_url: row.external_url || ''
      })
    }

    return resources
  }

  const parseJSON = (jsonText: string): ImportResourceRow[] => {
    const data = JSON.parse(jsonText)
    if (!data.resources || !Array.isArray(data.resources)) {
      throw new Error('Le JSON doit contenir un tableau "resources"')
    }

    const validTypes: CourseResourceType[] = ['file', 'url', 'video', 'document']
    const resources: ImportResourceRow[] = []

    data.resources.forEach((resource: any, index: number) => {
      if (!resource.title || !resource.resource_type) {
        throw new Error(`Ressource ${index + 1}: titre et type de ressource requis`)
      }

      if (!validTypes.includes(resource.resource_type)) {
        throw new Error(`Ressource ${index + 1}: type de ressource invalide. Types valides: ${validTypes.join(', ')}`)
      }

      if ((resource.resource_type === 'url' || resource.resource_type === 'video') && !resource.external_url) {
        throw new Error(`Ressource ${index + 1}: external_url requis pour les types url et video`)
      }

      resources.push({
        title: resource.title,
        description: resource.description || '',
        resource_type: resource.resource_type as CourseResourceType,
        external_url: resource.external_url || ''
      })
    })

    return resources
  }

  const parseURLs = (urlsText: string): ImportResourceRow[] => {
    const lines = urlsText.trim().split('\n').filter(line => line.trim())
    if (lines.length === 0) throw new Error('Aucune URL fournie')

    const resources: ImportResourceRow[] = []
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return

      try {
        new URL(trimmed)
      } catch {
        throw new Error(`Ligne ${index + 1}: URL invalide: ${trimmed}`)
      }

      let resourceType: CourseResourceType = 'url'
      if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.includes('vimeo.com')) {
        resourceType = 'video'
      }

      const urlObj = new URL(trimmed)
      const title = urlObj.hostname.replace('www.', '')

      resources.push({
        title: title,
        description: `Ressource depuis ${trimmed}`,
        resource_type: resourceType,
        external_url: trimmed
      })
    })

    return resources
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
    }
  }

  const handleImport = async () => {
    if (!courseId || courseId === 'new' || !user) {
      setError('Impossible d\'importer: formation invalide ou utilisateur non authentifié')
      return
    }

    setImporting(true)
    setError('')
    setSuccess('')
    setResults({ success: 0, errors: [] })

    try {
      let resourcesToImport: ImportResourceRow[] = []

      if (importMethod === 'csv' || importMethod === 'json') {
        if (!file) {
          setError('Veuillez sélectionner un fichier')
          setImporting(false)
          return
        }

        const fileText = await file.text()
        resourcesToImport = importMethod === 'csv' ? parseCSV(fileText) : parseJSON(fileText)
      } else if (importMethod === 'urls') {
        if (!urlsText.trim()) {
          setError('Veuillez saisir au moins une URL')
          setImporting(false)
          return
        }
        resourcesToImport = parseURLs(urlsText)
      }

      if (resourcesToImport.length === 0) {
        setError('Aucune ressource à importer')
        setImporting(false)
        return
      }

      // Récupérer la position actuelle
      const { data: existingResources } = await supabase
        .from('course_resources')
        .select('position')
        .eq('course_id', courseId)
        .order('position', { ascending: false })
        .limit(1)

      let nextPosition = existingResources && existingResources.length > 0 
        ? (existingResources[0].position || 0) + 1 
        : 0

      // Importer chaque ressource
      const errors: string[] = []
      let successCount = 0

      for (const resource of resourcesToImport) {
        try {
          const resourceData: any = {
            course_id: courseId,
            title: resource.title.trim(),
            description: resource.description?.trim() || null,
            resource_type: resource.resource_type,
            external_url: (resource.resource_type === 'url' || resource.resource_type === 'video') 
              ? resource.external_url?.trim() || null 
              : null,
            position: nextPosition++,
            is_visible: true,
            created_by: user.id
          }

          const { error: insertError } = await supabase
            .from('course_resources')
            .insert(resourceData)

          if (insertError) {
            errors.push(`${resource.title}: ${insertError.message}`)
          } else {
            successCount++
          }
        } catch (err: any) {
          errors.push(`${resource.title}: ${err.message || 'Erreur inconnue'}`)
        }
      }

      setResults({ success: successCount, errors })
      
      if (successCount > 0) {
        setSuccess(`${successCount} ressource(s) importée(s) avec succès`)
        onSuccess()
      }

      if (errors.length > 0) {
        setError(`${errors.length} erreur(s) lors de l'import`)
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'import:', err)
      setError(err.message || 'Erreur lors de l\'import des ressources')
    } finally {
      setImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importer des ressources
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Méthode d'import */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Méthode d'import
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setImportMethod('csv')
                  setFile(null)
                  setUrlsText('')
                  setError('')
                }}
                className={`p-3 border-2 rounded-lg transition-colors ${
                  importMethod === 'csv'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">CSV</span>
              </button>
              <button
                onClick={() => {
                  setImportMethod('json')
                  setFile(null)
                  setUrlsText('')
                  setError('')
                }}
                className={`p-3 border-2 rounded-lg transition-colors ${
                  importMethod === 'json'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">JSON</span>
              </button>
              <button
                onClick={() => {
                  setImportMethod('urls')
                  setFile(null)
                  setUrlsText('')
                  setError('')
                }}
                className={`p-3 border-2 rounded-lg transition-colors ${
                  importMethod === 'urls'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Download className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">URLs</span>
              </button>
            </div>
          </div>

          {/* Télécharger le template */}
          {(importMethod === 'csv' || importMethod === 'json') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Télécharger le template {importMethod.toUpperCase()}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Utilisez ce template pour formater vos ressources
                  </p>
                </div>
                <button
                  onClick={() => downloadTemplate(importMethod)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
            </div>
          )}

          {/* Formulaire selon la méthode */}
          {importMethod === 'urls' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URLs (une par ligne)
              </label>
              <textarea
                value={urlsText}
                onChange={(e) => {
                  setUrlsText(e.target.value)
                  setError('')
                }}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="https://docs.python.org/3/&#10;https://www.youtube.com/watch?v=example&#10;https://medium.com/article"
              />
              <p className="text-xs text-gray-500 mt-1">
                Saisissez une URL par ligne. Le système détectera automatiquement si c'est une vidéo (YouTube, Vimeo).
              </p>
            </div>
          )}

          {(importMethod === 'csv' || importMethod === 'json') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier {importMethod.toUpperCase()}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={importMethod === 'csv' ? '.csv' : '.json'}
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Fichier sélectionné: {file.name}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{error}</p>
                {results.errors.length > 0 && (
                  <ul className="mt-2 text-sm list-disc list-inside">
                    {results.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {results.errors.length > 5 && (
                      <li>... et {results.errors.length - 5} autre(s) erreur(s)</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <p className="font-medium">{success}</p>
            </div>
          )}

          {/* Résultats détaillés */}
          {results.success > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">
                Import terminé: {results.success} ressource(s) importée(s)
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={importing}
          >
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={importing || (!file && importMethod !== 'urls') || (importMethod === 'urls' && !urlsText.trim())}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
