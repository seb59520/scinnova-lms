import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Course, Chapter } from '../../types/database'
import { Plus, Edit, Eye, Trash2, Users, Code, BookOpen, Search, Filter, MoreVertical, Copy, Calendar, DollarSign, LayoutGrid, List, FileText, Presentation, Sparkles, ArrowUpDown, Layers, PenTool, ChevronRight, ChevronDown, Image as ImageIcon } from 'lucide-react'

type SortOption = 'title-asc' | 'title-desc' | 'date-asc' | 'date-desc' | 'status-asc' | 'status-desc' | 'access-asc' | 'access-desc'
type GroupByOption = 'none' | 'status' | 'access_type' | 'created_at'

interface Program {
  id: string
  title: string
}

interface CourseWithPrograms extends Course {
  programs?: Program[]
}

interface CourseItem {
  id: string
  title: string
  type: 'tp' | 'exercise'
  module_id: string
  module_title?: string
  isDirectAssociation?: boolean // Indique si c'est une association directe via course_tps
}

export function AdminCoursesContent() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [coursePrograms, setCoursePrograms] = useState<Record<string, Program[]>>({})
  const [courseItems, setCourseItems] = useState<Record<string, CourseItem[]>>({})
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [showTpInMainList, setShowTpInMainList] = useState<boolean>(() => {
    const saved = localStorage.getItem('admin-courses-show-tp-main-list')
    return saved === 'true'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'paid' | 'invite'>('all')
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem('admin-courses-content-sort')
    return (saved as SortOption) || 'date-desc'
  })
  const [groupBy, setGroupBy] = useState<GroupByOption>(() => {
    const saved = localStorage.getItem('admin-courses-content-group')
    return (saved as GroupByOption) || 'none'
  })
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('admin-courses-view-mode')
    return (saved as 'grid' | 'list') || 'grid'
  })
  const [presentationMode, setPresentationMode] = useState(false)
  const [presentationChapters, setPresentationChapters] = useState<Chapter[]>([])
  const [presentationInitialIndex, setPresentationInitialIndex] = useState(0)
  const [presentationCourseId, setPresentationCourseId] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // Ignorer les erreurs d'abort
        if (error.message?.includes('aborted') || error.message?.includes('AbortError')) {
          console.log('⚠️ Requête annulée (composant démonté)')
          return
        }
        throw error
      }
      
      setCourses(data || [])
      setFilteredCourses(data || [])

      // Récupérer les programmes associés à chaque formation
      if (data && data.length > 0) {
        const courseIds = data.map(c => c.id)
        
        const { data: programCoursesData, error: programCoursesError } = await supabase
          .from('program_courses')
          .select(`
            course_id,
            programs (
              id,
              title
            )
          `)
          .in('course_id', courseIds)

        if (programCoursesError) {
          // Ignorer les erreurs d'abort
          if (!programCoursesError.message?.includes('aborted') && !programCoursesError.message?.includes('AbortError')) {
            console.error('Error fetching program courses:', programCoursesError)
          }
        } else {
          // Organiser les programmes par cours
          const programsByCourse: Record<string, Program[]> = {}
          
          programCoursesData?.forEach((pc: any) => {
            if (pc.course_id && pc.programs) {
              if (!programsByCourse[pc.course_id]) {
                programsByCourse[pc.course_id] = []
              }
              programsByCourse[pc.course_id].push({
                id: pc.programs.id,
                title: pc.programs.title
              })
            }
          })
          
          setCoursePrograms(programsByCourse)
        }

        // Récupérer les modules et items (TP et exercices) pour TOUTES les formations en parallèle
        // Optimisation: requêtes groupées au lieu de requêtes séquentielles
        
        // 1. Récupérer TOUS les modules de tous les cours en une seule requête
        const { data: allModulesData } = await supabase
          .from('modules')
          .select('id, title, course_id')
          .in('course_id', courseIds)
          .order('position', { ascending: true })

        // Créer un map course_id -> modules
        const modulesByCourse = new Map<string, Array<{ id: string; title: string }>>()
        const allModuleIds: string[] = []
        
        allModulesData?.forEach(m => {
          if (!modulesByCourse.has(m.course_id)) {
            modulesByCourse.set(m.course_id, [])
          }
          modulesByCourse.get(m.course_id)!.push({ id: m.id, title: m.title })
          allModuleIds.push(m.id)
        })

        // 2. Récupérer TOUS les items TP/exercices de tous les modules en une seule requête
        let allItemsData: any[] = []
        if (allModuleIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('items')
            .select('id, title, type, module_id')
            .in('module_id', allModuleIds)
            .in('type', ['tp', 'exercise'])
            .order('position', { ascending: true })
          
          allItemsData = itemsData || []
        }

        // 3. Récupérer TOUTES les associations course_tps en une seule requête
        const { data: allDirectTpsData } = await supabase
          .from('course_tps')
          .select(`
            course_id,
            item_id,
            items (
              id,
              title,
              type
            )
          `)
          .in('course_id', courseIds)
          .eq('is_visible', true)
          .order('position', { ascending: true })

        // 4. Récupérer les cours qui sont des TP complets (pour exclusion)
        const allItemIds = [
          ...allItemsData.map(i => i.id),
          ...(allDirectTpsData?.filter(ct => ct.items).map(ct => (ct.items as any).id) || [])
        ]
        
        let tpCourseIdsToExclude = new Set<string>()
        if (allItemIds.length > 0) {
          const { data: coursesAsItems } = await supabase
            .from('courses')
            .select('id, title')
            .in('id', allItemIds)
          
          tpCourseIdsToExclude = new Set(
            coursesAsItems
              ?.filter(c => c.title?.trim().toUpperCase().startsWith('TP'))
              .map(c => c.id) || []
          )
        }

        // 5. Assembler les données par cours
        const itemsByCourse: Record<string, CourseItem[]> = {}
        
        // Créer un map module_id -> course_id
        const moduleToCourse = new Map<string, string>()
        const moduleTitles = new Map<string, string>()
        allModulesData?.forEach(m => {
          moduleToCourse.set(m.id, m.course_id)
          moduleTitles.set(m.id, m.title)
        })

        // Traiter les items des modules
        allItemsData.forEach(item => {
          if (tpCourseIdsToExclude.has(item.id)) return // Exclure les cours TP
          
          const courseId = moduleToCourse.get(item.module_id)
          if (!courseId) return
          
          if (!itemsByCourse[courseId]) {
            itemsByCourse[courseId] = []
          }
          
          itemsByCourse[courseId].push({
            id: item.id,
            title: item.title,
            type: item.type as 'tp' | 'exercise',
            module_id: item.module_id,
            module_title: moduleTitles.get(item.module_id)
          })
        })

        // Traiter les TP associés directement
        allDirectTpsData?.forEach(ct => {
          if (!ct.items || (ct.items as any).type !== 'tp') return
          const itemId = (ct.items as any).id
          if (tpCourseIdsToExclude.has(itemId)) return // Exclure les cours TP
          
          if (!itemsByCourse[ct.course_id]) {
            itemsByCourse[ct.course_id] = []
          }
          
          // Éviter les doublons
          if (!itemsByCourse[ct.course_id].some(i => i.id === itemId)) {
            itemsByCourse[ct.course_id].push({
              id: itemId,
              title: (ct.items as any).title,
              type: 'tp' as const,
              module_id: '',
              module_title: 'TP associé directement',
              isDirectAssociation: true
            })
          }
        })

        setCourseItems(itemsByCourse)
        const totalItems = Object.values(itemsByCourse).reduce((sum, items) => sum + items.length, 0)
        console.log(`📚 ${totalItems} TP/exercices chargés au total pour ${Object.keys(itemsByCourse).length} formations`)
      }
    } catch (error: any) {
      // Ignorer les erreurs d'abort
      if (error?.message?.includes('aborted') || error?.name === 'AbortError') {
        console.log('⚠️ Requête annulée (composant démonté)')
        return
      }
      
      console.error('Error fetching courses:', error)
      setError('Erreur lors du chargement des formations.')
    } finally {
      setLoading(false)
    }
  }

  // Fonction de tri
  const sortCourses = (coursesToSort: Course[]): Course[] => {
    const sorted = [...coursesToSort]
    
    switch (sortBy) {
      case 'title-asc':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr'))
      case 'title-desc':
        return sorted.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'fr'))
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'status-asc':
        return sorted.sort((a, b) => a.status.localeCompare(b.status))
      case 'status-desc':
        return sorted.sort((a, b) => b.status.localeCompare(a.status))
      case 'access-asc':
        return sorted.sort((a, b) => a.access_type.localeCompare(b.access_type))
      case 'access-desc':
        return sorted.sort((a, b) => b.access_type.localeCompare(a.access_type))
      default:
        return sorted
    }
  }

  // Fonction de groupement
  const groupCourses = (coursesToGroup: Course[]): Record<string, Course[]> => {
    if (groupBy === 'none') {
      return { 'Toutes les formations': coursesToGroup }
    }

    const grouped: Record<string, Course[]> = {}

    coursesToGroup.forEach(course => {
      let key = ''
      
      switch (groupBy) {
        case 'status':
          key = course.status === 'published' ? 'Publiées' : 'Brouillons'
          break
        case 'access_type':
          key = course.access_type === 'free' ? 'Gratuites' 
            : course.access_type === 'paid' ? 'Payantes' 
            : 'Sur invitation'
          break
        case 'created_at':
          const date = new Date(course.created_at)
          const month = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          key = month.charAt(0).toUpperCase() + month.slice(1)
          break
        default:
          key = 'Autres'
      }

      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(course)
    })

    // Trier les clés pour un affichage cohérent
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (groupBy === 'created_at') {
        return new Date(b).getTime() - new Date(a).getTime()
      }
      return a.localeCompare(b, 'fr')
    })

    const sortedGrouped: Record<string, Course[]> = {}
    sortedKeys.forEach(key => {
      sortedGrouped[key] = grouped[key]
    })

    return sortedGrouped
  }

  // Filtrer, trier et grouper les formations
  useEffect(() => {
    let filtered = [...courses]

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
      )
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter)
    }

    // Filtre par type d'accès
    if (accessFilter !== 'all') {
      filtered = filtered.filter(course => course.access_type === accessFilter)
    }

    // Trier
    filtered = sortCourses(filtered)

    setFilteredCourses(filtered)
  }, [courses, searchQuery, statusFilter, accessFilter, sortBy])

  // Sauvegarder les préférences de tri et groupement
  useEffect(() => {
    localStorage.setItem('admin-courses-content-sort', sortBy)
  }, [sortBy])

  useEffect(() => {
    localStorage.setItem('admin-courses-content-group', groupBy)
  }, [groupBy])

  useEffect(() => {
    localStorage.setItem('admin-courses-show-tp-main-list', showTpInMainList.toString())
  }, [showTpInMainList])

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
    free: courses.filter(c => c.access_type === 'free').length,
    paid: courses.filter(c => c.access_type === 'paid').length
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('admin-courses-view-mode', mode)
  }

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)
      }
      return newSet
    })
  }

  const getCourseThumbnailUrl = (course: Course): string | null => {
    if (!course.thumbnail_image_path) return null
    
    // Si c'est déjà une URL complète, la retourner
    if (course.thumbnail_image_path.startsWith('http')) {
      return course.thumbnail_image_path
    }
    
    // Sinon, construire l'URL depuis le chemin
    const path = course.thumbnail_image_path.replace('course-assets/', '')
    const { data } = supabase.storage
      .from('course-assets')
      .getPublicUrl(path)
    
    return data.publicUrl
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.filter(c => c.id !== courseId))
    } catch (error) {
      console.error('Error deleting course:', error)
      setError('Erreur lors de la suppression.')
    }
  }

  const handleOpenPresentation = async (courseId: string) => {
    try {
      // Vérifier s'il existe une présentation Gamma pour ce cours
      // Chercher dans les items du cours qui ont une asset_path commençant par https:// (URL Gamma)
      const { data: itemsWithGamma } = await supabase
        .from('items')
        .select(`
          id,
          asset_path,
          modules!inner(course_id)
        `)
        .eq('modules.course_id', courseId)
        .not('asset_path', 'is', null)
        .like('asset_path', 'https://%')
        .limit(1)
        .single()

      // Si une présentation Gamma existe, l'ouvrir
      if (itemsWithGamma?.asset_path) {
        const presentationWindow = window.open(
          itemsWithGamma.asset_path,
          'presentation',
          'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
        )
        
        if (!presentationWindow) {
          alert('Veuillez autoriser les popups pour ouvrir la présentation dans une nouvelle fenêtre.')
        }
        return
      }

      // Sinon, utiliser le comportement par défaut (présentation des chapitres)
      const presentationUrl = `${window.location.origin}/presentation/${courseId}`
      const presentationWindow = window.open(
        presentationUrl,
        'presentation',
        'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
      )
      
      if (!presentationWindow) {
        alert('Veuillez autoriser les popups pour ouvrir la présentation dans une nouvelle fenêtre.')
      } else {
        // Essayer de mettre en plein écran
        if (presentationWindow.document) {
          presentationWindow.addEventListener('load', () => {
            if (presentationWindow.document.documentElement.requestFullscreen) {
              presentationWindow.document.documentElement.requestFullscreen().catch(() => {
                // Ignorer si le plein écran n'est pas disponible
              })
            }
          })
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la présentation:', error)
      // Fallback vers le comportement par défaut en cas d'erreur
      const presentationUrl = `${window.location.origin}/presentation/${courseId}`
      window.open(
        presentationUrl,
        'presentation',
        'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
      )
    }
  }

  const handleDuplicateCourse = async (course: Course) => {
    try {
      const newCourse = {
        ...course,
        id: undefined,
        title: `${course.title} (Copie)`,
        status: 'draft' as const,
        created_at: undefined,
        updated_at: undefined
      }

      const { data, error } = await supabase
        .from('courses')
        .insert(newCourse)
        .select()
        .single()

      if (error) throw error

      setCourses([data, ...courses])
    } catch (error) {
      console.error('Error duplicating course:', error)
      setError('Erreur lors de la duplication.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Debug: Afficher le nombre total d'items chargés
  const totalItemsLoaded = Object.values(courseItems).reduce((sum, items) => sum + items.length, 0)
  
  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
      {/* Header avec bouton créer */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Formations</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez vos formations et leur contenu
            {totalItemsLoaded > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({totalItemsLoaded} TP/exercices disponibles)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/courses/ai-generator"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Générer avec IA
          </Link>
          <Link
            to="/admin/courses/new/json"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle formation
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistiques */}
      {courses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-sm text-gray-600 mt-1">Publiées</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <div className="text-sm text-gray-600 mt-1">Brouillons</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.free}</div>
            <div className="text-sm text-gray-600 mt-1">Gratuites</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.paid}</div>
            <div className="text-sm text-gray-600 mt-1">Payantes</div>
          </div>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      {courses.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Première ligne : Recherche et vue */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher une formation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Vue grille"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Vue liste"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Toggle pour afficher/masquer les TP dans la liste principale */}
                <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={showTpInMainList}
                    onChange={(e) => setShowTpInMainList(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    Afficher les TP
                  </span>
                </label>
              </div>
            </div>

            {/* Deuxième ligne : Filtres, Tri et Groupement */}
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="published">Publiées</option>
                  <option value="draft">Brouillons</option>
                </select>
              </div>

              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="free">Gratuit</option>
                <option value="paid">Payant</option>
                <option value="invite">Sur invitation</option>
              </select>

              {/* Tri */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <optgroup label="Titre">
                    <option value="title-asc">Titre (A-Z)</option>
                    <option value="title-desc">Titre (Z-A)</option>
                  </optgroup>
                  <optgroup label="Date">
                    <option value="date-desc">Plus récent</option>
                    <option value="date-asc">Plus ancien</option>
                  </optgroup>
                  <optgroup label="Statut">
                    <option value="status-asc">Statut (A-Z)</option>
                    <option value="status-desc">Statut (Z-A)</option>
                  </optgroup>
                  <optgroup label="Type d'accès">
                    <option value="access-asc">Type (A-Z)</option>
                    <option value="access-desc">Type (Z-A)</option>
                  </optgroup>
                </select>
              </div>

              {/* Groupement */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="none">Aucun groupement</option>
                  <option value="status">Grouper par statut</option>
                  <option value="access_type">Grouper par type d'accès</option>
                  <option value="created_at">Grouper par mois</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des formations */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-2">
            Aucune formation créée pour le moment.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Commencez par créer votre première formation.
          </p>
          <Link to="/admin/courses/new/json" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Créer la première formation
          </Link>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-2">
            Aucune formation ne correspond à vos critères.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
              setAccessFilter('all')
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (() => {
        const groupedCourses = groupCourses(filteredCourses)
        const groups = Object.keys(groupedCourses)

        return (
          <div className="space-y-6">
            {groups.map((groupKey) => {
              const coursesInGroup = groupedCourses[groupKey]
              
              return (
                <div key={groupKey} className="space-y-4">
                  {groupBy !== 'none' && (
                    <div className="flex items-center gap-2 px-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {groupKey}
                      </h2>
                      <span className="text-sm text-gray-500">
                        ({coursesInGroup.length} {coursesInGroup.length > 1 ? 'formations' : 'formation'})
                      </span>
                    </div>
                  )}
                  
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {coursesInGroup.map((course) => {
                        // Filtrer les TP si le toggle est désactivé
                        const allItems = courseItems[course.id] || []
                        const items = showTpInMainList 
                          ? allItems 
                          : allItems.filter(item => item.type !== 'tp')
                        const hasItems = items.length > 0
                        const isExpanded = expandedCourses.has(course.id)
                        
                        const thumbnailUrl = getCourseThumbnailUrl(course)
                        
                        return (
                          <div key={course.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                            {/* Vignette de la formation */}
                            {thumbnailUrl ? (
                              <div className="w-full h-48 bg-gray-100 overflow-hidden">
                                <img
                                  src={thumbnailUrl}
                                  alt={course.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Si l'image ne charge pas, cacher l'élément
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <BookOpen className="w-16 h-16 text-gray-400" />
                              </div>
                            )}
                            
                            <div className="p-5 flex-1 flex flex-col">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 break-words line-clamp-2 flex-1">
                                      {course.title}
                                    </h3>
                                    {hasItems && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleCourseExpansion(course.id)
                                        }}
                                        className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:text-gray-900 hover:bg-blue-50 rounded-md transition-colors text-xs font-medium border border-blue-300 bg-blue-50 shadow-sm"
                                        title={`${isExpanded ? 'Masquer' : 'Afficher'} les TP/exercices`}
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-blue-600" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-blue-600" />
                                        )}
                                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                                          {items.length} {items.length > 1 ? 'items' : 'item'}
                                        </span>
                                      </button>
                                    )}
                                  </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        course.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {course.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        course.access_type === 'free'
                          ? 'bg-blue-100 text-blue-700'
                          : course.access_type === 'paid'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {course.access_type === 'free' ? 'Gratuit' :
                         course.access_type === 'paid' ? 'Payant' : 'Invitation'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                  {course.description || 'Aucune description'}
                </p>

                {/* Programmes associés */}
                {coursePrograms[course.id] && coursePrograms[course.id].length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Layers className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">Programmes :</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {coursePrograms[course.id].map((program) => (
                        <Link
                          key={program.id}
                          to={`/admin/programs/${program.id}`}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {program.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Créé le {new Date(course.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                  </div>
                  {course.price_cents && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{(course.price_cents / 100).toFixed(2)}€</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  <Link
                    to={`/admin/courses/${course.id}`}
                    className="flex-1 btn-primary text-sm text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Modifier
                  </Link>
                  <Link
                    to={`/courses/${course.id}`}
                    className="btn-secondary text-sm inline-flex items-center gap-1.5"
                    title="Voir"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={`/admin/courses/${course.id}/enrollments`}
                    className="btn-secondary text-sm inline-flex items-center gap-1.5"
                    title="Inscriptions"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={`/admin/courses/${course.id}/submissions`}
                    className="btn-secondary text-sm inline-flex items-center gap-1.5"
                    title="Soumissions"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleOpenPresentation(course.id)}
                    className="btn-secondary text-sm inline-flex items-center gap-1.5"
                    title="Ouvrir la présentation de tous les chapitres du cours"
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    Présentation
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                      className="btn-secondary text-sm inline-flex items-center gap-1.5"
                      title="Plus d'options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {openMenuId === course.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <Link
                            to={`/admin/courses/${course.id}/json`}
                            onClick={() => setOpenMenuId(null)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Code className="w-4 h-4" />
                            Éditer en JSON
                          </Link>
                          <button
                            onClick={() => {
                              handleDuplicateCourse(course)
                              setOpenMenuId(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Dupliquer
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteCourse(course.id)
                              setOpenMenuId(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* TP et Exercices associés */}
                {hasItems && isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          to={`/items/${item.id}`}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex-shrink-0">
                            {item.type === 'tp' ? (
                              <Code className="w-4 h-4 text-purple-600" />
                            ) : (
                              <PenTool className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                              {item.title}
                            </div>
                            {item.module_title && (
                              <div className="text-xs text-gray-500 truncate">
                                {item.isDirectAssociation ? (
                                  <span className="text-blue-600 font-medium">🔗 {item.module_title}</span>
                                ) : (
                                  `Module: ${item.module_title}`
                                )}
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            item.type === 'tp'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.type === 'tp' ? 'TP' : 'Exercice'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {coursesInGroup.map((course) => {
                          // Filtrer les TP si le toggle est désactivé
                          const allItems = courseItems[course.id] || []
                          const items = showTpInMainList 
                            ? allItems 
                            : allItems.filter(item => item.type !== 'tp')
                          const hasItems = items.length > 0
                          const isExpanded = expandedCourses.has(course.id)
                          
                          const thumbnailUrl = getCourseThumbnailUrl(course)
                          
                          return (
                            <div 
                              key={course.id} 
                              className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                  {thumbnailUrl ? (
                                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                                      <img
                                        src={thumbnailUrl}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Si l'image ne charge pas, afficher l'icône par défaut
                                          e.currentTarget.style.display = 'none'
                                          const parent = e.currentTarget.parentElement
                                          if (parent) {
                                            parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"><svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div>`
                                          }
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                                      <BookOpen className="w-8 h-8 text-white" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-gray-900 truncate">
                                          {course.title}
                                        </h3>
                                        {hasItems && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              toggleCourseExpansion(course.id)
                                            }}
                                            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:text-gray-900 hover:bg-blue-50 rounded-md transition-colors text-xs font-medium border border-blue-300 bg-blue-50 shadow-sm"
                                            title={`${isExpanded ? 'Masquer' : 'Afficher'} les TP/exercices`}
                                          >
                                            {isExpanded ? (
                                              <ChevronDown className="w-4 h-4 text-blue-600" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4 text-blue-600" />
                                            )}
                                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                                              {items.length} {items.length > 1 ? 'items' : 'item'}
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      course.status === 'published'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {course.status === 'published' ? 'Publié' : 'Brouillon'}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      course.access_type === 'free'
                                        ? 'bg-blue-100 text-blue-700'
                                        : course.access_type === 'paid'
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {course.access_type === 'free' ? 'Gratuit' :
                                       course.access_type === 'paid' ? 'Payant' : 'Invitation'}
                                    </span>
                                    {course.price_cents && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        <DollarSign className="w-3 h-3 mr-1" />
                                        {(course.price_cents / 100).toFixed(2)}€
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                    {course.description || 'Aucune description disponible.'}
                                  </p>
                                  {/* Programmes associés */}
                                  {coursePrograms[course.id] && coursePrograms[course.id].length > 0 && (
                                    <div className="mb-2">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Layers className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-500">Programmes :</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {coursePrograms[course.id].map((program) => (
                                          <Link
                                            key={program.id}
                                            to={`/admin/programs/${program.id}`}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {program.title}
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5" />
                                      Créé le {new Date(course.created_at).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0 sm:ml-4">
                                <Link
                                  to={`/admin/courses/${course.id}`}
                                  className="btn-primary text-sm inline-flex items-center gap-1.5"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Modifier
                                </Link>
                                <Link
                                  to={`/courses/${course.id}`}
                                  className="btn-secondary text-sm inline-flex items-center gap-1.5"
                                  title="Voir"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <Link
                                  to={`/admin/courses/${course.id}/enrollments`}
                                  className="btn-secondary text-sm inline-flex items-center gap-1.5"
                                  title="Inscriptions"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                </Link>
                                <Link
                                  to={`/admin/courses/${course.id}/submissions`}
                                  className="btn-secondary text-sm inline-flex items-center gap-1.5"
                                  title="Soumissions"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleOpenPresentation(course.id)}
                                  className="btn-secondary text-sm inline-flex items-center gap-1.5"
                                  title="Ouvrir la présentation de tous les chapitres du cours"
                                >
                                  <Presentation className="w-3.5 h-3.5" />
                                  Présentation
                                </button>
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                                    className="btn-secondary text-sm inline-flex items-center gap-1.5"
                                    title="Plus d'options"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                  {openMenuId === course.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setOpenMenuId(null)}
                                      />
                                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                        <Link
                                          to={`/admin/courses/${course.id}/json`}
                                          onClick={() => setOpenMenuId(null)}
                                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <Code className="w-4 h-4" />
                                          Éditer en JSON
                                        </Link>
                                        <button
                                          onClick={() => {
                                            handleDuplicateCourse(course)
                                            setOpenMenuId(null)
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <Copy className="w-4 h-4" />
                                          Dupliquer
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleDeleteCourse(course.id)
                                            setOpenMenuId(null)
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Supprimer
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* TP et Exercices associés */}
                              {hasItems && isExpanded && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="space-y-2">
                                    {items.map((item) => (
                                      <Link
                                        key={item.id}
                                        to={`/items/${item.id}`}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors group ml-16"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex-shrink-0">
                                          {item.type === 'tp' ? (
                                            <Code className="w-4 h-4 text-purple-600" />
                                          ) : (
                                            <PenTool className="w-4 h-4 text-blue-600" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                                            {item.title}
                                          </div>
                                        {item.module_title && (
                                          <div className="text-xs text-gray-500 truncate">
                                            {item.isDirectAssociation ? (
                                              <span className="text-blue-600 font-medium">🔗 {item.module_title}</span>
                                            ) : (
                                              `Module: ${item.module_title}`
                                            )}
                                          </div>
                                        )}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          item.type === 'tp'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {item.type === 'tp' ? 'TP' : 'Exercice'}
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}

