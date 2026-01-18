/**
 * Service pour générer des présentations Gamma via l'API Gamma
 * Documentation: https://developers.gamma.app/reference/generate-a-gamma
 * 
 * Note: Les appels passent par une Edge Function Supabase pour éviter les problèmes CORS
 * et sécuriser la clé API côté serveur.
 */

import { supabase } from './supabaseClient'

export interface GammaGenerationRequest {
  inputText: string
  textMode: 'generate' | 'condense' | 'preserve'
  format?: 'presentation' | 'document' | 'social' | 'webpage'
  themeId?: string
  numCards?: number
  cardSplit?: 'auto' | 'inputTextBreaks'
  additionalInstructions?: string
  textOptions?: {
    amount?: 'concise' | 'balanced' | 'detailed'
    tone?: string
    audience?: string
    language?: string
  }
  imageOptions?: {
    source?: 'aiGenerated' | 'unsplash' | 'none'
    model?: string
    style?: string
  }
  exportAs?: 'pdf' | 'pptx' | 'html'
}

export interface GammaGenerationResponse {
  generationId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  gammaUrl?: string
  pdfUrl?: string
  pptxUrl?: string
  htmlUrl?: string
  error?: string
}

/**
 * Génère une présentation Gamma à partir d'un texte
 * Utilise une Edge Function Supabase pour éviter les problèmes CORS
 */
export async function generateGamma(
  request: GammaGenerationRequest
): Promise<GammaGenerationResponse> {
  try {
    console.log('🚀 Appel à l\'Edge Function generate-gamma avec:', {
      inputTextLength: request.inputText?.length,
      format: request.format,
    })

    // Vérifier que l'utilisateur est authentifié
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Vous devez être connecté pour utiliser cette fonctionnalité')
    }
    console.log('✅ Session utilisateur trouvée:', session.user.email)

    // Appel à l'Edge Function Supabase qui gère l'API Gamma côté serveur
    const { data, error } = await supabase.functions.invoke('generate-gamma', {
      body: {
        inputText: request.inputText,
        textMode: request.textMode || 'generate',
        format: request.format || 'presentation',
        themeId: request.themeId,
        numCards: request.numCards,
        cardSplit: request.cardSplit || 'auto',
        additionalInstructions: request.additionalInstructions,
        textOptions: request.textOptions,
        imageOptions: request.imageOptions,
        exportAs: request.exportAs,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    console.log('📥 Réponse de l\'Edge Function:', { data, error })

    if (error) {
      console.error('❌ Erreur de l\'Edge Function:', error)
      
      // Si c'est une erreur 401, c'est probablement que l'Edge Function n'est pas déployée
      if (error.message?.includes('401') || error.message?.includes('non-2xx')) {
        throw new Error(
          'L\'Edge Function "generate-gamma" n\'est pas déployée ou n\'est pas accessible. ' +
          'Veuillez déployer l\'Edge Function avec: supabase functions deploy generate-gamma'
        )
      }
      
      throw new Error(error.message || 'Erreur lors de l\'appel à l\'Edge Function')
    }

    if (!data) {
      throw new Error('Aucune donnée retournée par l\'Edge Function')
    }

    // Si l'Edge Function retourne une erreur
    if (data.error) {
      throw new Error(data.error)
    }

    // Retourner la réponse
    return {
      generationId: data.generationId,
      status: data.status,
      gammaUrl: data.gammaUrl,
      pdfUrl: data.pdfUrl,
      pptxUrl: data.pptxUrl,
      htmlUrl: data.htmlUrl,
      error: data.error,
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la génération Gamma:', error)
    throw new Error(
      error.message || 'Erreur lors de la génération de la présentation Gamma'
    )
  }
}


/**
 * Convertit le contenu d'une slide en texte formaté pour Gamma
 */
export function formatSlideContentForGamma(
  title: string,
  content: any,
  onScreenPoints?: string[],
  speakerNotes?: string
): string {
  let text = `# ${title}\n\n`

  // Ajouter les points à l'écran
  if (onScreenPoints && onScreenPoints.length > 0) {
    text += onScreenPoints.map((point) => `- ${point}`).join('\n') + '\n\n'
  }

  // Ajouter les notes du présentateur si disponibles
  if (speakerNotes) {
    text += `Notes du présentateur: ${speakerNotes}\n\n`
  }

  // Extraire le texte du contenu TipTap si disponible
  if (content && content.content) {
    const extractText = (node: any): string => {
      if (node.type === 'text' && node.text) {
        return node.text
      }
      if (node.type === 'heading' && node.content) {
        const headingText = node.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('')
        return headingText ? `## ${headingText}\n\n` : ''
      }
      if (node.type === 'paragraph' && node.content) {
        const paraText = node.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('')
        return paraText ? `${paraText}\n\n` : ''
      }
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join('')
      }
      return ''
    }

    const extractedText = content.content.map(extractText).join('')
    if (extractedText.trim()) {
      text += extractedText
    }
  }

  return text.trim()
}
