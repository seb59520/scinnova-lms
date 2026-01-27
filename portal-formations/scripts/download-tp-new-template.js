#!/usr/bin/env node

/**
 * Copie le modèle TPNew dans le répertoire courant.
 * Usage: node scripts/download-tp-new-template.js
 */

const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../public/tp-new-template.json');
const outputPath = path.join(process.cwd(), 'tp-new-template.json');

try {
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Le fichier modèle n\'existe pas:', templatePath);
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  fs.writeFileSync(outputPath, template, 'utf-8');

  console.log('✅ Modèle TPNew copié avec succès !');
  console.log(`📄 Fichier créé: ${outputPath}`);
  console.log('\n💡 Ce JSON est à coller dans le champ content d\'un item de type "tp".');
  console.log('   Voir GUIDE-TP-NEW.md pour la structure et l\'import par matrice (CSV).');
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
