import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import { setupSwagger } from './docs/swagger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import apiRoutes from './routes/index';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middlewares globaux
app.use(cors()); // Autorise les requêtes cross-origin
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration Swagger UI
setupSwagger(app);

// Routes API
app.use('/api', apiRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Gestion des erreurs (en dernier)
app.use(notFoundHandler);
app.use(errorHandler);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📚 Documentation Swagger UI : http://localhost:${PORT}/docs`);
  console.log(`📄 OpenAPI spec : http://localhost:${PORT}/openapi`);
});

export default app;

