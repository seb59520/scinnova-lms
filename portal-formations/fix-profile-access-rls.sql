-- Script pour corriger l'accès au profil existant
-- Le profil existe mais n'est pas accessible depuis l'application

-- ============================================================================
-- ÉTAPE 1 : Vérifier que la colonne is_active existe
-- ============================================================================

-- Ajouter la colonne is_active si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN;
    RAISE NOTICE 'Colonne is_active ajoutée à la table profiles';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2 : Vérifier l'état actuel du profil
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
-- ÉTAPE 3 : S'assurer que is_active ne bloque pas l'accès
-- ============================================================================

-- Mettre is_active à NULL pour garantir l'accès
-- (NULL est considéré comme actif pour la rétrocompatibilité)
UPDATE public.profiles
SET is_active = NULL  -- NULL = actif par défaut
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- Alternative : mettre à true si vous préférez
-- UPDATE public.profiles
-- SET is_active = true
-- WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 4 : Vérifier et optimiser la fonction is_admin()
-- ============================================================================

-- La fonction is_admin() est utilisée dans les politiques RLS
-- Elle doit être rapide et ne pas causer de récursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérification directe avec index (plus rapide)
  -- Ne pas vérifier is_active ici pour permettre aux admins désactivés
  -- de toujours être reconnus comme admin
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = user_id 
      AND role = 'admin'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ÉTAPE 5 : Vérifier que la politique de lecture fonctionne
-- ============================================================================

-- La politique "Users can always view their own profile" devrait permettre
-- la lecture même si is_active = false
-- Vérifions qu'elle existe et qu'elle est correcte

-- Recréer la politique pour garantir qu'elle fonctionne
DROP POLICY IF EXISTS "Users can always view their own profile" ON profiles;

CREATE POLICY "Users can always view their own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);
  -- Cette politique permet TOUJOURS la lecture de son propre profil
  -- indépendamment de is_active

-- ============================================================================
-- ÉTAPE 6 : Créer un index pour améliorer les performances
-- ============================================================================

-- Index pour améliorer les performances des requêtes de profil
CREATE INDEX IF NOT EXISTS idx_profiles_id_role 
ON public.profiles(id, role);

-- Index partiel pour les profils actifs
CREATE INDEX IF NOT EXISTS idx_profiles_active 
ON public.profiles(id) 
WHERE (is_active IS NULL OR is_active = true);

-- ============================================================================
-- ÉTAPE 7 : Vérifier que le profil est maintenant accessible
-- ============================================================================

-- Test de lecture (devrait fonctionner maintenant)
SELECT 
  id,
  role,
  full_name,
  is_active,
  CASE 
    WHEN auth.uid() = id THEN '✅ Accès autorisé (propriétaire)'
    WHEN public.is_admin(auth.uid()) THEN '✅ Accès autorisé (admin)'
    ELSE '❌ Accès refusé'
  END as access_status
FROM public.profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- ============================================================================
-- ÉTAPE 8 : Résumé final
-- ============================================================================
SELECT 
  'Correction terminée' as status,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as profile_role,
  (SELECT is_active FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as profile_is_active,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'SELECT') as select_policies_count;
