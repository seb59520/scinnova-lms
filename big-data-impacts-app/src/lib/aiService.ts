// Configuration OpenRouter pour l'IA
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-3-flash-preview';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface UseCaseAnalysis {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  score: {
    overall: number;
    organizational: number;
    technical: number;
    economic: number;
    social: number;
  };
}

export interface UseCaseData {
  title: string;
  description: string;
  sector: string;
  impacts: {
    organizational: number;
    technical: number;
    economic: number;
    social: number;
  };
  roi: number;
  technologies: string[];
  challenges: string[];
}

/**
 * Génère une synthèse et des optimisations pour un cas d'usage avec l'IA
 */
export async function generateUseCaseAnalysis(
  useCase: UseCaseData
): Promise<UseCaseAnalysis> {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.trim() === '') {
    throw new Error(
      'VITE_OPENROUTER_API_KEY n\'est pas configurée.\n\n' +
      'Pour corriger :\n' +
      '1. Créez un compte sur https://openrouter.ai/\n' +
      '2. Générez une clé API\n' +
      '3. Ajoutez-la dans .env : VITE_OPENROUTER_API_KEY=votre_cle\n' +
      '4. Redémarrez le serveur'
    );
  }

  const prompt = `Tu es un expert en Big Data et Data Science. Analyse ce cas d'usage et génère une synthèse constructive avec des recommandations d'optimisation.

CAS D'USAGE À ANALYSER:
Titre: ${useCase.title}
Description: ${useCase.description}
Secteur: ${useCase.sector}

Impacts (sur 10):
- Organisationnel: ${useCase.impacts.organizational}/10
- Technique: ${useCase.impacts.technical}/10
- Économique: ${useCase.impacts.economic}/10
- Social: ${useCase.impacts.social}/10

ROI estimé: ${useCase.roi}%

Technologies utilisées: ${useCase.technologies.join(', ')}

Défis et risques identifiés: ${useCase.challenges.join(', ')}

TÂCHE:
Génère une analyse complète avec:
1. Une synthèse (150-200 mots) qui résume le cas d'usage, évalue sa pertinence et sa faisabilité
2. Les points forts (3-5 points)
3. Les améliorations possibles (3-5 points) avec des suggestions concrètes
4. Des recommandations d'optimisation (3-5 recommandations) pour améliorer les impacts et le ROI
5. Une évaluation des scores d'impacts (suggère des ajustements si nécessaire)

Sois constructif, pédagogique et précis. Utilise des exemples concrets.

FORMAT DE RÉPONSE (JSON uniquement, sans markdown):
{
  "summary": "synthèse de 150-200 mots",
  "strengths": ["point fort 1", "point fort 2", ...],
  "improvements": ["amélioration 1", "amélioration 2", ...],
  "recommendations": ["recommandation 1", "recommandation 2", ...],
  "score": {
    "overall": note sur 10 (évaluation globale),
    "organizational": note sur 10 (évaluation de l'impact organisationnel),
    "technical": note sur 10 (évaluation de l'impact technique),
    "economic": note sur 10 (évaluation de l'impact économique),
    "social": note sur 10 (évaluation de l'impact social)
  }
}

RÉPONDS UNIQUEMENT AVEC LE JSON, SANS MARKDOWN, SANS EXPLICATIONS, SANS BACKTICKS.`;

  const modelsToTry = [
    OPENROUTER_MODEL,
    'google/gemini-3-flash-preview',
    'google/gemini-3-pro-preview',
    'google/gemini-1.5-pro',
    'openai/gpt-4o-mini',
    'anthropic/claude-3-haiku'
  ];

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    try {
      const currentModelName = modelsToTry[i];
      console.log(`🤖 Analyse IA - Tentative avec le modèle: ${currentModelName}`);

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Big Data Impacts - Analyse IA'
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
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      let text = data.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new Error('Réponse vide de l\'API');
      }

      // Nettoyer la réponse (enlever markdown si présent)
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/```\n?/g, '');
      }

      // Parser le JSON
      const analysis: UseCaseAnalysis = JSON.parse(text);

      console.log('✅ Analyse IA générée avec succès');
      return analysis;
    } catch (modelError: any) {
      lastError = modelError;
      console.warn(`⚠️ Modèle ${modelsToTry[i]} a échoué:`, modelError.message);
      
      if (i === modelsToTry.length - 1) {
        // Dernier modèle, lancer l'erreur
        throw new Error(
          `Tous les modèles IA ont échoué. Dernière erreur: ${lastError.message}\n\n` +
          'Vérifiez votre clé API OpenRouter et votre connexion internet.'
        );
      }
    }
  }

  throw new Error('Erreur inconnue lors de la génération de l\'analyse');
}


