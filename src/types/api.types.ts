/**
 * Standard API response envelope used by ALL endpoints.
 *
 * @template T - Shape of the data payload for success responses
 */
export interface ApiResponse<T = null> {
  /** true on success, false on error */
  success: boolean;

  /** Present only when success = true */
  data?: T;

  /** Present only when success = false */
  error?: {
    /** Machine-readable error code — e.g. ERR_VALIDATION_FAILED */
    code: string;
    /** Human-readable description safe to display in a UI */
    message: string;
    /** Field-level details for validation errors */
    details?: Record<string, unknown>;
  };

  /** Request metadata — always present */
  meta?: {
    /** ISO 8601 server timestamp */
    timestamp: string;
    /** Unique request correlation ID (req_*) */
    requestId?: string;
    /** Request path */
    path?: string;
    /** HTTP method */
    method?: string;
  };
}
