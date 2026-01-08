# Solution : 0 apprenants inscrits dans une session

## 🔍 Diagnostic

Si vous voyez "0 apprenants inscrits" et "0 soumissions totales", cela signifie que :
- ✅ La session existe et est active
- ❌ **Aucun enrollment n'est lié à cette session** (`session_id` est NULL ou incorrect)

## ✅ Solution en 3 étapes

### Étape 1 : Vérifier les enrollments sans session

Exécutez cette requête pour voir les enrollments qui ne sont pas liés à une session :

```sql
SELECT 
  e.id as enrollment_id,
  p.full_name as nom_apprenant,
  c.title as cours,
  e.status,
  e.session_id,
  CASE 
    WHEN e.session_id IS NULL THEN '⚠️ Pas de session'
    ELSE '✅ Déjà lié'
  END as etat
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN courses c ON c.id = e.course_id
WHERE e.status = 'active'
AND e.session_id IS NULL
ORDER BY c.title, p.full_name;
```

### Étape 2 : Lier les enrollments à la session

Exécutez cette requête pour lier automatiquement tous les enrollments actifs à leur session correspondante :

```sql
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
  SELECT 1 
  FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
)
RETURNING 
  e.id,
  (SELECT full_name FROM profiles WHERE id = e.user_id) as nom_apprenant,
  (SELECT title FROM courses WHERE id = e.course_id) as cours,
  (SELECT title FROM sessions WHERE id = e.session_id) as session_title;
```

### Étape 3 : Vérifier que les apprenants sont membres de l'organisation

Les apprenants doivent être membres de l'organisation de la session. Vérifiez avec :

```sql
SELECT 
  p.full_name as nom_apprenant,
  o.name as organisation,
  CASE 
    WHEN om.id IS NULL THEN '❌ Pas membre'
    ELSE '✅ Membre'
  END as statut
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN sessions s ON s.id = e.session_id
JOIN orgs o ON o.id = s.org_id
LEFT JOIN org_members om ON om.user_id = e.user_id AND om.org_id = o.id
WHERE e.status = 'active'
AND s.status = 'active'
ORDER BY o.name, p.full_name;
```

Si certains apprenants ne sont pas membres, ajoutez-les :

```sql
INSERT INTO org_members (org_id, user_id, role, display_name)
SELECT DISTINCT
  s.org_id,
  e.user_id,
  'student' as role,
  p.full_name as display_name
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN sessions s ON s.id = e.session_id
LEFT JOIN org_members om ON om.user_id = e.user_id AND om.org_id = s.org_id
WHERE e.status = 'active'
AND s.status = 'active'
AND om.id IS NULL
ON CONFLICT (org_id, user_id) DO NOTHING;
```

## 🎯 Script complet

Le fichier `lier-apprenants-session.sql` contient toutes ces requêtes dans l'ordre. Exécutez-le étape par étape.

## ✅ Vérification finale

Après avoir exécuté les scripts, rafraîchissez le portail formateur (`/trainer/session/:sessionId`) et vous devriez voir :
- ✅ Le nombre d'apprenants inscrits > 0
- ✅ La liste des apprenants avec leurs soumissions
- ✅ Les boutons "Détails" fonctionnels

## 💡 Pourquoi cela arrive ?

Cela arrive quand :
1. Les enrollments ont été créés **avant** la création de la session
2. Le trigger automatique (`update_enrollment_session`) n'est pas actif
3. Les apprenants ne sont pas membres de l'organisation de la session

## 🔧 Prévention

Pour éviter ce problème à l'avenir :
1. Créez d'abord la session
2. Ensuite, créez les enrollments (ils seront automatiquement liés si le trigger est actif)
3. Ou exécutez régulièrement le script de liaison



