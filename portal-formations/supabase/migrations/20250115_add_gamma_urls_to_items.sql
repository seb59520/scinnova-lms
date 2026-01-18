-- Ajouter les colonnes pour stocker les URLs Gamma (PDF, PPTX)
-- Ces colonnes permettent de stocker les URLs retournées par l'API Gamma

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pptx_url TEXT;

-- Commentaire pour documenter ces colonnes
COMMENT ON COLUMN items.pdf_url IS 'URL du PDF généré par Gamma (si disponible)';
COMMENT ON COLUMN items.pptx_url IS 'URL du fichier PPTX généré par Gamma (si disponible)';
