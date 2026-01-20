-- Script pour corriger le problème d'ajout de membres à une organisation
-- Ce script garantit que les admins peuvent ajouter des membres aux organisations
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer/Corriger la fonction is_admin() si elle n'existe pas ou a une mauvaise signature
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Créer/Corriger la fonction is_org_member_with_role() si elle n'existe pas
CREATE OR REPLACE FUNCTION public.is_org_member_with_role(
  p_user_id UUID,
  p_org_id UUID,
  p_roles TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Cette fonction utilise SECURITY DEFINER pour contourner RLS
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = p_user_id
    AND org_id = p_org_id
    AND role = ANY(p_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Supprimer TOUTES les anciennes politiques pour org_members
DROP POLICY IF EXISTS "Users can view their own org memberships" ON org_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON org_members;
DROP POLICY IF EXISTS "Trainers and admins can manage members in their orgs" ON org_members;
DROP POLICY IF EXISTS "Trainers and admins can view all members in their orgs" ON org_members;

-- 4. Recréer les politiques dans le bon ordre (les plus permissives en premier)

-- Politique 1 : Les utilisateurs peuvent voir leur propre membership
CREATE POLICY "Users can view their own org memberships" ON org_members
  FOR SELECT USING (user_id = auth.uid());

-- Politique 2 : Les admins peuvent TOUT faire (SELECT, INSERT, UPDATE, DELETE)
-- Cette politique doit être créée AVANT les autres pour avoir la priorité
CREATE POLICY "Admins can manage org members" ON org_members
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Politique 3 : Les trainers/admins d'org peuvent voir tous les membres de leur org
CREATE POLICY "Trainers and admins can view all members in their orgs" ON org_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR public.is_org_member_with_role(
      auth.uid(),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
  );

-- Politique 4 : Les trainers/admins d'org peuvent gérer les membres de leur org
-- (mais cette politique ne doit PAS bloquer les admins globaux)
CREATE POLICY "Trainers and admins can manage members in their orgs" ON org_members
  FOR ALL USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR public.is_org_member_with_role(
      auth.uid(),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_org_member_with_role(
      auth.uid(),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
  );

-- 5. Vérifier les politiques créées
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
WHERE tablename = 'org_members'
ORDER BY policyname;

-- 6. Test : Vérifier que la fonction is_admin() fonctionne
SELECT 
  auth.uid() as current_user_id,
  public.is_admin() as is_current_user_admin,
  (SELECT role FROM profiles WHERE id = auth.uid()) as current_user_role;

-- 7. Message de confirmation
SELECT '✅ Politiques RLS pour org_members corrigées. Les admins peuvent maintenant ajouter des membres.' as status;
