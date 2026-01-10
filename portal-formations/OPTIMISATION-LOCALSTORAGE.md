# Optimisation localStorage pour éviter les appels réseau

## Comment Supabase utilise localStorage

### 1. Session stockée automatiquement
Supabase stocke automatiquement la session dans `localStorage` avec la clé `sb-auth-token` :
- ✅ `getSession()` lit depuis localStorage (pas d'appel réseau si la session est valide)
- ✅ `onAuthStateChange` détecte les changements depuis localStorage
- ✅ Le token est rafraîchi automatiquement en arrière-plan

### 2. Utilisation actuelle dans le code

**Dans `useAuth.tsx`** :
- `getSession()` est appelé mais peut timeout (problème RLS résolu)
- `onAuthStateChange` détecte `SIGNED_IN` depuis localStorage immédiatement
- Le profil est mis en cache dans l'état React (`profile`)

**Dans `useUserRole.tsx`** :
- ✅ Utilise le profil en cache depuis `useAuth` si disponible
- ✅ Évite les requêtes réseau inutiles si le profil est déjà chargé

### 3. Optimisations déjà en place

1. **Cache du profil** : Le profil est stocké dans l'état React et réutilisé
2. **Priorité au cache** : `useUserRole` utilise le profil en cache avant de faire une requête
3. **Session depuis localStorage** : Supabase lit automatiquement depuis localStorage

### 4. Améliorations possibles

Pour éviter encore plus d'appels réseau, on pourrait :
- Mettre en cache le profil dans localStorage (avec expiration)
- Vérifier le cache avant chaque requête profil
- Utiliser un système de cache plus sophistiqué (React Query, SWR)

Mais actuellement, avec RLS corrigé, les appels réseau devraient être rapides et le cache React suffit.

## Prochaines étapes

1. ✅ Réactiver RLS avec des politiques simples
2. ✅ Vérifier que tout fonctionne avec RLS activé
3. ✅ Le code utilise déjà localStorage pour la session (automatique via Supabase)
4. ✅ Le profil est mis en cache dans React (évite les requêtes multiples)
