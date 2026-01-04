# TP : Swagger UI / OpenAPI 3 – Corrigé Formateur

**Durée estimée : 2h30 à 3h30**  
**Niveau : MBA1 Développeur Full Stack**

---

## 📋 Architecture de la solution

### Choix techniques justifiés

**Express.js vs Fastify :**
- **Express** a été choisi car c'est le framework le plus répandu et enseigné
- Plus de ressources pédagogiques disponibles
- Écosystème mature et stable
- Les étudiants sont plus susceptibles de le rencontrer en entreprise

**Zod vs Ajv (JSON Schema) :**
- **Zod** a été choisi pour sa meilleure intégration TypeScript
- Validation et typage en une seule étape
- Messages d'erreur plus clairs
- Possibilité future d'utiliser `zod-to-openapi` pour générer la spec depuis le code

**Stockage en mémoire vs SQLite :**
- **En mémoire** pour rester simple et se concentrer sur OpenAPI/Swagger
- Pas de configuration de base de données nécessaire
- Les étudiants peuvent se concentrer sur l'API et la documentation
- Facile à migrer vers une vraie DB plus tard

### Structure du projet

```
tp-openapi-swagger/
├── package.json              # Dépendances et scripts
├── tsconfig.json             # Configuration TypeScript
├── .eslintrc.json           # Configuration ESLint
├── .gitignore
├── README.md                 # Instructions d'installation
├── TP_ENONCE.md             # Énoncé apprenant
├── TP_CORRIGE.md            # Ce fichier
├── CHECKLIST.md             # Checklist de conformité
└── src/
    ├── server.ts             # Point d'entrée Express
    ├── routes/
    │   └── tasks.ts          # Routes de l'API Tasks
    ├── middlewares/
    │   ├── errorHandler.ts   # Gestion centralisée des erreurs
    │   ├── validate.ts       # Validation Zod
    │   └── rateLimit.ts      # Rate limiting
    ├── services/
    │   └── taskService.ts    # Logique métier (stockage en mémoire)
    ├── types/
    │   └── task.ts           # Types TypeScript
    ├── openapi/
    │   └── openapi.yaml      # Spécification OpenAPI 3
    └── docs/
        └── swagger.ts        # Configuration Swagger UI
```

---

## 🔍 Explications détaillées par composant

### 1. Types TypeScript (`src/types/task.ts`)

**Points clés :**
- Les types correspondent exactement aux schémas OpenAPI
- `TaskStatus` est un type union pour garantir la sécurité de type
- `TaskCreate` et `TaskUpdate` sont séparés pour différencier création et mise à jour
- `TaskQueryParams` pour la pagination et les filtres

**Pièges fréquents :**
- ❌ Utiliser `any` au lieu de types stricts
- ❌ Ne pas différencier `TaskCreate` (tous champs requis sauf optionnels) et `TaskUpdate` (tous optionnels)
- ✅ Toujours utiliser des types stricts pour éviter les erreurs à l'exécution

---

### 2. Service (`src/services/taskService.ts`)

**Points clés :**
- Pattern Singleton : une seule instance partagée
- Stockage en mémoire avec un array privé
- Génération d'UUID avec `uuid` v4
- Dates au format ISO 8601 avec `toISOString()`
- Pagination et filtrage dans `findAll()`

**Pièges fréquents :**
- ❌ Utiliser des IDs séquentiels au lieu d'UUID
- ❌ Ne pas gérer les cas où l'ID n'existe pas (retourner `null` ou `undefined`)
- ❌ Oublier de mettre à jour `updatedAt` lors des modifications
- ✅ Toujours retourner `null` ou `undefined` si la ressource n'existe pas (pour permettre 404)

**Variantes possibles :**
- Ajouter un système de recherche par texte (titre, description)
- Ajouter un tri (par date, statut, etc.)
- Implémenter un cache avec TTL

---

### 3. Middleware de validation (`src/middlewares/validate.ts`)

**Points clés :**
- Validation centralisée avec Zod
- Support de `body`, `query`, et `params`
- Transformation des erreurs Zod en format API standardisé
- Utilisation de `parse()` qui lance une exception en cas d'échec

**Pièges fréquents :**
- ❌ Valider seulement le body et oublier les query params
- ❌ Ne pas transformer les query params (toujours des strings dans Express)
- ❌ Messages d'erreur Zod non formatés pour l'API
- ✅ Toujours transformer les query params numériques avec `.transform()` et `.pipe()`

**Exemple de transformation :**
```typescript
limit: z
  .string()
  .optional()
  .transform((val) => (val ? parseInt(val, 10) : undefined))
  .pipe(z.number().int().positive().max(100).optional())
```

