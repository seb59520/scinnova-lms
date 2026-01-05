# Solution : Créer les sessions manquantes pour les cours du programme

## 🔍 Situation actuelle

✅ Les enrollments ont été créés avec succès  
❌ Mais ils n'ont pas de `session_id` car **aucune session n'existe** pour ces cours

## ✅ Solution en 3 étapes

### Étape 1 : Identifier votre organisation

Exécutez cette requête pour trouver l'ID de votre organisation :

```sql
SELECT 
  o.id as org_id,
  o.name as organisation,
  COUNT(DISTINCT om.user_id) as nb_membres
FROM orgs o
LEFT JOIN org_members om ON om.org_id = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at DESC;
```

**Notez l'`org_id`** de votre organisation.

### Étape 2 : Vérifier que les apprenants sont membres de l'organisation

```sql
SELECT 
  p.full_name as nom_apprenant,
  o.name as organisation,
  CASE 
    WHEN om.id IS NULL THEN '❌ Pas membre'
    ELSE '✅ Membre'
  END as statut
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.user_id
JOIN programs pr ON pr.id = pe.program_id
LEFT JOIN org_members om ON om.user_id = pe.user_id
LEFT JOIN orgs o ON o.id = om.org_id
WHERE pe.status = 'active'
AND pr.title = 'Les API';
```

Si certains apprenants ne sont pas membres, ajoutez-les :

```sql
-- Remplacez 'ORG_ID' par l'ID de votre organisation
INSERT INTO org_members (org_id, user_id, role, display_name)
SELECT DISTINCT
  'ORG_ID'::uuid,  -- ⚠️ REMPLACEZ
  pe.user_id,
  'student' as role,
  p.full_name as display_name
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.user_id
JOIN programs pr ON pr.id = pe.program_id
LEFT JOIN org_members om ON om.user_id = pe.user_id AND om.org_id = 'ORG_ID'::uuid
WHERE pe.status = 'active'
AND pr.title = 'Les API'
AND om.id IS NULL
ON CONFLICT (org_id, user_id) DO NOTHING;
```

### Étape 3 : Créer les sessions et lier les enrollments

Exécutez le script `creer-sessions-pour-programme.sql` en remplaçant `'ORG_ID'` par l'ID de votre organisation.

Ou exécutez directement cette requête :

```sql
-- 1. Créer les sessions pour chaque cours du programme "Les API"
INSERT INTO sessions (org_id, course_id, title, status, created_by)
SELECT DISTINCT
  'ORG_ID'::uuid as org_id,  -- ⚠️ REMPLACEZ
  c.id as course_id,
  'Session ' || c.title || ' - ' || TO_CHAR(NOW(), 'DD/MM/YYYY') as title,
  'active' as status,
  auth.uid() as created_by
FROM program_courses pc
JOIN programs pr ON pr.id = pc.program_id
JOIN courses c ON c.id = pc.course_id
LEFT JOIN sessions s ON s.course_id = c.id 
  AND s.org_id = 'ORG_ID'::uuid  -- ⚠️ REMPLACEZ
  AND s.status = 'active'
WHERE pr.title = 'Les API'
AND s.id IS NULL;

-- 2. Lier tous les enrollments aux sessions
UPDATE enrollments e
SET session_id = (
  SELECT s.id 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1
)
WHERE e.status = 'active'
AND e.session_id IS NULL
AND EXISTS (
  SELECT 1 FROM org_members om WHERE om.user_id = e.user_id
)
AND EXISTS (
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
);
```

## ✅ Vérification

Après avoir exécuté les scripts, vérifiez avec :

```sql
SELECT 
  s.title as session_title,
  c.title as cours,
  COUNT(DISTINCT e.user_id) as nb_apprenants
FROM sessions s
JOIN courses c ON c.id = s.course_id
LEFT JOIN enrollments e ON e.session_id = s.id AND e.status = 'active'
WHERE s.status = 'active'
GROUP BY s.id, s.title, c.title;
```

Vous devriez voir 4 sessions (une par cours) avec 13 apprenants chacune.

## 🎯 Résultat attendu

Après ces étapes :
- ✅ 4 sessions créées (une par cours du programme "Les API")
- ✅ 52 enrollments liés aux sessions (13 apprenants × 4 cours)
- ✅ Les apprenants apparaissent dans le portail formateur

Rafraîchissez le portail formateur (`/trainer`) et vous devriez voir les sessions avec les apprenants !


