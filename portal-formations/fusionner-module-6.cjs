#!/usr/bin/env node

/**
 * Script pour fusionner le Module 6 avec le cours "Architecture client–serveur et bases du Web"
 * 
 * Usage: node fusionner-module-6.js
 * 
 * Ce script lit architecture-client-serveur-web.json et module-6-client-serveur-api.json
 * et fusionne le Module 6 dans le cours s'il n'existe pas déjà.
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const courseJsonPath = path.join(__dirname, 'architecture-client-serveur-web.json');
const module6JsonPath = path.join(__dirname, 'module-6-client-serveur-api.json');
const outputPath = path.join(__dirname, 'architecture-client-serveur-web-avec-module-6.json');

console.log('📖 Chargement des fichiers...');

// Vérifier que les fichiers existent
if (!fs.existsSync(courseJsonPath)) {
  console.error(`❌ Fichier cours introuvable: ${courseJsonPath}`);
  process.exit(1);
}

if (!fs.existsSync(module6JsonPath)) {
  console.error(`❌ Fichier Module 6 introuvable: ${module6JsonPath}`);
  process.exit(1);
}

// Charger les fichiers JSON
let courseJson, module6;
try {
  courseJson = JSON.parse(fs.readFileSync(courseJsonPath, 'utf8'));
  module6 = JSON.parse(fs.readFileSync(module6JsonPath, 'utf8'));
} catch (error) {
  console.error('❌ Erreur lors de la lecture des fichiers JSON:', error.message);
  process.exit(1);
}

console.log(`✅ Cours chargé: "${courseJson.title}"`);
console.log(`   Modules existants: ${courseJson.modules?.length || 0}`);

// Vérifier que le cours a bien un tableau modules
if (!courseJson.modules) {
  console.log('⚠️  Aucun module trouvé, création du tableau modules...');
  courseJson.modules = [];
}

// Vérifier si le Module 6 existe déjà
const module6Index = courseJson.modules.findIndex(module => 
  module.title && (
    module.title.includes('Module 6') || 
    module.title.includes('Du client-serveur aux API')
  )
);

const module6Exists = module6Index !== -1;

if (module6Exists) {
  console.log('⚠️  Le Module 6 existe déjà dans le cours.');
  console.log(`   Module trouvé: "${courseJson.modules[module6Index].title}"`);
  
  // Remplacer automatiquement le Module 6 existant
  console.log('🔄 Remplacement du Module 6 existant...');
  courseJson.modules[module6Index] = module6;
  console.log('✅ Module 6 remplacé.');
} else {
  // Ajouter le Module 6
  console.log('➕ Ajout du Module 6...');
  
  // Vérifier la position maximale
  const maxPosition = courseJson.modules.length > 0 
    ? Math.max(...courseJson.modules.map(m => m.position || 0), 0)
    : 0;
  
  // S'assurer que le Module 6 a la bonne position
  if (maxPosition < 6) {
    module6.position = 6;
  } else {
    module6.position = maxPosition + 1;
  }
  
  courseJson.modules.push(module6);
  console.log(`✅ Module 6 ajouté en position ${module6.position}`);
}

saveAndExit();

function saveAndExit() {
  // Trier les modules par position
  courseJson.modules.sort((a, b) => (a.position || 0) - (b.position || 0));
  
  // Réajuster les positions pour être sûr qu'elles sont séquentielles
  courseJson.modules.forEach((module, index) => {
    module.position = index + 1;
  });
  
  // Sauvegarder le fichier
  try {
    fs.writeFileSync(outputPath, JSON.stringify(courseJson, null, 2), 'utf8');
    console.log(`\n✅ Fichier fusionné sauvegardé: ${outputPath}`);
    console.log(`   Total modules: ${courseJson.modules.length}`);
    console.log(`\n📋 Prochaines étapes:`);
    console.log(`   1. Vérifiez le fichier: ${outputPath}`);
    console.log(`   2. Importez-le dans l'interface admin: /admin/courses/{courseId}/json`);
    console.log(`   3. Cliquez sur "Importer JSON" et sélectionnez le fichier`);
    console.log(`   4. Cliquez sur "Sauvegarder"`);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error.message);
    process.exit(1);
  }
}

