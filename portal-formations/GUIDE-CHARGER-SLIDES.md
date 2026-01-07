# Guide : Comment charger les slides

## 📋 Vue d'ensemble

Les slides sont stockées dans **Supabase Storage** dans le bucket `course-assets`. Une fois chargées, elles sont référencées dans le JSON du cours via le champ `asset_path`.

---

## 🎯 Méthode 1 : Via l'interface d'administration (Recommandé)

### Étape 1 : Accéder à l'édition d'un item

1. Allez dans **Admin** → **Cours** → Sélectionnez votre cours
2. Cliquez sur un **item de type "slide"**
3. Vous arrivez sur la page d'édition de l'item

### Étape 2 : Charger l'image/PDF

**Option A : Drag & Drop**
- Glissez-déposez votre fichier (image PNG/JPG ou PDF) directement dans la zone d'upload
- Le fichier sera automatiquement uploadé vers Supabase Storage

**Option B : Copier-Coller**
- Copiez une image depuis votre presse-papiers (Ctrl+C / Cmd+C)
- Collez-la dans la zone d'upload (Ctrl+V / Cmd+V)
- L'image sera automatiquement uploadée

**Option C : Sélectionner un fichier**
- Cliquez sur le bouton "Choisir un fichier" ou "Upload"
- Sélectionnez votre fichier depuis votre ordinateur

### Étape 3 : Vérifier le chemin

Une fois l'upload réussi, le champ `asset_path` sera automatiquement rempli avec le chemin, par exemple :
```
big-data/module1/slide-intro.png
```

Ce chemin sera automatiquement ajouté dans le JSON de l'item.

---

## 🎯 Méthode 2 : Via Supabase Storage directement

### Étape 1 : Accéder à Supabase Storage

1. Allez dans votre **Dashboard Supabase**
2. Cliquez sur **Storage** dans le menu de gauche
3. Sélectionnez le bucket **`course-assets`**

### Étape 2 : Créer la structure de dossiers (recommandé)

Organisez vos slides par cours et module :
```
course-assets/
  ├── big-data/              (nom du cours)
  │   ├── module1/           (nom du module)
  │   │   ├── slide-1.1.png
  │   │   ├── slide-1.2.png
  │   │   └── slide-1.3.pdf
  │   └── module2/
  │       ├── slide-2.1.png
  │       └── slide-2.2.png
```

### Étape 3 : Uploader les fichiers

1. Cliquez sur **"Upload file"** ou **"New file"**
2. Sélectionnez votre fichier (image ou PDF)
3. Le fichier sera uploadé dans le dossier sélectionné

### Étape 4 : Noter le chemin

Le chemin complet sera, par exemple :
```
big-data/module1/slide-1.1.png
```

### Étape 5 : Ajouter le chemin dans le JSON

Dans votre JSON de cours, ajoutez le chemin dans `asset_path` :

```json
{
  "type": "slide",
  "title": "Slide 1.1 : Introduction",
  "position": 1,
  "published": true,
  "asset_path": "big-data/module1/slide-1.1.png",
  "content": {
    "pedagogical_context": {
      "text": "Votre contexte pédagogique ici..."
    }
  }
}
```

---

## 🎯 Méthode 3 : Via l'édition JSON directe

Si vous éditez le JSON directement :

1. **Chargez d'abord le fichier** via Supabase Storage (Méthode 2)
2. **Notez le chemin** exact du fichier
3. **Ajoutez le chemin** dans le JSON :

```json
{
  "type": "slide",
  "title": "Slide 1.1 : Introduction",
  "asset_path": "big-data/module1/slide-1.1.png",
  "content": {
    "pedagogical_context": {
      "text": "Contexte pédagogique..."
    }
  }
}
```

---

## 📁 Structure recommandée des chemins

Pour faciliter la gestion, organisez vos slides ainsi :

```
{course-slug}/{module-slug}/{slide-name}.{ext}
```

Exemples :
- `big-data/module1/introduction.png`
- `big-data/module1/exemples-concrets.pdf`
- `big-data/module2/data-science-definition.png`

---

## ✅ Formats supportés

### Images
- ✅ PNG (`.png`)
- ✅ JPEG/JPG (`.jpg`, `.jpeg`)
- ✅ GIF (`.gif`)
- ✅ WebP (`.webp`)

