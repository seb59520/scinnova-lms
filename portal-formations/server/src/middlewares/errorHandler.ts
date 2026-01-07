import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Crée une erreur standardisée
 */
export function createError(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: unknown
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

/**
 * Middleware pour gérer les routes non trouvées
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = createError(
    'NOT_FOUND',
    `Route ${req.method} ${req.path} non trouvée`,
    404
  );
  next(error);
}

/**
 * Middleware global de gestion des erreurs
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Une erreur interne est survenue';

  // Log de l'erreur (en production, utiliser un logger approprié)
  console.error(`[${code}] ${message}`, {
    path: req.path,
    method: req.method,
    statusCode,
    details: err.details,
  });

  // Réponse standardisée
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        path: req.path,
        method: req.method,
      }),
    },
  });
}

