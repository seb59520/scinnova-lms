import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { FileUpload } from './FileUpload'
import { Download, Upload, Calendar, CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react'
import type { FillableDocument, FillableDocumentSubmission } from '../types/fillableDocuments'

interface FillableDocumentsViewerProps {
  courseId: string
}

export function FillableDocumentsViewer({ courseId }: FillableDocumentsViewerProps) {
  const { user, profile } = useAuth()
  const [documents, setDocuments] = useState<FillableDocument[]>([])
  const [submissions, setSubmissions] = useState<Record<string, FillableDocumentSubmission>>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<Record<string, string>>({})
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({})
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (courseId && courseId !== 'new') {
      fetchDocuments()
      fetchSubmissions()
    } else {
      setLoading(false)
    }
  }, [courseId, user])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('fillable_documents')
        .select('*')
        .eq('course_id', courseId)
        .eq('published', true)
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

  const fetchSubmissions = async () => {
    if (!user) return

    try {
      const { data, error: fetchError } = await supabase
        .from('fillable_document_submissions')
        .select('*')
        .eq('user_id', user.id)
        .in('fillable_document_id', documents.map(d => d.id))

      if (fetchError) throw fetchError

      const submissionsMap: Record<string, FillableDocumentSubmission> = {}
      data?.forEach(sub => {
        // Garder la soumission la plus récente si plusieurs soumissions sont autorisées
        if (!submissionsMap[sub.fillable_document_id] || 
            new Date(sub.submitted_at) > new Date(submissionsMap[sub.fillable_document_id].submitted_at)) {
          submissionsMap[sub.fillable_document_id] = sub
        }
      })

      setSubmissions(submissionsMap)
    } catch (err: any) {
      console.error('Error fetching submissions:', err)
    }
  }

  useEffect(() => {
    if (documents.length > 0 && user) {
      fetchSubmissions()
    }
  }, [documents, user])

  const generateSignedUrls = useCallback(async () => {
    try {
      const urls: Record<string, string> = {}
      
      // Générer des URLs signées pour les templates
      for (const doc of documents) {
        const { data, error } = await supabase.storage
          .from('fillable-documents')
          .createSignedUrl(doc.template_file_path, 3600) // URL valide 1 heure
        
        if (!error && data) {
          urls[`template-${doc.id}`] = data.signedUrl
        }
      }

      // Générer des URLs signées pour les soumissions
      for (const submission of Object.values(submissions)) {
        const { data, error } = await supabase.storage
          .from('fillable-documents')
          .createSignedUrl(submission.submitted_file_path, 3600)
        
        if (!error && data) {
          urls[`submission-${submission.id}`] = data.signedUrl
        }
      }

      setSignedUrls(urls)
    } catch (err) {
      console.error('Error generating signed URLs:', err)
    }
  }, [documents, submissions])

  useEffect(() => {
    if (documents.length > 0) {
      generateSignedUrls()
    }
  }, [documents, submissions, generateSignedUrls])

  const handleFileSelect = (docId: string, file: File | null) => {
    setSelectedFiles(prev => ({ ...prev, [docId]: file }))
    setError('')
  }

  const handleSubmitDocument = async (doc: FillableDocument) => {
    if (!user) {
      setError('Vous devez être connecté pour soumettre un document')
      return
    }

    const file = selectedFiles[doc.id]
    if (!file) {
      setError('Veuillez sélectionner un fichier à soumettre')
      return
    }

    // Vérifier si une soumission existe déjà et si les soumissions multiples sont autorisées
    const existingSubmission = submissions[doc.id]
    if (existingSubmission && !doc.allow_multiple_submissions) {
      setError('Vous avez déjà soumis ce document. Les soumissions multiples ne sont pas autorisées.')
      return
    }

    // Vérifier la date limite
    if (doc.due_date && new Date(doc.due_date) < new Date()) {
      setError('La date limite pour soumettre ce document est dépassée')
      return
    }

    setUploading(prev => ({ ...prev, [doc.id]: true }))
    setError('')
    setSuccess(prev => ({ ...prev, [doc.id]: '' }))

    try {
      // Récupérer le programme associé au cours
      let programName = 'standalone'
      
      // Récupérer les programmes associés au cours
      const { data: programCoursesData } = await supabase
        .from('program_courses')
        .select('program_id')
        .eq('course_id', courseId)
        .limit(1)
        .maybeSingle()

      if (programCoursesData) {
        // Récupérer le nom du programme
        const { data: programData } = await supabase
          .from('programs')
          .select('title')
          .eq('id', programCoursesData.program_id)
          .maybeSingle()
        
        if (programData) {
          // Créer un slug à partir du titre du programme (sans caractères spéciaux)
          programName = programData.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
            .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères non alphanumériques par des tirets
            .replace(/^-+|-+$/g, '') // Supprimer les tirets en début/fin
            .substring(0, 50) // Limiter la longueur
        }
      }

      // Récupérer le nom de connexion (student_id ou full_name)
      let userName = user.id
      if (profile) {
        if (profile.student_id) {
          userName = profile.student_id
        } else if (profile.full_name) {
          // Créer un slug à partir du nom complet
          userName = profile.full_name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50)
        }
      }

      // Upload du fichier complété vers Supabase Storage
      // Format: submissions/{program_name}/{user_name}/{document_id}/{timestamp}.{ext}
      const fileExt = file.name.split('.').pop()
      const fileName = `submissions/${programName}/${userName}/${doc.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fillable-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('Le bucket de stockage n\'existe pas. Contactez l\'administrateur.')
        }
        if (uploadError.message?.includes('File size exceeds')) {
          throw new Error('Le fichier est trop volumineux. Taille maximum: 50MB')
        }
        throw uploadError
      }

      // Créer l'entrée dans la table fillable_document_submissions
      const { data: submissionData, error: submissionError } = await supabase
        .from('fillable_document_submissions')
        .insert({
          fillable_document_id: doc.id,
          user_id: user.id,
          submitted_file_path: fileName,
          submitted_file_name: file.name,
          submitted_file_size: file.size,
          submitted_file_type: file.type,
          status: 'submitted'
        })
        .select()
        .single()

      if (submissionError) throw submissionError

      setSubmissions(prev => ({ ...prev, [doc.id]: submissionData }))
      setSelectedFiles(prev => ({ ...prev, [doc.id]: null }))
      setSuccess(prev => ({ ...prev, [doc.id]: 'Document soumis avec succès !' }))
      
      await fetchSubmissions()
      
      setTimeout(() => {
        setSuccess(prev => {
          const newSuccess = { ...prev }
          delete newSuccess[doc.id]
          return newSuccess
        })
      }, 5000)
    } catch (err: any) {
      console.error('Erreur lors de la soumission:', err)
      setError(err.message || 'Erreur lors de la soumission du document')
    } finally {
      setUploading(prev => ({ ...prev, [doc.id]: false }))
    }
  }

  const getStatusBadge = (submission: FillableDocumentSubmission | undefined) => {
    if (!submission) {
      return (
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
          Non soumis
        </span>
      )
    }

    switch (submission.status) {
      case 'submitted':
        return (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            En attente de correction
          </span>
        )
      case 'reviewed':
        return (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
            En cours de correction
          </span>
        )
      case 'approved':
        return (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvé
            {submission.score !== null && ` (${submission.score}/100)`}
          </span>
        )
      case 'rejected':
        return (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded flex items-center">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </span>
        )
      default:
        return null
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Chargement des documents à compléter...</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Aucun document à compléter pour ce cours.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Documents à compléter
        </h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {documents.map((doc) => {
        const submission = submissions[doc.id]
        const isSubmitted = !!submission
        const canResubmit = doc.allow_multiple_submissions || !isSubmitted
        const overdue = isOverdue(doc.due_date)

        return (
          <div
            key={doc.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-lg font-medium text-gray-900">{doc.title}</h4>
                  {doc.is_required && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Obligatoire</span>
                  )}
                  {getStatusBadge(submission)}
                </div>
                {doc.description && (
                  <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                )}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {doc.due_date && (
                    <span className={`flex items-center ${overdue ? 'text-red-600 font-medium' : ''}`}>
                      <Calendar className="w-3 h-3 mr-1" />
                      Échéance: {new Date(doc.due_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {overdue && <AlertCircle className="w-3 h-3 ml-1" />}
                    </span>
                  )}
                  {doc.allow_multiple_submissions && (
                    <span className="text-blue-600">Soumissions multiples autorisées</span>
                  )}
                </div>
              </div>
            </div>

            {/* Télécharger le template */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Template à compléter</p>
                  <p className="text-xs text-gray-600">{doc.template_file_name}</p>
                </div>
                <a
                  href={signedUrls[`template-${doc.id}`] || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="btn-primary flex items-center space-x-2"
                  onClick={(e) => {
                    if (!signedUrls[`template-${doc.id}`]) {
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
                  <Download className="w-4 h-4" />
                  <span>Télécharger le template</span>
                </a>
              </div>
            </div>

            {/* Soumettre le document complété */}
            {canResubmit && !overdue && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isSubmitted ? 'Soumettre une nouvelle version' : 'Soumettre le document complété'}
                  </label>
                  <FileUpload
                    onFileSelect={(file) => handleFileSelect(doc.id, file)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    maxSize={50}
                  />
                  {selectedFiles[doc.id] && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        ✓ Fichier sélectionné: {selectedFiles[doc.id]!.name}
                      </p>
                    </div>
                  )}
                </div>
                {success[doc.id] && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {success[doc.id]}
                  </div>
                )}
                <button
                  onClick={() => handleSubmitDocument(doc)}
                  disabled={uploading[doc.id] || !selectedFiles[doc.id]}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading[doc.id] ? 'Soumission...' : 'Soumettre le document'}</span>
                </button>
              </div>
            )}

            {/* Afficher la soumission existante */}
            {submission && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-2">Votre soumission</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{submission.submitted_file_name}</p>
                    <p className="text-xs text-gray-500">
                      Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {submission.feedback && (
                      <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">Commentaires :</p>
                        <p className="text-xs text-gray-600">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                  <a
                    href={signedUrls[`submission-${submission.id}`] || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="btn-secondary flex items-center space-x-2"
                    onClick={(e) => {
                      if (!signedUrls[`submission-${submission.id}`]) {
                        e.preventDefault()
                        // Régénérer l'URL si elle n'existe pas
                        supabase.storage
                          .from('fillable-documents')
                          .createSignedUrl(submission.submitted_file_path, 3600)
                          .then(({ data, error }) => {
                            if (!error && data) {
                              window.open(data.signedUrl, '_blank')
                            }
                          })
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger</span>
                  </a>
                </div>
              </div>
            )}

            {/* Message si date limite dépassée */}
            {overdue && !isSubmitted && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  La date limite pour soumettre ce document est dépassée.
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
