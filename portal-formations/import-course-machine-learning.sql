-- ============================================================================
-- Script d'importation du cours "Machine Learning et Deep Learning"
-- Concepts et applications (3h) - Public : Décideurs / Directions
-- ============================================================================

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
        'Machine Learning et Deep Learning : concepts et applications',
        'Introduction aux technologies et algorithmes principaux. Applications : prédictions, recommandations, personnalisation. Cours orienté décideurs (3h), sans dérive technique.',
        'published',
        'free',
        v_admin_id,
        NOW()
    );
    
    RAISE NOTICE '✅ Cours ML créé: %', v_course_id;

    -- ========================================================================
    -- MODULE 1 : Introduction
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 1 : Introduction — Le Machine Learning pour les décideurs', 0);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '1.1 Positionnement du module', 'resource', 0, true,
     '{"description":"Contexte et objectifs du module Machine Learning."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Après la gouvernance, l''automatisation', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🎯 Positionnement du module"}]},{"type":"paragraph","content":[{"type":"text","text":"Après avoir compris pourquoi la donnée est un actif stratégique, comment elle transforme la décision, et pourquoi la gouvernance est indispensable, une question naturelle se pose :"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Que permet concrètement le Machine Learning, et dans quels cas crée-t-il réellement de la valeur ?","marks":[{"type":"bold"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le Machine Learning n''est ni de la magie, ni une automatisation universelle. C''est un levier puissant, mais conditionné par la nature des décisions à automatiser."}]}]}'::jsonb),
    (gen_random_uuid(), v_item_id, 'Objectif du module', 1, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"💡 Objectif du module"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Ce module vise à donner aux décideurs une compréhension claire, réaliste et exploitable du Machine Learning et du Deep Learning.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 1 créé';

    -- ========================================================================
    -- MODULE 2 : Ce qu'est le ML
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 2 : Ce qu''est réellement le Machine Learning', 1);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '2.1 Définition simple et opérationnelle', 'resource', 0, true,
     '{"description":"Comprendre le Machine Learning sans jargon technique."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Le ML en une phrase', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"📋 Définition simple"}]},{"type":"paragraph","content":[{"type":"text","text":"Le Machine Learning est une approche qui permet à un système informatique d''apprendre à partir de données passées, d''identifier des régularités, et de reproduire automatiquement des décisions fréquentes et répétitives."}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Contrairement à un programme classique, on ne décrit pas toutes les règles à l''avance : on fournit des exemples, et le système apprend les règles implicites.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '2.2 Ce que le Machine Learning n''est pas', 'resource', 1, true,
     '{"description":"Éviter les malentendus sur les capacités du ML."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Les limites fondamentales', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🚫 Ce que le ML n''est pas"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ ne remplace pas la stratégie"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ ne comprend pas le contexte humain ou politique"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ ne prend pas de décisions rares ou exceptionnelles"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"❌ ne fonctionne pas sans données fiables et gouvernées"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"👉 Le ML est pertinent uniquement pour des décisions fréquentes, répétitives et stables.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 2 créé';

    -- ========================================================================
    -- MODULE 3 : Les 3 types d'applications
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 3 : Les trois grands types d''applications', 2);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '3.1 Prédire : anticiper ce qui va se produire', 'resource', 0, true,
     '{"description":"La prédiction, première application du ML."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'La prédiction', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🔮 Prédire"}]},{"type":"paragraph","content":[{"type":"text","text":"La prédiction consiste à estimer un événement futur à partir de données passées.","marks":[{"type":"bold"}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Prévoir une demande future"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Anticiper un risque de défaillance"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Estimer une probabilité (churn, défaut, incident)"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"👉 Intérêt direction : agir avant que le problème ne survienne.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '3.2 Recommander : proposer la meilleure option', 'resource', 1, true,
     '{"description":"Les systèmes de recommandation."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'La recommandation', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🎯 Recommander"}]},{"type":"paragraph","content":[{"type":"text","text":"Les systèmes de recommandation répondent à : Parmi plusieurs options, laquelle est la plus pertinente pour ce contexte précis ?"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Proposer un produit adapté"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Prioriser des actions ou dossiers"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Recommander un contenu ou une offre"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 La recommandation permet de scaler une expertise humaine à grande échelle.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '3.3 Personnaliser : adapter à chaque situation', 'resource', 2, true,
     '{"description":"La personnalisation par le ML."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'La personnalisation', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"👤 Personnaliser"}]},{"type":"paragraph","content":[{"type":"text","text":"La personnalisation consiste à adapter un message, une offre, un parcours ou un service en fonction du profil, du comportement ou du contexte."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"💡 Intérêt direction"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Augmenter la valeur perçue"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Améliorer l''expérience client"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Sans augmenter proportionnellement les coûts"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 3 créé';

    -- ========================================================================
    -- MODULE 4 : Familles d'algorithmes
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 4 : Les grandes familles d''algorithmes', 3);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '4.1 Algorithmes de classification', 'resource', 0, true,
     '{"description":"Répondre à : À quelle catégorie appartient cet élément ?"}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Classification', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🏷️ Classification"}]},{"type":"paragraph","content":[{"type":"text","text":"Ils répondent à : À quelle catégorie appartient cet élément ?"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Client à risque / non à risque"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Dossier prioritaire / non prioritaire"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Email urgent / standard"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Algorithmes les plus utilisés en entreprise : décisions binaires très fréquentes.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '4.2 Algorithmes de régression', 'resource', 1, true,
     '{"description":"Estimer une valeur continue."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Régression', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"📈 Régression"}]},{"type":"paragraph","content":[{"type":"text","text":"Ils cherchent à estimer une valeur continue.","marks":[{"type":"bold"}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Chiffre d''affaires prévisionnel"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Durée estimée"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Coût probable"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Au cœur des outils de pilotage et de prévision.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '4.3 Algorithmes de regroupement (clustering)', 'resource', 2, true,
     '{"description":"Identifier des groupes similaires."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Clustering', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🔍 Regroupement (clustering)"}]},{"type":"paragraph","content":[{"type":"text","text":"Ils permettent d''identifier des groupes similaires sans règle prédéfinie.","marks":[{"type":"bold"}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Segmentation clients"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Regroupement de comportements"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Détection de profils atypiques"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Souvent utilisés en amont de la stratégie, pour mieux comprendre une population.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 4 créé';

    -- ========================================================================
    -- MODULE 5 : Deep Learning
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 5 : Deep Learning — Quand et pourquoi ?', 4);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '5.1 Différence avec le ML classique', 'resource', 0, true,
     '{"description":"Comprendre ce qui distingue le Deep Learning."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Deep Learning vs ML', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🧠 Deep Learning : différence fondamentale"}]},{"type":"paragraph","content":[{"type":"text","text":"Le Deep Learning est une sous-catégorie du ML, adaptée aux données complexes et volumineuses :","marks":[{"type":"bold"}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"🖼️ Images"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"📝 Texte"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"🔊 Audio"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"🎬 Vidéo"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"⚠️ Il nécessite :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Beaucoup de données"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Plus de puissance de calcul"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Moins d''interprétabilité"}]}]}]}]}'::jsonb);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '5.2 Quand le Deep Learning est pertinent', 'resource', 1, true,
     '{"description":"Identifier les cas d''usage légitimes du Deep Learning."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Critères de pertinence', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"✅ Quand le Deep Learning est pertinent"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Les règles sont impossibles à formaliser"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"La donnée est riche mais non structurée"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"La performance prime sur l''explicabilité"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"👉 Le Deep Learning ne remplace pas le ML classique, il le complète dans des cas spécifiques.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 5 créé';

    -- ========================================================================
    -- MODULE 6 : Intégration SI
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 6 : Intégration dans le système d''information', 5);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.1 Le ML n''est jamais isolé', 'resource', 0, true,
     '{"description":"Un modèle non utilisé est un modèle inutile."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Intégration obligatoire', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🔗 Le ML n''est jamais isolé"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Un projet de ML n''a aucune valeur seul.","marks":[{"type":"bold"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il doit être :"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Intégré aux outils existants"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Connecté aux processus métiers"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"✅ Piloté par des indicateurs clairs"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Un modèle non utilisé est un modèle inutile.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.2 Le cycle réel d''un projet ML', 'resource', 1, true,
     '{"description":"Les 6 étapes d''un projet ML vu de la direction."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Les 6 étapes', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🔄 Le cycle réel dans un SI"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Identification d''une décision répétitive"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Collecte et préparation des données"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Entraînement d''un modèle"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Intégration dans le SI"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Suivi des performances"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Ajustements continus"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"👉 Le plus coûteux n''est pas l''algorithme, mais l''intégration et la maintenance dans le temps.","marks":[{"type":"bold"}]}]}]}]}'::jsonb);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.3 Études de cas', 'resource', 2, true,
     '{"description":"Cas concrets de prédiction, recommandation et personnalisation."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Cas prédiction', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🔮 Cas prédiction"}]},{"type":"paragraph","content":[{"type":"text","text":"Une organisation anticipe des pannes, retards, risques clients."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Résultat"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Réduction des coûts"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Amélioration de la qualité"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Meilleure allocation des ressources"}]}]}]}]}'::jsonb),
    (gen_random_uuid(), v_item_id, 'Cas recommandation', 1, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🎯 Cas recommandation"}]},{"type":"paragraph","content":[{"type":"text","text":"Un système priorise automatiquement des dossiers, actions commerciales, demandes clients."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Résultat"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Gain de temps"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Homogénéité des décisions"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Montée en qualité globale"}]}]}]}]}'::jsonb),
    (gen_random_uuid(), v_item_id, 'Cas personnalisation', 2, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"👤 Cas personnalisation"}]},{"type":"paragraph","content":[{"type":"text","text":"L''entreprise adapte ses offres, messages, parcours utilisateurs."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Résultat"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Meilleure conversion"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Fidélisation accrue"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Avantage concurrentiel durable"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ Module 6 créé';

    -- ========================================================================
    -- MODULE 7 : Exercices
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 7 : Exercices pratiques', 6);
    
    -- Exercice 7.1
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '7.1 Le ML est-il pertinent ici ?', 'exercise', 0, true,
     '{"description":"Identifier les bons cas d''usage du ML.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 1 — Le ML est-il pertinent ici ?"}]},{"type":"paragraph","content":[{"type":"text","text":"Pour chaque décision, indiquez si le ML est : pertinent / peu pertinent / non pertinent. Justifiez.","marks":[{"type":"bold"}]}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Valider un licenciement pour faute grave"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Prioriser automatiquement des demandes clients"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Anticiper une rupture de stock"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Décider d''une fusion-acquisition"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Détecter des emails urgents"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Licenciement → ❌ Non pertinent"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Priorisation → ✅ Pertinent"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Rupture stock → ✅ Pertinent"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Fusion → ❌ Non pertinent"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Emails urgents → ✅ Pertinent"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Le ML automatise des décisions fréquentes, pas des choix stratégiques uniques.","marks":[{"type":"bold"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx"],"max_file_size_mb":10}'::jsonb);
    
    -- Exercice 7.2
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '7.2 Prédiction, recommandation ou personnalisation ?', 'exercise', 1, true,
     '{"description":"Comprendre les 3 grands types d''applications ML.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 2 — Prédiction, recommandation ou personnalisation ?"}]},{"type":"paragraph","content":[{"type":"text","text":"Associez chaque situation au bon type.","marks":[{"type":"bold"}]}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Estimer le risque de départ d''un client"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Proposer un produit complémentaire"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Adapter un parcours utilisateur"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Prévoir un délai de livraison"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Prioriser des actions commerciales"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Risque départ → Prédiction"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Produit complémentaire → Recommandation"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Parcours utilisateur → Personnalisation"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Délai livraison → Prédiction"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Actions commerciales → Recommandation"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx"],"max_file_size_mb":10}'::jsonb);
    
    -- Exercice 7.3
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '7.3 Choisir le bon type d''algorithme', 'exercise', 2, true,
     '{"description":"Identifier la famille d''algorithmes adaptée.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 3 — Choisir le bon type d''algorithme"}]},{"type":"paragraph","content":[{"type":"text","text":"Pour chaque objectif, indiquez : Classification / Régression / Regroupement","marks":[{"type":"bold"}]}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Identifier les clients à risque"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Estimer un CA futur"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Segmenter une base clients"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Classer des tickets support"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Estimer une durée moyenne"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Clients à risque → Classification"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"CA futur → Régression"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Segmentation → Regroupement"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Tickets support → Classification"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Durée moyenne → Régression"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Le choix dépend de la question métier, pas de la technologie.","marks":[{"type":"bold"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx"],"max_file_size_mb":10}'::jsonb);
    
    -- Exercice 7.4
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '7.4 Machine Learning ou Deep Learning ?', 'exercise', 3, true,
     '{"description":"Comprendre quand le Deep Learning est justifié.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 4 — ML ou Deep Learning ?"}]},{"type":"paragraph","content":[{"type":"text","text":"Pour chaque cas, indiquez : ML classique ou Deep Learning","marks":[{"type":"bold"}]}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Analyse d''images médicales"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Scoring client sur données tabulaires"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Reconnaissance vocale"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Prévision de ventes"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Analyse automatique de documents texte"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Images médicales → Deep Learning"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Scoring client → ML classique"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Reconnaissance vocale → Deep Learning"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Prévision ventes → ML classique"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Analyse texte → Deep Learning"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Le Deep Learning est un outil spécialisé, pas universel.","marks":[{"type":"bold"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx"],"max_file_size_mb":10}'::jsonb);
    
    -- Exercice 7.5
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '7.5 Intégration SI : où est la vraie difficulté ?', 'exercise', 4, true,
     '{"description":"Identifier les enjeux réels d''intégration.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 5 — Intégration SI"}]},{"type":"paragraph","content":[{"type":"text","text":"Classez par ordre de difficulté (du plus simple au plus complexe) :","marks":[{"type":"bold"}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Entraîner un modèle"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Collecter des données fiables"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Intégrer le modèle dans les processus métiers"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Suivre les performances dans le temps"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Entraîner un modèle"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Collecter des données fiables"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Intégrer dans les processus"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Suivre et maintenir dans le temps"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Le coût réel du ML est dans la durée, pas dans l''algorithme.","marks":[{"type":"bold"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx"],"max_file_size_mb":10}'::jsonb);
    
    RAISE NOTICE '✅ Module 7 (Exercices) créé';

    -- ========================================================================
    -- MODULE 8 : TP
    -- ========================================================================
    v_module_id := gen_random_uuid();
    INSERT INTO modules (id, course_id, title, position) VALUES
    (v_module_id, v_course_id, 'Module 8 : TP — Décider quoi automatiser', 7);
    
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '8.1 TP — Identifier et qualifier des décisions automatisables', 'tp', 0, true,
     '{"description":"TP progressif SANS CODE pour raisonner en cas d''usage ML.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"TP — Décider quoi automatiser avec le ML"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🎯 Objectif"}]},{"type":"paragraph","content":[{"type":"text","text":"Raisonner en cas d''usage ML, identifier les décisions automatisables, comprendre les impacts organisationnels — sans écrire de code."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Étape 1 — Identifier"}]},{"type":"paragraph","content":[{"type":"text","text":"Listez 5 décisions prises régulièrement dans votre organisation."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Étape 2 — Qualifier"}]},{"type":"paragraph","content":[{"type":"text","text":"Pour chaque décision : Est-elle fréquente ? Règles stables ? Données historiques ? Erreur acceptable ?"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Étape 3 — Typer"}]},{"type":"paragraph","content":[{"type":"text","text":"Associez chaque décision à : Prédiction / Recommandation / Personnalisation"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Étape 4 — Intégrer"}]},{"type":"paragraph","content":[{"type":"text","text":"Décrivez où et comment la décision s''intègre dans le SI."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Étape 5 — Gouverner"}]},{"type":"paragraph","content":[{"type":"text","text":"Identifiez 1 risque majeur + 1 règle de gouvernance associée."}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Attendus"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Étapes 1-2 : Seules les décisions avec 4 \"oui\" sont candidates"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Étape 4 : Intégration dans outil existant, décision assistée, contrôle humain"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Étape 5 : Biais → contrôle régulier, Dérive → suivi performances"}]}]}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"📌 Le ML n''est pas une question de technologie, mais de choix organisationnels et stratégiques.","marks":[{"type":"bold"}]}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","xlsx","pptx"],"max_file_size_mb":20}'::jsonb);
    
    RAISE NOTICE '✅ Module 8 (TP) créé';
    RAISE NOTICE '✅✅✅ Cours "Machine Learning et Deep Learning" importé avec succès!';
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
WHERE c.title LIKE '%Machine Learning%'
GROUP BY c.title, m.title, m.position
ORDER BY m.position;
