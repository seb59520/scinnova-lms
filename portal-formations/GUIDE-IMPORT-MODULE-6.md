# Guide d'import du Module 6 : Du client-serveur aux API

Ce guide vous explique comment importer le Module 6 dans votre cours "Architecture client–serveur et bases du Web".

## 🚀 Méthode rapide : Utiliser l'outil de fusion

**Recommandé** : Utilisez l'outil automatique pour fusionner le Module 6 :

```bash
cd portal-formations
node fusionner-module-6.cjs
```

Cet outil :
- ✅ Fusionne automatiquement le Module 6 avec le cours
- ✅ Gère les positions des modules
- ✅ Crée un fichier de sortie séparé (ne modifie pas l'original)
- ✅ Détecte et remplace le Module 6 s'il existe déjà

Consultez `README-FUSION-MODULE-6.md` pour plus de détails.

---

## 📋 Méthode manuelle

### ⚠️ Important

L'import JSON dans l'interface d'administration **remplace tous les modules existants**. Vous devez donc d'abord exporter votre cours complet, ajouter le Module 6, puis réimporter.

## 📋 Étapes d'import

### Étape 1 : Exporter le cours existant

1. Allez dans l'administration : `/admin/courses/{courseId}/json`
   - Remplacez `{courseId}` par l'ID de votre cours "Architecture client–serveur et bases du Web"
2. Cliquez sur le bouton **"Exporter"** (icône téléchargement)
3. Sauvegardez le fichier JSON (par exemple : `architecture-client-serveur-web-backup.json`)

### Étape 2 : Ajouter le Module 6 au JSON exporté

1. Ouvrez le fichier JSON exporté dans un éditeur de texte
2. Ouvrez le fichier `module-6-client-serveur-api.json` (contenant uniquement le Module 6)
3. Dans le JSON exporté, trouvez le tableau `"modules"` (ligne ~11)
4. Ajoutez le Module 6 à la fin du tableau `modules`, juste avant la fermeture du tableau

**Exemple :**

```json
{
  "title": "Architecture client–serveur et bases du Web",
  "description": "...",
  "modules": [
    {
      "title": "Module 1 : ...",
      ...
    },
    {
      "title": "Module 5 : ...",
      ...
    },
    {
      "title": "Module 6 : Du client-serveur aux API",
      "position": 6,
      "theme": {
        "primaryColor": "#6366F1",
        "secondaryColor": "#4F46E5"
      },
      "items": [
        ...
      ]
    }
  ]
}
```

**⚠️ Important :** Assurez-vous que :
- Le Module 6 est bien dans le tableau `modules` (entre les crochets `[...]`)
- Il y a une virgule `,` après le Module 5 et avant le Module 6
- Le JSON reste valide (vous pouvez le valider avec un outil en ligne)

### Étape 3 : Réimporter le cours complet

1. Retournez sur la page d'édition JSON du cours : `/admin/courses/{courseId}/json`
2. Cliquez sur **"Importer JSON"** (icône upload)
3. Sélectionnez le fichier JSON modifié (avec le Module 6 ajouté)
4. Vérifiez l'aperçu pour confirmer que tous les modules sont présents
5. Cliquez sur **"Sauvegarder"**

## ✅ Vérification

Après l'import, vérifiez que :
- Tous les modules sont présents (1 à 6)
- Le Module 6 apparaît bien en position 6
- Tous les items du Module 6 sont visibles (7 items au total)

## 🔄 Alternative : Ajout manuel via l'interface

Si vous préférez ne pas utiliser l'import JSON, vous pouvez :

1. Aller sur `/admin/courses/{courseId}` (édition normale, pas JSON)
2. Cliquer sur **"Ajouter un module"**
3. Donner le titre : "Module 6 : Du client-serveur aux API"
4. Ajouter les items un par un en copiant le contenu depuis `module-6-client-serveur-api.json`

## 📁 Fichiers disponibles

- `module-6-client-serveur-api.json` : Module 6 seul (à ajouter au cours)
- `architecture-client-serveur-web.json` : Cours complet avec Module 6 inclus

## 🆘 En cas de problème

Si l'import échoue :
1. Vérifiez que le JSON est valide (utilisez un validateur JSON en ligne)
2. Vérifiez qu'il n'y a pas de virgules en trop ou manquantes
3. Assurez-vous que tous les modules ont un `position` unique
4. Vérifiez la console du navigateur pour les erreurs détaillées

