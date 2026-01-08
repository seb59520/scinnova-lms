/**
 * Service de parsing pour extraire les informations d'un contenu de formation structuré
 */

export interface ParsedCourseContent {
  title: string
  reference?: string
  generalObjective?: string
  skills?: string[]
  level?: string
  duration?: string
  targetAudience?: string[]
  prerequisites?: string[]
  learningObjectives?: string[]
  modules?: Array<{
    title: string
    duration?: string
    content?: string[]
    practicalWorks?: string[]
  }>
  organization?: {
    pedagogicalTeam?: string
    pedagogicalMeans?: string[]
    technicalMeans?: string[]
    followUp?: string[]
    indicators?: string[]
  }
}

/**
 * Parse un contenu de formation structuré et extrait les informations
 */
export function parseCourseContent(text: string): ParsedCourseContent {
  // Nettoyer le texte : enlever les numéros de page isolés
  const cleanedText = text.replace(/^\d+\s*$/gm, '')
  const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !/^\d+$/.test(l))
  
  const result: ParsedCourseContent = {
    title: '',
    skills: [],
    targetAudience: [],
    prerequisites: [],
    learningObjectives: [],
    modules: [],
    organization: {
      pedagogicalMeans: [],
      technicalMeans: [],
      followUp: [],
      indicators: []
    }
  }

  let currentSection = ''
  let currentModule: any = null
  let inModuleContent = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Titre principal (première ligne significative)
    if (!result.title && line.length > 10 && !line.match(/^(Lot|Référence|Objectif|Compétences|Niveau|Durée|Profils|Prérequis|Contenu|Organisation)/i)) {
      result.title = line
      continue
    }

    // Référence
    if (line.match(/^Référence\s*[:–-]?\s*(.+)/i)) {
      result.reference = line.replace(/^Référence\s*[:–-]?\s*/i, '').trim()
      continue
    }

    // Objectif général
    if (line.match(/^Objectif général/i) || line.match(/^Objectif\s+de\s+la\s+formation/i)) {
      const objective = extractMultilineContent(lines, i)
      result.generalObjective = objective.text
      i = objective.nextIndex
      continue
    }

    // Compétences visées
    if (line.match(/^Compétences\s+visées/i)) {
      const skills = extractListItems(lines, i + 1)
      result.skills = skills.items
      i = skills.nextIndex
      continue
    }

    // Niveau SAME
    if (line.match(/^Niveau\s+SAME/i)) {
      result.level = line.replace(/^Niveau\s+SAME\s+visé\s*[:–-]?\s*/i, '').trim()
      continue
    }

    // Durée
    if (line.match(/^Durée\s*[:–-]?/i)) {
      result.duration = line.replace(/^Durée\s*[:–-]?\s*/i, '').trim()
      continue
    }

    // Profils des stagiaires
    if (line.match(/^Profils?\s+des?\s+stagiaires?/i)) {
      const profiles = extractListItems(lines, i + 1)
      result.targetAudience = profiles.items
      i = profiles.nextIndex
      continue
    }

    // Prérequis
    if (line.match(/^Prérequis/i)) {
      const prereqs = extractListItems(lines, i + 1)
      result.prerequisites = prereqs.items
      i = prereqs.nextIndex
      continue
    }

    // Objectifs pédagogiques
    if (line.match(/^Objectifs?\s+pédagogiques?/i)) {
      const objectives = extractListItems(lines, i + 1)
      result.learningObjectives = objectives.items
      i = objectives.nextIndex
      continue
    }

    // Contenu de la formation
    if (line.match(/^Contenu\s+de\s+la\s+formation/i)) {
      currentSection = 'content'
      continue
    }

    // Détection d'un module (ligne commençant par • ou - ou un numéro, ou titre de section)
    if (currentSection === 'content' && (
      line.match(/^[•\-\*]\s+/) || 
      line.match(/^\d+[\.\)]\s+/) ||
      (line.match(/^[A-Z][^•\-\*]+$/) && line.length > 10 && !line.match(/^(Lot|Référence|Objectif|Compétences|Niveau|Durée|Profils|Prérequis|Contenu|Organisation)/i))
    )) {
      // Finir le module précédent si nécessaire
      if (currentModule) {
        result.modules!.push(currentModule)
      }

      // Extraire le titre et la durée du module
      let moduleMatch = line.match(/^[•\-\*]\s+(.+?)(?:\s*\(([^)]+)\))?$/i) || 
                       line.match(/^\d+[\.\)]\s+(.+?)(?:\s*\(([^)]+)\))?$/i)
      
      // Si pas de match avec puce/numéro, essayer de détecter un titre de module
      if (!moduleMatch && line.length > 10) {
        // Chercher la durée dans la ligne actuelle ou suivante
        const durationMatch = line.match(/\(([^)]+heure[s]?[^)]*)\)/i) || 
                              (i < lines.length - 1 ? lines[i + 1].match(/\(([^)]+heure[s]?[^)]*)\)/i) : null)
        if (durationMatch) {
          moduleMatch = [null, line.replace(/\(([^)]+heure[s]?[^)]*)\)/i, '').trim(), durationMatch[1]]
        } else {
          moduleMatch = [null, line, undefined]
        }
      }
      
      if (moduleMatch) {
        currentModule = {
          title: moduleMatch[1]?.trim() || line.trim(),
          duration: moduleMatch[2]?.trim(),
          content: [],
          practicalWorks: []
        }
        inModuleContent = true
      }
      continue
    }

    // Contenu du module (sous-points)
    if (inModuleContent && currentModule) {
      // Détecter les sous-points avec puces, tirets, lettres ou numéros
      if (line.match(/^[•\-\*]\s+/) || line.match(/^[a-z]\)\s+/i) || line.match(/^[a-z]\.\s+/i)) {
        const contentItem = line.replace(/^[•\-\*]\s+/, '')
                                 .replace(/^[a-z]\)\s+/i, '')
                                 .replace(/^[a-z]\.\s+/i, '')
                                 .trim()
        
        if (contentItem) {
          // Détecter les travaux pratiques
          if (contentItem.match(/Travaux\s+pratiques/i) || contentItem.match(/TP\s*[:–-]/i)) {
            // Extraire le texte après "Travaux pratiques :"
            const tpText = contentItem.replace(/Travaux\s+pratiques\s*[:–-]\s*/i, '').trim()
            if (tpText) {
              currentModule.practicalWorks!.push(tpText)
            }
          } else {
            currentModule.content!.push(contentItem)
          }
        }
        continue
      }

      // Continuer le contenu sur plusieurs lignes (si la ligne précédente était un contenu)
      if (currentModule.content!.length > 0 && line.length > 0 && !line.match(/^[•\-\*]/)) {
        const lastContent = currentModule.content![currentModule.content!.length - 1]
        if (!lastContent.match(/[\.!?]$/)) {
          currentModule.content![currentModule.content!.length - 1] += ' ' + line
        }
        continue
      }

      // Si on rencontre une nouvelle section, finir le module
      if (line.match(/^(Organisation|Equipe|Moyens|Dispositif|Indicateurs)/i)) {
        if (currentModule) {
          result.modules!.push(currentModule)
          currentModule = null
          inModuleContent = false
        }
        currentSection = ''
      }
    }

    // Organisation de la formation
    if (line.match(/^Organisation\s+de\s+la\s+formation/i)) {
      if (currentModule) {
        result.modules!.push(currentModule)
        currentModule = null
      }
      currentSection = 'organization'
      continue
    }

    // Equipe pédagogique
    if (line.match(/^Equipe\s+pédagogique/i)) {
      const team = extractMultilineContent(lines, i)
      result.organization!.pedagogicalTeam = team.text
      i = team.nextIndex
      continue
    }

    // Moyens pédagogiques
    if (line.match(/^Moyens\s+pédagogiques/i)) {
      const means = extractListItems(lines, i + 1)
      result.organization!.pedagogicalMeans = means.items
      i = means.nextIndex
      continue
    }

    // Dispositif de suivi
    if (line.match(/^Dispositif\s+de\s+suivi/i)) {
      const followUp = extractListItems(lines, i + 1)
      result.organization!.followUp = followUp.items
      i = followUp.nextIndex
      continue
    }

    // Indicateurs
    if (line.match(/^Indicateurs\s+de\s+résultats/i)) {
      const indicators = extractListItems(lines, i + 1)
      result.organization!.indicators = indicators.items
      i = indicators.nextIndex
      continue
    }
  }

  // Ajouter le dernier module si nécessaire
  if (currentModule) {
    result.modules!.push(currentModule)
  }

  return result
}

