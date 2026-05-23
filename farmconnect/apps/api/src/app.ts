import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { config } from './config';
import { apiV1Router } from './config/routes';
import { stripeWebhookRouter } from './modules/payments/payments.webhook.router';
import {
  requestIdMiddleware,
  localeMiddleware,
  httpLogger,
  defaultRateLimiter,
  notFoundHandler,
  errorHandler,
} from './middleware';

const app: Application = express();

// ── Trust proxy (needed on Render / Railway / AWS ALB) ────────────────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. same-origin, curl, mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [config.CLIENT_URL];
      const isAllowedConfiguredOrigin = allowedOrigins.includes(origin);

      // In local development, Vite may pick different ports (5173/5174/5175...)
      const isAllowedLocalDevOrigin =
        config.NODE_ENV === 'development' &&
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

      if (isAllowedConfiguredOrigin || isAllowedLocalDevOrigin) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Idempotency-Key', 'X-Locale', 'Accept-Language'],
    exposedHeaders: ['X-Request-ID', 'Content-Language', 'X-Idempotency-Status'],
    maxAge: 600,
  }),
);

// ── Core request middleware ───────────────────────────────────────────────────
app.use(requestIdMiddleware);
app.use(localeMiddleware);
app.use(httpLogger);
app.use(compression());
app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRouter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

app.use((err: unknown, _req: express.Request, _res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && err && 'body' in (err as unknown as { body?: unknown })) {
    return next(new Error('Malformed JSON request body'));
  }
  return next(err);
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(defaultRateLimiter);

// ── Root info routes ──────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'FarmConnect API',
      status: 'ok',
      health: '/api/health',
      version: 'v1',
    },
    message: 'FarmConnect backend is running',
  });
});

app.get('/api', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'FarmConnect API base',
      health: '/api/health',
      auth: '/api/auth',
      profile: '/api/profile',
      products: '/api/products',
      payments: '/api/payments',
      notifications: '/api/notifications',
      delivery: '/api/delivery',
    },
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', apiV1Router);
app.use('/api/v1', apiV1Router);

// ── 404 and error handlers (must be last) ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
