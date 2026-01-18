/**
 * Service pour capturer les slides Gamma en images
 * Utilise une Edge Function Supabase pour capturer les présentations Gamma
 */

import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export interface CaptureGammaRequest {
  gammaUrl: string
  itemId?: string
  numSlides?: number
}

export interface CaptureGammaResponse {
  success: boolean
  screenshotUrl?: string
  gammaUrl?: string
  error?: string
  suggestion?: string
  details?: string
  hasScreenshotKey?: boolean
  hasHtmlCssKey?: boolean
}

async function parseEdgeFunctionError(error: FunctionsHttpError) {
  const response = error.context?.response
  if (!response) {
    return null
  }

  try {
    const clonedResponse = response.clone()
    const text = await clonedResponse.text()
    if (!text) {
      return null
    }

    let payload: Record<string, any> | null = null
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { error: text }
    }

    return {
      error: payload?.error || payload?.message || error.message,
      suggestion: payload?.suggestion,
      details: payload?.details,
      hasScreenshotKey: payload?.hasScreenshotKey,
      hasHtmlCssKey: payload?.hasHtmlCssKey,
    }
  } catch (parseError) {
    console.warn('Impossible de lire la réponse de l\'Edge Function:', parseError)
    return null
  }
}

/**
 * Capture une présentation Gamma en image
 * Utilise une Edge Function Supabase pour éviter les problèmes CORS
 */
export async function captureGammaSlides(
  request: CaptureGammaRequest
): Promise<CaptureGammaResponse> {
  try {
    console.log('📸 Capture de la présentation Gamma:', request.gammaUrl)

    // Vérifier que l'utilisateur est authentifié
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return {
        success: false,
        error: 'Vous devez être connecté pour utiliser cette fonctionnalité',
      }
    }

    // Appel à l'Edge Function Supabase qui capture la présentation
    const { data, error } = await supabase.functions.invoke('capture-gamma-slides', {
      body: {
        gammaUrl: request.gammaUrl,
        itemId: request.itemId,
        numSlides: request.numSlides,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    console.log('📥 Réponse de l\'Edge Function:', { 
      hasData: !!data, 
      hasError: !!error,
      dataError: data?.error,
      dataSuggestion: data?.suggestion,
    })

    if (error) {
      console.error('❌ Erreur de l\'Edge Function:', error)

      if (error instanceof FunctionsHttpError) {
        const edgeError = await parseEdgeFunctionError(error)
        if (edgeError) {
          return {
            success: false,
            error: edgeError.error,
            suggestion:
              edgeError.suggestion ||
              'Vérifiez les logs dans Supabase ou configurez un service de capture.',
            details: edgeError.details,
            hasScreenshotKey: edgeError.hasScreenshotKey,
            hasHtmlCssKey: edgeError.hasHtmlCssKey,
          }
        }
      }

      // Si c'est une erreur 401, c'est probablement que l'Edge Function nécessite --no-verify-jwt
      if (error.message?.includes('401') || error.message?.includes('non-2xx')) {
        return {
          success: false,
          error: 'L\'Edge Function "capture-gamma-slides" a retourné une erreur.',
          suggestion: 'Vérifiez les logs dans le dashboard Supabase ou utilisez "Ouvrir dans un nouvel onglet" pour voir la présentation.',
        }
      }
      
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'appel à l\'Edge Function',
        suggestion: 'Utilisez "Ouvrir dans un nouvel onglet" pour voir la présentation sans capture.',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Aucune donnée retournée par l\'Edge Function',
        suggestion: 'Vérifiez les logs de l\'Edge Function dans le dashboard Supabase. Utilisez "Ouvrir dans un nouvel onglet" pour voir la présentation.',
      }
    }

    // Si l'Edge Function retourne une erreur
    if (data.error) {
      console.error('❌ Erreur retournée par l\'Edge Function:', data)
      return {
        success: false,
        error: data.error,
        suggestion: data.suggestion || 'La capture nécessite la configuration d\'un service de screenshot. Utilisez "Ouvrir dans un nouvel onglet" pour voir la présentation.',
        details: data.details,
        hasScreenshotKey: data.hasScreenshotKey,
        hasHtmlCssKey: data.hasHtmlCssKey,
      }
    }

    // Retourner la réponse
    return {
      success: data.success,
      screenshotUrl: data.screenshotUrl,
      gammaUrl: data.gammaUrl,
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la capture Gamma:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la capture de la présentation Gamma',
    }
  }
}
