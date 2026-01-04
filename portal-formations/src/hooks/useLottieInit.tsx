import { useEffect, useRef } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { LottiePlayer } from '../components/LottiePlayer'

// Stocker les roots React de manière globale pour éviter les doublons
const lottieRoots = new Map<HTMLElement, Root>()

/**
 * Hook pour initialiser les animations Lottie dans le contenu
 * Utilise lottie-react via le composant LottiePlayer pour une meilleure compatibilité
 */
export function useLottieInit(content: any) {
  const isInitialized = useRef(false)

  useEffect(() => {
    // Initialiser les animations Lottie côté client
    const initLottieAnimations = () => {
      if (typeof window === 'undefined') return

      // Trouver tous les conteneurs Lottie
      const containers = document.querySelectorAll('[data-lottie-animation="true"]')

      // Nettoyer les roots pour les éléments DOM qui n'existent plus
      lottieRoots.forEach((root, element) => {
        if (!document.contains(element)) {
          try {
            root.unmount()
          } catch (e) {
            // Ignorer les erreurs de démontage
          }
          lottieRoots.delete(element)
          delete (element as any).__lottieRoot
        }
      })

      containers.forEach((container) => {
        const div = container as HTMLElement
        const src = div.getAttribute('data-src')
        const autoplay = div.getAttribute('data-autoplay') !== 'false'
        const loop = div.getAttribute('data-loop') !== 'false'
        const size = div.getAttribute('data-size') || '2'
        
        if (!src) {
          console.warn('Lottie container missing data-src attribute')
          return
        }

        // Vérifier si un root existe déjà pour ce conteneur
        // Utiliser une propriété sur l'élément DOM pour stocker la référence
        let root = (div as any).__lottieRoot as Root | undefined
        
        if (!root) {
          // Vérifier si React a déjà un root sur cet élément
          // React stocke le root dans une propriété interne
          const reactRoot = (div as any)._reactRootContainer
          if (reactRoot) {
            // Un root existe déjà, ne pas en créer un nouveau
            console.warn('React root already exists on this element, skipping')
            return
          }
          
          // Nettoyer le contenu du conteneur avant de créer un nouveau root
          div.innerHTML = ''
          
          // Créer un nouveau root React pour ce conteneur
          root = createRoot(div)
          lottieRoots.set(div, root)
          // Stocker aussi sur l'élément DOM pour référence rapide
          ;(div as any).__lottieRoot = root
        }

        // Rendre ou mettre à jour le composant LottiePlayer
        root.render(
          <LottiePlayer
            src={src}
            autoplay={autoplay}
            loop={loop}
            className={`widget-size-${size}`}
          />
        )
      })
    }

    // Attendre que le DOM soit prêt
    const timeoutId = setTimeout(() => {
      initLottieAnimations()
      isInitialized.current = true
    }, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [content])

  // Nettoyage lors du démontage du composant parent
  useEffect(() => {
    return () => {
      // Ne pas nettoyer ici car les conteneurs peuvent être réutilisés
      // Le nettoyage se fera automatiquement quand les éléments DOM sont supprimés
    }
  }, [])
}
