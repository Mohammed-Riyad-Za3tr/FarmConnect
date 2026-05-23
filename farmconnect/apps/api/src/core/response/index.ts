import type { PaginationMeta } from '@farmconnect/shared';
import type { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: { message?: string; statusCode?: number; meta?: PaginationMeta },
): void {
  res.status(options?.statusCode ?? 200).json({
    success: true,
    data,
    ...(options?.message ? { message: options.message } : {}),
    ...(options?.meta ? { meta: options.meta } : {}),
  });
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, { statusCode: 201, message });
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}
