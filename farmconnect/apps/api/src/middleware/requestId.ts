import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';
const VALID_REQUEST_ID = /^[a-zA-Z0-9._:-]{8,128}$/;

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers[REQUEST_ID_HEADER];
  const received = (Array.isArray(existingId) ? existingId[0] : existingId)?.trim();
  const requestId = received && VALID_REQUEST_ID.test(received) ? received : uuidv4();

  req.headers[REQUEST_ID_HEADER] = requestId;
  res.locals.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
