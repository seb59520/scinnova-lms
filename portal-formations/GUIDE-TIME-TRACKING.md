# Guide : Tracking du temps passé sur l'application

## 🎯 Fonctionnalité

Système de tracking automatique du temps que les utilisateurs passent sur l'application, avec distinction entre :
- **Temps total** : Temps depuis l'ouverture de la page
- **Temps actif** : Temps où la page est active devant les yeux de l'utilisateur (page visible + activité détectée)

## 📋 Installation

### Étape 1 : Créer la table

Exécutez le script `creer-table-time-tracking.sql` dans Supabase SQL Editor.

Ce script crée :
- Table `user_time_tracking` : Stocke le temps passé par utilisateur par jour
- Vue `user_time_stats` : Vue agrégée pour les statistiques
- RLS Policies : Sécurité pour l'accès aux données
- Trigger : Mise à jour automatique de `updated_at`

## 🚀 Fonctionnement

### Tracking automatique

Le système track automatiquement :
1. **Temps total** : Depuis l'ouverture de la page
2. **Temps actif** : Uniquement quand :
   - La page est visible (pas en arrière-plan)
   - L'utilisateur est actif (souris, clavier, scroll, etc.)
   - Pas d'inactivité > 1 minute

### Détection d'activité

L'utilisateur est considéré comme actif si :
- La page est visible (pas en arrière-plan)
- Une activité a été détectée dans les 60 dernières secondes :
  - Mouvement de souris
  - Clic
  - Frappe au clavier
  - Scroll
  - Touch (mobile)

### Envoi des données

- **Fréquence** : Toutes les 30 secondes
- **Format** : Agrégation par jour, session et cours
- **Persistance** : Les données sont cumulées dans la base

## 📊 Visualisation pour les formateurs

### Accès

1. **Depuis le tableau de bord** : `/trainer`
   - Cliquer sur "Temps passé" dans les actions rapides d'une session
2. **Directement** : `/trainer/time-tracking`
3. **Pour une session spécifique** : `/trainer/sessions/:sessionId/time-tracking`

### Données affichées

#### Statistiques globales
- **Temps actif total** : Somme de tous les temps actifs
- **Jours actifs** : Nombre de jours avec activité
- **Moyenne par jour** : Temps actif moyen par jour
- **Vues de pages** : Nombre total de pages visitées
- **Utilisateurs actifs** : Nombre d'utilisateurs ayant une activité

#### Tableau par utilisateur
- Nom de l'utilisateur
- Temps actif total (heures et minutes)
- Nombre de jours actifs
- Moyenne par jour
- Nombre de vues de pages

#### Détail par jour
- Date
- Utilisateur
- Session
- Cours
- Temps actif (heures et minutes)
- Nombre de vues
- Dernière activité

### Filtres

- **Date de début** : Filtrer à partir d'une date
- **Date de fin** : Filtrer jusqu'à une date
- **Par défaut** : 30 derniers jours

## 🔧 Configuration

### Paramètres du tracking

Dans `useTimeTracking.ts` :
- `TRACKING_INTERVAL = 30000` : Envoi toutes les 30 secondes
- `ACTIVE_CHECK_INTERVAL = 1000` : Vérification chaque seconde
- `INACTIVE_THRESHOLD = 60000` : 1 minute d'inactivité = inactif

### Modification des paramètres

Pour changer la fréquence d'envoi ou le seuil d'inactivité, modifiez les constantes dans `src/hooks/useTimeTracking.ts`.

## 📈 Utilisation des données

Les données peuvent être utilisées pour :
- **Engagement** : Voir quels apprenants sont les plus actifs
- **Détection de problèmes** : Identifier les apprenants inactifs
- **Optimisation** : Comprendre comment les apprenants utilisent l'application
- **Reporting** : Générer des rapports d'activité

## 🔒 Confidentialité

- **RLS activé** : Les utilisateurs ne voient que leurs propres données
- **Formateurs** : Peuvent voir les données de leurs apprenants uniquement
- **Pas de données sensibles** : Seulement le temps passé, pas le contenu consulté

## ✅ Vérification

Pour vérifier que le tracking fonctionne :

1. **Exécuter le script SQL** dans Supabase
2. **Rafraîchir le navigateur** (Cmd+Shift+R)
3. **Utiliser l'application** pendant quelques minutes
4. **Aller sur `/trainer/time-tracking`** et vérifier que les données apparaissent

## 🐛 Dépannage

### Les données ne remontent pas

1. Vérifier que la table existe : `SELECT * FROM user_time_tracking LIMIT 1;`
2. Vérifier les RLS policies : Les utilisateurs doivent pouvoir insérer leurs données
3. Vérifier la console du navigateur : Y a-t-il des erreurs ?
4. Vérifier que `TimeTrackingProvider` est bien dans `App.tsx`

### Le temps actif est toujours 0

1. Vérifier que la page est visible (pas en arrière-plan)
2. Vérifier qu'il y a de l'activité (mouvement de souris, etc.)
3. Vérifier que le seuil d'inactivité n'est pas trop court

Tout est prêt ! 🎉


