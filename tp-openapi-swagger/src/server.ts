import express, { Express } from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/rateLimit';
import { setupSwagger } from './docs/swagger';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middlewares globaux
app.use(cors()); // Autorise les requêtes cross-origin
app.use(express.json()); // Parse le body JSON
app.use(express.urlencoded({ extended: true })); // Parse les formulaires

// Rate limiting (appliqué à toutes les routes sauf /health et /docs)
app.use((req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/docs') || req.path.startsWith('/openapi')) {
    return next();
  }
  return apiRateLimiter(req, res, next);
});

// Configuration Swagger UI
setupSwagger(app);

// Routes
app.use('/', tasksRouter);

// Gestion des erreurs (doit être après toutes les routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📚 Documentation Swagger UI : http://localhost:${PORT}/docs`);
  console.log(`📄 OpenAPI spec : http://localhost:${PORT}/openapi`);
});

export default app;


