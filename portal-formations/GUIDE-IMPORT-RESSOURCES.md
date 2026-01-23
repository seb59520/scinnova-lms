# Guide d'import de ressources en masse

## 📋 Vue d'ensemble

Le système d'import de ressources permet d'importer plusieurs ressources à la fois dans une formation, un module ou un item. Trois méthodes d'import sont disponibles :

1. **CSV** : Format tabulaire simple
2. **JSON** : Format structuré
3. **URLs** : Import direct depuis une liste d'URLs

## 🚀 Utilisation

### Accès à la fonctionnalité

1. Accédez à la page d'édition d'une formation, module ou item
2. Dans la section "Ressources", cliquez sur le bouton **"Importer"**
3. Choisissez votre méthode d'import (CSV, JSON ou URLs)
4. Téléchargez le template si nécessaire
5. Remplissez le template ou saisissez vos données
6. Cliquez sur **"Importer"**

## 📝 Format CSV

### Structure du fichier CSV

Le fichier CSV doit contenir les colonnes suivantes :

- `title` (requis) : Titre de la ressource
- `description` (optionnel) : Description de la ressource
- `resource_type` (requis) : Type de ressource (`file`, `url`, `video`, `document`, `code`, `data`)
- `external_url` (requis pour `url` et `video`) : URL externe de la ressource
- `is_required` (optionnel) : `true` ou `false` (défaut: `false`)
- `is_visible` (optionnel) : `true` ou `false` (défaut: `true`)

### Exemple CSV

```csv
title,description,resource_type,external_url,is_required,is_visible
Documentation Python,Guide complet sur Python,url,https://docs.python.org/3/,true,true
Vidéo Introduction,Introduction à Python,video,https://www.youtube.com/watch?v=example,false,true
Article Medium,Article sur les bonnes pratiques,url,https://medium.com/example,false,true
Documentation officielle,Documentation officielle Python,url,https://www.python.org/doc/,true,true
```

## 📄 Format JSON

### Structure du fichier JSON

Le fichier JSON doit contenir un objet avec un tableau `resources` :

```json
{
  "resources": [
    {
      "title": "Documentation Python",
      "description": "Guide complet sur Python",
      "resource_type": "url",
      "external_url": "https://docs.python.org/3/",
      "is_required": true,
      "is_visible": true
    },
    {
      "title": "Vidéo Introduction",
      "description": "Introduction à Python",
      "resource_type": "video",
      "external_url": "https://www.youtube.com/watch?v=example",
      "is_required": false,
      "is_visible": true
    }
  ]
}
```

### Champs JSON

- `title` (requis) : Titre de la ressource
- `description` (optionnel) : Description de la ressource
- `resource_type` (requis) : Type de ressource (`file`, `url`, `video`, `document`, `code`, `data`)
- `external_url` (requis pour `url` et `video`) : URL externe de la ressource
- `is_required` (optionnel) : `true` ou `false` (défaut: `false`)
- `is_visible` (optionnel) : `true` ou `false` (défaut: `true`)

## 🔗 Import par URLs

### Format

Saisissez simplement une URL par ligne dans le champ texte. Le système :

- Détecte automatiquement si c'est une vidéo (YouTube, Vimeo)
- Génère un titre à partir du nom de domaine
- Crée une description automatique

### Exemple

```
https://docs.python.org/3/
https://www.youtube.com/watch?v=example
https://medium.com/article
https://www.python.org/doc/
```

## 🎯 Types de ressources

| Type | Description | External URL requis |
|------|-------------|---------------------|
| `file` | Fichier générique | Non |
| `url` | Lien externe | Oui |
| `video` | Vidéo (YouTube, Vimeo, etc.) | Oui |
| `document` | Document (PDF, DOCX, etc.) | Non |
| `code` | Code source | Non |
| `data` | Données (CSV, JSON, Excel) | Non |

## ✅ Validation

Le système valide automatiquement :

- Présence des champs requis (`title`, `resource_type`)
- Validité du type de ressource
- Présence de `external_url` pour les types `url` et `video`
- Format des URLs (pour l'import par URLs)
- Permissions de l'utilisateur (admin, trainer, instructor uniquement)

## 📊 Résultats de l'import

Après l'import, vous verrez :

- Le nombre de ressources importées avec succès
- Les erreurs éventuelles (avec détails)
- Les ressources ajoutées apparaîtront dans la liste

## 💡 Conseils

1. **Utilisez les templates** : Téléchargez toujours le template pour éviter les erreurs de format
2. **Vérifiez les URLs** : Assurez-vous que les URLs sont valides et accessibles
3. **Testez avec quelques ressources** : Commencez par importer quelques ressources pour vérifier le format
4. **Gérez les erreurs** : En cas d'erreur, corrigez le fichier et réessayez

## 🔒 Permissions

Seuls les utilisateurs avec les rôles suivants peuvent importer des ressources :

- `admin`
- `trainer`
- `instructor`

## 🐛 Dépannage

### Erreur : "En-têtes manquants"
- Vérifiez que votre fichier CSV contient bien les colonnes `title` et `resource_type`

### Erreur : "external_url requis pour les types url et video"
- Assurez-vous que les ressources de type `url` ou `video` ont bien un champ `external_url` rempli

### Erreur : "URL invalide"
- Vérifiez que les URLs commencent par `http://` ou `https://`
- Vérifiez qu'il n'y a pas d'espaces dans les URLs

### Erreur : "Vous n'avez pas les permissions"
- Contactez un administrateur pour obtenir les permissions nécessaires
