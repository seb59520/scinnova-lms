# Guide d'intégration du TP OpenAPI/Swagger dans le LMS

Ce guide explique comment intégrer le TP "Swagger UI / OpenAPI 3 – Création d'une API simple" dans votre application LMS.

## 📋 Fichiers fournis

1. **`tp-openapi-swagger-lms.json`** : Fichier JSON au format CourseJson de votre LMS
2. **`insert-tp-openapi-course.sql`** : Script SQL pour insérer le cours dans Supabase
3. **`INTEGRATION_LMS.md`** : Ce fichier (guide d'intégration)

## 🚀 Méthode 1 : Import via l'interface admin (recommandé)

### Étapes

1. **Accéder à l'interface d'administration**
   - Connectez-vous en tant qu'admin
   - Allez dans la section de gestion des cours

2. **Créer un nouveau cours**
   - Cliquez sur "Nouveau cours" ou "Créer un cours"
   - Sélectionnez "Éditer en JSON" ou "Import JSON"

3. **Importer le fichier JSON**
   - Ouvrez le fichier `tp-openapi-swagger-lms.json`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur JSON de l'interface admin
   - Cliquez sur "Sauvegarder"

4. **Vérifier l'import**
   - Vérifiez que le cours apparaît dans la liste
   - Vérifiez que les modules et items sont créés
   - Testez l'affichage du TP pour un étudiant

## 🗄️ Méthode 2 : Insertion directe en SQL

### Prérequis

- Accès à l'interface SQL de Supabase
- ID d'un utilisateur admin (pour `created_by`)

### Étapes

1. **Récupérer votre ID utilisateur**
   ```sql
   SELECT id, full_name, role 
   FROM profiles 
   WHERE role = 'admin' 
   LIMIT 1;
   ```
   Notez l'`id` retourné.

2. **Exécuter le script SQL**
   - Ouvrez le fichier `insert-tp-openapi-course.sql`
   - Remplacez `'VOTRE_USER_ID_ICI'` par votre ID utilisateur
   - Exécutez le script dans l'interface SQL de Supabase

3. **Vérifier l'insertion**
   ```sql
   SELECT c.id, c.title, COUNT(m.id) as nb_modules, COUNT(i.id) as nb_items
   FROM courses c
   LEFT JOIN modules m ON m.course_id = c.id
   LEFT JOIN items i ON i.module_id = m.id
   WHERE c.title LIKE '%OpenAPI%'
   GROUP BY c.id, c.title;
   ```

## 📁 Structure du cours importé

Le cours est organisé en **2 modules** :

### Module 1 : Contexte et objectifs
- **Item 1** : Ressource - Introduction au TP
- **Item 2** : Slide - Présentation des objectifs
- **Item 3** : Ressource - Prérequis et stack technique

### Module 2 : TP pratique
- **Item 1** : TP - Énoncé apprenant (instructions complètes)
- **Item 2** : Ressource - Exemples d'appels curl
- **Item 3** : Ressource - Checklist de conformité
- **Item 4** : Ressource - Documentation technique (README)

## 🔧 Personnalisation

### Modifier le titre ou la description

Éditez le fichier JSON et modifiez :
```json
{
  "title": "Votre titre personnalisé",
  "description": "Votre description personnalisée"
}
```

### Ajouter des modules ou items

Ajoutez des objets dans le tableau `modules` :
```json
{
  "modules": [
    {
      "title": "Nouveau module",
      "position": 3,
      "items": [
        {
          "type": "resource",
          "title": "Nouvelle ressource",
          "position": 1,
          "content": { ... }
        }
      ]
    }
  ]
}
```

### Modifier le thème

Changez les couleurs dans `theme` :
```json
{
  "theme": {
    "primaryColor": "#VOTRE_COULEUR",
    "secondaryColor": "#VOTRE_COULEUR",
    "fontFamily": "VotrePolice"
  }
}
```

## 📝 Notes importantes

### Format des instructions du TP

Les instructions du TP sont au format **TipTap** (doc JSON). Si vous modifiez les instructions, respectez ce format :

```json
{
  "instructions": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Votre texte ici"
          }
        ]
      }
    ]
  }
}
```

### Checklist

La checklist est un simple tableau de strings :
```json
{
  "checklist": [
    "Tâche 1",
    "Tâche 2",
    "Tâche 3"
  ]
}
```

### Fichiers externes

Le TP référence des fichiers dans le dossier `tp-openapi-swagger/` :
- `TP_ENONCE.md` : Énoncé complet
- `TP_CORRIGE.md` : Corrigé formateur
- `README.md` : Documentation technique
- `CHECKLIST.md` : Checklist de conformité

**Option 1** : Héberger ces fichiers sur un serveur et utiliser `external_url` dans les items  
**Option 2** : Copier le contenu dans le champ `content.body` des items de type `resource`

## 🎓 Utilisation pédagogique

### Pour les étudiants

1. Les étudiants accèdent au cours via le LMS
2. Ils suivent les modules dans l'ordre
3. Ils consultent l'énoncé du TP (Item 1 du Module 2)
4. Ils réalisent le TP en suivant les instructions
5. Ils utilisent la checklist pour vérifier leur travail

### Pour les formateurs

1. Accédez au corrigé via l'interface admin (si ajouté comme ressource)
2. Utilisez la grille de correction pour évaluer les travaux
3. Consultez la checklist de conformité pour vérifier la qualité

## 🔍 Dépannage

### Le cours n'apparaît pas après l'import

- Vérifiez que le statut est `"published"` ou changez-le en `"draft"` pour le modifier
- Vérifiez que vous êtes connecté avec un compte ayant les droits admin

### Les items ne s'affichent pas correctement

- Vérifiez que `"published": true` pour chaque item
- Vérifiez le format JSON (pas d'erreurs de syntaxe)
- Vérifiez que le type d'item est valide : `resource`, `slide`, `exercise`, `tp`, `game`

### Erreur SQL lors de l'insertion

- Vérifiez que toutes les tables existent (courses, modules, items)
- Vérifiez que l'ID utilisateur existe dans la table `profiles`
- Vérifiez que l'utilisateur a le rôle `admin` ou `instructor`

## 📞 Support

Pour toute question ou problème :
1. Vérifiez ce guide
2. Consultez la documentation de votre LMS
3. Vérifiez les logs Supabase pour les erreurs SQL

---

**Bon import ! 🚀**


