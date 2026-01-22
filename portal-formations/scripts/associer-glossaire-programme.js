#!/usr/bin/env node

/**
 * Script pour associer un glossaire JSON à un programme
 * 
 * Usage: node scripts/associer-glossaire-programme.js <programme-id> <fichier-glossaire.json>
 * 
 * Exemple:
 *   node scripts/associer-glossaire-programme.js abc-123 glossaire-python-exemple.json
 */

const fs = require('fs');
const path = require('path');

// Configuration Supabase (à adapter selon votre setup)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies');
  process.exit(1);
}

const programId = process.argv[2];
const glossaryPath = process.argv[3];

if (!programId || !glossaryPath) {
  console.error('❌ Usage: node scripts/associer-glossaire-programme.js <programme-id> <fichier-glossaire.json>');
  process.exit(1);
}

if (!fs.existsSync(glossaryPath)) {
  console.error(`❌ Fichier non trouvé: ${glossaryPath}`);
  process.exit(1);
}

async function associateGlossary() {
  try {
    // Charger le glossaire
    console.log(`📖 Chargement du glossaire: ${glossaryPath}`);
    const glossaryData = fs.readFileSync(glossaryPath, 'utf-8');
    const glossary = JSON.parse(glossaryData);

    // Valider la structure
    if (!glossary.metadata || !glossary.terms) {
      throw new Error('Format de glossaire invalide. Doit contenir metadata et terms.');
    }

    console.log(`✅ Glossaire chargé: ${glossary.metadata.title}`);
    console.log(`   ${glossary.terms.length} terme(s)`);
    if (glossary.categories) {
      console.log(`   ${glossary.categories.length} catégorie(s)`);
    }

    // Mettre à jour le programme via l'API Supabase
    console.log(`\n📤 Association du glossaire au programme ${programId}...`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/programs?id=eq.${programId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        glossary: glossary
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur API: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    if (result.length === 0) {
      throw new Error(`Programme ${programId} non trouvé`);
    }

    console.log(`✅ Glossaire associé avec succès au programme: ${result[0].title}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Alternative: utiliser directement SQL si vous avez accès à Supabase
function generateSQL() {
  try {
    const glossaryData = fs.readFileSync(glossaryPath, 'utf-8');
    const glossary = JSON.parse(glossaryData);
    
    // Échapper les quotes pour SQL
    const glossaryJson = JSON.stringify(glossary).replace(/'/g, "''");
    
    const sql = `-- Associer le glossaire au programme
UPDATE programs
SET glossary = '${glossaryJson}'::jsonb,
    updated_at = NOW()
WHERE id = '${programId}';

-- Vérifier
SELECT id, title, glossary->'metadata'->>'title' as glossary_title, 
       jsonb_array_length(glossary->'terms') as terms_count
FROM programs
WHERE id = '${programId}';`;

    const sqlPath = path.join(path.dirname(glossaryPath), `associer-glossaire-${programId}.sql`);
    fs.writeFileSync(sqlPath, sql, 'utf-8');
    
    console.log(`\n📝 SQL généré: ${sqlPath}`);
    console.log('   Exécutez ce fichier dans l\'interface SQL de Supabase');
    
    return sqlPath;
  } catch (error) {
    console.error('❌ Erreur lors de la génération SQL:', error.message);
    return null;
  }
}

// Exécuter
if (process.argv.includes('--sql')) {
  generateSQL();
} else {
  associateGlossary().catch(console.error);
}
