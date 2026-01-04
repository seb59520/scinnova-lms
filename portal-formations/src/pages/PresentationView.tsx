import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Chapter } from '../types/database'
import { ChapterPresentation } from '../components/ChapterPresentation'

export function PresentationView() {
  const { courseId } = useParams<{ courseId: string }>()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (courseId) {
      fetchChapters()
    }
  }, [courseId])

  const fetchChapters = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!courseId) {
        setError('ID du cours manquant')
        return
      }

      // Récupérer tous les modules du cours
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId)
        .order('position', { ascending: true })
      
      if (modulesError) throw modulesError
      
      if (!modulesData || modulesData.length === 0) {
        setError('Ce cours ne contient aucun module.')
        setLoading(false)
        return
      }
      
      const moduleIds = modulesData.map(m => m.id)
      
      // Récupérer tous les items de ces modules
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id')
        .in('module_id', moduleIds)
      
      if (itemsError) throw itemsError
      
      if (!itemsData || itemsData.length === 0) {
        setError('Ce cours ne contient aucun élément avec des chapitres.')
        setLoading(false)
        return
      }
      
      const itemIds = itemsData.map(i => i.id)
      
      // Récupérer tous les items avec leur position et module_id pour le tri
      const { data: itemsWithPosition, error: itemsPosError } = await supabase
        .from('items')
        .select('id, position, module_id')
        .in('id', itemIds)
      
      if (itemsPosError) throw itemsPosError
      
      // Créer une map pour accéder rapidement à la position des items
      const itemPositionMap = new Map<string, number>()
      itemsWithPosition?.forEach(item => {
        itemPositionMap.set(item.id, item.position ?? 999)
      })
      
      // Récupérer tous les chapitres avec leurs items et modules
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select(`
          *,
          items (
            id,
            module_id,
            position,
            modules (
              id,
              title,
              position
            )
          )
        `)
        .in('item_id', itemIds)
        .order('position', { ascending: true })
      
      if (chaptersError) throw chaptersError
      
      if (!chaptersData || chaptersData.length === 0) {
        setError('Ce cours ne contient aucun chapitre.')
        setLoading(false)
        return
      }
      
      // Trier les chapitres par: module position -> item position -> chapter position
      const sortedChapters = chaptersData.sort((a: any, b: any) => {
        // 1. Trier par position du module
        const moduleA = a.items?.modules?.position ?? 999
        const moduleB = b.items?.modules?.position ?? 999
        if (moduleA !== moduleB) {
          return moduleA - moduleB
        }
        
        // 2. Trier par position de l'item dans le module
        const itemA = a.items?.position ?? itemPositionMap.get(a.items?.id) ?? 999
        const itemB = b.items?.position ?? itemPositionMap.get(b.items?.id) ?? 999
        if (itemA !== itemB) {
          return itemA - itemB
        }
        
        // 3. Trier par position du chapitre dans l'item
        return (a.position ?? 999) - (b.position ?? 999)
      })
      
      // Log pour debug
      console.log('=== Chapitres triés ===')
      sortedChapters.forEach((ch: any, idx: number) => {
        console.log(`Chapitre ${idx + 1}:`, {
          title: ch.title,
          modulePosition: ch.items?.modules?.position,
          moduleTitle: ch.items?.modules?.title,
          itemPosition: ch.items?.position ?? itemPositionMap.get(ch.items?.id),
          chapterPosition: ch.position
        })
      })
      
      setChapters(sortedChapters as Chapter[])
    } catch (error) {
      console.error('Error fetching chapters:', error)
      setError('Erreur lors du chargement de la présentation.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la présentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  if (chapters.length === 0) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Aucun chapitre disponible.</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <ChapterPresentation
      chapters={chapters}
      initialIndex={0}
      onClose={() => window.close()}
      courseId={courseId}
    />
  )
}

