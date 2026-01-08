#!/usr/bin/env node

/**
 * Script de validation des fichiers JSON pour l'importation dans le LMS
 * Usage: node validate-json.js <fichier.json>
 */

const fs = require('fs');
const path = require('path');

const validTypes = ['resource', 'slide', 'exercise', 'activity', 'tp', 'game'];

function validateJsonFile(filePath) {
  console.log(`\n🔍 Validation de: ${filePath}\n`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    const errors = [];
    const warnings = [];
    
    // Validation de base
    if (!data.title) {
      errors.push('❌ Le champ "title" est requis au niveau racine');
    }
    
    if (!data.modules || !Array.isArray(data.modules)) {
      errors.push('❌ Le champ "modules" doit être un tableau');
      return { valid: false, errors, warnings };
    }
    
    if (data.modules.length === 0) {
      warnings.push('⚠️  Aucun module défini');
    }
    
    // Validation des modules et items
    data.modules.forEach((module, moduleIndex) => {
      if (!module.title) {
        errors.push(`❌ Module ${moduleIndex + 1}: le champ "title" est requis`);
      }
      
      if (typeof module.position !== 'number') {
        errors.push(`❌ Module ${moduleIndex + 1}: le champ "position" doit être un nombre`);
      }
      
      if (!module.items || !Array.isArray(module.items)) {
        errors.push(`❌ Module ${moduleIndex + 1}: le champ "items" doit être un tableau`);
        return;
      }
      
      if (module.items.length === 0) {
        warnings.push(`⚠️  Module ${moduleIndex + 1} ("${module.title}"): aucun item défini`);
      }
      
      module.items.forEach((item, itemIndex) => {
        if (!item) {
          errors.push(`❌ Module ${moduleIndex + 1}, Item ${itemIndex + 1}: item est null ou undefined`);
          return;
        }
        
        // Validation du type
        if (!item.hasOwnProperty('type')) {
          errors.push(`❌ Module ${moduleIndex + 1}, Item ${itemIndex + 1} ("${item.title || 'Sans titre'}"): propriété "type" manquante`);
        } else if (item.type === undefined || item.type === null) {
          errors.push(`❌ Module ${moduleIndex + 1}, Item ${itemIndex + 1} ("${item.title || 'Sans titre'}"): type est undefined ou null`);
        } else if (typeof item.type !== 'string') {
          errors.push(`❌ Module ${moduleIndex + 1}, Item ${itemIndex + 1} ("${item.title || 'Sans titre'}"): type doit être une chaîne, reçu: ${typeof item.type}`);
        } else if (!validTypes.includes(item.type)) {
          errors.push(`❌ Module ${moduleIndex + 1}, Item ${itemIndex + 1} ("${item.title || 'Sans titre'}"): type invalide "${item.type}". Types valides: ${validTypes.join(', ')}`);
        }
        
        // Validation du title
        if (!item.title || typeof item.title !== 'string') {
          errors.push(`❌ Module ${moduleIndex + 1}, Item ${itemIndex + 1}: le champ "title" est requis et doit être une chaîne`);
        }
        
        // Validation de la position
        if (typeof item.position !== 'number') {
          errors.push(`❌ Module ${moduleIndex + 1}, Item ${itemIndex + 1} ("${item.title || 'Sans titre'}"): le champ "position" doit être un nombre`);
        }
        
        // Validation du content
        if (!item.content || typeof item.content !== 'object') {
          warnings.push(`⚠️  Module ${moduleIndex + 1}, Item ${itemIndex + 1} ("${item.title || 'Sans titre'}"): le champ "content" devrait être un objet`);
        }
      });
    });
    
    // Résumé
    console.log('📊 Résumé de la validation:\n');
    
    if (errors.length > 0) {
      console.log('❌ ERREURS TROUVÉES:\n');
      errors.forEach(err => console.log(`  ${err}`));
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  AVERTISSEMENTS:\n');
      warnings.forEach(warn => console.log(`  ${warn}`));
      console.log('');
    }
    
    if (errors.length === 0) {
      console.log('✅ Le fichier JSON est valide et prêt à être importé dans le LMS !\n');
      return { valid: true, errors: [], warnings };
    } else {
      console.log('❌ Le fichier JSON contient des erreurs. Veuillez les corriger avant l\'importation.\n');
      return { valid: false, errors, warnings };
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la lecture/parsing du fichier:', error.message);
    return { valid: false, errors: [error.message], warnings: [] };
  }
}

// Exécution
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node validate-json.js <fichier.json>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ Fichier non trouvé: ${filePath}`);
  process.exit(1);
}

const result = validateJsonFile(filePath);
process.exit(result.valid ? 0 : 1);
