# Solution : "0 sessions" s'affiche dans le portail formateur

## 🔍 Diagnostic

Si vous voyez "0 sessions" dans le portail formateur, cela signifie que :
- ✅ Votre organisation existe
- ✅ Vous avez accès au portail formateur
- ❌ **Aucune session n'a été créée** pour cette organisation et ce cours

## ✅ Solution rapide

### Option 1 : Via SQL (le plus rapide)

1. **Ouvrir Supabase SQL Editor**
2. **Exécuter le script** `creer-session-rapide.sql`
3. **Rafraîchir** le portail formateur (`/trainer`)

Le script va :
- Trouver automatiquement votre organisation
- Trouver le cours "M1 FULL-STACK 2025/2026"
- Créer une session active

### Option 2 : Via l'interface (à implémenter)

Actuellement, il n'y a pas d'interface pour créer des sessions depuis le portail formateur. Vous devez :
- Soit utiliser SQL (Option 1)
- Soit créer une interface d'administration (à développer)

## 📋 Vérification après création

Après avoir créé une session, vous devriez voir :

1. **Dans le portail formateur** (`/trainer`) :
   - Votre organisation avec "1 session" (au lieu de "0 sessions")
   - En cliquant sur l'organisation, vous verrez la session créée
   - Un bouton "Apprenants" pour voir les apprenants de cette session

2. **Dans la console du navigateur** (F12) :
   - `✅ Sessions chargées pour [nom org]: 1`

## 🎯 Prochaines étapes

Une fois la session créée :

1. **Ajouter des apprenants** :
   - Aller sur `/admin/courses/:courseId/enrollments`
   - Ajouter des inscriptions pour les apprenants
   - Les enrollments seront automatiquement liés à la session si le trigger est actif

2. **Voir les apprenants** :
   - Aller sur `/trainer/session/:sessionId`
   - Vous verrez la liste des apprenants avec leurs soumissions

## 🔧 Script SQL de diagnostic

Si la session ne s'affiche toujours pas après création, exécutez `diagnostic-sessions.sql` pour identifier le problème.

## 💡 Note importante

Les sessions doivent être créées **manuellement**. Il n'y a pas de création automatique de sessions quand :
- Un cours est créé
- Un apprenant s'inscrit
- Un formateur accède au portail

C'est une fonctionnalité à développer si vous souhaitez automatiser la création de sessions.


