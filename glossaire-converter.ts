/**
 * Convertisseur de glossaire JSON vers format TipTap (compatible portal-formations)
 * 
 * Ce script convertit un glossaire au format générique (mot, explication, exemple)
 * vers le format TipTap JSON utilisé par le système de cours.
 */

interface GlossaryTerm {
  id: string
  word: string
  explanation: string
  example: string
  category_id?: string
  tags?: string[]
  related_terms?: string[]
  language?: string
  difficulty?: "beginner" | "intermediate" | "advanced"
}

interface GlossaryCategory {
  id: string
  name: string
  description?: string
}

interface GlossaryMetadata {
  title: string
  description?: string
  category?: string
  version?: string
  author?: string
  created_at?: string
  updated_at?: string
}

interface Glossary {
  metadata: GlossaryMetadata
  categories?: GlossaryCategory[]
  terms: GlossaryTerm[]
}

interface TipTapContent {
  type: string
  content?: any[]
  attrs?: any
}

/**
 * Convertit un terme de glossaire en format TipTap
 */
function termToTipTap(term: GlossaryTerm, categoryMap: Map<string, string>): TipTapContent[] {
  const content: TipTapContent[] = []

  // Titre du terme (niveau 3)
  content.push({
    type: "heading",
    attrs: { level: 3 },
    content: [
      { type: "text", text: term.word }
    ]
  })

  // Catégorie (si disponible)
  if (term.category_id && categoryMap.has(term.category_id)) {
    content.push({
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Catégorie: " },
        { type: "text", text: categoryMap.get(term.category_id)! }
      ]
    })
  }

  // Tags (si disponibles)
  if (term.tags && term.tags.length > 0) {
    content.push({
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Tags: " },
        { type: "text", text: term.tags.join(", ") }
      ]
    })
  }

  // Explication
  content.push({
    type: "heading",
    attrs: { level: 4 },
    content: [
      { type: "text", text: "Explication" }
    ]
  })

  // Diviser l'explication en paragraphes (par lignes)
  const explanationLines = term.explanation.split('\n').filter(line => line.trim())
  explanationLines.forEach(line => {
    content.push({
      type: "paragraph",
      content: [
        { type: "text", text: line.trim() }
      ]
    })
  })

  // Exemple
  content.push({
    type: "heading",
    attrs: { level: 4 },
    content: [
      { type: "text", text: "Exemple" }
    ]
  })

  // Déterminer le langage du code (par défaut: python)
  const codeLanguage = term.language || "python"

  content.push({
    type: "codeBlock",
    attrs: { language: codeLanguage },
    content: [
      { type: "text", text: term.example }
    ]
  })

  // Termes liés (si disponibles)
  if (term.related_terms && term.related_terms.length > 0) {
    content.push({
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Termes liés: " },
        { type: "text", text: term.related_terms.join(", ") }
      ]
    })
  })

  return content
}

/**
 * Convertit un glossaire complet en format TipTap pour un cours
 */
export function glossaryToTipTapCourse(glossary: Glossary): any {
  const categoryMap = new Map<string, string>()
  
  // Créer une map des catégories
  if (glossary.categories) {
    glossary.categories.forEach(cat => {
      categoryMap.set(cat.id, cat.name)
    })
  }

  // Contenu principal
  const mainContent: TipTapContent[] = []

  // Titre principal
  mainContent.push({
    type: "heading",
    attrs: { level: 2 },
    content: [
      { type: "text", text: glossary.metadata.title }
    ]
  })

  // Description
  if (glossary.metadata.description) {
    mainContent.push({
      type: "paragraph",
      content: [
        { type: "text", text: glossary.metadata.description }
      ]
    })
  }

  // Grouper les termes par catégorie
  const termsByCategory = new Map<string, GlossaryTerm[]>()
  const uncategorizedTerms: GlossaryTerm[] = []

  glossary.terms.forEach(term => {
    if (term.category_id) {
      if (!termsByCategory.has(term.category_id)) {
        termsByCategory.set(term.category_id, [])
      }
      termsByCategory.get(term.category_id)!.push(term)
    } else {
      uncategorizedTerms.push(term)
    }
  })

  // Ajouter les termes par catégorie
  if (glossary.categories) {
    glossary.categories.forEach(category => {
      const terms = termsByCategory.get(category.id)
      if (terms && terms.length > 0) {
        // Titre de catégorie
        mainContent.push({
          type: "heading",
          attrs: { level: 3 },
          content: [
            { type: "text", text: category.name }
          ]
        })

        if (category.description) {
          mainContent.push({
            type: "paragraph",
            content: [
              { type: "text", text: category.description }
            ]
          })
        }

        // Termes de cette catégorie
        terms.forEach(term => {
          mainContent.push(...termToTipTap(term, categoryMap))
        })
      }
    })
  }

  // Ajouter les termes non catégorisés
  if (uncategorizedTerms.length > 0) {
    mainContent.push({
      type: "heading",
      attrs: { level: 3 },
      content: [
        { type: "text", text: "Autres termes" }
      ]
    })

    uncategorizedTerms.forEach(term => {
      mainContent.push(...termToTipTap(term, categoryMap))
    })
  }

  // Format de cours compatible avec portal-formations
  return {
    type: "resource",
    title: glossary.metadata.title,
    position: 0,
    published: true,
    content: {
      description: glossary.metadata.description || "",
      body: {
        type: "doc",
        content: mainContent
      }
    }
  }
}

/**
 * Convertit un glossaire en format JSON de cours (compatible portal-formations)
 */
export function glossaryToCourseJson(glossary: Glossary): string {
  const course = glossaryToTipTapCourse(glossary)
  return JSON.stringify(course, null, 2)
}

/**
 * Génère un glossaire simplifié (sans catégories) pour affichage rapide
 */
export function glossaryToSimpleFormat(glossary: Glossary): any {
  const categoryMap = new Map<string, string>()
  
  // Créer une map des catégories
  if (glossary.categories) {
    glossary.categories.forEach(cat => {
      categoryMap.set(cat.id, cat.name)
    })
  }

  return {
    title: glossary.metadata.title,
    description: glossary.metadata.description,
    terms: glossary.terms.map(term => ({
      word: term.word,
      explanation: term.explanation,
      example: term.example,
      category: term.category_id ? categoryMap.get(term.category_id) : undefined,
      tags: term.tags || [],
      difficulty: term.difficulty
    }))
  }
}

// Exemple d'utilisation
if (require.main === module) {
  // Charger un glossaire depuis un fichier JSON
  const fs = require('fs')
  const path = require('path')

  const glossaryPath = process.argv[2] || './glossaire-python-exemple.json'
  
  try {
    const glossaryData = fs.readFileSync(glossaryPath, 'utf-8')
    const glossary: Glossary = JSON.parse(glossaryData)
    
    const courseJson = glossaryToCourseJson(glossary)
    
    // Sauvegarder le résultat
    const outputPath = path.join(
      path.dirname(glossaryPath),
      `${path.basename(glossaryPath, '.json')}-course.json`
    )
    
    fs.writeFileSync(outputPath, courseJson, 'utf-8')
    console.log(`✅ Glossaire converti avec succès: ${outputPath}`)
  } catch (error) {
    console.error('❌ Erreur lors de la conversion:', error)
    process.exit(1)
  }
}
