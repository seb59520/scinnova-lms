# TP OpenAPI 3 + Swagger UI - API Tasks

API REST simple pour la gestion de tâches, implémentée avec Express.js, TypeScript, et documentée avec OpenAPI 3 et Swagger UI.

## 🚀 Installation

### Prérequis

- Node.js 18+ installé
- npm ou yarn

### Étapes

1. **Cloner ou télécharger le projet**

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Démarrer le serveur en mode développement :**
   ```bash
   npm run dev
   ```

   Le serveur démarre sur `http://localhost:3000`

4. **Accéder à la documentation Swagger UI :**
   - Ouvrir `http://localhost:3000/docs` dans votre navigateur

## 📚 Scripts disponibles

- `npm run dev` : Démarre le serveur en mode développement avec rechargement automatique (tsx watch)
- `npm run build` : Compile le TypeScript vers JavaScript dans le dossier `dist/`
- `npm run start` : Démarre le serveur en mode production (nécessite `npm run build` avant)
- `npm run lint` : Vérifie le code avec ESLint
- `npm run lint:fix` : Corrige automatiquement les erreurs ESLint
- `npm run type-check` : Vérifie les types TypeScript sans compiler

## 🌐 Endpoints disponibles

### Health Check
- `GET /health` - Vérifie l'état de santé de l'API

### Tasks
- `GET /tasks` - Liste toutes les tâches (pagination et filtre optionnels)
- `GET /tasks/:id` - Récupère une tâche par son ID
- `POST /tasks` - Crée une nouvelle tâche
- `PUT /tasks/:id` - Met à jour complètement une tâche
- `PATCH /tasks/:id` - Met à jour partiellement une tâche
- `DELETE /tasks/:id` - Supprime une tâche

### Documentation
- `GET /docs` - Interface Swagger UI
- `GET /openapi` - Fichier OpenAPI YAML brut
- `GET /openapi.json` - Fichier OpenAPI JSON

## 📖 Exemples d'appels avec curl

### Health Check
```bash
curl -X GET http://localhost:3000/health
```

**Réponse attendue :**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

### Créer une tâche (POST)
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Réviser le cours OpenAPI",
    "description": "Relire les chapitres 1 à 5",
    "status": "todo"
  }'
```

**Réponse attendue (201) :**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Réviser le cours OpenAPI",
    "description": "Relire les chapitres 1 à 5",
    "status": "todo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Lister les tâches (GET)
```bash
curl -X GET "http://localhost:3000/tasks?limit=10&offset=0"
```

**Avec filtre par statut :**
```bash
curl -X GET "http://localhost:3000/tasks?status=todo&limit=5"
```

**Réponse attendue (200) :**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Réviser le cours OpenAPI",
      "description": "Relire les chapitres 1 à 5",
      "status": "todo",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

### Récupérer une tâche par ID (GET)
```bash
curl -X GET http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000
```

**Réponse attendue (200) :**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Réviser le cours OpenAPI",
    "description": "Relire les chapitres 1 à 5",
    "status": "todo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Si la tâche n'existe pas (404) :**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Tâche avec l'ID 550e8400-e29b-41d4-a716-446655440000 non trouvée",
    "traceId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

### Mettre à jour complètement une tâche (PUT)
```bash
curl -X PUT http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tâche mise à jour",
    "description": "Nouvelle description",
    "status": "done"
  }'
```

**Réponse attendue (200) :**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Tâche mise à jour",
    "description": "Nouvelle description",
    "status": "done",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:45:00.000Z"
  }
}
```

---

### Mettre à jour partiellement une tâche (PATCH)
```bash
curl -X PATCH http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "doing"
  }'
```

**Réponse attendue (200) :**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Réviser le cours OpenAPI",
    "description": "Relire les chapitres 1 à 5",
    "status": "doing",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:45:00.000Z"
  }
}
```

---

### Supprimer une tâche (DELETE)
```bash
curl -X DELETE http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440000
```

**Réponse attendue (204) :** Pas de contenu (body vide)

**Si la tâche n'existe pas (404) :**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Tâche avec l'ID 550e8400-e29b-41d4-a716-446655440000 non trouvée",
    "traceId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

## 🔍 Exemples d'erreurs

### Erreur de validation (400)
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AB"
  }'
```

**Réponse (400) :**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Erreur de validation",
    "details": [
      {
        "path": "title",
        "message": "Le titre doit contenir au moins 3 caractères"
      }
    ],
    "traceId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

### ID invalide (400)
```bash
curl -X GET http://localhost:3000/tasks/invalid-id
```

**Réponse (400) :**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Erreur de validation",
    "details": [
      {
        "path": "id",
        "message": "ID doit être un UUID valide"
      }
    ],
    "traceId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

## 🏗️ Structure du projet

```
tp-openapi-swagger/
├── src/
│   ├── server.ts              # Point d'entrée Express
│   ├── routes/
│   │   └── tasks.ts           # Routes de l'API Tasks
│   ├── middlewares/
│   │   ├── errorHandler.ts    # Gestion centralisée des erreurs
│   │   ├── validate.ts        # Validation Zod
│   │   └── rateLimit.ts       # Rate limiting
│   ├── services/
│   │   └── taskService.ts     # Logique métier (stockage en mémoire)
│   ├── types/
│   │   └── task.ts            # Types TypeScript
│   ├── openapi/
│   │   └── openapi.yaml       # Spécification OpenAPI 3
│   └── docs/
│       └── swagger.ts         # Configuration Swagger UI
├── dist/                      # Code compilé (généré)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Technologies utilisées

- **Node.js** : Runtime JavaScript
- **TypeScript** : Langage de programmation typé
- **Express.js** : Framework web
- **Zod** : Validation de schémas
- **Swagger UI** : Documentation interactive
- **OpenAPI 3** : Spécification d'API
- **express-rate-limit** : Protection contre les abus

---

## 📝 Notes importantes

- **Stockage** : Les données sont stockées en mémoire (array). Les données sont perdues au redémarrage du serveur.
- **UUID** : Les IDs sont générés automatiquement avec UUID v4.
- **Dates** : Toutes les dates sont au format ISO 8601.
- **Rate limiting** : 100 requêtes par 15 minutes par IP (sauf `/health` et `/docs`).
- **Validation** : Tous les inputs sont validés avec Zod avant traitement.

---

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifier que Node.js 18+ est installé : `node --version`
- Vérifier que les dépendances sont installées : `npm install`
- Vérifier les erreurs dans la console

### Swagger UI ne s'affiche pas
- Vérifier que le serveur est démarré
- Accéder à `http://localhost:3000/docs`
- Vérifier la console du navigateur pour les erreurs

### Erreurs CORS
- Le middleware `cors()` est activé par défaut
- Si problème persiste, vérifier la configuration dans `server.ts`

---

## 📚 Ressources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Zod Documentation](https://zod.dev/)
- [Express.js Documentation](https://expressjs.com/)

---

## 📄 Licence

MIT



