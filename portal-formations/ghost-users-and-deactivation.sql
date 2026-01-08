-- ============================================================================
-- GESTION DES UTILISATEURS GHOST ET DÉSACTIVATION
-- Portail Formations - Fonctionnalités d'utilisateurs anonymes
-- ============================================================================
-- Ce script ajoute :
-- 1. Table ghost_codes pour gérer les codes d'accès temporaires
-- 2. Champ is_active dans profiles pour désactiver des utilisateurs
-- 3. Fonctions pour générer et gérer les codes ghost
-- 4. Mise à jour des policies RLS
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : TABLE GHOST_CODES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ghost_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT -- Notes optionnelles pour l'admin
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_ghost_codes_code ON ghost_codes(code);
CREATE INDEX IF NOT EXISTS idx_ghost_codes_is_used ON ghost_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_ghost_codes_expires_at ON ghost_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_ghost_codes_created_by ON ghost_codes(created_by);

-- Activer RLS
ALTER TABLE ghost_codes ENABLE ROW LEVEL SECURITY;

-- Policies pour ghost_codes
-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage ghost codes" ON ghost_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les utilisateurs anonymes peuvent vérifier un code (lecture seule)
CREATE POLICY "Anyone can check ghost codes" ON ghost_codes
  FOR SELECT USING (is_used = FALSE AND (expires_at IS NULL OR expires_at > NOW()));

-- ============================================================================
-- PARTIE 2 : AJOUT DU CHAMP IS_ACTIVE DANS PROFILES
-- ============================================================================

-- Ajouter le champ is_active si il n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Mettre à jour les policies RLS existantes pour exclure les utilisateurs désactivés
-- Note: is_active IS NULL est considéré comme actif (rétrocompatibilité)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id AND (is_active IS NULL OR is_active = TRUE));

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id AND (is_active IS NULL OR is_active = TRUE));

-- Policy pour que les admins voient tous les profils (même désactivés)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy pour que les admins puissent modifier tous les profils
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- PARTIE 3 : FONCTIONS POUR GÉRER LES CODES GHOST
-- ============================================================================

-- Fonction pour générer un code unique
CREATE OR REPLACE FUNCTION generate_ghost_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code de 8 caractères aléatoires (majuscules et chiffres)
    new_code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || NOW()::TEXT || RANDOM()::TEXT) 
        FROM 1 FOR 8
      )
    );
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM ghost_codes WHERE code = new_code) INTO code_exists;
    
    -- Si le code n'existe pas, on peut l'utiliser
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer plusieurs codes d'un coup
CREATE OR REPLACE FUNCTION generate_ghost_codes(
  count INTEGER,
  expires_in_hours INTEGER DEFAULT 24,
  created_by_user UUID DEFAULT NULL
)
RETURNS TABLE(code TEXT, id UUID) AS $$
DECLARE
  i INTEGER;
  new_code TEXT;
  new_id UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  expires_at := NOW() + (expires_in_hours || ' hours')::INTERVAL;
  
  FOR i IN 1..count LOOP
    new_code := generate_ghost_code();
    new_id := gen_random_uuid();
    
    INSERT INTO ghost_codes (id, code, expires_at, created_by)
    VALUES (new_id, new_code, expires_at, created_by_user)
    RETURNING ghost_codes.code, ghost_codes.id INTO new_code, new_id;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier et utiliser un code
