#!/usr/bin/env node

/**
 * Gestionnaire de templates de glossaire (version JavaScript)
 * Permet d'exporter, importer et mettre à jour des glossaires
 */

const fs = require('fs');
const path = require('path');

/**
 * Exporte un template de glossaire vide
 */
function exportTemplate(outputPath = 'glossaire-template.json') {
  const template = {
    metadata: {
      name: 'Template de Glossaire',
      description: 'Template pour créer un nouveau glossaire',
      version: '1.0.0',
      language: 'fr',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    },
    entries: [
      {
        term: 'Exemple de terme',
        definition: 'Définition du terme avec explication détaillée',
        category: 'Catégorie',
        tags: ['tag1', 'tag2'],
        examples: ['Exemple d\'utilisation 1', 'Exemple d\'utilisation 2'],
        relatedTerms: ['Terme lié 1', 'Terme lié 2'],
        source: 'Source de la définition',
        lastUpdated: new Date().toISOString(),
      },
    ],
  };

  const fullPath = path.resolve(outputPath);
  fs.writeFileSync(fullPath, JSON.stringify(template, null, 2), 'utf-8');
  console.log(`✅ Template exporté vers : ${fullPath}`);
}

/**
 * Importe un glossaire depuis un fichier JSON
 */
function importGlossary(inputPath, outputPath, merge = false) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`❌ Le fichier ${inputPath} n'existe pas`);
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  let importedGlossary;

  try {
    importedGlossary = JSON.parse(content);
  } catch (error) {
    throw new Error(`❌ Erreur de parsing JSON : ${error.message}`);
  }

  // Validation basique
  if (!importedGlossary.metadata || !importedGlossary.entries) {
    throw new Error('❌ Format de glossaire invalide. Structure attendue : { metadata, entries }');
  }

  const targetPath = outputPath || inputPath;

  if (merge && fs.existsSync(targetPath)) {
    // Fusion avec le glossaire existant
    const existingContent = fs.readFileSync(targetPath, 'utf-8');
    const existingGlossary = JSON.parse(existingContent);

    // Fusion des métadonnées
    existingGlossary.metadata.lastUpdated = new Date().toISOString();
    if (importedGlossary.metadata.name) {
      existingGlossary.metadata.name = importedGlossary.metadata.name;
    }
    if (importedGlossary.metadata.description) {
      existingGlossary.metadata.description = importedGlossary.metadata.description;
    }

    // Fusion des entrées (évite les doublons par terme)
    const existingTerms = new Set(
      existingGlossary.entries.map((e) => e.term.toLowerCase())
    );

    importedGlossary.entries.forEach((entry) => {
      const termLower = entry.term.toLowerCase();
      if (existingTerms.has(termLower)) {
        // Mise à jour de l'entrée existante
        const index = existingGlossary.entries.findIndex(
          (e) => e.term.toLowerCase() === termLower
        );
        existingGlossary.entries[index] = {
          ...existingGlossary.entries[index],
          ...entry,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        // Ajout de la nouvelle entrée
        existingGlossary.entries.push({
          ...entry,
          lastUpdated: entry.lastUpdated || new Date().toISOString(),
        });
      }
    });

    // Tri par terme
    existingGlossary.entries.sort((a, b) =>
      a.term.localeCompare(b.term)
    );

    fs.writeFileSync(
      targetPath,
      JSON.stringify(existingGlossary, null, 2),
      'utf-8'
    );
    console.log(
      `✅ Glossaire fusionné : ${importedGlossary.entries.length} entrées importées dans ${targetPath}`
    );
  } else {
    // Remplacement complet
    importedGlossary.metadata.lastUpdated = new Date().toISOString();
    fs.writeFileSync(
      targetPath,
      JSON.stringify(importedGlossary, null, 2),
      'utf-8'
    );
    console.log(
      `✅ Glossaire importé : ${importedGlossary.entries.length} entrées dans ${targetPath}`
    );
  }
}

/**
 * Affiche les statistiques d'un glossaire
 */
function showStats(glossaryPath) {
  if (!fs.existsSync(glossaryPath)) {
    throw new Error(`❌ Le fichier ${glossaryPath} n'existe pas`);
  }

  const content = fs.readFileSync(glossaryPath, 'utf-8');
  const glossary = JSON.parse(content);

  const categories = new Set(
    glossary.entries
      .map((e) => e.category)
      .filter((c) => c !== undefined)
  );

  const tags = new Set(
    glossary.entries.flatMap((e) => e.tags || [])
  );

  console.log('\n📊 Statistiques du glossaire :');
  console.log(`   Nom : ${glossary.metadata.name}`);
  console.log(`   Description : ${glossary.metadata.description}`);
  console.log(`   Version : ${glossary.metadata.version}`);
  console.log(`   Dernière mise à jour : ${glossary.metadata.lastUpdated}`);
  console.log(`   Nombre d'entrées : ${glossary.entries.length}`);
  console.log(`   Catégories : ${categories.size}`);
  console.log(`   Tags uniques : ${tags.size}`);
  console.log('');
}

