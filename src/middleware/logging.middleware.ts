import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.util';

/**
 * Attaches a unique correlation ID (`req.id`) and a scoped logger (`req.logger`)
 * to every incoming request, then emits a structured "Incoming request" log entry.
 *
 * Must be registered BEFORE route handlers in `app.ts`.
 */
export function loggingMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.id = `req_${randomUUID().replace(/-/g, '')}`;
  req.logger = createLogger(req.path);

  req.logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent'),
  });

  next();
}
