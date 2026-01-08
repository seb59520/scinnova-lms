#!/usr/bin/env node

/**
 * Script pour corriger les types undefined dans le fichier JSON
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'lms-titanic-big-data.json');

console.log('🔍 Vérification et correction du fichier JSON...\n');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  let json = JSON.parse(content);
  
  let fixed = false;
  let issues = [];
  
  // Parcourir tous les modules et items
  if (json.modules && Array.isArray(json.modules)) {
    json.modules.forEach((module, mi) => {
      if (module.items && Array.isArray(module.items)) {
        module.items.forEach((item, ii) => {
          // Vérifier si le type est manquant ou invalide
          if (!item.type) {
            issues.push(`Module ${mi+1}, Item ${ii+1} (${item.title || 'Sans titre'}): type manquant`);
            // Définir un type par défaut basé sur le titre ou la structure
            if (item.title && item.title.toLowerCase().includes('tp')) {
              item.type = 'tp';
            } else if (item.content?.instructions) {
              item.type = 'tp';
            } else if (item.content?.question) {
              item.type = 'exercise';
            } else {
              item.type = 'resource';
            }
            fixed = true;
          } else if (item.type === 'undefined' || item.type === 'null' || item.type === undefined || item.type === null) {
            issues.push(`Module ${mi+1}, Item ${ii+1} (${item.title || 'Sans titre'}): type invalide "${item.type}"`);
            // Corriger le type
            if (item.title && item.title.toLowerCase().includes('tp')) {
              item.type = 'tp';
            } else if (item.content?.instructions) {
              item.type = 'tp';
            } else if (item.content?.question) {
              item.type = 'exercise';
            } else {
              item.type = 'resource';
            }
            fixed = true;
          } else if (typeof item.type !== 'string') {
            issues.push(`Module ${mi+1}, Item ${ii+1} (${item.title || 'Sans titre'}): type n'est pas une string (${typeof item.type})`);
            // Convertir en string
            item.type = String(item.type).toLowerCase();
            fixed = true;
          } else {
            // Normaliser le type (minuscules, sans espaces)
            const normalized = item.type.toLowerCase().trim();
            if (normalized !== item.type) {
              issues.push(`Module ${mi+1}, Item ${ii+1} (${item.title || 'Sans titre'}): type normalisé "${item.type}" → "${normalized}"`);
              item.type = normalized;
              fixed = true;
            }
          }
          
          // Valider que le type est dans la liste des types valides
          const validTypes = ['resource', 'slide', 'exercise', 'activity', 'tp', 'game'];
          if (!validTypes.includes(item.type)) {
            issues.push(`Module ${mi+1}, Item ${ii+1} (${item.title || 'Sans titre'}): type "${item.type}" n'est pas valide`);
            // Essayer de mapper vers un type valide
            const typeMap = {
              'resources': 'resource',
              'slides': 'slide',
              'exercises': 'exercise',
              'exercice': 'exercise',
              'travaux-pratiques': 'tp',
              'travaux pratiques': 'tp',
              'games': 'game',
              'jeu': 'game',
              'jeux': 'game'
            };
            if (typeMap[item.type]) {
              item.type = typeMap[item.type];
              fixed = true;
            } else {
              // Type par défaut
              item.type = 'resource';
              fixed = true;
            }
          }
        });
      }
    });
  }
  
  if (issues.length > 0) {
    console.log('⚠️  Problèmes trouvés et corrigés:\n');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  }
  
  if (fixed) {
    // Sauvegarder le fichier corrigé
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content, 'utf8');
    console.log(`✅ Sauvegarde créée: ${backupPath}`);
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`✅ Fichier corrigé: ${filePath}\n`);
  } else {
    console.log('✅ Aucun problème trouvé dans le fichier JSON.\n');
  }
  
  // Afficher un résumé
  console.log('📊 Résumé des types trouvés:');
  const typeCounts = {};
  json.modules.forEach(module => {
    if (module.items) {
      module.items.forEach(item => {
        typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
      });
    }
  });
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count} item(s)`);
  });
  
  console.log('\n✅ Validation terminée !');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  if (error instanceof SyntaxError) {
    console.error('   Le fichier JSON est invalide.');
  }
  process.exit(1);
}