---

### 4. Middleware de gestion d'erreurs (`src/middlewares/errorHandler.ts`)

**Points clés :**
- Format d'erreur standardisé : `{ error: { code, message, details?, traceId? } }`
- Mapping des codes d'erreur vers codes HTTP
- Génération d'un `traceId` unique pour le debugging
- Middleware `notFoundHandler` pour les routes 404

**Pièges fréquents :**
- ❌ Retourner des formats d'erreur différents selon les endpoints
- ❌ Ne pas logger les erreurs (difficile à déboguer en production)
- ❌ Oublier le `traceId` (essentiel pour le support)
- ✅ Toujours utiliser le même format d'erreur partout

**Codes d'erreur standardisés :**
- `VALIDATION_ERROR` → 400
- `UNAUTHORIZED` → 401
- `NOT_FOUND` → 404
- `RATE_LIMIT_EXCEEDED` → 429
- `INTERNAL_ERROR` → 500

---

### 5. Routes (`src/routes/tasks.ts`)

**Points clés :**
- Chaque endpoint a sa validation Zod spécifique
- Codes HTTP corrects : 201 pour POST, 204 pour DELETE, 200 pour GET/PUT/PATCH
- Gestion des cas d'erreur (404 si ressource non trouvée)
- PUT vs PATCH : PUT remplace tout, PATCH met à jour partiellement

**Pièges fréquents :**
- ❌ Utiliser PUT pour une mise à jour partielle (devrait être PATCH)
- ❌ Retourner 200 au lieu de 201 pour POST
- ❌ Retourner un body avec DELETE (devrait être 204 sans body)
- ❌ Ne pas valider les UUID dans les params
- ✅ Toujours valider les params avant de les utiliser

**Différence PUT vs PATCH :**
- **PUT** : Remplacement complet → tous les champs requis doivent être fournis
- **PATCH** : Mise à jour partielle → seuls les champs fournis sont mis à jour

---

### 6. Configuration Swagger (`src/docs/swagger.ts`)

**Points clés :**
- Chargement du fichier YAML avec `fs.readFileSync()`
- Parsing YAML vers JSON avec `js-yaml`
- Servir le YAML brut sur `/openapi`
- Servir le JSON sur `/openapi.json`
- Configuration Swagger UI avec options personnalisées

**Pièges fréquents :**
- ❌ Chemin incorrect vers `openapi.yaml` (problème avec `__dirname` après compilation)
- ❌ Ne pas servir le fichier OpenAPI brut (utile pour l'intégration avec d'autres outils)
- ❌ Oublier de configurer `persistAuthorization` (le token JWT est perdu au rafraîchissement)
- ✅ Utiliser `path.join(__dirname, ...)` pour les chemins relatifs

**Solution pour le chemin :**
```typescript
const openApiPath = path.join(__dirname, '../openapi/openapi.yaml');
```

---

### 7. Fichier OpenAPI (`src/openapi/openapi.yaml`)

**Points clés :**
- Structure complète avec `info`, `servers`, `tags`, `paths`, `components`
- Réutilisation via `$ref` pour éviter la duplication
- Exemples dans les schémas et les requêtes
- Security schemes documentés (même si non implémentés)

