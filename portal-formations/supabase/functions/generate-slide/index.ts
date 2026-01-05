// Edge Function Supabase pour générer des slides avec des designs avancés
// Utilise Canvas côté serveur pour créer des images professionnelles

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

interface CourseContext {
  courseTitle?: string
  courseDescription?: string
  moduleTitle?: string
  slidePosition?: number
  totalSlides?: number
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { slide, design, courseId, moduleId, itemId } = await req.json()

    // Générer l'image avec Canvas (via une bibliothèque ou API externe)
    // Pour l'instant, on va utiliser une approche avec une API de génération d'images
    // ou créer l'image avec des techniques avancées

    const imageData = await generateAdvancedSlideImage(slide, design)

    // Upload vers Supabase Storage
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileName = `${courseId}/${moduleId}/${itemId || 'new'}/${Date.now()}.jpg`
    
    const { error: uploadError } = await supabaseClient.storage
      .from('course-assets')
      .upload(fileName, imageData, {
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

async function generateAdvancedSlideImage(
  slide: SlideContent,
  design: SlideDesign
): Promise<Blob> {
  // Pour l'instant, on retourne un placeholder
  // Dans une vraie implémentation, on utiliserait une bibliothèque de génération d'images
  // ou on appellerait un service externe comme Cloudinary, Imgix, etc.
  
  // Option 1: Utiliser une API externe de génération d'images
  // Option 2: Utiliser une bibliothèque Canvas pour Deno
  // Option 3: Utiliser Puppeteer/Playwright pour générer depuis HTML/CSS
  
  throw new Error('Génération avancée non implémentée - utilisez la version client pour l\'instant')
}


