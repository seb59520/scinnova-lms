// Configuration OpenRouter - réutilise la même configuration que slideGenerator
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-3-flash-preview'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface CorrectionResult {
  correction: string
  feedback: string
  score?: number
  strengths: string[]
  improvements: string[]
}

export interface CorrectionContext {
  question?: string
  instructions?: string
  objective?: string
  expectedOutputs?: string[]
  criteria?: string[]
  scenario?: string
  context?: any
}

/**
 * Corrige une réponse utilisateur avec l'IA via OpenRouter
 */
export async function correctAnswer(
  userAnswer: string,
  context: CorrectionContext
): Promise<CorrectionResult> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY n\'est pas configurée dans les variables d\'environnement')
  }

  // Modèles à essayer dans l'ordre de priorité
  const defaultModels = [
    OPENROUTER_MODEL,
    'google/gemini-3-flash-preview',
    'google/gemini-3-pro-preview',
    'google/gemini-1.5-pro',
    'openai/gpt-4o-mini',
    'anthropic/claude-3-haiku'
  ]

  // Construire le prompt de correction
  let prompt = `Tu es un correcteur pédagogique expert. Ta mission est de corriger la réponse d'un apprenant de manière constructive et pédagogique.

`

  // Ajouter le contexte de l'exercice
  if (context.objective) {
    prompt += `OBJECTIF DE L'EXERCICE:\n${context.objective}\n\n`
  }

  if (context.question) {
    prompt += `QUESTION:\n${context.question}\n\n`
  }

  if (context.instructions) {
    prompt += `INSTRUCTIONS:\n${context.instructions}\n\n`
  }

  if (context.scenario) {
    prompt += `SCÉNARIO:\n${context.scenario}\n\n`
  }

  if (context.expectedOutputs && context.expectedOutputs.length > 0) {
    prompt += `RÉPONSES ATTENDUES (éléments à retrouver):\n${context.expectedOutputs.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n`
  }

  if (context.criteria && context.criteria.length > 0) {
    prompt += `CRITÈRES D'ÉVALUATION:\n${context.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n`
  }

  prompt += `RÉPONSE DE L'APPRENANT:\n${userAnswer}\n\n`

  prompt += `TÂCHE:
1. Analyse la réponse de l'apprenant
2. Identifie les points forts et les points à améliorer
3. Fournis une correction constructive et pédagogique
4. Propose une note sur 100 (optionnel, si tu peux l'estimer)
5. Sois encourageant tout en étant précis

FORMAT DE RÉPONSE (JSON uniquement, sans markdown):
{
  "correction": "Correction détaillée de la réponse avec explications pédagogiques",
  "feedback": "Feedback général et encourageant pour l'apprenant",
  "score": nombre entre 0 et 100 (optionnel, null si tu ne peux pas estimer),
  "strengths": ["Point fort 1", "Point fort 2", ...],
  "improvements": ["Point à améliorer 1", "Point à améliorer 2", ...]
}

RÉPONDS UNIQUEMENT AVEC LE JSON, SANS MARKDOWN, SANS EXPLICATIONS, SANS BACKTICKS.`

  let lastError: any = null

  // Essayer chaque modèle jusqu'à ce qu'un fonctionne
  for (let i = 0; i < defaultModels.length; i++) {
    try {
      const currentModelName = defaultModels[i]
      console.log(`🤖 Correction IA - Tentative avec le modèle: ${currentModelName}`)

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Portal Formations - Correcteur IA'
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
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      let text = data.choices?.[0]?.message?.content || ''

      if (!text) {
        throw new Error('Réponse vide de l\'API')
      }

      // Nettoyer le texte (enlever markdown si présent)
      text = text.trim()
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // Parser le JSON
      const correctionResult: CorrectionResult = JSON.parse(text)

      console.log('✅ Correction IA générée avec succès')
      return correctionResult
    } catch (modelError: any) {
      lastError = modelError
      console.warn(`⚠️ Modèle ${defaultModels[i]} a échoué:`, modelError.message)
      
      // Si c'est le dernier modèle, lancer l'erreur
      if (i === defaultModels.length - 1) {
        break
      }
    }
  }

  // Tous les modèles ont échoué
  const errorMessage = lastError?.message || 'Erreur inconnue'
  throw new Error(`Impossible de générer la correction. Tous les modèles ont échoué. Dernière erreur: ${errorMessage}`)
}

