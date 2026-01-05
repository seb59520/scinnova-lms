# Guide : Quand les apprenants apparaissent dans le portail formateur

## 📋 Conditions pour qu'un apprenant apparaisse

Un apprenant apparaît dans la liste des apprenants d'une session **UNIQUEMENT** si toutes ces conditions sont remplies :

### ✅ Condition 1 : L'apprenant doit avoir un enrollment actif
- Il doit exister un enregistrement dans la table `enrollments`
- Avec `course_id` = le cours de la session
- Avec `status` = `'active'`
- Avec `session_id` = l'ID de la session (ou NULL si le trigger automatique doit le remplir)

### ✅ Condition 2 : L'apprenant doit être membre d'une organisation
- Il doit exister un enregistrement dans `org_members`
- Avec `org_id` = l'organisation de la session
- Avec `role` = `'student'` (ou autre rôle apprenant)

### ✅ Condition 3 : La session doit exister et être active
- Une session doit exister dans la table `sessions`
- Avec `status` = `'active'`
- Avec `org_id` = l'organisation de l'apprenant
- Avec `course_id` = le cours de l'enrollment

## 🔄 Attribution automatique de session

Si vous avez exécuté le script `add-session-support.sql`, un trigger automatique peut lier les enrollments aux sessions :

1. **Quand un enrollment est créé** :
   - Le trigger cherche une session active pour le cours et l'organisation de l'apprenant
   - Si trouvée, il met à jour automatiquement `session_id` dans l'enrollment

2. **Quand une soumission est créée** :
   - Le trigger cherche la session de l'apprenant pour ce cours
   - Si trouvée, il lie automatiquement la soumission à la session

## 📝 Processus complet pour ajouter un apprenant

### Option 1 : Via l'interface Admin (recommandé)

1. **Créer/Configurer l'organisation** :
   - Aller sur `/admin/orgs`
   - Créer une organisation si elle n'existe pas

2. **Ajouter l'apprenant à l'organisation** :
   - Aller sur `/admin/users`
   - Trouver l'utilisateur
   - L'ajouter à l'organisation avec le rôle `student`

3. **Créer une session** :
   - Aller sur `/trainer`
   - Créer une session pour le cours et l'organisation

4. **Inscrire l'apprenant au cours** :
   - Aller sur `/admin/courses/:courseId/enrollments`
   - Cliquer sur "Ajouter des inscriptions"
   - Sélectionner l'apprenant
   - L'enrollment sera automatiquement lié à la session si le trigger est actif

### Option 2 : Via SQL (pour tester rapidement)

```sql
-- 1. Vérifier que l'organisation existe
SELECT * FROM orgs WHERE slug = 'votre-org-slug';

-- 2. Ajouter l'apprenant à l'organisation
INSERT INTO org_members (org_id, user_id, role, display_name)
SELECT 
  o.id,
  'USER_ID_APPRENANT'::uuid,
  'student',
  'Nom Apprenant'
FROM orgs o
WHERE o.slug = 'votre-org-slug'
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 3. Vérifier que la session existe
SELECT * FROM sessions 
WHERE org_id = (SELECT id FROM orgs WHERE slug = 'votre-org-slug')
AND status = 'active';

-- 4. Créer l'enrollment avec session_id
INSERT INTO enrollments (user_id, course_id, session_id, status, source)
SELECT 
  'USER_ID_APPRENANT'::uuid,
  'COURSE_ID'::uuid,
  s.id,
  'active',
  'manual'
FROM sessions s
WHERE s.org_id = (SELECT id FROM orgs WHERE slug = 'votre-org-slug')
AND s.course_id = 'COURSE_ID'::uuid
AND s.status = 'active'
LIMIT 1
ON CONFLICT (user_id, course_id) DO UPDATE SET
  session_id = EXCLUDED.session_id,
  status = 'active';
```

## 🔍 Vérifier pourquoi un apprenant n'apparaît pas

### Étape 1 : Vérifier l'enrollment

