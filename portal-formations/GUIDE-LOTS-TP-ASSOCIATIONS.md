# Guide : Lots de TP et Associations aux Cours

Ce guide explique comment utiliser les nouvelles fonctionnalités pour associer les TP aux cours et créer des lots de TP liés entre eux.

## 📋 Vue d'ensemble

Le système permet maintenant :
1. **Association directe des TP aux cours** : Associer un TP à un cours même s'il n'est pas dans un module spécifique
2. **Lots de TP** : Regrouper plusieurs TP liés entre eux dans un lot, avec possibilité de définir des prérequis et un ordre séquentiel

## 🗄️ Structure de la base de données

### Tables créées

#### 1. `course_tps` - Association directe TP ↔ Cours
Permet d'associer un TP directement à un cours.

**Colonnes principales :**
- `course_id` : ID du cours
- `item_id` : ID de l'item TP
- `position` : Ordre d'affichage dans le cours
- `is_required` : TP obligatoire pour compléter le cours
- `is_visible` : TP visible dans la liste des TP du cours
- `metadata` : Métadonnées supplémentaires (JSONB)

#### 2. `tp_batches` - Lots de TP
Regroupe plusieurs TP liés entre eux.

**Colonnes principales :**
- `title` : Titre du lot
- `description` : Description du lot
- `course_id` : Cours auquel appartient le lot (optionnel)
- `position` : Ordre d'affichage dans le cours
- `sequential_order` : Les TP doivent être complétés dans l'ordre
- `is_published` : Lot actif/published
- `metadata` : Métadonnées supplémentaires (JSONB)

#### 3. `tp_batch_items` - Liaison TP ↔ Lot
Liaison entre un lot et les TP qu'il contient.

**Colonnes principales :**
- `tp_batch_id` : ID du lot
- `item_id` : ID de l'item TP
- `position` : Ordre du TP dans le lot
- `is_required` : TP obligatoire dans le lot
- `prerequisite_item_id` : ID du TP précédent requis (pour ordre séquentiel)
- `metadata` : Métadonnées spécifiques (JSONB)

### Vues utiles

#### `course_all_tps`
Vue unifiée de tous les TP d'un cours (via modules, association directe, ou lots).

#### `tp_batch_details`
Détails complets des lots de TP avec statistiques (nombre de TP, TP requis, etc.).

#### `tp_batch_items_details`
Détails des TP dans les lots avec leurs prérequis.

## 🚀 Installation

Exécutez le script SQL dans votre base de données Supabase :

```sql
-- Exécuter le fichier
\i add-tp-batches-and-course-associations.sql
```

Ou copiez-collez le contenu dans l'éditeur SQL de Supabase.

## 💡 Cas d'usage

### Cas 1 : Associer un TP directement à un cours

**Scénario :** Vous avez un TP qui fait partie intégrante d'un cours mais qui n'est pas dans un module spécifique.

```sql
-- Associer un TP à un cours
INSERT INTO course_tps (course_id, item_id, position, is_required, is_visible)
VALUES (
  'course-uuid-here',
  'tp-item-uuid-here',
  1,  -- Position dans le cours
  TRUE,  -- TP obligatoire
  TRUE   -- TP visible
);
```

**Exemple concret :**
```sql
-- Trouver un cours et un TP
SELECT id, title FROM courses WHERE title LIKE '%Big Data%';
SELECT id, title FROM items WHERE type = 'tp' AND title LIKE '%Titanic%';

-- Associer le TP au cours
INSERT INTO course_tps (course_id, item_id, position, is_required, is_visible)
VALUES (
  (SELECT id FROM courses WHERE title = 'Formation Big Data'),
  (SELECT id FROM items WHERE type = 'tp' AND title LIKE '%Titanic Big Data%'),
  1,
  TRUE,
  TRUE
);
```

### Cas 2 : Créer un lot de TP liés

**Scénario :** Vous avez plusieurs TP qui doivent être complétés ensemble, dans un ordre spécifique.

