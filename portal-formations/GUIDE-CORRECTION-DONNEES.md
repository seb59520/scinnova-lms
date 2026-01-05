# Guide : Correction des données pour le portail formateur

## 🔍 Problèmes identifiés

1. **Heure ne remonte pas** : Les soumissions n'ont pas de `submitted_at` rempli
2. **Score sur 2000** : Les scores de jeux sont sur 2000 au lieu de 100 (corrigé dans le code)
3. **Complétion ne remonte pas** : Pas de données dans `module_progress`

## ✅ Solution : Script de diagnostic et correction

Le script `diagnostic-et-correction-donnees.sql` va :

### Étape 1 : Diagnostic initial
- Vérifier l'état des soumissions (avec/sans session, avec/sans `submitted_at`)
- Compter les soumissions non notées

### Étape 2 : Corriger les soumissions
- Remplir `submitted_at` avec `created_at` ou `NOW()` si manquant
- Pour les soumissions avec status `submitted` ou `graded`

### Étape 3 : Diagnostic des progressions
- Vérifier les progressions de modules existantes
- Calculer la moyenne de complétion

### Étape 4 : Créer les progressions manquantes
- Créer une progression à 0% pour chaque apprenant × module
- Si aucune progression n'existe pour cette combinaison

### Étape 5 : Mettre à jour les progressions
- Calculer le pourcentage basé sur les items complétés
- Mettre à jour `module_progress.percent` automatiquement

### Étape 6 : Diagnostic des activités
- Vérifier les événements d'activité existants
- Compter les activités des 7 derniers jours

### Étape 7 : Créer des événements d'activité
- Créer des événements `submit` basés sur les soumissions existantes
- Utiliser `submitted_at` comme date de création

### Étape 8 : Lier les activités aux sessions
- Mettre à jour `session_id` dans `activity_events`
- Basé sur les enrollments et sessions actives

### Étape 9 : Résumé final
- Afficher un tableau récapitulatif par session
- Montrer toutes les métriques importantes

## 🚀 Utilisation

1. **Ouvrir Supabase SQL Editor**
2. **Copier-coller le contenu de `diagnostic-et-correction-donnees.sql`**
3. **Exécuter le script**

Le script est conçu pour être **idempotent** (peut être exécuté plusieurs fois sans problème).

## 📊 Résultats attendus

Après l'exécution, vous devriez voir :

- ✅ Toutes les soumissions ont un `submitted_at`
- ✅ Des progressions de modules créées pour tous les apprenants
- ✅ Des progressions mises à jour basées sur les soumissions
- ✅ Des événements d'activité créés pour chaque soumission
- ✅ Tous les événements liés aux sessions

## 🔄 Après l'exécution

1. **Rafraîchir le portail formateur** (Cmd+Shift+R ou Ctrl+Shift+R)
2. **Vérifier les KPIs** :
   - Apprenants actifs (7j) devrait être > 0
   - Taux de complétion devrait être > 0%
   - Score moyen devrait être affiché
3. **Vérifier le tableau des apprenants** :
   - Dates et heures de dernière activité affichées
   - Scores normalisés sur 100
   - Pourcentages de complétion affichés

## ⚠️ Notes importantes

- Le script utilise l'organisation ID : `6f772ff6-1d15-4f29-9d0f-be03b2cc974d`
- Les progressions sont calculées automatiquement basées sur les soumissions
- Les événements d'activité sont créés rétroactivement pour les soumissions existantes
- Les données sont liées automatiquement aux sessions

## 🐛 Si les données ne remontent toujours pas

Vérifiez que :
1. Les apprenants ont bien des soumissions dans la base
2. Les soumissions ont un `status` = `'submitted'` ou `'graded'`
3. Les items soumis appartiennent bien aux modules du cours de la session
4. Les sessions sont bien actives (`status = 'active'`)

Si nécessaire, exécutez à nouveau le script de diagnostic (Étape 9) pour voir l'état actuel.


