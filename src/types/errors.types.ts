/**
 * Base class for all application errors.
 * Carries an HTTP status code and an `ERR_*` machine code alongside the message.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    // Use new.target.prototype so that subclass instanceof checks work correctly.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 – one or more fields failed schema validation. */
export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('ERR_VALIDATION_FAILED', message, 400, details);
    this.name = 'ValidationError';
  }
}

/** 404 – the requested resource does not exist. */
export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super('ERR_NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

/** 401 – missing or invalid authentication credentials. */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super('ERR_UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

/** 403 – authenticated but not permitted to perform this action. */
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super('ERR_FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

/** 409 – the resource already exists or violates a uniqueness constraint. */
export class ConflictError extends ApiError {
  constructor(message: string, code = 'ERR_CONFLICT') {
    super(code, message, 409);
    this.name = 'ConflictError';
  }
}
