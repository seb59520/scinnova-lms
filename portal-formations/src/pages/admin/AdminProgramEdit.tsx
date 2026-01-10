import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Program, ProgramCourse, ProgramCourseWithCourse, Course } from '../../types/database'
import { Save, Plus, Trash2, ChevronUp, ChevronDown, X, GripVertical, FileText, Download, Trash } from 'lucide-react'
import { FileUpload } from '../../components/FileUpload'

export function AdminProgramEdit() {
  const { programId } = useParams<{ programId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isNew = programId === 'new'

  const [program, setProgram] = useState<Partial<Program>>({
    title: '',
    description: '',
    status: 'draft',
    access_type: 'free',
    price_cents: null,
    currency: 'EUR',
    summary_pdf_path: null,
    created_by: user?.id
  })
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [programCourses, setProgramCourses] = useState<ProgramCourseWithCourse[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true
    
    if (!isNew && programId) {
      fetchProgram(isMounted)
    } else {
      setLoading(false)
    }
    fetchAvailableCourses(isMounted)
    
    return () => {
      isMounted = false
    }
  }, [programId, isNew])

  const fetchProgram = async (isMounted: boolean = true) => {
    try {
      // Récupérer le programme
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single()

      if (!isMounted) return

      if (programError) {
        // Ignorer les erreurs d'abort
        if (programError.message?.includes('aborted') || programError.message?.includes('AbortError')) {
          console.log('⚠️ Requête annulée (composant démonté)')
          return
        }
        throw programError
      }
      
      setProgram(programData)

      // Récupérer les formations du programme avec leurs détails
      const { data: programCoursesData, error: programCoursesError } = await supabase
        .from('program_courses')
        .select(`
          *,
          courses (*)
        `)
        .eq('program_id', programId)
        .order('position', { ascending: true })

      if (!isMounted) return

      if (programCoursesError) {
        // Ignorer les erreurs d'abort
        if (programCoursesError.message?.includes('aborted') || programCoursesError.message?.includes('AbortError')) {
          console.log('⚠️ Requête annulée (composant démonté)')
          return
        }
        throw programCoursesError
      }

      const formatted = (programCoursesData || []).map((pc: any) => ({
        ...pc,
        courses: pc.courses
      }))
      
      if (isMounted) {
        setProgramCourses(formatted)
      }
    } catch (error: any) {
      if (!isMounted) return
      
      // Ignorer les erreurs d'abort
      if (error?.message?.includes('aborted') || error?.name === 'AbortError') {
        console.log('⚠️ Requête annulée (composant démonté)')
        return
      }
      
      console.error('Error fetching program:', error)
      setError('Erreur lors du chargement.')
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }

  const fetchAvailableCourses = async (isMounted: boolean = true) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title', { ascending: true })

      if (!isMounted) return

      if (error) {
        // Ignorer les erreurs d'abort
        if (error.message?.includes('aborted') || error.message?.includes('AbortError')) {
          console.log('⚠️ Requête annulée (composant démonté)')
          return
        }
        throw error
      }
      
      if (isMounted) {
        setAvailableCourses(data || [])
      }
    } catch (error: any) {
      if (!isMounted) return
      
      // Ignorer les erreurs d'abort
      if (error?.message?.includes('aborted') || error?.name === 'AbortError') {
        console.log('⚠️ Requête annulée (composant démonté)')
        return
      }
      
      console.error('Error fetching courses:', error)
    }
  }


  const handlePdfUpload = async (file: File | null) => {
    if (!file) {
      setPdfFile(null)
      return
    }

    if (!programId || isNew) {
      setError('Veuillez d\'abord sauvegarder le programme avant d\'uploader un PDF.')
      return
    }

    setUploadingPdf(true)
    setError('')

    try {
      // Vérifier que c'est un PDF
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Le fichier doit être un PDF')
      }

      // Vérifier la taille du fichier (max 50MB)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        throw new Error(`Le fichier est trop volumineux. Taille maximum: 50MB (actuel: ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      }

      // Supprimer l'ancien PDF s'il existe
      if (program.summary_pdf_path) {
        try {
          // Extraire le chemin (enlever le préfixe course-assets/ si présent)
          const oldPath = program.summary_pdf_path.replace(/^course-assets\//, '')
          const { error: removeError } = await supabase.storage
            .from('course-assets')
            .remove([oldPath])
          
          if (removeError && !removeError.message?.includes('not found')) {
            console.warn('Erreur lors de la suppression de l\'ancien PDF:', removeError)
          }
        } catch (err) {
          console.warn('Erreur lors de la suppression de l\'ancien PDF:', err)
        }
      }

      // Upload du nouveau PDF
      const fileExt = 'pdf'
      const fileName = `programs/${programId}/summary-${Date.now()}.${fileExt}`
      
      console.log('📤 Début de l\'upload du PDF:', fileName, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // Ignorer les erreurs d'abort (timeout)
        if (uploadError.message?.includes('aborted') || uploadError.message?.includes('AbortError')) {
          throw new Error('L\'upload a été interrompu. Le fichier est peut-être trop volumineux ou la connexion est lente. Réessayez avec un fichier plus petit ou vérifiez votre connexion Internet.')
        }
        
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('Le bucket "course-assets" n\'existe pas. Veuillez exécuter le script SQL setup-course-assets-storage.sql dans Supabase.')
        }
        
        if (uploadError.message?.includes('File size exceeds')) {
          throw new Error('Le fichier est trop volumineux. Taille maximum: 50MB')
        }
        
        throw uploadError
      }

      console.log('✅ PDF uploadé avec succès:', uploadData.path)

      // Mettre à jour le programme avec le nouveau chemin
      const { error: updateError } = await supabase
        .from('programs')
        .update({ summary_pdf_path: fileName })
        .eq('id', programId)

      if (updateError) throw updateError

      setProgram({ ...program, summary_pdf_path: fileName })
      setPdfFile(null)
    } catch (error: any) {
      console.error('❌ Error uploading PDF:', error)
      setError(error.message || 'Erreur lors de l\'upload du PDF')
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleDeletePdf = async () => {
    if (!program.summary_pdf_path || !programId) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce PDF ?')) return

    try {
      // Extraire le chemin pour la suppression (enlever le préfixe course-assets/ si présent)
      const pathToDelete = program.summary_pdf_path.replace(/^course-assets\//, '')
      
      // Supprimer le fichier du storage
      const { error: deleteError } = await supabase.storage
        .from('course-assets')
        .remove([pathToDelete])

      if (deleteError) {
        // Ignorer les erreurs si le fichier n'existe pas déjà
        if (!deleteError.message?.includes('not found') && !deleteError.message?.includes('does not exist')) {
          throw deleteError
        }
      }

      // Mettre à jour le programme
      const { error: updateError } = await supabase
        .from('programs')
        .update({ summary_pdf_path: null })
        .eq('id', programId)

      if (updateError) throw updateError

      setProgram({ ...program, summary_pdf_path: null })
    } catch (error: any) {
      console.error('Error deleting PDF:', error)
      setError(error.message || 'Erreur lors de la suppression du PDF')
    }
  }

  const getPdfUrl = (): string | null => {
    if (!program.summary_pdf_path) return null
    
    // Si c'est déjà une URL complète, la retourner
    if (program.summary_pdf_path.startsWith('http')) {
      return program.summary_pdf_path
    }
    
    // Extraire le chemin (enlever le préfixe course-assets/ si présent)
    const path = program.summary_pdf_path.replace(/^course-assets\//, '')
    
    const { data } = supabase.storage
      .from('course-assets')
      .getPublicUrl(path)
    
    return data.publicUrl
  }

  const handleSave = async () => {
    if (!program.title?.trim()) {
      setError('Le titre est obligatoire.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const programData = {
        ...program,
        updated_at: new Date().toISOString()
      }

      let finalProgramId = programId

      // Sauvegarder ou créer le programme
      if (isNew) {
        const { data, error } = await supabase
          .from('programs')
          .insert(programData)
          .select()
          .single()

        if (error) throw error
        finalProgramId = data.id
        navigate(`/admin/programs/${data.id}`, { replace: true })
      } else {
        const { error } = await supabase
          .from('programs')
          .update(programData)
          .eq('id', programId)

        if (error) throw error
        finalProgramId = programId
      }

      // Sauvegarder/mettre à jour les formations du programme
      const programCoursesToCreate = programCourses.filter(pc => pc.id.startsWith('temp-'))
      const programCoursesToUpdate = programCourses.filter(pc => !pc.id.startsWith('temp-'))
      const programCoursesToDelete: string[] = []

      // Identifier les formations à supprimer (si on a chargé le programme)
      if (!isNew && programId) {
        const { data: existing } = await supabase
          .from('program_courses')
          .select('id')
          .eq('program_id', programId)

        const existingIds = existing?.map(e => e.id) || []
        const currentIds = programCourses.map(pc => pc.id).filter(id => !id.startsWith('temp-'))
        programCoursesToDelete.push(...existingIds.filter(id => !currentIds.includes(id)))
      }

      // Supprimer les formations retirées
      if (programCoursesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('program_courses')
          .delete()
          .in('id', programCoursesToDelete)

        if (deleteError) throw deleteError
      }

      // Créer les nouvelles associations
      if (programCoursesToCreate.length > 0) {
        const programCoursesData = programCoursesToCreate.map((pc, index) => {
          const basePosition = programCoursesToUpdate.length
          return {
            program_id: finalProgramId,
            course_id: pc.course_id,
            position: basePosition + index
          }
        })

        const { data: saved, error: insertError } = await supabase
          .from('program_courses')
          .insert(programCoursesData)
          .select()

        if (insertError) throw insertError

        // Mettre à jour les IDs temporaires
        const updatedProgramCourses = programCourses.map(pc => {
          if (pc.id.startsWith('temp-')) {
            const savedPc = saved?.find((spc, idx) => 
              programCoursesToCreate[idx]?.course_id === spc.course_id
            )
            if (savedPc) {
              return {
                ...pc,
                id: savedPc.id,
                program_id: savedPc.program_id
              }
            }
          }
          return pc
        })
        setProgramCourses(updatedProgramCourses)
      }

      // Mettre à jour les positions des formations existantes
      if (programCoursesToUpdate.length > 0) {
        const updatePromises = programCoursesToUpdate.map(pc =>
          supabase
            .from('program_courses')
            .update({ position: pc.position })
            .eq('id', pc.id)
        )

        const updateResults = await Promise.all(updatePromises)
        const updateErrors = updateResults.filter(r => r.error)
        if (updateErrors.length > 0) {
          console.error('Errors updating program courses:', updateErrors)
        }
      }

      setError('')
    } catch (error) {
      console.error('Error saving program:', error)
      setError(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddCourses = () => {
    if (selectedCourseIds.length === 0) {
      setError('Veuillez sélectionner au moins une formation.')
      return
    }

    const coursesToAdd = availableCourses
      .filter(c => selectedCourseIds.includes(c.id))
      .filter(c => !programCourses.some(pc => pc.course_id === c.id))

    const newProgramCourses = coursesToAdd.map((course, index) => ({
      id: `temp-${Date.now()}-${index}`,
      program_id: programId || '',
      course_id: course.id,
      position: programCourses.length + index,
      created_at: new Date().toISOString(),
      courses: course
    }))

    setProgramCourses([...programCourses, ...newProgramCourses])
    setShowAddModal(false)
    setSelectedCourseIds([])
  }

  const handleRemoveCourse = (programCourseId: string) => {
    if (!confirm('Retirer cette formation du programme ?')) return
    setProgramCourses(programCourses.filter(pc => pc.id !== programCourseId))
  }

  const handleMoveCourse = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= programCourses.length) return

    const updated = [...programCourses]
    const temp = updated[index]
    updated[index] = { ...updated[newIndex], position: index }
    updated[newIndex] = { ...temp, position: newIndex }
    
    // Réorganiser les positions
    updated.forEach((pc, idx) => {
      pc.position = idx
    })

    setProgramCourses(updated)
  }

  // Fonctions pour le drag & drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCourseId(programCourses[index].id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedCourseId && dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (!draggedCourseId) return

    const sourceIndex = programCourses.findIndex(pc => pc.id === draggedCourseId)
    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      setDraggedCourseId(null)
      return
    }

    const updated = [...programCourses]
    const [movedItem] = updated.splice(sourceIndex, 1)
    updated.splice(targetIndex, 0, movedItem)

    // Réorganiser les positions
    updated.forEach((pc, idx) => {
      pc.position = idx
    })

    setProgramCourses(updated)
    setDraggedCourseId(null)
  }

  const handleDragEnd = () => {
    setDraggedCourseId(null)
    setDragOverIndex(null)
  }

  const enrolledCourseIds = programCourses.map(pc => pc.course_id)
  const availableCoursesFiltered = availableCourses.filter(c => !enrolledCourseIds.includes(c.id))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/programs"
                className="text-white hover:text-indigo-200 transition-colors font-medium"
              >
                ← Retour
              </Link>
              <h1 className="text-2xl font-bold text-white">
                {isNew ? 'Nouveau programme' : 'Modifier le programme'}
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full py-6 sm:px-6 lg:px-8">
        <div className="w-full px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Informations générales */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-indigo-600 rounded"></div>
              Informations générales
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={program.title || ''}
                  onChange={(e) => setProgram({ ...program, title: e.target.value })}
                  className="input-field w-full"
                  placeholder="Titre du programme"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={program.description || ''}
                  onChange={(e) => setProgram({ ...program, description: e.target.value })}
                  className="input-field w-full"
                  rows={3}
                  placeholder="Description du programme"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={program.status}
                    onChange={(e) => setProgram({ ...program, status: e.target.value as 'draft' | 'published' })}
                    className="input-field w-full"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'accès
                  </label>
                  <select
                    value={program.access_type}
                    onChange={(e) => setProgram({ ...program, access_type: e.target.value as 'free' | 'paid' | 'invite' })}
                    className="input-field w-full"
                  >
                    <option value="free">Gratuit</option>
                    <option value="paid">Payant</option>
                    <option value="invite">Sur invitation</option>
                  </select>
                </div>

                {program.access_type === 'paid' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (centimes)
                    </label>
                    <input
                      type="number"
                      value={program.price_cents || ''}
                      onChange={(e) => setProgram({ ...program, price_cents: e.target.value ? parseInt(e.target.value) : null })}
                      className="input-field w-full"
                      placeholder="5000 = 50€"
                    />
                  </div>
                )}
              </div>

              {/* PDF de résumé */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF de résumé du programme
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Téléchargez un PDF contenant le résumé de la formation pour ce programme.
                </p>
                
                {program.summary_pdf_path ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            PDF de résumé disponible
                          </p>
                          <p className="text-xs text-green-700">
                            {program.summary_pdf_path.split('/').pop()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={getPdfUrl() || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Voir le PDF
                        </a>
                        <button
                          onClick={handleDeletePdf}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          <Trash className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <FileUpload
                      onFileSelect={handlePdfUpload}
                      accept=".pdf,application/pdf"
                      maxSize={50}
                      disabled={uploadingPdf || isNew}
                    />
                    {isNew && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        ⚠️ Sauvegardez d'abord le programme pour pouvoir uploader un PDF
                      </p>
                    )}
                    {uploadingPdf && (
                      <p className="text-sm text-blue-600 mt-2 text-center">
                        Upload en cours...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formations du programme */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded"></div>
                Formations du programme ({programCourses.length})
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter des formations</span>
              </button>
            </div>

            {programCourses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  Aucune formation ajoutée. Cliquez sur "Ajouter des formations" pour commencer.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {programCourses.map((pc, index) => (
                  <li
                    key={pc.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`py-4 px-4 rounded-lg flex items-center justify-between transition-all ${
                      dragOverIndex === index 
                        ? 'bg-blue-100 border-l-4 border-blue-600 shadow-md' 
                        : 'bg-white hover:bg-blue-50 border-l-4 border-transparent hover:border-blue-300'
                    } ${draggedCourseId === pc.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Poignée de drag & drop */}
                      <div className="flex flex-col items-center space-y-1 cursor-move">
                        <GripVertical className="w-5 h-5 text-indigo-400 hover:text-indigo-600 transition-colors" />
                        <span className="text-xs text-indigo-600 font-bold bg-indigo-100 px-2 py-0.5 rounded">
                          {index + 1}
                        </span>
                      </div>
                      
                      {/* Boutons de déplacement (alternative) */}
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleMoveCourse(index, 'up')}
                          disabled={index === 0}
                          className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded transition-colors"
                          title="Déplacer vers le haut"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveCourse(index, 'down')}
                          disabled={index === programCourses.length - 1}
                          className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded transition-colors"
                          title="Déplacer vers le bas"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {pc.courses?.title || 'Formation inconnue'}
                          </h3>
                          {pc.courses?.status === 'published' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Publié
                            </span>
                          )}
                          {pc.courses?.access_type === 'free' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              Gratuit
                            </span>
                          )}
                        </div>
                        {pc.courses?.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {pc.courses.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCourse(pc.id)}
                      className="text-red-400 hover:text-red-600 p-2 rounded transition-colors"
                      title="Retirer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Modal d'ajout de formations */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Ajouter des formations au programme
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedCourseIds([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto mb-4 border border-gray-200 rounded-md">
              {availableCoursesFiltered.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Toutes les formations sont déjà dans le programme.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {availableCoursesFiltered.map((course) => (
                    <li key={course.id} className="px-4 py-3 hover:bg-gray-50">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCourseIds.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCourseIds([...selectedCourseIds, course.id])
                            } else {
                              setSelectedCourseIds(selectedCourseIds.filter(id => id !== course.id))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {course.title}
                          </p>
                          {course.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedCourseIds([])
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCourses}
                disabled={selectedCourseIds.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter {selectedCourseIds.length} formation(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



