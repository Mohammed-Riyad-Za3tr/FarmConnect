import type { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  const requestId = String(req.headers['x-request-id'] ?? res.locals.requestId ?? '');

  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    requestId,
  });
}
