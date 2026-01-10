-- ============================================================================
-- Script COMPLET pour nettoyer et recréer le Module 6 avec DataLogis
-- Les exercices 6.1-6.5 sont de type "exercise" avec correction intégrée
-- La correction s'affiche après soumission (voir modification ItemRenderer.tsx)
-- ============================================================================

-- Étape 1: Nettoyer le module 6 existant
DO $$
DECLARE
    v_course_id UUID := '959bbf27-f738-4965-9419-9b45a6dff455';
    v_module_id UUID;
    v_item_ids UUID[];
BEGIN
    -- Trouver le module 6
    SELECT id INTO v_module_id 
    FROM modules 
    WHERE course_id = v_course_id AND (title LIKE '%Module 6%' OR position = 5)
    LIMIT 1;
    
    IF v_module_id IS NOT NULL THEN
        -- Récupérer tous les IDs des items
        SELECT array_agg(id) INTO v_item_ids FROM items WHERE module_id = v_module_id;
        
        IF v_item_ids IS NOT NULL THEN
            DELETE FROM chapters WHERE item_id = ANY(v_item_ids);
            DELETE FROM items WHERE module_id = v_module_id;
            RAISE NOTICE 'Module 6 nettoyé';
        END IF;
    ELSE
        -- Créer le module 6 s'il n'existe pas
        INSERT INTO modules (id, course_id, title, position, theme)
        VALUES (
            gen_random_uuid(),
            v_course_id,
            'Module 6 : Exercices pratiques — Mise en application',
            5,
            '{"primaryColor": "#10B981", "secondaryColor": "#059669"}'::jsonb
        )
        RETURNING id INTO v_module_id;
        RAISE NOTICE 'Module 6 créé: %', v_module_id;
    END IF;
END $$;

-- Étape 2: Recréer les items
DO $$
DECLARE
    v_course_id UUID := '959bbf27-f738-4965-9419-9b45a6dff455';
    v_module_id UUID;
    v_item_id UUID;
