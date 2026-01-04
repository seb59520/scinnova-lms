# TP : Swagger UI / OpenAPI 3 – Création d'une API simple

**Durée estimée : 2h30 à 3h30**  
**Niveau : MBA1 Développeur Full Stack**

---

## 📋 Contexte

Vous êtes développeur backend dans une startup qui souhaite adopter une approche **API-first** pour développer ses services. Votre mission est de concevoir et implémenter une API REST simple pour la gestion de tâches, en suivant les bonnes pratiques OpenAPI 3 et en utilisant Swagger UI pour la documentation interactive.

L'objectif est de démontrer que vous maîtrisez :
- La conception d'une API avec OpenAPI 3
- L'utilisation de Swagger UI pour tester et documenter
- L'implémentation d'une API REST conforme au contrat
- La validation des données et la gestion d'erreurs standardisées

---

## 🎯 Objectifs pédagogiques

À la fin de ce TP, vous serez capable de :

1. **Concevoir** une spécification OpenAPI 3 complète pour une API REST
2. **Configurer** Swagger UI pour servir et tester votre API
3. **Implémenter** une API Express avec TypeScript conforme à la spécification
4. **Valider** les données d'entrée avec Zod
5. **Gérer** les erreurs de manière standardisée
6. **Tester** l'API via Swagger UI et curl

---

## ✅ Prérequis

- Node.js 18+ installé
- Connaissances de base en TypeScript
- Connaissances de base en Express.js
- Compréhension des concepts REST (GET, POST, PUT, PATCH, DELETE)
- Notions de base sur OpenAPI/Swagger (vue en cours)

---

## 📦 Périmètre fonctionnel

### API "Tasks" - Gestion de tâches

**Modèle de données :**
- `id` : UUID v4 (généré automatiquement)
- `title` : string (minimum 3 caractères, requis)
- `description` : string (optionnel)
- `status` : enum `'todo' | 'doing' | 'done'` (défaut: `'todo'`)
- `createdAt` : date ISO 8601 (généré automatiquement)
- `updatedAt` : date ISO 8601 (mis à jour automatiquement)

**Endpoints à implémenter :**

1. `GET /health` - Vérification de l'état de santé de l'API
2. `GET /tasks` - Liste des tâches (avec pagination `limit`, `offset` et filtre `status` optionnel)
3. `GET /tasks/{id}` - Récupération d'une tâche par ID
4. `POST /tasks` - Création d'une nouvelle tâche
5. `PUT /tasks/{id}` - Mise à jour complète d'une tâche
6. `PATCH /tasks/{id}` - Mise à jour partielle d'une tâche
7. `DELETE /tasks/{id}` - Suppression d'une tâche

**Règles métier :**
- Les IDs doivent être des UUID v4
- Le titre doit contenir au moins 3 caractères
- Le statut doit être l'un des trois valeurs autorisées
- Les dates sont au format ISO 8601
- La pagination par défaut : `limit=10`, `offset=0`
- Le filtre `status` est optionnel sur `GET /tasks`

---

## 🛠️ Stack technique

- **Runtime** : Node.js 18+
- **Language** : TypeScript
- **Framework** : Express.js
- **Validation** : Zod
- **Documentation** : Swagger UI + OpenAPI 3 (fichier YAML)
- **Persistence** : En mémoire (array JavaScript)
- **Rate limiting** : express-rate-limit (optionnel mais recommandé)

---

## 📝 Étapes du TP

### Étape 1 : Initialisation du projet (15 min)

1. Créer un nouveau projet Node.js avec TypeScript
2. Installer les dépendances nécessaires :
   - `express`, `@types/express`
   - `swagger-ui-express`, `@types/swagger-ui-express`
   - `zod`
   - `uuid`, `@types/uuid`
   - `express-rate-limit`
   - `cors`, `@types/cors`
   - `js-yaml`, `@types/js-yaml`
   - `tsx` (pour le développement)
   - `typescript`, `@types/node`
   - `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`