/**
 * Extrait une liste d'items (puces, tirets, numéros)
 */
function extractListItems(lines: string[], startIndex: number): { items: string[], nextIndex: number } {
  const items: string[] = []
  let i = startIndex

  while (i < lines.length) {
    const line = lines[i]
    
    // Arrêter si on rencontre une nouvelle section
    if (line.match(/^(Contenu|Organisation|Equipe|Moyens|Dispositif|Indicateurs|Profils|Prérequis|Objectifs?)/i) && 
        !line.match(/^Objectifs?\s+pédagogiques?/i)) {
      break
    }

    // Détecter les items de liste
    if (line.match(/^[•\-\*]\s+/) || line.match(/^\d+[\.\)]\s+/) || line.match(/^[a-z]\)\s+/i)) {
      const item = line.replace(/^[•\-\*]\s+/, '')
                       .replace(/^\d+[\.\)]\s+/, '')
                       .replace(/^[a-z]\)\s+/i, '')
                       .trim()
      if (item) {
        items.push(item)
      }
    } else if (line.length > 0 && items.length > 0) {
      // Continuer l'item précédent (texte multiligne)
      items[items.length - 1] += ' ' + line
    } else {
      // Ligne vide ou nouvelle section
      if (line.length === 0 || line.match(/^[A-Z][^a-z]*$/)) {
        break
      }
    }

    i++
  }

  return { items, nextIndex: i - 1 }
}

