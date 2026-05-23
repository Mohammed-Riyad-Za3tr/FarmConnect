import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendCreated, sendSuccess } from '../../core/response';
import {
  CreateProductLogSchema,
  CreateProductSchema,
  ListOwnProductsQuerySchema,
  ListPublicProductsQuerySchema,
  UpdateProductSchema,
} from './product.schemas';
import { productService } from './product.service';

function authContext(req: Request) {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function createOwnProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const dto = CreateProductSchema.parse(req.body);
    const product = await productService.createOwnProduct(auth.userId, auth.role, dto);
    sendCreated(res, { product }, 'Product created');
  } catch (err) {
    next(err);
  }
}

export async function listOwnProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const query = ListOwnProductsQuerySchema.parse(req.query);
    const data = await productService.listOwnProducts(auth.userId, auth.role, query);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getOwnProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const productId = String(req.params.productId ?? '');
    const product = await productService.getOwnProductById(auth.userId, auth.role, productId);
    sendSuccess(res, { product });
  } catch (err) {
    next(err);
  }
}

export async function updateOwnProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const productId = String(req.params.productId ?? '');
    const dto = UpdateProductSchema.parse(req.body);
    const product = await productService.updateOwnProduct(auth.userId, auth.role, productId, dto);
    sendSuccess(res, { product }, { message: 'Product updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteOwnProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const productId = String(req.params.productId ?? '');
    const product = await productService.deleteOwnProduct(auth.userId, auth.role, productId);
    sendSuccess(res, { product }, { message: 'Product archived' });
  } catch (err) {
    next(err);
  }
}

export async function listPublicProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = ListPublicProductsQuerySchema.parse(req.query);
    const data = await productService.listPublicProducts(query, req.user);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await productService.listCategories();
    sendSuccess(res, { categories });
  } catch (err) {
    next(err);
  }
}

export async function getPublicProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slug = String(req.params.slug ?? '');
    const product = await productService.getPublicProductBySlug(slug, req.user);
    sendSuccess(res, { product });
  } catch (err) {
    next(err);
  }
}

export async function listOwnProductLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const productId = String(req.params.productId ?? '');
    const logs = await productService.listOwnProductLogs(auth.userId, auth.role, productId);
    sendSuccess(res, { logs });
  } catch (err) {
    next(err);
  }
}

export async function createOwnProductLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const productId = String(req.params.productId ?? '');
    const dto = CreateProductLogSchema.parse(req.body);
    const log = await productService.createOwnProductLog(auth.userId, auth.role, productId, dto);
    sendCreated(res, { log }, 'Product log created');
  } catch (err) {
    next(err);
  }
}
