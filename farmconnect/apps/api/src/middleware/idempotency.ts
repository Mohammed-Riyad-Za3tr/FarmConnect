import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../core/errors';

const IDEMPOTENCY_HEADER = 'x-idempotency-key';
const IDEMPOTENCY_STATUS_HEADER = 'x-idempotency-status';
const DEFAULT_TTL_MS = 10 * 60 * 1000;

type CachedResponse = {
  statusCode: number;
  body: unknown;
  contentType: string | null;
  createdAt: number;
};

type PendingEntry = {
  promise: Promise<CachedResponse>;
  resolve: (value: CachedResponse) => void;
  reject: (reason?: unknown) => void;
};

const responseCache = new Map<string, CachedResponse>();
const inFlight = new Map<string, PendingEntry>();

function makePendingEntry(): PendingEntry {
  let resolve!: (value: CachedResponse) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<CachedResponse>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function cacheKey(req: Request, key: string): string {
  const userScope = req.user?.id ?? 'anonymous';
  return `${req.method}:${req.originalUrl}:${userScope}:${key}`;
}

function readIdempotencyKey(req: Request): string | null {
  const raw = req.headers[IDEMPOTENCY_HEADER];
  const key = Array.isArray(raw) ? raw[0] : raw;
  if (!key) return null;

  const trimmed = key.trim();
  if (!trimmed) return null;
  if (trimmed.length > 128) {
    throw new BadRequestError('X-Idempotency-Key must be 1-128 characters long');
  }
  if (!/^[A-Za-z0-9:_-]+$/.test(trimmed)) {
    throw new BadRequestError('X-Idempotency-Key contains unsupported characters');
  }

  return trimmed;
}

function replayCachedResponse(res: Response, record: CachedResponse): void {
  res.setHeader(IDEMPOTENCY_STATUS_HEADER, 'replayed');
  if (record.contentType) {
    res.type(record.contentType);
  }
  res.status(record.statusCode).json(record.body);
}

function shouldCacheStatus(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 500;
}

function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.createdAt > DEFAULT_TTL_MS) {
      responseCache.delete(key);
    }
  }
}

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idempotencyKey = readIdempotencyKey(req);
    if (!idempotencyKey) {
      return next();
    }

    cleanupExpiredCache();

    const key = cacheKey(req, idempotencyKey);
    const cached = responseCache.get(key);

    if (cached) {
      replayCachedResponse(res, cached);
      return;
    }

    const pending = inFlight.get(key);
    if (pending) {
      try {
        const settled = await pending.promise;
        replayCachedResponse(res, settled);
      } catch {
        next(new BadRequestError('Duplicate in-flight request failed; retry with a new idempotency key'));
      }
      return;
    }

    const entry = makePendingEntry();
    inFlight.set(key, entry);

    const originalJson = res.json.bind(res);

    res.json = ((body: unknown) => {
      const statusCode = res.statusCode;
      const contentType = typeof res.getHeader('content-type') === 'string'
        ? String(res.getHeader('content-type'))
        : 'application/json';

      if (shouldCacheStatus(statusCode)) {
        const snapshot: CachedResponse = {
          statusCode,
          body,
          contentType,
          createdAt: Date.now(),
        };

        responseCache.set(key, snapshot);
        entry.resolve(snapshot);
      } else {
        entry.reject(new Error(`Uncacheable status ${statusCode}`));
      }

      inFlight.delete(key);
      res.setHeader(IDEMPOTENCY_STATUS_HEADER, 'stored');
      return originalJson(body);
    }) as typeof res.json;

    next();
  } catch (err) {
    next(err);
  }
}
