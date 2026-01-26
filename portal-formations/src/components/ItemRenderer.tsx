import { useState, useEffect } from 'react'
import { Item, Submission } from '../types/database'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { PdfViewer } from './PdfViewer'
import { FileUpload } from './FileUpload'
import { RichTextEditor } from './RichTextEditor'
import { GameRenderer } from './GameRenderer'
import { ItemDocuments } from './ItemDocuments'
import { TpControlRenderer } from './TpControlRenderer'
import { StepByStepTpRenderer } from './StepByStepTpRenderer'
import { Presentation, Eye, Columns, Sparkles, FileJson } from 'lucide-react'
import { correctAnswer, CorrectionResult } from '../lib/answerCorrector'
import { TitanicJsonUploader } from './TitanicJsonUploader'
import './TitanicJsonUploader.css'

interface ItemRendererProps {
  item: Item
  submission?: Submission | null
  onSubmissionUpdate: (submission: Submission | null) => void
  viewingUserId?: string | null
}

export function ItemRenderer({ item, submission, onSubmissionUpdate, viewingUserId }: ItemRendererProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState(submission?.answer_text || '')
  const [file, setFile] = useState<File | null>(null)
  const [viewMode, setViewMode] = useState<'normal' | 'slide' | 'comparison'>('normal')
  const [aiCorrection, setAiCorrection] = useState<CorrectionResult | null>(null)
  const [correcting, setCorrecting] = useState(false)

  // Charger la correction IA depuis la soumission
  useEffect(() => {
    if (submission?.answer_json?.aiCorrection) {
      setAiCorrection(submission.answer_json.aiCorrection as CorrectionResult)
    } else {
      setAiCorrection(null)
    }
  }, [submission])

  const handleExerciseSubmit = async () => {
    if (!user?.id || (!answer.trim() && !file)) return

    setLoading(true)
    try {
      let filePath = submission?.file_path

      // Upload du fichier si nouveau
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${item.id}/submission.${fileExt}`

        console.log('📤 Upload du fichier:', fileName)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file, { upsert: true })

        if (uploadError) {
          console.error('❌ Erreur upload:', uploadError)
          alert(`Erreur lors de l'upload du fichier: ${uploadError.message}`)
          throw uploadError
        }
        
        console.log('✅ Fichier uploadé avec succès:', uploadData)
        filePath = fileName
      }

      const submissionData = {
        user_id: user.id,
        item_id: item.id,
        answer_text: answer || null,
        file_path: filePath || null,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('submissions')
        .upsert(submissionData, { onConflict: 'user_id,item_id' })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la soumission:', error)
        alert(`Erreur lors de la soumission: ${error.message || 'Erreur inconnue'}`)
        throw error
      }
      
      console.log('✅ Exercice soumis avec succès:', data)
      onSubmissionUpdate(data)
      setFile(null) // Réinitialiser le fichier après soumission
      alert('Exercice soumis avec succès!')
    } catch (error: any) {
      console.error('❌ Erreur complète lors de la soumission:', error)
      alert(`Erreur: ${error.message || 'Une erreur est survenue lors de la soumission'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTpSubmit = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      let filePath = submission?.file_path

      // Upload du fichier si nouveau
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${item.id}/submission.${fileExt}`

        console.log('📤 Upload du fichier TP:', fileName)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file, { upsert: true })

        if (uploadError) {
          console.error('❌ Erreur upload TP:', uploadError)
          alert(`Erreur lors de l'upload du fichier: ${uploadError.message}`)
          throw uploadError
        }
        
        console.log('✅ Fichier TP uploadé avec succès:', uploadData)
        filePath = fileName
      }

      const submissionData = {
        user_id: user.id,
        item_id: item.id,
        answer_text: answer,
        file_path: filePath,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('submissions')
        .upsert(submissionData, { onConflict: 'user_id,item_id' })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la soumission TP:', error)
        alert(`Erreur lors de la soumission: ${error.message || 'Erreur inconnue'}`)
        throw error
      }
      
      // Sauvegarder aussi dans user_responses pour le formateur (si c'est le TP Big Data)
      if (item.id && answer) {
        try {
          const userId = user.id
          const quizTypeKey = `tp_big_data_${item.id}`
          const responses = {
            analysis: answer,
            submittedAt: new Date().toISOString(),
            itemId: item.id,
            itemTitle: item.title
          }

          await supabase
            .from('user_responses')
            .upsert({
              user_id: userId,
              quiz_type: quizTypeKey,
              responses: responses,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,quiz_type'
            })
        } catch (error) {
          console.error('Erreur lors de la sauvegarde dans user_responses:', error)
          // Ne pas bloquer la soumission si cette sauvegarde échoue
        }
      }
      
      console.log('✅ TP soumis avec succès:', data)
      onSubmissionUpdate(data)
      setFile(null) // Réinitialiser le fichier après soumission
      alert('TP soumis avec succès! Votre analyse est visible par votre formateur.')
    } catch (error: any) {
      console.error('❌ Erreur complète lors de la soumission TP:', error)
      alert(`Erreur: ${error.message || 'Une erreur est survenue lors de la soumission'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGameScore = async (score: number, metadata?: Record<string, any>) => {
    if (!user?.id) return

    try {
      await supabase
        .from('game_scores')
        .insert({
          user_id: user.id,
          course_id: item.modules?.course_id,
          item_id: item.id,
          score,
          metadata: metadata || null
        })
    } catch (error) {
      console.error('Error saving game score:', error)
    }
  }

  const handleAiCorrection = async () => {
    if (!submission?.answer_text || !user?.id) {
      alert('Aucune réponse à corriger')
      return
    }

    setCorrecting(true)
    try {
      const content = item.content as any
      
      // Construire le contexte pour la correction
      const context = {
        question: item.content?.question || content?.question,
        instructions: content?.instructions || (Array.isArray(content?.instructions) ? content.instructions.join('\n') : content?.instructions),
        objective: content?.objective,
        expectedOutputs: content?.expected_outputs,
        criteria: content?.criteria,
        scenario: content?.scenario,
        context: content?.context
      }

      // Appeler le service de correction
      const correctionResult = await correctAnswer(submission.answer_text, context)

      // Sauvegarder la correction dans answer_json
      const updatedAnswerJson = {
        ...(submission.answer_json || {}),
        aiCorrection: correctionResult
      }

      const { data, error } = await supabase
        .from('submissions')
        .update({
          answer_json: updatedAnswerJson
        })
        .eq('id', submission.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Mettre à jour l'état local
      setAiCorrection(correctionResult)
      if (data) {
        onSubmissionUpdate(data as Submission)
      }

      console.log('✅ Correction IA sauvegardée avec succès')
    } catch (error: any) {
      console.error('❌ Erreur lors de la correction IA:', error)
      alert(`Erreur lors de la correction IA: ${error.message || 'Une erreur est survenue'}`)
    } finally {
      setCorrecting(false)
    }
  }

  const renderResource = () => {
    if (item.external_url) {
      return (
        <div className="space-y-4">
          <p className="text-gray-600">{item.content?.description}</p>
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Accéder à la ressource
          </a>
        </div>
      )
    }

    if (item.asset_path) {
      const { data } = supabase.storage
        .from('course-assets')
        .getPublicUrl(item.asset_path)

      return (
        <div className="space-y-4">
          <p className="text-gray-600">{item.content?.description}</p>
          {item.asset_path.endsWith('.pdf') ? (
            <PdfViewer url={data.publicUrl} />
          ) : (
            <a
              href={data.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block"
            >
              Télécharger le fichier
            </a>
          )}
        </div>
      )
    }

    // Si l'item a du contenu body (TipTap)
    if (item.content?.body) {
      return (
        <div className="space-y-4">
          {item.content?.description && (
            <p className="text-gray-600">{item.content.description}</p>
          )}
          <div className="prose max-w-none">
            <RichTextEditor
              content={item.content.body}
              onChange={() => {}}
              editable={false}
            />
          </div>
        </div>
      )
    }

    return <p className="text-gray-600">Contenu non disponible.</p>
  }

  const renderSlide = () => {
    // Si l'item a un asset_path (PDF ou image)
    if (item.asset_path) {
      const { data } = supabase.storage
        .from('course-assets')
        .getPublicUrl(item.asset_path)

      return (
        <div className="space-y-4">
          {(item.content?.summary || item.content?.description) && (
            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <p className="text-gray-700">
                {item.content?.summary || item.content?.description}
              </p>
            </div>
          )}
          {item.asset_path.endsWith('.pdf') ? (
            <PdfViewer url={data.publicUrl} />
          ) : (
            <img
              src={data.publicUrl}
              alt={item.title}
              className="max-w-full max-h-[calc(100vh-200px)] h-auto rounded-lg shadow object-contain"
            />
          )}
        </div>
      )
    }

    // Si l'item a du contenu body
    if (item.content?.body) {
      return (
        <div className="prose max-w-none">
          <RichTextEditor
            content={item.content.body}
            onChange={() => {}}
            editable={false}
          />
        </div>
      )
    }

    // Si l'item a des chapitres, le contenu est dans les chapitres
    // Les chapitres sont affichés par ChapterViewer dans ItemView
    // On affiche juste un message informatif
    return (
      <div className="space-y-4">
        {(item.content?.summary || item.content?.description) && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-900">📝 Résumé</h4>
            <p className="text-gray-700">
              {item.content?.summary || item.content?.description}
            </p>
          </div>
        )}
        <p className="text-sm text-gray-500 italic">
          Le contenu détaillé est disponible dans les chapitres ci-dessous.
        </p>
      </div>
    )
  }

  const renderExercise = () => {
    const isSubmitted = submission?.status === 'submitted'
    const isGraded = submission?.status === 'graded'
    const content = item.content as any

    // Détecter si c'est une activité Q/R avec plusieurs questions
    const isQRActivity = item.type === 'activity' && content?.questions && Array.isArray(content.questions) && content.questions.length > 0
    
    if (isQRActivity) {
      // Pour les activités Q/R, utiliser le même rendu que les exercices classiques
      // mais avec un style adapté
      return (
        <div className="space-y-6">
          <ItemDocuments itemId={item.id} />
          {content.description && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-900 mb-2">Objectif</h3>
              <p className="text-blue-800">{content.description}</p>
            </div>
          )}
          {content.instructions && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Instructions</h4>
              <p className="text-purple-800">{content.instructions}</p>
            </div>
          )}
          {content.scenario && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-2">Scénario</h4>
              <p className="text-gray-700 italic">{content.scenario}</p>
            </div>
          )}
          {content.questions && content.questions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Questions</h3>
              {content.questions.map((q: any, idx: number) => (
                <div key={q.id || idx} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </span>
                    <p className="text-gray-800 font-medium">{q.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {content.expected_outputs && content.expected_outputs.length > 0 && (
            <details className="bg-green-50 p-4 rounded-lg border border-green-300">
              <summary className="font-medium text-green-900 cursor-pointer">
                Réponses attendues ({content.expected_outputs.length})
              </summary>
              <div className="mt-4 space-y-2">
                {content.expected_outputs.map((output: string, idx: number) => (
                  <div key={idx} className="p-3 rounded bg-white border-l-4 border-green-500">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <p className="text-gray-700">{output}</p>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
          {content.key_message && (
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-semibold text-purple-900 mb-2">Message clé</h4>
              <p className="text-purple-800 font-medium">{content.key_message}</p>
            </div>
          )}
        </div>
      )
    }

    // Détecter si c'est un exercice d'analyse d'API (structure enrichie)
    const isApiAnalysisExercise = content?.objective || content?.input_api || content?.instructions

    if (isApiAnalysisExercise) {
      return renderApiAnalysisExercise(content, isSubmitted, isGraded, submission)
    }

    // Rendu classique pour les exercices simples
    return (
      <div className="space-y-6">
        {/* Documents disponibles pour l'exercice */}
        <ItemDocuments itemId={item.id} />

        {item.content?.question && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Énoncé</h3>
            {typeof item.content.question === 'object' ? (
              <RichTextEditor
                content={item.content.question}
                onChange={() => {}}
                editable={false}
              />
            ) : (
              <p className="text-blue-800">{item.content.question}</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Votre réponse</h3>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitted}
            className="input-field h-32 resize-none"
            placeholder="Tapez votre réponse ici..."
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Document à joindre (optionnel)
            </label>
            <FileUpload
              onFileSelect={setFile}
              accept=".pdf,.doc,.docx,.zip,.rar,.txt,.jpg,.jpeg,.png"
              disabled={isSubmitted}
            />
            {submission?.file_path && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Fichier soumis: {submission.file_path.split('/').pop()}</span>
                <a
                  href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Télécharger
                </a>
              </div>
            )}
          </div>
        </div>

        {!isSubmitted ? (
          <button
            onClick={handleExerciseSubmit}
            disabled={loading || (!answer.trim() && !file)}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Soumission...' : 'Soumettre'}
          </button>
        ) : (
          <div className="space-y-4">
            {/* En-tête avec informations de soumission */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">
                  Réponse soumise le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                </p>
                {isGraded && submission.grade && (
                  <p className="text-sm font-medium text-green-600">
                    Note: {submission.grade}/100
                  </p>
                )}
              </div>
              {submission.file_path && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                  <span>Fichier soumis: {submission.file_path.split('/').pop()}</span>
                  <a
                    href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Télécharger
                  </a>
                </div>
              )}
            </div>

            {/* Bouton correction IA */}
            {submission.answer_text && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAiCorrection}
                  disabled={correcting}
                  className="btn-secondary disabled:opacity-50 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{correcting ? 'Correction en cours...' : 'Faire corriger par l\'IA'}</span>
                </button>
                {aiCorrection && (
                  <span className="text-sm text-green-600">✓ Correction disponible</span>
                )}
              </div>
            )}

            {/* Affichage de la correction IA */}
            {aiCorrection && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
                <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Correction par l'IA
                </h4>
                
                {aiCorrection.score !== null && aiCorrection.score !== undefined && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-purple-300">
                    <span className="text-sm font-medium text-gray-700">Note estimée : </span>
                    <span className="text-lg font-bold text-purple-600">{aiCorrection.score}/100</span>
                  </div>
                )}

                {aiCorrection.feedback && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-blue-300">
                    <h5 className="font-semibold text-blue-900 mb-2">💬 Feedback</h5>
                    <p className="text-gray-800 whitespace-pre-wrap">{aiCorrection.feedback}</p>
                  </div>
                )}

                {aiCorrection.strengths && aiCorrection.strengths.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-300">
                    <h5 className="font-semibold text-green-900 mb-2">✅ Points forts</h5>
                    <ul className="list-disc list-inside space-y-1 text-green-800">
                      {aiCorrection.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiCorrection.improvements && aiCorrection.improvements.length > 0 && (
                  <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-300">
                    <h5 className="font-semibold text-amber-900 mb-2">🔧 Points à améliorer</h5>
                    <ul className="list-disc list-inside space-y-1 text-amber-800">
                      {aiCorrection.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiCorrection.correction && (
                  <div className="p-4 bg-white rounded-lg border border-gray-300">
                    <h5 className="font-semibold text-gray-900 mb-2">📝 Correction détaillée</h5>
                    <div className="text-gray-800 whitespace-pre-wrap">{aiCorrection.correction}</div>
                  </div>
                )}
              </div>
            )}

            {/* Boutons de vue si correction disponible - visible après soumission */}
            {item.content?.correction && isSubmitted && (
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'comparison'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Columns className="w-4 h-4 inline-block mr-2" />
                  Comparaison
                </button>
                <button
                  onClick={() => setViewMode('slide')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'slide'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Presentation className="w-4 h-4 inline-block mr-2" />
                  Présentation
                </button>
                <button
                  onClick={() => setViewMode('normal')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'normal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Eye className="w-4 h-4 inline-block mr-2" />
                  Normal
                </button>
              </div>
            )}

            {/* Affichage selon le mode - visible après soumission */}
            {item.content?.correction && isSubmitted && (
              <>
                {viewMode === 'comparison' ? (
                  // Vue côte à côte : Soumission | Correction
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <h4 className="font-semibold mb-3 text-blue-900 flex items-center">
                        <span className="mr-2">📝</span>
                        Votre réponse
                      </h4>
                      <div className="bg-white p-3 rounded border border-blue-300">
                        {submission.answer_text ? (
                          <p className="text-gray-800 whitespace-pre-wrap text-sm">
                            {submission.answer_text}
                          </p>
                        ) : submission.answer_json ? (
                          <pre className="text-xs text-gray-800 overflow-x-auto">
                            {JSON.stringify(submission.answer_json, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-gray-500 italic text-sm">Aucune réponse texte</p>
                        )}
                        {submission.file_path && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <a
                              href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              📎 {submission.file_path.split('/').pop()}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                      <h4 className="font-semibold mb-3 text-green-900 flex items-center">
                        <span className="mr-2">✅</span>
                        Correction
                      </h4>
                      <div className="bg-white p-3 rounded border border-green-300">
                        {typeof item.content.correction === 'object' ? (
                          <RichTextEditor
                            content={item.content.correction}
                            onChange={() => {}}
                            editable={false}
                          />
                        ) : (
                          <p className="text-gray-800 whitespace-pre-wrap text-sm">
                            {item.content.correction}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'slide' ? (
                  // Vue présentation slide
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-lg border-2 border-purple-200 shadow-lg">
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                          <span>Note: <strong className="text-green-600">{submission.grade}/100</strong></span>
                          <span>•</span>
                          <span>Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <span className="mr-2">📝</span>
                            Votre réponse
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            {submission.answer_text ? (
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {submission.answer_text}
                              </p>
                            ) : submission.answer_json ? (
                              <pre className="text-xs text-gray-800 overflow-x-auto bg-gray-50 p-3 rounded">
                                {JSON.stringify(submission.answer_json, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-gray-500 italic">Aucune réponse texte</p>
                            )}
                            {submission.file_path && (
                              <div className="mt-4 pt-4 border-t">
                                <a
                                  href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  📎 Fichier joint: {submission.file_path.split('/').pop()}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                            <span className="mr-2">✅</span>
                            Correction
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            {typeof item.content.correction === 'object' ? (
                              <RichTextEditor
                                content={item.content.correction}
                                onChange={() => {}}
                                editable={false}
                              />
                            ) : (
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {item.content.correction}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Vue normale (par défaut)
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Correction</h4>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      {typeof item.content.correction === 'object' ? (
                        <RichTextEditor
                          content={item.content.correction}
                          onChange={() => {}}
                          editable={false}
                        />
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{item.content.correction}</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderApiAnalysisExercise = (content: any, isSubmitted: boolean, isGraded: boolean, submission?: Submission | null) => {
    return (
      <div className="space-y-6">
        {/* Objectif */}
        {content.objective && (
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold mb-2 text-lg text-blue-900">🎯 Objectif</h3>
            <p className="text-gray-700">{content.objective}</p>
          </div>
        )}

        {/* Durée et prérequis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.duration_minutes && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-gray-600">⏱️ Durée estimée : </span>
              <span className="text-gray-900 font-semibold">{content.duration_minutes} minutes</span>
            </div>
          )}
          {content.prerequisites && content.prerequisites.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-gray-600 block mb-2">📚 Prérequis :</span>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {content.prerequisites.map((prereq: string, idx: number) => (
                  <li key={idx}>{prereq}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Contexte */}
        {content.context && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-3 text-blue-900">📋 Contexte</h4>
            {content.context.domain && (
              <p className="mb-2">
                <span className="font-medium text-blue-800">Domaine : </span>
                <span className="text-blue-700">{content.context.domain}</span>
              </p>
            )}
            {content.context.entities && content.context.entities.length > 0 && (
              <div className="mb-2">
                <span className="font-medium text-blue-800">Entités : </span>
                <span className="text-blue-700">{content.context.entities.join(', ')}</span>
              </div>
            )}
            {content.context.business_rules && content.context.business_rules.length > 0 && (
              <div>
                <span className="font-medium text-blue-800 block mb-2">Règles métier :</span>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  {content.context.business_rules.map((rule: string, idx: number) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* API d'entrée */}
        {content.input_api && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold mb-3 text-yellow-900">🔌 API à analyser</h4>
            {content.input_api.endpoints && content.input_api.endpoints.length > 0 && (
              <div className="mb-4">
                <h5 className="font-medium text-yellow-800 mb-2">Endpoints :</h5>
                <div className="bg-white p-3 rounded border border-yellow-300 font-mono text-sm">
                  {content.input_api.endpoints.map((endpoint: string, idx: number) => (
                    <div key={idx} className="text-yellow-900 py-1">{endpoint}</div>
                  ))}
                </div>
              </div>
            )}
            {content.input_api.response_examples && content.input_api.response_examples.length > 0 && (
              <div>
                <h5 className="font-medium text-yellow-800 mb-2">Exemples de réponses :</h5>
                <div className="space-y-3">
                  {content.input_api.response_examples.map((example: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded border border-yellow-300">
                      <div className="font-mono text-xs text-yellow-800 mb-2">
                        {example.endpoint}
                        {example.status && ` (${example.status})`}
                      </div>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(example.body, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {content.instructions && content.instructions.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-lg text-blue-900">📝 Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              {content.instructions.map((instruction: string, idx: number) => (
                <li key={idx} className="pl-2">{instruction}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Format de sortie attendu */}
        {content.expected_output_format && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold mb-3 text-green-900">📤 Format de sortie attendu</h4>
            {content.expected_output_format.sections && content.expected_output_format.sections.length > 0 && (
              <div>
                <span className="font-medium text-green-800 block mb-2">Sections requises :</span>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  {content.expected_output_format.sections.map((section: string, idx: number) => (
                    <li key={idx}>{section}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Critères d'évaluation */}
        {content.criteria && content.criteria.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold mb-3 text-purple-900">✅ Critères d'évaluation</h4>
            <ul className="list-disc list-inside text-purple-700 space-y-2">
              {content.criteria.map((criterion: string, idx: number) => (
                <li key={idx}>{criterion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Livrables */}
        {content.deliverables && content.deliverables.length > 0 && (
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <h4 className="font-semibold mb-3 text-indigo-900">📦 Livrables</h4>
            <ul className="list-disc list-inside text-indigo-700 space-y-1">
              {content.deliverables.map((deliverable: string, idx: number) => (
                <li key={idx}>{deliverable}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Barème de notation */}
        {content.scoring_rubric && (
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
            <h4 className="font-semibold mb-3 text-gray-900">📊 Barème de notation</h4>
            <div className="mb-2">
              <span className="font-medium text-gray-700">Total : </span>
              <span className="text-gray-900 font-bold">{content.scoring_rubric.total_points} points</span>
            </div>
            {content.scoring_rubric.breakdown && content.scoring_rubric.breakdown.length > 0 && (
              <div className="mt-3 space-y-2">
                {content.scoring_rubric.breakdown.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="text-gray-700">{item.item}</span>
                    <span className="font-semibold text-gray-900">{item.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bonus */}
        {content.bonus_mastery && content.bonus_mastery.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold mb-3 text-amber-900">⭐ Bonus (Maîtrise avancée)</h4>
            <ul className="list-disc list-inside text-amber-700 space-y-1">
              {content.bonus_mastery.map((bonus: string, idx: number) => (
                <li key={idx}>{bonus}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Zone de réponse */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-medium text-gray-900">Votre réponse</h3>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitted}
            className="input-field h-48 resize-none font-mono text-sm"
            placeholder="Rédigez votre analyse ici..."
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Document à joindre (optionnel)
            </label>
            <FileUpload
              onFileSelect={setFile}
              accept=".pdf,.doc,.docx,.zip,.rar,.txt,.jpg,.jpeg,.png"
              disabled={isSubmitted}
            />
            {submission?.file_path && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Fichier soumis: {submission.file_path.split('/').pop()}</span>
                <a
                  href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Télécharger
                </a>
              </div>
            )}
          </div>
        </div>

        {!isSubmitted ? (
          <button
            onClick={handleExerciseSubmit}
            disabled={loading || (!answer.trim() && !file)}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Soumission...' : 'Soumettre'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                Réponse soumise le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
              </p>
              {submission.file_path && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                  <span>Fichier soumis: {submission.file_path.split('/').pop()}</span>
                  <a
                    href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Télécharger
                  </a>
                </div>
              )}
              {isGraded && submission.grade && (
                <p className="text-sm font-medium text-green-600">
                  Note: {submission.grade}/100
                </p>
              )}
            </div>

            {/* Bouton correction IA */}
            {submission.answer_text && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAiCorrection}
                  disabled={correcting}
                  className="btn-secondary disabled:opacity-50 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{correcting ? 'Correction en cours...' : 'Faire corriger par l\'IA'}</span>
                </button>
                {aiCorrection && (
                  <span className="text-sm text-green-600">✓ Correction disponible</span>
                )}
              </div>
            )}

            {/* Affichage de la correction IA */}
            {aiCorrection && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
                <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Correction par l'IA
                </h4>
                
                {aiCorrection.score !== null && aiCorrection.score !== undefined && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-purple-300">
                    <span className="text-sm font-medium text-gray-700">Note estimée : </span>
                    <span className="text-lg font-bold text-purple-600">{aiCorrection.score}/100</span>
                  </div>
                )}

                {aiCorrection.feedback && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-blue-300">
                    <h5 className="font-semibold text-blue-900 mb-2">💬 Feedback</h5>
                    <p className="text-gray-800 whitespace-pre-wrap">{aiCorrection.feedback}</p>
                  </div>
                )}

                {aiCorrection.strengths && aiCorrection.strengths.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-300">
                    <h5 className="font-semibold text-green-900 mb-2">✅ Points forts</h5>
                    <ul className="list-disc list-inside space-y-1 text-green-800">
                      {aiCorrection.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiCorrection.improvements && aiCorrection.improvements.length > 0 && (
                  <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-300">
                    <h5 className="font-semibold text-amber-900 mb-2">🔧 Points à améliorer</h5>
                    <ul className="list-disc list-inside space-y-1 text-amber-800">
                      {aiCorrection.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiCorrection.correction && (
                  <div className="p-4 bg-white rounded-lg border border-gray-300">
                    <h5 className="font-semibold text-gray-900 mb-2">📝 Correction détaillée</h5>
                    <div className="text-gray-800 whitespace-pre-wrap">{aiCorrection.correction}</div>
                  </div>
                )}
              </div>
            )}

            {/* Boutons de vue si correction disponible */}
            {content.correction && isGraded && (
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'comparison'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Columns className="w-4 h-4 inline-block mr-2" />
                  Comparaison
                </button>
                <button
                  onClick={() => setViewMode('slide')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'slide'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Presentation className="w-4 h-4 inline-block mr-2" />
                  Présentation
                </button>
                <button
                  onClick={() => setViewMode('normal')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'normal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Eye className="w-4 h-4 inline-block mr-2" />
                  Normal
                </button>
              </div>
            )}

            {/* Affichage selon le mode */}
            {content.correction && isGraded && (
              <>
                {viewMode === 'comparison' ? (
                  // Vue côte à côte : Soumission | Correction
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <h4 className="font-semibold mb-3 text-blue-900 flex items-center">
                        <span className="mr-2">📝</span>
                        Votre réponse
                      </h4>
                      <div className="bg-white p-3 rounded border border-blue-300">
                        {submission?.answer_text ? (
                          <p className="text-gray-800 whitespace-pre-wrap text-sm">
                            {submission.answer_text}
                          </p>
                        ) : submission?.answer_json ? (
                          <pre className="text-xs text-gray-800 overflow-x-auto">
                            {JSON.stringify(submission.answer_json, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-gray-500 italic text-sm">Aucune réponse texte</p>
                        )}
                        {submission?.file_path && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <a
                              href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              📎 {submission.file_path.split('/').pop()}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                      <h4 className="font-semibold mb-3 text-green-900 flex items-center">
                        <span className="mr-2">✅</span>
                        Correction
                      </h4>
                      <div className="bg-white p-3 rounded border border-green-300">
                        {typeof content.correction === 'object' ? (
                          <RichTextEditor
                            content={content.correction}
                            onChange={() => {}}
                            editable={false}
                          />
                        ) : (
                          <p className="text-gray-800 whitespace-pre-wrap text-sm">
                            {content.correction}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'slide' ? (
                  // Vue présentation slide
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-lg border-2 border-purple-200 shadow-lg">
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                          <span>Note: <strong className="text-green-600">{submission?.grade}/100</strong></span>
                          <span>•</span>
                          <span>Soumis le {new Date(submission?.submitted_at || '').toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <span className="mr-2">📝</span>
                            Votre réponse
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            {submission?.answer_text ? (
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {submission.answer_text}
                              </p>
                            ) : submission?.answer_json ? (
                              <pre className="text-xs text-gray-800 overflow-x-auto bg-gray-50 p-3 rounded">
                                {JSON.stringify(submission.answer_json, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-gray-500 italic">Aucune réponse texte</p>
                            )}
                            {submission?.file_path && (
                              <div className="mt-4 pt-4 border-t">
                                <a
                                  href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  📎 Fichier joint: {submission.file_path.split('/').pop()}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                            <span className="mr-2">✅</span>
                            Correction
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            {typeof content.correction === 'object' ? (
                              <RichTextEditor
                                content={content.correction}
                                onChange={() => {}}
                                editable={false}
                              />
                            ) : (
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {content.correction}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Vue normale (par défaut)
                  <details className="mt-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">Voir la correction</summary>
                    <div className="mt-2 bg-white p-4 rounded-lg border border-gray-200">
                      {typeof content.correction === 'object' ? (
                        <RichTextEditor
                          content={content.correction}
                          onChange={() => {}}
                          editable={false}
                        />
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{content.correction}</p>
                      )}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTp = () => {
    // Vérifier si c'est un TP de contrôle
    const isControlTp = (item as any).is_control_tp === true;
    
    if (isControlTp) {
      // Utiliser le composant spécialisé pour les TP de contrôle
      return <TpControlRenderer item={item} submission={submission} onSubmissionUpdate={onSubmissionUpdate} viewingUserId={viewingUserId || undefined} />;
    }

    // Vérifier si c'est un TP pas à pas
    const isStepByStepTp = item.content?.type === 'step-by-step' || (item.content?.steps && Array.isArray(item.content.steps));
    
    if (isStepByStepTp) {
      // Utiliser le composant spécialisé pour les TPs pas à pas
      return <StepByStepTpRenderer item={item} submission={submission} onSubmissionUpdate={onSubmissionUpdate} viewingUserId={viewingUserId || undefined} />;
    }
    const isSubmitted = submission?.status === 'submitted'
    const isGraded = submission?.status === 'graded'
    
    // Détecter si c'est un TP Titanic (par le titre ou un champ dans content)
    const isTitanicTp = item.title?.toLowerCase().includes('titanic') || 
                       item.title?.toLowerCase().includes('big data') ||
                       item.title?.toLowerCase().includes('data science') ||
                       item.title?.toLowerCase().includes('machine learning') ||
                       item.content?.titanicModule

    // Détecter le type de module
    const getTitanicModuleType = (): 'big-data' | 'data-science' | 'machine-learning' | undefined => {
      if (item.title?.toLowerCase().includes('big data')) return 'big-data'
      if (item.title?.toLowerCase().includes('data science')) return 'data-science'
      if (item.title?.toLowerCase().includes('machine learning')) return 'machine-learning'
      return item.content?.titanicModule
    }

    const handleTitanicUploadSuccess = () => {
      // Recharger les données de soumission
      if (onSubmissionUpdate) {
        // La soumission sera mise à jour automatiquement
        window.location.reload() // Solution simple pour recharger
      }
    }

    // Debug: vérifier le contenu du TP
    // Pour les TP, on affiche le body s'il existe, même s'il est court
    const hasBody = item.content?.body && (
      (typeof item.content.body === 'string' && item.content.body.trim().length > 0) ||
      (typeof item.content.body === 'object' && (
        // Si c'est un objet TipTap, vérifier qu'il a du contenu
        (item.content.body.content && Array.isArray(item.content.body.content) && item.content.body.content.length > 0) ||
        // Sinon, vérifier qu'il a des clés
        Object.keys(item.content.body).length > 0
      ))
    )
    
    console.log('🔍 renderTp - Item content:', {
      itemId: item.id,
      itemType: item.type,
      hasContent: !!item.content,
      hasBody: !!hasBody,
      bodyType: typeof item.content?.body,
      bodyIsObject: item.content?.body && typeof item.content.body === 'object',
      bodyIsString: typeof item.content?.body === 'string',
      bodyLength: item.content?.body ? (typeof item.content.body === 'string' ? item.content.body.length : JSON.stringify(item.content.body).length) : 0,
      contentKeys: item.content ? Object.keys(item.content) : [],
      bodyPreview: item.content?.body ? (typeof item.content.body === 'string' ? item.content.body.substring(0, 100) : JSON.stringify(item.content.body).substring(0, 100)) : 'null',
      bodyContent: item.content?.body && typeof item.content.body === 'object' && item.content.body.content ? `Array(${item.content.body.content.length})` : 'N/A'
    })

    return (
      <div className="space-y-6">
        {/* Debug: Afficher les clés disponibles (uniquement si body manquant) */}
        {(!hasBody && item.content) && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-sm">
            <p className="font-bold text-yellow-900 mb-2">⚠️ DEBUG: Body non trouvé pour ce TP</p>
            <p className="text-yellow-800 mb-1"><strong>Clés disponibles dans content:</strong> {Object.keys(item.content).join(', ') || 'Aucune'}</p>
            <p className="text-yellow-800 mb-1"><strong>Type de content:</strong> {typeof item.content}</p>
            {item.content.description && (
              <p className="text-yellow-800 mt-2"><strong>Description:</strong> {typeof item.content.description === 'string' ? item.content.description.substring(0, 200) : 'Object'}</p>
            )}
            {item.content.instructions && (
              <p className="text-yellow-800 mt-2"><strong>Instructions:</strong> {typeof item.content.instructions === 'string' ? item.content.instructions.substring(0, 200) : 'Object'}</p>
            )}
            <details className="mt-2">
              <summary className="cursor-pointer text-yellow-700 font-medium">Voir tout le content (JSON)</summary>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(item.content, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Contenu pédagogique du TP (body) - EN PREMIER */}
        {hasBody && (
          <div className="prose max-w-none">
            <RichTextEditor
              content={item.content.body}
              onChange={() => {}}
              editable={false}
            />
          </div>
        )}

        {/* Fallback: Afficher description si body n'existe pas */}
        {!hasBody && item.content?.description && (
          <div className="prose max-w-none bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Description du TP</h3>
            {typeof item.content.description === 'object' ? (
              <RichTextEditor
                content={item.content.description}
                onChange={() => {}}
                editable={false}
              />
            ) : (
              <p className="text-blue-800 whitespace-pre-wrap">{item.content.description}</p>
            )}
          </div>
        )}

        {/* Documents disponibles pour le TP */}
        <ItemDocuments itemId={item.id} />

        {/* Uploader JSON Titanic si c'est un TP Titanic */}
        {isTitanicTp && !isSubmitted && (
          <TitanicJsonUploader
            itemId={item.id}
            onUploadSuccess={handleTitanicUploadSuccess}
            moduleType={getTitanicModuleType()}
          />
        )}

        {/* Afficher les données importées si soumises */}
        {isTitanicTp && submission?.answer_json?.titanicData && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <FileJson className="w-5 h-5 mr-2" />
              Réponses importées depuis l'application Titanic
            </h4>
            <p className="text-sm text-blue-700">
              Module: {submission.answer_json.moduleType || 'Non spécifié'} | 
              Importé le: {new Date(submission.answer_json.uploadedAt || submission.submitted_at).toLocaleDateString('fr-FR')}
            </p>
            <details className="mt-2">
              <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                Voir les données importées
              </summary>
              <pre className="mt-2 text-xs bg-white p-3 rounded border border-blue-300 overflow-auto max-h-96">
                {JSON.stringify(submission.answer_json.titanicData, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Instructions du TP */}
        {item.content?.instructions && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 mb-2">Consignes du TP</h3>
            {typeof item.content.instructions === 'object' ? (
              <div className="prose max-w-none text-purple-800">
                <RichTextEditor
                  content={item.content.instructions}
                  onChange={() => {}}
                  editable={false}
                />
              </div>
            ) : (
              <p className="text-purple-800 whitespace-pre-wrap">{item.content.instructions}</p>
            )}
            {item.content?.checklist && (
              <div className="mt-4">
                <h4 className="font-medium text-purple-900">Checklist</h4>
                <ul className="list-disc list-inside text-purple-800 mt-2">
                  {item.content.checklist.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Votre rendu</h3>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitted}
            className="input-field h-32 resize-none"
            placeholder="Décrivez votre travail..."
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Fichier à soumettre (optionnel)
            </label>
            <FileUpload
              onFileSelect={setFile}
              accept=".pdf,.doc,.docx,.zip,.rar"
              disabled={isSubmitted}
            />
            {submission?.file_path && (
              <p className="text-sm text-gray-600">
                Fichier soumis: {submission.file_path.split('/').pop()}
              </p>
            )}
          </div>
        </div>

        {!isSubmitted ? (
          <button
            onClick={handleTpSubmit}
            disabled={loading || (!answer.trim() && !file)}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Soumission...' : 'Soumettre le TP'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                TP soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
              </p>
              {isGraded && submission.grade && (
                <p className="text-sm font-medium text-green-600">
                  Note: {submission.grade}/100
                </p>
              )}
            </div>

            {/* Bouton correction IA */}
            {submission.answer_text && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAiCorrection}
                  disabled={correcting}
                  className="btn-secondary disabled:opacity-50 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{correcting ? 'Correction en cours...' : 'Faire corriger par l\'IA'}</span>
                </button>
                {aiCorrection && (
                  <span className="text-sm text-green-600">✓ Correction disponible</span>
                )}
              </div>
            )}

            {/* Affichage de la correction IA */}
            {aiCorrection && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
                <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Correction par l'IA
                </h4>
                
                {aiCorrection.score !== null && aiCorrection.score !== undefined && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-purple-300">
                    <span className="text-sm font-medium text-gray-700">Note estimée : </span>
                    <span className="text-lg font-bold text-purple-600">{aiCorrection.score}/100</span>
                  </div>
                )}

                {aiCorrection.feedback && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-blue-300">
                    <h5 className="font-semibold text-blue-900 mb-2">💬 Feedback</h5>
                    <p className="text-gray-800 whitespace-pre-wrap">{aiCorrection.feedback}</p>
                  </div>
                )}

                {aiCorrection.strengths && aiCorrection.strengths.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-300">
                    <h5 className="font-semibold text-green-900 mb-2">✅ Points forts</h5>
                    <ul className="list-disc list-inside space-y-1 text-green-800">
                      {aiCorrection.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiCorrection.improvements && aiCorrection.improvements.length > 0 && (
                  <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-300">
                    <h5 className="font-semibold text-amber-900 mb-2">🔧 Points à améliorer</h5>
                    <ul className="list-disc list-inside space-y-1 text-amber-800">
                      {aiCorrection.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiCorrection.correction && (
                  <div className="p-4 bg-white rounded-lg border border-gray-300">
                    <h5 className="font-semibold text-gray-900 mb-2">📝 Correction détaillée</h5>
                    <div className="text-gray-800 whitespace-pre-wrap">{aiCorrection.correction}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderGame = () => {
    // ItemRenderer utilise item.content directement comme gameContent
    // (pas item.content.game_content comme dans les chapitres)
    return (
      <div className="space-y-4">
        <GameRenderer
          gameContent={item.content}
          onScore={handleGameScore}
          itemId={item.id}
        />
      </div>
    )
  }

  switch (item.type) {
    case 'resource':
      return renderResource()
    case 'slide':
      return renderSlide()
    case 'exercise':
    case 'activity': // Les activités sont traitées comme des exercices
      return renderExercise()
    case 'tp':
      return renderTp()
    case 'game':
      return renderGame()
    default:
      return <p className="text-gray-600">Type d'élément non supporté.</p>
  }
}
