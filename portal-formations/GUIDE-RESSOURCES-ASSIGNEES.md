# Guide : Assignation de ressources aux apprenants

## 🎯 Fonctionnalité

Permet aux formateurs d'assigner des ressources (fichiers, liens, textes, corrections) aux apprenants avec un système de notifications en temps réel.

## 📋 Installation

### Étape 1 : Créer les tables

Exécutez le script `creer-table-ressources-assignees.sql` dans Supabase SQL Editor.

Ce script crée :
- Table `assigned_resources` : Stocke les ressources assignées
- Table `notifications` : Stocke les notifications pour les apprenants
- Trigger automatique : Crée une notification quand une ressource est assignée
- RLS Policies : Sécurité pour l'accès aux ressources

### Étape 2 : Créer le bucket de storage

Exécutez le script `creer-bucket-resources.sql` dans Supabase SQL Editor.

Ce script crée :
- Bucket `resources` dans Supabase Storage
- Policies RLS pour l'upload et le téléchargement

## 🚀 Utilisation

### Pour les formateurs

1. **Aller sur le portail formateur** : `/trainer`
2. **Sélectionner une session** : Cliquer sur une session
3. **Assigner une ressource** : Cliquer sur le bouton "Ressource" à côté d'un apprenant
4. **Remplir le formulaire** :
   - Titre (obligatoire)
   - Description (optionnelle)
   - Type de ressource :
     - **Fichier** : Upload d'un fichier (PDF, image, etc.)
     - **Lien** : URL externe
     - **Texte** : Contenu texte libre
     - **Correction** : Correction d'un exercice (texte)
5. **Assigner** : La ressource est assignée et une notification est créée automatiquement

### Pour les apprenants

1. **Voir les notifications** : 
   - Badge rouge sur l'icône de boîte aux lettres dans l'en-tête
   - Lien "Boîte aux lettres" dans le menu utilisateur
2. **Accéder à la boîte aux lettres** : `/mailbox`
3. **Voir les ressources** :
   - Ressources non lues en bleu avec un point bleu
   - Ressources lues en blanc
4. **Télécharger/Ouvrir** :
   - Fichiers : Bouton "Télécharger"
   - Liens : Bouton "Ouvrir le lien"
   - Textes/Corrections : Affichés directement
5. **Marquer comme lu** : Cliquer sur "Marquer comme lu" ou ouvrir/télécharger la ressource

## 🔔 Notifications

- **Création automatique** : Une notification est créée automatiquement quand une ressource est assignée
- **Temps réel** : Les notifications apparaissent en temps réel grâce à Supabase Realtime
- **Badge** : Le nombre de notifications non lues apparaît dans l'en-tête
- **Marquage comme lu** : Quand l'apprenant marque une ressource comme lue, la notification correspondante est aussi marquée comme lue

## 📁 Types de ressources

1. **Fichier** : 
   - Upload dans Supabase Storage
   - Formats acceptés : PDF, images, documents Office
   - Taille max : 50 MB

2. **Lien** :
   - URL externe
   - S'ouvre dans un nouvel onglet

3. **Texte** :
   - Contenu texte libre
   - Affiché dans la boîte aux lettres

4. **Correction** :
   - Même que texte mais avec un badge "Correction"
   - Utile pour partager les corrections d'exercices

## 🔒 Sécurité

- **RLS activé** : Les apprenants ne voient que leurs propres ressources
- **Formateurs** : Peuvent voir toutes les ressources qu'ils ont assignées
- **Storage** : Les fichiers sont privés, accessibles uniquement aux formateurs et aux apprenants concernés

## 🎨 Interface

### Portail formateur
- Bouton "Ressource" dans le tableau des apprenants
- Modal d'assignation avec formulaire

### Boîte aux lettres apprenant
- Liste des ressources assignées
- Badge de notification dans l'en-tête
- Indicateur visuel pour les ressources non lues
- Actions : Télécharger, Ouvrir, Marquer comme lu

## 📝 Exemple d'utilisation

1. Un apprenant soumet un exercice
2. Le formateur corrige et crée un fichier PDF avec la correction
3. Le formateur va sur `/trainer/session/:sessionId`
4. Clique sur "Ressource" à côté de l'apprenant
5. Sélectionne "Correction", upload le PDF
6. L'apprenant reçoit une notification
7. L'apprenant va sur `/mailbox` et télécharge la correction

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **Exécuter les scripts SQL** dans Supabase
2. **Rafraîchir le navigateur** (Cmd+Shift+R)
3. **Aller sur le portail formateur** : `/trainer`
4. **Assigner une ressource de test** à un apprenant
5. **Se connecter en tant qu'apprenant** et vérifier la notification
6. **Aller sur `/mailbox`** et voir la ressource

Tout est prêt ! 🎉



