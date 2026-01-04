// Service avancé pour générer des slides avec Graphime ou des APIs de génération d'images
// Utilise des Edge Functions Supabase ou des APIs externes pour des designs plus professionnels

import { supabase } from './supabaseClient'

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
  previousDesigns?: any[]
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
 * Génère une slide avec design avancé via Edge Function Supabase
 * Utilise HTML/CSS pour créer des designs professionnels
 */
export async function generateAdvancedSlide(
  slide: SlideContent,
  design: SlideDesign,
  courseId: string,
  moduleId: string,
  itemId?: string
): Promise<string> {
  try {
    console.log('🎨 Génération avancée de slide via Edge Function...')

    // Appeler l'Edge Function Supabase
    const { data, error } = await supabase.functions.invoke('generate-slide-with-html', {
      body: {
        slide,
        design,
        courseId,
        moduleId,
        itemId
      }
    })

    if (error) {
      throw error
    }

    if (!data?.assetPath) {
      throw new Error('Aucun chemin d\'asset retourné par l\'Edge Function')
    }

    console.log('✅ Slide générée avec succès:', data.assetPath)
    return data.assetPath
  } catch (error: any) {
    console.error('❌ Erreur lors de la génération avancée:', error)
    
    // Fallback vers la génération client si l'Edge Function échoue
    console.log('🔄 Fallback vers génération client...')
    const { generateAndUploadSlide } = await import('./slideGenerator')
    return await generateAndUploadSlide(slide, courseId, moduleId, itemId, {
      courseTitle: undefined,
      courseDescription: undefined,
      moduleTitle: undefined,
      slidePosition: undefined,
      totalSlides: undefined
    })
  }
}

/**
 * Génère une slide avec un service externe (htmlcsstoimage.com, etc.)
 */
export async function generateSlideWithExternalAPI(
  slide: SlideContent,
  design: SlideDesign,
  courseId: string,
  moduleId: string,
  itemId?: string
): Promise<string> {
  const HTML_CSS_TO_IMAGE_API_KEY = import.meta.env.VITE_HTML_CSS_TO_IMAGE_API_KEY

  if (!HTML_CSS_TO_IMAGE_API_KEY) {
    throw new Error('VITE_HTML_CSS_TO_IMAGE_API_KEY n\'est pas configurée')
  }

  // Générer le HTML de la slide
  const htmlContent = generateSlideHTML(slide, design)

  try {
    // Appeler l'API htmlcsstoimage.com
    const response = await fetch('https://hcti.io/v1/image', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(HTML_CSS_TO_IMAGE_API_KEY + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        width: 1920,
        height: 1080,
        device_scale_factor: 1,
        selector: 'body',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTML to Image API error: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    
    // Télécharger l'image générée
    const imageResponse = await fetch(data.url)
    const imageBlob = await imageResponse.blob()

    // Upload vers Supabase Storage
    const fileName = `${courseId}/${moduleId}/${itemId || 'new'}/${Date.now()}.jpg`
    
    const { error: uploadError } = await supabase.storage
      .from('course-assets')
      .upload(fileName, imageBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      })

    if (uploadError) {
      throw uploadError
    }

    return fileName
  } catch (error: any) {
    console.error('Erreur lors de la génération avec API externe:', error)
    throw error
  }
}

/**
 * Génère le HTML d'une slide avec design avancé
 */
function generateSlideHTML(slide: SlideContent, design: SlideDesign): string {
  const layoutClass = design.layout === 'centered' ? 'centered' : 'left-aligned'
  const bulletsHTML = slide.on_screen?.map(point => 
    `<li>${escapeHtml(point)}</li>`
  ).join('') || ''

  // Créer un gradient sophistiqué
  const gradientColors = generateGradient(design.backgroundColor, design.accentColor)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 1920px;
      height: 1080px;
      background: ${gradientColors.background};
      font-family: 'Inter', 'Arial', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: ${design.layout === 'centered' ? 'center' : 'flex-start'};
      align-items: ${design.layout === 'centered' ? 'center' : 'flex-start'};
      padding: ${design.layout === 'centered' ? '0 120px' : '120px 100px'};
      color: ${design.textColor};
      position: relative;
      overflow: hidden;
    }
    .slide-container {
      width: 100%;
      max-width: 1600px;
      z-index: 2;
      ${design.layout === 'centered' ? 'text-align: center;' : 'text-align: left;'}
    }
    .title {
      font-size: ${design.titleStyle.fontSize}px;
      font-weight: ${design.titleStyle.fontWeight};
      color: ${design.titleStyle.color};
      margin-bottom: 80px;
      line-height: 1.2;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
      letter-spacing: -0.5px;
    }
    .bullets {
      list-style: none;
      ${design.layout === 'centered' ? 'text-align: center;' : 'text-align: left;'}
    }
    .bullets li {
      font-size: ${design.bulletPoints.fontSize}px;
      color: ${design.bulletPoints.color};
      margin-bottom: ${design.bulletPoints.spacing}px;
      line-height: 1.8;
      position: relative;
      padding-left: ${design.layout === 'left-aligned' ? '50px' : '0'};
      opacity: 0.95;
    }
    .bullets li:before {
      content: '▸';
      color: ${design.accentColor};
      font-size: ${design.bulletPoints.fontSize * 1.2}px;
      position: absolute;
      left: 0;
      ${design.layout === 'centered' ? 'display: none;' : ''}
      font-weight: bold;
    }
    .objective {
      position: absolute;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 28px;
      font-style: italic;
      color: ${design.accentColor};
      opacity: 0.85;
      font-weight: 300;
      z-index: 2;
    }
    .gradient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${gradientColors.overlay};
      pointer-events: none;
      z-index: 1;
    }
    .accent-shape {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, ${design.accentColor}15 0%, transparent 70%);
      ${design.layout === 'centered' ? 'top: -200px; right: -200px;' : 'bottom: -300px; right: -300px;'}
      pointer-events: none;
      z-index: 0;
    }
  </style>
</head>
<body>
  <div class="accent-shape"></div>
  <div class="gradient-overlay"></div>
  <div class="slide-container">
    <h1 class="title">${escapeHtml(slide.title)}</h1>
    ${bulletsHTML ? `<ul class="bullets">${bulletsHTML}</ul>` : ''}
  </div>
  ${slide.objective ? `<div class="objective">${escapeHtml(slide.objective)}</div>` : ''}
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  // Échapper les caractères HTML
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function generateGradient(baseColor: string, accentColor: string): { background: string; overlay: string } {
  // Créer un gradient sophistiqué
  return {
    background: `linear-gradient(135deg, ${baseColor} 0%, ${adjustColor(baseColor, -10)} 50%, ${baseColor} 100%)`,
    overlay: `linear-gradient(180deg, transparent 0%, ${accentColor}08 50%, ${accentColor}15 100%)`
  }
}

function adjustColor(color: string, amount: number): string {
  // Fonction simple pour ajuster la luminosité d'une couleur hex
  // Pour une implémentation complète, utiliser une bibliothèque de couleurs
  return color // Simplifié pour l'instant
}

