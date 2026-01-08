import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  traceId?: string;
}

export interface ErrorResponse {
  error: ApiError;
}

/**
 * Middleware de gestion centralisée des erreurs
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const traceId = uuidv4();

  // Si c'est déjà une ApiError formatée
  if ('code' in err && 'message' in err) {
    const apiError: ApiError = {
      code: err.code,
      message: err.message,
      details: err.details,
      traceId,
    };

    const statusCode = getStatusCode(err.code);
    res.status(statusCode).json({ error: apiError });
    return;
  }

  // Erreur générique
  const apiError: ApiError = {
    code: 'INTERNAL_ERROR',
    message: err.message || 'Une erreur interne est survenue',
    traceId,
  };

  console.error(`[${traceId}] Error:`, err);
  res.status(500).json({ error: apiError });
}

/**
 * Crée une erreur API standardisée
 */
export function createError(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  return {
    code,
    message,
    details,
  };
}

/**
 * Détermine le code HTTP à partir du code d'erreur
 */
function getStatusCode(code: string): number {
  const statusMap: Record<string, number> = {
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    RATE_LIMIT_EXCEEDED: 429,
    INTERNAL_ERROR: 500,
  };

  return statusMap[code] || 500;
}

/**
 * Middleware pour les routes non trouvées
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} non trouvée`,
      traceId: uuidv4(),
    },
  };

  res.status(404).json(error);
}