```sql
-- Vérifier les enrollments pour un cours
-- Remplacez 'COURSE_ID' par l'ID du cours, ou utilisez la version automatique ci-dessous

-- Version automatique (trouve le cours M1 FULL-STACK)
SELECT 
  e.*,
  p.full_name as nom_apprenant,
  c.title as course_title,
  s.title as session_title,
  CASE 
    WHEN e.session_id IS NULL THEN '⚠️ session_id NULL'
    WHEN e.session_id = s.id THEN '✅ Bien lié'
    ELSE '❌ Problème'
  END as status
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN courses c ON c.id = e.course_id
LEFT JOIN sessions s ON s.id = e.session_id
WHERE c.title ILIKE '%M1 FULL-STACK%'
ORDER BY e.created_at DESC;
```

**Problèmes possibles :**
- ❌ Pas d'enrollment → Créer un enrollment
- ❌ `status` = `'pending'` ou `'revoked'` → Mettre à `'active'`
- ❌ `session_id` = NULL → Le trigger devrait le remplir automatiquement, sinon le faire manuellement

### Étape 2 : Vérifier l'organisation

```sql
-- Vérifier si l'apprenant est membre d'une organisation
SELECT 
  om.*,
  o.name as org_name,
  o.slug as org_slug
FROM org_members om
JOIN orgs o ON o.id = om.org_id
WHERE om.user_id = 'USER_ID_APPRENANT'::uuid;
```

**Problèmes possibles :**
- ❌ Pas de membre d'organisation → Ajouter à `org_members`
- ❌ Organisation différente de la session → Vérifier que c'est la même `org_id`

### Étape 3 : Vérifier la session

```sql
-- Vérifier les sessions actives pour ce cours et cette organisation
SELECT 
  s.*,
  c.title as course_title,
  o.name as org_name
FROM sessions s
JOIN courses c ON c.id = s.course_id
JOIN orgs o ON o.id = s.org_id
WHERE s.course_id = 'COURSE_ID'::uuid
AND s.org_id = (
  SELECT org_id FROM org_members 
  WHERE user_id = 'USER_ID_APPRENANT'::uuid 
  LIMIT 1
)
AND s.status = 'active';
```

**Problèmes possibles :**
- ❌ Pas de session → Créer une session
- ❌ `status` = `'draft'` ou `'archived'` → Mettre à `'active'`
- ❌ `org_id` différent → Vérifier la cohérence

### Étape 4 : Vérifier le lien enrollment-session

```sql
-- Vérifier si l'enrollment est bien lié à la session
SELECT 
  e.id as enrollment_id,
  e.user_id,
  e.course_id,
  e.session_id,
  s.id as session_id_check,
  s.title as session_title,
  CASE 
    WHEN e.session_id = s.id THEN '✅ Lié'
    WHEN e.session_id IS NULL THEN '⚠️ session_id NULL'
    ELSE '❌ session_id différent'
  END as status
FROM enrollments e
LEFT JOIN sessions s ON s.course_id = e.course_id 
  AND s.org_id = (SELECT org_id FROM org_members WHERE user_id = e.user_id LIMIT 1)
  AND s.status = 'active'
WHERE e.user_id = 'USER_ID_APPRENANT'::uuid
AND e.course_id = 'COURSE_ID'::uuid;
```

**Solution si `session_id` est NULL :**
```sql
-- Mettre à jour manuellement les enrollments avec leur session
-- Version automatique qui met à jour tous les enrollments sans session_id
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
WHERE e.session_id IS NULL
AND EXISTS (
  SELECT 1 FROM sessions s
  JOIN org_members om ON om.org_id = s.org_id
  WHERE s.course_id = e.course_id
  AND om.user_id = e.user_id
  AND s.status = 'active'
)
RETURNING 
  e.id,
  e.user_id,
  e.course_id,
  e.session_id,
  (SELECT full_name FROM profiles WHERE id = e.user_id) as nom_apprenant;
```

## 🎯 Checklist rapide

Pour qu'un apprenant apparaisse dans `/trainer/session/:sessionId`, vérifier :

