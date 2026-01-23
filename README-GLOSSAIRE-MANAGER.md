# 📚 Gestionnaire de Glossaire

Outil CLI pour exporter, importer et mettre à jour des templates de glossaire.

## 🚀 Installation

Aucune dépendance supplémentaire requise. Utilise Node.js natif.

## 📖 Utilisation

### Exporter un template

Génère un fichier template vide avec la structure de base :

```bash
# Version JavaScript (recommandée)
node glossaire-manager.js export

# Ou avec un nom personnalisé
node glossaire-manager.js export mon-glossaire.json

# Version TypeScript (si ts-node est installé)
ts-node glossaire-manager.ts export
```

### Importer un glossaire

Importe un glossaire depuis un fichier JSON :

```bash
# Import simple (remplace le fichier s'il existe)
node glossaire-manager.js import mon-glossaire.json

# Import vers un fichier spécifique
node glossaire-manager.js import source.json destination.json
```

### Fusionner des glossaires

Fusionne un glossaire avec un existant (évite les doublons) :

```bash
node glossaire-manager.js merge nouveau.json existant.json
```

La fusion :
- Met à jour les entrées existantes (même terme)
- Ajoute les nouvelles entrées
- Conserve les entrées non modifiées
- Trie automatiquement par terme

### Afficher les statistiques

Affiche les statistiques d'un glossaire :

```bash
node glossaire-manager.js stats glossaire-python-complet.json
```

## 📋 Structure du template

Le template généré suit cette structure :

```json
{
  "metadata": {
    "name": "Template de Glossaire",
    "description": "Template pour créer un nouveau glossaire",
    "version": "1.0.0",
    "language": "fr",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  },
  "entries": [
    {
      "term": "Exemple de terme",
      "definition": "Définition du terme avec explication détaillée",
      "category": "Catégorie",
      "tags": ["tag1", "tag2"],
      "examples": ["Exemple d'utilisation 1", "Exemple d'utilisation 2"],
      "relatedTerms": ["Terme lié 1", "Terme lié 2"],
      "source": "Source de la définition",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 🔧 Champs des entrées

- **term** (requis) : Le terme à définir
- **definition** (requis) : La définition du terme
- **category** (optionnel) : Catégorie du terme
- **tags** (optionnel) : Tableau de tags
- **examples** (optionnel) : Exemples d'utilisation
- **relatedTerms** (optionnel) : Termes liés
- **source** (optionnel) : Source de la définition
- **lastUpdated** (optionnel) : Date de dernière mise à jour (ISO 8601)

## 📝 Exemples d'utilisation

### Créer un nouveau glossaire

```bash
# 1. Exporter le template
node glossaire-manager.js export mon-glossaire.json

# 2. Éditer le fichier JSON avec vos entrées
# 3. Vérifier les statistiques
node glossaire-manager.js stats mon-glossaire.json
```

### Extraire un glossaire depuis un cours

```bash
# Extraire automatiquement les termes techniques d'un cours
node glossaire-manager.js extract-course portal-formations/course-exchange-partie2-prerequis.json

# Le glossaire sera créé avec le suffixe -glossaire.json
# Les définitions sont à compléter manuellement
```

### Convertir entre formats

```bash
# Convertir un glossaire template vers format programme (pour Supabase)
node glossaire-manager.js convert-program glossaire-template.json glossaire-programme.json

# Convertir un glossaire programme vers format template
node glossaire-manager.js convert-template glossaire-programme.json glossaire-template.json
```

### Mettre à jour un glossaire existant

```bash
# 1. Exporter un template pour ajouter de nouvelles entrées
node glossaire-manager.js export nouvelles-entrees.json

# 2. Éditer nouvelles-entrees.json avec vos nouvelles entrées
# 3. Fusionner avec le glossaire existant
node glossaire-manager.js merge nouvelles-entrees.json glossaire-existant.json
```

### Importer depuis un autre projet

```bash
# Importer un glossaire d'un autre projet
node glossaire-manager.js import ../autre-projet/glossaire.json mon-glossaire.json
```

### Workflow complet : Cours → Glossaire → Programme

```bash
# 1. Extraire un glossaire depuis un cours
node glossaire-manager.js extract-course portal-formations/mon-cours.json

# 2. Éditer le glossaire pour compléter les définitions
# (éditer mon-cours-glossaire.json)

# 3. Convertir vers format programme pour Supabase
node glossaire-manager.js convert-program mon-cours-glossaire.json mon-cours-glossaire-program.json

# 4. Le fichier mon-cours-glossaire-program.json peut être importé dans Supabase
```

## 🔄 Formats de glossaire

L'outil supporte deux formats :

### Format Template (par défaut)
```json
{
  "metadata": { "name", "description", "version", ... },
  "entries": [
    { "term", "definition", "category", "tags", ... }
  ]
}
```

### Format Programme (pour Supabase)
```json
{
  "metadata": { "title", "description", "version", ... },
  "categories": [ { "id", "name", "description" } ],
  "terms": [
    { "id", "word", "explanation", "example", "category_id", ... }
  ]
}
```

Utilisez `convert-program` et `convert-template` pour convertir entre les formats.

## ⚠️ Notes importantes

- Les doublons sont détectés par le terme (insensible à la casse)
- Lors de la fusion, les entrées existantes sont mises à jour avec les nouvelles valeurs
- Les entrées sont automatiquement triées par terme après fusion
- Les dates sont au format ISO 8601
- L'extraction depuis un cours détecte automatiquement les termes techniques (majuscules, acronymes)
- Les définitions extraites sont à compléter manuellement

## 🐛 Dépannage

### Erreur "Format de glossaire invalide"

Vérifiez que votre fichier JSON contient bien :
- Un objet `metadata` avec au minimum `name`, `description`, `version`
- Un tableau `entries` avec des objets contenant au minimum `term` et `definition`

### Erreur "Le fichier n'existe pas"

Vérifiez le chemin du fichier. Utilisez des chemins relatifs ou absolus.
