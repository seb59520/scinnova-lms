#!/usr/bin/env node

/**
 * Script pour valider et corriger le fichier JSON pour l'importation dans Portal Formation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'lms-titanic-big-data.json');

console.log('🔍 Validation et correction du fichier JSON pour Portal Formation...\n');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  let json = JSON.parse(content);
  
  let fixed = false;
  let issues = [];
  const validTypes = ['resource', 'slide', 'exercise', 'activity', 'tp', 'game'];
  
  // Validation de la structure de base
  if (!json.title) {
    issues.push('❌ Le champ "title" est manquant au niveau racine');
    json.title = 'Cours sans titre';
    fixed = true;
  }
  
  if (!json.description) {
    issues.push('⚠️  Le champ "description" est manquant');
    json.description = '';
    fixed = true;
  }
  
  if (!json.status || !['draft', 'published'].includes(json.status)) {
    issues.push(`⚠️  Le champ "status" est invalide: "${json.status}"`);
    json.status = 'published';
    fixed = true;
  }
  
  if (!json.access_type || !['free', 'paid', 'invite'].includes(json.access_type)) {
    issues.push(`⚠️  Le champ "access_type" est invalide: "${json.access_type}"`);
    json.access_type = 'free';
    fixed = true;
  }
  
  // Validation des modules
  if (!json.modules || !Array.isArray(json.modules)) {
    issues.push('❌ Le champ "modules" est manquant ou n\'est pas un tableau');
    json.modules = [];
    fixed = true;
  }
  
  json.modules.forEach((module, mi) => {
    if (!module.title) {
      issues.push(`Module ${mi+1}: le champ "title" est manquant`);
      module.title = `Module ${mi+1}`;
      fixed = true;
    }
    
    if (typeof module.position !== 'number') {
      issues.push(`Module ${mi+1}: le champ "position" doit être un nombre`);
      module.position = mi;
      fixed = true;
    }
    
    // Validation des items
    if (!module.items || !Array.isArray(module.items)) {
      issues.push(`Module ${mi+1}: le champ "items" est manquant ou n'est pas un tableau`);
      module.items = [];
      fixed = true;
      return;
    }
    
    module.items.forEach((item, ii) => {
      const itemPath = `Module ${mi+1}, Item ${ii+1} (${item.title || 'Sans titre'})`;
      
      // Vérifier que l'item existe
      if (!item || typeof item !== 'object') {
        issues.push(`${itemPath}: item est null ou n'est pas un objet`);
        return;
      }
      
      // Vérifier le type
      if (!('type' in item)) {
        issues.push(`${itemPath}: la propriété "type" est manquante`);
        // Essayer de deviner le type
        if (item.title && (item.title.toLowerCase().includes('tp') || item.title.toLowerCase().includes('travaux'))) {
          item.type = 'tp';
        } else if (item.content?.instructions) {
          item.type = 'tp';
        } else if (item.content?.question) {
          item.type = 'exercise';
        } else {
          item.type = 'resource';
        }
        fixed = true;
      } else if (item.type === undefined || item.type === null) {
        issues.push(`${itemPath}: la propriété "type" est undefined ou null`);
        item.type = 'resource';
        fixed = true;
      } else if (item.type === 'undefined' || item.type === 'null') {
        issues.push(`${itemPath}: la propriété "type" est la chaîne "${item.type}"`);
        item.type = 'resource';
        fixed = true;
      } else if (typeof item.type !== 'string') {
        issues.push(`${itemPath}: la propriété "type" n'est pas une chaîne (${typeof item.type})`);
        item.type = String(item.type).toLowerCase().trim();
        fixed = true;
      } else {
        // Normaliser le type
        const normalized = item.type.toLowerCase().trim();
        if (normalized !== item.type) {
          issues.push(`${itemPath}: type normalisé "${item.type}" → "${normalized}"`);
          item.type = normalized;
          fixed = true;
        }
        
        // Vérifier que le type est valide
        if (!validTypes.includes(item.type)) {
          issues.push(`${itemPath}: type invalide "${item.type}"`);
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
            item.type = 'resource';
            fixed = true;
          }
        }
      }
      
      // Vérifier le title
      if (!item.title || typeof item.title !== 'string') {
        issues.push(`${itemPath}: le champ "title" est manquant ou invalide`);
        item.title = `Item ${ii+1}`;
        fixed = true;
      }
      
      // Vérifier la position
      if (typeof item.position !== 'number') {
        issues.push(`${itemPath}: le champ "position" doit être un nombre`);
        item.position = ii;
        fixed = true;
      }
      
      // Vérifier le content
      if (!item.content || typeof item.content !== 'object') {
        issues.push(`${itemPath}: le champ "content" est manquant ou invalide`);
        item.content = {};
        fixed = true;
      }
      
      // Vérifier published
      if (item.published === undefined) {
        item.published = true;
        fixed = true;
      }
    });
  });
  
  // Afficher les problèmes trouvés
  if (issues.length > 0) {
    console.log('⚠️  Problèmes trouvés:\n');
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log('');
  } else {
    console.log('✅ Aucun problème structurel trouvé.\n');
  }
  
  // Afficher un résumé
  console.log('📊 Résumé:');
  console.log(`  - Titre: ${json.title}`);
  console.log(`  - Modules: ${json.modules.length}`);
  const totalItems = json.modules.reduce((sum, m) => sum + (m.items?.length || 0), 0);
  console.log(`  - Items totaux: ${totalItems}`);
  
  const typeCounts = {};
  json.modules.forEach(module => {
    if (module.items) {
      module.items.forEach(item => {
        typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
      });
    }
  });
  console.log('  - Types d\'items:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`    • ${type}: ${count}`);
  });
  
  // Sauvegarder si des corrections ont été faites
  if (fixed) {
    const backupPath = filePath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, content, 'utf8');
    console.log(`\n✅ Sauvegarde créée: ${backupPath}`);
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`✅ Fichier corrigé: ${filePath}\n`);
  } else {
    console.log('\n✅ Le fichier est valide et prêt à être importé !\n');
  }
  
  // Vérification finale
  console.log('🔍 Vérification finale de la structure...');
  let finalErrors = [];
  
  json.modules.forEach((module, mi) => {
    if (module.items) {
      module.items.forEach((item, ii) => {
        if (!item.type || !validTypes.includes(item.type)) {
          finalErrors.push(`Module ${mi+1}, Item ${ii+1}: type invalide "${item.type}"`);
        }
        if (!item.title) {
          finalErrors.push(`Module ${mi+1}, Item ${ii+1}: title manquant`);
        }
        if (typeof item.position !== 'number') {
          finalErrors.push(`Module ${mi+1}, Item ${ii+1}: position invalide`);
        }
        if (!item.content || typeof item.content !== 'object') {
          finalErrors.push(`Module ${mi+1}, Item ${ii+1}: content manquant ou invalide`);
        }
      });
    }
  });
  
  if (finalErrors.length > 0) {
    console.log('❌ Erreurs restantes après correction:');
    finalErrors.forEach(err => console.log(`  - ${err}`));
    process.exit(1);
  } else {
    console.log('✅ Tous les items sont valides !\n');
    console.log('📝 Instructions pour l\'importation:');
    console.log('   1. Allez dans Portal Formation → Administration → Cours');
    console.log('   2. Créez un nouveau cours ou éditez un cours existant');
    console.log('   3. Cliquez sur "Mode JSON" ou "Éditer en JSON"');
    console.log('   4. Collez le contenu du fichier JSON');
    console.log('   5. Cliquez sur "Sauvegarder"');
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  if (error instanceof SyntaxError) {
    console.error('   Le fichier JSON est invalide.');
    console.error('   Vérifiez la syntaxe JSON (guillemets, virgules, etc.)');
  }
  process.exit(1);
}
