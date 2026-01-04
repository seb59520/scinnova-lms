import { useEffect, useRef, useState } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { LottieErrorBoundary } from './LottieErrorBoundary'

/**
 * Corrige les couches de texte dans le JSON Lottie pour éviter l'erreur t.a.length
 * Lottie-web essaie d'accéder à data2.t.a.length qui n'existe pas dans certains formats
 * L'erreur se produit car lottie-web s'attend à ce que layer.t.a soit un tableau
 */
function fixLottieTextLayers(data: any): any {
  const fixed = JSON.parse(JSON.stringify(data)) // Deep clone
  
  if (Array.isArray(fixed.layers)) {
    fixed.layers.forEach((layer: any) => {
      if (layer.ty === 5 && layer.t) {
        // Couche de texte - lottie-web s'attend à ce que layer.t.a existe
        // L'erreur data2.t.a.length indique que lottie-web essaie d'accéder à layer.t.a
        if (!layer.t.a) {
          layer.t.a = []
        }
        
        // S'assurer aussi que layer.t.d existe et a la bonne structure
        if (layer.t.d) {
          if (!layer.t.d.a) {
            layer.t.d.a = []
          }
          
          // Corriger les éléments dans layer.t.d.k
          if (Array.isArray(layer.t.d.k)) {
            layer.t.d.k.forEach((textItem: any) => {
              // S'assurer que chaque élément de texte a un tableau 'a' pour les animations
              if (!textItem.a) {
                textItem.a = []
              }
              
              // S'assurer que textItem.s existe et a la bonne structure
              if (textItem.s && !textItem.s.a) {
                // Ne pas modifier textItem.s car cela pourrait casser l'animation
                // L'erreur vient de layer.t.a, pas de textItem.s.a
              }
            })
          }
        }
      }
    })
  }
  
  return fixed
}

interface LottiePlayerProps {
  src: string
  autoplay?: boolean
  loop?: boolean
  className?: string
  width?: number | string
  height?: number | string
}

/**
 * Composant React pour afficher une animation Lottie
 * Utilise lottie-react qui est plus robuste que lottie-web
 */
export function LottiePlayer({
  src,
  autoplay = true,
  loop = true,
  className = '',
  width = '100%',
  height = 'auto',
}: LottiePlayerProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [animationData, setAnimationData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const jsonPath = src.startsWith('/') ? src : `/${src}`
        const response = await fetch(jsonPath)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Valider que c'est un JSON Lottie valide
        if (!data.v || !Array.isArray(data.layers)) {
          throw new Error('Invalid Lottie JSON format')
        }
        
        // Corriger les couches de texte pour éviter l'erreur t.a.length
        // Lottie-web/lottie-react essaie d'accéder à data2.t.a.length qui n'existe pas
        const correctedData = fixLottieTextLayers(data)
        
        setAnimationData(correctedData)
      } catch (err) {
        console.error('Error loading Lottie animation:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    if (src) {
      loadAnimation()
    }
  }, [src])

  if (loading) {
    return (
      <div 
        className={`lottie-animation-container ${className}`}
        style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}
      >
        <div className="text-gray-500 text-sm">Chargement de l'animation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`lottie-animation-error ${className}`} style={{ width, height }}>
        <p className="font-semibold mb-1">Erreur lors du chargement de l'animation Lottie</p>
        <p className="text-xs">{error}</p>
        <p className="text-xs mt-1">Fichier: {src}</p>
      </div>
    )
  }

  if (!animationData) {
    return null
  }

  return (
    <LottieErrorBoundary
      fallback={
        <div className={`lottie-animation-error ${className}`} style={{ width, height }}>
          <p className="font-semibold mb-1">⚠️ Erreur dans l'animation Lottie</p>
          <p className="text-xs">Fichier: {src}</p>
          <p className="text-xs mt-1 text-gray-500">
            Le fichier contient des couches de texte avec une structure incompatible.
            Essayez de réexporter depuis After Effects en convertissant les textes en formes (Create Outlines).
          </p>
        </div>
      }
    >
      <div 
        className={`lottie-animation-container ${className}`}
        style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          style={{ width: '100%', maxWidth: '100%', height: 'auto' }}
          onError={(error) => {
            console.error('Lottie animation error:', error)
            setError('Erreur lors de la lecture de l\'animation')
          }}
        />
      </div>
    </LottieErrorBoundary>
  )
}

