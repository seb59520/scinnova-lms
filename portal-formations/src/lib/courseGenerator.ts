// Configuration OpenRouter - à mettre dans les variables d'environnement
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-3-flash-preview'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface CourseGenerationRequest {
  title: string
  description: string
  theme?: string
  targetAudience?: string
  duration?: string
  learningObjectives?: string[]
  modules?: string[]
  includeQuizzes?: boolean
  includeExercises?: boolean
  includeGames?: boolean
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  verbosity?: 'concise' | 'balanced' | 'detailed' | 'very-detailed' | 'exhaustive'
  precision?: 'general' | 'precise' | 'very-precise'
}

export interface CourseGenerationProgress {
  step: string
  progress: number
  total: number
}

/**
 * Génère un cours complet au format JSON via IA
 */
export async function generateCourse(
  request: CourseGenerationRequest,
  onProgress?: (progress: CourseGenerationProgress) => void
): Promise<any> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'VITE_OPENROUTER_API_KEY n\'est pas configurée dans les variables d\'environnement.\n\n' +
      'Pour corriger ce problème :\n' +
      '1. Créez un compte sur https://openrouter.ai/\n' +
      '2. Générez une clé API dans la section "Keys"\n' +
      '3. Ajoutez-la dans votre fichier .env : VITE_OPENROUTER_API_KEY=votre_cle_ici\n' +
      '4. Redémarrez votre serveur de développement'
    )
  }

  onProgress?.({ step: 'Préparation du prompt...', progress: 0, total: 100 })

  // Modèles à essayer dans l'ordre de priorité
  const defaultModels = [
    OPENROUTER_MODEL,
    'google/gemini-3-flash-preview',
    'google/gemini-3-pro-preview',
    'google/gemini-1.5-pro',
    'openai/gpt-4o-mini',
    'anthropic/claude-3-haiku'
  ]

  // Construire le prompt détaillé
  const prompt = buildCourseGenerationPrompt(request)

  onProgress?.({ step: 'Génération du cours via IA...', progress: 20, total: 100 })

  let lastError: any = null

  // Essayer chaque modèle jusqu'à ce qu'un fonctionne
  for (let i = 0; i < defaultModels.length; i++) {
    try {
      const currentModelName = defaultModels[i]
      console.log(`🤖 Génération de cours - Tentative avec le modèle: ${currentModelName}`)

      // Ajuster la température selon la précision
      const precision = request.precision || 'precise'
      let temperature = 0.3
      if (precision === 'general') {
        temperature = 0.5
      } else if (precision === 'precise') {
        temperature = 0.3
      } else if (precision === 'very-precise') {
        temperature = 0.1
      }

      // Ajuster max_tokens selon la verbosité
      const verbosity = request.verbosity || 'balanced'
      let maxTokens = 8000
      if (verbosity === 'concise') {
        maxTokens = 6000
      } else if (verbosity === 'balanced') {
        maxTokens = 10000
      } else if (verbosity === 'detailed') {
        maxTokens = 12000
      } else if (verbosity === 'very-detailed') {
        maxTokens = 16000
      } else if (verbosity === 'exhaustive') {
        maxTokens = 20000
      }

      const requestBody: any = {
        model: currentModelName,
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en création de contenu pédagogique. Tu génères des cours complets au format JSON strictement conforme au système LMS spécifié. Tu dois TOUJOURS retourner un JSON valide, sans erreurs de syntaxe.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens
      }

      // Ajouter response_format seulement pour les modèles qui le supportent
      if (currentModelName.includes('gpt-4') || currentModelName.includes('gpt-3.5')) {
        requestBody.response_format = { type: 'json_object' }
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Portal Formations - Générateur de Cours IA'
        },
        body: JSON.stringify(requestBody)
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

      onProgress?.({ step: 'Traitement de la réponse...', progress: 80, total: 100 })

      // Nettoyer la réponse (enlever markdown si présent)
      text = cleanJsonResponse(text)

      // Essayer de parser le JSON, avec réparation si nécessaire
      let courseJson: any
      try {
        courseJson = JSON.parse(text)
      } catch (parseError: any) {
        // Essayer de réparer le JSON
        console.warn('Tentative de réparation du JSON...', parseError.message)
        const repairedText = repairJson(text)
        try {
          courseJson = JSON.parse(repairedText)
          console.log('✅ JSON réparé avec succès')
        } catch (repairError) {
          // Si la réparation échoue, essayer d'extraire le JSON valide
          const extractedJson = extractJsonFromText(text)
          if (extractedJson) {
            courseJson = extractedJson
            console.log('✅ JSON extrait avec succès')
          } else {
            throw new Error(`JSON invalide: ${parseError.message}. Impossible de réparer automatiquement.`)
          }
        }
      }

      onProgress?.({ step: 'Validation du JSON...', progress: 90, total: 100 })

      // Valider la structure de base
      validateCourseJson(courseJson)

      onProgress?.({ step: 'Cours généré avec succès !', progress: 100, total: 100 })

      console.log('✅ Cours généré avec succès')
      return courseJson
    } catch (modelError: any) {
      lastError = modelError
      console.warn(`⚠️ Modèle ${defaultModels[i]} a échoué:`, modelError.message)
      
      // Si c'est le dernier modèle, lancer l'erreur
      if (i === defaultModels.length - 1) {
        throw new Error(
          `Tous les modèles ont échoué. Dernière erreur: ${lastError.message}\n\n` +
          'Vérifiez votre clé API OpenRouter et votre connexion internet.'
        )
      }
    }
  }

  throw lastError || new Error('Erreur inconnue lors de la génération')
}