3. Configurer `tsconfig.json` avec les options strictes
4. Créer la structure de dossiers :
   ```
   src/
     ├── server.ts
     ├── routes/
     │   └── tasks.ts
     ├── middlewares/
     │   ├── errorHandler.ts
     │   ├── validate.ts
     │   └── rateLimit.ts
     ├── services/
     │   └── taskService.ts
     ├── types/
     │   └── task.ts
     ├── openapi/
     │   └── openapi.yaml
     └── docs/
         └── swagger.ts
   ```

**✅ Vérification :** Exécuter `npm run dev` doit démarrer le serveur (même s'il n'y a pas encore de routes).

---

### Étape 2 : Création de la spécification OpenAPI 3 (45 min)

Créer le fichier `src/openapi/openapi.yaml` avec :

1. **Section `info`** :
   - Titre, description, version
   - Contact (optionnel)

2. **Section `servers`** :
   - Serveur local : `http://localhost:3000`
   - Serveur de production (exemple) : `https://api.example.com`

3. **Section `tags`** :
   - `Health` : pour les endpoints de santé
   - `Tasks` : pour les endpoints de gestion des tâches

4. **Section `paths`** :
   Pour chaque endpoint, définir :
   - `summary` et `description`
   - `operationId` (unique)
   - `parameters` (si applicable)
   - `requestBody` (pour POST, PUT, PATCH)
   - `responses` avec codes HTTP appropriés :
     - `200` : Succès
     - `201` : Créé (POST)
     - `204` : Pas de contenu (DELETE)
     - `400` : Erreur de validation
     - `404` : Non trouvé
     - `500` : Erreur serveur

5. **Section `components`** :
   - `schemas` : `Task`, `TaskCreate`, `TaskUpdate`, `ErrorEnvelope`, `HealthResponse`, `TasksListResponse`, `TaskResponse`
   - `parameters` : `TaskId`, `Limit`, `Offset`, `StatusFilter`
   - `responses` : `BadRequest`, `NotFound`, `InternalServerError`, `Unauthorized` (pour JWT)
   - `securitySchemes` : `bearerAuth` (JWT, optionnel)

