# Solution immédiate : Désactiver RLS temporairement

## Problème identifié

Les logs montrent que :
1. ✅ `onAuthStateChange` détecte `SIGNED_IN` - l'utilisateur est connecté
2. ❌ `getSession()` timeout systématiquement
3. ❌ Les requêtes `profiles` timeout systématiquement
4. ❌ Le localStorage ne contient pas `currentSession` au format attendu

**Conclusion** : Le problème vient probablement de RLS qui bloque toutes les requêtes.

## Solution immédiate

### Étape 1 : Désactiver RLS temporairement

Exécutez dans Supabase SQL Editor :

```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

### Étape 2 : Vérifier que RLS est désactivé

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';
```

Vous devriez voir `rls_enabled: false`

### Étape 3 : Recharger l'application

1. Rechargez l'application (F5)
2. Vérifiez si vous pouvez vous connecter
3. Vérifiez si le profil se charge

### Étape 4 : Si ça fonctionne

Si l'application fonctionne après avoir désactivé RLS, cela confirme que RLS est le problème.

**Réactivez ensuite RLS** avec des politiques simples en exécutant `reactivate-rls-simple.sql`

## Pourquoi cette solution

RLS peut bloquer les requêtes si :
- Les politiques sont mal configurées
- Les politiques sont trop complexes (sous-requêtes lentes)
- Il y a des conflits entre plusieurs politiques
- Les index nécessaires manquent

En désactivant RLS temporairement, on confirme que c'est bien le problème, puis on peut le réactiver avec des politiques simples et optimisées.

## Scripts disponibles

- `emergency-disable-rls-temp.sql` : Désactiver RLS
- `reactivate-rls-simple.sql` : Réactiver RLS avec des politiques simples
- `verify-rls-status.sql` : Vérifier l'état de RLS
