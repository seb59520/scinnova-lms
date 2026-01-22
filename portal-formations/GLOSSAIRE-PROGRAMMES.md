# 📚 Glossaires associés aux Programmes

Ce document explique comment associer un glossaire à chaque programme dans le système.

## 🎯 Vue d'ensemble

Chaque programme peut maintenant avoir un glossaire associé contenant des termes avec :
- **Mot** : Le terme à définir
- **Explication** : Description détaillée
- **Exemple** : Exemple d'utilisation (code ou texte)

## 📋 Structure de la base de données

### Migration SQL

Exécutez le fichier `add-program-glossary.sql` dans Supabase pour ajouter le support des glossaires :

```sql
-- Ajouter la colonne glossary à la table programs
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS glossary JSONB DEFAULT NULL;

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_programs_glossary_gin ON programs USING GIN (glossary);
```

### Format du glossaire

Le glossaire est stocké au format JSON dans la colonne `glossary` de la table `programs` :

```json
{
  "metadata": {
    "title": "Glossaire Python",
    "description": "Termes essentiels du programme",
    "version": "1.0.0",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  },
  "categories": [
    {
      "id": "variables",
      "name": "Variables & Types",
      "description": "Concepts liés aux variables"
    }
  ],
  "terms": [
    {
      "id": "none",
      "word": "None",
      "explanation": "Valeur spéciale représentant l'absence de valeur",
      "example": "x = None\nif x is None:\n    print('vide')",
      "category_id": "variables",
      "tags": ["type", "valeur"],
      "language": "python",
      "difficulty": "beginner"
    }
  ]
}
```

## 🖥️ Interface d'édition

### Dans l'interface admin

1. Allez dans **Admin > Programmes**
2. Créez ou modifiez un programme
3. Dans la section **Glossaire**, vous pouvez :
   - Créer un nouveau glossaire
   - Importer un glossaire depuis un fichier JSON
   - Exporter le glossaire actuel
   - Ajouter/modifier/supprimer des catégories
   - Ajouter/modifier/supprimer des termes

### Fonctionnalités

- ✅ **Création** : Créer un glossaire vide et ajouter des termes
- ✅ **Import** : Importer un glossaire depuis un fichier JSON (format standard)
- ✅ **Export** : Exporter le glossaire pour sauvegarde ou réutilisation
- ✅ **Catégories** : Organiser les termes par catégories
- ✅ **Tags** : Ajouter des tags pour faciliter la recherche
- ✅ **Langage** : Spécifier le langage pour la coloration syntaxique (Python, JavaScript, SQL, etc.)
- ✅ **Difficulté** : Classer les termes par niveau (débutant, intermédiaire, avancé)

## 🔧 Utilisation programmatique

### Associer un glossaire à un programme

```typescript
import { supabase } from './lib/supabaseClient'
import { Glossary } from './types/database'

// Charger un glossaire depuis un fichier
const glossaryData = await fetch('/glossaire-python-exemple.json').then(r => r.json())

// Associer au programme
const { error } = await supabase
  .from('programs')
  .update({ glossary: glossaryData })
  .eq('id', programId)
```

### Rechercher dans un glossaire

Utilisez la fonction SQL `search_program_glossary` :

```sql
SELECT search_program_glossary('program-uuid', 'lambda');
```

### Obtenir un terme spécifique

```sql
SELECT get_program_glossary_term('program-uuid', 'term-id');
```

## 📝 Exemple : Créer un glossaire Python

1. Utilisez le fichier `glossaire-python-exemple.json` comme modèle
2. Ou créez un nouveau glossaire via l'interface
3. Ajoutez vos termes avec mot, explication et exemple
4. Organisez-les par catégories si nécessaire
5. Sauvegardez le programme

## 🔄 Conversion depuis un glossaire existant

Si vous avez déjà un glossaire au format JSON (comme `glossaire-python-exemple.json`), vous pouvez :

1. **Via l'interface** : Utilisez le bouton "Importer" dans l'éditeur de glossaire
2. **Via SQL** : 

```sql
-- Charger le glossaire depuis un fichier JSON
UPDATE programs
SET glossary = '{
  "metadata": { ... },
  "categories": [ ... ],
  "terms": [ ... ]
}'::jsonb
WHERE id = 'program-uuid';
```

3. **Via script** : Utilisez le script `convert-glossaire.js` pour convertir un glossaire au format cours, puis importez-le

## 🎨 Affichage pour les étudiants

Le glossaire peut être affiché dans la vue programme pour les étudiants. Vous pouvez :

1. Créer un item de type "resource" avec le glossaire converti en format TipTap
2. Utiliser le convertisseur `glossaire-converter.ts` pour générer le format cours
3. Ajouter cet item comme première ressource du programme

## 📚 Format réutilisable

Le format de glossaire est le même que celui défini dans `glossaire-format.json` à la racine du projet. Cela permet de :

- Réutiliser des glossaires entre programmes
- Partager des glossaires entre équipes
- Maintenir une cohérence dans la structure

## 🔍 Recherche et filtrage

Les fonctions SQL permettent de :
- Rechercher des termes par mot-clé
- Filtrer par catégorie
- Filtrer par tags
- Filtrer par difficulté

## ✅ Checklist

- [x] Migration SQL créée (`add-program-glossary.sql`)
- [x] Types TypeScript ajoutés (`database.ts`)
- [x] Composant d'édition créé (`GlossaryEditor.tsx`)
- [x] Intégration dans l'interface admin (`AdminProgramEdit.tsx`)
- [x] Fonctions SQL pour recherche
- [x] Support import/export
- [ ] Affichage pour les étudiants (à implémenter)
- [ ] Recherche dans l'interface (à implémenter)

## 🚀 Prochaines étapes

1. **Affichage étudiant** : Créer une page pour afficher le glossaire d'un programme
2. **Recherche** : Ajouter une barre de recherche dans l'interface
3. **Liens croisés** : Implémenter les liens entre termes liés
4. **Statistiques** : Afficher les termes les plus consultés
