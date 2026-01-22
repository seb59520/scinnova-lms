#!/usr/bin/env node

/**
 * Script simple pour convertir un glossaire JSON vers format cours
 * Utilisation: node convert-glossaire.js <fichier-glossaire.json>
 */

const fs = require('fs');
const path = require('path');

// Fonction simplifiée de conversion (sans TypeScript)
function glossaryToTipTapCourse(glossary) {
  const categoryMap = new Map();
  
  // Créer une map des catégories
  if (glossary.categories) {
    glossary.categories.forEach(cat => {
      categoryMap.set(cat.id, cat.name);
    });
  }

  const mainContent = [];

  // Titre principal
  mainContent.push({
    type: "heading",
    attrs: { level: 2 },
    content: [
      { type: "text", text: glossary.metadata.title }
    ]
  });

  // Description
  if (glossary.metadata.description) {
    mainContent.push({
      type: "paragraph",
      content: [
        { type: "text", text: glossary.metadata.description }
      ]
    });
  }

  // Grouper les termes par catégorie
  const termsByCategory = new Map();
  const uncategorizedTerms = [];

  glossary.terms.forEach(term => {
    if (term.category_id) {
      if (!termsByCategory.has(term.category_id)) {
        termsByCategory.set(term.category_id, []);
      }
      termsByCategory.get(term.category_id).push(term);
    } else {
      uncategorizedTerms.push(term);
    }
  });

  // Fonction pour convertir un terme en TipTap
  function termToTipTap(term) {
    const content = [];

    // Titre du terme
    content.push({
      type: "heading",
      attrs: { level: 3 },
      content: [
        { type: "text", text: term.word }
      ]
    });

    // Catégorie
    if (term.category_id && categoryMap.has(term.category_id)) {
      content.push({
        type: "paragraph",
        content: [
          { type: "text", marks: [{ type: "bold" }], text: "Catégorie: " },
          { type: "text", text: categoryMap.get(term.category_id) }
        ]
      });
    }

    // Tags
    if (term.tags && term.tags.length > 0) {
      content.push({
        type: "paragraph",
        content: [
          { type: "text", marks: [{ type: "bold" }], text: "Tags: " },
          { type: "text", text: term.tags.join(", ") }
        ]
      });
    }

    // Explication
    content.push({
      type: "heading",
      attrs: { level: 4 },
      content: [
        { type: "text", text: "Explication" }
      ]
    });

    const explanationLines = term.explanation.split('\n').filter(line => line.trim());
    explanationLines.forEach(line => {
      content.push({
        type: "paragraph",
        content: [
          { type: "text", text: line.trim() }
        ]
      });
    });

    // Exemple
    content.push({
      type: "heading",
      attrs: { level: 4 },
      content: [
        { type: "text", text: "Exemple" }
      ]
    });

    const codeLanguage = term.language || "python";

    content.push({
      type: "codeBlock",
      attrs: { language: codeLanguage },
      content: [
        { type: "text", text: term.example }
      ]
    });

    // Termes liés
    if (term.related_terms && term.related_terms.length > 0) {
      content.push({
        type: "paragraph",
        content: [
          { type: "text", marks: [{ type: "bold" }], text: "Termes liés: " },
          { type: "text", text: term.related_terms.join(", ") }
        ]
      });
    }

    return content;
  }

  // Ajouter les termes par catégorie
  if (glossary.categories) {
    glossary.categories.forEach(category => {
      const terms = termsByCategory.get(category.id);
      if (terms && terms.length > 0) {
        mainContent.push({
          type: "heading",
          attrs: { level: 3 },
          content: [
            { type: "text", text: category.name }
          ]
        });

        if (category.description) {
          mainContent.push({
            type: "paragraph",
            content: [
              { type: "text", text: category.description }
            ]
          });
        }

        terms.forEach(term => {
          mainContent.push(...termToTipTap(term));
        });
      }
    });
  }

  // Ajouter les termes non catégorisés
  if (uncategorizedTerms.length > 0) {
    mainContent.push({
      type: "heading",
      attrs: { level: 3 },
      content: [
        { type: "text", text: "Autres termes" }
      ]
    });

    uncategorizedTerms.forEach(term => {
      mainContent.push(...termToTipTap(term));
    });
  }

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
  };
}

// Script principal
const glossaryPath = process.argv[2] || './glossaire-python-exemple.json';

if (!fs.existsSync(glossaryPath)) {
  console.error(`❌ Fichier non trouvé: ${glossaryPath}`);
  process.exit(1);
}

try {
  console.log(`📖 Lecture du glossaire: ${glossaryPath}`);
  const glossaryData = fs.readFileSync(glossaryPath, 'utf-8');
  const glossary = JSON.parse(glossaryData);
  
  console.log(`✅ Glossaire chargé: ${glossary.metadata.title}`);
  console.log(`   ${glossary.terms.length} terme(s) trouvé(s)`);
  
  const course = glossaryToTipTapCourse(glossary);
  const courseJson = JSON.stringify(course, null, 2);
  
  const outputPath = path.join(
    path.dirname(glossaryPath),
    `${path.basename(glossaryPath, '.json')}-course.json`
  );
  
  fs.writeFileSync(outputPath, courseJson, 'utf-8');
  console.log(`✅ Glossaire converti avec succès: ${outputPath}`);
} catch (error) {
  console.error('❌ Erreur lors de la conversion:', error.message);
  process.exit(1);
}
