import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GAMMA_API_URL = 'https://public-api.gamma.app/v1.0/generations';
const GAMMA_API_KEY = Deno.env.get('GAMMA_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GammaRequest {
  inputText: string;
  textMode?: 'generate' | 'condense' | 'preserve';
  format?: 'presentation' | 'document' | 'social' | 'webpage';
  themeId?: string;
  numCards?: number;
  cardSplit?: 'auto' | 'inputTextBreaks';
  additionalInstructions?: string;
  textOptions?: {
    amount?: 'concise' | 'balanced' | 'detailed';
    tone?: string;
    audience?: string;
    language?: string;
  };
  imageOptions?: {
    source?: 'aiGenerated' | 'unsplash' | 'none';
    model?: string;
    style?: string;
  };
  exportAs?: 'pdf' | 'pptx' | 'html';
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier la clé API Gamma
    if (!GAMMA_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GAMMA_API_KEY n\'est pas configurée' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Pas de vérification d'authentification stricte pour le moment
    // L'Edge Function peut être appelée sans authentification

    // Parser le body de la requête
    const body: GammaRequest = await req.json();

    if (!body.inputText) {
      return new Response(
        JSON.stringify({ error: 'inputText est requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Appel initial à l'API Gamma pour créer la génération
    const response = await fetch(GAMMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': GAMMA_API_KEY,
      },
      body: JSON.stringify({
        inputText: body.inputText,
        textMode: body.textMode || 'generate',
        format: body.format || 'presentation',
        themeId: body.themeId,
        numCards: body.numCards,
        cardSplit: body.cardSplit || 'auto',
        additionalInstructions: body.additionalInstructions,
        textOptions: body.textOptions,
        imageOptions: body.imageOptions,
        exportAs: body.exportAs,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: errorData.message || `Erreur API Gamma: ${response.status} ${response.statusText}`,
          status: response.status,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const generationId = data.generationId || data.id || data.generation_id;

    if (!generationId) {
      return new Response(
        JSON.stringify({ error: 'Aucun generationId retourné par l\'API Gamma' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Poller le statut de la génération
    const maxAttempts = 30;
    const delayMs = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      const statusResponse = await fetch(`${GAMMA_API_URL}/${generationId}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': GAMMA_API_KEY,
        },
      });

      if (!statusResponse.ok) {
        if (attempt === maxAttempts - 1) {
          return new Response(
            JSON.stringify({
              error: `Erreur lors de la récupération du statut: ${statusResponse.status}`,
            }),
            {
              status: statusResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.status || statusData.state;
      const gammaUrl = statusData.gammaUrl || statusData.url || statusData.gamma_url;
      const pdfUrl = statusData.pdfUrl || statusData.pdf_url;
      const pptxUrl = statusData.pptxUrl || statusData.pptx_url;
      const htmlUrl = statusData.htmlUrl || statusData.html_url;

      if (status === 'completed' || gammaUrl) {
        return new Response(
          JSON.stringify({
            generationId,
            status: 'completed',
            gammaUrl,
            pdfUrl,
            pptxUrl,
            htmlUrl,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      if (status === 'failed' || status === 'error') {
        return new Response(
          JSON.stringify({
            generationId,
            status: 'failed',
            error: statusData.error || statusData.message || 'La génération a échoué',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Timeout
    return new Response(
      JSON.stringify({
        generationId,
        status: 'failed',
        error: 'Timeout: la génération a pris trop de temps',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erreur dans generate-gamma:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erreur lors de la génération Gamma',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