/**
 * Extrait un contenu multiligne jusqu'à la prochaine section
 */
function extractMultilineContent(lines: string[], startIndex: number): { text: string, nextIndex: number } {
  const content: string[] = []
  let i = startIndex + 1

  while (i < lines.length) {
    const line = lines[i]
    
    // Arrêter si on rencontre une nouvelle section
    if (line.match(/^(Contenu|Organisation|Equipe|Moyens|Dispositif|Indicateurs|Profils|Prérequis|Objectifs?|Compétences|Niveau|Durée)/i) &&
        !line.match(/^Objectifs?\s+pédagogiques?/i)) {
      break
    }

    if (line.length > 0) {
      content.push(line)
    } else if (content.length > 0) {
      // Ligne vide après du contenu = fin
      break
    }

    i++
  }

  return { text: content.join(' '), nextIndex: i - 1 }
}

/**
 * Convertit le contenu parsé en format pour le générateur IA
 */
export function convertToGeneratorFormat(parsed: ParsedCourseContent): {
  title: string
  description: string
  theme?: string
  targetAudience?: string
  duration?: string
  learningObjectives?: string[]
  modules?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
} {
  // Construire la description complète
  const descriptionParts: string[] = []

  if (parsed.generalObjective) {
    descriptionParts.push(`**Objectif général :** ${parsed.generalObjective}`)
  }

  if (parsed.skills && parsed.skills.length > 0) {
    descriptionParts.push(`\n**Compétences visées :**\n${parsed.skills.map(s => `- ${s}`).join('\n')}`)
  }

  if (parsed.modules && parsed.modules.length > 0) {
    descriptionParts.push(`\n**Contenu de la formation :**`)
    parsed.modules.forEach((module, index) => {
      let moduleDesc = `\n**Module ${index + 1} : ${module.title}**`
      if (module.duration) {
        moduleDesc += ` (${module.duration})`
      }
      if (module.content && module.content.length > 0) {
        moduleDesc += `\n${module.content.map(c => `- ${c}`).join('\n')}`
      }
      if (module.practicalWorks && module.practicalWorks.length > 0) {
        moduleDesc += `\n\n**Travaux pratiques :**\n${module.practicalWorks.map(tp => `- ${tp}`).join('\n')}`
      }
      descriptionParts.push(moduleDesc)
    })
  }

  if (parsed.prerequisites && parsed.prerequisites.length > 0) {
    descriptionParts.push(`\n**Prérequis :**\n${parsed.prerequisites.map(p => `- ${p}`).join('\n')}`)
  }

  // Déterminer le niveau de difficulté
  let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  if (parsed.level) {
    const levelLower = parsed.level.toLowerCase()
    if (levelLower.includes('initiation') || levelLower.includes('débutant') || levelLower.includes('découverte')) {
      difficulty = 'beginner'
    } else if (levelLower.includes('avancé') || levelLower.includes('expert') || levelLower.includes('maîtrise')) {
      difficulty = 'advanced'
    }
  }

  // Extraire les titres des modules
  const modules = parsed.modules?.map(m => m.title) || []

  // Construire le public cible
  const targetAudience = parsed.targetAudience?.join(', ') || undefined

  return {
    title: parsed.title,
    description: descriptionParts.join('\n\n'),
    theme: parsed.reference ? `Formation professionnelle - ${parsed.reference}` : undefined,
    targetAudience,
    duration: parsed.duration,
    learningObjectives: parsed.learningObjectives,
    modules: modules.length > 0 ? modules : undefined,
    difficulty
  }
}

