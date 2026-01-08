# Guide : Utilisateurs Ghost et Désactivation

Ce guide explique comment utiliser les fonctionnalités d'utilisateurs anonymes (ghost) et de désactivation d'utilisateurs dans l'application.

## 📋 Table des matières

1. [Utilisateurs Ghost](#utilisateurs-ghost)
2. [Désactivation d'utilisateurs](#désactivation-dutilisateurs)
3. [Configuration initiale](#configuration-initiale)

## 👻 Utilisateurs Ghost

### Qu'est-ce qu'un utilisateur ghost ?

Un utilisateur ghost est un utilisateur anonyme qui peut accéder à l'application sans fournir d'adresse email. Il reçoit :
- Un code d'accès unique généré par un administrateur
- Un nom aléatoire de type "cartoon" (ex: "Panda Curieux-ABC1")
- Une session temporaire qui peut être supprimée après utilisation

### Configuration

#### 1. Activer l'authentification anonyme dans Supabase

1. Allez dans **Supabase Dashboard** → **Authentication** → **Providers**
2. Activez le provider **"Anonymous"**
3. Sauvegardez les modifications

#### 2. Exécuter le script SQL

Exécutez le fichier `ghost-users-and-deactivation.sql` dans l'éditeur SQL de Supabase. Ce script crée :
- La table `ghost_codes` pour gérer les codes d'accès
- Les fonctions SQL pour générer et valider les codes
- Les policies RLS nécessaires

### Utilisation

#### Pour les administrateurs

1. **Générer des codes d'accès**
   - Allez dans `/admin/ghost-codes`
   - Cliquez sur "Générer des codes"
   - Choisissez le nombre de codes et la durée d'expiration
   - Optionnellement, ajoutez des notes pour identifier l'usage
   - Cliquez sur "Générer les codes"

2. **Distribuer les codes**
   - Les codes générés apparaissent dans la liste
   - Cliquez sur l'icône de copie pour copier un code
   - Distribuez les codes aux utilisateurs qui souhaitent rester anonymes

3. **Suivre l'utilisation**
   - La page affiche les statistiques :
     - Codes disponibles
     - Codes utilisés
     - Codes expirés
   - Vous pouvez voir quand chaque code a été utilisé

#### Pour les utilisateurs

1. **Se connecter avec un code**
   - Allez sur `/ghost-login`
   - Entrez le code d'accès fourni par l'administrateur
   - Cliquez sur "Se connecter anonymement"
   - Un nom aléatoire vous sera attribué (ex: "Renard Rusé-XYZ2")

2. **Utiliser l'application**
   - Vous pouvez utiliser toutes les fonctionnalités normalement
   - Votre identité reste confidentielle

3. **Déconnexion**
   - Lors de la déconnexion, votre compte ghost sera automatiquement supprimé
   - Les données associées seront également supprimées (selon les règles de cascade)

### Fonctionnalités techniques

- **Génération de noms cartoon** : Les noms sont générés aléatoirement avec un format `Animal Adjectif-Suffixe`
- **Validation des codes** : Les codes sont vérifiés pour s'assurer qu'ils sont valides, non utilisés et non expirés
- **Expiration automatique** : Les codes peuvent avoir une date d'expiration
- **Nettoyage automatique** : Les utilisateurs ghost peuvent être supprimés automatiquement après la session

## 🚫 Désactivation d'utilisateurs

### Fonctionnalité

Les administrateurs peuvent désactiver des utilisateurs sans les supprimer. Un utilisateur désactivé :
- Ne peut plus se connecter
- N'apparaît plus dans les listes d'utilisateurs actifs
- Peut être réactivé à tout moment

### Utilisation

1. **Accéder à la gestion des utilisateurs**
   - Allez dans `/admin/users`
   - Vous verrez la liste de tous les utilisateurs avec leur statut

2. **Désactiver un utilisateur**
   - Trouvez l'utilisateur dans la liste
   - Cliquez sur l'icône "UserX" (désactiver) dans la colonne "Statut"
   - Confirmez l'action
   - L'utilisateur sera marqué comme "Désactivé" et ne pourra plus se connecter

3. **Réactiver un utilisateur**
   - Trouvez l'utilisateur désactivé (il apparaît en grisé)
   - Cliquez sur l'icône "UserCheck" (réactiver) dans la colonne "Statut"
   - Confirmez l'action
   - L'utilisateur pourra à nouveau se connecter

### Comportement technique

- **Champ `is_active`** : Un champ `is_active` (par défaut `true`) est ajouté à la table `profiles`
- **Policies RLS** : Les policies RLS sont mises à jour pour exclure les utilisateurs désactivés
- **Affichage** : Les utilisateurs désactivés apparaissent en grisé dans l'interface admin
- **Vérification** : Lors de la connexion, le système vérifie que `is_active = true`

## 🔧 Configuration initiale

### Étapes à suivre

1. **Exécuter le script SQL**
   ```sql
   -- Exécutez ghost-users-and-deactivation.sql dans Supabase SQL Editor
   ```

2. **Activer l'authentification anonyme**
   - Supabase Dashboard → Authentication → Providers → Enable "Anonymous"

3. **Vérifier les routes**
   - `/ghost-login` : Page de connexion pour les utilisateurs ghost
   - `/admin/ghost-codes` : Gestion des codes (admin uniquement)
   - `/admin/users` : Gestion des utilisateurs avec désactivation (admin uniquement)

### Vérification

1. **Tester la génération de codes**
   ```sql
   -- Dans Supabase SQL Editor
   SELECT * FROM generate_ghost_codes(3, 24, NULL);
   ```

2. **Tester la connexion ghost**
   - Générer un code via l'interface admin
   - Aller sur `/ghost-login`
   - Entrer le code et se connecter
   - Vérifier que le nom cartoon est attribué

3. **Tester la désactivation**
   - Aller sur `/admin/users`
   - Désactiver un utilisateur de test
   - Essayer de se connecter avec cet utilisateur (devrait échouer)
   - Réactiver l'utilisateur
   - Vérifier que la connexion fonctionne à nouveau

## 📝 Notes importantes

### Sécurité

- Les codes ghost doivent être distribués de manière sécurisée
- Les codes expirés ne peuvent plus être utilisés
- Les codes utilisés ne peuvent pas être réutilisés
- Les utilisateurs ghost sont supprimés après déconnexion (optionnel)

### Limitations

- Les utilisateurs ghost ne peuvent pas récupérer leur compte (pas d'email)
- Les codes doivent être générés manuellement par un admin
- La suppression automatique des utilisateurs ghost nécessite une Edge Function ou un job programmé

### Bonnes pratiques

- Générer des codes avec une expiration raisonnable (24h par défaut)
- Ajouter des notes lors de la génération pour identifier l'usage
- Surveiller l'utilisation des codes via les statistiques
- Désactiver plutôt que supprimer les utilisateurs problématiques

## 🆘 Dépannage

### Problème : "Code invalide ou déjà utilisé"

- Vérifiez que le code n'a pas déjà été utilisé
- Vérifiez que le code n'a pas expiré
- Vérifiez que le code existe dans la table `ghost_codes`

### Problème : "Erreur lors de la connexion ghost"

- Vérifiez que l'authentification anonyme est activée dans Supabase
- Vérifiez que le script SQL a été exécuté correctement
- Vérifiez les logs de la console pour plus de détails

### Problème : Un utilisateur désactivé peut toujours se connecter

- Vérifiez que le champ `is_active` existe dans la table `profiles`
- Vérifiez que les policies RLS ont été mises à jour
- Vérifiez que `fetchProfile` dans `useAuth.tsx` filtre par `is_active = true`

## 📚 Références

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Authentification anonyme Supabase](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)


