#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'tp-big-data-data-science-impacts.json');

console.log('🔍 Validation du fichier TP Big Data...\n');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);

  // Vérifier que c'est un cours, pas un item
  if (json.type) {
    console.error('❌ ERREUR: Ce fichier a une propriété "type" au niveau racine.');
    console.error('   Cela signifie qu\'il est traité comme un item individuel, pas comme un cours.');
    console.error('   Un cours ne doit PAS avoir de propriété "type" au niveau racine.');
    process.exit(1);
  }

  if (!json.modules || !Array.isArray(json.modules)) {
    console.error('❌ ERREUR: Le fichier doit avoir une propriété "modules" qui est un tableau.');
    process.exit(1);
  }

  console.log('✓ Structure de cours valide (pas de "type" au niveau racine)');
  console.log(`✓ ${json.modules.length} module(s) trouvé(s)\n`);

  // Valider chaque module et item
  const validTypes = ['resource', 'slide', 'exercise', 'activity', 'tp', 'game'];
  let totalItems = 0;
  let errors = [];

  json.modules.forEach((module, mi) => {
    if (!module.items || !Array.isArray(module.items)) {
      errors.push(`Module ${mi+1} (${module.title}): pas de tableau "items"`);
      return;
    }

    module.items.forEach((item, ii) => {
      totalItems++;
      
      if (!item) {
        errors.push(`Module ${mi+1}, Item ${ii+1}: item est null ou undefined`);
        return;
      }

      if (!item.type) {
        errors.push(`Module ${mi+1}, Item ${ii+1} (${item.title || 'sans titre'}): propriété "type" manquante`);
        return;
      }

      if (!validTypes.includes(item.type)) {
        errors.push(`Module ${mi+1}, Item ${ii+1} (${item.title}): type invalide "${item.type}"`);
        return;
      }

      if (!item.title) {
        errors.push(`Module ${mi+1}, Item ${ii+1}: propriété "title" manquante`);
      }

      if (typeof item.position !== 'number') {
        errors.push(`Module ${mi+1}, Item ${ii+1} (${item.title}): propriété "position" manquante ou invalide`);
      }

      if (!item.content || typeof item.content !== 'object') {
        errors.push(`Module ${mi+1}, Item ${ii+1} (${item.title}): propriété "content" manquante ou invalide`);
      }
    });
  });

  if (errors.length > 0) {
    console.error('❌ ERREURS TROUVÉES:\n');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`✓ ${totalItems} item(s) validé(s) avec succès`);
  console.log('\n✅ Le fichier est valide et prêt à être importé !');
  console.log('\n📝 Instructions:');
  console.log('   1. Allez dans l\'interface d\'administration');
  console.log('   2. Créez un nouveau cours ou éditez un cours existant');
  console.log('   3. Utilisez l\'option "Importer JSON" ou collez le contenu du fichier');
  console.log('   4. Assurez-vous d\'être dans l\'interface COURS, pas ITEM');

} catch (e) {
  console.error('❌ ERREUR:', e.message);
  if (e instanceof SyntaxError) {
    console.error('   Le fichier JSON est invalide.');
  }
  process.exit(1);
}

