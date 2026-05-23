import rateLimit from 'express-rate-limit';

import { config } from '../config';

/**
 * Default rate limiter: 100 requests per 15 minutes per IP.
 * Applied globally in app.ts. Specific routes can apply stricter limiters.
 */
export const defaultRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'test' ? 10_000 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
  skip: () => config.NODE_ENV === 'test',
});

/**
 * Stricter limiter for authentication writes: login/register.
 * Uses a lower cap to protect against brute-force attempts.
 */
export const authWriteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'test' ? 10_000 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later',
  },
  skip: () => config.NODE_ENV === 'test',
});

/**
 * Relaxed limiter for token refresh.
 * Refresh can be called automatically by the frontend and should not lock users out quickly.
 */
export const authRefreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'test' ? 10_000 : 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many refresh attempts, please try again later',
  },
  skip: () => config.NODE_ENV === 'test',
});

export const reportWriteRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: config.NODE_ENV === 'test' ? 10_000 : 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many report submissions, please try again later',
  },
  skip: () => config.NODE_ENV === 'test',
});