/**
 * Convertit un glossaire du format template vers le format programme
 */
function convertToProgramFormat(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`❌ Le fichier ${inputPath} n'existe pas`);
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const templateGlossary = JSON.parse(content);

  if (!templateGlossary.metadata || !templateGlossary.entries) {
    throw new Error('❌ Format de glossaire invalide. Structure attendue : { metadata, entries }');
  }

  const programGlossary = {
    metadata: {
      title: templateGlossary.metadata.name || 'Glossaire',
      description: templateGlossary.metadata.description || '',
      version: templateGlossary.metadata.version || '1.0.0',
      created_at: templateGlossary.metadata.createdAt || new Date().toISOString(),
      updated_at: templateGlossary.metadata.lastUpdated || new Date().toISOString(),
    },
    categories: [],
    terms: templateGlossary.entries.map((entry, index) => {
      const termId = entry.term.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return {
        id: termId || `term-${index}`,
        word: entry.term,
        explanation: entry.definition,
        example: entry.examples && entry.examples.length > 0 ? entry.examples[0] : '',
        category_id: entry.category ? entry.category.toLowerCase().replace(/\s+/g, '-') : undefined,
        tags: entry.tags || [],
        related_terms: entry.relatedTerms || [],
        language: templateGlossary.metadata.language || 'fr',
        difficulty: 'beginner', // Par défaut
      };
    }),
  };

  // Créer les catégories uniques
  const categoryMap = new Map();
  programGlossary.terms.forEach((term) => {
    if (term.category_id && !categoryMap.has(term.category_id)) {
      categoryMap.set(term.category_id, {
        id: term.category_id,
        name: term.category_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: '',
      });
    }
  });
  programGlossary.categories = Array.from(categoryMap.values());

  const targetPath = outputPath || inputPath.replace('.json', '-program.json');
  fs.writeFileSync(targetPath, JSON.stringify(programGlossary, null, 2), 'utf-8');
  console.log(`✅ Glossaire converti vers format programme : ${targetPath}`);
  console.log(`   ${programGlossary.terms.length} termes, ${programGlossary.categories.length} catégories`);
}

/**
 * Convertit un glossaire du format programme vers le format template
 */
function convertToTemplateFormat(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`❌ Le fichier ${inputPath} n'existe pas`);
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const programGlossary = JSON.parse(content);

  if (!programGlossary.metadata || !programGlossary.terms) {
    throw new Error('❌ Format de glossaire invalide. Structure attendue : { metadata, terms }');
  }

  const templateGlossary = {
    metadata: {
      name: programGlossary.metadata.title || 'Glossaire',
      description: programGlossary.metadata.description || '',
      version: programGlossary.metadata.version || '1.0.0',
      language: 'fr',
      createdAt: programGlossary.metadata.created_at || new Date().toISOString(),
      lastUpdated: programGlossary.metadata.updated_at || new Date().toISOString(),
    },
    entries: programGlossary.terms.map((term) => {
      const category = programGlossary.categories?.find(c => c.id === term.category_id);
      return {
        term: term.word,
        definition: term.explanation,
        category: category ? category.name : undefined,
        tags: term.tags || [],
        examples: term.example ? [term.example] : [],
        relatedTerms: term.related_terms || [],
        source: '',
        lastUpdated: new Date().toISOString(),
      };
    }),
  };

  const targetPath = outputPath || inputPath.replace('.json', '-template.json');
  fs.writeFileSync(targetPath, JSON.stringify(templateGlossary, null, 2), 'utf-8');
  console.log(`✅ Glossaire converti vers format template : ${targetPath}`);
  console.log(`   ${templateGlossary.entries.length} entrées`);
}

/**
 * Extrait un glossaire depuis un fichier de cours JSON
 */
