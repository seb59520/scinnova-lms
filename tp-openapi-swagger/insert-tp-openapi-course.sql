-- ============================================================================
-- Script SQL pour insérer le TP OpenAPI/Swagger dans le LMS
-- ============================================================================
-- INSTRUCTIONS :
-- 1. Remplacez 'VOTRE_USER_ID_ICI' par votre ID utilisateur (table profiles)
-- 2. Exécutez ce script dans l'interface SQL de Supabase
-- ============================================================================

-- Variable pour l'ID utilisateur (à remplacer)
DO $$
DECLARE
  v_user_id UUID := 'VOTRE_USER_ID_ICI'::UUID; -- ⚠️ REMPLACER PAR VOTRE ID
  v_course_id UUID;
  v_module1_id UUID;
  v_module2_id UUID;
  v_item_id UUID;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Utilisateur avec ID % non trouvé. Vérifiez votre ID utilisateur.', v_user_id;
  END IF;

  -- ============================================================================
  -- 1. Créer le cours
  -- ============================================================================
  INSERT INTO courses (
    title,
    description,
    status,
    access_type,
    created_by
  ) VALUES (
    'TP : Swagger UI / OpenAPI 3 – Création d''une API simple',
    'TP complet pour MBA1 Développeur Full Stack sur la création d''une API REST avec OpenAPI 3 et Swagger UI. Ce TP couvre la conception d''une API, l''implémentation avec Express/TypeScript, la validation avec Zod, et la documentation interactive avec Swagger UI.',
    'published',
    'free',
    v_user_id
  )
  RETURNING id INTO v_course_id;

  RAISE NOTICE 'Cours créé avec ID: %', v_course_id;

  -- ============================================================================
  -- 2. Créer le Module 1 : Contexte et préparation
  -- ============================================================================
  INSERT INTO modules (
    course_id,
    title,
    position
  ) VALUES (
    v_course_id,
    'Module 1 : Contexte et préparation',
    1
  )
  RETURNING id INTO v_module1_id;

  RAISE NOTICE 'Module 1 créé avec ID: %', v_module1_id;

  -- Item 1.1 : Introduction au TP
  INSERT INTO items (
    module_id,
    type,
    title,
    position,
    published,
    content
  ) VALUES (
    v_module1_id,
    'resource',
    'Introduction au TP',
    1,
    true,
    '{
      "body": {
        "type": "doc",
        "content": [
          {
            "type": "heading",
            "attrs": { "level": 1 },
            "content": [{ "type": "text", "text": "TP : Swagger UI / OpenAPI 3" }]
          },
          {
            "type": "heading",
            "attrs": { "level": 2 },
            "content": [{ "type": "text", "text": "Contexte" }]
          },
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Vous êtes développeur backend dans une startup qui souhaite adopter une approche API-first pour développer ses services. Votre mission est de concevoir et implémenter une API REST simple pour la gestion de tâches, en suivant les bonnes pratiques OpenAPI 3 et en utilisant Swagger UI pour la documentation interactive."
              }
            ]
          },
          {
            "type": "heading",
            "attrs": { "level": 2 },
            "content": [{ "type": "text", "text": "Objectifs pédagogiques" }]
          },
          {
            "type": "bulletList",
            "content": [
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Concevoir une spécification OpenAPI 3 complète pour une API REST" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Configurer Swagger UI pour servir et tester votre API" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Implémenter une API Express avec TypeScript conforme à la spécification" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Valider les données d''entrée avec Zod" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Gérer les erreurs de manière standardisée" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "heading",
            "attrs": { "level": 2 },
            "content": [{ "type": "text", "text": "Durée estimée" }]
          },
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "2h30 à 3h30", "marks": [{ "type": "bold" }] }
            ]
          }
        ]
      }
    }'::jsonb
  );

  -- Item 1.2 : Prérequis et stack technique
  INSERT INTO items (
    module_id,
    type,
    title,
    position,
    published,
    content
  ) VALUES (
    v_module1_id,
    'resource',
    'Prérequis et stack technique',
    2,
    true,
    '{
      "body": {
        "type": "doc",
        "content": [
          {
            "type": "heading",
            "attrs": { "level": 2 },
            "content": [{ "type": "text", "text": "Prérequis" }]
          },
          {
            "type": "bulletList",
            "content": [
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Node.js 18+ installé" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Connaissances de base en TypeScript" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Connaissances de base en Express.js" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Compréhension des concepts REST (GET, POST, PUT, PATCH, DELETE)" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "heading",
            "attrs": { "level": 2 },
            "content": [{ "type": "text", "text": "Stack technique" }]
          },
          {
            "type": "bulletList",
            "content": [
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Runtime : Node.js 18+" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Language : TypeScript" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Framework : Express.js" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Validation : Zod" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Documentation : Swagger UI + OpenAPI 3" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "Persistence : En mémoire (array)" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }'::jsonb
  );

  -- ============================================================================
  -- 3. Créer le Module 2 : TP pratique
  -- ============================================================================
  INSERT INTO modules (
    course_id,
    title,
    position
  ) VALUES (
    v_course_id,
    'Module 2 : TP pratique',
    2
  )
  RETURNING id INTO v_module2_id;

  RAISE NOTICE 'Module 2 créé avec ID: %', v_module2_id;

  -- Item 2.1 : TP principal (énoncé)
  -- Note: Le contenu complet est trop long pour être inséré ici
  -- Utilisez plutôt l'import JSON via l'interface admin ou chargez le fichier JSON complet
  INSERT INTO items (
    module_id,
    type,
    title,
    position,
    published,
    content
  ) VALUES (
    v_module2_id,
    'tp',
    'TP : Création d''une API OpenAPI 3 avec Swagger UI',
    1,
    true,
    '{
      "instructions": {
        "type": "doc",
        "content": [
          {
            "type": "heading",
            "attrs": { "level": 1 },
            "content": [{ "type": "text", "text": "TP : Swagger UI / OpenAPI 3 – Création d''une API simple" }]
          },
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "Durée estimée : 2h30 à 3h30", "marks": [{ "type": "bold" }] }
            ]
          },
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Consultez le fichier TP_ENONCE.md pour les instructions complètes du TP. Ce TP vous guide étape par étape pour créer une API REST complète avec OpenAPI 3 et Swagger UI."
              }
            ]
          }
        ]
      },
      "checklist": [
        "Le fichier OpenAPI 3 est complet et valide",
        "Swagger UI est accessible sur /docs et fonctionne",
        "Tous les endpoints sont implémentés et fonctionnels",
        "Les validations Zod sont en place pour tous les inputs",
        "La gestion d''erreurs est standardisée (format ErrorEnvelope)",
        "Les codes HTTP sont corrects (201 pour POST, 204 pour DELETE, etc.)",
        "La pagination et le filtrage fonctionnent sur GET /tasks",
        "Le code est structuré et propre (pas de code dupliqué)",
        "Rate limiting implémenté et fonctionnel (bonus)",
        "Tests unitaires pour le service (bonus)"
      ]
    }'::jsonb
  );

  -- Item 2.2 : Exemples curl
  INSERT INTO items (
    module_id,
    type,
    title,
    position,
    published,
    content
  ) VALUES (
    v_module2_id,
    'resource',
    'Exemples d''appels curl',
    2,
    true,
    '{
      "body": {
        "type": "doc",
        "content": [
          {
            "type": "heading",
            "attrs": { "level": 2 },
            "content": [{ "type": "text", "text": "Exemples d''appels curl" }]
          },
          {
            "type": "codeBlock",
            "attrs": { "language": "bash" },
            "content": [
              {
                "type": "text",
                "text": "# Health Check\ncurl -X GET http://localhost:3000/health\n\n# Créer une tâche\ncurl -X POST http://localhost:3000/tasks \\\n  -H \"Content-Type: application/json\" \\\n  -d ''{\n    \"title\": \"Réviser le cours OpenAPI\",\n    \"description\": \"Relire les chapitres 1 à 5\",\n    \"status\": \"todo\"\n  }''\n\n# Lister les tâches\ncurl -X GET \"http://localhost:3000/tasks?limit=10&offset=0\"\n\n# Récupérer une tâche par ID\ncurl -X GET http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000\n\n# Mettre à jour complètement (PUT)\ncurl -X PUT http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000 \\\n  -H \"Content-Type: application/json\" \\\n  -d ''{\n    \"title\": \"Tâche mise à jour\",\n    \"description\": \"Nouvelle description\",\n    \"status\": \"done\"\n  }''\n\n# Mettre à jour partiellement (PATCH)\ncurl -X PATCH http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000 \\\n  -H \"Content-Type: application/json\" \\\n  -d ''{\n    \"status\": \"doing\"\n  }''\n\n# Supprimer une tâche\ncurl -X DELETE http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000"
              }
            ]
          }
        ]
      }
    }'::jsonb
  );

  -- Item 2.3 : Checklist de conformité
  INSERT INTO items (
    module_id,
    type,
    title,
    position,
    published,
    content
  ) VALUES (
    v_module2_id,
    'resource',
    'Checklist de conformité',
    3,
    true,
    '{
      "body": {
        "type": "doc",
        "content": [
          {
            "type": "heading",
            "attrs": { "level": 2 },
            "content": [{ "type": "text", "text": "Checklist de conformité OpenAPI/Swagger" }]
          },
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Utilisez cette checklist pour vérifier que votre API est conforme aux bonnes pratiques OpenAPI 3. Consultez le fichier CHECKLIST.md pour la version complète et détaillée."
              }
            ]
          }
        ]
      }
    }'::jsonb
  );

  -- Item 2.4 : Documentation technique
  INSERT INTO items (
    module_id,
    type,
    title,
    position,
    published,
    content
  ) VALUES (
    v_module2_id,
    'resource',
    'Documentation technique complète',
    4,
    true,
    '{
      "body": {
        "type": "doc",
        "content": [
          {
            "type": "heading",
            "attrs": { "level": 2 },
            "content": [{ "type": "text", "text": "Documentation technique" }]
          },
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Pour la documentation technique complète (README, structure du projet, etc.), consultez les fichiers fournis avec le TP dans le dossier tp-openapi-swagger/ :"
              }
            ]
          },
          {
            "type": "bulletList",
            "content": [
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "README.md : Instructions d''installation et exemples" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "ARBORESCENCE.md : Structure du projet" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "CHECKLIST.md : Checklist de conformité détaillée" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "TP_ENONCE.md : Énoncé complet du TP" }
                    ]
                  }
                ]
              },
              {
                "type": "listItem",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      { "type": "text", "text": "TP_CORRIGE.md : Corrigé formateur (avec grille de correction)" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }'::jsonb
  );

  RAISE NOTICE '✅ Cours créé avec succès !';
  RAISE NOTICE '📚 ID du cours: %', v_course_id;
  RAISE NOTICE '📦 Module 1 ID: %', v_module1_id;
  RAISE NOTICE '📦 Module 2 ID: %', v_module2_id;
  RAISE NOTICE '';
  RAISE NOTICE '💡 Pour un import complet avec toutes les instructions détaillées,';
  RAISE NOTICE '   utilisez plutôt le fichier JSON via l''interface admin.';

END $$;

