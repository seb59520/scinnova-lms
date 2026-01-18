import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Presentation, FileText, Download, Image as ImageIcon } from 'lucide-react'
import { useGammaPresentation } from '../hooks/useGammaPresentation'

interface GammaSlide {
  id: string
  title: string
  gammaUrl: string
  pdfUrl?: string
  pptxUrl?: string
  moduleTitle?: string
}

interface CourseGammaSlidesProps {
  courseId: string
}

export function CourseGammaSlides({ courseId }: CourseGammaSlidesProps) {
  const [gammaSlides, setGammaSlides] = useState<GammaSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Le hook doit être appelé inconditionnellement
  // Si le provider n'est pas disponible, cela générera une erreur explicite
  const { openGammaPresentation } = useGammaPresentation()

  useEffect(() => {
    if (courseId) {
      fetchGammaSlides()
    }
  }, [courseId])

  const fetchGammaSlides = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!courseId) {
        setGammaSlides([])
        setLoading(false)
        return
      }

      // Récupérer tous les modules du cours
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, title')
        .eq('course_id', courseId)
        .order('position', { ascending: true })

      if (modulesError) {
        console.error('Erreur lors de la récupération des modules:', modulesError)
        setError('Erreur lors du chargement')
        setLoading(false)
        return
      }

      if (!modulesData || modulesData.length === 0) {
        setGammaSlides([])
        setLoading(false)
        return
      }

      const moduleIds = modulesData.map(m => m.id)
      const moduleMap = new Map(modulesData.map(m => [m.id, m.title]))

      // Récupérer tous les items avec des présentations Gamma
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id, title, asset_path, pdf_url, pptx_url, module_id')
        .in('module_id', moduleIds)
        .not('asset_path', 'is', null)
        .like('asset_path', 'https://gamma.app/%')
        .order('position', { ascending: true })

      if (itemsError) {
        console.error('Erreur lors de la récupération des items:', itemsError)
        setError('Erreur lors du chargement')
        setLoading(false)
        return
      }

      if (itemsData) {
        const slides: GammaSlide[] = itemsData
          .map((item: any) => ({
            id: item.id,
            title: item.title || 'Sans titre',
            gammaUrl: item.asset_path,
            pdfUrl: item.pdf_url,
            pptxUrl: item.pptx_url,
            moduleTitle: moduleMap.get(item.module_id),
          }))
          .filter((slide) => slide.gammaUrl) // S'assurer que l'URL existe

        setGammaSlides(slides)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des slides Gamma:', error)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null // Ne rien afficher pendant le chargement pour éviter de bloquer la page
  }

  if (error) {
    // En cas d'erreur, ne rien afficher pour ne pas bloquer la page
    console.error('Erreur dans CourseGammaSlides:', error)
    return null
  }

  if (gammaSlides.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Presentation className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">Présentations Gamma</h2>
        <span className="text-sm text-gray-500">({gammaSlides.length})</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gammaSlides.map((slide) => (
          <div
            key={slide.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => {
              openGammaPresentation({
                gammaUrl: slide.gammaUrl,
                pdfUrl: slide.pdfUrl,
                pptxUrl: slide.pptxUrl,
              })
            }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Presentation className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                  {slide.title}
                </h3>
                {slide.moduleTitle && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{slide.moduleTitle}</p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openGammaPresentation({
                        gammaUrl: slide.gammaUrl,
                        pdfUrl: slide.pdfUrl,
                        pptxUrl: slide.pptxUrl,
                      })
                    }}
                    className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center space-x-1"
                    title="Ouvrir en mode présentation"
                  >
                    <Presentation className="w-3 h-3" />
                    <span>Présentation</span>
                  </button>
                  {slide.pdfUrl && (
                    <a
                      href={slide.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1"
                      title="Télécharger le PDF"
                    >
                      <FileText className="w-3 h-3" />
                      <span>PDF</span>
                    </a>
                  )}
                  {slide.pptxUrl && (
                    <a
                      href={slide.pptxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1"
                      title="Télécharger le PPTX"
                    >
                      <Download className="w-3 h-3" />
                      <span>PPTX</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
