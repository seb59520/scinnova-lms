import { supabase } from './supabaseClient'

// Configuration OpenRouter - à mettre dans les variables d'environnement
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''
// Modèle par défaut : gemini-3-flash-preview (fonctionne bien) ou gemini-pro si disponible
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-3-flash-preview'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface SlideContent {
  title: string
  objective?: string
  on_screen?: string[]
  speaker_notes?: string
  activity?: any
  mini_game?: any
}

interface CourseContext {
  courseTitle?: string
  courseDescription?: string
  moduleTitle?: string
  slidePosition?: number
  totalSlides?: number
  previousDesigns?: SlideDesign[] // Pour éviter la répétition
}

interface SlideDesign {
  backgroundColor: string
  textColor: string
  titleStyle: {
    fontSize: number
    fontWeight: string
    color: string
  }
  bulletPoints: {
    fontSize: number
    spacing: number
    color: string
  }
  layout: 'centered' | 'left-aligned' | 'split'
  accentColor: string
}

/**
 * Liste les modèles disponibles via OpenRouter
 */
async function listAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      }
    })
    if (!response.ok) {
      console.warn('⚠️ Impossible de lister les modèles disponibles')
      return []
    }
    const data = await response.json()
    const models = data.data
      ?.filter((m: any) => m.id?.includes('gemini') || m.id?.includes('gpt'))
      ?.map((m: any) => m.id)
      .filter((id: string) => id) || []
    console.log('📋 Modèles disponibles (exemples):', models.slice(0, 10))
    return models
  } catch (error) {
    console.warn('⚠️ Erreur lors de la liste des modèles:', error)
    return []
  }
}

/**
 * Génère un design de slide avec Gemini
 */
