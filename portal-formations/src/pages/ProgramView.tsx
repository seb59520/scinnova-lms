import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserRole } from '../hooks/useUserRole'
import { supabase } from '../lib/supabaseClient'
import { Program, ProgramCourseWithCourse, Course, ProgramEvaluation } from '../types/database'
import { AppHeader } from '../components/AppHeader'
import { ArrowLeft, Layers, BookOpen, ChevronRight, Book, Download, FileText, ClipboardCheck, Award, CheckCircle, Upload, Calendar, AlertCircle, Users, Eye, Edit, BarChart3, TrendingUp } from 'lucide-react'
import { FileUpload } from '../components/FileUpload'
import { StepByStepTpProgressViewer } from '../components/trainer/StepByStepTpProgressViewer'
import { TpNewCommentsViewer } from '../components/trainer/TpNewCommentsViewer'
import { useNavigationContext } from '../components/NavigationContext'

export function ProgramView() {
  const { programId } = useParams<{ programId: string }>()
  const { user, profile } = useAuth()
  const { isAdmin, isStudent } = useUserRole()
  const { setContext, clearContext } = useNavigationContext()
  const [program, setProgram] = useState<Program | null>(null)
  const [programCourses, setProgramCourses] = useState<ProgramCourseWithCourse[]>([])
  const [evaluations, setEvaluations] = useState<ProgramEvaluation[]>([])
  const [evaluationAttempts, setEvaluationAttempts] = useState<Record<string, { passed: boolean; percentage: number }>>({})
  const [programDocuments, setProgramDocuments] = useState<any[]>([])
  const [documentSubmissions, setDocumentSubmissions] = useState<Record<string, any>>({})
  const [expectedItems, setExpectedItems] = useState<any[]>([])
  const [expectedItemsLoaded, setExpectedItemsLoaded] = useState(false)
  const [itemSubmissions, setItemSubmissions] = useState<Record<string, any[]>>({})
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [evaluationsLoaded, setEvaluationsLoaded] = useState(false)
  const [documentsLoaded, setDocumentsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingMarkdown, setDownloadingMarkdown] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({})
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({})
  const [studentGrades, setStudentGrades] = useState<Record<string, {
    profile: any;
    tpGrades: Record<string, number>;
    quizGrades: Record<string, number>;
    average: number;
  }>>({})
  const [gradesLoading, setGradesLoading] = useState(false)

  useEffect(() => {
    if (programId && user) {
      fetchProgram()
      fetchEvaluations()
      fetchProgramDocuments()
      fetchExpectedItems()
    }
    // Nettoyer le contexte de navigation au démontage
    return () => clearContext()
  }, [programId, user, clearContext])

  // Mettre à jour le contexte de navigation quand le programme est chargé
  useEffect(() => {
    if (program) {
      setContext({
        program: {
          id: program.id,
          title: program.title,
          type: 'program'
        }
      })
    }
  }, [program, setContext])

  useEffect(() => {
    // Charger les notes selon le rôle de l'utilisateur
    // - Admin/Trainer: toutes les notes de tous les étudiants
    // - Étudiant: uniquement sa propre note
    console.log('🔍 Vérification conditions pour charger les notes:', {
      programId,
      user: user ? { id: user.id } : null,
      profile: profile ? { id: profile.id, role: profile.role } : null,
      program: program ? { id: program.id, title: program.title } : null,
      isAdmin,
      isStudent,
      profileRole: profile?.role,
      shouldFetch: programId && user && program
    })
    
    if (programId && user && program) {
      // Vérifier le rôle depuis le profil directement si useUserRole n'est pas encore prêt
      const userRole = profile?.role || (isAdmin ? 'admin' : isStudent ? 'student' : null)
      
      // Admin/Trainer: charger toutes les notes
      if (isAdmin || userRole === 'admin' || userRole === 'trainer' || userRole === 'instructor') {
        console.log('✅ Admin/Trainer: chargement de toutes les notes...')
        fetchStudentGrades()
      } 
      // Étudiant: charger uniquement sa propre note
      else if ((isStudent || userRole === 'student') && user.id) {
        console.log('✅ Étudiant: chargement de sa propre note...', { userId: user.id })
        fetchStudentGrades(user.id)
      } else if (!profile) {
        // Si le profil n'est pas encore chargé, attendre un peu puis essayer
        console.log('⏳ Profil non chargé, attente de 2 secondes...')
        const timeoutId = setTimeout(() => {
          console.log('⏳ Tentative de chargement des notes (profil peut-être chargé maintenant)...')
          const retryRole = profile?.role
          if (retryRole === 'admin' || retryRole === 'trainer' || retryRole === 'instructor') {
            fetchStudentGrades()
          } else if (retryRole === 'student' && user.id) {
            fetchStudentGrades(user.id)
          }
        }, 2000)
        return () => clearTimeout(timeoutId)
      } else {
        console.log('⚠️ Rôle non reconnu ou conditions non remplies:', { userRole, isAdmin, isStudent })
      }
    } else {
      console.log('❌ Conditions non remplies pour charger les notes')
    }
  }, [programId, user, profile, program, isAdmin, isStudent])

  const fetchEvaluations = async () => {
    if (!programId || !user) return

    try {
      // Charger les évaluations publiées du programme
      const { data: evalData, error: evalError } = await supabase
        .from('program_evaluations')
        .select('*')
        .eq('program_id', programId)
        .eq('is_published', true)
        .order('created_at')

      if (evalError) {
        console.log('Table program_evaluations non disponible:', evalError.message)
        setEvaluationsLoaded(true)
        return
      }

      console.log('Évaluations chargées:', evalData?.length || 0)
      setEvaluations(evalData || [])
      setEvaluationsLoaded(true)

      // Charger les tentatives de l'utilisateur
      if (evalData && evalData.length > 0) {
        const evalIds = evalData.map(e => e.id)
        const { data: attempts } = await supabase
          .from('program_evaluation_attempts')
          .select('evaluation_id, is_passed, percentage')
          .eq('user_id', user.id)
          .in('evaluation_id', evalIds)
          .order('percentage', { ascending: false })

        // Garder le meilleur résultat par évaluation
        const attemptsMap: Record<string, { passed: boolean; percentage: number }> = {}
        attempts?.forEach(a => {
          if (!attemptsMap[a.evaluation_id] || a.percentage > attemptsMap[a.evaluation_id].percentage) {
            attemptsMap[a.evaluation_id] = { passed: a.is_passed, percentage: a.percentage }
          }
        })
        setEvaluationAttempts(attemptsMap)
      }
    } catch (err) {
      console.error('Error fetching evaluations:', err)
      setEvaluationsLoaded(true)
    }
  }

  const fetchProgramDocuments = async () => {
    if (!programId || !user) return

    try {
      // Charger les documents du programme (questionnaires début/fin)
      const { data: docs, error: docsError } = await supabase
        .from('program_documents')
        .select('*')
        .eq('program_id', programId)
        .eq('is_published', true)
        .order('position')

      if (docsError) {
        console.log('Table program_documents non disponible:', docsError.message)
        setDocumentsLoaded(true)
        return
      }

      console.log('Documents chargés:', docs?.length || 0)
      setProgramDocuments(docs || [])
      setDocumentsLoaded(true)

      // Charger les soumissions de l'utilisateur
      if (docs && docs.length > 0) {
        const docIds = docs.map(d => d.id)
        const { data: submissions } = await supabase
          .from('program_document_submissions')
          .select('*')
          .eq('user_id', user.id)
          .in('document_id', docIds)

        const submissionsMap: Record<string, any> = {}
        submissions?.forEach(s => {
          submissionsMap[s.document_id] = s
        })
        setDocumentSubmissions(submissionsMap)

        // Générer les URLs publiques pour les documents avec template_file_path (bucket public)
        const urlsMap: Record<string, string> = {}
        for (const doc of docs) {
          if (doc.template_url) {
            // Utiliser l'URL stockée si elle existe
            urlsMap[doc.id] = doc.template_url
          } else if (doc.template_file_path) {
            // Générer l'URL publique depuis le chemin (bucket public)
            const { data } = supabase.storage
              .from('fillable-documents')
              .getPublicUrl(doc.template_file_path)
            if (data) {
              urlsMap[doc.id] = data.publicUrl
            }
          }
        }
        setDocumentUrls(urlsMap)
      }
    } catch (err) {
      console.error('Error fetching program documents:', err)
      setDocumentsLoaded(true)
    }
  }

  const fetchExpectedItems = async () => {
    if (!programId || !user) return

    try {
      // Charger les items attendus (TP, quiz, exercices)
      const { data: expectedItemsData, error: expectedItemsError } = await supabase
        .from('program_expected_items')
        .select(`
          *,
          items (
            id,
            title,
            type,
            module_id,
            is_control_tp,
            modules (
              id,
              title,
              course_id,
              courses (
                id,
                title
              )
            )
          )
        `)
        .eq('program_id', programId)
        .order('position', { ascending: true })

      if (expectedItemsError) {
        console.log('Table program_expected_items non disponible:', expectedItemsError.message)
        setExpectedItemsLoaded(true)
        return
      }

      console.log('Items attendus chargés:', expectedItemsData?.length || 0)
      console.log('📋 Détails des items:', expectedItemsData?.map((ei: any) => ({
        id: ei.items?.id,
        title: ei.items?.title,
        type: ei.items?.type,
        is_control_tp: ei.items?.is_control_tp
      })))
      setExpectedItems(expectedItemsData || [])
      setExpectedItemsLoaded(true)

      // Si formateur/admin, charger les soumissions pour les TP de contrôle
      // Attendre que le profil soit disponible
      if (profile) {
        const isTrainerOrAdmin = profile.role === 'admin' || profile.role === 'trainer' || profile.role === 'instructor'
        console.log('👤 Rôle utilisateur:', profile.role, 'isTrainerOrAdmin:', isTrainerOrAdmin)
        if (isTrainerOrAdmin && expectedItemsData) {
          const controlTpItems = expectedItemsData.filter((ei: any) => {
            const isControlTp = ei.items?.type === 'tp' && ei.items?.is_control_tp === true
            console.log('🔍 Vérification TP contrôle:', {
              itemId: ei.items?.id,
              title: ei.items?.title,
              type: ei.items?.type,
              is_control_tp: ei.items?.is_control_tp,
              isControlTp
            })
            return isControlTp
          })
          
          console.log('✅ TP de contrôle trouvés:', controlTpItems.length)
          if (controlTpItems.length > 0) {
            const itemIds = controlTpItems.map((ei: any) => ei.items.id)
            console.log('📝 Chargement des soumissions pour items:', itemIds)
            await fetchSubmissionsForItems(itemIds)
          }
        }
      } else {
        console.log('⏳ Profil non encore chargé, les soumissions seront chargées plus tard')
      }
    } catch (err) {
      console.error('Error fetching expected items:', err)
      setExpectedItemsLoaded(true)
    }
  }

  const fetchSubmissionsForItems = async (itemIds: string[]) => {
    if (itemIds.length === 0) return

    try {
      console.log('📥 Récupération des soumissions pour items:', itemIds)
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles (
            id,
            full_name,
            student_id
          )
        `)
        .in('item_id', itemIds)
        .order('submitted_at', { ascending: false })

      if (submissionsError) {
        console.error('❌ Error fetching submissions:', submissionsError)
        return
      }

      console.log('✅ Soumissions récupérées:', submissionsData?.length || 0)

      // Grouper les soumissions par item_id
      const submissionsByItem: Record<string, any[]> = {}
      submissionsData?.forEach((sub: any) => {
        if (!submissionsByItem[sub.item_id]) {
          submissionsByItem[sub.item_id] = []
        }
        submissionsByItem[sub.item_id].push(sub)
      })

      console.log('📊 Soumissions groupées par item:', Object.keys(submissionsByItem).length, 'items')
      setItemSubmissions(submissionsByItem)
    } catch (err) {
      console.error('❌ Error fetching submissions for items:', err)
    }
  }

  // Recharger les soumissions quand le profil devient disponible
  useEffect(() => {
    if (profile && expectedItems.length > 0) {
      const isTrainerOrAdmin = profile.role === 'admin' || profile.role === 'trainer' || profile.role === 'instructor'
      if (isTrainerOrAdmin) {
        // Récupérer les soumissions pour les TP de contrôle
        const controlTpItems = expectedItems.filter((ei: any) => 
          ei.items?.type === 'tp' && ei.items?.is_control_tp === true
        )
        // Récupérer les soumissions pour les TPs pas à pas
        const stepByStepTpItems = expectedItems.filter((ei: any) => {
          const item = ei.items
          return item?.type === 'tp' && 
                 (item.content?.type === 'step-by-step' || (item.content?.steps && Array.isArray(item.content.steps)))
        })
        
        // Combiner les deux types de TPs
        const allTpItems = [...controlTpItems, ...stepByStepTpItems]
        if (allTpItems.length > 0) {
          const itemIds = allTpItems.map((ei: any) => ei.items.id)
          fetchSubmissionsForItems(itemIds)
        }
      }
    }
  }, [profile, expectedItems])

  const fetchStudentGrades = async (filterByUserId?: string) => {
    if (!programId || !program) {
      console.log('❌ fetchStudentGrades: programId ou program manquant', { programId, program: program ? program.id : null })
      return
    }

    console.log('📊 Début du chargement des notes pour le programme:', programId, filterByUserId ? `(filtre: ${filterByUserId})` : '(tous les étudiants)')
    setGradesLoading(true)
    try {
      // 1. Récupérer les étudiants inscrits au programme
      // Si filterByUserId est fourni, ne récupérer que cet étudiant
      let enrollmentsQuery = supabase
        .from('program_enrollments')
        .select(`
          user_id,
          profiles (
            id,
            full_name,
            student_id
          )
        `)
        .eq('program_id', programId)
        .eq('status', 'active')
      
      if (filterByUserId) {
        enrollmentsQuery = enrollmentsQuery.eq('user_id', filterByUserId)
      }
      
      const { data: enrollments, error: enrollmentsError } = await enrollmentsQuery

      if (enrollmentsError) {
        console.error('❌ Error fetching enrollments:', enrollmentsError)
        setGradesLoading(false)
        return
      }

      if (!enrollments || enrollments.length === 0) {
        console.log('⚠️ Aucun étudiant inscrit au programme', { 
          filterByUserId, 
          programId,
          enrollmentsCount: enrollments?.length || 0 
        })
        setStudentGrades({})
        setGradesLoading(false)
        return
      }

      console.log('✅ Étudiants trouvés:', enrollments.length, { 
        filterByUserId,
        enrollments: enrollments.map((e: any) => ({ 
          userId: e.user_id, 
          name: e.profiles?.full_name || e.profiles?.student_id 
        }))
      })

      const userIds = enrollments.map(e => e.user_id)
      const gradesMap: Record<string, {
        profile: any;
        tpGrades: Record<string, number>;
        quizGrades: Record<string, number>;
        average: number;
      }> = {}

      // Initialiser les données pour chaque étudiant
      enrollments.forEach((e: any) => {
        if (e.profiles) {
          gradesMap[e.user_id] = {
            profile: e.profiles,
            tpGrades: {},
            quizGrades: {},
            average: 0
          }
        }
      })

      // 2. Récupérer les notes des TP (submissions avec grade)
      // D'abord, récupérer les itemIds des formations du programme
      const { data: programCoursesData } = await supabase
        .from('program_courses')
        .select('course_id')
        .eq('program_id', programId)

      if (programCoursesData && programCoursesData.length > 0) {
        const courseIds = programCoursesData.map(pc => pc.course_id)
        
        // Récupérer tous les items de ces formations
        const { data: modulesData } = await supabase
          .from('modules')
          .select('id')
          .in('course_id', courseIds)

        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map(m => m.id)
          
          // Récupérer les items de type TP
          const { data: itemsData } = await supabase
            .from('items')
            .select('id, title')
            .in('module_id', moduleIds)
            .eq('type', 'tp')

          if (itemsData && itemsData.length > 0) {
            const itemIds = itemsData.map(i => i.id)
            
            // Récupérer les soumissions avec notes pour ces items
            const { data: submissionsData } = await supabase
              .from('submissions')
              .select('user_id, item_id, grade, items (id, title)')
              .in('user_id', userIds)
              .in('item_id', itemIds)
              .eq('status', 'graded')
              .not('grade', 'is', null)

            submissionsData?.forEach((sub: any) => {
              if (sub.user_id && sub.grade !== null && sub.items) {
                if (!gradesMap[sub.user_id]) return
                gradesMap[sub.user_id].tpGrades[sub.item_id] = sub.grade
              }
            })
          }
        }
      }

      // 3. Récupérer les notes des Quiz/Évaluations (program_evaluation_attempts)
      const { data: evaluationsData } = await supabase
        .from('program_evaluations')
        .select('id, title')
        .eq('program_id', programId)
        .eq('is_published', true)

      if (evaluationsData && evaluationsData.length > 0) {
        const evalIds = evaluationsData.map(e => e.id)
        
        // Récupérer les meilleures tentatives pour chaque étudiant
        const { data: attemptsData } = await supabase
          .from('program_evaluation_attempts')
          .select('user_id, evaluation_id, percentage')
          .in('user_id', userIds)
          .in('evaluation_id', evalIds)

        // Garder le meilleur résultat par évaluation pour chaque étudiant
        const bestAttempts: Record<string, Record<string, number>> = {}
        attemptsData?.forEach((attempt: any) => {
          if (!bestAttempts[attempt.user_id]) {
            bestAttempts[attempt.user_id] = {}
          }
          const currentBest = bestAttempts[attempt.user_id][attempt.evaluation_id]
          // Convertir le pourcentage en note sur 20
          const scoreOn20 = (attempt.percentage / 100) * 20
          if (!currentBest || scoreOn20 > currentBest) {
            bestAttempts[attempt.user_id][attempt.evaluation_id] = scoreOn20
          }
        })

        // Ajouter les notes aux gradesMap
        Object.keys(bestAttempts).forEach(userId => {
          if (gradesMap[userId]) {
            gradesMap[userId].quizGrades = bestAttempts[userId]
          }
        })
      }

      // 4. Calculer les moyennes selon evaluations_config
      const evalConfig = program.evaluations_config
      if (evalConfig && evalConfig.items) {
        Object.keys(gradesMap).forEach(userId => {
          const student = gradesMap[userId]
          let totalWeightedScore = 0
          let totalWeight = 0

          evalConfig.items.forEach((item: any) => {
            const weight = item.weight || 1
            let score: number | null = null

            // Chercher la note dans les TP (itemId correspond à un item_id)
            if (student.tpGrades[item.itemId] !== undefined) {
              score = student.tpGrades[item.itemId]
            }
            // Chercher la note dans les Quiz (itemId correspond à une evaluation_id)
            else if (student.quizGrades[item.itemId] !== undefined) {
              score = student.quizGrades[item.itemId]
            }

            if (score !== null) {
              totalWeightedScore += score * weight
              totalWeight += weight
            }
          })

          if (totalWeight > 0) {
            // Arrondir à 2 décimales en utilisant toFixed puis parseFloat pour éviter les erreurs de précision
            student.average = parseFloat((totalWeightedScore / totalWeight).toFixed(2))
          }
        })
      }

      setStudentGrades(gradesMap)
    } catch (err) {
      console.error('Error fetching student grades:', err)
    } finally {
      setGradesLoading(false)
    }
  }

  const handleDocumentSubmit = async (docId: string, doc: any) => {
    const file = selectedFiles[docId]
    if (!file || !user) return

    setUploadingDoc(docId)
    try {
      // Vérifier que l'utilisateur est bien authentifié
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        throw new Error('Vous devez être connecté pour soumettre un document')
      }

      // Vérifier que l'utilisateur correspond
      if (authUser.id !== user.id) {
        throw new Error('Erreur d\'authentification : l\'utilisateur ne correspond pas')
      }

      const fileExt = file.name.split('.').pop()
      // Utiliser le format submissions/ pour correspondre aux politiques RLS
      // Format: submissions/{program_id}/{user_id}/{document_id}/{timestamp}.{ext}
      const filePath = `submissions/${programId}/${user.id}/${docId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('fillable-documents')
        .upload(filePath, file)

      if (uploadError) {
        // Messages d'erreur plus explicites
        if (uploadError.message?.includes('new row violates row-level security')) {
          throw new Error('Erreur de permissions : vous n\'avez pas les droits pour uploader ce document. Vérifiez que vous êtes bien inscrit au programme.')
        }
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
          throw new Error('Le bucket "fillable-documents" n\'existe pas. Veuillez contacter l\'administrateur.')
        }
        throw uploadError
      }

      const { error: insertError } = await supabase
        .from('program_document_submissions')
        .insert({
          document_id: docId,
          user_id: user.id,
          program_id: programId,
          file_path: filePath,
          file_name: file.name,
          submitted_at: new Date().toISOString()
        })

      if (insertError) {
        // Messages d'erreur plus explicites pour les erreurs de table
        if (insertError.message?.includes('new row violates row-level security')) {
          throw new Error('Erreur de permissions : vous n\'avez pas les droits pour soumettre ce document. Vérifiez que vous êtes bien inscrit au programme.')
        }
        throw insertError
      }

      setSelectedFiles(prev => ({ ...prev, [docId]: null }))
      fetchProgramDocuments()
    } catch (err: any) {
      console.error('Error submitting document:', err)
      alert(err.message || 'Erreur lors de la soumission du document')
    } finally {
      setUploadingDoc(null)
    }
  }

  const fetchProgram = async () => {
    try {
      setError('')

      // Récupérer le programme
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single()

      if (programError) {
        if (programError.code === 'PGRST116') {
          setError('Programme introuvable.')
        } else {
          throw programError
        }
        return
      }

      setProgram(programData)

      // Vérifier l'accès au programme (seulement si pas admin)
      if (profile?.role !== 'admin' && user?.id && programData) {
        // Vérifier si l'utilisateur est le créateur
        if (programData.created_by === user.id) {
          // Le créateur a toujours accès
        }
        // Vérifier si le programme est gratuit et publié
        else if (programData.access_type === 'free' && programData.status === 'published') {
          // Les programmes gratuits et publiés sont accessibles à tous
        }
        // Sinon, vérifier l'inscription
        else {
          const { data: enrollment } = await supabase
            .from('program_enrollments')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('program_id', programId)
            .eq('status', 'active')
            .single()

          if (!enrollment) {
            setError('Vous n\'avez pas accès à ce programme.')
            return
          }
        }
      }

      // Récupérer les formations du programme dans l'ordre
      // On récupère d'abord les program_courses, puis les courses séparément pour éviter les problèmes RLS
      const { data: programCoursesData, error: programCoursesError } = await supabase
        .from('program_courses')
        .select('*')
        .eq('program_id', programId)
        .order('position', { ascending: true })

      console.log('Program courses data:', programCoursesData)
      console.log('Program courses error:', programCoursesError)

      if (programCoursesError) {
        console.error('Error fetching program courses:', programCoursesError)
        setError(`Erreur lors du chargement des formations du programme: ${programCoursesError.message || 'Erreur inconnue'}`)
        setProgramCourses([])
      } else if (!programCoursesData || programCoursesData.length === 0) {
        console.log('No program courses found for program:', programId)
        setProgramCourses([])
      } else {
        // Récupérer les détails des formations séparément
        const courseIds = programCoursesData.map(pc => pc.course_id)
        console.log('Course IDs to fetch:', courseIds)
        
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds)

        console.log('Courses data:', coursesData)
        console.log('Courses error:', coursesError)

        if (coursesError) {
          console.error('Error fetching courses:', coursesError)
          setError(`Erreur lors du chargement des formations: ${coursesError.message || 'Erreur inconnue'}`)
        }

        // Créer un map pour accéder rapidement aux courses
        const coursesMap = new Map((coursesData || []).map(c => [c.id, c]))
        console.log('Courses map:', Array.from(coursesMap.entries()))

        // Combiner les données
        const formatted = programCoursesData.map((pc: any) => {
          const course = coursesMap.get(pc.course_id) || null
          console.log(`Program course ${pc.id}: course_id=${pc.course_id}, found=${!!course}`)
          return {
            ...pc,
            courses: course
          }
        }).filter((pc: any) => pc.courses !== null) // Filtrer les formations qui n'existent plus

        console.log('Formatted program courses:', formatted)
        setProgramCourses(formatted)
      }

    } catch (error) {
      console.error('Error fetching program:', error)
      setError(`Erreur lors du chargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadMarkdown = async () => {
    if (!programId || !user) {
      alert('Vous devez être connecté pour télécharger le Markdown.')
      return
    }

    setDownloadingMarkdown(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const fullUrl = `${apiUrl}/api/courses/programs/${programId}/markdown`

      console.log('📥 Début du téléchargement Markdown du programme...')

      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Vous devez être connecté pour télécharger le Markdown.')
      }

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()

      if (!blob || blob.size === 0) {
        throw new Error('Le fichier Markdown généré est vide. Vérifiez les logs du serveur.')
      }

      // Télécharger le fichier
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${program?.title?.replace(/[^a-z0-9]/gi, '_') || 'programme'}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      console.log('✅ Markdown du programme téléchargé avec succès')
    } catch (error: any) {
      console.error('❌ Erreur lors du téléchargement du Markdown du programme:', error)
      
      const errorMessage = error.message || 'Erreur inconnue lors du téléchargement du Markdown'
      
      // Messages d'erreur spécifiques
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        const fullMessage = 
          'Impossible de se connecter au serveur backend.\n\n' +
          'Pour télécharger le Markdown, vous devez démarrer le serveur backend :\n\n' +
          '1. Ouvrez un terminal dans le dossier portal-formations/server\n' +
          '2. Exécutez: npm install (si nécessaire)\n' +
          '3. Exécutez: npm run dev:server\n\n' +
          'Le serveur doit être accessible sur http://localhost:3001'
        
        alert(`Erreur lors du téléchargement du Markdown :\n\n${fullMessage}`)
      } else {
        alert(`Erreur lors du téléchargement du Markdown :\n\n${errorMessage}\n\nConsultez les logs du serveur backend pour plus d'informations.`)
      }
    } finally {
      setDownloadingMarkdown(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!programId || !user) {
      alert('Vous devez être connecté pour télécharger le PDF.')
      return
    }

    setDownloadingPdf(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const fullUrl = `${apiUrl}/api/courses/programs/${programId}/pdf`

      console.log('📥 Début du téléchargement PDF du programme...')

      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Vous devez être connecté pour télécharger le PDF.')
      }

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}: ${response.statusText}`)
      }

      // Vérifier le Content-Type
      const contentType = response.headers.get('Content-Type')
      console.log('Content-Type reçu:', contentType)

      if (!contentType?.includes('application/pdf')) {
        const text = await response.text()
        console.error('Réponse non-PDF:', text.substring(0, 500))
        throw new Error(`Le serveur n'a pas renvoyé un PDF. Content-Type: ${contentType}`)
      }

      const arrayBuffer = await response.arrayBuffer()

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Le fichier PDF généré est vide.')
      }

      console.log('Taille du PDF reçu:', arrayBuffer.byteLength, 'bytes')

      // Créer le blob à partir de l'ArrayBuffer
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' })

      // Télécharger le fichier
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${program?.title?.replace(/[^a-z0-9]/gi, '_') || 'programme'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      console.log('✅ PDF du programme téléchargé avec succès')
    } catch (error: any) {
      console.error('❌ Erreur lors du téléchargement du PDF du programme:', error)

      const errorMessage = error.message || 'Erreur inconnue lors du téléchargement du PDF'

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        const fullMessage =
          'Impossible de se connecter au serveur backend.\n\n' +
          'Pour télécharger le PDF, vous devez démarrer le serveur backend :\n\n' +
          '1. Ouvrez un terminal dans le dossier portal-formations/server\n' +
          '2. Exécutez: npm install (si nécessaire)\n' +
          '3. Exécutez: npm run dev\n\n' +
          'Le serveur doit être accessible sur http://localhost:3001'

        alert(`Erreur lors du téléchargement du PDF :\n\n${fullMessage}`)
      } else {
        alert(`Erreur lors du téléchargement du PDF :\n\n${errorMessage}\n\nConsultez les logs du serveur backend pour plus d'informations.`)
      }
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !program) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <Link
            to="/app"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la bibliothèque
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      {/* Header du programme */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to="/app"
            className="inline-flex items-center text-purple-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la bibliothèque
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-8 h-8" />
            <span className="text-purple-200 text-sm font-medium">Programme</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            {program?.title}
          </h1>
          {program?.description && (
            <p className="text-xl text-purple-100 max-w-3xl">
              {program.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className={`w-5 h-5 ${downloadingPdf ? 'animate-spin' : ''}`} />
              {downloadingPdf ? 'Génération du PDF...' : 'Télécharger en PDF'}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              disabled={downloadingMarkdown}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`w-5 h-5 ${downloadingMarkdown ? 'animate-spin' : ''}`} />
              {downloadingMarkdown ? 'Génération...' : 'Télécharger en Markdown'}
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Section Notes des étudiants et Évaluations - Côte à côte */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section Notes des étudiants */}
          {(() => {
            // Afficher la section uniquement si:
            // - L'utilisateur est admin/trainer (voit toutes les notes)
            // - L'utilisateur est étudiant (voit uniquement sa note)
            const userRole = profile?.role
            const isAdminOrTrainer = isAdmin || userRole === 'admin' || userRole === 'trainer' || userRole === 'instructor'
            const isStudentUser = isStudent || userRole === 'student'
            const shouldShow = !!user && (isAdminOrTrainer || isStudentUser)
            
            console.log('📊 Affichage section notes - Debug:', {
              user: user ? { id: user.id } : null,
              profile: profile ? { id: profile.id, role: profile.role } : null,
              isAdmin,
              isStudent,
              isAdminOrTrainer,
              shouldShow,
              studentGradesCount: Object.keys(studentGrades).length,
              gradesLoading,
              evaluationsConfig: program?.evaluations_config ? {
                hasItems: !!program.evaluations_config.items,
                itemsCount: program.evaluations_config.items?.length || 0,
                items: program.evaluations_config.items
              } : null
            })
            return shouldShow
          })() && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {(isAdmin || (profile && (profile.role === 'trainer' || profile.role === 'instructor')))
                    ? 'Notes des étudiants' 
                    : 'Mes notes'}
                </h3>
                <p className="text-sm text-gray-500">
                  {(isAdmin || (profile && (profile.role === 'trainer' || profile.role === 'instructor')))
                    ? 'Vue d\'ensemble des notes avec moyenne calculée automatiquement'
                    : 'Votre progression et vos résultats'}
                </p>
              </div>
            </div>

            {gradesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement des notes...</p>
              </div>
            ) : Object.keys(studentGrades).length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>
                  {(isAdmin || (profile && (profile.role === 'trainer' || profile.role === 'instructor')))
                    ? 'Aucun étudiant inscrit au programme'
                    : gradesLoading 
                      ? 'Chargement de vos notes...'
                      : 'Aucune note disponible pour le moment. Assurez-vous d\'être inscrit au programme et d\'avoir complété des évaluations.'}
                </p>
              </div>
            ) : (() => {
              // Colonnes affichées = items config + tous les quiz du programme non encore dans la config
              const configItems = program?.evaluations_config?.items ?? []
              const configItemIds = new Set(configItems.map((it: { itemId: string }) => it.itemId))
              const extraQuizColumns = evaluations
                .filter((e) => !configItemIds.has(e.id))
                .map((e) => ({ itemId: e.id, title: e.title, weight: 1, threshold: 10 }))
              const displayItems = [...configItems, ...extraQuizColumns]
              const hasDisplayColumns = displayItems.length > 0

              if (!hasDisplayColumns) {
                return (
                  <div className="text-center py-6 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium mb-1">Configuration manquante</p>
                    <p className="text-sm">Veuillez configurer les évaluations dans les paramètres du programme (Pédagogie → Configuration des évaluations) pour afficher les notes</p>
                    <Link
                      to={`/admin/programs/${programId}`}
                      className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Configurer les évaluations
                    </Link>
                  </div>
                )
              }

              return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {(isAdmin || (profile && (profile.role === 'trainer' || profile.role === 'instructor'))) && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Étudiant
                        </th>
                      )}
                      {displayItems.map((item: { itemId: string; title: string; weight?: number }) => (
                        <th key={item.itemId} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {item.title}
                          {item.weight && item.weight !== 1 && (
                            <span className="ml-1 text-gray-400">(×{item.weight})</span>
                          )}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                        Moyenne
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.values(studentGrades).map((student) => (
                      <tr key={student.profile.id} className="hover:bg-gray-50">
                        {(isAdmin || (profile && (profile.role === 'trainer' || profile.role === 'instructor'))) && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.profile.full_name || student.profile.student_id || 'Étudiant'}
                              </div>
                              {student.profile.student_id && (
                                <div className="text-xs text-gray-500">{student.profile.student_id}</div>
                              )}
                            </div>
                          </td>
                        )}
                        {displayItems.map((item: { itemId: string; threshold?: number }) => {
                          const tpGrade = student.tpGrades[item.itemId]
                          const quizGrade = student.quizGrades[item.itemId]
                          const grade = tpGrade !== undefined ? tpGrade : (quizGrade !== undefined ? quizGrade : null)
                          return (
                            <td key={item.itemId} className="px-4 py-3 whitespace-nowrap">
                              {grade != null ? (
                                <span className={`text-sm font-medium ${
                                  grade >= (item.threshold ?? 10) ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {Number(grade).toFixed(1)}/20
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 whitespace-nowrap bg-green-50">
                          <span className={`text-sm font-bold ${
                            student.average >= (program?.evaluations_config?.passingScore ?? 10) ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {student.average > 0 ? `${Number(student.average).toFixed(1)}/20` : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )
            })()}
            </div>
          )}

          {/* Section Évaluations */}
          {evaluationsLoaded && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Évaluations du programme</h3>
                <p className="text-sm text-gray-500">Testez vos connaissances</p>
              </div>
            </div>
            {evaluations.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune évaluation disponible pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {evaluations.map(evaluation => {
                  const attempt = evaluationAttempts[evaluation.id]
                  return (
                    <div
                      key={evaluation.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {attempt?.passed ? (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Award className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{evaluation.title}</h4>
                          <p className="text-sm text-gray-500">
                            {evaluation.questions?.length || 0} questions • Score min: {Number(evaluation.passing_score ?? 0).toFixed(0)}%
                            {attempt && (
                              <span className={`ml-2 ${attempt.passed ? 'text-green-600' : 'text-orange-600'}`}>
                                • Votre score: {Number(attempt.percentage).toFixed(0)}%
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/programs/${programId}/evaluation/${evaluation.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        {attempt ? 'Réessayer' : 'Commencer'}
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
            </div>
          )}
        </div>

        {/* Section Items attendus (TP, Quiz, Exercices) */}
        {expectedItemsLoaded && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">TP, Quiz et Exercices</h3>
                <p className="text-sm text-gray-500">Accédez directement aux activités du programme</p>
                {/* Debug info */}
                <p className="text-xs text-gray-400 mt-1">
                  {expectedItems.length} item(s) chargé(s)
                </p>
              </div>
            </div>
            {expectedItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun TP, quiz ou exercice disponible pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expectedItems.map((expectedItem: any, index: number) => {
                  console.log(`🔍 [${index}] Processing expectedItem:`, expectedItem)
                  const item = expectedItem.items
                  console.log(`📦 [${index}] Item extracted:`, item)
                  if (!item || !item.id) {
                    console.warn(`⚠️ [${index}] Item invalide ou manquant:`, { expectedItem, item })
                    return (
                      <div key={expectedItem.id || index} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                        <p className="text-red-700 text-sm">
                          ⚠️ Item invalide: {JSON.stringify({ expectedItem, item })}
                        </p>
                      </div>
                    )
                  }
                  
                  // Log pour débogage
                  if (item.type === 'tp') {
                    console.log('🔍 TP trouvé:', {
                      itemId: item.id,
                      title: item.title,
                      type: item.type,
                      is_control_tp: item.is_control_tp,
                      is_control_tp_type: typeof item.is_control_tp,
                      raw_item: item,
                      expectedItem_raw: expectedItem
                    })
                  }
                  
                  // Si is_control_tp n'est pas récupéré, le récupérer directement
                  let isControlTp = item.is_control_tp
                  if (item.type === 'tp' && isControlTp === undefined) {
                    // Essayer de récupérer depuis expectedItem directement
                    isControlTp = expectedItem.items?.is_control_tp
                  }

                  const getItemTypeIcon = (type: string) => {
                    switch (type) {
                      case 'tp':
                        return <FileText className="w-5 h-5 text-blue-600" />
                      case 'quiz':
                        return <ClipboardCheck className="w-5 h-5 text-green-600" />
                      case 'exercise':
                        return <AlertCircle className="w-5 h-5 text-orange-600" />
                      case 'game':
                        return <Award className="w-5 h-5 text-purple-600" />
                      default:
                        return <FileText className="w-5 h-5 text-gray-600" />
                    }
                  }

                  const getItemTypeLabel = (type: string) => {
                    switch (type) {
                      case 'tp':
                        return 'TP'
                      case 'quiz':
                        return 'Quiz'
                      case 'exercise':
                        return 'Exercice'
                      case 'game':
                        return 'Jeu'
                      default:
                        return type
                    }
                  }

                  return (
                    <div key={expectedItem.id}>
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3 flex-1">
                          {getItemTypeIcon(item.type)}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {getItemTypeLabel(item.type)}
                              </span>
                              {expectedItem.is_required && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                  Obligatoire
                                </span>
                              )}
                              {item.modules?.courses && (
                                <span className="text-xs text-gray-500">
                                  Cours: {item.modules.courses.title}
                                </span>
                              )}
                              {expectedItem.due_date && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Échéance: {new Date(expectedItem.due_date).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.id ? (
                            <Link
                              to={`/items/${item.id}`}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                            >
                              Accéder
                            </Link>
                          ) : (
                            <span className="text-red-500 text-sm">Erreur: ID manquant</span>
                          )}
                        {/* Pour les formateurs/admins et les TP de contrôle ou pas à pas, afficher un bouton pour voir les soumissions/progression */}
                        {(() => {
                          const isTrainerOrAdmin = profile?.role === 'admin' || profile?.role === 'trainer' || profile?.role === 'instructor'
                          const isTp = item.type === 'tp'
                          // Vérifier is_control_tp (peut être true, false, ou undefined)
                          const itemIsControlTp = isControlTp === true || (item as any).is_control_tp === true
                          // Vérifier si c'est un TP pas à pas
                          const isStepByStepTp = item.content?.type === 'step-by-step' || (item.content?.steps && Array.isArray(item.content.steps))
                          const shouldShow = isTrainerOrAdmin && isTp && (itemIsControlTp || isStepByStepTp)
                          
                          return shouldShow ? (
                            <button
                              onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                              className={`px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 ${
                                isStepByStepTp 
                                  ? 'bg-blue-600 hover:bg-blue-700' 
                                  : 'bg-yellow-600 hover:bg-yellow-700'
                              }`}
                            >
                              {isStepByStepTp ? (
                                <>
                                  <TrendingUp className="w-4 h-4" />
                                  Voir la progression ({itemSubmissions[item.id]?.length || 0})
                                </>
                              ) : (
                                <>
                                  <Users className="w-4 h-4" />
                                  Voir les soumissions ({itemSubmissions[item.id]?.length || 0})
                                </>
                              )}
                            </button>
                          ) : null
                        })()}
                        </div>
                      </div>
                      {/* Liste des soumissions (pour formateurs/admins) - TP de contrôle */}
                      {expandedItemId === item.id && 
                       (profile?.role === 'admin' || profile?.role === 'trainer' || profile?.role === 'instructor') &&
                       item.type === 'tp' && (item as any).is_control_tp && !(item.content?.type === 'step-by-step' || (item.content?.steps && Array.isArray(item.content.steps))) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 px-4 pb-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Soumissions des étudiants</h5>
                          {!itemSubmissions[item.id] || itemSubmissions[item.id].length === 0 ? (
                            <p className="text-sm text-gray-500 italic">Aucune soumission pour le moment</p>
                          ) : (
                            <div className="space-y-2">
                              {itemSubmissions[item.id].map((submission: any) => (
                                <div
                                  key={submission.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {submission.profiles?.full_name || submission.profiles?.student_id || 'Étudiant inconnu'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        submission.status === 'graded'
                                          ? 'bg-green-100 text-green-700'
                                          : submission.status === 'submitted'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {submission.status === 'graded' ? 'Noté' : submission.status === 'submitted' ? 'Soumis' : 'Brouillon'}
                                      </span>
                                      {submission.grade !== null && (
                                        <span className="text-xs font-medium text-gray-700">
                                          Note: {Number(submission.grade).toFixed(1)}/20
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString('fr-FR') : 'Non soumis'}
                                      </span>
                                    </div>
                                  </div>
                                  <Link
                                    to={`/items/${item.id}?userId=${submission.user_id}`}
                                    className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
                                  >
                                    Noter
                                  </Link>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Vue de progression pour les TPs pas à pas (pour formateurs/admins) */}
                      {expandedItemId === item.id && 
                       (profile?.role === 'admin' || profile?.role === 'trainer' || profile?.role === 'instructor') &&
                       item.type === 'tp' && 
                       (item.content?.type === 'step-by-step' || (item.content?.steps && Array.isArray(item.content.steps))) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 px-4 pb-4">
                          <StepByStepTpProgressViewer
                            itemId={item.id}
                            courseId={item.modules?.courses?.id || undefined}
                            sessionId={undefined}
                          />
                        </div>
                      )}

                      {/* Commentaires par partie pour les TP New (pour formateurs/admins) */}
                      {expandedItemId === item.id && 
                       (profile?.role === 'admin' || profile?.role === 'trainer' || profile?.role === 'instructor') &&
                       item.type === 'tp' && 
                       item.content?.type === 'tp-new' && (
                        <div className="mt-4 pt-4 border-t border-indigo-200 px-4 pb-4 bg-indigo-50/50 rounded-lg">
                          <TpNewCommentsViewer
                            itemId={item.id}
                            courseId={item.modules?.courses?.id || undefined}
                            sessionId={undefined}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Section Documents / Questionnaires */}
        {documentsLoaded && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Documents à compléter</h3>
                <p className="text-sm text-gray-500">Téléchargez, remplissez et soumettez</p>
              </div>
            </div>
            {programDocuments.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun document à compléter pour le moment</p>
              </div>
            ) : (
            <div className={`grid grid-cols-1 ${programDocuments.length >= 2 ? 'md:grid-cols-2' : ''} gap-4`}>
              {programDocuments.map(doc => {
                const submission = documentSubmissions[doc.id]
                return (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{doc.title}</h4>
                          {doc.is_required && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Obligatoire</span>
                          )}
                          {doc.timing === 'start' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Début de parcours</span>
                          )}
                          {doc.timing === 'end' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Fin de parcours</span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                        )}
                        {doc.due_date && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Échéance: {new Date(doc.due_date).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      {submission && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Soumis
                        </span>
                      )}
                    </div>

                    {/* Télécharger le template */}
                    {(doc.template_url || doc.template_file_path) && (
                      <a
                        href={documentUrls[doc.id] || doc.template_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 mb-3"
                        download
                      >
                        <Download className="w-4 h-4" />
                        Télécharger le document
                      </a>
                    )}

                    {/* Zone de soumission */}
                    {(!submission || doc.allow_resubmission) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <FileUpload
                          onFileSelect={(file) => setSelectedFiles(prev => ({ ...prev, [doc.id]: file }))}
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          maxSize={50}
                        />
                        {selectedFiles[doc.id] && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-green-600">
                              ✓ {selectedFiles[doc.id]!.name}
                            </span>
                            <button
                              onClick={() => handleDocumentSubmit(doc.id, doc)}
                              disabled={uploadingDoc === doc.id}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50"
                            >
                              {uploadingDoc === doc.id ? 'Envoi...' : 'Soumettre'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Soumission existante */}
                    {submission && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                        Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )}

        {/* Lien vers le glossaire */}
        {program?.glossary && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Book className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Glossaire du programme
                  </h3>
                  <p className="text-sm text-gray-600">
                    Consultez les définitions et exemples des termes utilisés dans ce programme
                  </p>
                </div>
              </div>
              <Link
                to={`/programs/${programId}/glossary`}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <Book className="w-5 h-5" />
                Ouvrir le glossaire
              </Link>
            </div>
          </div>
        )}

        {programCourses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              Ce programme ne contient aucune formation pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Formations du programme ({programCourses.length})
              </h2>
              <p className="text-gray-600 mb-6">
                Les formations sont présentées dans l'ordre recommandé. Suivez-les dans l'ordre pour une progression optimale.
              </p>

              <div className="space-y-4">
                {programCourses.map((pc, index) => {
                  const course = pc.courses as Course | null
                  
                  // Si la formation n'existe pas, ne pas l'afficher
                  if (!course || !course.id) {
                    return null
                  }
                  
                  return (
                    <div
                      key={pc.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-900 mb-2">
                                {course.title || 'Formation sans titre'}
                              </h3>
                              {course.description && (
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                  {course.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  course.status === 'published'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {course.status === 'published' ? 'Publié' : 'Brouillon'}
                                </span>
                                {course.access_type === 'paid' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    💰 {course.price_cents ? `${course.price_cents / 100}€` : 'Payant'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {profile && (profile.role === 'admin' || profile.role === 'trainer' || profile.role === 'instructor') && (
                                <Link
                                  to={`/admin/courses/${course.id}`}
                                  className="btn-secondary inline-flex items-center space-x-2"
                                  title="Éditer la formation"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span>Éditer</span>
                                </Link>
                              )}
                              <Link
                                to={`/courses/${course.id}`}
                                className="btn-primary inline-flex items-center space-x-2"
                              >
                                <span>Accéder</span>
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

