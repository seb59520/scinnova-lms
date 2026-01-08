# Guide d'intégration du TP WebSocket Chat dans le LMS

Ce guide explique comment intégrer le TP "Application de chat avec WebSocket" dans votre application LMS.

## 📋 Fichiers fournis

1. **`tp-websocket-chat-lms.json`** : Fichier JSON au format CourseJson de votre LMS
2. **`insert-tp-websocket-chat.sql`** : Script SQL pour insérer le cours dans Supabase
3. **`solutions-websocket-chat.json`** : Solutions complètes du TP (ressource)
4. **`INTEGRATION_LMS_WEBSOCKET.md`** : Ce fichier (guide d'intégration)

## 🚀 Méthode 1 : Import via l'interface admin (recommandé)

### Étapes

1. **Accéder à l'interface d'administration**
   - Connectez-vous en tant qu'admin
   - Allez dans la section de gestion des cours

2. **Créer un nouveau cours**
   - Cliquez sur "Nouveau cours" ou "Créer un cours"
   - Sélectionnez "Éditer en JSON" ou "Import JSON"

3. **Importer le fichier JSON**
   - Ouvrez le fichier `tp-websocket-chat-lms.json`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur JSON de l'interface admin
   - Cliquez sur "Sauvegarder"

4. **Vérifier l'import**
   - Vérifiez que le cours apparaît dans la liste
   - Vérifiez que les modules et items sont créés
   - Testez l'affichage du TP pour un étudiant

5. **Ajouter les solutions (optionnel)**
   - Dans le Module 2, vous pouvez ajouter une ressource avec le contenu de `solutions-websocket-chat.json`
   - Ou créer un item de type `resource` et copier le contenu du fichier solutions

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
   - Ouvrez le fichier `insert-tp-websocket-chat.sql`
   - Remplacez `'VOTRE_USER_ID_ICI'` par votre ID utilisateur
   - Exécutez le script dans l'interface SQL de Supabase

3. **Vérifier l'insertion**
   ```sql
   SELECT c.id, c.title, COUNT(m.id) as nb_modules, COUNT(i.id) as nb_items
   FROM courses c
   LEFT JOIN modules m ON m.course_id = c.id
   LEFT JOIN items i ON i.module_id = m.id
   WHERE c.title LIKE '%WebSocket%'
   GROUP BY c.id, c.title;
   ```

## 📁 Structure du cours importé

Le cours est organisé en **2 modules** :

### Module 1 : Contexte et préparation
- **Item 1** : Ressource - Introduction au TP
- **Item 2** : Ressource - Prérequis et ressources

### Module 2 : TP pratique
- **Item 1** : TP - Application de chat avec WebSocket (instructions complètes)
- **Item 2** : Ressource - Solutions complètes (optionnel, à ajouter manuellement)

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

### Fichiers de solutions

Le fichier `solutions-websocket-chat.json` contient les solutions complètes avec :
- Code complet de la classe WebSocketClient
- Interface HTML/CSS/JS complète
- Explications détaillées pour chaque étape
- Guide de tests et validation

**Option 1** : Ajouter comme ressource dans le Module 2  
**Option 2** : Conserver comme fichier de référence pour les formateurs

## 🎓 Utilisation pédagogique

### Pour les étudiants

1. Les étudiants accèdent au cours via le LMS
2. Ils suivent les modules dans l'ordre
3. Ils consultent l'énoncé du TP (Item 1 du Module 2)
4. Ils réalisent le TP en suivant les instructions
5. Ils utilisent la checklist pour vérifier leur travail
6. Ils peuvent consulter les solutions après avoir terminé (si ajoutées)

### Pour les formateurs

1. Accédez aux solutions via l'interface admin (si ajoutées comme ressource)
2. Utilisez la checklist pour évaluer les travaux
3. Vérifiez que tous les points de la checklist sont implémentés
4. Testez la reconnexion et le heartbeat avec les étudiants

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
- Vérifiez que l'ID utilisateur est bien un UUID valide

### Les solutions ne s'affichent pas

- Vérifiez que le fichier `solutions-websocket-chat.json` a été ajouté comme ressource
- Vérifiez que le contenu est au format JSON valide
- Vérifiez que l'item est publié (`"published": true`)

## 📚 Ressources supplémentaires

- **Documentation MDN WebSocket** : https://developer.mozilla.org/fr/docs/Web/API/WebSocket
- **RFC 6455** : https://tools.ietf.org/html/rfc6455
- **WebSocket.org** : https://www.websocket.org/echo.html

## ✅ Checklist d'intégration

- [ ] Fichier JSON importé ou script SQL exécuté
- [ ] Cours visible dans la liste des cours
- [ ] Modules et items créés correctement
- [ ] TP accessible et fonctionnel pour les étudiants
- [ ] Solutions ajoutées (optionnel)
- [ ] Test de l'affichage du TP réussi
- [ ] Checklist visible et fonctionnelle


