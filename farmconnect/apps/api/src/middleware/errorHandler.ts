import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { config } from '../config';
import { AppError } from '../core/errors';
import { logger } from '../core/logger';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = String(req.headers['x-request-id'] ?? res.locals.requestId ?? '');

  if (err instanceof Error && err.message === 'Malformed JSON request body') {
    res.status(400).json({
      success: false,
      code: 'BAD_REQUEST',
      message: 'Malformed JSON request body',
      requestId,
    });
    return;
  }

  // ── Zod validation errors ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
      requestId,
    });
    return;
  }

  // ── Known operational errors ───────────────────────────────────────────────
  if (err instanceof AppError) {
    if (!err.isOperational || err.statusCode >= 500) {
      logger.error({ err, requestId }, 'Operational error');
    }

    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      requestId,
      ...(err.details !== undefined && config.NODE_ENV !== 'production'
        ? { details: err.details }
        : {}),
    });
    return;
  }

  // ── Unknown / programming errors ───────────────────────────────────────────
  logger.error({ err, requestId }, 'Unhandled error');

  res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    requestId,
    ...(config.NODE_ENV === 'development'
      ? { details: err instanceof Error ? err.message : String(err) }
      : {}),
  });
};