### Documents
- ✅ PDF (`.pdf`)

**Taille maximale** : 100 MB par fichier

---

## 🔍 Vérifier qu'une slide est chargée

### Dans l'interface

1. Allez sur la page du cours : `/courses/[courseId]`
2. Dépliez le module contenant la slide
3. Si la slide est chargée, vous verrez :
   - L'image affichée (si c'est une image)
   - Le PDF avec un visualiseur (si c'est un PDF)
4. Si la slide n'est pas chargée, vous verrez :
   - Le message d'avertissement : "⚠️ Aucun slide projeté pour cette section"

### Dans le JSON

Vérifiez que le champ `asset_path` existe et contient un chemin valide :

```json
{
  "asset_path": "big-data/module1/slide-1.1.png"  // ✅ Chemin présent
}
```

vs

```json
{
  // Pas de asset_path → message d'avertissement affiché
}
```

---

## 🚨 Dépannage

### Erreur : "Bucket not found"

**Solution** : Le bucket `course-assets` n'existe pas encore.

1. Allez dans Supabase → Storage
2. Créez un nouveau bucket nommé `course-assets`
3. Cochez **"Public bucket"**
4. Limite de taille : 100 MB

Ou exécutez le script SQL : `setup-course-assets-storage.sql`

### Erreur : "File size exceeds"

**Solution** : Le fichier est trop volumineux (max 100 MB).

- Compressez l'image (utilisez un outil comme TinyPNG)
- Ou divisez le PDF en plusieurs pages

### Erreur : "Permission denied"

**Solution** : Les politiques RLS ne sont pas configurées.

Exécutez le script SQL : `setup-course-assets-storage.sql`

### La slide ne s'affiche pas

**Vérifications** :
1. ✅ Le chemin `asset_path` est correct dans le JSON
2. ✅ Le fichier existe bien dans Supabase Storage
3. ✅ Le bucket `course-assets` est public
4. ✅ Les politiques RLS sont configurées
5. ✅ Le format du fichier est supporté

**Test** : Essayez d'accéder directement à l'URL :
```
https://[votre-projet].supabase.co/storage/v1/object/public/course-assets/[chemin-du-fichier]
```

---

## 💡 Bonnes pratiques

1. **Nommez vos fichiers clairement** :
   - ✅ `slide-1.1-introduction.png`
   - ❌ `IMG_1234.png`

2. **Organisez par dossiers** :
   - Un dossier par cours
   - Un sous-dossier par module

3. **Optimisez les images** :
   - Résolution recommandée : 1920x1080 (Full HD)
   - Format : PNG pour les slides avec texte, JPG pour les photos
   - Poids : < 2 MB par image si possible

4. **Pour les PDFs** :
   - Préférez une page par slide
   - Poids : < 10 MB par PDF

---

## 📝 Exemple complet

### 1. Structure dans Supabase Storage

```
course-assets/
  └── big-data/
      └── module1/
          ├── slide-1.1-introduction.png
          ├── slide-1.2-exemples.png
          └── slide-1.3-definition.pdf
```

### 2. JSON correspondant

```json
{
  "title": "Le Big Data : Fondamentaux",
  "modules": [
    {
      "title": "Module 1 : Le Big Data commence avant l'IT",
      "position": 1,
      "items": [
        {
          "type": "slide",
          "title": "Slide 1.1 : Introduction",
          "position": 1,
          "published": true,
          "asset_path": "big-data/module1/slide-1.1-introduction.png",
          "content": {
            "pedagogical_context": {
              "text": "Dans notre quotidien professionnel..."
            }
          }
        },
        {
          "type": "slide",
          "title": "Slide 1.2 : Exemples concrets",
          "position": 2,
          "published": true,
          "asset_path": "big-data/module1/slide-1.2-exemples.png",
          "content": {
            "pedagogical_context": {
              "text": "Regardons cette slide ensemble..."
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🎓 Résumé rapide

1. **Chargez le fichier** → Via l'interface admin ou Supabase Storage
2. **Notez le chemin** → Ex: `big-data/module1/slide-1.1.png`
3. **Ajoutez dans le JSON** → `"asset_path": "big-data/module1/slide-1.1.png"`
4. **Vérifiez l'affichage** → La slide apparaît dans le cours

C'est tout ! 🎉

