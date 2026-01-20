import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Course, Module, Item } from '../../types/database'
import { Save, Plus, Edit, Trash2, GripVertical, ChevronUp, ChevronDown, Code, Presentation, Link as LinkIcon, Image, X } from 'lucide-react'
import { LinkedInPostModal } from '../../components/LinkedInPostModal'
import { ImageUploadCarousel } from '../../components/ImageUploadCarousel'
import { CourseResourcesManager } from '../../components/CourseResourcesManager'
import { FillableDocumentsManager } from '../../components/FillableDocumentsManager'

interface ModuleWithItems extends Module {
  items: Item[]
}

export function AdminCourseEdit() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isNew = courseId === 'new'

  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    status: 'draft',
    access_type: 'free',
    price_cents: null,
    currency: 'EUR',
    is_paid: false,
    thumbnail_image_path: null,
    created_by: user?.id
  })
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [modules, setModules] = useState<ModuleWithItems[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)
  const [draggedItemModuleId, setDraggedItemModuleId] = useState<string | null>(null)
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null)
  const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null)
  const [showLinkedInModal, setShowLinkedInModal] = useState(false)
  const [wasPublicBeforeSave, setWasPublicBeforeSave] = useState(false)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null
    
    if (!isNew && courseId) {
      // Timeout de sécurité pour éviter un chargement infini
      timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          console.warn('AdminCourseEdit: Loading timeout, forcing render')
          setLoading(false)
          setError('Le chargement a pris trop de temps. Veuillez rafraîchir la page.')
        }
      }, 10000) // 10 secondes max
      
      fetchCourse(isMounted)
    } else {
      setLoading(false)
    }
    
    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [courseId, isNew])

  const fetchCourse = async (isMounted: boolean = true) => {
    try {
      // Récupérer la formation
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (!isMounted) return

      if (courseError) {
        // Ignorer les erreurs d'abort
        if (courseError.message?.includes('aborted') || courseError.message?.includes('AbortError')) {
          console.log('⚠️ Requête annulée (composant démonté)')
          return
        }
        throw courseError
      }
      
      setCourse(courseData)
      setWasPublicBeforeSave(courseData.is_public || false)

      // Récupérer les modules avec items
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          items (*)
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true })

      if (!isMounted) return

      if (modulesError) {
        // Ignorer les erreurs d'abort
        if (modulesError.message?.includes('aborted') || modulesError.message?.includes('AbortError')) {
          console.log('⚠️ Requête annulée (composant démonté)')
          return
        }
        throw modulesError
      }

      const sortedModules = modulesData?.map(module => ({
        ...module,
        items: module.items?.sort((a: Item, b: Item) => a.position - b.position) || []
      })) || []

      if (isMounted) {
        setModules(sortedModules)
      }
    } catch (error: any) {
      if (!isMounted) return
      
      // Ignorer les erreurs d'abort
      if (error?.message?.includes('aborted') || error?.name === 'AbortError') {
        console.log('⚠️ Requête annulée (composant démonté)')
        return
      }
      
      console.error('Error fetching course:', error)
      setError('Erreur lors du chargement.')
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }

  const handleThumbnailUpload = async (imageUrl: string) => {
    if (!courseId || isNew) {
      setError('Veuillez d\'abord sauvegarder la formation avant d\'uploader une vignette.')
      return
    }

    setUploadingThumbnail(true)
    setError('')

    try {
      // Extraire le chemin depuis l'URL publique
      // L'URL est de la forme: https://xxx.supabase.co/storage/v1/object/public/course-assets/path/to/image.jpg
      // Ou: https://xxx.supabase.co/storage/v1/object/sign/course-assets/...
      let imagePath = imageUrl
      
      // Si c'est une URL complète, extraire le chemin
      if (imageUrl.includes('/course-assets/')) {
        const urlParts = imageUrl.split('/course-assets/')
        if (urlParts.length === 2) {
          imagePath = `course-assets/${urlParts[1].split('?')[0]}` // Enlever les query params
        }
      } else if (imageUrl.includes('carousel/')) {
        // Si c'est un chemin carousel, le garder tel quel
        imagePath = imageUrl
      }

      console.log('💾 Sauvegarde du chemin de la vignette:', imagePath)

      // Mettre à jour le cours avec le nouveau chemin
      const { error: updateError } = await supabase
        .from('courses')
        .update({ thumbnail_image_path: imagePath })
        .eq('id', courseId)

      if (updateError) {
        // Ignorer les erreurs d'abort
        if (updateError.message?.includes('aborted') || updateError.message?.includes('AbortError')) {
          throw new Error('La sauvegarde a été interrompue. Réessayez.')
        }
        throw updateError
      }

      setCourse({ ...course, thumbnail_image_path: imagePath })
      console.log('✅ Vignette sauvegardée avec succès')
    } catch (error: any) {
      console.error('❌ Error saving thumbnail path:', error)
      setError(error.message || 'Erreur lors de la sauvegarde de la vignette')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleDeleteThumbnail = async () => {
    if (!course.thumbnail_image_path || !courseId) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vignette ?')) return

    try {
      // Extraire le chemin pour la suppression (enlever le préfixe course-assets/ si présent)
      const pathToDelete = course.thumbnail_image_path.replace(/^course-assets\//, '')
      
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

      // Mettre à jour le cours
      const { error: updateError } = await supabase
        .from('courses')
        .update({ thumbnail_image_path: null })
        .eq('id', courseId)

      if (updateError) throw updateError

      setCourse({ ...course, thumbnail_image_path: null })
    } catch (error: any) {
      console.error('Error deleting thumbnail:', error)
      setError(error.message || 'Erreur lors de la suppression de la vignette')
    }
  }

  const getThumbnailUrl = (): string | null => {
    if (!course.thumbnail_image_path) return null
    
    // Si c'est déjà une URL complète, la retourner
    if (course.thumbnail_image_path.startsWith('http')) {
      return course.thumbnail_image_path
    }
    
    // Sinon, construire l'URL depuis le chemin (enlever le préfixe course-assets/ si présent)
    const path = course.thumbnail_image_path.replace(/^course-assets\//, '')
    const { data } = supabase.storage
      .from('course-assets')
      .getPublicUrl(path)
    
    return data.publicUrl
  }

  const handleSave = async () => {
    // Validation stricte du titre
    const title = course.title?.trim()
    if (!title) {
      setError('Le titre est obligatoire.')
      return
    }

    // Validation de created_by pour les nouvelles formations
    if (isNew && !user?.id) {
      setError('Vous devez être connecté pour créer une formation.')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Vérifier si is_public passe de false à true
      const isBecomingPublic = course.is_public && !wasPublicBeforeSave

      // S'assurer que tous les champs requis sont présents et valides
      const courseData = {
        title: title, // Utiliser la version trimée et validée
        description: course.description || null,
        status: course.status || 'draft',
        access_type: course.access_type || 'free',
        price_cents: course.price_cents || null,
        currency: course.currency || 'EUR',
        is_paid: course.access_type === 'paid',
        allow_pdf_download: course.allow_pdf_download || false,
        is_public: course.is_public || false,
        created_by: isNew ? (user?.id || course.created_by) : course.created_by,
        updated_at: new Date().toISOString()
      }

      let finalCourseId = courseId

      // Sauvegarder ou créer la formation
      if (isNew) {
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single()

        if (error) throw error
        finalCourseId = data.id
        navigate(`/admin/courses/${data.id}`, { replace: true })
      } else {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId)

        if (error) throw error
        finalCourseId = courseId
      }

      // Si la formation devient publique, proposer le post LinkedIn
      if (isBecomingPublic) {
        // Récupérer la formation mise à jour avec publication_date
        const { data: updatedCourse } = await supabase
          .from('courses')
          .select('*')
          .eq('id', finalCourseId)
          .single()
        
        if (updatedCourse) {
          setCourse(updatedCourse)
          setShowLinkedInModal(true)
        }
      }

      // Mettre à jour wasPublicBeforeSave
      setWasPublicBeforeSave(course.is_public || false)

      // Sauvegarder/mettre à jour les modules
      const modulesToCreate = modules.filter(m => m.id.startsWith('temp-'))
      const modulesToUpdate = modules.filter(m => !m.id.startsWith('temp-'))
      let savedModules: any[] = []
      let savedItems: any[] = []

      // Créer les nouveaux modules
      if (modulesToCreate.length > 0) {
        const modulesData = modulesToCreate.map((module) => ({
          course_id: finalCourseId,
          title: module.title,
          position: module.position
        }))

        const { data: saved, error: modulesError } = await supabase
          .from('modules')
          .insert(modulesData)
          .select()

        if (modulesError) throw modulesError
        savedModules = saved || []
      }

      // Mettre à jour les modules existants en parallèle
      if (modulesToUpdate.length > 0) {
        const updatePromises = modulesToUpdate.map(module =>
          supabase
            .from('modules')
            .update({
              title: module.title,
              position: module.position
            })
            .eq('id', module.id)
        )
        
        const updateResults = await Promise.all(updatePromises)
        const updateErrors = updateResults.filter(r => r.error)
        if (updateErrors.length > 0) {
          console.error('Errors updating modules:', updateErrors)
        }
      }

      // Mettre à jour les IDs des modules dans l'état si des modules ont été créés
      let allModules = modules
      if (savedModules.length > 0) {
        allModules = modules.map(module => {
          if (module.id.startsWith('temp-')) {
            const savedModule = savedModules.find((sm, idx) => 
              modulesToCreate[idx]?.title === sm.title && modulesToCreate[idx]?.position === sm.position
            )
            return savedModule ? { ...module, id: savedModule.id, course_id: savedModule.course_id } : module
          }
          return module
        })
        setModules(allModules)
      }

      // Sauvegarder les items temporaires et mettre à jour les existants
      const itemsToCreate: Array<{ module_id: string; item: Item }> = []
      const itemsToUpdate: Array<{ item: Item }> = []

      allModules.forEach(module => {
        module.items.forEach(item => {
          if (item.id.startsWith('temp-')) {
            itemsToCreate.push({ module_id: module.id, item })
          } else {
            itemsToUpdate.push({ item })
          }
        })
      })

      // Créer les nouveaux items
      if (itemsToCreate.length > 0) {
        const itemsData = itemsToCreate.map(({ module_id, item }) => ({
          module_id,
          type: item.type,
          title: item.title,
          content: item.content,
          asset_path: item.asset_path,
          external_url: item.external_url,
          position: item.position,
          published: item.published
        }))

        const { data: saved, error: itemsError } = await supabase
          .from('items')
          .insert(itemsData)
          .select()

        if (itemsError) throw itemsError
        savedItems = saved || []
      }

      // Mettre à jour les items existants en parallèle (seulement si changements significatifs)
      if (itemsToUpdate.length > 0) {
        const updatePromises = itemsToUpdate.map(({ item }) =>
          supabase
            .from('items')
            .update({
              title: item.title,
              type: item.type,
              module_id: item.module_id,
              position: item.position,
              published: item.published
            })
            .eq('id', item.id)
        )
        
        const updateResults = await Promise.all(updatePromises)
        const updateErrors = updateResults.filter(r => r.error)
        if (updateErrors.length > 0) {
          console.error('Errors updating items:', updateErrors)
        }
      }

      // Mettre à jour l'état local avec les nouveaux IDs (sans recharger)
      let finalModules = modules
      
      // Mettre à jour les IDs des modules créés
      if (savedModules.length > 0) {
        finalModules = modules.map(module => {
          if (module.id.startsWith('temp-')) {
            const savedModule = savedModules.find((sm, idx) => 
              modulesToCreate[idx]?.title === sm.title && modulesToCreate[idx]?.position === sm.position
            )
            if (savedModule) {
              return { ...module, id: savedModule.id, course_id: savedModule.course_id }
            }
          }
          return module
        })
      }
      
      // Mettre à jour les IDs des items créés
      if (savedItems.length > 0) {
        finalModules = finalModules.map(module => {
          const moduleItems = module.items.map(item => {
            if (item.id.startsWith('temp-')) {
              // Trouver l'item sauvegardé correspondant (par titre et position)
              const savedItem = savedItems.find(si => 
                si.module_id === module.id && 
                si.title === item.title && 
                si.position === item.position
              )
              if (savedItem) {
                return { ...item, id: savedItem.id }
              }
            }
            return item
          })
          return { ...module, items: moduleItems }
        })
      }
      
      // Mettre à jour l'état seulement si nécessaire
      if (savedModules.length > 0 || savedItems.length > 0) {
        setModules(finalModules)
      }
      
      // Afficher un message de succès
      if (!isNew) {
        setError('') // Effacer les erreurs
      }
    } catch (error) {
      console.error('Error saving course:', error)
      setError(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const addModule = () => {
    try {
      // Pour un nouveau cours (courseId === 'new'), on peut quand même ajouter des modules temporaires
      // Ils seront sauvegardés lors de la sauvegarde du cours
      const moduleCourseId = isNew ? 'new' : (courseId || '')
      
      const newModule: ModuleWithItems = {
        id: `temp-${Date.now()}`,
        course_id: moduleCourseId,
        title: 'Nouveau module',
        position: modules.length,
        created_at: new Date().toISOString(),
        items: []
      }
      
      console.log('Adding new module:', newModule, 'Total modules before:', modules.length)
      setModules(prevModules => {
        const updated = [...prevModules, newModule]
        console.log('Updated modules array, new length:', updated.length)
        return updated
      })
      
      // Réinitialiser l'erreur si tout va bien
      setError('')
    } catch (error) {
      console.error('Error adding module:', error)
      setError(`Erreur lors de l'ajout du module: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setModules(modules.map(m =>
      m.id === moduleId ? { ...m, ...updates } : m
    ))
  }

  const deleteModule = async (moduleId: string) => {
    if (moduleId.startsWith('temp-')) {
      setModules(modules.filter(m => m.id !== moduleId))
      return
    }

    if (!confirm('Supprimer ce module et tous ses éléments ?')) return

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId)

      if (error) throw error
      setModules(modules.filter(m => m.id !== moduleId))
    } catch (error) {
      console.error('Error deleting module:', error)
      setError('Erreur lors de la suppression.')
    }
  }

  const addItem = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    const newItem: Item = {
      id: `temp-${Date.now()}`,
      module_id: moduleId,
      type: 'resource',
      title: 'Nouvel élément',
      content: null,
      asset_path: null,
      external_url: null,
      position: module.items.length,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setModules(modules.map(m =>
      m.id === moduleId
        ? { ...m, items: [...m.items, newItem] }
        : m
    ))
  }

  const updateItem = (moduleId: string, itemId: string, updates: Partial<Item>) => {
    setModules(modules.map(m =>
      m.id === moduleId
        ? {
            ...m,
            items: m.items.map(item =>
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
        : m
    ))
  }

  const saveAndEditItem = async (moduleId: string, item: Item) => {
    // Vérifier que le module existe (pas temporaire)
    const module = modules.find(m => m.id === moduleId)
    if (!module || module.id.startsWith('temp-')) {
      setError('Veuillez d\'abord sauvegarder le module contenant cet élément.')
      return
    }

    if (!item.title?.trim()) {
      setError('Veuillez donner un titre à l\'élément avant de le modifier.')
      return
    }

    try {
      setSaving(true)
      setError('')

      // Créer l'item dans la base de données
      const itemData = {
        module_id: moduleId,
        type: item.type,
        title: item.title.trim(),
        content: item.content || {},
        asset_path: item.asset_path,
        external_url: item.external_url,
        position: item.position,
        published: item.published
      }

      const { data: savedItem, error: itemError } = await supabase
        .from('items')
        .insert(itemData)
        .select()
        .single()

      if (itemError) {
        console.error('Error saving item:', itemError)
        throw new Error(itemError.message || 'Erreur lors de la sauvegarde')
      }

      if (!savedItem) {
        throw new Error('Aucune donnée retournée après la sauvegarde')
      }

      // Mettre à jour l'état local avec le nouvel ID (sans recharger)
      setModules(modules.map(m =>
        m.id === moduleId
          ? {
              ...m,
              items: m.items.map(i => i.id === item.id ? { ...i, id: savedItem.id } : i)
            }
          : m
      ))

      // Rediriger vers la page d'édition avec le paramètre returnTo
      navigate(`/admin/items/${savedItem.id}/edit?returnTo=${encodeURIComponent(`/admin/courses/${courseId}`)}`)
    } catch (error) {
      console.error('Error saving item:', error)
      setError(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      setSaving(false)
    }
  }

  const deleteItem = async (moduleId: string, itemId: string) => {
    if (itemId.startsWith('temp-')) {
      setModules(modules.map(m =>
        m.id === moduleId
          ? { ...m, items: m.items.filter(item => item.id !== itemId) }
          : m
      ))
      return
    }

    if (!confirm('Supprimer cet élément ?')) return

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setModules(modules.map(m =>
        m.id === moduleId
          ? { ...m, items: m.items.filter(item => item.id !== itemId) }
          : m
      ))
    } catch (error) {
      console.error('Error deleting item:', error)
      setError('Erreur lors de la suppression.')
    }
  }

  // Handlers pour le drag & drop des éléments
  const handleItemDragStart = (e: React.DragEvent, moduleId: string, itemId: string) => {
    // Ne pas permettre le drag si on clique sur un bouton ou un input
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      e.preventDefault()
      return
    }
    
    // Empêcher la propagation vers le module parent
    e.stopPropagation()
    
    setDraggedItemId(itemId)
    setDraggedItemModuleId(moduleId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', JSON.stringify({ moduleId, itemId }))
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleItemDragEnd = (e: React.DragEvent) => {
    setDraggedItemId(null)
    setDragOverItemId(null)
    setDraggedItemModuleId(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleItemDragOver = (e: React.DragEvent, itemId: string) => {
    // Ne pas gérer le drag de l'item si un module est en train d'être dragué
    if (draggedModuleId) {
      return
    }
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedItemId && draggedItemId !== itemId) {
      setDragOverItemId(itemId)
    }
  }

  const handleItemDragLeave = () => {
    setDragOverItemId(null)
  }

  const handleItemDrop = async (e: React.DragEvent, targetModuleId: string, targetItemId: string) => {
    // Ne pas gérer le drop de l'item si un module est en train d'être dragué
    if (draggedModuleId) {
      return
    }
    e.preventDefault()
    setDragOverItemId(null)

    if (!draggedItemId || !draggedItemModuleId) return

    const sourceModuleId = draggedItemModuleId
    const sourceItemId = draggedItemId

    // Si c'est le même élément, ne rien faire
    if (sourceModuleId === targetModuleId && sourceItemId === targetItemId) {
      setDraggedItemId(null)
      setDraggedItemModuleId(null)
      return
    }

    // Trouver les modules source et cible
    const sourceModule = modules.find(m => m.id === sourceModuleId)
    const targetModule = modules.find(m => m.id === targetModuleId)

    if (!sourceModule || !targetModule) return

    // Trouver l'élément source
    const sourceItem = sourceModule.items.find(item => item.id === sourceItemId)
    if (!sourceItem) return

    // Trouver l'index de l'élément cible
    const targetIndex = targetModule.items.findIndex(item => item.id === targetItemId)
    if (targetIndex === -1) return

    // Créer les nouveaux tableaux d'éléments
    let newSourceItems = [...sourceModule.items]
    let newTargetItems = [...targetModule.items]

    // Retirer l'élément source de son module
    const sourceIndex = newSourceItems.findIndex(item => item.id === sourceItemId)
    if (sourceIndex !== -1) {
      newSourceItems.splice(sourceIndex, 1)
    }

    // Insérer l'élément à la nouvelle position
    const updatedItem = {
      ...sourceItem,
      module_id: targetModuleId,
      position: targetIndex
    }
    newTargetItems.splice(targetIndex, 0, updatedItem)

    // Mettre à jour les positions de tous les éléments dans les deux modules
    newSourceItems = newSourceItems.map((item, index) => ({
      ...item,
      position: index
    }))
    newTargetItems = newTargetItems.map((item, index) => ({
      ...item,
      position: index
    }))

    // Mettre à jour l'état
    setModules(modules.map(module => {
      if (module.id === sourceModuleId) {
        return { ...module, items: newSourceItems }
      }
      if (module.id === targetModuleId) {
        return { ...module, items: newTargetItems }
      }
      return module
    }))

    // Sauvegarder les nouvelles positions dans la base de données
    try {
      // Si l'élément existe déjà dans la base de données, mettre à jour sa position et son module
      if (!sourceItemId.startsWith('temp-')) {
        await supabase
          .from('items')
          .update({
            module_id: targetModuleId,
            position: targetIndex
          })
          .eq('id', sourceItemId)

        // Mettre à jour les positions des autres éléments dans le module source
        const sourceUpdatePromises = newSourceItems
          .filter(item => !item.id.startsWith('temp-'))
          .map((item, index) =>
            supabase
              .from('items')
              .update({ position: index })
              .eq('id', item.id)
          )

        // Mettre à jour les positions des autres éléments dans le module cible
        const targetUpdatePromises = newTargetItems
          .filter(item => !item.id.startsWith('temp-') && item.id !== sourceItemId)
          .map((item, index) =>
            supabase
              .from('items')
              .update({ position: index })
              .eq('id', item.id)
          )

        await Promise.all([...sourceUpdatePromises, ...targetUpdatePromises])
      }
    } catch (error) {
      console.error('Error updating item positions:', error)
      setError('Erreur lors de la mise à jour des positions.')
    }

    setDraggedItemId(null)
    setDraggedItemModuleId(null)
  }

  // Handlers pour le drag & drop des modules
  const handleModuleDragStart = (e: React.DragEvent, moduleId: string) => {
    // Ne pas permettre le drag si on clique sur un bouton ou un input
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      e.preventDefault()
      return
    }
    
    setDraggedModuleId(moduleId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', JSON.stringify({ moduleId }))
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleModuleDragEnd = (e: React.DragEvent) => {
    setDraggedModuleId(null)
    setDragOverModuleId(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleModuleDragOver = (e: React.DragEvent, moduleId: string) => {
    // Ne pas gérer le drag du module si un item est en train d'être dragué
    if (draggedItemId) {
      return
    }
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedModuleId && draggedModuleId !== moduleId) {
      setDragOverModuleId(moduleId)
    }
  }

  const handleModuleDragLeave = () => {
    setDragOverModuleId(null)
  }

  const handleModuleDrop = async (e: React.DragEvent, targetModuleId: string) => {
    // Ne pas gérer le drop du module si un item est en train d'être dragué
    if (draggedItemId) {
      return
    }
    e.preventDefault()
    setDragOverModuleId(null)

    if (!draggedModuleId) return

    const sourceModuleId = draggedModuleId

    // Si c'est le même module, ne rien faire
    if (sourceModuleId === targetModuleId) {
      setDraggedModuleId(null)
      return
    }

    // Trouver les index des modules
    const sourceIndex = modules.findIndex(m => m.id === sourceModuleId)
    const targetIndex = modules.findIndex(m => m.id === targetModuleId)

    if (sourceIndex === -1 || targetIndex === -1) return

    // Créer un nouveau tableau avec les modules réorganisés
    const newModules = [...modules]
    const [movedModule] = newModules.splice(sourceIndex, 1)
    newModules.splice(targetIndex, 0, movedModule)

    // Mettre à jour les positions
    newModules.forEach((module, index) => {
      module.position = index
    })

    // Mettre à jour l'état
    setModules(newModules)

    // Sauvegarder les nouvelles positions dans la base de données
    try {
      const updatePromises = newModules
        .filter(module => !module.id.startsWith('temp-'))
        .map((module, index) =>
          supabase
            .from('modules')
            .update({ position: index })
            .eq('id', module.id)
        )

      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error updating module positions:', error)
      setError('Erreur lors de la mise à jour des positions des modules.')
    }

    setDraggedModuleId(null)
  }

  // Fonction pour déplacer un module vers le haut ou le bas
  const moveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const index = modules.findIndex(m => m.id === moduleId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= modules.length) return

    // Créer une copie des modules
    const updatedModules = [...modules]
    const [moved] = updatedModules.splice(index, 1)
    updatedModules.splice(newIndex, 0, moved)

    // Mettre à jour les positions
    updatedModules.forEach((module, i) => {
      module.position = i
    })

    // Mettre à jour l'état
    setModules(updatedModules)

    // Sauvegarder les nouvelles positions dans la base de données
    try {
      const updatePromises = updatedModules
        .filter(module => !module.id.startsWith('temp-'))
        .map((module, index) =>
          supabase
            .from('modules')
            .update({ position: index })
            .eq('id', module.id)
        )

      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error updating module positions:', error)
      setError('Erreur lors de la mise à jour des positions des modules.')
    }
  }

  // Fonction pour déplacer un élément vers le haut ou le bas
  const moveItem = async (moduleId: string, itemId: string, direction: 'up' | 'down') => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    const index = module.items.findIndex(item => item.id === itemId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= module.items.length) return

    // Créer une copie des éléments
    const updatedItems = [...module.items]
    const [moved] = updatedItems.splice(index, 1)
    updatedItems.splice(newIndex, 0, moved)

    // Mettre à jour les positions
    updatedItems.forEach((item, i) => {
      item.position = i
    })

    // Mettre à jour l'état
    setModules(modules.map(m =>
      m.id === moduleId
        ? { ...m, items: updatedItems }
        : m
    ))

    // Sauvegarder les nouvelles positions dans la base de données
    try {
      const updatePromises = updatedItems
        .filter(item => !item.id.startsWith('temp-'))
        .map((item, index) =>
          supabase
            .from('items')
            .update({ position: index })
            .eq('id', item.id)
        )

      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error updating item positions:', error)
      setError('Erreur lors de la mise à jour des positions.')
    }
  }

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
      <header className="bg-white shadow w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Nouvelle formation' : 'Modifier la formation'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {!isNew && courseId && (
                <Link
                  to={`/admin/courses/${courseId}/tp-associations`}
                  className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Associations TP</span>
                </Link>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Sauvegarde en cours...' : 'Sauvegarder'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full py-6 sm:px-6 lg:px-8">
        <div className="w-full px-4 py-6 sm:px-0 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Informations générales */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Informations générales
            </h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={course.title || ''}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  className="input-field"
                  placeholder="Titre de la formation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={course.description || ''}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  rows={8}
                  className="input-field font-mono text-sm"
                  placeholder="Description de la formation (vous pouvez utiliser des sauts de ligne pour structurer le texte)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Astuce : Utilisez des sauts de ligne pour créer des paragraphes. Utilisez <strong>**texte**</strong> pour mettre en gras.
                </p>
              </div>

              {/* Vignette de la formation */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vignette de la formation
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Ajoutez une image de prévisualisation pour cette formation. Cette image sera visible dans les listes de formations.
                </p>
                
                {course.thumbnail_image_path ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Image className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Vignette disponible
                          </p>
                          <p className="text-xs text-blue-700">
                            {course.thumbnail_image_path.split('/').pop()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleDeleteThumbnail}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                    <div className="mt-3">
                      <img
                        src={getThumbnailUrl() || ''}
                        alt="Vignette de la formation"
                        className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-blue-200 shadow-sm"
                        onError={(e) => {
                          console.error('Erreur de chargement de l\'image:', e)
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <ImageUploadCarousel
                      onImageUploaded={handleThumbnailUpload}
                      currentImageUrl={getThumbnailUrl() || undefined}
                      disabled={uploadingThumbnail || isNew}
                    />
                    {isNew && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        ⚠️ Sauvegardez d'abord la formation pour pouvoir uploader une vignette
                      </p>
                    )}
                    {uploadingThumbnail && (
                      <p className="text-sm text-blue-600 mt-2 text-center">
                        Sauvegarde de la vignette...
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={course.status || 'draft'}
                    onChange={(e) => setCourse({ ...course, status: e.target.value as 'draft' | 'published' })}
                    className="input-field"
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
                    value={course.access_type || 'free'}
                    onChange={(e) => setCourse({
                      ...course,
                      access_type: e.target.value as 'free' | 'paid' | 'invite',
                      is_paid: e.target.value === 'paid'
                    })}
                    className="input-field"
                  >
                    <option value="free">Gratuit</option>
                    <option value="paid">Payant</option>
                    <option value="invite">Sur invitation</option>
                  </select>
                </div>
              </div>

              {course.access_type === 'paid' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (centimes)
                    </label>
                    <input
                      type="number"
                      value={course.price_cents || ''}
                      onChange={(e) => setCourse({ ...course, price_cents: parseInt(e.target.value) || null })}
                      className="input-field"
                      placeholder="5000 pour 50€"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Devise
                    </label>
                    <input
                      type="text"
                      value={course.currency || 'EUR'}
                      onChange={(e) => setCourse({ ...course, currency: e.target.value })}
                      className="input-field"
                      placeholder="EUR"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={course.allow_pdf_download || false}
                    onChange={(e) => setCourse({ ...course, allow_pdf_download: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Autoriser le téléchargement PDF du cours complet
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Format paysage : slides à gauche, contexte pédagogique à droite
                </p>

                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={course.is_public || false}
                      onChange={(e) => setCourse({ ...course, is_public: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Rendre publique (afficher sur la landing page)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    {course.is_public 
                      ? '✅ Cette formation sera visible sur la landing page et apparaîtra dans les nouvelles formations'
                      : '⚠️ Cette formation ne sera pas visible sur la landing page'}
                  </p>
                  {course.is_public && course.publication_date && (
                    <p className="text-xs text-blue-600 mt-1 ml-6">
                      📅 Publiée le {new Date(course.publication_date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modules et éléments */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Modules et éléments
              </h2>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Button clicked, courseId:', courseId, 'isNew:', isNew)
                  addModule()
                }}
                className="btn-secondary inline-flex items-center space-x-2"
                title="Ajouter un nouveau module"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un module</span>
              </button>
            </div>

            {modules.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun module créé. Cliquez sur "Ajouter un module" pour commencer.
              </p>
            ) : (
              <div className="space-y-6">
                {modules.map((module, moduleIndex) => {
                  const isModuleDragged = draggedModuleId === module.id
                  const isModuleDragOver = dragOverModuleId === module.id
                  
                  return (
                    <div
                      key={module.id}
                      draggable
                      onDragStart={(e) => handleModuleDragStart(e, module.id)}
                      onDragEnd={handleModuleDragEnd}
                      onDragOver={(e) => handleModuleDragOver(e, module.id)}
                      onDragLeave={handleModuleDragLeave}
                      onDrop={(e) => handleModuleDrop(e, module.id)}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        isModuleDragged
                          ? 'opacity-50 border-blue-400 shadow-lg scale-95'
                          : 'border-gray-200'
                      } ${
                        isModuleDragOver
                          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-400 shadow-md'
                          : 'hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div
                            className="cursor-move"
                            title="Glisser-déposer pour réorganiser les modules"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors" />
                          </div>
                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) => updateModule(module.id, { title: e.target.value })}
                            className="text-lg font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 flex-1 min-w-0 w-full"
                            placeholder="Titre du module"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Boutons de déplacement du module */}
                          <div className="flex flex-col space-y-0.5 mr-2 border-r border-gray-300 pr-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                moveModule(module.id, 'up')
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation()
                              }}
                              disabled={moduleIndex === 0}
                              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent p-1 rounded transition-colors"
                              title="Monter le module"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                moveModule(module.id, 'down')
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation()
                              }}
                              disabled={moduleIndex === modules.length - 1}
                              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent p-1 rounded transition-colors"
                              title="Descendre le module"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              
                              try {
                                // Vérifier s'il existe une présentation Gamma pour ce cours
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

                                // Sinon, utiliser le comportement par défaut
                                const presentationUrl = `${window.location.origin}/presentation/${courseId}`
                                const presentationWindow = window.open(
                                  presentationUrl,
                                  'presentation',
                                  'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
                                )
                                
                                if (!presentationWindow) {
                                  alert('Veuillez autoriser les popups pour ouvrir la présentation dans une nouvelle fenêtre.')
                                }
                              } catch (error) {
                                console.error('Erreur lors de l\'ouverture de la présentation:', error)
                                // Fallback vers le comportement par défaut
                                const presentationUrl = `${window.location.origin}/presentation/${courseId}`
                                window.open(
                                  presentationUrl,
                                  'presentation',
                                  'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
                                )
                              }
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                            }}
                            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Ouvrir la présentation de tous les chapitres du module"
                          >
                            <Presentation className="w-4 h-4" />
                            <span>Présentation</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              addItem(module.id)
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            + Élément
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteModule(module.id)
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    {module.items.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">
                        Aucun élément dans ce module.
                      </p>
                    ) : (
                      <div className="space-y-3 ml-7">
                        {module.items.map((item) => {
                          const isDragged = draggedItemId === item.id
                          const isDragOver = dragOverItemId === item.id
                          
                          return (
                            <div
                              key={item.id}
                              onDragOver={(e) => {
                                // Permettre le drop uniquement si on est en train de dragger un élément
                                if (draggedItemId) {
                                  handleItemDragOver(e, item.id)
                                }
                              }}
                              onDragLeave={handleItemDragLeave}
                              onDrop={(e) => {
                                if (draggedItemId) {
                                  handleItemDrop(e, module.id, item.id)
                                }
                              }}
                              className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-all border-2 ${
                                isDragged 
                                  ? 'opacity-50 border-blue-400 shadow-lg scale-95' 
                                  : 'border-transparent'
                              } ${
                                isDragOver 
                                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-400 shadow-md' 
                                  : 'hover:bg-gray-100 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    e.stopPropagation()
                                    handleItemDragStart(e, module.id, item.id)
                                  }}
                                  onDragEnd={handleItemDragEnd}
                                  className="cursor-move"
                                  title="Glisser-déposer pour réorganiser"
                                >
                                  <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors" />
                                </div>
                                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                  item.type === 'resource' ? 'bg-blue-500' :
                                  item.type === 'slide' ? 'bg-green-500' :
                                  item.type === 'exercise' ? 'bg-yellow-500' :
                                  item.type === 'tp' ? 'bg-purple-500' :
                                  'bg-red-500'
                                }`} />
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateItem(module.id, item.id, { title: e.target.value })}
                                  className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 flex-1 min-w-0 w-full"
                                  placeholder="Titre de l'élément"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="text-xs text-gray-500 capitalize flex-shrink-0">
                                  {item.type}
                                </span>
                              </div>
                              <div 
                                className="flex items-center space-x-2" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation()
                                }}
                              >
                                {/* Boutons de déplacement */}
                                <div className="flex flex-col space-y-0.5 mr-2 border-r border-gray-300 pr-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      moveItem(module.id, item.id, 'up')
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation()
                                    }}
                                    disabled={module.items.findIndex(i => i.id === item.id) === 0}
                                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent p-1 rounded transition-colors"
                                    title="Monter"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      moveItem(module.id, item.id, 'down')
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation()
                                    }}
                                    disabled={module.items.findIndex(i => i.id === item.id) === module.items.length - 1}
                                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent p-1 rounded transition-colors"
                                    title="Descendre"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                </div>
                                {item.id.startsWith('temp-') ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      saveAndEditItem(module.id, item)
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation()
                                    }}
                                    disabled={saving || module.id.startsWith('temp-')}
                                    className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    title={module.id.startsWith('temp-') 
                                      ? "Sauvegardez d'abord le module" 
                                      : "Sauvegarder et modifier cet élément"}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <>
                                    <Link
                                      to={`/admin/items/${item.id}/json?returnTo=${encodeURIComponent(`/admin/courses/${courseId}`)}`}
                                      className="text-purple-600 hover:text-purple-800"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                      }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation()
                                      }}
                                      title="Éditer en JSON"
                                    >
                                      <Code className="w-4 h-4" />
                                    </Link>
                                    <Link
                                      to={`/admin/items/${item.id}/edit?returnTo=${encodeURIComponent(`/admin/courses/${courseId}`)}`}
                                      className="text-blue-600 hover:text-blue-800"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                      }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation()
                                      }}
                                      title="Éditer"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Link>
                                    {/* Bouton présentation pour les items avec chapitres */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        // Ouvrir la présentation dans une nouvelle fenêtre
                                        const presentationUrl = `${window.location.origin}/presentation/${courseId}`
                                        const presentationWindow = window.open(
                                          presentationUrl,
                                          'presentation',
                                          'width=1920,height=1080,fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
                                        )
                                        
                                        if (!presentationWindow) {
                                          alert('Veuillez autoriser les popups pour ouvrir la présentation dans une nouvelle fenêtre.')
                                        }
                                      }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation()
                                      }}
                                      className="text-green-600 hover:text-green-800"
                                      title="Ouvrir la présentation des chapitres de cet élément"
                                    >
                                      <Presentation className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    deleteItem(module.id, item.id)
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation()
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                  title="Supprimer cet élément"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Ressources de la formation */}
          {!isNew && courseId && (
            <div className="bg-white shadow rounded-lg p-6">
              <CourseResourcesManager courseId={courseId} />
            </div>
          )}

          {/* Documents à compléter */}
          {!isNew && courseId && (
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <FillableDocumentsManager courseId={courseId} />
            </div>
          )}
        </div>
      </main>

      {/* Modal LinkedIn */}
      {course.id && (
        <LinkedInPostModal
          course={course as Course}
          isOpen={showLinkedInModal}
          onClose={() => setShowLinkedInModal(false)}
        />
      )}
    </div>
  )
}
