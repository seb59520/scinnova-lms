# Arborescence du projet TP OpenAPI 3 + Swagger UI

```
tp-openapi-swagger/
├── .eslintrc.json              # Configuration ESLint
├── .gitignore                  # Fichiers à ignorer par Git
├── package.json                # Dépendances et scripts npm
├── tsconfig.json               # Configuration TypeScript
├── README.md                   # Instructions d'installation et exemples
├── TP_ENONCE.md                # Énoncé apprenant (instructions du TP)
├── TP_CORRIGE.md               # Corrigé formateur (avec grille de correction)
├── CHECKLIST.md                # Checklist de conformité OpenAPI/Swagger
├── ARBORESCENCE.md             # Ce fichier
└── src/                        # Code source TypeScript
    ├── server.ts               # Point d'entrée Express
    ├── routes/
    │   └── tasks.ts            # Routes de l'API Tasks (7 endpoints)
    ├── middlewares/
    │   ├── errorHandler.ts     # Gestion centralisée des erreurs
    │   ├── validate.ts         # Middleware de validation Zod
    │   └── rateLimit.ts        # Rate limiting (100 req/15min)
    ├── services/
    │   └── taskService.ts      # Logique métier (stockage en mémoire)
    ├── types/
    │   └── task.ts             # Types TypeScript (Task, TaskCreate, etc.)
    ├── openapi/
    │   └── openapi.yaml        # Spécification OpenAPI 3 complète
    └── docs/
        └── swagger.ts          # Configuration Swagger UI
```

## Description des fichiers

### Configuration
- **`.eslintrc.json`** : Règles ESLint pour le linting du code TypeScript
- **`.gitignore`** : Exclut `node_modules/`, `dist/`, fichiers de log, etc.
- **`package.json`** : Dépendances (Express, Zod, Swagger UI, etc.) et scripts npm
- **`tsconfig.json`** : Configuration TypeScript stricte (ES2022, strict mode)

### Documentation
- **`README.md`** : Guide d'installation, exemples curl, structure du projet
- **`TP_ENONCE.md`** : Énoncé complet du TP pour les apprenants
- **`TP_CORRIGE.md`** : Corrigé détaillé avec explications et grille de correction
- **`CHECKLIST.md`** : Checklist de conformité OpenAPI/Swagger

### Code source (`src/`)

#### Point d'entrée
- **`server.ts`** : Configuration Express, middlewares globaux, démarrage du serveur

#### Routes
- **`routes/tasks.ts`** : 7 endpoints REST (GET /health, CRUD tasks)

#### Middlewares
- **`middlewares/errorHandler.ts`** : Format d'erreur standardisé, gestion centralisée
- **`middlewares/validate.ts`** : Validation Zod pour body, query, params
- **`middlewares/rateLimit.ts`** : Protection contre les abus (100 req/15min)

#### Services
- **`services/taskService.ts`** : Logique métier (CRUD, pagination, filtrage) - stockage en mémoire

#### Types
- **`types/task.ts`** : Interfaces TypeScript (Task, TaskCreate, TaskUpdate, TaskStatus)

#### OpenAPI
- **`openapi/openapi.yaml`** : Spécification OpenAPI 3 complète (info, servers, paths, components)

#### Documentation
- **`docs/swagger.ts`** : Configuration Swagger UI, chargement du fichier OpenAPI

## Fichiers générés (non versionnés)

- **`dist/`** : Code JavaScript compilé (généré par `npm run build`)
- **`node_modules/`** : Dépendances npm (générées par `npm install`)

## Commandes principales

```bash
# Installation
npm install

# Développement (avec rechargement automatique)
npm run dev

# Compilation
npm run build

# Production
npm run start

# Linting
npm run lint
npm run lint:fix

# Vérification des types
npm run type-check
```



