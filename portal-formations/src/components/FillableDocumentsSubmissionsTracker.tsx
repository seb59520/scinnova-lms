import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { FileText, CheckCircle, XCircle, Users, Clock, Download, Eye } from 'lucide-react'
import type { FillableDocument, FillableDocumentSubmission } from '../types/fillableDocuments'

interface FillableDocumentsSubmissionsTrackerProps {
  sessionId: string
  courseId: string
}

interface SubmissionStatus {
  document: FillableDocument
  totalLearners: number
  submittedCount: number
  notSubmittedCount: number
  submissions: Array<{
    user_id: string
    user_name: string
    student_id: string | null
    submitted_at: string
    status: string
    submitted_file_name: string
    submission_id: string
  }>
  notSubmitted: Array<{
    user_id: string
    user_name: string
    student_id: string | null
  }>
}

export function FillableDocumentsSubmissionsTracker({ 
  sessionId, 
  courseId 
}: FillableDocumentsSubmissionsTrackerProps) {
  const { user, profile } = useAuth()
  const [submissionsStatus, setSubmissionsStatus] = useState<SubmissionStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (sessionId && courseId) {
      fetchSubmissionsStatus()
    }
  }, [sessionId, courseId])

  const fetchSubmissionsStatus = async () => {
    try {
      setLoading(true)
      setError('')

      // Vérifier les permissions (admin, trainer, instructor)
      if (!profile || !['admin', 'trainer', 'instructor'].includes(profile.role)) {
        setError('Vous n\'avez pas les permissions pour voir ce suivi')
        setLoading(false)
        return
      }

      // Récupérer tous les documents remplissables du cours
      const { data: documents, error: docsError } = await supabase
        .from('fillable_documents')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (docsError) throw docsError

      if (!documents || documents.length === 0) {
        setSubmissionsStatus([])
        setLoading(false)
        return
      }

      // Récupérer tous les membres de la session (apprenants)
      const { data: sessionMembers, error: membersError } = await supabase
        .from('session_members')
        .select('user_id')
        .eq('session_id', sessionId)
        .eq('role', 'learner')

      if (membersError) throw membersError

      // Récupérer les profils des membres
      const userIds = (sessionMembers || []).map((sm: any) => sm.user_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, student_id')
        .in('id', userIds)

      if (profilesError) throw profilesError

      const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))

      if (membersError) throw membersError

      const learners = (sessionMembers || []).map((sm: any) => {
        const profile = profilesMap.get(sm.user_id)
        return {
          user_id: sm.user_id,
          user_name: profile?.full_name || 'Utilisateur inconnu',
          student_id: profile?.student_id || null
        }
      })

      // Pour chaque document, récupérer les soumissions
      const statusPromises = documents.map(async (doc) => {
        // Récupérer les soumissions pour ce document et cette session
        const { data: submissions, error: subsError } = await supabase
          .from('fillable_document_submissions')
          .select('id, user_id, submitted_at, status, submitted_file_name')
          .eq('fillable_document_id', doc.id)
          .eq('session_id', sessionId)
          .order('submitted_at', { ascending: false })

        if (subsError) {
          console.error('Error fetching submissions:', subsError)
          return null
        }

        const submittedUsers = new Set((submissions || []).map((s: any) => s.user_id))
        const submitted = (submissions || []).map((s: any) => {
          const profile = profilesMap.get(s.user_id)
          return {
            user_id: s.user_id,
            user_name: profile?.full_name || 'Utilisateur inconnu',
            student_id: profile?.student_id || null,
            submitted_at: s.submitted_at,
            status: s.status,
            submitted_file_name: s.submitted_file_name,
            submission_id: s.id
          }
        })

        const notSubmitted = learners.filter(
          (learner) => !submittedUsers.has(learner.user_id)
        )

        return {
          document: doc,
          totalLearners: learners.length,
          submittedCount: submitted.length,
          notSubmittedCount: notSubmitted.length,
          submissions: submitted,
          notSubmitted: notSubmitted
        }
      })

      const results = await Promise.all(statusPromises)
      const validResults = results.filter((r): r is SubmissionStatus => r !== null)
      
      setSubmissionsStatus(validResults)

      // Générer les URLs signées pour les soumissions
      await generateSignedUrls(validResults)
    } catch (err: any) {
      console.error('Error fetching submissions status:', err)
      setError(err.message || 'Erreur lors du chargement du suivi des soumissions')
    } finally {
      setLoading(false)
    }
  }

  const generateSignedUrls = async (statuses: SubmissionStatus[]) => {
    try {
      const urls: Record<string, string> = {}
      
      for (const status of statuses) {
        for (const submission of status.submissions) {
          // Récupérer le chemin du fichier depuis la soumission
          const { data: subData } = await supabase
            .from('fillable_document_submissions')
            .select('submitted_file_path')
            .eq('id', submission.submission_id)
            .maybeSingle()
          
          if (subData?.submitted_file_path) {
            const { data, error } = await supabase.storage
              .from('fillable-documents')
              .createSignedUrl(subData.submitted_file_path, 3600)
            
            if (!error && data) {
              urls[submission.submission_id] = data.signedUrl
            }
          }
        }
      }

      setSignedUrls(urls)
    } catch (err) {
      console.error('Error generating signed URLs:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        )
      case 'reviewed':
        return (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
            En correction
          </span>
        )
      case 'approved':
        return (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvé
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

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Chargement du suivi des soumissions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  if (submissionsStatus.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Aucun document remplissable pour ce cours.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Suivi des soumissions par session
        </h3>
      </div>

      {submissionsStatus.map((status) => {
        const progressPercentage = status.totalLearners > 0
          ? Math.round((status.submittedCount / status.totalLearners) * 100)
          : 0
        const isOverdue = status.document.due_date 
          ? new Date(status.document.due_date) < new Date()
          : false

        return (
          <div
            key={status.document.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            {/* En-tête du document */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  {status.document.title}
                  {status.document.is_required && (
                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Obligatoire
                    </span>
                  )}
                </h4>
              </div>
              {status.document.description && (
                <p className="text-sm text-gray-600 mb-2">{status.document.description}</p>
              )}
              {status.document.due_date && (
                <p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  Échéance: {new Date(status.document.due_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>

            {/* Statistiques */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Total: <strong>{status.totalLearners}</strong> apprenant{status.totalLearners > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700">
                      Soumis: <strong>{status.submittedCount}</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">
                      Non soumis: <strong>{status.notSubmittedCount}</strong>
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {progressPercentage}% de complétion
                </div>
              </div>
              {/* Barre de progression */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Liste des soumissions */}
            {status.submissions.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Soumissions ({status.submissions.length})
                </h5>
                <div className="space-y-2">
                  {status.submissions.map((submission) => (
                    <div
                      key={submission.submission_id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {submission.user_name}
                          {submission.student_id && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({submission.student_id})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {submission.submitted_file_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(submission.status)}
                        {signedUrls[submission.submission_id] && (
                          <a
                            href={signedUrls[submission.submission_id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Télécharger la soumission"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des non-soumissions */}
            {status.notSubmitted.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                  Non soumis ({status.notSubmitted.length})
                </h5>
                <div className="space-y-2">
                  {status.notSubmitted.map((learner) => (
                    <div
                      key={learner.user_id}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {learner.user_name}
                          {learner.student_id && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({learner.student_id})
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-red-700 font-medium">
                        En attente
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
