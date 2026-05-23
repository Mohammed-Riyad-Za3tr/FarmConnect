import { Router, type IRouter } from 'express';

import { authWriteRateLimiter, authRefreshRateLimiter } from '../../middleware';
import { authenticate } from '../../middleware/authenticate';
import { register, login, refresh, logout, me } from './auth.controller';

const authRouter: IRouter = Router();

// ── Public endpoints ──────────────────────────────────────────────────────────
authRouter.post('/register', authWriteRateLimiter, register);
authRouter.post('/login', authWriteRateLimiter, login);
authRouter.post('/refresh', authRefreshRateLimiter, refresh);
authRouter.post('/logout', logout);

// ── Protected endpoints ───────────────────────────────────────────────────────
authRouter.get('/me', authenticate, me);

export { authRouter };
