# Checklist de conformité OpenAPI 3 / Swagger

Cette checklist permet de vérifier que votre API est conforme aux bonnes pratiques OpenAPI 3 et que Swagger UI fonctionne correctement.

---

## ✅ Structure du fichier OpenAPI

### Section `info`
- [ ] `title` : Présent et descriptif
- [ ] `description` : Présent avec description détaillée de l'API
- [ ] `version` : Présent (format semver recommandé, ex: "1.0.0")
- [ ] `contact` : Présent (optionnel mais recommandé)

### Section `servers`
- [ ] Au moins un serveur défini
- [ ] Serveur local : `http://localhost:3000` (ou port approprié)
- [ ] Description pour chaque serveur

### Section `tags`
- [ ] Tags définis pour organiser les endpoints
- [ ] Description pour chaque tag

---

## ✅ Définition des endpoints (`paths`)

### Pour chaque endpoint

#### Métadonnées
- [ ] `summary` : Présent et concis
- [ ] `description` : Présent avec détails
- [ ] `operationId` : Présent et unique
- [ ] `tags` : Présent (au moins un tag)

#### Paramètres (`parameters`)
- [ ] Paramètres de route (`in: path`) : `required: true`
- [ ] Paramètres de query (`in: query`) : `required: false` si optionnel
- [ ] Schémas de validation pour chaque paramètre
- [ ] Exemples pour les paramètres complexes

#### Body de requête (`requestBody`)
- [ ] Présent pour POST, PUT, PATCH
- [ ] `required: true` si obligatoire
- [ ] Content-Type : `application/json`
- [ ] Référence à un schéma (`$ref`) ou schéma inline
- [ ] Exemples de requêtes

#### Réponses (`responses`)
- [ ] Code 200 : Succès (GET, PUT, PATCH)
- [ ] Code 201 : Créé (POST)
- [ ] Code 204 : No Content (DELETE)
- [ ] Code 400 : Bad Request (validation)
- [ ] Code 404 : Not Found (ressource absente)
- [ ] Code 500 : Internal Server Error
- [ ] Schémas de réponse pour chaque code
- [ ] Exemples de réponses

---

## ✅ Composants réutilisables (`components`)

### Schémas (`schemas`)
- [ ] `Task` : Schéma complet de la ressource
- [ ] `TaskCreate` : Schéma pour la création (champs requis)
- [ ] `TaskUpdate` : Schéma pour la mise à jour (champs optionnels)
- [ ] `ErrorEnvelope` : Format d'erreur standardisé
- [ ] `HealthResponse` : Réponse du health check
- [ ] `TasksListResponse` : Réponse de la liste avec pagination
- [ ] `TaskResponse` : Enveloppe pour une seule tâche

**Pour chaque schéma :**
- [ ] `type` : Défini (object, string, etc.)
- [ ] `required` : Liste des champs obligatoires
- [ ] `properties` : Toutes les propriétés définies
- [ ] `description` : Pour chaque propriété
- [ ] `example` : Au moins un exemple par schéma
- [ ] Validation : `minLength`, `maxLength`, `enum`, `format` (uuid, date-time)

### Paramètres (`parameters`)
- [ ] `TaskId` : Paramètre `id` réutilisable
- [ ] `Limit` : Paramètre de pagination `limit`
- [ ] `Offset` : Paramètre de pagination `offset`
- [ ] `StatusFilter` : Paramètre de filtre `status`

**Pour chaque paramètre :**
- [ ] `name` : Nom du paramètre
- [ ] `in` : Emplacement (path, query)
- [ ] `required` : Booléen correct
- [ ] `schema` : Schéma de validation
- [ ] `description` : Description claire
- [ ] `example` : Exemple de valeur

### Réponses (`responses`)
- [ ] `BadRequest` : Réponse 400 réutilisable
- [ ] `Unauthorized` : Réponse 401 (si auth implémentée)
- [ ] `NotFound` : Réponse 404 réutilisable
- [ ] `InternalServerError` : Réponse 500 réutilisable

**Pour chaque réponse :**
- [ ] `description` : Description de l'erreur
- [ ] `content` : Format JSON avec schéma `ErrorEnvelope`
- [ ] `example` : Exemple d'erreur

### Security Schemes (`securitySchemes`)
- [ ] `bearerAuth` : Défini (même si non implémenté)
- [ ] `type: http`
- [ ] `scheme: bearer`
- [ ] `bearerFormat: JWT`
- [ ] `description` : Instructions d'utilisation

---

## ✅ Réutilisation et DRY

- [ ] Utilisation de `$ref` pour les schémas au lieu de duplication
- [ ] Utilisation de `$ref` pour les paramètres réutilisables
- [ ] Utilisation de `$ref` pour les réponses réutilisables
- [ ] Pas de duplication de code dans les schémas

---

## ✅ Validation et contraintes

### Schémas
- [ ] `minLength` / `maxLength` pour les strings
- [ ] `minimum` / `maximum` pour les nombres
- [ ] `enum` pour les valeurs limitées (status: todo, doing, done)
- [ ] `format` : `uuid` pour les IDs, `date-time` pour les dates
- [ ] `required` : Liste correcte des champs obligatoires

### Paramètres
- [ ] Validation des UUID dans les paramètres de route
- [ ] Validation des nombres (limit, offset) avec min/max
- [ ] Validation des enums (status)

---

## ✅ Swagger UI

