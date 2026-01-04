-- ============================================================================
-- Script de création : Cours "Conception et développement d'API performantes et sécurisées"
-- ============================================================================
-- Ce script crée la structure complète du cours avec :
-- - 1 cours
-- - 10 modules
-- - Pour chaque module : un item contenant les métadonnées (finalité, compétences, contenus, livrables)
--
-- IMPORTANT: Remplacez 'VOTRE_USER_ID' par l'UUID d'un utilisateur admin/instructor
-- Vous pouvez obtenir votre UUID avec : SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;
-- ============================================================================

DO $$
DECLARE
  -- UUIDs à remplacer
  user_uuid UUID := 'VOTRE_USER_ID'::UUID; -- ⚠️ REMPLACEZ CETTE VALEUR
  
  -- Variables pour stocker les IDs
  course_id_var UUID;
  -- Modules
  m1_id UUID; m2_id UUID; m3_id UUID; m4_id UUID; m5_id UUID;
  m6_id UUID; m7_id UUID; m8_id UUID; m9_id UUID; m10_id UUID;
  -- Items (métadonnées des modules)
  item_m1_id UUID; item_m2_id UUID; item_m3_id UUID; item_m4_id UUID; item_m5_id UUID;
  item_m6_id UUID; item_m7_id UUID; item_m8_id UUID; item_m9_id UUID; item_m10_id UUID;
