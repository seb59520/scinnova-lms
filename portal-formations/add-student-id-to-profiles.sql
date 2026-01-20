-- ============================================================================
-- Ajout du champ student_id à la table profiles
-- ============================================================================
-- Ce script ajoute un champ student_id pour permettre la création d'étudiants
-- avec un identifiant personnalisé au lieu d'un email
-- ============================================================================

-- Ajouter la colonne student_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'student_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN student_id TEXT UNIQUE;
    RAISE NOTICE 'Colonne student_id ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'Colonne student_id existe déjà';
  END IF;
END $$;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id) WHERE student_id IS NOT NULL;

-- Fonction RPC pour rechercher un utilisateur par student_id
CREATE OR REPLACE FUNCTION public.get_user_by_student_id(
  p_student_id TEXT
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  full_name TEXT,
  student_id TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.role,
    p.full_name,
    p.student_id,
    COALESCE(p.is_active, true) as is_active,
    p.created_at
  FROM profiles p
  WHERE p.student_id = p_student_id
  AND COALESCE(p.is_active, true) = true;
END;
$$;

-- Fonction RPC pour obtenir l'email d'un utilisateur par student_id
-- (nécessaire pour la connexion car Supabase Auth utilise l'email)
CREATE OR REPLACE FUNCTION public.get_user_email_by_student_id(
  p_student_id TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  -- Récupérer l'ID utilisateur depuis profiles
  SELECT id INTO v_user_id
  FROM profiles
  WHERE student_id = p_student_id
  AND COALESCE(is_active, true) = true;
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Récupérer l'email depuis auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;
  
  RETURN v_email;
END;
$$;

-- Commentaires pour la documentation
COMMENT ON COLUMN profiles.student_id IS 'Identifiant unique de l''étudiant (utilisé pour la connexion sans email)';
COMMENT ON FUNCTION public.get_user_by_student_id IS 'Recherche un utilisateur par son identifiant étudiant';
COMMENT ON FUNCTION public.get_user_email_by_student_id IS 'Récupère l''email d''un utilisateur par son identifiant étudiant (pour la connexion)';
