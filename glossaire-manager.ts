#!/usr/bin/env ts-node

/**
 * Gestionnaire de templates de glossaire
 * Permet d'exporter, importer et mettre à jour des glossaires
 */

import * as fs from 'fs';
import * as path from 'path';

interface GlossaryEntry {
  term: string;
  definition: string;
  category?: string;
  tags?: string[];
  examples?: string[];
  relatedTerms?: string[];
  source?: string;
  lastUpdated?: string;
}

interface GlossaryTemplate {
  metadata: {
    name: string;
    description: string;
    version: string;
    language?: string;
    createdAt: string;
    lastUpdated: string;
  };
  entries: GlossaryEntry[];
}

/**
 * Exporte un template de glossaire vide
 */
function exportTemplate(outputPath: string = 'glossaire-template.json'): void {
  const template: GlossaryTemplate = {
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
function importGlossary(
  inputPath: string,
  outputPath?: string,
  merge: boolean = false
): void {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`❌ Le fichier ${inputPath} n'existe pas`);
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  let importedGlossary: GlossaryTemplate;

  try {
    importedGlossary = JSON.parse(content);
  } catch (error) {
    throw new Error(`❌ Erreur de parsing JSON : ${error}`);
  }

  // Validation basique
  if (!importedGlossary.metadata || !importedGlossary.entries) {
    throw new Error('❌ Format de glossaire invalide. Structure attendue : { metadata, entries }');
  }

  const targetPath = outputPath || inputPath;

  if (merge && fs.existsSync(targetPath)) {
    // Fusion avec le glossaire existant
    const existingContent = fs.readFileSync(targetPath, 'utf-8');
    const existingGlossary: GlossaryTemplate = JSON.parse(existingContent);

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
 * Met à jour un glossaire existant
 */
function updateGlossary(
  glossaryPath: string,
  updates: {
    metadata?: Partial<GlossaryTemplate['metadata']>;
    entries?: GlossaryEntry[];
  }
): void {
  if (!fs.existsSync(glossaryPath)) {
    throw new Error(`❌ Le fichier ${glossaryPath} n'existe pas`);
  }

  const content = fs.readFileSync(glossaryPath, 'utf-8');
  const glossary: GlossaryTemplate = JSON.parse(content);

  // Mise à jour des métadonnées
  if (updates.metadata) {
    glossary.metadata = {
      ...glossary.metadata,
      ...updates.metadata,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Mise à jour des entrées
  if (updates.entries) {
    updates.entries.forEach((newEntry) => {
      const index = glossary.entries.findIndex(
        (e) => e.term.toLowerCase() === newEntry.term.toLowerCase()
      );

      if (index >= 0) {
        // Mise à jour de l'entrée existante
        glossary.entries[index] = {
          ...glossary.entries[index],
          ...newEntry,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        // Ajout de la nouvelle entrée
        glossary.entries.push({
          ...newEntry,
          lastUpdated: new Date().toISOString(),
        });
      }
    });

    // Tri par terme
    glossary.entries.sort((a, b) => a.term.localeCompare(b.term));
  }

  glossary.metadata.lastUpdated = new Date().toISOString();

  fs.writeFileSync(glossaryPath, JSON.stringify(glossary, null, 2), 'utf-8');
  console.log(`✅ Glossaire mis à jour : ${glossaryPath}`);
}

/**
 * Affiche les statistiques d'un glossaire
 */
function showStats(glossaryPath: string): void {
  if (!fs.existsSync(glossaryPath)) {
    throw new Error(`❌ Le fichier ${glossaryPath} n'existe pas`);
  }

  const content = fs.readFileSync(glossaryPath, 'utf-8');
  const glossary: GlossaryTemplate = JSON.parse(content);

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
 * Affiche l'aide
 */
function showHelp(): void {
  console.log(`
📚 Gestionnaire de Glossaire

Usage:
  ts-node glossaire-manager.ts <command> [options]

Commandes:
  export [output]              Exporte un template de glossaire vide
                               Ex: ts-node glossaire-manager.ts export glossaire-nouveau.json

  import <input> [output]       Importe un glossaire depuis un fichier
                               Ex: ts-node glossaire-manager.ts import glossaire.json

  merge <input> <output>        Fusionne un glossaire avec un existant
                               Ex: ts-node glossaire-manager.ts merge nouveau.json existant.json

  stats <glossary>             Affiche les statistiques d'un glossaire
                               Ex: ts-node glossaire-manager.ts stats glossaire.json

  help                         Affiche cette aide

Exemples:
  # Exporter un template
  ts-node glossaire-manager.ts export

  # Importer un glossaire
  ts-node glossaire-manager.ts import mon-glossaire.json

  # Fusionner deux glossaires
  ts-node glossaire-manager.ts merge nouveau.json existant.json

  # Voir les stats
  ts-node glossaire-manager.ts stats glossaire-python-complet.json
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
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { exportTemplate, importGlossary, updateGlossary, showStats };
export type { GlossaryEntry, GlossaryTemplate };
