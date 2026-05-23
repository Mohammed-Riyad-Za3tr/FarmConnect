import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendCreated, sendSuccess } from '../../core/response';
import { CreateProductImageSchema, UpdateProductImageSchema } from './product-image.schemas';
import { productImageService } from './product-image.service';

function authContext(req: Request) {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }
  return { userId: req.user.id, role: req.user.role };
}

function routeIds(req: Request) {
  return {
    productId: String(req.params.productId ?? ''),
    imageId: String(req.params.imageId ?? ''),
  };
}

export async function addProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const ids = routeIds(req);
    const dto = CreateProductImageSchema.parse(req.body);
    const image = await productImageService.addImageToOwnProduct(
      auth.userId,
      auth.role,
      ids.productId,
      dto,
    );
    sendCreated(res, { image }, 'Product image added');
  } catch (err) {
    next(err);
  }
}

export async function listProductImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const ids = routeIds(req);
    const images = await productImageService.listImagesForOwnProduct(auth.userId, auth.role, ids.productId);
    sendSuccess(res, { images });
  } catch (err) {
    next(err);
  }
}

export async function updateProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const ids = routeIds(req);
    const dto = UpdateProductImageSchema.parse(req.body);
    const image = await productImageService.updateImageForOwnProduct(
      auth.userId,
      auth.role,
      ids.productId,
      ids.imageId,
      dto,
    );
    sendSuccess(res, { image }, { message: 'Product image updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const ids = routeIds(req);
    const image = await productImageService.deleteImageForOwnProduct(
      auth.userId,
      auth.role,
      ids.productId,
      ids.imageId,
    );
    sendSuccess(res, { image }, { message: 'Product image deleted' });
  } catch (err) {
    next(err);
  }
}
