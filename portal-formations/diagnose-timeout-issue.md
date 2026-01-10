# Diagnostic des timeouts persistants

## Problème actuel

Les requêtes `getSession()` et les requêtes `profiles` timeout systématiquement, même après :
- ✅ Augmentation des timeouts
- ✅ Désactivation de l'interception des requêtes auth
- ✅ Utilisation de localStorage en priorité

## Causes possibles

### 1. RLS bloque toujours les requêtes
**Solution immédiate** : Désactiver RLS temporairement pour confirmer

Exécutez dans Supabase SQL Editor :
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

Puis rechargez l'application. Si ça fonctionne, le problème vient de RLS.

### 2. Problème réseau/firewall
Les requêtes ne parviennent pas à Supabase.

**Test** : Ouvrez la console et vérifiez les requêtes réseau dans l'onglet Network (F12 > Network).

### 3. Session invalide dans localStorage
La session dans localStorage est corrompue ou invalide.

**Solution** : Nettoyer le localStorage
```javascript
localStorage.removeItem('sb-auth-token')
localStorage.clear()
window.location.reload()
```

### 4. Configuration Supabase incorrecte
Les variables d'environnement sont incorrectes.

**Vérification** : Vérifiez dans `.env` :
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Actions immédiates

### Étape 1 : Vérifier les logs
Rechargez l'application et regardez dans la console :
- `🔍 [useAuth] Checking localStorage for session...`
- `✅ [useAuth] Session valide chargée depuis localStorage` OU
- `⚠️ [useAuth] Aucune session dans localStorage`

### Étape 2 : Si pas de session dans localStorage
Cela signifie que vous devez vous reconnecter. Le problème est que `getSession()` timeout avant de pouvoir récupérer la session.

### Étape 3 : Désactiver RLS temporairement
Exécutez `emergency-disable-rls-temp.sql` dans Supabase SQL Editor.

Si ça fonctionne après, le problème vient de RLS. Réactivez-le ensuite avec `reactivate-rls-simple.sql`.

### Étape 4 : Vérifier les requêtes réseau
Ouvrez F12 > Network et filtrez par "supabase" ou "auth". Vérifiez :
- Les requêtes sont-elles envoyées ?
- Quel est le statut HTTP (200, 500, timeout) ?
- Combien de temps prennent-elles ?

## Solution de contournement temporaire

Si RLS est le problème, vous pouvez :
1. Désactiver RLS temporairement
2. Utiliser l'application normalement
3. Une fois que tout fonctionne, réactiver RLS avec des politiques simples

## Prochaines étapes

1. Exécutez `emergency-disable-rls-temp.sql`
2. Rechargez l'application
3. Dites-moi si ça fonctionne
4. Si oui, on réactivera RLS avec des politiques optimisées
