// Edge Function Supabase pour générer des slides avec HTML/CSS avancé
// Utilise Puppeteer ou une API de screenshot pour créer des images professionnelles

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SlideContent {
  title: string
  objective?: string
  on_screen?: string[]
  speaker_notes?: string
  activity?: any
  mini_game?: any
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { slide, design, courseId, moduleId, itemId } = await req.json()

    // Générer le HTML de la slide
    const htmlContent = generateSlideHTML(slide, design)

    // Utiliser une API de screenshot HTML vers image
    // Options: htmlcsstoimage.com, screenshotapi.net, ou Puppeteer
    const imageBlob = await convertHTMLToImage(htmlContent)

    // Upload vers Supabase Storage
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileName = `${courseId}/${moduleId}/${itemId || 'new'}/${Date.now()}.jpg`
    
    const { error: uploadError } = await supabaseClient.storage
      .from('course-assets')
      .upload(fileName, imageBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      })

    if (uploadError) {
      throw uploadError
    }

    return new Response(
      JSON.stringify({ success: true, assetPath: fileName }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function generateSlideHTML(slide: SlideContent, design: SlideDesign): string {
  const layoutClass = design.layout === 'centered' ? 'centered' : 'left-aligned'
  const bulletsHTML = slide.on_screen?.map(point => 
    `<li style="font-size: ${design.bulletPoints.fontSize}px; color: ${design.bulletPoints.color}; margin-bottom: ${design.bulletPoints.spacing}px;">${point}</li>`
  ).join('') || ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 1920px;
      height: 1080px;
      background: ${design.backgroundColor};
      font-family: 'Inter', 'Arial', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: ${design.layout === 'centered' ? 'center' : 'flex-start'};
      align-items: ${design.layout === 'centered' ? 'center' : 'flex-start'};
      padding: ${design.layout === 'centered' ? '0' : '100px'};
      color: ${design.textColor};
      position: relative;
      overflow: hidden;
    }
    .slide-container {
      width: 100%;
      max-width: 1600px;
      ${design.layout === 'centered' ? 'text-align: center;' : 'text-align: left;'}
    }
    .title {
      font-size: ${design.titleStyle.fontSize}px;
      font-weight: ${design.titleStyle.fontWeight};
      color: ${design.titleStyle.color};
      margin-bottom: 60px;
      line-height: 1.2;
    }
    .bullets {
      list-style: none;
      ${design.layout === 'centered' ? 'text-align: center;' : 'text-align: left;'}
    }
    .bullets li {
      font-size: ${design.bulletPoints.fontSize}px;
      color: ${design.bulletPoints.color};
      margin-bottom: ${design.bulletPoints.spacing}px;
      line-height: 1.6;
      position: relative;
      padding-left: ${design.layout === 'left-aligned' ? '40px' : '0'};
    }
    .bullets li:before {
      content: '•';
      color: ${design.accentColor};
      font-size: ${design.bulletPoints.fontSize * 1.5}px;
      position: absolute;
      left: 0;
      ${design.layout === 'centered' ? 'display: none;' : ''}
    }
    .objective {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 24px;
      font-style: italic;
      color: ${design.accentColor};
      opacity: 0.8;
    }
    .gradient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, ${design.backgroundColor} 0%, ${design.accentColor}20 100%);
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="gradient-overlay"></div>
  <div class="slide-container">
    <h1 class="title">${slide.title}</h1>
    ${bulletsHTML ? `<ul class="bullets">${bulletsHTML}</ul>` : ''}
  </div>
  ${slide.objective ? `<div class="objective">${slide.objective}</div>` : ''}
</body>
</html>
  `.trim()
}

async function convertHTMLToImage(html: string): Promise<Blob> {
  // Option 1: Utiliser htmlcsstoimage.com API (nécessite une clé API)
  const HTML_CSS_TO_IMAGE_API_KEY = Deno.env.get('HTML_CSS_TO_IMAGE_API_KEY')
  
  if (HTML_CSS_TO_IMAGE_API_KEY) {
    const response = await fetch('https://hcti.io/v1/image', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(HTML_CSS_TO_IMAGE_API_KEY + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: html,
        width: 1920,
        height: 1080,
        device_scale_factor: 1,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTML to Image API error: ${response.statusText}`)
    }

    const data = await response.json()
    const imageResponse = await fetch(data.url)
    return await imageResponse.blob()
  }

  // Option 2: Utiliser screenshotapi.net (alternative)
  const SCREENSHOT_API_KEY = Deno.env.get('SCREENSHOT_API_KEY')
  
  if (SCREENSHOT_API_KEY) {
    // Encoder le HTML en base64 pour l'URL
    const htmlBase64 = btoa(html)
    const url = `https://api.screenshotapi.net/screenshot?token=${SCREENSHOT_API_KEY}&url=data:text/html;base64,${htmlBase64}&width=1920&height=1080`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Screenshot API error: ${response.statusText}`)
    }
    
    return await response.blob()
  }

  // Option 3: Fallback - utiliser Puppeteer via une API externe ou service
  throw new Error('Aucune API de génération d\'images configurée. Configurez HTML_CSS_TO_IMAGE_API_KEY ou SCREENSHOT_API_KEY')
}

