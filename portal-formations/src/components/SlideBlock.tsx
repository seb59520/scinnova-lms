import { PdfViewer } from './PdfViewer'
import { RichTextEditor } from './RichTextEditor'
import { supabase } from '../lib/supabaseClient'
import { AlertTriangle } from 'lucide-react'

interface SlideBlockProps {
  item: {
    title: string
    asset_path?: string
    content?: {
      body?: any
      description?: string
      summary?: string
    }
  }
  theme: {
    primaryColor: string
    secondaryColor: string
    fontFamily?: string
  }
}

/**
 * Composant pour afficher une slide (support projeté)
 * Affiche un message d'avertissement si aucun contenu de slide n'est présent
 */
export function SlideBlock({ item, theme }: SlideBlockProps) {
  // Vérifier si la slide a du contenu
  const hasAsset = !!item.asset_path
  const hasBody = !!item.content?.body
  
  // Si aucun contenu n'est disponible, afficher le message d'avertissement
  if (!hasAsset && !hasBody) {
    return (
      <div className="slide-block mb-6">
        <div 
          className="p-6 rounded-lg border-2 border-dashed flex items-center space-x-4"
          style={{ 
            backgroundColor: '#FEF3C7',
            borderColor: '#F59E0B'
          }}
        >
          <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-amber-900 font-semibold text-lg mb-1">
              ⚠️ Aucun slide projeté pour cette section
            </p>
            <p className="text-amber-800 text-sm">
              Le contenu pédagogique sera disponible ci-dessous une fois le slide ajouté.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Afficher la slide si elle existe
  return (
    <div className="slide-block mb-6">
      {/* Slide avec asset_path (image ou PDF) */}
      {item.asset_path && (() => {
        const { data } = supabase.storage
          .from('course-assets')
          .getPublicUrl(item.asset_path)

        return (
          <div className="slide-content bg-white rounded-lg shadow-md p-4">
            {/* Description/résumé optionnel au-dessus de la slide */}
            {(item.content?.summary || item.content?.description) && (
              <div 
                className="p-3 rounded-lg mb-4"
                style={{ backgroundColor: `${theme.primaryColor}10` }}
              >
                <p className="text-gray-700 text-sm">
                  {item.content?.summary || item.content?.description}
                </p>
              </div>
            )}
            
            {/* Contenu de la slide */}
            {item.asset_path.endsWith('.pdf') ? (
              <PdfViewer url={data.publicUrl} />
            ) : (
              <div className="flex justify-center">
                <img
                  src={data.publicUrl}
                  alt={item.title}
                  className="max-w-full max-h-[calc(100vh-300px)] h-auto rounded-lg shadow object-contain"
                />
              </div>
            )}
          </div>
        )
      })()}

      {/* Slide avec contenu body (rich text) */}
      {!item.asset_path && item.content?.body && (
        <div className="slide-content bg-white rounded-lg shadow-md p-6">
          <div className="prose max-w-none">
            <RichTextEditor
              content={item.content.body}
              onChange={() => {}}
              editable={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}