function extractFromCourse(coursePath, outputPath) {
  if (!fs.existsSync(coursePath)) {
    throw new Error(`❌ Le fichier ${coursePath} n'existe pas`);
  }

  const content = fs.readFileSync(coursePath, 'utf-8');
  let course;
  try {
    course = JSON.parse(content);
  } catch (error) {
    throw new Error(`❌ Erreur de parsing JSON : ${error.message}`);
  }

  // Extraire les termes techniques potentiels du contenu
  const terms = new Map();
  const extractTermsFromContent = (obj, depth = 0) => {
    if (depth > 10) return; // Limite de profondeur pour éviter les boucles infinies
    
    if (typeof obj === 'string') {
      // Détecter les termes techniques (mots en majuscules, acronymes, mots techniques)
      const technicalTerms = obj.match(/\b([A-Z]{2,}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
      if (technicalTerms) {
        technicalTerms.forEach(term => {
          const cleanTerm = term.trim();
          if (cleanTerm.length > 2 && !terms.has(cleanTerm)) {
            terms.set(cleanTerm, {
              term: cleanTerm,
              definition: `Terme extrait du cours : ${course.title || 'Cours'}`,
              category: 'Extrait du cours',
              tags: ['auto-extracted'],
              examples: [],
              relatedTerms: [],
              source: coursePath,
              lastUpdated: new Date().toISOString(),
            });
          }
        });
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(item => extractTermsFromContent(item, depth + 1));
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => extractTermsFromContent(value, depth + 1));
    }
  };

  // Extraire depuis le titre et la description
  if (course.title) extractTermsFromContent(course.title);
  if (course.description) extractTermsFromContent(course.description);

  // Extraire depuis les modules
  if (course.modules && Array.isArray(course.modules)) {
    course.modules.forEach(module => {
      if (module.title) extractTermsFromContent(module.title);
      if (module.items && Array.isArray(module.items)) {
        module.items.forEach(item => {
          if (item.title) extractTermsFromContent(item.title);
          if (item.content) extractTermsFromContent(item.content);
        });
      }
    });
  }

  const glossary = {
    metadata: {
      name: `Glossaire - ${course.title || 'Cours'}`,
      description: `Glossaire extrait automatiquement depuis le cours : ${course.title || 'Cours'}`,
      version: '1.0.0',
      language: 'fr',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    },
    entries: Array.from(terms.values()).sort((a, b) => a.term.localeCompare(b.term)),
  };

  const targetPath = outputPath || coursePath.replace('.json', '-glossaire.json');
  fs.writeFileSync(targetPath, JSON.stringify(glossary, null, 2), 'utf-8');
  console.log(`✅ Glossaire extrait depuis le cours : ${targetPath}`);
  console.log(`   ${glossary.entries.length} termes extraits`);
  console.log(`   ⚠️  Les définitions sont à compléter manuellement`);
}

/**
 * Affiche l'aide
 */
function showHelp() {
  console.log(`
📚 Gestionnaire de Glossaire

Usage:
  node glossaire-manager.js <command> [options]

Commandes:
  export [output]              Exporte un template de glossaire vide
                               Ex: node glossaire-manager.js export glossaire-nouveau.json

  import <input> [output]       Importe un glossaire depuis un fichier
                               Ex: node glossaire-manager.js import glossaire.json

  merge <input> <output>       Fusionne un glossaire avec un existant
                               Ex: node glossaire-manager.js merge nouveau.json existant.json

  stats <glossary>             Affiche les statistiques d'un glossaire
                               Ex: node glossaire-manager.js stats glossaire.json

  convert-program <input> [output]  Convertit un glossaire template vers format programme
                               Ex: node glossaire-manager.js convert-program template.json

  convert-template <input> [output] Convertit un glossaire programme vers format template
                               Ex: node glossaire-manager.js convert-template programme.json

  extract-course <course> [output] Extrait un glossaire depuis un fichier de cours JSON
                               Ex: node glossaire-manager.js extract-course course.json

  help                         Affiche cette aide

Exemples:
  # Exporter un template
  node glossaire-manager.js export

  # Importer un glossaire
  node glossaire-manager.js import mon-glossaire.json

  # Fusionner deux glossaires
  node glossaire-manager.js merge nouveau.json existant.json

  # Voir les stats
  node glossaire-manager.js stats glossaire-python-complet.json

  # Extraire un glossaire depuis un cours
  node glossaire-manager.js extract-course portal-formations/course-exchange-partie2-prerequis.json

  # Convertir vers format programme
  node glossaire-manager.js convert-program glossaire-template.json glossaire-programme.json
`);
}

// Point d'entrée principal
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'export':
        const outputPath = args[1] || 'glossaire-template.json';
        exportTemplate(outputPath);
        break;

      case 'import':
        if (!args[1]) {
          console.error('❌ Usage: import <input> [output]');
          process.exit(1);
        }
        importGlossary(args[1], args[2], false);
        break;

      case 'merge':
        if (!args[1] || !args[2]) {
          console.error('❌ Usage: merge <input> <output>');
          process.exit(1);
        }
        importGlossary(args[1], args[2], true);
        break;

      case 'stats':
        if (!args[1]) {
          console.error('❌ Usage: stats <glossary>');
          process.exit(1);
        }
        showStats(args[1]);
        break;

      case 'convert-program':
        if (!args[1]) {
          console.error('❌ Usage: convert-program <input> [output]');
          process.exit(1);
        }
        convertToProgramFormat(args[1], args[2]);
        break;

      case 'convert-template':
        if (!args[1]) {
          console.error('❌ Usage: convert-template <input> [output]');
          process.exit(1);
        }
        convertToTemplateFormat(args[1], args[2]);
        break;

      case 'extract-course':
        if (!args[1]) {
          console.error('❌ Usage: extract-course <course> [output]');
          process.exit(1);
        }
        extractFromCourse(args[1], args[2]);
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.error(`❌ Commande inconnue: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  exportTemplate, 
  importGlossary, 
  showStats,
  convertToProgramFormat,
  convertToTemplateFormat,
  extractFromCourse
};