**Pièges fréquents :**
- ❌ Oublier les `operationId` (nécessaires pour la génération de clients)
- ❌ Ne pas réutiliser les composants (`$ref`) → duplication
- ❌ Schémas qui ne correspondent pas à l'implémentation
- ❌ Oublier les exemples (rendent l'API plus compréhensible)
- ✅ Toujours valider le YAML avec Swagger Editor avant de tester

**Structure recommandée :**
1. `info` : métadonnées de l'API
2. `servers` : URLs des serveurs
3. `tags` : organisation des endpoints
4. `paths` : définition des endpoints
5. `components` : schémas, paramètres, réponses réutilisables

---

### 8. Serveur Express (`src/server.ts`)

**Points clés :**
- Ordre des middlewares est crucial
- Rate limiting appliqué sélectivement (pas sur `/health` et `/docs`)
- CORS activé pour permettre les requêtes cross-origin
- Middlewares d'erreur en dernier

**Ordre recommandé :**
1. CORS
2. Body parsers (JSON, URL encoded)
3. Rate limiting (sélectif)
4. Swagger UI
5. Routes
6. 404 handler
7. Error handler

**Pièges fréquents :**
- ❌ Mettre les middlewares d'erreur avant les routes (ne capturera pas les erreurs des routes)
- ❌ Oublier CORS (problèmes avec Swagger UI ou les clients frontend)
- ❌ Rate limiting sur `/docs` (peut bloquer l'accès à la documentation)
- ✅ Toujours mettre les error handlers en dernier

---

## 🎯 Grille de correction

### Critères obligatoires (80 points)

#### 1. Fichier OpenAPI 3 (20 points)
- [ ] **Structure complète** (5 pts) : `info`, `servers`, `tags`, `paths`, `components`
- [ ] **Tous les endpoints documentés** (5 pts) : 7 endpoints avec descriptions
- [ ] **Schémas corrects** (5 pts) : `Task`, `TaskCreate`, `TaskUpdate`, `ErrorEnvelope`
- [ ] **Réutilisation via `$ref`** (3 pts) : Paramètres et réponses réutilisables
- [ ] **Exemples présents** (2 pts) : Au moins un exemple par endpoint

#### 2. Swagger UI (10 points)
- [ ] **Accessible sur `/docs`** (3 pts)
- [ ] **Fichier OpenAPI servi sur `/openapi`** (2 pts)
- [ ] **Interface fonctionnelle** (3 pts) : "Try it out" fonctionne
- [ ] **Pas d'erreurs de chargement** (2 pts)

#### 3. Implémentation des endpoints (25 points)
- [ ] **GET /health** (2 pts) : Retourne status, timestamp, uptime
- [ ] **GET /tasks** (5 pts) : Liste avec pagination et filtre status
- [ ] **GET /tasks/:id** (3 pts) : Récupération par ID avec 404 si absent
- [ ] **POST /tasks** (4 pts) : Création avec validation, retourne 201
- [ ] **PUT /tasks/:id** (4 pts) : Mise à jour complète avec 404 si absent
- [ ] **PATCH /tasks/:id** (4 pts) : Mise à jour partielle avec 404 si absent
- [ ] **DELETE /tasks/:id** (3 pts) : Suppression avec 204 si succès, 404 si absent

#### 4. Validation (15 points)
- [ ] **Validation Zod en place** (5 pts) : Pour tous les inputs (body, query, params)
- [ ] **Messages d'erreur clairs** (5 pts) : Format standardisé avec détails
- [ ] **Codes HTTP corrects** (5 pts) : 400 pour validation, 404 pour not found, etc.

#### 5. Gestion d'erreurs (10 points)
- [ ] **Format standardisé** (5 pts) : `{ error: { code, message, details?, traceId? } }`
- [ ] **Middleware centralisé** (3 pts) : `errorHandler` et `notFoundHandler`
- [ ] **Codes d'erreur cohérents** (2 pts) : `VALIDATION_ERROR`, `NOT_FOUND`, etc.

### Bonus (20 points)

- [ ] **Rate limiting** (5 pts) : Implémenté et fonctionnel
- [ ] **Tests unitaires** (5 pts) : Au moins pour le service
- [ ] **Documentation code** (3 pts) : Commentaires JSDoc
- [ ] **Gestion cas limites** (4 pts) : Pagination, filtres, etc.
- [ ] **Authentification JWT** (3 pts) : Même basique (non requise)

### Pénalités

- **-5 pts** : Code non fonctionnel (erreurs de compilation)
- **-3 pts** : Structure de projet non respectée
- **-2 pts** : Pas de README ou instructions manquantes
- **-2 pts** : Code dupliqué ou non structuré

---

## 🐛 Pièges fréquents et solutions

### Piège 1 : Swagger UI ne charge pas le fichier OpenAPI

**Symptôme :** Page blanche ou erreur "Failed to load API definition"

**Causes possibles :**
1. Chemin incorrect vers `openapi.yaml`
2. Fichier YAML invalide (erreur de syntaxe)
3. Middleware Swagger mal configuré

**Solution :**
```typescript
// Vérifier le chemin (après compilation, __dirname pointe vers dist/)
const openApiPath = path.join(__dirname, '../openapi/openapi.yaml');
console.log('OpenAPI path:', openApiPath); // Debug

// Valider le YAML avec Swagger Editor
// https://editor.swagger.io/
```

---

### Piège 2 : Erreurs CORS lors des appels depuis Swagger UI

**Symptôme :** Erreur "CORS policy" dans la console du navigateur

**Cause :** Middleware `cors()` manquant ou mal configuré

**Solution :**
```typescript
import cors from 'cors';
app.use(cors()); // Doit être avant les routes
```

---

### Piège 3 : Les query params sont toujours des strings

**Symptôme :** `req.query.limit` est une string au lieu d'un number

**Cause :** Express parse tous les query params comme des strings

**Solution :** Utiliser Zod avec transformation :
```typescript
limit: z
  .string()
  .optional()
  .transform((val) => (val ? parseInt(val, 10) : undefined))
  .pipe(z.number().int().positive().max(100).optional())
```

---

### Piège 4 : Les UUID ne sont pas validés

**Symptôme :** L'API accepte n'importe quelle string comme ID

**Cause :** Pas de validation sur les params

**Solution :** Valider avec Zod :
```typescript
const taskParamsSchema = z.object({
  id: z.string().uuid('ID doit être un UUID valide'),
});
```

---

### Piège 5 : PUT vs PATCH confondus

**Symptôme :** PUT ne fonctionne que partiellement

**Cause :** PUT doit remplacer complètement la ressource (tous les champs requis)

**Solution :**
- **PUT** : Utiliser `taskCreateSchema` (tous les champs requis sauf optionnels)
- **PATCH** : Utiliser `taskUpdateSchema` (tous les champs optionnels)

---

### Piège 6 : DELETE retourne un body

**Symptôme :** DELETE retourne `{ data: ... }` au lieu de 204

**Cause :** Oubli que DELETE doit retourner 204 No Content sans body

**Solution :**
```typescript
res.status(204).send(); // Pas de .json() !
```

---

## 🔄 Variantes et extensions possibles

### Variante 1 : Génération OpenAPI depuis Zod

Au lieu de maintenir manuellement le fichier OpenAPI, utiliser `zod-to-openapi` :

```typescript
import { z } from 'zod';
import { createDocument } from 'zod-to-openapi';

const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3),
  // ...
});

const document = createDocument({
  openapi: '3.0.3',
  info: { title: 'API Tasks', version: '1.0.0' },
  // ...
});
```

**Avantages :** Une seule source de vérité (Zod), moins de duplication  
**Inconvénients :** Moins de contrôle sur la documentation, dépendance supplémentaire

---

### Variante 2 : Ajout d'une base de données (SQLite)

Remplacer le stockage en mémoire par SQLite :

```typescript
import Database from 'better-sqlite3';

const db = new Database('tasks.db');

// Créer la table
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`);
```

**Avantages :** Persistance des données, plus réaliste  
**Inconvénients :** Configuration supplémentaire, gestion des migrations

---

### Variante 3 : Authentification JWT

Ajouter un middleware d'authentification :

```typescript
import jwt from 'jsonwebtoken';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token manquant' }
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token invalide' }
    });
  }
}
```

**Avantages :** Sécurisation de l'API, réalisme  
**Inconvénients :** Complexité supplémentaire, gestion des secrets

---

### Variante 4 : Tests unitaires

Ajouter des tests avec Jest :

```typescript
import { taskService } from './taskService';

