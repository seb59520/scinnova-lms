# Guide de résolution : Erreur de type lors de l'importation de fichiers TP

## 🔍 Problème

Lors de l'importation du fichier `lms-titanic-big-data.json` dans Portal Formation, vous obtenez une erreur sur le type.

## ✅ Solution

### Étape 1 : Vérifier que le fichier JSON est valide

Le fichier `lms-titanic-big-data.json` a été validé et est correct. Il contient des items de type `resource` et `tp`, qui sont tous deux valides.

### Étape 2 : Vérifier et corriger la contrainte CHECK en base de données

Le problème vient probablement de la contrainte CHECK de la table `items` qui n'inclut pas tous les types nécessaires.

**Exécutez le script SQL suivant dans Supabase :**

```sql
-- Vérifier la contrainte actuelle
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'items'::regclass
  AND conname LIKE '%type%';

-- Supprimer l'ancienne contrainte
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;

-- Recréer la contrainte avec tous les types valides
ALTER TABLE items ADD CONSTRAINT items_type_check 
  CHECK (type IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game'));
```

**Ou utilisez le script complet :**

Exécutez le fichier `fix-items-type-constraint-complete.sql` dans l'éditeur SQL de Supabase.

### Étape 3 : Vérifier qu'il n'y a pas d'items avec des types invalides

```sql
SELECT 
  id,
  type,
  title,
  CASE 
    WHEN type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game') THEN '❌ Type invalide'
    WHEN type != LOWER(TRIM(type)) THEN '⚠️ Type avec majuscules ou espaces'
    ELSE '✅ OK'
  END as status
FROM items
WHERE type NOT IN ('resource', 'slide', 'exercise', 'activity', 'tp', 'game')
   OR type != LOWER(TRIM(type));
```

Si vous trouvez des items avec des types invalides, corrigez-les :

```sql
-- Corriger les types avec espaces ou majuscules
UPDATE items
SET type = LOWER(TRIM(type))
WHERE type != LOWER(TRIM(type));
```

### Étape 4 : Réessayer l'importation

1. Allez dans l'interface d'administration de Portal Formation
2. Créez un nouveau cours ou éditez un cours existant
3. Utilisez l'option "Importer JSON" ou "Mode JSON"
4. Collez le contenu du fichier `lms-titanic-big-data.json`
5. Cliquez sur "Sauvegarder"

## 📋 Types valides

Les types d'items valides sont :
- `resource` : Ressource de cours
- `slide` : Support de présentation
- `exercise` : Exercice pratique
- `activity` : Activité interactive
- `tp` : Travaux pratiques
- `game` : Jeu/Quiz interactif

## 🔧 Scripts disponibles

- `fix-items-type-constraint-complete.sql` : Script complet pour corriger la contrainte
- `diagnose-item-type.sql` : Script de diagnostic pour identifier les problèmes de type
- `validate-tp-big-data.js` : Script de validation du fichier JSON

## ⚠️ Note importante

Assurez-vous d'être dans l'interface **COURS** (pas ITEM) lors de l'importation. Le fichier `lms-titanic-big-data.json` est un fichier de cours complet, pas un item individuel.
