import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/errors.types';
import { createLogger } from '../utils/logger.util';

const logger = createLogger('error-middleware');

/**
 * Centralized Express error handler.
 *
 * - Maps {@link ApiError} subclasses to their HTTP status codes.
 * - Returns the standard `{ success, error, meta }` envelope.
 * - Hides internal error details in production.
 *
 * Must be the LAST middleware registered in `app.ts`.
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const requestId = req.id ?? 'unknown';

  logger.error('Unhandled error', {
    code: (error as ApiError).code ?? 'ERR_INTERNAL_SERVER_ERROR',
    message: error.message,
    requestId,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
  });

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined && { details: error.details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        path: req.path,
        method: req.method,
      },
    });
    return;
  }

  // Unknown / unexpected errors — never leak internals in production
  res.status(500).json({
    success: false,
    error: {
      code: 'ERR_INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      path: req.path,
      method: req.method,
    },
  });
}
