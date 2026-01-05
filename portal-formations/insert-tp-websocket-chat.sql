-- ============================================================================
-- Script SQL pour insérer le TP WebSocket Chat dans le LMS
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
    'TP : Application de chat avec WebSocket',
    'TP complet pour créer une application de chat en temps réel utilisant WebSocket. Ce TP couvre la connexion WebSocket bidirectionnelle, la reconnexion automatique avec délai exponentiel, le système de heartbeat (ping/pong), et la gestion complète des événements WebSocket.',
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
            "content": [{ "type": "text", "text": "TP : Application de chat avec WebSocket" }]
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
                "text": "Dans ce TP, vous allez créer une application de chat simple utilisant WebSocket pour permettre la communication en temps réel entre plusieurs utilisateurs. Vous apprendrez à gérer les connexions WebSocket, implémenter la reconnexion automatique, et maintenir la connexion active avec un système de heartbeat."
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
                      { "type": "text", "text": "Comprendre le fonctionnement de WebSocket" }
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
                      { "type": "text", "text": "Implémenter une connexion WebSocket bidirectionnelle" }
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
                      { "type": "text", "text": "Gérer la reconnexion automatique en cas de perte de connexion" }
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
                      { "type": "text", "text": "Implémenter un système de heartbeat pour maintenir la connexion active" }
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
              { "type": "text", "text": "2h à 3h", "marks": [{ "type": "bold" }] }
            ]
          }
        ]
      }
    }'::jsonb
  );

  -- Item 1.2 : Prérequis et ressources
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
    'Prérequis et ressources',
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
                      { "type": "text", "text": "Connaissances de base en JavaScript (ES6+)" }
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
                      { "type": "text", "text": "Connaissances de base en HTML et CSS" }
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
                      { "type": "text", "text": "Compréhension des concepts de programmation asynchrone" }
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
                      { "type": "text", "text": "Un navigateur moderne supportant WebSocket" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "heading",
            "attrs": { "level": 2 },
            "content": [{ "type": "text", "text": "Ressources supplémentaires" }]
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
                      { "type": "text", "text": "Documentation MDN WebSocket : " },
                      {
                        "type": "text",
                        "marks": [
                          {
                            "type": "link",
                            "attrs": {
                              "href": "https://developer.mozilla.org/fr/docs/Web/API/WebSocket",
                              "target": "_blank"
                            }
                          }
                        ],
                        "text": "developer.mozilla.org/fr/docs/Web/API/WebSocket"
                      }
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
                      { "type": "text", "text": "RFC 6455 - WebSocket Protocol : " },
                      {
                        "type": "text",
                        "marks": [
                          {
                            "type": "link",
                            "attrs": {
                              "href": "https://tools.ietf.org/html/rfc6455",
                              "target": "_blank"
                            }
                          }
                        ],
                        "text": "tools.ietf.org/html/rfc6455"
                      }
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
                      { "type": "text", "text": "WebSocket.org - Outils de test : " },
                      {
                        "type": "text",
                        "marks": [
                          {
                            "type": "link",
                            "attrs": {
                              "href": "https://www.websocket.org/echo.html",
                              "target": "_blank"
                            }
                          }
                        ],
                        "text": "websocket.org/echo.html"
                      }
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

  -- Item 2.1 : TP principal
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
    'TP : Application de chat avec WebSocket',
    1,
    true,
    '{
      "instructions": {
        "type": "doc",
        "content": [
          {
            "type": "heading",
            "attrs": { "level": 1 },
            "content": [{ "type": "text", "text": "TP : Application de chat avec WebSocket" }]
          },
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "Durée estimée : 2h à 3h", "marks": [{ "type": "bold" }] }
            ]
          },
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Dans ce TP, vous allez créer une application de chat simple utilisant WebSocket pour permettre la communication en temps réel entre plusieurs utilisateurs. Consultez le fichier tp-websocket-chat.json pour les instructions complètes."
              }
            ]
          }
        ]
      },
      "checklist": [
        "Créer la structure HTML de base avec un formulaire de message et une zone d'affichage",
        "Implémenter la classe WebSocketClient avec les méthodes connect(), send(), et disconnect()",
        "Gérer les événements onopen, onmessage, onerror, et onclose",
        "Implémenter l'envoi de messages avec format JSON (type, content, timestamp, user)",
        "Implémenter la réception et l'affichage des messages dans l'interface",
        "Ajouter la gestion de reconnexion automatique avec délai exponentiel",
        "Implémenter le système de heartbeat (ping/pong) toutes les 30 secondes",
        "Ajouter un timeout pour détecter les connexions mortes",
        "Afficher le statut de connexion (connecté/déconnecté/en cours de connexion)",
        "Gérer les erreurs et afficher des messages appropriés à l'utilisateur",
        "Tester la reconnexion en simulant une perte de connexion",
        "Tester le heartbeat en vérifiant que les pings sont envoyés régulièrement",
        "Ajouter la possibilité de saisir un nom d'utilisateur",
        "Améliorer l'interface avec du CSS pour un rendu plus professionnel",
        "Ajouter un défilement automatique vers le bas lors de l'arrivée de nouveaux messages"
      ]
    }'::jsonb
  );

  -- Item 2.2 : Solutions complètes
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
    'Solutions complètes',
    2,
    true,
    '{
      "body": {
        "type": "doc",
        "content": [
          {
            "type": "heading",
            "attrs": { "level": 2 },
            "content": [{ "type": "text", "text": "Solutions complètes" }]
          },
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Les solutions complètes pour ce TP sont disponibles dans le fichier solutions-websocket-chat.json. Ce fichier contient le code complet de la classe WebSocketClient, l'interface HTML/CSS/JS, et des explications détaillées pour chaque étape."
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

