# Guide d'importation : TP Titanic dans Portal Formation

## 🔍 Problème résolu

L'erreur "Type invalide: undefined" lors de l'importation du fichier `lms-titanic-big-data.json` a été corrigée.

## ✅ Corrections apportées

### 1. Amélioration de la validation des types

Le code de validation dans `AdminCourseEditJson.tsx` a été amélioré pour :
- Détecter la chaîne littérale `"undefined"` (pas seulement la valeur `undefined`)
- Normaliser automatiquement les types (minuscules, sans espaces)
- Mapper les variantes de types vers les types valides
- Fournir des types par défaut intelligents basés sur le contenu

### 2. Amélioration de la fonction de transformation

La fonction `convertSlidesFormatToCourseJson` garantit maintenant que :
- Tous les items ont toujours un type valide
- Les types sont normalisés avant validation
- Les types invalides sont automatiquement corrigés

## 📋 Structure attendue du fichier JSON

Votre fichier `lms-titanic-big-data.json` doit avoir cette structure :

```json
{
  "title": "Titre du cours",
  "description": "Description du cours",
  "status": "published",
  "access_type": "free",
  "price_cents": 0,
  "currency": "EUR",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Titre du module",
      "position": 0,
      "theme": { ... },
      "items": [
        {
          "type": "resource",
          "title": "Titre de l'item",
          "position": 0,
          "published": true,
          "content": { ... }
        },
        {
          "type": "tp",
          "title": "TP 1 : ...",
          "position": 1,
          "published": true,
          "content": {
            "description": "...",
            "instructions": { /* Format TipTap JSON */ },
            "checklist": [ ... ]
          }
        }
      ]
    }
  ]
}
```

## 🚀 Étapes d'importation

1. **Vérifiez votre fichier JSON** (optionnel mais recommandé) :
   ```bash
   cd titanic-learning-app
   node validate-and-fix-json.js
   ```

2. **Ouvrez Portal Formation** :
   - Allez dans l'interface d'administration
   - Créez un nouveau cours ou éditez un cours existant

3. **Importez le JSON** :
   - Cliquez sur "Mode JSON" ou "Éditer en JSON"
   - Collez le contenu complet de `lms-titanic-big-data.json`
   - Cliquez sur "Sauvegarder"

4. **Vérifiez le résultat** :
   - Le cours devrait être créé avec tous les modules et items
   - Vérifiez que les items de type "tp" sont bien présents

## 🔧 Types valides

Les types d'items acceptés sont :
- `resource` : Ressource de cours
- `slide` : Support de présentation
- `exercise` : Exercice pratique
- `activity` : Activité interactive
- `tp` : Travaux pratiques
- `game` : Jeu/Quiz interactif

## ⚠️ Notes importantes

1. **Assurez-vous d'être dans l'interface COURS**, pas ITEM
2. **Le fichier doit être un cours complet**, pas un item individuel
3. **Tous les items doivent avoir un type valide** dans la liste ci-dessus
4. **Les types sont normalisés automatiquement** (minuscules, sans espaces)

## 🐛 Si l'erreur persiste

1. **Vérifiez la console du navigateur** (F12) pour voir les erreurs détaillées
2. **Utilisez le fichier de test** `lms-titanic-big-data-TEST.json` pour tester avec une version simplifiée
3. **Vérifiez que le JSON est valide** avec `validate-and-fix-json.js`
4. **Vérifiez que vous n'avez pas de caractères invisibles** ou d'encodage incorrect

## 📝 Fichiers créés

- `validate-and-fix-json.js` : Script de validation et correction
- `lms-titanic-big-data-TEST.json` : Version de test simplifiée
- `FIX-UNDEFINED-TYPE-ERROR.md` : Documentation des corrections
