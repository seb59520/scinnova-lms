#!/usr/bin/env node

/**
 * Script d'import direct d'un cours JSON dans Supabase
 * 
 * Usage:
 *   node import-course-direct.js <fichier-json> [--update <course-id>]
 * 
 * Exemple:
 *   node import-course-direct.js architecture-client-serveur-web.json
 *   node import-course-direct.js architecture-client-serveur-web.json --update abc123-def456
 */

const fs = require('fs')
const path = require('path')

// Essayer de charger dotenv si disponible (optionnel)
try {
  require('dotenv').config()
} catch (e) {
  // dotenv n'est pas installé, on utilise les variables d'environnement directement
  console.log('ℹ️  dotenv non disponible, utilisation des variables d\'environnement système')
}

// Configuration Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erreur: Variables d\'environnement Supabase manquantes')
  console.error('   Assurez-vous d\'avoir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre .env')
  process.exit(1)
}

// Utiliser la service key si disponible (pour bypasser RLS), sinon utiliser anon key
const SUPABASE_KEY = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY

// Fonction pour valider et normaliser le type d'item
function validateItemType(type) {
  if (!type) {
    throw new Error('Le type d\'item est requis.')
  }
  
  const normalizedType = type.toLowerCase().trim()
  
  const typeMap = {
    'resource': 'resource',
    'slide': 'slide',
    'slides': 'slide',
    'exercise': 'exercise',
    'exercice': 'exercise',
    'exercises': 'exercise',
    'case': 'exercise',
    'case-study': 'exercise',
    'case study': 'exercise',
    'étude de cas': 'exercise',
    'etude de cas': 'exercise',
    'activity': 'activity',
    'activité': 'activity',
    'activite': 'activity',
    'activities': 'activity',
    'activités': 'activity',
    'q/r': 'activity',
    'qr': 'activity',
    'questions-réponses': 'activity',
    'questions-reponses': 'activity',
    'tp': 'tp',
    'travaux-pratiques': 'tp',
    'travaux pratiques': 'tp',
    'game': 'game',
    'jeu': 'game',
    'games': 'game',
    'jeux': 'game'
  }
  
  const validType = typeMap[normalizedType]
  
  if (!validType) {
    throw new Error(`Type d'item invalide: "${type}". Types autorisés: resource, slide, exercise, activity, tp, game`)
  }
  
  return validType
}

