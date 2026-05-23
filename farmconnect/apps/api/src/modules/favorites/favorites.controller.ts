import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendSuccess } from '../../core/response';
import { favoritesService } from './favorites.service';
import { ToggleFavoriteProductSchema, ToggleFavoriteProducerSchema } from './favorites.schemas';

function authContext(req: Request) {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function toggleFavoriteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const dto = ToggleFavoriteProductSchema.parse({ productId: req.params.productId });
    const result = await favoritesService.toggleFavoriteProduct(auth.userId, auth.role, dto.productId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function toggleFavoriteProducer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const dto = ToggleFavoriteProducerSchema.parse({ producerId: req.params.producerId });
    const result = await favoritesService.toggleFavoriteProducer(auth.userId, auth.role, dto.producerId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listFavoriteProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const items = await favoritesService.listFavoriteProducts(auth.userId, auth.role);
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

export async function listFavoriteProducers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const items = await favoritesService.listFavoriteProducers(auth.userId, auth.role);
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}