describe('TaskService', () => {
  beforeEach(() => {
    // Réinitialiser le service avant chaque test
  });

  test('should create a task', () => {
    const task = taskService.create({ title: 'Test' });
    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test');
  });
});
```

**Avantages :** Qualité du code, détection précoce des bugs  
**Inconvénients :** Temps de développement supplémentaire

---

## 📊 Métriques de qualité

### Code quality

- **Couverture de types** : 100% (TypeScript strict)
- **Complexité cyclomatique** : Faible (fonctions simples)
- **Duplication** : Minimale (réutilisation via `$ref` dans OpenAPI)

### Performance

- **Temps de réponse** : < 50ms pour la plupart des endpoints (stockage en mémoire)
- **Rate limiting** : 100 req/15min par IP (configurable)

### Sécurité

- **Validation** : Tous les inputs validés avec Zod
- **CORS** : Activé (configurable pour la production)
- **Rate limiting** : Protection contre les abus
- **Erreurs** : Pas de fuite d'informations sensibles

---

## 🎓 Points pédagogiques à souligner

1. **API-first** : La spec OpenAPI est le contrat, l'implémentation doit s'y conformer
2. **Validation** : Toujours valider les inputs, jamais faire confiance aux données client
3. **Gestion d'erreurs** : Format standardisé facilite le debugging et l'intégration
4. **Documentation** : Swagger UI permet de tester l'API sans écrire de code client
5. **Types** : TypeScript + Zod = sécurité de type à la compilation et à l'exécution

---

## 📝 Checklist de correction rapide

Avant de corriger, vérifier :

- [ ] Le projet compile sans erreur (`npm run build`)
- [ ] Le serveur démarre (`npm run dev`)
- [ ] Swagger UI est accessible (`http://localhost:3000/docs`)
- [ ] Tous les endpoints sont testables dans Swagger UI
- [ ] Les validations fonctionnent (tester avec des données invalides)
- [ ] Les codes HTTP sont corrects
- [ ] Le format d'erreur est standardisé
- [ ] Le README est présent et complet

---

**Fin du corrigé formateur**

