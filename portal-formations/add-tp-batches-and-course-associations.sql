-- ============================================================================
-- SCHÉMA POUR LES LOTS DE TP ET ASSOCIATIONS DIRECTES AUX COURS
-- ============================================================================
-- Ce script permet de :
-- 1. Associer les TP directement aux cours (en plus de la relation via module)
-- 2. Créer des lots de TP qui regroupent plusieurs TP liés entre eux
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : ASSOCIATION DIRECTE DES TP AUX COURS
-- ============================================================================

-- Table de liaison entre cours et TP (pour les TP intégrés aux cours)
-- Permet d'associer un TP à un cours même s'il n'est pas dans un module spécifique
CREATE TABLE IF NOT EXISTS course_tps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  -- Ordre d'affichage du TP dans le cours
  position INTEGER NOT NULL DEFAULT 0,
  -- Indique si le TP est obligatoire pour compléter le cours
  is_required BOOLEAN DEFAULT FALSE,
  -- Indique si le TP est visible dans la liste des TP du cours
  is_visible BOOLEAN DEFAULT TRUE,
  -- Métadonnées supplémentaires (JSONB pour flexibilité)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supprimer les doublons avant de créer la contrainte unique
-- Garde seulement le premier enregistrement pour chaque combinaison (course_id, item_id)
DO $$
BEGIN
  -- Supprimer les doublons en gardant l'enregistrement avec le plus petit id
  DELETE FROM course_tps t1
  WHERE EXISTS (
    SELECT 1 FROM course_tps t2
    WHERE t2.course_id = t1.course_id
      AND t2.item_id = t1.item_id
      AND t2.id < t1.id
  );
END $$;

-- Créer la contrainte unique (supprimer d'abord si elle existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'course_tps_course_id_item_id_key'
  ) THEN
    ALTER TABLE course_tps 
    DROP CONSTRAINT course_tps_course_id_item_id_key;
  END IF;
END $$;

