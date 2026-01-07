import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configure Swagger UI pour servir la documentation OpenAPI
 */
export function setupSwagger(app: Express): void {
  // Charger le fichier OpenAPI YAML
  const openApiPath = path.join(__dirname, '../openapi/openapi.yaml');
  const openApiFile = fs.readFileSync(openApiPath, 'utf8');
  const openApiSpec = yaml.load(openApiFile) as Record<string, unknown>;

  // Servir le fichier OpenAPI brut sur /openapi
  app.get('/openapi', (req, res) => {
    res.setHeader('Content-Type', 'application/yaml');
    res.send(openApiFile);
  });

  // Servir le JSON si demandé
  app.get('/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });

  // Configurer Swagger UI sur /docs
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Portal Formations - API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true, // Conserver le token JWT après rafraîchissement
        displayRequestDuration: true, // Afficher la durée des requêtes
        filter: true, // Activer le filtre de recherche
        tryItOutEnabled: true, // Activer "Try it out" par défaut
      },
    })
  );

  console.log('📚 Swagger UI disponible sur http://localhost:3001/docs');
  console.log('📄 OpenAPI spec disponible sur http://localhost:3001/openapi');
}

