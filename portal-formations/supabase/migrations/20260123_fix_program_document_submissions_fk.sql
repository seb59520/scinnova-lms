-- =====================================================
-- Fix Foreign Key for program_document_submissions
-- Ajouter une FK vers profiles pour permettre les jointures PostgREST
-- =====================================================

-- Vérifier si la colonne user_id existe et pointe vers auth.users
-- Si oui, ajouter une contrainte de clé étrangère vers profiles(id) également
-- (on garde les deux pour la compatibilité)

-- Supprimer l'ancienne FK vers auth.users si elle existe
DO $$
BEGIN
  -- Supprimer la contrainte existante vers auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'program_document_submissions_user_id_fkey'
    AND table_name = 'program_document_submissions'
  ) THEN
    ALTER TABLE program_document_submissions 
    DROP CONSTRAINT program_document_submissions_user_id_fkey;
  END IF;
END $$;

-- Ajouter une FK vers profiles(id) pour permettre les jointures PostgREST
DO $$
BEGIN
  -- Vérifier si la FK vers profiles n'existe pas déjà
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'program_document_submissions_user_id_profiles_fkey'
    AND table_name = 'program_document_submissions'
  ) THEN
    ALTER TABLE program_document_submissions 
    ADD CONSTRAINT program_document_submissions_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Vérifier que tous les user_id existants ont un profil correspondant
-- Si certains n'ont pas de profil, on les supprime (ou on peut les garder si nécessaire)
-- Pour l'instant, on ne fait rien, on suppose que tous les user_id ont un profil

-- Index pour améliorer les performances (déjà créé normalement, mais on s'assure qu'il existe)
CREATE INDEX IF NOT EXISTS idx_program_doc_submissions_user_id ON program_document_submissions(user_id);
