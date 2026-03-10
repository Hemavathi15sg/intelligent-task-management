import dotenv from 'dotenv';
import path from 'path';

// Load .env from the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

/**
 * Typed, validated environment configuration.
 * Loaded once at startup — import `env` wherever configuration is needed.
 */
export const env = {
  NODE_ENV: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  PORT: parseInt(optionalEnv('PORT', '3000'), 10),
  API_VERSION: optionalEnv('API_VERSION', 'v1'),

  // JWT — secret MUST be overridden via environment in non-development environments
  JWT_SECRET: optionalEnv('JWT_SECRET', 'change-me-to-a-random-256-bit-secret'),
  JWT_EXPIRES_IN: parseInt(optionalEnv('JWT_EXPIRES_IN', '3600'), 10),
  JWT_REFRESH_EXPIRES_IN: parseInt(optionalEnv('JWT_REFRESH_EXPIRES_IN', '604800'), 10),

  // PostgreSQL (used in Phase 2 — not active in Phase 1)
  DB_HOST: optionalEnv('DB_HOST', 'localhost'),
  DB_PORT: parseInt(optionalEnv('DB_PORT', '5432'), 10),
  DB_NAME: optionalEnv('DB_NAME', 'itms_db'),
  DB_USER: optionalEnv('DB_USER', 'itms_user'),
  DB_PASSWORD: optionalEnv('DB_PASSWORD', ''),

  // Redis (used in Phase 2 — not active in Phase 1)
  REDIS_HOST: optionalEnv('REDIS_HOST', 'localhost'),
  REDIS_PORT: parseInt(optionalEnv('REDIS_PORT', '6379'), 10),
  REDIS_PASSWORD: optionalEnv('REDIS_PASSWORD', ''),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(optionalEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),

  // Logging
  LOG_LEVEL: optionalEnv('LOG_LEVEL', 'info'),

  // CORS — comma-separated list of allowed origins
  ALLOWED_ORIGINS: optionalEnv('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),

  // Optional external services
  SENTRY_DSN: optionalEnv('SENTRY_DSN', ''),
} as const;