export async function generateSlideDesign(
  slide: SlideContent,
  context?: CourseContext
): Promise<SlideDesign> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY n\'est pas configurée dans les variables d\'environnement')
  }

  // Modèles à essayer dans l'ordre de priorité
  const defaultModels = [
    OPENROUTER_MODEL, // Modèle configuré dans .env
    'google/gemini-3-flash-preview', // Modèle qui fonctionne bien
    'google/gemini-3-pro-preview', // Alternative Gemini 3
    'google/gemini-1.5-pro',
    'google/gemini-1.5-flash',
    'openai/gpt-4o-mini', // Fallback sur GPT si Gemini ne fonctionne pas
    'anthropic/claude-3-haiku' // Autre fallback
  ]
  
  // Essayer de lister les modèles disponibles (optionnel)
  const availableModels = await listAvailableModels()
  
  // Construire la liste des modèles à essayer
  let modelsToTry: string[] = []
  if (availableModels.length > 0 && availableModels.some(m => m.includes('gemini'))) {
    // Utiliser les modèles Gemini disponibles
    const geminiModels = availableModels.filter(m => m.includes('gemini'))
    modelsToTry = [OPENROUTER_MODEL, ...geminiModels, ...defaultModels]
  } else {
    modelsToTry = defaultModels
  }
  
  // Supprimer les doublons
  modelsToTry = [...new Set(modelsToTry)]
  
  let lastError: any = null

  // Construire le contexte pour éviter la répétition
  let previousDesignsContext = ''
  if (context?.previousDesigns && context.previousDesigns.length > 0) {
    const recentDesigns = context.previousDesigns.slice(-3) // Derniers 3 designs
    previousDesignsContext = `\n\nIMPORTANT - Éviter la répétition:\nLes designs précédents utilisent ces couleurs de fond:\n${recentDesigns.map((d, i) => `  ${i + 1}. ${d.backgroundColor}`).join('\n')}\n\nTu DOIS créer un design DIFFÉRENT avec une palette de couleurs variée. Varie les couleurs de fond, les styles et les layouts pour créer de la diversité visuelle.`
  }

  const contextInfo = context ? `
CONTEXTE DU COURS:
- Titre du cours: ${context.courseTitle || 'Non spécifié'}
- Description: ${context.courseDescription || 'Non spécifiée'}
- Module: ${context.moduleTitle || 'Non spécifié'}
- Position de la slide: ${context.slidePosition !== undefined ? `${context.slidePosition + 1}/${context.totalSlides || '?'}` : 'Non spécifiée'}
` : ''

  const prompt = `Tu es un expert en design de slides de formation professionnelle. 
Ta mission est de créer un design unique, moderne et adapté au contexte de cette formation.

${contextInfo}

CONTENU DE LA SLIDE:
- Titre: ${slide.title}
- Objectif pédagogique: ${slide.objective || 'Non spécifié'}
- Points clés à afficher: ${slide.on_screen?.join('\n  • ') || 'Aucun'}
${slide.speaker_notes ? `- Notes pour le formateur: ${slide.speaker_notes}` : ''}

INSTRUCTIONS DE DESIGN:
1. Crée un design UNIQUE qui s'intègre dans le contexte de la formation "${context?.courseTitle || 'cette formation'}"
2. Adapte les couleurs au thème et au contenu (ex: technique = bleus/violets, business = verts/bleus, créatif = couleurs vives)
3. Varie le layout selon le type de contenu (centered pour les titres importants, left-aligned pour les listes)
4. Assure une excellente lisibilité avec un contraste élevé
5. Utilise une typographie moderne et professionnelle

${previousDesignsContext}

FORMAT DE RÉPONSE (JSON uniquement, sans markdown):
{
  "backgroundColor": "couleur hex (ex: #1a1a2e)",
  "textColor": "couleur hex pour le texte principal",
  "titleStyle": {
    "fontSize": nombre (entre 36 et 64),
    "fontWeight": "bold" ou "normal",
    "color": "couleur hex pour le titre"
  },
  "bulletPoints": {
    "fontSize": nombre (entre 24 et 40),
    "spacing": nombre (entre 30 et 60),
    "color": "couleur hex pour les puces"
  },
  "layout": "centered" ou "left-aligned" ou "split",
  "accentColor": "couleur hex pour les accents et éléments secondaires"
}

RÉPONDS UNIQUEMENT AVEC LE JSON, SANS MARKDOWN, SANS EXPLICATIONS, SANS BACKTICKS.`

  try {
    // Essayer chaque modèle jusqu'à ce qu'un fonctionne
    let text = ''
    for (let i = 0; i < modelsToTry.length; i++) {
      try {
        const currentModelName = modelsToTry[i]
        console.log(`🔄 Tentative avec le modèle: ${currentModelName}`)
        
        // Appel à l'API OpenRouter (format compatible OpenAI)
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin, // Optionnel mais recommandé
            'X-Title': 'Portal Formations - Slide Generator' // Optionnel
          },
          body: JSON.stringify({
            model: currentModelName,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`)
        }
        
        const data = await response.json()
        text = data.choices?.[0]?.message?.content || ''
        
        if (!text) {
          throw new Error('Réponse vide de l\'API')
        }
        
        if (i > 0) {
          console.log(`✅ Modèle ${currentModelName} fonctionne (après ${i} tentative(s))`)
        } else {
          console.log(`✅ Modèle ${currentModelName} fonctionne`)
        }
        break // Succès, sortir de la boucle
      } catch (modelError: any) {
        lastError = modelError
        if (i < modelsToTry.length - 1) {
          // Il reste des modèles à essayer
          console.warn(`⚠️ Modèle ${modelsToTry[i]} non disponible, essai suivant...`)
          continue
        } else {
          // Tous les modèles ont échoué
          console.error(`❌ Tous les modèles ont échoué. Dernière erreur:`, modelError)
          const errorMessage = modelError.message || 'Erreur inconnue'
          
          // Message d'aide selon le type d'erreur
          let helpMessage = ''
          if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            helpMessage = '\n\n💡 Votre clé API OpenRouter semble invalide. Vérifiez VITE_OPENROUTER_API_KEY dans votre fichier .env'
          } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
            helpMessage = '\n\n💡 Votre clé API n\'a pas les permissions nécessaires. Vérifiez votre compte OpenRouter'
          } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            helpMessage = '\n\n💡 Vous avez atteint la limite de taux. Attendez un moment ou vérifiez votre plan OpenRouter'
          } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            helpMessage = '\n\n💡 Le modèle spécifié n\'est pas disponible. Vérifiez VITE_OPENROUTER_MODEL dans votre fichier .env'
          }
          
          throw new Error(`Aucun modèle disponible via OpenRouter.${helpMessage}\n\nDernière erreur: ${errorMessage}`)
        }
      }
    }
    
    if (!text) {
      throw new Error('Aucun résultat après avoir essayé tous les modèles')
    }
    
    // Nettoyer le texte pour extraire le JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ Réponse reçue:', text)
      throw new Error('Réponse invalide de l\'API (format JSON attendu)')
    }
    
    const design = JSON.parse(jsonMatch[0]) as SlideDesign
    
    // Valeurs par défaut si certaines propriétés manquent
    return {
      backgroundColor: design.backgroundColor || '#1a1a2e',
      textColor: design.textColor || '#ffffff',
      titleStyle: {
        fontSize: design.titleStyle?.fontSize || 48,
        fontWeight: design.titleStyle?.fontWeight || 'bold',
        color: design.titleStyle?.color || '#ffffff'
      },
      bulletPoints: {
        fontSize: design.bulletPoints?.fontSize || 32,
        spacing: design.bulletPoints?.spacing || 40,
        color: design.bulletPoints?.color || '#e0e0e0'
      },
      layout: design.layout || 'centered',
      accentColor: design.accentColor || '#4a90e2'
    }
  } catch (error: any) {
    console.error('Erreur lors de la génération du design:', error)
    
    // Si c'est une erreur de modèle non disponible, on retourne quand même un design par défaut
    // mais on log l'erreur pour que l'utilisateur puisse la voir
    if (error.message?.includes('Aucun modèle') || error.message?.includes('OpenRouter')) {
      console.warn('⚠️ Utilisation d\'un design par défaut car aucun modèle n\'est disponible via OpenRouter')
      console.warn('⚠️ Vérifiez votre configuration OpenRouter (clé API, modèle, crédits)')
    }
    
    // Design par défaut en cas d'erreur
    return {
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
      titleStyle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff'
      },
      bulletPoints: {
        fontSize: 32,
        spacing: 40,
        color: '#e0e0e0'
      },
      layout: 'centered',
      accentColor: '#4a90e2'
    }
  }
}

/**
 * Génère une image de slide avec Graphime
 */
export async function generateSlideImage(
  slide: SlideContent,
  design: SlideDesign,
  width: number = 1920,
  height: number = 1080
): Promise<Blob> {
  // Import dynamique de graphime (peut être côté serveur)
  // Pour le moment, on va créer une fonction qui génère l'image côté client avec Canvas
  
  // Créer un canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Impossible de créer le contexte canvas')
  }

  // Fond
  ctx.fillStyle = design.backgroundColor
  ctx.fillRect(0, 0, width, height)

  // Titre
  ctx.fillStyle = design.titleStyle.color
  ctx.font = `${design.titleStyle.fontWeight} ${design.titleStyle.fontSize}px Arial`
  ctx.textAlign = design.layout === 'centered' ? 'center' : 'left'
  ctx.textBaseline = 'top'
  
  const titleX = design.layout === 'centered' ? width / 2 : 100
  const titleY = 100
  
  // Découper le titre en plusieurs lignes si nécessaire
  const titleLines = wrapText(ctx, slide.title, width - 200, design.titleStyle.fontSize)
  titleLines.forEach((line, index) => {
    ctx.fillText(line, titleX, titleY + (index * design.titleStyle.fontSize * 1.2))
  })

  // Points clés (on_screen)
  if (slide.on_screen && slide.on_screen.length > 0) {
    ctx.fillStyle = design.bulletPoints.color
    ctx.font = `${design.bulletPoints.fontSize}px Arial`
    ctx.textAlign = design.layout === 'centered' ? 'center' : 'left'
    
    const startY = titleY + (titleLines.length * design.titleStyle.fontSize * 1.2) + 100
    const bulletX = design.layout === 'centered' ? width / 2 : 150
    const maxHeight = height - (startY + 150) // Réserver de l'espace pour l'objectif en bas
    
    let currentY = startY
    let totalHeightUsed = 0
    
    // Limiter le nombre de points affichés si le contenu est trop long
    const maxPoints = Math.min(slide.on_screen.length, 8) // Maximum 8 points
    
    for (let index = 0; index < maxPoints; index++) {
      const point = slide.on_screen[index]
      const bullet = '• '
      const text = bullet + point
      
      // Découper en plusieurs lignes si nécessaire
      const lines = wrapText(ctx, text, width - 300, design.bulletPoints.fontSize)
      const pointHeight = lines.length * design.bulletPoints.fontSize * 1.2
      
      // Vérifier si on a assez de place
      if (totalHeightUsed + pointHeight > maxHeight && index > 0) {
        // Ajouter un indicateur qu'il y a plus de contenu
        ctx.fillStyle = design.accentColor
        ctx.font = `italic ${design.bulletPoints.fontSize - 4}px Arial`
        ctx.fillText('... (voir les chapitres pour plus de détails)', bulletX, currentY + 20)
        break
      }
      
      ctx.fillStyle = design.bulletPoints.color
      ctx.font = `${design.bulletPoints.fontSize}px Arial`
      
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, bulletX, currentY + (lineIndex * design.bulletPoints.fontSize * 1.2))
      })
      
      currentY += pointHeight + design.bulletPoints.spacing
      totalHeightUsed += pointHeight + design.bulletPoints.spacing
    }
  }

  // Objectif (optionnel, en bas)
  if (slide.objective) {
    ctx.fillStyle = design.accentColor
    ctx.font = `italic 24px Arial`
    ctx.textAlign = 'center'
    const objectiveY = height - 80
    const objectiveLines = wrapText(ctx, slide.objective, width - 200, 24)
    objectiveLines.forEach((line, index) => {
      ctx.fillText(line, width / 2, objectiveY + (index * 28))
    })
  }

  // Convertir en blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Impossible de créer le blob'))
      }
    }, 'image/jpeg', 0.9)
  })
}

/**
 * Aide pour découper le texte en plusieurs lignes
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines
}

/**
 * Génère et upload une slide complète
 */
export async function generateAndUploadSlide(
  slide: SlideContent,
  courseId: string,
  moduleId: string,
  itemId?: string,
  context?: CourseContext
): Promise<string> {
  try {
    console.log('🎨 Début de la génération de la slide:', { slide, courseId, moduleId, itemId, context })
    
    // 1. Générer le design avec Gemini
    console.log('📐 Génération du design avec Gemini...')
    const design = await generateSlideDesign(slide, context)
    console.log('✅ Design généré:', design)
    
    // 2. Générer l'image
    console.log('🖼️ Génération de l\'image...')
    const imageBlob = await generateSlideImage(slide, design)
    console.log('✅ Image générée, taille:', imageBlob.size, 'bytes')
    
    if (!imageBlob || imageBlob.size === 0) {
      throw new Error('L\'image générée est vide')
    }
    
    // 3. Upload vers Supabase Storage
    const fileName = `${courseId}/${moduleId}/${itemId || 'new'}/${Date.now()}.jpg`
    console.log('📤 Upload vers Supabase Storage:', fileName)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-assets')
      .upload(fileName, imageBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      })

    if (uploadError) {
      console.error('❌ Erreur lors de l\'upload:', uploadError)
      throw new Error(`Erreur upload: ${uploadError.message} (Code: ${uploadError.statusCode || 'N/A'})`)
    }

    if (!uploadData) {
      throw new Error('Aucune donnée retournée après l\'upload')
    }

    console.log('✅ Upload réussi:', fileName)
    return fileName
  } catch (error) {
    console.error('❌ Erreur lors de la génération de la slide:', error)
    throw error
  }
}

