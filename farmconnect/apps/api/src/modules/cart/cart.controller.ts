import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendSuccess } from '../../core/response';
import { AddCartItemSchema, UpdateCartItemSchema } from './cart.schemas';
import { cartService } from './cart.service';

function authContext(req: Request) {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const cart = await cartService.getCart(auth.userId, auth.role);
    sendSuccess(res, { cart });
  } catch (err) {
    next(err);
  }
}

export async function addCartItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const dto = AddCartItemSchema.parse(req.body);
    const cart = await cartService.addItem(auth.userId, auth.role, dto);
    sendSuccess(res, { cart }, { message: 'Item added to cart' });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const productId = String(req.params.productId ?? '');
    const dto = UpdateCartItemSchema.parse(req.body);
    const cart = await cartService.updateItemQuantity(auth.userId, auth.role, productId, dto);
    sendSuccess(res, { cart }, { message: 'Cart item updated' });
  } catch (err) {
    next(err);
  }
}

export async function removeCartItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const productId = String(req.params.productId ?? '');
    const cart = await cartService.removeItem(auth.userId, auth.role, productId);
    sendSuccess(res, { cart }, { message: 'Cart item removed' });
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const cart = await cartService.clearCart(auth.userId, auth.role);
    sendSuccess(res, { cart }, { message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
}
