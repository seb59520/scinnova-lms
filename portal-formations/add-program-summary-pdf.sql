-- ============================================================================
-- Ajout du champ summary_pdf_path à la table programs
-- ============================================================================
-- Ce script ajoute la possibilité d'associer un PDF de résumé à un programme
-- ============================================================================

-- Ajouter la colonne summary_pdf_path si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'programs' 
    AND column_name = 'summary_pdf_path'
  ) THEN
    ALTER TABLE programs 
    ADD COLUMN summary_pdf_path TEXT;
    
    COMMENT ON COLUMN programs.summary_pdf_path IS 'Chemin vers le PDF de résumé du programme dans Supabase Storage';
  END IF;
END $$;

-- Index pour améliorer les performances si nécessaire
CREATE INDEX IF NOT EXISTS idx_programs_summary_pdf_path ON programs(summary_pdf_path) WHERE summary_pdf_path IS NOT NULL;
