#!/usr/bin/env node

/**
 * Script pour ajouter le pas à pas détaillé au fichier JSON du LMS
 * 
 * Usage: node ajouter-pas-a-pas-au-lms.js
 * 
 * Ce script lit PAS_A_PAS_DETAILLE_LMS.json et l'ajoute comme nouvel item
 * dans le Module 2 du fichier tp-openapi-swagger-lms.json
 */

const fs = require('fs');
const path = require('path');

// Charger les fichiers
const pasAPasPath = path.join(__dirname, 'PAS_A_PAS_DETAILLE_LMS.json');
const lmsJsonPath = path.join(__dirname, 'tp-openapi-swagger-lms.json');

console.log('📖 Chargement des fichiers...');

const pasAPas = JSON.parse(fs.readFileSync(pasAPasPath, 'utf8'));
const lmsJson = JSON.parse(fs.readFileSync(lmsJsonPath, 'utf8'));

// Trouver le Module 2 (TP pratique)
const module2 = lmsJson.modules.find(m => m.title.includes('Module 2') || m.title.includes('TP pratique'));

if (!module2) {
  console.error('❌ Module 2 non trouvé dans le JSON du LMS');
  process.exit(1);
}

// Vérifier si l'item existe déjà
const existingItem = module2.items.find(item => 
  item.title.includes('Pas à pas détaillé') || 
  item.title.includes('Instructions complètes')
);

if (existingItem) {
  console.log('⚠️  Un item "Pas à pas détaillé" existe déjà. Mise à jour...');
  existingItem.content.body = pasAPas;
} else {
  console.log('➕ Ajout du nouvel item "Pas à pas détaillé"...');
  
  // Trouver la position maximale dans le module
  const maxPosition = Math.max(...module2.items.map(i => i.position || 0), 0);
  
  // Créer le nouvel item
  const nouvelItem = {
    type: 'resource',
    title: 'Pas à pas détaillé - Instructions complètes',
    position: maxPosition + 1,
    published: true,
    content: {
      body: pasAPas
    }
  };
  
  module2.items.push(nouvelItem);
}

// Sauvegarder le fichier modifié
const outputPath = path.join(__dirname, 'tp-openapi-swagger-lms-avec-pas-a-pas.json');
fs.writeFileSync(outputPath, JSON.stringify(lmsJson, null, 2), 'utf8');

console.log('✅ Fichier mis à jour :', outputPath);
console.log('');
console.log('📝 Prochaines étapes :');
console.log('   1. Vérifiez le fichier tp-openapi-swagger-lms-avec-pas-a-pas.json');
console.log('   2. Si tout est correct, remplacez tp-openapi-swagger-lms.json par ce fichier');
console.log('   3. Importez le JSON dans votre LMS via l\'interface admin');

