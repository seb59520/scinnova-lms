# Edge Function: create-student-user

Cette Edge Function permet de créer des étudiants avec un identifiant personnalisé sans avoir besoin d'un email réel.

## Utilisation

Cette fonction est appelée automatiquement depuis la page d'administration des utilisateurs (`AdminUsers.tsx`) lorsque vous créez un étudiant avec un identifiant.

## Déploiement

Pour déployer cette fonction :

```bash
cd portal-formations
supabase functions deploy create-student-user
```

## Variables d'environnement

Cette fonction utilise automatiquement les variables d'environnement de Supabase :
- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service_role (disponible automatiquement dans les Edge Functions)

## Format d'email généré

Les emails générés suivent le format : `{identifiant}@students.scinnova.fr`

Exemple : `student1@students.scinnova.fr`

## Sécurité

Cette fonction utilise l'API Admin de Supabase (`auth.admin.createUser`) qui :
- Contourne les validations d'email strictes
- Confirme automatiquement l'email (`email_confirm: true`)
- Nécessite la clé service_role (disponible uniquement côté serveur)

## Authentification

La page admin transmet automatiquement le jeton de session de l'administrateur via le header `X-Admin-Auth-Token`.  
Si vous invoquez la fonction manuellement (via cURL, Postman, etc.), vous devez :
1. Inclure l'API key Supabase (anon ou service) dans le header `Authorization: Bearer <API_KEY>` pour autoriser l'accès à la fonction.
2. Ajouter le header `X-Admin-Auth-Token: <ACCESS_TOKEN>` contenant un jeton d'un utilisateur ayant le rôle `admin`.

La fonction refusera l'exécution si le jeton admin est absent ou invalide.
