import { Router, Request, Response } from 'express';
import coursesRouter from './courses';

const router = Router();

/**
 * GET /api
 * Point d'entrée de l'API
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API Portal Formations',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      docs: '/docs',
      openapi: '/openapi',
      courses: '/courses',
    },
  });
});

// Routes pour les cours
router.use('/courses', coursesRouter);

// Routes pour les analyses de cas d'usage
import useCaseAnalysesRouter from './useCaseAnalyses';
router.use('/use-case-analyses', useCaseAnalysesRouter);

export default router;

