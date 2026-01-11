-- ============================================================================
-- Script d'importation du cours "Data Science et Gouvernance"
-- Organisation, sécurité et valorisation des données (2h)
-- Public : Décideurs / Directions
-- ============================================================================

-- Étape 1: Créer le cours
DO $$
DECLARE
    v_course_id UUID := gen_random_uuid();
    v_module_id UUID;
    v_item_id UUID;
    v_admin_id UUID;
BEGIN
    -- Récupérer un admin pour created_by
    SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Aucun admin trouvé. Créez d''abord un profil admin.';
    END IF;
    
    -- Créer le cours
    INSERT INTO courses (id, title, description, status, access_type, created_by, created_at)
    VALUES (
        v_course_id,
        'Rôle de la Data Science et gouvernance des informations',
        'Organisation, sécurité et valorisation des données pour décideurs et directions (2h). Comprendre comment piloter la donnée, selon quelles règles, et dans quel objectif de création de valeur.',
        'published',
        'free',
        v_admin_id,
        NOW()
    );
    
    RAISE NOTICE '✅ Cours créé: %', v_course_id;

    -- ========================================================================
    -- MODULE 1 : Introduction
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 1 : Introduction — Pourquoi gouverner la donnée ?', 0);
    
    -- Item 1.1
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '1.1 Les questions clés de la direction', 'resource', 0, true,
     '{"description":"Trois questions fondamentales que toute direction doit se poser sur la donnée."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Les enjeux de pilotage', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🎯 Les questions clés de la direction"}]},{"type":"paragraph","content":[{"type":"text","text":"Après avoir compris pourquoi la donnée est un actif stratégique et comment elle transforme la décision, une question centrale se pose au niveau direction :"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Qui pilote la donnée ?","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Selon quelles règles ?","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Et dans quel objectif de création de valeur ?","marks":[{"type":"bold"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"C''est précisément le rôle de la "},{"type":"text","text":"Data Science","marks":[{"type":"bold"}]},{"type":"text","text":" et de la "},{"type":"text","text":"gouvernance des données","marks":[{"type":"bold"}]},{"type":"text","text":"."}]}]}'::jsonb),
    (gen_random_uuid(), v_item_id, 'Sans gouvernance, la donnée devient...', 1, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"⚠️ Sans gouvernance, la donnée devient..."}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Incontrôlable"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Peu fiable"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Risquée juridiquement"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Et finalement inutilisable stratégiquement"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🎯 Objectif de ce module"}]},{"type":"paragraph","content":[{"type":"text","text":"Donner aux directions une "},{"type":"text","text":"grille de lecture claire","marks":[{"type":"bold"}]},{"type":"text","text":" pour encadrer, sécuriser et valoriser les données de l''organisation."}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 1 créé';

    -- ========================================================================
    -- MODULE 2 : Le rôle réel de la Data Science
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 2 : Le rôle réel de la Data Science', 1);
    
    -- Item 2.1
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '2.1 La Data Science n''est pas une discipline isolée', 'resource', 0, true,
     '{"description":"Comprendre ce qu''est réellement la Data Science au-delà des idées reçues."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Ce que la Data Science n''est PAS', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🚫 Ce que la Data Science n''est PAS"}]},{"type":"paragraph","content":[{"type":"text","text":"Contrairement à une idée répandue, la Data Science n''est pas :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Un outil"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Un logiciel"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Un projet ponctuel"}]}]}]}]}'::jsonb),
    (gen_random_uuid(), v_item_id, 'Ce qu''est vraiment la Data Science', 1, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"✅ Ce qu''est vraiment la Data Science"}]},{"type":"paragraph","content":[{"type":"text","text":"La Data Science est une "},{"type":"text","text":"capacité organisationnelle","marks":[{"type":"bold"}]},{"type":"text","text":" qui permet de :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Transformer des données brutes en informations exploitables"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Produire des analyses explicatives et prédictives"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Éclairer des décisions complexes à fort impact"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Elle ne crée de valeur que si elle est alignée avec les enjeux métiers et stratégiques.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    -- Item 2.2
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '2.2 Le rôle de la Data Science pour la direction', 'resource', 1, true,
     '{"description":"Les trois questions auxquelles la Data Science doit répondre."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Trois questions simples', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🎯 Trois questions pour la direction"}]},{"type":"paragraph","content":[{"type":"text","text":"Du point de vue de la direction, la Data Science doit répondre à trois questions simples :"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"1️⃣ Que se passe-t-il réellement ?"}]},{"type":"paragraph","content":[{"type":"text","text":"→ Analyse factuelle, objectivée"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"2️⃣ Pourquoi cela se produit-il ?"}]},{"type":"paragraph","content":[{"type":"text","text":"→ Identification des causes, corrélations, leviers"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"3️⃣ Que va-t-il probablement se passer ?"}]},{"type":"paragraph","content":[{"type":"text","text":"→ Scénarios, projections, aide à l''arbitrage"}]}]}'::jsonb),
    (gen_random_uuid(), v_item_id, 'Réduire l''incertitude, pas décider', 1, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"💡 Le vrai rôle de la Data Science"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"La Data Science n''a pas vocation à décider à la place de la direction, mais à réduire l''incertitude associée à la décision.","marks":[{"type":"bold"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"La responsabilité de la décision reste humaine et stratégique."}]}]}'::jsonb);
    
    -- Item 2.3
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '2.3 Les limites sans gouvernance', 'resource', 2, true,
     '{"description":"Pourquoi la Data Science devient contre-productive sans cadre clair."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Quand la Data Science déraille', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"⚠️ Les dérives sans gouvernance"}]},{"type":"paragraph","content":[{"type":"text","text":"Sans cadre clair, la Data Science devient rapidement contre-productive :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Analyses contradictoires selon les équipes"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Indicateurs non alignés avec la stratégie"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Modèles incompris ou mal interprétés"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Décisions prises \"parce que l''algorithme l''a dit\""}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"👉 La valeur de la Data Science dépend directement de la qualité de la gouvernance des données.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 2 créé';

    -- ========================================================================
    -- MODULE 3 : Gouvernance — Définition et organisation
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 3 : Gouvernance — Définition et organisation', 2);
    
    -- Item 3.1
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '3.1 Définition stratégique de la gouvernance', 'resource', 0, true,
     '{"description":"Comprendre ce qu''est la gouvernance des données au niveau direction."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'De quoi parle-t-on ?', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"📋 Définition stratégique"}]},{"type":"paragraph","content":[{"type":"text","text":"La gouvernance des données regroupe l''ensemble des "},{"type":"text","text":"règles, rôles et processus","marks":[{"type":"bold"}]},{"type":"text","text":" qui permettent de :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Définir quelles données sont stratégiques"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Garantir leur qualité et leur fiabilité"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Sécuriser leur accès et leur usage"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Organiser leur valorisation dans le temps"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Il ne s''agit pas d''un sujet IT, mais d''un sujet de pilotage au plus haut niveau.","marks":[{"type":"bold"}]}]}]}]}'::jsonb),
    (gen_random_uuid(), v_item_id, 'Gouverner ≠ Contrôler', 1, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"⚖️ Gouverner, ce n''est pas tout contrôler"}]},{"type":"paragraph","content":[{"type":"text","text":"Un malentendu fréquent consiste à penser que gouverner la donnée revient à :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ La restreindre"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ La bloquer"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ La centraliser excessivement"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ En réalité, une bonne gouvernance vise à :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Fluidifier l''usage"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Tout en encadrant les risques"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"La gouvernance doit trouver un équilibre entre : "},{"type":"text","text":"accessibilité","marks":[{"type":"bold"}]},{"type":"text","text":", "},{"type":"text","text":"sécurité","marks":[{"type":"bold"}]},{"type":"text","text":" et "},{"type":"text","text":"création de valeur","marks":[{"type":"bold"}]},{"type":"text","text":"."}]}]}'::jsonb);
    
    -- Item 3.2
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '3.2 Clarifier les responsabilités', 'resource', 1, true,
     '{"description":"Une donnée sans responsable est une donnée à risque."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Qui est responsable de quoi ?', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"👤 Clarifier les responsabilités"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"⚠️ Une donnée sans responsable est une donnée à risque.","marks":[{"type":"bold"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"La direction doit s''assurer que :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Chaque domaine de données a un responsable clairement identifié"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Les règles de création, modification et usage sont connues"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Les indicateurs stratégiques ont une définition unique et partagée"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 La question fondamentale"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Qui est responsable de quoi, et à quel niveau ?","marks":[{"type":"bold"},{"type":"italic"}]}]}]}]}'::jsonb);
    
    -- Item 3.3
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '3.3 Aligner les données avec la stratégie', 'resource', 2, true,
     '{"description":"Toutes les données ne se valent pas."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Prioriser les données critiques', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🎯 Aligner données et stratégie"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Toutes les données ne se valent pas.","marks":[{"type":"bold"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"La gouvernance impose de :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Distinguer les données critiques des données secondaires"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Prioriser celles qui impactent directement la performance"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Éviter la dispersion dans des indicateurs non stratégiques"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 La question à se poser"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"👉 Quels sont les indicateurs qui pilotent réellement notre activité ?","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 3 créé';

    -- ========================================================================
    -- MODULE 4 : Gouvernance — Sécurité
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 4 : Gouvernance — Sécurité', 3);
    
    -- Item 4.1
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '4.1 La sécurité comme condition de confiance', 'resource', 0, true,
     '{"description":"Sans sécurité, il n''y a ni confiance interne, ni confiance externe."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Encadrer les accès et usages', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🔒 La sécurité, condition de confiance"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Sans sécurité, il n''y a ni confiance interne, ni confiance externe.","marks":[{"type":"bold"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"La gouvernance doit encadrer :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"🔐 Les accès aux données sensibles"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Les usages autorisés et interdits"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"📋 La traçabilité des consultations et modifications"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 La sécurité n''est pas un frein à la valeur. Elle en est une condition préalable.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    -- Item 4.2
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '4.2 Les risques pour la direction', 'resource', 1, true,
     '{"description":"Les risques concrets d''une mauvaise gouvernance."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Risques multiples et durables', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"⚠️ Les risques pour la direction"}]},{"type":"paragraph","content":[{"type":"text","text":"Pour une direction, les risques liés à une mauvaise gouvernance sont multiples :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"⚖️ Risques juridiques et réglementaires"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"📰 Risques réputationnels"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"🤝 Perte de confiance des clients et partenaires"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ Décisions prises sur des données compromises"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Ces risques sont souvent systémiques et durables.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 4 créé';

    -- ========================================================================
    -- MODULE 5 : Gouvernance — Valorisation
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 5 : Gouvernance — Valorisation', 4);
    
    -- Item 5.1
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '5.1 Transformer la donnée en actif', 'resource', 0, true,
     '{"description":"Comment une donnée bien gouvernée devient un actif stratégique."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'La donnée comme actif', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"💎 Transformer la donnée en actif"}]},{"type":"paragraph","content":[{"type":"text","text":"Une donnée bien gouvernée devient :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"♻️ Réutilisable"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"📈 Cumulable"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"⏳ Exploitable sur le long terme"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"📊 Formes de valorisation"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Amélioration de la performance interne"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Création de nouveaux services"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Différenciation concurrentielle"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Appui à l''innovation et à l''IA"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 La gouvernance permet de passer d''une donnée subie à une donnée stratégique et exploitable.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    -- Item 5.2
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '5.2 Création de valeur durable', 'resource', 1, true,
     '{"description":"La gouvernance comme investissement stratégique."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Un investissement, pas une contrainte', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"📈 Création de valeur durable"}]},{"type":"paragraph","content":[{"type":"text","text":"Contrairement aux outils, la donnée :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Ne se déprécie pas si elle est bien entretenue"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Gagne en valeur avec le temps"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Constitue une barrière concurrentielle forte"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 La gouvernance est donc un investissement stratégique, et non une contrainte administrative.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    -- Item 5.3
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '5.3 Discussion et auto-évaluation', 'resource', 2, true,
     '{"description":"Questions de réflexion pour évaluer la maturité de gouvernance."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Questions de réflexion', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"💬 Discussion : évaluer vos pratiques"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Question 1 — État des lieux"}]},{"type":"paragraph","content":[{"type":"text","text":"Disposez-vous aujourd''hui :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"d''indicateurs stratégiques clairement définis ?"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"d''une responsabilité explicite sur les données critiques ?"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"de règles de sécurité comprises par les équipes ?"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Question 2 — Débat"}]},{"type":"paragraph","content":[{"type":"text","text":"Vaut-il mieux :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Beaucoup de données accessibles à tous ?"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Ou peu de données fiables, bien gouvernées et réellement utilisées ?"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Question 3 — Projection"}]},{"type":"paragraph","content":[{"type":"text","text":"Si vous deviez lancer un projet de Data Science demain :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Quelles données seraient réellement exploitables ?"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Quels freins organisationnels apparaîtraient immédiatement ?"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 5 créé';

    -- ========================================================================
    -- MODULE 6 : Exercices pratiques
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 6 : Exercices pratiques', 5);
    
    -- Exercice 6.1
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.1 Exercice — À quoi sert vraiment la Data Science ?', 'exercise', 0, true,
     '{"description":"Clarifier le rôle stratégique de la Data Science.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 1 — À quoi sert vraiment la Data Science ?"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🎯 Objectif"}]},{"type":"paragraph","content":[{"type":"text","text":"Clarifier le rôle stratégique de la Data Science, au-delà de la technique."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"📋 Mise en situation"}]},{"type":"paragraph","content":[{"type":"text","text":"En tant que membre d''une direction, vous devez expliquer à un comité exécutif à quoi sert réellement la Data Science, sans utiliser de termes techniques."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Travail demandé"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Complétez la phrase : \"La Data Science permet à la direction de...\""}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Citez 2 décisions stratégiques que la Data Science peut aider à éclairer"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Identifiez 1 limite de la Data Science sans gouvernance"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"1. Définition attendue"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Réduire l''incertitude dans la prise de décision"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Objectiver des situations complexes"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Anticiper des évolutions probables"}]}]}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"2. Décisions stratégiques typiques"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Allocation des ressources"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Priorisation des investissements"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Anticipation des risques"}]}]}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"3. Limite clé sans gouvernance"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Analyses contradictoires"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Perte de confiance dans les chiffres"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 La Data Science n''a de valeur que si elle sert une décision stratégique claire.","marks":[{"type":"bold"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","xlsx"],"max_file_size_mb":10}'::jsonb);
    
    -- Exercice 6.2
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.2 Exercice — Gouverner la donnée : qui fait quoi ?', 'exercise', 1, true,
     '{"description":"Comprendre que la gouvernance est avant tout organisationnelle.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 2 — Gouverner la donnée : qui fait quoi ?"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🎯 Objectif"}]},{"type":"paragraph","content":[{"type":"text","text":"Comprendre que la gouvernance est avant tout organisationnelle."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"📋 Mise en situation"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Une donnée sans responsable est une donnée à risque.","marks":[{"type":"bold"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Travail demandé"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Listez 3 types de données critiques pour votre organisation"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Pour chacune, indiquez : qui devrait en être responsable + pourquoi"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Que se passe-t-il si ce rôle n''est pas clairement défini ?"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Exemples de données critiques"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Données clients, financières, opérationnelles, RH"}]}]}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Responsabilités attendues"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Un responsable métier, pas uniquement IT"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Garant de la qualité et de l''usage"}]}]}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Conséquences d''absence"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Données incohérentes, conflits entre services"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Gouverner la donnée, c''est désigner des responsables, pas installer des outils.","marks":[{"type":"bold"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","xlsx"],"max_file_size_mb":10}'::jsonb);
    
    -- Exercice 6.3
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.3 Exercice — Sécurité : contrainte ou condition de valeur ?', 'exercise', 2, true,
     '{"description":"Repositionner la sécurité comme levier de confiance.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 3 — Sécurité : contrainte ou condition de valeur ?"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🎯 Objectif"}]},{"type":"paragraph","content":[{"type":"text","text":"Repositionner la sécurité comme levier de confiance, pas comme frein."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Travail demandé"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Citez 2 risques majeurs liés à une mauvaise gouvernance de la sécurité"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Expliquez l''impact de ces risques pour la direction"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Indiquez une règle simple de gouvernance pour réduire ces risques"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Risques majeurs"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Risque juridique, atteinte à la réputation, perte de confiance"}]}]}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Règles simples"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Accès par rôle, traçabilité des accès, séparation des données"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Sans sécurité, il n''y a ni confiance, ni valeur durable.","marks":[{"type":"bold"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","xlsx"],"max_file_size_mb":10}'::jsonb);
    
    -- Exercice 6.4
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.4 Exercice — Valorisation : quand la donnée devient un actif', 'exercise', 3, true,
     '{"description":"Comprendre comment la gouvernance permet la création de valeur.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 4 — Valorisation : quand la donnée devient un actif"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🎯 Objectif"}]},{"type":"paragraph","content":[{"type":"text","text":"Comprendre comment la gouvernance permet la création de valeur durable."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Travail demandé"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Donnez 2 exemples de valorisation interne de la donnée"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Donnez 1 exemple de valorisation externe"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Identifiez le principal risque si la gouvernance est absente"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Valorisation interne"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Optimisation des processus, amélioration de la performance"}]}]}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Valorisation externe"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Services à valeur ajoutée, offres personnalisées"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 La donnée n''est un actif que si elle est fiable, sécurisée et gouvernée.","marks":[{"type":"bold"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","xlsx","pptx"],"max_file_size_mb":15}'::jsonb);
    
    -- Exercice 6.5
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.5 Exercice — Évaluer la maturité de gouvernance', 'exercise', 4, true,
     '{"description":"Auto-évaluation de la maturité de gouvernance.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 5 — Évaluer la maturité de gouvernance"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🎯 Objectif"}]},{"type":"paragraph","content":[{"type":"text","text":"Amener la direction à une auto-évaluation lucide."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Travail demandé"}]},{"type":"paragraph","content":[{"type":"text","text":"Pour chaque affirmation, indiquez : Oui / Partiellement / Non","marks":[{"type":"bold"}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Nos indicateurs stratégiques sont clairement définis"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Les responsabilités sur les données sont explicites"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Les règles de sécurité sont comprises et appliquées"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"La donnée est utilisée pour décider, pas seulement pour reporter"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"Puis répondez : Quelle est la priorité absolue à traiter dans les 6 prochains mois ?"}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Lecture attendue"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Beaucoup de \"Partiellement\" = maturité intermédiaire"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Priorité = organisationnelle, pas technologique"}]}]}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Priorités typiques"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Clarification des indicateurs clés"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Désignation des responsables de données"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Acculturation managériale à la donnée"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 La gouvernance des données commence par une prise de conscience collective.","marks":[{"type":"bold"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","pptx"],"max_file_size_mb":10}'::jsonb);
    
    RAISE NOTICE '✅ Module 6 (Exercices) créé';
    RAISE NOTICE '✅✅✅ Cours "Data Science et Gouvernance" importé avec succès!';
    RAISE NOTICE 'Course ID: %', v_course_id;
END $$;

-- Vérification finale
SELECT 
    c.title as cours,
    m.title as module,
    COUNT(i.id) as items
FROM courses c
JOIN modules m ON m.course_id = c.id
JOIN items i ON i.module_id = m.id
WHERE c.title LIKE '%Data Science%gouvernance%'
GROUP BY c.title, m.title, m.position
ORDER BY m.position;