```sql
-- 1. Créer le lot
INSERT INTO tp_batches (title, description, course_id, position, sequential_order, is_published, created_by)
VALUES (
  'Lot TP Data Science - Série complète',
  'Série de TP pour maîtriser la data science de A à Z',
  'course-uuid-here',
  1,
  TRUE,  -- Les TP doivent être complétés dans l'ordre
  TRUE,
  'user-uuid-here'  -- ID de l'utilisateur créateur
)
RETURNING id;

-- 2. Ajouter les TP au lot (avec prérequis)
-- TP 1 : Pas de prérequis
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
VALUES (
  'batch-uuid-here',
  'tp1-uuid-here',
  1,
  TRUE,
  NULL  -- Pas de prérequis
);

-- TP 2 : Nécessite que TP 1 soit complété
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
VALUES (
  'batch-uuid-here',
  'tp2-uuid-here',
  2,
  TRUE,
  'tp1-uuid-here'  -- Prérequis : TP 1
);

-- TP 3 : Nécessite que TP 2 soit complété
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
VALUES (
  'batch-uuid-here',
  'tp3-uuid-here',
  3,
  TRUE,
  'tp2-uuid-here'  -- Prérequis : TP 2
);
```

**Exemple concret avec les TP Titanic :**
```sql
-- Créer un lot pour les TP Titanic
INSERT INTO tp_batches (title, description, course_id, sequential_order, is_published, created_by)
VALUES (
  'Série TP Titanic - Apprentissage complet',
  'TP Big Data, Data Science et Machine Learning avec le dataset Titanic',
  (SELECT id FROM courses WHERE title LIKE '%Big Data%' LIMIT 1),
  TRUE,
  TRUE,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
)
RETURNING id;

-- Récupérer les IDs des TP Titanic
WITH titanic_tps AS (
  SELECT id, title, ROW_NUMBER() OVER (ORDER BY title) as rn
  FROM items
  WHERE type = 'tp' AND title LIKE '%Titanic%'
)
SELECT id, title FROM titanic_tps;

-- Ajouter les TP au lot (exemple avec 3 TP)
-- TP 1
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required)
SELECT 
  (SELECT id FROM tp_batches WHERE title = 'Série TP Titanic - Apprentissage complet'),
  id,
  1,
  TRUE
FROM items
WHERE type = 'tp' AND title LIKE '%Titanic Big Data%'
LIMIT 1;

-- TP 2 (avec prérequis TP 1)
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required, prerequisite_item_id)
SELECT 
  (SELECT id FROM tp_batches WHERE title = 'Série TP Titanic - Apprentissage complet'),
  i2.id,
  2,
  TRUE,
  (SELECT id FROM items WHERE type = 'tp' AND title LIKE '%Titanic Big Data%' LIMIT 1)
FROM items i2
WHERE i2.type = 'tp' AND i2.title LIKE '%Titanic Data Science%'
LIMIT 1;
```

### Cas 3 : Lot de TP indépendant (sans cours)

**Scénario :** Vous voulez créer un lot de TP qui peut être utilisé dans plusieurs cours.

```sql
-- Créer un lot sans cours associé
INSERT INTO tp_batches (title, description, course_id, sequential_order, is_published, created_by)
VALUES (
  'TP Pratiques - Analyse de données',
  'Lot de TP réutilisable pour différents cours',
  NULL,  -- Pas de cours associé
  FALSE,  -- Pas d'ordre séquentiel obligatoire
  TRUE,
  'user-uuid-here'
);
```

## 📊 Requêtes utiles

### Obtenir tous les TP d'un cours (toutes sources confondues)

```sql
SELECT * FROM course_all_tps
WHERE course_id = 'course-uuid-here'
ORDER BY position_in_course, position_in_module;
```

### Obtenir les détails d'un lot de TP

```sql
SELECT * FROM tp_batch_details
WHERE batch_id = 'batch-uuid-here';
```

### Obtenir les TP d'un lot avec leurs prérequis

```sql
SELECT * FROM tp_batch_items_details
WHERE tp_batch_id = 'batch-uuid-here'
ORDER BY position;
```

### Lister tous les lots d'un cours

```sql
SELECT * FROM tp_batch_details
WHERE course_id = 'course-uuid-here'
ORDER BY batch_position;
```

### Vérifier quels TP sont dans des lots

```sql
SELECT 
  i.id,
  i.title,
  tb.title AS batch_title,
  tbi.position AS position_in_batch,
  tbi.is_required
FROM items i
INNER JOIN tp_batch_items tbi ON tbi.item_id = i.id
INNER JOIN tp_batches tb ON tb.id = tbi.tp_batch_id
WHERE i.type = 'tp'
ORDER BY tb.title, tbi.position;
```