/**
 * Construit le prompt détaillé pour la génération de cours
 */
function buildCourseGenerationPrompt(request: CourseGenerationRequest): string {
  const {
    title,
    description,
    theme,
    targetAudience,
    duration,
    learningObjectives,
    modules,
    includeQuizzes,
    includeExercises,
    includeGames,
    difficulty,
    verbosity = 'balanced',
    precision = 'precise'
  } = request

  // Instructions selon la verbosité
  const verbosityInstructions: Record<string, string> = {
    'concise': 'Sois CONCIS : contenu essentiel uniquement, pas de détails superflus. Chaque module doit être court et direct.',
    'balanced': 'Sois ÉQUILIBRÉ : contenu complet mais structuré. Chaque module doit avoir un contenu approprié sans être trop long.',
    'detailed': 'Sois DÉTAILLÉ : contenu approfondi avec explications et exemples. Chaque module doit être riche en contenu.',
    'very-detailed': 'Sois TRÈS DÉTAILLÉ : contenu exhaustif avec explications approfondies, exemples concrets, cas d\'usage. Chaque module doit être très complet.',
    'exhaustive': 'Sois EXHAUSTIF et PRATIQUE : pour chaque concept, explique NON SEULEMENT QUOI faire mais AUSSI COMMENT le faire. Inclus des étapes détaillées, des procédures pas à pas, des méthodes concrètes, des exemples pratiques complets, des captures d\'écran conceptuelles (décrites), des workflows détaillés. Chaque module doit être un guide pratique complet avec des instructions précises et actionnables. Ne te contente PAS de dire "il faut configurer X", explique EXACTEMENT comment configurer X, étape par étape, avec tous les détails nécessaires.'
  }

  // Instructions selon la précision
  const precisionInstructions: Record<string, string> = {
    'general': 'Approche GÉNÉRALE : concepts larges, vue d\'ensemble. Le contenu peut être plus flexible.',
    'precise': 'Approche PRÉCISE : concepts détaillés et techniques. Le contenu doit être exact et spécifique.',
    'very-precise': 'Approche TRÈS PRÉCISE : concepts très détaillés, terminologie exacte, détails techniques précis. Le contenu doit être rigoureux et précis.'
  }

  let prompt = `Crée un cours complet au format JSON strictement conforme au système LMS suivant.

CONTEXTE DU COURS :
- Titre : ${title}
- Description : ${description}
${theme ? `- Thème : ${theme}` : ''}
${targetAudience ? `- Public cible : ${targetAudience}` : ''}
${duration ? `- Durée estimée : ${duration}` : ''}
${difficulty ? `- Niveau de difficulté : ${difficulty}` : ''}

OBJECTIFS PÉDAGOGIQUES :
${learningObjectives && learningObjectives.length > 0
  ? learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')
  : '- À définir selon le sujet'}

STRUCTURE DES MODULES :
${modules && modules.length > 0
  ? modules.map((mod, i) => `Module ${i + 1} : ${mod}`).join('\n')
  : '- À créer selon le sujet et les objectifs'}

CONTENU À INCLURE :
${includeQuizzes ? '✅ Quiz interactifs' : '❌ Pas de quiz'}
${includeExercises ? '✅ Exercices pratiques' : '❌ Pas d\'exercices'}
${includeGames ? '✅ Jeux pédagogiques' : '❌ Pas de jeux'}

FORMAT JSON STRICT À RESPECTER :

{
  "title": "Titre du cours",
  "description": "Description complète du cours (markdown supporté)",
  "status": "draft",
  "access_type": "free",
  "price_cents": 0,
  "currency": "EUR",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Module 1",
      "position": 0,
      "theme": {
        "primaryColor": "#10B981",
        "secondaryColor": "#059669"
      },
      "items": [
        {
          "type": "resource",
          "title": "Titre de l'item",
          "position": 0,
          "published": true,
          "content": {
            "description": "Description optionnelle",
            "body": {
              "type": "doc",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Contenu du texte..."
                    }
                  ]
                }
              ]
            }
          },
          "chapters": [
            {
              "title": "Chapitre 1",
              "position": 0,
              "content": {
                "type": "doc",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      {
                        "type": "text",
                        "text": "Contenu du chapitre..."
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}

TYPES D'ITEMS SUPPORTÉS :

1. RESOURCE (contenu de cours) :
{
  "type": "resource",
  "title": "Titre",
  "position": 0,
  "published": true,
  "content": {
    "description": "Description",
    "body": { /* Format TipTap JSON */ }
  }
}

2. SLIDE (support de présentation) :
{
  "type": "slide",
  "title": "Titre",
  "position": 0,
  "published": true,
  "content": {
    "description": "Description",
    "body": { /* Format TipTap JSON */ }
  }
}

3. EXERCISE (exercice pratique) :
{
  "type": "exercise",
  "title": "Titre",
  "position": 0,
  "published": true,
  "content": {
    "question": { /* Format TipTap JSON */ },
    "correction": { /* Format TipTap JSON */ }
  }
}

4. TP (travaux pratiques) :
{
  "type": "tp",
  "title": "Titre",
  "position": 0,
  "published": true,
  "content": {
    "instructions": { /* Format TipTap JSON */ },
    "checklist": ["Tâche 1", "Tâche 2"]
  }
}

5. GAME/QUIZ (jeu ou quiz interactif) :
{
  "type": "game",
  "title": "Titre",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "quiz",
    "description": "Description",
    "instructions": "Instructions",
    "scoring": {
      "totalQuestions": 10,
      "pointsPerQuestion": 1,
      "passingScore": 7
    },
    "levels": [
      {
        "level": 1,
        "name": "Niveau 1",
        "questions": [
          {
            "id": "q1-1",
            "type": "mcq",
            "prompt": "Question ?",
            "options": ["Option A", "Option B", "Option C"],
            "answer": "Option A",
            "explanation": "Explication",
            "difficulty": 1
          }
        ]
      }
    ]
  }
}

RÈGLES OBLIGATOIRES :
1. ✅ status doit être "draft" ou "published"
2. ✅ access_type doit être "free", "paid" ou "invite"
3. ✅ Les positions sont 0-indexed (commencent à 0)
4. ✅ Chaque module doit avoir un title et position
5. ✅ Chaque item doit avoir type, title, position
6. ✅ Le format TipTap JSON pour le texte : { "type": "doc", "content": [...] }
7. ✅ Les chapitres sont optionnels dans les items
8. ✅ published par défaut est true si omis

FORMAT TIPTAP JSON (pour le texte) :
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Votre texte ici"
        }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [
        {
          "type": "text",
          "text": "Titre niveau 1"
        }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "Élément de liste"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

ERREURS À ÉVITER :
❌ Ne pas oublier les guillemets doubles en JSON
❌ Ne pas mettre de virgule après le dernier élément d'un array/object
❌ Ne pas oublier les champs requis (title, position, type)
❌ Ne pas utiliser des positions négatives
❌ Ne pas mettre de contenu TipTap invalide (doit commencer par "type": "doc")

INSTRUCTIONS SPÉCIFIQUES :

NIVEAU DE VERBOSITÉ : ${verbosityInstructions[verbosity]}

NIVEAU DE PRÉCISION : ${precisionInstructions[precision]}

RÈGLE FONDAMENTALE - EXPLICATIONS PRATIQUES :
Pour TOUT contenu généré, évite les formulations évasives comme :
- ❌ "Il faut configurer X"
- ❌ "Vous devez paramétrer Y"
- ❌ "Configurez le serveur"
- ❌ "Mettez en place la solution"

Privilégie TOUJOURS des explications concrètes avec :
- ✅ "Pour configurer X, suivez ces étapes : 1) Ouvrez... 2) Cliquez sur... 3) Entrez..."
- ✅ "Pour paramétrer Y, accédez à [menu/onglet], puis [action précise]"
- ✅ "Pour configurer le serveur : 1) Installez [logiciel] via [méthode], 2) Lancez [commande], 3) Modifiez [fichier] à la ligne [X]"
- ✅ Des procédures pas à pas avec des actions concrètes et vérifiables

${verbosity === 'exhaustive' ? `
⚠️ MODE EXHAUSTIF ACTIVÉ :
Pour CHAQUE concept, action ou procédure, tu DOIS inclure :
1. Le CONTEXTE : pourquoi cette action est nécessaire
2. Les PRÉREQUIS : ce qui doit être fait/en place avant
3. Les ÉTAPES DÉTAILLÉES : chaque action numérotée avec précision
4. Les PARAMÈTRES : valeurs exactes, chemins, commandes
5. La VÉRIFICATION : comment confirmer que c'est bien fait
6. Les EXEMPLES : cas concrets complets avec toutes les valeurs
7. Les PIÈGES : erreurs courantes et comment les éviter

Ne JAMAIS dire "configurez" sans expliquer COMMENT configurer, étape par étape.` : verbosity === 'very-detailed' || verbosity === 'detailed' ? `
Pour chaque concept important, inclus :
- Des explications sur COMMENT procéder (pas juste QUOI faire)
- Des exemples concrets avec des étapes
- Des détails pratiques et actionnables` : ''}

- Crée au moins ${modules?.length || 3} modules avec du contenu varié
- Chaque module doit contenir au moins 2-3 items de types différents
- ${includeQuizzes ? 'Inclus des quiz interactifs avec des questions pertinentes' : ''}
- ${includeExercises ? 'Inclus des exercices pratiques liés au contenu' : ''}
- ${includeGames ? 'Inclus des jeux pédagogiques pour renforcer l\'apprentissage' : ''}
- Le contenu doit être pédagogique, structuré et progressif
- Utilise le format TipTap JSON pour tout le texte
- Assure-toi que le JSON est valide et peut être parsé directement
- ${verbosity === 'concise' ? 'Garde les textes courts mais reste concret avec des actions précises' : verbosity === 'very-detailed' ? 'Développe chaque concept en profondeur avec des exemples et des procédures' : verbosity === 'exhaustive' ? 'Pour CHAQUE concept, explique non seulement QUOI faire mais AUSSI COMMENT le faire. Inclus des procédures pas à pas détaillées, des méthodes concrètes, des exemples pratiques complets avec toutes les étapes. Ne te contente pas de dire "il faut faire X", explique EXACTEMENT comment faire X, étape par étape.' : 'Équilibre entre concision et détails, mais reste concret'}
- ${precision === 'very-precise' ? 'Utilise une terminologie exacte et des détails techniques précis' : precision === 'precise' ? 'Sois précis dans les concepts et la terminologie' : 'Approche générale avec concepts larges'}

RÈGLES CRITIQUES POUR LE JSON :
1. ✅ Utilise UNIQUEMENT des guillemets doubles (") pour les chaînes
2. ✅ Échappe correctement les guillemets dans les chaînes avec \"
3. ✅ Ferme TOUTES les accolades { } et crochets [ ]
4. ✅ Ajoute des virgules entre les éléments d'un array/object (sauf le dernier)
5. ✅ Ne mets PAS de virgule après le dernier élément
6. ✅ Vérifie que toutes les chaînes sont bien fermées
7. ✅ N'utilise PAS de commentaires JSON (// ou /* */)
8. ✅ Assure-toi que le JSON est valide avant de le retourner

RÈGLE D'OR POUR LE CONTENU :
${verbosity === 'exhaustive' ? `
⚠️ CRITIQUE : Ne te contente JAMAIS de dire "il faut faire X" ou "configurez Y".
Pour CHAQUE action, concept ou procédure, tu DOIS expliquer :
1. QUOI faire (le but)
2. COMMENT le faire (les étapes détaillées)
3. POURQUOI le faire (le contexte)
4. AVEC QUOI le faire (les outils/méthodes)
5. EXEMPLES CONCRETS complets avec toutes les étapes

Exemple MAUVAIS : "Configurez le serveur Exchange"
Exemple BON : "Pour configurer le serveur Exchange, suivez ces étapes : 
1. Ouvrez l'Exchange Management Console
2. Naviguez vers Server Configuration > Mailbox
3. Cliquez sur New Mailbox Database
4. Entrez le nom 'MBX-DB-01' dans le champ Name
5. Sélectionnez le serveur Exchange dans la liste déroulante
6. Spécifiez le chemin de la base de données : C:\\ExchangeDatabases\\MBX-DB-01
7. Cliquez sur New pour créer la base de données
8. Vérifiez que l'état passe à 'Mounted' dans la console
9. Répétez pour chaque base de données nécessaire"

Chaque item de contenu doit être un GUIDE PRATIQUE avec des instructions actionnables, pas juste une description.` : ''}

RÉPONDS UNIQUEMENT AVEC LE JSON VALIDE, SANS MARKDOWN, SANS EXPLICATIONS, SANS BACKTICKS, SANS TEXTE AVANT OU APRÈS.
Le JSON doit commencer par { et se terminer par }.
Vérifie que ton JSON est valide en le parsant mentalement avant de le retourner.`

  return prompt
}

