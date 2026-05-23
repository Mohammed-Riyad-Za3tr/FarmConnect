import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendCreated, sendSuccess } from '../../core/response';
import {
  CheckoutSchema,
  ListOrdersQuerySchema,
  TransitionOrderStatusSchema,
  VerifyDeliveryTokenSchema,
} from './orders.schemas';
import { ordersService } from './orders.service';

function authContext(req: Request) {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function checkoutFromCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const dto = CheckoutSchema.parse(req.body ?? {});
    const order = await ordersService.checkout(auth.userId, auth.role, dto);
    sendCreated(res, { order }, 'Order created from cart');
  } catch (err) {
    next(err);
  }
}

export async function listBuyerOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const query = ListOrdersQuerySchema.parse(req.query);
    const data = await ordersService.listBuyerOrders(auth.userId, auth.role, query);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getBuyerOrderDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const orderId = String(req.params.orderId ?? '');
    const order = await ordersService.getBuyerOrderDetail(auth.userId, auth.role, orderId);
    sendSuccess(res, { order });
  } catch (err) {
    next(err);
  }
}

export async function listProducerOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const query = ListOrdersQuerySchema.parse(req.query);
    const data = await ordersService.listProducerOrders(auth.userId, auth.role, query);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getProducerOrderDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const orderId = String(req.params.orderId ?? '');
    const order = await ordersService.getProducerOrderDetail(auth.userId, auth.role, orderId);
    sendSuccess(res, { order });
  } catch (err) {
    next(err);
  }
}

export async function transitionProducerOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = authContext(req);
    const orderId = String(req.params.orderId ?? '');
    const dto = TransitionOrderStatusSchema.parse(req.body);
    const order = await ordersService.transitionProducerOrderStatus(auth.userId, auth.role, orderId, dto);
    sendSuccess(res, { order }, { message: 'Order status updated' });
  } catch (err) {
    next(err);
  }
}

export async function generateDeliveryVerificationToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = authContext(req);
    const orderId = String(req.params.orderId ?? '');
    const order = await ordersService.generateDeliveryVerificationToken(auth.userId, auth.role, orderId, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
    sendSuccess(res, { order }, { message: 'Delivery verification token generated' });
  } catch (err) {
    next(err);
  }
}

export async function verifyDeliveryToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const dto = VerifyDeliveryTokenSchema.parse(req.body);
    const order = await ordersService.verifyDeliveryToken(auth.userId, auth.role, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
    sendSuccess(res, { order }, { message: 'Delivery handoff verified' });
  } catch (err) {
    next(err);
  }
}
