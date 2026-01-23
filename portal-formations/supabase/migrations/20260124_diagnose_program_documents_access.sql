-- Script de diagnostic pour les documents du programme
-- À exécuter pour vérifier pourquoi un utilisateur ne peut pas accéder aux documents

-- =============================================================================
-- 1. Vérifier les documents du programme
-- =============================================================================
SELECT 
  pd.id,
  pd.program_id,
  p.title as program_title,
  pd.title as document_title,
  pd.is_published,
  pd.template_file_path,
  pd.template_url
FROM program_documents pd
JOIN programs p ON p.id = pd.program_id
ORDER BY pd.created_at DESC
LIMIT 10;

-- =============================================================================
-- 2. Vérifier les inscriptions aux programmes
-- =============================================================================
-- Remplacez 'USER_ID' par l'ID de l'utilisateur qui a le problème
-- SELECT 
--   pe.id,
--   pe.user_id,
--   pe.program_id,
--   p.title as program_title,
--   pe.status,
--   pe.enrolled_at
-- FROM program_enrollments pe
-- JOIN programs p ON p.id = pe.program_id
-- WHERE pe.user_id = 'USER_ID'::uuid
-- ORDER BY pe.enrolled_at DESC;

-- =============================================================================
-- 3. Vérifier les politiques RLS pour le storage
-- =============================================================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'Pas de condition USING'
  END as using_condition,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
    ELSE 'Pas de condition WITH CHECK'
  END as with_check_condition
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%fillable%' OR policyname LIKE '%program%'
ORDER BY policyname;

-- =============================================================================
-- 4. Vérifier les fichiers dans le bucket (si accessible)
-- =============================================================================
SELECT 
  name,
  bucket_id,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'fillable-documents'
  AND name LIKE 'templates/programs/%'
ORDER BY created_at DESC
LIMIT 10;

-- =============================================================================
-- 5. Test de permission pour un utilisateur spécifique
-- =============================================================================
-- Remplacez 'USER_ID' et 'PROGRAM_ID' par les valeurs réelles
-- Cette requête simule ce que la politique RLS vérifie
-- SELECT 
--   pe.user_id,
--   pe.program_id,
--   pe.status,
--   pd.id as document_id,
--   pd.is_published,
--   pd.template_file_path,
--   CASE 
--     WHEN pe.status = 'active' AND pd.is_published = true THEN '✅ Accès autorisé'
--     ELSE '❌ Accès refusé'
--   END as access_status
-- FROM program_enrollments pe
-- JOIN program_documents pd ON pd.program_id = pe.program_id
-- WHERE pe.user_id = 'USER_ID'::uuid
--   AND pe.program_id = 'PROGRAM_ID'::uuid
--   AND pd.is_published = true;
