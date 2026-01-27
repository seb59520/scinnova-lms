# Guide TPNew — TP par thèmes avec captures d’écran

## Vue d’ensemble

**TPNew** est un format de TP à présentation fluide, **segmenté par thème**, modifiable bloc par bloc sans refaire tout le JSON. Chaque thème contient des **blocs** de type texte, image, ou **texte + capture d’écran côte à côte**.

- Affichage par **thèmes** (sections clairement identifiées).
- À côté du texte, vous pouvez placer des **copies d’écran** (bloc `text-image` ou `image`).
- Structure simple : ajout/suppression de thèmes ou de blocs sans réécrire tout le document.
- **Import par matrice** (CSV) pour remplir rapidement un TP depuis un tableur.

---

## Structure JSON

Le `content` d’un item de type `tp` doit avoir :

- `type`: `"tp-new"`
- `introduction` (optionnel) : texte d’introduction.
- `themes` : tableau de thèmes.
- `conclusion` (optionnel) : texte de conclusion.

Chaque **thème** :

- `id` : identifiant unique (ex. `"theme-1"`).
- `title` : titre du thème.
- `blocks` : tableau de blocs.

Chaque **bloc** est l’un des trois types suivants.

### 1. Bloc `text`

Texte seul.

```json
{ "type": "text", "text": "Votre paragraphe ici. Vous pouvez utiliser **gras** et *italique*." }
```

### 2. Bloc `image`

Une capture d’écran (ou image) seule.

```json
{
  "type": "image",
  "src": "https://exemple.com/capture.png",
  "alt": "Description pour accessibilité",
  "title": "Titre optionnel"
}
```

### 3. Bloc `text-image`

Texte et image côte à côte.

- `layout: "right"` (défaut) : image à droite du texte.
- `layout: "left"` : image à gauche du texte.

```json
{
  "type": "text-image",
  "text": "Dans l’interface, cliquez sur **Paramètres**. La capture à droite montre où cliquer.",
  "src": "https://exemple.com/parametres.png",
  "alt": "Écran des paramètres",
  "layout": "right"
}
```

---

## Import par matrice (CSV)

Pour créer ou modifier un TPNew à partir d’un tableur, utilisez une matrice avec **une ligne par bloc**.

### Colonnes du CSV

| Colonne       | Obligatoire | Description |
|---------------|-------------|-------------|
| `theme_id`    | Oui         | Identifiant du thème (ex. `t1`, `theme-prep`) |
| `theme_title` | Oui         | Titre affiché du thème |
| `block_order` | Oui         | Ordre du bloc dans le thème (nombre) |
| `block_type`  | Oui         | `text`, `image` ou `text-image` |
| `text`        | Si text/text-image | Contenu texte du bloc |
| `image_url`   | Si image/text-image | URL de la capture d’écran |
| `image_alt`   | Non         | Texte alternatif pour l’image |
| `layout`      | Si text-image | `left` ou `right` (image à gauche/droite) |

### Exemple de fichier CSV

```csv
theme_id,theme_title,block_order,block_type,text,image_url,image_alt,layout
t1,Préparation,1,text,"Installez les prérequis et vérifiez l'environnement.",,,
t1,Préparation,2,text-image,"Ouvrez le terminal et lancez la commande. La capture à droite montre le résultat.",https://exemple.com/terminal.png,Résultat terminal,right
t1,Préparation,3,image,,https://exemple.com/schema.png,Schéma architecture,
t2,Configuration,1,text-image,"Allez dans Paramètres puis renseignez l'URL.",https://exemple.com/parametres.png,Écran paramètres,left
t2,Configuration,2,text,"Une fois l'URL enregistrée, lancez la première exécution.",,,
```

### Conversion CSV → JSON TPNew

1. **Télécharger le modèle** : [tp-new-template.json](/tp-new-template.json) (ou `public/tp-new-template.json`).
2. Remplir un tableur (Excel, Google Sheets, etc.) avec les colonnes ci-dessus, une ligne par bloc.
3. Exporter en CSV (UTF-8).
4. Convertir en JSON TPNew :
   - soit avec un script (voir section suivante),
   - soit en important le CSV dans un outil ou une petite appli qui produit le JSON ci-dessous.

Structure cible après conversion :

- Un thème par valeur distincte de `(theme_id, theme_title)`.
- Les blocs d’un même thème triés par `block_order`.
- Pour chaque ligne :
  - `block_type === "text"` → `{ "type": "text", "text": "..." }`
  - `block_type === "image"` → `{ "type": "image", "src": "...", "alt": "..." }`
  - `block_type === "text-image"` → `{ "type": "text-image", "text": "...", "src": "...", "alt": "...", "layout": "left" ou "right" }`

Le dépôt fournit un script prêt à l’emploi :

```bash
# Depuis la racine du projet portal-formations
node scripts/csv-to-tp-new.js matrix.csv --out tp-new.json
# ou en pipant
cat matrix.csv | node scripts/csv-to-tp-new.js --out tp-new.json
```

Le fichier `tp-new.json` produit peut être copié dans le champ `content` d’un item de type `tp`.

---

## Où utiliser TPNew

- **Création d’item** : créez un item de type `tp`, et dans le champ `content` mettez un objet avec `type: "tp-new"`, `themes`, etc., comme dans le template.
- **Template** : partir de `public/tp-new-template.json`, dupliquer et modifier thème par thème / bloc par bloc.
- **Modification** : vous ne modifiez que les thèmes ou blocs concernés ; le reste du JSON reste inchangé.

---

## Tester avec le cours Exchange Partie 8

Un fichier de test prêt à l'emploi est fourni : **`course-exchange-partie8-tp-new-test.json`**. C'est le cours « Microsoft Exchange — Partie 8 : Analyse et dépannage des flux SMTP » avec le TP 8 en format TPNew (thèmes : Constater un échec → Tracer le message → Analyser la file → Corriger la cause).

**Procédure :**

1. Aller dans **Admin** > **Formations** > **Créer une formation** (ou **Nouveau**).
2. Passer en vue **JSON** (onglet ou lien « Éditer le JSON »).
3. Cliquer sur **Importer** et choisir `course-exchange-partie8-tp-new-test.json`.
4. **Enregistrer** le cours.
5. Ouvrir la formation côté apprenant, aller au **Module 4**, ouvrir **« TP 8 — Analyser et résoudre des incidents SMTP Exchange »**.
6. Vérifier l'affichage : introduction, 4 thèmes avec blocs texte et blocs texte+image (placeholders), conclusion.

Un item TP isolé au format TPNew est aussi disponible dans **`tp8-exchange-tp-new.json`** (champ `content` à coller dans un item de type `tp` existant).

---

## Récapitulatif

| Besoin                         | Solution TPNew |
|--------------------------------|----------------|
| Présentation fluide par thème  | `themes[]` avec titre et blocs |
| Copies d’écran à côté du texte | Blocs `text-image` avec `layout` left/right |
| Modifier sans tout refaire     | Éditer uniquement le thème ou le bloc concerné |
| Import / édition en masse      | Matrice CSV → conversion vers le JSON TPNew |