CREATE OR REPLACE FUNCTION use_ghost_code(code_to_check TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  code_id UUID,
  message TEXT
) AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Chercher le code
  SELECT * INTO code_record
  FROM ghost_codes
  WHERE code = code_to_check;
  
  -- Si le code n'existe pas
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Code invalide'::TEXT;
    RETURN;
  END IF;
  
  -- Si le code est déjà utilisé
  IF code_record.is_used THEN
    RETURN QUERY SELECT FALSE, code_record.id, 'Code déjà utilisé'::TEXT;
    RETURN;
  END IF;
  
  -- Si le code a expiré
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, code_record.id, 'Code expiré'::TEXT;
    RETURN;
  END IF;
  
  -- Le code est valide
  RETURN QUERY SELECT TRUE, code_record.id, 'Code valide'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer un code comme utilisé (appelée après création de l'utilisateur)
CREATE OR REPLACE FUNCTION mark_ghost_code_used(
  code_to_mark TEXT,
  user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Chercher le code
  SELECT * INTO code_record
  FROM ghost_codes
  WHERE code = code_to_mark AND is_used = FALSE;
  
  -- Si le code n'existe pas ou est déjà utilisé
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Marquer comme utilisé
  UPDATE ghost_codes
  SET 
    is_used = TRUE,
    used_at = NOW(),
    used_by = user_id
  WHERE code = code_to_mark;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 4 : MISE À JOUR DU TRIGGER handle_new_user POUR LES GHOST
-- ============================================================================

-- Mettre à jour la fonction handle_new_user pour gérer les utilisateurs ghost
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  is_ghost BOOLEAN;
BEGIN
  -- Vérifier si c'est un utilisateur ghost
  is_ghost := COALESCE((NEW.raw_user_meta_data->>'is_ghost')::BOOLEAN, FALSE);
  
  -- Récupérer le nom depuis les métadonnées
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    CASE 
      WHEN is_ghost THEN 'Utilisateur Ghost'
      ELSE SPLIT_PART(NEW.email, '@', 1)
    END
  );

  -- Créer le profil
  INSERT INTO public.profiles (id, role, full_name, is_active)
  VALUES (NEW.id, 'student', user_full_name, TRUE)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 5 : FONCTION POUR NETTOYER LES UTILISATEURS GHOST EXPIRÉS
-- ============================================================================

-- Fonction pour supprimer automatiquement les utilisateurs ghost après un certain temps
-- À appeler via un cron job ou une Edge Function
CREATE OR REPLACE FUNCTION cleanup_old_ghost_users(days_old INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les utilisateurs ghost créés il y a plus de X jours
  -- Note: Cette fonction doit être appelée avec les privilèges admin
  -- car elle supprime directement dans auth.users
  WITH ghost_users AS (
    SELECT u.id
    FROM auth.users u
    WHERE (u.raw_user_meta_data->>'is_ghost')::BOOLEAN = TRUE
      AND u.created_at < NOW() - (days_old || ' days')::INTERVAL
  )
  SELECT COUNT(*) INTO deleted_count
  FROM ghost_users;
  
  -- Note: La suppression réelle doit être faite via l'Admin API
  -- Cette fonction retourne juste le nombre d'utilisateurs à supprimer
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 6 : VUES UTILES POUR LES ADMINS
-- ============================================================================

-- Vue pour voir les codes ghost avec leurs statistiques
CREATE OR REPLACE VIEW ghost_codes_stats AS
SELECT 
  gc.id,
  gc.code,
  gc.is_used,
  gc.used_at,
  gc.expires_at,
  gc.created_at,
  p.full_name as created_by_name,
  u.email as used_by_email,
  CASE 
    WHEN gc.is_used THEN 'Utilisé'
    WHEN gc.expires_at IS NOT NULL AND gc.expires_at < NOW() THEN 'Expiré'
    ELSE 'Disponible'
  END as status
FROM ghost_codes gc
LEFT JOIN profiles p ON p.id = gc.created_by
LEFT JOIN auth.users u ON u.id = gc.used_by;

-- Policy pour la vue
CREATE POLICY "Admins can view ghost codes stats" ON ghost_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Instructions :
-- 1. Exécutez ce script dans l'interface SQL de Supabase
-- 2. Activez l'authentification anonyme dans Supabase Dashboard :
--    Authentication > Providers > Enable "Anonymous" provider
-- 3. Testez la génération de codes avec :
--    SELECT * FROM generate_ghost_codes(5, 24, NULL);
-- ============================================================================

