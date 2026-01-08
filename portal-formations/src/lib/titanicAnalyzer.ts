/**
 * Service d'analyse IA des réponses Titanic
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-1.5-pro';

export interface TitanicAnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score?: number;
  detailedAnalysis: string;
}

export interface TitanicAnswers {
  [questionId: string]: {
    questionId: string;
    dropdownValue: string;
    inputValue: string;
    timestamp: number;
  };
}

export interface TitanicPredictions {
  passenger: {
    sexe: 'male' | 'female';
    age: number | null;
    classe: number;
    prix: number;
    embarquement: 'S' | 'C' | 'Q';
    survivant: 'oui' | 'non';
  };
  userPrediction: 'oui' | 'non' | null;
  justification: string;
  revealed: boolean;
}

/**
 * Analyse les réponses d'un module Big Data ou Data Science
 */
export async function analyzeTitanicAnswers(
  answers: TitanicAnswers,
  moduleType: 'big-data' | 'data-science',
  questions: Array<{ id: string; label: string }>
): Promise<TitanicAnalysisResult> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'VITE_OPENROUTER_API_KEY n\'est pas configurée. Veuillez configurer la clé API OpenRouter.'
    );
  }

  const moduleContext = {
    'big-data': {
      title: 'Big Data - Exploration des données brutes',
      objectives: [
        'Comprendre la structure d\'un dataset',
        'Identifier les types de données',
        'Détecter les valeurs manquantes',
        'Utiliser des filtres pour explorer les données',
      ],
    },
    'data-science': {
      title: 'Data Science - Analyse et visualisation',
      objectives: [
        'Interpréter des graphiques statistiques',
        'Calculer des taux et proportions',
        'Identifier des corrélations',
        'Formuler des hypothèses basées sur des visualisations',
      ],
    },
  };

  const context = moduleContext[moduleType];

  // Construire le prompt
  const prompt = `Tu es un formateur expert en ${context.title}. Analyse les réponses d'un étudiant et fournis une évaluation détaillée.

CONTEXTE DU MODULE:
${context.title}

OBJECTIFS PÉDAGOGIQUES:
${context.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

QUESTIONS ET RÉPONSES DE L'ÉTUDIANT:
${questions
  .map((q) => {
    const answer = answers[q.id];
    if (!answer) return `- ${q.label}: Non répondu`;
    return `- ${q.label}:
  Choix: ${answer.dropdownValue}
  Réponse: ${answer.inputValue}`;
  })
  .join('\n\n')}

INSTRUCTIONS D'ANALYSE:
1. Évalue la qualité et la justesse des réponses
2. Identifie les points forts de l'étudiant
3. Identifie les points à améliorer
4. Propose des suggestions constructives
5. Donne un score sur 20 (optionnel)

FORMAT DE RÉPONSE ATTENDU (JSON strict):
{
  "summary": "Résumé global de 2-3 phrases",
  "strengths": ["Point fort 1", "Point fort 2", ...],
  "weaknesses": ["Point faible 1", "Point faible 2", ...],
  "suggestions": ["Suggestion 1", "Suggestion 2", ...],
  "score": 15,
  "detailedAnalysis": "Analyse détaillée de 3-4 paragraphes"
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Titanic Learning App - Analyse IA',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Tu es un formateur expert qui analyse les réponses d\'étudiants de manière constructive et pédagogique. Tu réponds toujours en JSON valide.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erreur API OpenRouter: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Aucune réponse de l\'IA');
    }

    // Parser le JSON
    const analysis = JSON.parse(content) as TitanicAnalysisResult;

    return analysis;
  } catch (error: any) {
    console.error('Erreur lors de l\'analyse IA:', error);
    throw new Error(`Erreur lors de l'analyse IA: ${error.message}`);
  }
}

/**
 * Analyse les prédictions du module Machine Learning
 */
export async function analyzeTitanicPredictions(
  predictions: TitanicPredictions[],
  answers: TitanicAnswers
): Promise<TitanicAnalysisResult> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'VITE_OPENROUTER_API_KEY n\'est pas configurée. Veuillez configurer la clé API OpenRouter.'
    );
  }

  // Calculer le score
  const revealedPredictions = predictions.filter((p) => p.revealed);
  const correctPredictions = revealedPredictions.filter(
    (p) => p.userPrediction === p.passenger.survivant
  );
  const score = revealedPredictions.length > 0
    ? Math.round((correctPredictions.length / revealedPredictions.length) * 20)
    : undefined;

  // Détecter les biais
  const allMalePredicted = revealedPredictions.every(
    (p) => p.passenger.sexe === 'male' && p.userPrediction === 'non'
  );
  const allFemalePredicted = revealedPredictions.every(
    (p) => p.passenger.sexe === 'female' && p.userPrediction === 'oui'
  );

  const prompt = `Tu es un formateur expert en Machine Learning. Analyse les prédictions d'un étudiant sur la survie des passagers du Titanic.

CONTEXTE:
L'étudiant a fait des prédictions sur 8 passagers en se basant sur leurs caractéristiques (sexe, âge, classe, prix, embarquement).

RÉSULTATS:
- Score: ${score !== undefined ? `${score}/20` : 'Non calculable'} (${correctPredictions.length}/${revealedPredictions.length} prédictions correctes)
- Biais potentiel détecté: ${allMalePredicted ? 'Oui - Prédictions systématiques "non" pour tous les hommes' : allFemalePredicted ? 'Oui - Prédictions systématiques "oui" pour toutes les femmes' : 'Non détecté'}

PRÉDICTIONS:
${revealedPredictions
  .map(
    (p, i) => `Passager ${i + 1}:
  Caractéristiques: ${p.passenger.sexe}, classe ${p.passenger.classe}, âge ${p.passenger.age || '?'}, prix ${p.passenger.prix.toFixed(2)}
  Prédiction: ${p.userPrediction}
  Réalité: ${p.passenger.survivant}
  Résultat: ${p.userPrediction === p.passenger.survivant ? '✓ Correct' : '✗ Incorrect'}
  Justification: ${p.justification}`
  )
  .join('\n\n')}

RÉPONSES AUX QUESTIONS RÉFLEXIVES:
${Object.entries(answers)
  .map(([id, answer]) => `- Question ${id}: ${answer.dropdownValue} - ${answer.inputValue}`)
  .join('\n')}

INSTRUCTIONS D'ANALYSE:
1. Évalue la qualité des prédictions et justifications
2. Identifie les patterns dans les erreurs
3. Analyse la compréhension des biais
4. Évalue la réflexion éthique
5. Propose des suggestions d'amélioration

FORMAT DE RÉPONSE ATTENDU (JSON strict):
{
  "summary": "Résumé global de 2-3 phrases",
  "strengths": ["Point fort 1", "Point fort 2", ...],
  "weaknesses": ["Point faible 1", "Point faible 2", ...],
  "suggestions": ["Suggestion 1", "Suggestion 2", ...],
  "score": ${score || 'null'},
  "detailedAnalysis": "Analyse détaillée de 3-4 paragraphes"
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Titanic Learning App - Analyse IA',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Tu es un formateur expert qui analyse les prédictions et réflexions d\'étudiants en Machine Learning. Tu réponds toujours en JSON valide.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erreur API OpenRouter: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Aucune réponse de l\'IA');
    }

    const analysis = JSON.parse(content) as TitanicAnalysisResult;
    if (score !== undefined) {
      analysis.score = score;
    }

    return analysis;
  } catch (error: any) {
    console.error('Erreur lors de l\'analyse IA:', error);
    throw new Error(`Erreur lors de l'analyse IA: ${error.message}`);
  }
}
