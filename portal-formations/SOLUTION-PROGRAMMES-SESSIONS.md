# Solution : Apprenants via programmes et sessions

## 🔍 Problème identifié

Si vos utilisateurs sont inscrits à un **programme** (qui contient plusieurs formations), le problème vient probablement de :

1. **Les enrollments sont créés automatiquement** via le trigger `inherit_course_access_from_program()`
2. **Mais ces enrollments n'ont pas de `session_id`** car ils sont créés sans passer par le trigger de session
3. **Les apprenants n'apparaissent donc pas** dans le portail formateur

## ✅ Solution en 4 étapes

### Étape 1 : Diagnostic

Exécutez le script `lier-apprenants-session-avec-programmes.sql` pour voir :
- Combien d'apprenants sont inscrits via des programmes
- Combien d'enrollments ont été créés
- Combien ont un `session_id`

### Étape 2 : Vérifier que les apprenants sont membres de l'organisation

Les apprenants doivent être membres de l'organisation de la session. Vérifiez avec :

```sql
SELECT 
  p.full_name as nom_apprenant,
  pr.title as programme,
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
WHERE pe.status = 'active';
```

### Étape 3 : Lier les enrollments aux sessions

Exécutez cette requête pour lier tous les enrollments (créés via programme ou directement) aux sessions :

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

### Étape 4 : Créer les enrollments manquants (si nécessaire)

Si le trigger n'a pas créé les enrollments, créez-les manuellement :

```sql
INSERT INTO enrollments (user_id, course_id, status, source, enrolled_at)
SELECT DISTINCT
  pe.user_id,
  pc.course_id,
  'active' as status,
  'manual' as source,
  pe.enrolled_at
FROM program_enrollments pe
JOIN program_courses pc ON pc.program_id = pe.program_id
LEFT JOIN enrollments e ON e.user_id = pe.user_id AND e.course_id = pc.course_id
WHERE pe.status = 'active'
AND e.id IS NULL
ON CONFLICT (user_id, course_id) DO NOTHING;
```

## 🔧 Amélioration du trigger (optionnel)

Pour que les enrollments créés via les programmes aient automatiquement un `session_id`, modifiez le trigger `inherit_course_access_from_program()` :

```sql
CREATE OR REPLACE FUNCTION inherit_course_access_from_program()
RETURNS TRIGGER AS $$
DECLARE
  course_record RECORD;
  v_session_id UUID;
BEGIN
  IF NEW.status = 'active' THEN
    FOR course_record IN
      SELECT course_id
      FROM program_courses
      WHERE program_id = NEW.program_id
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM enrollments
        WHERE user_id = NEW.user_id
          AND course_id = course_record.course_id
      ) THEN
        -- Trouver la session pour ce cours et cette organisation
        SELECT s.id INTO v_session_id
        FROM sessions s
        JOIN org_members om ON om.org_id = s.org_id
        WHERE s.course_id = course_record.course_id
        AND om.user_id = NEW.user_id
        AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1;
        
        INSERT INTO enrollments (
          user_id,
          course_id,
          status,
          source,
          enrolled_at,
          session_id
        )
        VALUES (
          NEW.user_id,
          course_record.course_id,
          NEW.status,
          'manual',
          NEW.enrolled_at,
          v_session_id
        )
        ON CONFLICT (user_id, course_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📋 Checklist

- [ ] Les apprenants sont inscrits à un programme (`program_enrollments`)
- [ ] Les enrollments aux cours ont été créés (`enrollments`)
- [ ] Les apprenants sont membres de l'organisation (`org_members`)
- [ ] Les enrollments ont un `session_id` (sinon, exécutez l'étape 3)
- [ ] Les sessions existent et sont actives

## 💡 Résumé

**Le problème :** Les enrollments créés automatiquement via les programmes n'ont pas de `session_id`.

**La solution :** Exécutez le script `lier-apprenants-session-avec-programmes.sql` qui :
1. Diagnostique la situation
2. Lie les enrollments aux sessions
3. Crée les enrollments manquants si nécessaire


