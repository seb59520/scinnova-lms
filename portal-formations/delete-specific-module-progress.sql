-- Script pour supprimer des enregistrements spécifiques de module_progress
-- ATTENTION: Cette requête supprime des données. Faire une sauvegarde avant !

DELETE FROM module_progress
WHERE user_id = '1b313da5-90f4-479e-ba69-f22c03753d35'
  AND module_id IN (
    '0c8c1b7a-b166-4e99-81c2-9f3c34701bbd',
    '2860f3cc-7e1d-46c6-ac32-456ce1bc2c6b',
    '4eabfc69-1107-434e-9e5c-fd7c9e0be659',
    '5b7213ea-71a8-4f65-8b05-cf2ed3dfe86c',
    '76997fe0-c26b-438b-b313-b87a263327f0',
    '823557fd-268a-473f-9c36-daa9dfc5f156',
    '8dde0411-ebd3-434b-884c-0bc8711d828e',
    'ac0f119a-99cf-4342-a304-aaf24efdcad2',
    'b317adb1-e1b4-4921-b868-8442e9c1a085',
    'c96288b5-70ab-4ed8-8593-bac2e71e665d',
    'cd67ec30-2fcb-4cd5-9bff-35fce4177970',
    'e2ad1c32-76fa-4374-b093-8f77e4a5dca2',
    'f838d077-6fb5-49dc-887d-522f340be47d',
    'ff6a1b9b-f553-4d48-a64b-a4bf4ef9eb38'
  );

-- Vérifier que les enregistrements ont été supprimés
SELECT 
  user_id,
  module_id,
  COUNT(*) as remaining_count
FROM module_progress
WHERE user_id = '1b313da5-90f4-479e-ba69-f22c03753d35'
  AND module_id IN (
    '0c8c1b7a-b166-4e99-81c2-9f3c34701bbd',
    '2860f3cc-7e1d-46c6-ac32-456ce1bc2c6b',
    '4eabfc69-1107-434e-9e5c-fd7c9e0be659',
    '5b7213ea-71a8-4f65-8b05-cf2ed3dfe86c',
    '76997fe0-c26b-438b-b313-b87a263327f0',
    '823557fd-268a-473f-9c36-daa9dfc5f156',
    '8dde0411-ebd3-434b-884c-0bc8711d828e',
    'ac0f119a-99cf-4342-a304-aaf24efdcad2',
    'b317adb1-e1b4-4921-b868-8442e9c1a085',
    'c96288b5-70ab-4ed8-8593-bac2e71e665d',
    'cd67ec30-2fcb-4cd5-9bff-35fce4177970',
    'e2ad1c32-76fa-4374-b093-8f77e4a5dca2',
    'f838d077-6fb5-49dc-887d-522f340be47d',
    'ff6a1b9b-f553-4d48-a64b-a4bf4ef9eb38'
  )
GROUP BY user_id, module_id;

-- Si cette requête ne retourne rien, tous les enregistrements ont été supprimés
