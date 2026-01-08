# Guide : Téléchargement PDF des cours

## 📋 Vue d'ensemble

Cette fonctionnalité permet de télécharger un cours complet au format PDF avec un format paysage spécialisé :
- **Côté gauche** : Les slides (images, PDFs, ou contenu rich text)
- **Côté droit** : Le contexte pédagogique associé à chaque slide

## 🚀 Installation

### 1. Migration de la base de données

Exécutez la migration SQL pour ajouter le champ `allow_pdf_download` :

```bash
# Dans Supabase SQL Editor ou via psql
psql -h votre-host -U votre-user -d votre-db -f add-pdf-download-feature.sql
```

Ou copiez-collez le contenu de `add-pdf-download-feature.sql` dans l'éditeur SQL de Supabase.

### 2. Installation des dépendances backend

Dans le dossier `server/`, installez les dépendances nécessaires :

```bash
cd server
npm install puppeteer @supabase/supabase-js
```

### 3. Configuration des variables d'environnement

Assurez-vous que les variables d'environnement suivantes sont configurées dans le serveur backend :

```env
VITE_SUPABASE_URL=votre-url-supabase
VITE_SUPABASE_ANON_KEY=votre-clé-anon
# OU
SUPABASE_URL=votre-url-supabase
SUPABASE_ANON_KEY=votre-clé-anon
```

## 📝 Utilisation

### Activer le téléchargement PDF pour un cours

1. Allez dans l'interface d'administration : `/admin/courses/:courseId`
2. Dans la section "Informations générales", cochez la case **"Autoriser le téléchargement PDF du cours complet"**
3. Sauvegardez le cours

### Télécharger le PDF

1. Allez sur la page du cours : `/courses/:courseId`
2. Cliquez sur le bouton **"PDF"** dans le header (visible uniquement si le téléchargement est activé)
3. Le PDF sera généré et téléchargé automatiquement

## 🎨 Format du PDF

### Structure

- **Format** : A4 paysage
- **Marges** : 1cm de chaque côté
- **Mise en page** : Deux colonnes par page
  - **Gauche** : Slide (image, contenu rich text, ou placeholder si PDF)
  - **Droite** : Contexte pédagogique (explications, annotations formateur)

### Contenu inclus

- Toutes les slides **publiées** du cours
- Le contexte pédagogique associé à chaque slide
- Les modules sont organisés dans l'ordre défini

### Limitations

- Les PDFs uploadés comme slides ne peuvent pas être affichés dans le PDF généré (limitation Puppeteer)
- Seules les slides publiées sont incluses
- Les images doivent être accessibles publiquement via Supabase Storage

## 🔧 Architecture technique

### Backend (`server/src/routes/courses.ts`)

- **Route** : `GET /api/courses/:courseId/pdf`
- **Fonctionnalités** :
  - Vérifie que `allow_pdf_download` est activé
  - Récupère les modules et slides depuis Supabase
  - Génère le HTML avec format paysage
  - Utilise Puppeteer pour convertir HTML en PDF
  - Retourne le PDF en stream

### Frontend (`src/pages/CourseView.tsx`)

- **Bouton de téléchargement** : Visible uniquement si `allow_pdf_download === true`
- **Fonction** : `handleDownloadPdf()` qui appelle l'API backend

### Utilitaires

- **`server/src/utils/tipTapToHtml.ts`** : Convertit le contenu TipTap JSON en HTML
- **`pedagogicalContextToHtml()`** : Convertit le contexte pédagogique en HTML

## 🐛 Dépannage

### Erreur : "Configuration Supabase manquante"

Vérifiez que les variables d'environnement sont bien configurées dans le serveur backend.

### Erreur : "Le téléchargement PDF n'est pas activé"

Activez le téléchargement PDF dans les paramètres du cours (interface admin).

### Erreur : "Aucune slide trouvée"

Assurez-vous que le cours contient au moins une slide publiée.

### Le PDF ne se génère pas

1. Vérifiez que Puppeteer est bien installé : `npm list puppeteer` dans `server/`
2. Vérifiez les logs du serveur backend pour les erreurs détaillées
3. Assurez-vous que le serveur backend est accessible depuis le frontend

### Les images ne s'affichent pas dans le PDF

- Vérifiez que les images sont accessibles publiquement via Supabase Storage
- Vérifiez que les URLs générées sont correctes (logs dans la console)

## 📌 Notes importantes

- Le format paysage est optimisé pour l'impression et la lecture sur écran
- Le contexte pédagogique est formaté avec une bordure bleue pour le distinguer visuellement
- Les slides sans contexte pédagogique affichent un message "Aucun contexte pédagogique disponible"
- Les slides sans contenu affichent un placeholder avec un message d'avertissement

## 🔐 Sécurité

- L'API vérifie que le téléchargement est activé avant de générer le PDF
- L'authentification est requise pour accéder à l'API (via JWT Bearer token)
- Seules les slides publiées sont incluses dans le PDF


