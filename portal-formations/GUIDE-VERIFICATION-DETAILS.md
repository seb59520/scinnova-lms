# Guide de vérification - Affichage des soumissions dans le portail formateur

## ✅ Modifications apportées

1. **Nouveau composant** : `src/components/trainer/LearnerDetails.tsx`
   - Affiche toutes les soumissions d'un apprenant
   - Permet de télécharger les fichiers joints
   - Affiche les réponses textuelles et les notes

2. **Fonction ajoutée** : `getLearnerSubmissions()` dans `src/lib/queries/trainerQueries.ts`
   - Récupère toutes les soumissions d'un apprenant pour une session

3. **Bouton "Détails"** ajouté dans la table des apprenants
   - Bouton vert visible dans la colonne "Actions"

4. **Script SQL** : `fix-submissions-rls-for-trainers.sql`
   - À exécuter dans Supabase pour permettre aux formateurs de voir les soumissions

## 🔍 Comment vérifier que ça fonctionne

### 1. Vérifier que le serveur de développement tourne

```bash
cd portal-formations
npm run dev
```

### 2. Accéder à la page des apprenants

1. Se connecter en tant que formateur
2. Aller sur `/trainer`
3. Cliquer sur une session pour voir les apprenants
4. URL attendue : `/trainer/session/:sessionId`

### 3. Vérifier la présence du bouton "Détails"

Dans la table des apprenants, vous devriez voir :
- Un bouton vert "Détails" (premier bouton dans la colonne Actions)
- Des boutons "Relancer", "Ressource", "Note"

### 4. Tester l'ouverture du modal

1. Cliquer sur le bouton "Détails" d'un apprenant
2. Ouvrir la console du navigateur (F12)
3. Vous devriez voir :
   - `🔍 Ouvrir détails pour: [userId] [displayName]`
   - `🔍 handleViewDetails appelé: {userId, displayName, sessionId}`
   - `📥 Chargement des soumissions pour: {sessionId, userId, displayName}`
   - `📥 Soumissions récupérées: {count: X, error: null}`

### 5. Vérifier l'affichage des soumissions

Le modal devrait afficher :
- Le nom de l'apprenant
- Le nombre de soumissions
- Pour chaque soumission :
  - Titre de l'item (exercice/TP)
  - Type (Exercice, TP, Activité)
  - Module
  - Statut (Soumis, Noté, Brouillon)
  - Date de soumission
  - Note (si disponible)
  - Réponse textuelle (si présente)
  - Fichier joint avec bouton de téléchargement (si présent)

## 🐛 Problèmes possibles et solutions

### Le bouton "Détails" n'apparaît pas

**Causes possibles :**
- Le serveur de développement n'a pas été redémarré
- Cache du navigateur
- Vous n'êtes pas sur la bonne page (`/trainer/session/:sessionId`)

**Solutions :**
1. Redémarrer le serveur : `Ctrl+C` puis `npm run dev`
2. Vider le cache : `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)
3. Vérifier l'URL dans la barre d'adresse

### Le modal s'ouvre mais aucune soumission n'apparaît

**Causes possibles :**
- L'apprenant n'a pas encore soumis de travaux
- Les politiques RLS ne sont pas configurées
- Erreur dans la requête

**Solutions :**
1. Vérifier la console du navigateur pour les erreurs
2. Exécuter le script SQL `fix-submissions-rls-for-trainers.sql` dans Supabase
3. Vérifier que l'apprenant a bien des soumissions dans la base de données

### Erreur lors du téléchargement de fichier

**Causes possibles :**
- Le bucket `submissions` n'existe pas
- Les politiques RLS du storage ne sont pas configurées
- Le fichier n'existe plus

**Solutions :**
1. Exécuter `fix-submissions-storage-rls.sql` dans Supabase
2. Vérifier que le bucket `submissions` existe
3. Vérifier les politiques RLS du storage

## 📋 Checklist de vérification

- [ ] Le serveur de développement tourne
- [ ] Je suis connecté en tant que formateur
- [ ] Je suis sur la page `/trainer/session/:sessionId`
- [ ] Le bouton "Détails" apparaît dans la table
- [ ] Le modal s'ouvre quand je clique sur "Détails"
- [ ] Les soumissions s'affichent correctement
- [ ] Les fichiers peuvent être téléchargés
- [ ] Les notes s'affichent correctement

## 🔧 Scripts SQL à exécuter

Si les soumissions ne s'affichent pas, exécuter dans Supabase SQL Editor :

1. `fix-submissions-rls-for-trainers.sql` - Permet aux formateurs de voir les soumissions
2. `fix-submissions-storage-rls.sql` - Permet de télécharger les fichiers

## 📞 Support

Si le problème persiste :
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs dans l'onglet Console
3. Vérifier les requêtes dans l'onglet Network
4. Vérifier les logs du serveur de développement



