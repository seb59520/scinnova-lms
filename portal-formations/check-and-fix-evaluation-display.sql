-- =====================================================
-- Vérifier et corriger l'affichage des évaluations
-- Programme: 2d756d25-4f43-4f34-bed8-c0646e555e15
-- =====================================================

-- 1. Vérifier que l'évaluation existe pour ce programme
SELECT 
  id,
  program_id,
  title,
  is_published,
  created_at,
  created_by
FROM program_evaluations
WHERE program_id = '2d756d25-4f43-4f34-bed8-c0646e555e15'
ORDER BY created_at DESC;

-- 2. Vérifier les politiques RLS actuelles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'program_evaluations'
ORDER BY policyname;

-- 3. Corriger les politiques RLS pour permettre aux trainers de voir toutes les évaluations
-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "evaluations_trainer_manage" ON program_evaluations;

-- Nouvelle politique: les trainers peuvent gérer toutes les évaluations
CREATE POLICY "evaluations_trainer_manage" ON program_evaluations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- S'assurer que la politique admin existe
DROP POLICY IF EXISTS "evaluations_admin_all" ON program_evaluations;
CREATE POLICY "evaluations_admin_all" ON program_evaluations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Vérifier le rôle de l'utilisateur actuel (remplacez USER_ID par votre ID)
-- SELECT id, full_name, role FROM profiles WHERE id = auth.uid();

-- 5. Test: Vérifier que l'évaluation est accessible
SELECT 
  pe.id,
  pe.title,
  pe.is_published,
  p.title as program_title
FROM program_evaluations pe
JOIN programs p ON p.id = pe.program_id
WHERE pe.program_id = '2d756d25-4f43-4f34-bed8-c0646e555e15';
