import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { taskService } from '../services/taskService';
import { validate } from '../middlewares/validate';
import { createError } from '../middlewares/errorHandler';
import { TaskStatus } from '../types/task';

const router = Router();

// Schémas de validation Zod
const taskStatusSchema = z.enum(['todo', 'doing', 'done']);

const taskCreateSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
});

const taskUpdateSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').optional(),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
});

const taskParamsSchema = z.object({
  id: z.string().uuid('ID doit être un UUID valide'),
});

const taskQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().positive().max(100).optional()),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().nonnegative().optional()),
  status: taskStatusSchema.optional(),
});

/**
 * GET /health
 * Endpoint de santé de l'API
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /tasks
 * Liste toutes les tâches avec pagination et filtres
 */
router.get(
  '/tasks',
  validate({ query: taskQuerySchema }),
  (req: Request, res: Response) => {
    const { limit, offset, status } = req.query as {
      limit?: number;
      offset?: number;
      status?: TaskStatus;
    };

    const result = taskService.findAll({ limit, offset, status });

    res.json({
      data: result.tasks,
      pagination: {
        total: result.total,
        limit: limit || 10,
        offset: offset || 0,
      },
    });
  }
);

/**
 * GET /tasks/:id
 * Récupère une tâche par son ID
 */
router.get(
  '/tasks/:id',
  validate({ params: taskParamsSchema }),
  (req: Request, res: Response) => {
    const { id } = req.params;

    const task = taskService.findById(id);

    if (!task) {
      const error = createError('NOT_FOUND', `Tâche avec l'ID ${id} non trouvée`);
      res.status(404).json({ error });
      return;
    }

    res.json({ data: task });
  }
);

/**
 * POST /tasks
 * Crée une nouvelle tâche
 */
router.post(
  '/tasks',
  validate({ body: taskCreateSchema }),
  (req: Request, res: Response) => {
    const task = taskService.create(req.body);

    res.status(201).json({ data: task });
  }
);

/**
 * PUT /tasks/:id
 * Met à jour complètement une tâche
 */
router.put(
  '/tasks/:id',
  validate({
    params: taskParamsSchema,
    body: taskCreateSchema, // PUT nécessite tous les champs
  }),
  (req: Request, res: Response) => {
    const { id } = req.params;

    const existingTask = taskService.findById(id);
    if (!existingTask) {
      const error = createError('NOT_FOUND', `Tâche avec l'ID ${id} non trouvée`);
      res.status(404).json({ error });
      return;
    }

    const updated = taskService.update(id, req.body);

    res.json({ data: updated });
  }
);

/**
 * PATCH /tasks/:id
 * Met à jour partiellement une tâche
 */
router.patch(
  '/tasks/:id',
  validate({
    params: taskParamsSchema,
    body: taskUpdateSchema,
  }),
  (req: Request, res: Response) => {
    const { id } = req.params;

    const updated = taskService.patch(id, req.body);

    if (!updated) {
      const error = createError('NOT_FOUND', `Tâche avec l'ID ${id} non trouvée`);
      res.status(404).json({ error });
      return;
    }

    res.json({ data: updated });
  }
);

/**
 * DELETE /tasks/:id
 * Supprime une tâche
 */
router.delete(
  '/tasks/:id',
  validate({ params: taskParamsSchema }),
  (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = taskService.delete(id);

    if (!deleted) {
      const error = createError('NOT_FOUND', `Tâche avec l'ID ${id} non trouvée`);
      res.status(404).json({ error });
      return;
    }

    res.status(204).send();
  }
);

export default router;



