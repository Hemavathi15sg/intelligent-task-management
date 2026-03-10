import type { ApiResponse } from '../types/api.types';

/**
 * Builds a standard success response envelope.
 *
 * @param data     - The payload to return under `data`
 * @param meta     - Optional overrides merged into the `meta` object
 * @returns A fully-formed {@link ApiResponse} with `success: true`
 *
 * @example
 * ```typescript
 * res.status(200).json(successResponse(user, { requestId: req.id }));
 * ```
 */
export function successResponse<T>(
  data: T,
  meta?: Partial<ApiResponse['meta']>,
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Builds a standard error response envelope.
 *
 * @param code     - Machine-readable error code (e.g. `ERR_NOT_FOUND`)
 * @param message  - Human-readable description safe for the client
 * @param details  - Optional field-level error details (e.g. validation errors)
 * @param meta     - Optional overrides merged into the `meta` object
 * @returns A fully-formed {@link ApiResponse} with `success: false`
 */
export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  meta?: Partial<ApiResponse['meta']>,
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}
