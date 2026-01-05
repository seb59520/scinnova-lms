import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createError } from './errorHandler';

/**
 * Middleware de validation avec Zod
 * Valide le body, les query params et les route params
 */
export function validate(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validation du body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validation des query params
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validation des route params
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        const apiError = createError('VALIDATION_ERROR', 'Erreur de validation', details);
        res.status(400).json({ error: apiError });
        return;
      }

      next(error);
    }
  };
}


