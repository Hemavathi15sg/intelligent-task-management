import winston from 'winston';

// Read log level directly from process.env to avoid circular import with env.config.ts
const logLevel = process.env.LOG_LEVEL ?? 'info';
const isProduction = process.env.NODE_ENV === 'production';

const { combine, timestamp, json, colorize, simple } = winston.format;

const winstonLogger = winston.createLogger({
  level: logLevel,
  format: isProduction ? combine(timestamp(), json()) : combine(colorize(), timestamp(), simple()),
  transports: [new winston.transports.Console()],
});

/** Contextual fields attached to every structured log entry. */
export interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  [key: string]: unknown;
}

/**
 * Module-scoped structured logger backed by Winston.
 *
 * @example
 * ```typescript
 * const logger = createLogger('user.service');
 * logger.info('User created', { userId: user.id, operation: 'user.create' });
 * ```
 */
export class Logger {
  constructor(private readonly module: string) {}

  private buildMeta(context?: LogContext): Record<string, unknown> {
    return { module: this.module, ...context };
  }

  info(message: string, context?: LogContext): void {
    winstonLogger.info(message, this.buildMeta(context));
  }

  warn(message: string, context?: LogContext): void {
    winstonLogger.warn(message, this.buildMeta(context));
  }

  error(message: string, context?: LogContext): void {
    winstonLogger.error(message, this.buildMeta(context));
  }

  debug(message: string, context?: LogContext): void {
    winstonLogger.debug(message, this.buildMeta(context));
  }
}

/**
 * Factory — creates a logger scoped to the given module name.
 *
 * @param module - Typically the file/class name (e.g. `'user.service'`)
 */
export function createLogger(module: string): Logger {
  return new Logger(module);
}