/**
 * Nettoie la réponse JSON de l'IA
 */
function cleanJsonResponse(text: string): string {
  // Enlever les markdown code blocks
  text = text.trim()
  if (text.startsWith('```json')) {
    text = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '')
  } else if (text.startsWith('```')) {
    text = text.replace(/```\n?/g, '')
  }

  // Enlever les explications avant/après le JSON
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}')
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    text = text.substring(jsonStart, jsonEnd + 1)
  }

  // Enlever les caractères de contrôle problématiques
  text = text.replace(/[\x00-\x1F\x7F]/g, '')
  
  return text.trim()
}

/**
 * Tente de réparer un JSON malformé (réparations basiques)
 */
function repairJson(text: string): string {
  let repaired = text

  // Réparer les accolades/ crochets non fermés
  const openBraces = (repaired.match(/\{/g) || []).length
  const closeBraces = (repaired.match(/\}/g) || []).length
  const openBrackets = (repaired.match(/\[/g) || []).length
  const closeBrackets = (repaired.match(/\]/g) || []).length

  if (openBraces > closeBraces) {
    repaired += '}'.repeat(openBraces - closeBraces)
  }
  if (openBrackets > closeBrackets) {
    repaired += ']'.repeat(openBrackets - closeBrackets)
  }

  // Réparer les virgules manquantes avant les accolades/crochets fermants
  repaired = repaired.replace(/([^,}\]])\s*([}\]])/g, '$1$2')

  return repaired
}

/**
 * Extrait un JSON valide depuis un texte qui peut contenir du texte avant/après
 */
function extractJsonFromText(text: string): any | null {
  // Chercher le premier { et le dernier }
  const startIndex = text.indexOf('{')
  const lastIndex = text.lastIndexOf('}')

  if (startIndex === -1 || lastIndex === -1 || lastIndex <= startIndex) {
    return null
  }

  let extracted = text.substring(startIndex, lastIndex + 1)
  
  // Essayer de réparer et parser
  try {
    return JSON.parse(extracted)
  } catch {
    const repaired = repairJson(extracted)
    try {
      return JSON.parse(repaired)
    } catch {
      return null
    }
  }
}

/**
 * Valide la structure de base du JSON de cours généré
 */
function validateCourseJson(courseJson: any): void {
  if (!courseJson.title) {
    throw new Error('Le champ "title" est requis')
  }
  if (!courseJson.description) {
    throw new Error('Le champ "description" est requis')
  }
  if (!courseJson.status || !['draft', 'published'].includes(courseJson.status)) {
    throw new Error('Le champ "status" doit être "draft" ou "published"')
  }
  if (!courseJson.access_type || !['free', 'paid', 'invite'].includes(courseJson.access_type)) {
    throw new Error('Le champ "access_type" doit être "free", "paid" ou "invite"')
  }
  if (!Array.isArray(courseJson.modules)) {
    throw new Error('Le champ "modules" doit être un tableau')
  }
  
  courseJson.modules.forEach((module: any, moduleIndex: number) => {
    if (!module.title) {
      throw new Error(`Module ${moduleIndex}: le champ "title" est requis`)
    }
    if (typeof module.position !== 'number') {
      throw new Error(`Module ${moduleIndex}: le champ "position" doit être un nombre`)
    }
    if (!Array.isArray(module.items)) {
      throw new Error(`Module ${moduleIndex}: le champ "items" doit être un tableau`)
    }
    
    module.items.forEach((item: any, itemIndex: number) => {
      if (!item.type) {
        throw new Error(`Module ${moduleIndex}, Item ${itemIndex}: le champ "type" est requis`)
      }
      if (!item.title) {
        throw new Error(`Module ${moduleIndex}, Item ${itemIndex}: le champ "title" est requis`)
      }
      if (typeof item.position !== 'number') {
        throw new Error(`Module ${moduleIndex}, Item ${itemIndex}: le champ "position" doit être un nombre`)
      }
    })
  })
}

