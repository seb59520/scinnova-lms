-- Script pour corriger les problèmes de compte utilisateur et créer le profil si nécessaire
-- À exécuter dans Supabase SQL Editor avec les permissions admin

-- ============================================================================
-- ÉTAPE 1 : Vérifier que l'utilisateur existe dans auth.users
-- ============================================================================
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 2 : Vérifier si le profil existe
-- ============================================================================
SELECT 
  id,
  role,
  full_name,
  is_active
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 3 : Créer le profil s'il n'existe pas
-- ============================================================================
-- Cette requête crée le profil avec le rôle admin si l'utilisateur existe dans auth.users
INSERT INTO public.profiles (id, role, full_name, is_active)
SELECT 
  au.id,
  'admin'::TEXT,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  true
FROM auth.users au
WHERE au.id = '25e68bd5-be89-4c93-ab84-b657a89f1070'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
  )
ON CONFLICT (id) DO UPDATE
SET 
  role = COALESCE(profiles.role, 'admin'),
  is_active = COALESCE(profiles.is_active, true)
RETURNING *;

-- ============================================================================
-- ÉTAPE 4 : Forcer la mise à jour du profil existant
-- ============================================================================
UPDATE public.profiles
SET 
  role = COALESCE(role, 'admin'),
  is_active = COALESCE(is_active, true)
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070'
RETURNING *;

-- ============================================================================
-- ÉTAPE 5 : Vérifier le résultat
-- ============================================================================
SELECT 
  'Profil vérifié/créé' as status,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as role,
  (SELECT full_name FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as full_name,
  (SELECT is_active FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as is_active;
