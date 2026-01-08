# Backend API avec Swagger - Portal Formations

Ce dossier contient le serveur Express avec Swagger UI pour documenter l'API.

## 🚀 Démarrage rapide

### Installation des dépendances

```bash
npm install
```

### Démarrer le serveur de développement

```bash
npm run dev:server
```

Le serveur démarre sur `http://localhost:3001`

### Démarrer le serveur en production

```bash
npm run server
```

## 📚 Accès à la documentation Swagger

Une fois le serveur démarré, accédez à :

- **Swagger UI** : http://localhost:3001/docs
- **OpenAPI Spec (YAML)** : http://localhost:3001/openapi
- **OpenAPI Spec (JSON)** : http://localhost:3001/openapi.json

## 📁 Structure du projet

```
server/
├── src/
│   ├── server.ts          # Point d'entrée du serveur Express
│   ├── docs/
│   │   └── swagger.ts     # Configuration Swagger UI
│   ├── routes/
│   │   └── index.ts       # Routes API
│   ├── middlewares/
│   │   └── errorHandler.ts # Gestion des erreurs
│   └── openapi/
│       └── openapi.yaml   # Spécification OpenAPI
├── tsconfig.json          # Configuration TypeScript
└── README.md
```

## 🔧 Ajouter de nouvelles routes

1. Créer un nouveau fichier dans `src/routes/` (ex: `courses.ts`)
2. Définir les routes avec Express Router
3. Importer et utiliser dans `src/routes/index.ts`
4. Documenter les routes dans `src/openapi/openapi.yaml`

### Exemple de route

```typescript
// src/routes/courses.ts
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Liste des cours' });
});

export default router;
```

Puis dans `src/routes/index.ts` :

```typescript
import coursesRouter from './courses.js';

router.use('/courses', coursesRouter);
```

## 📝 Documenter les routes dans OpenAPI

Éditez `src/openapi/openapi.yaml` pour ajouter la documentation de vos nouvelles routes.

Exemple :

```yaml
paths:
  /api/courses:
    get:
      tags:
        - Courses
      summary: Liste tous les cours
      responses:
        '200':
          description: Liste des cours
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Course'
```

## 🛠️ Scripts disponibles

- `npm run dev:server` : Démarre le serveur en mode développement avec rechargement automatique
- `npm run server` : Démarre le serveur en mode production

## 🔐 Authentification

L'API utilise JWT Bearer tokens (via Supabase). Pour tester avec authentification dans Swagger UI :

1. Cliquez sur le bouton "Authorize" en haut de la page Swagger
2. Entrez votre token JWT : `Bearer <votre-token>`
3. Cliquez sur "Authorize"

## 📦 Dépendances principales

- `express` : Framework web
- `swagger-ui-express` : Interface Swagger UI
- `js-yaml` : Parser YAML pour OpenAPI
- `cors` : Gestion CORS
- `tsx` : Exécution TypeScript en développement


