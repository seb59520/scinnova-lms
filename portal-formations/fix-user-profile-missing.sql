-- Script pour créer ou mettre à jour le profil d'un utilisateur manquant
-- Utilisez ce script si un utilisateur existe dans auth.users mais n'a pas de profil dans profiles

-- ============================================================================
-- ÉTAPE 1 : Créer le profil manquant pour un utilisateur spécifique
-- ============================================================================
-- Remplacez '25e68bd5-be89-4c93-ab84-b657a89f1070' par l'ID de votre utilisateur
-- et 'Admin User' par le nom souhaité

DO $$
DECLARE
  user_id_to_fix UUID := '25e68bd5-be89-4c93-ab84-b657a89f1070';
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Récupérer l'email de l'utilisateur depuis auth.users
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email) 
  INTO user_email, user_name
  FROM auth.users 
  WHERE id = user_id_to_fix;

  -- Si l'utilisateur existe dans auth.users
  IF user_email IS NOT NULL THEN
    -- Créer le profil s'il n'existe pas
    INSERT INTO public.profiles (id, role, full_name, is_active)
    VALUES (
      user_id_to_fix,
      'admin', -- Changez 'admin' par 'student', 'trainer', etc. selon vos besoins
      COALESCE(user_name, 'Utilisateur'),
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      role = COALESCE(EXCLUDED.role, profiles.role),
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      is_active = COALESCE(EXCLUDED.is_active, profiles.is_active),
      updated_at = NOW();
    
    RAISE NOTICE 'Profil créé/mis à jour pour l''utilisateur: % (%)', user_name, user_email;
  ELSE
    RAISE WARNING 'Utilisateur non trouvé dans auth.users avec l''ID: %', user_id_to_fix;
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2 : Vérifier que le profil a été créé
-- ============================================================================
SELECT 
  p.id,
  p.role,
  p.full_name,
  p.is_active,
  p.created_at,
  u.email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 3 : Créer tous les profils manquants pour tous les utilisateurs
-- ============================================================================
-- Décommentez cette section si vous voulez créer les profils pour TOUS les utilisateurs manquants

/*
INSERT INTO public.profiles (id, role, full_name, is_active)
SELECT 
  u.id,
  'student', -- Rôle par défaut
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    SPLIT_PART(u.email, '@', 1)
  ) as full_name,
  true as is_active
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- ÉTAPE 4 : Vérifier les politiques RLS pour s'assurer qu'elles permettent la lecture
-- ============================================================================

-- Vérifier les politiques existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Si nécessaire, créer/mettre à jour les politiques pour permettre la lecture de son propre profil
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Permettre aux utilisateurs de voir leur propre profil même si is_active est NULL
DROP POLICY IF EXISTS "Users can view their own profile including inactive" ON profiles;
CREATE POLICY "Users can view their own profile including inactive" ON profiles
  FOR SELECT 
  USING (
    auth.uid() = id 
    OR (is_active IS NULL OR is_active = true)
  );

-- Permettre aux admins de voir tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- ÉTAPE 5 : Vérifier que le trigger fonctionne pour les nouveaux utilisateurs
-- ============================================================================

-- Vérifier que le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

-- Si le trigger n'existe pas, le créer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
    AND event_object_table = 'users'
    AND trigger_schema = 'auth'
  ) THEN
    -- Créer la fonction si elle n'existe pas
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    DECLARE
      user_full_name TEXT;
    BEGIN
      -- Essayer de récupérer le nom depuis les métadonnées OAuth
      user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'display_name',
        SPLIT_PART(NEW.email, '@', 1) -- Fallback sur la partie avant @ de l'email
      );

      -- Créer le profil avec le nom récupéré
      INSERT INTO public.profiles (id, role, full_name, is_active)
      VALUES (NEW.id, 'student', user_full_name, true)
      ON CONFLICT (id) DO NOTHING; -- Éviter les erreurs si le profil existe déjà
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Créer le trigger
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE 'Trigger on_auth_user_created créé avec succès';
  ELSE
    RAISE NOTICE 'Trigger on_auth_user_created existe déjà';
  END IF;
END $$;