BEGIN
    SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND position = 5;
    
    -- 6.0 Présentation DataLogis (type = resource)
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.0 Présentation des données — DataLogis', 'resource', 0, true,
     '{"description":"Datasets pour les exercices pratiques : clients, commandes, opérations."}'::jsonb);
    
    INSERT INTO chapters (id, item_id, title, position, published, content) VALUES
    (gen_random_uuid(), v_item_id, 'Présentation de DataLogis', 0, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"🏢 DataLogis — Votre terrain d''exercice"}]},{"type":"paragraph","content":[{"type":"text","text":"Entreprise fictive de logistique e-commerce. 270 employés, 3 entrepôts (Paris-Nord, Lyon-Est, Marseille-Sud), ~300 000 colis/mois."}]}]}'::jsonb),
    (gen_random_uuid(), v_item_id, 'Accès aux données', 1, true,
     '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"📥 Télécharger les données"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"📊 Fichiers CSV"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"clients.csv","marks":[{"type":"link","attrs":{"href":"/datasets/datalogis/clients.csv","target":"_blank"}}]},{"type":"text","text":" — Données clients"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"commandes.csv","marks":[{"type":"link","attrs":{"href":"/datasets/datalogis/commandes.csv","target":"_blank"}}]},{"type":"text","text":" — Historique commandes"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"operations.csv","marks":[{"type":"link","attrs":{"href":"/datasets/datalogis/operations.csv","target":"_blank"}}]},{"type":"text","text":" — KPIs entrepôts"}]}]}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"📦 Fichiers JSON"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"clients.json","marks":[{"type":"link","attrs":{"href":"/datasets/datalogis/clients.json","target":"_blank"}}]},{"type":"text","text":" — Données clients"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"commandes.json","marks":[{"type":"link","attrs":{"href":"/datasets/datalogis/commandes.json","target":"_blank"}}]},{"type":"text","text":" — Historique commandes"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"operations.json","marks":[{"type":"link","attrs":{"href":"/datasets/datalogis/operations.json","target":"_blank"}}]},{"type":"text","text":" — KPIs entrepôts"}]}]}]}]}'::jsonb);
    
    RAISE NOTICE '✅ 6.0 créé';

    -- 6.1 Exercice (type = exercise) - Question contient l'énoncé complet
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.1 Exercice — Identifier les opportunités réelles de la donnée', 'exercise', 1, true,
     '{"description":"Comprendre où la donnée crée de la valeur.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 1 — Identifier les opportunités"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🎯 Objectif"}]},{"type":"paragraph","content":[{"type":"text","text":"Comprendre où la donnée crée de la valeur."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"📋 Mise en situation"}]},{"type":"paragraph","content":[{"type":"text","text":"Vous êtes membre du comité de direction de DataLogis."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Travail demandé"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Lister 3 types de données existantes"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Pour chaque type : ce qu''elle décrit + quelle décision elle améliore"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Classer par impact : fort / moyen / faible"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Données clients → fidélisation, ciblage, pricing"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Données opérationnelles → optimisation, qualité"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"📌 Une donnée n''a de valeur que si elle éclaire une décision concrète.","marks":[{"type":"bold"}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","xlsx"],"max_file_size_mb":10}'::jsonb);
    -- Pas de chapitre pour les exercices (tout dans question)
    
    RAISE NOTICE '✅ 6.1 créé';

    -- 6.2 Exercice - Énoncé complet dans question, pas de chapitre
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.2 Exercice — Avant / Après : transformer une décision', 'exercise', 2, true,
     '{"description":"Visualiser le changement de posture décisionnelle.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 2 — Avant / Après"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"📋 Mise en situation"}]},{"type":"paragraph","content":[{"type":"text","text":"Chez DataLogis, comparez comment l''allocation des ressources était décidée avant et maintenant."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Travail demandé"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Décrire la décision choisie"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Sur quoi reposait la décision avant ?"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Quels indicateurs existent aujourd''hui ?"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"La donnée réduit-elle le risque ou le déplace-t-elle ?"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Avant : intuition + reporting ponctuel","marks":[{"type":"bold"}]}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Aujourd''hui : indicateurs continus + scénarios","marks":[{"type":"bold"}]}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"📌 La donnée ne supprime pas le risque : elle le déplace.","marks":[{"type":"bold"}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","xlsx"],"max_file_size_mb":10}'::jsonb);
    
    RAISE NOTICE '✅ 6.2 créé';

    -- 6.3 Exercice
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.3 Exercice — Identifier les défis critiques', 'exercise', 3, true,
     '{"description":"Prendre conscience des risques non techniques.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 3 — Défis critiques"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"📋 Mise en situation"}]},{"type":"paragraph","content":[{"type":"text","text":"En analysant les alertes et écarts de performance DataLogis, identifiez les défis data."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Travail demandé"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Sélectionner 3 défis critiques"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Expliquer le risque + conséquences si non traité"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Proposer 1 mesure de réduction par défi"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Trop d''indicateurs → paralysie"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Fiabilité douteuse → décisions biaisées"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"📌 Le danger n''est pas d''avoir peu de données, mais de décider sur une mauvaise donnée.","marks":[{"type":"bold"}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","xlsx"],"max_file_size_mb":10}'::jsonb);
    
    RAISE NOTICE '✅ 6.3 créé';

    -- 6.4 Exercice
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.4 Exercice — Modèle économique basé sur la donnée', 'exercise', 4, true,
     '{"description":"Raisonner en business model, pas en technologie.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 4 — Business model"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"📋 Mise en situation"}]},{"type":"paragraph","content":[{"type":"text","text":"DataLogis dispose de riches données. Imaginez 2 évolutions de son business model."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Travail demandé"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Évolution prudente : valeur client + valeur entreprise + risque"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Évolution disruptive : valeur client + valeur entreprise + risque"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Conclusion : optimise ou transforme le modèle ?"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"paragraph","content":[{"type":"text","text":"Prudente : services complémentaires → abonnement","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Disruptive : facturation à l''usage, as-a-service","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"📌 La donnée peut optimiser un modèle… ou le transformer.","marks":[{"type":"bold"}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","pptx","xlsx"],"max_file_size_mb":15}'::jsonb);
    
    RAISE NOTICE '✅ 6.4 créé';

    -- 6.5 Exercice
    v_item_id := gen_random_uuid();
    INSERT INTO items (id, module_id, title, type, position, published, content) VALUES
    (v_item_id, v_module_id, '6.5 Exercice — Arbitrage stratégique : opportunité ou illusion ?', 'exercise', 5, true,
     '{"description":"Former le jugement stratégique face aux projets data.","question":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Exercice 5 — Arbitrage stratégique"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"📋 Mise en situation"}]},{"type":"paragraph","content":[{"type":"text","text":"Le DSI propose d''investir 500K€ dans un projet d''IA prédictive pour anticiper les retards."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"✅ Travail demandé"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Citer 1 décision non automatisable (rare, humaine, politique)"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Citer 1 décision automatisable (stable, fréquente)"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Choisir 1 indicateur prioritaire pour la direction"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Conclusion : aide à décider ou alibi ?"}]}]}]}]},"correction":{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"🔑 Corrigé"}]},{"type":"paragraph","content":[{"type":"text","text":"Non automatisable : décisions rares (restructuration, crise)","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Automatisable : décisions fréquentes (priorisation, scoring)","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"📌 La donnée n''est pas une excuse pour ne pas décider : elle aide à assumer.","marks":[{"type":"bold"}]}]}]},"allow_file_upload":true,"file_types":["pdf","docx","pptx"],"max_file_size_mb":10}'::jsonb);
    
    RAISE NOTICE '✅ 6.5 créé';
    RAISE NOTICE '✅✅✅ Module 6 complet recréé avec 6 items!';
END $$;

-- Vérification
SELECT 
    i.title,
    i.type,
    i.position,
    (SELECT COUNT(*) FROM chapters c WHERE c.item_id = i.id) as chapitres
FROM items i
JOIN modules m ON m.id = i.module_id
WHERE m.position = 5
ORDER BY i.position;
