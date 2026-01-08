# 🎯 Actions concrètes pour les étudiants - TP OpenAPI/Swagger

Ce document liste **concrètement** ce que vous devez faire pour réaliser ce TP.

---

## 📋 Vue d'ensemble

**Objectif final :** Créer une API REST complète pour gérer des tâches, avec documentation OpenAPI 3 et interface Swagger UI.

**Ce que vous allez créer :**
- Un fichier OpenAPI 3 (spécification de l'API)
- Un serveur Express avec TypeScript
- 7 endpoints REST (GET /health, CRUD sur /tasks)
- Une interface Swagger UI pour tester l'API
- Validation des données avec Zod
- Gestion d'erreurs standardisée

**Durée :** 2h30 à 3h30

---

## ✅ Checklist des actions à réaliser

### 🚀 ÉTAPE 1 : Initialiser le projet (15 min)

**Actions concrètes :**

1. **Créer un nouveau dossier pour votre projet**
   ```bash
   mkdir tp-openapi-swagger
   cd tp-openapi-swagger
   ```

2. **Initialiser un projet Node.js**
   ```bash
   npm init -y
   ```

3. **Installer toutes les dépendances nécessaires**
   ```bash
   npm install express swagger-ui-express swagger-jsdoc zod express-rate-limit cors uuid js-yaml
   
   npm install -D @types/express @types/swagger-ui-express @types/swagger-jsdoc @types/cors @types/uuid @types/js-yaml @types/node @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint tsx typescript
   ```

4. **Créer le fichier `tsconfig.json`**
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "commonjs",
       "lib": ["ES2022"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "moduleResolution": "node"
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

5. **Créer la structure de dossiers**
   ```bash
   mkdir -p src/routes src/middlewares src/services src/types src/openapi src/docs
   ```

6. **Ajouter les scripts dans `package.json`**
   ```json
   {
     "scripts": {
       "dev": "tsx watch src/server.ts",
       "build": "tsc",
       "start": "node dist/server.js"
     }
   }
   ```

**✅ Vérification :** Exécutez `npm run dev` → Le serveur doit démarrer (même s'il n'y a pas encore de routes).

---

### 📝 ÉTAPE 2 : Créer la spécification OpenAPI 3 (45 min)

**Actions concrètes :**

1. **Créer le fichier `src/openapi/openapi.yaml`**

2. **Écrire la section `info`** :
   ```yaml
   openapi: 3.0.3
   info:
     title: API Tasks - Gestion de tâches
     description: API REST simple pour la gestion de tâches
     version: 1.0.0
   ```

3. **Écrire la section `servers`** :
   ```yaml
   servers:
     - url: http://localhost:3000
       description: Serveur de développement local
   ```

4. **Écrire la section `tags`** :
   ```yaml
   tags:
     - name: Health
       description: Endpoints de santé
     - name: Tasks
       description: Gestion des tâches
   ```

5. **Écrire la section `paths`** pour chaque endpoint :
   - `GET /health`
   - `GET /tasks`
   - `GET /tasks/{id}`
   - `POST /tasks`
   - `PUT /tasks/{id}`
   - `PATCH /tasks/{id}`
   - `DELETE /tasks/{id}`
   
   Pour chaque endpoint, définir :
   - `summary` et `description`
   - `operationId`
   - `parameters` (si applicable)
   - `requestBody` (pour POST, PUT, PATCH)
   - `responses` (200, 201, 204, 400, 404, 500)

6. **Écrire la section `components`** :
   - `schemas` : Task, TaskCreate, TaskUpdate, ErrorEnvelope, etc.
   - `parameters` : TaskId, Limit, Offset, StatusFilter
   - `responses` : BadRequest, NotFound, InternalServerError
   - `securitySchemes` : bearerAuth (JWT)

**✅ Vérification :** 
- Valider votre YAML sur [Swagger Editor](https://editor.swagger.io/)
- Aucune erreur de syntaxe

**💡 Astuce :** Commencez par un endpoint simple (GET /health), puis copiez-collez la structure pour les autres.

---

### 🔧 ÉTAPE 3 : Configurer Swagger UI (20 min)

**Actions concrètes :**

1. **Créer le fichier `src/docs/swagger.ts`**

2. **Écrire le code pour charger le fichier OpenAPI** :
   ```typescript
   import swaggerUi from 'swagger-ui-express';
   import { Express } from 'express';
   import fs from 'fs';
   import path from 'path';
   import * as yaml from 'js-yaml';

   export function setupSwagger(app: Express): void {
     const openApiPath = path.join(__dirname, '../openapi/openapi.yaml');
     const openApiFile = fs.readFileSync(openApiPath, 'utf8');
     const openApiSpec = yaml.load(openApiFile) as Record<string, unknown>;

     // Servir le YAML brut
     app.get('/openapi', (req, res) => {
       res.setHeader('Content-Type', 'application/yaml');
       res.send(openApiFile);
     });

     // Servir le JSON
     app.get('/openapi.json', (req, res) => {
       res.json(openApiSpec);
     });

     // Configurer Swagger UI
     app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
   }
   ```

3. **Créer un fichier `src/server.ts` minimal** :
   ```typescript
   import express from 'express';
   import { setupSwagger } from './docs/swagger';

   const app = express();
   setupSwagger(app);

   app.listen(3000, () => {
     console.log('Serveur démarré sur http://localhost:3000');
   });
   ```

**✅ Vérification :**
- Exécutez `npm run dev`
- Ouvrez `http://localhost:3000/docs` → Swagger UI doit s'afficher
- Ouvrez `http://localhost:3000/openapi` → Le YAML doit s'afficher

---

### 🏗️ ÉTAPE 4 : Créer les types et le service (30 min)

**Actions concrètes :**

1. **Créer `src/types/task.ts`** :
   ```typescript
   export type TaskStatus = 'todo' | 'doing' | 'done';

   export interface Task {
     id: string;
     title: string;
     description?: string;
     status: TaskStatus;
     createdAt: string;
     updatedAt: string;
   }

   export interface TaskCreate {
     title: string;
     description?: string;
     status?: TaskStatus;
   }

   export interface TaskUpdate {
     title?: string;
     description?: string;
     status?: TaskStatus;
   }
   ```

2. **Créer `src/services/taskService.ts`** :
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   import { Task, TaskCreate, TaskUpdate } from '../types/task';

   class TaskService {
     private tasks: Task[] = [];

     findAll(limit = 10, offset = 0, status?: string) {
       // Implémenter la logique de pagination et filtrage
     }

     findById(id: string): Task | undefined {
       // Retourner la tâche ou undefined
     }

     create(data: TaskCreate): Task {
       // Créer une nouvelle tâche avec UUID et dates
     }

     update(id: string, data: TaskUpdate): Task | null {
       // Mettre à jour complètement
     }

     patch(id: string, data: Partial<TaskUpdate>): Task | null {
       // Mettre à jour partiellement
     }

     delete(id: string): boolean {
       // Supprimer la tâche
     }
   }

   export const taskService = new TaskService();
   ```

**✅ Vérification :**
- Le code compile sans erreur (`npm run build`)
- Les types correspondent aux schémas OpenAPI

---

### 🛡️ ÉTAPE 5 : Créer les middlewares (30 min)

**Actions concrètes :**

1. **Créer `src/middlewares/errorHandler.ts`** :
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import { v4 as uuidv4 } from 'uuid';

   export interface ApiError {
     code: string;
     message: string;
     details?: unknown;
     traceId?: string;
   }

   export function errorHandler(
     err: Error | ApiError,
     req: Request,
     res: Response,
     next: NextFunction
   ): void {
     const traceId = uuidv4();
     // Implémenter la gestion d'erreurs
   }

   export function notFoundHandler(req: Request, res: Response): void {
     // Retourner 404 avec format standardisé
   }
   ```

2. **Créer `src/middlewares/validate.ts`** :
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import { ZodSchema, ZodError } from 'zod';

   export function validate(schema: {
     body?: ZodSchema;
     query?: ZodSchema;
     params?: ZodSchema;
   }) {
     return (req: Request, res: Response, next: NextFunction): void {
       // Valider body, query, params avec Zod
       // Retourner erreur formatée si échec
     }
   }
   ```

3. **Créer `src/middlewares/rateLimit.ts`** :
   ```typescript
   import rateLimit from 'express-rate-limit';

   export const apiRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // 100 requêtes max
     // Message d'erreur formaté
   });
   ```

**✅ Vérification :**
- Les erreurs suivent le format `{ error: { code, message, details?, traceId? } }`
- Les validations bloquent les données invalides

---

### 🛣️ ÉTAPE 6 : Implémenter les routes (45 min)

**Actions concrètes :**

1. **Créer `src/routes/tasks.ts`**

2. **Implémenter chaque endpoint un par un :**

   **GET /health** :
   ```typescript
   router.get('/health', (req, res) => {
     res.json({
       status: 'ok',
       timestamp: new Date().toISOString(),
       uptime: process.uptime()
     });
   });
   ```

   **GET /tasks** :
   ```typescript
   router.get('/tasks', validate({ query: taskQuerySchema }), (req, res) => {
     const { limit, offset, status } = req.query;
     const result = taskService.findAll(limit, offset, status);
     res.json({ data: result.tasks, pagination: { ... } });
   });
   ```

   **GET /tasks/:id** :
   ```typescript
   router.get('/tasks/:id', validate({ params: taskParamsSchema }), (req, res) => {
     const task = taskService.findById(req.params.id);
     if (!task) {
       return res.status(404).json({ error: { ... } });
     }
     res.json({ data: task });
   });
   ```

   **POST /tasks** :
   ```typescript
   router.post('/tasks', validate({ body: taskCreateSchema }), (req, res) => {
     const task = taskService.create(req.body);
     res.status(201).json({ data: task });
   });
   ```

   **PUT /tasks/:id** :
   ```typescript
   router.put('/tasks/:id', validate({ ... }), (req, res) => {
     // Vérifier existence, mettre à jour complètement
   });
   ```

   **PATCH /tasks/:id** :
   ```typescript
   router.patch('/tasks/:id', validate({ ... }), (req, res) => {
     // Mettre à jour partiellement
   });
   ```

   **DELETE /tasks/:id** :
   ```typescript
   router.delete('/tasks/:id', validate({ params: taskParamsSchema }), (req, res) => {
     const deleted = taskService.delete(req.params.id);
     if (!deleted) {
       return res.status(404).json({ error: { ... } });
     }
     res.status(204).send();
   });
   ```

3. **Créer les schémas Zod de validation** :
   ```typescript
   const taskCreateSchema = z.object({
     title: z.string().min(3),
     description: z.string().optional(),
     status: z.enum(['todo', 'doing', 'done']).optional()
   });
   ```

**✅ Vérification :**
- Tester chaque endpoint dans Swagger UI (`http://localhost:3000/docs`)
- Vérifier les codes HTTP (201 pour POST, 204 pour DELETE, etc.)
- Tester avec des données invalides → doit retourner 400

---

### ⚙️ ÉTAPE 7 : Configurer le serveur Express (15 min)

**Actions concrètes :**

1. **Compléter `src/server.ts`** :
   ```typescript
   import express from 'express';
   import cors from 'cors';
   import tasksRouter from './routes/tasks';
   import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
   import { apiRateLimiter } from './middlewares/rateLimit';
   import { setupSwagger } from './docs/swagger';

   const app = express();

   // Middlewares globaux
   app.use(cors());
   app.use(express.json());

   // Rate limiting (sauf /health et /docs)
   app.use((req, res, next) => {
     if (req.path === '/health' || req.path.startsWith('/docs')) {
       return next();
     }
     return apiRateLimiter(req, res, next);
   });

   // Swagger UI
   setupSwagger(app);

   // Routes
   app.use('/', tasksRouter);

   // Gestion des erreurs (en dernier)
   app.use(notFoundHandler);
   app.use(errorHandler);

   app.listen(3000, () => {
     console.log('🚀 Serveur démarré sur http://localhost:3000');
     console.log('📚 Swagger UI : http://localhost:3000/docs');
   });
   ```

**✅ Vérification :**
- Le serveur démarre sans erreur
- Tous les endpoints sont accessibles
- Swagger UI fonctionne

---

### 🧪 ÉTAPE 8 : Tester et valider (20 min)

**Actions concrètes :**

1. **Tester dans Swagger UI** :
   - Ouvrir `http://localhost:3000/docs`
   - Pour chaque endpoint :
     - Cliquer sur "Try it out"
     - Remplir les paramètres
     - Cliquer sur "Execute"
     - Vérifier la réponse et le code HTTP

2. **Tester avec curl** :
   ```bash
   # Health check
   curl http://localhost:3000/health

   # Créer une tâche
   curl -X POST http://localhost:3000/tasks \
     -H "Content-Type: application/json" \
     -d '{"title": "Test", "status": "todo"}'

   # Lister les tâches
   curl http://localhost:3000/tasks

   # Récupérer une tâche (remplacer l'ID)
   curl http://localhost:3000/tasks/VOTRE_ID_ICI
   ```

3. **Tester les cas d'erreur** :
   - Titre trop court (< 3 caractères) → doit retourner 400
   - ID invalide (pas un UUID) → doit retourner 400
   - ID inexistant → doit retourner 404
   - Données manquantes → doit retourner 400

4. **Vérifier la conformité** :
   - Les réponses correspondent aux schémas OpenAPI
   - Les codes HTTP sont corrects
   - Le format d'erreur est standardisé
   - La pagination fonctionne
   - Le filtrage par status fonctionne

**✅ Vérification finale :**
- ✅ Swagger UI accessible et fonctionnel
- ✅ Tous les endpoints implémentés et testés
- ✅ Validations en place
- ✅ Gestion d'erreurs standardisée
- ✅ Code propre et structuré

---

## 📦 Livrables attendus

À la fin du TP, vous devez avoir :

1. **Un projet fonctionnel** avec :
   - Fichier OpenAPI 3 complet (`src/openapi/openapi.yaml`)
   - Serveur Express avec tous les endpoints
   - Swagger UI accessible sur `/docs`

2. **Code source** :
   - Types TypeScript
   - Service de gestion des tâches
   - Middlewares (validation, erreurs, rate limiting)
   - Routes complètes

3. **Tests** :
   - Tous les endpoints testés dans Swagger UI
   - Au moins 3 appels curl testés

---

## 🎯 Critères de réussite

### Obligatoires (80% de la note)

- [ ] Le fichier OpenAPI 3 est complet et valide
- [ ] Swagger UI est accessible sur `/docs` et fonctionne
- [ ] Tous les 7 endpoints sont implémentés et fonctionnels
- [ ] Les validations Zod sont en place pour tous les inputs
- [ ] La gestion d'erreurs est standardisée (format `ErrorEnvelope`)
- [ ] Les codes HTTP sont corrects (201 pour POST, 204 pour DELETE, etc.)
- [ ] La pagination et le filtrage fonctionnent sur `GET /tasks`
- [ ] Le code est structuré et propre (pas de code dupliqué)

### Bonus (20% de la note)

- [ ] Rate limiting implémenté et fonctionnel
- [ ] Tests unitaires pour le service
- [ ] Documentation supplémentaire dans les commentaires
- [ ] Gestion des cas limites

---

## 🐛 En cas de problème

### Le serveur ne démarre pas
- Vérifiez que Node.js 18+ est installé : `node --version`
- Vérifiez que toutes les dépendances sont installées : `npm install`
- Vérifiez les erreurs dans la console

### Swagger UI ne s'affiche pas
- Vérifiez que le chemin vers `openapi.yaml` est correct
- Vérifiez que le fichier YAML est valide (utilisez Swagger Editor)
- Vérifiez la console du navigateur pour les erreurs

### Les endpoints ne fonctionnent pas
- Vérifiez que les routes sont bien enregistrées dans `server.ts`
- Vérifiez l'ordre des middlewares (validation avant logique métier)
- Vérifiez les logs du serveur pour les erreurs

---

**Bon courage ! 🚀**