**✅ Vérification :** Le fichier YAML doit être valide (pas d'erreurs de syntaxe). Vous pouvez le valider avec un outil en ligne comme [Swagger Editor](https://editor.swagger.io/).

**⚠️ Points de vigilance :**
- Les schémas doivent correspondre exactement aux types TypeScript que vous allez créer
- Les `operationId` doivent être uniques et descriptifs
- Les exemples dans les schémas aident à comprendre l'API

---

### Étape 3 : Configuration Swagger UI (20 min)

1. Créer `src/docs/swagger.ts` :
   - Charger le fichier `openapi.yaml`
   - Servir Swagger UI sur `/docs`
   - Servir le fichier OpenAPI brut sur `/openapi` et `/openapi.json`

2. Intégrer dans `src/server.ts` :
   - Importer et appeler `setupSwagger(app)`

**✅ Vérification :** 
- Accéder à `http://localhost:3000/docs` doit afficher Swagger UI
- Accéder à `http://localhost:3000/openapi` doit retourner le YAML
- Accéder à `http://localhost:3000/openapi.json` doit retourner le JSON

**⚠️ Points de vigilance :**
- Vérifier que le chemin vers `openapi.yaml` est correct (relatif à `__dirname`)
- Si vous voyez une erreur 404, vérifiez l'ordre des middlewares dans Express

---

### Étape 4 : Implémentation des types et du service (30 min)

1. Créer `src/types/task.ts` avec les interfaces TypeScript :
   - `Task`, `TaskCreate`, `TaskUpdate`, `TaskStatus`, `TaskQueryParams`

2. Créer `src/services/taskService.ts` :
   - Classe `TaskService` avec stockage en mémoire (array)
   - Méthodes : `findAll()`, `findById()`, `create()`, `update()`, `patch()`, `delete()`
   - Utiliser `uuid` pour générer les IDs
   - Gérer les dates avec `new Date().toISOString()`
   - Implémenter la pagination et le filtrage dans `findAll()`

**✅ Vérification :** 
- Les types doivent correspondre aux schémas OpenAPI
- Le service doit être testable unitairement (pas de dépendance Express)

---

### Étape 5 : Implémentation des middlewares (30 min)

1. Créer `src/middlewares/errorHandler.ts` :
   - Middleware de gestion d'erreurs centralisée
   - Format d'erreur standardisé : `{ error: { code, message, details?, traceId? } }`
   - Codes d'erreur : `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`, etc.
   - Middleware `notFoundHandler` pour les routes 404

2. Créer `src/middlewares/validate.ts` :
   - Middleware de validation avec Zod
   - Valider `body`, `query`, `params`
   - Retourner des erreurs formatées en cas d'échec

3. Créer `src/middlewares/rateLimit.ts` :
   - Rate limiter avec `express-rate-limit`
   - 100 requêtes par 15 minutes par IP
   - Exclure `/health` et `/docs` du rate limiting

**✅ Vérification :**
- Les erreurs doivent suivre le format défini dans OpenAPI
- Les validations doivent bloquer les données invalides

---

### Étape 6 : Implémentation des routes (45 min)

Créer `src/routes/tasks.ts` avec tous les endpoints :

1. **GET /health** :
   - Retourner `{ status: 'ok', timestamp, uptime }`

2. **GET /tasks** :
   - Récupérer les paramètres de pagination et filtre
   - Appeler `taskService.findAll()`
   - Retourner `{ data: tasks[], pagination: { total, limit, offset } }`

3. **GET /tasks/:id** :
   - Valider que `id` est un UUID
   - Appeler `taskService.findById()`
   - Retourner 404 si non trouvé

4. **POST /tasks** :
   - Valider le body avec Zod
   - Appeler `taskService.create()`
   - Retourner 201 avec la tâche créée

5. **PUT /tasks/:id** :
   - Valider params et body
   - Vérifier que la tâche existe (404 si non)
   - Appeler `taskService.update()`
   - Retourner la tâche mise à jour

6. **PATCH /tasks/:id** :
   - Valider params et body (tous les champs optionnels)
   - Appeler `taskService.patch()`
   - Retourner 404 si non trouvé

7. **DELETE /tasks/:id** :
   - Valider params
   - Appeler `taskService.delete()`
   - Retourner 204 si succès, 404 si non trouvé

**✅ Vérification :**
- Tester chaque endpoint dans Swagger UI (`/docs`)
- Vérifier que les codes HTTP sont corrects
- Vérifier que les validations fonctionnent (essayer des données invalides)

**⚠️ Points de vigilance :**
- L'ordre des middlewares est important (validation avant la logique métier)
- PUT nécessite tous les champs, PATCH seulement ceux fournis
- DELETE retourne 204 (pas de body), pas 200

---

### Étape 7 : Configuration du serveur Express (15 min)

Créer `src/server.ts` :

1. Configurer Express avec :
   - `cors()` pour autoriser les requêtes cross-origin
   - `express.json()` pour parser le JSON
   - Rate limiting (sauf `/health` et `/docs`)
   - Swagger UI
   - Routes `/` (qui incluent `/tasks` et `/health`)
   - Middlewares d'erreur en dernier

2. Démarrer le serveur sur le port 3000

**✅ Vérification :**
- Le serveur démarre sans erreur
- Tous les endpoints sont accessibles
- Swagger UI fonctionne

---

### Étape 8 : Tests et validation (20 min)

1. **Tester dans Swagger UI** :
   - Ouvrir `http://localhost:3000/docs`
   - Tester chaque endpoint avec "Try it out"
   - Vérifier les réponses et les codes HTTP

2. **Tester avec curl** (voir section "Exemples d'appels" ci-dessous)

3. **Vérifier la conformité** :
   - Les réponses correspondent aux schémas OpenAPI
   - Les erreurs suivent le format standardisé
   - Les validations fonctionnent

**✅ Vérification finale :**
- ✅ Swagger UI accessible et fonctionnel
- ✅ Tous les endpoints implémentés et testés
- ✅ Validations en place
- ✅ Gestion d'erreurs standardisée
- ✅ Code propre et structuré

---

## 🧪 Exemples d'appels curl

### GET /health
```bash
curl -X GET http://localhost:3000/health
```

### GET /tasks (avec pagination)
```bash
curl -X GET "http://localhost:3000/tasks?limit=5&offset=0"
```

### GET /tasks (avec filtre status)
```bash
curl -X GET "http://localhost:3000/tasks?status=todo"
```

### GET /tasks/{id}
```bash
curl -X GET http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000
```

### POST /tasks
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Réviser le cours OpenAPI",
    "description": "Relire les chapitres 1 à 5",
    "status": "todo"
  }'
