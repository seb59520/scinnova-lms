# Guide de création du cours "Conception et développement d'API performantes et sécurisées"

## 📚 Description

Ce script SQL crée la structure complète du cours avec :
- **1 cours** : "Conception et développement d'API performantes et sécurisées"
- **10 modules** : Chaque module contient ses métadonnées (finalité, compétences, contenus, livrables)

## 🚀 Utilisation

### Étape 1 : Obtenir votre UUID utilisateur

Avant d'exécuter le script, vous devez obtenir l'UUID d'un utilisateur avec le rôle `admin` ou `instructor` :

```sql
SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;
```

Ou si vous connaissez votre email :

```sql
SELECT p.id 
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'votre-email@example.com';
```

### Étape 2 : Modifier le script

Ouvrez le fichier `create-course-api-performantes-securisees.sql` et remplacez :

```sql
user_uuid UUID := 'VOTRE_USER_ID'::UUID;
```

par :

```sql
user_uuid UUID := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::UUID;
```

(où `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` est votre UUID réel)

### Étape 3 : Exécuter le script

Exécutez le script dans l'interface SQL de Supabase ou via psql :

```bash
psql -h votre-host -U votre-user -d votre-database -f create-course-api-performantes-securisees.sql
```

Ou copiez-collez le contenu dans l'éditeur SQL de Supabase.

## 📊 Structure créée

Le script crée la hiérarchie complète :

```
📚 Conception et développement d'API performantes et sécurisées
  ├── 📦 Module 1: Fondations des architectures d'API
  │   └── 📄 Métadonnées du module M1 (finalité, compétences, contenus, livrables)
  ├── 📦 Module 2: Conception contractuelle et approche API-first
  │   └── 📄 Métadonnées du module M2
  ├── 📦 Module 3: Modélisation, persistance et gestion des données
  │   └── 📄 Métadonnées du module M3
  ├── 📦 Module 4: Sécurité des API – Security by Design
  │   └── 📄 Métadonnées du module M4
  ├── 📦 Module 5: Gestion des erreurs et observabilité
  │   └── 📄 Métadonnées du module M5
  ├── 📦 Module 6: Tests, qualité et fiabilité des API
  │   └── 📄 Métadonnées du module M6
  ├── 📦 Module 7: Performance et scalabilité
  │   └── 📄 Métadonnées du module M7
  ├── 📦 Module 8: Architectures distribuées et event-driven
  │   └── 📄 Métadonnées du module M8
  ├── 📦 Module 9: Déploiement continu et exploitation
  │   └── 📄 Métadonnées du module M9
  └── 📦 Module 10: Projet fil rouge Full-Stack
      └── 📄 Métadonnées du module M10
```

## 📋 Contenu des modules

Chaque module contient un item de type `resource` avec les métadonnées suivantes stockées dans le champ `content` JSONB :

- **module_id** : Identifiant du module (M1, M2, etc.)
- **finalite** : Finalité pédagogique du module
- **competences** : Liste des compétences visées
- **contenus** : Liste des contenus abordés
- **livrables** : Liste des livrables attendus

## ⚠️ Notes importantes

- **Le cours est créé en statut `published`** : il sera visible par tous les utilisateurs
- **Le cours est en accès `free`** : vous pouvez le modifier après création
- **Les métadonnées sont stockées dans des items de type `resource`** : vous pouvez les consulter et les modifier via l'interface d'édition
- **Les items sont publiés** : ils sont visibles par défaut

## 🔧 Personnalisation

Après la création, vous pouvez :

1. **Ajouter du contenu aux modules** : Créez des items supplémentaires (leçons, exercices, TP) dans chaque module
2. **Modifier les métadonnées** : Éditez les items de métadonnées via l'interface admin (`/admin/courses/{courseId}/edit`)
3. **Ajouter des chapitres** : Créez des chapitres dans les items pour structurer le contenu
4. **Réorganiser les modules** : Modifiez les positions via l'interface

## 🐛 Dépannage

### Erreur : "invalid input syntax for type uuid"

- Vérifiez que vous avez bien remplacé `'VOTRE_USER_ID'` par un UUID valide
- L'UUID doit être au format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Erreur : "violates foreign key constraint"

- Vérifiez que l'utilisateur avec l'UUID existe dans la table `profiles`
- Vérifiez que l'utilisateur a le rôle `admin` ou `instructor`

### Erreur : "relation does not exist"

- Vérifiez que toutes les tables existent (exécutez `SCHEMA-COMPLET-TOUTES-LES-TABLES.sql`)

## 📝 Exemple de requête pour consulter les métadonnées

Pour consulter les métadonnées d'un module après création :

```sql
SELECT 
  m.title as module_title,
  i.content->>'module_id' as module_id,
  i.content->>'finalite' as finalite,
  i.content->'competences' as competences,
  i.content->'contenus' as contenus,
  i.content->'livrables' as livrables
FROM modules m
JOIN items i ON i.module_id = m.id
WHERE m.course_id = 'VOTRE_COURSE_ID'
  AND i.title LIKE 'Métadonnées%'
ORDER BY m.position;
```