BEGIN
  -- ============================================================================
  -- 1. CRÉATION DU COURS
  -- ============================================================================
  
  INSERT INTO courses (id, title, description, status, access_type, created_by)
  VALUES (
    gen_random_uuid(),
    'Conception et développement d''API performantes et sécurisées',
    'Niveau: MBA1 Développeur Full Stack

Objectif global: Concevoir, développer, sécuriser, tester, documenter et déployer une API complète intégrée à une architecture back-end scalable.',
    'published',
    'free',
    user_uuid
  )
  RETURNING id INTO course_id_var;
  
  -- ============================================================================
  -- 2. MODULE 1 : Fondations des architectures d'API
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Fondations des architectures d''API', 1)
  RETURNING id INTO m1_id;
  
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m1_id, 'resource', 'Métadonnées du module M1', 0,
     jsonb_build_object(
       'module_id', 'M1',
       'finalite', 'Comprendre les paradigmes d''API modernes et choisir l''architecture adaptée au contexte.',
       'competences', jsonb_build_array(
         'Identifier les différents types d''API',
         'Comparer les paradigmes d''API',
         'Justifier un choix architectural'
       ),
       'contenus', jsonb_build_array(
         'Architecture client-serveur',
         'HTTP et principes fondamentaux',
         'API RESTful',
         'API GraphQL',
         'RPC / gRPC',
         'WebSocket et temps réel'
       ),
       'livrables', jsonb_build_array(
         'Analyse comparative REST vs GraphQL',
         'Mini API de démonstration',
         'Schéma d''architecture'
       )
     ),
     true)
  RETURNING id INTO item_m1_id;
  
  -- ============================================================================
  -- 3. MODULE 2 : Conception contractuelle et approche API-first
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Conception contractuelle et approche API-first', 2)
  RETURNING id INTO m2_id;
  
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m2_id, 'resource', 'Métadonnées du module M2', 0,
     jsonb_build_object(
       'module_id', 'M2',
       'finalite', 'Concevoir une API avant son implémentation en s''appuyant sur des standards industriels.',
       'competences', jsonb_build_array(
         'Concevoir un contrat d''API',
         'Documenter une API',
         'Gérer le versioning et la rétrocompatibilité'
       ),
       'contenus', jsonb_build_array(
         'Approche API-first',
         'OpenAPI 3',
         'Swagger UI',
         'JSON Schema',
         'Versioning sémantique',
         'Rétrocompatibilité'
       ),
       'livrables', jsonb_build_array(
         'Spécification OpenAPI complète',
         'Documentation interactive',
         'Mock serveur généré'
       )
     ),
     true)
  RETURNING id INTO item_m2_id;
  
  -- ============================================================================
  -- 4. MODULE 3 : Modélisation, persistance et gestion des données
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Modélisation, persistance et gestion des données', 3)
  RETURNING id INTO m3_id;
  
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m3_id, 'resource', 'Métadonnées du module M3', 0,
     jsonb_build_object(
       'module_id', 'M3',
       'finalite', 'Mettre en œuvre une couche de persistance robuste et cohérente.',
       'competences', jsonb_build_array(
         'Modéliser une base de données',
         'Utiliser un ORM moderne',
         'Gérer les transactions et la concurrence'
       ),
       'contenus', jsonb_build_array(
         'Modélisation relationnelle',
         'ORM (Prisma, TypeORM, Sequelize)',
         'Migrations',
         'Transactions',
         'Gestion de la concurrence',
         'Intégrité des données'
       ),
       'livrables', jsonb_build_array(
         'Schéma de base de données',
         'Scripts de migration',
         'API CRUD avancée'
       )
     ),
     true)
  RETURNING id INTO item_m3_id;
  
  -- ============================================================================
  -- 5. MODULE 4 : Sécurité des API – Security by Design
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Sécurité des API – Security by Design', 4)
  RETURNING id INTO m4_id;
  
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m4_id, 'resource', 'Métadonnées du module M4', 0,
     jsonb_build_object(
       'module_id', 'M4',
       'finalite', 'Développer des API sécurisées conformes aux standards de sécurité.',
       'competences', jsonb_build_array(
         'Mettre en place une authentification sécurisée',
         'Gérer les autorisations',
         'Protéger une API contre les attaques courantes'
       ),
       'contenus', jsonb_build_array(
         'Principes Security by Design',
         'OAuth2',
         'OpenID Connect',
         'JWT (access et refresh tokens)',
         'RBAC et ABAC',
         'Rate limiting',
         'Chiffrement',
         'OWASP API Top 10'
       ),
       'livrables', jsonb_build_array(
         'Système d''authentification sécurisé',
         'Gestion des rôles et permissions',
         'Audit de sécurité de l''API'
       )
     ),
     true)
  RETURNING id INTO item_m4_id;
  
  -- ============================================================================
  -- 6. MODULE 5 : Gestion des erreurs et observabilité
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Gestion des erreurs et observabilité', 5)
  RETURNING id INTO m5_id;
  
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m5_id, 'resource', 'Métadonnées du module M5', 0,
     jsonb_build_object(
       'module_id', 'M5',
       'finalite', 'Rendre une API observable, maintenable et exploitable en production.',
       'competences', jsonb_build_array(
         'Gérer les erreurs de manière standardisée',
         'Mettre en place des logs exploitables',
         'Surveiller une API en production'
       ),
       'contenus', jsonb_build_array(
         'Enveloppes d''erreurs',
         'Codes HTTP',
         'Logs structurés',
         'Tracing distribué (OpenTelemetry)',
         'Métriques',
         'Alerting'
       ),
       'livrables', jsonb_build_array(
         'Stratégie de gestion des erreurs',
         'Dashboard de monitoring',
         'Traces d''exécution'
       )
     ),
     true)
  RETURNING id INTO item_m5_id;
  
  -- ============================================================================
  -- 7. MODULE 6 : Tests, qualité et fiabilité des API
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Tests, qualité et fiabilité des API', 6)
  RETURNING id INTO m6_id;
  
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m6_id, 'resource', 'Métadonnées du module M6', 0,
     jsonb_build_object(
       'module_id', 'M6',
       'finalite', 'Garantir la qualité, la stabilité et la non-régression des API.',
       'competences', jsonb_build_array(
         'Mettre en place des tests automatisés',
         'Tester une API à plusieurs niveaux',
         'Sécuriser les échanges front-back'
       ),
       'contenus', jsonb_build_array(
         'Tests unitaires',
         'Tests d''intégration',
         'Tests contractuels (Pact)',
         'Mocks et stubs',
         'Intégration continue',
         'Qualité de code'
       ),
       'livrables', jsonb_build_array(
         'Suite de tests automatisés',
         'Tests contractuels validés',
         'Rapport de couverture'
       )
     ),
     true)
  RETURNING id INTO item_m6_id;
  
  -- ============================================================================
  -- 8. MODULE 7 : Performance et scalabilité
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Performance et scalabilité', 7)
  RETURNING id INTO m7_id;
  
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m7_id, 'resource', 'Métadonnées du module M7', 0,
     jsonb_build_object(
       'module_id', 'M7',
       'finalite', 'Optimiser les performances et préparer la montée en charge d''une API.',
       'competences', jsonb_build_array(
         'Optimiser les performances d''une API',
         'Mettre en cache intelligemment',
         'Analyser la charge'
       ),
       'contenus', jsonb_build_array(
         'Pagination cursor-based',
         'Cache Redis',
         'Compression HTTP',
         'Métriques Prometheus',
         'Tests de charge (k6)'
       ),
       'livrables', jsonb_build_array(
         'API optimisée',
         'Rapport de performance',
         'Analyse de montée en charge'
       )
     ),
     true)
  RETURNING id INTO item_m7_id;
  
  -- ============================================================================
  -- 9. MODULE 8 : Architectures distribuées et event-driven
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Architectures distribuées et event-driven', 8)
  RETURNING id INTO m8_id;
  
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m8_id, 'resource', 'Métadonnées du module M8', 0,
     jsonb_build_object(
       'module_id', 'M8',
       'finalite', 'Concevoir des architectures back-end modernes et résilientes.',
       'competences', jsonb_build_array(
         'Concevoir une architecture micro-services',
         'Mettre en place une communication asynchrone',
         'Gérer la résilience et l''idempotence'
       ),
       'contenus', jsonb_build_array(
         'Micro-services',
         'Event-driven architecture',
         'RabbitMQ',
         'Kafka',
         'Serverless',
         'Résilience',
         'Idempotence'
       ),
       'livrables', jsonb_build_array(
         'Schéma d''architecture distribuée',
         'Service découplé',
         'Flux événementiel fonctionnel'
       )
     ),
     true)
  RETURNING id INTO item_m8_id;
  
  -- ============================================================================
  -- 10. MODULE 9 : Déploiement continu et exploitation
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Déploiement continu et exploitation', 9)
  RETURNING id INTO m9_id;
  
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m9_id, 'resource', 'Métadonnées du module M9', 0,
     jsonb_build_object(
       'module_id', 'M9',
       'finalite', 'Industrialiser le cycle de vie d''une API jusqu''à la production.',
       'competences', jsonb_build_array(
         'Conteneuriser une API',
         'Mettre en place un pipeline CI/CD',
         'Déployer sans interruption de service'
       ),
       'contenus', jsonb_build_array(
         'Docker',
         'CI/CD (GitHub Actions, GitLab CI)',
         'Déploiement continu',
         'Blue-Green deployment',
         'Canary deployment',
         'Gestion des environnements'
       ),
       'livrables', jsonb_build_array(
         'Image Docker',
         'Pipeline CI/CD fonctionnel',
         'API déployée'
       )
     ),
     true)
  RETURNING id INTO item_m9_id;
  
  -- ============================================================================
  -- 11. MODULE 10 : Projet fil rouge Full-Stack
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Projet fil rouge Full-Stack', 10)
  RETURNING id INTO m10_id;
  
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m10_id, 'resource', 'Métadonnées du module M10', 0,
     jsonb_build_object(
       'module_id', 'M10',
       'finalite', 'Mettre en application l''ensemble des compétences acquises dans un projet professionnel complet.',
       'competences', jsonb_build_array(
         'Concevoir une solution full-stack',
         'Intégrer un front PWA et une API',
         'Présenter et défendre ses choix techniques'
       ),
       'contenus', jsonb_build_array(
         'API Back-end REST ou GraphQL',
         'Front PWA (module Front avancé)',
         'Authentification',
         'Temps réel',
         'Observabilité',
         'Tests et CI/CD'
       ),
       'livrables', jsonb_build_array(
         'Application full-stack fonctionnelle',
         'Documentation technique',
         'Soutenance orale'
       )
     ),
     true)
  RETURNING id INTO item_m10_id;
  
  -- ============================================================================
  -- FIN DU SCRIPT
  -- ============================================================================
  
  RAISE NOTICE 'Cours créé avec succès !';
  RAISE NOTICE 'Course ID: %', course_id_var;
  RAISE NOTICE '10 modules créés avec leurs métadonnées';
  
END $$;

