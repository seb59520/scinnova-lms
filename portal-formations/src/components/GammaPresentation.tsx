import { useEffect, useState, useCallback } from 'react'
import { X, Maximize2, Settings, ExternalLink, Download, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { captureGammaSlides } from '../lib/gammaScreenshot'

interface GammaPresentationProps {
  gammaUrl: string
  pdfUrl?: string
  pptxUrl?: string
  onClose: () => void
}

export function GammaPresentation({ 
  gammaUrl, 
  pdfUrl, 
  pptxUrl,
  onClose 
}: GammaPresentationProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState<string | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [capturingScreenshot, setCapturingScreenshot] = useState(false)
  const [useScreenshot, setUseScreenshot] = useState(false)

  // Fonction pour basculer le plein écran (mémorisée avec useCallback)
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }, [])

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, toggleFullscreen])

  // Gestion du plein écran natif
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Timeout pour détecter si l'iframe ne charge pas (écran noir)
  useEffect(() => {
    if (iframeLoading && !iframeError) {
      const timeout = setTimeout(() => {
        // Si après 4 secondes l'iframe est toujours en chargement, c'est probablement bloqué
        setIframeLoading(false)
        setIframeError('L\'iframe ne charge pas. Gamma bloque probablement l\'affichage. Utilisez la capture ou ouvrez dans un nouvel onglet.')
      }, 4000) // 4 secondes

      return () => clearTimeout(timeout)
    }
  }, [iframeLoading, iframeError])

  // Auto-capture si l'iframe échoue
  useEffect(() => {
    if (iframeError && !screenshotUrl && !capturingScreenshot) {
      // Proposer automatiquement la capture après 2 secondes
      const autoCaptureTimeout = setTimeout(() => {
        console.log('Tentative de capture automatique...')
        // Ne pas faire la capture automatiquement, mais afficher un message
      }, 2000)
      return () => clearTimeout(autoCaptureTimeout)
    }
  }, [iframeError, screenshotUrl, capturingScreenshot])

  // Détecter si l'iframe est bloquée (X-Frame-Options)
  useEffect(() => {
    const checkIframeBlocked = () => {
      const iframe = document.querySelector('iframe[title="Présentation Gamma"]') as HTMLIFrameElement
      if (iframe && iframeLoading) {
        setTimeout(() => {
          try {
            // Si on ne peut pas accéder au contenu après 2 secondes, c'est probablement bloqué
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
            if (!iframeDoc && iframeLoading) {
              setIframeLoading(false)
              setIframeError('Gamma bloque l\'affichage dans un iframe. Cliquez sur "Ouvrir dans un nouvel onglet" pour voir la présentation.')
            }
          } catch (e) {
            // Erreur CORS normale, mais si l'iframe est toujours en chargement, c'est suspect
            if (iframeLoading) {
              setTimeout(() => {
                setIframeLoading(false)
                setIframeError('Gamma bloque probablement l\'affichage dans un iframe. Utilisez "Ouvrir dans un nouvel onglet".')
              }, 2000)
            }
          }
        }, 2000)
      }
    }

    if (iframeLoading) {
      checkIframeBlocked()
    }
  }, [iframeLoading, gammaUrl])


  // Si l'iframe ne peut pas charger (Gamma bloque l'embedding), proposer d'ouvrir dans un nouvel onglet
  const handleOpenInNewTab = () => {
    window.open(gammaUrl, '_blank', 'noopener,noreferrer')
    onClose()
  }

  // Ouvrir directement dans un nouvel onglet au lieu d'un iframe (si Gamma bloque l'embedding)
  // Cette fonction peut être appelée automatiquement si on détecte que l'iframe ne fonctionne pas
  useEffect(() => {
    // Si après 3 secondes l'iframe n'a toujours pas chargé, ouvrir automatiquement dans un nouvel onglet
    if (iframeLoading) {
      const autoOpenTimeout = setTimeout(() => {
        // Ne pas ouvrir automatiquement, mais afficher un message clair
        console.log('Iframe Gamma ne charge pas, probablement bloquée par X-Frame-Options')
      }, 3000)

      return () => clearTimeout(autoOpenTimeout)
    }
  }, [iframeLoading, gammaUrl])

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden">
      {/* Contrôles en haut */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-2 md:p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Fermer"
            title="Fermer (Échap)"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-sm font-medium">
            <div>Présentation Gamma</div>
            <div className="text-xs text-white/70">Mode présentation</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {(pdfUrl || pptxUrl) && (
            <div className="flex items-center space-x-2 mr-4">
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  title="Télécharger le PDF"
                >
                  <Download className="w-5 h-5" />
                </a>
              )}
              {pptxUrl && (
                <a
                  href={pptxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  title="Télécharger le PPTX"
                >
                  <Download className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
          <button
            onClick={async () => {
              if (!screenshotUrl && !capturingScreenshot) {
                setCapturingScreenshot(true)
                try {
                  const result = await captureGammaSlides({
                    gammaUrl,
                    itemId: undefined,
                  })
                  if (result.success && result.screenshotUrl) {
                    setScreenshotUrl(result.screenshotUrl)
                    setUseScreenshot(true)
                  } else {
                    alert(result.error || 'Impossible de capturer la présentation')
                  }
                } catch (error: any) {
                  alert('Erreur lors de la capture: ' + error.message)
                } finally {
                  setCapturingScreenshot(false)
                }
              } else if (screenshotUrl) {
                setUseScreenshot(!useScreenshot)
              }
            }}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
            title={screenshotUrl ? (useScreenshot ? 'Afficher l\'iframe' : 'Afficher la capture') : 'Capturer la présentation en image'}
            disabled={capturingScreenshot}
          >
            {capturingScreenshot ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : screenshotUrl && useScreenshot ? (
              <ExternalLink className="w-5 h-5" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>
          <a
            href={gammaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Plein écran"
            title="Plein écran (F)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contenu principal - iframe avec la présentation Gamma */}
      <div className="h-full pt-16 relative">
        {iframeLoading && !iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-sm mb-2">Chargement de la présentation...</p>
              <p className="text-white/60 text-xs">Si l'écran reste noir, utilisez le bouton de capture (icône appareil photo) en haut à droite</p>
            </div>
          </div>
        )}
        {iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center max-w-md px-4">
              <p className="text-red-400 text-lg mb-2">Impossible de charger dans l'iframe</p>
              <p className="text-white/70 text-sm mb-2">
                Gamma bloque l'affichage dans un iframe pour des raisons de sécurité.
              </p>
              <p className="text-white/50 text-xs mb-6 break-all">
                URL : {gammaUrl}
              </p>
              <div className="flex flex-col items-center justify-center space-y-3">
                <p className="text-white/80 text-sm mb-2 text-center">
                  Gamma bloque l'affichage dans un iframe. Solution recommandée :
                </p>
                <button
                  onClick={handleOpenInNewTab}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full justify-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ouvrir dans un nouvel onglet (Recommandé)</span>
                </button>
                <div className="text-white/60 text-xs text-center mb-2">OU</div>
                <button
                  onClick={async () => {
                    setCapturingScreenshot(true)
                    setIframeError(null)
                    try {
                      const result = await captureGammaSlides({
                        gammaUrl,
                        itemId: undefined,
                      })
                      if (result.success && result.screenshotUrl) {
                        setScreenshotUrl(result.screenshotUrl)
                        setUseScreenshot(true)
                        setIframeError(null)
                      } else {
                        const errorMsg = result.error || 'Impossible de capturer la présentation'
                        const suggestion = result.suggestion || 'Utilisez "Ouvrir dans un nouvel onglet" ci-dessus.'
                        const details = result.details ? `\n\nDétails: ${result.details}` : ''
                        const configInfo = result.hasScreenshotKey !== undefined 
                          ? `\n\nConfiguration: SCREENSHOT_API_KEY=${result.hasScreenshotKey ? '✓' : '✗'}, HTMLCSSTOIMAGE_API_KEY=${result.hasHtmlCssKey ? '✓' : '✗'}`
                          : ''
                        alert(`${errorMsg}${suggestion ? '\n\n' + suggestion : ''}${details}${configInfo}`)
                      }
                    } catch (error: any) {
                      alert('Erreur lors de la capture: ' + error.message + '\n\nUtilisez "Ouvrir dans un nouvel onglet" ci-dessus.')
                    } finally {
                      setCapturingScreenshot(false)
                    }
                  }}
                  disabled={capturingScreenshot}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2 w-full justify-center"
                >
                  {capturingScreenshot ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Capture en cours...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>Capturer la présentation (nécessite configuration)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIframeError(null)
                    setIframeLoading(true)
                    // Forcer le rechargement de l'iframe
                    const iframe = document.querySelector('iframe[title="Présentation Gamma"]') as HTMLIFrameElement
                    if (iframe) {
                      iframe.src = gammaUrl
                    }
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Réessayer l'iframe
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Afficher la capture d'écran si disponible et activée */}
        {useScreenshot && screenshotUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <img
              src={screenshotUrl}
              alt="Présentation Gamma"
              className="max-w-full max-h-full object-contain"
              onError={() => {
                setUseScreenshot(false)
                alert('Erreur lors du chargement de l\'image. Retour à l\'iframe.')
              }}
            />
          </div>
        ) : (
          <iframe
            src={gammaUrl}
            className="w-full h-full border-0"
            allowFullScreen
            title="Présentation Gamma"
            style={{
              backgroundColor: '#000'
            }}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            onLoad={() => {
              // Vérifier si l'iframe a vraiment chargé du contenu après un court délai
              setTimeout(() => {
                const iframe = document.querySelector('iframe[title="Présentation Gamma"]') as HTMLIFrameElement
                if (iframe) {
                  try {
                    // Essayer d'accéder au contenu pour vérifier si c'est bloqué
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
                    if (!iframeDoc) {
                      // C'est probablement un problème de CORS/X-Frame-Options
                      console.log('Iframe bloquée par CORS/X-Frame-Options')
                      setIframeLoading(false)
                      setIframeError('Gamma bloque l\'affichage dans un iframe. Utilisez la capture ou ouvrez dans un nouvel onglet.')
                    } else {
                      // L'iframe a chargé avec succès
                      setIframeLoading(false)
                      setIframeError(null)
                    }
                  } catch (e) {
                    // Erreur CORS normale, mais l'iframe peut quand même être vide/noire
                    console.log('Erreur CORS, vérification si l\'iframe est vide...')
                    // Attendre un peu plus pour voir si du contenu apparaît
                    setTimeout(() => {
                      setIframeLoading(false)
                      // Si après 2 secondes supplémentaires, on ne voit toujours rien, considérer comme erreur
                      setIframeError('L\'iframe semble vide. Gamma bloque probablement l\'affichage.')
                    }, 2000)
                  }
                }
              }, 2000) // Attendre 2 secondes pour que la page charge
            }}
            onError={() => {
              setIframeLoading(false)
              setIframeError('Erreur lors du chargement de l\'iframe. Gamma bloque probablement l\'embedding.')
            }}
          />
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10 text-xs text-white/60 hidden md:block">
        <div className="space-y-1">
          <div>F Plein écran</div>
          <div>Échap Quitter</div>
        </div>
      </div>
    </div>
  )
}
