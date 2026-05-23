import type { Role } from '@prisma/client';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

import { ForbiddenError, UnauthorizedError } from '../core/errors';

/**
 * `authorize(...roles)` — RBAC middleware factory.
 *
 * Must be used AFTER `authenticate`.
 * Rejects with 403 if the authenticated user's role is not in the allowed list.
 *
 * Usage:
 *   router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser);
 *   router.post('/products', authenticate, authorize('PRODUCER', 'ADMIN'), createProduct);
 */
export function authorize(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Required role: ${roles.join(' or ')}`,
        ),
      );
    }

    next();
  };
}
