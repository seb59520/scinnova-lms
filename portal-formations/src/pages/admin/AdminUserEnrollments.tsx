import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Profile, Enrollment, Course, ProgramEnrollment, Program } from '../../types/database'
import { BookOpen, GraduationCap, ArrowLeft, Plus, X, Search } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'

interface EnrollmentWithCourse extends Enrollment {
  courses: Course
}

interface ProgramEnrollmentWithProgram extends ProgramEnrollment {
  programs: Program
}

export function AdminUserEnrollments() {
  const { userId } = useParams<{ userId: string }>()
  const { profile } = useAuth()
  const [user, setUser] = useState<Profile | null>(null)
  const [courseEnrollments, setCourseEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [programEnrollments, setProgramEnrollments] = useState<ProgramEnrollmentWithProgram[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [allPrograms, setAllPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [showAddProgramModal, setShowAddProgramModal] = useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (userId) {
      fetchUser()
      fetchCourseEnrollments()
      fetchProgramEnrollments()
      fetchAllCourses()
      fetchAllPrograms()
    }
  }, [userId])

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error: any) {
      console.error('Error fetching user:', error)
      setError('Erreur lors du chargement de l\'utilisateur.')
    }
  }

  const fetchCourseEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (*)
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false })

      if (error) throw error
      setCourseEnrollments(data || [])
    } catch (error: any) {
      console.error('Error fetching course enrollments:', error)
      setError('Erreur lors du chargement des inscriptions aux cours.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProgramEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('program_enrollments')
        .select(`
          *,
          programs (*)
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false })

      if (error) throw error
      setProgramEnrollments(data || [])
    } catch (error: any) {
      console.error('Error fetching program enrollments:', error)
      setError('Erreur lors du chargement des inscriptions aux programmes.')
    }
  }

  const fetchAllCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title')

      if (error) throw error
      setAllCourses(data || [])
    } catch (error: any) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchAllPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('title')

      if (error) throw error
      setAllPrograms(data || [])
    } catch (error: any) {
      console.error('Error fetching programs:', error)
    }
  }

  const handleAddCourseEnrollments = async () => {
    if (!userId || selectedCourseIds.length === 0) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Vérifier les inscriptions existantes
      const { data: existing } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', userId)
        .in('course_id', selectedCourseIds)

      const existingCourseIds = existing?.map(e => e.course_id) || []
      const newCourseIds = selectedCourseIds.filter(id => !existingCourseIds.includes(id))

      if (newCourseIds.length === 0) {
        setError('Tous les cours sélectionnés sont déjà attribués à cet utilisateur.')
        setSaving(false)
        return
      }

      // Créer les nouvelles inscriptions
      const enrollmentsToCreate = newCourseIds.map(courseId => ({
        user_id: userId,
        course_id: courseId,
        status: 'active',
        source: 'manual' as const
      }))

      const { error: insertError } = await supabase
        .from('enrollments')
        .insert(enrollmentsToCreate)

      if (insertError) throw insertError

      setSuccess(`${newCourseIds.length} cours ajouté(s) avec succès`)
      setSelectedCourseIds([])
      setShowAddCourseModal(false)
      await fetchCourseEnrollments()
    } catch (error: any) {
      console.error('Error adding course enrollments:', error)
      setError(error.message || 'Erreur lors de l\'ajout des inscriptions.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddProgramEnrollments = async () => {
    if (!userId || selectedProgramIds.length === 0) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Vérifier les inscriptions existantes
      const { data: existing } = await supabase
        .from('program_enrollments')
        .select('program_id')
        .eq('user_id', userId)
        .in('program_id', selectedProgramIds)

      const existingProgramIds = existing?.map(e => e.program_id) || []
      const newProgramIds = selectedProgramIds.filter(id => !existingProgramIds.includes(id))

      if (newProgramIds.length === 0) {
        setError('Tous les programmes sélectionnés sont déjà attribués à cet utilisateur.')
        setSaving(false)
        return
      }

      // Créer les nouvelles inscriptions
      const enrollmentsToCreate = newProgramIds.map(programId => ({
        user_id: userId,
        program_id: programId,
        status: 'active',
        source: 'manual' as const
      }))

      const { error: insertError } = await supabase
        .from('program_enrollments')
        .insert(enrollmentsToCreate)

      if (insertError) throw insertError

      setSuccess(`${newProgramIds.length} programme(s) ajouté(s) avec succès`)
      setSelectedProgramIds([])
      setShowAddProgramModal(false)
      await fetchProgramEnrollments()
      await fetchCourseEnrollments() // Recharger aussi les cours car les programmes peuvent créer des enrollments automatiques
    } catch (error: any) {
      console.error('Error adding program enrollments:', error)
      setError(error.message || 'Erreur lors de l\'ajout des inscriptions.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCourseStatus = async (enrollmentId: string, newStatus: 'active' | 'pending' | 'revoked') => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ status: newStatus })
        .eq('id', enrollmentId)

      if (error) throw error
      await fetchCourseEnrollments()
    } catch (error: any) {
      console.error('Error updating enrollment:', error)
      setError('Erreur lors de la mise à jour du statut.')
    }
  }

  const handleUpdateProgramStatus = async (enrollmentId: string, newStatus: 'active' | 'pending' | 'revoked') => {
    try {
      const { error } = await supabase
        .from('program_enrollments')
        .update({ status: newStatus })
        .eq('id', enrollmentId)

      if (error) throw error
      await fetchProgramEnrollments()
      await fetchCourseEnrollments() // Recharger aussi les cours
    } catch (error: any) {
      console.error('Error updating enrollment:', error)
      setError('Erreur lors de la mise à jour du statut.')
    }
  }

  const handleRemoveCourseEnrollment = async (enrollmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer l\'accès à ce cours ?')) return

    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId)

      if (error) throw error
      await fetchCourseEnrollments()
    } catch (error: any) {
      console.error('Error removing enrollment:', error)
      setError('Erreur lors de la suppression de l\'inscription.')
    }
  }

  const handleRemoveProgramEnrollment = async (enrollmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer l\'accès à ce programme ?')) return

    try {
      const { error } = await supabase
        .from('program_enrollments')
        .delete()
        .eq('id', enrollmentId)

      if (error) throw error
      await fetchProgramEnrollments()
      await fetchCourseEnrollments() // Recharger aussi les cours
    } catch (error: any) {
      console.error('Error removing enrollment:', error)
      setError('Erreur lors de la suppression de l\'inscription.')
    }
  }

  const enrolledCourseIds = courseEnrollments.map(e => e.course_id)
  const enrolledProgramIds = programEnrollments.map(e => e.program_id)

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h2>
          <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="SCINNOVA - LMS" showBackButton={true} backTo="/admin/users" backLabel="Retour aux utilisateurs" />
        <div className="flex items-center justify-center py-12 pt-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="SCINNOVA - LMS" showBackButton={true} backTo="/admin/users" backLabel="Retour aux utilisateurs" />
      <div className="py-8 px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Inscriptions de {user?.full_name || 'Utilisateur'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les cours et programmes attribués à cet utilisateur
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
              {error}
              <button
                onClick={() => setError('')}
                className="float-right text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
              {success}
              <button
                onClick={() => setSuccess('')}
                className="float-right text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Inscriptions aux programmes */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Programmes ({programEnrollments.length})
              </h3>
              <button
                onClick={() => setShowAddProgramModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter un programme
              </button>
            </div>

            {programEnrollments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Aucun programme attribué
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {programEnrollments.map((enrollment) => (
                    <li key={enrollment.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {enrollment.programs?.title || 'Programme sans titre'}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              enrollment.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : enrollment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {enrollment.status === 'active' ? 'Actif' :
                               enrollment.status === 'pending' ? 'En attente' : 'Révoqué'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Inscrit le {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={enrollment.status}
                            onChange={(e) => handleUpdateProgramStatus(enrollment.id, e.target.value as 'active' | 'pending' | 'revoked')}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="active">Actif</option>
                            <option value="pending">En attente</option>
                            <option value="revoked">Révoqué</option>
                          </select>
                          <button
                            onClick={() => handleRemoveProgramEnrollment(enrollment.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Retirer l'accès"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Inscriptions aux cours */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Cours ({courseEnrollments.length})
              </h3>
              <button
                onClick={() => setShowAddCourseModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter un cours
              </button>
            </div>

            {courseEnrollments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Aucun cours attribué
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {courseEnrollments.map((enrollment) => (
                    <li key={enrollment.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {enrollment.courses?.title || 'Cours sans titre'}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              enrollment.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : enrollment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {enrollment.status === 'active' ? 'Actif' :
                               enrollment.status === 'pending' ? 'En attente' : 'Révoqué'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Inscrit le {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={enrollment.status}
                            onChange={(e) => handleUpdateCourseStatus(enrollment.id, e.target.value as 'active' | 'pending' | 'revoked')}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="active">Actif</option>
                            <option value="pending">En attente</option>
                            <option value="revoked">Révoqué</option>
                          </select>
                          <button
                            onClick={() => handleRemoveCourseEnrollment(enrollment.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Retirer l'accès"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour ajouter des programmes */}
      {showAddProgramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Ajouter des programmes</h3>
              <button
                onClick={() => {
                  setShowAddProgramModal(false)
                  setSelectedProgramIds([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher un programme..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field w-full pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allPrograms
                  .filter(program => 
                    !enrolledProgramIds.includes(program.id) &&
                    program.title?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((program) => (
                    <label key={program.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProgramIds.includes(program.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProgramIds([...selectedProgramIds, program.id])
                          } else {
                            setSelectedProgramIds(selectedProgramIds.filter(id => id !== program.id))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{program.title}</span>
                    </label>
                  ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddProgramModal(false)
                  setSelectedProgramIds([])
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleAddProgramEnrollments}
                disabled={saving || selectedProgramIds.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Ajout...' : `Ajouter ${selectedProgramIds.length} programme(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter des cours */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Ajouter des cours</h3>
              <button
                onClick={() => {
                  setShowAddCourseModal(false)
                  setSelectedCourseIds([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher un cours..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field w-full pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allCourses
                  .filter(course => 
                    !enrolledCourseIds.includes(course.id) &&
                    course.title?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((course) => (
                    <label key={course.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
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
                      <span className="text-sm text-gray-900">{course.title}</span>
                    </label>
                  ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddCourseModal(false)
                  setSelectedCourseIds([])
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCourseEnrollments}
                disabled={saving || selectedCourseIds.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Ajout...' : `Ajouter ${selectedCourseIds.length} cours`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

