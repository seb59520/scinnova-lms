import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CaptureRequest {
  gammaUrl: string
  itemId?: string
  numSlides?: number
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Pas de vérification d'authentification stricte pour le moment
    // L'Edge Function peut être appelée sans authentification (comme generate-gamma)
    
    let body: CaptureRequest
    try {
      body = await req.json()
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Body JSON invalide', details: String(e) }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!body.gammaUrl) {
      return new Response(
        JSON.stringify({ error: 'gammaUrl est requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Utiliser un service de screenshot API (exemple avec ScreenshotsCloud ou similaire)
    // Pour l'instant, on va utiliser l'API HTML2Canvas via un service proxy
    // ou utiliser Puppeteer via un service comme Browserless.io

    // Option 1: Utiliser l'API ScreenshotsCloud (gratuite avec limitations)
    const SCREENSHOT_API_URL = 'https://api.screenshotone.com/take'
    const SCREENSHOT_API_KEY = Deno.env.get('SCREENSHOT_API_KEY') || ''
    
    // Option 2: Utiliser htmlcsstoimage.com (alternative)
    const HTMLCSSTOIMAGE_API_KEY = Deno.env.get('HTMLCSSTOIMAGE_API_KEY')
    const HTMLCSSTOIMAGE_API_URL = 'https://hcti.io/v1/image'

    let screenshotUrl: string | null = null

    // Essayer avec ScreenshotOne si disponible
    if (SCREENSHOT_API_KEY) {
      try {
        // Selon la documentation ScreenshotOne, on peut passer access_key en paramètre GET ou en header
        const screenshotParams = new URLSearchParams({
          access_key: SCREENSHOT_API_KEY,
          url: body.gammaUrl,
          viewport_width: '1920',
          viewport_height: '1080',
          device_scale_factor: '2',
          format: 'png',
          image_quality: '90',
          delay: '3000', // Attendre 3 secondes pour que la page charge
          wait_until: 'network_idle',
        })

        // Utiliser GET avec access_key en paramètre (selon la doc: https://screenshotone.com/docs/getting-started/)
        // Alternative: on peut aussi utiliser POST avec JSON body ou header X-Access-Key
        const apiUrl = `${SCREENSHOT_API_URL}?${screenshotParams}`
        console.log('ScreenshotOne: Appel API (URL masquée pour sécurité)')
        
        const screenshotResponse = await fetch(apiUrl, {
          method: 'GET',
        })
        
        console.log('ScreenshotOne: Réponse status:', screenshotResponse.status, screenshotResponse.statusText)
        
        if (screenshotResponse.ok) {
          const screenshotBlob = await screenshotResponse.blob()
          console.log('ScreenshotOne: Capture réussie, taille:', screenshotBlob.size, 'bytes')
          
          // Upload vers Supabase Storage
          // Les variables d'environnement sont automatiquement disponibles dans les Edge Functions
          const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
          
          if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Variables d\'environnement Supabase manquantes:', {
              hasUrl: !!supabaseUrl,
              hasServiceKey: !!supabaseServiceKey,
            })
            throw new Error('Variables d\'environnement Supabase manquantes (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)')
          }
          
          const supabase = createClient(supabaseUrl, supabaseServiceKey)

          const fileName = `gamma-slides/${body.itemId || 'slide'}-${Date.now()}.png`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('gamma-slides')
            .upload(fileName, screenshotBlob, {
              contentType: 'image/png',
              upsert: false,
            })

          if (uploadError) {
            console.error('Erreur upload:', uploadError)
            // Si le bucket n'existe pas, retourner l'URL directe du screenshot si possible
            if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
              throw new Error('Le bucket "gamma-slides" n\'existe pas. Créez-le dans Supabase Storage ou exécutez la migration SQL.')
            }
            throw uploadError
          } else {
            const { data: urlData } = supabase.storage
              .from('gamma-slides')
              .getPublicUrl(fileName)
            
            screenshotUrl = urlData.publicUrl
          }
        } else {
          // Si la réponse n'est pas OK, essayer de lire le message d'erreur JSON
          let errorData: any = {}
          try {
            const text = await screenshotResponse.text()
            try {
              errorData = JSON.parse(text)
            } catch {
              errorData = { message: text }
            }
          } catch {
            errorData = { message: 'Erreur inconnue' }
          }
          
          console.error('Erreur ScreenshotOne API:', {
            status: screenshotResponse.status,
            statusText: screenshotResponse.statusText,
            error: errorData,
          })
          
          // Ne pas throw ici, on va essayer htmlcsstoimage si disponible
          // Mais loguer l'erreur pour le débogage
        }
      } catch (error) {
        console.error('Erreur ScreenshotOne:', error)
        // Ne pas throw ici, on va essayer htmlcsstoimage si disponible
      }
    }

    // Si ScreenshotOne n'a pas fonctionné, essayer htmlcsstoimage
    if (!screenshotUrl && HTMLCSSTOIMAGE_API_KEY) {
      try {
        const response = await fetch(HTMLCSSTOIMAGE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(HTMLCSSTOIMAGE_API_KEY + ':')}`,
          },
          body: JSON.stringify({
            url: body.gammaUrl,
            viewport_width: 1920,
            viewport_height: 1080,
            device_scale_factor: 2,
            delay: 3000,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          screenshotUrl = data.url
        }
      } catch (error) {
        console.error('Erreur htmlcsstoimage:', error)
      }
    }

    // Si aucun service n'a fonctionné, retourner une erreur
    if (!screenshotUrl) {
      console.error('Aucun service de screenshot configuré ou tous ont échoué')
      return new Response(
        JSON.stringify({
          error: 'Impossible de capturer la présentation. Aucun service de screenshot configuré ou tous ont échoué.',
          suggestion: 'Configurez SCREENSHOT_API_KEY ou HTMLCSSTOIMAGE_API_KEY dans les secrets Supabase avec: supabase secrets set SCREENSHOT_API_KEY=votre_cle',
          hasScreenshotKey: !!Deno.env.get('SCREENSHOT_API_KEY'),
          hasHtmlCssKey: !!Deno.env.get('HTMLCSSTOIMAGE_API_KEY'),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        screenshotUrl,
        gammaUrl: body.gammaUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Erreur capture:', error)
    console.error('Stack:', error.stack)
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    
    // Message d'erreur plus clair
    let errorMessage = error.message || 'Erreur lors de la capture'
    let suggestion = ''
    
    if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
      suggestion = 'Créez le bucket "gamma-slides" dans Supabase Storage ou exécutez la migration SQL: supabase db push'
    } else if (error.message?.includes('Variables d\'environnement')) {
      suggestion = 'Les variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être configurées automatiquement par Supabase'
    } else if (!Deno.env.get('SCREENSHOT_API_KEY') && !Deno.env.get('HTMLCSSTOIMAGE_API_KEY')) {
      suggestion = 'Configurez un service de screenshot: supabase secrets set SCREENSHOT_API_KEY=votre_cle'
    }
    
    const envName =
      Deno.env.get('SUPABASE_ENV') ||
      Deno.env.get('ENVIRONMENT') ||
      Deno.env.get('NODE_ENV') ||
      ''
    const lowerEnv = envName.toLowerCase()
    const includeDetails = lowerEnv === 'development' || lowerEnv === 'local'

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        suggestion: suggestion || 'Vérifiez les logs de l\'Edge Function dans le dashboard Supabase',
        details: includeDetails ? (error.stack || String(error)) : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