### Configuration
- [ ] Swagger UI accessible sur `/docs`
- [ ] Fichier OpenAPI accessible sur `/openapi` (YAML)
- [ ] Fichier OpenAPI accessible sur `/openapi.json` (JSON)
- [ ] Interface Swagger UI fonctionnelle
- [ ] Bouton "Try it out" fonctionne pour tous les endpoints

### Affichage
- [ ] Tous les endpoints visibles et organisés par tags
- [ ] Schémas affichés correctement
- [ ] Exemples visibles dans l'interface
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Les requêtes peuvent être exécutées depuis l'interface

---

## ✅ Implémentation (conformité code ↔ spec)

### Correspondance schémas
- [ ] Types TypeScript correspondent aux schémas OpenAPI
- [ ] Validation Zod correspond aux contraintes OpenAPI
- [ ] Réponses de l'API correspondent aux schémas de réponse

### Codes HTTP
- [ ] GET retourne 200 (ou 404 si non trouvé)
- [ ] POST retourne 201 (ou 400 si erreur)
- [ ] PUT retourne 200 (ou 404 si non trouvé)
- [ ] PATCH retourne 200 (ou 404 si non trouvé)
- [ ] DELETE retourne 204 (ou 404 si non trouvé)
- [ ] Erreurs de validation retournent 400
- [ ] Ressource non trouvée retourne 404
- [ ] Erreurs serveur retournent 500

### Format d'erreur
- [ ] Toutes les erreurs suivent le format `ErrorEnvelope`
- [ ] Code d'erreur standardisé (`VALIDATION_ERROR`, `NOT_FOUND`, etc.)
- [ ] Message d'erreur clair et lisible
- [ ] Détails présents pour les erreurs de validation
- [ ] `traceId` présent pour le debugging

### Validation
- [ ] Tous les inputs validés (body, query, params)
- [ ] Messages d'erreur de validation clairs
- [ ] Erreurs retournées au format standardisé

---

## ✅ Bonnes pratiques

### Documentation
- [ ] Descriptions claires et complètes
- [ ] Exemples pour chaque endpoint
- [ ] Exemples pour chaque schéma
- [ ] Instructions d'utilisation (si nécessaire)

### Sécurité
- [ ] Security schemes documentés (même si non implémentés)
- [ ] Endpoints marqués avec `security` si nécessaire
- [ ] `/health` et `/docs` sans authentification

### Performance
- [ ] Pagination implémentée et documentée
- [ ] Filtres documentés et fonctionnels
- [ ] Rate limiting documenté (si implémenté)

---

## ✅ Tests

### Tests manuels dans Swagger UI
- [ ] GET /health : Fonctionne
- [ ] GET /tasks : Retourne la liste
- [ ] GET /tasks avec pagination : Fonctionne
- [ ] GET /tasks avec filtre status : Fonctionne
- [ ] GET /tasks/:id : Retourne la tâche
- [ ] GET /tasks/:id avec ID invalide : Retourne 400
- [ ] GET /tasks/:id avec ID inexistant : Retourne 404
- [ ] POST /tasks : Crée une tâche (201)
- [ ] POST /tasks avec données invalides : Retourne 400
- [ ] PUT /tasks/:id : Met à jour complètement (200)
- [ ] PUT /tasks/:id avec ID inexistant : Retourne 404
- [ ] PATCH /tasks/:id : Met à jour partiellement (200)
- [ ] PATCH /tasks/:id avec ID inexistant : Retourne 404
- [ ] DELETE /tasks/:id : Supprime (204)
- [ ] DELETE /tasks/:id avec ID inexistant : Retourne 404

### Tests avec curl
- [ ] Tous les endpoints testables avec curl
- [ ] Réponses correspondent aux schémas
- [ ] Codes HTTP corrects

---

## ✅ Qualité du code

### Structure
- [ ] Code organisé en modules (routes, services, middlewares)
- [ ] Pas de code dupliqué
- [ ] Séparation des responsabilités

### TypeScript
- [ ] Types stricts (pas de `any`)
- [ ] Interfaces correspondant aux schémas OpenAPI
- [ ] Compilation sans erreur

### Gestion d'erreurs
- [ ] Middleware d'erreur centralisé
- [ ] Format d'erreur standardisé
- [ ] Logging des erreurs (console ou fichier)

---

## 📊 Score de conformité

**Total de points : 100**

- **Structure OpenAPI** : 20 points
- **Définition des endpoints** : 25 points
- **Composants réutilisables** : 15 points
- **Validation et contraintes** : 10 points
- **Swagger UI** : 10 points
- **Implémentation** : 15 points
- **Bonnes pratiques** : 5 points

**Score minimum requis : 80/100**

---

## 🔍 Outils de validation

### Validation du fichier OpenAPI
- [ ] Valider avec [Swagger Editor](https://editor.swagger.io/)
- [ ] Pas d'erreurs de syntaxe YAML
- [ ] Pas d'erreurs de structure OpenAPI

### Validation de l'implémentation
- [ ] Tester tous les endpoints dans Swagger UI
- [ ] Vérifier que les réponses correspondent aux schémas
- [ ] Vérifier les codes HTTP

---

## 📝 Notes

- Cette checklist est exhaustive. Tous les points ne sont pas obligatoires pour un TP, mais ils représentent les bonnes pratiques.
- Les points marqués comme "optionnel" peuvent être ignorés si non pertinents pour votre cas d'usage.
- En cas de doute, privilégier la clarté et la conformité à la spécification OpenAPI.

---

**Date de vérification :** _______________  
**Vérifié par :** _______________  
**Score :** _______ / 100


