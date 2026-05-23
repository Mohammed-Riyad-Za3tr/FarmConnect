import pinoHttp from 'pino-http';
import type { Request } from 'express';

import { logger } from '../core/logger';

export const httpLogger = pinoHttp({
  logger,
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,
  customProps: (req) => {
    const expressReq = req as Request;
    return {
      requestId: req.headers['x-request-id'],
      userId: expressReq.user?.id,
      role: expressReq.user?.role,
      locale: expressReq.locale,
      idempotencyKey: req.headers['x-idempotency-key'],
    };
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["stripe-signature"]'],
    censor: '[REDACTED]',
  },
  // Don't log health checks to reduce noise
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
});
