import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.config';
import { loggingMiddleware } from './middleware/logging.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { apiV1Router } from './api/v1/routes';

// Side-effect: loads the Express type augmentation (req.id, req.logger, req.user)
import './types/express.types';

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ── Rate limiting ───────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'ERR_RATE_LIMIT_EXCEEDED',
        message: 'Too many requests — please try again later.',
      },
    },
  }),
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request logging + correlation ID ─────────────────────────────────────────
app.use(loggingMiddleware);

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', apiV1Router);

// ── Centralised error handler (must be last) ──────────────────────────────────
app.use(errorMiddleware);

export { app };
