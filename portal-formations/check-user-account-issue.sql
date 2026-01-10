-- Script pour vérifier si le problème vient du compte utilisateur lui-même
-- Vérifie auth.users, auth.uid(), et la correspondance avec profiles

-- ============================================================================
-- ÉTAPE 1 : Vérifier que l'utilisateur existe dans auth.users
-- ============================================================================
-- Note: Cette requête nécessite les permissions admin ou service_role
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 2 : Vérifier que le profil existe dans public.profiles
-- ============================================================================
SELECT 
  id,
  role,
  full_name,
  is_active,
  created_at
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 3 : Vérifier auth.uid() (doit être exécuté en tant qu'utilisateur connecté)
-- ============================================================================
-- Cette requête doit être exécutée via l'API Supabase avec un JWT valide
-- Dans le SQL Editor, auth.uid() sera NULL car on n'est pas authentifié via l'API
SELECT 
  auth.uid() as current_auth_uid,
  '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID as expected_user_id,
  CASE 
    WHEN auth.uid() = '25e68bd5-be89-4c93-ab84-b657a89f1070'::UUID THEN '✅ IDs correspondent'
    WHEN auth.uid() IS NULL THEN '⚠️ auth.uid() est NULL (normal dans SQL Editor, testez via l''API)'
    ELSE '❌ IDs ne correspondent pas'
  END as auth_status;

-- ============================================================================
-- ÉTAPE 4 : Vérifier la correspondance entre auth.users et profiles
-- ============================================================================
SELECT 
  au.id as auth_user_id,
  au.email,
  au.email_confirmed_at,
  p.id as profile_id,
  p.role,
  p.full_name,
  p.is_active,
  CASE 
    WHEN p.id IS NULL THEN '❌ Profil manquant pour cet utilisateur'
    WHEN au.id IS NULL THEN '❌ Utilisateur auth manquant'
    WHEN au.id = p.id THEN '✅ Correspondance OK'
    ELSE '❌ IDs ne correspondent pas'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 5 : Vérifier si l'email est confirmé
-- ============================================================================
SELECT 
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '⚠️ Email non confirmé - cela peut causer des problèmes'
    ELSE '✅ Email confirmé'
  END as email_status
FROM auth.users
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 6 : Vérifier les métadonnées utilisateur
-- ============================================================================
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 7 : Solution si le profil n'existe pas mais l'utilisateur auth existe
-- ============================================================================
-- Si l'utilisateur existe dans auth.users mais pas dans profiles, créer le profil
-- Décommentez cette section si nécessaire

/*
DO $$
DECLARE
  v_user_id UUID := '25e68bd5-be89-4c93-ab84-b657a89f1070';
  v_user_email TEXT;
  v_user_name TEXT;
  v_profile_exists BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur existe dans auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;
  
  IF v_user_email IS NULL THEN
    RAISE NOTICE '❌ Utilisateur non trouvé dans auth.users';
    RETURN;
  END IF;
  
  -- Vérifier si le profil existe
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    -- Créer le profil
    v_user_name := COALESCE(
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_user_id),
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = v_user_id),
      split_part(v_user_email, '@', 1)
    );
    
    INSERT INTO public.profiles (id, role, full_name, is_active)
    VALUES (v_user_id, 'admin', v_user_name, true)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Profil créé pour utilisateur: %', v_user_email;
  ELSE
    RAISE NOTICE '✅ Profil existe déjà';
  END IF;
END $$;
*/

-- ============================================================================
-- ÉTAPE 8 : Résumé du diagnostic
-- ============================================================================
SELECT 
  'Diagnostic compte utilisateur' as test,
  (SELECT COUNT(*) FROM auth.users WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as user_exists_in_auth,
  (SELECT COUNT(*) FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as profile_exists,
  (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as email_confirmed,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as profile_role;