```

### PUT /tasks/{id}
```bash
curl -X PUT http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tâche mise à jour",
    "description": "Nouvelle description",
    "status": "done"
  }'
```

### PATCH /tasks/{id}
```bash
curl -X PATCH http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "doing"
  }'
```

### DELETE /tasks/{id}
```bash
curl -X DELETE http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000
```

---

## 🐛 Section Debug

### Problème : Swagger UI ne s'affiche pas (404)
- **Cause** : Le middleware Swagger n'est pas correctement configuré ou le chemin est incorrect
- **Solution** : Vérifier que `setupSwagger()` est appelé avant les routes, et que le chemin vers `openapi.yaml` est correct

### Problème : Erreur CORS
- **Cause** : Le middleware `cors()` n'est pas installé ou pas utilisé
- **Solution** : Vérifier que `app.use(cors())` est présent dans `server.ts`

### Problème : Erreur de validation Zod
- **Cause** : Le schéma Zod ne correspond pas aux données reçues
- **Solution** : Vérifier que les schémas Zod correspondent aux schémas OpenAPI

### Problème : Le fichier OpenAPI n'est pas valide
- **Cause** : Erreur de syntaxe YAML ou structure incorrecte
- **Solution** : Valider le fichier avec [Swagger Editor](https://editor.swagger.io/) ou un linter YAML

### Problème : Les dates ne sont pas au bon format
- **Cause** : Utilisation de `new Date()` au lieu de `new Date().toISOString()`
- **Solution** : Toujours utiliser `.toISOString()` pour les dates

---

## ✅ Critères de réussite

### Obligatoires (80% de la note)

- [ ] Le fichier OpenAPI 3 est complet et valide
- [ ] Swagger UI est accessible sur `/docs` et fonctionne
- [ ] Tous les endpoints sont implémentés et fonctionnels
- [ ] Les validations Zod sont en place pour tous les inputs
- [ ] La gestion d'erreurs est standardisée (format `ErrorEnvelope`)
- [ ] Les codes HTTP sont corrects (201 pour POST, 204 pour DELETE, etc.)
- [ ] La pagination et le filtrage fonctionnent sur `GET /tasks`
- [ ] Le code est structuré et propre (pas de code dupliqué)

### Bonus (20% de la note)

- [ ] Rate limiting implémenté et fonctionnel
- [ ] Tests unitaires pour le service (optionnel)
- [ ] Documentation supplémentaire dans les commentaires
- [ ] Gestion des cas limites (ex: pagination avec offset > total)
- [ ] Authentification JWT basique (même si non requise)

---

## 📚 Ressources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Zod Documentation](https://zod.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Swagger Editor](https://editor.swagger.io/) - Pour valider votre fichier OpenAPI

---

## 🎓 Questions de réflexion (pour aller plus loin)

1. Comment pourriez-vous ajouter l'authentification JWT de manière propre ?
2. Quels seraient les avantages d'utiliser une base de données au lieu du stockage en mémoire ?
3. Comment pourriez-vous générer automatiquement les types TypeScript à partir du fichier OpenAPI ?
4. Quels seraient les avantages d'utiliser `zod-to-openapi` pour générer la spec OpenAPI depuis les schémas Zod ?

---

**Bon courage ! 🚀**

