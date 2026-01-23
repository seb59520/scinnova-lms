-- Migration: Vérifier et créer le bucket fillable-documents si nécessaire
-- Date: 2026-01-24
-- Description: Script de diagnostic et création forcée du bucket fillable-documents

-- =============================================================================
-- ÉTAPE 1: Vérifier si le bucket existe
-- =============================================================================
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'fillable-documents'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '✅ Le bucket fillable-documents existe déjà';
  ELSE
    RAISE NOTICE '❌ Le bucket fillable-documents n''existe pas. Création en cours...';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 2: Supprimer le bucket s'il existe (pour recréer proprement)
-- =============================================================================
-- ATTENTION: Cette étape supprime tous les fichiers du bucket !
-- Décommentez seulement si vous voulez recréer le bucket de zéro
-- DELETE FROM storage.buckets WHERE id = 'fillable-documents';

-- =============================================================================
-- ÉTAPE 3: Créer le bucket avec toutes les options nécessaires
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fillable-documents',
  'fillable-documents',
  false, -- Privé pour protéger les documents des étudiants
  52428800, -- 50MB max
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain',
    'application/json',
    'application/xml',
    'text/xml',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- ÉTAPE 4: Vérifier que le bucket a été créé
-- =============================================================================
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'fillable-documents'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    SELECT public INTO bucket_public FROM storage.buckets WHERE id = 'fillable-documents';
    RAISE NOTICE '✅ Bucket créé avec succès';
    RAISE NOTICE '   - ID: fillable-documents';
    RAISE NOTICE '   - Public: %', bucket_public;
    RAISE NOTICE '   - Taille max: 50MB';
  ELSE
    RAISE EXCEPTION '❌ Échec de la création du bucket';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 5: Vérifier les politiques RLS existantes
-- =============================================================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%fillable%';
  
  RAISE NOTICE '📋 Nombre de politiques RLS pour fillable-documents: %', policy_count;
  
  IF policy_count = 0 THEN
    RAISE WARNING '⚠️ Aucune politique RLS trouvée. Exécutez setup-fillable-documents-storage.sql';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 6: Lister les buckets existants (pour diagnostic)
-- =============================================================================
-- Décommentez pour voir tous les buckets
-- SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY id;
