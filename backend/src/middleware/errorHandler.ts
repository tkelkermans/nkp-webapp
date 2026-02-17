import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, type ApiResponse } from '../types/index.js';
import { config } from '../utils/config.js';
import logger from '../utils/logger.js';

/**
 * Middleware de gestion globale des erreurs
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  logger.error({ err }, 'Request error');

  // Erreur de validation Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      message: err.errors.map((e) => e.message).join(', '),
    });
    return;
  }

  // Erreur applicative personnalisée
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Erreur Redis
  if (err.name === 'ReplyError' || err.message.includes('Redis')) {
    res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      message: config.nodeEnv === 'development' ? err.message : undefined,
    });
    return;
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
}

/**
 * Middleware pour les routes non trouvées
 */
export function notFoundHandler(
  _req: Request,
  res: Response<ApiResponse>
): void {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
}

/**
 * Wrapper async pour les handlers Express
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
