import type { Request, Response, NextFunction } from 'express';

import { UnauthorizedError } from '../core/errors';
import { verifyAccessToken } from '../modules/auth/auth.service';

/**
 * `authenticate` — required auth middleware.
 *
 * Reads the Bearer token from the Authorization header, verifies it, and
 * attaches the decoded payload to `req.user`. Throws 401 if missing/invalid.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No access token provided'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role as any };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * `optionalAuthenticate` — graceful auth middleware.
 *
 * Same as `authenticate` but does NOT reject unauthenticated requests.
 * Useful for public endpoints that behave differently for logged-in users.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role as any };
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
}
