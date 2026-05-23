import type { Role } from '@prisma/client';
import type { SupportedLocale } from '@farmconnect/shared';

/**
 * Extend Express's Request interface so that `req.user` is available after
 * the `authenticate` middleware runs without casting everywhere.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
      locale: SupportedLocale;
    }
  }
}

export {};