- [ ] L'apprenant existe dans `profiles`
- [ ] L'apprenant est membre d'une organisation (`org_members`)
- [ ] L'apprenant a un enrollment actif (`enrollments` avec `status = 'active'`)
- [ ] L'enrollment a un `course_id` correspondant au cours de la session
- [ ] L'enrollment a un `session_id` correspondant à la session (ou NULL si le trigger doit le remplir)
- [ ] Une session existe avec `status = 'active'` pour ce cours et cette organisation
- [ ] L'organisation de l'apprenant correspond à l'organisation de la session

## 🚀 Script de diagnostic complet

Exécutez ce script pour diagnostiquer pourquoi un apprenant n'apparaît pas :

```sql
-- Diagnostic complet pour tous les apprenants d'une session
-- Remplacez 'SESSION_ID' par l'ID de la session, ou utilisez la version automatique

-- Version automatique (utilise la première session active)
WITH session_info AS (
  SELECT id as session_id, course_id, org_id 
  FROM sessions 
  WHERE status = 'active' 
  ORDER BY created_at DESC 
  LIMIT 1
),
apprenants AS (
  SELECT DISTINCT e.user_id, si.course_id, si.session_id
  FROM enrollments e
  CROSS JOIN session_info si
  WHERE e.session_id = si.session_id
  AND e.status = 'active'
)
SELECT 
  '1. Profil' as etape,
  CASE WHEN p.id IS NOT NULL THEN '✅ Existe' ELSE '❌ N''existe pas' END as status,
  p.full_name as details
FROM apprenants a
LEFT JOIN profiles p ON p.id = a.user_id

UNION ALL

SELECT 
  '2. Membre organisation' as etape,
  CASE WHEN om.id IS NOT NULL THEN '✅ Membre' ELSE '❌ Pas membre' END as status,
  o.name as details
FROM apprenants a
LEFT JOIN org_members om ON om.user_id = a.user_id
LEFT JOIN orgs o ON o.id = om.org_id

UNION ALL

SELECT 
  '3. Enrollment' as etape,
  CASE 
    WHEN e.id IS NULL THEN '❌ Pas d''enrollment'
    WHEN e.status != 'active' THEN '⚠️ Status: ' || e.status
    ELSE '✅ Enrollment actif'
  END as status,
  c.title as details
FROM apprenant a
LEFT JOIN enrollments e ON e.user_id = a.user_id AND e.course_id = a.course_id
LEFT JOIN courses c ON c.id = e.course_id

UNION ALL

SELECT 
  '4. Session' as etape,
  CASE 
    WHEN s.id IS NULL THEN '❌ Pas de session'
    WHEN s.status != 'active' THEN '⚠️ Status: ' || s.status
    ELSE '✅ Session active'
  END as status,
  s.title as details
FROM apprenant a
LEFT JOIN org_members om ON om.user_id = a.user_id
LEFT JOIN sessions s ON s.org_id = om.org_id AND s.course_id = a.course_id

UNION ALL

SELECT 
  '5. Lien enrollment-session' as etape,
  CASE 
    WHEN e.session_id IS NULL THEN '⚠️ session_id NULL'
    WHEN e.session_id = s.id THEN '✅ Bien lié'
    ELSE '❌ session_id différent'
  END as status,
  s.title as details
FROM apprenant a
LEFT JOIN enrollments e ON e.user_id = a.user_id AND e.course_id = a.course_id
LEFT JOIN org_members om ON om.user_id = a.user_id
LEFT JOIN sessions s ON s.org_id = om.org_id AND s.course_id = a.course_id AND s.status = 'active';
```

## 💡 Résumé

**Les apprenants apparaissent dès que :**
1. ✅ Ils ont un enrollment actif (`status = 'active'`)
2. ✅ Cet enrollment est lié à une session (`session_id` non NULL)
3. ✅ La session est active (`status = 'active'`)
4. ✅ L'apprenant est membre de l'organisation de la session

**Ils n'apparaissent PAS si :**
- ❌ Pas d'enrollment pour ce cours
- ❌ Enrollment avec `status` != `'active'`
- ❌ `session_id` = NULL dans l'enrollment
- ❌ Pas de session active pour ce cours et cette organisation
- ❌ L'apprenant n'est pas membre de l'organisation de la session

