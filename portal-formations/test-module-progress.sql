-- Script de test pour vérifier les politiques RLS et la fonction
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que les politiques existent
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
WHERE tablename = 'module_progress'
ORDER BY policyname;

-- 2. Tester la fonction si elle existe
SELECT upsert_module_progress(
  'f838d077-6fb5-49dc-887d-522f340be47d'::UUID,
  NULL::UUID,
  100,
  NOW()
) as test_result;

-- 3. Vérifier les données insérées
SELECT 
  id,
  user_id,
  module_id,
  session_id,
  percent,
  completed_at,
  started_at,
  updated_at
FROM module_progress
WHERE module_id = 'f838d077-6fb5-49dc-887d-522f340be47d'
ORDER BY updated_at DESC
LIMIT 5;

-- 4. Vérifier les permissions de l'utilisateur actuel
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;
