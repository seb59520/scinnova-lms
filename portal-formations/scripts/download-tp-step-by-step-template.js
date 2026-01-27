#!/usr/bin/env node

/**
 * Script pour télécharger le modèle de TP pas à pas
 * Usage: node scripts/download-tp-step-by-step-template.js
 */

const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../public/tp-step-by-step-template.json');
const outputPath = path.join(process.cwd(), 'tp-step-by-step-template.json');

try {
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Le fichier modèle n\'existe pas:', templatePath);
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  fs.writeFileSync(outputPath, template, 'utf-8');

  console.log('✅ Modèle téléchargé avec succès !');
  console.log(`📄 Fichier créé: ${outputPath}`);
  console.log('\n💡 Vous pouvez maintenant:');
  console.log('   1. Modifier le fichier selon vos besoins');
  console.log('   2. L\'importer dans votre cours via l\'interface d\'administration');
  console.log('   3. Créer un item de type "tp" avec ce contenu JSON');
} catch (error) {
  console.error('❌ Erreur lors du téléchargement:', error.message);
  process.exit(1);
}
