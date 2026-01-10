-- Script de diagnostic et correction pour le problème de profil manquant
-- À exécuter dans Supabase SQL Editor

-- ============================================================================
-- ÉTAPE 1 : Vérifier si l'utilisateur existe dans auth.users
-- ============================================================================
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'name' as name
FROM auth.users
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 2 : Vérifier si le profil existe dans profiles
-- ============================================================================
SELECT 
  id,
  role,
  full_name,
  is_active,
  created_at,
  updated_at
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 3 : Créer le profil s'il n'existe pas
-- ============================================================================
DO $$
DECLARE
  user_id_to_fix UUID := '25e68bd5-be89-4c93-ab84-b657a89f1070';
  user_email TEXT;
  user_name TEXT;
  profile_exists BOOLEAN;
BEGIN
  -- Vérifier si le profil existe
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id_to_fix) INTO profile_exists;
  
  IF NOT profile_exists THEN
    -- Récupérer l'email et le nom de l'utilisateur
    SELECT 
      email,
      COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        raw_user_meta_data->>'display_name',
        SPLIT_PART(email, '@', 1)
      )
    INTO user_email, user_name
    FROM auth.users
    WHERE id = user_id_to_fix;
    
    IF user_email IS NOT NULL THEN
      -- Créer le profil
      INSERT INTO public.profiles (id, role, full_name, is_active)
      VALUES (
        user_id_to_fix,
        'admin', -- Rôle admin par défaut
        COALESCE(user_name, 'Admin User'),
        true
      );
      
      RAISE NOTICE '✅ Profil créé avec succès pour: % (%)', user_name, user_email;
    ELSE
      RAISE WARNING '❌ Utilisateur non trouvé dans auth.users avec l''ID: %', user_id_to_fix;
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Le profil existe déjà pour cet utilisateur';
    
    -- Mettre à jour le rôle en admin si nécessaire
    UPDATE public.profiles
    SET 
      role = 'admin',
      is_active = true,
      updated_at = NOW()
    WHERE id = user_id_to_fix AND (role != 'admin' OR is_active != true);
    
    IF FOUND THEN
      RAISE NOTICE '✅ Profil mis à jour avec le rôle admin';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 4 : Vérifier que le profil est maintenant accessible
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
-- ÉTAPE 5 : Vérifier et optimiser la fonction is_admin() pour éviter les problèmes
-- ============================================================================

-- Vérifier si la fonction is_admin existe
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'is_admin';

-- Recréer la fonction is_admin avec une version optimisée (sans récursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérification directe sans récursion
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = user_id 
      AND role = 'admin'
      AND (is_active IS NULL OR is_active = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ÉTAPE 6 : Vérifier que les politiques RLS sont correctes
-- ============================================================================

-- Les politiques actuelles semblent correctes, mais vérifions qu'elles fonctionnent
-- La politique "Users can always view their own profile" devrait permettre la lecture

-- Test de la politique (simulation)
-- Note: Cette requête devrait fonctionner si vous êtes connecté avec cet utilisateur
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 7 : Si nécessaire, améliorer les politiques pour garantir l'accès
-- ============================================================================

-- S'assurer que la politique de lecture fonctionne même si is_active est false
-- (La politique actuelle "Users can always view their own profile" devrait déjà le permettre)

-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ============================================================================
-- ÉTAPE 8 : Vérifier le trigger de création automatique
-- ============================================================================

-- Vérifier que le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

-- Créer la fonction handle_new_user si elle n'existe pas (en dehors du bloc DO)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $func$
DECLARE
  user_full_name TEXT;
BEGIN
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, role, full_name, is_active)
  VALUES (NEW.id, 'student', user_full_name, true)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Si le trigger n'existe pas, le créer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
      AND event_object_table = 'users'
      AND trigger_schema = 'auth'
  ) THEN
    -- Créer le trigger
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE '✅ Trigger on_auth_user_created créé';
  ELSE
    RAISE NOTICE 'ℹ️ Trigger on_auth_user_created existe déjà';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 9 : Résumé final
-- ============================================================================
SELECT 
  'Diagnostic terminé' as status,
  CASE 
    WHEN EXISTS(SELECT 1 FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070')
    THEN '✅ Profil existe'
    ELSE '❌ Profil manquant'
  END as profile_status,
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070')
    THEN '✅ Utilisateur existe dans auth.users'
    ELSE '❌ Utilisateur non trouvé'
  END as user_status;