## 🔄 Migration des TP existants

Si vous avez déjà des TP dans vos cours et que vous voulez les associer directement ou créer des lots :

### Option 1 : Associer tous les TP d'un cours directement

```sql
-- Associer tous les TP d'un cours (qui sont dans des modules) directement au cours
INSERT INTO course_tps (course_id, item_id, position, is_required, is_visible)
SELECT DISTINCT
  m.course_id,
  i.id,
  i.position,
  TRUE,
  TRUE
FROM items i
INNER JOIN modules m ON m.id = i.module_id
WHERE i.type = 'tp'
  AND m.course_id = 'course-uuid-here'
  AND NOT EXISTS (
    SELECT 1 FROM course_tps ct
    WHERE ct.course_id = m.course_id AND ct.item_id = i.id
  );
```

### Option 2 : Créer un lot avec tous les TP d'un cours

```sql
-- Créer un lot et y ajouter tous les TP d'un cours
WITH new_batch AS (
  INSERT INTO tp_batches (title, description, course_id, sequential_order, is_published, created_by)
  VALUES (
    'Tous les TP du cours',
    'Lot regroupant tous les TP du cours',
    'course-uuid-here',
    FALSE,
    TRUE,
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
  )
  RETURNING id
)
INSERT INTO tp_batch_items (tp_batch_id, item_id, position, is_required)
SELECT 
  nb.id,
  i.id,
  ROW_NUMBER() OVER (ORDER BY i.position),
  TRUE
FROM new_batch nb
CROSS JOIN items i
INNER JOIN modules m ON m.id = i.module_id
WHERE i.type = 'tp'
  AND m.course_id = 'course-uuid-here';
```

## ⚠️ Notes importantes

1. **Contraintes** :
   - Un TP ne peut être associé qu'une seule fois à un cours via `course_tps`
   - Un TP ne peut apparaître qu'une seule fois dans un lot
   - Les prérequis doivent être dans le même lot

2. **Ordre séquentiel** :
   - Si `sequential_order = TRUE` dans un lot, les TP doivent être complétés dans l'ordre
   - Utilisez `prerequisite_item_id` pour définir explicitement les prérequis

3. **Visibilité** :
   - Les TP associés directement avec `is_visible = FALSE` ne seront pas affichés dans la liste des TP du cours
   - Les lots avec `is_published = FALSE` ne seront pas visibles

4. **Performance** :
   - Utilisez la vue `course_all_tps` pour obtenir tous les TP d'un cours efficacement
   - Les index ont été créés pour optimiser les requêtes

## 🔍 Dépannage

### Vérifier si un TP est associé à un cours

```sql
SELECT * FROM course_tps
WHERE item_id = 'tp-uuid-here';
```

### Vérifier dans quels lots un TP apparaît

```sql
SELECT 
  tb.title AS batch_title,
  tbi.position,
  tbi.is_required
FROM tp_batch_items tbi
INNER JOIN tp_batches tb ON tb.id = tbi.tp_batch_id
WHERE tbi.item_id = 'tp-uuid-here';
```

### Supprimer une association

```sql
-- Supprimer l'association directe d'un TP à un cours
DELETE FROM course_tps
WHERE course_id = 'course-uuid-here' AND item_id = 'tp-uuid-here';

-- Retirer un TP d'un lot
DELETE FROM tp_batch_items
WHERE tp_batch_id = 'batch-uuid-here' AND item_id = 'tp-uuid-here';
```

## 📝 Prochaines étapes

Pour intégrer ces fonctionnalités dans l'interface utilisateur, vous devrez :

1. **Créer des composants React** pour :
   - Gérer les associations TP ↔ Cours
   - Créer et modifier les lots de TP
   - Afficher les lots dans l'interface du cours

2. **Mettre à jour les API** pour :
   - Exposer les endpoints pour les lots de TP
   - Gérer les associations directes
   - Vérifier les prérequis lors de l'accès aux TP

3. **Adapter l'affichage** pour :
   - Montrer les TP associés directement dans la liste du cours
   - Afficher les lots de TP avec leurs TP
   - Gérer l'ordre séquentiel et les prérequis
