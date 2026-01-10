-- Script pour créer une fonction RPC qui bypass RLS pour récupérer le profil
-- Cette fonction utilise SECURITY DEFINER pour contourner les politiques RLS
-- À utiliser uniquement en cas d'urgence si les politiques RLS bloquent l'accès

-- ============================================================================
-- ÉTAPE 1 : Créer la fonction RPC pour récupérer le profil (bypass RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id UUID,
  role TEXT,
  full_name TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Permet de bypasser RLS
SET search_path = public
AS $$
BEGIN
  -- Récupérer le profil de l'utilisateur connecté
  RETURN QUERY
  SELECT 
    p.id,
    p.role,
    p.full_name,
    p.is_active,
    p.created_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- ============================================================================
-- ÉTAPE 2 : Donner les permissions nécessaires
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO anon;

-- ============================================================================
-- ÉTAPE 3 : Tester la fonction
-- ============================================================================
-- Cette requête devrait fonctionner même si RLS bloque l'accès direct
SELECT * FROM public.get_my_profile();

-- ============================================================================
-- ÉTAPE 4 : Vérifier que le profil existe vraiment
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
-- ÉTAPE 5 : Vérifier les politiques RLS actuelles
-- ============================================================================
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- ÉTAPE 6 : Solution TEMPORAIRE - Désactiver RLS pour tester
-- ============================================================================
-- ATTENTION : Ne faites cela QUE pour tester, puis réactivez RLS immédiatement !

-- Désactiver RLS temporairement
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Test sans RLS (devrait fonctionner)
-- SELECT * FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- RÉACTIVER RLS IMMÉDIATEMENT après le test
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 7 : Résumé
-- ============================================================================
SELECT 
  'Fonction RPC créée' as status,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_my_profile') as function_exists,
  (SELECT role FROM public.profiles WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070') as your_role;
