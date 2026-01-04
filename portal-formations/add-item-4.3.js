#!/usr/bin/env node

/**
 * Script pour ajouter l'item 4.3 (Mini-jeu API Paradigms) au module 4
 * Usage: node add-item-4.3.js <module-id>
 */

require('dotenv').config()

const fs = require('fs')

// Vérifier les variables d'environnement
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ Erreur: Variables d\'environnement Supabase manquantes')
  console.error('   Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies dans .env')
  process.exit(1)
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}${endpoint}`
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }

  return response.json()
}

async function addItem43(moduleId) {
  console.log('📖 Lecture du fichier JSON...')
  
  // Lire le JSON
  const courseJson = JSON.parse(fs.readFileSync('paradigmes-api.json', 'utf8'))
  
  // Trouver le module 4
  const module4 = courseJson.modules.find(m => m.position === 4)
  if (!module4) {
    console.error('❌ Module 4 non trouvé dans le JSON')
    process.exit(1)
  }

  // Trouver l'item 4.3
  const item43 = module4.items.find(i => i.position === 3)
  if (!item43) {
    console.error('❌ Item 4.3 non trouvé dans le JSON')
    process.exit(1)
  }

  console.log(`✅ Item trouvé: "${item43.title}"`)
  console.log(`   Type: ${item43.type}`)
  console.log(`   GameType: ${item43.content?.gameType}`)

  // Vérifier si l'item existe déjà
  const { data: existingItems } = await supabaseRequest(
    `/rest/v1/items?module_id=eq.${moduleId}&position=eq.3&select=id,title`
  )

  if (existingItems && existingItems.length > 0) {
    const existing = existingItems[0]
    console.log(`\n⚠️  Un item existe déjà à la position 3: "${existing.title}" (ID: ${existing.id})`)
    console.log('   Voulez-vous le remplacer ? (y/n)')
    
    // Pour l'automatisation, on peut utiliser un argument --force
    if (process.argv.includes('--force')) {
      console.log('   Mode --force activé, suppression de l\'item existant...')
      await supabaseRequest(`/rest/v1/items?id=eq.${existing.id}`, {
        method: 'DELETE'
      })
      console.log('   ✅ Item existant supprimé')
    } else {
      console.log('   Utilisez --force pour remplacer automatiquement')
      console.log('   Ou supprimez manuellement l\'item existant et relancez le script')
      process.exit(1)
    }
  }

  // Préparer les données de l'item
  const itemData = {
    module_id: moduleId,
    type: item43.type,
    title: item43.title,
    position: item43.position,
    published: item43.published !== false,
    content: item43.content || {},
    asset_path: item43.asset_path || null,
    external_url: item43.external_url || null
  }

  console.log('\n📦 Création de l\'item 4.3...')
  
  try {
    const savedItem = await supabaseRequest('/rest/v1/items', {
      method: 'POST',
      body: JSON.stringify(itemData)
    })

    if (!savedItem?.id) {
      throw new Error('L\'item a été créé mais aucun ID n\'a été retourné')
    }

    console.log(`✅ Item créé avec succès!`)
    console.log(`   ID: ${savedItem.id}`)
    console.log(`   Titre: ${savedItem.title}`)
    console.log(`   Type: ${savedItem.type}`)
    console.log(`   Position: ${savedItem.position}`)
    console.log(`   Publié: ${savedItem.published}`)
    
    console.log(`\n🌐 Vous pouvez maintenant accéder à l'item dans l'application:`)
    console.log(`   /items/${savedItem.id}`)

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'item:', error.message)
    if (error.message.includes('duplicate key')) {
      console.error('   Un item avec cette position existe déjà dans ce module')
    }
    process.exit(1)
  }
}

// Vérifier les arguments
const moduleId = process.argv[2]

if (!moduleId) {
  console.error('❌ Usage: node add-item-4.3.js <module-id> [--force]')
  console.error('')
  console.error('Exemple:')
  console.error('  node add-item-4.3.js abc123-def456-ghi789')
  console.error('  node add-item-4.3.js abc123-def456-ghi789 --force  # Pour remplacer un item existant')
  console.error('')
  console.error('Pour trouver l\'ID du module 4:')
  console.error('  SELECT id, title, position FROM modules WHERE position = 4;')
  process.exit(1)
}

addItem43(moduleId)
  .then(() => {
    console.log('\n✅ Script terminé avec succès!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Erreur:', error.message)
    process.exit(1)
  })