ALTER TABLE course_tps 
ADD CONSTRAINT course_tps_course_id_item_id_key 
UNIQUE(course_id, item_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_course_tps_course_id ON course_tps(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tps_item_id ON course_tps(item_id);
CREATE INDEX IF NOT EXISTS idx_course_tps_position ON course_tps(course_id, position);

-- ============================================================================
-- PARTIE 2 : LOTS DE TP (TP BATCHES)
-- ============================================================================

-- Table des lots de TP (regroupements de TP liés entre eux)
CREATE TABLE IF NOT EXISTS tp_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  -- Cours auquel appartient le lot (optionnel, peut être NULL si le lot est indépendant)
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  -- Ordre d'affichage du lot dans le cours (si associé à un cours)
  position INTEGER NOT NULL DEFAULT 0,
  -- Indique si le lot est actif/published
  is_published BOOLEAN DEFAULT TRUE,
  -- Indique si les TP du lot doivent être complétés dans l'ordre
  sequential_order BOOLEAN DEFAULT FALSE,
  -- Métadonnées supplémentaires
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison entre lots de TP et items TP
-- Permet de regrouper plusieurs TP dans un lot
CREATE TABLE IF NOT EXISTS tp_batch_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tp_batch_id UUID REFERENCES tp_batches(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  -- Ordre du TP dans le lot
  position INTEGER NOT NULL DEFAULT 0,
  -- Indique si ce TP est obligatoire dans le lot
  is_required BOOLEAN DEFAULT TRUE,
  -- Prérequis : ID du TP précédent qui doit être complété avant celui-ci
  -- (NULL si aucun prérequis)
  prerequisite_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  -- Métadonnées spécifiques à ce TP dans ce lot
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supprimer les doublons avant de créer la contrainte unique
-- Garde seulement le premier enregistrement pour chaque combinaison (tp_batch_id, item_id)
DO $$
BEGIN
  -- Supprimer les doublons en gardant l'enregistrement avec le plus petit id
  DELETE FROM tp_batch_items t1
  WHERE EXISTS (
    SELECT 1 FROM tp_batch_items t2
    WHERE t2.tp_batch_id = t1.tp_batch_id
      AND t2.item_id = t1.item_id
      AND t2.id < t1.id
  );
END $$;

-- Créer la contrainte unique (supprimer d'abord si elle existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tp_batch_items_tp_batch_id_item_id_key'
  ) THEN
    ALTER TABLE tp_batch_items 
    DROP CONSTRAINT tp_batch_items_tp_batch_id_item_id_key;
  END IF;
END $$;

ALTER TABLE tp_batch_items 
ADD CONSTRAINT tp_batch_items_tp_batch_id_item_id_key 
UNIQUE(tp_batch_id, item_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tp_batches_course_id ON tp_batches(course_id);
CREATE INDEX IF NOT EXISTS idx_tp_batches_created_by ON tp_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_tp_batch_items_batch_id ON tp_batch_items(tp_batch_id);
CREATE INDEX IF NOT EXISTS idx_tp_batch_items_item_id ON tp_batch_items(item_id);
CREATE INDEX IF NOT EXISTS idx_tp_batch_items_position ON tp_batch_items(tp_batch_id, position);
CREATE INDEX IF NOT EXISTS idx_tp_batch_items_prerequisite ON tp_batch_items(prerequisite_item_id);

-- ============================================================================
-- PARTIE 3 : FONCTIONS ET TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_tp_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider que l'item est de type 'tp' dans course_tps
CREATE OR REPLACE FUNCTION validate_course_tp_item_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM items 
    WHERE items.id = NEW.item_id 
    AND items.type = 'tp'
  ) THEN
    RAISE EXCEPTION 'L''item avec l''ID % n''est pas de type ''tp''', NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider que l'item est de type 'tp' dans tp_batch_items
CREATE OR REPLACE FUNCTION validate_tp_batch_item_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM items 
    WHERE items.id = NEW.item_id 
    AND items.type = 'tp'
  ) THEN
    RAISE EXCEPTION 'L''item avec l''ID % n''est pas de type ''tp''', NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider que le prérequis est dans le même lot
CREATE OR REPLACE FUNCTION validate_tp_batch_prerequisite()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.prerequisite_item_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM tp_batch_items tbi2
      WHERE tbi2.tp_batch_id = NEW.tp_batch_id
      AND tbi2.item_id = NEW.prerequisite_item_id
    ) THEN
      RAISE EXCEPTION 'Le prérequis (item_id: %) doit être dans le même lot (batch_id: %)', 
        NEW.prerequisite_item_id, NEW.tp_batch_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at (supprimer d'abord s'ils existent)
DROP TRIGGER IF EXISTS course_tps_updated_at ON course_tps;
CREATE TRIGGER course_tps_updated_at
  BEFORE UPDATE ON course_tps
  FOR EACH ROW
  EXECUTE FUNCTION update_tp_tables_updated_at();

DROP TRIGGER IF EXISTS tp_batches_updated_at ON tp_batches;
CREATE TRIGGER tp_batches_updated_at
  BEFORE UPDATE ON tp_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_tp_tables_updated_at();

-- Triggers pour valider les contraintes métier (supprimer d'abord s'ils existent)
DROP TRIGGER IF EXISTS validate_course_tp_item_type_trigger ON course_tps;
CREATE TRIGGER validate_course_tp_item_type_trigger
  BEFORE INSERT OR UPDATE ON course_tps
  FOR EACH ROW
  EXECUTE FUNCTION validate_course_tp_item_type();

DROP TRIGGER IF EXISTS validate_tp_batch_item_type_trigger ON tp_batch_items;
CREATE TRIGGER validate_tp_batch_item_type_trigger
  BEFORE INSERT OR UPDATE ON tp_batch_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_tp_batch_item_type();

DROP TRIGGER IF EXISTS validate_tp_batch_prerequisite_trigger ON tp_batch_items;
CREATE TRIGGER validate_tp_batch_prerequisite_trigger
  BEFORE INSERT OR UPDATE ON tp_batch_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_tp_batch_prerequisite();

-- ============================================================================
-- PARTIE 4 : VUES UTILES
-- ============================================================================

-- Vue pour obtenir tous les TP d'un cours (via modules ET via association directe)
CREATE OR REPLACE VIEW course_all_tps AS
SELECT DISTINCT
  c.id AS course_id,
  c.title AS course_title,
  i.id AS tp_id,
  i.title AS tp_title,
  i.type,
  'module' AS source_type,
  m.id AS module_id,
  m.title AS module_title,
  NULL::UUID AS tp_batch_id,
  NULL::TEXT AS tp_batch_title,
  i.position AS position_in_module,
  ct.position AS position_in_course,
  ct.is_required,
  ct.is_visible,
  i.created_at,
  i.updated_at
FROM courses c
INNER JOIN modules m ON m.course_id = c.id
INNER JOIN items i ON i.module_id = m.id AND i.type = 'tp'
LEFT JOIN course_tps ct ON ct.course_id = c.id AND ct.item_id = i.id

UNION ALL

SELECT DISTINCT
  c.id AS course_id,
  c.title AS course_title,
  i.id AS tp_id,
  i.title AS tp_title,
  i.type,
  'direct' AS source_type,
  NULL::UUID AS module_id,
  NULL::TEXT AS module_title,
  NULL::UUID AS tp_batch_id,
  NULL::TEXT AS tp_batch_title,
  NULL::INTEGER AS position_in_module,
  ct.position AS position_in_course,
  ct.is_required,
  ct.is_visible,
  i.created_at,
  i.updated_at
FROM courses c
INNER JOIN course_tps ct ON ct.course_id = c.id
INNER JOIN items i ON i.id = ct.item_id AND i.type = 'tp'
WHERE NOT EXISTS (
  -- Exclure les TP qui sont déjà dans un module du cours
  SELECT 1 FROM modules m
  INNER JOIN items i2 ON i2.module_id = m.id
  WHERE m.course_id = c.id AND i2.id = i.id
)

UNION ALL

SELECT DISTINCT
  c.id AS course_id,
  c.title AS course_title,
  i.id AS tp_id,
  i.title AS tp_title,
  i.type,
  'batch' AS source_type,
  NULL::UUID AS module_id,
  NULL::TEXT AS module_title,
  tb.id AS tp_batch_id,
  tb.title AS tp_batch_title,
  NULL::INTEGER AS position_in_module,
  tb.position AS position_in_course,
  tbi.is_required,
  TRUE AS is_visible,
  i.created_at,
  i.updated_at
FROM courses c
INNER JOIN tp_batches tb ON tb.course_id = c.id
INNER JOIN tp_batch_items tbi ON tbi.tp_batch_id = tb.id
INNER JOIN items i ON i.id = tbi.item_id AND i.type = 'tp'
WHERE tb.is_published = TRUE;

-- Vue pour obtenir les détails complets d'un lot de TP
CREATE OR REPLACE VIEW tp_batch_details AS
SELECT
  tb.id AS batch_id,
  tb.title AS batch_title,
  tb.description AS batch_description,
  tb.course_id,
  c.title AS course_title,
  tb.position AS batch_position,
  tb.sequential_order,
  tb.is_published,
  tb.metadata AS batch_metadata,
  COUNT(tbi.id) AS tp_count,
  COUNT(CASE WHEN tbi.is_required THEN 1 END) AS required_tp_count,
  tb.created_at,
  tb.updated_at
FROM tp_batches tb
LEFT JOIN courses c ON c.id = tb.course_id
LEFT JOIN tp_batch_items tbi ON tbi.tp_batch_id = tb.id
GROUP BY tb.id, tb.title, tb.description, tb.course_id, c.title, tb.position, 
         tb.sequential_order, tb.is_published, tb.metadata, tb.created_at, tb.updated_at;

-- Vue pour obtenir les TP d'un lot avec leurs détails
CREATE OR REPLACE VIEW tp_batch_items_details AS
SELECT
  tbi.id,
  tbi.tp_batch_id,
  tb.title AS batch_title,
  tbi.item_id,
  i.title AS tp_title,
  i.content AS tp_content,
  tbi.position,
  tbi.is_required,
  tbi.prerequisite_item_id,
  pi.title AS prerequisite_tp_title,
  tbi.metadata,
  tbi.created_at
FROM tp_batch_items tbi
INNER JOIN tp_batches tb ON tb.id = tbi.tp_batch_id
INNER JOIN items i ON i.id = tbi.item_id
LEFT JOIN items pi ON pi.id = tbi.prerequisite_item_id
ORDER BY tbi.tp_batch_id, tbi.position;

-- ============================================================================
-- PARTIE 5 : RLS (Row Level Security) - Optionnel
-- ============================================================================

-- Activer RLS si nécessaire (décommentez si vous utilisez RLS)
-- ALTER TABLE course_tps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tp_batches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tp_batch_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTIE 6 : COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE course_tps IS 'Association directe entre cours et TP (pour les TP intégrés)';
COMMENT ON TABLE tp_batches IS 'Lots de TP regroupant plusieurs TP liés entre eux';
COMMENT ON TABLE tp_batch_items IS 'Liaison entre lots de TP et items TP individuels';
COMMENT ON VIEW course_all_tps IS 'Vue unifiée de tous les TP d''un cours (via modules, association directe, ou lots)';
COMMENT ON VIEW tp_batch_details IS 'Détails complets des lots de TP avec statistiques';
COMMENT ON VIEW tp_batch_items_details IS 'Détails des TP dans les lots avec leurs prérequis';