// Fonction pour faire des requêtes à Supabase
async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Erreur ${response.status}: ${error.message || error.error_description || response.statusText}`)
  }

  return response.json()
}

// Fonction principale d'import
async function importCourse(jsonFilePath, updateCourseId = null) {
  console.log('📖 Lecture du fichier JSON...')
  
  // Lire et parser le JSON
  let courseJson
  try {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8')
    courseJson = JSON.parse(fileContent)
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier JSON:', error.message)
    process.exit(1)
  }

  // Validation de base
  if (!courseJson.title) {
    console.error('❌ Erreur: Le champ "title" est requis dans le JSON')
    process.exit(1)
  }

  console.log(`✅ JSON valide - Cours: "${courseJson.title}"`)
  console.log(`   Modules: ${courseJson.modules?.length || 0}`)

  // Préparer les données du cours
  const courseData = {
    title: courseJson.title.trim(),
    description: courseJson.description || null,
    status: courseJson.status || 'draft',
    access_type: courseJson.access_type || 'free',
    price_cents: courseJson.price_cents || null,
    currency: courseJson.currency || 'EUR',
    is_paid: courseJson.access_type === 'paid',
    updated_at: new Date().toISOString()
  }

  let courseId

  try {
    // Créer ou mettre à jour le cours
    if (updateCourseId) {
      console.log(`\n🔄 Mise à jour du cours existant (ID: ${updateCourseId})...`)
      
      const { error } = await supabaseRequest(`/rest/v1/courses?id=eq.${updateCourseId}`, {
        method: 'PATCH',
        body: JSON.stringify(courseData)
      })

      if (error) throw error
      courseId = updateCourseId
      console.log('✅ Cours mis à jour')
    } else {
      console.log('\n📝 Création d\'un nouveau cours...')
      
      // Récupérer l'utilisateur actuel (nécessite une authentification)
      // Pour l'instant, on va utiliser un UUID par défaut ou demander à l'utilisateur
      const userId = process.env.USER_ID || '00000000-0000-0000-0000-000000000000'
      
      courseData.created_by = userId
      
      const result = await supabaseRequest('/rest/v1/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
        headers: {
          'Prefer': 'return=representation'
        }
      })

      if (Array.isArray(result) && result.length > 0) {
        courseId = result[0].id
      } else if (result.id) {
        courseId = result.id
      } else {
        throw new Error('Le cours a été créé mais aucun ID n\'a été retourné')
      }

      console.log(`✅ Cours créé avec l'ID: ${courseId}`)
    }

    // Supprimer les anciens modules si mise à jour
    if (updateCourseId) {
      console.log('\n🗑️  Suppression des anciens modules...')
      
      // Récupérer les modules existants
      const existingModules = await supabaseRequest(`/rest/v1/modules?course_id=eq.${courseId}&select=id`)
      
      if (Array.isArray(existingModules) && existingModules.length > 0) {
        const moduleIds = existingModules.map(m => m.id)
        
        // Supprimer les items des modules
        for (const moduleId of moduleIds) {
          await supabaseRequest(`/rest/v1/items?module_id=eq.${moduleId}`, {
            method: 'DELETE'
          })
        }
        
        // Supprimer les modules
        await supabaseRequest(`/rest/v1/modules?course_id=eq.${courseId}`, {
          method: 'DELETE'
        })
        
        console.log(`✅ ${existingModules.length} module(s) supprimé(s)`)
      }
    }

    // Créer les modules et items
    if (courseJson.modules && courseJson.modules.length > 0) {
      console.log(`\n📚 Création des ${courseJson.modules.length} module(s)...`)
      
      for (let mIdx = 0; mIdx < courseJson.modules.length; mIdx++) {
        const module = courseJson.modules[mIdx]
        console.log(`\n   Module ${mIdx + 1}/${courseJson.modules.length}: "${module.title}"`)
        
        // Créer le module
        const moduleResult = await supabaseRequest('/rest/v1/modules', {
          method: 'POST',
          body: JSON.stringify({
            course_id: courseId,
            title: module.title,
            position: module.position
          }),
          headers: {
            'Prefer': 'return=representation'
          }
        })

        const moduleData = Array.isArray(moduleResult) ? moduleResult[0] : moduleResult
        if (!moduleData?.id) {
          throw new Error(`Le module "${module.title}" a été créé mais aucun ID n'a été retourné`)
        }

        console.log(`      ✅ Module créé (ID: ${moduleData.id})`)

        // Créer les items du module
        if (module.items && module.items.length > 0) {
          console.log(`      📦 Création de ${module.items.length} item(s)...`)
          
          const itemsData = module.items.map((item, index) => {
            try {
              const validatedType = validateItemType(item.type)
              
              return {
                module_id: moduleData.id,
                type: validatedType,
                title: item.title || `Item ${index + 1}`,
                position: item.position ?? index,
                published: item.published !== false,
                content: item.content || {},
                asset_path: item.asset_path || null,
                external_url: item.external_url || null
              }
            } catch (error) {
              throw new Error(`Erreur dans l'item "${item.title || `à la position ${index + 1}`}": ${error.message}`)
            }
          })

          const savedItems = await supabaseRequest('/rest/v1/items', {
            method: 'POST',
            body: JSON.stringify(itemsData),
            headers: {
              'Prefer': 'return=representation'
            }
          })

          const itemsArray = Array.isArray(savedItems) ? savedItems : [savedItems]
          
          if (itemsArray.length === 0) {
            console.warn(`      ⚠️  Aucun item n'a été créé pour le module "${module.title}"`)
            continue
          }

          console.log(`      ✅ ${itemsArray.length} item(s) créé(s)`)

          // Créer les chapitres pour chaque item
          for (let i = 0; i < itemsArray.length; i++) {
            const savedItem = itemsArray[i]
            const originalItem = module.items[i]
            
            if (!savedItem?.id) {
              console.warn(`      ⚠️  L'item "${originalItem.title}" n'a pas d'ID, impossible de créer les chapitres`)
              continue
            }
            
            if (originalItem.chapters && originalItem.chapters.length > 0) {
              const chaptersData = originalItem.chapters.map((ch) => {
                const validType = (ch.type === 'content' || ch.type === 'game') ? ch.type : 'content'
                
                return {
                  item_id: savedItem.id,
                  title: ch.title,
                  position: ch.position,
                  content: ch.content || null,
                  type: validType,
                  game_content: ch.game_content || null,
                  published: ch.published !== undefined ? ch.published : true
                }
              })

              try {
                await supabaseRequest('/rest/v1/chapters', {
                  method: 'POST',
                  body: JSON.stringify(chaptersData)
                })
                console.log(`         ✅ ${chaptersData.length} chapitre(s) créé(s) pour "${originalItem.title}"`)
              } catch (error) {
                console.error(`         ❌ Erreur lors de la création des chapitres pour "${originalItem.title}":`, error.message)
                // Ne pas bloquer l'import si les chapitres échouent
              }
            }
          }
        }
      }
    }

    console.log('\n✅ Import terminé avec succès!')
    console.log(`\n📋 Résumé:`)
    console.log(`   - Cours ID: ${courseId}`)
    console.log(`   - Titre: ${courseJson.title}`)
    console.log(`   - Modules: ${courseJson.modules?.length || 0}`)
    
    const totalItems = courseJson.modules?.reduce((sum, m) => sum + (m.items?.length || 0), 0) || 0
    console.log(`   - Items: ${totalItems}`)
    
    console.log(`\n🌐 Vous pouvez maintenant accéder au cours dans l'application:`)
    console.log(`   ${SUPABASE_URL.replace('/rest/v1', '')}/admin/courses/${courseId}/json`)

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'import:', error.message)
    if (error.stack) {
      console.error('\nStack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Point d'entrée
const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: node import-course-direct.js <fichier-json> [--update <course-id>]')
  console.error('\nExemples:')
  console.error('  node import-course-direct.js architecture-client-serveur-web.json')
  console.error('  node import-course-direct.js architecture-client-serveur-web.json --update abc123-def456')
  process.exit(1)
}

const jsonFilePath = args[0]
const updateIndex = args.indexOf('--update')
const updateCourseId = updateIndex !== -1 && args[updateIndex + 1] ? args[updateIndex + 1] : null

if (!fs.existsSync(jsonFilePath)) {
  console.error(`❌ Erreur: Le fichier "${jsonFilePath}" n'existe pas`)
  process.exit(1)
}

// Vérifier que fetch est disponible (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Erreur: Ce script nécessite Node.js 18+ (pour fetch)')
  console.error('   Version actuelle:', process.version)
  process.exit(1)
}

importCourse(jsonFilePath, updateCourseId).catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

