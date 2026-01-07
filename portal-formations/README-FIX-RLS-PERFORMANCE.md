# Correction des Warnings de Performance RLS

Ce document explique comment corriger les warnings de performance RLS détectés par Supabase.

## Problèmes identifiés

### 1. auth_rls_initplan
Les politiques RLS utilisent `auth.uid()` directement, ce qui cause une réévaluation de la fonction pour chaque ligne. Cela impacte les performances à grande échelle.

**Solution** : Remplacer `auth.uid()` par `(select auth.uid())` dans toutes les politiques RLS.

### 2. multiple_permissive_policies
Certaines tables ont plusieurs politiques permissives pour le même rôle et la même action. Chaque politique doit être exécutée, ce qui peut ralentir les requêtes.

**Note** : Ces politiques multiples sont souvent nécessaires pour la logique métier (ex: un utilisateur peut voir ses propres données OU être admin). La fusion de ces politiques nécessiterait une refonte de la logique d'accès.

## Fichier de correction

Le fichier `fix-rls-performance-warnings.sql` contient toutes les corrections nécessaires :

1. **Fonctions helper optimisées** : Les fonctions `is_admin()` et `is_org_member_with_role()` sont déjà optimisées.

2. **Suppression de toutes les politiques existantes** : Le script supprime toutes les politiques mentionnées dans les warnings.

3. **Recréation avec `(select auth.uid())`** : Toutes les politiques sont recréées en utilisant `(select auth.uid())` au lieu de `auth.uid()`.

## Tables corrigées

- `sessions`
- `item_documents`
- `profiles`
- `courses`
- `modules`
- `items`
- `chapters`
- `enrollments`
- `submissions`
- `game_scores`
- `programs`
- `program_courses`
- `program_enrollments`
- `orgs`
- `org_members`
- `exercises`
- `user_settings`
- `trainer_scripts`
- `notifications`
- `assigned_resources`
- `user_time_tracking`
- `chat_messages`
- `user_presence`
- `user_responses`

## Instructions d'utilisation

1. **Sauvegarder la base de données** : Avant d'exécuter le script, assurez-vous d'avoir une sauvegarde de votre base de données.

2. **Exécuter le script** : Copiez le contenu de `fix-rls-performance-warnings.sql` dans l'éditeur SQL de Supabase et exécutez-le.

3. **Vérifier les résultats** : Le script affichera toutes les politiques créées à la fin. Vérifiez que toutes les politiques attendues sont présentes.

4. **Vérifier les warnings** : Après l'exécution, vérifiez dans l'interface Supabase que les warnings `auth_rls_initplan` ont disparu.

## Notes importantes

- Les warnings concernant les politiques multiples (`multiple_permissive_policies`) peuvent persister. C'est normal si la logique métier nécessite plusieurs politiques pour le même rôle/action.

- Si vous avez des politiques personnalisées qui ne sont pas dans ce script, vous devrez les corriger manuellement en remplaçant `auth.uid()` par `(select auth.uid())`.

- Les fonctions helper (`is_admin()`, `is_org_member_with_role()`) utilisent déjà `SECURITY DEFINER STABLE`, ce qui est optimal pour les performances.

## Exemple de transformation

**Avant** :
```sql
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

**Après** :
```sql
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING ((select auth.uid()) = id);
```

## Impact sur les performances

Cette correction devrait améliorer significativement les performances des requêtes sur les tables avec beaucoup de lignes, car `auth.uid()` ne sera plus réévalué pour chaque ligne mais une seule fois par requête.

