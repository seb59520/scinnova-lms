-- ============================================================================
-- Script d'ajout de slides : Transforme les métadonnées des modules en slides
-- ============================================================================
-- Ce script ajoute des slides pour chaque module existant qui contient des métadonnées
-- Les slides sont créées à partir des informations (finalité, compétences, contenus, livrables)
--
-- IMPORTANT: Ce script doit être exécuté APRÈS create-course-api-performantes-securisees.sql
-- Il recherche les items de type 'resource' avec le titre 'Métadonnées du module M*'
-- et crée des slides correspondantes
-- ============================================================================

DO $$
DECLARE
  -- Variables pour stocker les IDs
  module_rec RECORD;
  metadata_item RECORD;
  slide_content JSONB;
  slide_body_content JSONB := '[]'::jsonb;
  competences_list JSONB;
  contenus_list JSONB;
  livrables_list JSONB;
  slide_item_id UUID;
  position_counter INTEGER;
BEGIN
  -- Parcourir tous les modules qui ont un item de métadonnées
  FOR module_rec IN 
    SELECT m.id as module_id, m.title as module_title, m.position as module_position
    FROM modules m
    WHERE EXISTS (
      SELECT 1 FROM items i 
      WHERE i.module_id = m.id 
      AND i.title LIKE 'Métadonnées du module M%'
    )
    ORDER BY m.position
  LOOP
    -- Récupérer l'item de métadonnées
    SELECT i.id, i.content INTO metadata_item
    FROM items i
    WHERE i.module_id = module_rec.module_id
      AND i.title LIKE 'Métadonnées du module M%'
    LIMIT 1;
    
    IF metadata_item.id IS NOT NULL THEN
      -- Extraire les données des métadonnées
      competences_list := metadata_item.content->'competences';
      contenus_list := metadata_item.content->'contenus';
      livrables_list := metadata_item.content->'livrables';
      
      -- Construire le contenu de la slide au format TipTap
      -- On utilise jsonb_agg pour construire le tableau final
      slide_body_content := (
        SELECT jsonb_agg(elem)
        FROM (
          -- Titre principal
          SELECT jsonb_build_object(
            'type', 'heading',
            'attrs', jsonb_build_object('level', 1),
            'content', jsonb_build_array(
              jsonb_build_object(
                'type', 'text',
                'text', COALESCE(metadata_item.content->>'module_id', '') || ' - ' || module_rec.module_title
              )
            )
          ) as elem
          
          UNION ALL
          
          -- Section Finalité (si présente)
          SELECT jsonb_build_object(
            'type', 'heading',
            'attrs', jsonb_build_object('level', 2),
            'content', jsonb_build_array(
              jsonb_build_object('type', 'text', 'text', 'Finalité')
            )
          )
          WHERE metadata_item.content->>'finalite' IS NOT NULL
          
          UNION ALL
          
          SELECT jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(
              jsonb_build_object(
                'type', 'text',
                'text', metadata_item.content->>'finalite'
              )
            )
          )
          WHERE metadata_item.content->>'finalite' IS NOT NULL
          
          UNION ALL
          
          -- Section Compétences (si présente)
          SELECT jsonb_build_object(
            'type', 'heading',
            'attrs', jsonb_build_object('level', 2),
            'content', jsonb_build_array(
              jsonb_build_object('type', 'text', 'text', 'Compétences visées')
            )
          )
          WHERE competences_list IS NOT NULL AND jsonb_array_length(competences_list) > 0
          
          UNION ALL
          
          SELECT jsonb_build_object(
            'type', 'bulletList',
            'content', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'type', 'listItem',
                  'content', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'paragraph',
                      'content', jsonb_build_array(
                        jsonb_build_object('type', 'text', 'text', value::text)
                      )
                    )
                  )
                )
              )
              FROM jsonb_array_elements_text(competences_list)
            )
          )
          WHERE competences_list IS NOT NULL AND jsonb_array_length(competences_list) > 0
          
          UNION ALL
          
          -- Section Contenus (si présente)
          SELECT jsonb_build_object(
            'type', 'heading',
            'attrs', jsonb_build_object('level', 2),
            'content', jsonb_build_array(
              jsonb_build_object('type', 'text', 'text', 'Contenus abordés')
            )
          )
          WHERE contenus_list IS NOT NULL AND jsonb_array_length(contenus_list) > 0
          
          UNION ALL
          
          SELECT jsonb_build_object(
            'type', 'bulletList',
            'content', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'type', 'listItem',
                  'content', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'paragraph',
                      'content', jsonb_build_array(
                        jsonb_build_object('type', 'text', 'text', value::text)
                      )
                    )
                  )
                )
              )
              FROM jsonb_array_elements_text(contenus_list)
            )
          )
          WHERE contenus_list IS NOT NULL AND jsonb_array_length(contenus_list) > 0
          
          UNION ALL
          
          -- Section Livrables (si présente)
          SELECT jsonb_build_object(
            'type', 'heading',
            'attrs', jsonb_build_object('level', 2),
            'content', jsonb_build_array(
              jsonb_build_object('type', 'text', 'text', 'Livrables attendus')
            )
          )
          WHERE livrables_list IS NOT NULL AND jsonb_array_length(livrables_list) > 0
          
          UNION ALL
          
          SELECT jsonb_build_object(
            'type', 'bulletList',
            'content', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'type', 'listItem',
                  'content', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'paragraph',
                      'content', jsonb_build_array(
                        jsonb_build_object('type', 'text', 'text', value::text)
                      )
                    )
                  )
                )
              )
              FROM jsonb_array_elements_text(livrables_list)
            )
          )
          WHERE livrables_list IS NOT NULL AND jsonb_array_length(livrables_list) > 0
        ) AS all_elems
      );
      
      -- Construire le contenu complet de la slide
      slide_content := jsonb_build_object(
        'body', jsonb_build_object(
          'type', 'doc',
          'content', slide_body_content
        )
      );
      
      -- Déterminer la position (après l'item de métadonnées)
      SELECT COALESCE(MAX(position), -1) + 1 INTO position_counter
      FROM items
      WHERE module_id = module_rec.module_id;
      
      -- Créer l'item slide
      INSERT INTO items (id, module_id, type, title, position, content, published)
      VALUES (
        gen_random_uuid(),
        module_rec.module_id,
        'slide',
        'Présentation du module ' || COALESCE(metadata_item.content->>'module_id', ''),
        position_counter,
        slide_content,
        true
      )
      RETURNING id INTO slide_item_id;
      
      RAISE NOTICE 'Slide créée pour le module % (position %) : %', 
        module_rec.module_title, 
        module_rec.module_position,
        slide_item_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Toutes les slides ont été créées avec succès !';
END $$;

