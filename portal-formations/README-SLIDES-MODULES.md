# Guide de création de slides à partir des métadonnées des modules

## 📚 Description

Ce guide explique comment transformer les métadonnées des modules (finalité, compétences, contenus, livrables) en slides structurées.

## 🎯 Deux approches disponibles

### 1. Script SQL automatique (Recommandé)

Le fichier `add-slides-from-metadata.sql` crée automatiquement des slides pour tous les modules qui contiennent des métadonnées.

**Avantages :**
- Automatique : crée toutes les slides en une seule exécution
- Cohérent : même format pour toutes les slides
- Rapide : pas besoin de créer manuellement chaque slide

**Utilisation :**

1. Exécutez d'abord `create-course-api-performantes-securisees.sql` pour créer le cours et les modules
2. Exécutez ensuite `add-slides-from-metadata.sql` pour créer les slides

```sql
-- Dans l'interface SQL de Supabase
-- 1. Créer le cours
\i create-course-api-performantes-securisees.sql

-- 2. Créer les slides
\i add-slides-from-metadata.sql
```

### 2. Format JSON (Pour import manuel)

Le fichier `slides-modules-example.json` montre la structure JSON d'une slide complète.

**Avantages :**
- Contrôle total sur le contenu
- Peut être importé via l'interface d'administration
- Permet de personnaliser chaque slide individuellement

**Utilisation :**

1. Ouvrez le fichier `slides-modules-example.json` comme référence
2. Créez un fichier JSON similaire pour chaque module
3. Importez via l'interface admin (`/admin/courses/{courseId}/edit`) en mode JSON

## 📋 Structure d'une slide

Chaque slide contient :

1. **Titre principal** (Heading niveau 1)
   - Format : `{module_id} - {titre du module}`
   - Exemple : `M1 - Fondations des architectures d'API`

2. **Section Finalité** (Heading niveau 2)
   - Paragraphe avec la finalité du module

3. **Section Compétences visées** (Heading niveau 2)
   - Liste à puces avec toutes les compétences

4. **Section Contenus abordés** (Heading niveau 2)
   - Liste à puces avec tous les contenus

5. **Section Livrables attendus** (Heading niveau 2)
   - Liste à puces avec tous les livrables

## 🔧 Format TipTap JSON

Les slides utilisent le format TipTap JSON pour le contenu. Structure de base :

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [
        { "type": "text", "text": "Titre" }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Texte du paragraphe" }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "text": "Élément de liste" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## 📊 Résultat attendu

Après exécution du script SQL, chaque module contiendra :

1. **Item de métadonnées** (type `resource`, position 0)
   - Contient les métadonnées brutes en JSONB

2. **Slide de présentation** (type `slide`, position 1)
   - Contient le contenu formaté et structuré

## 🐛 Dépannage

### Les slides ne sont pas créées

- Vérifiez que les items de métadonnées existent avec le titre `Métadonnées du module M*`
- Vérifiez que les métadonnées contiennent bien les champs `competences`, `contenus`, `livrables`

### Le contenu des slides est vide

- Vérifiez que les métadonnées sont bien au format JSONB
- Vérifiez que les tableaux ne sont pas vides

### Erreur de syntaxe SQL

- Vérifiez que vous utilisez PostgreSQL 12+ (pour le support JSONB avancé)
- Vérifiez que toutes les tables existent (`items`, `modules`)

## 📝 Exemple de requête pour vérifier

Pour vérifier que les slides ont été créées :

```sql
SELECT 
  m.title as module_title,
  i.type as item_type,
  i.title as item_title,
  i.position
FROM modules m
JOIN items i ON i.module_id = m.id
WHERE m.course_id = 'VOTRE_COURSE_ID'
ORDER BY m.position, i.position;
```

Pour voir le contenu d'une slide :

```sql
SELECT 
  i.title,
  i.content->'body'->'content' as slide_content
FROM items i
WHERE i.type = 'slide'
  AND i.title LIKE 'Présentation du module%'
LIMIT 1;
```

## 🎨 Personnalisation

Après création, vous pouvez :

1. **Modifier le contenu** via l'interface d'édition
2. **Ajouter des chapitres** pour structurer davantage
3. **Ajouter des images** via `asset_path`
4. **Modifier le format** (ajouter des tableaux, citations, etc.)

## 📌 Notes importantes

- Les slides sont créées en position après les items de métadonnées
- Les slides sont publiées par défaut (`published: true`)
- Le format TipTap permet d'ajouter du formatage riche (gras, italique, liens, etc.)



