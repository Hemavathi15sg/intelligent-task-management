import type { Request, Response } from 'express';
import { APP_VERSION } from '../../../config/app.constants';
import { successResponse } from '../../../utils/response.util';

/**
 * GET /api/v1/health
 *
 * Returns the server's current liveness status, timestamp, and API version.
 * Used by load balancers, container orchestrators, and monitoring systems.
 *
 * @example Response (200 OK):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "status": "ok",
 *     "timestamp": "2026-03-10T10:00:00.000Z",
 *     "version": "1.0.0"
 *   },
 *   "meta": { "timestamp": "2026-03-10T10:00:00.000Z" }
 * }
 * ```
 */
export function healthCheck(_req: Request, res: Response): void {
  res.status(200).json(
    successResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
    }),
  );
}
