-- =====================================================
-- Ajout du support pour les TP de contrôle avec solution
-- =====================================================

-- Ajouter un champ pour stocker la solution attendue (code Python)
ALTER TABLE items ADD COLUMN IF NOT EXISTS solution_code TEXT;

-- Ajouter un champ pour indiquer si c'est un TP de contrôle
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_control_tp BOOLEAN DEFAULT false;

-- Ajouter un champ pour stocker le fichier de logs à fournir (contenu du fichier)
ALTER TABLE items ADD COLUMN IF NOT EXISTS control_tp_log_file TEXT;

-- Ajouter un champ pour stocker les sources (fichiers, liens) à fournir (format JSON)
ALTER TABLE items ADD COLUMN IF NOT EXISTS control_tp_sources JSONB DEFAULT '[]';

-- Index pour les TP de contrôle
CREATE INDEX IF NOT EXISTS idx_items_is_control_tp ON items(is_control_tp) WHERE is_control_tp = true;

-- Commentaires pour documentation
COMMENT ON COLUMN items.solution_code IS 'Code solution attendu pour les TP de contrôle (comparaison automatique)';
COMMENT ON COLUMN items.is_control_tp IS 'Indique si cet item est un TP de contrôle avec correction automatique';
COMMENT ON COLUMN items.control_tp_log_file IS 'Contenu du fichier de logs à fournir pour les TP de contrôle';
COMMENT ON COLUMN items.control_tp_sources IS 'Sources à fournir aux apprenants (fichiers, liens) - Format JSON: [{"type": "file", "name": "...", "content": "..."}, {"type": "link", "url": "...", "label": "..."}]';
