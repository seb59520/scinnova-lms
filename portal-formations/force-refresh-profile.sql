  -- Script pour forcer le rafraîchissement du profil
  -- À exécuter si le profil n'est pas récupéré par l'application

  -- ============================================================================
  -- ÉTAPE 1 : Vérifier que le profil existe et a le bon rôle
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
  -- ÉTAPE 2 : Forcer la mise à jour du profil (même si rien ne change)
  -- ============================================================================
  -- Cela peut aider à rafraîchir les caches et les index
  UPDATE public.profiles
  SET 
    role = COALESCE(role, 'admin'),
    is_active = COALESCE(is_active, true)
  WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070'
  RETURNING *;

  -- ============================================================================
  -- ÉTAPE 3 : Vérifier que le profil est bien mis à jour
  -- ============================================================================
  SELECT 
    id,
    role,
    full_name,
    is_active
  FROM public.profiles
  WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

  -- ============================================================================
  -- ÉTAPE 4 : Analyser la table pour mettre à jour les statistiques
  -- ============================================================================
  ANALYZE public.profiles;

  -- ============================================================================
  -- ÉTAPE 5 : Vérifier les politiques RLS
  -- ============================================================================
  SELECT 
    policyname,
    cmd,
    qual
  FROM pg_policies
  WHERE tablename = 'profiles'
  ORDER BY policyname;
